/**
 * Almacenamiento de personalizaciones.
 *
 * Intenta el endpoint del servidor y, si no esta disponible, usa el navegador.
 * Asi la aplicacion funciona en desarrollo sin configurar nada.
 */

import type { BankTheme } from './banks';

const PREFIJO = 'theme:';

export async function leerOverride(slug: string): Promise<Partial<BankTheme> | null> {
  try {
    const r = await fetch(`/api/theme?slug=${encodeURIComponent(slug)}`);
    if (r.ok) {
      const data = await r.json();
      if (data) return data as Partial<BankTheme>;
    }
  } catch { /* se intenta el navegador */ }
  try {
    const local = localStorage.getItem(PREFIJO + slug);
    return local ? (JSON.parse(local) as Partial<BankTheme>) : null;
  } catch {
    return null;
  }
}

export async function guardarOverride(
  slug: string, theme: BankTheme, token: string,
): Promise<{ ok: boolean; destino: 'servidor' | 'navegador' }> {
  try {
    const r = await fetch('/api/theme', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Admin-Token': token },
      body: JSON.stringify({ slug, theme }),
    });
    if (r.ok) return { ok: true, destino: 'servidor' };
  } catch { /* se intenta el navegador */ }
  try {
    localStorage.setItem(PREFIJO + slug, JSON.stringify(theme));
    return { ok: true, destino: 'navegador' };
  } catch {
    return { ok: false, destino: 'navegador' };
  }
}

export async function borrarOverride(slug: string, token: string): Promise<void> {
  try {
    await fetch(`/api/theme?slug=${encodeURIComponent(slug)}`, {
      method: 'DELETE', headers: { 'X-Admin-Token': token },
    });
  } catch { /* continua */ }
  try { localStorage.removeItem(PREFIJO + slug); } catch { /* sin accion */ }
}
