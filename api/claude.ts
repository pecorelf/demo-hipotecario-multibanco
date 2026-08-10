/**
 * /api/claude — Edge Function that proxies requests to the Anthropic Messages API.
 *
 * The frontend POSTs here instead of calling api.anthropic.com directly.
 * The API key lives ONLY on the server side (ANTHROPIC_API_KEY env var).
 *
 * Supports both streaming (stream: true) and non-streaming responses.
 * Streaming passes through the SSE response from Anthropic to the client.
 *
 * Edge Runtime is used because:
 *  - It supports streaming responses natively without the 10s timeout
 *    that affects Node serverless functions on the Hobby plan.
 *  - Cold starts are faster.
 *  - It runs closer to the user (and is configurable to run near Anthropic).
 */

export const config = {
  runtime: 'edge',
  regions: ['iad1'], // us-east-1, closest to Anthropic's servers
};

interface AnthropicRequestBody {
  model: string;
  max_tokens: number;
  temperature?: number;
  system?: string;
  messages: Array<{ role: 'user' | 'assistant'; content: string }>;
  stream?: boolean;
}

const ALLOWED_MODELS = new Set([
  'claude-sonnet-4-6',
  'claude-opus-4-6',
  'claude-opus-4-7',
  'claude-opus-4-8',
  'claude-haiku-4-5-20251001',
]);

const MAX_MESSAGES = 50; // defensive limit to avoid abuse
const MAX_TOTAL_CHARS = 200_000; // ~50k tokens approximate

export default async function handler(req: Request): Promise<Response> {
  // Only POST allowed
  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  // Read API key from env (server-side, never exposed)
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return jsonResponse(
      { error: 'Server not configured: ANTHROPIC_API_KEY missing' },
      500,
    );
  }

  // Parse body
  let body: AnthropicRequestBody;
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ error: 'Invalid JSON body' }, 400);
  }

  // Validate body
  const validationError = validateBody(body);
  if (validationError) {
    return jsonResponse({ error: validationError }, 400);
  }

  // Build request to Anthropic
  const anthropicBody = {
    model: body.model,
    max_tokens: body.max_tokens,
    ...(body.temperature !== undefined && { temperature: body.temperature }),
    ...(body.system && { system: body.system }),
    messages: body.messages,
    stream: body.stream ?? false,
  };

  let anthropicResponse: Response;
  try {
    anthropicResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(anthropicBody),
    });
  } catch (err) {
    return jsonResponse(
      {
        error: 'Network error reaching Anthropic',
        detail: (err as Error)?.message,
      },
      502,
    );
  }

  // If Anthropic returned an error, pass it through with the same status
  if (!anthropicResponse.ok) {
    const errorText = await anthropicResponse.text();
    // Don't leak the API key or internal details — pass through Anthropic's error
    return new Response(errorText, {
      status: anthropicResponse.status,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Streaming case: pass through the SSE response
  if (body.stream) {
    if (!anthropicResponse.body) {
      return jsonResponse({ error: 'No response body from Anthropic' }, 502);
    }
    return new Response(anthropicResponse.body, {
      status: 200,
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        'Connection': 'keep-alive',
      },
    });
  }

  // Non-streaming: read the JSON and forward it
  const data = await anthropicResponse.json();
  return jsonResponse(data, 200);
}

// ─── Helpers ─────────────────────────────────────────────────

function jsonResponse(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function validateBody(body: AnthropicRequestBody): string | null {
  if (!body.model || typeof body.model !== 'string') {
    return 'model is required and must be a string';
  }
  if (!ALLOWED_MODELS.has(body.model)) {
    return `model "${body.model}" is not in the allowed list`;
  }
  if (
    typeof body.max_tokens !== 'number' ||
    body.max_tokens < 1 ||
    body.max_tokens > 8192
  ) {
    return 'max_tokens must be a number between 1 and 8192';
  }
  if (
    body.temperature !== undefined &&
    (typeof body.temperature !== 'number' ||
      body.temperature < 0 ||
      body.temperature > 1)
  ) {
    return 'temperature must be between 0 and 1';
  }
  if (!Array.isArray(body.messages) || body.messages.length === 0) {
    return 'messages must be a non-empty array';
  }
  if (body.messages.length > MAX_MESSAGES) {
    return `messages array exceeds ${MAX_MESSAGES} items`;
  }
  let totalChars = 0;
  for (const m of body.messages) {
    if (m.role !== 'user' && m.role !== 'assistant') {
      return 'each message must have role "user" or "assistant"';
    }
    if (typeof m.content !== 'string') {
      return 'each message.content must be a string';
    }
    totalChars += m.content.length;
  }
  if (body.system) {
    if (typeof body.system !== 'string') return 'system must be a string';
    totalChars += body.system.length;
  }
  if (totalChars > MAX_TOTAL_CHARS) {
    return `total content size exceeds ${MAX_TOTAL_CHARS} characters`;
  }
  return null;
}
