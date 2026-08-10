import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  AudioWaveform,
  CheckCircle2,
  RotateCcw,
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
import { useClaudeStream } from '@/hooks/useClaude';
import { useTypewriter } from '@/hooks/useTypewriter';
import {
  AUDIO_EXTRACTION_SYSTEM,
  buildAudioExtractionPrompt,
  parseAudioExtraction,
} from '@/lib/prompts/audioExtraction';
import { SAMPLE_TRANSCRIPT } from '@/data/mockTranscript';
import { generateCaseId } from '@/lib/journey';
import { currentExecutive } from '@/data/mock';
import { cn } from '@/lib/cn';
import { useAppStore } from '@/store/appStore';
import type { AudioExtraction, Case, Customer } from '@/types';

type Phase = 'idle' | 'processing' | 'ready';
type Step = 'transcribing' | 'extracting' | 'prefilling';

const STEPS: Step[] = ['transcribing', 'extracting', 'prefilling'];
const STEP_LABEL: Record<Step, string> = {
  transcribing: 'Transcribiendo',
  extracting: 'Extrayendo intención y datos',
  prefilling: 'Pre-llenando el caso',
};

const TRANSCRIBE_MS = 5000;
const PREFILL_MS = 1500;

// ─────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────

export default function EjecutivoAudio() {
  const [phase, setPhase] = useState<Phase>('idle');
  const [currentStep, setCurrentStep] = useState<Step>('transcribing');
  const [filename, setFilename] = useState<string>('');
  const [transcriptTarget, setTranscriptTarget] = useState<string>('');
  const navigate = useNavigate();
  const createAudioCase = useAppStore((s) => s.createAudioCase);
  const stream = useClaudeStream();

  const { displayed: transcriptVisible, isRevealing } = useTypewriter(transcriptTarget, {
    charsPerSecond: 95,
  });

  const partial = useMemo(
    () => parseAudioExtraction(stream.text),
    [stream.text],
  );

  function reset() {
    setPhase('idle');
    setCurrentStep('transcribing');
    setFilename('');
    setTranscriptTarget('');
    stream.reset();
  }

  function startFlow(uploadName: string) {
    setPhase('processing');
    setCurrentStep('transcribing');
    setFilename(uploadName);
    setTranscriptTarget('');
    stream.reset();

    // Phase 1 → reveal transcript after a delay (simulated transcription)
    const t1 = setTimeout(() => {
      setTranscriptTarget(SAMPLE_TRANSCRIPT);
      setCurrentStep('extracting');

      // Phase 2 → kick off Claude extraction
      stream.start({
        messages: [{ role: 'user', content: buildAudioExtractionPrompt(SAMPLE_TRANSCRIPT) }],
        system: AUDIO_EXTRACTION_SYSTEM,
        maxTokens: 1200,
        temperature: 0.3,
        cacheKey: 'audio_extraction_antonia',
      });
    }, TRANSCRIBE_MS);

    return () => clearTimeout(t1);
  }

  // When stream finishes → step 3 → ready
  useEffect(() => {
    if (phase !== 'processing') return;
    if (currentStep !== 'extracting') return;
    if (stream.isStreaming) return;
    if (!stream.text) return;

    setCurrentStep('prefilling');
    const t = setTimeout(() => {
      setPhase('ready');
    }, PREFILL_MS);
    return () => clearTimeout(t);
  }, [phase, currentStep, stream.isStreaming, stream.text]);

  function handleCreateCase(extraction: AudioExtraction) {
    const { c, customer, coTitular } = synthesizeCaseFromExtraction(extraction);
    createAudioCase(c, customer, coTitular);
    navigate('/ejecutivo');
  }

  return (
    <div className="max-w-shell mx-auto px-6 md:px-10 lg:px-16 py-12 lg:py-16">
      <header className="max-w-3xl">
        <Kicker>Ejecutivo · Audio a caso</Kicker>
        <PageTitle size="display-lg" className="mt-4">
          De una llamada a un caso, en 30 segundos.
        </PageTitle>
        <p className="text-body-lg text-text-secondary mt-4 max-w-measure">
          Sube la grabación de tu llamada con el cliente. Te devolvemos un caso pre-armado
          con datos extraídos, lista de documentos faltantes y próximos pasos.
        </p>
        <span aria-hidden className="block w-12 h-px bg-border-hairline mt-10" />
      </header>

      <div className="mt-12">
        {phase === 'idle' && <DropZone onStart={startFlow} />}

        {phase === 'processing' && (
          <ProcessingView
            filename={filename}
            currentStep={currentStep}
            transcriptVisible={transcriptVisible}
            isRevealing={isRevealing}
            isStreaming={stream.isStreaming}
            partial={partial}
            streamError={
              stream.error &&
              stream.error.kind !== 'cancelled' &&
              stream.error.message !== 'Aborted'
                ? stream.error.message
                : null
            }
          />
        )}

        {phase === 'ready' && (
          <ReadyView
            filename={filename}
            extraction={completeExtraction(partial)}
            onCreate={handleCreateCase}
            onReset={reset}
          />
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Drop zone (idle)
// ─────────────────────────────────────────────────────────────

function DropZone({ onStart }: { onStart: (name: string) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  function handleFile(file: File | null) {
    if (!file) return;
    onStart(file.name);
  }

  return (
    <div className="max-w-3xl">
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
        className={cn(
          'border border-dashed transition-colors duration-base ease-out-soft',
          dragOver ? 'border-accent bg-bg-card' : 'border-border-hairline bg-bg-card',
          'px-10 py-16 text-center flex flex-col items-center gap-6',
        )}
      >
        <AudioWaveform size={36} className="text-text-muted" aria-hidden />
        <div className="space-y-2">
          <p className="text-body-lg text-text-primary">
            Arrastra la grabación o haz click para subirla
          </p>
          <p className="text-body-sm text-text-muted">
            Acepta .mp3, .wav, .m4a — hasta 30 minutos
          </p>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept=".mp3,.wav,.m4a,audio/*"
          onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
          className="hidden"
        />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className={cn(
            'inline-flex items-center gap-2 px-5 py-2.5 text-body font-medium',
            'bg-accent text-text-inverse',
            'hover:bg-accent-muted transition-colors duration-base ease-out-soft',
          )}
        >
          <Upload size={14} />
          Seleccionar archivo
        </button>
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <p className="text-caption text-text-muted max-w-measure">
          Nota POC: para esta demo usamos una transcripción de muestra independiente del archivo.
          La integración real es Whisper o el modelo de audio de Claude — no requiere cambios en
          esta pantalla.
        </p>
        <button
          type="button"
          onClick={() => onStart('sample-llamada.mp3')}
          className="text-body-sm text-accent-muted hover:text-accent underline underline-offset-4 transition-colors duration-base shrink-0"
        >
          Usa la grabación de muestra →
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Processing view — left: transcript, right: extracted fields
// ─────────────────────────────────────────────────────────────

interface ProcessingViewProps {
  filename: string;
  currentStep: Step;
  transcriptVisible: string;
  isRevealing: boolean;
  isStreaming: boolean;
  partial: Partial<AudioExtraction>;
  streamError: string | null;
}

function ProcessingView({
  filename,
  currentStep,
  transcriptVisible,
  isRevealing,
  isStreaming,
  partial,
  streamError,
}: ProcessingViewProps) {
  return (
    <div className="space-y-8">
      <StepsBar currentStep={currentStep} streamCompleted={!isStreaming && Boolean(transcriptVisible)} />

      <div className="grid grid-cols-12 gap-8">
        <Card padding="lg" className="col-span-12 lg:col-span-7 space-y-6">
          <AudioFileHeader filename={filename} />
          <hr className="border-t border-border-hairline" />
          <section>
            <Kicker tone="muted" className="block mb-4">
              Transcripción
            </Kicker>
            {transcriptVisible.length === 0 ? (
              <div className="space-y-3">
                <Skeleton className="h-3 w-2/3" />
                <Skeleton className="h-3 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
                <Skeleton className="h-3 w-3/5" />
              </div>
            ) : (
              <div className="text-body-sm text-text-secondary whitespace-pre-wrap leading-relaxed max-h-[600px] overflow-y-auto pr-2">
                {transcriptVisible}
                {isRevealing && <AiCursor />}
              </div>
            )}
          </section>
        </Card>

        <div className="col-span-12 lg:col-span-5">
          <Card padding="lg" className="space-y-6 sticky top-6">
            <header>
              <Kicker>Caso extraído</Kicker>
              <h3 className="text-h3 text-text-primary mt-2">Lo que encontré en la llamada</h3>
            </header>

            {streamError ? (
              <p className="text-body-sm text-status-error">{streamError}</p>
            ) : (
              <ExtractionView partial={partial} streaming={isStreaming} />
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}

function AudioFileHeader({ filename }: { filename: string }) {
  return (
    <div className="flex items-center gap-3">
      <span
        aria-hidden
        className="flex items-center justify-center w-10 h-10 bg-bg-sunken text-text-secondary"
      >
        <AudioWaveform size={18} />
      </span>
      <div className="min-w-0">
        <div className="text-body text-text-primary truncate">{filename}</div>
        <div className="text-caption text-text-muted">Archivo de audio</div>
      </div>
    </div>
  );
}

function StepsBar({
  currentStep,
  streamCompleted,
}: {
  currentStep: Step;
  streamCompleted: boolean;
}) {
  const currentIdx = STEPS.indexOf(currentStep);
  return (
    <ol className="flex items-stretch gap-6">
      {STEPS.map((step, idx) => {
        const isDone = idx < currentIdx || (idx === STEPS.length - 1 && streamCompleted && currentStep === 'prefilling');
        const isCurrent = idx === currentIdx;
        return (
          <li key={step} className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2">
              {isDone ? (
                <CheckCircle2 size={16} className="text-accent shrink-0" />
              ) : isCurrent ? (
                <span
                  aria-hidden
                  className="inline-block w-2 h-2 rounded-full bg-accent animate-skeleton-pulse"
                />
              ) : (
                <span
                  aria-hidden
                  className="inline-block w-2 h-2 rounded-full bg-border-hairline"
                />
              )}
              <Kicker tone={isCurrent ? 'accent' : 'muted'}>{`Paso ${idx + 1}`}</Kicker>
            </div>
            <div
              className={cn(
                'text-body-sm pt-2 border-t',
                isCurrent ? 'text-text-primary border-accent' : isDone ? 'text-text-primary border-text-primary' : 'text-text-muted border-border-hairline',
              )}
            >
              {STEP_LABEL[step]}
              {isCurrent && '…'}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

// ─────────────────────────────────────────────────────────────
// Extraction view (right column)
// ─────────────────────────────────────────────────────────────

function ExtractionView({
  partial,
  streaming,
}: {
  partial: Partial<AudioExtraction>;
  streaming: boolean;
}) {
  const hasAnyField =
    partial.clientName !== undefined ||
    partial.intent !== undefined ||
    partial.budget !== undefined;

  if (!hasAnyField && streaming) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-3 w-1/2" />
        <Skeleton className="h-3 w-3/5" />
        <Skeleton className="h-3 w-2/5" />
        <Skeleton className="h-3 w-3/4" />
      </div>
    );
  }

  return (
    <dl className="space-y-5 animate-fade-in">
      <Field label="Cliente" value={partial.clientName ?? null} />
      <Field label="RUT" value={partial.clientRut ?? null} mono />
      <Field label="Intención" value={partial.intent ?? null} multiline />
      <Field
        label="Monto solicitado"
        value={partial.budget ? `${partial.budget.unit} ${partial.budget.amount.toLocaleString('es-CL')}` : null}
        mono
      />
      <Field label="Propiedad" value={partial.propertyInfo ?? null} multiline />
      <Field label="Régimen / cónyuge" value={partial.maritalContext ?? null} multiline />
      <ListField label="Documentos que tiene" items={partial.documentsClientHas} />
      <ListField label="Documentos faltantes" items={partial.documentsClientLacks} />
      <ListField label="Próximos pasos" items={partial.nextStepsImplied} />
      <ListField label="Preocupaciones del cliente" items={partial.clientConcerns} />
    </dl>
  );
}

function Field({
  label,
  value,
  multiline,
  mono,
}: {
  label: string;
  value: string | null;
  multiline?: boolean;
  mono?: boolean;
}) {
  const isReady = value !== null && value !== undefined && value !== '';
  return (
    <div className="grid grid-cols-12 gap-3 items-baseline">
      <dt className="col-span-12 sm:col-span-4 text-caption uppercase tracking-[0.14em] text-text-muted">
        {label}
      </dt>
      <dd
        className={cn(
          'col-span-12 sm:col-span-8',
          multiline ? 'text-body-sm' : 'text-body-sm',
          mono ? 'tabular-nums' : '',
          isReady ? 'text-text-primary' : 'text-text-muted italic',
        )}
      >
        {isReady ? value : '—'}
      </dd>
    </div>
  );
}

function ListField({ label, items }: { label: string; items: string[] | undefined }) {
  const isReady = items !== undefined && items.length > 0;
  return (
    <div className="grid grid-cols-12 gap-3 items-baseline">
      <dt className="col-span-12 sm:col-span-4 text-caption uppercase tracking-[0.14em] text-text-muted pt-1">
        {label}
      </dt>
      <dd className="col-span-12 sm:col-span-8">
        {isReady ? (
          <ul className="space-y-1.5">
            {items.map((item, idx) => (
              <li key={idx} className="text-body-sm text-text-primary animate-fade-in">
                {item}
              </li>
            ))}
          </ul>
        ) : (
          <span className="text-body-sm text-text-muted italic">—</span>
        )}
      </dd>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Ready view — form pre-filled + CTA
// ─────────────────────────────────────────────────────────────

interface ReadyViewProps {
  filename: string;
  extraction: AudioExtraction;
  onCreate: (e: AudioExtraction) => void;
  onReset: () => void;
}

function ReadyView({ filename, extraction, onCreate, onReset }: ReadyViewProps) {
  return (
    <div className="space-y-10 animate-fade-in">
      <Card padding="lg" className="space-y-2">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <CheckCircle2 size={18} className="text-status-success" />
            <Kicker tone="muted">Listo · pre-llenado completado</Kicker>
          </div>
          <Pill variant="neutral" size="sm">
            {filename}
          </Pill>
        </div>
      </Card>

      <div className="grid grid-cols-12 gap-8">
        <Card padding="lg" className="col-span-12 lg:col-span-8 space-y-10">
          <SectionTitle>Datos del caso</SectionTitle>

          <section className="space-y-6">
            <SummaryRow label="Cliente" value={extraction.clientName ?? '—'} />
            <SummaryRow label="RUT" value={extraction.clientRut ?? '—'} mono />
            <SummaryRow label="Intención" value={extraction.intent || '—'} multiline />
            <SummaryRow
              label="Monto solicitado"
              value={
                extraction.budget
                  ? `${extraction.budget.unit} ${extraction.budget.amount.toLocaleString('es-CL')}`
                  : '—'
              }
              mono
            />
            <SummaryRow label="Propiedad" value={extraction.propertyInfo || '—'} multiline />
            <SummaryRow label="Régimen / cónyuge" value={extraction.maritalContext || '—'} multiline />
          </section>

          <hr className="border-t border-border-hairline" />

          <ListSection
            label="Documentos que el cliente tiene"
            items={extraction.documentsClientHas}
          />
          <ListSection
            label="Documentos faltantes"
            items={extraction.documentsClientLacks}
          />
          <ListSection
            label="Próximos pasos identificados"
            items={extraction.nextStepsImplied}
          />
          <ListSection
            label="Preocupaciones del cliente"
            items={extraction.clientConcerns}
          />
        </Card>

        <div className="col-span-12 lg:col-span-4">
          <Card padding="lg" className="space-y-6 sticky top-6">
            <header>
              <Kicker>Acción</Kicker>
              <h3 className="text-h3 text-text-primary mt-2">
                ¿Creamos el caso con estos datos?
              </h3>
            </header>
            <p className="text-body-sm text-text-secondary">
              Vamos a abrir el caso en estado Evaluación y asignarlo a tu pipeline.
              Podrás corregir cualquier dato directamente desde el cockpit.
            </p>
            <div className="space-y-3">
              <button
                type="button"
                onClick={() => onCreate(extraction)}
                className={cn(
                  'w-full inline-flex items-center justify-center gap-2 px-7 py-3.5 text-body-lg font-medium',
                  'bg-accent text-text-inverse',
                  'hover:bg-accent-muted transition-colors duration-base ease-out-soft',
                )}
              >
                Crear caso con estos datos
                <ArrowRight size={16} />
              </button>
              <button
                type="button"
                onClick={onReset}
                className="w-full inline-flex items-center justify-center gap-2 px-5 py-2.5 text-body-sm text-text-secondary hover:text-text-primary transition-colors duration-base"
              >
                <RotateCcw size={14} />
                Empezar de nuevo
              </button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

function SummaryRow({
  label,
  value,
  multiline,
  mono,
}: {
  label: string;
  value: string;
  multiline?: boolean;
  mono?: boolean;
}) {
  return (
    <div className="grid grid-cols-12 gap-4 items-baseline">
      <dt className="col-span-12 sm:col-span-3 text-body-sm text-text-muted">{label}</dt>
      <dd
        className={cn(
          'col-span-12 sm:col-span-9 text-body',
          multiline ? '' : '',
          mono ? 'tabular-nums' : '',
          'text-text-primary',
        )}
      >
        {value}
      </dd>
    </div>
  );
}

function ListSection({ label, items }: { label: string; items: string[] }) {
  if (items.length === 0) return null;
  return (
    <section>
      <Kicker tone="muted" className="block mb-3">
        {label}
      </Kicker>
      <ul className="space-y-2">
        {items.map((item, idx) => (
          <li key={idx} className="flex gap-3">
            <span className="text-kicker text-accent-muted shrink-0 w-6 tabular-nums">
              {String(idx + 1).padStart(2, '0')}
            </span>
            <span className="text-body-sm text-text-primary">{item}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────
// Synthesis: extraction → Case + Customer
// ─────────────────────────────────────────────────────────────

function completeExtraction(p: Partial<AudioExtraction>): AudioExtraction {
  return {
    clientName: p.clientName ?? null,
    clientRut: p.clientRut ?? null,
    intent: p.intent ?? '',
    budget: p.budget ?? null,
    propertyInfo: p.propertyInfo ?? null,
    maritalContext: p.maritalContext ?? null,
    documentsClientHas: p.documentsClientHas ?? [],
    documentsClientLacks: p.documentsClientLacks ?? [],
    nextStepsImplied: p.nextStepsImplied ?? [],
    clientConcerns: p.clientConcerns ?? [],
  };
}

interface SynthesisResult {
  c: Case;
  customer: Customer;
  coTitular: Customer | null;
}

function synthesizeCaseFromExtraction(e: AudioExtraction): SynthesisResult {
  const caseId = generateCaseId();
  const customerId = `CUS-AUDIO-${caseId.slice(-4)}`;
  const now = new Date().toISOString();

  const fullName = e.clientName ?? 'Cliente nuevo';
  const customer: Customer = {
    id: customerId,
    fullName,
    rut: e.clientRut ?? '00.000.000-0',
    email: '',
    phone: '',
    birthDate: '',
    maritalStatus: 'casado_sociedad_conyugal',
    afp: 'Habitat',
    employment: {
      kind: 'independiente',
      position: '—',
      netMonthlyCLP: 0,
    },
    address: '',
    commune: '',
  };

  // Heuristic: if maritalContext mentions a partner name, synthesize a co-titular
  let coTitular: Customer | null = null;
  if (e.maritalContext && /joaqu[ií]n|c[oó]nyuge|marido|esposo|esposa|pareja/i.test(e.maritalContext)) {
    coTitular = {
      id: `${customerId}-CO`,
      fullName: extractCoTitularName(e.maritalContext) ?? 'Co-titular',
      rut: '00.000.000-0',
      email: '',
      phone: '',
      birthDate: '',
      maritalStatus: 'casado_sociedad_conyugal',
      afp: 'Habitat',
      employment: {
        kind: 'dependiente',
        netMonthlyCLP: 0,
      },
      address: '',
      commune: '',
    };
  }

  const c: Case = {
    id: caseId,
    customerId,
    coTitularId: coTitular?.id,
    executiveId: currentExecutive.id,
    stage: 'solicitud',
    requestedUF: e.budget?.unit === 'UF' ? e.budget.amount : 0,
    downPaymentUF: 0,
    termYears: 25,
    annualRate: 4.65,
    property: {
      address: e.propertyInfo ?? 'Propiedad por confirmar',
      commune: extractCommune(e.propertyInfo) ?? '—',
      type: 'departamento',
      valueUF: 0,
    },
    createdAt: now,
    updatedAt: now,
    documents: [],
    timeline: [
      {
        id: 'AUDIO-1',
        caseId,
        timestamp: now,
        actor: { kind: 'ejecutivo', name: currentExecutive.fullName, id: currentExecutive.id },
        type: 'solicitud_creada',
        title: 'Caso creado desde transcripción de llamada',
        detail: e.intent || 'Caso pre-armado desde grabación de llamada con el cliente.',
        state: 'current',
      },
    ],
  };

  return { c, customer, coTitular };
}

function extractCoTitularName(marital: string): string | null {
  const m = marital.match(/joaqu[ií]n[\s\w]*/i);
  if (m) return m[0].trim();
  return null;
}

function extractCommune(propertyInfo: string | null): string | null {
  if (!propertyInfo) return null;
  const communes = ['Ñuñoa', 'Vitacura', 'Providencia', 'Providencia', 'La Reina', 'Lo Barnechea'];
  for (const c of communes) {
    if (propertyInfo.toLowerCase().includes(c.toLowerCase())) return c;
  }
  return null;
}
