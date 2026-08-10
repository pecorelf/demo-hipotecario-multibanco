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
    bank: 'Banco Competidor C',
    headline: 'Competidor C baja tasa fija a 3,39% y consolida 100% digital end-to-end',
    body: 'Competidor C mantiene el liderazgo en tasa por séptimo mes consecutivo, con una propuesta totalmente digital que reduce el tiempo de aprobación a 7 días en promedio según mediciones de la propia entidad. Su volumen de hipotecarios creció 18% YoY al cierre del trimestre.',
    date: '2026-05-12',
    source: 'Diario Financiero · scraping de portales bancarios',
    severity: 'amenaza',
    category: 'Tasa y digital',
  },
  {
    id: 'intel-2',
    bank: 'Competidor A',
    headline: 'Competidor A lanza FOGAES Plus con UF 5.000 de tope',
    body: 'Competidor A extendió su programa FOGAES a propiedades de hasta UF 5.000 (vs UF 4.000 del piso estatal), absorbiendo el diferencial vía subsidio interno. Estiman captar 1.200 operaciones adicionales en H2 2026.',
    date: '2026-05-08',
    source: 'Refinitiv · comunicado oficial banco',
    severity: 'amenaza',
    category: 'Subsidios y campañas',
  },
  {
    id: 'intel-3',
    bank: 'BCI',
    headline: 'BCI integra IA generativa para asesoría hipotecaria en su app',
    body: 'BCI piloteó un asistente conversacional dentro de su app para guiar al cliente durante la simulación. Reportan caída del 23% en tasa de abandono del simulador y aumento del 14% en pre-aprobaciones generadas. Sigue siendo piloto en 4 sucursales.',
    date: '2026-05-04',
    source: 'Bloomberg LatAm · análisis técnico interno',
    severity: 'amenaza',
    category: 'IA y experiencia',
  },
  {
    id: 'intel-4',
    bank: 'Competidor D',
    headline: 'Competidor D pierde 9% de cuota en hipotecario residencial',
    body: 'Competidor D reportó caída en colocaciones hipotecarias del 9% trimestral, asociada a foco en segmento alto ingreso. Oportunidad para captar clientes desencantados con su servicio: enfoque en segmento medio (UF 3.000-5.000) y velocidad de respuesta.',
    date: '2026-04-29',
    source: 'CMF · análisis interno · Refinitiv',
    severity: 'oportunidad',
    category: 'Movimientos de cuota',
  },
  {
    id: 'intel-5',
    bank: 'Competidor E',
    headline: 'Competidor E anuncia subsidio Ecovivienda extendido',
    body: 'Competidor E mantendrá tasa de 4,19% para propiedades con certificación de eficiencia energética hasta diciembre 2026. Esto canibaliza el segmento ABC1 que prioriza criterios ESG.',
    date: '2026-04-25',
    source: 'Comunicado Competidor E · scraping sitios bancarios',
    severity: 'neutral',
    category: 'Sostenibilidad y nicho',
  },
];

// ─────────────────────────────────────────────────────────────
// Prompt para acciones sugeridas con IA (por noticia)
// ─────────────────────────────────────────────────────────────

export const COMPETITIVE_ACTIONS_SYSTEM = `Eres Aurora, estratega comercial para Macarena Ibáñez, dueña del proceso hipotecario de ${BRAND.name}.

Recibes una noticia de inteligencia competitiva del mercado hipotecario chileno. Tu tarea: generar EXACTAMENTE 3 acciones comerciales concretas que ${BRAND.shortName} podría tomar como respuesta.

Reglas para cada acción:
- Específica, no genérica. Nombra montos, plazos, segmentos cuando aplique.
- Accionable en máximo 30 días, no proyectos de un año.
- Cuantifica el impacto esperado cuando sea posible (% conversión, # operaciones, días, $).
- Asigna un dueño plausible: Felipe Contreras (Gerente Operaciones), Eugenio Millar (Reingeniería), Priscilla Von Dessauer (Transformación), José Molina (Tecnología), Paola López (Coord. Hipotecaria), Carolina (directo), o "Comercial regional".
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
