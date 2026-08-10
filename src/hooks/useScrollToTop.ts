import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * useScrollToTop — Restaura el scroll al inicio en cada cambio de ruta.
 *
 * Las SPAs preservan la posición de scroll al navegar por defecto;
 * este hook la reinicia. Se monta una vez en el AppShell.
 *
 * Intentamos múltiples targets defensivamente porque dependiendo del
 * layout CSS, el elemento scrolleable puede ser window, documentElement,
 * body, o un contenedor interno con overflow auto.
 *
 * Diferimos a requestAnimationFrame para correr DESPUÉS de que React
 * pintó la nueva ruta — si scrolleamos antes, el contenido aún no está
 * layouteado y scrollTop = 0 puede ser un no-op en algunos navegadores.
 */
export function useScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    requestAnimationFrame(() => {
      // 1. Window principal
      try {
        window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
      } catch {
        window.scrollTo(0, 0);
      }
      // 2. Document body y html (cubre distintos modos de scroll)
      if (document.documentElement) {
        document.documentElement.scrollTop = 0;
      }
      if (document.body) {
        document.body.scrollTop = 0;
      }
      // 3. Cualquier contenedor interno con overflow scroll/auto que
      //    pueda estar capturando el scroll en lugar del window
      const scrollableContainers = document.querySelectorAll<HTMLElement>(
        '[data-scroll-container], main, [data-scroll-reset]',
      );
      scrollableContainers.forEach((el) => {
        if (el.scrollTop > 0) {
          el.scrollTop = 0;
        }
      });
    });
  }, [pathname]);
}
