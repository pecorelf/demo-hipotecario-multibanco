import type { ClaudeMessage } from '@/types';

/**
 * Claude API client — talks to /api/claude (our Vercel Edge Function),
 * never directly to Anthropic. The API key lives only on the server.
 *
 * In dev mode, /api is proxied to a local server (see vite.config.ts).
 * In production, /api is served by Vercel Functions in the same deploy.
 */

export const CLAUDE_MODEL = 'claude-sonnet-4-6';
const MAX_RETRIES = 3;
const BASE_BACKOFF_MS = 500;

// The proxy endpoint is relative — same origin in both dev and prod
const PROXY_ENDPOINT = '/api/claude';

// ─────────────────────────────────────────────────────────────
// Errores
// ─────────────────────────────────────────────────────────────

export type ClaudeErrorKind =
  | 'auth'
  | 'rate_limit'
  | 'server'
  | 'network'
  | 'bad_request'
  | 'cancelled'
  | 'parse'
  | 'unknown';

export class ClaudeApiError extends Error {
  readonly kind: ClaudeErrorKind;
  readonly status?: number;
  readonly cause?: unknown;

  constructor(message: string, kind: ClaudeErrorKind, status?: number, cause?: unknown) {
    super(message);
    this.name = 'ClaudeApiError';
    this.kind = kind;
    this.status = status;
    this.cause = cause;
  }
}

function isAbortError(err: unknown): boolean {
  if (!err) return false;
  const e = err as { name?: string; message?: string; code?: string };
  if (e?.name === 'AbortError') return true;
  if (e?.message === 'Aborted' || e?.message === 'aborted') return true;
  if (e?.code === 'ABORT_ERR') return true;
  return false;
}

function classifyError(err: unknown): ClaudeApiError {
  if (err instanceof ClaudeApiError) return err;
  if (isAbortError(err)) {
    return new ClaudeApiError('Solicitud cancelada', 'cancelled', undefined, err);
  }

  const e = err as { status?: number; message?: string };
  const status = e?.status;
  const message = e?.message ?? 'Error desconocido en Claude API';

  if (status === 401 || status === 403) {
    return new ClaudeApiError(
      'Configuración del servidor inválida. Revisa los logs del proxy.',
      'auth',
      status,
      err,
    );
  }
  if (status === 429) {
    return new ClaudeApiError(
      'Rate limit alcanzado. Reintenta en unos segundos.',
      'rate_limit',
      status,
      err,
    );
  }
  if (status && status >= 500) {
    return new ClaudeApiError(
      'Error del servidor. Reintenta.',
      'server',
      status,
      err,
    );
  }
  if (status && status >= 400) {
    return new ClaudeApiError(message, 'bad_request', status, err);
  }
  if (!status) {
    return new ClaudeApiError(
      'Error de red. Revisa tu conexión.',
      'network',
      undefined,
      err,
    );
  }
  return new ClaudeApiError(message, 'unknown', status, err);
}

const RETRIABLE: readonly ClaudeErrorKind[] = ['rate_limit', 'server', 'network'];

// ─────────────────────────────────────────────────────────────
// Backoff
// ─────────────────────────────────────────────────────────────

function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException('Aborted', 'AbortError'));
      return;
    }
    const t = setTimeout(() => {
      signal?.removeEventListener('abort', onAbort);
      resolve();
    }, ms);
    function onAbort() {
      clearTimeout(t);
      reject(new DOMException('Aborted', 'AbortError'));
    }
    signal?.addEventListener('abort', onAbort, { once: true });
  });
}

async function withRetry<T>(
  fn: (attempt: number) => Promise<T>,
  signal?: AbortSignal,
): Promise<T> {
  let lastError: ClaudeApiError | null = null;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      return await fn(attempt);
    } catch (err) {
      const classified = classifyError(err);
      if (classified.kind === 'cancelled') throw classified;
      if (attempt === MAX_RETRIES || !RETRIABLE.includes(classified.kind)) {
        throw classified;
      }
      lastError = classified;
      const delay = BASE_BACKOFF_MS * 2 ** attempt + Math.floor(Math.random() * 150);
      await sleep(delay, signal);
    }
  }

  throw lastError ?? new ClaudeApiError('Reintentos agotados', 'unknown');
}

// ─────────────────────────────────────────────────────────────
// Opciones públicas
// ─────────────────────────────────────────────────────────────

export interface ClaudeOptions {
  maxTokens?: number;
  temperature?: number;
  model?: string;
  signal?: AbortSignal;
}

export type StreamChunkHandler = (chunk: string, full: string) => void;

// ─────────────────────────────────────────────────────────────
// Helper: parse a single SSE event line and extract text delta
// ─────────────────────────────────────────────────────────────

interface SSEParsed {
  type: 'text_delta' | 'message_stop' | 'error' | 'other';
  text?: string;
  errorMessage?: string;
}

function parseSSEEvent(eventData: string): SSEParsed {
  try {
    const parsed = JSON.parse(eventData);
    if (parsed.type === 'content_block_delta' && parsed.delta?.type === 'text_delta') {
      return { type: 'text_delta', text: parsed.delta.text ?? '' };
    }
    if (parsed.type === 'message_stop') {
      return { type: 'message_stop' };
    }
    if (parsed.type === 'error') {
      return {
        type: 'error',
        errorMessage: parsed.error?.message ?? 'Stream error',
      };
    }
    return { type: 'other' };
  } catch {
    return { type: 'other' };
  }
}

// ─────────────────────────────────────────────────────────────
// streamClaude — callback streaming via fetch + ReadableStream
// ─────────────────────────────────────────────────────────────

export async function streamClaude(
  messages: ClaudeMessage[],
  system: string | undefined,
  onChunk: StreamChunkHandler,
  options: ClaudeOptions = {},
): Promise<string> {
  const { maxTokens = 1024, temperature = 0.7, model = CLAUDE_MODEL, signal } = options;

  return withRetry(async () => {
    if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');

    const response = await fetch(PROXY_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        max_tokens: maxTokens,
        temperature,
        ...(system ? { system } : {}),
        messages,
        stream: true,
      }),
      signal,
    });

    if (!response.ok) {
      let errBody: { error?: { message?: string }; error_message?: string } = {};
      try {
        errBody = await response.json();
      } catch {
        /* ignore */
      }
      const message =
        errBody.error?.message ??
        errBody.error_message ??
        `HTTP ${response.status}`;
      const err = new Error(message) as Error & { status: number };
      err.status = response.status;
      throw err;
    }

    if (!response.body) {
      throw new ClaudeApiError('Stream sin cuerpo de respuesta', 'server');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let full = '';

    try {
      while (true) {
        if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');

        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // SSE events are separated by blank lines (\n\n)
        let blankLine: number;
        while ((blankLine = buffer.indexOf('\n\n')) !== -1) {
          const rawEvent = buffer.slice(0, blankLine);
          buffer = buffer.slice(blankLine + 2);

          // Extract data: lines from the event
          const dataLines = rawEvent
            .split('\n')
            .filter((line) => line.startsWith('data: '))
            .map((line) => line.slice(6));

          if (dataLines.length === 0) continue;
          const eventData = dataLines.join('\n');

          if (eventData === '[DONE]') continue;

          const parsed = parseSSEEvent(eventData);

          if (parsed.type === 'text_delta' && parsed.text) {
            full += parsed.text;
            onChunk(parsed.text, full);
          } else if (parsed.type === 'error') {
            throw new ClaudeApiError(
              parsed.errorMessage ?? 'Stream error',
              'server',
            );
          }
          // message_stop and other events: do nothing, just continue
        }
      }
    } finally {
      try {
        reader.releaseLock();
      } catch {
        /* ignore */
      }
    }

    return full;
  }, signal);
}

// ─────────────────────────────────────────────────────────────
// claudeCompletion — non-streaming via fetch
// ─────────────────────────────────────────────────────────────

interface AnthropicMessageResponse {
  content: Array<{ type: string; text?: string }>;
}

export async function claudeCompletion(
  messages: ClaudeMessage[],
  system?: string,
  options: ClaudeOptions = {},
): Promise<string> {
  const { maxTokens = 1024, temperature = 0.7, model = CLAUDE_MODEL, signal } = options;

  return withRetry(async () => {
    if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');

    const response = await fetch(PROXY_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        max_tokens: maxTokens,
        temperature,
        ...(system ? { system } : {}),
        messages,
        stream: false,
      }),
      signal,
    });

    if (!response.ok) {
      let errBody: { error?: { message?: string }; error_message?: string } = {};
      try {
        errBody = await response.json();
      } catch {
        /* ignore */
      }
      const message =
        errBody.error?.message ??
        errBody.error_message ??
        `HTTP ${response.status}`;
      const err = new Error(message) as Error & { status: number };
      err.status = response.status;
      throw err;
    }

    const data = (await response.json()) as AnthropicMessageResponse;

    return data.content
      .filter((block) => block.type === 'text' && typeof block.text === 'string')
      .map((b) => b.text as string)
      .join('\n');
  }, signal);
}

// ─────────────────────────────────────────────────────────────
// extractStructured — JSON extraction from prose (unchanged)
// ─────────────────────────────────────────────────────────────

export type StructuredValidator<T> = (value: unknown) => T;

function extractBalancedBlock(text: string, open: string, close: string): string | null {
  const start = text.indexOf(open);
  if (start === -1) return null;

  let depth = 0;
  let inString = false;
  let escape = false;

  for (let i = start; i < text.length; i++) {
    const c = text[i];
    if (escape) {
      escape = false;
      continue;
    }
    if (c === '\\') {
      escape = true;
      continue;
    }
    if (c === '"') {
      inString = !inString;
      continue;
    }
    if (inString) continue;
    if (c === open) depth++;
    else if (c === close) {
      depth--;
      if (depth === 0) return text.slice(start, i + 1);
    }
  }
  return null;
}

export function extractStructured<T = unknown>(
  text: string,
  validator?: StructuredValidator<T>,
): T {
  let raw: string | null = null;

  const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fence?.[1]) raw = fence[1].trim();

  if (!raw) raw = extractBalancedBlock(text, '{', '}');
  if (!raw) raw = extractBalancedBlock(text, '[', ']');

  if (!raw) {
    throw new ClaudeApiError(
      'No se encontró JSON en la respuesta. Pide explícitamente al modelo "responde solo con JSON".',
      'parse',
    );
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (err) {
    throw new ClaudeApiError(
      `JSON inválido en la respuesta: ${(err as Error).message}`,
      'parse',
      undefined,
      err,
    );
  }

  return validator ? validator(parsed) : (parsed as T);
}

// ─────────────────────────────────────────────────────────────
// extractTagged — pulls content out of <tag>...</tag> (unchanged)
// ─────────────────────────────────────────────────────────────

export function extractTagged(text: string, tag: string): string | null {
  const re = new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`, 'i');
  const match = text.match(re);
  return match?.[1]?.trim() ?? null;
}

export function extractAllTagged(text: string, tag: string): string[] {
  const re = new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`, 'gi');
  const out: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    const inner = m[1]?.trim();
    if (inner) out.push(inner);
  }
  return out;
}

export function stripTagged(text: string, tag: string): string {
  const re = new RegExp(`<${tag}>[\\s\\S]*?</${tag}>`, 'gi');
  return text.replace(re, '').trimEnd();
}
