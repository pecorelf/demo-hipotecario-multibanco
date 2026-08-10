import { MessageCircle, FileText, ArrowRight, Sparkles } from 'lucide-react';
import { Kicker, PageTitle } from '@/components/ui';
import { cn } from '@/lib/cn';
import { currentCustomer } from '@/data/mock';
import { useOperationStore } from '@/store/operationStore';
import { BRAND } from '@/lib/brand';

/**
 * Post-login decision screen.
 * Asks the client whether they prefer the conversational flow with
 * {BRAND.assistantName}, or to go directly to the property form.
 *
 * If the client previously conversed something with {BRAND.assistantName} (e.g. came
 * back from somewhere else), the form option shows a hint that
 * "lo que ya conversaste viene precargado".
 */

interface PostLoginChoiceProps {
  onChooseConversational: () => void;
  onChooseForm: () => void;
}

export function PostLoginChoice({
  onChooseConversational,
  onChooseForm,
}: PostLoginChoiceProps) {
  const conversation = useOperationStore((s) => s.conversation);
  const hasConversed = Object.keys(conversation).length > 0;

  // Extract first name from "María José Contreras Salinas"
  const clientName = currentCustomer.fullName.split(' ')[0] || 'María';

  return (
    <div className="max-w-shell mx-auto px-6 md:px-10 lg:px-16 py-16 lg:py-24">
      <div className="max-w-3xl">
        <Kicker>Bienvenida de vuelta</Kicker>
        <PageTitle size="display-lg" className="mt-4">
          Hola {clientName}. ¿Cómo prefieres avanzar?
        </PageTitle>
        <p className="text-body-lg text-text-secondary mt-5 max-w-measure">
          Puedes simular conversando con {BRAND.assistantName}, tu asistente, o ir directo
          al formulario si ya tienes claros los datos de tu propiedad.
        </p>
        <span aria-hidden className="block w-12 h-px bg-border-hairline mt-10" />
      </div>

      {/* Two big choices side by side */}
      <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl">
        {/* Choice 1 — Conversational with {BRAND.assistantName} */}
        <button
          type="button"
          onClick={onChooseConversational}
          className={cn(
            'group relative text-left p-8',
            'border border-border-hairline bg-bg-card',
            'hover:border-accent hover:shadow-soft',
            'transition-all duration-base ease-out-soft',
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:ring-offset-2',
          )}
        >
          {/* Recommended badge */}
          <div className="inline-flex items-center gap-1.5 px-2 py-1 bg-accent/10 mb-6">
            <Sparkles size={11} className="text-accent" />
            <span className="text-caption uppercase tracking-[0.14em] font-medium text-accent">
              Recomendado
            </span>
          </div>

          <div className="flex items-start gap-4">
            <div className={cn(
              'flex-shrink-0 w-12 h-12 flex items-center justify-center',
              'bg-accent text-text-inverse',
              'group-hover:scale-110 transition-transform duration-base',
            )}>
              <MessageCircle size={20} />
            </div>
            <div className="flex-1">
              <h3 className="text-h2 font-semibold text-text-primary">
                Conversar con {BRAND.assistantName}
              </h3>
              <p className="text-body text-text-secondary mt-2 leading-relaxed">
                Tu asistente te guía paso a paso con preguntas en lenguaje
                natural. Capturamos los datos por ti.
              </p>
            </div>
          </div>

          {/* Bullets */}
          <ul className="mt-6 space-y-2.5 text-body-sm text-text-secondary">
            <li className="flex items-start gap-2">
              <span className="text-accent mt-1.5 w-1 h-1 rounded-full bg-accent flex-shrink-0" />
              <span>Sin formularios largos.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-accent mt-1.5 w-1 h-1 rounded-full bg-accent flex-shrink-0" />
              <span>Te explicamos cada paso.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-accent mt-1.5 w-1 h-1 rounded-full bg-accent flex-shrink-0" />
              <span>Ideal si tienes dudas o es tu primer crédito.</span>
            </li>
          </ul>

          <div className="mt-8 flex items-center justify-between pt-6 border-t border-border-hairline">
            <span className="text-body-sm font-medium text-text-primary">
              Empezar conversación
            </span>
            <ArrowRight size={16} className="text-accent group-hover:translate-x-1 transition-transform" />
          </div>
        </button>

        {/* Choice 2 — Direct form */}
        <button
          type="button"
          onClick={onChooseForm}
          className={cn(
            'group relative text-left p-8',
            'border border-border-hairline bg-bg-card',
            'hover:border-text-primary hover:shadow-soft',
            'transition-all duration-base ease-out-soft',
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:ring-offset-2',
          )}
        >
          {hasConversed ? (
            <div className="inline-flex items-center gap-1.5 px-2 py-1 bg-status-info-bg mb-6">
              <span className="text-caption uppercase tracking-[0.14em] font-medium text-status-info">
                Datos precargados
              </span>
            </div>
          ) : (
            <div className="inline-flex items-center gap-1.5 px-2 py-1 bg-bg-sunken mb-6">
              <span className="text-caption uppercase tracking-[0.14em] font-medium text-text-muted">
                Modo experto
              </span>
            </div>
          )}

          <div className="flex items-start gap-4">
            <div className={cn(
              'flex-shrink-0 w-12 h-12 flex items-center justify-center',
              'bg-text-primary text-text-inverse',
              'group-hover:scale-110 transition-transform duration-base',
            )}>
              <FileText size={20} />
            </div>
            <div className="flex-1">
              <h3 className="text-h2 font-semibold text-text-primary">
                Ir al formulario directo
              </h3>
              <p className="text-body text-text-secondary mt-2 leading-relaxed">
                {hasConversed
                  ? `Completa los datos de tu propiedad. Lo que ya conversaste con ${BRAND.assistantName} viene precargado y puedes modificarlo.`
                  : 'Completa los datos de tu propiedad: dirección, valor, pie, plazo. Simula al instante.'}
              </p>
            </div>
          </div>

          <ul className="mt-6 space-y-2.5 text-body-sm text-text-secondary">
            <li className="flex items-start gap-2">
              <span className="mt-1.5 w-1 h-1 rounded-full bg-text-primary flex-shrink-0" />
              <span>Tú llenas, tú controlas.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1.5 w-1 h-1 rounded-full bg-text-primary flex-shrink-0" />
              <span>Resultados en segundos.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1.5 w-1 h-1 rounded-full bg-text-primary flex-shrink-0" />
              <span>Ideal si ya tienes todo claro.</span>
            </li>
          </ul>

          <div className="mt-8 flex items-center justify-between pt-6 border-t border-border-hairline">
            <span className="text-body-sm font-medium text-text-primary">
              {hasConversed ? 'Continuar al formulario' : 'Ir al formulario'}
            </span>
            <ArrowRight size={16} className="text-text-primary group-hover:translate-x-1 transition-transform" />
          </div>
        </button>
      </div>

      {/* Tiny note at the bottom */}
      <p className="mt-12 text-caption text-text-muted max-w-3xl">
        Puedes cambiar de modo en cualquier momento. Tus datos se conservan.
      </p>
    </div>
  );
}
