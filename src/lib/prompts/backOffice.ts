import { BRAND } from '@/lib/brand';

export const BACKOFFICE_INSIGHT_SYSTEM = `Eres un asistente de operaciones para el equipo de back office hipotecario de ${BRAND.name}. Tu interlocutora es la jefa de operaciones del back office.

Recibirás un snapshot del dashboard operativo: estadísticas globales, cuellos de botella por fase, top razones de rechazo del mes, y productividad del equipo. Tu trabajo: identificar UNA observación accionable de alta señal y proponer una acción concreta.

REGLAS DE FORMATO:
- Tres párrafos cortos separados por una línea en blanco. NO uses bullets, headers, ni negritas.
- Párrafo 1 (1-2 frases): observación del patrón con cifras específicas.
- Párrafo 2 (1-2 frases): hipótesis o causa probable.
- Párrafo 3 (1-2 frases): acción concreta recomendada, incluyendo quién la ejecuta.
- Sin saludos, sin cierres, sin emojis, sin exclamaciones.
- Tono: ejecutiva senior haciendo briefing a directora — directa, concisa, sin adornos.
- Privilegia patrones cross-card: cuando un cuello de botella se conecta con una razón de rechazo, o cuando un ejecutivo bajo en productividad se relaciona con un tipo de caso específico.`;

export interface DashboardSnapshot {
  activeCases: number;
  slaAtRisk: number;
  avgTimeDays: number;
  targetTimeDays: number;
  conversion: number;
  abandonment: number;
  abandonmentDelta: number;
  bottlenecks: Array<{
    phase: string;
    cases: number;
    avgDays: number;
    targetDays: number;
    overSlaPct: number;
  }>;
  topRejections: Array<{ reason: string; count: number }>;
  team: Array<{
    name: string;
    closedThisWeek: number;
    avgDays: number;
    satisfaction: number;
  }>;
  derivationsPending: number;
}

export function buildBackOfficeInsightPrompt(snap: DashboardSnapshot): string {
  const bottlenecksTxt = snap.bottlenecks
    .map(
      (b) =>
        `  - ${b.phase}: ${b.cases} casos · promedio ${b.avgDays} días (meta ${b.targetDays}) · ${Math.round(b.overSlaPct * 100)}% fuera de SLA`,
    )
    .join('\n');
  const rejectionsTxt = snap.topRejections
    .map((r, i) => `  ${i + 1}. ${r.reason} (${r.count})`)
    .join('\n');
  const teamTxt = snap.team
    .map(
      (t) =>
        `  - ${t.name}: ${t.closedThisWeek} cerrados/sem · ${t.avgDays} días prom · ${t.satisfaction.toFixed(1)}/5 NPS`,
    )
    .join('\n');

  return `Snapshot del dashboard operativo:

Métricas globales:
- Casos activos: ${snap.activeCases}
- SLA en riesgo: ${snap.slaAtRisk}
- Tiempo promedio actual: ${snap.avgTimeDays} días (meta: ${snap.targetTimeDays} días)
- Conversión: ${Math.round(snap.conversion * 100)}%
- Abandono este mes: ${snap.abandonment} casos (${snap.abandonmentDelta > 0 ? '+' : ''}${snap.abandonmentDelta} vs mes pasado)
- Derivaciones del ejecutivo pendientes de revisión: ${snap.derivationsPending}

Cuellos de botella por fase:
${bottlenecksTxt}

Top razones de rechazo del mes:
${rejectionsTxt}

Productividad del equipo (semana en curso):
${teamTxt}

Genera la observación ahora siguiendo las reglas indicadas.`;
}
