import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowRight,
  Calendar,
  CheckCircle2,
  FileUp,
  RotateCcw,
  Trophy,
  Upload,
} from 'lucide-react';
import {
  Card,
  Kicker,
  PageTitle,
  Pill,
  SectionTitle,
  Skeleton,
} from '@/components/ui';
import { AiCursor } from '@/components/ai';
import { claudeCompletion, extractStructured } from '@/lib/claude';
import { withCacheFallback } from '@/lib/demoMode';
import {
  COMPARADOR_SYSTEM,
  buildComparisonPrompt,
  getBankOffer,
} from '@/lib/prompts/comparador';
import { calculateMonthlyPaymentCLP, formatCLP, formatPct, formatUF } from '@/lib/format';
import { cn } from '@/lib/cn';
import { useAppStore } from '@/store/appStore';
import type {
  ComparisonAnalysis,
  ComparisonWinner,
  MortgageOffer,
} from '@/types';
import { BRAND } from '@/lib/brand';

type Phase = 'upload' | 'analyzing' | 'result';

interface SlotState {
  uploaded: boolean;
  filename: string;
}

// ─────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────

export default function Comparador() {
  const [phase, setPhase] = useState<Phase>('upload');
  const [comp1, setComp1] = useState<SlotState>({ uploaded: false, filename: '' });
  const [comp2, setComp2] = useState<SlotState>({ uploaded: false, filename: '' });
  const [analysis, setAnalysis] = useState<ComparisonAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);

  const propertyInput = useAppStore((s) => s.propertyInput);

  const propio = useMemo(() => {
    if (!propertyInput) return getBankOffer();
    // Calculate monthly payment for the client`s actual amount and ${BRAND.shortName}`s default rate/term
    const termYears = 25;
    const rate = 4.65;
    const monthly = calculateMonthlyPaymentCLP(
      propertyInput.loanAmountUF,
      rate,
      termYears,
    );
    return getBankOffer({
      amountUF: propertyInput.loanAmountUF,
      termYears,
      monthlyPaymentCLP: monthly,
    });
  }, [propertyInput]);
  const canAnalyze = comp1.uploaded; // mínimo 1 competidor para activar

  async function runAnalysis() {
    setPhase('analyzing');
    setError(null);
    const expectedSlots = 1 + (comp1.uploaded ? 1 : 0) + (comp2.uploaded ? 1 : 0);
    try {
      let parsed: ComparisonAnalysis | null = null;
      const prompt = buildComparisonPrompt({
        bankOffer: propio,
        competitor1Uploaded: comp1.uploaded,
        competitor2Uploaded: comp2.uploaded,
      });
      // First attempt
      let response = await withCacheFallback(
        () =>
          claudeCompletion(
            [{ role: 'user', content: prompt }],
            COMPARADOR_SYSTEM,
            { maxTokens: 1800, temperature: 0.8 },
          ),
        { cacheKey: 'comparador_propio_gana', timeoutMs: 6000 },
      );
      parsed = extractStructured<ComparisonAnalysis>(response);

      // Defensive: if model returned fewer offers than expected, retry once
      // with lower temperature and the missing-offer issue spelled out
      if (parsed.offers.length < expectedSlots) {
        console.warn(
          `Comparator returned ${parsed.offers.length} offers but expected ${expectedSlots}. Retrying with stricter prompt.`,
        );
        const retryPrompt =
          prompt +
          `\n\nERROR DETECTADO EN INTENTO ANTERIOR: solo devolviste ${parsed.offers.length} ofertas en el array "offers", pero se pidieron ${expectedSlots}. Genera de nuevo con EXACTAMENTE ${expectedSlots} elementos.`;
        response = await claudeCompletion(
          [{ role: 'user', content: retryPrompt }],
          COMPARADOR_SYSTEM,
          { maxTokens: 1800, temperature: 0.3 },
        );
        parsed = extractStructured<ComparisonAnalysis>(response);
      }

      // Force propio offer to match our fixed data (Claude might tweak slightly)
      const offers = parsed.offers.map((o) =>
        o.id === 'banco' ? propio : o,
      );
      setAnalysis({ ...parsed, offers });
      setPhase('result');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error inesperado');
      setPhase('upload');
    }
  }

  function reset() {
    setComp1({ uploaded: false, filename: '' });
    setComp2({ uploaded: false, filename: '' });
    setAnalysis(null);
    setError(null);
    setPhase('upload');
  }

  return (
    <div className="max-w-shell mx-auto px-6 md:px-10 lg:px-16 py-12 lg:py-16">
      <Header />

      <div className="mt-12">
        {phase === 'upload' && (
          <UploadView
            propio={propio}
            comp1={comp1}
            comp2={comp2}
            onComp1Change={setComp1}
            onComp2Change={setComp2}
            canAnalyze={canAnalyze}
            onAnalyze={runAnalysis}
            error={error}
          />
        )}

        {phase === 'analyzing' && <AnalyzingView />}

        {phase === 'result' && analysis && (
          <ResultView analysis={analysis} onReset={reset} />
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Header
// ─────────────────────────────────────────────────────────────

function Header() {
  return (
    <header className="max-w-3xl">
      <div className="inline-flex items-center gap-3">
        <span aria-hidden className="w-1.5 h-1.5 rounded-full bg-accent" />
        <Kicker tone="accent">Transparencia radical</Kicker>
      </div>
      <PageTitle size="display-lg" className="mt-4">
        Compara nuestra oferta con la competencia. Honestamente.
      </PageTitle>
      <p className="text-body-lg text-text-secondary mt-4 max-w-measure">
        Sube las ofertas que tengas de otros bancos y te ayudamos a entender cuál
        es mejor para ti. Si la nuestra no gana, te lo decimos.
      </p>
      <span aria-hidden className="block w-12 h-px bg-border-hairline mt-10" />
    </header>
  );
}

// ─────────────────────────────────────────────────────────────
// Upload view
// ─────────────────────────────────────────────────────────────

function UploadView({
  propio,
  comp1,
  comp2,
  onComp1Change,
  onComp2Change,
  canAnalyze,
  onAnalyze,
  error,
}: {
  propio: MortgageOffer;
  comp1: SlotState;
  comp2: SlotState;
  onComp1Change: (s: SlotState) => void;
  onComp2Change: (s: SlotState) => void;
  canAnalyze: boolean;
  onAnalyze: () => void;
  error: string | null;
}) {
  return (
    <div className="space-y-10">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <BankSlot offer={propio} />
        <CompetitorSlot
          label="Competidor 1"
          slotKey="comp1"
          state={comp1}
          onChange={onComp1Change}
          required
        />
        <CompetitorSlot
          label="Competidor 2"
          slotKey="comp2"
          state={comp2}
          onChange={onComp2Change}
        />
      </div>

      <div className="pt-6 border-t border-border-hairline flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <p className="text-body-sm text-text-secondary max-w-measure">
          Tu oferta de {BRAND.shortName} ya está cargada. Súbenos al menos una oferta de
          competidor y comparamos.
        </p>
        <button
          type="button"
          onClick={onAnalyze}
          disabled={!canAnalyze}
          className={cn(
            'inline-flex items-center justify-center gap-2 px-7 py-3.5 text-body-lg font-medium shrink-0',
            'bg-accent text-text-inverse',
            'hover:bg-accent-muted transition-colors duration-base ease-out-soft',
            'disabled:opacity-40 disabled:cursor-not-allowed',
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:ring-offset-2 focus-visible:ring-offset-bg-page',
          )}
        >
          Comparar ofertas
          <ArrowRight size={16} />
        </button>
      </div>

      {error && (
        <p className="text-body-sm text-status-error">
          No pudimos completar el análisis: {error}
        </p>
      )}
    </div>
  );
}

function BankSlot({ offer }: { offer: MortgageOffer }) {
  return (
    <Card padding="lg" className="space-y-5 relative">
      <div className="flex items-start justify-between gap-3">
        <Kicker tone="muted">Tu oferta</Kicker>
        <Pill variant="info" size="sm">
          Pre-cargada
        </Pill>
      </div>

      <div>
        <div className="text-h3 text-text-primary">{offer.bank}</div>
        <div className="text-caption text-text-muted mt-1">Caso #HIP-2026-0042</div>
      </div>

      <dl className="space-y-3 text-body-sm pt-2 border-t border-border-hairline">
        <SlotRow label="Monto" value={formatUF(offer.amountUF)} />
        <SlotRow label="Tasa nominal" value={formatPct(offer.nominalRate)} />
        <SlotRow label="CAE" value={formatPct(offer.caeRate)} />
        <SlotRow label="Plazo" value={`${offer.termYears} años`} />
      </dl>
    </Card>
  );
}

function CompetitorSlot({
  label,
  slotKey,
  state,
  onChange,
  required,
}: {
  label: string;
  slotKey: string;
  state: SlotState;
  onChange: (s: SlotState) => void;
  required?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  function handleFile(file: File | null) {
    if (!file) return;
    onChange({ uploaded: true, filename: file.name });
  }

  if (state.uploaded) {
    return (
      <Card padding="lg" className="space-y-5">
        <div className="flex items-start justify-between gap-3">
          <Kicker tone="muted">{label}</Kicker>
          <button
            type="button"
            onClick={() => onChange({ uploaded: false, filename: '' })}
            className="text-caption text-text-muted hover:text-text-primary transition-colors duration-base"
          >
            Cambiar
          </button>
        </div>

        <div>
          <div className="flex items-center gap-3">
            <span
              aria-hidden
              className="flex items-center justify-center w-9 h-9 bg-bg-sunken text-text-secondary shrink-0"
            >
              <FileUp size={16} />
            </span>
            <div className="min-w-0">
              <div className="text-body text-text-primary truncate">
                {state.filename}
              </div>
              <div className="text-caption text-text-muted">Listo para analizar</div>
            </div>
          </div>
        </div>

        <p className="text-caption text-text-muted pt-2 border-t border-border-hairline">
          Los datos se procesarán al iniciar la comparación.
        </p>
      </Card>
    );
  }

  return (
    <Card padding="lg" className="space-y-5 flex flex-col">
      <div className="flex items-start justify-between gap-3">
        <Kicker tone="muted">{label}</Kicker>
        {required ? (
          <span className="text-caption text-text-muted">Requerido</span>
        ) : (
          <span className="text-caption text-text-muted">Opcional</span>
        )}
      </div>

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          handleFile(e.dataTransfer.files?.[0] ?? null);
        }}
        onClick={() => inputRef.current?.click()}
        className={cn(
          'border border-dashed transition-colors duration-base ease-out-soft',
          'flex-1 min-h-[140px] flex flex-col items-center justify-center gap-3 px-4 py-8 cursor-pointer',
          dragOver
            ? 'border-accent bg-bg-card'
            : 'border-border-hairline hover:border-text-muted',
        )}
      >
        <Upload size={20} className="text-text-muted" aria-hidden />
        <p className="text-body-sm text-text-secondary text-center">
          Arrastra o haz click para
          <br />
          subir oferta
        </p>
        <p className="text-caption text-text-muted">PDF, imagen</p>
      </div>

      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onChange({
            uploaded: true,
            filename: `oferta-${label.toLowerCase().replace(/\s+/g, '-')}-muestra.pdf`,
          });
        }}
        className="text-body-sm text-accent-muted hover:text-accent underline underline-offset-4 transition-colors duration-base self-start"
      >
        Usar oferta de muestra →
      </button>

      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.png,.jpg,.jpeg,application/pdf,image/*"
        onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
        className="hidden"
        data-slot-key={slotKey}
      />
    </Card>
  );
}

function SlotRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="text-text-muted">{label}</dt>
      <dd className="text-text-primary tabular-nums">{value}</dd>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Analyzing
// ─────────────────────────────────────────────────────────────

function AnalyzingView() {
  const messages = useMemo(
    () => [
      'Leyendo las ofertas',
      'Normalizando tasas y plazos',
      'Calculando CAE comparable',
      'Evaluando flexibilidad y costos accesorios',
      'Eligiendo la mejor para ti',
    ],
    [],
  );
  const [step, setStep] = useState(0);

  useEffect(() => {
    const t = setInterval(() => {
      setStep((s) => Math.min(s + 1, messages.length - 1));
    }, 1700);
    return () => clearInterval(t);
  }, [messages.length]);

  return (
    <Card padding="lg" className="space-y-8 max-w-3xl">
      <div className="space-y-2">
        <Kicker tone="muted">Analizando</Kicker>
        <p className="text-h2 text-text-primary">
          {messages[step]}
          <AiCursor />
        </p>
      </div>

      <div className="space-y-3 pt-6 border-t border-border-hairline">
        <Skeleton className="h-3 w-2/3" />
        <Skeleton className="h-3 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
        <Skeleton className="h-3 w-3/5" />
      </div>

      <ul className="space-y-3 pt-6 border-t border-border-hairline">
        {messages.map((m, i) => (
          <li
            key={m}
            className={cn(
              'flex items-center gap-3 text-body-sm transition-colors duration-base',
              i < step
                ? 'text-text-primary'
                : i === step
                  ? 'text-text-primary'
                  : 'text-text-muted',
            )}
          >
            {i < step ? (
              <CheckCircle2 size={14} className="text-accent shrink-0" />
            ) : i === step ? (
              <span
                aria-hidden
                className="w-1.5 h-1.5 rounded-full bg-accent animate-skeleton-pulse shrink-0"
              />
            ) : (
              <span
                aria-hidden
                className="w-1.5 h-1.5 rounded-full bg-border-hairline shrink-0"
              />
            )}
            {m}
          </li>
        ))}
      </ul>
    </Card>
  );
}

// ─────────────────────────────────────────────────────────────
// Result view
// ─────────────────────────────────────────────────────────────

function ResultView({
  analysis,
  onReset,
}: {
  analysis: ComparisonAnalysis;
  onReset: () => void;
}) {
  return (
    <div className="space-y-16 animate-fade-in">
      <ComparisonTable analysis={analysis} />
      <ConclusionBlock conclusion={analysis.conclusion} />
      <WinnerCard analysis={analysis} />

      <div className="pt-8 border-t border-border-hairline">
        <button
          type="button"
          onClick={onReset}
          className={cn(
            'inline-flex items-center justify-center gap-2 px-5 py-2.5 text-body-sm',
            'border border-border-hairline bg-bg-card text-text-secondary',
            'hover:border-text-primary hover:text-text-primary',
            'transition-all duration-base ease-out-soft',
          )}
        >
          <RotateCcw size={14} />
          Nueva comparación
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Comparison table
// ─────────────────────────────────────────────────────────────

interface RowSpec {
  label: string;
  category: 'nominalRate' | 'effectiveRate' | 'flexibility' | null;
  formatter: (offer: MortgageOffer) => React.ReactNode;
}

const ROWS: RowSpec[] = [
  {
    label: 'Monto',
    category: null,
    formatter: (o) => (
      <span className="text-text-primary tabular-nums">{formatUF(o.amountUF)}</span>
    ),
  },
  {
    label: 'Tasa nominal',
    category: 'nominalRate',
    formatter: (o) => (
      <span className="text-text-primary tabular-nums">{formatPct(o.nominalRate)}</span>
    ),
  },
  {
    label: 'CAE',
    category: 'effectiveRate',
    formatter: (o) => (
      <span className="text-text-primary tabular-nums">{formatPct(o.caeRate)}</span>
    ),
  },
  {
    label: 'Plazo',
    category: null,
    formatter: (o) => (
      <span className="text-text-primary tabular-nums">{o.termYears} años</span>
    ),
  },
  {
    label: 'Dividendo mensual',
    category: null,
    formatter: (o) => (
      <span className="text-text-primary tabular-nums">{formatCLP(o.monthlyPaymentCLP)}</span>
    ),
  },
  {
    label: 'Seguros',
    category: null,
    formatter: (o) => <span className="text-text-secondary">{o.insurances}</span>,
  },
  {
    label: 'Costo de prepago',
    category: null,
    formatter: (o) => <span className="text-text-secondary">{o.prepaymentCost}</span>,
  },
  {
    label: 'Comisión de apertura',
    category: null,
    formatter: (o) => (
      <span className="text-text-primary tabular-nums">{o.openingFee}</span>
    ),
  },
  {
    label: 'Flexibilidad',
    category: 'flexibility',
    formatter: (o) => <span className="text-text-secondary">{o.flexibilityNote}</span>,
  },
];

const CATEGORY_LABEL: Record<NonNullable<RowSpec['category']>, string> = {
  nominalRate: 'mejor tasa nominal',
  effectiveRate: 'mejor CAE',
  flexibility: 'más flexibilidad',
};

function ComparisonTable({ analysis }: { analysis: ComparisonAnalysis }) {
  const offers = analysis.offers;
  const cols = offers.length;

  return (
    <section>
      <SectionTitle>Análisis comparativo</SectionTitle>

      <div className="mt-8 border-t border-border-hairline">
        <div
          className="grid items-baseline gap-x-6"
          style={{ gridTemplateColumns: `220px repeat(${cols}, minmax(0, 1fr))` }}
        >
          {/* Header row with bank names */}
          <div aria-hidden />
          {offers.map((o) => (
            <div key={o.id} className="py-5 border-b border-border-hairline">
              <div className="text-caption uppercase tracking-[0.14em] text-text-muted">
                {o.id === 'banco' ? 'Tu oferta' : `Competidor ${o.id === 'competitor1' ? '1' : '2'}`}
              </div>
              <div className="text-h3 text-text-primary mt-1">{o.bank}</div>
            </div>
          ))}
        </div>

        {/* Data rows */}
        {ROWS.map((row) => {
          const winnerId = row.category ? analysis.winners[row.category] : null;
          return (
            <div
              key={row.label}
              className="grid items-baseline gap-x-6 border-b border-border-hairline"
              style={{ gridTemplateColumns: `220px repeat(${cols}, minmax(0, 1fr))` }}
            >
              <div className="py-5 pr-4 text-body-sm text-text-muted">
                {row.label}
                {row.category && (
                  <div className="text-caption text-text-muted mt-0.5">
                    Categoría comparable
                  </div>
                )}
              </div>

              {offers.map((o) => {
                const isWinner =
                  row.category &&
                  winnerId !== null &&
                  winnerId !== 'tie' &&
                  o.id === winnerId;
                return (
                  <div
                    key={o.id}
                    className={cn(
                      'py-5 text-body-sm relative',
                      isWinner && 'pl-3 -ml-3 border-l-2 border-accent',
                    )}
                  >
                    {row.formatter(o)}
                    {isWinner && (
                      <div className="mt-6 pt-3 border-t border-border-hairline inline-flex items-center gap-2 text-caption uppercase tracking-[0.14em] text-accent">
                        <Trophy size={12} aria-hidden />
                        {CATEGORY_LABEL[row.category]}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>

      <p className="text-caption text-text-muted mt-6 max-w-measure">
        Las cifras inventadas para esta demo son coherentes con el mercado chileno
        2026. En producción se leerían directamente de los PDFs subidos vía
        extracción semántica.
      </p>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────
// Conclusion
// ─────────────────────────────────────────────────────────────

function ConclusionBlock({ conclusion }: { conclusion: string }) {
  return (
    <section>
      <Kicker tone="muted" className="block mb-4">
        Conclusión del análisis
      </Kicker>
      <p className="text-body-lg text-text-primary leading-relaxed max-w-measure">
        {conclusion}
      </p>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────
// Winner card — el golpe narrativo
// ─────────────────────────────────────────────────────────────

function WinnerCard({ analysis }: { analysis: ComparisonAnalysis }) {
  const overall = analysis.winners.overall;
  const propioWon = overall === 'banco';
  const tie = overall === 'tie';
  const winnerOffer = analysis.offers.find((o) => o.id === overall);

  if (propioWon) {
    return (
      <Card padding="lg" className="border-accent/30 bg-accent/3 space-y-5 max-w-3xl">
        <div className="flex items-center gap-3">
          <Trophy size={18} className="text-accent shrink-0" />
          <Kicker tone="accent">Mejor opción para ti</Kicker>
        </div>
        <h2 className="text-h1 text-text-primary leading-tight">
          {BRAND.shortName} es tu mejor opción.
        </h2>
        <p className="text-body-lg text-text-secondary max-w-measure leading-relaxed">
          Después de comparar tasa efectiva, flexibilidad y costos accesorios, la
          oferta de {BRAND.shortName} gana. Si quieres avanzar, agenda con tu ejecutivo
          para cerrar la operación.
        </p>
        <div className="pt-2">
          <button
            type="button"
            className={cn(
              'inline-flex items-center gap-2 px-7 py-3.5 text-body-lg font-medium',
              'bg-accent text-text-inverse',
              'hover:bg-accent-muted transition-colors duration-base ease-out-soft',
            )}
          >
            <Calendar size={16} />
            Agendar una llamada con un ejecutivo
          </button>
        </div>
      </Card>
    );
  }

  if (tie) {
    return (
      <Card padding="lg" className="space-y-5 max-w-3xl">
        <Kicker tone="muted">Decisión cerrada</Kicker>
        <h2 className="text-h1 text-text-primary leading-tight">
          Las ofertas están muy parejas.
        </h2>
        <p className="text-body-lg text-text-secondary max-w-measure leading-relaxed">
          La diferencia es marginal y depende de qué priorices: menor cuota
          ahora, menor costo total, o más flexibilidad de prepago. Conversa con
          tu ejecutivo para entender qué encaja mejor con tus planes.
        </p>
        <div className="pt-2">
          <button
            type="button"
            className={cn(
              'inline-flex items-center gap-2 px-5 py-2.5 text-body font-medium',
              'border border-border-hairline bg-bg-card text-text-primary',
              'hover:border-text-primary hover:bg-bg-page',
              'transition-all duration-base ease-out-soft',
            )}
          >
            <Calendar size={14} />
            Conversar con tu ejecutivo
          </button>
        </div>
      </Card>
    );
  }

  // The competitor won — el golpe narrativo
  return (
    <Card padding="lg" className="space-y-6 max-w-3xl border-status-warning/30">
      <div className="flex items-center gap-3">
        <span
          aria-hidden
          className="w-1.5 h-1.5 rounded-full bg-status-warning"
        />
        <Kicker tone="muted">Decisión honesta</Kicker>
      </div>
      <div className="space-y-4">
        <h2 className="text-h1 text-text-primary leading-tight">
          La oferta de {winnerOffer?.bank ?? 'el otro banco'} es objetivamente
          mejor para ti.
        </h2>
        <p className="text-body-lg text-text-secondary max-w-measure leading-relaxed">
          Mirando CAE, flexibilidad y costos totales sobre el plazo completo, el
          competidor te conviene más. Si quieres tomarla, esa es nuestra
          recomendación honesta.
        </p>
      </div>

      <hr className="border-t border-border-hairline" />

      <div className="space-y-4">
        <p className="text-body text-text-primary leading-relaxed max-w-measure">
          <span className="font-medium">Antes de aceptarla, hablemos.</span>{' '}
          Sabemos qué pesa en tu caso y podemos revisar si hay margen para
          mejorar nuestra oferta. Si después de conversar la otra sigue siendo
          mejor, te ayudamos con el proceso de portabilidad.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <button
            type="button"
            className={cn(
              'inline-flex items-center justify-center gap-2 px-7 py-3.5 text-body-lg font-medium',
              'bg-accent text-text-inverse',
              'hover:bg-accent-muted transition-colors duration-base ease-out-soft',
            )}
          >
            <Calendar size={16} />
            Agenda una llamada con tu ejecutivo
          </button>
          <button
            type="button"
            className={cn(
              'inline-flex items-center justify-center gap-2 px-5 py-2.5 text-body-sm',
              'border border-border-hairline bg-bg-card text-text-secondary',
              'hover:border-text-primary hover:text-text-primary',
              'transition-all duration-base ease-out-soft',
            )}
          >
            Continuar con {winnerOffer?.bank ?? 'el otro banco'}
            <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </Card>
  );
}
