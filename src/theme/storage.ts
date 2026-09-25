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
    const logo = localStorage.getItem(`${PREFIJO}logo:${slug}`);
    if (!local && !logo) return null;
    const base = local ? (JSON.parse(local) as Partial<BankTheme>) : {};
    return logo ? { ...base, logoUrl: logo } : base;
  } catch {
    return null;
  }
}

export async function guardarOverride(
  slug: string, theme: BankTheme, token: string,
): Promise<{ ok: boolean; destino: 'servidor' | 'navegador'; aviso?: string }> {
  let servidor = false;
  try {
    const r = await fetch('/api/theme', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Admin-Token': token },
      body: JSON.stringify({ slug, theme }),
    });
    servidor = r.ok;
  } catch { /* se intenta el navegador */ }

  // El navegador se escribe siempre, incluso cuando el servidor respondió
  // bien: así la identidad sobrevive a una caída del almacenamiento remoto
  // y la demostración nunca aparece sin logotipo.
  //
  // El logotipo se guarda aparte porque es, de lejos, el valor más pesado.
  // Si el resto del tema no cabe junto a él, al menos uno de los dos
  // sobrevive en vez de perderse ambos por una sola cuota excedida.
  const { logoUrl, ...resto } = theme;
  let aviso: string | undefined;
  try {
    localStorage.setItem(PREFIJO + slug, JSON.stringify(resto));
  } catch {
    aviso = 'No se pudo guardar la identidad en este navegador.';
  }
  try {
    if (logoUrl) localStorage.setItem(`${PREFIJO}logo:${slug}`, logoUrl);
    else localStorage.removeItem(`${PREFIJO}logo:${slug}`);
  } catch {
    aviso = 'El logotipo es demasiado pesado para guardarse en este navegador. Sube uno más liviano.';
  }

  if (servidor) return { ok: true, destino: 'servidor', aviso };
  return { ok: !aviso, destino: 'navegador', aviso };
}

export async function borrarOverride(slug: string, token: string): Promise<void> {
  try {
    await fetch(`/api/theme?slug=${encodeURIComponent(slug)}`, {
      method: 'DELETE', headers: { 'X-Admin-Token': token },
    });
  } catch { /* continua */ }
  try {
    localStorage.removeItem(PREFIJO + slug);
    localStorage.removeItem(`${PREFIJO}logo:${slug}`);
  } catch { /* sin accion */ }
}
