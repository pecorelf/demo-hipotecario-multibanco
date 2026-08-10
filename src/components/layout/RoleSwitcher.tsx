import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Check, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/cn';
import { useAppStore, ROLE_LABEL, ROLE_HOME } from '@/store/appStore';
import type { Role } from '@/types';

const ROLES: Role[] = ['cliente', 'ejecutivo', 'backoffice', 'jefatura', 'operaciones', 'gobierno', 'inmobiliaria'];

// Vistas nuevas — visión Daniela (no son roles, son destinos)
type QuickLink = {
  path: string;
  label: string;
  role: Role; // rol que adopta el header al navegar
};

const QUICK_LINKS: QuickLink[] = [
  { path: '/cliente/seguimiento', label: 'Cliente · Mi solicitud', role: 'cliente' },
  { path: '/cliente/mis-documentos', label: 'Cliente · Mis documentos', role: 'cliente' },
  { path: '/vendedor', label: 'Vendedor · Portal', role: 'cliente' },
  { path: '/inmobiliaria/proyectos', label: 'Inmobiliaria · Proyectos', role: 'inmobiliaria' },
];

// Map from a path to a custom header label.
// Used by the header to show the right title when the user is on
// one of the QuickLink views (where the plain role label would be ambiguous).
function resolveHeaderLabel(pathname: string, role: Role): string {
  const matched = QUICK_LINKS.find((l) => l.path === pathname);
  if (matched) return matched.label;
  return ROLE_LABEL[role];
}

export function RoleSwitcher() {
  const currentRole = useAppStore((s) => s.currentRole);
  const setRole = useAppStore((s) => s.setRole);
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Compute the visible header label based on the current pathname
  const headerLabel = resolveHeaderLabel(location.pathname, currentRole);

  useEffect(() => {
    if (!open) return;
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  function handleSelectRole(role: Role) {
    setRole(role);
    setOpen(false);
    navigate(ROLE_HOME[role]);
  }

  function handleSelectQuickLink(link: QuickLink) {
    setRole(link.role);
    setOpen(false);
    navigate(link.path);
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={cn(
          'inline-flex items-center gap-2 px-4 py-2 text-body-sm text-text-primary',
          'border border-border-hairline bg-bg-card',
          'hover:border-text-primary transition-colors duration-base ease-out-soft',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:ring-offset-2 focus-visible:ring-offset-bg-page',
        )}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="text-kicker uppercase text-text-muted">Rol</span>
        <span className="font-medium">{headerLabel}</span>
        <ChevronDown
          size={14}
          className={cn(
            'text-text-muted transition-transform duration-base ease-out-soft',
            open && 'rotate-180',
          )}
        />
      </button>

      {open && (
        <div
          className="absolute right-0 top-full mt-2 min-w-[280px] bg-bg-card border border-border-hairline shadow-soft z-50 animate-fade-in"
        >
          {/* Sección Roles */}
          <div className="px-4 pt-3 pb-1.5">
            <span className="text-kicker uppercase tracking-[0.14em] text-text-muted">
              Roles
            </span>
          </div>
          <ul role="listbox">
            {ROLES.map((role) => {
              const active = role === currentRole;
              return (
                <li key={role}>
                  <button
                    type="button"
                    onClick={() => handleSelectRole(role)}
                    role="option"
                    aria-selected={active}
                    className={cn(
                      'w-full flex items-center justify-between gap-4 px-4 py-2.5 text-left text-body-sm',
                      'hover:bg-bg-sunken transition-colors duration-base ease-out-soft',
                      active ? 'text-text-primary font-medium' : 'text-text-secondary',
                    )}
                  >
                    <span>{ROLE_LABEL[role]}</span>
                    {active && <Check size={14} className="text-accent shrink-0" />}
                  </button>
                </li>
              );
            })}
          </ul>

          {/* Divider */}
          <div className="border-t border-border-hairline my-1.5" />

          {/* Sección Vistas Vendedor/Comprador */}
          <div className="px-4 pt-2 pb-1.5">
            <span className="text-kicker uppercase tracking-[0.14em] text-text-muted">
              Vistas Vendedor/Comprador
            </span>
          </div>
          <ul role="listbox">
            {QUICK_LINKS.map((link) => (
              <li key={link.path}>
                <button
                  type="button"
                  onClick={() => handleSelectQuickLink(link)}
                  className={cn(
                    'w-full flex items-center justify-between gap-4 px-4 py-2.5 text-left text-body-sm',
                    'hover:bg-bg-sunken transition-colors duration-base ease-out-soft',
                    'text-text-secondary',
                  )}
                >
                  <span>{link.label}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
