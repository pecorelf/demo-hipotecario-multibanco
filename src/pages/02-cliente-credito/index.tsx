import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Mail,
  MessageSquare,
} from 'lucide-react';
import {
  Card,
  Kicker,
  PageTitle,
  Pill,
  ProgressStepper,
  SectionTitle,
  Skeleton,
} from '@/components/ui';
import { AiCursor, AiMessage } from '@/components/ai';
import { useClaudeStream } from '@/hooks/useClaude';
import {
  AUDITOR_SYSTEM,
  buildAuditorPrompt,
} from '@/lib/prompts/auditor';
import {
  cases,
  communications as allCommunications,
  currentExecutive,
  getCustomer,
} from '@/data/mock';
import { formatDateCL, formatDateTimeCL, formatPct, formatUF } from '@/lib/format';
import { enrichCaseWithSimulation } from '@/lib/caseEnrichment';
import { useOperationStore } from '@/store/operationStore';
import { cn } from '@/lib/cn';
import type {
  ActorKind,
  CaseStage,
  Communication,
  Document as CaseDocument,
  TimelineEvent,
} from '@/types';

const STAGE_LABEL: Record<CaseStage, string> = {
  solicitud: 'Solicitud',
  cotizacion_inicial: 'Cotización inicial',
  recopilacion: 'Recopilación de antecedentes',
  cotizacion_final: 'Cotización Final CMF',
  tasacion: 'Tasación',
  escrituracion: 'Escrituración',
  activacion: 'Activación',
};

// Shorter labels for ProgressStepper (the stage labels overflow with 7 stages)
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

function stageAt(eventIndex: number): CaseStage {
  if (eventIndex <= 2) return 'solicitud';
  if (eventIndex <= 4) return 'cotizacion_inicial';
  if (eventIndex <= 7) return 'recopilacion';
  if (eventIndex <= 9) return 'cotizacion_final';
  if (eventIndex <= 11) return 'tasacion';
  if (eventIndex <= 13) return 'escrituracion';
  return 'activacion';
}

function stagePercent(stage: CaseStage): number {
  const i = STAGE_ORDER.indexOf(stage);
  return Math.round(((i + 0.5) / STAGE_ORDER.length) * 100);
}

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

const EXPLAINABLE_ACTORS: readonly ActorKind[] = ['sistema', 'agente'];

// ─────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────

export default function ClienteCredito() {
  const navigate = useNavigate();
  const rawCase = cases[0];

  // Pull live client decisions to overlay on the case data
  const opProperty = useOperationStore((s) => s.property);
  const opConversation = useOperationStore((s) => s.conversation);
  const opScenarios = useOperationStore((s) => s.scenarios);
  const opSelectedPlazo = useOperationStore((s) => s.selectedPlazo);
  const opPlazoSolicitado = useOperationStore((s) => s.plazoSolicitado);

  const caseData = useMemo(
    () =>
      enrichCaseWithSimulation(rawCase, {
        property: opProperty,
        conversation: opConversation,
        scenarios: opScenarios,
        selectedPlazo: opSelectedPlazo,
        plazoSolicitado: opPlazoSolicitado,
      }),
    [rawCase, opProperty, opConversation, opScenarios, opSelectedPlazo, opPlazoSolicitado],
  );

  const customer = getCustomer(caseData.customerId)!;
  const events = caseData.timeline;
  const comms = useMemo(
    () => allCommunications.filter((c) => c.caseId === caseData.id),
    [caseData.id],
  );

  const currentStage = caseData.stage;
  const currentStageIdx = STAGE_ORDER.indexOf(currentStage);
  const percent = stagePercent(currentStage);

  return (
    <div className="max-w-shell mx-auto px-6 md:px-10 lg:px-16 py-12 lg:py-16 space-y-16">
      <CaseHeader
        caseId={caseData.id}
        customerName={customer.fullName}
        property={caseData.property}
        requestedUF={caseData.requestedUF}
        termYears={caseData.termYears}
        annualRate={caseData.annualRate}
        stage={currentStage}
        percent={percent}
      />

      <ProgressStepper steps={STAGE_STEPS} currentIndex={currentStageIdx} />

      <div className="grid grid-cols-12 gap-8">
        <NextStepBlock
          className="col-span-12 lg:col-span-8"
          onGoToDocuments={() => navigate('/cliente/documentos')}
        />
        <CommunicationsBlock
          className="col-span-12 lg:col-span-4"
          items={comms}
          mode="latest"
        />
      </div>

      <hr className="border-t border-border-hairline" />

      <TimeTravelSection
        events={events}
        comms={comms}
        documents={caseData.documents}
        totalDocs={caseData.documents.length}
        caseValueUF={caseData.requestedUF}
      />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Header del caso
// ─────────────────────────────────────────────────────────────

interface CaseHeaderProps {
  caseId: string;
  customerName: string;
  property: { address: string; commune: string; type: string };
  requestedUF: number;
  termYears: number;
  annualRate: number;
  stage: CaseStage;
  percent: number;
}

function CaseHeader({
  caseId,
  customerName,
  property,
  requestedUF,
  termYears,
  annualRate,
  stage,
  percent,
}: CaseHeaderProps) {
  return (
    <header>
      <Kicker>
        Caso #{caseId} · {customerName}
      </Kicker>
      <PageTitle className="mt-3">Tu hipoteca en {property.address}</PageTitle>

      <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3 text-body-sm text-text-secondary">
        <span>
          <span className="text-text-muted">Monto · </span>
          <span className="text-text-primary tabular-nums">{formatUF(requestedUF)}</span>
        </span>
        <span aria-hidden className="text-text-muted">·</span>
        <span>
          <span className="text-text-muted">Plazo · </span>
          <span className="text-text-primary">{termYears} años</span>
        </span>
        <span aria-hidden className="text-text-muted">·</span>
        <span>
          <span className="text-text-muted">Tasa · </span>
          <span className="text-text-primary tabular-nums">{formatPct(annualRate)}</span>
        </span>
        <span aria-hidden className="text-text-muted">·</span>
        <span className="capitalize">
          <span className="text-text-muted">Propiedad · </span>
          <span className="text-text-primary">
            {property.type} en {property.commune}
          </span>
        </span>
      </div>

      <div className="mt-8 flex flex-wrap items-baseline gap-6">
        <Pill variant="info" size="base">
          {STAGE_LABEL[stage]}
        </Pill>
        <div className="flex items-baseline gap-3">
          <span className="text-stat-lg text-text-primary font-sans tabular-nums">
            {percent}%
          </span>
          <span className="text-body-sm text-text-muted">completo</span>
        </div>
      </div>

      <span aria-hidden className="block w-12 h-px bg-border-hairline mt-10" />
    </header>
  );
}

// ─────────────────────────────────────────────────────────────
// Próximo paso
// ─────────────────────────────────────────────────────────────

function NextStepBlock({
  className,
  onGoToDocuments,
}: {
  className?: string;
  onGoToDocuments: () => void;
}) {
  return (
    <Card padding="lg" className={cn('flex flex-col gap-6', className)}>
      <Kicker tone="muted">Próximo paso</Kicker>
      <div>
        <h2 className="text-h1 text-text-primary leading-tight">
          Sube el certificado de matrimonio
        </h2>
        <p className="text-body text-text-secondary mt-4 max-w-measure">
          Lo necesitamos para incorporar a María José como co-titular. Apenas lo
          tengamos, se completa la etapa de Documentación y pasamos a Estudio de títulos —
          no requiere que estés presente.
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-4 pt-2">
        <button
          type="button"
          onClick={onGoToDocuments}
          className={cn(
            'inline-flex items-center gap-2 px-7 py-3.5 text-body-lg font-medium',
            'bg-accent text-text-inverse',
            'hover:bg-accent-muted transition-colors duration-base ease-out-soft',
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:ring-offset-2 focus-visible:ring-offset-bg-card',
          )}
        >
          Ir a documentos
          <ArrowRight size={16} />
        </button>
        <span className="text-caption text-text-muted">
          También puedes hacerlo desde el email que Camila te envió el 12 may.
        </span>
      </div>
    </Card>
  );
}

// ─────────────────────────────────────────────────────────────
// Comunicaciones
// ─────────────────────────────────────────────────────────────

function CommunicationsBlock({
  className,
  items,
  mode,
}: {
  className?: string;
  items: Communication[];
  mode: 'latest' | 'time-travel';
}) {
  const sorted = useMemo(
    () =>
      [...items].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 3),
    [items],
  );

  return (
    <Card padding="lg" className={cn('flex flex-col gap-6', className)}>
      <header>
        <Kicker tone="muted">
          {mode === 'latest' ? 'Últimas comunicaciones' : 'Comunicaciones a esta fecha'}
        </Kicker>
      </header>
      {sorted.length === 0 ? (
        <p className="text-body-sm text-text-muted">Aún no hay comunicaciones.</p>
      ) : (
        <ul className="space-y-6">
          {sorted.map((c) => (
            <CommItem key={c.id} c={c} />
          ))}
        </ul>
      )}
    </Card>
  );
}

function CommItem({ c }: { c: Communication }) {
  const Icon = c.kind === 'email' ? Mail : MessageSquare;
  return (
    <li className="flex gap-3">
      <Icon size={14} className="text-text-muted shrink-0 mt-1" aria-hidden />
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline justify-between gap-3">
          <span className="text-body-sm text-text-primary font-medium truncate">
            {c.subject || c.from}
          </span>
          <span className="text-caption text-text-muted shrink-0 tabular-nums">
            {formatDateCL(c.date)}
          </span>
        </div>
        <p className="text-body-sm text-text-secondary mt-1">{c.summary}</p>
        <p className="text-caption text-text-muted mt-1">
          {c.kind.toUpperCase()} · {c.from}
        </p>
      </div>
    </li>
  );
}

// ─────────────────────────────────────────────────────────────
// Time travel
// ─────────────────────────────────────────────────────────────

interface TimeTravelSectionProps {
  events: TimelineEvent[];
  comms: Communication[];
  documents: CaseDocument[];
  totalDocs: number;
  caseValueUF: number;
}

function TimeTravelSection({
  events,
  comms,
  documents,
  totalDocs,
  caseValueUF,
}: TimeTravelSectionProps) {
  const [selectedIndex, setSelectedIndex] = useState(events.length - 1);
  const [expandedEventId, setExpandedEventId] = useState<string | null>(null);
  const explain = useClaudeStream();

  const selectedEvent = events[selectedIndex];
  const visibleEvents = events.slice(0, selectedIndex + 1);
  const stage = stageAt(selectedIndex);
  const docsKnown = useMemo(
    () => docsValidatedAt(documents, selectedEvent.timestamp),
    [documents, selectedEvent.timestamp],
  );
  const visibleComms = useMemo(
    () => comms.filter((c) => c.date <= selectedEvent.timestamp),
    [comms, selectedEvent.timestamp],
  );

  // If the expanded event leaves the visible window, collapse it
  useEffect(() => {
    if (!expandedEventId) return;
    const stillVisible = visibleEvents.some((e) => e.id === expandedEventId);
    if (!stillVisible) {
      setExpandedEventId(null);
      explain.reset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedIndex, expandedEventId]);

  function handleExpand(event: TimelineEvent) {
    if (expandedEventId === event.id) {
      setExpandedEventId(null);
      explain.reset();
      return;
    }
    setExpandedEventId(event.id);
    const idx = events.findIndex((e) => e.id === event.id);
    const priorEvents = events.slice(0, idx);
    explain.start({
      messages: [
        {
          role: 'user',
          content: buildAuditorPrompt({ event, priorEvents }),
        },
      ],
      system: AUDITOR_SYSTEM,
      maxTokens: 450,
      temperature: 0.4,
      cacheKey: event.id === 'EV-0042-08' ? 'auditor_cruce_cmf' : undefined,
    });
  }

  return (
    <section className="space-y-10">
      <header className="max-w-3xl">
        <SectionTitle>Historia del caso</SectionTitle>
        <p className="text-body-lg text-text-secondary mt-3 max-w-measure">
          Recorre tu caso, decisión por decisión. Cada punto del eje es un
          momento auditable. Mueve el slider, o usa las flechas ← → del
          teclado.
        </p>
      </header>

      <TimeSlider
        events={events}
        selectedIndex={selectedIndex}
        onChange={setSelectedIndex}
      />

      <div className="grid grid-cols-12 gap-8">
        <TimeTravelSnapshot
          className="col-span-12 lg:col-span-5"
          event={selectedEvent}
          stage={stage}
          docsKnown={docsKnown}
          totalDocs={totalDocs}
          comms={visibleComms}
          caseValueUF={caseValueUF}
        />

        <div className="col-span-12 lg:col-span-7">
          <Card padding="lg" className="space-y-2">
            <Kicker tone="muted">Eventos hasta este momento</Kicker>
            <ul className="divide-y divide-border-hairline -mx-2">
              {visibleEvents.map((event) => (
                <EventRow
                  key={event.id}
                  event={event}
                  isSelected={event.id === selectedEvent.id}
                  isExpanded={expandedEventId === event.id}
                  onExpand={() => handleExpand(event)}
                  explainText={explain.text}
                  explainStreaming={explain.isStreaming}
                  explainError={explain.error?.message ?? null}
                  isExplainTarget={expandedEventId === event.id}
                />
              ))}
            </ul>
          </Card>
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────
// Slider
// ─────────────────────────────────────────────────────────────

function TimeSlider({
  events,
  selectedIndex,
  onChange,
}: {
  events: TimelineEvent[];
  selectedIndex: number;
  onChange: (i: number) => void;
}) {
  const sectionRef = useRef<HTMLDivElement>(null);
  const selected = events[selectedIndex];

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'ArrowLeft' && selectedIndex > 0) {
        e.preventDefault();
        onChange(selectedIndex - 1);
      } else if (e.key === 'ArrowRight' && selectedIndex < events.length - 1) {
        e.preventDefault();
        onChange(selectedIndex + 1);
      }
    }
    section.addEventListener('keydown', onKey);
    return () => section.removeEventListener('keydown', onKey);
  }, [selectedIndex, events.length, onChange]);

  const max = events.length - 1;

  return (
    <div
      ref={sectionRef}
      tabIndex={0}
      role="group"
      aria-label="Línea de tiempo del caso"
      className="space-y-6 focus:outline-none"
    >
      <div className="flex items-baseline justify-between gap-4">
        <div>
          <Kicker tone="muted" className="block mb-1">
            Momento {selectedIndex + 1} de {events.length}
          </Kicker>
          <div className="text-h2 text-text-primary tabular-nums">
            {formatDateTimeCL(selected.timestamp)}
          </div>
        </div>
        <div className="flex items-center gap-1">
          <SliderArrow
            direction="prev"
            disabled={selectedIndex === 0}
            onClick={() => onChange(Math.max(0, selectedIndex - 1))}
          />
          <SliderArrow
            direction="next"
            disabled={selectedIndex === max}
            onClick={() => onChange(Math.min(max, selectedIndex + 1))}
          />
        </div>
      </div>

      <div className="relative h-10">
        <div
          aria-hidden
          className="absolute top-1/2 left-0 right-0 h-px bg-border-hairline -translate-y-1/2"
        />
        <div
          aria-hidden
          className="absolute top-1/2 left-0 h-px bg-accent -translate-y-1/2 transition-all duration-base ease-out-soft"
          style={{ width: `${(selectedIndex / max) * 100}%` }}
        />
        {events.map((event, idx) => {
          const left = `${(idx / max) * 100}%`;
          const isActive = idx === selectedIndex;
          const isPast = idx < selectedIndex;
          return (
            <button
              key={event.id}
              type="button"
              onClick={() => onChange(idx)}
              className={cn(
                'absolute top-1/2 -translate-y-1/2 -translate-x-1/2',
                'rounded-full transition-all duration-base ease-out-soft',
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:ring-offset-2 focus-visible:ring-offset-bg-page',
                isActive
                  ? 'w-3 h-3 bg-accent ring-4 ring-accent/15'
                  : isPast
                    ? 'w-1.5 h-1.5 bg-accent hover:w-2 hover:h-2'
                    : 'w-1.5 h-1.5 bg-border-hairline hover:bg-text-muted',
              )}
              style={{ left }}
              aria-label={`Ir al momento del ${formatDateTimeCL(event.timestamp)}`}
              aria-current={isActive ? 'step' : undefined}
            />
          );
        })}
      </div>

      <div className="flex items-center justify-between text-caption text-text-muted tabular-nums">
        <span>{formatDateCL(events[0].timestamp)}</span>
        <span>Usa ← → para navegar</span>
        <span>{formatDateCL(events[max].timestamp)}</span>
      </div>
    </div>
  );
}

function SliderArrow({
  direction,
  disabled,
  onClick,
}: {
  direction: 'prev' | 'next';
  disabled?: boolean;
  onClick: () => void;
}) {
  const Icon = direction === 'prev' ? ChevronLeft : ChevronRight;
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'p-2 border border-border-hairline bg-bg-card',
        'transition-colors duration-base ease-out-soft',
        'hover:border-text-primary',
        'disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:border-border-hairline',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:ring-offset-2 focus-visible:ring-offset-bg-page',
      )}
      aria-label={direction === 'prev' ? 'Anterior' : 'Siguiente'}
    >
      <Icon size={14} className="text-text-primary" />
    </button>
  );
}

// ─────────────────────────────────────────────────────────────
// Snapshot (left col del time travel)
// ─────────────────────────────────────────────────────────────

interface SnapshotProps {
  className?: string;
  event: TimelineEvent;
  stage: CaseStage;
  docsKnown: number;
  totalDocs: number;
  comms: Communication[];
  caseValueUF: number;
}

function TimeTravelSnapshot({
  className,
  event,
  stage,
  docsKnown,
  totalDocs,
  comms,
  caseValueUF,
}: SnapshotProps) {
  const lastComm = comms.sort((a, b) => b.date.localeCompare(a.date))[0] ?? null;

  return (
    <Card padding="lg" className={cn('space-y-8', className)}>
      <Kicker tone="muted">Estado del caso en este momento</Kicker>

      <div className="space-y-6">
        <div className="flex items-baseline justify-between gap-4 border-b border-border-hairline pb-4">
          <span className="text-body-sm text-text-muted">Etapa</span>
          <Pill variant="info" size="sm">
            {STAGE_LABEL[stage]}
          </Pill>
        </div>

        <div className="flex items-baseline justify-between gap-4 border-b border-border-hairline pb-4">
          <span className="text-body-sm text-text-muted">Documentos validados</span>
          <span className="text-body-sm text-text-primary tabular-nums">
            {docsKnown} de {totalDocs}
          </span>
        </div>

        <div className="flex items-baseline justify-between gap-4 border-b border-border-hairline pb-4">
          <span className="text-body-sm text-text-muted">Monto solicitado</span>
          <span className="text-body-sm text-text-primary tabular-nums">
            {formatUF(caseValueUF)}
          </span>
        </div>

        <div className="flex items-baseline justify-between gap-4 border-b border-border-hairline pb-4">
          <span className="text-body-sm text-text-muted">Ejecutivo asignado</span>
          <span className="text-body-sm text-text-primary text-right">
            {currentExecutive.fullName}
          </span>
        </div>
      </div>

      <section>
        <Kicker tone="muted" className="block mb-3">
          Última decisión
        </Kicker>
        <div className="flex items-start gap-3">
          <span
            aria-hidden
            className={cn('w-1.5 h-1.5 rounded-full mt-2 shrink-0', ACTOR_DOT[event.actor.kind])}
          />
          <div className="flex-1">
            <p className="text-body text-text-primary">{event.title}</p>
            {event.detail && (
              <p className="text-body-sm text-text-secondary mt-1">{event.detail}</p>
            )}
          </div>
        </div>
      </section>

      {lastComm && (
        <section>
          <Kicker tone="muted" className="block mb-3">
            Última comunicación
          </Kicker>
          <p className="text-body-sm text-text-primary">{lastComm.subject || lastComm.from}</p>
          <p className="text-body-sm text-text-secondary mt-1">{lastComm.summary}</p>
          <p className="text-caption text-text-muted mt-2">
            {lastComm.kind.toUpperCase()} · {formatDateTimeCL(lastComm.date)}
          </p>
        </section>
      )}
    </Card>
  );
}

function docsValidatedAt(
  documents: CaseDocument[],
  time: string,
): number {
  return documents.filter((d) => d.validatedAt && d.validatedAt <= time).length;
}

// ─────────────────────────────────────────────────────────────
// Event row (con expansión de razonamiento)
// ─────────────────────────────────────────────────────────────

interface EventRowProps {
  event: TimelineEvent;
  isSelected: boolean;
  isExpanded: boolean;
  onExpand: () => void;
  explainText: string;
  explainStreaming: boolean;
  explainError: string | null;
  isExplainTarget: boolean;
}

function EventRow({
  event,
  isSelected,
  isExpanded,
  onExpand,
  explainText,
  explainStreaming,
  explainError,
  isExplainTarget,
}: EventRowProps) {
  const canExplain = EXPLAINABLE_ACTORS.includes(event.actor.kind);
  const dimmed = !isSelected && !canExplain;

  return (
    <li
      className={cn(
        'px-2 py-4 transition-colors duration-base',
        isSelected && 'bg-bg-sunken',
      )}
    >
      <div className="flex items-start gap-4">
        <span
          aria-hidden
          className={cn(
            'w-1.5 h-1.5 rounded-full mt-2 shrink-0',
            ACTOR_DOT[event.actor.kind],
          )}
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
          <p
            className={cn(
              'mt-1 text-body',
              dimmed ? 'text-text-secondary' : 'text-text-primary',
            )}
          >
            {event.title}
          </p>
          {event.detail && (
            <p className="text-body-sm text-text-secondary mt-1">{event.detail}</p>
          )}
          {canExplain && (
            <button
              type="button"
              onClick={onExpand}
              className="text-body-sm text-accent-muted hover:text-accent mt-3 inline-flex items-center gap-1.5 transition-colors duration-base"
              aria-expanded={isExpanded}
            >
              {isExpanded ? 'Ocultar razonamiento' : 'Ver razonamiento'}
              <ChevronDown
                size={14}
                className={cn(
                  'transition-transform duration-base ease-out-soft',
                  isExpanded && 'rotate-180',
                )}
              />
            </button>
          )}
        </div>
      </div>

      {isExpanded && isExplainTarget && (
        <div className="mt-5 ml-6 pl-4 border-l border-border-hairline animate-fade-in">
          {explainError ? (
            <p className="text-body-sm text-status-error">{explainError}</p>
          ) : explainStreaming && explainText.length === 0 ? (
            <div className="space-y-2">
              <Skeleton className="h-3 w-3/4" />
              <Skeleton className="h-3 w-2/5" />
              <Skeleton className="h-3 w-3/5" />
            </div>
          ) : (
            <AiMessage label="Motor de decisiones · Explicación regulatoria" streaming={explainStreaming}>
              <span className="whitespace-pre-wrap">{explainText}</span>
              {explainStreaming && <AiCursor />}
            </AiMessage>
          )}
        </div>
      )}
    </li>
  );
}
