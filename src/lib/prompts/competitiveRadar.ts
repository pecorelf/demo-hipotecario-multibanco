import type { ClaudeMessage } from '@/types';
import { BRAND } from '@/lib/brand';

// ─────────────────────────────────────────────────────────────
// Dimensiones del radar y datos por banco
// ─────────────────────────────────────────────────────────────

export interface RadarDimension {
  key: string;
  label: string;
  /** 0-100 escala normalizada para el radar */
  propio: number;
  competidorC: number;
  competidorA: number;
  competidorB: number;
  /** Cifra cruda en lenguaje humano para tooltip / lectura */
  propioRaw: string;
  competidorCRaw: string;
  competidorARaw: string;
  competidorBRaw: string;
}

export const RADAR_DIMENSIONS: RadarDimension[] = [
  {
    key: 'tasa',
    label: 'Tasa nominal competitiva',
    propio: 68,
    competidorC: 95,
    competidorA: 72,
    competidorB: 78,
    propioRaw: '4,65% promedio',
    competidorCRaw: '3,39% promedio',
    competidorARaw: '4,48% promedio',
    competidorBRaw: '4,12% promedio (con campañas)',
  },
  {
    key: 'tiempo',
    label: 'Tiempo de aprobación',
    propio: 72,
    competidorC: 88,
    competidorA: 58,
    competidorB: 65,
    propioRaw: '14 días promedio',
    competidorCRaw: '7 días promedio (digital)',
    competidorARaw: '21 días promedio',
    competidorBRaw: '17 días promedio',
  },
  {
    key: 'digital',
    label: 'Oferta digital end-to-end',
    propio: 70,
    competidorC: 92,
    competidorA: 55,
    competidorB: 75,
    propioRaw: 'Simulación + pre-aprobación digital',
    competidorCRaw: '100% digital, app nativa',
    competidorARaw: 'Híbrido, requiere sucursal en varios pasos',
    competidorBRaw: 'Digital con apoyo ejecutivo',
  },
  {
    key: 'nps',
    label: 'NPS proceso hipotecario',
    propio: 82,
    competidorC: 76,
    competidorA: 71,
    competidorB: 68,
    propioRaw: 'NPS 41 (#1 sistema según DF Mar 2026)',
    competidorCRaw: 'NPS 36',
    competidorARaw: 'NPS 32',
    competidorBRaw: 'NPS 28',
  },
  {
    key: 'cobertura',
    label: 'Cobertura nacional',
    propio: 88,
    competidorC: 62,
    competidorA: 95,
    competidorB: 84,
    propioRaw: '320 sucursales',
    competidorCRaw: '95 sucursales',
    competidorARaw: '410 sucursales',
    competidorBRaw: '280 sucursales',
  },
  {
    key: 'fogaes',
    label: 'Adopción FOGAES y subsidios',
    propio: 90,
    competidorC: 65,
    competidorA: 85,
    competidorB: 72,
    propioRaw: '3.520 operaciones con FOGAES en Q1',
    competidorCRaw: '1.140 operaciones',
    competidorARaw: '3.180 operaciones',
    competidorBRaw: '1.890 operaciones',
  },
];

// ─────────────────────────────────────────────────────────────
// Noticias / inteligencia competitiva
// ─────────────────────────────────────────────────────────────

export type NewsSeverity = 'oportunidad' | 'amenaza' | 'neutral';

export interface MarketIntelItem {
  id: string;
  bank: string;
  headline: string;
  body: string;
  date: string; // ISO
  source: string;
  severity: NewsSeverity;
  category: string;
}

export const MARKET_INTEL: MarketIntelItem[] = [
  {
    id: 'intel-1',
    bank: 'Estado · Ministerio de Hacienda',
    headline: 'FOGAES ampliado: 80 mil cupos y viviendas de hasta UF 6.000',
    body: 'La Ley 21.748 amplía la garantía estatal y el subsidio a la tasa: los cupos suben de 50 mil a 80 mil, el tope de la vivienda pasa de UF 4.000 a UF 6.000 y la vigencia se extiende hasta el 31 de mayo de 2028. Según Hacienda, el 88% del stock nacional de viviendas nuevas queda dentro del tope. El subsidio rebaja hasta 60 puntos base la tasa del crédito.',
    date: '2026-08-26',
    source: 'Promulgación Ley 21.748 · Ministerio de Hacienda',
    severity: 'oportunidad',
    category: 'Subsidios y regulación',
  },
  {
    id: 'intel-2',
    bank: 'Estado · MINVU',
    headline: 'Nuevo Subsidio Tramo 4.000 abre su primer llamado en noviembre',
    body: 'Cinco mil cupos iniciales para viviendas nuevas o usadas de hasta UF 4.000, con aporte estatal de UF 400 y ahorro mínimo exigido de UF 200. Es complementable con FOGAES y con el subsidio a la tasa. Abre una ventana de captación en el segmento medio-bajo durante el último trimestre.',
    date: '2026-11-01',
    source: 'MINVU · llamado especial anunciado',
    severity: 'oportunidad',
    category: 'Subsidios y campañas',
  },
  {
    id: 'intel-3',
    bank: 'Competidor líder en tasa',
    headline: 'El competidor más agresivo sostiene 3,39% fijo en UF y encabeza el ranking',
    body: 'Mantiene la tasa más baja del mercado con criterios estrictos: renta comprobable, sin morosidades, antigüedad laboral mínima y pie sobre 20%. Con FOGAES, dos actores están ofreciendo bajo 3,3%. La diferencia frente a un crédito al 4% sobre UF 3.000 a 20 años ronda los 14 millones de pesos en intereses.',
    date: '2026-09-08',
    source: 'Comparadores públicos de tasas · portales bancarios',
    severity: 'amenaza',
    category: 'Tasa y pricing',
  },
  {
    id: 'intel-4',
    bank: 'Banco Central',
    headline: 'TPM estable en 4,5% y tasa hipotecaria promedio en torno a 4,1%',
    body: 'El Banco Central sostuvo la tasa de referencia, señalando un balance de riesgos equilibrado para la inflación. El mercado hipotecario se mueve en un rango amplio, desde cerca de 3,3% hasta 6% según banco y perfil. Una TPM estable reduce la volatilidad al fijar condiciones y favorece campañas de tasa a plazo.',
    date: '2026-09-02',
    source: 'Banco Central de Chile · cuadro T5224',
    severity: 'neutral',
    category: 'Macro y tasas',
  },
  {
    id: 'intel-5',
    bank: 'Cámara Chilena de la Construcción',
    headline: 'Stock de 99.600 viviendas nuevas disponibles a nivel nacional',
    body: 'Al 30 de junio el stock en oferta alcanzaba las 99.600 unidades, de las cuales el 88% queda bajo el nuevo tope de UF 6.000. El volumen disponible presiona a las inmobiliarias a cerrar rápido, y favorece al banco que resuelva la operación en menos días.',
    date: '2026-08-20',
    source: 'Cámara Chilena de la Construcción',
    severity: 'oportunidad',
    category: 'Oferta inmobiliaria',
  },
];

// ─────────────────────────────────────────────────────────────
// Prompt para acciones sugeridas con IA (por noticia)
// ─────────────────────────────────────────────────────────────

export const COMPETITIVE_ACTIONS_SYSTEM = `Eres Aurora, estratega comercial para Constanza Vera, dueña del proceso hipotecario de ${BRAND.name}.

Recibes una noticia de inteligencia competitiva del mercado hipotecario chileno. Tu tarea: generar EXACTAMENTE 3 acciones comerciales concretas que ${BRAND.shortName} podría tomar como respuesta.

Reglas para cada acción:
- Específica, no genérica. Nombra montos, plazos, segmentos cuando aplique.
- Accionable en máximo 30 días, no proyectos de un año.
- Cuantifica el impacto esperado cuando sea posible (% conversión, # operaciones, días, $).
- Asigna un dueño plausible: Ignacio Bravo (Gerente de Operaciones), Andrés Lagos (Reingeniería), Valentina Ossa (Transformación), Rodrigo Tapia (Tecnología), Javiera Núñez (Coordinación Hipotecaria), o "Comercial regional".
- Tono: directo, ejecutiva senior, español neutro chileno. Sin emojis, sin adornos.

FORMATO DE RESPUESTA (estricto JSON):
Tu respuesta debe ser EXCLUSIVAMENTE un objeto JSON dentro de etiquetas <actions>...</actions>, sin texto antes ni después. La estructura es:

<actions>
{
  "actions": [
    {
      "title": "Título breve y accionable, 6-10 palabras",
      "description": "1-2 frases explicando la acción y por qué",
      "owner": "Nombre del dueño",
      "horizon": "Plazo concreto (ej. 'esta semana', '2 semanas', '30 días')",
      "expectedImpact": "Impacto cuantificado o cualitativo en 1 frase"
    }
  ]
}
</actions>

El array "actions" DEBE contener exactamente 3 elementos.`;

export function buildCompetitiveActionsPrompt(item: MarketIntelItem): string {
  return `Noticia de inteligencia competitiva:

Banco: ${item.bank}
Categoría: ${item.category}
Severidad para ${BRAND.shortName}: ${item.severity}
Fecha: ${item.date}
Titular: ${item.headline}
Detalle: ${item.body}

Genera ahora las 3 acciones sugeridas para ${BRAND.shortName}.`;
}

export interface CompetitiveAction {
  title: string;
  description: string;
  owner: string;
  horizon: string;
  expectedImpact: string;
}

export interface CompetitiveActionsResult {
  actions: CompetitiveAction[];
}

// ─────────────────────────────────────────────────────────────
// Prompt para el podcast (script de 90 segundos)
// ─────────────────────────────────────────────────────────────

export const PODCAST_SCRIPT_SYSTEM = `Eres una analista de inteligencia de mercado para ${BRAND.name}. Generas un guión para un podcast corto de aproximadamente 90 segundos de duración que resume la inteligencia competitiva de la semana en el mercado hipotecario chileno.

Reglas:
- Una sola voz (presentadora). Sin diálogos.
- Tono: ejecutiva senior conversando con su par. Profesional pero cercano. Español neutro chileno, tratá de "ustedes" porque es para un equipo.
- Sin emojis, sin exclamaciones múltiples.
- Estructura: (1) saludo brevísimo, (2) titular principal, (3) 2-3 movimientos clave del mercado, (4) qué significa para ${BRAND.shortName}, (5) cierre con una idea accionable.
- Longitud objetivo: 220-260 palabras (lectura natural de ~90 segundos).
- Sin secciones ni bullets. Prosa fluida y oral.
- Pronunciable: evitar nombres demasiado largos o tecnicismos. Por ejemplo, di "FOGAES" no "F-O-G-A-E-S".
- Cuando cites cifras, hazlo de forma redondeada y conversacional. "Casi cuatro mil operaciones" en vez de "3.520 operaciones".

Tu respuesta debe ser SOLO el texto del guión, sin etiquetas ni metadatos.`;

export function buildPodcastScriptPrompt(items: MarketIntelItem[]): string {
  const itemsTxt = items
    .map(
      (i, idx) =>
        `${idx + 1}. ${i.bank} (${i.severity}): ${i.headline}. ${i.body}`,
    )
    .join('\n\n');

  return `Inteligencia de la semana en hipotecario Chile:

${itemsTxt}

Generá el guión del podcast ahora siguiendo las reglas. Estamos en mayo 2026.`;
}

// ─────────────────────────────────────────────────────────────
// Helper para construir mensajes
// ─────────────────────────────────────────────────────────────

export function asUserMessages(content: string): ClaudeMessage[] {
  return [{ role: 'user', content }];
}
