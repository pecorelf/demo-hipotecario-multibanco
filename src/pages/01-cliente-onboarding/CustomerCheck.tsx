import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, BadgeCheck, UserPlus } from 'lucide-react';
import { Card, Kicker, PageTitle } from '@/components/ui';
import { cn } from '@/lib/cn';
import { useAppStore } from '@/store/appStore';
import { BRAND } from '@/lib/brand';

type Stage = 'choose' | 'not-a-client';

export function CustomerCheck() {
  const [stage, setStage] = useState<Stage>('choose');
  const setClientFlow = useAppStore((s) => s.setClientFlow);

  function goClient() {
    setClientFlow('santander_client');
  }

  function goNotAClient() {
    setStage('not-a-client');
  }

  if (stage === 'not-a-client') {
    return <NotAClientView onBack={() => setStage('choose')} />;
  }

  return (
    <div className="max-w-shell mx-auto px-6 md:px-10 lg:px-16 py-16 lg:py-24">
      <header className="max-w-3xl">
        <Kicker tone="accent">Tus nuevas Llaves · {BRAND.shortName}</Kicker>
        <PageTitle size="display-md" className="mt-3">
          Comencemos con una pregunta simple.
        </PageTitle>
        <p className="text-body-lg text-text-secondary mt-3 max-w-measure">
          Si ya tienes una cuenta con nosotros, te identificamos y avanzamos
          rápido. Si no, te mostramos los pasos para empezar.
        </p>
        <span aria-hidden className="block w-12 h-px bg-border-hairline mt-10" />
      </header>

      <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl">
        <ChoiceCard
          title={`Soy cliente ${BRAND.shortName}`}
          description="Tengo cuenta corriente, tarjeta, o algún producto activo con el banco. Ingreso con mi RUT y clave."
          icon={<BadgeCheck size={22} aria-hidden />}
          isPrimary
          onClick={goClient}
        />
        <ChoiceCard
          title="No soy cliente"
          description={`Todavía no tengo productos con ${BRAND.shortName} pero quiero conocer la propuesta de crédito hipotecario.`}
          icon={<UserPlus size={22} aria-hidden />}
          onClick={goNotAClient}
        />
      </div>
    </div>
  );
}

function ChoiceCard({
  title,
  description,
  icon,
  isPrimary,
  onClick,
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
  isPrimary?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'group text-left',
        'transition-all duration-base ease-out-soft',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:ring-offset-2',
      )}
    >
      <Card
        padding="lg"
        className={cn(
          'h-full transition-all duration-base ease-out-soft',
          'group-hover:border-text-primary',
          isPrimary && 'border-accent/40 group-hover:border-accent',
        )}
      >
        <div className="flex flex-col gap-6 h-full">
          <div
            className={cn(
              'flex items-center justify-center w-12 h-12 shrink-0',
              isPrimary
                ? 'bg-accent text-text-inverse'
                : 'bg-bg-sunken text-text-secondary',
            )}
          >
            {icon}
          </div>
          <div className="flex-1">
            <h3 className="text-h3 text-text-primary">{title}</h3>
            <p className="text-body-sm text-text-secondary mt-3 leading-relaxed">
              {description}
            </p>
          </div>
          <div
            className={cn(
              'inline-flex items-center gap-2 text-body-sm font-medium pt-4 border-t border-border-hairline',
              isPrimary ? 'text-accent' : 'text-text-primary',
            )}
          >
            Continuar
            <ArrowRight
              size={14}
              className="transition-transform duration-base group-hover:translate-x-0.5"
            />
          </div>
        </div>
      </Card>
    </button>
  );
}

function NotAClientView({ onBack }: { onBack: () => void }) {
  const navigate = useNavigate();
  return (
    <div className="max-w-shell mx-auto px-6 md:px-10 lg:px-16 py-16 lg:py-24">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-2 text-body-sm text-text-secondary hover:text-text-primary transition-colors duration-base"
      >
        <ArrowLeft size={14} />
        Volver
      </button>

      <header className="max-w-3xl mt-10">
        <Kicker tone="muted">Bienvenida pendiente</Kicker>
        <PageTitle size="display-sm" className="mt-3">
          Esta experiencia está disponible para clientes {BRAND.shortName}.
        </PageTitle>
        <p className="text-body-lg text-text-secondary mt-4 max-w-measure">
          Para acceder al simulador y al asesor virtual, necesitas tener al
          menos un producto activo con el banco —cuenta corriente, tarjeta o
          una pre-aprobación previa.
        </p>
        <span aria-hidden className="block w-12 h-px bg-border-hairline mt-10" />
      </header>

      <Card padding="lg" className="mt-10 max-w-2xl space-y-6">
        <div>
          <Kicker tone="muted" className="block mb-3">
            ¿Qué puedes hacer ahora?
          </Kicker>
          <ol className="space-y-4">
            <Step
              num="01"
              title="Abre una cuenta corriente"
              description="El trámite es 100% en línea desde mibanco.cl y tarda menos de 10 minutos."
            />
            <Step
              num="02"
              title="Solicita una pre-aprobación inicial"
              description="Si ya tienes liquidaciones, puedes pedir una pre-aprobación sin abrir cuenta primero."
            />
            <Step
              num="03"
              title="Vuelve aquí"
              description="Una vez seas cliente, te identificamos y arrancamos tu solicitud hipotecaria de inmediato."
            />
          </ol>
        </div>

        <div className="pt-4 border-t border-border-hairline">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="text-body-sm text-accent hover:text-accent-muted transition-colors duration-base underline underline-offset-4"
          >
            Volver al inicio
          </button>
        </div>
      </Card>
    </div>
  );
}

function Step({
  num,
  title,
  description,
}: {
  num: string;
  title: string;
  description: string;
}) {
  return (
    <li className="flex gap-4">
      <span className="text-kicker text-accent-muted shrink-0 w-7 tabular-nums">
        {num}
      </span>
      <div className="flex-1 min-w-0">
        <div className="text-body text-text-primary font-medium">{title}</div>
        <p className="text-body-sm text-text-secondary mt-1">{description}</p>
      </div>
    </li>
  );
}
