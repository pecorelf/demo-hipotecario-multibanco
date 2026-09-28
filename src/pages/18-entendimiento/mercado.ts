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
  /** La variación se explica por una fusión, no por crecimiento propio. */
  porFusion?: boolean;
}

export const CORTE_MERCADO = 'julio de 2026';
export const FUENTE_MERCADO =
  'Comisión para el Mercado Financiero · Reporte de Información Financiera Mensual del Sistema Bancario, julio de 2026. Stock de colocaciones para vivienda a costo amortizado, sin deducir provisiones. No incluye cooperativas ni mutuarias.';

/** Advertencias que cambian la lectura de las cifras y deben decirse. */
export const NOTAS_MERCADO = [
  'Bice creció por la fusión con Banco Security, materializada en noviembre de 2025, no por captación propia.',
  'Internacional y Consorcio crecen sobre bases pequeñas: juntos suman menos del 3% del sistema.',
];

export const SISTEMA_VIVIENDA_MM = 97_846_647;

export const MERCADO: PosicionBanco[] = [
  { nombre: 'Banco del Estado de Chile', corto: 'BancoEstado', stock: 18_811_204, share: 19.23, variacion: 5.63, mora: 4.46, slugs: ['bancoestado'] },
  { nombre: 'Banco Santander-Chile', corto: 'Santander', stock: 17_686_095, share: 18.08, variacion: -2.50, mora: 3.34, slugs: ['santander'] },
  { nombre: 'Banco de Crédito e Inversiones', corto: 'Bci', stock: 16_470_052, share: 16.83, variacion: 1.37, mora: 1.80, slugs: ['bci'] },
  { nombre: 'Scotiabank Chile', corto: 'Scotiabank', stock: 14_778_169, share: 15.10, variacion: -1.56, mora: 2.05, slugs: ['scotiabank'] },
  { nombre: 'Banco de Chile', corto: 'Banco de Chile', stock: 14_161_939, share: 14.47, variacion: -0.96, mora: 1.59, slugs: ['banco-de-chile'] },
  { nombre: 'Banco Itaú Chile', corto: 'Itaú', stock: 9_368_985, share: 9.58, variacion: 9.74, mora: 1.85, slugs: ['itau'] },
  { nombre: 'Banco Bice', corto: 'Bice', stock: 3_612_167, share: 3.69, variacion: 72.12, mora: 0.97, slugs: ['bice'], porFusion: true },
  { nombre: 'Banco Consorcio', corto: 'Consorcio', stock: 1_932_406, share: 1.97, variacion: 10.06, mora: 1.24, slugs: ['consorcio'] },
  { nombre: 'Banco Falabella', corto: 'Falabella', stock: 802_577, share: 0.82, variacion: 12.89, mora: 4.07, slugs: ['falabella'] },
  { nombre: 'Banco Internacional', corto: 'Internacional', stock: 214_506, share: 0.22, variacion: 50.64, mora: 0.63, slugs: ['internacional'] },
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

/**
 * Decisiones de política pública que pueden acelerar el flujo hipotecario en
 * los próximos meses. Datos de fuentes públicas, con su fecha, para que la
 * lámina no dependa de la memoria de nadie.
 */
export const CATALIZADORES = [
  {
    titulo: 'FOGAES ampliado',
    dato: '80 mil cupos',
    detalle:
      'La garantía estatal pasó de 50 mil a 80 mil cupos, subió el tope de la vivienda de 4.000 a 6.000 UF y extendió su vigencia hasta mayo de 2028. El 88% del stock de viviendas nuevas del país queda dentro del nuevo tope.',
    fecha: 'Promulgado en agosto de 2026',
  },
  {
    titulo: 'Subsidio a la tasa',
    dato: 'hasta 60 pb menos',
    detalle:
      'El subsidio a la tasa de interés hipotecaria rebaja hasta 60 puntos base el costo del crédito, y se puede combinar con FOGAES. Es el que más mueve el dividendo mensual que ve el cliente.',
    fecha: 'Vigente hasta mayo de 2028',
  },
  {
    titulo: 'Exención de IVA a la vivienda nueva',
    dato: 'hasta 4.000 UF',
    detalle:
      'Exención transitoria del IVA a la venta de viviendas nuevas, por doce meses, para reducir el precio final y activar el stock sin vender. Aprobada en el Senado, en tramitación.',
    fecha: 'En tramitación · 2026',
  },
  {
    titulo: 'Subsidio Tramo 4.000',
    dato: '5 mil cupos nuevos',
    detalle:
      'Primer llamado especial en noviembre de 2026, para viviendas nuevas o usadas de hasta 4.000 UF, combinable con FOGAES y con el subsidio a la tasa.',
    fecha: 'Primer llamado en noviembre de 2026',
  },
];

export const CATALIZADORES_FUENTE =
  'Ministerio de Hacienda y MINVU · Cámara de Diputados y Senado de Chile · prensa económica, 2026. La exención de IVA se encuentra en tramitación legislativa a la fecha de esta presentación.';
