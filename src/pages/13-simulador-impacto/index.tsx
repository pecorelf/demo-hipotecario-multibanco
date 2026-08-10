/**
 * Simulador de Impacto · Rediseño Hipotecario {BRAND.shortName}
 *
 * Vista de "sala de decisión" pensada para presentaciones al GG
 * la gerencia general y al comité ejecutivo. NO es una vista de cliente.
 *
 * Mide el impacto económico del rediseño del proceso hipotecario
 * sobre el funnel de conversión 8.000 → 1.000 que Valentina Ossa
 * confirmó en la reunión del 09/06/2026.
 *
 * Modelo determinístico, sin llamadas a Claude. Cálculo client-side
 * para que sea instantáneo y predecible en vivo.
 *
 * Permite exportar a PDF usando window.print() con estilos dedicados.
 */

import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowDown,
  ChevronLeft,
  Download,
  Printer,
  RotateCcw,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import { Kicker, PageTitle } from '@/components/ui';
import { cn } from '@/lib/cn';
import { BRAND } from '@/lib/brand';

// ─── Parámetros del modelo ──────────────────────────────────────
//
// Estos valores son la base del caso de negocio. Si cambian los
// supuestos, se ajustan aquí en un solo lugar.
//
// Fuente de los volúmenes: Valentina Ossa ({BRAND.shortName}), reunión
// del 09/06/2026.
// Fuente de ticket promedio y spread: estimaciones validadas con
// Andrés Fuenzalida (Nuestra consultora) para hipotecas {BRAND.name}.

const APPROVALS_PER_MONTH = 8_000;
const BASELINE_CURSED_PER_MONTH = 1_000;
const BASELINE_CONVERSION = BASELINE_CURSED_PER_MONTH / APPROVALS_PER_MONTH; // 12,5%
const MAX_CONVERSION = 0.25; // techo creíble del rediseño completo
const UF_TO_CLP = 40_425;
const TICKET_UF = 4_500;
const SPREAD_ANNUAL = 0.0375; // 3,75%
const NPV_FACTOR = 12; // anualidad descontada a 8% por 25 años

// Pesos de cada palanca sobre la mejora de conversión
const LEVER_WEIGHTS = {
  reparos: 0.40,         // reducción tiempo de reparos
  proactivo: 0.35,       // seguimiento proactivo de aprobados
  documental: 0.25,      // fricción documental
};

// Etapas del funnel actual (porcentajes que sobreviven)
// Los valores reflejan el funnel real implícito en 8.000 → 1.000.
const BASELINE_FUNNEL = [
  { stage: 'Aprobaciones del comité', survival: 1.0, label: 'inicio' },
  { stage: `Cliente formaliza con ${BRAND.shortName}`, survival: 0.40, label: '−60%' },
  { stage: 'Documentación completa', survival: 0.25, label: '−37%' },
  { stage: 'Reparos resueltos', survival: 0.175, label: '−30%' },
  { stage: 'Hipotecas cursadas', survival: 0.125, label: '−29%' },
];

// ─── Componente principal ───────────────────────────────────────

export default function SimuladorImpacto() {
  const navigate = useNavigate();
  const [reparos, setReparos] = useState(30);
  const [proactivo, setProactivo] = useState(25);
  const [documental, setDocumental] = useState(35);

  const reset = () => {
    setReparos(30);
    setProactivo(25);
    setDocumental(35);
  };

  // ─── Cálculo del modelo ───────────────────────────────────────
  const model = useMemo(() => {
    // Mejora total normalizada (0-1) ponderada por los pesos
    const improvementScore =
      (reparos / 100) * LEVER_WEIGHTS.reparos +
      (proactivo / 100) * LEVER_WEIGHTS.proactivo +
      (documental / 100) * LEVER_WEIGHTS.documental;
    // El score normalizado va de 0 a 0.5 (si los 3 al 50%, score = 0.5)
    // Lo escalamos para que 0.5 = MAX_CONVERSION
    const conversionGain = (improvementScore / 0.5) * (MAX_CONVERSION - BASELINE_CONVERSION);
    const projectedConversion = Math.min(MAX_CONVERSION, BASELINE_CONVERSION + conversionGain);

    const projectedCursedPerMonth = Math.round(APPROVALS_PER_MONTH * projectedConversion);
    const additionalCursedPerMonth = projectedCursedPerMonth - BASELINE_CURSED_PER_MONTH;

    // Valor económico
    const ticketCLP = TICKET_UF * UF_TO_CLP; // ~$181.9M CLP
    const newVolumeMonthlyCLP = additionalCursedPerMonth * ticketCLP;
    const spreadYear1MonthlyCLP = newVolumeMonthlyCLP * SPREAD_ANNUAL;
    const spreadAnnualCLP = spreadYear1MonthlyCLP * 12;
    const npvTotalCLP = spreadAnnualCLP * NPV_FACTOR;

    // ROI vs inversión estimada Nuestra consultora (CLP 500MM)
    const deloitteInvestmentCLP = 500_000_000;
    const roi = npvTotalCLP / deloitteInvestmentCLP;

    return {
      projectedConversion,
      projectedCursedPerMonth,
      additionalCursedPerMonth,
      newVolumeMonthlyCLP,
      spreadYear1MonthlyCLP,
      spreadAnnualCLP,
      npvTotalCLP,
      roi,
      ticketCLP,
    };
  }, [reparos, proactivo, documental]);

  // Funnel proyectado: distribuye la mejora proporcionalmente
  const projectedFunnel = useMemo(() => {
    const ratio = model.projectedConversion / BASELINE_CONVERSION;
    return BASELINE_FUNNEL.map((s, i) => {
      if (i === 0) return s; // aprobaciones no cambian
      // La mejora se aplica progresivamente más a las etapas finales
      const stageBoost = 1 + (ratio - 1) * (i / (BASELINE_FUNNEL.length - 1));
      const newSurvival = Math.min(1, s.survival * stageBoost);
      return { ...s, survival: newSurvival };
    });
  }, [model.projectedConversion]);

  return (
    <div className="max-w-shell mx-auto px-6 md:px-10 lg:px-14 py-8 lg:py-12 simulador-root">
      {/* HEADER · oculto al imprimir */}
      <div className="print:hidden mb-8 flex items-center justify-between gap-4 flex-wrap">
        <button
          onClick={() => navigate('/')}
          className="inline-flex items-center gap-1.5 text-body-sm text-text-secondary hover:text-text-primary"
        >
          <ChevronLeft size={14} />
          Volver al inicio
        </button>
        <div className="flex items-center gap-2">
          <button
            onClick={reset}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-border-hairline text-body-sm hover:bg-bg-sunken transition-colors"
            title="Volver a valores por defecto"
          >
            <RotateCcw size={12} />
            Restablecer
          </button>
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-text-primary text-text-inverse text-body-sm font-medium hover:bg-accent transition-colors"
          >
            <Printer size={14} />
            Exportar a PDF
          </button>
        </div>
      </div>

      {/* BLOQUE 1 — Hero Statement */}
      <section className="border-y border-border-hairline py-10 lg:py-14">
        <Kicker>Caso de Negocio · Rediseño Hipotecario {BRAND.shortName}</Kicker>
        <div className="mt-4 flex items-baseline gap-4 lg:gap-8 flex-wrap">
          <NumberHero value="8.000" label="aprobaciones / mes" />
          <ArrowDown size={28} className="text-text-muted hidden md:block" />
          <span className="text-text-muted text-h2 hidden lg:inline">→</span>
          <NumberHero value="1.000" label="hipotecas cursadas / mes" muted />
        </div>
        <div className="mt-6 max-w-3xl">
          <div className="text-body-lg text-text-primary leading-relaxed">
            <span className="font-semibold">12,5% de conversión actual.</span>{' '}
            El 87,5% de las aprobaciones no termina en hipoteca cursada.
          </div>
          <div className="text-body text-text-secondary mt-2 leading-relaxed">
            El rediseño ataca esa brecha. Mové las palancas para ver el
            impacto económico proyectado de Nuestra consultora sobre el funnel.
          </div>
        </div>
      </section>

      {/* BLOQUE 2 + 3 — Funnel + Controles */}
      <section className="mt-10 grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* FUNNEL */}
        <div className="lg:col-span-3">
          <h2 className="text-h3 font-semibold text-text-primary mb-1">
            Funnel proyectado
          </h2>
          <p className="text-body-sm text-text-secondary mb-6">
            Comparativa entre el estado actual y la proyección con el rediseño.
          </p>
          <div className="space-y-3">
            {BASELINE_FUNNEL.map((stage, i) => (
              <FunnelStage
                key={i}
                stage={stage.stage}
                baselineSurvival={stage.survival}
                projectedSurvival={projectedFunnel[i].survival}
                approvals={APPROVALS_PER_MONTH}
                isFirst={i === 0}
              />
            ))}
          </div>
        </div>

        {/* CONTROLES */}
        <div className="lg:col-span-2">
          <h2 className="text-h3 font-semibold text-text-primary mb-1">
            Palancas de mejora
          </h2>
          <p className="text-body-sm text-text-secondary mb-6">
            Cada palanca representa una capacidad del rediseño Nuestra consultora.
          </p>
          <div className="space-y-7">
            <LeverSlider
              label="Reducción del tiempo de reparos"
              hint="Hoy: 5 a 7 días por reparo. Sin SLA fijo."
              value={reparos}
              onChange={setReparos}
              weight="40%"
            />
            <LeverSlider
              label="Seguimiento proactivo de aprobaciones"
              hint="Hoy: sin alertas automáticas al ejecutivo."
              value={proactivo}
              onChange={setProactivo}
              weight="35%"
            />
            <LeverSlider
              label="Reducción de fricción documental"
              hint="Hoy: el cliente reenvía cada documento 2,3 veces en promedio."
              value={documental}
              onChange={setDocumental}
              weight="25%"
            />
          </div>
        </div>
      </section>

      {/* BLOQUE 4 — KPIs proyectados */}
      <section className="mt-12">
        <div className="flex items-center gap-2 mb-1">
          <Sparkles size={16} className="text-accent" />
          <Kicker>Impacto económico proyectado</Kicker>
        </div>
        <h2 className="text-h2 font-semibold text-text-primary mb-6">
          Con las palancas activas, {BRAND.shortName} recupera:
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          <KpiCard
            label="Hipotecas adicionales"
            value={`+${formatNum(model.additionalCursedPerMonth)}`}
            unit="por mes"
            highlight
          />
          <KpiCard
            label="Conversión proyectada"
            value={`${(model.projectedConversion * 100).toFixed(1)}%`}
            unit={`vs 12,5% actual`}
          />
          <KpiCard
            label="Spread anual recurrente"
            value={`$${formatMM(model.spreadAnnualCLP)}`}
            unit="MM CLP / año (año 1)"
            highlight
          />
          <KpiCard
            label="Valor presente neto (25 años)"
            value={`$${formatMM(model.npvTotalCLP)}`}
            unit="MM CLP · NPV"
          />
        </div>

        {/* ROI banner */}
        <div className="mt-5 border border-accent/30 bg-bg-card p-5 flex items-center gap-4 flex-wrap">
          <TrendingUp size={22} className="text-accent flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="text-caption uppercase tracking-[0.1em] text-text-muted">
              Retorno sobre inversión
            </div>
            <div className="text-h3 font-semibold text-text-primary mt-1">
              ROI de {model.roi.toFixed(1)}x sobre la inversión estimada de
              Nuestra consultora (CLP 500 MM)
            </div>
          </div>
        </div>
      </section>

      {/* BLOQUE 5 — Antes / Después */}
      <section className="mt-12 pt-10 border-t border-border-hairline">
        <Kicker>Más allá de los números</Kicker>
        <h2 className="text-h3 font-semibold text-text-primary mt-2 mb-6">
          Cambios operativos del rediseño
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
          <BeforeAfter
            label="Tiempo promedio del proceso"
            before="47 días"
            after="21 días"
          />
          <BeforeAfter
            label="Idas y vueltas con el cliente"
            before="6 ciclos"
            after="2 ciclos"
          />
          <BeforeAfter
            label="Alertas al ejecutivo"
            before="Sin alertas"
            after="Automáticas"
          />
          <BeforeAfter
            label="SLA de reparos"
            before="Difuso"
            after="24 horas"
          />
        </div>
      </section>

      {/* FOOTER · disclaimer */}
      <section className="mt-12 pt-6 border-t border-border-hairline">
        <p className="text-caption text-text-muted leading-relaxed max-w-3xl">
          Modelo proyectado · Estimaciones basadas en volumen de aprobaciones
          mensuales confirmado por equipo {BRAND.shortName} (8.000), ticket promedio
          de UF 4.500 y spread anual de 3,75%. Valor presente neto calculado
          con anualidad descontada al 8% sobre plazo de 25 años (factor 12).
          Cifras de referencia para discusión de caso de negocio, no constituyen
          proyección financiera vinculante.
        </p>
      </section>

      {/* Estilos solo para impresión */}
      <style>{`
        @media print {
          @page { size: A4 landscape; margin: 12mm; }
          body { background: white !important; }
          .print\\:hidden { display: none !important; }
          .simulador-root { padding: 0 !important; max-width: 100% !important; }
        }
      `}</style>
    </div>
  );
}

// ─── Subcomponentes ─────────────────────────────────────────────

function NumberHero({ value, label, muted }: { value: string; label: string; muted?: boolean }) {
  return (
    <div>
      <div className={cn(
        'text-6xl lg:text-7xl font-bold tabular-nums leading-none',
        muted ? 'text-text-secondary' : 'text-accent',
      )}>
        {value}
      </div>
      <div className="text-caption uppercase tracking-[0.1em] text-text-muted mt-2">
        {label}
      </div>
    </div>
  );
}

function FunnelStage({
  stage,
  baselineSurvival,
  projectedSurvival,
  approvals,
  isFirst,
}: {
  stage: string;
  baselineSurvival: number;
  projectedSurvival: number;
  approvals: number;
  isFirst: boolean;
}) {
  const baselineVol = Math.round(approvals * baselineSurvival);
  const projectedVol = Math.round(approvals * projectedSurvival);
  const improvement = projectedVol - baselineVol;

  return (
    <div className="border border-border-hairline bg-bg-card p-4">
      <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
        <div className="text-body-sm font-medium text-text-primary">{stage}</div>
        {!isFirst && improvement > 0 && (
          <div className="text-caption text-accent font-medium">
            +{formatNum(improvement)} con rediseño
          </div>
        )}
      </div>
      {/* Doble barra: baseline + projected */}
      <div className="space-y-1.5">
        <BarRow
          label="Hoy"
          value={baselineVol}
          max={approvals}
          color="bg-text-secondary/40"
        />
        <BarRow
          label="Proyectado"
          value={projectedVol}
          max={approvals}
          color="bg-accent"
        />
      </div>
    </div>
  );
}

function BarRow({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = (value / max) * 100;
  return (
    <div className="flex items-center gap-3">
      <div className="text-caption text-text-muted min-w-[70px]">{label}</div>
      <div className="flex-1 h-5 bg-bg-sunken relative">
        <div
          className={cn('h-full transition-all duration-300', color)}
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="text-caption tabular-nums text-text-primary min-w-[55px] text-right font-medium">
        {formatNum(value)}
      </div>
    </div>
  );
}

function LeverSlider({
  label,
  hint,
  value,
  onChange,
  weight,
}: {
  label: string;
  hint: string;
  value: number;
  onChange: (v: number) => void;
  weight: string;
}) {
  return (
    <div>
      <div className="flex items-baseline justify-between gap-2 mb-1">
        <label className="text-body-sm font-medium text-text-primary">{label}</label>
        <div className="text-caption text-text-muted">
          peso {weight}
        </div>
      </div>
      <p className="text-caption text-text-muted mb-3 leading-relaxed">{hint}</p>
      <div className="flex items-center gap-3">
        <input
          type="range"
          min="0"
          max="50"
          step="5"
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="flex-1 accent-accent"
        />
        <div className="min-w-[50px] text-right text-h3 font-semibold text-accent tabular-nums">
          {value}%
        </div>
      </div>
    </div>
  );
}

function KpiCard({
  label,
  value,
  unit,
  highlight,
}: {
  label: string;
  value: string;
  unit: string;
  highlight?: boolean;
}) {
  return (
    <div className={cn(
      'p-5 border',
      highlight ? 'border-accent bg-bg-card' : 'border-border-hairline bg-bg-card',
    )}>
      <div className="text-caption uppercase tracking-[0.1em] text-text-muted">
        {label}
      </div>
      <div className={cn(
        'mt-2 text-3xl lg:text-4xl font-bold tabular-nums leading-none',
        highlight ? 'text-accent' : 'text-text-primary',
      )}>
        {value}
      </div>
      <div className="text-caption text-text-secondary mt-2">
        {unit}
      </div>
    </div>
  );
}

function BeforeAfter({ label, before, after }: { label: string; before: string; after: string }) {
  return (
    <div className="border border-border-hairline bg-bg-card p-4">
      <div className="text-caption uppercase tracking-[0.1em] text-text-muted">{label}</div>
      <div className="mt-3 space-y-2">
        <div>
          <div className="text-caption text-text-muted">Hoy</div>
          <div className="text-body text-text-secondary line-through decoration-text-muted/40">
            {before}
          </div>
        </div>
        <div>
          <div className="text-caption text-accent font-medium">Con Nuestra consultora</div>
          <div className="text-body text-text-primary font-semibold">{after}</div>
        </div>
      </div>
    </div>
  );
}

// ─── Helpers de formato ─────────────────────────────────────────

function formatNum(n: number): string {
  return n.toLocaleString('es-CL');
}

/** Convierte CLP a millones con formato chileno: 48500000000 → "48.500" */
function formatMM(clp: number): string {
  const mm = clp / 1_000_000;
  if (mm >= 1000) {
    return formatNum(Math.round(mm));
  }
  return mm.toFixed(0);
}
