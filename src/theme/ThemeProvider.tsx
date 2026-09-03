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
  document.title = `Tus Nuevas Llaves - ${t.shortName}`;
}

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
