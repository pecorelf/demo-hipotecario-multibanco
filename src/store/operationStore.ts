import { create } from 'zustand';
import { BRAND } from '@/lib/brand';

/**
 * Single source of truth for what the client has decided during their
 * mortgage simulation journey. All views — client conversational,
 * client form, simulation, executive cockpit, executive audio — read
 * and write here. This ensures consistency: what the client says,
 * everyone sees.
 */

export type OperationStage =
  | 'awaiting'        // nothing started yet
  | 'in_conversation' // talking with {BRAND.assistantName}
  | 'in_form'         // filling property form directly
  | 'simulating'      // viewing scenarios
  | 'selected'        // client chose a scenario
  | 'confirmed';      // client confirmed and moved forward

export interface PropertyData {
  direccion?: string;
  comuna?: string;
  valorUF?: number;
  piePorcentaje?: number; // 0-100
}

export interface ScenarioData {
  plazoAnios: number;
  tasaAnual: number;    // percentage, e.g. 4.7
  dividendoMensualUF: number;
  totalUF: number;
  cae: number;
}

export interface ConversationCapture {
  // What {BRAND.assistantName} captured during the conversation. May be partial.
  regimenPatrimonial?: string;
  valorPropiedadUF?: number;
  piePorcentaje?: number;
  plazoSolicitadoAnios?: number; // what client SAID, even if non-standard
  direccion?: string;
  comuna?: string;
  cotitularAutenticado?: boolean;
  fechaPromesa?: string;
  urgencia?: string;
}

interface OperationState {
  // ── Stage of the journey ────────────────────────────────────
  stage: OperationStage;

  // ── Conversation capture (from {BRAND.assistantName}) ─────────────────────────
  conversation: ConversationCapture;

  // ── Property data (form or derived from conversation) ───────
  property: PropertyData;

  // ── Plazo handling ──────────────────────────────────────────
  // If client conversed a non-standard plazo (e.g. 19 years), we
  // store it here. The simulation view uses it to decide whether
  // to show 3 scenarios (standard) or 4 (custom + 3 reference).
  plazoSolicitado: number | null; // null = use defaults

  // ── Scenarios shown to client and the one selected ──────────
  scenarios: ScenarioData[];
  selectedPlazo: number | null; // which scenario the client picked

  // ── Actions ─────────────────────────────────────────────────
  setStage: (stage: OperationStage) => void;
  setConversation: (data: Partial<ConversationCapture>) => void;
  setProperty: (data: Partial<PropertyData>) => void;
  setPlazoSolicitado: (years: number | null) => void;
  setScenarios: (scenarios: ScenarioData[]) => void;
  selectScenario: (plazo: number) => void;
  hydrateFromConversation: () => void;
  resetOperation: () => void;
}

const INITIAL_OPERATION: Omit<OperationState,
  | 'setStage' | 'setConversation' | 'setProperty' | 'setPlazoSolicitado'
  | 'setScenarios' | 'selectScenario' | 'hydrateFromConversation'
  | 'resetOperation'
> = {
  stage: 'awaiting',
  conversation: {},
  property: {},
  plazoSolicitado: null,
  scenarios: [],
  selectedPlazo: null,
};

export const useOperationStore = create<OperationState>((set, get) => ({
  ...INITIAL_OPERATION,

  setStage: (stage) => set({ stage }),

  setConversation: (data) =>
    set((s) => ({ conversation: { ...s.conversation, ...data } })),

  setProperty: (data) =>
    set((s) => ({ property: { ...s.property, ...data } })),

  setPlazoSolicitado: (years) => set({ plazoSolicitado: years }),

  setScenarios: (scenarios) => set({ scenarios }),

  selectScenario: (plazo) => set({ selectedPlazo: plazo }),

  /**
   * Takes what {BRAND.assistantName} captured during conversation and pre-fills the
   * property form. Used when the client switches from conversational
   * to form mode mid-flow.
   */
  hydrateFromConversation: () => {
    const c = get().conversation;
    const updates: Partial<PropertyData> = {};
    if (c.direccion) updates.direccion = c.direccion;
    if (c.comuna) updates.comuna = c.comuna;
    if (c.valorPropiedadUF) updates.valorUF = c.valorPropiedadUF;
    if (c.piePorcentaje) updates.piePorcentaje = c.piePorcentaje;
    if (Object.keys(updates).length > 0) {
      set((s) => ({ property: { ...s.property, ...updates } }));
    }
    if (c.plazoSolicitadoAnios) {
      set({ plazoSolicitado: c.plazoSolicitadoAnios });
    }
  },

  resetOperation: () => set({ ...INITIAL_OPERATION }),
}));

// ─── Helpers ──────────────────────────────────────────────────

/**
 * Returns the scenarios array that the simulation view should show.
 * If the client requested a non-standard plazo (e.g. 19), the array
 * has 4 entries with the client's choice first; otherwise 3 standard.
 */
export const STANDARD_PLAZOS = [20, 25, 30] as const;

export function buildPlazoOptions(plazoSolicitado: number | null): number[] {
  if (plazoSolicitado === null) return [...STANDARD_PLAZOS];
  if (STANDARD_PLAZOS.includes(plazoSolicitado as 20 | 25 | 30)) {
    return [...STANDARD_PLAZOS];
  }
  // Non-standard: custom first, then standards
  return [plazoSolicitado, ...STANDARD_PLAZOS];
}

/**
 * Validates whether a plazo (in years) is within {BRAND.shortName}'s allowed range.
 * Returns null if valid, or an error message string if invalid.
 */
export function validatePlazo(years: number): string | null {
  if (years < 8) return 'El plazo mínimo es 8 años.';
  if (years > 30) return 'El plazo máximo es 30 años.';
  if (!Number.isInteger(years)) return 'El plazo debe ser un número entero de años.';
  return null;
}
