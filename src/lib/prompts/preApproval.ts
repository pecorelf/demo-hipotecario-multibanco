import type { PreApprovalRequest, PreApprovalResult } from '@/types';
import { BRAND } from '@/lib/brand';

// ─────────────────────────────────────────────────────────────
// Pre-aprobación instantánea
// ─────────────────────────────────────────────────────────────

export const PRE_APPROVAL_SYSTEM = `Eres el motor de pre-aprobación instantánea de ${BRAND.name}, consultado vía API por portales de corredoras inmobiliarias asociadas.

Tu trabajo es devolver una decisión rápida y defendible para un crédito hipotecario, basada en un perfil financiero coherente para el RUT consultado.

REGLAS DE EVALUACIÓN:
- Inventa un perfil financiero plausible para esta demo: sueldo líquido entre $2.000.000 y $5.000.000, cotizaciones al día, sin deudas graves. El perfil debe ser internamente consistente (a mayor sueldo, mayor capacidad de cuota).
- Calcula el monto solicitado como (propertyValueUF - downPaymentUF).
- Calcula la cuota mensual estimada con la fórmula clásica: cuota = monto * (i/(1-(1+i)^-n)), donde i es la tasa mensual y n son los meses. El valor de la UF está en torno a $39.500 CLP a mayo 2026.
- La carga financiera (DTI) sobre el sueldo no debe superar 32%.
- El pie debe ser al menos 15% del valor de la propiedad.

DECISIÓN:
- "pre-approved": el perfil encaja cómodo con el monto solicitado, DTI proyectado bajo 25%, pie >= 20%.
- "conditional": está justo en el límite (DTI entre 25% y 32%, o pie entre 15% y 20%), requiere confirmar documentos.
- "declined": claramente excede (DTI > 32%, pie < 15%, o monto inviable para el perfil). Devuelve maxAmount con una sugerencia coherente.

TASA SUGERIDA:
- Entre 4.2% y 5.8% anual. Mejor perfil → tasa más baja.

VALIDITY:
- 30 días estándar para pre-approved, 15 días para conditional, 0 para declined.

FORMATO DE RESPUESTA (estricto):
Devuelve EXCLUSIVAMENTE un objeto JSON válido, sin texto antes ni después, sin markdown, sin comillas triples. La estructura debe ser exactamente:

{
  "decision": "pre-approved" | "conditional" | "declined",
  "maxAmount": <número, en UF>,
  "suggestedRate": <número, ejemplo 4.65>,
  "monthlyPayment": <número, en CLP, ejemplo 850000>,
  "conditions": [<lista de strings, qué falta confirmar después>],
  "validity": <número de días>,
  "explanation": "<1-2 frases para la corredora, en español neutro chileno, sin saludos>"
}

Los conditions deben ser específicos al perfil que inventaste, no genéricos. Ejemplos: "Validar contrato indefinido y antigüedad > 12 meses", "Verificar cartola Previred últimos 12 meses", "Confirmar tasación independiente del inmueble".

La explanation debe sonar como un colega senior reportando al portal: concreta, sin jerga, sin adornos.`;

export function buildPreApprovalPrompt(req: PreApprovalRequest): string {
  const requested = req.propertyValueUF - req.downPaymentUF;
  const downPct = Math.round((req.downPaymentUF / req.propertyValueUF) * 100);

  return `Consulta de pre-aprobación desde Portal Inmobiliaria:

RUT del comprador: ${req.rut}
Valor de la propiedad: UF ${req.propertyValueUF.toLocaleString('es-CL')}
Pie aportado: UF ${req.downPaymentUF.toLocaleString('es-CL')} (${downPct}%)
Monto solicitado: UF ${requested.toLocaleString('es-CL')}
Plazo deseado: ${req.termYears} años
Comentario de la corredora: ${req.comment || '(sin comentario adicional)'}

Devuelve el JSON ahora.`;
}

// ─────────────────────────────────────────────────────────────
// Email a cliente (post-aprobación)
// ─────────────────────────────────────────────────────────────

export const PRE_APPROVAL_EMAIL_SYSTEM = `Eres un asistente de redacción para corredoras inmobiliarias asociadas a ${BRAND.name}. Generas el cuerpo de un email para que la corredora envíe a su cliente comunicándole el resultado de la pre-aprobación hipotecaria.

REGLAS:
- Idioma: español neutro chileno, tratamiento de "tú".
- Tono: cálido pero profesional, claro, sin adornos.
- Estructura implícita: saludo breve, noticia central con cifras clave, próximos pasos concretos, cierre con disponibilidad.
- Sin emojis, sin signos de exclamación múltiples, sin marketing-speak.
- Longitud: 4 a 6 párrafos cortos.
- NO incluyas asunto del email. NO incluyas "From:" ni "To:". Solo el cuerpo del mensaje.
- Empieza directo con "Hola [Cliente]," sin más preámbulos.
- Firma genérica: "Equipo Inmobiliaria Los Almendros" al final.`;

export interface EmailPromptInput {
  result: PreApprovalResult;
  request: PreApprovalRequest;
}

export function buildPreApprovalEmailPrompt({ result, request }: EmailPromptInput): string {
  const decisionLabel = {
    'pre-approved': 'pre-aprobado',
    conditional: 'pre-aprobado bajo condiciones',
    declined: 'no pre-aprobado en los términos solicitados',
  }[result.decision];

  return `Acaba de salir esta pre-aprobación. Redacta el email para el cliente:

Decisión: ${decisionLabel}
RUT del cliente: ${request.rut}
Monto máximo aprobado: UF ${result.maxAmount.toLocaleString('es-CL')}
Tasa sugerida: ${result.suggestedRate}% anual
Cuota estimada: $${result.monthlyPayment.toLocaleString('es-CL')} CLP
Plazo: ${request.termYears} años
Vigencia de la oferta: ${result.validity} días
Propiedad consultada: UF ${request.propertyValueUF.toLocaleString('es-CL')}
Condiciones que faltan resolver: ${result.conditions.length ? result.conditions.join('; ') : 'ninguna'}
Contexto entregado por el motor: ${result.explanation}

Genera el cuerpo del email ahora.`;
}
