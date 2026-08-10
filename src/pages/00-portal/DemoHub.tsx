import { useNavigate } from 'react-router-dom';
import {
  Building2,
  ChevronRight,
  Compass,
  Layers,
  Sparkles,
  TrendingUp,
  User,
} from 'lucide-react';
import { Kicker, PageTitle } from '@/components/ui';
import { cn } from '@/lib/cn';
import { BRAND } from '@/lib/brand';

interface HubCard {
  route: string;
  kicker: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  featured?: boolean;
}

const CARDS: HubCard[] = [
  {
    route: '/cliente/seguimiento',
    kicker: 'Vista principal',
    title: 'Cliente · Mi hipoteca',
    description:
      'El comprador entra con hipoteca aprobada. Tres tracks paralelos, gate de pago, gestión documental con IA y reparos.',
    icon: <User size={20} />,
    featured: true,
  },
  {
    route: '/ejecutivo',
    kicker: 'Banco',
    title: `Ejecutivo ${BRAND.shortName}`,
    description:
      'Pipeline de casos, panel de control de documentos con visor IA, lanzamiento de reparos al cliente, vendedor o inmobiliaria.',
    icon: <Building2 size={20} />,
  },
  {
    route: '/cliente/simulacion-pre',
    kicker: 'Pre-aprobación',
    title: `${BRAND.assistantName} · Simulación con IA`,
    description:
      `Conversación natural con ${BRAND.assistantName}, la asistente IA, antes de la aprobación. Streaming en vivo del modelo.`,
    icon: <Sparkles size={20} />,
  },
  {
    route: '/ejecutivo/simulador-impacto',
    kicker: 'Caso de negocio',
    title: 'Simulador de Impacto',
    description:
      'Sala de decisión: funnel 8.000 → 1.000, palancas de mejora interactivas y proyección económica con VPN.',
    icon: <TrendingUp size={20} />,
  },
  {
    route: '/cliente/mi-inmueble',
    kicker: 'Custodia digital',
    title: 'Hub del Inmueble',
    description:
      'Bóveda permanente con toda la documentación del proceso, línea de tiempo, acciones del cliente y opción de compartir acceso.',
    icon: <Building2 size={20} />,
  },
  {
    route: '/portal',
    kicker: 'Las 17 vistas',
    title: 'Catálogo completo',
    description:
      'Todas las vistas del POC organizadas por rol: cliente, ejecutivo, back office, jefatura, vendedor, inmobiliaria, gobierno tecnológico.',
    icon: <Layers size={20} />,
  },
];

export default function DemoHub() {
  const navigate = useNavigate();

  return (
    <div className="max-w-shell mx-auto px-6 md:px-10 lg:px-16 py-12 lg:py-20">
      <div className="max-w-3xl">
        <Kicker>POC Hipotecario · Nuestra consultora</Kicker>
        <PageTitle className="mt-3">
          Recorrido del rediseño del proceso hipotecario.
        </PageTitle>
        <p className="text-body-lg text-text-secondary mt-4 leading-relaxed">
          Selecciona una de las siguientes opciones para explorar la propuesta.
          La vista del cliente es el foco principal.
        </p>
        <span aria-hidden className="block w-12 h-px bg-border-hairline mt-10" />
      </div>

      <div className="mt-12 grid grid-cols-1 lg:grid-cols-2 gap-5 max-w-5xl">
        {CARDS.map((card) => (
          <HubCardComponent
            key={card.route}
            card={card}
            onClick={() => navigate(card.route)}
          />
        ))}
      </div>

      <div className="mt-12 max-w-3xl">
        <button
          onClick={() => navigate('/demo')}
          className="group inline-flex items-center gap-2 text-body-sm text-accent hover:text-accent-muted border-b border-accent/30 hover:border-accent transition-colors"
        >
          <Compass size={14} />
          ¿Prefieres un recorrido guiado paso a paso?
          <ChevronRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>

      <div className="mt-20 pt-8 border-t border-border-hairline max-w-3xl">
        <p className="text-body-sm text-text-secondary leading-relaxed">
          Esta demostración es exclusivamente ilustrativa. No procesa datos
          reales ni genera operaciones. Preparada por Nuestra consultora.
        </p>
      </div>
    </div>
  );
}

function HubCardComponent({ card, onClick }: { card: HubCard; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'group text-left p-7 transition-all duration-200',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:ring-offset-2',
        card.featured
          ? 'bg-bg-card border-2 border-accent hover:shadow-lifted'
          : 'bg-bg-card border border-border-hairline hover:border-text-primary hover:shadow-soft',
      )}
    >
      <div className="flex items-start gap-4">
        <div
          className={cn(
            'flex-shrink-0 w-11 h-11 inline-flex items-center justify-center transition-colors',
            card.featured
              ? 'bg-accent text-text-inverse'
              : 'bg-text-primary text-text-inverse group-hover:bg-accent',
          )}
        >
          {card.icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-caption uppercase tracking-[0.14em] text-text-muted font-medium">
            {card.kicker}
          </div>
          <div className="flex items-center gap-2 mt-1">
            <h2 className="text-h3 font-semibold text-text-primary">{card.title}</h2>
          </div>
          <p className="text-body-sm text-text-secondary mt-3 leading-relaxed">
            {card.description}
          </p>
          <div
            className={cn(
              'mt-4 inline-flex items-center gap-1.5 text-body-sm font-medium transition-colors',
              card.featured ? 'text-accent' : 'text-text-primary group-hover:text-accent',
            )}
          >
            Entrar
            <ChevronRight
              size={14}
              className="group-hover:translate-x-1 transition-transform"
            />
          </div>
        </div>
      </div>
    </button>
  );
}
