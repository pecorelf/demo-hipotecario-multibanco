import { useState } from 'react';
import { ArrowRight, Lock } from 'lucide-react';
import { Card, Kicker, PageTitle } from '@/components/ui';
import { cn } from '@/lib/cn';
import { formatRut } from '@/lib/format';
import { useAppStore } from '@/store/appStore';
import { currentCustomer } from '@/data/mock';
import { BRAND } from '@/lib/brand';

const DEFAULT_RUT = '16.482.930-7'; // Francisco

export function ClientLogin() {
  const loginClient = useAppStore((s) => s.loginClient);
  const [rut, setRut] = useState(DEFAULT_RUT);
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!rut || !password) return;
    setSubmitting(true);
    // simulated 600ms auth — tiny touch of realism
    setTimeout(() => {
      loginClient();
    }, 600);
  }

  function handleRutChange(value: string) {
    setRut(value.replace(/[^0-9kK.\-]/g, ''));
  }

  function handleRutBlur() {
    setRut(formatRut(rut));
  }

  return (
    <div className="max-w-shell mx-auto px-6 md:px-10 lg:px-16 py-16 lg:py-24 flex justify-center">
      <Card padding="lg" className="w-full max-w-md space-y-10">
        <header>
          <Kicker>Mi banco · ingreso seguro</Kicker>
          <PageTitle size="display-sm" className="mt-3">
            Ingresa con tus credenciales
          </PageTitle>
          <p className="text-body-sm text-text-secondary mt-3">
            Te identificamos en seguros para que tu asistente personal pueda rescatar
            tu información y avanzar contigo sin pedirte lo que ya sabemos.
          </p>
        </header>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <label htmlFor="login-rut" className="text-body-sm text-text-secondary">
              RUT
            </label>
            <input
              id="login-rut"
              type="text"
              value={rut}
              onChange={(e) => handleRutChange(e.target.value)}
              onBlur={handleRutBlur}
              placeholder="12.345.678-9"
              autoComplete="username"
              className={cn(
                'w-full bg-bg-page border border-border-hairline',
                'px-4 py-3 text-body text-text-primary tabular-nums',
                'focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/15',
              )}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="login-password" className="text-body-sm text-text-secondary">
              Clave de internet
            </label>
            <input
              id="login-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Ingresa tu clave"
              autoComplete="current-password"
              className={cn(
                'w-full bg-bg-page border border-border-hairline',
                'px-4 py-3 text-body text-text-primary',
                'focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/15',
              )}
            />
            <p className="text-caption text-text-muted">
              Para esta demo, escribe cualquier clave de al menos 4 caracteres.
            </p>
          </div>

          <button
            type="submit"
            disabled={!rut || password.length < 4 || submitting}
            className={cn(
              'w-full inline-flex items-center justify-center gap-2 px-5 py-3 text-body-lg font-medium',
              'bg-accent text-text-inverse',
              'hover:bg-accent-muted transition-colors duration-base ease-out-soft',
              'disabled:opacity-40 disabled:cursor-not-allowed',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:ring-offset-2 focus-visible:ring-offset-bg-card',
            )}
          >
            {submitting ? (
              <>
                <Lock size={14} />
                Verificando
              </>
            ) : (
              <>
                Ingresar
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        <p className="text-caption text-text-muted pt-6 border-t border-border-hairline">
          Demo: ya verás cómo {currentCustomer.fullName.split(' ')[0]} entra con sus
          datos. En producción esta pantalla se reemplaza por la autenticación real
          de {BRAND.shortName}.
        </p>
      </Card>
    </div>
  );
}
