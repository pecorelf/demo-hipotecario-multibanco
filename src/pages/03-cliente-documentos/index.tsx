import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  Check,
  ChevronDown,
  FileText,
  Upload,
  X,
} from 'lucide-react';
import {
  Card,
  Kicker,
  PageTitle,
  Pill,
  SectionTitle,
  Skeleton,
} from '@/components/ui';
import { AiCursor, AiMessage } from '@/components/ai';
import { useClaudeStream } from '@/hooks/useClaude';
import {
  ClaudeApiError,
  extractStructured,
  extractTagged,
} from '@/lib/claude';
import {
  buildDocAnalysisPrompt,
  buildDocAnalysisSystem,
  buildInconsistencyPrompt,
  buildInconsistencySystem,
} from '@/lib/prompts/assistant';
import {
  shouldFlagOnUpload,
  validateDocAnalysis,
  worstStatus,
} from '@/lib/docAnalysis';
import { cn } from '@/lib/cn';
import type {
  ConsistencyCheck,
  ConsistencyStatus,
  DocAnalysis,
} from '@/types';
import { BRAND } from '@/lib/brand';

// ─────────────────────────────────────────────────────────────
// Datos de pantalla (mock fijo según spec del módulo)
// ─────────────────────────────────────────────────────────────

interface RetrievedItem {
  id: string;
  label: string;
  value: string;
  source: string;
  detail: string;
}

const RETRIEVED: RetrievedItem[] = [
  {
    id: 'r1',
    label: 'Identidad y dirección',
    value: 'Andrés Fuenzalida · RUT 16.482.930-7',
    source: 'Registro Civil',
    detail:
      'Cédula vigente hasta 14 mar 2031. Match biométrico 97% contra base del Registro Civil. Domicilio declarado: Av. Los Leones 1240, depto 1203, Providencia (validado en cartola Previred).',
  },
  {
    id: 'r2',
    label: '3 últimas liquidaciones de sueldo (renta fija)',
    value: '$2.450.000 líquidos en promedio',
    source: 'Empleador · Nuestra consultora Consultoría Limitada',
    detail:
      `Promedio últimos 3 meses: $2.450.000 líquidos. Depósito en Cuenta Corriente ${BRAND.shortName} #4567892. Empleador Nuestra consultora Consultoría Limitada desde nov 2021 (55 meses de antigüedad). Sueldo estable, sin variabilidad significativa.`,
  },
  {
    id: 'r3',
    label: 'Certificado de 12 últimas cotizaciones de AFP',
    value: 'Habitat · 12 meses continuos',
    source: 'Previred',
    detail:
      'Cotizaciones AFP Habitat 12 meses continuos, sin gaps. Mismo empleador en todo el período. Cotizaciones para salud Banmédica también al día.',
  },
  {
    id: 'r4',
    label: 'Carpeta tributaria 2025',
    value: 'F22 declarada, sin observaciones',
    source: 'SII · con tu mandato',
    detail:
      'Formulario 22 año tributario 2025 declarado el 27 abr 2025. Renta líquida imponible $29.4M. Sin observaciones del SII. No registra deuda fiscal.',
  },
  {
    id: 'r5',
    label: 'Deuda consolidada',
    value: 'UF 180',
    source: 'CMF',
    detail:
      `Total deuda consolidada UF 180: Tarjeta de crédito retail UF 32, crédito de consumo ${BRAND.shortName} UF 148. Sin morosidad. Carga financiera mensual estimada $340.000 (DTI 13.9% sobre renta líquida actual, antes del crédito hipotecario).`,
  },
];

interface FetchingItem {
  id: string;
  label: string;
  source: string;
  durationMs: number;
  resultValue: string;
  resultDetail: string;
}

const FETCHING: FetchingItem[] = [
  {
    id: 'f1',
    label: 'Estudio de títulos',
    source: 'Conservador de Bienes Raíces · Santiago',
    durationMs: 4000,
    resultValue: 'Sin observaciones',
    resultDetail:
      'Propiedad libre de gravámenes, prohibiciones y litigios. Dominio inscrito a nombre de Inmobiliaria Los Almendros SpA. Foja 4521 N° 8243 año 2023.',
  },
  {
    id: 'f2',
    label: 'Certificado de matrimonio',
    source: 'Registro Civil',
    durationMs: 6000,
    resultValue: 'Sociedad conyugal',
    resultDetail:
      'Matrimonio con María José Contreras Salinas inscrito el 12 oct 2018 en circunscripción Providencia. Régimen: sociedad conyugal. Vigente.',
  },
];

interface RequestedDoc {
  id: string;
  label: string;
  hint: string;
}

const REQUESTED: RequestedDoc[] = [
  {
    id: 'req1',
    label: 'Tasación de la propiedad',
    hint: 'Realizada por tasador inscrito en SBIF. Banco coordina la visita.',
  },
  {
    id: 'req2',
    label: 'Promesa de compraventa firmada',
    hint: 'PDF con firmas de comprador y vendedor.',
  },
];

// ─────────────────────────────────────────────────────────────
// Mock samples — para que la demo pueda correr sin archivos reales
// ─────────────────────────────────────────────────────────────

function sampleFilenameFor(label: string): string {
  const slug = label
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  return `${slug || 'documento'}-muestra.pdf`;
}

// ─────────────────────────────────────────────────────────────
// Componente principal
// ─────────────────────────────────────────────────────────────

interface InconsistencyContext {
  filename: string;
  check: ConsistencyCheck;
}

export default function ClienteDocumentos() {
  const uploadCountRef = useRef(0);
  const [drawerCtx, setDrawerCtx] = useState<InconsistencyContext | null>(null);

  function nextUploadFlag(): boolean {
    uploadCountRef.current += 1;
    return shouldFlagOnUpload(uploadCountRef.current);
  }

  return (
    <>
      <div className="max-w-shell mx-auto px-6 md:px-10 lg:px-16 py-12 lg:py-16">
        <header className="max-w-3xl">
          <Kicker>Cliente · Documentos y datos</Kicker>
          <PageTitle className="mt-3">Tus documentos y datos</PageTitle>
          <p className="text-body-lg text-text-secondary mt-3 max-w-measure">
            Lo que ya tenemos, lo que estamos buscando, y lo que necesitamos de ti.
          </p>
          <span aria-hidden className="block w-12 h-px bg-border-hairline mt-8" />
        </header>

        <div className="mt-12 space-y-16">
          <BlockRetrieved items={RETRIEVED} />
          <hr className="border-t border-border-hairline" />
          <BlockFetching items={FETCHING} />
          <hr className="border-t border-border-hairline" />
          <BlockRequested
            items={REQUESTED}
            getFlagInconsistency={nextUploadFlag}
            onDiscussInconsistency={(ctx) => setDrawerCtx(ctx)}
          />
        </div>

        <ContinueToSimulation />
      </div>

      {drawerCtx && (
        <EugeniaDrawer
          context={drawerCtx}
          onClose={() => setDrawerCtx(null)}
        />
      )}
    </>
  );
}

// ─────────────────────────────────────────────────────────────
// Bloque 1 — Lo que ya tenemos
// ─────────────────────────────────────────────────────────────

function BlockRetrieved({ items }: { items: RetrievedItem[] }) {
  return (
    <section className="space-y-6">
      <header className="max-w-measure">
        <SectionTitle>Lo que ya tenemos</SectionTitle>
        <p className="text-body text-text-secondary mt-3">
          Rescatado automáticamente con tu autorización, desde fuentes oficiales.
        </p>
      </header>
      <ul className="border-t border-border-hairline">
        {items.map((item) => (
          <RetrievedRow key={item.id} item={item} />
        ))}
      </ul>
    </section>
  );
}

function RetrievedRow({ item }: { item: RetrievedItem }) {
  const [open, setOpen] = useState(false);
  return (
    <li className="border-b border-border-hairline">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={cn(
          'w-full grid grid-cols-12 gap-4 items-baseline py-5',
          'text-left transition-colors duration-base ease-out-soft hover:bg-bg-card',
          'focus:outline-none focus-visible:bg-bg-card',
        )}
        aria-expanded={open}
      >
        <span className="col-span-12 sm:col-span-6 flex items-baseline gap-3">
          <Check size={14} className="text-accent shrink-0 translate-y-[1px]" aria-hidden />
          <span className="text-body text-text-primary">{item.label}</span>
        </span>
        <span className="col-span-8 sm:col-span-4 text-body-sm text-text-secondary tabular-nums">
          {item.value}
        </span>
        <span className="col-span-4 sm:col-span-2 flex items-center justify-end gap-2 text-caption text-text-muted">
          <span className="truncate max-w-[140px] text-right">{item.source}</span>
          <ChevronDown
            size={14}
            className={cn(
              'shrink-0 transition-transform duration-base ease-out-soft',
              open && 'rotate-180',
            )}
            aria-hidden
          />
        </span>
      </button>
      {open && (
        <div className="pb-6 pl-7 pr-4 -mt-1 animate-fade-in">
          <p className="text-body-sm text-text-secondary max-w-measure">{item.detail}</p>
        </div>
      )}
    </li>
  );
}

// ─────────────────────────────────────────────────────────────
// Bloque 2 — Buscando ahora
// ─────────────────────────────────────────────────────────────

function BlockFetching({ items }: { items: FetchingItem[] }) {
  return (
    <section className="space-y-6">
      <header className="max-w-measure">
        <SectionTitle>Buscando ahora</SectionTitle>
        <p className="text-body text-text-secondary mt-3">
          Estamos consultando estas fuentes en este momento. Te avisamos apenas
          tengamos respuesta — no necesitas esperar acá.
        </p>
      </header>
      <ul className="border-t border-border-hairline">
        {items.map((item) => (
          <FetchingRow key={item.id} item={item} />
        ))}
      </ul>
    </section>
  );
}

function FetchingRow({ item }: { item: FetchingItem }) {
  const [done, setDone] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setDone(true), item.durationMs);
    return () => clearTimeout(t);
  }, [item.durationMs]);

  return (
    <li className="border-b border-border-hairline">
      <div className="grid grid-cols-12 gap-4 items-baseline py-5">
        <span className="col-span-12 sm:col-span-6 flex items-baseline gap-3">
          {done ? (
            <Check size={14} className="text-accent shrink-0 translate-y-[1px]" aria-hidden />
          ) : (
            <span
              aria-hidden
              className="w-1.5 h-1.5 rounded-full bg-accent animate-skeleton-pulse mt-2 shrink-0"
            />
          )}
          <span className="text-body text-text-primary">{item.label}</span>
        </span>
        <span className="col-span-8 sm:col-span-4 text-body-sm text-text-secondary tabular-nums min-h-[1.55em]">
          {done ? (
            <span className="animate-fade-in">{item.resultValue}</span>
          ) : (
            <Skeleton className="h-3 w-32" />
          )}
        </span>
        <span className="col-span-4 sm:col-span-2 text-caption text-text-muted text-right truncate">
          {item.source}
        </span>
      </div>
      {done && (
        <div className="pb-6 pl-7 pr-4 -mt-2 animate-fade-in">
          <p className="text-body-sm text-text-muted max-w-measure">{item.resultDetail}</p>
        </div>
      )}
    </li>
  );
}

// ─────────────────────────────────────────────────────────────
// Bloque 3 — Necesitamos de ti
// ─────────────────────────────────────────────────────────────

interface BlockRequestedProps {
  items: RequestedDoc[];
  getFlagInconsistency: () => boolean;
  onDiscussInconsistency: (ctx: InconsistencyContext) => void;
}

function BlockRequested({
  items,
  getFlagInconsistency,
  onDiscussInconsistency,
}: BlockRequestedProps) {
  return (
    <section className="space-y-6">
      <header className="max-w-measure">
        <SectionTitle>Necesitamos de ti</SectionTitle>
        <p className="text-body text-text-secondary mt-3">
          Esto sí lo tienes que subir tú. Apenas lo cargues lo procesamos y te
          decimos si hay algo que conversar.
        </p>
      </header>
      <div className="grid grid-cols-12 gap-6">
        {items.map((item) => (
          <UploadCard
            key={item.id}
            doc={item}
            getFlagInconsistency={getFlagInconsistency}
            onDiscussInconsistency={onDiscussInconsistency}
          />
        ))}
      </div>
    </section>
  );
}

interface UploadCardProps {
  doc: RequestedDoc;
  getFlagInconsistency: () => boolean;
  onDiscussInconsistency: (ctx: InconsistencyContext) => void;
}

function UploadCard({
  doc,
  getFlagInconsistency,
  onDiscussInconsistency,
}: UploadCardProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [filename, setFilename] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<DocAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);
  const retryCountRef = useRef<number>(0);
  const stream = useClaudeStream();

  // Parse JSON when stream completes
  useEffect(() => {
    if (stream.isStreaming || !stream.text || analysis) return;
    // Try tagged extraction first; if that fails, try parsing the whole response
    const tagged = extractTagged(stream.text, 'doc_analysis');
    const source = tagged ?? stream.text;
    try {
      const parsed = extractStructured(source, validateDocAnalysis);
      setAnalysis(parsed);
      setError(null);
      retryCountRef.current = 0;
    } catch (err) {
      // Silent retry once before showing error
      if (retryCountRef.current < 1 && filename) {
        retryCountRef.current += 1;
        const flag = false; // Don't flag on retry, keep it safe
        stream.start({
          messages: [
            {
              role: 'user',
              content: buildDocAnalysisPrompt({ filename, flagInconsistency: flag }),
            },
          ],
          system: buildDocAnalysisSystem(),
          maxTokens: 1500,
          temperature: 0.3, // Lower temp on retry for more deterministic output
        });
        return;
      }
      setError(
        err instanceof Error
          ? err.message
          : 'No se pudo leer el análisis. Reintenta subiendo el documento.',
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stream.text, stream.isStreaming, analysis]);

  function handlePick() {
    inputRef.current?.click();
  }

  function processUpload(name: string) {
    setFilename(name);
    setAnalysis(null);
    setError(null);
    retryCountRef.current = 0;
    const flag = getFlagInconsistency();
    stream.start({
      messages: [
        {
          role: 'user',
          content: buildDocAnalysisPrompt({ filename: name, flagInconsistency: flag }),
        },
      ],
      system: buildDocAnalysisSystem(),
      maxTokens: 1500,
      temperature: 0.5,
    });
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    processUpload(file.name);
    // Reset input so the same file can be re-picked
    e.target.value = '';
  }

  function handleUseSample() {
    const sampleName = sampleFilenameFor(doc.label);
    processUpload(sampleName);
  }

  function handleReset() {
    stream.reset();
    setFilename(null);
    setAnalysis(null);
    setError(null);
  }

  return (
    <Card padding="lg" className="col-span-12 lg:col-span-6 flex flex-col gap-6">
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,image/*"
        onChange={handleFileChange}
        className="hidden"
      />

      <header className="flex items-start justify-between gap-4">
        <div>
          <Kicker tone="muted">{doc.label}</Kicker>
          {!filename && (
            <p className="text-body-sm text-text-secondary mt-2">{doc.hint}</p>
          )}
          {filename && (
            <p className="text-body-sm text-text-primary mt-2 flex items-center gap-2 break-all">
              <FileText size={14} className="text-text-muted shrink-0" />
              <span>{filename}</span>
            </p>
          )}
        </div>
        {filename && (
          <button
            type="button"
            onClick={handleReset}
            className="text-text-muted hover:text-text-primary transition-colors duration-base shrink-0"
            aria-label="Quitar archivo"
          >
            <X size={16} />
          </button>
        )}
      </header>

      {!filename && (
        <div className="flex flex-col items-start gap-3">
          <button
            type="button"
            onClick={handlePick}
            className={cn(
              'inline-flex items-center justify-center gap-2 px-5 py-2.5 text-body font-medium',
              'bg-accent text-text-inverse',
              'hover:bg-accent-muted transition-colors duration-base ease-out-soft',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:ring-offset-2 focus-visible:ring-offset-bg-card',
            )}
          >
            <Upload size={14} />
            Subir documento
          </button>
          <button
            type="button"
            onClick={handleUseSample}
            className="text-body-sm text-accent-muted hover:text-accent underline underline-offset-4 transition-colors duration-base"
          >
            Usar documento de muestra →
          </button>
        </div>
      )}

      {filename && stream.isStreaming && (
        <AnalysisLoading />
      )}

      {filename && !stream.isStreaming && error && (
        <p className="text-body-sm text-status-error">{error}</p>
      )}

      {filename && !stream.isStreaming && stream.error && stream.error.kind !== 'cancelled' && stream.error.message !== 'Aborted' && (
        <p className="text-body-sm text-status-error">
          {stream.error.message}
        </p>
      )}

      {filename && analysis && (
        <AnalysisView
          analysis={analysis}
          onDiscuss={(check) =>
            onDiscussInconsistency({ filename, check })
          }
        />
      )}
    </Card>
  );
}

function AnalysisLoading() {
  return (
    <div className="space-y-3 animate-fade-in">
      <div className="flex items-center gap-3">
        <span
          aria-hidden
          className="w-1.5 h-1.5 rounded-full bg-accent animate-skeleton-pulse"
        />
        <span className="text-body-sm text-text-secondary">
          Analizando documento…
        </span>
      </div>
      <Skeleton className="h-3 w-3/4" />
      <Skeleton className="h-3 w-2/5" />
      <Skeleton className="h-3 w-3/5" />
    </div>
  );
}

interface AnalysisViewProps {
  analysis: DocAnalysis;
  onDiscuss: (check: ConsistencyCheck) => void;
}

function AnalysisView({ analysis, onDiscuss }: AnalysisViewProps) {
  const overall = worstStatus(analysis.consistencyChecks);
  const overallPill = overallPillFor(overall, analysis.requiresHumanReview);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-start justify-between gap-3">
        <p className="text-body-sm text-text-primary max-w-measure">
          {analysis.summary}
        </p>
        <Pill variant={overallPill.variant} size="sm" className="shrink-0">
          {overallPill.label}
        </Pill>
      </div>

      {Object.keys(analysis.extractedFields).length > 0 && (
        <section>
          <Kicker tone="muted" className="block mb-3">
            Datos extraídos
          </Kicker>
          <dl className="grid grid-cols-12 gap-x-4 gap-y-2 border-t border-border-hairline pt-3">
            {Object.entries(analysis.extractedFields).map(([k, v]) => (
              <div key={k} className="col-span-12 sm:col-span-6 flex justify-between gap-3 py-1.5 border-b border-border-hairline">
                <dt className="text-body-sm text-text-muted">{k}</dt>
                <dd className="text-body-sm text-text-primary tabular-nums text-right">{v}</dd>
              </div>
            ))}
          </dl>
        </section>
      )}

      {analysis.consistencyChecks.length > 0 && (
        <section>
          <Kicker tone="muted" className="block mb-3">
            Verificaciones
          </Kicker>
          <ul className="space-y-3">
            {analysis.consistencyChecks.map((check, idx) => (
              <li key={idx} className="flex items-start gap-3">
                <Pill variant={pillVariantFor(check.status)} size="sm" className="shrink-0 mt-0.5">
                  {statusLabel(check.status)}
                </Pill>
                <div className="flex-1 min-w-0">
                  <p className="text-body-sm text-text-primary">{check.check}</p>
                  <p className="text-body-sm text-text-secondary mt-1">{check.explanation}</p>
                  {check.status !== 'ok' && (
                    <button
                      type="button"
                      onClick={() => onDiscuss(check)}
                      className="text-body-sm text-accent-muted hover:text-accent underline underline-offset-4 mt-2 transition-colors duration-base"
                    >
                      Discutir con {BRAND.assistantName} →
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {analysis.validityDate && (
        <ValidityBadge isoDate={analysis.validityDate} />
      )}
    </div>
  );
}

function ValidityBadge({ isoDate }: { isoDate: string }) {
  const target = new Date(isoDate);
  if (Number.isNaN(target.getTime())) return null;

  const today = new Date('2026-05-20T12:00:00-04:00');
  const daysLeft = Math.floor(
    (target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
  );

  const tone =
    daysLeft < 0
      ? 'expired'
      : daysLeft <= 30
        ? 'soon'
        : 'ok';

  const formatted = target.toLocaleDateString('es-CL', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  return (
    <div
      className={cn(
        'inline-flex items-center gap-2 px-3 py-1.5 text-caption',
        'border',
        tone === 'expired' && 'bg-status-error-bg border-status-error/30 text-status-error',
        tone === 'soon' &&
          'bg-status-warning-bg border-status-warning/30 text-status-warning',
        tone === 'ok' && 'bg-bg-sunken border-border-hairline text-text-secondary',
      )}
    >
      <span
        aria-hidden
        className={cn(
          'w-1.5 h-1.5 rounded-full',
          tone === 'expired' && 'bg-status-error',
          tone === 'soon' && 'bg-status-warning',
          tone === 'ok' && 'bg-text-muted',
        )}
      />
      <span className="uppercase tracking-[0.14em] font-medium">
        {tone === 'expired'
          ? `Caducado hace ${Math.abs(daysLeft)} ${Math.abs(daysLeft) === 1 ? 'día' : 'días'}`
          : tone === 'soon'
            ? `Caduca en ${daysLeft} ${daysLeft === 1 ? 'día' : 'días'}`
            : `Vigente hasta ${formatted}`}
      </span>
    </div>
  );
}

function pillVariantFor(s: ConsistencyStatus): 'success' | 'warning' | 'error' {
  if (s === 'ok') return 'success';
  if (s === 'warning') return 'warning';
  return 'error';
}

function statusLabel(s: ConsistencyStatus): string {
  if (s === 'ok') return 'OK';
  if (s === 'warning') return 'Revisar';
  return 'Alerta';
}

function overallPillFor(
  s: ConsistencyStatus,
  human: boolean,
): { label: string; variant: 'success' | 'warning' | 'error' | 'info' } {
  if (s === 'error') return { label: 'Requiere atención', variant: 'error' };
  if (s === 'warning') return { label: 'Revisar', variant: 'warning' };
  if (human) return { label: 'Revisión humana', variant: 'info' };
  return { label: 'Validado', variant: 'success' };
}

// ─────────────────────────────────────────────────────────────
// Drawer — Discutir con {BRAND.assistantName} (streaming)
// ─────────────────────────────────────────────────────────────

interface EugeniaDrawerProps {
  context: InconsistencyContext;
  onClose: () => void;
}

function EugeniaDrawer({ context, onClose }: EugeniaDrawerProps) {
  const stream = useClaudeStream();

  // Start the stream once when the drawer opens (or context changes)
  const contextKey = `${context.filename}::${context.check.check}`;
  useEffect(() => {
    if (context.check.status === 'ok') return;
    stream.start({
      messages: [
        {
          role: 'user',
          content: buildInconsistencyPrompt({
            filename: context.filename,
            check: context.check.check,
            status: context.check.status as 'warning' | 'error',
            explanation: context.check.explanation,
          }),
        },
      ],
      system: buildInconsistencySystem(),
      maxTokens: 600,
      temperature: 0.6,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contextKey]);

  // Close on Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const drawerPillVariant = pillVariantFor(context.check.status);

  return (
    <>
      <div
        className="fixed inset-0 bg-bg-overlay z-40 animate-fade-in"
        onClick={onClose}
        aria-hidden
      />
      <aside
        role="dialog"
        aria-label={`Discutir con ${BRAND.assistantName}`}
        className={cn(
          'fixed top-0 right-0 bottom-0 z-50 overflow-y-auto',
          'w-full sm:w-[520px] bg-bg-card border-l border-border-hairline shadow-soft',
          'animate-slide-in-right',
        )}
      >
        <header className="sticky top-0 z-10 bg-bg-card border-b border-border-hairline px-8 py-6 flex items-start justify-between gap-4">
          <div>
            <Kicker>{BRAND.assistantName} · Asistente</Kicker>
            <h2 className="text-h2 text-text-primary mt-2">Conversemos sobre esto</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 -mr-2 text-text-muted hover:text-text-primary transition-colors duration-base"
            aria-label="Cerrar"
          >
            <X size={18} />
          </button>
        </header>

        <div className="px-8 py-8 space-y-8">
          <section className="space-y-3">
            <Pill variant={drawerPillVariant} size="sm">
              {statusLabel(context.check.status)}
            </Pill>
            <p className="text-body text-text-primary">{context.check.check}</p>
            <p className="text-body-sm text-text-secondary">{context.check.explanation}</p>
            <p className="text-caption text-text-muted">
              Documento: {context.filename}
            </p>
          </section>

          <hr className="border-t border-border-hairline" />

          <DrawerStreamBody
            text={stream.text}
            isStreaming={stream.isStreaming}
            error={stream.error}
          />
        </div>
      </aside>
    </>
  );
}

function DrawerStreamBody({
  text,
  isStreaming,
  error,
}: {
  text: string;
  isStreaming: boolean;
  error: ClaudeApiError | null;
}) {
  const showSkeleton = isStreaming && text.length === 0 && !error;

  if (error && error.kind !== 'cancelled' && error.message !== 'Aborted') {
    return (
      <p className="text-body-sm text-status-error">
        {error.message}
      </p>
    );
  }

  if (showSkeleton) {
    return (
      <div className="flex gap-4">
        <span aria-hidden className="mt-[2px] w-[2px] bg-accent shrink-0 self-stretch" />
        <div className="flex flex-col gap-2 flex-1">
          <Kicker>{BRAND.assistantName} · Asistente</Kicker>
          <Skeleton className="h-3 w-3/5 mt-1" />
          <Skeleton className="h-3 w-2/5" />
        </div>
      </div>
    );
  }

  return (
    <AiMessage label={`${BRAND.assistantName} · Asistente`} streaming={isStreaming}>
      <span className="whitespace-pre-wrap">{text}</span>
      {isStreaming && <AiCursor />}
    </AiMessage>
  );
}

// ─────────────────────────────────────────────────────────────
// Continue to simulation
// ─────────────────────────────────────────────────────────────

function ContinueToSimulation() {
  const navigate = useNavigate();
  return (
    <section className="mt-20 pt-10 border-t border-border-hairline">
      <div className="max-w-3xl">
        <Kicker tone="muted">Cuando quieras seguir</Kicker>
        <h2 className="text-h2 text-text-primary mt-3">
          ¿Cómo sigue el proceso ahora?
        </h2>
        <p className="text-body-lg text-text-secondary mt-3 max-w-measure">
          Con lo que ya tenemos podemos prepararte tres escenarios concretos
          —diferentes plazos, tasas y cuotas— para que veas qué se acomoda
          mejor a tu mes a mes.
        </p>
        <button
          type="button"
          onClick={() => navigate('/cliente/simulacion')}
          className="mt-8 inline-flex items-center gap-2 px-7 py-3.5 text-body-lg font-medium bg-accent text-text-inverse hover:bg-accent-muted transition-colors duration-base ease-out-soft focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:ring-offset-2"
        >
          Ver mis escenarios
          <ArrowRight size={16} />
        </button>
      </div>
    </section>
  );
}
