import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  CheckCircle2,
  Home,
  Mail,
  MessageSquare,
} from 'lucide-react';
import { Card, Kicker, PageTitle } from '@/components/ui';
import { cn } from '@/lib/cn';
import { formatCLP, formatPct } from '@/lib/format';
import { useAppStore } from '@/store/appStore';

export default function ClienteConfirmado() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const isCustom = params.get('custom') === '1';

  const chosenScenario = useAppStore((s) => s.chosenScenario);
  const propertyInput = useAppStore((s) => s.propertyInput);
  const resetOnboarding = useAppStore((s) => s.resetOnboardingFlow);
  const [stage, setStage] = useState<'sending' | 'done'>('sending');

  useEffect(() => {
    const t = setTimeout(() => setStage('done'), 2200);
    return () => clearTimeout(t);
  }, []);

  function handleBackHome() {
    resetOnboarding();
    navigate('/cliente');
  }

  return (
    <div className="max-w-shell mx-auto px-6 md:px-10 lg:px-16 py-16 lg:py-24 animate-fade-in">
      {stage === 'sending' ? (
        <SendingView isCustom={isCustom} />
      ) : (
        <DoneView
          isCustom={isCustom}
          chosenScenario={chosenScenario}
          propertyInput={propertyInput}
          onBackHome={handleBackHome}
        />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Sending view (transitional, ~2.2s)
// ─────────────────────────────────────────────────────────────

function SendingView({ isCustom }: { isCustom: boolean }) {
  return (
    <div className="max-w-2xl mx-auto text-center space-y-6">
      <span
        aria-hidden
        className="inline-flex w-12 h-12 mx-auto bg-accent/10 items-center justify-center"
      >
        <span className="w-2 h-2 rounded-full bg-accent animate-skeleton-pulse" />
      </span>
      <div className="space-y-3">
        <Kicker tone="muted">Procesando</Kicker>
        <h2 className="text-h1 text-text-primary leading-tight">
          {isCustom
            ? 'Enviando tu solicitud de simulación personalizada…'
            : 'Registrando tu selección y abriendo el caso…'}
        </h2>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Done view
// ─────────────────────────────────────────────────────────────

function DoneView({
  isCustom,
  chosenScenario,
  propertyInput,
  onBackHome,
}: {
  isCustom: boolean;
  chosenScenario: ReturnType<typeof useAppStore.getState>['chosenScenario'];
  propertyInput: ReturnType<typeof useAppStore.getState>['propertyInput'];
  onBackHome: () => void;
}) {
  return (
    <div className="max-w-3xl mx-auto space-y-12">
      <header className="space-y-5">
        <span
          aria-hidden
          className="inline-flex w-14 h-14 bg-status-success-bg items-center justify-center"
        >
          <CheckCircle2 size={28} className="text-status-success" />
        </span>
        <div>
          <Kicker tone="muted">
            {isCustom ? 'Solicitud recibida' : 'Caso enviado a evaluación'}
          </Kicker>
          <PageTitle className="mt-3">
            {isCustom
              ? 'Listo, Francisco. Tu solicitud llegó al equipo.'
              : 'Listo, Francisco. Tu caso ya está en evaluación.'}
          </PageTitle>
          <p className="text-body-lg text-text-secondary mt-3 max-w-measure">
            {isCustom
              ? 'Camila Reinoso, tu ejecutiva, te contactará en las próximas 24 horas para coordinar una llamada de 15 minutos y armar tu simulación a medida.'
              : 'Camila Reinoso, tu ejecutiva, te contactará en las próximas 24 horas para confirmar firmas y coordinar la tasación.'}
          </p>
        </div>
      </header>

      {!isCustom && chosenScenario && (
        <Card padding="lg" className="space-y-6">
          <Kicker tone="muted">Tu elección</Kicker>
          <div>
            <div className="text-h2 text-text-primary">{chosenScenario.label}</div>
            <div className="text-body-sm text-text-muted mt-1">
              Plazo {chosenScenario.termYears} años
              {propertyInput && (
                <>
                  {' · '}
                  {propertyInput.address}, {propertyInput.commune}
                </>
              )}
            </div>
          </div>
          <dl className="grid grid-cols-2 md:grid-cols-3 gap-x-8 gap-y-5 pt-6 border-t border-border-hairline">
            <Stat
              label="Tasa nominal"
              value={formatPct(chosenScenario.nominalRate)}
            />
            <Stat label="CAE" value={formatPct(chosenScenario.caeRate)} />
            <Stat
              label="Cuota mensual"
              value={formatCLP(chosenScenario.monthlyCLP)}
              emphasized
            />
            {propertyInput && (
              <>
                <Stat
                  label="Crédito"
                  value={`UF ${propertyInput.loanAmountUF.toLocaleString('es-CL')}`}
                />
                <Stat
                  label="Tu pie"
                  value={`UF ${propertyInput.downPaymentUF.toLocaleString('es-CL')}`}
                />
                <Stat
                  label="LTV"
                  value={`${Math.round((propertyInput.loanAmountUF / propertyInput.priceUF) * 100)}%`}
                />
              </>
            )}
          </dl>
        </Card>
      )}

      <Card padding="lg" className="space-y-6">
        <Kicker tone="muted">¿Qué sigue ahora?</Kicker>
        <ol className="space-y-5">
          <NextStep
            num="01"
            icon={<Mail size={16} aria-hidden />}
            title="Te llega un email con el resumen"
            description="A tu correo registrado. Incluye los datos de tu solicitud, la oferta indicativa y los próximos pasos."
            time="En los próximos minutos"
          />
          <NextStep
            num="02"
            icon={<MessageSquare size={16} aria-hidden />}
            title="Camila Reinoso te contacta"
            description="Tu ejecutiva asignada te llama o escribe por WhatsApp para coordinar la firma de la solicitud y la tasación."
            time="En menos de 24 horas"
          />
          <NextStep
            num="03"
            icon={<Home size={16} aria-hidden />}
            title="Tasación de la propiedad"
            description="Coordinamos con un tasador inscrito en SBIF para visitar la propiedad. Tú no tienes que hacer nada, lo gestiona el banco."
            time="3 a 5 días hábiles"
          />
        </ol>
      </Card>

      <div className="flex flex-wrap gap-3 pt-4">
        <button
          type="button"
          onClick={onBackHome}
          className={cn(
            'inline-flex items-center gap-2 px-5 py-2.5 text-body-sm font-medium',
            'border border-border-hairline bg-bg-card text-text-primary',
            'hover:border-text-primary',
            'transition-all duration-base ease-out-soft',
          )}
        >
          <ArrowLeft size={14} />
          Volver al inicio
        </button>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  emphasized,
}: {
  label: string;
  value: string;
  emphasized?: boolean;
}) {
  return (
    <div>
      <dt className="text-caption uppercase tracking-[0.14em] text-text-muted">
        {label}
      </dt>
      <dd
        className={cn(
          'mt-1 tabular-nums',
          emphasized
            ? 'text-h3 text-text-primary'
            : 'text-h3 text-text-secondary',
        )}
      >
        {value}
      </dd>
    </div>
  );
}

function NextStep({
  num,
  icon,
  title,
  description,
  time,
}: {
  num: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  time: string;
}) {
  return (
    <li className="flex gap-4">
      <span className="flex items-center justify-center w-10 h-10 bg-bg-sunken text-text-secondary shrink-0">
        {icon}
      </span>
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline justify-between gap-3 flex-wrap">
          <div className="text-body text-text-primary font-medium">
            {title}
          </div>
          <div className="text-caption text-text-muted tabular-nums shrink-0">
            {time}
          </div>
        </div>
        <p className="text-body-sm text-text-secondary mt-1">{description}</p>
      </div>
    </li>
  );
}
