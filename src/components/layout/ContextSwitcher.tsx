import { useLocation, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/cn';
import { useAppStore, ROLE_HOME } from '@/store/appStore';
import { BRAND } from '@/lib/brand';
import type { Role } from '@/types';

/**
 * ContextSwitcher
 *
 * Conmutador permanente entre los tres actores del recorrido principal:
 * cliente, ejecutivo y back office.
 *
 * Existe porque el recorrido de la demostración es una historia que salta
 * varias veces entre actores —el cliente carga un documento, el ejecutivo lo
 * observa y solicita un reparo, el cliente lo corrige— y obligar a volver al
 * índice en cada salto rompe el hilo justo en el momento de mayor interés.
 *
 * Las vistas de profundidad no desaparecen: siguen disponibles en el catálogo
 * y en el selector desplegable. Este componente solo asegura que el recorrido
 * troncal esté siempre a un clic.
 */

interface Contexto {
  role: Role;
  path: string;
  label: string;
  /** Rutas que también corresponden a este contexto */
  matches: string[];
}

const CONTEXTOS: Contexto[] = [
  {
    role: 'cliente',
    path: '/cliente/seguimiento',
    label: 'Cliente',
    matches: ['/cliente', '/cliente/seguimiento', '/cliente/mis-documentos', '/cliente/mi-inmueble', '/cliente/simulacion-pre'],
  },
  {
    role: 'ejecutivo',
    path: '/ejecutivo',
    label: `Ejecutivo ${BRAND.shortName}`,
    matches: ['/ejecutivo', '/ejecutivo/audio', '/ejecutivo/inmueble', '/ejecutivo/simulador-impacto'],
  },
  {
    role: 'backoffice',
    path: '/backoffice',
    label: 'Back office',
    matches: ['/backoffice'],
  },
];

export function ContextSwitcher() {
  const setRole = useAppStore((s) => s.setRole);
  const navigate = useNavigate();
  const location = useLocation();

  const activo = CONTEXTOS.find((c) => c.matches.includes(location.pathname));

  function ir(c: Contexto) {
    setRole(c.role);
    navigate(c.path);
  }

  return (
    <nav
      aria-label="Cambiar de actor"
      className="inline-flex items-center border border-border-hairline bg-bg-card"
    >
      {CONTEXTOS.map((c, i) => {
        const esActivo = activo?.role === c.role;
        return (
          <button
            key={c.role}
            onClick={() => ir(c)}
            aria-current={esActivo ? 'page' : undefined}
            className={cn(
              'px-3 py-1.5 text-body-sm transition-colors whitespace-nowrap',
              i > 0 && 'border-l border-border-hairline',
              esActivo
                ? 'bg-accent text-white font-medium'
                : 'text-text-secondary hover:bg-bg-sunken hover:text-text-primary',
            )}
          >
            {c.label}
          </button>
        );
      })}
    </nav>
  );
}
