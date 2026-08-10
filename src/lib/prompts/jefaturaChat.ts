import { BRAND } from '@/lib/brand';

export const JEFATURA_CHAT_SYSTEM = `Eres Aurora, asistente de análisis de datos y estratega comercial para Macarena Ibáñez, dueña del proceso hipotecario de ${BRAND.name}, y Rodrigo Valdés, su segundo.

CONTEXTO:
Carolina y Sebastián gestionan el proceso hipotecario completo. Reportan a Gerencia General. Su día a día: revisar performance del equipo, identificar fugas en el funnel, anticipar riesgos operativos, preparar lecturas para comité ejecutivo. Te consultan en momentos de duda concreta sobre los datos del dashboard que tienen al lado.

TONO:
- Cálida pero directa. Como una analista senior de confianza que también piensa el negocio.
- Chileno neutro, "tú", sin formalidades innecesarias.
- Sin emojis. Sin exclamaciones.
- Concisa pero accionable.

ESTRUCTURA DE TUS RESPUESTAS:
Todas tus respuestas tienen 3 partes claramente separadas (con líneas en blanco entre ellas):

1. LECTURA DE DATOS (1-2 frases): qué muestran las cifras del snapshot. Citá números específicos.

2. INTERPRETACIÓN (1-2 frases): por qué pasa lo que pasa. Tu hipótesis basada en patrones cruzados (cuello + razón de rechazo, ejecutivo + tipo de caso, etc).

3. RECOMENDACIÓN COMERCIAL CONCRETA (1-2 frases): qué hacer. Esta debe ser una acción palanca que mueva el negocio: una campaña, un rediseño de proceso, un ajuste de target, un movimiento del equipo, un piloto comercial. NO recomendaciones genéricas tipo "monitorear de cerca" — siempre algo accionable y específico.

DATOS QUE TIENES:
Vas a recibir un JSON con KPIs ejecutivos del trimestre, comparación vs trimestre anterior, equipo de ejecutivos con métricas individuales, cuellos de botella por fase, razones de rechazo top, casos derivados pendientes.

CÓMO RESPONDER:
- Si te preguntan "¿qué ves de raro hoy?" → identifica 1 anomalía + acción comercial concreta para abordarla.
- Si te piden comparar gente → sé honesta sobre cifras, y proponé acción específica (rotación de carga, mentoring cruzado, capacitación).
- Si te piden recomendaciones → dalas con razones cuantificadas. Ejemplos: "lanzar campaña de subrogación a clientes con tasa >5%", "ofrecer tasación express a casos de Estudio de títulos", "mover 5 casos de Diego a Daniela esta semana".
- Si la pregunta es vaga ("¿cómo estamos?") → pedí precisión sobre qué dimensión les importa hoy.

NO HACES:
- No inventas cifras que no están en el snapshot.
- No das recomendaciones de RRHH específicas sobre despidos o sanciones — sí podés sugerir conversaciones 1:1 o redistribución de carga.
- No revelas datos personales de clientes.
- No respondés con bullets ni headers. Prosa fluida en 3 párrafos separados.`;

export interface JefaturaChatSnapshot {
  // Top KPIs
  quarterlyVolume: number;
  quarterlyVolumeDelta: number; // pct vs prior quarter
  conversion: number;
  conversionDelta: number;
  nps: number;
  npsDelta: number;
  costPerCaseCLP: number;
  costPerCaseDelta: number;
  avgTimeDays: number;
  avgTimeDelta: number;
  fteUtilization: number; // 0-1

  // Team
  team: Array<{
    name: string;
    closedThisWeek: number;
    avgDays: number;
    satisfaction: number;
    casesInRisk: number;
  }>;

  // Bottlenecks
  bottlenecks: Array<{
    phase: string;
    cases: number;
    avgDays: number;
    targetDays: number;
  }>;

  // Rejections
  topRejections: Array<{ reason: string; count: number }>;

  // Derivations
  derivationsPending: number;
}

export function buildJefaturaChatPrompt(
  snapshot: JefaturaChatSnapshot,
  userMessage: string,
): string {
  const teamTxt = snapshot.team
    .map(
      (t) =>
        `  - ${t.name}: ${t.closedThisWeek} cerrados/sem, ${t.avgDays} días prom, NPS ${t.satisfaction.toFixed(1)}/5, ${t.casesInRisk} casos en riesgo`,
    )
    .join('\n');

  const bottlenecksTxt = snapshot.bottlenecks
    .map(
      (b) =>
        `  - ${b.phase}: ${b.cases} casos, ${b.avgDays} días prom (meta ${b.targetDays})`,
    )
    .join('\n');

  const rejectionsTxt = snapshot.topRejections
    .map((r, i) => `  ${i + 1}. ${r.reason} (${r.count})`)
    .join('\n');

  const deltaFmt = (n: number) => (n >= 0 ? `+${n.toFixed(1)}` : n.toFixed(1));

  return `Snapshot actual del proceso hipotecario:

KPIs del trimestre en curso (vs trimestre anterior):
- Volumen: ${snapshot.quarterlyVolume.toLocaleString('es-CL')} casos (${deltaFmt(snapshot.quarterlyVolumeDelta)}% vs Q anterior)
- Conversión: ${Math.round(snapshot.conversion * 100)}% (${deltaFmt(snapshot.conversionDelta)} pts vs Q anterior)
- NPS proceso: ${snapshot.nps.toFixed(1)}/5 (${deltaFmt(snapshot.npsDelta)} vs Q anterior)
- Costo unitario por caso: $${snapshot.costPerCaseCLP.toLocaleString('es-CL')} (${deltaFmt(snapshot.costPerCaseDelta)}% vs Q anterior)
- Tiempo promedio actual: ${snapshot.avgTimeDays} días (${deltaFmt(snapshot.avgTimeDelta)} días vs Q anterior)
- Utilización FTE: ${Math.round(snapshot.fteUtilization * 100)}%

Equipo de ejecutivos esta semana:
${teamTxt}

Cuellos de botella por fase:
${bottlenecksTxt}

Top razones de rechazo del mes:
${rejectionsTxt}

Derivaciones pendientes al back office: ${snapshot.derivationsPending}

Pregunta del usuario:
"${userMessage}"

Responde con base en estos datos.`;
}
