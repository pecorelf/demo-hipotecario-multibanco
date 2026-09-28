/**
 * Contenido de la presentación de entendimiento.
 *
 * Se separa de la vista para que la lámina y su navegación queden en un
 * archivo y el texto en otro: cambiar una frase no obliga a tocar la mecánica
 * de la presentación.
 */

import type { ReactNode } from 'react';
import {
  AlertTriangle,
  RefreshCw,
  Building2,
  Clock,
  Copy,
  FileStack,
  FileWarning,
  Mail,
  Search,
  ShieldCheck,
  Split,
  UserPlus,
} from 'lucide-react';

export const ETAPAS_TIEMPO = [
  { nombre: 'Pre venta', detalle: 'Origen y evaluación', peso: 22, rango: '18–20', tono: 'suave' },
  { nombre: 'Venta', detalle: 'Preparación y curse', peso: 39, rango: '35–40', tono: 'foco' },
  { nombre: 'Post venta', detalle: 'Conservador y desembolso', peso: 58, rango: '45–60', tono: 'oscuro' },
] as const;

/** Etapas ilustrativas: su número y su nombre cambian de banco en banco. */
export const ETAPAS_VISIBLES = [
  'Evaluación',
  'Cotización',
  'Antecedentes',
  'Tasación',
  'Escrituración',
  'Activación',
];

export const PASOS_OCULTOS = [
  'Solicitud de documentos',
  'Carga del cliente',
  'Revisión inicial',
  'Reparo',
  'Corrección',
  'Segunda revisión',
  'Validación de renta',
  'Visado',
];

export interface Friccion {
  icono: ReactNode;
  titulo: string;
  detalle: string;
}

export const FRICCIONES: Friccion[] = [
  {
    icono: <Search size={16} />,
    titulo: 'El cliente no sabe en qué va',
    detalle:
      'Ve una barra con las etapas principales, pero dentro de cada una hay pasos que no aparecen. Cuando quiere saber si avanzó, llama.',
  },
  {
    icono: <Mail size={16} />,
    titulo: 'Los reparos viajan por correo',
    detalle:
      'El motivo viene en lenguaje técnico, dentro de un hilo con cinco personas en copia. El cliente reenvía a su cónyuge, que reenvía al vendedor.',
  },
  {
    icono: <FileStack size={16} />,
    titulo: 'Cerca de 25 documentos por operación',
    detalle:
      'En una operación con subsidio, la cantidad de antecedentes que se pide hace muy probable que al menos uno vuelva observado.',
  },
  {
    icono: <Copy size={16} />,
    titulo: 'El mismo dato se pide varias veces',
    detalle:
      'Renta, estado civil y datos de la propiedad se vuelven a pedir en cada etapa, porque cada sistema guarda su propia copia.',
  },
  {
    icono: <Building2 size={16} />,
    titulo: 'El vendedor y la inmobiliaria quedan fuera',
    detalle:
      'Aportan documentos decisivos del inmueble y no tienen dónde subirlos: se los mandan al ejecutivo, que los reenvía.',
  },
  {
    icono: <Split size={16} />,
    titulo: 'Las tareas avanzan en fila',
    detalle:
      'La tasación espera a los antecedentes y el estudio de títulos espera a la tasación, aunque no dependan entre sí.',
  },
  {
    icono: <UserPlus size={16} />,
    titulo: 'El co-titular depende del titular',
    detalle:
      'El cónyuge entrega lo suyo a través de su pareja, que termina haciendo de mensajero entre dos personas y el banco.',
  },
  {
    icono: <RefreshCw size={16} />,
    titulo: 'El reproceso es parte del método',
    detalle:
      'El checklist se arma a mano, los documentos llegan por correo y de forma presencial, y la carpeta vuelve por falta de un antecedente o por inconsistencia entre dos.',
  },
  {
    icono: <AlertTriangle size={16} />,
    titulo: 'El error se descubre tarde',
    detalle:
      'Un documento mal presentado se detecta cuando alguien ya lo revisó, o cuando el conservador lo rechaza.',
  },
];

/** Procedencia de las cifras. Se muestra al pie de las láminas que las usan. */
export const FUENTE = 'Análisis experto de Deloitte Digital sobre más de seis bancos de la plaza, con entrevistas a equipos de operaciones y comerciales, y levantamiento del proceso de punta a punta.';

export const TAREAS_EJECUTIVO = [
  { tarea: 'Perseguir documentos al cliente', carga: 26 },
  { tarea: 'Explicar reparos por teléfono y correo', carga: 22 },
  { tarea: 'Coordinar con vendedor, inmobiliaria y notaría', carga: 18 },
  { tarea: 'Rehacer y reenviar antecedentes', carga: 14 },
  { tarea: 'Consultar el estado en varios sistemas', carga: 11 },
  { tarea: 'Vender', carga: 9 },
];

export const TIPOLOGIAS = [
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

export const ACTORES = [
  { nombre: 'Cliente', necesidad: 'Saber en qué va su operación sin tener que preguntar, y entender qué le falta en lenguaje corriente.', prioritario: true },
  { nombre: 'Ejecutivo', necesidad: 'Ver el estado real de su cartera y dedicar el tiempo a vender, no a perseguir documentos.', prioritario: true },
  { nombre: 'Operaciones', necesidad: 'Trabajar sobre datos validados en lugar de revisar documentos uno por uno.', prioritario: true },
  { nombre: 'Co-titular', necesidad: 'Aportar sus propios antecedentes sin depender del titular, y con la misma visibilidad que él.', prioritario: true, nuevo: true },
  { nombre: 'Inmobiliaria', necesidad: 'Seguir sus operaciones en curso y compartir la documentación del proyecto una sola vez.', prioritario: false },
  { nombre: 'Corredor', necesidad: 'Acompañar la operación con visibilidad, sin depender de llamadas al ejecutivo.', prioritario: false },
  { nombre: 'Vendedor', necesidad: 'Compartir sus antecedentes de forma simple y saber cuándo recibe el pago, sin depender del ejecutivo del comprador.', prioritario: false, nuevo: true },
];

/**
 * Cómo se diseña y sobre qué se construye.
 *
 * Es la pregunta que aparece en toda conversación técnica: qué tecnología hay
 * debajo y a qué queda amarrado el banco si avanza.
 */
export const STACK = {
  nube: ['AWS', 'Microsoft Azure', 'Google Cloud'],
  plataformas: ['ServiceNow', 'Salesforce', 'Modyo'],
  desarrollo: ['Angular', 'React', 'Java / Spring'],
  modelos: ['Modelos de frontera', 'Modelos propios', 'Modelos abiertos'],
};

export const TECNOLOGIA = [
  {
    titulo: 'Flujos agénticos, no un formulario con IA encima',
    detalle:
      'La operación se descompone en tareas, y cada una la resuelve un agente con un objetivo acotado: leer un documento, verificar una consistencia, redactar una instrucción. El flujo se arma según el caso, en vez de recorrer siempre la misma secuencia.',
  },
  {
    titulo: 'Desacoplado del modelo',
    detalle:
      'Los agentes no dependen de un proveedor de IA en particular. Se usan modelos de frontera donde aportan, y modelos propios o abiertos donde el dato no puede salir del perímetro. Cambiar de modelo no obliga a rehacer el proceso.',
  },
  {
    titulo: 'Multinube y sobre la infraestructura del banco',
    detalle:
      'El diseño no asume una nube determinada. Se despliega donde el banco ya opera, dentro de su arquitectura, sus ambientes y sus repositorios, respetando sus políticas de seguridad y de datos.',
  },
  {
    titulo: 'Integración con el workflow actual',
    detalle:
      'No reemplaza el motor de procesos que el banco ya tiene ni obliga a migrar antes de empezar. Se integra por interfaces con lo que existe, y deja la puerta abierta a evolucionarlo cuando el banco lo decida.',
  },
];

export const PRINCIPIOS = [
  { n: '01', titulo: 'Tareas dinámicas y no secuenciales', detalle: 'El recorrido se arma según lo que cada caso necesita resolver, y lo que no tiene dependencia real se ejecuta en paralelo.' },
  { n: '02', titulo: 'Trazabilidad end to end', detalle: 'Estado, avance y responsable visibles en tiempo real, para todos los que intervienen en la operación.' },
  { n: '03', titulo: 'Punto único de interacción', detalle: 'Interacciones, documentación y solicitudes en una sola plataforma, sin dispersión de información.' },
  { n: '04', titulo: 'Ecosistema conectado', detalle: 'Clientes, ejecutivos, proveedores y áreas internas trabajando sobre el mismo flujo, de punta a punta.' },
  { n: '05', titulo: 'Trabajo digital automatizado', detalle: 'Lo que hoy se resuelve a mano y por correo pasa a ejecutarse solo, con cada decisión registrada y explicada.' },
  { n: '06', titulo: 'IA y datos desde el diseño', detalle: 'La inteligencia artificial y los datos entran en el diseño desde el primer día, no como una capa agregada al final.' },
];

export const PALANCAS = [
  { titulo: 'Prevenir el reparo', detalle: 'La IA validará el documento al momento de cargarlo, y no después.' },
  { titulo: 'Trabajadores Digitales', detalle: 'Software que ejecuta el trabajo de oficina de punta a punta: entra a los sistemas, busca en fuentes públicas, completa formularios y deja registro. Usa IA donde hace falta criterio, y reglas donde el paso es determinístico.' },
  { titulo: 'Consolidación documental', detalle: 'Un solo repositorio, y no pediremos dos veces lo mismo.' },
  { titulo: 'Tareas en paralelo', detalle: 'Lo que no tenga dependencia real dejará de esperar su turno.' },
];

export const FRONT = [
  { titulo: 'El viaje deja de ser una fila', detalle: 'La necesidad del cliente se descompone en tareas que avanzan en paralelo, cada una resuelta por un agente especializado.' },
  { titulo: 'La validación ocurre al cargar', detalle: 'El documento se revisa cuando el cliente lo sube. Si hay una observación, se explica en lenguaje corriente y con la instrucción precisa.' },
  { titulo: 'Todos los actores en el mismo flujo', detalle: 'Cliente, ejecutivo, operaciones, vendedor, inmobiliaria y co-titular sobre la misma operación, cada uno con su vista y sus permisos.' },
  { titulo: 'El cliente conoce y entiende su próxima acción en todo momento', detalle: 'Una sola acción visible, explicada en lenguaje corriente, con el plazo comprometido y quién tiene la responsabilidad en ese tramo.' },
];

export const TRANSVERSAL = [
  {
    titulo: 'Cobertura de todas las etapas',
    detalle:
      'Hay tecnología desarrollada y en operación para cada etapa del proceso: pre firma, legal, firma y post firma. No es un piloto sobre un tramo, es la cadena completa.',
  },
  {
    titulo: 'Automatización de tareas',
    detalle:
      'Lo repetitivo se ejecuta solo y con verificación de resultado: si un paso falla, se reintenta y, si no se resuelve, se avisa a una persona con el caso identificado.',
  },
  {
    titulo: 'Identificación documental',
    detalle:
      'El sistema reconoce qué documento es cada archivo que llega, lo asocia a la operación y lo contrasta con lo que esa tipología exige. En cualquier momento se sabe qué está, qué falta y qué está observado.',
  },
  {
    titulo: 'Trazabilidad de punta a punta',
    detalle:
      'Cada lectura, cada escritura y cada decisión queda registrada con su hora y su responsable, de modo que reconstruir una operación no dependa de leer un hilo de correo.',
  },
];

export const BACK = [
  { titulo: 'Trabajadores Digitales en lugar de manos', detalle: 'No son un chat ni un modelo suelto: son procesos que operan los sistemas como lo haría una persona. Rescatan certificados de fuentes públicas, cuadran montos, consultan el conservador y dejan bitácora de cada paso.' },
  { titulo: 'La persona autoriza, la máquina escribe', detalle: 'Un abogado revisa el compilado contra los datos que se van a escribir. Después la escritura es automática, campo por campo, con reintentos.' },
  { titulo: 'Monitoreo permanente', detalle: 'Robots que verifican la disponibilidad de los sistemas y que cada tarea terminó como debía. Si algo falla, se detecta antes de que alguien lo reclame.' },
  { titulo: 'La base del proyecto se valida una vez', detalle: 'En el negocio encadenado, la base de escrituración se revisa al incorporar el proyecto y el resultado se hereda a todas las unidades.' },
];

export const COSTOS_CORREO = [
  'No hay trazabilidad: reconstruir qué pasó con una operación implica leer un hilo.',
  'No hay centralización: la información vive en el buzón de una persona.',
  'Si esa persona sale de vacaciones o con licencia, la operación se detiene.',
  'Nadie sabe cuánto lleva esperando un reparo, porque no hay reloj.',
  'El cliente recibe jerga técnica, escrita para otro destinatario.',
];

export interface Capacidad {
  icono: ReactNode;
  titulo: string;
  porque: string;
  que: string;
}

export const VISION: Capacidad[] = [
  {
    icono: <UserPlus size={16} />,
    titulo: 'Co-titular con acceso propio',
    porque:
      'Hoy el cónyuge entrega sus documentos a través del titular, que hace de intermediario entre dos personas y el banco. Cada traspaso agrega días.',
    que: 'Entra por su propio enlace, verifica su identidad y comparte lo suyo directamente. El banco rescata de fuentes públicas lo que puede conseguir solo.',
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
    icono: <Clock size={16} />,
    titulo: 'Reloj de compromiso',
    porque:
      'La fecha que se le prometió al cliente vive en la cabeza del ejecutivo. Cuando se pasa, nadie se entera hasta que el cliente reclama.',
    que: 'Cada caso muestra la fecha comprometida, cuántos días faltan y qué área tiene la responsabilidad en ese momento. Si el plazo se vence, el caso aparece solo en la lista de la jefatura.',
  },
];
