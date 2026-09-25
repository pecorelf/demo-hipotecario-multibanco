/**
 * Línea de producción de un proyecto inmobiliario.
 *
 * En el negocio encadenado los reparos del conservador casi nunca vienen del
 * borrador de una unidad: vienen de la base originaria de escrituración del
 * proyecto. Cuando eso pasa, se detienen todas las unidades a la vez y nadie
 * lo descubre hasta el primer rechazo.
 *
 * Esta vista invierte el orden: la base se valida una vez, al incorporar el
 * proyecto, y esa validación se hereda a cada unidad. Si algo falla, se ve la
 * causa raíz y cuántas unidades arrastra.
 */

import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, Check, ChevronLeft, FileWarning, Layers } from 'lucide-react';
import { IconChip, Kicker, PageTitle, Pill } from '@/components/ui';
import { Reveal, Contador } from '@/components/motion';
import { BRAND } from '@/lib/brand';
import { cn } from '@/lib/cn';

// ─────────────────────────────────────────────────────────────
// Base del proyecto
// ─────────────────────────────────────────────────────────────

interface ItemBase {
  id: string;
  nombre: string;
  detalle: string;
  estado: 'validado' | 'observado' | 'pendiente';
  unidadesAfectadas?: number;
}

const BASE_PROYECTO: ItemBase[] = [
  { id: 'b1', nombre: 'Escritura de compraventa del terreno', detalle: 'Inscrita a fojas 4.217, número 2.980 del año 2023.', estado: 'validado' },
  { id: 'b2', nombre: 'Reglamento de copropiedad', detalle: 'Inscrito y vigente. Define las 40 unidades y sus derechos.', estado: 'validado' },
  { id: 'b3', nombre: 'Recepción municipal definitiva', detalle: 'Resolución 318 de la Dirección de Obras.', estado: 'validado' },
  {
    id: 'b4',
    nombre: 'Alzamiento de hipoteca del crédito constructor',
    detalle: 'La escritura de alzamiento no registra inscripción marginal en el CBR. Mientras no se subsane, toda unidad que se ingrese será rechazada por la misma causa.',
    estado: 'observado',
    unidadesAfectadas: 12,
  },
  { id: 'b5', nombre: 'Certificado de no expropiación', detalle: 'Vigente, emitido hace 22 días.', estado: 'validado' },
  { id: 'b6', nombre: 'Plano de loteo aprobado', detalle: 'Coincide con el reglamento de copropiedad.', estado: 'validado' },
];

// ─────────────────────────────────────────────────────────────
// Unidades
// ─────────────────────────────────────────────────────────────

type EstadoUnidad = 'cursada' | 'en-proceso' | 'detenida' | 'disponible';

interface Unidad {
  id: string;
  piso: number;
  estado: EstadoUnidad;
  etapa: string;
}

const ETAPAS: Record<EstadoUnidad, string[]> = {
  cursada: ['Inscrita en el CBR'],
  'en-proceso': ['Borrador en notaría', 'Estudio de títulos', 'Firma coordinada'],
  detenida: ['Detenida por la base del proyecto'],
  disponible: ['Sin promesa'],
};

/** Distribución estable: la demostración se ve igual en cada ejecución. */
const UNIDADES: Unidad[] = Array.from({ length: 40 }, (_, i) => {
  const piso = Math.floor(i / 4) + 1;
  const n = i % 10;
  let estado: EstadoUnidad = 'disponible';
  if (n < 3) estado = 'cursada';
  else if (n < 6) estado = 'en-proceso';
  else if (n < 9) estado = i % 3 === 0 ? 'detenida' : 'en-proceso';
  return {
    id: `${piso}0${(i % 4) + 1}`,
    piso,
    estado,
    etapa: ETAPAS[estado][i % ETAPAS[estado].length],
  };
});

const COLOR: Record<EstadoUnidad, string> = {
  cursada: 'bg-status-success text-white border-status-success',
  'en-proceso': 'bg-accent text-white border-accent',
  detenida: 'bg-status-error text-white border-status-error',
  disponible: 'bg-bg-sunken text-text-muted border-border-hairline',
};

const ETIQUETA: Record<EstadoUnidad, string> = {
  cursada: 'Cursada',
  'en-proceso': 'En proceso',
  detenida: 'Detenida',
  disponible: 'Disponible',
};

// ─────────────────────────────────────────────────────────────

export default function LineaProduccionProyecto() {
  const navigate = useNavigate();
  const [subsanada, setSubsanada] = useState(false);
  const [seleccion, setSeleccion] = useState<Unidad | null>(null);

  const unidades = useMemo(
    () =>
      UNIDADES.map((u) =>
        subsanada && u.estado === 'detenida'
          ? { ...u, estado: 'en-proceso' as EstadoUnidad, etapa: 'Reanudada · estudio de títulos' }
          : u,
      ),
    [subsanada],
  );

  const cuenta = (e: EstadoUnidad) => unidades.filter((u) => u.estado === e).length;
  const observaciones = BASE_PROYECTO.filter(
    (b) => b.estado === 'observado' && !subsanada,
  );

  return (
    <div className="max-w-shell mx-auto px-6 md:px-10 lg:px-16 py-10 lg:py-14 space-y-10">
      <div>
        <button
          onClick={() => navigate('/inmobiliaria/proyectos')}
          className="inline-flex items-center gap-1.5 text-body-sm text-text-secondary hover:text-text-primary"
        >
          <ChevronLeft size={14} />
          Volver a proyectos
        </button>

        <Kicker className="mt-6">Negocio encadenado · {BRAND.inmobiliariaName}</Kicker>
        <PageTitle className="mt-3">Edificio Parque Los Leones</PageTitle>
        <p className="text-body-lg text-text-secondary mt-3 max-w-measure">
          Cuarenta unidades que comparten una misma base de escrituración. Validamos la
          base una vez y el resultado se hereda a cada unidad, en lugar de descubrir el
          problema unidad por unidad cuando el conservador rechaza la primera.
        </p>
      </div>

      {/* ── Indicadores ───────────────────────────────────── */}
      <Reveal>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-border-hairline rounded-xl overflow-hidden border border-border-hairline">
          {(['cursada', 'en-proceso', 'detenida', 'disponible'] as EstadoUnidad[]).map((e) => (
            <div key={e} className="bg-bg-card px-5 py-5">
              <Contador
                valor={cuenta(e)}
                className={cn(
                  'block text-3xl font-semibold leading-none',
                  e === 'detenida' && cuenta(e) > 0 ? 'text-status-error' : 'text-text-primary',
                )}
              />
              <span className="text-caption text-text-muted mt-1.5 block">
                {ETIQUETA[e]}
              </span>
            </div>
          ))}
        </div>
      </Reveal>

      {/* ── Alerta de causa raíz ──────────────────────────── */}
      {observaciones.length > 0 && (
        <Reveal>
          <div className="rounded-xl border border-status-error bg-status-error-bg px-6 py-5">
            <div className="flex items-start gap-3">
              <FileWarning size={18} className="text-status-error shrink-0 mt-0.5" />
              <div className="min-w-0 flex-1">
                <h2 className="text-body font-semibold text-text-primary">
                  Una sola causa detiene {observaciones[0].unidadesAfectadas} unidades
                </h2>
                <p className="text-body-sm text-text-secondary mt-1.5 max-w-measure">
                  {observaciones[0].detalle}
                </p>
                <p className="text-caption text-text-muted mt-2">
                  Detectado al validar la base, antes de ingresar la primera unidad al
                  conservador. Sin esta validación, el problema aparecería con el primer
                  rechazo y ya habría once unidades más en camino.
                </p>
                <button
                  onClick={() => setSubsanada(true)}
                  className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-text-primary text-text-inverse text-body-sm font-medium rounded-md hover:bg-accent transition-colors"
                >
                  Registrar alzamiento subsanado
                </button>
              </div>
            </div>
          </div>
        </Reveal>
      )}

      {subsanada && (
        <Reveal>
          <div className="rounded-xl border border-status-success bg-status-success-bg px-6 py-4 flex items-center gap-3">
            <Check size={16} className="text-status-success shrink-0" />
            <p className="text-body-sm text-text-primary">
              Base corregida. Las doce unidades detenidas reanudaron su tramitación
              automáticamente, sin rehacer el estudio de títulos de cada una.
            </p>
          </div>
        </Reveal>
      )}

      {/* ── Base del proyecto ─────────────────────────────── */}
      <Reveal>
        <section className="rounded-xl border border-border-hairline bg-bg-card shadow-soft">
          <header className="px-6 py-4 border-b border-border-hairline flex items-center gap-2">
            <IconChip tamano="sm"><Layers size={14} /></IconChip>
            <span className="text-body-sm font-medium text-text-primary">
              Base originaria de escrituración
            </span>
            <span className="ml-auto text-caption text-text-muted">
              Se valida una vez y se hereda a las 40 unidades
            </span>
          </header>

          <div className="divide-y divide-border-hairline">
            {BASE_PROYECTO.map((b) => {
              const observado = b.estado === 'observado' && !subsanada;
              return (
                <div key={b.id} className="px-6 py-4 flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <span className="text-body-sm font-medium text-text-primary">
                      {b.nombre}
                    </span>
                    <p className="text-caption text-text-muted mt-1 max-w-measure">
                      {b.detalle}
                    </p>
                  </div>
                  <span className="shrink-0">
                    {observado ? (
                      <Pill variant="error">Observado</Pill>
                    ) : (
                      <Pill variant="success">Validado</Pill>
                    )}
                  </span>
                </div>
              );
            })}
          </div>
        </section>
      </Reveal>

      {/* ── Mapa de unidades ──────────────────────────────── */}
      <Reveal>
        <section className="rounded-xl border border-border-hairline bg-bg-card shadow-soft px-6 py-6">
          <div className="flex flex-wrap items-baseline justify-between gap-4 mb-5">
            <div>
              <Kicker tone="muted">Unidades del proyecto</Kicker>
              <p className="text-body-sm text-text-secondary mt-1.5">
                Cada cuadro es un departamento. Haz clic para ver su estado.
              </p>
            </div>
            <div className="flex flex-wrap gap-4">
              {(['cursada', 'en-proceso', 'detenida', 'disponible'] as EstadoUnidad[]).map((e) => (
                <span key={e} className="flex items-center gap-2">
                  <span className={cn('w-3 h-3 rounded-sm border', COLOR[e])} />
                  <span className="text-caption text-text-secondary">{ETIQUETA[e]}</span>
                </span>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-4 sm:grid-cols-8 lg:grid-cols-10 gap-2">
            {unidades.map((u, i) => (
              <button
                key={u.id}
                onClick={() => setSeleccion(u)}
                title={`Unidad ${u.id} · ${ETIQUETA[u.estado]}`}
                className={cn(
                  'aspect-square rounded-md border text-caption font-medium transition-transform hover:scale-105',
                  COLOR[u.estado],
                  seleccion?.id === u.id && 'ring-2 ring-offset-2 ring-text-primary',
                )}
                style={{ transitionDelay: `${i * 8}ms` }}
              >
                {u.id}
              </button>
            ))}
          </div>

          {seleccion && (
            <div className="mt-5 pt-5 border-t border-border-hairline flex flex-wrap items-center gap-x-6 gap-y-2">
              <span className="text-body font-medium text-text-primary">
                Unidad {seleccion.id}
              </span>
              <span className="text-body-sm text-text-secondary">Piso {seleccion.piso}</span>
              <span className="text-body-sm text-text-secondary">{seleccion.etapa}</span>
              {seleccion.estado === 'detenida' && (
                <span className="inline-flex items-center gap-1.5 text-body-sm text-status-error">
                  <AlertTriangle size={14} />
                  Detenida por la base, no por su propio expediente
                </span>
              )}
            </div>
          )}
        </section>
      </Reveal>
    </div>
  );
}
