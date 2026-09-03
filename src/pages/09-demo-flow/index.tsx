import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CheckCircle2,
  ChevronRight,
  Pause,
  Play,
  RotateCcw,
  Square,
  Zap,
} from 'lucide-react';
import { Card, Kicker, PageTitle, Pill, SectionTitle } from '@/components/ui';
import { cn } from '@/lib/cn';
import {
  isDemoMode,
  setDemoMode as setDemoModeFlag,
  triggerReset,
} from '@/lib/demoMode';
import { useAppStore } from '@/store/appStore';
import { BRAND } from '@/lib/brand';

// ─────────────────────────────────────────────────────────────
// Demo data — 8 scenes covering all 15 use cases
// ─────────────────────────────────────────────────────────────

interface UseCase {
  id: number;
  title: string;
  brief: string;
}

interface Scene {
  index: number;
  route: string;
  role: 'cliente' | 'ejecutivo' | 'backoffice' | 'inmobiliaria';
  title: string;
  targetMinutes: number;
  useCases: UseCase[];
  whatToSay: string;
  whatToClick: string[];
}

const SCENES: Scene[] = [
  {
    index: 1,
    route: '/cliente/seguimiento',
    role: 'cliente',
    title: 'Mi hipoteca · Vista principal post-aprobación',
    targetMinutes: 3,
    useCases: [
      {
        id: 1,
        title: 'Gestión documental con tracking dual',
        brief: 'Estudio de Títulos y Carpeta Comercial avanzan en paralelo, cada uno con su porcentaje.',
      },
      {
        id: 2,
        title: 'Gate de pago de gastos operacionales',
        brief: 'Bloquea el estudio de títulos hasta que el cliente paga UF 8.',
      },
      {
        id: 3,
        title: 'Selector Nueva / Usada',
        brief: 'Cambia el listado de docs del vendedor o inmobiliaria. Mismo flujo, mismo POC.',
      },
      {
        id: 4,
        title: 'Notificaciones con acción',
        brief: 'Campana arriba a la derecha. Reparos, pagos pendientes, avances. Click navega a la acción.',
      },
    ],
    whatToSay:
      'Esta es la vista principal del POC, alineada con lo que Carolina pidió: foco desde la aprobación en adelante. El cliente entra al portal y ve su operación en marcha con dos tracks paralelos —Estudio de Títulos y Carpeta Comercial—, un gate de pago de gastos operacionales que bloquea el avance, y notificaciones con acción. El selector arriba cambia entre propiedad Usada (vendedor particular) y Nueva (inmobiliaria), y eso reorganiza los documentos requeridos. Es el corazón del POC.',
    whatToClick: [
      'Mostrar el selector arriba: cambiar entre Usada y Nueva, ver cómo cambian los docs del estudio de títulos',
      'Click en "Pagar UF 8 ahora" — el track de Estudio de Títulos se desbloquea',
      'Click en "Subir documento" en algún doc de Carpeta Comercial — pasa a "En validación"',
      'Después de subir, ir al cockpit del ejecutivo (escena siguiente) para ver el ciclo completo',
      'Click en la campana arriba a la derecha para ver el feed de notificaciones',
    ],
  },
  {
    index: 2,
    route: '/cliente/simulacion-pre',
    role: 'cliente',
    title: `Onboarding con ${BRAND.assistantName} (extra-agregado pre-aprobación)`,
    targetMinutes: 2.5,
    useCases: [
      {
        id: 1,
        title: 'Bienvenida humanizada',
        brief: `${BRAND.assistantName} recibe al cliente con una conversación, no con un formulario.`,
      },
      {
        id: 9,
        title: 'Rescate de datos del banco',
        brief: 'El sistema sabe quién es el cliente y qué datos ya tiene.',
      },
      {
        id: 10,
        title: 'Pregunta sólo lo que importa',
        brief: 'No repreguntar lo que el banco ya sabe; preguntar lo que falta para avanzar.',
      },
    ],
    whatToSay:
      `Hoy un cliente abre la app del banco y se encuentra con un formulario de 60 campos. La promesa de Tus nuevas Llaves es otra: el cliente conversa con ${BRAND.assistantName}, una agente IA, en lenguaje natural. ${BRAND.assistantName} ya sabe quién es —porque el banco tiene esos datos— y sólo pide lo que falta. La sensación es de tener una asesora real, no un formulario disfrazado.`,
    whatToClick: [
      'Click en el chip "Pareja casa" o escribe: "Estamos buscando comprar nuestra primera casa con mi pareja"',
      `Espera el streaming de ${BRAND.assistantName} (~6s — o cache si demo mode)`,
      'Muestra el caso pre-armado que aparece: journey, datos a rescatar, datos a preguntar',
      'Click "Continuar al siguiente paso" para avanzar a documentos',
    ],
  },
  {
    index: 3,
    route: '/cliente/documentos',
    role: 'cliente',
    title: 'Documentos auto-validados',
    targetMinutes: 2.5,
    useCases: [
      {
        id: 2,
        title: 'Rescate automático',
        brief: 'Documentos que el banco ya tiene se muestran como "rescatados".',
      },
      {
        id: 3,
        title: 'Validación con consistencia',
        brief: 'Al subir, Claude lee, valida y detecta inconsistencias en vivo.',
      },
    ],
    whatToSay:
      `La parte más tediosa de un crédito hipotecario es juntar papeles. Acá ${BRAND.assistantName} ya rescató lo que el banco tenía (cédula, AFP, SII) y está buscando lo que está pendiente. Pero el momento clave es cuando el cliente sube un documento nuevo: el sistema no sólo lo recibe, lo lee, lo valida y, cuando hay una inconsistencia, te avisa antes de que entres a un proceso largo.`,
    whatToClick: [
      'Scrollea para mostrar las 3 secciones: rescatado / buscando / pendiente',
      'En la sección "Pendiente", arrastra cualquier archivo al primer slot (Certificado de matrimonio)',
      'Espera la extracción en vivo (~5s)',
      `Cuando aparece la inconsistencia (renta declarada vs Previred): click "Discutir con ${BRAND.assistantName}"`,
      `En el drawer lateral, ${BRAND.assistantName} explica la inconsistencia en lenguaje humano`,
    ],
  },
  {
    index: 4,
    route: '/cliente/credito',
    role: 'cliente',
    title: 'Time travel auditable',
    targetMinutes: 3,
    useCases: [
      {
        id: 5,
        title: 'Vista de seguimiento del cliente',
        brief: 'Estado siempre visible, próximo paso siempre claro, comunicaciones accesibles.',
      },
      {
        id: 13,
        title: 'Trazabilidad y explicabilidad',
        brief: 'Time travel: cada decisión auditable, cada paso reproducible.',
      },
    ],
    whatToSay:
      'Acá está la vista de "mi crédito". Arriba lo que el cliente necesita ver hoy: en qué estamos, qué falta, cuándo. Pero abajo está la diferencia: el time travel. Cada decisión del proceso es auditable. Podemos volver a cualquier momento del caso y reproducir exactamente qué sabíamos, qué pasó, y qué se decidió —incluido el razonamiento de las decisiones automáticas, escrito para un auditor.',
    whatToClick: [
      'Scrollea hasta "Historia del caso"',
      'Usa flecha izquierda (←) en el teclado para retroceder en el slider, lento, 3-4 eventos',
      'Observa cómo cambia el snapshot del lado izquierdo según el momento',
      'Avanza al evento "Cruce con CMF y bureau interno" (#8)',
      'Click "Ver razonamiento ⌄" — aparece la explicación regulatoria streameando',
    ],
  },
  {
    index: 5,
    route: '/ejecutivo',
    role: 'ejecutivo',
    title: 'Cockpit del ejecutivo con copiloto',
    targetMinutes: 3,
    useCases: [
      {
        id: 4,
        title: 'Orquestación con SLA',
        brief: 'El ejecutivo ve los SLA, los cuellos, lo crítico.',
      },
      {
        id: 8,
        title: 'Derivación asistida con auditoría',
        brief: 'Casos límite se derivan al back office con nota explicativa.',
      },
      {
        id: 11,
        title: 'Detección de inconsistencia con explicación humana',
        brief: 'El copiloto detecta y explica, no sólo alerta.',
      },
    ],
    whatToSay:
      `Ahora cambiemos a la vista del ejecutivo de ${BRAND.shortName}. Camila Reinoso abre su cockpit y ve su bandeja del día. El caso de Francisco tiene una alerta. A la derecha, su copiloto IA ya analizó el caso y le susurra al oído: hay una inconsistencia entre la liquidación y Previred. Le da la causa probable, le sugiere el próximo paso, le da contexto humano. Y si Camila decide que el caso necesita criterio del back office, lo deriva con una nota que el sistema redacta solo.`,
    whatToClick: [
      `Click en ${BRAND.buyerName} en el inbox de la izquierda (ya seleccionado por defecto)`,
      'Muestra el copiloto a la derecha: ALERTA + PRÓXIMO PASO + CONTEXTO ÚTIL',
      'En el centro, scrollea hasta "Atención" en el tab Resumen',
      'Click "Derivar a back office con esta nota"',
      'Modal abre con la nota pre-redactada — muestra que es editable, luego click "Derivar"',
      'Observa el banner ámbar y el pill "Derivado" en el inbox',
    ],
  },
  {
    index: 6,
    route: '/backoffice',
    role: 'backoffice',
    title: 'Back office cierra el loop',
    targetMinutes: 2.5,
    useCases: [
      {
        id: 7,
        title: 'Dashboard operativo',
        brief: 'Vista consolidada de cuellos, rechazos y productividad.',
      },
    ],
    whatToSay:
      'El caso que Camila derivó hace cinco minutos ya está acá. La jefa de operaciones del back office tiene la cola de derivaciones, los cuellos de botella por fase, las razones de rechazo del mes, la productividad de su equipo. Y arriba a la derecha, el copiloto del back office le da una observación accionable basada en patrones de los datos —no genéricos, específicos de hoy.',
    whatToClick: [
      'Muestra el insight del copiloto arriba a la derecha (puede tardar 6-10s o ser cache)',
      'Scrollea a la Card C "Casos derivados que requieren mi atención"',
      'Francisco está arriba con pill "Nuevo" y la nota que escribió Camila',
      'Click en su fila para abrir el drawer',
      'Muestra las 3 acciones: Devolver, Aprobar excepción, Escalar a comité',
      'Click "Aprobar excepción" → muestra el banner verde de acción registrada',
    ],
  },
  {
    index: 7,
    route: '/ejecutivo/audio',
    role: 'ejecutivo',
    title: 'Audio a caso',
    targetMinutes: 2.5,
    useCases: [
      {
        id: 15,
        title: 'De grabación a caso estructurado en 30 segundos',
        brief: 'Sube el audio de la llamada, sale el caso pre-armado.',
      },
    ],
    whatToSay:
      'Acá quiero mostrarles algo distinto. Imagínense que Camila acaba de salir de una llamada con un prospecto que llegó por LinkedIn. La conversación duró 8 minutos. En lugar de transcribir manualmente, sube el audio. Lo que ven a continuación es el caso emergiendo de la conversación, en vivo, sin que Camila toque nada.',
    whatToClick: [
      'Click "Usa la grabación de muestra →" (atajo del demo)',
      'Observa los 3 pasos avanzar y la transcripción reveladora (~5s)',
      'A la derecha, los campos del caso aparecen progresivamente: nombre, RUT, intención, monto, propiedad, documentos, próximos pasos, preocupaciones',
      'Cuando termina, click "Crear caso con estos datos"',
      'Te lleva al cockpit — Antonia Soto aparece arriba con pill "Nuevo · audio"',
    ],
  },
  {
    index: 8,
    route: '/inmobiliaria',
    role: 'inmobiliaria',
    title: 'Portal Inmobiliaria',
    targetMinutes: 2,
    useCases: [
      {
        id: 6,
        title: 'Integración con terceros del ecosistema',
        brief: `La corredora consume el motor de pre-aprobación de ${BRAND.shortName} como API.`,
      },
      {
        id: 12,
        title: 'Pre-aprobación instantánea',
        brief: 'En segundos, la corredora tiene una oferta vigente para entregar al cliente.',
      },
    ],
    whatToSay:
      'Hasta ahora vimos al cliente, al ejecutivo, al back office. Pero el ecosistema hipotecario incluye a las corredoras inmobiliarias —que son nuestra puerta de entrada al cliente nuevo. Tus nuevas Llaves se abre a ellas como API. La corredora ingresa los datos del comprador interesado, en segundos tiene una pre-aprobación. Y para cerrar, Claude le redacta el email que la corredora envía al cliente.',
    whatToClick: [
      'Form pre-llenado con datos de Antonia',
      'Click "Solicitar pre-aprobación"',
      'Loader editorial con 4 pasos (~6s, o cache)',
      'Muestra el resultado: pill grande verde, stats UF/tasa/cuota/vigencia, explicación',
      'Click "Enviar oferta al cliente"',
      'Modal con email pre-redactado streameando — muestra el botón "Copiar" y "Enviar"',
    ],
  },
  {
    index: 9,
    route: '/comparador',
    role: 'cliente',
    title: 'Comparador honesto',
    targetMinutes: 2.5,
    useCases: [
      {
        id: 14,
        title: 'Transparencia radical como ventaja competitiva',
        brief: 'Si la competencia es mejor, lo decimos. Y esa honestidad nos retiene.',
      },
    ],
    whatToSay:
      'Cierro con la pantalla más audaz del proyecto. La pregunta era: ¿qué pasaría si en lugar de defender automáticamente nuestra oferta, le diéramos al cliente una comparación honesta? Acá el motor de Claude analiza las ofertas y dice la verdad —aunque la nuestra no gane. Si gana la competencia, le decimos "antes de aceptarla, hablemos". Esa honestidad es lo que retiene a un cliente. Un cliente que se queda porque el banco fue honesto vale el doble que uno que se queda por inercia.',
    whatToClick: [
      'Arrastra cualquier archivo al slot "Competidor 1" (PDF, imagen, lo que sea)',
      'Click "Comparar ofertas"',
      'Loader con 5 pasos (~10s o cache)',
      'Muestra la tabla con los winners por categoría (border accent en celda ganadora)',
      'Lee en voz alta la conclusión del análisis',
      `Si gana ${BRAND.shortName}: muestra la card "Mejor opción para ti" con CTA de cierre`,
      'Si gana el competidor: muestra la card honesta con "antes de aceptarla, hablemos"',
    ],
  },
];

const ALL_USE_CASES_COUNT = SCENES.reduce((acc, s) => acc + s.useCases.length, 0);
const TARGET_TOTAL_MINUTES = SCENES.reduce((acc, s) => acc + s.targetMinutes, 0);

// ─────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────

export default function DemoFlow() {
  const navigate = useNavigate();
  const setRole = useAppStore((s) => s.setRole);
  const [activeIndex, setActiveIndex] = useState<number>(0);
  const [demoMode, setDemoModeState] = useState<boolean>(isDemoMode());
  const [completedIndexes, setCompletedIndexes] = useState<Set<number>>(new Set());

  function navigateToScene(scene: Scene, idx: number) {
    setRole(scene.role);
    setActiveIndex(idx);
    setCompletedIndexes((prev) => {
      const next = new Set(prev);
      next.add(idx);
      return next;
    });
    navigate(scene.route);
  }

  function toggleDemoMode() {
    const next = !demoMode;
    setDemoModeFlag(next);
    setDemoModeState(next);
  }

  function reset() {
    triggerReset();
    setActiveIndex(0);
    setCompletedIndexes(new Set());
  }

  return (
    <div className="max-w-shell mx-auto px-6 md:px-10 lg:px-16 py-10">
      <header className="mb-10">
        <Kicker>Modo presentador · ensayo de demo</Kicker>
        <PageTitle className="mt-3">Guión de la demostración</PageTitle>
        <p className="text-body-lg text-text-secondary mt-3 max-w-measure">
          Ocho escenas que cubren los {ALL_USE_CASES_COUNT} casos de uso del proyecto.
          Tiempo objetivo total: {TARGET_TOTAL_MINUTES} minutos. Cada escena tiene su
          guión sugerido, los clicks claves y el rol del shell.
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-10">
        <div>
          <Timer
            totalMinutes={TARGET_TOTAL_MINUTES}
            activeSceneTarget={SCENES[activeIndex].targetMinutes}
            activeSceneIndex={activeIndex}
          />

          <hr className="my-10 border-t border-border-hairline" />

          <SceneList
            scenes={SCENES}
            activeIndex={activeIndex}
            completed={completedIndexes}
            onSelect={navigateToScene}
          />

          <hr className="my-12 border-t border-border-hairline" />

          <AllViewsCatalog />
        </div>

        <ControlPanel
          demoMode={demoMode}
          onToggleDemoMode={toggleDemoMode}
          onReset={reset}
          completed={completedIndexes.size}
          total={SCENES.length}
        />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Timer
// ─────────────────────────────────────────────────────────────

function Timer({
  totalMinutes,
  activeSceneTarget,
  activeSceneIndex,
}: {
  totalMinutes: number;
  activeSceneTarget: number;
  activeSceneIndex: number;
}) {
  const [running, setRunning] = useState(false);
  const [totalSec, setTotalSec] = useState(0);
  const [sceneSec, setSceneSec] = useState(0);
  const prevSceneRef = useRef<number>(activeSceneIndex);

  useEffect(() => {
    if (prevSceneRef.current !== activeSceneIndex) {
      setSceneSec(0);
      prevSceneRef.current = activeSceneIndex;
    }
  }, [activeSceneIndex]);

  useEffect(() => {
    if (!running) return;
    const i = setInterval(() => {
      setTotalSec((s) => s + 1);
      setSceneSec((s) => s + 1);
    }, 1000);
    return () => clearInterval(i);
  }, [running]);

  function clearAll() {
    setRunning(false);
    setTotalSec(0);
    setSceneSec(0);
  }

  const totalTargetSec = totalMinutes * 60;
  const sceneTargetSec = activeSceneTarget * 60;
  const sceneOverTarget = sceneSec > sceneTargetSec;
  const totalOverTarget = totalSec > totalTargetSec;

  return (
    <section>
      <Kicker tone="muted" className="block mb-4">
        Cronómetro
      </Kicker>
      <Card padding="lg">
        <div className="grid grid-cols-2 gap-8">
          <div>
            <div className="text-caption uppercase tracking-[0.14em] text-text-muted">
              Total
            </div>
            <div
              className={cn(
                'text-stat-xl font-sans tabular-nums mt-1',
                totalOverTarget ? 'text-status-warning' : 'text-text-primary',
              )}
            >
              {formatTime(totalSec)}
            </div>
            <div className="text-caption text-text-muted mt-1">
              meta: {totalMinutes.toFixed(1).replace('.', ',')} min
            </div>
          </div>
          <div>
            <div className="text-caption uppercase tracking-[0.14em] text-text-muted">
              Escena actual
            </div>
            <div
              className={cn(
                'text-stat-xl font-sans tabular-nums mt-1',
                sceneOverTarget ? 'text-status-warning' : 'text-text-primary',
              )}
            >
              {formatTime(sceneSec)}
            </div>
            <div className="text-caption text-text-muted mt-1">
              meta: {activeSceneTarget.toFixed(1).replace('.', ',')} min
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 mt-6 pt-6 border-t border-border-hairline">
          <button
            type="button"
            onClick={() => setRunning((r) => !r)}
            className={cn(
              'inline-flex items-center gap-2 px-5 py-2.5 text-body-sm font-medium',
              'bg-accent text-text-inverse',
              'hover:bg-accent-muted transition-colors duration-base ease-out-soft',
            )}
          >
            {running ? <Pause size={14} /> : <Play size={14} />}
            {running ? 'Pausar' : totalSec === 0 ? 'Iniciar' : 'Reanudar'}
          </button>
          <button
            type="button"
            onClick={clearAll}
            className={cn(
              'inline-flex items-center gap-2 px-4 py-2.5 text-body-sm',
              'border border-border-hairline bg-bg-card text-text-secondary',
              'hover:border-text-primary hover:text-text-primary transition-all duration-base',
            )}
          >
            <Square size={12} />
            Reiniciar
          </button>
        </div>
      </Card>
    </section>
  );
}

function formatTime(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

// ─────────────────────────────────────────────────────────────
// Scene list
// ─────────────────────────────────────────────────────────────

function SceneList({
  scenes,
  activeIndex,
  completed,
  onSelect,
}: {
  scenes: Scene[];
  activeIndex: number;
  completed: Set<number>;
  onSelect: (s: Scene, idx: number) => void;
}) {
  return (
    <section>
      <SectionTitle rule={false}>Escenas en orden</SectionTitle>
      <ul className="mt-6 space-y-3">
        {scenes.map((scene, idx) => (
          <SceneRow
            key={scene.index}
            scene={scene}
            isActive={idx === activeIndex}
            isCompleted={completed.has(idx)}
            onSelect={() => onSelect(scene, idx)}
          />
        ))}
      </ul>
    </section>
  );
}

function SceneRow({
  scene,
  isActive,
  isCompleted,
  onSelect,
}: {
  scene: Scene;
  isActive: boolean;
  isCompleted: boolean;
  onSelect: () => void;
}) {
  const [expanded, setExpanded] = useState(isActive);

  useEffect(() => {
    if (isActive) setExpanded(true);
  }, [isActive]);

  return (
    <li>
      <Card
        padding="lg"
        className={cn(
          'transition-all duration-base',
          isActive && 'border-accent/40',
        )}
      >
        <div className="flex items-start justify-between gap-4">
          <button
            type="button"
            onClick={() => setExpanded((e) => !e)}
            className="flex-1 text-left flex items-start gap-4 focus:outline-none"
            aria-expanded={expanded}
          >
            <span
              className={cn(
                'text-kicker tabular-nums shrink-0 w-7 pt-1',
                isActive ? 'text-accent' : isCompleted ? 'text-text-primary' : 'text-text-muted',
              )}
            >
              {String(scene.index).padStart(2, '0')}
            </span>
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-3 flex-wrap">
                <span className="text-h3 text-text-primary">{scene.title}</span>
                {isCompleted && !isActive && (
                  <CheckCircle2 size={14} className="text-status-success" />
                )}
              </div>
              <div className="text-body-sm text-text-secondary mt-1">
                {scene.route} · rol {scene.role} ·{' '}
                <span className="tabular-nums">
                  {scene.targetMinutes.toFixed(1).replace('.', ',')} min
                </span>{' '}
                · {scene.useCases.length} caso{scene.useCases.length === 1 ? '' : 's'}
              </div>
            </div>
          </button>
          <button
            type="button"
            onClick={onSelect}
            className={cn(
              'inline-flex items-center gap-2 px-4 py-2 text-body-sm font-medium shrink-0',
              'bg-accent text-text-inverse',
              'hover:bg-accent-muted transition-colors duration-base',
            )}
          >
            Ir
            <ChevronRight size={14} />
          </button>
        </div>

        {expanded && (
          <div className="mt-6 pt-6 border-t border-border-hairline space-y-6 animate-fade-in">
            <section>
              <Kicker tone="muted" className="block mb-3">
                Casos de uso cubiertos
              </Kicker>
              <ul className="space-y-3">
                {scene.useCases.map((uc) => (
                  <li key={uc.id} className="flex gap-3">
                    <Pill variant="neutral" size="sm">
                      Caso {uc.id}
                    </Pill>
                    <div className="flex-1 min-w-0">
                      <div className="text-body-sm text-text-primary font-medium">
                        {uc.title}
                      </div>
                      <div className="text-body-sm text-text-secondary mt-0.5">
                        {uc.brief}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </section>

            <section>
              <Kicker tone="muted" className="block mb-3">
                Qué decir
              </Kicker>
              <p className="text-body text-text-primary leading-relaxed max-w-measure">
                {scene.whatToSay}
              </p>
            </section>

            <section>
              <Kicker tone="muted" className="block mb-3">
                Qué clickear (en orden)
              </Kicker>
              <ol className="space-y-2">
                {scene.whatToClick.map((step, i) => (
                  <li key={i} className="flex gap-3">
                    <span className="text-kicker text-accent-muted shrink-0 w-6 tabular-nums">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <span className="text-body-sm text-text-secondary">{step}</span>
                  </li>
                ))}
              </ol>
            </section>
          </div>
        )}
      </Card>
    </li>
  );
}

// ─────────────────────────────────────────────────────────────
// Control panel
// ─────────────────────────────────────────────────────────────

function ControlPanel({
  demoMode,
  onToggleDemoMode,
  onReset,
  completed,
  total,
}: {
  demoMode: boolean;
  onToggleDemoMode: () => void;
  onReset: () => void;
  completed: number;
  total: number;
}) {
  return (
    <aside>
      <Card padding="lg" className="space-y-8 sticky top-6">
        <div>
          <Kicker tone="muted" className="block mb-3">
            Progreso
          </Kicker>
          <div className="flex items-baseline gap-2">
            <span className="text-stat-xl font-sans tabular-nums text-text-primary">
              {completed}
            </span>
            <span className="text-body-lg text-text-muted tabular-nums">/ {total}</span>
          </div>
          <div className="text-caption text-text-muted mt-1">escenas visitadas</div>
        </div>

        <section className="space-y-3 pt-6 border-t border-border-hairline">
          <div className="flex items-start justify-between gap-3">
            <div>
              <Kicker tone="muted" className="block">
                Modo demo
              </Kicker>
              <p className="text-body-sm text-text-secondary mt-1">
                Activa el fallback de cache para respuestas críticas si la API tarda
                más de 4 segundos. Sin impacto visual perceptible.
              </p>
            </div>
            <Toggle on={demoMode} onClick={onToggleDemoMode} />
          </div>
          {demoMode && (
            <div className="inline-flex items-center gap-2 text-caption text-accent">
              <Zap size={11} />
              Cache fallback activado
            </div>
          )}
        </section>

        <section className="space-y-3 pt-6 border-t border-border-hairline">
          <Kicker tone="muted" className="block">
            Reset entre demos
          </Kicker>
          <p className="text-body-sm text-text-secondary">
            Vuelve todo a su estado inicial (sin recargar la página). Borra
            derivaciones, casos creados desde audio, onboarding en curso.
          </p>
          <button
            type="button"
            onClick={onReset}
            className={cn(
              'w-full inline-flex items-center justify-center gap-2 px-5 py-2.5 text-body-sm font-medium',
              'border border-border-hairline bg-bg-card text-text-primary',
              'hover:border-accent hover:text-accent',
              'transition-all duration-base ease-out-soft',
            )}
          >
            <RotateCcw size={14} />
            Resetear estado
          </button>
        </section>

        <section className="pt-6 border-t border-border-hairline">
          <Kicker tone="muted" className="block mb-3">
            Atajos
          </Kicker>
          <p className="text-caption text-text-muted leading-relaxed">
            Cada escena cambia el rol del shell automáticamente. Si algo se siente
            roto a la mitad, ↺ Reset y empezás limpio.
          </p>
        </section>
      </Card>
    </aside>
  );
}

function Toggle({ on, onClick }: { on: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={onClick}
      className={cn(
        'relative inline-flex h-6 w-11 items-center transition-colors duration-base',
        'shrink-0 rounded-full',
        on ? 'bg-accent' : 'bg-border-hairline',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:ring-offset-2',
      )}
    >
      <span
        aria-hidden
        className={cn(
          'inline-block h-5 w-5 transform rounded-full bg-bg-card transition-transform duration-base',
          on ? 'translate-x-5' : 'translate-x-0.5',
        )}
      />
    </button>
  );
}

// ─────────────────────────────────────────────────────────────
// AllViewsCatalog
// Catalog of every view in the POC with description + direct link.
// Use this to navigate to any view without going through the scripted demo flow.
// ─────────────────────────────────────────────────────────────

interface ViewEntry {
  route: string;
  title: string;
  description: string;
  role: 'cliente' | 'ejecutivo' | 'backoffice' | 'inmobiliaria' | 'jefatura' | 'operaciones' | 'gobierno';
  isNew?: boolean;
}

interface ViewGroup {
  title: string;
  description: string;
  views: ViewEntry[];
}

const VIEW_CATALOG: ViewGroup[] = [
  {
    title: 'Cliente · Operación Post-Aprobación (foco principal)',
    description:
      'El recorrido principal del cliente después de que la hipoteca fue aprobada. Gestión documental, reparos y tracking dual.',
    views: [
      {
        route: '/cliente/seguimiento',
        title: 'Mi hipoteca · Vista principal',
        description:
          'Punto de entrada del POC. Hipoteca ya aprobada. Selector Nueva/Usada, gate de pago de gastos operacionales, dos tracks paralelos (Estudio de Títulos + Carpeta Comercial), notificaciones con acción.',
        role: 'cliente',
        isNew: true,
      },
      {
        route: '/cliente/credito',
        title: 'Detalles del crédito',
        description:
          'Vista expandida del crédito: monto, plazo, tasa, dividendo, timeline de la operación y stepper de 7 etapas.',
        role: 'cliente',
      },
      {
        route: '/cliente/mis-documentos',
        title: 'Mis documentos',
        description:
          'Subida de documentos en cualquier formato. Voz del portal explica reparos en idioma corriente.',
        role: 'cliente',
      },
    ],
  },
  {
    title: 'Cliente · Flujo Pre-Aprobación (extra-agregado)',
    description:
      `Vistas del flujo previo a la aprobación de la hipoteca: simulación conversacional con ${BRAND.assistantName}, cotización, propiedad. Disponible como funcionalidad adicional.`,
    views: [
      {
        route: '/cliente/simulacion-pre',
        title: `Onboarding con ${BRAND.assistantName}`,
        description:
          `Conversación natural con ${BRAND.assistantName}, la asistente IA. Captura datos del cliente y arma el caso. Streaming en vivo.`,
        role: 'cliente',
      },
      {
        route: '/cliente/propiedad',
        title: 'Datos de la propiedad',
        description:
          `Formulario directo de propiedad como alternativa a la conversación. Precarga lo que ${BRAND.assistantName} capturó.`,
        role: 'cliente',
      },
      {
        route: '/cliente/documentos',
        title: 'Documentos auto-validados',
        description:
          'Tres secciones: documentos rescatados automáticamente, en búsqueda y pendientes. Upload con extracción IA en vivo.',
        role: 'cliente',
      },
      {
        route: '/cliente/simulacion',
        title: 'Simulación de escenarios',
        description:
          'Tres escenarios estándar (20/25/30 años) o cuatro si el cliente conversó un plazo personalizado.',
        role: 'cliente',
      },
      {
        route: '/cliente/confirmado',
        title: 'Confirmación final',
        description:
          'El cliente acepta el escenario y queda en pre-aprobación. Cierre del journey conversacional.',
        role: 'cliente',
      },
    ],
  },
  {
    title: `Ejecutivo del Banco · ${BRAND.shortName}`,
    description:
      'Vistas para la ejecutiva Camila Reinoso. Cockpit con control de documentos, lanzamiento de reparos y sesión en vivo con cliente.',
    views: [
      {
        route: '/ejecutivo',
        title: 'Cockpit del ejecutivo',
        description:
          'Pipeline de casos en curso. Banner de captura en vivo del cliente. Panel de control de documentos: aprobar o lanzar reparos sobre lo subido.',
        role: 'ejecutivo',
        isNew: true,
      },
      {
        route: '/ejecutivo/audio',
        title: 'Sesión con cliente · Audio',
        description:
          'Sesión en vivo con cliente y co-titular. Transcripción y copilot del ejecutivo durante la llamada. Extra-agregado.',
        role: 'ejecutivo',
      },
    ],
  },
  {
    title: 'Actores externos del proceso',
    description:
      'Portales para vendedor particular e inmobiliaria. Cada uno ve solo sus documentos y reparos. Cambia según tipo de propiedad (Usada/Nueva).',
    views: [
      {
        route: '/vendedor',
        title: 'Portal del Vendedor',
        description:
          'Si la propiedad es USADA, el vendedor sube los documentos legales (certificados de dominio, gravámenes, etc.). Ve reparos pendientes que el banco lanzó.',
        role: 'cliente',
        isNew: true,
      },
      {
        route: '/inmobiliaria/proyectos',
        title: 'Portal de la Inmobiliaria',
        description:
          'Si la propiedad es NUEVA, la inmobiliaria sube los documentos del proyecto (permiso de edificación, recepción definitiva, etc.). Ve reparos pendientes.',
        role: 'inmobiliaria',
        isNew: true,
      },
      {
        route: '/inmobiliaria',
        title: 'Corredora inmobiliaria',
        description:
          'Portal original de la corredora con casos asociados a sus propiedades en venta.',
        role: 'inmobiliaria',
      },
    ],
  },
  {
    title: 'Operación interna · Banco',
    description:
      `Vistas de áreas internas ${BRAND.shortName}: back office, operaciones, jefatura de producto y gobierno tecnológico.`,
    views: [
      {
        route: '/backoffice',
        title: 'Back office · Dashboard',
        description:
          'Casos pendientes de validación back office. Operaciones que requieren revisión humana especializada.',
        role: 'backoffice',
      },
      {
        route: '/operaciones',
        title: 'Operaciones',
        description:
          'Vista del responsable de operaciones del proceso hipotecario.',
        role: 'operaciones',
      },
      {
        route: '/jefatura',
        title: 'Vista Ejecutiva de Producto',
        description:
          'Dashboard de jefatura: SLA, cuellos de botella, conversión, abandono.',
        role: 'jefatura',
      },
      {
        route: '/governance',
        title: 'Tecnología y Riesgo',
        description:
          'Gobernanza tecnológica y de modelos IA. Trazabilidad de decisiones automatizadas.',
        role: 'gobierno',
      },
    ],
  },
  {
    title: 'Complementarios',
    description:
      'Vistas adicionales útiles durante la demo.',
    views: [
      {
        route: '/comparador',
        title: 'Comparador de ofertas',
        description:
          `Comparación honesta de ofertas ${BRAND.shortName} vs otros bancos. Muestra al ganador real, sin sesgo.`,
        role: 'cliente',
      },
    ],
  },
];

function AllViewsCatalog() {
  const navigate = useNavigate();
  const setRole = useAppStore((s) => s.setRole);

  function goTo(view: ViewEntry) {
    // Map view role to Role enum used by appStore
    const roleMap: Record<ViewEntry['role'], string> = {
      cliente: 'cliente',
      ejecutivo: 'ejecutivo',
      backoffice: 'backoffice',
      inmobiliaria: 'inmobiliaria',
      jefatura: 'jefatura',
      operaciones: 'operaciones',
      gobierno: 'gobierno',
    };
    setRole(roleMap[view.role] as any);
    navigate(view.route);
  }

  return (
    <section>
      <SectionTitle>Catálogo completo de vistas</SectionTitle>
      <p className="text-body text-text-secondary mt-2 max-w-measure">
        Acceso directo a cada vista del POC. Útil para revisar una sección específica
        sin pasar por el guión completo.
      </p>

      <div className="mt-8 space-y-10">
        {VIEW_CATALOG.map((group) => (
          <div key={group.title}>
            <div className="mb-4">
              <h3 className="text-h3 text-text-primary font-semibold">
                {group.title}
              </h3>
              <p className="text-body-sm text-text-secondary mt-1 max-w-measure">
                {group.description}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {group.views.map((view) => (
                <button
                  key={view.route}
                  type="button"
                  onClick={() => goTo(view)}
                  className={cn(
                    'group text-left p-4 border border-border-hairline bg-bg-card',
                    'hover:border-text-primary hover:shadow-soft',
                    'transition-all duration-base ease-out-soft',
                    'focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:ring-offset-2',
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-body font-semibold text-text-primary">
                          {view.title}
                        </h4>
                        {view.isNew && (
                          <Pill variant="error" size="sm">Nueva</Pill>
                        )}
                      </div>
                      <p className="text-body-sm text-text-secondary mt-1.5 leading-relaxed">
                        {view.description}
                      </p>
                      <code className="text-caption text-text-muted mt-2 inline-block font-mono">
                        {view.route}
                      </code>
                    </div>
                    <ChevronRight
                      size={16}
                      className="text-text-muted group-hover:text-accent group-hover:translate-x-1 transition-all flex-shrink-0 mt-0.5"
                    />
                  </div>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
