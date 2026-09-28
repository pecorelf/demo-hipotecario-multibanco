/**
 * Nuestro entendimiento del desafío.
 *
 * Funciona como presentación: se avanza hacia el lado con las flechas del
 * teclado, con los controles de abajo o deslizando en pantalla táctil. Cada
 * lámina ocupa el alto disponible y, si su contenido no cabe, se desplaza
 * dentro de sí misma en lugar de romper la composición.
 *
 * Todo se adapta a la institución configurada en /admin.
 */

import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  Check,
  Cpu,
  Workflow,
  Building2,
  ChevronLeft,
  ChevronRight,
  GitBranch,
  Inbox,
  Layers,
  Mail,
  ShieldCheck,
  Users,
} from 'lucide-react';
import { IconChip, Kicker, Pill } from '@/components/ui';
import { Contador } from '@/components/motion';
import { BRAND } from '@/lib/brand';
import { cn } from '@/lib/cn';
import {
  ACTORES,
  BACK,
  COSTOS_CORREO,
  ETAPAS_TIEMPO,
  ETAPAS_VISIBLES,
  FRICCIONES,
  FRONT,
  FUENTE,
  PALANCAS,
  PASOS_OCULTOS,
  PRINCIPIOS,
  TAREAS_EJECUTIVO,
  STACK,
  TECNOLOGIA,
  TIPOLOGIAS,
  TRANSVERSAL,
  VISION,
} from './contenido';

interface Lamina {
  id: string;
  titulo: string;
  fondo?: 'claro' | 'oscuro';
  contenido: ReactNode;
}

function Encabezado({
  kicker,
  titulo,
  bajada,
  icono,
  oscuro = false,
}: {
  kicker: string;
  titulo: string;
  bajada?: string;
  icono?: ReactNode;
  oscuro?: boolean;
}) {
  return (
    <div className="flex items-start gap-4">
      {icono && <IconChip tamano="lg">{icono}</IconChip>}
      <div className="min-w-0">
        <Kicker tone={oscuro ? 'muted' : 'accent'}>{kicker}</Kicker>
        <h2 className={cn('text-h1 mt-2.5 max-w-4xl', oscuro ? 'text-text-inverse' : 'text-text-primary')}>
          {titulo}
        </h2>
        {bajada && (
          <p className={cn('text-body-lg mt-3 max-w-measure', oscuro ? 'text-white/75' : 'text-text-secondary')}>
            {bajada}
          </p>
        )}
      </div>
    </div>
  );
}

export default function EntendimientoDesafio() {
  const navigate = useNavigate();
  const maxCarga = Math.max(...TAREAS_EJECUTIVO.map((t) => t.carga));

  const LAMINAS: Lamina[] = [
    {
      id: 'portada',
      titulo: 'Portada',
      contenido: (
        <div className="h-full flex flex-col justify-center">
          <div className="flex flex-col gap-2 mb-10" aria-hidden>
            <span className="block h-1.5 w-36 bg-accent rounded-full" />
            <span className="block h-1.5 w-56 bg-accent rounded-full" />
            <span className="block h-1.5 w-24 bg-accent rounded-full" />
          </div>
          <Kicker>Deloitte Digital · {BRAND.shortName}</Kicker>
          <h1 className="text-display-lg lg:text-display-xl text-text-primary mt-4 max-w-4xl">
            Cómo repensamos el flujo hipotecario
          </h1>
          <p className="text-body-lg text-text-secondary mt-5 max-w-measure">
            Antes de mostrar la plataforma, nuestra lectura del problema. El proceso
            hipotecario es el producto más comoditizado de la banca y el que más vincula al
            cliente con su banco. La tasa se iguala en una semana. El proceso no.
          </p>
        </div>
      ),
    },
    {
      id: 'partida',
      titulo: 'El punto de partida',
      contenido: (
        <div className="h-full flex flex-col justify-center">
          <Kicker>El punto de partida</Kicker>
          <div className="flex flex-wrap items-end gap-x-6 gap-y-2 mt-3">
            <Contador valor={120} className="text-stat-lg lg:text-stat-xl text-accent" />
            <span className="text-h2 text-text-primary font-normal pb-2">
              días en promedio toma hoy una operación
            </span>
          </div>
          <p className="text-body-lg text-text-secondary mt-4 max-w-measure">
            Buena parte de ese tiempo no depende del banco: conservador, notaría y
            desembolso tienen sus propios ritmos. Un tercio sí está bajo su control, y ahí
            se concentra casi todo lo que se puede recuperar.
          </p>
          <div className="mt-10">
            <div className="flex gap-1.5 items-stretch">
              {ETAPAS_TIEMPO.map((e) => (
                <div
                  key={e.nombre}
                  className={cn(
                    'h-20 rounded-lg flex items-center px-5',
                    e.tono === 'suave' && 'bg-bg-sunken',
                    e.tono === 'foco' && 'bg-accent text-text-inverse',
                    e.tono === 'oscuro' && 'bg-text-primary text-text-inverse',
                  )}
                  style={{ flex: e.peso }}
                >
                  <span className="text-h3 font-semibold">{e.rango}</span>
                </div>
              ))}
            </div>
            <div className="flex gap-1.5 mt-3">
              {ETAPAS_TIEMPO.map((e) => (
                <div key={e.nombre} style={{ flex: e.peso }} className="px-1">
                  <div className={cn('text-body-sm font-medium', e.tono === 'foco' ? 'text-accent' : 'text-text-primary')}>
                    {e.nombre}
                  </div>
                  <div className="text-caption text-text-muted">{e.detalle}</div>
                </div>
              ))}
            </div>
            <p className="text-caption text-text-muted mt-5">
              Cifras aproximadas, de levantamientos del proceso hipotecario en el mercado
              chileno sobre propiedad nueva con subsidio.
            </p>
          </div>
        </div>
      ),
    },
    {
      id: 'fricciones',
      titulo: 'Las fricciones',
      contenido: (
        <div className="h-full flex flex-col justify-center">
          <Encabezado
            kicker="Lo que rodea a una hipoteca"
            titulo="Nueve fricciones que el cliente vive y el banco no siempre ve"
          />
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-x-8 gap-y-7 mt-10">
            {FRICCIONES.map((d) => (
              <div key={d.titulo} className="border-t-2 border-accent pt-4">
                <IconChip tamano="sm">{d.icono}</IconChip>
                <h3 className="text-body font-semibold text-text-primary mt-3">{d.titulo}</h3>
                <p className="text-body-sm text-text-secondary mt-2">{d.detalle}</p>
              </div>
            ))}
          </div>
          <p className="text-caption text-text-muted mt-8 max-w-measure">{FUENTE}</p>
        </div>
      ),
    },
    {
      id: 'etapas',
      titulo: 'Lo que el cliente ve',
      contenido: (
        <div className="h-full flex flex-col justify-center">
          <Encabezado
            kicker="Lo que el cliente ve"
            titulo="Una barra de avance que esconde el trabajo real"
            bajada="El cliente sigue su operación por las etapas principales. Dentro de cada una hay entre cinco y quince pasos que no aparecen en ninguna pantalla, y que son justamente donde se pierde el tiempo."
            icono={<GitBranch size={20} />}
          />
          <div className="mt-10">
            <div className="flex flex-wrap items-center gap-2">
              {ETAPAS_VISIBLES.map((e, i) => (
                <div key={e} className="flex items-center gap-2">
                  <span
                    className={cn(
                      'px-4 py-2.5 rounded-lg text-body-sm font-medium border',
                      i < 2
                        ? 'bg-accent text-text-inverse border-accent'
                        : 'bg-bg-card text-text-secondary border-border-hairline',
                    )}
                  >
                    {e}
                  </span>
                  {i < ETAPAS_VISIBLES.length - 1 && <ChevronRight size={14} className="text-text-muted" />}
                </div>
              ))}
            </div>
            <p className="text-caption text-text-muted mt-4">
              Etapas ilustrativas. Cada banco tiene sus propios nombres y su propia
              numeración; lo que se repite es la distancia entre lo que se muestra y lo que
              ocurre.
            </p>
            <div className="mt-8 rounded-xl border border-border-hairline bg-bg-card p-6 max-w-3xl">
              <span className="text-caption uppercase tracking-[0.14em] text-text-muted">
                Dentro de “Antecedentes”, por ejemplo
              </span>
              <div className="mt-3 flex flex-wrap gap-2">
                {PASOS_OCULTOS.map((p) => (
                  <span key={p} className="px-3 py-1.5 rounded-full bg-bg-sunken text-caption text-text-secondary">
                    {p}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'cuello',
      titulo: 'El cuello de botella',
      fondo: 'oscuro',
      contenido: (
        <div className="h-full flex flex-col justify-center">
          <Encabezado
            kicker="El cuello de botella"
            titulo="Todo pasa por el ejecutivo de cuentas"
            bajada="Es el único punto por donde circula la información entre el cliente, el vendedor, la inmobiliaria, operaciones y la notaría. No hay otro lugar donde dejarla. El resultado es que la persona contratada para vender dedica la mayor parte de su tiempo a coordinar."
            icono={<Users size={20} />}
            oscuro
          />
          <div className="mt-10 max-w-3xl space-y-3.5">
            {TAREAS_EJECUTIVO.map((t) => (
              <div key={t.tarea} className="grid grid-cols-[1fr_auto] gap-4 items-center">
                <div>
                  {/* Sobre fondo negro el color de marca puede ser ilegible
                      —un azul institucional oscuro desaparece—, así que el
                      resalte se hace con blanco y peso tipográfico. */}
                  <span className={cn('text-body-sm block mb-1.5', t.tarea === 'Vender' ? 'text-white font-semibold' : 'text-white/75')}>
                    {t.tarea}
                  </span>
                  <div className="h-2.5 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className={cn('h-full rounded-full', t.tarea === 'Vender' ? 'bg-white' : 'bg-white/35')}
                      style={{ width: `${(t.carga / maxCarga) * 100}%` }}
                    />
                  </div>
                </div>
                <span className={cn('text-body-sm tabular-nums w-12 text-right', t.tarea === 'Vender' ? 'text-white font-semibold' : 'text-white/60')}>
                  {t.carga}%
                </span>
              </div>
            ))}
          </div>
          <p className="text-caption text-white/55 mt-5 max-w-measure">
            Distribución referencial del tiempo de un ejecutivo hipotecario. Vender aparece
            último en la lista. {FUENTE}
          </p>
        </div>
      ),
    },
    {
      id: 'tipologias',
      titulo: 'Las tipologías',
      contenido: (
        <div className="h-full flex flex-col justify-center">
          <Encabezado
            kicker="La variabilidad real"
            titulo="Más de doce tipologías, el mismo camino"
            bajada="El proceso está diseñado como si todas las operaciones fueran iguales. Cada tipología exige documentos distintos, involucra actores distintos y tiene puntos de falla distintos. Cuando el camino es el mismo para todas, el caso raro se resuelve por correo y criterio personal."
            icono={<Layers size={20} />}
          />
          <div className="mt-10 grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-10">
            <div className="flex flex-wrap gap-2 content-start">
              {TIPOLOGIAS.map((t) => (
                <span key={t} className="inline-flex items-center px-3.5 py-2 rounded-full border border-border-hairline bg-bg-card text-body-sm text-text-secondary">
                  {t}
                </span>
              ))}
              <span className="inline-flex items-center px-3.5 py-2 rounded-full bg-accent-soft text-accent text-body-sm font-medium">
                y las combinaciones entre ellas
              </span>
            </div>

            <div className="rounded-xl border border-border-hairline bg-bg-card p-6">
              <span className="text-caption uppercase tracking-[0.14em] text-text-muted">
                Qué cambia de una tipología a otra
              </span>
              <div className="mt-4 space-y-3.5">
                {[
                  { q: 'Los documentos exigidos', e: 'Una sucesión pide posesión efectiva; un independiente, dos años de renta.' },
                  { q: 'Los actores que intervienen', e: 'En vivienda nueva entra la inmobiliaria; en usada, el vendedor particular.' },
                  { q: 'El orden de las validaciones', e: 'Con proyecto financiado, el título del proyecto ya está estudiado.' },
                  { q: 'Los puntos de falla', e: 'La subrogación falla en el alzamiento; la sucesión, en la inscripción.' },
                ].map((x) => (
                  <div key={x.q} className="flex gap-3">
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-accent shrink-0" />
                    <div className="min-w-0">
                      <span className="text-body-sm font-medium text-text-primary">{x.q}</span>
                      <p className="text-caption text-text-muted mt-0.5">{x.e}</p>
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-caption text-text-secondary mt-5 pt-4 border-t border-border-hairline">
                Con un solo recorrido, la diferencia la absorbe una persona con su criterio.
              </p>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'correo',
      titulo: 'El correo',
      contenido: (
        <div className="h-full flex flex-col justify-center">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <Encabezado
              kicker="El vehículo de la información"
              titulo="El proceso corre sobre correo electrónico"
              bajada="Los documentos, los reparos, las aclaraciones y las coordinaciones viajan por correo. Funciona, y por eso no se cuestiona. El costo aparece después."
              icono={<Mail size={20} />}
            />
            <div>
              <span className="text-caption uppercase tracking-[0.14em] text-text-muted">
                El costo que no se ve
              </span>
              <div className="mt-4 space-y-3.5">
                {COSTOS_CORREO.map((t) => (
                  <div key={t} className="flex gap-3 items-start">
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-status-warning shrink-0" />
                    <p className="text-body-sm text-text-secondary">{t}</p>
                  </div>
                ))}
              </div>

              <div className="mt-7 rounded-xl bg-accent-soft p-5">
                <span className="text-caption uppercase tracking-[0.14em] text-accent">
                  Lo que reemplaza al correo
                </span>
                <div className="mt-3 space-y-2.5">
                  {[
                    'Una operación con estado propio, que cualquiera consulta sin preguntar.',
                    'Cada documento asociado a la operación, no a un mensaje.',
                    'Cada reparo con fecha de emisión, responsable y reloj corriendo.',
                    'El mismo hecho contado distinto a cada actor, en su lenguaje.',
                  ].map((t) => (
                    <div key={t} className="flex gap-3 items-start">
                      <Check size={14} className="text-accent mt-0.5 shrink-0" />
                      <p className="text-body-sm text-text-primary">{t}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'actores',
      titulo: 'Los seis actores',
      contenido: (
        <div className="h-full flex flex-col justify-center">
          <Encabezado
            kicker="Cómo lo haremos"
            titulo="Rediseñamos el proceso para los siete actores que intervienen"
            icono={<Users size={20} />}
          />
          <div className="mt-10 grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-10 items-center">
            <div className="hidden lg:flex justify-center">
              <div className="w-44 h-44 rounded-full bg-text-primary text-text-inverse flex items-center justify-center text-center px-6">
                <span className="text-body font-medium leading-snug">
                  Una operación,
                  <br />
                  siete recorridos
                </span>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-5">
              {ACTORES.map((a) => (
                <div key={a.nombre} className="flex gap-3">
                  <span className={cn('mt-1.5 w-2.5 h-2.5 rounded-sm shrink-0', a.prioritario ? 'bg-accent' : 'bg-border-strong')} />
                  <div className="min-w-0">
                    <span className={cn('text-body font-semibold', a.prioritario ? 'text-text-primary' : 'text-text-secondary')}>
                      {a.nombre}
                    </span>
                    {'nuevo' in a && a.nuevo && (
                      <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full bg-accent-soft text-accent text-caption font-medium align-middle">
                        Actor nuevo
                      </span>
                    )}
                    <p className="text-body-sm text-text-secondary mt-0.5">{a.necesidad}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <p className="text-body-sm text-text-secondary mt-8 pl-4 border-l-2 border-accent max-w-measure">
            Hoy el proceso está diseñado desde la perspectiva del banco, y el co-titular
            ni siquiera existe como usuario: participa en el proceso a través del titular. La
            primera etapa del programa se dedica a rediseñar el viaje de cada uno de estos
            actores.
          </p>
        </div>
      ),
    },
    {
      id: 'principios',
      titulo: 'Los seis principios',
      fondo: 'oscuro',
      contenido: (
        <div className="h-full flex flex-col justify-center">
          <Encabezado
            kicker="Cómo lo haremos"
            titulo="Rediseñamos el proceso hipotecario sobre seis principios"
            bajada="No son funcionalidades. Son las definiciones contra las que se evalúa cada decisión de diseño."
            oscuro
          />
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-x-10 gap-y-7 mt-10">
            {PRINCIPIOS.map((p) => (
              <div key={p.n} className="border-t border-white/35 pt-4">
                <span className="text-body-sm font-semibold text-white/60">{p.n}</span>
                <h3 className="text-body font-semibold text-text-inverse mt-1.5">{p.titulo}</h3>
                <p className="text-body-sm text-white/70 mt-1.5">{p.detalle}</p>
              </div>
            ))}
          </div>
          {/* Sobre negro, una franja del color de marca puede dejar su texto
              ilegible si ese color es oscuro. Se usa una superficie clara con
              texto oscuro, que funciona con cualquier institución. */}
          <div className="mt-8 rounded-lg bg-white px-6 py-4 flex flex-wrap items-center gap-x-6 gap-y-2 border-l-4 border-accent">
            <span className="text-kicker uppercase text-text-primary shrink-0">
              Adaptabilidad tecnológica
            </span>
            <span className="text-body-sm text-text-secondary">
              Integración flexible con los sistemas actuales y futuros del banco, sin
              rediseñar los procesos cada vez que cambia la tecnología.
            </span>
          </div>
        </div>
      ),
    },
    {
      id: 'ambicion',
      titulo: 'La ambición',
      contenido: (
        <div className="h-full flex flex-col justify-center">
          <Kicker>La ambición</Kicker>
          <h2 className="text-h1 text-text-primary mt-3 max-w-4xl">
            Del tiempo que hoy está en manos del banco, visionamos reducir entre 40% y 60%
          </h2>
          <div className="mt-10 max-w-4xl">
            <div className="grid grid-cols-[130px_1fr] gap-5 items-center mb-3">
              <span className="text-kicker uppercase text-text-muted">Hoy</span>
              <div className="h-14 bg-bg-sunken rounded-lg" />
            </div>
            <div className="grid grid-cols-[130px_1fr] gap-5 items-center">
              <span className="text-kicker uppercase text-accent">Nuestra ambición</span>
              <div className="flex items-center gap-5">
                <div className="h-14 bg-accent rounded-lg" style={{ width: '50%' }} />
                <span className="text-h2 text-accent font-semibold">40% a 60% menos</span>
              </div>
            </div>
          </div>
          <div className="mt-10">
            <span className="text-kicker uppercase text-text-muted">Cómo lo conseguiremos</span>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-x-8 gap-y-5 mt-4">
              {PALANCAS.map((p) => (
                <div key={p.titulo}>
                  <h3 className="text-body font-semibold text-text-primary">{p.titulo}</h3>
                  <p className="text-body-sm text-text-secondary mt-1">{p.detalle}</p>
                </div>
              ))}
            </div>
          </div>
          <p className="text-caption text-text-muted mt-8">
            Referencia: en España, un mercado comparable, una hipoteca se cursa entre 15 y
            45 días.
          </p>
        </div>
      ),
    },
    {
      id: 'planteamiento',
      titulo: 'Front y back office',
      contenido: (
        <div className="h-full flex flex-col justify-center">
          <Encabezado
            kicker="Nuestro planteamiento"
            titulo="Repensamos las dos mitades del proceso, no una"
            bajada="Rediseñar el viaje del cliente sin una operación capaz de sostenerlo produce una aplicación bonita sobre un back office que demora lo mismo. Automatizar el back office sin rediseñar el viaje hace eficiente un proceso que igual se le pide al cliente en el orden equivocado."
          />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-10">
            {[
              { titulo: 'Front office', icono: <Building2 size={16} />, items: FRONT, tono: 'acento' as const },
              { titulo: 'Back office', icono: <ShieldCheck size={16} />, items: BACK, tono: 'neutro' as const },
            ].map((col) => (
              <div key={col.titulo} className="rounded-xl border border-border-hairline bg-bg-card p-7">
                <div className="flex items-center gap-3">
                  <IconChip tono={col.tono}>{col.icono}</IconChip>
                  <h3 className="text-h2 text-text-primary">{col.titulo}</h3>
                </div>
                <div className="mt-5 space-y-4">
                  {col.items.map((f) => (
                    <div key={f.titulo}>
                      <h4 className="text-body-sm font-semibold text-text-primary">{f.titulo}</h4>
                      <p className="text-body-sm text-text-secondary mt-1">{f.detalle}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      ),
    },
    {
      id: 'transversal',
      titulo: 'Lo que ya está construido',
      contenido: (
        <div className="h-full flex flex-col justify-center">
          <Encabezado
            kicker="Tecnología en operación"
            titulo="Cobertura de todas las etapas, no de un tramo"
            bajada="No partimos de cero. Hay tecnología desarrollada y funcionando en las cuatro etapas del proceso, y opera sobre el workflow que el banco ya tiene, sin pedirle que lo reemplace."
            icono={<Workflow size={20} />}
          />

          <div className="mt-10 grid grid-cols-1 lg:grid-cols-[1fr_1fr] gap-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
              {TRANSVERSAL.map((t) => (
                <div key={t.titulo} className="border-t-2 border-accent pt-4">
                  <h3 className="text-body font-semibold text-text-primary">{t.titulo}</h3>
                  <p className="text-body-sm text-text-secondary mt-1.5">{t.detalle}</p>
                </div>
              ))}
            </div>

            <div className="rounded-xl border border-border-hairline bg-bg-card p-6">
              <span className="text-caption uppercase tracking-[0.14em] text-text-muted">
                Las cuatro etapas cubiertas
              </span>
              <div className="mt-4 space-y-3">
                {[
                  { etapa: 'Pre firma', detalle: 'Orden de escrituración, rescate de certificados, validación de antecedentes.' },
                  { etapa: 'Legal', detalle: 'Estudio de títulos, compilado y borrador de escritura.' },
                  { etapa: 'Firma', detalle: 'Coordinación con la red de notarías y despacho.' },
                  { etapa: 'Post firma', detalle: 'Seguimiento del conservador, instrucción de pago y activación.' },
                ].map((e, i) => (
                  <div key={e.etapa} className="flex gap-3 items-start">
                    <span className="mt-0.5 w-6 h-6 rounded-md bg-accent-soft text-accent text-caption font-semibold inline-flex items-center justify-center shrink-0">
                      {i + 1}
                    </span>
                    <div className="min-w-0">
                      <span className="text-body-sm font-medium text-text-primary">{e.etapa}</span>
                      <p className="text-caption text-text-muted mt-0.5">{e.detalle}</p>
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-caption text-text-secondary mt-5 pt-4 border-t border-border-hairline">
                En cualquier momento del proceso se puede responder qué documentos están,
                cuáles faltan y cuáles están observados, sin abrir un correo.
              </p>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'tecnologia',
      titulo: 'Sobre qué se construye',
      contenido: (
        <div className="h-full flex flex-col justify-center">
          <Encabezado
            kicker="La pregunta técnica"
            titulo="Flujos agénticos, desacoplados de una tecnología en particular"
            bajada="Lo que se construye no queda amarrado a un proveedor de IA ni a una nube. Es la diferencia entre comprar una herramienta y quedarse con una capacidad."
            icono={<Cpu size={20} />}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-7 mt-10">
            {TECNOLOGIA.map((t) => (
              <div key={t.titulo} className="border-t-2 border-accent pt-4">
                <h3 className="text-body font-semibold text-text-primary">{t.titulo}</h3>
                <p className="text-body-sm text-text-secondary mt-1.5">{t.detalle}</p>
              </div>
            ))}
          </div>

          <div className="mt-8 grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-6">
            <div className="rounded-xl bg-bg-card border border-border-hairline px-6 py-5">
              <span className="text-caption uppercase tracking-[0.14em] text-text-muted">
                Sobre lo que ya operamos
              </span>
              <div className="mt-4 space-y-3">
                {[
                  { grupo: 'Nube', items: STACK.nube },
                  { grupo: 'Plataformas', items: STACK.plataformas },
                  { grupo: 'Desarrollo', items: STACK.desarrollo },
                  { grupo: 'Modelos', items: STACK.modelos },
                ].map((g) => (
                  <div key={g.grupo} className="grid grid-cols-[100px_1fr] gap-3 items-center">
                    <span className="text-caption text-text-muted">{g.grupo}</span>
                    <div className="flex flex-wrap gap-1.5">
                      {g.items.map((i) => (
                        <span
                          key={i}
                          className="inline-flex items-center px-2.5 py-1 rounded-md border border-border-hairline text-caption text-text-secondary"
                        >
                          {i}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-caption text-text-muted mt-4 pt-3 border-t border-border-hairline">
                La lista es ilustrativa. El punto es que la elección la hace el banco, y
                cambiarla después no obliga a rehacer el proceso.
              </p>
            </div>

            <div className="rounded-xl bg-bg-sunken px-6 py-5">
              <span className="text-caption uppercase tracking-[0.14em] text-text-muted">
                Lo que esto evita
              </span>
              <div className="mt-3 space-y-2.5">
                {[
                  'Quedar atado al modelo de un proveedor',
                  'Migrar de nube para poder empezar',
                  'Rehacer los procesos cuando cambia la tecnología',
                  'Sacar datos del perímetro del banco',
                ].map((t) => (
                  <div key={t} className="flex gap-2.5 items-start">
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-text-muted shrink-0" />
                    <p className="text-body-sm text-text-secondary">{t}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'vision',
      titulo: 'Lo que visionamos',
      contenido: (
        <div className="h-full flex flex-col justify-center">
          <Encabezado
            kicker="Lo que visionamos"
            titulo="Procesos que parecen obvios cuando se cuentan, y que hoy nadie resuelve"
            bajada="Sin ser exhaustivos, incorporamos al rediseño un conjunto de procesos que, contados en voz alta, parecen triviales. Ninguno está abordado hoy, y cada uno explica días de demora."
            icono={<Inbox size={20} />}
          />
          <div className="mt-8 space-y-px bg-border-hairline rounded-xl overflow-hidden border border-border-hairline">
            {VISION.map((v) => (
              <div key={v.titulo} className="bg-bg-card px-6 py-5 grid grid-cols-1 lg:grid-cols-[260px_1fr_1fr] gap-5 lg:gap-8">
                <div className="flex items-start gap-3">
                  <IconChip tamano="sm">{v.icono}</IconChip>
                  <h3 className="text-body font-semibold text-text-primary">{v.titulo}</h3>
                </div>
                <div>
                  <span className="text-caption uppercase tracking-[0.14em] text-text-muted">Por qué</span>
                  <p className="text-body-sm text-text-secondary mt-1.5">{v.porque}</p>
                </div>
                <div>
                  <span className="text-caption uppercase tracking-[0.14em] text-accent">Qué proponemos</span>
                  <p className="text-body-sm text-text-primary mt-1.5">{v.que}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      ),
    },
    {
      id: 'cierre',
      titulo: 'Lo que sigue',
      contenido: (
        <div className="h-full flex flex-col justify-center">
          <div className="rounded-2xl bg-accent-soft px-8 lg:px-12 py-12 max-w-5xl">
            <Pill variant="info">Lo que sigue</Pill>
            <h2 className="text-h1 text-text-primary max-w-3xl mt-5">
              Todo lo anterior está construido y se puede recorrer
            </h2>
            <p className="text-body-lg text-text-secondary mt-4 max-w-measure">
              Lo que viene es una demostración funcional del proceso objetivo, con la
              identidad de {BRAND.name}, que se recorre desde la vista del cliente, del
              ejecutivo y del back office.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <button
                onClick={() => navigate('/')}
                className="inline-flex items-center gap-2 px-6 py-3 bg-accent text-white text-body font-medium rounded-md hover:opacity-90 transition-opacity"
              >
                Ver la demostración
                <ArrowRight size={16} />
              </button>
              <button
                onClick={() => navigate('/portal')}
                className="inline-flex items-center px-6 py-3 border border-border-strong text-body rounded-md hover:bg-bg-card transition-colors"
              >
                Todas las vistas
              </button>
            </div>
          </div>
        </div>
      ),
    },
  ];

  const [actual, setActual] = useState(0);
  const total = LAMINAS.length;
  const tactil = useRef<number | null>(null);

  const ir = useCallback((n: number) => setActual(Math.max(0, Math.min(total - 1, n))), [total]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'PageDown' || e.key === ' ') {
        e.preventDefault();
        setActual((a) => Math.min(total - 1, a + 1));
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        e.preventDefault();
        setActual((a) => Math.max(0, a - 1));
      } else if (e.key === 'Home') setActual(0);
      else if (e.key === 'End') setActual(total - 1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [total]);

  const lamina = LAMINAS[actual];
  const oscuro = lamina.fondo === 'oscuro';

  return (
    <div
      className={cn('relative transition-colors duration-300', oscuro ? 'bg-text-primary' : 'bg-bg-page')}
      onTouchStart={(e) => { tactil.current = e.touches[0].clientX; }}
      onTouchEnd={(e) => {
        if (tactil.current === null) return;
        const dx = e.changedTouches[0].clientX - tactil.current;
        if (Math.abs(dx) > 50) ir(actual + (dx < 0 ? 1 : -1));
        tactil.current = null;
      }}
    >
      <div className="overflow-hidden">
        <div
          className="flex"
          style={{
            transform: `translateX(-${actual * 100}%)`,
            transition: 'transform 520ms cubic-bezier(.2,.7,.3,1)',
          }}
        >
          {LAMINAS.map((l, i) => (
            <section key={l.id} aria-hidden={i !== actual} className="w-full shrink-0 overflow-y-auto">
              <div className="max-w-shell mx-auto px-6 md:px-10 lg:px-16 py-10 min-h-[calc(100vh-14rem)]">
                {l.contenido}
              </div>
            </section>
          ))}
        </div>
      </div>

      <div className={cn('sticky bottom-0 border-t backdrop-blur-sm', oscuro ? 'bg-text-primary/90 border-white/10' : 'bg-bg-page/90 border-border-hairline')}>
        <div className="max-w-shell mx-auto px-6 md:px-10 lg:px-16 py-4 flex items-center gap-5">
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => ir(actual - 1)}
              disabled={actual === 0}
              aria-label="Lámina anterior"
              className={cn(
                'w-9 h-9 rounded-md border inline-flex items-center justify-center transition-colors disabled:opacity-30',
                oscuro ? 'border-white/20 text-white hover:bg-white/10' : 'border-border-hairline text-text-primary hover:bg-bg-card',
              )}
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={() => ir(actual + 1)}
              disabled={actual === total - 1}
              aria-label="Lámina siguiente"
              className={cn(
                'w-9 h-9 rounded-md border inline-flex items-center justify-center transition-colors disabled:opacity-30',
                oscuro ? 'border-white/20 text-white hover:bg-white/10' : 'border-border-hairline text-text-primary hover:bg-bg-card',
              )}
            >
              <ChevronRight size={16} />
            </button>
          </div>

          <div className="flex-1 flex items-center gap-1.5 min-w-0 overflow-x-auto">
            {LAMINAS.map((l, i) => (
              <button
                key={l.id}
                onClick={() => ir(i)}
                title={l.titulo}
                aria-label={`Ir a ${l.titulo}`}
                className={cn(
                  'h-1.5 rounded-full transition-all shrink-0',
                  i === actual ? 'w-10 bg-accent' : oscuro ? 'w-5 bg-white/25 hover:bg-white/45' : 'w-5 bg-border-strong hover:bg-text-muted',
                )}
              />
            ))}
          </div>

          <div className="shrink-0 text-right">
            <span className={cn('text-body-sm font-medium tabular-nums', oscuro ? 'text-white' : 'text-text-primary')}>
              {String(actual + 1).padStart(2, '0')} / {String(total).padStart(2, '0')}
            </span>
            <span className={cn('block text-caption truncate max-w-[180px]', oscuro ? 'text-white/55' : 'text-text-muted')}>
              {lamina.titulo}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
