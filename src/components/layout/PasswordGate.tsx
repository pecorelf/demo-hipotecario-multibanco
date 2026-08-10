import { useEffect, useState } from 'react';
import { Lock, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/cn';
import { BRAND } from '@/lib/brand';

/**
 * PasswordGate
 *
 * Wraps the entire app. If the user has a valid session cookie, lets them
 * through (handled implicitly — the cookie travels with every fetch).
 *
 * If not, shows a simple login screen. On submit, POSTs to /api/auth which
 * validates the password and sets an HttpOnly session cookie.
 *
 * We don't try to verify the cookie client-side — we just remember if the
 * user has ever passed login this session via localStorage, which is fine
 * for UX (skipping the login form) but the real auth happens server-side.
 */

const PASSED_KEY = 'poc_authenticated';

interface PasswordGateProps {
  children: React.ReactNode;
}

export function PasswordGate({ children }: PasswordGateProps) {
  // En desarrollo local las funciones de /api no se ejecutan bajo Vite, de modo
  // que la validación de contraseña no puede completarse. Esta salida permite
  // trabajar sin levantar el entorno de Vercel. En producción la variable no
  // existe y la contraseña opera con normalidad.
  const omitirEnDesarrollo =
    import.meta.env.DEV && import.meta.env.VITE_BYPASS_AUTH === 'true';

  // Check localStorage on mount to skip the login screen for returning visitors
  const [authenticated, setAuthenticated] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    try {
      return localStorage.getItem(PASSED_KEY) === '1';
    } catch {
      return false;
    }
  });

  if (!authenticated && !omitirEnDesarrollo) {
    return <LoginScreen onSuccess={() => {
      try {
        localStorage.setItem(PASSED_KEY, '1');
      } catch {
        /* ignore */
      }
      setAuthenticated(true);
    }} />;
  }

  return <>{children}</>;
}

// ─────────────────────────────────────────────────────────────

function LoginScreen({ onSuccess }: { onSuccess: () => void }) {
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;
    setError(null);
    setSubmitting(true);

    try {
      const resp = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      if (resp.ok) {
        onSuccess();
        return;
      }

      if (resp.status === 401) {
        setError('Contraseña incorrecta.');
      } else {
        const data = await resp.json().catch(() => ({ error: 'Error desconocido' }));
        setError(data.error ?? 'Error al validar.');
      }
    } catch {
      setError('Error de red. Revisa tu conexión e intenta de nuevo.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F3EEE6] px-6">
      <div className="w-full max-w-md">
        <div className="mb-10">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-[#1A1A1A] mb-6">
            <Lock size={20} className="text-white" />
          </div>
          <div className="text-[11px] tracking-[0.14em] uppercase text-[var(--color-accent-primary)] font-medium mb-3">
            Acceso restringido
          </div>
          <h1 className="text-3xl font-semibold text-[#1A1A1A] leading-tight">
            POC Hipotecario
          </h1>
          <p className="text-base text-[#666] mt-3 leading-relaxed">
            Demostración del rediseño del proceso hipotecario {BRAND.name},
            preparado por Nuestra consultora.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="password"
              className="block text-[11px] uppercase tracking-[0.14em] text-[#1A1A1A] font-medium mb-2"
            >
              Contraseña
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoFocus
              autoComplete="current-password"
              className={cn(
                'w-full px-4 py-3 text-base',
                'bg-[#FBF8F2] border border-[#DAD2C4]',
                'focus:outline-none focus:border-[var(--color-accent-primary)]',
                'transition-colors duration-150',
              )}
              placeholder="••••••••"
              disabled={submitting}
            />
          </div>

          {error && (
            <div className="text-sm text-[#B00020] py-1">{error}</div>
          )}

          <button
            type="submit"
            disabled={submitting || !password.trim()}
            className={cn(
              'w-full px-5 py-3 text-base font-medium',
              'bg-[var(--color-accent-primary)] text-white',
              'hover:bg-[#C00] disabled:opacity-50 disabled:cursor-not-allowed',
              'transition-all duration-150',
              'inline-flex items-center justify-center gap-2',
            )}
          >
            {submitting ? 'Validando…' : (
              <>
                Ingresar
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        <p className="mt-10 text-xs text-[#888] leading-relaxed">
          Si no recuerdas la contraseña, contacta a Andrés Fuenzalida
          en Nuestra consultora.
        </p>
      </div>
    </div>
  );
}
