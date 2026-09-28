/**
 * Posición de cada institución en el mercado hipotecario chileno.
 *
 * Los datos son públicos y vienen del Reporte de Información Financiera
 * Mensual de la CMF. Se guardan aquí, transcritos, y no se consultan en línea:
 * una presentación no puede quedar en blanco porque un servicio externo no
 * respondió en el momento de mostrarla.
 *
 * Para actualizar, bajar el reporte del mes y reemplazar las tres series.
 */

export interface PosicionBanco {
  /** Nombre como aparece en el reporte de la CMF. */
  nombre: string;
  /** Nombre corto para la lámina. */
  corto: string;
  /** Stock de colocaciones para vivienda, en millones de pesos. */
  stock: number;
  /** Participación sobre el total del sistema, en porcentaje. */
  share: number;
  /** Variación del stock de vivienda en doce meses, en porcentaje. */
  variacion: number;
  /** Morosidad de la cartera de vivienda, en porcentaje. */
  mora: number;
  /** Identificadores de marca que corresponden a esta institución. */
  slugs: string[];
}

export const CORTE_MERCADO = 'julio de 2026';
export const FUENTE_MERCADO =
  'Comisión para el Mercado Financiero · Reporte de Información Financiera Mensual del Sistema Bancario, julio de 2026. Colocaciones para vivienda a costo amortizado.';

export const SISTEMA_VIVIENDA_MM = 97_846_647;

export const MERCADO: PosicionBanco[] = [
  { nombre: 'Banco del Estado de Chile', corto: 'BancoEstado', stock: 18_811_204, share: 19.2, variacion: 5.6, mora: 4.46, slugs: ['bancoestado'] },
  { nombre: 'Banco Santander-Chile', corto: 'Santander', stock: 17_686_095, share: 18.1, variacion: -2.5, mora: 3.34, slugs: ['santander'] },
  { nombre: 'Banco de Crédito e Inversiones', corto: 'Bci', stock: 16_470_052, share: 16.8, variacion: 1.4, mora: 1.80, slugs: ['bci'] },
  { nombre: 'Scotiabank Chile', corto: 'Scotiabank', stock: 14_778_169, share: 15.1, variacion: -1.6, mora: 2.05, slugs: ['scotiabank'] },
  { nombre: 'Banco de Chile', corto: 'Banco de Chile', stock: 14_161_939, share: 14.5, variacion: -1.0, mora: 1.59, slugs: ['banco-de-chile'] },
  { nombre: 'Banco Itaú Chile', corto: 'Itaú', stock: 9_368_985, share: 9.6, variacion: 9.7, mora: 1.85, slugs: ['itau'] },
  { nombre: 'Banco Bice', corto: 'Bice', stock: 3_612_167, share: 3.7, variacion: 72.1, mora: 0.97, slugs: ['bice'] },
  { nombre: 'Banco Consorcio', corto: 'Consorcio', stock: 1_932_406, share: 2.0, variacion: 10.1, mora: 1.24, slugs: ['consorcio'] },
  { nombre: 'Banco Falabella', corto: 'Falabella', stock: 802_577, share: 0.8, variacion: 12.9, mora: 4.07, slugs: ['falabella'] },
  { nombre: 'Banco Internacional', corto: 'Internacional', stock: 214_506, share: 0.2, variacion: 50.6, mora: 0.63, slugs: ['internacional'] },
];

/** Devuelve la posición de la institución activa, si está en el reporte. */
export function posicionDe(slug: string): PosicionBanco | undefined {
  return MERCADO.find((m) => m.slugs.includes(slug));
}

/** Lugar que ocupa en el ranking por stock, empezando en 1. */
export function lugarDe(slug: string): number | undefined {
  const i = MERCADO.findIndex((m) => m.slugs.includes(slug));
  return i >= 0 ? i + 1 : undefined;
}
