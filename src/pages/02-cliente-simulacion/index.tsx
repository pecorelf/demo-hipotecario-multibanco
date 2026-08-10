import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  Calendar,
  Check,
  Clock,
  PiggyBank,
  Sliders,
  Star,
  Sparkles,
} from 'lucide-react';
import {
  Card,
  Kicker,
  PageTitle,
  Pill,
  SectionTitle,
} from '@/components/ui';
import { cn } from '@/lib/cn';
import { calculateMonthlyPaymentCLP, formatCLP, formatPct } from '@/lib/format';
import { useAppStore } from '@/store/appStore';
import { useOperationStore } from '@/store/operationStore';
import { BRAND } from '@/lib/brand';

// ─────────────────────────────────────────────────────────────
// Scenarios — dinámicos según el monto y plazo del cliente
// ─────────────────────────────────────────────────────────────

interface ScenarioConfig {
  id: string;
  label: string;
  termYears: number;
  nominalRate: number;
  caeRate: number;
  highlights: string[];
  tradeoffs: string[];
  recommended?: boolean;
  isCustom?: boolean; // el plazo elegido por el cliente
  icon: React.ReactNode;
}

const STANDARD_SCENARIOS: ScenarioConfig[] = [
  {
    id: 'plazo_20',
    label: 'Plazo 20 años',
    termYears: 20,
    nominalRate: 4.40,
    caeRate: 4.91,
    highlights: [
      'Tasa preferente más baja',
      'Menor costo total del crédito',
    ],
    tradeoffs: ['Cuota mensual más exigente'],
    icon: <PiggyBank size={18} aria-hidden />,
  },
  {
    id: 'plazo_25',
    label: 'Plazo 25 años',
    termYears: 25,
    nominalRate: 4.65,
    caeRate: 5.18,
    highlights: [
      'Punto medio entre cuota y costo total',
      'Seguros completos incluidos',
    ],
    tradeoffs: ['Mayor cuota que la opción a 30 años'],
    recommended: true,
    icon: <Sliders size={18} aria-hidden />,
  },
  {
    id: 'plazo_30',
    label: 'Plazo 30 años',
    termYears: 30,
    nominalRate: 4.95,
    caeRate: 5.48,
    highlights: [
      'Tu mes a mes queda más cómodo',
      'Mayor flexibilidad para imprevistos',
    ],
    tradeoffs: ['Pagas más interés total'],
    icon: <Clock size={18} aria-hidden />,
  },
];

/**
 * Linear interpolation of the rate based on plazo.
 * The slope is taken from the standard scenarios:
 *   20 yrs → 4.40%
 *   30 yrs → 4.95%
 * Slope = 0.055 per year. Each year less than 20 reduces rate slightly,
 * each year more than 30 we clip to the 30-year rate.
 */
function interpolateRate(years: number): { nominal: number; cae: number } {
  let nominal: number;
  if (years <= 20) {
    // Allow some discount for shorter terms, but floor at 4.0
    nominal = Math.max(4.0, 4.40 - (20 - years) * 0.055);
  } else if (years >= 30) {
    nominal = 4.95;
  } else {
    nominal = 4.40 + (years - 20) * 0.055;
  }
  // CAE is approximately nominal + 0.53
  const cae = Math.round((nominal + 0.53) * 100) / 100;
  return { nominal: Math.round(nominal * 100) / 100, cae };
}

function buildCustomScenario(years: number): ScenarioConfig {
  const { nominal, cae } = interpolateRate(years);
  return {
    id: `plazo_custom_${years}`,
    label: `Plazo ${years} años`,
    termYears: years,
    nominalRate: nominal,
    caeRate: cae,
    isCustom: true,
    highlights: [
      `Plazo personalizado, según lo que conversaste con ${BRAND.assistantName}`,
      'Tasa ajustada a tu plazo específico',
    ],
    tradeoffs: ['Las condiciones se confirman al firmar la solicitud'],
    icon: <Sparkles size={18} aria-hidden />,
  };
}

interface Scenario extends ScenarioConfig {
  monthlyCLP: number;
  totalCostUF: number;
}

function buildScenarios(loanUF: number, configs: ScenarioConfig[]): Scenario[] {
  return configs.map((config) => {
    const monthlyCLP = calculateMonthlyPaymentCLP(
      loanUF,
      config.nominalRate,
      config.termYears,
    );
    const n = config.termYears * 12;
    const totalCLP = monthlyCLP * n;
    const totalCostUF = Math.round(totalCLP / 40424.99);
    return { ...config, monthlyCLP, totalCostUF };
  });
}

// ─────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────

export default function ClienteSimulacion() {
  const navigate = useNavigate();
  const setChosenScenario = useAppStore((s) => s.setChosenScenario);
  const propertyInput = useAppStore((s) => s.propertyInput);
  const plazoSolicitado = useOperationStore((s) => s.plazoSolicitado);
  const setScenarios = useOperationStore((s) => s.setScenarios);
  const selectScenarioInStore = useOperationStore((s) => s.selectScenario);
  const setOpStage = useOperationStore((s) => s.setStage);
  const [hovered, setHovered] = useState<string | null>(null);

  // Default amount if no property data (defensive)
  const loanUF = propertyInput?.loanAmountUF ?? 4760;

  // Decide which scenarios to show
  const { scenarios, isCustomFlow } = useMemo(() => {
    const standardYears = [20, 25, 30];
    if (plazoSolicitado === null || standardYears.includes(plazoSolicitado)) {
      return {
        scenarios: buildScenarios(loanUF, STANDARD_SCENARIOS),
        isCustomFlow: false,
      };
    }
    // Custom plazo: put the custom scenario first, then standards
    const customConfig = buildCustomScenario(plazoSolicitado);
    return {
      scenarios: buildScenarios(loanUF, [customConfig, ...STANDARD_SCENARIOS]),
      isCustomFlow: true,
    };
  }, [loanUF, plazoSolicitado]);

  // Mirror scenarios to operation store so executive views can read them
  useMemo(() => {
    setScenarios(
      scenarios.map((s) => ({
        plazoAnios: s.termYears,
        tasaAnual: s.nominalRate,
        dividendoMensualUF: Math.round((s.monthlyCLP / 40424.99) * 100) / 100,
        totalUF: s.totalCostUF,
        cae: s.caeRate,
      })),
    );
  }, [scenarios, setScenarios]);

  function handleChoose(s: Scenario) {
    setChosenScenario({
      id: s.id,
      label: s.label,
      termYears: s.termYears,
      nominalRate: s.nominalRate,
      caeRate: s.caeRate,
      monthlyCLP: s.monthlyCLP,
    });
    selectScenarioInStore(s.termYears);
    setOpStage('selected');
    navigate('/cliente/confirmado');
  }

  return (
    <div className="max-w-shell mx-auto px-6 md:px-10 lg:px-16 py-12 lg:py-16 animate-fade-in">
      <button
        type="button"
        onClick={() => navigate('/cliente/documentos')}
        className="inline-flex items-center gap-2 text-body-sm text-text-secondary hover:text-text-primary transition-colors duration-base"
      >
        <ArrowLeft size={14} />
        Volver a documentos
      </button>

      <header className="max-w-3xl mt-10">
        <Kicker>Tu simulación · Caso #HIP-2026-0042</Kicker>
        <PageTitle className="mt-3">
          {isCustomFlow
            ? `Tu plazo y tres referencias. Elige la que mejor se acomoda.`
            : `Tres formas de armar tu crédito. Elige la que mejor se acomoda.`}
        </PageTitle>
        <p className="text-body-lg text-text-secondary mt-3 max-w-measure">
          {propertyInput
            ? `Para ${propertyInput.address}, ${propertyInput.commune}. Crédito de UF ${loanUF.toLocaleString('es-CL')} con tu pie de UF ${propertyInput.downPaymentUF.toLocaleString('es-CL')}. Las tasas son indicativas y se confirman al firmar.`
            : 'Con los datos que ya tenemos preparamos los escenarios. Las tasas son indicativas y se confirman al firmar la solicitud.'}
        </p>
        {isCustomFlow && (
          <div className="mt-5 inline-flex items-center gap-2 px-3 py-1.5 bg-accent/10 border border-accent/20">
            <Sparkles size={14} className="text-accent" />
            <span className="text-body-sm text-accent font-medium">
              Respetamos los {plazoSolicitado} años que conversaste con {BRAND.assistantName}. Te mostramos también 20, 25 y 30 como referencia.
            </span>
          </div>
        )}
        <span aria-hidden className="block w-12 h-px bg-border-hairline mt-10" />
      </header>

      <div className={cn(
        "mt-12 grid grid-cols-1 gap-6",
        isCustomFlow ? "md:grid-cols-2 lg:grid-cols-4" : "md:grid-cols-3",
      )}>
        {scenarios.map((s) => (
          <ScenarioCard
            key={s.id}
            scenario={s}
            isHovered={hovered === s.id}
            onHover={() => setHovered(s.id)}
            onLeave={() => setHovered(null)}
            onChoose={() => handleChoose(s)}
          />
        ))}
      </div>

      <div className="mt-12 pt-8 border-t border-border-hairline">
        <SectionTitle>¿Necesitas algo distinto?</SectionTitle>
        <p className="text-body text-text-secondary mt-4 max-w-measure">
          Si ninguna opción se acomoda exactamente, podemos diseñar una
          simulación personalizada con tu ejecutivo. Toma 15 minutos y
          revisamos juntos plazos, seguros y opciones de subsidio.
        </p>
        <button
          type="button"
          onClick={() => navigate('/cliente/confirmado?custom=1')}
          className={cn(
            'mt-6 inline-flex items-center gap-2 px-5 py-2.5 text-body-sm font-medium',
            'border border-border-hairline bg-bg-card text-text-primary',
            'hover:border-text-primary',
            'transition-all duration-base ease-out-soft',
          )}
        >
          <Calendar size={14} />
          Pedir simulación personalizada
          <ArrowRight size={14} />
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Scenario Card
// ─────────────────────────────────────────────────────────────

function ScenarioCard({
  scenario,
  isHovered,
  onHover,
  onLeave,
  onChoose,
}: {
  scenario: Scenario;
  isHovered: boolean;
  onHover: () => void;
  onLeave: () => void;
  onChoose: () => void;
}) {
  return (
    <div onMouseEnter={onHover} onMouseLeave={onLeave}>
      <Card
        padding="lg"
        className={cn(
          'h-full flex flex-col transition-all duration-base ease-out-soft',
          scenario.isCustom && 'border-accent border-2 shadow-soft',
          scenario.recommended && !scenario.isCustom && 'border-accent/40',
          isHovered && 'border-text-primary',
        )}
      >
        <header className="space-y-4">
          <div className="flex items-start justify-between gap-3">
            <span
              aria-hidden
              className={cn(
                'flex items-center justify-center w-10 h-10',
                scenario.isCustom
                  ? 'bg-accent text-text-inverse'
                  : scenario.recommended
                  ? 'bg-accent text-text-inverse'
                  : 'bg-bg-sunken text-text-secondary',
              )}
            >
              {scenario.icon}
            </span>
            {scenario.isCustom && (
              <Pill variant="error" size="sm">
                <span className="inline-flex items-center gap-1">
                  <Star size={10} aria-hidden />
                  Tu plazo elegido
                </span>
              </Pill>
            )}
            {scenario.recommended && !scenario.isCustom && (
              <Pill variant="error" size="sm">
                <span className="inline-flex items-center gap-1">
                  <Star size={10} aria-hidden />
                  Recomendado
                </span>
              </Pill>
            )}
          </div>
          <div>
            <Kicker tone="muted">
              {scenario.isCustom ? 'Personalizado · según tu conversación' : scenario.label}
            </Kicker>
            <div className="mt-2 text-h2 text-text-primary tabular-nums">
              {scenario.termYears} años
            </div>
          </div>
        </header>

        <dl className="mt-8 space-y-3 text-body-sm pt-6 border-t border-border-hairline">
          <Row label="Tasa nominal" value={formatPct(scenario.nominalRate)} />
          <Row label="CAE" value={formatPct(scenario.caeRate)} />
          <Row
            label="Cuota mensual"
            value={
              <span className="text-text-primary font-medium">
                {formatCLP(scenario.monthlyCLP)}
              </span>
            }
            emphasized
          />
          <Row
            label="Costo total estimado"
            value={`UF ${scenario.totalCostUF.toLocaleString('es-CL')}`}
          />
        </dl>

        <section className="mt-8 space-y-4 pt-6 border-t border-border-hairline flex-1">
          <div>
            <Kicker tone="muted" className="block mb-3">
              Lo que ganas
            </Kicker>
            <ul className="space-y-2">
              {scenario.highlights.map((h) => (
                <li key={h} className="flex gap-2 text-body-sm text-text-secondary">
                  <Check
                    size={14}
                    className="text-status-success shrink-0 mt-0.5"
                    aria-hidden
                  />
                  {h}
                </li>
              ))}
            </ul>
          </div>

          {scenario.tradeoffs.length > 0 && (
            <div>
              <Kicker tone="muted" className="block mb-3">
                A considerar
              </Kicker>
              <ul className="space-y-2">
                {scenario.tradeoffs.map((t) => (
                  <li key={t} className="flex gap-2 text-body-sm text-text-secondary">
                    <span
                      aria-hidden
                      className="w-1.5 h-1.5 rounded-full bg-text-muted shrink-0 mt-2"
                    />
                    {t}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>

        <button
          type="button"
          onClick={onChoose}
          className={cn(
            'mt-8 inline-flex items-center justify-center gap-2 px-5 py-3 text-body font-medium w-full',
            (scenario.recommended || scenario.isCustom)
              ? 'bg-accent text-text-inverse hover:bg-accent-muted'
              : 'border border-border-hairline bg-bg-card text-text-primary hover:border-text-primary',
            'transition-all duration-base ease-out-soft',
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:ring-offset-2',
          )}
        >
          Elegir esta opción
          <ArrowRight size={14} />
        </button>
      </Card>
    </div>
  );
}

function Row({
  label,
  value,
  emphasized,
}: {
  label: string;
  value: React.ReactNode;
  emphasized?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="text-text-muted">{label}</dt>
      <dd
        className={cn(
          'tabular-nums',
          emphasized ? 'text-text-primary' : 'text-text-secondary',
        )}
      >
        {value}
      </dd>
    </div>
  );
}
