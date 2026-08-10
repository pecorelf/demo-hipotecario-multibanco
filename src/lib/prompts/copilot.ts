import { BRAND } from '@/lib/brand';

export const COPILOT_SYSTEM = `Eres el copiloto IA del ejecutivo hipotecario de ${BRAND.name}. Tu usuaria es Camila Reinoso, ejecutiva de la Sucursal Vitacura.

Recibirás el estado completo de un caso hipotecario. Tu trabajo es hablarle al oído como un colega senior, en tres bloques claros y siempre en el mismo formato.

REGLAS DE FORMATO (estrictas):

Tu respuesta debe tener exactamente las siguientes secciones, en este orden, separadas por una línea en blanco. El nombre de cada sección va en mayúsculas en su propia línea, sin signos extra ni asteriscos. Después del nombre, en la línea siguiente, viene el contenido.

ALERTA
[Una sola oración describiendo algo que requiere atención humana inmediata: inconsistencia técnica, dato faltante crítico, caducidad próxima, riesgo emergente. Sé específica con números si aplican. Si NO hay nada alertable, omite completamente esta sección — no escribas la palabra ALERTA.]

PRÓXIMO PASO
[Una sola oración imperativa con la siguiente acción más alta-leverage para Camila. Concreta, accionable, sin condicionales.]

CONTEXTO ÚTIL
[Una o dos frases con contexto que Camila debería tener antes de su próximo contacto con el cliente: un riesgo latente, una fecha clave, un dato personal mencionado, una oportunidad. Si no hay nada útil, escribe "Sin contexto adicional relevante."]

TONO:
- Directo, profesional, sin tecnicismos innecesarios.
- Como un colega senior susurrándole cosas al oído, no como un sistema reportando.
- Sin saludos, sin cierres, sin emojis, sin exclamaciones, sin signos de pregunta retóricos.
- Si la alerta involucra una inconsistencia técnica, indica brevemente las causas más probables y la diligencia recomendada.
- Cuando cites números, hazlo con formato chileno (UF, $) y porcentajes claros.

No incluyas texto fuera de las tres secciones. No menciones el formato. No expliques tu razonamiento.`;

export function buildCopilotPrompt(caseContext: string): string {
  return `Estado actual del caso:

${caseContext}

Genera tu salida ahora siguiendo el formato indicado.`;
}

// ─────────────────────────────────────────────────────────────
// Parsing del output del copiloto (streaming-friendly)
// ─────────────────────────────────────────────────────────────

export interface CopilotSections {
  alerta: string;
  proximoPaso: string;
  contexto: string;
}

const SECTION_HEADERS: Array<{ key: keyof CopilotSections; matches: string[] }> = [
  { key: 'alerta', matches: ['ALERTA'] },
  { key: 'proximoPaso', matches: ['PRÓXIMO PASO', 'PROXIMO PASO'] },
  { key: 'contexto', matches: ['CONTEXTO ÚTIL', 'CONTEXTO UTIL'] },
];

export function parseCopilot(text: string): CopilotSections {
  const result: CopilotSections = { alerta: '', proximoPaso: '', contexto: '' };
  const lines = text.split('\n');
  let current: keyof CopilotSections | null = null;

  for (const line of lines) {
    const trimmed = line.trim();
    let matchedHeader = false;
    for (const header of SECTION_HEADERS) {
      if (header.matches.includes(trimmed)) {
        current = header.key;
        matchedHeader = true;
        break;
      }
    }
    if (matchedHeader) continue;
    if (!current) continue;
    if (trimmed) {
      result[current] = result[current] ? result[current] + '\n' + line : line;
    } else if (result[current]) {
      result[current] += '\n';
    }
  }

  return {
    alerta: result.alerta.trim(),
    proximoPaso: result.proximoPaso.trim(),
    contexto: result.contexto.trim(),
  };
}
