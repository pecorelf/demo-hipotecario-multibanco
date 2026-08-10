import { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowDownLeft,
  ArrowUpRight,
  ChevronRight,
  RefreshCw,
  Scale,
  ShieldCheck,
  X,
} from 'lucide-react';
import {
  Avatar,
  Card,
  Kicker,
  PageTitle,
  Pill,
  SectionTitle,
  Skeleton,
  Stat,
} from '@/components/ui';
import { AiCursor } from '@/components/ai';
import { useClaudeStream } from '@/hooks/useClaude';
import {
  BACKOFFICE_INSIGHT_SYSTEM,
  buildBackOfficeInsightPrompt,
  type DashboardSnapshot,
} from '@/lib/prompts/backOffice';
import { formatDateCL, formatDateTimeCL } from '@/lib/format';
import { cn } from '@/lib/cn';
import { useAppStore } from '@/store/appStore';

// ─────────────────────────────────────────────────────────────
// Mock data (constantes del dashboard)
// ─────────────────────────────────────────────────────────────

const STATS = {
  activeCases: 247,
  slaAtRisk: 18,
  avgTimeDays: 87,
  targetTimeDays: 30,
  conversion: 0.64,
  abandonment: 14,
  abandonmentDelta: -3,
} as const;

interface PhaseBottleneck {
  phase: string;
  cases: number;
  avgDays: number;
  targetDays: number;
}

const BOTTLENECKS: PhaseBottleneck[] = [
  { phase: 'Evaluación', cases: 42, avgDays: 2, targetDays: 3 },
  { phase: 'Documentación', cases: 78, avgDays: 8, targetDays: 10 },
  { phase: 'Estudio de títulos', cases: 89, avgDays: 14, targetDays: 7 },
  { phase: 'Escritura y firma', cases: 38, avgDays: 4, targetDays: 5 },
];

interface RejectionReason {
  reason: string;
  count: number;
}

const REJECTIONS: RejectionReason[] = [
  { reason: 'Inconsistencia en liquidación vs Previred', count: 32 },
  { reason: 'Tasación insuficiente', count: 24 },
  { reason: 'Carga financiera sobre umbral', count: 19 },
  { reason: 'Documentación incompleta', count: 15 },
  { reason: 'Estado civil inconsistente', count: 11 },
];

interface TeamMember {
  name: string;
  closedThisWeek: number;
  avgDays: number;
  satisfaction: number;
}

const TEAM: TeamMember[] = [
  { name: 'Tomás Henríquez', closedThisWeek: 11, avgDays: 72, satisfaction: 4.9 },
  { name: 'Camila Reinoso', closedThisWeek: 7, avgDays: 82, satisfaction: 4.6 },
  { name: 'Valentina Ossa', closedThisWeek: 8, avgDays: 79, satisfaction: 4.7 },
  { name: 'Diego Norambuena', closedThisWeek: 4, avgDays: 103, satisfaction: 3.9 },
];

interface QueueItem {
  caseId: string;
  customerName: string;
  derivedAt: string;
  byExecutive: string;
  note: string;
  priority: 'alta' | 'media' | 'baja';
  isReal: boolean;
}

const FRANCISCO_FALLBACK_NOTE =
  'Renta declarada en liquidaciones ($2.450.000) supera en 17,8% al promedio cotizado en Previred últimos 12 meses ($2.080.000). Posibles causas: bono no habitual, renta variable, o transcripción incorrecta. Sugiero revisar contrato laboral y últimas 3 liquidaciones antes de avanzar al comité de riesgo.';

const SEED_QUEUE: Omit<QueueItem, 'isReal'>[] = [
  {
    caseId: 'HIP-2026-0058',
    customerName: 'María Cifuentes Núñez',
    derivedAt: '2026-05-19T08:14:00-04:00',
    byExecutive: 'Patricio Ríos',
    note: 'Tasación independiente arrojó valor 12% inferior al valor declarado en la promesa. Cliente solicita revisión con segundo tasador. Operación en pausa hasta resolución.',
    priority: 'alta',
  },
  {
    caseId: 'HIP-2026-0074',
    customerName: 'Cristian Vega Almonte',
    derivedAt: '2026-05-18T16:42:00-04:00',
    byExecutive: 'Camila Sandoval',
    note: 'Cliente independiente con declaración de renta 2024 con observación en SII. Carpeta tributaria 2025 todavía no disponible. Comité solicita criterio para avanzar con info parcial.',
    priority: 'media',
  },
  {
    caseId: 'HIP-2026-0061',
    customerName: 'Patricia Soto Larraín',
    derivedAt: '2026-05-17T10:08:00-04:00',
    byExecutive: 'Diego Norambuena',
    note: 'Co-titular vive en el extranjero hace 11 meses. Documentación apostillada en orden pero régimen patrimonial requiere validación con abogado bancario antes de cierre.',
    priority: 'media',
  },
];

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

function buildQueue(zustandDerivations: Record<string, { derivedAt: string; note: string }>): QueueItem[] {
  const franciscoDerivation = zustandDerivations['HIP-2026-0042'];
  const francisco: QueueItem = franciscoDerivation
    ? {
        caseId: 'HIP-2026-0042',
        customerName: 'Andrés Fuenzalida',
        derivedAt: franciscoDerivation.derivedAt,
        byExecutive: 'Camila Reinoso',
        note: franciscoDerivation.note,
        priority: 'alta',
        isReal: true,
      }
    : {
        caseId: 'HIP-2026-0042',
        customerName: 'Andrés Fuenzalida',
        derivedAt: '2026-05-19T11:32:00-04:00',
        byExecutive: 'Camila Reinoso',
        note: FRANCISCO_FALLBACK_NOTE,
        priority: 'alta',
        isReal: false,
      };

  const seeds: QueueItem[] = SEED_QUEUE.map((s) => ({ ...s, isReal: false }));

  return [francisco, ...seeds].sort((a, b) => b.derivedAt.localeCompare(a.derivedAt));
}

function dashboardSnapshot(queue: QueueItem[]): DashboardSnapshot {
  return {
    activeCases: STATS.activeCases,
    slaAtRisk: STATS.slaAtRisk,
    avgTimeDays: STATS.avgTimeDays,
    targetTimeDays: STATS.targetTimeDays,
    conversion: STATS.conversion,
    abandonment: STATS.abandonment,
    abandonmentDelta: STATS.abandonmentDelta,
    bottlenecks: BOTTLENECKS.map((b) => ({
      phase: b.phase,
      cases: b.cases,
      avgDays: b.avgDays,
      targetDays: b.targetDays,
      overSlaPct: Math.max(0, (b.avgDays - b.targetDays) / b.targetDays),
    })),
    topRejections: REJECTIONS,
    team: TEAM,
    derivationsPending: queue.length,
  };
}

// ─────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────

export default function BackOfficeDashboard() {
  const derivedCases = useAppStore((s) => s.derivedCases);
  const queue = useMemo(() => buildQueue(derivedCases), [derivedCases]);
  const snapshot = useMemo(() => dashboardSnapshot(queue), [queue]);
  const [drawerItem, setDrawerItem] = useState<QueueItem | null>(null);

  return (
    <>
      <div className="max-w-shell mx-auto px-6 md:px-10 lg:px-16 py-10">
        <DashboardHeader snapshot={snapshot} />

        <hr className="my-12 border-t border-border-hairline" />

        <StatsRow />

        <div className="mt-12 grid grid-cols-1 lg:grid-cols-2 gap-6">
          <BottlenecksCard />
          <RejectionsCard />
          <DerivedQueueCard queue={queue} onOpen={setDrawerItem} />
          <TeamProductivityCard />
        </div>
      </div>

      {drawerItem && (
        <DerivationDetailDrawer item={drawerItem} onClose={() => setDrawerItem(null)} />
      )}
    </>
  );
}

// ─────────────────────────────────────────────────────────────
// Header + AI insight
// ─────────────────────────────────────────────────────────────

function DashboardHeader({ snapshot }: { snapshot: DashboardSnapshot }) {
  return (
    <header className="grid grid-cols-12 gap-10">
      <div className="col-span-12 lg:col-span-7">
        <Kicker>Back office · Operaciones</Kicker>
        <PageTitle className="mt-3">Estado del proceso hipotecario, hoy</PageTitle>
        <p className="text-body-lg text-text-secondary mt-3 max-w-measure">
          Vista operativa consolidada: cuellos de botella por fase, razones de rechazo
          del mes, casos derivados por ejecutivos y productividad del equipo.
        </p>
      </div>
      <div className="col-span-12 lg:col-span-5">
        <CopilotInsightCard snapshot={snapshot} />
      </div>
    </header>
  );
}

function CopilotInsightCard({ snapshot }: { snapshot: DashboardSnapshot }) {
  const stream = useClaudeStream();
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    stream.start({
      messages: [{ role: 'user', content: buildBackOfficeInsightPrompt(snapshot) }],
      system: BACKOFFICE_INSIGHT_SYSTEM,
      maxTokens: 400,
      temperature: 0.6,
    });
    // Re-stream on manual refresh; ignore snapshot churn from store updates
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nonce]);

  const isInitial = stream.isStreaming && stream.text.length === 0 && !stream.error;

  return (
    <Card padding="lg" className="space-y-4">
      <header className="flex items-start justify-between gap-3">
        <Kicker>Copiloto · sugerencia diaria</Kicker>
        <button
          type="button"
          onClick={() => setNonce((n) => n + 1)}
          disabled={stream.isStreaming}
          className={cn(
            'text-caption text-text-muted hover:text-text-primary',
            'inline-flex items-center gap-1.5 transition-colors duration-base',
            'disabled:opacity-40 disabled:cursor-not-allowed',
          )}
          aria-label="Regenerar sugerencia"
        >
          <RefreshCw size={11} className={stream.isStreaming ? 'animate-spin' : ''} />
          Regenerar
        </button>
      </header>

      {stream.error && stream.error.kind !== 'cancelled' && stream.error.message !== 'Aborted' ? (
        <p className="text-body-sm text-status-error">{stream.error.message}</p>
      ) : isInitial ? (
        <div className="space-y-2">
          <Skeleton className="h-3 w-3/4" />
          <Skeleton className="h-3 w-2/3" />
          <Skeleton className="h-3 w-4/5" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      ) : (
        <div className="text-body-sm text-text-primary leading-relaxed space-y-3">
          {stream.text.split(/\n\s*\n/).map((paragraph, i, arr) => (
            <p key={i}>
              {paragraph.trim()}
              {stream.isStreaming && i === arr.length - 1 && <AiCursor />}
            </p>
          ))}
        </div>
      )}
    </Card>
  );
}

// ─────────────────────────────────────────────────────────────
// Stats row
// ─────────────────────────────────────────────────────────────

function StatsRow() {
  return (
    <section className="grid grid-cols-2 md:grid-cols-5 gap-x-8 gap-y-8">
      <Stat
        label="Casos activos"
        value={STATS.activeCases.toLocaleString('es-CL')}
        hint="movimiento en el último día"
      />
      <Stat
        label="SLA en riesgo"
        value={<span className="text-status-warning">{STATS.slaAtRisk}</span>}
        delta={{ direction: 'down', value: '+4 vs semana pasada' }}
        hint="vencen en menos de 24h"
      />
      <Stat
        label="Tiempo promedio actual"
        value={
          <>
            <span className="text-status-warning">{STATS.avgTimeDays}</span>
            <span className="text-stat-lg text-text-muted"> días</span>
          </>
        }
        hint={`Meta: ${STATS.targetTimeDays} días`}
      />
      <Stat
        label="Abandono este mes"
        value={STATS.abandonment.toString()}
        delta={{
          direction: 'up',
          value: `${STATS.abandonmentDelta} casos vs mes pasado`,
        }}
        hint="dejaron sin completar"
      />
      <Stat
        label="Conversión"
        value={
          <>
            <span className="text-status-success">{Math.round(STATS.conversion * 100)}</span>
            <span className="text-stat-lg text-text-muted">%</span>
          </>
        }
        delta={{ direction: 'up', value: '+3 pts vs Q1' }}
        hint="solicitudes → cierre"
      />
    </section>
  );
}

// ─────────────────────────────────────────────────────────────
// Card A — Cuellos de botella
// ─────────────────────────────────────────────────────────────

function BottlenecksCard() {
  return (
    <Card padding="lg">
      <Kicker tone="muted" className="block mb-1">
        Card A
      </Kicker>
      <SectionTitle rule={false}>Cuellos de botella por fase</SectionTitle>

      <table className="w-full mt-6 text-body-sm">
        <thead>
          <tr className="border-b border-border-hairline text-caption uppercase tracking-[0.14em] text-text-muted text-left">
            <th className="font-normal pb-3 w-2/5">Etapa</th>
            <th className="font-normal pb-3 text-right tabular-nums">Casos</th>
            <th className="font-normal pb-3 text-right tabular-nums">Prom / meta</th>
            <th className="font-normal pb-3 text-right tabular-nums">Sobre SLA</th>
          </tr>
        </thead>
        <tbody>
          {BOTTLENECKS.map((b) => {
            const overSlaPct = Math.max(0, (b.avgDays - b.targetDays) / b.targetDays);
            const isBad = overSlaPct >= 0.5;
            return (
              <tr
                key={b.phase}
                className={cn(
                  'border-b border-border-hairline last:border-b-0',
                  isBad && 'bg-status-warning/5',
                )}
              >
                <td className="py-3.5">
                  <span className="inline-flex items-center gap-2 text-text-primary">
                    {isBad && (
                      <span
                        aria-hidden
                        className="w-1 h-4 bg-status-warning rounded-sm"
                      />
                    )}
                    {b.phase}
                  </span>
                </td>
                <td className="py-3.5 text-right text-text-primary tabular-nums">
                  {b.cases}
                </td>
                <td className="py-3.5 text-right tabular-nums">
                  <span className={cn(isBad ? 'text-status-warning font-medium' : 'text-text-primary')}>
                    {b.avgDays}
                  </span>
                  <span className="text-text-muted"> / {b.targetDays}</span>
                </td>
                <td className="py-3.5 text-right tabular-nums">
                  {overSlaPct > 0 ? (
                    <span className={cn(isBad ? 'text-status-warning font-medium' : 'text-text-secondary')}>
                      +{Math.round(overSlaPct * 100)}%
                    </span>
                  ) : (
                    <span className="text-status-success">en meta</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <p className="text-caption text-text-muted mt-4">
        Estudio de títulos es la fase crítica: 14 días promedio vs meta de 7. Concentra el 36% del backlog.
      </p>
    </Card>
  );
}

// ─────────────────────────────────────────────────────────────
// Card B — Top razones de rechazo
// ─────────────────────────────────────────────────────────────

function RejectionsCard() {
  const max = Math.max(...REJECTIONS.map((r) => r.count));
  return (
    <Card padding="lg">
      <Kicker tone="muted" className="block mb-1">
        Card B
      </Kicker>
      <SectionTitle rule={false}>Top 5 razones de rechazo · este mes</SectionTitle>

      <ol className="mt-6 space-y-5">
        {REJECTIONS.map((r, idx) => {
          const pct = (r.count / max) * 100;
          return (
            <li key={r.reason} className="space-y-2">
              <div className="flex items-baseline gap-4">
                <span className="text-kicker text-text-muted w-5 shrink-0 tabular-nums">
                  {String(idx + 1).padStart(2, '0')}
                </span>
                <span className="flex-1 text-body-sm text-text-primary">{r.reason}</span>
                <span className="text-body-sm text-text-primary tabular-nums font-medium shrink-0">
                  {r.count}
                </span>
              </div>
              <div className="ml-9 h-px bg-bg-sunken relative">
                <div
                  aria-hidden
                  className="absolute top-0 left-0 h-[2px] -translate-y-px bg-accent-muted"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </li>
          );
        })}
      </ol>

      <p className="text-caption text-text-muted mt-6">
        Las dos primeras razones (56) suman el 55% de los rechazos del mes.
      </p>
    </Card>
  );
}

// ─────────────────────────────────────────────────────────────
// Card C — Cola de derivaciones
// ─────────────────────────────────────────────────────────────

function DerivedQueueCard({
  queue,
  onOpen,
}: {
  queue: QueueItem[];
  onOpen: (item: QueueItem) => void;
}) {
  return (
    <Card padding="lg">
      <div className="flex items-start justify-between gap-3 mb-1">
        <Kicker tone="muted">Card C</Kicker>
        <Pill variant="warning" size="sm">
          {queue.length} esperando
        </Pill>
      </div>
      <SectionTitle rule={false}>Casos derivados que requieren mi atención</SectionTitle>

      <ul className="mt-6 -mx-2">
        {queue.map((item) => (
          <li key={item.caseId} className="border-b border-border-hairline last:border-b-0">
            <button
              type="button"
              onClick={() => onOpen(item)}
              className={cn(
                'w-full text-left px-2 py-4 flex items-start gap-3',
                'hover:bg-bg-sunken transition-colors duration-base',
                'focus:outline-none focus-visible:bg-bg-sunken',
              )}
            >
              <Avatar name={item.customerName} size="sm" />
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-body-sm text-text-primary font-medium truncate">
                      {item.customerName}
                    </div>
                    <div className="text-caption text-text-muted truncate">
                      #{item.caseId.slice(-4)} · derivado por {item.byExecutive}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {item.isReal && (
                      <Pill variant="info" size="sm">
                        Nuevo
                      </Pill>
                    )}
                    {item.priority === 'alta' && (
                      <Pill variant="warning" size="sm">
                        Prioridad alta
                      </Pill>
                    )}
                  </div>
                </div>
                <p className="text-body-sm text-text-secondary mt-2 line-clamp-2">
                  {item.note}
                </p>
                <div className="flex items-center justify-between gap-3 mt-2">
                  <span className="text-caption text-text-muted tabular-nums">
                    {formatDateTimeCL(item.derivedAt)}
                  </span>
                  <ChevronRight size={14} className="text-text-muted shrink-0" />
                </div>
              </div>
            </button>
          </li>
        ))}
      </ul>
    </Card>
  );
}

// ─────────────────────────────────────────────────────────────
// Card D — Productividad del equipo
// ─────────────────────────────────────────────────────────────

function TeamProductivityCard() {
  const maxClosed = Math.max(...TEAM.map((t) => t.closedThisWeek));
  return (
    <Card padding="lg">
      <Kicker tone="muted" className="block mb-1">
        Card D
      </Kicker>
      <SectionTitle rule={false}>Productividad del equipo · esta semana</SectionTitle>

      <ul className="mt-6 -mx-2">
        {TEAM.map((m) => {
          const pct = (m.closedThisWeek / maxClosed) * 100;
          const satIsHigh = m.satisfaction >= 4.5;
          const satIsLow = m.satisfaction < 4.0;
          return (
            <li
              key={m.name}
              className="px-2 py-4 border-b border-border-hairline last:border-b-0"
            >
              <div className="flex items-center gap-3">
                <Avatar name={m.name} size="sm" />
                <span className="flex-1 text-body-sm text-text-primary truncate">
                  {m.name}
                </span>
              </div>
              <div className="mt-3 grid grid-cols-12 gap-3 items-center">
                <div className="col-span-7">
                  <div className="flex items-baseline gap-3">
                    <span className="text-caption text-text-muted shrink-0 w-20">
                      Cerrados
                    </span>
                    <span className="text-body-sm text-text-primary tabular-nums font-medium">
                      {m.closedThisWeek}
                    </span>
                  </div>
                  <div className="mt-1.5 h-px bg-bg-sunken relative ml-20">
                    <div
                      aria-hidden
                      className="absolute top-0 left-0 h-[2px] -translate-y-px bg-accent-muted"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
                <div className="col-span-2 text-right tabular-nums">
                  <div className="text-caption text-text-muted">Prom.</div>
                  <div
                    className={cn(
                      'text-body-sm',
                      m.avgDays > 90 ? 'text-status-warning' : 'text-text-primary',
                    )}
                  >
                    {m.avgDays}d
                  </div>
                </div>
                <div className="col-span-3 text-right tabular-nums">
                  <div className="text-caption text-text-muted">NPS</div>
                  <div className="text-body-sm flex items-center justify-end gap-1.5">
                    <span
                      aria-hidden
                      className={cn(
                        'w-1.5 h-1.5 rounded-full',
                        satIsHigh
                          ? 'bg-status-success'
                          : satIsLow
                            ? 'bg-status-warning'
                            : 'bg-text-muted',
                      )}
                    />
                    <span
                      className={cn(
                        satIsHigh
                          ? 'text-status-success'
                          : satIsLow
                            ? 'text-status-warning'
                            : 'text-text-primary',
                      )}
                    >
                      {m.satisfaction.toFixed(1)}
                    </span>
                    <span className="text-text-muted">/5</span>
                  </div>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}

// ─────────────────────────────────────────────────────────────
// Drawer — detalle de derivación con acciones
// ─────────────────────────────────────────────────────────────

interface DrawerProps {
  item: QueueItem;
  onClose: () => void;
}

type ActionId = 'devolver' | 'aprobar' | 'escalar';

const ACTION_LABEL: Record<ActionId, string> = {
  devolver: 'Devolver al ejecutivo',
  aprobar: 'Aprobar excepción',
  escalar: 'Escalar a comité de riesgo',
};

function DerivationDetailDrawer({ item, onClose }: DrawerProps) {
  const [resolved, setResolved] = useState<ActionId | null>(null);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <>
      <div
        className="fixed inset-0 bg-bg-overlay z-40 animate-fade-in"
        onClick={onClose}
        aria-hidden
      />
      <aside
        role="dialog"
        aria-label="Detalle de derivación"
        className="fixed top-0 right-0 h-full w-full max-w-xl z-50 bg-bg-card border-l border-border-hairline shadow-soft overflow-y-auto animate-slide-in-right"
      >
        <header className="px-8 py-6 border-b border-border-hairline flex items-start justify-between gap-4 sticky top-0 bg-bg-card z-10">
          <div className="min-w-0">
            <Kicker>Caso derivado · #{item.caseId}</Kicker>
            <h2 className="text-h2 text-text-primary mt-2 truncate">{item.customerName}</h2>
            <p className="text-body-sm text-text-secondary mt-1">
              Derivado por {item.byExecutive} · {formatDateTimeCL(item.derivedAt)}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-text-muted hover:text-text-primary transition-colors duration-base shrink-0"
            aria-label="Cerrar"
          >
            <X size={18} />
          </button>
        </header>

        <div className="px-8 py-8 space-y-10">
          {resolved && <ResolutionBanner action={resolved} item={item} />}

          <section>
            <Kicker tone="muted" className="block mb-3">
              Nota del ejecutivo
            </Kicker>
            <p className="text-body text-text-primary leading-relaxed">{item.note}</p>
          </section>

          <hr className="border-t border-border-hairline" />

          <section>
            <Kicker tone="muted" className="block mb-3">
              Resolución
            </Kicker>
            <p className="text-body-sm text-text-secondary mb-5">
              Cualquiera de estas acciones queda registrada en el timeline del caso con tu
              identificador y la fecha actual.
            </p>
            <div className="grid grid-cols-1 gap-3">
              <ActionButton
                icon={<ArrowDownLeft size={16} />}
                label={ACTION_LABEL.devolver}
                hint="Volverá al cockpit de quien lo derivó con tu nota de respuesta."
                onClick={() => setResolved('devolver')}
                disabled={Boolean(resolved)}
              />
              <ActionButton
                icon={<ShieldCheck size={16} />}
                label={ACTION_LABEL.aprobar}
                hint="Autoriza avanzar con criterio documentado. Aplica para casos límite."
                onClick={() => setResolved('aprobar')}
                disabled={Boolean(resolved)}
              />
              <ActionButton
                icon={<Scale size={16} />}
                label={ACTION_LABEL.escalar}
                hint="Envía al comité semanal con todo el contexto. Suma ~5 días al SLA."
                onClick={() => setResolved('escalar')}
                disabled={Boolean(resolved)}
              />
            </div>
          </section>

          {resolved && (
            <div className="pt-4">
              <button
                type="button"
                onClick={onClose}
                className={cn(
                  'inline-flex items-center px-5 py-2.5 text-body font-medium',
                  'bg-accent text-text-inverse',
                  'hover:bg-accent-muted transition-colors duration-base ease-out-soft',
                )}
              >
                Volver al dashboard
              </button>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}

function ActionButton({
  icon,
  label,
  hint,
  onClick,
  disabled,
}: {
  icon: React.ReactNode;
  label: string;
  hint: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'text-left w-full p-5 border border-border-hairline bg-bg-card',
        'hover:border-text-primary hover:bg-bg-sunken transition-all duration-base ease-out-soft',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:ring-offset-2 focus-visible:ring-offset-bg-card',
        'disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:border-border-hairline disabled:hover:bg-bg-card',
        'group',
      )}
    >
      <div className="flex items-start gap-4">
        <span className="text-text-secondary group-hover:text-accent transition-colors duration-base shrink-0 mt-0.5">
          {icon}
        </span>
        <div className="flex-1 min-w-0">
          <div className="text-body text-text-primary font-medium">{label}</div>
          <div className="text-body-sm text-text-secondary mt-1">{hint}</div>
        </div>
        <ArrowUpRight
          size={14}
          className="text-text-muted shrink-0 mt-1 group-hover:text-text-primary transition-colors duration-base"
        />
      </div>
    </button>
  );
}

function ResolutionBanner({ action, item }: { action: ActionId; item: QueueItem }) {
  return (
    <Card padding="sm" className="border-status-success/30 bg-status-success/5 animate-fade-in">
      <div className="flex items-start gap-3">
        <AlertTriangle size={16} className="text-status-success shrink-0 mt-0.5" aria-hidden />
        <div className="flex-1">
          <Kicker tone="muted" className="block mb-1">
            Acción registrada
          </Kicker>
          <p className="text-body-sm text-text-primary">
            <span className="font-medium">{ACTION_LABEL[action]}</span> aplicada al caso #
            {item.caseId.slice(-4)} ({item.customerName}). El timeline registra esta acción
            con timestamp {formatDateCL(new Date().toISOString())}.
          </p>
        </div>
      </div>
    </Card>
  );
}
