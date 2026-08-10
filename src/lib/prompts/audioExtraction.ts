import { extractAllTagged, extractTagged } from '@/lib/claude';
import type { AudioExtraction } from '@/types';
import { BRAND } from '@/lib/brand';

export const AUDIO_EXTRACTION_SYSTEM = `Eres un asistente que escucha grabaciones de llamadas entre un ejecutivo hipotecario de ${BRAND.name} y un potencial cliente.

A partir de la transcripción que recibirás, extrae información estructurada para pre-llenar el caso en el sistema.

REGLAS DE EXTRACCIÓN:
- Sé conservador: si un dato no aparece o no es claro, déjalo vacío (etiqueta sin contenido o sin items).
- No inventes nada. Si la transcripción no menciona el RUT, no lo inventes.
- Para listas (documentos, próximos pasos, preocupaciones), incluye cada elemento en un <item> separado. Si no hay elementos, omite todos los <item>.
- Para "intent", escribe una sola frase descriptiva del propósito de la llamada.
- Para "propertyInfo", incluye ubicación + tipo + valor cuando estén disponibles.
- Para "maritalContext", incluye estado civil, régimen patrimonial y nombre de cónyuge/pareja si aparecen.
- "budgetAmount" debe ser sólo el número (sin separadores). "budgetUnit" es "UF" o "CLP".

REGLAS DE FORMATO:
Responde EXCLUSIVAMENTE con el bloque <extraction>...</extraction>. Sin texto antes ni después. Sin explicaciones. Sin saludo. Sin meta-comentarios.

Estructura exacta:

<extraction>
<clientName>Nombre completo o vacío</clientName>
<clientRut>RUT formato XX.XXX.XXX-X o vacío</clientRut>
<intent>Resumen 1 frase del propósito de la llamada</intent>
<budgetAmount>Número sin separadores, o vacío</budgetAmount>
<budgetUnit>UF o CLP, vacío si no hay monto</budgetUnit>
<propertyInfo>Descripción de la propiedad o vacío</propertyInfo>
<maritalContext>Estado civil y régimen + cónyuge si aparece, o vacío</maritalContext>
<documentsClientHas>
<item>documento que el cliente menciona tener</item>
</documentsClientHas>
<documentsClientLacks>
<item>documento que el cliente menciona no tener todavía</item>
</documentsClientLacks>
<nextStepsImplied>
<item>siguiente paso implícito en la conversación</item>
</nextStepsImplied>
<clientConcerns>
<item>preocupación o restricción que mencionó el cliente</item>
</clientConcerns>
</extraction>`;

export function buildAudioExtractionPrompt(transcript: string): string {
  return `Aquí está la transcripción de la llamada:

"""
${transcript}
"""

Extrae los datos siguiendo el formato indicado.`;
}

// ─────────────────────────────────────────────────────────────
// Parsing del output (streaming-friendly)
// ─────────────────────────────────────────────────────────────

export function parseAudioExtraction(text: string): Partial<AudioExtraction> {
  const result: Partial<AudioExtraction> = {};

  const clientName = extractTagged(text, 'clientName');
  if (clientName !== null) result.clientName = clientName || null;

  const clientRut = extractTagged(text, 'clientRut');
  if (clientRut !== null) result.clientRut = clientRut || null;

  const intent = extractTagged(text, 'intent');
  if (intent !== null) result.intent = intent;

  const budgetAmountRaw = extractTagged(text, 'budgetAmount');
  const budgetUnitRaw = extractTagged(text, 'budgetUnit');
  if (budgetAmountRaw && budgetUnitRaw) {
    const amount = Number(budgetAmountRaw.replace(/[^\d.]/g, ''));
    const unit = budgetUnitRaw.toUpperCase();
    if (!Number.isNaN(amount) && (unit === 'UF' || unit === 'CLP')) {
      result.budget = { amount, unit: unit as 'UF' | 'CLP' };
    }
  }

  const propertyInfo = extractTagged(text, 'propertyInfo');
  if (propertyInfo !== null) result.propertyInfo = propertyInfo || null;

  const maritalContext = extractTagged(text, 'maritalContext');
  if (maritalContext !== null) result.maritalContext = maritalContext || null;

  // Lists — only consider them "done" when the wrapper tag has closed
  const docHasWrapper = extractTagged(text, 'documentsClientHas');
  if (docHasWrapper !== null) {
    result.documentsClientHas = extractAllTagged(docHasWrapper, 'item');
  }

  const docLacksWrapper = extractTagged(text, 'documentsClientLacks');
  if (docLacksWrapper !== null) {
    result.documentsClientLacks = extractAllTagged(docLacksWrapper, 'item');
  }

  const stepsWrapper = extractTagged(text, 'nextStepsImplied');
  if (stepsWrapper !== null) {
    result.nextStepsImplied = extractAllTagged(stepsWrapper, 'item');
  }

  const concernsWrapper = extractTagged(text, 'clientConcerns');
  if (concernsWrapper !== null) {
    result.clientConcerns = extractAllTagged(concernsWrapper, 'item');
  }

  return result;
}
