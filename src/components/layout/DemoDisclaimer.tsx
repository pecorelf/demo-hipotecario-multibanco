import { useState, useEffect } from 'react';
import { X, Info } from 'lucide-react';
import { cn } from '@/lib/cn';

/**
 * DemoDisclaimer
 *
 * A high-visibility banner that warns viewers that this is a
 * demonstration POC, not a production system. Can be dismissed
 * with the X button. Dismissal persists in sessionStorage so
 * it does not reappear on every navigation, but resets if the
 * tab is closed.
 */

const DISMISS_KEY = 'demo_disclaimer_dismissed';

export function DemoDisclaimer() {
  const [dismissed, setDismissed] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    try {
      return sessionStorage.getItem(DISMISS_KEY) === '1';
    } catch {
      return false;
    }
  });

  // Sync any external dismissals (e.g. another tab) — defensive
  useEffect(() => {
    function onStorage(e: StorageEvent) {
      if (e.key === DISMISS_KEY && e.newValue === '1') setDismissed(true);
    }
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  function handleDismiss() {
    try {
      sessionStorage.setItem(DISMISS_KEY, '1');
    } catch {
      /* noop */
    }
    setDismissed(true);
  }

  if (dismissed) return null;

  return (
    <div
      role="alert"
      className={cn(
        'w-full border-b-2 border-yellow-700/30',
        // Warm amber (not pure yellow — coherent with the cream palette)
        'bg-[#FCEFA4]',
      )}
    >
      <div className="max-w-shell mx-auto px-6 md:px-10 lg:px-16 py-3">
        <div className="flex items-start gap-3">
          <Info
            size={16}
            className="text-yellow-900 flex-shrink-0 mt-0.5"
            aria-hidden
          />
          <div className="flex-1 min-w-0">
            <p className="text-body-sm text-yellow-950 leading-relaxed">
              <span className="font-semibold">Demo ilustrativa.</span>{' '}
              Esta experiencia es exclusivamente demostrativa del proceso hipotecario.
              No está conectada a sistemas reales del banco, no procesa datos personales
              verdaderos y no genera operaciones. Busca recrear cómo se sentiría el viaje
              agéntico cliente-banco bajo el rediseño propuesto.
            </p>
          </div>
          <button
            type="button"
            onClick={handleDismiss}
            aria-label="Cerrar este aviso"
            className={cn(
              'flex-shrink-0 inline-flex items-center justify-center w-7 h-7',
              'text-yellow-900 hover:bg-yellow-700/15 transition-colors duration-base',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-yellow-700/40',
            )}
          >
            <X size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
