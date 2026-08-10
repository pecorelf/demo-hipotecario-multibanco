import type { MortgageOffer } from '@/types';
import { BRAND } from '@/lib/brand';

export const COMPARADOR_SYSTEM = `Eres un analista financiero honesto e independiente. Trabajas para una mesa de transparencia de ${BRAND.name} que invierte en credibilidad de largo plazo: la mesa preferiría perder un cliente hoy a engañarlo y perderlo para siempre.

Tu trabajo es comparar ofertas hipotecarias y entregar UNA recomendación honesta. Si la oferta de ${BRAND.shortName} no es la mejor, decilo claramente. Si la mejor es de un competidor, decilo. La credibilidad del ejercicio depende de que NO defiendas a ${BRAND.shortName} por defecto.

REGLAS PARA INVENTAR DATOS:
Para esta demo recibirás 2 o 3 ofertas. La de ${BRAND.shortName} viene con datos fijos. Para cada oferta de competidor (Competidor A, BCI, Competidor C, Competidor D, Competidor E, Retail, según la rotación), inventa cifras coherentes con la realidad chilena 2026:

- Tasa nominal hipotecaria: entre 3,90% y 5,40% anual UF.
- CAE: entre 0,3 y 0,8 puntos sobre la tasa nominal, según seguros y costos accesorios.
- Plazo: típicamente 20 a 30 años.
- Dividendo mensual: calculado de forma consistente con monto, tasa y plazo (fórmula clásica de cuota).
- Seguros: variar entre "incendio + sismo incluido", "incendio incluido, sismo opcional", "todos opcionales con recargo", etc.
- Costo de prepago: variar entre "sin costo desde mes 24", "1 mes de cuota como penalidad", "0,3% sobre saldo", "sin costo cualquier momento".
- Comisión de apertura: entre UF 5 y UF 18.
- Flexibilidad: nota breve sobre portabilidad, ajuste de plazo, prepagos parciales.

IMPORTANTE — RANDOMIZACIÓN GENUINA:
No fuerces que ${BRAND.shortName} gane. Genera datos que reflejen el mercado real: a veces ${BRAND.shortName} tiene la mejor tasa, a veces no. A veces ofrece la mejor flexibilidad, a veces no. La decisión "overall" debe seguir las cifras que inventaste, no una preferencia hacia el banco que te paga.

DETERMINACIÓN DEL GANADOR POR CATEGORÍA:
- nominalRate: el banco con menor tasa nominal.
- effectiveRate: el banco con menor CAE.
- flexibility: el banco con mejores condiciones combinadas de prepago + portabilidad + ajuste.
- overall: tu juicio honesto, basado en CAE + flexibilidad + costos accesorios. Si dos están muy cerca, podés marcar 'tie' y explicar en la conclusión.

FORMATO DE RESPUESTA (estricto):
Devuelve EXCLUSIVAMENTE un objeto JSON válido. Sin texto antes ni después, sin markdown, sin comillas triples. La estructura debe ser:

{
  "offers": [
    {
      "id": "banco" | "competitor1" | "competitor2",
      "bank": "<nombre del banco>",
      "amountUF": <número>,
      "nominalRate": <número decimal, ej 4.65>,
      "caeRate": <número decimal, ej 5.12>,
      "termYears": <número>,
      "monthlyPaymentCLP": <número>,
      "insurances": "<descripción breve>",
      "prepaymentCost": "<descripción breve>",
      "openingFee": "<ej 'UF 12'>",
      "flexibilityNote": "<1 frase>"
    }
  ],
  "winners": {
    "nominalRate": "banco" | "competitor1" | "competitor2" | "tie",
    "effectiveRate": "banco" | "competitor1" | "competitor2" | "tie",
    "flexibility": "banco" | "competitor1" | "competitor2" | "tie",
    "overall": "banco" | "competitor1" | "competitor2" | "tie"
  },
  "conclusion": "<3 a 5 frases en prosa fluida, español neutro chileno, dirigidas al cliente final con tratamiento de 'tú'. Tono: analista honesto explicando por qué la opción ganadora gana. Si gana ${BRAND.shortName}, explicalo sin marketing-speak. Si gana un competidor, decilo claramente y mencioná en qué ${BRAND.shortName} queda corto.>"
}

Sin saludos. Sin cierres. Sin recomendaciones de marketing. Sin emojis. Sin sugerir agendar reuniones (eso lo gestiona el front, no la respuesta).`;

const BANK_OFFER_DATA: MortgageOffer = {
  id: 'banco',
  bank: '${BRAND.name}',
  amountUF: 4760,
  nominalRate: 4.65,
  caeRate: 5.18,
  termYears: 25,
  monthlyPaymentCLP: 1_055_000,
  insurances: 'Incendio + sismo incluidos. Desgravamen del titular incluido.',
  prepaymentCost: 'Sin costo de prepago a partir del mes 24.',
  openingFee: 'UF 12',
  flexibilityNote:
    'Portabilidad simplificada con otros bancos y rebaja automática de tasa si baja la TPM 50bps.',
};

export function getBankOffer(overrides?: {
  amountUF?: number;
  termYears?: number;
  monthlyPaymentCLP?: number;
}): MortgageOffer {
  return { ...BANK_OFFER_DATA, ...overrides };
}

export interface ComparisonPromptInput {
  bankOffer: MortgageOffer;
  competitor1Uploaded: boolean;
  competitor2Uploaded: boolean;
}

export function buildComparisonPrompt({
  bankOffer,
  competitor1Uploaded,
  competitor2Uploaded,
}: ComparisonPromptInput): string {
  const slotCount = 1 + (competitor1Uploaded ? 1 : 0) + (competitor2Uploaded ? 1 : 0);

  const propioBlock = `Oferta de ${BRAND.shortName} (datos reales del cliente):
- Banco: ${bankOffer.bank}
- Monto: UF ${bankOffer.amountUF.toLocaleString('es-CL')}
- Tasa nominal: ${bankOffer.nominalRate}%
- CAE: ${bankOffer.caeRate}%
- Plazo: ${bankOffer.termYears} años
- Dividendo mensual: $${bankOffer.monthlyPaymentCLP.toLocaleString('es-CL')}
- Seguros: ${bankOffer.insurances}
- Prepago: ${bankOffer.prepaymentCost}
- Comisión de apertura: ${bankOffer.openingFee}
- Flexibilidad: ${bankOffer.flexibilityNote}`;

  const competitorBlocks: string[] = [];
  if (competitor1Uploaded) {
    competitorBlocks.push(
      'OFERTA 2 — Competidor 1 (debe tener id: "competitor1") — INVENTA los datos coherentemente. Elige un banco DISTINTO de ${BRAND.shortName}: Competidor A, BCI, Competidor C, Competidor D, Competidor E, o Retail.',
    );
  }
  if (competitor2Uploaded) {
    competitorBlocks.push(
      'OFERTA 3 — Competidor 2 (debe tener id: "competitor2") — INVENTA los datos coherentemente. Elige un banco DISTINTO de ${BRAND.shortName} Y DISTINTO del Competidor 1.',
    );
  }

  const slotsTxt = [
    `CRÍTICO — DEBES generar EXACTAMENTE ${slotCount} ofertas en el array "offers" del JSON. Ni más, ni menos. Si solo generas ${slotCount - 1} la respuesta queda mal y se rompe la pantalla del cliente.`,
    '',
    `Repaso: ${slotCount} ofertas total = 1 ${BRAND.shortName} + ${slotCount - 1} competidor${slotCount > 2 ? 'es' : ''}.`,
    '',
    'Las ofertas son:',
    '',
    'OFERTA 1 — ${BRAND.shortName} (datos fijos, no inventar):',
    propioBlock,
    '',
    ...competitorBlocks,
    '',
    'Asume que el cliente solicitó un monto de UF ' +
      bankOffer.amountUF.toLocaleString('es-CL') +
      ' a plazo de ' +
      bankOffer.termYears +
      ' años. Las ofertas competidoras deben ser sobre montos comparables (pueden tener pequeñas variaciones para realismo).',
    '',
    `Estructura del JSON esperado (esquema):
{
  "offers": [
    { "id": "banco", "bank": "${BRAND.name}", "amountUF": ${bankOffer.amountUF}, "nominalRate": ${bankOffer.nominalRate}, ... }${slotCount >= 2 ? ',\n    { "id": "competitor1", "bank": "...", ... }' : ''}${slotCount >= 3 ? ',\n    { "id": "competitor2", "bank": "...", ... }' : ''}
  ],
  "winners": { "nominalRate": "...", "effectiveRate": "...", "flexibility": "...", "overall": "..." },
  "conclusion": "..."
}`,
    '',
    `Recordatorio final antes de generar: el array "offers" tiene exactamente ${slotCount} elementos. No marques overall=propio por defecto. Decide honestamente quién gana.`,
  ]
    .filter((s) => s !== '')
    .join('\n');

  return slotsTxt;
}
