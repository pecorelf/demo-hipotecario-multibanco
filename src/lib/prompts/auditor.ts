import type { TimelineEvent } from '@/types';
import { BRAND } from '@/lib/brand';

export const AUDITOR_SYSTEM = `Eres el motor de decisiones del proceso hipotecario de ${BRAND.name}, en modo explicación regulatoria.

Tu trabajo es explicar, ante un regulador externo o un auditor interno, por qué se tomó una decisión automatizada en un caso de crédito hipotecario.

Tono: técnico-formal, claro, sin jerga innecesaria. Cuando uses términos técnicos (DTI, score, biométrico, cruce bureau, etc.), explica brevemente entre paréntesis si no son obvios.

Estructura tu respuesta en cuatro párrafos cortos, en este orden:
1. Qué reglas, umbrales o señales activaron la decisión.
2. Qué datos fueron determinantes (cita las cifras concretas si están disponibles en el contexto).
3. Por qué la decisión es defendible ante una auditoría (referenciar política aplicable cuando corresponda).
4. Bajo qué condiciones específicas se revisaría o revertiría la decisión.

No uses bullets, headers, listas ni numeración en la respuesta final. Prosa fluida. Máximo cuatro párrafos cortos. No menciones que estás respondiendo a un prompt. No incluyas saludos ni cierres.`;

const POLICIES = `Políticas y umbrales vigentes:
- Pre-aprobación automática: DTI proyectado ≤ 32% y score interno ≥ 700 (rango 300-900).
- Validación de identidad: confianza match biométrico contra Registro Civil ≥ 0,95 + cédula vigente.
- Validación de ingreso (dependiente): cruce de liquidación con Previred, coincidencia exacta de empleador, variabilidad mensual < 15%.
- Validación de ingreso (independiente): cruce SII F22 + boletas Previred, ventana mínima 12 meses, recomendación de extender a 24 meses si desviación estándar > 25%.
- Cruce con CMF: bureau interno y reportes vigentes, sin moras > 30 días, deuda consolidada cuantificada en UF y CLP.
- Observación de IA: gatilla recomendación al ejecutivo, no es decisión vinculante.`;

const CASE_CONTEXT = `Caso #HIP-2026-0042
Titular: ${BRAND.buyerName} (dependiente Servicios Andinos Limitada, renta líquida declarada $2.450.000)
Co-titular: María José Contreras (independiente, consultora · honorarios variables, promedio $3.400.000)
Propiedad: casa Av. Vitacura 2950, valor declarado UF 6.800, vendedor Inmobiliaria Los Almendros
Operación: monto solicitado UF 4.760, pie UF 2.040 (30%), plazo 25 años, tasa 4.65% anual
Cruce con Previred (12 meses): promedio cotizado $2.080.000 — brecha 17,8% bajo análisis`;

export interface AuditorPromptInput {
  event: TimelineEvent;
  priorEvents: TimelineEvent[];
}

function compactEvent(e: TimelineEvent): string {
  const meta = e.metadata ? ` · metadata: ${JSON.stringify(e.metadata)}` : '';
  const detail = e.detail ? ` · ${e.detail}` : '';
  return `[${e.timestamp}] ${e.actor.kind}${e.actor.name ? ' (' + e.actor.name + ')' : ''} · ${e.type} · ${e.title}${detail}${meta}`;
}

export function buildAuditorPrompt({ event, priorEvents }: AuditorPromptInput): string {
  const priorBlock = priorEvents.length
    ? priorEvents.map(compactEvent).join('\n')
    : '(sin eventos previos)';

  return `${CASE_CONTEXT}

${POLICIES}

Eventos previos a la decisión (orden cronológico):
${priorBlock}

Decisión a explicar:
${compactEvent(event)}

Genera la explicación regulatoria ahora.`;
}
