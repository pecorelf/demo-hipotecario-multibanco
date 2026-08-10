import { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  CheckCircle2,
  Copy,
  Mail,
  RotateCcw,
  Send,
  X,
} from 'lucide-react';
import {
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
import { claudeCompletion, extractStructured } from '@/lib/claude';
import {
  PRE_APPROVAL_EMAIL_SYSTEM,
  PRE_APPROVAL_SYSTEM,
  buildPreApprovalEmailPrompt,
  buildPreApprovalPrompt,
} from '@/lib/prompts/preApproval';
import { formatCLP, formatUF, formatRut } from '@/lib/format';
import { cn } from '@/lib/cn';
import type {
  PreApprovalDecision,
  PreApprovalRequest,
  PreApprovalResult,
} from '@/types';
import { BRAND } from '@/lib/brand';

type Phase = 'form' | 'loading' | 'result';

const DEFAULT_FORM: PreApprovalRequest = {
  rut: '17.890.456-3',
  propertyValueUF: 5400,
  downPaymentUF: 1200,
  termYears: 25,
  comment: '',
};

const DECISION_LABEL: Record<PreApprovalDecision, string> = {
  'pre-approved': 'Pre-aprobado',
  conditional: 'Pre-aprobado con condiciones',
  declined: 'No pre-aprobado',
};

const DECISION_PILL: Record<PreApprovalDecision, 'success' | 'warning' | 'error'> = {
  'pre-approved': 'success',
  conditional: 'warning',
  declined: 'error',
};

// ─────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────

export default function PortalInmobiliaria() {
  const [phase, setPhase] = useState<Phase>('form');
  const [form, setForm] = useState<PreApprovalRequest>(DEFAULT_FORM);
  const [result, setResult] = useState<PreApprovalResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [emailOpen, setEmailOpen] = useState(false);

  async function submit() {
    setPhase('loading');
    setError(null);
    try {
      const response = await claudeCompletion(
        [{ role: 'user', content: buildPreApprovalPrompt(form) }],
        PRE_APPROVAL_SYSTEM,
        { maxTokens: 700, temperature: 0.5 },
      );
      const parsed = extractStructured<PreApprovalResult>(response);
      setResult(parsed);
      setPhase('result');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error inesperado');
      setPhase('form');
    }
  }

  function reset() {
    setPhase('form');
    setResult(null);
    setError(null);
    setEmailOpen(false);
  }

  return (
    <>
      <div className="max-w-3xl mx-auto px-6 md:px-10 lg:px-16 py-12 lg:py-20">
        <Header />

        <div className="mt-12">
          {phase === 'form' && (
            <FormView form={form} onChange={setForm} onSubmit={submit} error={error} />
          )}
          {phase === 'loading' && <LoadingView />}
          {phase === 'result' && result && (
            <ResultView
              form={form}
              result={result}
              onReset={reset}
              onOpenEmail={() => setEmailOpen(true)}
            />
          )}
        </div>
      </div>

      {emailOpen && result && (
        <EmailModal
          request={form}
          result={result}
          onClose={() => setEmailOpen(false)}
        />
      )}
    </>
  );
}

// ─────────────────────────────────────────────────────────────
// Header del portal
// ─────────────────────────────────────────────────────────────

function Header() {
  return (
    <header>
      <Kicker>Portal corredora · pre-aprobación</Kicker>
      <PageTitle size="display-lg" className="mt-4">
        Pre-aprueba el crédito de tu cliente en segundos.
      </PageTitle>
      <p className="text-body-lg text-text-secondary mt-4 max-w-measure">
        Consulta directa al motor de evaluación de {BRAND.name}. Devuelve una
        decisión preliminar con monto máximo, tasa sugerida y cuota estimada.
        Vigencia 30 días para perfiles aprobados.
      </p>
      <span aria-hidden className="block w-12 h-px bg-border-hairline mt-10" />
    </header>
  );
}

// ─────────────────────────────────────────────────────────────
// Form
// ─────────────────────────────────────────────────────────────

function FormView({
  form,
  onChange,
  onSubmit,
  error,
}: {
  form: PreApprovalRequest;
  onChange: (f: PreApprovalRequest) => void;
  onSubmit: () => void;
  error: string | null;
}) {
  const requestedUF = Math.max(0, form.propertyValueUF - form.downPaymentUF);
  const downPct =
    form.propertyValueUF > 0
      ? Math.round((form.downPaymentUF / form.propertyValueUF) * 100)
      : 0;
  const isValid =
    form.rut.length >= 9 &&
    form.propertyValueUF > 0 &&
    form.downPaymentUF >= 0 &&
    form.downPaymentUF < form.propertyValueUF;

  return (
    <Card padding="lg" className="space-y-10">
      <SectionTitle rule={false}>Datos del comprador y la operación</SectionTitle>

      <div className="grid grid-cols-12 gap-6">
        <FormRow label="RUT del comprador" className="col-span-12">
          <TextInput
            value={form.rut}
            onChange={(v) => onChange({ ...form, rut: v })}
            placeholder="12.345.678-9"
            mono
          />
        </FormRow>

        <FormRow label="Valor de la propiedad" className="col-span-12 sm:col-span-6">
          <UFInput
            value={form.propertyValueUF}
            onChange={(v) => onChange({ ...form, propertyValueUF: v })}
          />
        </FormRow>

        <FormRow
          label="Pie estimado"
          className="col-span-12 sm:col-span-6"
          hint={
            form.propertyValueUF > 0 ? `Equivale al ${downPct}% del valor` : undefined
          }
        >
          <UFInput
            value={form.downPaymentUF}
            onChange={(v) => onChange({ ...form, downPaymentUF: v })}
          />
        </FormRow>

        <FormRow
          label="Plazo deseado"
          className="col-span-12"
          hint={`${form.termYears} años · ${form.termYears * 12} cuotas`}
        >
          <YearsSlider
            value={form.termYears}
            onChange={(v) => onChange({ ...form, termYears: v })}
          />
        </FormRow>

        <FormRow
          label="Comentario (opcional)"
          className="col-span-12"
          hint="Cualquier contexto que ayude al motor: promesa firmada, urgencia, perfil del cliente."
        >
          <TextArea
            value={form.comment}
            onChange={(v) => onChange({ ...form, comment: v })}
            placeholder="Ej: el cliente ya firmó promesa por UF 350 y necesita confirmación esta semana."
            rows={3}
          />
        </FormRow>
      </div>

      <div className="border-t border-border-hairline pt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="text-body-sm text-text-secondary">
          <span className="text-text-muted">Monto a financiar · </span>
          <span className="text-text-primary tabular-nums font-medium">
            {formatUF(requestedUF)}
          </span>
        </div>
        <button
          type="button"
          onClick={onSubmit}
          disabled={!isValid}
          className={cn(
            'inline-flex items-center justify-center gap-2 px-7 py-3.5 text-body-lg font-medium',
            'bg-accent text-text-inverse',
            'hover:bg-accent-muted transition-colors duration-base ease-out-soft',
            'disabled:opacity-40 disabled:cursor-not-allowed',
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:ring-offset-2 focus-visible:ring-offset-bg-card',
          )}
        >
          Solicitar pre-aprobación
          <ArrowRight size={16} />
        </button>
      </div>

      {error && (
        <p className="text-body-sm text-status-error">
          No pudimos completar la consulta: {error}
        </p>
      )}
    </Card>
  );
}

function FormRow({
  label,
  hint,
  className,
  children,
}: {
  label: string;
  hint?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn('space-y-2', className)}>
      <label className="text-body-sm text-text-secondary">{label}</label>
      {children}
      {hint && <p className="text-caption text-text-muted">{hint}</p>}
    </div>
  );
}

function TextInput({
  value,
  onChange,
  placeholder,
  mono,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  mono?: boolean;
}) {
  return (
    <input
      type="text"
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      className={cn(
        'w-full bg-bg-page border border-border-hairline',
        'px-4 py-3 text-body text-text-primary',
        'focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/15',
        mono && 'tabular-nums',
      )}
    />
  );
}

function UFInput({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="relative">
      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted text-body-sm pointer-events-none">
        UF
      </span>
      <input
        type="number"
        min={0}
        step={100}
        value={value === 0 ? '' : value}
        onChange={(e) => onChange(Number(e.target.value) || 0)}
        className={cn(
          'w-full bg-bg-page border border-border-hairline',
          'pl-10 pr-4 py-3 text-body text-text-primary tabular-nums',
          'focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/15',
        )}
      />
    </div>
  );
}

function YearsSlider({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <input
      type="range"
      min={15}
      max={30}
      step={1}
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      className={cn(
        'w-full appearance-none bg-transparent',
        '[&::-webkit-slider-runnable-track]:bg-border-hairline',
        '[&::-webkit-slider-runnable-track]:h-px',
        '[&::-webkit-slider-runnable-track]:rounded-none',
        '[&::-webkit-slider-thumb]:appearance-none',
        '[&::-webkit-slider-thumb]:w-3',
        '[&::-webkit-slider-thumb]:h-3',
        '[&::-webkit-slider-thumb]:rounded-full',
        '[&::-webkit-slider-thumb]:bg-accent',
        '[&::-webkit-slider-thumb]:-mt-1.5',
        '[&::-webkit-slider-thumb]:cursor-pointer',
        '[&::-moz-range-track]:bg-border-hairline',
        '[&::-moz-range-track]:h-px',
        '[&::-moz-range-thumb]:w-3',
        '[&::-moz-range-thumb]:h-3',
        '[&::-moz-range-thumb]:rounded-full',
        '[&::-moz-range-thumb]:bg-accent',
        '[&::-moz-range-thumb]:border-0',
        '[&::-moz-range-thumb]:cursor-pointer',
      )}
    />
  );
}

function TextArea({
  value,
  onChange,
  placeholder,
  rows,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
}) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows ?? 3}
      className={cn(
        'w-full bg-bg-page border border-border-hairline',
        'px-4 py-3 text-body-sm text-text-primary',
        'focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/15',
        'resize-none',
      )}
    />
  );
}

// ─────────────────────────────────────────────────────────────
// Loading
// ─────────────────────────────────────────────────────────────

function LoadingView() {
  const messages = useMemo(
    () => [
      `Consultando con ${BRAND.shortName}`,
      'Cruzando con bureau interno',
      'Calculando capacidad de pago',
      'Cerrando recomendación',
    ],
    [],
  );
  const [step, setStep] = useState(0);

  useEffect(() => {
    const t = setInterval(() => {
      setStep((s) => Math.min(s + 1, messages.length - 1));
    }, 1800);
    return () => clearInterval(t);
  }, [messages.length]);

  return (
    <Card padding="lg" className="space-y-8">
      <div className="space-y-2">
        <Kicker tone="muted">Procesando consulta</Kicker>
        <p className="text-h2 text-text-primary">
          {messages[step]}
          <AiCursor />
        </p>
      </div>

      <div className="space-y-3 pt-6 border-t border-border-hairline">
        <Skeleton className="h-3 w-2/3" />
        <Skeleton className="h-3 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
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
// Result
// ─────────────────────────────────────────────────────────────

function ResultView({
  form,
  result,
  onReset,
  onOpenEmail,
}: {
  form: PreApprovalRequest;
  result: PreApprovalResult;
  onReset: () => void;
  onOpenEmail: () => void;
}) {
  return (
    <div className="space-y-12 animate-fade-in">
      <DecisionBanner result={result} form={form} />

      <section>
        <Kicker tone="muted" className="block mb-6">
          Términos sugeridos
        </Kicker>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-x-8 gap-y-8">
          <Stat
            label="Monto máximo"
            value={
              <>
                <span className="text-text-muted text-stat-lg">UF </span>
                {result.maxAmount.toLocaleString('es-CL')}
              </>
            }
          />
          <Stat
            label="Tasa sugerida"
            value={
              <>
                {result.suggestedRate.toFixed(2).replace('.', ',')}
                <span className="text-stat-lg text-text-muted">%</span>
              </>
            }
            hint="anual"
          />
          <Stat
            label="Cuota estimada"
            value={formatCLP(result.monthlyPayment)}
            hint="mensual"
          />
          <Stat
            label="Vigencia"
            value={
              <>
                {result.validity}
                <span className="text-stat-lg text-text-muted"> días</span>
              </>
            }
          />
        </div>
      </section>

      <section>
        <Kicker tone="muted" className="block mb-3">
          Explicación del motor
        </Kicker>
        <p className="text-body-lg text-text-primary leading-relaxed max-w-measure">
          {result.explanation}
        </p>
      </section>

      {result.conditions.length > 0 && (
        <section>
          <Kicker tone="muted" className="block mb-4">
            Condiciones que faltan resolver
          </Kicker>
          <ul className="space-y-3">
            {result.conditions.map((c, idx) => (
              <li key={idx} className="flex gap-4">
                <span className="text-kicker text-accent-muted shrink-0 w-6 tabular-nums">
                  {String(idx + 1).padStart(2, '0')}
                </span>
                <span className="text-body text-text-primary">{c}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="pt-8 border-t border-border-hairline flex flex-col sm:flex-row gap-4">
        {result.decision !== 'declined' && (
          <button
            type="button"
            onClick={onOpenEmail}
            className={cn(
              'inline-flex items-center justify-center gap-2 px-7 py-3.5 text-body-lg font-medium',
              'bg-accent text-text-inverse',
              'hover:bg-accent-muted transition-colors duration-base ease-out-soft',
            )}
          >
            <Mail size={16} />
            Enviar oferta al cliente
          </button>
        )}
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
          Nueva consulta
        </button>
      </section>

      <section>
        <hr className="border-t border-border-hairline mb-6" />
        <Kicker tone="muted" className="block mb-3">
          Datos de la consulta
        </Kicker>
        <dl className="grid grid-cols-2 sm:grid-cols-4 gap-6 text-body-sm">
          <DataPair label="RUT" value={formatRut(form.rut)} mono />
          <DataPair label="Propiedad" value={formatUF(form.propertyValueUF)} mono />
          <DataPair label="Pie" value={formatUF(form.downPaymentUF)} mono />
          <DataPair label="Plazo" value={`${form.termYears} años`} />
        </dl>
      </section>
    </div>
  );
}

function DataPair({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div>
      <dt className="text-caption uppercase tracking-[0.14em] text-text-muted">
        {label}
      </dt>
      <dd
        className={cn(
          'mt-1 text-body text-text-primary',
          mono && 'tabular-nums',
        )}
      >
        {value}
      </dd>
    </div>
  );
}

function DecisionBanner({
  result,
  form,
}: {
  result: PreApprovalResult;
  form: PreApprovalRequest;
}) {
  const variant = DECISION_PILL[result.decision];
  const label = DECISION_LABEL[result.decision];
  const isDeclined = result.decision === 'declined';
  const requested = form.propertyValueUF - form.downPaymentUF;
  const gap = isDeclined && result.maxAmount > 0 ? requested - result.maxAmount : 0;

  return (
    <Card padding="lg" className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-3">
        <Pill variant={variant} size="base">
          {label}
        </Pill>
        <span className="text-caption text-text-muted">
          RUT consultado: <span className="text-text-primary tabular-nums">{formatRut(form.rut)}</span>
        </span>
      </div>

      <h2 className="text-h1 text-text-primary leading-tight">
        {result.decision === 'pre-approved' &&
          `Tu cliente puede acceder hasta UF ${result.maxAmount.toLocaleString('es-CL')} en este momento.`}
        {result.decision === 'conditional' &&
          `Pre-aprobado hasta UF ${result.maxAmount.toLocaleString('es-CL')}, con condiciones por resolver.`}
        {result.decision === 'declined' &&
          gap > 0 &&
          `El monto solicitado excede el máximo pre-aprobable. Sugerimos hasta UF ${result.maxAmount.toLocaleString('es-CL')}.`}
        {result.decision === 'declined' &&
          gap <= 0 &&
          `No fue posible pre-aprobar esta operación con el perfil entregado.`}
      </h2>
    </Card>
  );
}

// ─────────────────────────────────────────────────────────────
// Email modal
// ─────────────────────────────────────────────────────────────

function EmailModal({
  request,
  result,
  onClose,
}: {
  request: PreApprovalRequest;
  result: PreApprovalResult;
  onClose: () => void;
}) {
  const stream = useClaudeStream();
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    stream.start({
      messages: [
        {
          role: 'user',
          content: buildPreApprovalEmailPrompt({ result, request }),
        },
      ],
      system: PRE_APPROVAL_EMAIL_SYSTEM,
      maxTokens: 700,
      temperature: 0.6,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  async function copyToClipboard() {
    try {
      await navigator.clipboard.writeText(stream.text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch {
      setCopied(false);
    }
  }

  const subjectLine = `Pre-aprobación hipotecaria · ${formatUF(result.maxAmount)}`;

  return (
    <>
      <div
        className="fixed inset-0 bg-bg-overlay z-40 animate-fade-in"
        onClick={onClose}
        aria-hidden
      />
      <div
        role="dialog"
        aria-label="Email pre-redactado"
        className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 pointer-events-none animate-fade-in"
      >
        <div className="bg-bg-card border border-border-hairline shadow-soft w-full max-w-2xl max-h-[90vh] overflow-y-auto pointer-events-auto">
          <header className="px-8 py-6 border-b border-border-hairline flex items-start justify-between gap-4 sticky top-0 bg-bg-card z-10">
            <div>
              <Kicker>Email pre-redactado</Kicker>
              <h2 className="text-h2 text-text-primary mt-2">Listo para enviar</h2>
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-body-sm">
              <div>
                <span className="text-text-muted">De · </span>
                <span className="text-text-primary">Equipo Los Almendros</span>
              </div>
              <div>
                <span className="text-text-muted">Asunto · </span>
                <span className="text-text-primary">{subjectLine}</span>
              </div>
            </div>

            <hr className="border-t border-border-hairline" />

            <div className="min-h-[280px]">
              {stream.error && stream.error.kind !== 'cancelled' && stream.error.message !== 'Aborted' ? (
                <p className="text-body-sm text-status-error">
                  No se pudo generar el email: {stream.error.message}
                </p>
              ) : stream.text.length === 0 && stream.isStreaming ? (
                <div className="space-y-3">
                  <Skeleton className="h-3 w-1/2" />
                  <Skeleton className="h-3 w-3/4" />
                  <Skeleton className="h-3 w-2/3" />
                  <Skeleton className="h-3 w-4/5" />
                  <Skeleton className="h-3 w-3/5" />
                </div>
              ) : (
                <div className="text-body text-text-primary whitespace-pre-wrap leading-relaxed">
                  {stream.text}
                  {stream.isStreaming && <AiCursor />}
                </div>
              )}
            </div>
          </div>

          <footer className="px-8 py-5 border-t border-border-hairline flex items-center justify-end gap-3 sticky bottom-0 bg-bg-card">
            <button
              type="button"
              onClick={copyToClipboard}
              disabled={stream.isStreaming || !stream.text}
              className={cn(
                'inline-flex items-center gap-2 px-4 py-2 text-body-sm font-medium',
                'border border-border-hairline bg-bg-card text-text-primary',
                'hover:border-text-primary hover:bg-bg-page',
                'transition-all duration-base ease-out-soft',
                'disabled:opacity-40 disabled:cursor-not-allowed',
              )}
            >
              {copied ? (
                <>
                  <CheckCircle2 size={14} className="text-status-success" />
                  Copiado
                </>
              ) : (
                <>
                  <Copy size={14} />
                  Copiar
                </>
              )}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={stream.isStreaming}
              className={cn(
                'inline-flex items-center gap-2 px-5 py-2.5 text-body font-medium',
                'bg-accent text-text-inverse',
                'hover:bg-accent-muted transition-colors duration-base ease-out-soft',
                'disabled:opacity-40 disabled:cursor-not-allowed',
              )}
            >
              <Send size={14} />
              Enviar
            </button>
          </footer>
        </div>
      </div>
    </>
  );
}
