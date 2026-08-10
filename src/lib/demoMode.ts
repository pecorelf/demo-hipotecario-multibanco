import cachedResponsesRaw from '@/data/cached-responses.json';

const STORAGE_KEY = 'hipotecia-demo-mode';
const STORAGE_RESET_KEY = 'hipotecia-reset-key';
const DEFAULT_TIMEOUT_MS = 4000;

interface CachedResponse {
  description: string;
  matchHints: string[];
  text: string;
}

const cachedResponses: Record<string, CachedResponse> = cachedResponsesRaw as Record<
  string,
  CachedResponse
>;

// ─────────────────────────────────────────────────────────────
// Demo mode flag
// ─────────────────────────────────────────────────────────────

export function isDemoMode(): boolean {
  if (typeof window === 'undefined') return false;
  return window.localStorage.getItem(STORAGE_KEY) === 'true';
}

export function setDemoMode(enabled: boolean): void {
  if (typeof window === 'undefined') return;
  if (enabled) {
    window.localStorage.setItem(STORAGE_KEY, 'true');
  } else {
    window.localStorage.removeItem(STORAGE_KEY);
  }
}

// ─────────────────────────────────────────────────────────────
// Cache lookup by id (preferred) or text match
// ─────────────────────────────────────────────────────────────

export function getCachedById(id: string): string | null {
  return cachedResponses[id]?.text ?? null;
}

export function getCachedByHints(prompt: string): string | null {
  const lower = prompt.toLowerCase();
  for (const entry of Object.values(cachedResponses)) {
    if (entry.matchHints.some((h) => lower.includes(h.toLowerCase()))) {
      return entry.text;
    }
  }
  return null;
}

// ─────────────────────────────────────────────────────────────
// withCacheFallback — race the API call against a timeout
// ─────────────────────────────────────────────────────────────

export interface CacheFallbackOptions {
  cacheKey?: string;
  promptForHints?: string;
  timeoutMs?: number;
}

/**
 * Wrap an async API call so that if it doesn't resolve in `timeoutMs`,
 * we fall back to a cached response. Cache is keyed by `cacheKey` first,
 * then by content hints in `promptForHints` if provided.
 *
 * - In demo mode + cache available: 4s race (default).
 * - On API error + cache available: cache is served instead of throwing.
 * - No cache available: behaves like a normal await (timeout is ignored).
 */
export async function withCacheFallback<T = string>(
  apiCall: () => Promise<T>,
  options: CacheFallbackOptions = {},
): Promise<T> {
  const { cacheKey, promptForHints, timeoutMs = DEFAULT_TIMEOUT_MS } = options;

  const cached =
    (cacheKey ? getCachedById(cacheKey) : null) ??
    (promptForHints ? getCachedByHints(promptForHints) : null);

  // No cache available → just await normally
  if (!cached) {
    return apiCall();
  }

  // Demo mode disabled → real call, cache is only used on error
  if (!isDemoMode()) {
    try {
      return await apiCall();
    } catch (err) {
      console.warn('[demo] API failed, falling back to cache:', err);
      return cached as unknown as T;
    }
  }

  // Demo mode + cache available → race
  let timeoutHandle: ReturnType<typeof setTimeout> | null = null;
  const timeoutPromise = new Promise<T>((resolve) => {
    timeoutHandle = setTimeout(() => {
      console.info(
        `[demo] API exceeded ${timeoutMs}ms, serving cache (${cacheKey ?? 'hint-matched'}).`,
      );
      resolve(cached as unknown as T);
    }, timeoutMs);
  });

  try {
    const result = await Promise.race([apiCall(), timeoutPromise]);
    if (timeoutHandle) clearTimeout(timeoutHandle);
    return result;
  } catch (err) {
    if (timeoutHandle) clearTimeout(timeoutHandle);
    console.warn('[demo] API failed, serving cache:', err);
    return cached as unknown as T;
  }
}

// ─────────────────────────────────────────────────────────────
// Reset key — bump this to force pages to remount
// ─────────────────────────────────────────────────────────────

type ResetListener = (key: number) => void;
const resetListeners = new Set<ResetListener>();
let currentResetKey = 0;

export function onReset(listener: ResetListener): () => void {
  resetListeners.add(listener);
  return () => resetListeners.delete(listener);
}

export function getResetKey(): number {
  return currentResetKey;
}

export function triggerReset(): void {
  currentResetKey += 1;
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(STORAGE_RESET_KEY, String(currentResetKey));
  }
  resetListeners.forEach((l) => l(currentResetKey));
}
