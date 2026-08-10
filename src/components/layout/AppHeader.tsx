import { Link } from 'react-router-dom';
import { Avatar } from '@/components/ui/Avatar';
import { RoleSwitcher } from './RoleSwitcher';
import { ContextSwitcher } from './ContextSwitcher';
import { NotificationBell } from './NotificationBell';
import { currentCustomer, currentExecutive } from '@/data/mock';
import { useAppStore } from '@/store/appStore';
import { BRAND } from '@/lib/brand';
import { useBank } from '@/theme';

export function AppHeader() {
  const role = useAppStore((s) => s.currentRole);
  const isThirdParty = role === 'inmobiliaria';
  // Mostrar campana solo en roles relevantes
  const showBell = role === 'cliente' || isThirdParty;

  const displayName =
    role === 'cliente'
      ? currentCustomer.fullName
      : role === 'ejecutivo' || role === 'backoffice'
        ? currentExecutive.fullName
        : role === 'jefatura'
          ? 'Macarena Ibáñez'
          : role === 'operaciones'
            ? 'Felipe Contreras'
            : role === 'gobierno'
              ? 'José Molina · Priscilla Von Dessauer'
              : 'Los Almendros Propiedades';

  return (
    <header className="bg-bg-page border-b border-border-hairline">
      <div className="max-w-shell mx-auto px-6 md:px-10 lg:px-16 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3 group">
          {isThirdParty ? (
            <>
              <span className="text-body text-text-primary font-medium">
                Inmobiliaria Los Almendros
              </span>
              <span aria-hidden className="text-text-muted">·</span>
              <span className="text-caption uppercase tracking-[0.14em] text-text-muted">
                Powered by {BRAND.shortName}
              </span>
            </>
          ) : (
            <>
              <BankLogo />
              <span aria-hidden className="text-border-hairline h-5 w-px bg-border-hairline" />
              <span className="text-body-sm text-text-primary font-medium hidden sm:inline">
                Tus nuevas Llaves
              </span>
            </>
          )}
        </Link>
        <div className="flex items-center gap-4">
          <Link
            to="/portal"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-caption font-medium text-accent border border-accent/40 hover:bg-accent hover:text-text-inverse transition-colors duration-base"
            title="Todas las vistas del POC"
          >
            ☷ Vistas demo
          </Link>
          <Link
            to="/demo"
            className="text-caption text-text-muted hover:text-text-primary transition-colors duration-base hidden md:inline"
            title="Recorrido guiado paso a paso"
          >
            Recorrido guiado ↗
          </Link>
          {showBell && <NotificationBell />}
          {/* Recorrido troncal siempre visible. El desplegable conserva el resto. */}
          <div className="hidden md:block">
            <ContextSwitcher />
          </div>
          <RoleSwitcher />
          <Avatar name={displayName} size="sm" />
        </div>
      </div>
    </header>
  );
}

function BankLogo() {
  // El logotipo se carga desde /admin y viaja en el tema. Cuando no hay
  // ninguno cargado se recurre al nombre de la institución, de modo que la
  // cabecera nunca queda vacía ni muestra una imagen rota.
  const bank = useBank();

  if (!bank.logoUrl) {
    return (
      <span className="text-body font-semibold text-accent whitespace-nowrap">
        {bank.shortName}
      </span>
    );
  }

  return (
    <span className="inline-flex items-center">
      <img
        src={bank.logoUrl}
        alt={bank.shortName}
        className="h-6 w-auto shrink-0 max-w-[160px] object-contain"
      />
    </span>
  );
}
