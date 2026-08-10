import type { Case } from '@/types';
import type { PropertyData, ScenarioData, ConversationCapture } from '@/store/operationStore';

/**
 * The case ID for the "current client" we use in demos.
 * If the user has done a simulation in the conversational flow,
 * this case will reflect those choices instead of the mock defaults.
 */
export const DEMO_CLIENT_CASE_ID = 'HIP-2026-0042';

interface EnrichInput {
  property: PropertyData;
  conversation: ConversationCapture;
  scenarios: ScenarioData[];
  selectedPlazo: number | null;
  plazoSolicitado: number | null;
}

/**
 * Returns a new Case object where the property, financial figures and
 * timeline-relevant fields are overridden by what the client actually
 * decided in the conversational/form flow, if any data is present.
 *
 * If the client hasn't run a simulation yet, returns the original case
 * unchanged (mock defaults will display).
 *
 * Only applies to the demo client case (Francisco) — other cases stay
 * untouched.
 */
export function enrichCaseWithSimulation(
  baseCase: Case,
  input: EnrichInput,
): Case {
  // Only apply enrichment to the demo client case
  if (baseCase.id !== DEMO_CLIENT_CASE_ID) return baseCase;

  const { property, conversation, scenarios, selectedPlazo } = input;

  const hasAnyClientData =
    Object.keys(property).length > 0 ||
    Object.keys(conversation).length > 0 ||
    selectedPlazo !== null;

  if (!hasAnyClientData) return baseCase;

  // Resolve property data — form > conversation > mock
  const direccion = property.direccion ?? conversation.direccion;
  const comuna = property.comuna ?? conversation.comuna;
  const valorUF = property.valorUF ?? conversation.valorPropiedadUF;
  const piePct = property.piePorcentaje ?? conversation.piePorcentaje;

  // Build the enriched case
  const enriched: Case = { ...baseCase };

  // Property overrides — only fields the client actually provided
  if (direccion || comuna || valorUF) {
    enriched.property = {
      ...baseCase.property,
      address: direccion ?? baseCase.property.address,
      commune: comuna ?? baseCase.property.commune,
      valueUF: valorUF ?? baseCase.property.valueUF,
    };
  }

  // Financial overrides — only if the client got far enough
  if (valorUF) {
    // Recompute down payment and requested amount from the % the client chose
    if (piePct) {
      const newDown = Math.round((valorUF * piePct) / 100);
      enriched.downPaymentUF = newDown;
      enriched.requestedUF = valorUF - newDown;
    } else {
      // No % given; keep existing ratio but rescale to new value
      const existingRatio = baseCase.downPaymentUF / (baseCase.property.valueUF || 1);
      const newDown = Math.round(valorUF * existingRatio);
      enriched.downPaymentUF = newDown;
      enriched.requestedUF = valorUF - newDown;
    }
  }

  // Selected scenario overrides — only if the client picked one
  if (selectedPlazo !== null) {
    const sel = scenarios.find((s) => s.plazoAnios === selectedPlazo);
    if (sel) {
      enriched.termYears = sel.plazoAnios;
      enriched.annualRate = sel.tasaAnual;
      enriched.monthlyPaymentUF = sel.dividendoMensualUF;
    } else {
      // Selected plazo without matching scenario (shouldn't happen but defensive)
      enriched.termYears = selectedPlazo;
    }
  } else if (input.plazoSolicitado !== null && input.plazoSolicitado !== baseCase.termYears) {
    // No scenario picked yet but client said a non-standard plazo in chat —
    // hint at it without overcommitting financial figures
    enriched.termYears = input.plazoSolicitado;
  }

  return enriched;
}
