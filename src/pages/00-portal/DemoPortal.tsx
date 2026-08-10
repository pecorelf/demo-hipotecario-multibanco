import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  Building2,
  ChevronRight,
  Compass,
  FileText,
  Layers,
  Sparkles,
  Star,
  User,
  Users,
  X,
} from 'lucide-react';
import { Kicker, PageTitle, Pill } from '@/components/ui';
import { cn } from '@/lib/cn';
import { BRAND } from '@/lib/brand';

/**
 * DemoPortal — catálogo completo del POC.
 *
 * No es el entry point principal del POC (eso es /cliente/seguimiento).
 * Esta página se accede desde el botón "Vistas demo" del header, para
 * cuando el visitante quiere navegar libremente entre las 17 vistas.
 *
 * Diseño: tabla densa pero clara, no card grid abrumador. Una fila por
 * vista con todo lo necesario para decidir si entrar.
 */

interface ViewItem {
  route: string;
  title: string;
  description: string;
  isNew?: boolean;
}

interface ViewBlock {
  id: string;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  accent?: boolean;
  views: ViewItem[];
}

const BLOCKS: ViewBlock[] = [
  {
    id: 'principal',
    title: 'Foco principal',
    subtitle: 'Lo que pidió Carolina: post-aprobación.',
    icon: <Star size={16} />,
    accent: true,
    views: [
      {
        route: '/cliente/seguimiento',
        title: 'Mi hipoteca · Vista principal',
        description:
          'Hipoteca aprobada. Tracking dual, gate de gastos operacionales, notificaciones, reparos.',
        isNew: true,
      },
    ],
  },
  {
    id: 'cliente',
    title: 'Cliente · Otras vistas',
    subtitle: 'Vistas complementarias del comprador.',
    icon: <User size={16} />,
    views: [
      {
        route: '/cliente/credito',
        title: 'Detalles del crédito',
        description: 'Monto, plazo, tasa, dividendo. Stepper de 7 etapas y timeline.',
      },
      {
        route: '/cliente/mis-documentos',
        title: 'Mis documentos',
        description: 'Subida en cualquier formato. Voz del portal explica reparos en lenguaje corriente.',
      },
    ],
  },
  {
    id: 'pre-aprobacion',
    title: 'Cliente · Pre-aprobación',
    subtitle: 'Extra-agregado: simulación previa con asistente IA.',
    icon: <Sparkles size={16} />,
    views: [
      {
        route: '/cliente/simulacion-pre',
        title: `Onboarding con ${BRAND.assistantName}`,
        description: 'Conversación con la asistente IA. Captura datos y arma el caso. Streaming en vivo.',
      },
      {
        route: '/cliente/propiedad',
        title: 'Datos de la propiedad',
        description: 'Formulario directo de propiedad como alternativa a la conversación.',
      },
      {
        route: '/cliente/documentos',
        title: 'Documentos auto-validados',
        description: 'Upload con extracción IA en vivo. Tres secciones: rescatados, en búsqueda, pendientes.',
      },
      {
        route: '/cliente/simulacion',
        title: 'Simulación de escenarios',
        description: 'Tres escenarios estándar (20/25/30 años) o cuatro si conversó un plazo personalizado.',
      },
      {
        route: '/cliente/confirmado',
        title: 'Confirmación final',
        description: 'El cliente acepta el escenario y queda en pre-aprobación.',
      },
    ],
  },
  {
    id: 'ejecutivo',
    title: `Ejecutivo · ${BRAND.shortName}`,
    subtitle: 'Camila Reinoso. Cockpit con control de documentos y reparos.',
    icon: <FileText size={16} />,
    views: [
      {
        route: '/ejecutivo',
        title: 'Cockpit del ejecutivo',
        description: 'Pipeline de casos. Captura en vivo del cliente. Panel para aprobar o lanzar reparos.',
        isNew: true,
      },
      {
        route: '/ejecutivo/audio',
        title: 'Sesión con cliente · Audio',
        description: 'Sesión en vivo con transcripción y copilot del ejecutivo durante la llamada.',
      },
    ],
  },
  {
    id: 'externos',
    title: 'Vendedor / Inmobiliaria',
    subtitle: 'Aplica según tipo de propiedad (Usada o Nueva).',
    icon: <Building2 size={16} />,
    views: [
      {
        route: '/vendedor',
        title: 'Portal del Vendedor',
        description: 'Solo para propiedades USADAS. Sube documentos legales. Ve reparos pendientes.',
        isNew: true,
      },
      {
        route: '/inmobiliaria/proyectos',
        title: 'Portal de la Inmobiliaria',
        description: 'Solo para propiedades NUEVAS. Sube documentos del proyecto. Ve reparos pendientes.',
        isNew: true,
      },
      {
        route: '/inmobiliaria',
        title: 'Corredora inmobiliaria',
        description: 'Portal de la corredora con casos asociados a sus propiedades en venta.',
      },
    ],
  },
  {
    id: 'interno-banco',
    title: 'Operación interna · Banco',
    subtitle: 'Back office, operaciones, jefatura, gobierno tecnológico.',
    icon: <Users size={16} />,
    views: [
      {
        route: '/backoffice',
        title: 'Back office · Dashboard',
        description: 'Casos pendientes de validación. Operaciones que requieren revisión especializada.',
      },
      {
        route: '/operaciones',
        title: 'Operaciones',
        description: 'Vista del responsable de operaciones del proceso hipotecario.',
      },
      {
        route: '/jefatura',
        title: 'Vista Ejecutiva de Producto',
        description: 'Dashboard de jefatura: SLA, cuellos de botella, conversión, abandono.',
      },
      {
        route: '/governance',
        title: 'Tecnología y Riesgo',
        description: 'Gobernanza tecnológica y de modelos IA. Trazabilidad de decisiones automatizadas.',
      },
    ],
  },
  {
    id: 'complementarios',
    title: 'Complementarios',
    subtitle: `Útiles durante la conversación con ${BRAND.shortName}.`,
    icon: <Layers size={16} />,
    views: [
      {
        route: '/comparador',
        title: 'Comparador de ofertas',
        description: `Comparación honesta de ${BRAND.shortName} vs otros bancos. Muestra al ganador real.`,
      },
    ],
  },
];

export default function DemoPortal() {
  const navigate = useNavigate();
  const totalViews = BLOCKS.reduce((acc, b) => acc + b.views.length, 0);

  return (
    <div className="max-w-shell mx-auto px-6 md:px-10 lg:px-16 py-10 lg:py-12">
      {/* HEADER COMPACTO */}
      <div className="flex items-start justify-between gap-6 max-w-4xl">
        <div>
          <Kicker>Catálogo de vistas</Kicker>
          <PageTitle className="mt-3">
            {totalViews} vistas en {BLOCKS.length} bloques.
          </PageTitle>
          <p className="text-body text-text-secondary mt-3 leading-relaxed max-w-measure">
            Estás en el catálogo completo del POC. Para volver a la vista
            principal, usa el botón "Volver" abajo o cierra esta página.
          </p>
        </div>
        <button
          onClick={() => navigate('/cliente/seguimiento')}
          className="flex-shrink-0 inline-flex items-center gap-2 px-4 py-2 text-body-sm font-medium text-text-primary border border-border-hairline bg-bg-card hover:border-text-primary transition-colors"
        >
          <X size={14} />
          Volver a vista principal
        </button>
      </div>

      <span aria-hidden className="block w-12 h-px bg-border-hairline mt-10" />

      {/* RECORRIDO GUIADO — banda discreta */}
      <div className="mt-8 max-w-4xl">
        <button
          onClick={() => navigate('/demo')}
          className="group inline-flex items-center gap-2 text-body-sm text-accent hover:text-accent-muted border-b border-accent/30 hover:border-accent transition-colors"
        >
          <Compass size={14} />
          ¿Prefieres un recorrido guiado paso a paso? (ideal para presentar)
          <ArrowRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>

      {/* BLOQUES — tabla densa, no card grid */}
      <div className="mt-12 space-y-10 max-w-4xl">
        {BLOCKS.map((block) => (
          <BlockTable key={block.id} block={block} onClick={(r) => navigate(r)} />
        ))}
      </div>

      {/* FOOTER */}
      <div className="mt-16 pt-8 border-t border-border-hairline max-w-4xl">
        <p className="text-body-sm text-text-secondary leading-relaxed">
          Esta demostración es exclusivamente ilustrativa. No procesa datos
          reales ni genera operaciones. Preparada por Nuestra consultora.
        </p>
      </div>
    </div>
  );
}

function BlockTable({
  block,
  onClick,
}: {
  block: ViewBlock;
  onClick: (route: string) => void;
}) {
  return (
    <section>
      <div className="flex items-center gap-3 mb-4">
        <div
          className={cn(
            'flex-shrink-0 w-8 h-8 flex items-center justify-center',
            block.accent
              ? 'bg-accent text-text-inverse'
              : 'bg-text-primary text-text-inverse',
          )}
        >
          {block.icon}
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-h3 font-semibold text-text-primary leading-tight">
            {block.title}
          </h2>
          <p className="text-caption text-text-muted mt-0.5">{block.subtitle}</p>
        </div>
      </div>

      <ul className="border-t border-border-hairline">
        {block.views.map((view) => (
          <li key={view.route}>
            <button
              onClick={() => onClick(view.route)}
              className="group w-full text-left py-4 px-2 -mx-2 border-b border-border-hairline hover:bg-bg-card transition-colors"
            >
              <div className="flex items-start gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-body font-medium text-text-primary group-hover:text-accent transition-colors">
                      {view.title}
                    </span>
                    {view.isNew && (
                      <Pill variant="error" size="sm">
                        Nueva
                      </Pill>
                    )}
                    <code className="text-caption text-text-muted font-mono">
                      {view.route}
                    </code>
                  </div>
                  <p className="text-body-sm text-text-secondary mt-1 leading-relaxed">
                    {view.description}
                  </p>
                </div>
                <ChevronRight
                  size={16}
                  className="text-text-muted group-hover:text-accent group-hover:translate-x-0.5 transition-all flex-shrink-0 mt-1"
                />
              </div>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
