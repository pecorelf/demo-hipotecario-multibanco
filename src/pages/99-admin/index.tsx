/**
 * Administración de identidad por institución.
 *
 * Ruta: /admin — requiere el token de administración.
 * No expone información de ninguna operación.
 *
 * Los cambios se aplican en vivo sobre esta misma pantalla, de modo que el
 * ajuste cromático se hace mirando el resultado.
 */

import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  BANK_THEMES, BANK_SLUGS, NEUTRAL_THEME, resolveTheme, applyTheme,
  leerOverride, guardarOverride, borrarOverride, type BankTheme,
} from '@/theme';

const TEXTOS: Array<{ key: keyof BankTheme; label: string; hint?: string }> = [
  { key: 'name', label: 'Nombre de la institución' },
  { key: 'shortName', label: 'Nombre corto', hint: 'Para espacios reducidos' },
  { key: 'legalName', label: 'Razón social' },
  { key: 'assistantName', label: 'Nombre del asistente' },
  { key: 'buyerName', label: 'Cliente del caso' },
  { key: 'sellerName', label: 'Vendedor o vendedora' },
  { key: 'inmobiliariaName', label: 'Inmobiliaria' },
  { key: 'ejecutivoName', label: 'Ejecutivo o ejecutiva' },
  { key: 'notariaName', label: 'Notaría' },
  { key: 'caseRef', label: 'Referencia del caso' },
  { key: 'propertyAddress', label: 'Dirección del inmueble' },
  { key: 'propertyComuna', label: 'Comuna' },
  { key: 'propertyBuilding', label: 'Edificio o proyecto' },
];

const COLORES: Array<{ key: keyof BankTheme; label: string; hint: string }> = [
  { key: 'accent', label: 'Color de acento', hint: 'Botones, énfasis y elementos activos' },
  { key: 'accentMuted', label: 'Acento en hover', hint: 'Variante más oscura' },
  { key: 'accentSoft', label: 'Fondo tenue', hint: 'Tarjetas destacadas' },
  { key: 'onAccent', label: 'Texto sobre acento', hint: 'Normalmente blanco' },
];

const FUENTES = [
  { value: "'Inter', sans-serif", label: 'Inter' },
  { value: "'Poppins', sans-serif", label: 'Poppins' },
  { value: "'Nunito Sans', sans-serif", label: 'Nunito Sans' },
  { value: "'Montserrat', sans-serif", label: 'Montserrat' },
  { value: "'Source Sans 3', sans-serif", label: 'Source Sans' },
  { value: "'Work Sans', sans-serif", label: 'Work Sans' },
];

export default function Admin() {
  const [token, setToken] = useState('');
  const [autorizado, setAutorizado] = useState(false);
  const [slug, setSlug] = useState<string>(BANK_SLUGS[0]);
  const [draft, setDraft] = useState<BankTheme>(NEUTRAL_THEME);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState<string | null>(null);

  useEffect(() => {
    if (!autorizado) return;
    let cancelado = false;
    const preset = resolveTheme(slug);
    setDraft(preset);
    applyTheme(preset);
    setMensaje(null);
    (async () => {
      const ov = await leerOverride(slug);
      if (cancelado || !ov) return;
      const c = { ...preset, ...ov };
      setDraft(c);
      applyTheme(c);
    })();
    return () => { cancelado = true; };
  }, [slug, autorizado]);

  function actualizar<K extends keyof BankTheme>(key: K, value: BankTheme[K]) {
    const next = { ...draft, [key]: value };
    setDraft(next);
    applyTheme(next);
  }

  async function guardar() {
    setGuardando(true);
    const r = await guardarOverride(slug, draft, token);
    setGuardando(false);
    setMensaje(
      !r.ok ? 'No se pudo guardar. La demostración seguirá usando el preset.'
      : r.destino === 'servidor' ? 'Identidad guardada. Disponible desde cualquier dispositivo.'
      : 'Identidad guardada en este navegador. Configurar el almacenamiento para compartirla.',
    );
  }

  async function restablecer() {
    const preset = resolveTheme(slug);
    setDraft(preset);
    applyTheme(preset);
    await borrarOverride(slug, token);
    setMensaje('Se restableció el preset original.');
  }

  const url = useMemo(
    () => `${typeof window !== 'undefined' ? window.location.origin : ''}/?t=${slug}`,
    [slug],
  );

  if (!autorizado) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <div className="w-full max-w-sm border border-border-hairline bg-bg-card p-8">
          <div className="text-caption uppercase tracking-[0.14em] text-text-muted">
            Administración
          </div>
          <h1 className="text-h2 font-semibold text-text-primary mt-2">
            Identidad de la demostración
          </h1>
          <p className="text-body-sm text-text-secondary mt-3 leading-relaxed">
            Configura la identidad visual de cada institución. No contiene
            información de operaciones.
          </p>
          <input
            type="password" value={token}
            onChange={(e) => setToken(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && token) setAutorizado(true); }}
            placeholder="Token de administración"
            className="w-full mt-6 p-2.5 text-body-sm border border-border-hairline bg-bg-page focus:outline-none focus:border-accent"
          />
          <button
            onClick={() => setAutorizado(true)} disabled={!token}
            className="w-full mt-3 px-4 py-2.5 bg-accent text-white text-body-sm font-medium hover:bg-accent-muted disabled:opacity-40 transition-colors"
          >
            Entrar
          </button>
          <Link to="/" className="block mt-4 text-caption text-text-muted hover:text-text-primary">
            Volver al inicio
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-shell mx-auto px-6 md:px-10 py-10">
      <div className="flex items-start justify-between gap-6 flex-wrap">
        <div>
          <div className="text-caption uppercase tracking-[0.14em] text-accent font-medium">
            Administración
          </div>
          <h1 className="text-h1 font-semibold text-text-primary mt-2">
            Identidad de la demostración
          </h1>
          <p className="text-body text-text-secondary mt-2 max-w-2xl leading-relaxed">
            Los cambios se ven en vivo sobre esta pantalla. Se guardan al confirmar
            y afectan solo a la institución seleccionada.
          </p>
        </div>
        <a
          href={url} target="_blank" rel="noopener noreferrer"
          className="px-4 py-2 border border-border-hairline text-body-sm hover:bg-bg-sunken transition-colors whitespace-nowrap"
        >
          Abrir demostración
        </a>
      </div>

      <div className="mt-8 border border-border-hairline bg-bg-card p-5">
        <div className="text-caption uppercase tracking-[0.12em] text-text-muted mb-3">
          Institución
        </div>
        <div className="flex flex-wrap gap-2">
          {BANK_SLUGS.map((s) => (
            <button
              key={s} onClick={() => setSlug(s)}
              className={slug === s
                ? 'px-3.5 py-2 text-body-sm border border-accent bg-accent text-white font-medium'
                : 'px-3.5 py-2 text-body-sm border border-border-hairline hover:bg-bg-page transition-colors'}
            >
              {BANK_THEMES[s].shortName}
            </button>
          ))}
        </div>
        <div className="mt-4 text-caption text-text-muted">
          Enlace: <span className="text-text-primary font-medium">{url}</span>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="border border-border-hairline bg-bg-card p-5">
          <h2 className="text-h3 font-semibold text-text-primary">Identidad visual</h2>
          <p className="text-caption text-text-muted mt-1">
            Verificar contra el manual de marca antes de presentar.
          </p>
          <div className="mt-5 space-y-4">
            {COLORES.map((c) => (
              <div key={String(c.key)}>
                <label className="text-body-sm font-medium text-text-primary">{c.label}</label>
                <p className="text-caption text-text-muted">{c.hint}</p>
                <div className="flex items-center gap-2 mt-1.5">
                  <input
                    type="color" value={String(draft[c.key])}
                    onChange={(e) => actualizar(c.key, e.target.value as never)}
                    className="w-11 h-9 border border-border-hairline cursor-pointer bg-transparent"
                  />
                  <input
                    type="text" value={String(draft[c.key])}
                    onChange={(e) => actualizar(c.key, e.target.value as never)}
                    className="flex-1 p-2 text-body-sm border border-border-hairline bg-bg-page focus:outline-none focus:border-accent font-mono"
                  />
                </div>
              </div>
            ))}
            <div>
              <label className="text-body-sm font-medium text-text-primary">Tipografía</label>
              <p className="text-caption text-text-muted">
                Sustituto tipográfico. Las familias corporativas son propietarias.
              </p>
              <select
                value={draft.fontFamily}
                onChange={(e) => actualizar('fontFamily', e.target.value)}
                className="w-full mt-1.5 p-2 text-body-sm border border-border-hairline bg-bg-page focus:outline-none focus:border-accent"
              >
                {FUENTES.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-body-sm font-medium text-text-primary">Logotipo</label>
              <p className="text-caption text-text-muted">
                PNG o SVG con fondo transparente. Si se omite, se usa el nombre.
              </p>
              <input
                type="file" accept="image/png,image/jpeg,image/svg+xml,image/webp"
                onChange={async (e) => {
                  const f = e.target.files?.[0];
                  if (!f) return;
                  const dataUrl = await prepararLogo(f);
                  actualizar('logoUrl', dataUrl);
                }}
                className="w-full mt-1.5 text-body-sm"
              />
              {draft.logoUrl && (
                <div className="mt-3 p-3 border border-border-hairline bg-bg-page flex items-center justify-between gap-3">
                  <img src={draft.logoUrl} alt="" className="h-8 object-contain" />
                  <button onClick={() => actualizar('logoUrl', '')} className="text-caption text-accent hover:underline">
                    Quitar
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="border border-border-hairline bg-bg-card p-5">
          <h2 className="text-h3 font-semibold text-text-primary">Nombres del caso</h2>
          <p className="text-caption text-text-muted mt-1">
            Personas y datos del expediente que se muestra.
          </p>
          <div className="mt-5 space-y-3.5">
            {TEXTOS.map((c) => (
              <div key={String(c.key)}>
                <label className="text-body-sm font-medium text-text-primary">{c.label}</label>
                {c.hint && <p className="text-caption text-text-muted">{c.hint}</p>}
                <input
                  type="text" value={String(draft[c.key])}
                  onChange={(e) => actualizar(c.key, e.target.value as never)}
                  className="w-full mt-1 p-2 text-body-sm border border-border-hairline bg-bg-page focus:outline-none focus:border-accent"
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-6 border border-border-hairline bg-bg-card p-5">
        <h2 className="text-h3 font-semibold text-text-primary">Vista previa</h2>
        <div className="mt-4 flex items-center gap-3 flex-wrap">
          <button className="px-4 py-2 bg-accent text-white text-body-sm font-medium">
            Acción principal
          </button>
          <button className="px-4 py-2 border border-border-hairline text-body-sm">
            Acción secundaria
          </button>
          <span className="px-2.5 py-1 text-caption font-medium"
            style={{ background: draft.accentSoft, color: draft.accentMuted }}>
            Estado destacado
          </span>
          <span className="text-body-sm" style={{ fontFamily: draft.fontFamily }}>
            {draft.name} · {draft.assistantName}
          </span>
        </div>
      </div>

      <div className="mt-6 flex items-center gap-3 flex-wrap">
        <button onClick={guardar} disabled={guardando}
          className="px-5 py-2.5 bg-accent text-white text-body-sm font-medium hover:bg-accent-muted disabled:opacity-40 transition-colors">
          {guardando ? 'Guardando…' : 'Guardar identidad'}
        </button>
        <button onClick={restablecer}
          className="px-5 py-2.5 border border-border-hairline text-body-sm hover:bg-bg-sunken transition-colors">
          Restablecer preset
        </button>
        <Link to="/" className="text-body-sm text-text-secondary hover:text-text-primary">
          Volver al inicio
        </Link>
        {mensaje && <span className="text-body-sm text-text-secondary">{mensaje}</span>}
      </div>
    </div>
  );
}

/**
 * Prepara un logotipo para su almacenamiento.
 *
 * Los SVG se conservan tal cual: son vectoriales y livianos. Los mapas de bits
 * se reescalan a una altura de 80 píxeles y se convierten a WebP, de modo que
 * un archivo de varios cientos de kilobytes quede en unas pocas decenas. Sin
 * esta reducción, un logotipo en alta resolución puede superar el límite de
 * tamaño por registro del almacenamiento.
 */
async function prepararLogo(file: File): Promise<string> {
  const leerComoDataUrl = () =>
    new Promise<string>((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(String(r.result));
      r.onerror = () => reject(new Error('No se pudo leer el archivo'));
      r.readAsDataURL(file);
    });

  // Los vectoriales no se reescalan
  if (file.type === 'image/svg+xml') return leerComoDataUrl();

  const original = await leerComoDataUrl();

  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const i = new Image();
      i.onload = () => resolve(i);
      i.onerror = () => reject(new Error('No se pudo interpretar la imagen'));
      i.src = original;
    });

    const ALTURA = 80;
    const escala = ALTURA / img.height;
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(img.width * escala);
    canvas.height = ALTURA;

    const ctx = canvas.getContext('2d');
    if (!ctx) return original;
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    // WebP conserva la transparencia y pesa considerablemente menos
    const reducido = canvas.toDataURL('image/webp', 0.92);
    return reducido.length < original.length ? reducido : original;
  } catch {
    // Ante cualquier fallo se conserva el archivo original
    return original;
  }
}
