import type { CaseSetup, JourneyType, PatrimonialRegime } from '@/types';

export const JOURNEY_LABEL: Record<JourneyType, string> = {
  primera_vivienda: 'Compra de primera vivienda',
  segunda_vivienda: 'Compra de segunda vivienda',
  subrogacion: 'Subrogación de crédito',
  inversion: 'Inversión inmobiliaria',
  refinanciamiento: 'Refinanciamiento',
};

export const REGIME_LABEL: Record<PatrimonialRegime, string> = {
  sociedad_conyugal: 'Sociedad conyugal',
  separacion_bienes: 'Separación de bienes',
  participacion_gananciales: 'Participación en los gananciales',
  unknown: 'Por confirmar',
};

const VALID_JOURNEYS: readonly JourneyType[] = [
  'primera_vivienda',
  'segunda_vivienda',
  'subrogacion',
  'inversion',
  'refinanciamiento',
];

const VALID_REGIMES: readonly PatrimonialRegime[] = [
  'sociedad_conyugal',
  'separacion_bienes',
  'participacion_gananciales',
  'unknown',
];

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((v): v is string => typeof v === 'string' && v.trim().length > 0);
}

export function validateCaseSetup(value: unknown): CaseSetup {
  if (!value || typeof value !== 'object') {
    throw new Error('case_setup no es un objeto');
  }
  const v = value as Record<string, unknown>;

  const journeyType = VALID_JOURNEYS.includes(v.journeyType as JourneyType)
    ? (v.journeyType as JourneyType)
    : 'primera_vivienda';

  const patrimonialRegime = VALID_REGIMES.includes(v.patrimonialRegime as PatrimonialRegime)
    ? (v.patrimonialRegime as PatrimonialRegime)
    : 'unknown';

  return {
    journeyType,
    keyFacts: asStringArray(v.keyFacts),
    dataToFetch: asStringArray(v.dataToFetch),
    dataToAsk: asStringArray(v.dataToAsk),
    nextStep: typeof v.nextStep === 'string' ? v.nextStep : '',
    isCoTitular: Boolean(v.isCoTitular),
    coTitularName: typeof v.coTitularName === 'string' ? v.coTitularName : undefined,
    patrimonialRegime,
  };
}

export function generateCaseId(): string {
  const n = Math.floor(1000 + Math.random() * 8999);
  return `HIP-2026-${String(n).padStart(4, '0')}`;
}
