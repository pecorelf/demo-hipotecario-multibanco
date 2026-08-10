import type {
  ConsistencyCheck,
  ConsistencyStatus,
  DocAnalysis,
} from '@/types';

const VALID_STATUSES: readonly ConsistencyStatus[] = ['ok', 'warning', 'error'];

function asRecordOfStrings(value: unknown): Record<string, string> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  const result: Record<string, string> = {};
  for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
    if (typeof v === 'string') result[k] = v;
    else if (typeof v === 'number' || typeof v === 'boolean') result[k] = String(v);
  }
  return result;
}

function asConsistencyChecks(value: unknown): ConsistencyCheck[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item): ConsistencyCheck[] => {
    if (!item || typeof item !== 'object') return [];
    const v = item as Record<string, unknown>;
    const check = typeof v.check === 'string' ? v.check : null;
    const explanation = typeof v.explanation === 'string' ? v.explanation : null;
    const status = VALID_STATUSES.includes(v.status as ConsistencyStatus)
      ? (v.status as ConsistencyStatus)
      : 'ok';
    if (!check || !explanation) return [];
    return [{ check, status, explanation }];
  });
}

export function validateDocAnalysis(value: unknown): DocAnalysis {
  if (!value || typeof value !== 'object') {
    throw new Error('doc_analysis no es un objeto');
  }
  const v = value as Record<string, unknown>;
  return {
    extractedFields: asRecordOfStrings(v.extractedFields),
    consistencyChecks: asConsistencyChecks(v.consistencyChecks),
    validityDate: typeof v.validityDate === 'string' ? v.validityDate : null,
    requiresHumanReview: Boolean(v.requiresHumanReview),
    summary: typeof v.summary === 'string' ? v.summary : '',
  };
}

export function worstStatus(checks: ConsistencyCheck[]): ConsistencyStatus {
  if (checks.some((c) => c.status === 'error')) return 'error';
  if (checks.some((c) => c.status === 'warning')) return 'warning';
  return 'ok';
}

export function shouldFlagOnUpload(uploadNumber: number): boolean {
  return uploadNumber === 1 || (uploadNumber - 1) % 3 === 0;
}
