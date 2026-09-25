/**
 * Portal del co-titular.
 *
 * El cónyuge o segundo titular es una causa silenciosa de demora: hoy sus
 * documentos llegan a través del titular, que termina haciendo de mensajero
 * entre su pareja y el banco. Aquí el co-titular entra por su propio enlace,
 * se autentica y aporta lo suyo sin pasar por nadie.
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Fingerprint, Lock, Upload } from 'lucide-react';
import { Kicker, PageTitle, Pill } from '@/components/ui';
import { Reveal } from '@/components/motion';
import { BRAND } from '@/lib/brand';
import { cn } from '@/lib/cn';

const CO_TITULAR = 'María José Contreras Salinas';

interface DocCoTitular {
  id: string;
  label: string;
  detalle: string;
  estado: 'pendiente' | 'recibido' | 'validado';
}

const INICIALES: DocCoTitular[] = [
  { id: 'd1', label: 'Cédula de identidad', detalle: 'Ambos lados, legible', estado: 'validado' },
  { id: 'd2', label: 'Certificado de matrimonio', detalle: 'Lo trajimos del Registro Civil por ti', estado: 'validado' },
  { id: 'd3', label: 'Declaración de renta', detalle: 'Trabajadora independiente · últimos dos años', estado: 'pendiente' },
  { id: 'd4', label: 'Boletas de honorarios', detalle: 'Últimos seis meses', estado: 'pendiente' },
  { id: 'd5', label: 'Certificado de cotizaciones', detalle: 'Lo trajimos de Previred por ti', estado: 'validado' },
];

export default function CoTitularPortal() {
  const navigate = useNavigate();
  const [autenticada, setAutenticada] = useState(false);
  const [verificando, setVerificando] = useState(false);
  const [docs, setDocs] = useState(INICIALES);

  const autenticar = () => {
    setVerificando(true);
    setTimeout(() => {
      setVerificando(false);
      setAutenticada(true);
    }, 1400);
  };

  const subir = (id: string) =>
    setDocs((ds) => ds.map((d) => (d.id === id ? { ...d, estado: 'recibido' } : d)));

  const pendientes = docs.filter((d) => d.estado === 'pendiente').length;
  const listos = docs.filter((d) => d.estado !== 'pendiente').length;

  // ── Pantalla de acceso ──────────────────────────────────
  if (!autenticada) {
    return (
      <div className="max-w-xl mx-auto px-6 py-20 lg:py-28 text-center">
        <Reveal>
          <span className="inline-flex w-14 h-14 rounded-full bg-accent-soft items-center justify-center">
            <Lock size={22} className="text-accent" />
          </span>
          <Kicker className="mt-6">Acceso de co-titular</Kicker>
          <PageTitle className="mt-3">Hola {CO_TITULAR.split(' ')[0]}</PageTitle>
          <p className="text-body-lg text-text-secondary mt-4">
            {BRAND.buyerName.split(' ')[0]} te incorporó como co-titular de la hipoteca en{' '}
            {BRAND.propertyAddress}. Verifica tu identidad para aportar tus documentos
            directamente, sin pasar por él.
          </p>

          <button
            onClick={autenticar}
            disabled={verificando}
            className="mt-8 inline-flex items-center gap-2.5 px-6 py-3 bg-accent text-white text-body font-medium rounded-md disabled:opacity-60"
          >
            <Fingerprint size={18} />
            {verificando ? 'Verificando tu identidad…' : 'Verificar mi identidad'}
          </button>

          <p className="text-caption text-text-muted mt-5">
            Usamos el mismo mecanismo de identidad del banco. No compartimos tu
            información financiera con el titular.
          </p>
        </Reveal>
      </div>
    );
  }

  // ── Portal ──────────────────────────────────────────────
  return (
    <div className="max-w-3xl mx-auto px-6 md:px-10 py-10 lg:py-14 space-y-8">
      <Reveal>
        <div>
          <Kicker>Co-titular · {BRAND.shortName}</Kicker>
          <PageTitle className="mt-3">Tus documentos, {CO_TITULAR.split(' ')[0]}</PageTitle>
          <p className="text-body-lg text-text-secondary mt-3">
            Esto es lo único que necesitamos de ti. Tres de cinco ya los conseguimos
            nosotros en fuentes públicas: solo faltan los que acreditan tus ingresos
            como independiente.
          </p>
        </div>
      </Reveal>

      <Reveal>
        <div className="rounded-xl border border-border-hairline bg-bg-card px-6 py-5 flex flex-wrap items-center justify-between gap-4">
          <div>
            <span className="text-caption uppercase tracking-[0.14em] text-text-muted">
              Operación
            </span>
            <p className="text-body font-medium text-text-primary mt-1">
              {BRAND.caseRef} · {BRAND.propertyAddress}
            </p>
          </div>
          <div className="text-right">
            <span className="text-2xl font-semibold text-text-primary tabular-nums">
              {listos}/{docs.length}
            </span>
            <span className="block text-caption text-text-muted">documentos listos</span>
          </div>
        </div>
      </Reveal>

      <Reveal>
        <section className="rounded-xl border border-border-hairline bg-bg-card divide-y divide-border-hairline overflow-hidden">
          {docs.map((d) => (
            <div key={d.id} className="px-6 py-4 flex flex-wrap items-center justify-between gap-3">
              <div className="min-w-0">
                <span className="text-body-sm font-medium text-text-primary">{d.label}</span>
                <p className="text-caption text-text-muted mt-0.5">{d.detalle}</p>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                {d.estado === 'validado' && <Pill variant="success">Validado</Pill>}
                {d.estado === 'recibido' && <Pill variant="info">En revisión</Pill>}
                {d.estado === 'pendiente' && (
                  <button
                    onClick={() => subir(d.id)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 border border-accent text-accent text-body-sm font-medium rounded-md hover:bg-accent hover:text-white transition-colors"
                  >
                    <Upload size={13} />
                    Subir
                  </button>
                )}
              </div>
            </div>
          ))}
        </section>
      </Reveal>

      <Reveal>
        <div
          className={cn(
            'rounded-xl px-6 py-5 border',
            pendientes === 0
              ? 'border-status-success bg-status-success-bg'
              : 'border-border-hairline bg-bg-card',
          )}
        >
          {pendientes === 0 ? (
            <p className="text-body-sm text-text-primary flex items-center gap-2">
              <Check size={16} className="text-status-success shrink-0" />
              Listo. Ya tenemos todo lo tuyo. Te avisamos cuando la operación avance, sin
              que tengas que preguntarle a {BRAND.buyerName.split(' ')[0]}.
            </p>
          ) : (
            <p className="text-body-sm text-text-secondary">
              Te quedan {pendientes} documento{pendientes === 1 ? '' : 's'}. Puedes subirlos
              desde el teléfono, en el formato que tengas: foto, captura o archivo.
            </p>
          )}
        </div>
      </Reveal>

      <button
        onClick={() => navigate('/cliente/seguimiento')}
        className="text-body-sm text-text-secondary hover:text-text-primary"
      >
        Ver la vista del titular →
      </button>
    </div>
  );
}
