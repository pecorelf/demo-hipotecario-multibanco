import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { readSlugFromUrl } from '@/theme/banks';

/**
 * Mantiene el identificador de institucion visible en la barra de direcciones.
 *
 * Las navegaciones internas de React Router no arrastran la query string, de
 * modo que volver al inicio dejaba la URL sin ?t= y cualquier recarga o enlace
 * copiado perdia la marca. Aqui se reescribe la direccion sin generar una
 * entrada nueva en el historial.
 */
export function useTenantParam(): void {
  const location = useLocation();

  useEffect(() => {
    const slug = readSlugFromUrl();
    if (!slug) return;

    const params = new URLSearchParams(window.location.search);
    if (params.get('t') === slug) return;

    params.delete('tenant');
    params.set('t', slug);
    const query = params.toString();
    window.history.replaceState(
      window.history.state,
      '',
      `${window.location.pathname}${query ? `?${query}` : ''}${window.location.hash}`,
    );
  }, [location.pathname, location.search]);
}
