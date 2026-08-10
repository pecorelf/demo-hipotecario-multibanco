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

export const BRAND: BankTheme = resolveTheme(readSlugFromUrl());

/** Verdadero cuando hay una institucion seleccionada. */
export const HAS_BRAND = BRAND.slug !== 'generico';
