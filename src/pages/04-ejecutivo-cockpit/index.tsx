import { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  Clock,
  Forward,
  Sparkles,
  X,
} from 'lucide-react';
import {
  Avatar,
  Card,
  Kicker,
  PageTitle,
  Pill,
  ProgressStepper,
  SectionTitle,
  Skeleton,
} from '@/components/ui';
import { AiCursor, AiInsight, AiMessage } from '@/components/ai';
import { useClaudeStream } from '@/hooks/useClaude';
import {
  cases,
  communicationsByCase,
  currentCustomer,
  currentExecutive,
  getCustomer,
} from '@/data/mock';
import { buildCaseContext } from '@/lib/caseContext';
import { enrichCaseWithSimulation } from '@/lib/caseEnrichment';
import {
  COPILOT_SYSTEM,
  buildCopilotPrompt,
  parseCopilot,
} from '@/lib/prompts/copilot';
import { formatCLP, formatDateCL, formatDateTimeCL, formatPct, formatUF } from '@/lib/format';
import { cn } from '@/lib/cn';
import { useAppStore } from '@/store/appStore';
import { useOperationStore } from '@/store/operationStore';
import { Link } from 'react-router-dom';
import { usePostApprovalStore, ACTOR_LABEL as POSTAPP_ACTOR_LABEL, type OperationDoc } from '@/store/postApprovalStore';
import type {
  ActorKind,
  Case,
  CaseStage,
  Communication,
  Document as CaseDocument,
  TimelineEvent,
} from '@/types';
import { BRAND } from '@/lib/brand';

// ─────────────────────────────────────────────────────────────
// Constantes y helpers
// ─────────────────────────────────────────────────────────────

const STAGE_LABEL: Record<CaseStage, string> = {
  solicitud: 'Solicitud',
  cotizacion_inicial: 'Cotización inicial',
  recopilacion: 'Recopilación de antecedentes',
  cotizacion_final: 'Cotización Final CMF',
  tasacion: 'Tasación',
  escrituracion: 'Escrituración',
  activacion: 'Activación',
};

// Shorter labels for the ProgressStepper to avoid overflow with 7 stages.
// Full labels still used in headers and detail views.
const STAGE_LABEL_SHORT: Record<CaseStage, string> = {
  solicitud: 'Solicitud',
  cotizacion_inicial: 'Cotización',
  recopilacion: 'Antecedentes',
  cotizacion_final: 'Cot. Final CMF',
  tasacion: 'Tasación',
  escrituracion: 'Escritura',
  activacion: 'Activación',
};

const STAGE_ORDER: CaseStage[] = [
  'solicitud',
  'cotizacion_inicial',
  'recopilacion',
  'cotizacion_final',
  'tasacion',
  'escrituracion',
  'activacion',
];
const STAGE_STEPS = STAGE_ORDER.map((s) => ({ id: s, label: STAGE_LABEL_SHORT[s] }));

type TabKey = 'resumen' | 'documentos' | 'operacion' | 'historia';

const TABS: Array<{ key: TabKey; label: string }> = [
  { key: 'resumen', label: 'Resumen' },
  { key: 'documentos', label: 'Documentos' },
  { key: 'operacion', label: 'Operación' },
  { key: 'historia', label: 'Historia' },
];

const ACTOR_DOT: Record<ActorKind, string> = {
  cliente: 'bg-text-secondary',
  ejecutivo: 'bg-accent-muted',
  backoffice: 'bg-text-secondary',
  sistema: 'bg-text-muted',
  agente: 'bg-accent',
};

const ACTOR_LABEL: Record<ActorKind, string> = {
  cliente: 'Cliente',
  ejecutivo: 'Ejecutivo',
  backoffice: 'Back office',
  sistema: 'Sistema',
  agente: 'Agente IA',
};

function caseHasAlert(c: Case): boolean {
  return c.timeline.some((e) => e.type === 'observacion_ia' && e.state === 'current');
}

// ─────────────────────────────────────────────────────────────
// Página
// ─────────────────────────────────────────────────────────────

export default function EjecutivoCockpit() {
  const audioCase = useAppStore((s) => s.audioCase);
  const audioCustomer = useAppStore((s) => s.audioCustomer);
  const audioCoTitular = useAppStore((s) => s.audioCoTitular);

  const myCases = useMemo(() => {
    const real = cases.filter((c) => c.executiveId === currentExecutive.id);
    return audioCase ? [audioCase, ...real] : real;
  }, [audioCase]);

  const customerLookup = useMemo(() => {
    return (id: string) => {
      const fromMock = getCustomer(id);
      if (fromMock) return fromMock;
      if (audioCustomer?.id === id) return audioCustomer;
      if (audioCoTitular?.id === id) return audioCoTitular;
      return undefined;
    };
  }, [audioCustomer, audioCoTitular]);

  const [selectedCaseId, setSelectedCaseId] = useState<string>(myCases[0]?.id ?? '');

  // If audioCase appears, auto-select it
  useEffect(() => {
    if (audioCase) setSelectedCaseId(audioCase.id);
  }, [audioCase?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const [activeTab, setActiveTab] = useState<TabKey>('resumen');
  const [derivationOpen, setDerivationOpen] = useState(false);

  const derivedCases = useAppStore((s) => s.derivedCases);
  const deriveCase = useAppStore((s) => s.deriveCase);

  // Pull live client decisions from the shared operationStore
  const opProperty = useOperationStore((s) => s.property);
  const opConversation = useOperationStore((s) => s.conversation);
  const opScenarios = useOperationStore((s) => s.scenarios);
  const opSelectedPlazo = useOperationStore((s) => s.selectedPlazo);
  const opPlazoSolicitado = useOperationStore((s) => s.plazoSolicitado);

  const rawSelectedCase = useMemo(
    () => myCases.find((c) => c.id === selectedCaseId) ?? myCases[0],
    [myCases, selectedCaseId],
  );

  // Enriched: if it's Francisco and the client did a simulation,
  // overlay the live values onto the case
  const selectedCase = useMemo(
    () =>
      enrichCaseWithSimulation(rawSelectedCase, {
        property: opProperty,
        conversation: opConversation,
        scenarios: opScenarios,
        selectedPlazo: opSelectedPlazo,
        plazoSolicitado: opPlazoSolicitado,
      }),
    [
      rawSelectedCase,
      opProperty,
      opConversation,
      opScenarios,
      opSelectedPlazo,
      opPlazoSolicitado,
    ],
  );

  const comms = useMemo(
    () => communicationsByCase(selectedCase.id),
    [selectedCase.id],
  );
  const derivation = derivedCases[selectedCase.id] ?? null;

  return (
    <>
      <div className="max-w-shell mx-auto px-6 md:px-10 lg:px-16 py-10">
        <header className="mb-8 max-w-3xl">
          <Kicker>Ejecutivo · Cockpit</Kicker>
          <PageTitle className="mt-3">Tu pipeline de hoy</PageTitle>
          <p className="text-body-lg text-text-secondary mt-3 max-w-measure">
            {myCases.length} casos en curso. {myCases.filter(caseHasAlert).length}{' '}
            requiere{myCases.filter(caseHasAlert).length === 1 ? '' : 'n'} atención.
          </p>
        </header>

        <LiveClientCaptureBanner />

        <StagePipeline
          cases={myCases}
          selectedId={selectedCase.id}
          onSelect={(id) => {
            setSelectedCaseId(id);
            setActiveTab('resumen');
          }}
        />

        <RepairControlPanel />

        <div className="grid grid-cols-1 lg:grid-cols-[260px_minmax(0,1fr)_300px] gap-6">
          <Inbox
            cases={myCases}
            selectedId={selectedCase.id}
            onSelect={(id) => {
              setSelectedCaseId(id);
              setActiveTab('resumen');
            }}
            derivedCases={derivedCases}
            customerLookup={customerLookup}
            audioCaseId={audioCase?.id ?? null}
          />

          <CaseDetail
            c={selectedCase}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            derivation={derivation}
            onOpenDerivation={() => setDerivationOpen(true)}
            customerLookup={customerLookup}
          />

          <CopilotPanel caseData={selectedCase} comms={comms} derivation={derivation} />
        </div>
      </div>

      {derivationOpen && (
        <DerivationModal
          c={selectedCase}
          onClose={() => setDerivationOpen(false)}
          onConfirm={(note) => {
            deriveCase({
              caseId: selectedCase.id,
              note,
              derivedAt: new Date().toISOString(),
              byExecutiveId: currentExecutive.id,
            });
            setDerivationOpen(false);
          }}
          customerLookup={customerLookup}
        />
      )}
    </>
  );
}

// ─────────────────────────────────────────────────────────────
// Pipeline por etapa
//
// Es lo primero que ve el ejecutivo: dónde están sus casos dentro del
// proceso. Las acciones documentales aparecen como señal dentro de cada
// etapa, no como una bandeja separada que descoloca la lectura.
// ─────────────────────────────────────────────────────────────

interface StagePipelineProps {
  cases: Case[];
  selectedId: string;
  onSelect: (id: string) => void;
}

function StagePipeline({ cases, selectedId, onSelect }: StagePipelineProps) {
  const porEtapa = STAGE_ORDER.map((stage) => ({
    stage,
    casos: cases.filter((c) => c.stage === stage),
  }));

  const conCasos = porEtapa.filter((e) => e.casos.length > 0);
  if (conCasos.length === 0) return null;

  return (
    <section className="mb-8">
      <div className="flex items-baseline justify-between mb-4">
        <Kicker tone="muted">Tus casos por etapa</Kicker>
        <span className="text-body-sm text-text-tertiary">
          {cases.length} en curso
        </span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-px bg-border-hairline border border-border-hairline">
        {porEtapa.map(({ stage, casos }) => {
          const conAlerta = casos.filter(caseHasAlert).length;
          const docsPendientes = casos.reduce(
            (n, c) => n + c.documents.filter((d) => d.status === 'pendiente').length,
            0,
          );
          const vacia = casos.length === 0;

          return (
            <div
              key={stage}
              className={`bg-surface-primary px-4 py-4 flex flex-col min-h-[136px] ${
                vacia ? 'opacity-45' : ''
              }`}
            >
              <span className="text-label text-text-tertiary uppercase tracking-wider leading-tight">
                {STAGE_LABEL_SHORT[stage]}
              </span>

              <span
                className={`mt-3 text-3xl font-semibold leading-none ${
                  conAlerta > 0 ? 'text-accent-primary' : 'text-text-primary'
                }`}
              >
                {casos.length}
              </span>

              <div className="mt-auto pt-3 space-y-1">
                {conAlerta > 0 && (
                  <span className="block text-body-sm text-accent-primary">
                    {conAlerta} requiere{conAlerta === 1 ? '' : 'n'} atención
                  </span>
                )}
                {docsPendientes > 0 && (
                  <span className="block text-body-sm text-text-secondary">
                    {docsPendientes} documento{docsPendientes === 1 ? '' : 's'} por subir
                  </span>
                )}
                {!vacia && conAlerta === 0 && docsPendientes === 0 && (
                  <span className="block text-body-sm text-text-tertiary">Al día</span>
                )}
              </div>

              {!vacia && (
                <ul className="mt-3 space-y-1 border-t border-border-hairline pt-2">
                  {casos.slice(0, 3).map((c) => (
                    <li key={c.id}>
                      <button
                        type="button"
                        onClick={() => onSelect(c.id)}
                        className={`text-left text-body-sm truncate w-full transition-colors ${
                          c.id === selectedId
                            ? 'text-accent-primary font-medium'
                            : 'text-text-secondary hover:text-text-primary'
                        }`}
                      >
                        {c.id}
                      </button>
                    </li>
                  ))}
                  {casos.length > 3 && (
                    <li className="text-body-sm text-text-tertiary">
                      +{casos.length - 3} más
                    </li>
                  )}
                </ul>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────
// Inbox
// ─────────────────────────────────────────────────────────────

interface InboxProps {
  cases: Case[];
  selectedId: string;
  onSelect: (id: string) => void;
  derivedCases: Record<string, { caseId: string }>;
  customerLookup: (id: string) => ReturnType<typeof getCustomer>;
  audioCaseId: string | null;
}

function Inbox({ cases, selectedId, onSelect, derivedCases, customerLookup, audioCaseId }: InboxProps) {
  return (
    <aside>
      <Kicker tone="muted" className="block mb-4 px-2">
        Bandeja · {cases.length}
      </Kicker>
      <ul className="border-t border-border-hairline">
        {cases.map((c) => (
          <InboxItem
            key={c.id}
            c={c}
            selected={c.id === selectedId}
            onClick={() => onSelect(c.id)}
            derived={Boolean(derivedCases[c.id])}
            isFromAudio={c.id === audioCaseId}
            customerLookup={customerLookup}
          />
        ))}
      </ul>
    </aside>
  );
}

function InboxItem({
  c,
  selected,
  onClick,
  derived,
  isFromAudio,
  customerLookup,
}: {
  c: Case;
  selected: boolean;
  onClick: () => void;
  derived: boolean;
  isFromAudio: boolean;
  customerLookup: (id: string) => ReturnType<typeof getCustomer>;
}) {
  const customer = customerLookup(c.customerId);
  const alert = caseHasAlert(c);

  return (
    <li
      className={cn(
        'border-b border-border-hairline transition-colors duration-base ease-out-soft',
        selected ? 'bg-bg-card' : 'hover:bg-bg-card',
      )}
    >
      <button
        type="button"
        onClick={onClick}
        className={cn(
          'w-full text-left px-2 py-4 flex items-start gap-3',
          'focus:outline-none focus-visible:bg-bg-card',
          selected && 'border-l-2 -ml-2 pl-[10px] border-accent',
        )}
        aria-pressed={selected}
      >
        <Avatar name={customer?.fullName ?? c.customerId} size="sm" />
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-body-sm text-text-primary font-medium truncate">
              {customer?.fullName ?? c.customerId}
            </span>
            {(alert || derived) && (
              <span
                aria-hidden
                className={cn(
                  'w-1.5 h-1.5 rounded-full shrink-0',
                  derived ? 'bg-status-warning' : 'bg-accent',
                )}
              />
            )}
          </div>
          <div className="text-caption text-text-muted mt-0.5 tabular-nums">
            {formatUF(c.requestedUF)} · #{c.id.slice(-4)}
          </div>
          <div className="mt-2 flex items-center gap-2 flex-wrap">
            <Pill variant="neutral" size="sm">
              {STAGE_LABEL[c.stage]}
            </Pill>
            {derived && (
              <Pill variant="warning" size="sm">
                Derivado
              </Pill>
            )}
            {isFromAudio && (
              <Pill variant="info" size="sm">
                Nuevo · audio
              </Pill>
            )}
          </div>
        </div>
      </button>
    </li>
  );
}

// ─────────────────────────────────────────────────────────────
// Detail (center)
// ─────────────────────────────────────────────────────────────

interface CaseDetailProps {
  c: Case;
  activeTab: TabKey;
  onTabChange: (t: TabKey) => void;
  derivation: { note: string; derivedAt: string } | null;
  onOpenDerivation: () => void;
  customerLookup: (id: string) => ReturnType<typeof getCustomer>;
}

function CaseDetail({
  c,
  activeTab,
  onTabChange,
  derivation,
  onOpenDerivation,
  customerLookup,
}: CaseDetailProps) {
  const customer = customerLookup(c.customerId);
  const coTitular = c.coTitularId ? customerLookup(c.coTitularId) : null;
  const stageIndex = STAGE_ORDER.indexOf(c.stage);

  return (
    <section className="min-w-0">
      {/* Header */}
      <Card padding="lg" className="space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <Kicker>
              Caso #{c.id} · {customer?.fullName}
            </Kicker>
            <h2 className="text-h1 text-text-primary mt-2 leading-tight">
              {c.property.address}, {c.property.commune}
            </h2>
            <p className="text-body-sm text-text-secondary mt-2">
              {formatUF(c.requestedUF)} · {c.termYears} años · {formatPct(c.annualRate)}{coTitular ? ` · Co-titular: ${coTitular.fullName.split(' ').slice(0, 2).join(' ')}` : ''}
            </p>
          </div>
          <div className="flex flex-col items-end gap-2 shrink-0">
            <Pill variant="info" size="base">
              {STAGE_LABEL[c.stage]}
            </Pill>
            {derivation && (
              <Pill variant="warning" size="sm">
                En back office
              </Pill>
            )}
          </div>
        </div>

        <ProgressStepper steps={STAGE_STEPS} currentIndex={stageIndex} />

        {/* SLA strip — Caso 4 */}
        <SlaStrip c={c} />
      </Card>

      {derivation && (
        <Card padding="sm" className="mt-4 border-status-warning/30">
          <div className="flex items-start gap-3">
            <AlertCircle size={16} className="text-status-warning shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <Kicker tone="muted" className="block mb-1">
                Derivado al back office · {formatDateTimeCL(derivation.derivedAt)}
              </Kicker>
              <p className="text-body-sm text-text-secondary">{derivation.note}</p>
            </div>
          </div>
        </Card>
      )}

      {/* Tabs */}
      <nav className="mt-8 border-b border-border-hairline">
        <ul className="flex gap-6">
          {TABS.map((tab) => (
            <li key={tab.key}>
              <button
                type="button"
                onClick={() => onTabChange(tab.key)}
                className={cn(
                  'pb-3 -mb-px text-body-sm transition-colors duration-base',
                  'focus:outline-none focus-visible:text-accent',
                  activeTab === tab.key
                    ? 'text-text-primary font-medium border-b-2 border-accent'
                    : 'text-text-muted hover:text-text-secondary',
                )}
                aria-current={activeTab === tab.key ? 'page' : undefined}
              >
                {tab.label}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      <div className="mt-8">
        {activeTab === 'resumen' && (
          <TabResumen
            c={c}
            derivation={derivation}
            onOpenDerivation={onOpenDerivation}
            customerLookup={customerLookup}
          />
        )}
        {activeTab === 'documentos' && <TabDocumentos documents={c.documents} />}
        {activeTab === 'operacion' && <TabOperacion c={c} customerLookup={customerLookup} />}
        {activeTab === 'historia' && <TabHistoria events={c.timeline} />}
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────
// SLA strip
// ─────────────────────────────────────────────────────────────

function SlaStrip({ c }: { c: Case }) {
  // Datos sintéticos coherentes para la demo
  const sla = {
    daysLeft: c.stage === 'documentos' ? 3 : 7,
    responsible: 'tú',
    nextMilestone: c.stage === 'documentos' ? 'tasación independiente' : 'evaluación de comité',
    etaDays: c.stage === 'documentos' ? 2 : 4,
  };

  return (
    <div className="flex flex-wrap items-center gap-x-6 gap-y-2 pt-6 border-t border-border-hairline text-body-sm">
      <span className="inline-flex items-center gap-2 text-text-secondary">
        <Clock size={14} className="text-text-muted" />
        <span className="text-text-muted">SLA fase actual ·</span>
        <span className="text-text-primary tabular-nums font-medium">
          {sla.daysLeft} días restantes
        </span>
      </span>
      <span aria-hidden className="text-text-muted">·</span>
      <span>
        <span className="text-text-muted">Responsable · </span>
        <span className="text-text-primary">{sla.responsible}</span>
      </span>
      <span aria-hidden className="text-text-muted">·</span>
      <span>
        <span className="text-text-muted">Próximo hito · </span>
        <span className="text-text-primary">{sla.nextMilestone}</span>
      </span>
      <span aria-hidden className="text-text-muted">·</span>
      <span>
        <span className="text-text-muted">ETA · </span>
        <span className="text-text-primary tabular-nums">{sla.etaDays} días</span>
      </span>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Tabs
// ─────────────────────────────────────────────────────────────

function TabResumen({
  c,
  derivation,
  onOpenDerivation,
  customerLookup,
}: {
  c: Case;
  derivation: { note: string } | null;
  onOpenDerivation: () => void;
  customerLookup: (id: string) => ReturnType<typeof getCustomer>;
}) {
  const customer = customerLookup(c.customerId);
  const coTitular = c.coTitularId ? customerLookup(c.coTitularId) : null;
  const ingreso = customer?.employment.netMonthlyCLP ?? 0;
  const previredDoc = c.documents.find((d) => d.kind === 'previred');
  const previredAvg = previredDoc?.extractedData?.promedioCotizadoCLP as number | undefined;
  const gapPct = previredAvg && ingreso ? Math.abs(ingreso - previredAvg) / ingreso : null;

  return (
    <div className="grid grid-cols-12 gap-8">
      <div className="col-span-12 lg:col-span-7 space-y-10">
        <section>
          <SectionTitle rule={false}>Datos rescatados</SectionTitle>
          <ul className="mt-4 border-t border-border-hairline">
            <DataRow label="Titular" value={customer?.fullName ?? '—'} source="Registro Civil" />
            <DataRow
              label="Renta líquida declarada"
              value={ingreso ? formatCLP(ingreso) : '—'}
              source={customer?.employment.employer ?? 'Empleador'}
            />
            {previredAvg && (
              <DataRow
                label="Promedio cotizado Previred"
                value={formatCLP(previredAvg)}
                source={`Previred · ${previredDoc?.extractedData?.mesesCotizados ?? 12} meses`}
                warning={gapPct !== null && gapPct > 0.1}
              />
            )}
            {coTitular && (
              <DataRow
                label="Co-titular"
                value={`${coTitular.fullName} · ${coTitular.employment.kind}`}
                source="Registro Civil"
              />
            )}
            <DataRow label="DTI proyectado" value="13,9%" source="Cruce CMF · cálculo motor" />
            <DataRow
              label="Carpeta tributaria 2025"
              value="F22 declarada, sin observaciones"
              source="SII"
            />
          </ul>
        </section>

        {gapPct !== null && gapPct > 0.1 && !derivation && (
          <section>
            <Kicker tone="muted" className="block mb-3">
              Atención
            </Kicker>
            <Card padding="sm" className="border-status-warning/30 space-y-3">
              <AiInsight
                variant="warning"
                message={
                  <>
                    Renta declarada (<span className="tabular-nums">{formatCLP(ingreso)}</span>) excede en{' '}
                    <span className="tabular-nums">{formatPct(gapPct * 100, 1)}</span> al promedio cotizado en Previred. Revisa antes de avanzar a comité.
                  </>
                }
              />
              <div className="pl-7">
                <button
                  type="button"
                  onClick={onOpenDerivation}
                  className={cn(
                    'inline-flex items-center gap-2 px-4 py-2 text-body-sm font-medium',
                    'border border-border-hairline bg-bg-card',
                    'hover:border-text-primary hover:bg-bg-page',
                    'transition-all duration-base ease-out-soft',
                    'focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:ring-offset-2 focus-visible:ring-offset-bg-card',
                  )}
                >
                  <Forward size={14} />
                  Derivar a back office con esta nota
                </button>
              </div>
            </Card>
          </section>
        )}
      </div>

      <div className="col-span-12 lg:col-span-5 space-y-10">
        <section>
          <SectionTitle rule={false}>Próximas acciones</SectionTitle>
          <ol className="mt-4 space-y-4">
            <ActionItem
              n="01"
              title="Llamar al cliente"
              hint="Conversar la inconsistencia de Previred antes de pedir nuevos documentos."
            />
            <ActionItem
              n="02"
              title="Solicitar contrato laboral o 3 liquidaciones recientes"
              hint="Para descartar bono no habitual o renta variable."
            />
            <ActionItem
              n="03"
              title="Esperar tasación independiente"
              hint="Visita agendada con Gestión Inmobiliaria SpA para el 22 may."
            />
          </ol>
        </section>

        <section>
          <SectionTitle rule={false}>Operación</SectionTitle>
          <dl className="mt-4 border-t border-border-hairline">
            <KVRow k="Monto solicitado" v={formatUF(c.requestedUF)} />
            <KVRow
              k="Pie"
              v={`${formatUF(c.downPaymentUF)} · ${Math.round((c.downPaymentUF / c.property.valueUF) * 100)}%`}
            />
            <KVRow k="Plazo" v={`${c.termYears} años`} />
            <KVRow k="Tasa anual" v={formatPct(c.annualRate)} />
            {c.monthlyPaymentUF && <KVRow k="Cuota mensual" v={`UF ${c.monthlyPaymentUF.toFixed(1)}`} />}
            <KVRow k="Propiedad" v={`${c.property.type}, ${formatUF(c.property.valueUF)}`} />
          </dl>
        </section>
      </div>
    </div>
  );
}

function DataRow({
  label,
  value,
  source,
  warning,
}: {
  label: string;
  value: string;
  source: string;
  warning?: boolean;
}) {
  return (
    <li className="grid grid-cols-12 gap-4 items-baseline py-4 border-b border-border-hairline">
      <span className="col-span-12 sm:col-span-5 text-body-sm text-text-primary">{label}</span>
      <span
        className={cn(
          'col-span-8 sm:col-span-4 text-body-sm tabular-nums',
          warning ? 'text-status-warning font-medium' : 'text-text-primary',
        )}
      >
        {value}
      </span>
      <span className="col-span-4 sm:col-span-3 text-caption text-text-muted text-right truncate">
        {source}
      </span>
    </li>
  );
}

function ActionItem({ n, title, hint }: { n: string; title: string; hint: string }) {
  return (
    <li className="flex gap-4">
      <span className="text-kicker text-accent-muted shrink-0 w-6 tabular-nums">{n}</span>
      <div className="flex-1">
        <div className="text-body-sm text-text-primary font-medium">{title}</div>
        <div className="text-body-sm text-text-secondary mt-0.5">{hint}</div>
      </div>
    </li>
  );
}

function KVRow({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between gap-3 py-2.5 border-b border-border-hairline">
      <dt className="text-body-sm text-text-muted">{k}</dt>
      <dd className="text-body-sm text-text-primary tabular-nums">{v}</dd>
    </div>
  );
}

function TabDocumentos({ documents }: { documents: CaseDocument[] }) {
  return (
    <ul className="border-t border-border-hairline">
      {documents.map((d) => (
        <li
          key={d.id}
          className="grid grid-cols-12 gap-4 items-baseline py-4 border-b border-border-hairline"
        >
          <span className="col-span-12 sm:col-span-7 text-body-sm text-text-primary">
            {d.label}
          </span>
          <span className="col-span-7 sm:col-span-3 text-caption text-text-muted tabular-nums">
            {d.uploadedAt ? formatDateCL(d.uploadedAt) : '—'}
          </span>
          <span className="col-span-5 sm:col-span-2 flex justify-end">
            <Pill
              size="sm"
              variant={
                d.status === 'validado'
                  ? 'success'
                  : d.status === 'rechazado'
                    ? 'error'
                    : d.status === 'recibido'
                      ? 'info'
                      : 'neutral'
              }
            >
              {d.status}
            </Pill>
          </span>
        </li>
      ))}
    </ul>
  );
}

function TabOperacion({
  c,
  customerLookup,
}: {
  c: Case;
  customerLookup: (id: string) => ReturnType<typeof getCustomer>;
}) {
  const customer = customerLookup(c.customerId);
  return (
    <dl className="border-t border-border-hairline">
      <KVRow k="Monto solicitado" v={formatUF(c.requestedUF)} />
      <KVRow
        k="Pie aportado"
        v={`${formatUF(c.downPaymentUF)} (${Math.round((c.downPaymentUF / c.property.valueUF) * 100)}%)`}
      />
      <KVRow k="Plazo" v={`${c.termYears} años`} />
      <KVRow k="Tasa anual" v={formatPct(c.annualRate)} />
      {c.monthlyPaymentUF && <KVRow k="Cuota mensual estimada" v={`UF ${c.monthlyPaymentUF.toFixed(1)}`} />}
      <KVRow k="Propiedad" v={`${c.property.type}, ${c.property.commune}`} />
      <KVRow k="Valor declarado" v={formatUF(c.property.valueUF)} />
      <KVRow k="Vendedor" v={c.property.developer ?? '—'} />
      {c.promesa && <KVRow k="Promesa firmada" v={`${formatUF(c.promesa.amountUF)} · ${formatDateCL(c.promesa.signedAt)}`} />}
      {customer && (
        <>
          <KVRow k="Renta líquida titular" v={formatCLP(customer.employment.netMonthlyCLP)} />
          <KVRow k="Antigüedad laboral" v={`${customer.employment.tenureMonths} meses`} />
        </>
      )}
    </dl>
  );
}

function TabHistoria({ events }: { events: TimelineEvent[] }) {
  return (
    <ul className="space-y-6">
      {events.map((event) => (
        <li key={event.id} className="flex items-start gap-3 pb-6 border-b border-border-hairline last:border-b-0">
          <span
            aria-hidden
            className={cn('w-1.5 h-1.5 rounded-full mt-2 shrink-0', ACTOR_DOT[event.actor.kind])}
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-baseline justify-between gap-3">
              <Kicker tone={event.actor.kind === 'agente' ? 'accent' : 'muted'}>
                {ACTOR_LABEL[event.actor.kind]}
                {event.actor.name ? ` · ${event.actor.name}` : ''}
              </Kicker>
              <span className="text-caption text-text-muted tabular-nums shrink-0">
                {formatDateTimeCL(event.timestamp)}
              </span>
            </div>
            <p className="text-body-sm text-text-primary mt-1">{event.title}</p>
            {event.detail && (
              <p className="text-body-sm text-text-secondary mt-1">{event.detail}</p>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}

// ─────────────────────────────────────────────────────────────
// Copilot panel (right)
// ─────────────────────────────────────────────────────────────

function CopilotPanel({
  caseData,
  comms,
  derivation,
}: {
  caseData: Case;
  comms: Communication[];
  derivation: { note: string; derivedAt: string } | null;
}) {
  const stream = useClaudeStream();

  // Re-stream cada vez que cambia el caso
  useEffect(() => {
    const context = buildCaseContext({ c: caseData, comms, derivation });
    stream.start({
      messages: [{ role: 'user', content: buildCopilotPrompt(context) }],
      system: COPILOT_SYSTEM,
      maxTokens: 500,
      temperature: 0.6,
      cacheKey:
        caseData.id === 'HIP-2026-0042' && !derivation
          ? 'copilot_francisco_inconsistencia'
          : undefined,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [caseData.id, Boolean(derivation)]);

  const sections = useMemo(() => parseCopilot(stream.text), [stream.text]);
  const showInitialSkeleton = stream.isStreaming && stream.text.length === 0 && !stream.error;

  return (
    <aside>
      <Card padding="lg" className="space-y-6 sticky top-6">
        <header>
          <Kicker>Copiloto IA · al oído</Kicker>
          <h3 className="text-h3 text-text-primary mt-2">Lo que veo en este caso</h3>
        </header>

        {stream.error && stream.error.kind !== 'cancelled' && stream.error.message !== 'Aborted' ? (
          <AiInsight variant="error" message={stream.error.message} />
        ) : showInitialSkeleton ? (
          <div className="space-y-4">
            <Skeleton className="h-3 w-3/5" />
            <Skeleton className="h-3 w-4/5" />
            <Skeleton className="h-3 w-2/3" />
          </div>
        ) : (
          <CopilotSectionsView sections={sections} streaming={stream.isStreaming} />
        )}
      </Card>
    </aside>
  );
}

function CopilotSectionsView({
  sections,
  streaming,
}: {
  sections: ReturnType<typeof parseCopilot>;
  streaming: boolean;
}) {
  const { alerta, proximoPaso, contexto } = sections;
  const showCursor = streaming;

  return (
    <div className="space-y-6 animate-fade-in">
      {alerta && (
        <section>
          <div className="flex items-center gap-2 mb-2">
            <Pill variant="warning" size="sm">
              Alerta
            </Pill>
          </div>
          <p className="text-body-sm text-text-primary leading-relaxed">{alerta}</p>
        </section>
      )}

      {proximoPaso && (
        <section>
          <Kicker tone="muted" className="block mb-2">
            Próximo paso
          </Kicker>
          <p className="text-body text-text-primary leading-relaxed font-medium">
            {proximoPaso}
          </p>
        </section>
      )}

      {contexto && (
        <section>
          <Kicker tone="muted" className="block mb-2">
            Contexto útil
          </Kicker>
          <p className="text-body-sm text-text-secondary leading-relaxed">
            {contexto}
            {showCursor && <AiCursor />}
          </p>
        </section>
      )}

      {/* While streaming, if no section has content yet, show cursor on its own */}
      {showCursor && !alerta && !proximoPaso && !contexto && (
        <AiMessage label="Copiloto IA" streaming>
          <AiCursor />
        </AiMessage>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Derivation modal
// ─────────────────────────────────────────────────────────────

interface DerivationModalProps {
  c: Case;
  onClose: () => void;
  onConfirm: (note: string) => void;
  customerLookup: (id: string) => ReturnType<typeof getCustomer>;
}

function DerivationModal({ c, onClose, onConfirm, customerLookup }: DerivationModalProps) {
  const customer = customerLookup(c.customerId);
  const previredDoc = c.documents.find((d) => d.kind === 'previred');
  const previredAvg = previredDoc?.extractedData?.promedioCotizadoCLP as number | undefined;
  const declared = customer?.employment.netMonthlyCLP ?? 0;
  const gap = previredAvg && declared ? Math.abs(declared - previredAvg) / declared : 0;

  const defaultNote = previredAvg
    ? `Renta declarada en liquidaciones (${formatCLP(declared)}) supera en ${formatPct(gap * 100, 1)} al promedio cotizado en Previred últimos 12 meses (${formatCLP(previredAvg)}). Posibles causas: bono no habitual, renta variable, o transcripción incorrecta. Sugiero revisar contrato laboral y últimas 3 liquidaciones antes de avanzar al comité de riesgo.`
    : 'Caso derivado al back office para revisión adicional.';

  const [note, setNote] = useState(defaultNote);

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
      <div
        role="dialog"
        aria-label="Derivar al back office"
        className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 pointer-events-none animate-fade-in"
      >
        <div className="bg-bg-card border border-border-hairline shadow-soft w-full max-w-2xl max-h-[90vh] overflow-y-auto pointer-events-auto">
          <header className="px-8 py-6 border-b border-border-hairline flex items-start justify-between gap-4">
            <div>
              <Kicker>Acción · Derivación</Kicker>
              <h2 className="text-h2 text-text-primary mt-2">Derivar al back office</h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="text-text-muted hover:text-text-primary transition-colors duration-base"
              aria-label="Cerrar"
            >
              <X size={18} />
            </button>
          </header>

          <div className="px-8 py-6 space-y-6">
            <div className="space-y-1">
              <Kicker tone="muted">Caso</Kicker>
              <p className="text-body text-text-primary">
                #{c.id} · {customer?.fullName}
              </p>
              <p className="text-body-sm text-text-secondary">
                {c.property.address}, {c.property.commune} · {formatUF(c.requestedUF)}
              </p>
            </div>

            <div className="space-y-2">
              <label htmlFor="derivation-note" className="text-body-sm text-text-secondary">
                Nota para el back office
              </label>
              <textarea
                id="derivation-note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={6}
                className={cn(
                  'w-full bg-bg-page border border-border-hairline',
                  'px-4 py-3 text-body-sm text-text-primary',
                  'focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/15',
                  'resize-none',
                )}
              />
              <p className="text-caption text-text-muted">
                Esta nota se registrará como evento en el timeline del caso y será visible en el dashboard de back office.
              </p>
            </div>
          </div>

          <footer className="px-8 py-5 border-t border-border-hairline flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className={cn(
                'inline-flex items-center px-5 py-2.5 text-body font-medium',
                'border border-border-hairline bg-bg-card text-text-primary',
                'hover:border-text-primary hover:bg-bg-page',
                'transition-all duration-base ease-out-soft',
              )}
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={() => onConfirm(note.trim())}
              disabled={!note.trim()}
              className={cn(
                'inline-flex items-center gap-2 px-5 py-2.5 text-body font-medium',
                'bg-accent text-text-inverse',
                'hover:bg-accent-muted transition-colors duration-base ease-out-soft',
                'disabled:opacity-40 disabled:cursor-not-allowed',
              )}
            >
              <Forward size={14} />
              Derivar
            </button>
          </footer>
        </div>
      </div>
    </>
  );
}

// ─────────────────────────────────────────────────────────────
// LiveClientCaptureBanner
// Shows what the client just conversed/selected in real time.
// Reads from the shared operationStore — single source of truth.
// ─────────────────────────────────────────────────────────────

function LiveClientCaptureBanner() {
  const conversation = useOperationStore((s) => s.conversation);
  const property = useOperationStore((s) => s.property);
  const selectedPlazo = useOperationStore((s) => s.selectedPlazo);
  const scenarios = useOperationStore((s) => s.scenarios);
  const plazoSolicitado = useOperationStore((s) => s.plazoSolicitado);
  const stage = useOperationStore((s) => s.stage);

  const hasAnyData =
    Object.keys(conversation).length > 0 ||
    Object.keys(property).length > 0 ||
    selectedPlazo !== null;

  if (!hasAnyData) return null;

  // Find the selected scenario for full details
  const selectedScenario = selectedPlazo
    ? scenarios.find((s) => s.plazoAnios === selectedPlazo)
    : null;

  // Resolve display values from operation store (property > conversation)
  const direccion = property.direccion ?? conversation.direccion ?? '—';
  const comuna = property.comuna ?? conversation.comuna ?? '—';
  const valorUF = property.valorUF ?? conversation.valorPropiedadUF ?? null;
  const piePct = property.piePorcentaje ?? conversation.piePorcentaje ?? null;
  const plazoDisplay = selectedPlazo ?? plazoSolicitado ?? null;
  const regimen = conversation.regimenPatrimonial ?? null;

  return (
    <div className="mb-6 border border-accent/30 bg-accent/5 p-5">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-0.5">
          <Sparkles size={16} className="text-accent" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-kicker uppercase tracking-[0.14em] font-medium text-accent">
              Captura en vivo · {currentCustomer.fullName}
            </span>
            <Pill variant="error" size="sm">
              {stage === 'in_conversation'
                ? `Conversando con ${BRAND.assistantName}`
                : stage === 'in_form'
                ? 'Llenando formulario'
                : stage === 'simulating'
                ? 'Viendo simulación'
                : stage === 'selected'
                ? 'Escenario elegido'
                : 'En sesión'}
            </Pill>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-x-6 gap-y-3 text-body-sm">
            <DataPoint
              label="Propiedad"
              value={direccion !== '—' ? `${direccion}` : '—'}
              sub={comuna !== '—' ? comuna : undefined}
            />
            <DataPoint
              label="Valor"
              value={valorUF ? `UF ${valorUF.toLocaleString('es-CL')}` : '—'}
              sub={valorUF ? formatCLP(valorUF * 40424.99) : undefined}
            />
            <DataPoint
              label="Pie"
              value={piePct ? `${piePct}%` : '—'}
              sub={valorUF && piePct ? `UF ${Math.round((valorUF * piePct) / 100).toLocaleString('es-CL')}` : undefined}
            />
            <DataPoint
              label="Plazo"
              value={plazoDisplay ? `${plazoDisplay} años` : '—'}
              sub={plazoSolicitado && !selectedPlazo ? 'Pedido en chat' : selectedPlazo ? 'Confirmado' : undefined}
            />
            <DataPoint
              label="Régimen"
              value={regimen ?? '—'}
            />
          </div>

          {selectedScenario && (
            <div className="mt-4 pt-3 border-t border-accent/20">
              <div className="flex items-center gap-2 text-body-sm">
                <span className="text-text-secondary">Escenario elegido:</span>
                <span className="font-medium text-text-primary">
                  Tasa {selectedScenario.tasaAnual}% nominal
                </span>
                <span className="text-text-muted">·</span>
                <span className="font-medium text-text-primary">
                  Dividendo UF {selectedScenario.dividendoMensualUF.toFixed(2)}
                </span>
                <span className="text-text-muted">·</span>
                <span className="text-text-secondary">
                  CAE {selectedScenario.cae}%
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function DataPoint({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div>
      <div className="text-caption uppercase tracking-[0.1em] text-text-muted mb-0.5">
        {label}
      </div>
      <div className="text-body-sm text-text-primary font-medium tabular-nums">
        {value}
      </div>
      {sub && (
        <div className="text-caption text-text-secondary tabular-nums">{sub}</div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// RepairControlPanel
// Permite al ejecutivo del banco:
//  - Ver el estado de documentos del comprador/vendedor/inmobiliaria
//  - Lanzar reparos sobre documentos en validación
//  - Ver reparos resueltos y aprobar/rechazar
// ─────────────────────────────────────────────────────────────

function RepairControlPanel() {
  const docs = usePostApprovalStore((s) => s.docs);
  const propertyType = usePostApprovalStore((s) => s.propertyType);
  const buyerName = usePostApprovalStore((s) => s.buyerName);
  const raiseRepair = usePostApprovalStore((s) => s.raiseRepair);
  const validateDoc = usePostApprovalStore((s) => s.validateDoc);
  const uploadDoc = usePostApprovalStore((s) => s.uploadDoc);

  const [activeRepairDocId, setActiveRepairDocId] = useState<string | null>(null);
  const [repairReason, setRepairReason] = useState('');
  const [viewerDocId, setViewerDocId] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [generatedSuggestion, setGeneratedSuggestion] = useState('');

  const inValidation = docs.filter((d) => d.status === 'en_validacion');
  const inRepair = docs.filter((d) => d.status === 'con_reparo');
  const uploadableOnBehalf = docs.filter(
    (d) => d.status === 'pendiente' && d.responsible !== 'ejecutivo',
  );

  if (inValidation.length === 0 && inRepair.length === 0 && uploadableOnBehalf.length === 0) {
    return null;
  }

  // Tras enviar un reparo se ofrece saltar a la vista del cliente. El recorrido
  // de la demostración cruza varias veces entre actores y este es el momento de
  // mayor interés: conviene que el salto sea inmediato y no exija volver al
  // índice.
  const setRole = useAppStore((st) => st.setRole);
  const [reparoEnviado, setReparoEnviado] = useState<string | null>(null);

  function handleSendRepair(docId: string) {
    if (!repairReason.trim()) return;
    raiseRepair(docId, repairReason.trim());
    setReparoEnviado(docId);
    setRepairReason('');
    setActiveRepairDocId(null);
    setGeneratedSuggestion('');
  }

  function getDefaultReasons(doc: OperationDoc): string[] {
    const name = doc.name.toLowerCase();
    if (name.includes('liquidación') || name.includes('liquidaciones')) {
      return [
        'La última liquidación tiene fecha superior a 30 días. Solicitar versión más reciente.',
        'Falta el detalle de cotizaciones previsionales o no es legible.',
        'El monto del haber líquido no coincide con la declaración del cliente.',
      ];
    }
    if (name.includes('dominio') || name.includes('hipoteca') || name.includes('gravamen')) {
      return [
        'El certificado tiene fecha mayor a 30 días. Solicitar uno actualizado.',
        'No incluye el último período de inscripción en el CBR.',
        'Datos del titular no coinciden con la cédula de identidad.',
      ];
    }
    if (name.includes('afp') || name.includes('cotizaciones')) {
      return [
        'Faltan meses de cotizaciones en el período requerido.',
        'El certificado no está timbrado o firmado por la AFP.',
        'Período cubierto inferior a 12 meses.',
      ];
    }
    if (name.includes('dicom') || name.includes('antecedentes')) {
      return [
        'El certificado tiene fecha superior a 30 días. Solicitar uno actualizado.',
        'Documento incompleto o falta el resumen final.',
        'No coincide con el tipo solicitado (DICOM o Equifax).',
      ];
    }
    if (name.includes('tasación') || name.includes('tasacion')) {
      return [
        'El informe no incluye fotografías de respaldo exigidas por norma.',
        'El valor tasado difiere significativamente del valor de transacción.',
        'Falta firma del perito tasador certificado.',
      ];
    }
    return [
      'Documento poco legible. Solicitar versión de mejor calidad.',
      'El documento no incluye todos los datos requeridos.',
      'La fecha de emisión supera la vigencia aceptada.',
    ];
  }

  async function handleGenerateSuggestion(doc: OperationDoc) {
    setGenerating(true);
    setGeneratedSuggestion('');
    try {
      const resp = await fetch('/api/claude', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-6',
          max_tokens: 256,
          system:
            'Eres asistente del ejecutivo de un banco chileno revisando documentación hipotecaria. ' +
            'Genera UN motivo de reparo (1-2 oraciones máximo) en español neutro chileno, ' +
            'profesional, claro, accionable. Sin saludos ni explicaciones extra. Solo el motivo.',
          messages: [{
            role: 'user',
            content: `Genera un motivo plausible de reparo para el documento "${doc.name}" en una operación hipotecaria. Contexto: ${doc.description}. Motivo:`,
          }],
        }),
      });
      if (!resp.ok) throw new Error('AI gen failed');
      const reader = resp.body?.getReader();
      const decoder = new TextDecoder();
      let acc = '';
      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          chunk.split('\n').forEach((line) => {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6));
                if (data.type === 'content_block_delta' && data.delta?.text) {
                  acc += data.delta.text;
                  setGeneratedSuggestion(acc);
                }
              } catch { /* ignore */ }
            }
          });
        }
      }
      setGeneratedSuggestion(acc.trim() || 'No se pudo generar sugerencia. Intenta de nuevo.');
    } catch {
      setGeneratedSuggestion('No se pudo generar la sugerencia. Intenta de nuevo o escribe el motivo manualmente.');
    } finally {
      setGenerating(false);
    }
  }

  const viewerDoc = viewerDocId ? docs.find((d) => d.id === viewerDocId) : null;

  return (
    <div className="mb-6 border border-border-hairline bg-bg-card p-5">
      <div className="flex items-center gap-2 mb-4">
        <AlertCircle size={16} className="text-accent" />
        <span className="text-kicker uppercase tracking-[0.14em] font-medium text-accent">
          Control de documentos — Operación {buyerName}
        </span>
      </div>

      {inValidation.length > 0 && (
        <div className="mb-5">
          <div className="text-body-sm font-semibold text-text-primary mb-3">
            Documentos por validar ({inValidation.length})
          </div>
          <ul className="space-y-2">
            {inValidation.map((d) => (
              <li key={d.id} className="border border-border-hairline bg-bg-page p-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="text-body-sm font-medium text-text-primary">{d.name}</div>
                    <div className="text-caption text-text-muted mt-0.5">
                      {d.uploadedByName ? `Subido por ${d.uploadedByName}` : `Provisto por ${POSTAPP_ACTOR_LABEL[d.responsible]}`}
                    </div>
                  </div>
                  <div className="flex gap-2 flex-shrink-0 flex-wrap justify-end">
                    <button
                      onClick={() => setViewerDocId(d.id)}
                      className="px-3 py-1.5 border border-border-hairline text-text-primary text-caption font-medium hover:bg-bg-sunken transition-colors"
                    >
                      Ver documento
                    </button>
                    <button
                      onClick={() => validateDoc(d.id)}
                      className="px-3 py-1.5 bg-status-success text-text-inverse text-caption font-medium hover:opacity-90"
                    >
                      Aprobar
                    </button>
                    <button
                      onClick={() => {
                        setActiveRepairDocId(d.id === activeRepairDocId ? null : d.id);
                        setRepairReason('');
                        setGeneratedSuggestion('');
                      }}
                      className="px-3 py-1.5 bg-accent text-text-inverse text-caption font-medium hover:bg-accent-muted"
                    >
                      Solicitar reparo
                    </button>
                  </div>
                </div>

                {activeRepairDocId === d.id && (
                  <div className="mt-3 pt-3 border-t border-border-hairline">
                    <label className="text-caption uppercase tracking-[0.1em] text-text-muted mb-2 block">
                      Motivo del reparo
                    </label>
                    <div className="mb-3">
                      <div className="text-caption text-text-muted mb-2">Sugerencias frecuentes:</div>
                      <div className="flex flex-wrap gap-2">
                        {getDefaultReasons(d).map((reason, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() => setRepairReason(reason)}
                            className="text-left text-caption px-2.5 py-1.5 border border-border-hairline bg-bg-card hover:border-accent hover:bg-bg-page transition-colors max-w-md"
                          >
                            {reason}
                          </button>
                        ))}
                        <button
                          type="button"
                          onClick={() => handleGenerateSuggestion(d)}
                          disabled={generating}
                          className="text-caption px-2.5 py-1.5 border border-accent/40 text-accent bg-bg-card hover:bg-accent hover:text-text-inverse transition-colors disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-1"
                        >
                          {generating ? 'Generando…' : 'Generar otra ✨'}
                        </button>
                      </div>
                      {generatedSuggestion && (
                        <button
                          type="button"
                          onClick={() => setRepairReason(generatedSuggestion)}
                          className="mt-2 text-left text-caption px-2.5 py-1.5 border border-accent/40 bg-bg-page hover:bg-bg-card max-w-md block transition-colors"
                        >
                          <span className="text-accent font-medium">IA · </span>
                          {generatedSuggestion}
                        </button>
                      )}
                    </div>
                    <textarea
                      value={repairReason}
                      onChange={(e) => setRepairReason(e.target.value)}
                      placeholder="Selecciona una sugerencia o escribe el motivo del reparo..."
                      className="w-full p-2 text-body-sm border border-border-hairline bg-bg-card focus:outline-none focus:border-accent resize-none"
                      rows={3}
                    />
                    <div className="flex gap-2 mt-2 flex-wrap">
                      <button
                        onClick={() => handleSendRepair(d.id)}
                        disabled={!repairReason.trim()}
                        className="px-3 py-1.5 bg-accent text-text-inverse text-caption font-medium hover:bg-accent-muted disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Enviar reparo a {POSTAPP_ACTOR_LABEL[d.responsible].toLowerCase()}
                      </button>
                      <button
                        onClick={() => {
                          setActiveRepairDocId(null);
                          setRepairReason('');
                          setGeneratedSuggestion('');
                        }}
                        className="px-3 py-1.5 border border-border-hairline text-body-sm hover:bg-bg-sunken"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {inRepair.length > 0 && (
        <div>
          <div className="text-body-sm font-semibold text-text-primary mb-3">
            Con reparo activo ({inRepair.length})
          </div>
          <ul className="space-y-2">
            {inRepair.map((d) => (
              <li key={d.id} className="border-l-2 border-status-error bg-status-error-bg/30 pl-3 py-2">
                <div className="text-body-sm font-medium text-text-primary">{d.name}</div>
                <div className="text-caption text-text-secondary mt-0.5">
                  Esperando que {POSTAPP_ACTOR_LABEL[d.responsible].toLowerCase()} resuba el documento.
                </div>
                {d.repairReason && (
                  <div className="text-caption text-text-muted mt-1 italic">"{d.repairReason}"</div>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {uploadableOnBehalf.length > 0 && (
        <div className="mt-5 pt-5 border-t border-border-hairline">
          <div className="text-body-sm font-semibold text-text-primary mb-1">
            Subir documento en nombre del cliente
          </div>
          <div className="text-caption text-text-muted mb-3">
            Si el cliente te entregó papeles físicos o por correo, súbelos aquí en su nombre.
            La auditoría queda registrada.
          </div>
          <ul className="space-y-2">
            {uploadableOnBehalf.map((d) => (
              <li key={d.id} className="border border-border-hairline bg-bg-page p-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="text-body-sm font-medium text-text-primary">{d.name}</div>
                    <div className="text-caption text-text-muted mt-0.5">
                      Responsable: {POSTAPP_ACTOR_LABEL[d.responsible]}
                    </div>
                  </div>
                  <button
                    onClick={() => uploadDoc(d.id, 'ejecutivo')}
                    className="px-3 py-1.5 bg-text-primary text-text-inverse text-caption font-medium hover:bg-accent transition-colors whitespace-nowrap"
                  >
                    ↑ Subir
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {reparoEnviado && (
        <div className="mt-5 border border-accent/40 bg-accent-soft p-4 flex items-center justify-between gap-4 flex-wrap">
          <div>
            <div className="text-body-sm font-semibold text-text-primary">
              Reparo enviado
            </div>
            <div className="text-caption text-text-secondary mt-0.5">
              El cliente ya lo tiene en su vista, con el motivo en lenguaje corriente.
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setReparoEnviado(null)}
              className="px-3 py-1.5 border border-border-hairline text-body-sm hover:bg-bg-page transition-colors"
            >
              Seguir aquí
            </button>
            <Link
              to="/cliente/seguimiento"
              onClick={() => setRole('cliente')}
              className="px-4 py-1.5 bg-accent text-white text-body-sm font-medium hover:bg-accent-muted transition-colors whitespace-nowrap"
            >
              Ver como lo recibe el cliente
            </Link>
          </div>
        </div>
      )}

      {viewerDoc && (
        <DocumentViewerModal doc={viewerDoc} onClose={() => setViewerDocId(null)} />
      )}
    </div>
  );
}

function DocumentViewerModal({ doc, onClose }: { doc: OperationDoc; onClose: () => void }) {
  const outcome = doc.scriptedOutcome;
  const extractedFields =
    outcome && (outcome.kind === 'validado' || outcome.kind === 'con_observacion')
      ? outcome.extractedFields
      : undefined;

  return (
    <>
      <div className="fixed inset-0 bg-text-primary/40 z-50" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center px-6 pointer-events-none">
        <div className="bg-bg-card border border-border-hairline shadow-lifted max-w-3xl w-full pointer-events-auto max-h-[85vh] overflow-y-auto">
          <div className="px-6 py-4 border-b border-border-hairline flex items-center justify-between sticky top-0 bg-bg-card">
            <div>
              <div className="text-caption uppercase tracking-[0.1em] text-text-muted">Visor de documento</div>
              <div className="text-body font-semibold text-text-primary mt-0.5">{doc.name}</div>
            </div>
            <button onClick={onClose} className="w-8 h-8 inline-flex items-center justify-center hover:bg-bg-sunken" aria-label="Cerrar">
              <span className="text-body">✕</span>
            </button>
          </div>
          <div className="px-6 py-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="border border-border-hairline bg-bg-page aspect-[3/4] flex items-center justify-center text-text-muted text-caption p-6 text-center">
              <div>
                <div className="mb-2">📄</div>
                Vista previa del documento<br />
                <span className="text-text-secondary text-body-sm font-medium">{doc.name}</span>
                <div className="mt-3 text-caption">(Placeholder — en producción se carga el archivo real)</div>
              </div>
            </div>
            <div>
              <div className="text-caption uppercase tracking-[0.1em] text-text-muted mb-3">Datos extraídos por IA</div>
              {extractedFields ? (
                <dl className="space-y-2">
                  {Object.entries(extractedFields).map(([k, v]) => (
                    <div key={k}>
                      <dt className="text-caption text-text-muted">{k}</dt>
                      <dd className="text-body-sm text-text-primary">{v}</dd>
                    </div>
                  ))}
                </dl>
              ) : (
                <div className="text-body-sm text-text-secondary">Sin datos extraídos por IA.</div>
              )}
              {doc.uploadHistory && doc.uploadHistory.length > 0 && (
                <div className="mt-6 pt-4 border-t border-border-hairline">
                  <div className="text-caption uppercase tracking-[0.1em] text-text-muted mb-2">Historial</div>
                  <ul className="space-y-1.5">
                    {doc.uploadHistory.map((h, i) => (
                      <li key={i} className="text-caption text-text-secondary">
                        <span className="text-text-primary font-medium">{h.uploadedByName}</span>
                        {h.note && <span> · {h.note}</span>}
                        <span className="text-text-muted"> · {new Date(h.uploadedAt).toLocaleString('es-CL')}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
