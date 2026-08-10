/**
 * Presets de identidad por institución.
 *
 * Los valores cromáticos son aproximaciones construidas desde la identidad
 * pública de cada institución. Verificar contra su manual de marca y ajustar
 * desde /admin antes de presentar.
 *
 * Las tipografías son sustitutos de Google Fonts: las familias corporativas
 * son propietarias y no se distribuyen.
 */

export interface BankTheme {
  slug: string;
  name: string;
  shortName: string;
  legalName: string;

  accent: string;
  accentMuted: string;
  accentSoft: string;
  onAccent: string;
  fontFamily: string;
  logoUrl: string;

  assistantName: string;

  buyerName: string;
  sellerName: string;
  inmobiliariaName: string;
  ejecutivoName: string;
  notariaName: string;

  caseRef: string;
  propertyAddress: string;
  propertyComuna: string;
  propertyBuilding: string;
}

type Base = Omit<BankTheme, 'slug' | 'name' | 'shortName' | 'legalName' | 'accent' | 'accentMuted' | 'accentSoft' | 'fontFamily' | 'assistantName'>;

const BASE: Base = {
  onAccent: '#FFFFFF',
  logoUrl: '',
  buyerName: 'Andrés Fuenzalida',
  sellerName: 'Patricia Soto Miranda',
  inmobiliariaName: 'Inmobiliaria Los Almendros',
  ejecutivoName: 'Camila Reinoso',
  notariaName: 'Notaría Undurraga',
  caseRef: 'HIP-2026-0042',
  propertyAddress: 'Av. Los Leones 1240, dpto 803',
  propertyComuna: 'Providencia',
  propertyBuilding: 'Edificio Parque Los Leones',
};

export const BANK_THEMES: Record<string, BankTheme> = {
  'banco-de-chile': { ...BASE, slug: 'banco-de-chile', name: 'Banco de Chile', shortName: 'Banco de Chile', legalName: 'Banco de Chile', accent: '#00427A', accentMuted: '#00305E', accentSoft: '#E8EFF6', fontFamily: "'Inter', sans-serif", assistantName: 'Elisa' },
  bancoestado: { ...BASE, slug: 'bancoestado', name: 'BancoEstado', shortName: 'BancoEstado', legalName: 'Banco del Estado de Chile', accent: '#F47B20', accentMuted: '#D2631A', accentSoft: '#FEF1E7', fontFamily: "'Nunito Sans', sans-serif", assistantName: 'Rayen' },
  itau: { ...BASE, slug: 'itau', name: 'Itau', shortName: 'Itau', legalName: 'Banco Itau Chile', accent: '#EC7000', accentMuted: '#C85E00', accentSoft: '#FEF0E5', fontFamily: "'Inter', sans-serif", assistantName: 'Alicia' },
  scotiabank: { ...BASE, slug: 'scotiabank', name: 'Scotiabank', shortName: 'Scotiabank', legalName: 'Scotiabank Chile', accent: '#EC111A', accentMuted: '#C40E16', accentSoft: '#FDECED', fontFamily: "'Montserrat', sans-serif", assistantName: 'Sofia' },
  consorcio: { ...BASE, slug: 'consorcio', name: 'Consorcio', shortName: 'Consorcio', legalName: 'Banco Consorcio', accent: '#002F6C', accentMuted: '#00234F', accentSoft: '#E7ECF3', fontFamily: "'Inter', sans-serif", assistantName: 'Antonia' },
  'banco-falabella': { ...BASE, slug: 'banco-falabella', name: 'Banco Falabella', shortName: 'Falabella', legalName: 'Banco Falabella', accent: '#009639', accentMuted: '#00762D', accentSoft: '#E6F5EC', fontFamily: "'Inter', sans-serif", assistantName: 'Javiera' },
  bice: { ...BASE, slug: 'bice', name: 'Banco BICE', shortName: 'BICE', legalName: 'Banco BICE', accent: '#002E6D', accentMuted: '#002253', accentSoft: '#E7EBF2', fontFamily: "'Inter', sans-serif", assistantName: 'Isidora' },
  coopeuch: { ...BASE, slug: 'coopeuch', name: 'Coopeuch', shortName: 'Coopeuch', legalName: 'Cooperativa Coopeuch', accent: '#D8232A', accentMuted: '#B01C22', accentSoft: '#FBEAEB', fontFamily: "'Nunito Sans', sans-serif", assistantName: 'Emilia' },
  bci: { ...BASE, slug: 'bci', name: 'Bci', shortName: 'Bci', legalName: 'Banco de Credito e Inversiones', accent: '#002F87', accentMuted: '#00246A', accentSoft: '#E7ECF6', fontFamily: "'Inter', sans-serif", assistantName: 'Trinidad' },
  'institucion-a': { ...BASE, slug: 'institucion-a', name: 'Banco Santander', shortName: 'Santander', legalName: 'Banco Santander Chile', accent: '#EC0000', accentMuted: '#C50000', accentSoft: '#FDECEC', fontFamily: "'Poppins', sans-serif", assistantName: 'Eugenia' },
};

/** Tema neutro. Se sirve cuando no se indica institucion. */
export const NEUTRAL_THEME: BankTheme = {
  ...BASE,
  slug: 'generico',
  name: 'Banco Demo',
  shortName: 'Banco Demo',
  legalName: 'Banco Demo',
  accent: '#1F6FEB',
  accentMuted: '#1858BE',
  accentSoft: '#E9F1FE',
  fontFamily: "'Inter', sans-serif",
  assistantName: 'Elena',
};

export const BANK_SLUGS = Object.keys(BANK_THEMES);

/** Lee el identificador de la URL. Admite ?t=slug y ?tenant=slug. */
export function readSlugFromUrl(): string | null {
  if (typeof window === 'undefined') return null;
  const p = new URLSearchParams(window.location.search);
  return p.get('t') ?? p.get('tenant');
}

/**
 * Resuelve el tema. Devuelve el neutro si el identificador no existe:
 * nunca cae en la identidad de otra institucion.
 */
export function resolveTheme(slug?: string | null): BankTheme {
  if (!slug) return NEUTRAL_THEME;
  return BANK_THEMES[slug.toLowerCase()] ?? NEUTRAL_THEME;
}
