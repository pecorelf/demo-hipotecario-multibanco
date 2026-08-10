export function formatRut(rut: string): string {
  const cleaned = rut.replace(/[^0-9kK]/g, '').toUpperCase();
  if (cleaned.length < 2) return rut;
  const body = cleaned.slice(0, -1);
  const dv = cleaned.slice(-1);
  const reversed = body.split('').reverse().join('');
  const grouped = reversed.match(/.{1,3}/g)?.join('.').split('').reverse().join('') ?? body;
  return `${grouped}-${dv}`;
}

export function formatCLP(value: number): string {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatUF(value: number): string {
  return `UF ${new Intl.NumberFormat('es-CL', { maximumFractionDigits: 2 }).format(value)}`;
}

/**
 * Valor de la UF al 20 de mayo de 2026 (referencial para esta demo).
 * Actualizar manualmente si la demo se hace en una fecha distinta.
 */
export const UF_CLP_RATE = 40_424.99;

/**
 * Convierte UF a pesos chilenos usando la tasa actual.
 */
export function ufToCLP(uf: number): number {
  return Math.round(uf * UF_CLP_RATE);
}

/**
 * Calcula la cuota mensual de un crédito con cuota fija (sistema francés).
 * @param amountUF monto del crédito en UF
 * @param annualRatePct tasa nominal anual en porcentaje (ej. 4.65 para 4,65%)
 * @param years plazo en años
 * @returns cuota mensual en CLP redondeada
 */
export function calculateMonthlyPaymentCLP(
  amountUF: number,
  annualRatePct: number,
  years: number,
): number {
  const principalCLP = amountUF * UF_CLP_RATE;
  const n = years * 12;
  const i = annualRatePct / 12 / 100;
  if (i === 0) return Math.round(principalCLP / n);
  const monthly =
    (principalCLP * (i * Math.pow(1 + i, n))) / (Math.pow(1 + i, n) - 1);
  return Math.round(monthly);
}

export function formatPct(value: number, digits = 2): string {
  return `${new Intl.NumberFormat('es-CL', { maximumFractionDigits: digits, minimumFractionDigits: digits }).format(value)}%`;
}

export function formatDateCL(iso: string): string {
  return new Intl.DateTimeFormat('es-CL', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(iso));
}

export function formatDateTimeCL(iso: string): string {
  return new Intl.DateTimeFormat('es-CL', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso));
}
