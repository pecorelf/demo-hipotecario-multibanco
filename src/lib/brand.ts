/**
 * Identidad activa de la demostracion.
 *
 * Se resuelve una sola vez al cargar el modulo, a partir del identificador de
 * la URL. Como el identificador no cambia durante la sesion, exponerlo como
 * constante evita convertir en hook cada componente que solo necesita el
 * nombre de la institucion o de un actor.
 *
 * Para componentes que deben reaccionar a cambios en vivo, como el panel de
 * administracion, usar el hook useBank() de @/theme.
 */

import { resolveTheme, readSlugFromUrl, type BankTheme } from '@/theme/banks';

export const BRAND: BankTheme = { ...resolveTheme(readSlugFromUrl()) };

/** Verdadero cuando hay una institucion seleccionada. */
export const HAS_BRAND = BRAND.slug !== 'generico';

/**
 * Aplica sobre BRAND la personalizacion guardada desde /admin.
 *
 * BRAND es una constante para evitar convertir en hook cada componente que solo
 * necesita un nombre. Por eso el override se escribe en el mismo objeto en vez
 * de reemplazarlo: las paginas que ya lo importaron siguen apuntando aqui.
 *
 * Devuelve true cuando algun valor cambio, para que quien llame decida si
 * necesita forzar un re-render.
 */
export function applyBrandOverride(override: Partial<BankTheme>): boolean {
  const destino = BRAND as unknown as Record<string, unknown>;
  let cambio = false;
  for (const [k, v] of Object.entries(override)) {
    if (v === undefined || v === null || v === '') continue;
    if (destino[k] !== v) {
      destino[k] = v;
      cambio = true;
    }
  }
  return cambio;
}
