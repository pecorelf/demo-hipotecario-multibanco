import { AlertTriangle, ArrowDownRight, ArrowUpRight, CheckCircle2, ClipboardList, Clock, FileWarning, MailOpen, Minus, TrendingUp } from 'lucide-react';
import { Card, Kicker, PageTitle, Pill, SectionTitle } from '@/components/ui';
import { cn } from '@/lib/cn';

// ─────────────────────────────────────────────────────────────
// Mock data
// ─────────────────────────────────────────────────────────────

const OPS_KPIS = {
  claimsThisMonth: 47,
  claimsDelta: -12.3, // pct
  slaCompliance: 0.89, // 0-1
  slaDelta: 2.4,
  coordinationCases: 312,
  coordinationDelta: 8.6,
  avgResponseHours: 18,
  avgResponseDelta: -3,
};

interface TeamMember {
  name: string;
  role: string;
  initials: string;
  metric1: { label: string; value: string };
  metric2: { label: string; value: string };
  metric3: { label: string; value: string; tone?: 'success' | 'warning' };
  trend: number;
  highlight: string;
}

const OPS_TEAM: TeamMember[] = [
  {
    name: 'Felipe Contreras Fajardo',
    role: 'Gerente de Operaciones',
    initials: 'FC',
    metric1: { label: 'Equipo a cargo', value: '24 personas' },
    metric2: { label: 'SLA del mes', value: '89%' },
    metric3: { label: 'Casos cerrados Q', value: '1.842', tone: 'success' },
    trend: 7,
    highlight:
      'Lidera la transformación operativa con foco en reducción de tiempos de back office.',
  },
  {
    name: 'Andrés Abarca García',
    role: 'Analista de Reclamos',
    initials: 'AA',
    metric1: { label: 'Reclamos en curso', value: '47' },
    metric2: { label: 'Cerrados este mes', value: '52' },
    metric3: { label: 'Tiempo prom. respuesta', value: '18h' },
    trend: -2,
    highlight:
      'Punto único de contacto para reclamos hipotecarios. Coordina con compliance y legal cuando aplica.',
  },
  {
    name: 'Paola López Cárdenas',
    role: 'Coordinadora Hipotecaria',
    initials: 'PL',
    metric1: { label: 'Casos coordinados', value: '312' },
    metric2: { label: 'Notarías activas', value: '8' },
    metric3: { label: 'Tasaciones agendadas', value: '94', tone: 'success' },
    trend: 11,
    highlight:
      'Coordina notarías, tasadores y Conservador de Bienes Raíces. Punto crítico del cierre operativo.',
  },
];

// ─────────────────────────────────────────────────────────────
// Mock data — reclamos en curso
// ─────────────────────────────────────────────────────────────

interface ClaimRow {
  id: string;
  customer: string;
  reason: string;
  status: 'abierto' | 'en_revision' | 'esperando_cliente' | 'cerrado';
  daysOpen: number;
  priority: 'alta' | 'media' | 'baja';
}

const CLAIMS: ClaimRow[] = [
  {
    id: 'REC-2026-0418',
    customer: 'María Cifuentes',
    reason: 'Demora en tasación oficial supera 14 días',
    status: 'en_revision',
    daysOpen: 6,
    priority: 'alta',
  },
  {
    id: 'REC-2026-0419',
    customer: 'Roberto Salinas',
    reason: 'Cobro adicional no informado en cierre',
    status: 'abierto',
    daysOpen: 2,
    priority: 'alta',
  },
  {
    id: 'REC-2026-0414',
    customer: 'Constructora Vista Mar',
    reason: 'Inconsistencia en monto desembolsado',
    status: 'esperando_cliente',
    daysOpen: 11,
    priority: 'media',
  },
  {
    id: 'REC-2026-0411',
    customer: 'Familia Herrera',
    reason: 'Tasación bajo el valor esperado',
    status: 'cerrado',
    daysOpen: 4,
    priority: 'media',
  },
  {
    id: 'REC-2026-0408',
    customer: 'Patricio Yáñez',
    reason: 'Solicitud de revisión de CAE',
    status: 'cerrado',
    daysOpen: 3,
    priority: 'baja',
  },
];

// ─────────────────────────────────────────────────────────────
// Mock data — coordinación hipotecaria
// ─────────────────────────────────────────────────────────────

interface CoordinationRow {
  type: string;
  count: number;
  avgDays: number;
  targetDays: number;
}

const COORDINATION: CoordinationRow[] = [
  { type: 'Tasaciones agendadas', count: 94, avgDays: 5, targetDays: 7 },
  { type: 'Estudios de título en curso', count: 78, avgDays: 12, targetDays: 7 },
  { type: 'Firmas notariales esta semana', count: 38, avgDays: 2, targetDays: 3 },
  { type: 'Inscripciones CBR pendientes', count: 22, avgDays: 9, targetDays: 14 },
];

// ─────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────

export default function Operaciones() {
  return (
    <div className="max-w-shell mx-auto px-6 md:px-10 lg:px-16 py-12 lg:py-16">
      <header className="max-w-3xl">
        <Kicker>Operaciones · Felipe Contreras y equipo</Kicker>
        <PageTitle className="mt-3">Operaciones internas del proceso hipotecario</PageTitle>
        <p className="text-body-lg text-text-secondary mt-3 max-w-measure">
          Reclamos, coordinación con notarías y tasadores, cumplimiento de SLA
          del back office. Vista del Gerente de Operaciones y su equipo
          directo.
        </p>
        <span aria-hidden className="block w-12 h-px bg-border-hairline mt-8" />
      </header>

      <div className="mt-12 space-y-16">
        <OpsKpis />
        <hr className="border-t border-border-hairline" />
        <OpsTeamSection />
        <hr className="border-t border-border-hairline" />
        <ClaimsSection />
        <hr className="border-t border-border-hairline" />
        <CoordinationSection />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// KPIs
// ─────────────────────────────────────────────────────────────

function OpsKpis() {
  return (
    <section>
      <div className="flex items-baseline justify-between">
        <SectionTitle rule={false}>Indicadores operativos del mes</SectionTitle>
        <span className="text-caption uppercase tracking-[0.14em] text-text-muted">
          Mayo 2026 vs Abril 2026
        </span>
      </div>
      <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-x-8 gap-y-10">
        <KpiCell
          label="Reclamos del mes"
          value={OPS_KPIS.claimsThisMonth.toString()}
          delta={OPS_KPIS.claimsDelta}
          deltaUnit="%"
          positiveIsGood={false}
        />
        <KpiCell
          label="Cumplimiento SLA"
          value={`${Math.round(OPS_KPIS.slaCompliance * 100)}%`}
          delta={OPS_KPIS.slaDelta}
          deltaUnit="pts"
          positiveIsGood
        />
        <KpiCell
          label="Casos coordinados"
          value={OPS_KPIS.coordinationCases.toString()}
          delta={OPS_KPIS.coordinationDelta}
          deltaUnit="%"
          positiveIsGood
        />
        <KpiCell
          label="Tiempo prom. respuesta"
          value={`${OPS_KPIS.avgResponseHours}h`}
          delta={OPS_KPIS.avgResponseDelta}
          deltaUnit="h"
          positiveIsGood={false}
        />
      </div>
    </section>
  );
}

function KpiCell({
  label,
  value,
  delta,
  deltaUnit,
  positiveIsGood,
}: {
  label: string;
  value: string;
  delta: number;
  deltaUnit: string;
  positiveIsGood: boolean;
}) {
  const isGoodChange =
    (delta > 0 && positiveIsGood) || (delta < 0 && !positiveIsGood);
  return (
    <div>
      <div className="text-caption uppercase tracking-[0.14em] text-text-muted">
        {label}
      </div>
      <div className="mt-2 text-h2 text-text-primary tabular-nums">{value}</div>
      <div className="mt-2">
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
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Team
// ─────────────────────────────────────────────────────────────

function OpsTeamSection() {
  return (
    <section>
      <SectionTitle rule={false}>Equipo de operaciones</SectionTitle>
      <p className="text-body text-text-secondary mt-3 max-w-measure">
        Tres roles clave que sostienen el cierre operativo del crédito
        hipotecario una vez que el negocio ya aprobó.
      </p>
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
        {OPS_TEAM.map((member) => (
          <OpsTeamCard key={member.name} member={member} />
        ))}
      </div>
    </section>
  );
}

function OpsTeamCard({ member }: { member: TeamMember }) {
  const trendIsGood = member.trend > 0;
  return (
    <Card padding="lg" className="h-full flex flex-col">
      <header className="flex items-center gap-3">
        <span
          aria-hidden
          className="flex items-center justify-center w-12 h-12 bg-bg-sunken text-text-secondary text-body-sm font-medium tabular-nums shrink-0"
        >
          {member.initials}
        </span>
        <div className="min-w-0">
          <div className="text-h3 text-text-primary leading-tight">
            {member.name}
          </div>
          <div className="text-caption text-text-muted mt-0.5">{member.role}</div>
        </div>
      </header>

      <p className="text-body-sm text-text-secondary mt-5 leading-relaxed">
        {member.highlight}
      </p>

      <dl className="mt-6 pt-5 border-t border-border-hairline space-y-3 flex-1">
        <Row label={member.metric1.label} value={member.metric1.value} />
        <Row label={member.metric2.label} value={member.metric2.value} />
        <Row
          label={member.metric3.label}
          value={member.metric3.value}
          tone={member.metric3.tone}
        />
      </dl>

      <div className="mt-5 pt-4 border-t border-border-hairline">
        <span
          className={cn(
            'inline-flex items-center gap-1.5 text-caption tabular-nums',
            trendIsGood
              ? 'text-status-success'
              : member.trend < 0
                ? 'text-status-warning'
                : 'text-text-muted',
          )}
        >
          {trendIsGood ? (
            <TrendingUp size={12} aria-hidden />
          ) : member.trend < 0 ? (
            <ArrowDownRight size={12} aria-hidden />
          ) : (
            <Minus size={12} aria-hidden />
          )}
          {member.trend > 0 ? '+' : ''}
          {member.trend}% vs mes anterior
        </span>
      </div>
    </Card>
  );
}

function Row({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: 'success' | 'warning';
}) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="text-body-sm text-text-muted">{label}</dt>
      <dd
        className={cn(
          'text-body-sm font-medium tabular-nums',
          tone === 'success' && 'text-status-success',
          tone === 'warning' && 'text-status-warning',
          !tone && 'text-text-primary',
        )}
      >
        {value}
      </dd>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Claims (Andrés)
// ─────────────────────────────────────────────────────────────

function ClaimsSection() {
  return (
    <section>
      <div className="flex items-baseline justify-between flex-wrap gap-3">
        <div>
          <SectionTitle rule={false}>Reclamos hipotecarios</SectionTitle>
          <p className="text-body text-text-secondary mt-3 max-w-measure">
            Reclamos en curso que coordina Andrés Abarca García. Prioridad,
            tiempo abierto y estado actual.
          </p>
        </div>
        <span className="inline-flex items-center gap-2 text-caption text-text-muted">
          <MailOpen size={12} aria-hidden />
          andres.abarca@mibanco.cl
        </span>
      </div>

      <Card className="mt-8 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-body-sm">
            <thead className="bg-bg-sunken">
              <tr className="text-caption uppercase tracking-[0.14em] text-text-muted">
                <th className="text-left px-5 py-4 font-normal">ID</th>
                <th className="text-left px-5 py-4 font-normal">Cliente</th>
                <th className="text-left px-5 py-4 font-normal">Razón</th>
                <th className="text-left px-5 py-4 font-normal">Estado</th>
                <th className="text-right px-5 py-4 font-normal">Días abierto</th>
                <th className="text-left px-5 py-4 font-normal">Prioridad</th>
              </tr>
            </thead>
            <tbody>
              {CLAIMS.map((c) => (
                <tr key={c.id} className="border-t border-border-hairline">
                  <td className="px-5 py-4 text-text-muted tabular-nums">{c.id}</td>
                  <td className="px-5 py-4 text-text-primary">{c.customer}</td>
                  <td className="px-5 py-4 text-text-secondary">{c.reason}</td>
                  <td className="px-5 py-4">
                    <StatusPill status={c.status} />
                  </td>
                  <td className="px-5 py-4 text-right tabular-nums text-text-secondary">
                    {c.daysOpen}d
                  </td>
                  <td className="px-5 py-4">
                    <PriorityPill priority={c.priority} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </section>
  );
}

function StatusPill({ status }: { status: ClaimRow['status'] }) {
  if (status === 'cerrado')
    return (
      <Pill variant="success" size="sm">
        <span className="inline-flex items-center gap-1">
          <CheckCircle2 size={10} aria-hidden />
          Cerrado
        </span>
      </Pill>
    );
  if (status === 'en_revision')
    return (
      <Pill variant="warning" size="sm">
        <span className="inline-flex items-center gap-1">
          <Clock size={10} aria-hidden />
          En revisión
        </span>
      </Pill>
    );
  if (status === 'esperando_cliente')
    return (
      <Pill variant="neutral" size="sm">
        <span className="inline-flex items-center gap-1">
          <FileWarning size={10} aria-hidden />
          Esperando cliente
        </span>
      </Pill>
    );
  return (
    <Pill variant="warning" size="sm">
      <span className="inline-flex items-center gap-1">
        <AlertTriangle size={10} aria-hidden />
        Abierto
      </span>
    </Pill>
  );
}

function PriorityPill({ priority }: { priority: ClaimRow['priority'] }) {
  if (priority === 'alta')
    return (
      <Pill variant="warning" size="sm">
        Alta
      </Pill>
    );
  if (priority === 'media')
    return (
      <Pill variant="neutral" size="sm">
        Media
      </Pill>
    );
  return (
    <Pill variant="neutral" size="sm">
      Baja
    </Pill>
  );
}

// ─────────────────────────────────────────────────────────────
// Coordination (Paola)
// ─────────────────────────────────────────────────────────────

function CoordinationSection() {
  return (
    <section>
      <div className="flex items-baseline justify-between flex-wrap gap-3">
        <div>
          <SectionTitle rule={false}>Coordinación hipotecaria</SectionTitle>
          <p className="text-body text-text-secondary mt-3 max-w-measure">
            Estado de la coordinación con tasadores, notarías y Conservador de
            Bienes Raíces. Liderado por Paola López Cárdenas.
          </p>
        </div>
        <span className="inline-flex items-center gap-2 text-caption text-text-muted">
          <ClipboardList size={12} aria-hidden />
          paola.lopez@mibanco.cl
        </span>
      </div>

      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
        {COORDINATION.map((c) => {
          const overTarget = c.avgDays > c.targetDays;
          return (
            <Card padding="lg" key={c.type}>
              <Kicker tone="muted" className="block">
                {c.type}
              </Kicker>
              <div className="mt-3 flex items-baseline gap-3">
                <span className="text-h2 text-text-primary tabular-nums">
                  {c.count}
                </span>
                <span className="text-caption text-text-muted">
                  en curso esta semana
                </span>
              </div>
              <div className="mt-5 pt-4 border-t border-border-hairline">
                <div className="flex items-baseline justify-between gap-3">
                  <span className="text-body-sm text-text-secondary">
                    Tiempo promedio
                  </span>
                  <span
                    className={cn(
                      'text-body-sm tabular-nums',
                      overTarget ? 'text-status-warning' : 'text-status-success',
                    )}
                  >
                    {c.avgDays}d / meta {c.targetDays}d
                  </span>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </section>
  );
}
