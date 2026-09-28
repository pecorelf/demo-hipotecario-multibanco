/**
 * Provider de identidad visual.
 *
 * Resuelve el tema en este orden:
 *   1. Personalizacion guardada para el identificador solicitado
 *   2. Preset en codigo
 *   3. Tema neutro
 *
 * Si el almacenamiento falla durante una demostracion, cae al preset y nunca a
 * la identidad de otra institucion.
 */

import { createContext, Fragment, useContext, useEffect, useState, type ReactNode } from 'react';
import { resolveTheme, readSlugFromUrl, type BankTheme } from './banks';
import { applyBrandOverride } from '@/lib/brand';
import { usePostApprovalStore } from '@/store/postApprovalStore';
import { leerOverride } from './storage';

interface ThemeContextValue {
  theme: BankTheme;
  previewTheme: (t: BankTheme) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

/** Escribe el tema en las variables CSS que consume la aplicacion. */
export function applyTheme(t: BankTheme) {
  const r = document.documentElement;
  r.style.setProperty('--color-accent-primary', t.accent);
  r.style.setProperty('--color-accent-muted', t.accentMuted);
  r.style.setProperty('--color-accent-soft', t.accentSoft);
  r.style.setProperty('--color-border-focus', t.accent);
  r.style.setProperty('--color-text-accent', t.accent);
  r.style.setProperty('--font-brand', t.fontFamily);
  document.title = `${t.programName} · ${t.shortName}`;
  aplicarFavicon(t);
}

/**
 * Icono de la pestaña.
 *
 * Se usa siempre la marca de la firma, no el logotipo de la institución: un
 * logotipo bancario reducido a dieciséis píxeles se vuelve una mancha
 * ilegible, y además la demostración la presenta Deloitte.
 */
function aplicarFavicon(_t: BankTheme) {
  if (typeof document === 'undefined') return;

  let link = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
  if (!link) {
    link = document.createElement('link');
    link.rel = 'icon';
    document.head.appendChild(link);
  }
  link.type = 'image/svg+xml';
  link.href = FAVICON_FIRMA;
}

/** Punto verde de la firma sobre fondo oscuro: legible a 16 píxeles. */
const FAVICON_FIRMA = `data:image/svg+xml,${encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
     <rect width="64" height="64" rx="12" fill="#0F0F0F"/>
     <circle cx="32" cy="32" r="13" fill="#86BC25"/>
   </svg>`,
)}`;

export function ThemeProvider({ children }: { children: ReactNode }) {
  const slug = readSlugFromUrl();
  const [theme, setTheme] = useState<BankTheme>(() => resolveTheme(slug));
  // Cambia cuando la personalizacion modifica algun texto de BRAND. Se usa como
  // key del arbol para que las paginas que leen BRAND vuelvan a renderizarse.
  const [brandVersion, setBrandVersion] = useState(0);

  useEffect(() => {
    let cancelado = false;
    const preset = resolveTheme(slug);
    applyTheme(preset);
    if (!slug) return;

    (async () => {
      const override = await leerOverride(slug);
      if (cancelado || !override) return;
      const combinado = { ...preset, ...override };
      // BRAND es una constante de módulo que consumen las páginas para armar
      // sus textos. Se actualiza en sitio para que la personalización guardada
      // desde /admin alcance también a los nombres, y no solo a los colores.
      if (applyBrandOverride(override)) {
        usePostApprovalStore.getState().syncFromBrand();
        setBrandVersion((v) => v + 1);
      }
      setTheme(combinado);
      applyTheme(combinado);
    })();

    return () => { cancelado = true; };
  }, [slug]);

  const previewTheme = (t: BankTheme) => {
    if (applyBrandOverride(t)) {
      usePostApprovalStore.getState().syncFromBrand();
      setBrandVersion((v) => v + 1);
    }
    setTheme(t);
    applyTheme(t);
  };

  return (
    <ThemeContext.Provider value={{ theme, previewTheme }}>
      <Fragment key={brandVersion}>{children}</Fragment>
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme debe usarse dentro de ThemeProvider');
  return ctx;
}

export function useBank(): BankTheme {
  return useTheme().theme;
}
