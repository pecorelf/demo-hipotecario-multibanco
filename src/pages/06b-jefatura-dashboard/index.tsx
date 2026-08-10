import { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  Check,
  ChevronRight,
  MessageSquare,
  Minus,
  Send,
  Sparkles,
  TrendingUp,
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
import { AiCursor, AiMessage, UserMessage } from '@/components/ai';
import { ClaudeApiError, streamClaude } from '@/lib/claude';
import {
  JEFATURA_CHAT_SYSTEM,
  buildJefaturaChatPrompt,
  type JefaturaChatSnapshot,
} from '@/lib/prompts/jefaturaChat';
import { cn } from '@/lib/cn';
import { formatCLP } from '@/lib/format';
import { CompetitiveRadarSection } from './CompetitiveRadar';

// ─────────────────────────────────────────────────────────────
// Mock data
// ─────────────────────────────────────────────────────────────

const KPIS = {
  quarterlyVolume: 742,
  quarterlyVolumeDelta: 12.4,
  conversion: 0.64,
  conversionDelta: 3.2,
  nps: 4.4,
  npsDelta: 0.3,
  costPerCaseCLP: 312_000,
  costPerCaseDelta: -8.6,
  avgTimeDays: 87,
  avgTimeDelta: -6,
  fteUtilization: 0.78,
};

interface ExecMember {
  name: string;
  role: string;
  pipeline: number;
  closedThisWeek: number;
  closedThisQuarter: number;
  avgDays: number;
  satisfaction: number;
  casesInRisk: number;
  productivityTrend: number; // pct
  initials: string;
}

const TEAM: ExecMember[] = [
  {
    name: 'Tomás Henríquez',
    role: 'Ejecutivo senior',
    pipeline: 23,
    closedThisWeek: 11,
    closedThisQuarter: 142,
    avgDays: 72,
    satisfaction: 4.9,
    casesInRisk: 1,
    productivityTrend: 14,
    initials: 'TH',
  },
  {
    name: 'Camila Reinoso',
    role: 'Ejecutiva',
    pipeline: 19,
    closedThisWeek: 7,
    closedThisQuarter: 98,
    avgDays: 82,
    satisfaction: 4.6,
    casesInRisk: 3,
    productivityTrend: 4,
    initials: 'YM',
  },
  {
    name: 'Valentina Ossa',
    role: 'Ejecutiva',
    pipeline: 21,
    closedThisWeek: 8,
    closedThisQuarter: 112,
    avgDays: 79,
    satisfaction: 4.7,
    casesInRisk: 2,
    productivityTrend: 7,
    initials: 'DSM',
  },
  {
    name: 'Diego Norambuena',
    role: 'Ejecutivo',
    pipeline: 28,
    closedThisWeek: 4,
    closedThisQuarter: 67,
    avgDays: 103,
    satisfaction: 3.9,
    casesInRisk: 9,
    productivityTrend: -11,
    initials: 'DN',
  },
];

const BOTTLENECKS = [
  { phase: 'Evaluación', cases: 42, avgDays: 2, targetDays: 3 },
  { phase: 'Documentación', cases: 78, avgDays: 8, targetDays: 10 },
  { phase: 'Estudio de títulos', cases: 89, avgDays: 14, targetDays: 7 },
  { phase: 'Escritura y firma', cases: 38, avgDays: 4, targetDays: 5 },
];

const REJECTIONS = [
  { reason: 'Inconsistencia ingreso declarado vs cotizado', count: 14 },
  { reason: 'Tasación bajo monto solicitado', count: 9 },
  { reason: 'Carga financiera fuera de política', count: 7 },
  { reason: 'Antecedentes comerciales', count: 5 },
];

const SNAPSHOT: JefaturaChatSnapshot = {
  ...KPIS,
  team: TEAM.map((t) => ({
    name: t.name,
    closedThisWeek: t.closedThisWeek,
    avgDays: t.avgDays,
    satisfaction: t.satisfaction,
    casesInRisk: t.casesInRisk,
  })),
  bottlenecks: BOTTLENECKS,
  topRejections: REJECTIONS,
  derivationsPending: 6,
};

const SUGGESTED_QUESTIONS = [
  '¿Dónde tenemos la mayor fuga del funnel?',
  '¿Qué oportunidad comercial ves esta semana?',
  '¿Cómo balanceo la carga del equipo?',
  '¿Qué campaña lanzaría para mover la conversión?',
];

// ─────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────

export default function JefaturaDashboard() {
  const [chatOpen, setChatOpen] = useState(false);
  const [selectedExec, setSelectedExec] = useState<ExecMember | null>(null);

  return (
    <div className="relative">
      <div
        className={cn(
          'transition-all duration-base ease-out-soft',
          chatOpen ? 'lg:mr-[420px]' : 'lg:mr-0',
        )}
      >
        <div className="max-w-shell mx-auto px-6 md:px-10 lg:px-16 py-12 lg:py-16">
          <Header onOpenChat={() => setChatOpen(true)} chatOpen={chatOpen} />

          <div className="mt-12 space-y-16">
            <KpisBand />
            <hr className="border-t border-border-hairline" />
            <TeamSection
              team={TEAM}
              onSelect={(e) => setSelectedExec(e)}
              selected={selectedExec}
            />
            <hr className="border-t border-border-hairline" />
            <ProcessHealthSection />
            <hr className="border-t border-border-hairline" />
            <TransformationInitiatives />
            <hr className="border-t border-border-hairline" />
            <CompetitiveRadarSection />
          </div>
        </div>
      </div>

      {chatOpen && (
        <ChatPanel
          snapshot={SNAPSHOT}
          onClose={() => setChatOpen(false)}
        />
      )}

      {selectedExec && (
        <ExecDrawer
          exec={selectedExec}
          onClose={() => setSelectedExec(null)}
        />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Header
// ─────────────────────────────────────────────────────────────

function Header({
  onOpenChat,
  chatOpen,
}: {
  onOpenChat: () => void;
  chatOpen: boolean;
}) {
  return (
    <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
      <div className="max-w-2xl">
        <Kicker>Vista Ejecutiva de Producto · Macarena Ibáñez y Rodrigo Valdés</Kicker>
        <PageTitle className="mt-3">Salud del proceso hipotecario</PageTitle>
        <p className="text-body-lg text-text-secondary mt-3 max-w-measure">
          Vista consolidada del trimestre. KPIs ejecutivos arriba, equipo en el
          medio, salud del proceso abajo. Tenés a Aurora a la derecha para
          consultas sobre los datos.
        </p>
      </div>

      {!chatOpen && (
        <button
          type="button"
          onClick={onOpenChat}
          className={cn(
            'inline-flex items-center gap-2 px-5 py-2.5 text-body-sm font-medium',
            'border border-border-hairline bg-bg-card text-text-primary',
            'hover:border-accent hover:text-accent',
            'transition-all duration-base ease-out-soft shrink-0',
          )}
        >
          <Sparkles size={14} />
          Preguntar a Aurora
        </button>
      )}
    </header>
  );
}

// ─────────────────────────────────────────────────────────────
// KPIs ejecutivos
// ─────────────────────────────────────────────────────────────

function KpisBand() {
  return (
    <section>
      <div className="flex items-baseline justify-between">
        <SectionTitle rule={false}>KPIs del trimestre en curso</SectionTitle>
        <span className="text-caption uppercase tracking-[0.14em] text-text-muted">
          Q2 2026 vs Q1 2026
        </span>
      </div>
      <div className="mt-8 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-x-8 gap-y-10">
        <KpiCell
          label="Volumen"
          value={KPIS.quarterlyVolume.toLocaleString('es-CL')}
          unit="casos"
          delta={KPIS.quarterlyVolumeDelta}
          deltaUnit="%"
          positiveIsGood
        />
        <KpiCell
          label="Conversión"
          value={Math.round(KPIS.conversion * 100).toString()}
          unit="%"
          delta={KPIS.conversionDelta}
          deltaUnit="pts"
          positiveIsGood
        />
        <KpiCell
          label="NPS proceso"
          value={KPIS.nps.toFixed(1)}
          unit="/5"
          delta={KPIS.npsDelta}
          deltaUnit=""
          positiveIsGood
        />
        <KpiCell
          label="Costo por caso"
          value={formatCLP(KPIS.costPerCaseCLP)}
          unit=""
          delta={KPIS.costPerCaseDelta}
          deltaUnit="%"
          positiveIsGood={false}
        />
        <KpiCell
          label="Tiempo promedio"
          value={KPIS.avgTimeDays.toString()}
          unit="días"
          delta={KPIS.avgTimeDelta}
          deltaUnit="d"
          positiveIsGood={false}
        />
        <KpiCell
          label="Utilización FTE"
          value={Math.round(KPIS.fteUtilization * 100).toString()}
          unit="%"
          delta={null}
          hint="meta: 80%"
        />
      </div>
    </section>
  );
}

function KpiCell({
  label,
  value,
  unit,
  delta,
  deltaUnit,
  positiveIsGood,
  hint,
}: {
  label: string;
  value: string;
  unit?: string;
  delta?: number | null;
  deltaUnit?: string;
  positiveIsGood?: boolean;
  hint?: string;
}) {
  const showDelta = delta !== null && delta !== undefined;
  const isPositiveDelta = showDelta && delta > 0;
  const isNegativeDelta = showDelta && delta < 0;
  const isGoodChange =
    (isPositiveDelta && positiveIsGood) ||
    (isNegativeDelta && positiveIsGood === false);

  return (
    <div>
      <div className="text-caption uppercase tracking-[0.14em] text-text-muted">
        {label}
      </div>
      <div className="mt-2 flex items-baseline gap-1">
        <span className="text-h2 text-text-primary tabular-nums">{value}</span>
        {unit && <span className="text-body-sm text-text-muted">{unit}</span>}
      </div>
      <div className="mt-2 min-h-[20px]">
        {showDelta ? (
          <span
            className={cn(
              'inline-flex items-center gap-1 text-caption tabular-nums',
              isGoodChange ? 'text-status-success' : 'text-status-warning',
            )}
          >
            {delta > 0 ? (
              <ArrowUpRight size={12} aria-hidden />
            ) : delta < 0 ? (
              <ArrowDownRight size={12} aria-hidden />
            ) : (
              <Minus size={12} aria-hidden />
            )}
            {delta > 0 ? '+' : ''}
            {Number.isInteger(delta) ? delta : delta.toFixed(1)}
            {deltaUnit}
          </span>
        ) : hint ? (
          <span className="text-caption text-text-muted">{hint}</span>
        ) : null}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Team
// ─────────────────────────────────────────────────────────────

function TeamSection({
  team,
  onSelect,
  selected,
}: {
  team: ExecMember[];
  onSelect: (e: ExecMember) => void;
  selected: ExecMember | null;
}) {
  const topPerformer = useMemo(
    () =>
      team.reduce((best, cur) =>
        cur.closedThisQuarter > best.closedThisQuarter ? cur : best,
      ),
    [team],
  );

  return (
    <section>
      <SectionTitle rule={false}>Mi equipo</SectionTitle>
      <p className="text-body text-text-secondary mt-3 max-w-measure">
        Cuatro ejecutivos comerciales. Click en cualquiera para ver detalle.
        Tomás Henríquez lidera el trimestre.
      </p>
      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
        {team.map((exec) => (
          <ExecCard
            key={exec.name}
            exec={exec}
            isTop={exec.name === topPerformer.name}
            isSelected={selected?.name === exec.name}
            onClick={() => onSelect(exec)}
          />
        ))}
      </div>
    </section>
  );
}

function ExecCard({
  exec,
  isTop,
  isSelected,
  onClick,
}: {
  exec: ExecMember;
  isTop: boolean;
  isSelected: boolean;
  onClick: () => void;
}) {
  const hasRisk = exec.casesInRisk >= 5;
  const lowTrend = exec.productivityTrend < 0;

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'text-left group',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:ring-offset-2',
      )}
    >
      <Card
        padding="lg"
        className={cn(
          'h-full transition-all duration-base ease-out-soft',
          'group-hover:border-text-primary',
          isSelected && 'border-accent/40',
          isTop && !isSelected && 'border-status-success/30',
        )}
      >
        <header className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <span
              aria-hidden
              className={cn(
                'flex items-center justify-center w-11 h-11 text-body-sm font-medium tabular-nums shrink-0',
                isTop
                  ? 'bg-status-success-bg text-status-success'
                  : 'bg-bg-sunken text-text-secondary',
              )}
            >
              {exec.initials}
            </span>
            <div>
              <div className="text-h3 text-text-primary">{exec.name}</div>
              <div className="text-caption text-text-muted mt-0.5">
                {exec.role}
              </div>
            </div>
          </div>
          {isTop && (
            <Pill variant="success" size="sm">
              Top trimestre
            </Pill>
          )}
          {hasRisk && !isTop && (
            <Pill variant="warning" size="sm">
              <span className="inline-flex items-center gap-1">
                <AlertTriangle size={10} aria-hidden />
                Atención
              </span>
            </Pill>
          )}
        </header>

        <dl className="mt-6 grid grid-cols-3 gap-x-4 gap-y-3 pt-6 border-t border-border-hairline">
          <MiniStat label="Pipeline" value={exec.pipeline} />
          <MiniStat label="Cerrados/sem" value={exec.closedThisWeek} />
          <MiniStat label="Días prom" value={exec.avgDays} />
          <MiniStat label="NPS" value={exec.satisfaction.toFixed(1)} suffix="/5" />
          <MiniStat
            label="Riesgo"
            value={exec.casesInRisk}
            tone={hasRisk ? 'warning' : undefined}
          />
          <MiniStat
            label="Tendencia"
            value={`${exec.productivityTrend > 0 ? '+' : ''}${exec.productivityTrend}%`}
            tone={lowTrend ? 'warning' : exec.productivityTrend > 5 ? 'success' : undefined}
          />
        </dl>

        <div className="mt-6 pt-4 border-t border-border-hairline inline-flex items-center gap-2 text-caption text-text-muted group-hover:text-text-primary transition-colors duration-base">
          Ver detalle
          <ChevronRight size={12} />
        </div>
      </Card>
    </button>
  );
}

function MiniStat({
  label,
  value,
  suffix,
  tone,
}: {
  label: string;
  value: number | string;
  suffix?: string;
  tone?: 'success' | 'warning';
}) {
  return (
    <div>
      <dt className="text-caption text-text-muted">{label}</dt>
      <dd
        className={cn(
          'text-body font-medium tabular-nums mt-0.5',
          tone === 'success' && 'text-status-success',
          tone === 'warning' && 'text-status-warning',
          !tone && 'text-text-primary',
        )}
      >
        {value}
        {suffix && <span className="text-body-sm text-text-muted">{suffix}</span>}
      </dd>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Process health (bottlenecks + rejections)
// ─────────────────────────────────────────────────────────────

function ProcessHealthSection() {
  return (
    <section>
      <SectionTitle rule={false}>Salud del proceso</SectionTitle>
      <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card padding="lg">
          <Kicker tone="muted" className="block mb-4">
            Cuellos de botella
          </Kicker>
          <ul className="divide-y divide-border-hairline">
            {BOTTLENECKS.map((b) => {
              const overTarget = b.avgDays > b.targetDays;
              return (
                <li key={b.phase} className="py-4 first:pt-0 last:pb-0">
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="text-body text-text-primary">{b.phase}</span>
                    <span
                      className={cn(
                        'text-body-sm tabular-nums',
                        overTarget ? 'text-status-warning' : 'text-status-success',
                      )}
                    >
                      {b.avgDays}d / meta {b.targetDays}d
                    </span>
                  </div>
                  <div className="text-caption text-text-muted mt-1 tabular-nums">
                    {b.cases} casos en esta fase
                  </div>
                </li>
              );
            })}
          </ul>
        </Card>

        <Card padding="lg">
          <Kicker tone="muted" className="block mb-4">
            Top razones de rechazo · este mes
          </Kicker>
          <ol className="space-y-3">
            {REJECTIONS.map((r, i) => (
              <li key={r.reason} className="flex items-baseline gap-3">
                <span className="text-kicker text-text-muted shrink-0 w-6 tabular-nums">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <span className="text-body-sm text-text-primary flex-1">
                  {r.reason}
                </span>
                <span className="text-body-sm text-text-secondary tabular-nums shrink-0">
                  {r.count}
                </span>
              </li>
            ))}
          </ol>
        </Card>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────
// Exec drill-down drawer
// ─────────────────────────────────────────────────────────────

function ExecDrawer({ exec, onClose }: { exec: ExecMember; onClose: () => void }) {
  return (
    <>
      <div
        className="fixed inset-0 bg-bg-overlay z-30 animate-fade-in"
        onClick={onClose}
        aria-hidden
      />
      <aside
        className="fixed right-0 top-0 bottom-0 w-full md:w-[520px] bg-bg-page border-l border-border-hairline z-40 overflow-y-auto animate-slide-in-right"
        role="dialog"
        aria-labelledby="exec-drawer-title"
      >
        {/* Header */}
        <header className="sticky top-0 bg-bg-page border-b border-border-hairline z-10">
          <div className="px-8 md:px-10 py-6 flex items-center justify-between gap-4">
            <Kicker tone="muted">Detalle ejecutivo</Kicker>
            <button
              type="button"
              onClick={onClose}
              className="text-text-muted hover:text-text-primary transition-colors duration-base"
              aria-label="Cerrar"
            >
              <X size={18} />
            </button>
          </div>
        </header>

        {/* Identity */}
        <div className="px-8 md:px-10 py-8 border-b border-border-hairline">
          <div className="flex items-center gap-5">
            <span
              aria-hidden
              className="flex items-center justify-center w-16 h-16 bg-bg-sunken text-text-secondary text-h3 font-medium shrink-0"
            >
              {exec.initials}
            </span>
            <div className="min-w-0">
              <h2 id="exec-drawer-title" className="text-h2 text-text-primary leading-tight">
                {exec.name}
              </h2>
              <p className="text-body-sm text-text-muted mt-1">{exec.role}</p>
            </div>
          </div>
        </div>

        {/* Quarter stats */}
        <section className="px-8 md:px-10 py-8 border-b border-border-hairline">
          <Kicker tone="muted" className="block mb-5">
            Trimestre en curso
          </Kicker>
          <dl className="grid grid-cols-2 gap-x-6 gap-y-6">
            <DrawerStat
              label="Cerrados Q"
              value={exec.closedThisQuarter.toString()}
            />
            <DrawerStat label="Pipeline activo" value={exec.pipeline.toString()} />
            <DrawerStat label="Días promedio" value={`${exec.avgDays} d`} />
            <DrawerStat label="NPS" value={`${exec.satisfaction.toFixed(1)}/5`} />
          </dl>
        </section>

        {/* Risk */}
        <section className="px-8 md:px-10 py-8 border-b border-border-hairline">
          <Kicker tone="muted" className="block mb-4">
            Casos en riesgo
          </Kicker>
          {exec.casesInRisk === 0 ? (
            <div className="inline-flex items-center gap-2 text-body text-status-success">
              <Check size={16} />
              <span>Sin casos en riesgo esta semana</span>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-baseline gap-3">
                <span
                  className={cn(
                    'text-h2 tabular-nums',
                    exec.casesInRisk >= 5
                      ? 'text-status-warning'
                      : 'text-text-primary',
                  )}
                >
                  {exec.casesInRisk}
                </span>
                <span className="text-body-sm text-text-secondary">
                  {exec.casesInRisk === 1 ? 'caso' : 'casos'} con SLA en riesgo
                </span>
              </div>
              <p className="text-body-sm text-text-secondary leading-relaxed max-w-measure">
                Derivaciones pendientes al back office o documentos con
                inconsistencias sin resolver. Conviene revisar uno a uno con
                el ejecutivo.
              </p>
            </div>
          )}
        </section>

        {/* Trend */}
        <section className="px-8 md:px-10 py-8 border-b border-border-hairline">
          <Kicker tone="muted" className="block mb-4">
            Tendencia de productividad
          </Kicker>
          <div className="flex items-baseline gap-3 mb-4">
            <span
              className={cn(
                'inline-flex items-center gap-2 text-stat-lg tabular-nums',
                exec.productivityTrend > 0
                  ? 'text-status-success'
                  : exec.productivityTrend < 0
                    ? 'text-status-warning'
                    : 'text-text-secondary',
              )}
            >
              {exec.productivityTrend > 0 ? (
                <TrendingUp size={20} />
              ) : exec.productivityTrend < 0 ? (
                <ArrowDownRight size={20} />
              ) : (
                <Minus size={20} />
              )}
              {exec.productivityTrend > 0 ? '+' : ''}
              {exec.productivityTrend}%
            </span>
            <span className="text-body-sm text-text-muted">vs últimas 4 semanas</span>
          </div>
          <p className="text-body-sm text-text-secondary leading-relaxed">
            {exec.productivityTrend < 0
              ? 'Caída significativa. Considera una conversación 1:1 esta semana para entender qué está pasando.'
              : exec.productivityTrend > 5
                ? 'Crecimiento consistente. Mantener la carga actual y considerar como mentor para el resto del equipo.'
                : 'Comportamiento estable, dentro del rango esperado.'}
          </p>
        </section>

        {/* Action buttons */}
        <div className="px-8 md:px-10 py-8 space-y-3">
          <button
            type="button"
            className={cn(
              'w-full inline-flex items-center justify-center gap-2 px-5 py-3 text-body-sm font-medium',
              'bg-accent text-text-inverse',
              'hover:bg-accent-muted transition-colors duration-base ease-out-soft',
            )}
          >
            Abrir cola completa de {exec.name.split(' ')[0]}
          </button>
          <button
            type="button"
            className={cn(
              'w-full inline-flex items-center justify-center gap-2 px-5 py-3 text-body-sm',
              'border border-border-hairline bg-bg-card text-text-primary',
              'hover:border-text-primary',
              'transition-all duration-base ease-out-soft',
            )}
          >
            Agendar 1:1 con {exec.name.split(' ')[0]}
          </button>
        </div>
      </aside>
    </>
  );
}

function DrawerStat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-caption uppercase tracking-[0.14em] text-text-muted">
        {label}
      </dt>
      <dd className="text-h2 text-text-primary tabular-nums mt-2">{value}</dd>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Chat Panel — Aurora
// ─────────────────────────────────────────────────────────────

interface ChatTurn {
  role: 'user' | 'assistant';
  content: string;
}

function ChatPanel({
  snapshot,
  onClose,
}: {
  snapshot: JefaturaChatSnapshot;
  onClose: () => void;
}) {
  const [turns, setTurns] = useState<ChatTurn[]>([]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const controllerRef = useRef<AbortController | null>(null);
  const mountedRef = useRef(true);

  // Cleanup on unmount
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      controllerRef.current?.abort();
    };
  }, []);

  // Scroll to bottom when turns or streaming content changes
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [turns]);

  async function sendQuestion(question: string) {
    const trimmed = question.trim();
    if (!trimmed || isStreaming) return;

    // Abort any previous in-flight request
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;

    setError(null);
    setInput('');

    // Build history from existing turns (excluding the new one we're about to add)
    const history: ChatTurn[] = [
      ...turns.slice(-9), // last 9 turns
      { role: 'user', content: trimmed },
    ];

    // Add user turn + empty assistant turn to UI
    setTurns((prev) => [
      ...prev,
      { role: 'user', content: trimmed },
      { role: 'assistant', content: '' },
    ]);
    setIsStreaming(true);

    try {
      // Build the API messages — the LAST user message is wrapped with the snapshot context
      const apiMessages = history.map((t, idx) =>
        idx === history.length - 1
          ? {
              role: 'user' as const,
              content: buildJefaturaChatPrompt(snapshot, t.content),
            }
          : { role: t.role, content: t.content },
      );

      await streamClaude(
        apiMessages,
        JEFATURA_CHAT_SYSTEM,
        (_chunk, full) => {
          if (!mountedRef.current || controller.signal.aborted) return;
          // Update last (assistant) turn's content
          setTurns((prev) => {
            const next = [...prev];
            const lastIdx = next.length - 1;
            if (lastIdx >= 0 && next[lastIdx].role === 'assistant') {
              next[lastIdx] = { ...next[lastIdx], content: full };
            }
            return next;
          });
        },
        {
          signal: controller.signal,
          maxTokens: 700,
          temperature: 0.5,
        },
      );

      if (mountedRef.current && !controller.signal.aborted) {
        setIsStreaming(false);
      }
    } catch (err) {
      const apiErr = err as ClaudeApiError;
      // Silently ignore cancellation
      if (apiErr?.kind === 'cancelled' || controller.signal.aborted) {
        if (mountedRef.current) setIsStreaming(false);
        return;
      }
      if (mountedRef.current) {
        setError(apiErr?.message ?? 'Error inesperado generando la respuesta.');
        setIsStreaming(false);
        // Remove the empty assistant turn we added
        setTurns((prev) => {
          if (prev.length === 0) return prev;
          const last = prev[prev.length - 1];
          if (last.role === 'assistant' && last.content === '') {
            return prev.slice(0, -1);
          }
          return prev;
        });
      }
    }
  }

  return (
    <aside
      className={cn(
        'fixed right-0 top-0 bottom-0 w-full lg:w-[420px]',
        'bg-bg-page border-l border-border-hairline z-30',
        'flex flex-col animate-slide-in-right',
      )}
      role="complementary"
      aria-labelledby="aurora-chat-title"
    >
      <header className="p-5 border-b border-border-hairline flex items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <span
            aria-hidden
            className="flex items-center justify-center w-9 h-9 bg-accent text-text-inverse shrink-0"
          >
            <Sparkles size={16} />
          </span>
          <div className="min-w-0">
            <div id="aurora-chat-title" className="text-body font-medium text-text-primary">
              Aurora
            </div>
            <div className="text-caption text-text-muted truncate">
              Estratega comercial · acceso al snapshot
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="text-text-muted hover:text-text-primary transition-colors duration-base shrink-0"
          aria-label="Cerrar chat"
        >
          <X size={18} />
        </button>
      </header>

      <div className="flex-1 overflow-y-auto p-5 space-y-6">
        {turns.length === 0 ? (
          <EmptyState onPickSuggestion={sendQuestion} />
        ) : (
          turns.map((turn, idx) => {
            const isLast = idx === turns.length - 1;
            const isStreamingThis = isLast && turn.role === 'assistant' && isStreaming;
            if (turn.role === 'user') {
              return <UserMessage key={idx}>{turn.content}</UserMessage>;
            }
            if (turn.content === '' && isStreamingThis) {
              return (
                <div key={idx} className="space-y-2">
                  <Skeleton className="h-3 w-3/5" />
                  <Skeleton className="h-3 w-4/5" />
                  <Skeleton className="h-3 w-2/3" />
                </div>
              );
            }
            return (
              <AiMessage key={idx} label="Aurora" streaming={isStreamingThis}>
                <div className="space-y-3">
                  {turn.content.split(/\n\s*\n/).map((para, i, arr) => (
                    <p key={i} className="whitespace-pre-wrap">
                      {para.trim()}
                      {isStreamingThis && i === arr.length - 1 && <AiCursor />}
                    </p>
                  ))}
                </div>
              </AiMessage>
            );
          })
        )}
        <div ref={bottomRef} aria-hidden />
      </div>

      <footer className="p-5 border-t border-border-hairline shrink-0">
        {error && (
          <p className="text-caption text-status-error mb-3">{error}</p>
        )}
        <div className="flex gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendQuestion(input);
              }
            }}
            placeholder="Pregunta sobre los datos…"
            rows={2}
            disabled={isStreaming}
            className={cn(
              'flex-1 bg-bg-card border border-border-hairline',
              'px-3 py-2 text-body-sm text-text-primary',
              'focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/15',
              'resize-none disabled:opacity-50',
            )}
          />
          <button
            type="button"
            onClick={() => sendQuestion(input)}
            disabled={!input.trim() || isStreaming}
            className={cn(
              'inline-flex items-center justify-center p-3 shrink-0',
              'bg-accent text-text-inverse',
              'hover:bg-accent-muted transition-colors duration-base',
              'disabled:opacity-40 disabled:cursor-not-allowed',
            )}
            aria-label="Enviar pregunta"
          >
            <Send size={14} />
          </button>
        </div>
        <p className="text-caption text-text-muted mt-2">
          Enter para enviar · Shift+Enter para nueva línea
        </p>
      </footer>
    </aside>
  );
}

function EmptyState({
  onPickSuggestion,
}: {
  onPickSuggestion: (q: string) => void;
}) {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="space-y-3">
        <span
          aria-hidden
          className="inline-flex items-center justify-center w-10 h-10 bg-accent/10 text-accent"
        >
          <MessageSquare size={18} />
        </span>
        <h3 className="text-h3 text-text-primary">¿Qué necesitas mover hoy?</h3>
        <p className="text-body-sm text-text-secondary">
          Analizo los datos del dashboard y te propongo acciones comerciales
          concretas. Algunas preguntas típicas para empezar:
        </p>
      </div>
      <ul className="space-y-2">
        {SUGGESTED_QUESTIONS.map((q) => (
          <li key={q}>
            <button
              type="button"
              onClick={() => onPickSuggestion(q)}
              className={cn(
                'w-full text-left px-3 py-2.5 text-body-sm',
                'border border-border-hairline bg-bg-card text-text-primary',
                'hover:border-accent hover:bg-bg-page',
                'transition-all duration-base ease-out-soft',
              )}
            >
              {q}
            </button>
          </li>
        ))}
      </ul>
      <p className="text-caption text-text-muted pt-4 border-t border-border-hairline">
        Tengo acceso a KPIs del trimestre, equipo, cuellos de botella y razones
        de rechazo. No puedo ver datos individuales de clientes.
      </p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Transformation initiatives
// ─────────────────────────────────────────────────────────────

interface Initiative {
  title: string;
  description: string;
  leads: string;
  status: 'discovery' | 'diseno' | 'piloto' | 'rollout';
  impact: string;
  horizon: string;
}

const INITIATIVES: Initiative[] = [
  {
    title: 'Automatización del Estudio de Títulos',
    description:
      'Rediseño completo de la fase más demorada del proceso. Combina OCR para extracción de inscripciones del CBR con un modelo que detecta inconsistencias y gravámenes complejos.',
    leads: 'Eugenio Millar Moreira · Reingeniería de Procesos',
    status: 'diseno',
    impact: '-40% en tiempo de fase (de 14 a 8 días)',
    horizon: 'Q3 2026',
  },
  {
    title: 'Migración a Gravity 2.0',
    description:
      'Adopción del core bancario evolucionado del grupo. Mejor soporte para IA, build-once-deploy-everywhere, base para nuevas integraciones agénticas.',
    leads: 'José López Molina · Tecnología + Priscilla Von Dessauer · Transformación',
    status: 'piloto',
    impact: '-25% en costo unitario por caso',
    horizon: 'H1 2027',
  },
  {
    title: 'Modelo de scoring con IA generativa',
    description:
      'Pre-evaluación inteligente al momento de la simulación. Aumenta la calidad del lead y reduce abandono en documentación al ofrecer pre-aprobación tentativa más temprano.',
    leads: 'Priscilla Von Dessauer Valverde · Transformación',
    status: 'discovery',
    impact: '+8 pts en conversión de simulación a solicitud',
    horizon: 'Q4 2026',
  },
];

function TransformationInitiatives() {
  return (
    <section>
      <SectionTitle rule={false}>Iniciativas de transformación</SectionTitle>
      <p className="text-body text-text-secondary mt-3 max-w-measure">
        Tres iniciativas activas que tocan el proceso hipotecario. Cada una
        liderada por un dueño claro y con impacto cuantificado.
      </p>
      <ol className="mt-8 space-y-4">
        {INITIATIVES.map((init, i) => (
          <InitiativeCard key={init.title} num={i + 1} init={init} />
        ))}
      </ol>
    </section>
  );
}

function InitiativeCard({ num, init }: { num: number; init: Initiative }) {
  return (
    <li>
      <Card padding="lg">
        <div className="flex gap-5 items-start">
          <span className="text-kicker text-accent-muted shrink-0 w-8 tabular-nums pt-1">
            {String(num).padStart(2, '0')}
          </span>
          <div className="flex-1 min-w-0 space-y-4">
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <h3 className="text-h3 text-text-primary leading-snug">
                {init.title}
              </h3>
              <InitiativeStatusPill status={init.status} />
            </div>
            <p className="text-body-sm text-text-secondary leading-relaxed max-w-measure">
              {init.description}
            </p>
            <dl className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-3 pt-4 border-t border-border-hairline">
              <div>
                <dt className="text-caption uppercase tracking-[0.14em] text-text-muted">
                  Lead
                </dt>
                <dd className="text-body-sm text-text-primary mt-1">
                  {init.leads}
                </dd>
              </div>
              <div>
                <dt className="text-caption uppercase tracking-[0.14em] text-text-muted">
                  Impacto esperado
                </dt>
                <dd className="text-body-sm text-text-primary mt-1">
                  {init.impact}
                </dd>
              </div>
              <div>
                <dt className="text-caption uppercase tracking-[0.14em] text-text-muted">
                  Horizonte
                </dt>
                <dd className="text-body-sm text-text-primary mt-1">
                  {init.horizon}
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </Card>
    </li>
  );
}

function InitiativeStatusPill({ status }: { status: Initiative['status'] }) {
  const map = {
    discovery: { label: 'Discovery', variant: 'neutral' as const },
    diseno: { label: 'En diseño', variant: 'neutral' as const },
    piloto: { label: 'Piloto', variant: 'warning' as const },
    rollout: { label: 'Rollout', variant: 'success' as const },
  };
  const { label, variant } = map[status];
  return (
    <Pill variant={variant} size="sm">
      {label}
    </Pill>
  );
}
