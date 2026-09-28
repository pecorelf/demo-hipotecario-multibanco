/**
 * Nuestro entendimiento del desafío.
 *
 * No es un kick off de proyecto: es el planteamiento de cómo repensamos el
 * flujo hipotecario completo, del front office al back office. Se muestra
 * antes de la demostración, para que quien la vea entienda desde qué lectura
 * del problema se construyó lo que viene después.
 *
 * Todo el contenido se adapta a la institución configurada en /admin: color,
 * nombre, asistente y actores salen de BRAND.
 */

import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  FileWarning,
  Inbox,
  Layers,
  Mail,
  ShieldCheck,
  UserPlus,
  Users,
} from 'lucide-react';
import { IconChip, Kicker, Pill } from '@/components/ui';
import { Contador, Reveal } from '@/components/motion';
import { BRAND } from '@/lib/brand';
import { cn } from '@/lib/cn';

// ─────────────────────────────────────────────────────────────
// Contenido
// ─────────────────────────────────────────────────────────────

const ETAPAS = [
  { nombre: 'Pre venta', detalle: 'Origen y evaluación', peso: 22, tono: 'suave' },
  { nombre: 'Venta', detalle: 'Preparación y curse', peso: 39, tono: 'foco' },
  { nombre: 'Post venta', detalle: 'Conservador y desembolso', peso: 58, tono: 'oscuro' },
] as const;

const DOLORES = [
  {
    titulo: 'El cliente no sabe en qué va',
    detalle:
      'Ve una barra de siete etapas, pero dentro de cada una hay sub-etapas que no ve. Cuando quiere saber si avanzó, llama.',
  },
  {
    titulo: 'Los reparos viajan por correo',
    detalle:
      'El motivo del reparo viene en lenguaje técnico, dentro de un hilo con cinco personas en copia. El cliente reenvía a su cónyuge, que reenvía al vendedor.',
  },
  {
    titulo: 'Cerca de 25 documentos por operación',
    detalle:
      'En una operación con subsidio, la cantidad de antecedentes que se le pide al cliente hace casi seguro que al menos uno vuelva observado.',
  },
  {
    titulo: 'El mismo dato se pide varias veces',
    detalle:
      'Renta, estado civil y datos de la propiedad se vuelven a pedir en cada etapa, porque cada sistema guarda su propia copia.',
  },
  {
    titulo: 'El vendedor y la inmobiliaria quedan fuera',
    detalle:
      'Aportan documentos decisivos del inmueble y no tienen dónde ponerlos: los mandan al ejecutivo, que los reenvía.',
  },
  {
    titulo: 'Las tareas avanzan en fila',
    detalle:
      'La tasación espera a los antecedentes, el estudio de títulos espera a la tasación, aunque no dependan entre sí.',
  },
  {
    titulo: 'El co-titular depende del titular',
    detalle:
      'El cónyuge entrega lo suyo a través de su pareja, que termina haciendo de mensajero entre dos personas y el banco.',
  },
  {
    titulo: 'El error se descubre tarde',
    detalle:
      'Un documento mal presentado se detecta cuando alguien ya lo revisó, o peor, cuando el conservador lo rechaza.',
  },
];

const TAREAS_EJECUTIVO = [
  { tarea: 'Perseguir documentos al cliente', carga: 26 },
  { tarea: 'Explicar reparos por teléfono y correo', carga: 22 },
  { tarea: 'Coordinar con vendedor, inmobiliaria y notaría', carga: 18 },
  { tarea: 'Rehacer y reenviar antecedentes', carga: 14 },
  { tarea: 'Consultar el estado en varios sistemas', carga: 11 },
  { tarea: 'Vender', carga: 9 },
];

const TIPOLOGIAS = [
  'Vivienda nueva con subsidio',
  'Vivienda nueva sin subsidio',
  'Vivienda usada',
  'Segunda vivienda',
  'Compra a inmobiliaria con proyecto financiado',
  'Compra a vendedor particular',
  'Subrogación de crédito',
  'Refinanciamiento',
  'Compra con promesa vigente',
  'Propiedad en sucesión',
  'Cliente independiente',
  'Operación con co-titular',
];

const FRONT = [
  {
    titulo: 'El viaje deja de ser una fila',
    detalle:
      'La necesidad del cliente se descompone en tareas que avanzan en paralelo. Cada una la resuelve un agente especializado, y el recorrido se arma según lo que ese caso necesita resolver.',
  },
  {
    titulo: 'La validación ocurre al cargar',
    detalle:
      'El documento se revisa en el momento en que el cliente lo sube, no días después. Si hay una observación, se explica en lenguaje corriente y con la instrucción precisa.',
  },
  {
    titulo: 'Todos los actores dentro del mismo flujo',
    detalle: `Cliente, ejecutivo, operaciones, vendedor, inmobiliaria y co-titular trabajan sobre la misma operación, cada uno con su vista y sus permisos.`,
  },
  {
    titulo: 'El cliente sabe qué le toca',
    detalle:
      'Una sola próxima acción visible en todo momento, con el plazo comprometido y quién tiene la pelota.',
  },
];

const BACK = [
  {
    titulo: 'Digital Workers en lugar de manos',
    detalle:
      'Lo repetitivo —rescatar certificados de fuentes públicas, cuadrar montos, consultar el conservador— se ejecuta solo, y queda registrado.',
  },
  {
    titulo: 'La persona autoriza, la máquina escribe',
    detalle:
      'Antes de inyectar nada en los sistemas, un abogado revisa el compilado contra los datos que se van a escribir. Después la escritura es automática, campo por campo, con reintentos.',
  },
  {
    titulo: 'Monitoreo permanente, no revisión al final',
    detalle:
      'Robots que verifican disponibilidad de los sistemas y que cada tarea terminó como debía. Si algo falla, se detecta antes de que alguien lo reclame.',
  },
  {
    titulo: 'La base del proyecto se valida una vez',
    detalle:
      'En el negocio encadenado, la base de escrituración se revisa al incorporar el proyecto y el resultado se hereda a todas las unidades, en lugar de descubrir el problema con el primer rechazo.',
  },
];

const VISION = [
  {
    icono: <UserPlus size={16} />,
    titulo: 'Co-titular con acceso propio',
    porque:
      'Hoy el cónyuge entrega sus documentos a través del titular, que hace de intermediario entre dos personas y el banco. Cada traspaso agrega días y pérdidas.',
    que: 'Entra por su propio enlace, verifica su identidad y aporta lo suyo directamente. El banco le rescata de fuentes públicas lo que puede conseguir solo.',
  },
  {
    icono: <ShieldCheck size={16} />,
    titulo: 'Reparo predictivo',
    porque:
      'El reparo se descubre cuando alguien ya revisó el documento. Para entonces el cliente ya esperó, y volver a pedirlo cuesta otra vuelta completa.',
    que: 'Antes de pedir el primer papel, se estima qué documentos suelen ser devueltos en un perfil como el suyo y se le piden primero, con la instrucción exacta.',
  },
  {
    icono: <FileWarning size={16} />,
    titulo: 'Verificación de autenticidad',
    porque:
      'La revisión documental confirma que el documento es el correcto, pero no que sea legítimo. Esa conversación vive en Riesgo y no llega al proceso hipotecario.',
    que: 'Coherencia de metadatos, cuadratura interna y cruce con movimientos que el banco ya tiene. La alerta no bloquea: queda registrada y una persona decide.',
  },
  {
    icono: <Inbox size={16} />,
    titulo: 'Reloj de compromiso',
    porque:
      'El plazo prometido al cliente vive en la cabeza del ejecutivo. Cuando se vence, nadie se entera hasta que el cliente reclama.',
    que: 'Cada caso muestra los días que quedan y quién tiene el tramo. Cuando se pasa, escala solo.',
  },
];

// ─────────────────────────────────────────────────────────────

export default function EntendimientoDesafio() {
  const navigate = useNavigate();
  const maxCarga = Math.max(...TAREAS_EJECUTIVO.map((t) => t.carga));

  return (
    <div className="pb-24">
      {/* ── Portada ─────────────────────────────────────── */}
      <section className="max-w-shell mx-auto px-6 md:px-10 lg:px-16 pt-16 lg:pt-24 pb-16">
        <Reveal>
          <div className="flex flex-col gap-2 mb-10" aria-hidden>
            <span className="block h-1.5 w-36 bg-accent rounded-full" />
            <span className="block h-1.5 w-56 bg-accent rounded-full" />
            <span className="block h-1.5 w-24 bg-accent rounded-full" />
          </div>
        </Reveal>

        <Reveal delay={80}>
          <Kicker>Deloitte Digital · {BRAND.shortName}</Kicker>
          <h1 className="text-display-lg lg:text-display-xl text-text-primary mt-4 max-w-4xl">
            Cómo repensamos el flujo hipotecario
          </h1>
          <p className="text-body-lg text-text-secondary mt-5 max-w-measure">
            Antes de mostrar la plataforma, nuestra lectura del problema. El proceso
            hipotecario es el producto más comoditizado de la banca y el que más vincula al
            cliente con su banco. La diferencia ya no está en la tasa: está en el proceso.
          </p>
        </Reveal>
      </section>

      {/* ── El punto de partida ─────────────────────────── */}
      <section className="max-w-shell mx-auto px-6 md:px-10 lg:px-16 py-14 border-t border-border-hairline">
        <Reveal>
          <Kicker tone="muted">El punto de partida</Kicker>
          <div className="flex flex-wrap items-end gap-x-6 gap-y-3 mt-4">
            <Contador
              valor={120}
              className="text-stat-xl text-accent"
              sufijo=""
            />
            <span className="text-h2 text-text-primary font-normal pb-2">
              días en promedio toma hoy una operación
            </span>
          </div>
          <p className="text-body-lg text-text-secondary mt-4 max-w-measure">
            Buena parte de ese tiempo no depende del banco: conservador, notaría y
            desembolso tienen sus propios ritmos. Pero un tercio sí está bajo su control, y
            es donde se concentra casi todo lo que se puede recuperar.
          </p>
        </Reveal>

        <Reveal delay={90}>
          <div className="mt-10">
            <div className="flex gap-1.5 items-stretch">
              {ETAPAS.map((e, i) => (
                <div
                  key={e.nombre}
                  className={cn(
                    'h-20 rounded-lg flex items-center px-5 origin-left',
                    e.tono === 'suave' && 'bg-bg-sunken',
                    e.tono === 'foco' && 'bg-accent text-text-inverse',
                    e.tono === 'oscuro' && 'bg-text-primary text-text-inverse',
                  )}
                  style={{
                    flex: e.peso,
                    animation: `crecer .9s cubic-bezier(.2,.7,.3,1) ${i * 120}ms both`,
                  }}
                >
                  <span className="text-h3 font-semibold">
                    {e.peso === 22 ? '18–20' : e.peso === 39 ? '35–40' : '45–60'}
                  </span>
                </div>
              ))}
            </div>
            <div className="flex gap-1.5 mt-3">
              {ETAPAS.map((e) => (
                <div key={e.nombre} style={{ flex: e.peso }} className="px-1">
                  <div
                    className={cn(
                      'text-body-sm font-medium',
                      e.tono === 'foco' ? 'text-accent' : 'text-text-primary',
                    )}
                  >
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
        </Reveal>
      </section>

      {/* ── Los dolores ─────────────────────────────────── */}
      <section className="max-w-shell mx-auto px-6 md:px-10 lg:px-16 py-14 border-t border-border-hairline">
        <Reveal>
          <Kicker tone="muted">Lo que rodea a una hipoteca</Kicker>
          <h2 className="text-h1 text-text-primary mt-3 max-w-3xl">
            Ocho fricciones que el cliente vive y el banco no siempre ve
          </h2>
        </Reveal>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-8 mt-10">
          {DOLORES.map((d, i) => (
            <Reveal key={d.titulo} delay={i * 50}>
              <div className="border-t-2 border-accent pt-4">
                <h3 className="text-h3 text-text-primary">{d.titulo}</h3>
                <p className="text-body-sm text-text-secondary mt-2">{d.detalle}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── El cuello de botella ────────────────────────── */}
      <section className="bg-text-primary text-text-inverse py-16 mt-14">
        <div className="max-w-shell mx-auto px-6 md:px-10 lg:px-16">
          <Reveal>
            <div className="flex items-start gap-4">
              <IconChip tamano="lg" tono="acento">
                <Users size={20} />
              </IconChip>
              <div className="min-w-0">
                <Kicker tone="muted">El cuello de botella</Kicker>
                <h2 className="text-h1 mt-3 max-w-3xl">
                  Todo pasa por el ejecutivo de cuentas
                </h2>
                <p className="text-body-lg mt-4 max-w-measure opacity-80">
                  Es el único punto por donde circula la información entre el cliente, el
                  vendedor, la inmobiliaria, operaciones y la notaría. No porque alguien lo
                  haya diseñado así, sino porque no hay otro lugar donde ponerla. El
                  resultado es que la persona contratada para vender dedica la mayor parte
                  de su tiempo a coordinar.
                </p>
              </div>
            </div>
          </Reveal>

          <Reveal delay={120}>
            <div className="mt-12 max-w-3xl space-y-4">
              {TAREAS_EJECUTIVO.map((t, i) => (
                <div key={t.tarea} className="grid grid-cols-[1fr_auto] gap-4 items-center">
                  <div>
                    <div className="flex items-baseline justify-between gap-3 mb-1.5">
                      <span
                        className={cn(
                          'text-body-sm',
                          t.tarea === 'Vender' ? 'text-accent font-medium' : 'opacity-90',
                        )}
                      >
                        {t.tarea}
                      </span>
                    </div>
                    <div className="h-2.5 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className={cn(
                          'h-full rounded-full',
                          t.tarea === 'Vender' ? 'bg-accent' : 'bg-white/45',
                        )}
                        style={{
                          width: `${(t.carga / maxCarga) * 100}%`,
                          transition: 'width .9s cubic-bezier(.2,.7,.3,1)',
                          transitionDelay: `${i * 90}ms`,
                        }}
                      />
                    </div>
                  </div>
                  <span className="text-body-sm tabular-nums opacity-70 w-12 text-right">
                    {t.carga}%
                  </span>
                </div>
              ))}
            </div>
            <p className="text-caption opacity-60 mt-6 max-w-measure">
              Distribución referencial del tiempo de un ejecutivo hipotecario. El orden
              importa más que la cifra exacta: vender es lo último de la lista.
            </p>
          </Reveal>
        </div>
      </section>

      {/* ── Tipologías ──────────────────────────────────── */}
      <section className="max-w-shell mx-auto px-6 md:px-10 lg:px-16 py-14">
        <Reveal>
          <div className="flex items-start gap-4">
            <IconChip tamano="lg">
              <Layers size={20} />
            </IconChip>
            <div>
              <Kicker tone="muted">La variabilidad real</Kicker>
              <h2 className="text-h1 text-text-primary mt-3">
                Más de doce tipologías, un solo camino
              </h2>
              <p className="text-body-lg text-text-secondary mt-4 max-w-measure">
                El proceso está diseñado como si todas las operaciones fueran iguales, pero
                cada tipología exige documentos distintos, involucra actores distintos y
                tiene puntos de falla distintos. Cuando el camino es uno solo, el caso raro
                se resuelve por correo y criterio personal.
              </p>
            </div>
          </div>
        </Reveal>

        <Reveal delay={100}>
          <div className="mt-10 flex flex-wrap gap-2">
            {TIPOLOGIAS.map((t) => (
              <span
                key={t}
                className="inline-flex items-center px-3.5 py-2 rounded-full border border-border-hairline bg-bg-card text-body-sm text-text-secondary"
              >
                {t}
              </span>
            ))}
            <span className="inline-flex items-center px-3.5 py-2 rounded-full bg-accent-soft text-accent text-body-sm font-medium">
              y las combinaciones entre ellas
            </span>
          </div>
        </Reveal>
      </section>

      {/* ── El correo ───────────────────────────────────── */}
      <section className="max-w-shell mx-auto px-6 md:px-10 lg:px-16 py-14 border-t border-border-hairline">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr] gap-12 items-start">
          <Reveal>
            <div className="flex items-start gap-4">
              <IconChip tamano="lg" tono="alerta">
                <Mail size={20} />
              </IconChip>
              <div>
                <Kicker tone="muted">El vehículo de la información</Kicker>
                <h2 className="text-h1 text-text-primary mt-3">
                  El proceso corre sobre correo electrónico
                </h2>
                <p className="text-body-lg text-text-secondary mt-4">
                  Los documentos, los reparos, las aclaraciones y las coordinaciones viajan
                  por correo. Funciona, y por eso nadie lo cuestiona. El costo aparece
                  después.
                </p>
              </div>
            </div>
          </Reveal>

          <Reveal delay={90}>
            <div className="space-y-4">
              {[
                'No hay trazabilidad: reconstruir qué pasó con una operación implica leer un hilo.',
                'No hay centralización: la información vive en el buzón de una persona.',
                'Si esa persona sale de vacaciones o con licencia, la operación se detiene.',
                'Nadie sabe cuánto lleva esperando un reparo, porque no hay reloj.',
                'El cliente recibe jerga técnica, escrita para otro destinatario.',
              ].map((t) => (
                <div key={t} className="flex gap-3 items-start">
                  <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-status-warning shrink-0" />
                  <p className="text-body text-text-secondary">{t}</p>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── Cómo lo repensamos ──────────────────────────── */}
      <section className="max-w-shell mx-auto px-6 md:px-10 lg:px-16 py-14 border-t border-border-hairline">
        <Reveal>
          <Kicker>Nuestro planteamiento</Kicker>
          <h2 className="text-h1 text-text-primary mt-3 max-w-3xl">
            Repensamos las dos mitades del proceso, no una
          </h2>
          <p className="text-body-lg text-text-secondary mt-4 max-w-measure">
            Rediseñar el viaje del cliente sin una operación capaz de sostenerlo produce
            una aplicación bonita sobre un back office que demora lo mismo. Automatizar el
            back office sin rediseñar el viaje hace eficiente un proceso que igual se le
            pide al cliente en el orden equivocado.
          </p>
        </Reveal>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-12">
          <Reveal>
            <div className="rounded-xl border border-border-hairline bg-bg-card p-8 h-full">
              <div className="flex items-center gap-3">
                <IconChip>
                  <Building2 size={16} />
                </IconChip>
                <h3 className="text-h2 text-text-primary">Front office</h3>
              </div>
              <div className="mt-6 space-y-6">
                {FRONT.map((f) => (
                  <div key={f.titulo}>
                    <h4 className="text-body font-semibold text-text-primary">{f.titulo}</h4>
                    <p className="text-body-sm text-text-secondary mt-1.5">{f.detalle}</p>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>

          <Reveal delay={90}>
            <div className="rounded-xl border border-border-hairline bg-bg-card p-8 h-full">
              <div className="flex items-center gap-3">
                <IconChip tono="neutro">
                  <ShieldCheck size={16} />
                </IconChip>
                <h3 className="text-h2 text-text-primary">Back office</h3>
              </div>
              <div className="mt-6 space-y-6">
                {BACK.map((f) => (
                  <div key={f.titulo}>
                    <h4 className="text-body font-semibold text-text-primary">{f.titulo}</h4>
                    <p className="text-body-sm text-text-secondary mt-1.5">{f.detalle}</p>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── Lo que visionamos ───────────────────────────── */}
      <section className="max-w-shell mx-auto px-6 md:px-10 lg:px-16 py-14 border-t border-border-hairline">
        <Reveal>
          <Kicker tone="muted">Lo que visionamos</Kicker>
          <h2 className="text-h1 text-text-primary mt-3 max-w-3xl">
            Cuatro capacidades que hoy no existen en el proceso
          </h2>
          <p className="text-body-lg text-text-secondary mt-4 max-w-measure">
            No son mejoras del proceso actual: son piezas que no están, y que atacan
            directamente las fricciones de más arriba.
          </p>
        </Reveal>

        <div className="mt-12 space-y-px bg-border-hairline rounded-xl overflow-hidden border border-border-hairline">
          {VISION.map((v, i) => (
            <Reveal key={v.titulo} delay={i * 60}>
              <div className="bg-bg-card px-6 lg:px-8 py-7 grid grid-cols-1 lg:grid-cols-[280px_1fr_1fr] gap-6 lg:gap-10">
                <div className="flex items-start gap-3">
                  <IconChip tamano="sm">{v.icono}</IconChip>
                  <h3 className="text-h3 text-text-primary">{v.titulo}</h3>
                </div>
                <div>
                  <span className="text-caption uppercase tracking-[0.14em] text-text-muted">
                    Por qué
                  </span>
                  <p className="text-body-sm text-text-secondary mt-2">{v.porque}</p>
                </div>
                <div>
                  <span className="text-caption uppercase tracking-[0.14em] text-accent">
                    Qué proponemos
                  </span>
                  <p className="text-body-sm text-text-primary mt-2">{v.que}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── Cierre ──────────────────────────────────────── */}
      <section className="max-w-shell mx-auto px-6 md:px-10 lg:px-16 py-16 border-t border-border-hairline">
        <Reveal>
          <div className="rounded-2xl bg-accent-soft px-8 lg:px-12 py-12">
            <div className="flex items-center gap-2.5 mb-5">
              <CheckCircle2 size={18} className="text-accent" />
              <Pill variant="info">Lo que sigue</Pill>
            </div>
            <h2 className="text-h1 text-text-primary max-w-3xl">
              Todo lo anterior está construido y se puede recorrer
            </h2>
            <p className="text-body-lg text-text-secondary mt-4 max-w-measure">
              Lo que viene no es una maqueta de pantallas: es una demostración funcional
              del proceso objetivo, con la identidad de {BRAND.name}, que se recorre desde
              la vista del cliente, del ejecutivo y del back office.
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
        </Reveal>
      </section>

      <style>{`
        @keyframes crecer {
          from { transform: scaleX(0); opacity: 0; }
          to   { transform: scaleX(1); opacity: 1; }
        }
        @media (prefers-reduced-motion: reduce) {
          [style*="crecer"] { animation: none !important; }
        }
      `}</style>
    </div>
  );
}
