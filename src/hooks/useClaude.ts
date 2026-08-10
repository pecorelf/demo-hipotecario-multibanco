import { useCallback, useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  ClaudeApiError,
  claudeCompletion,
  streamClaude,
} from '@/lib/claude';
import { getCachedById, getCachedByHints, isDemoMode } from '@/lib/demoMode';
import type { ClaudeMessage } from '@/types';

// ─────────────────────────────────────────────────────────────
// useClaudeStream
// ─────────────────────────────────────────────────────────────

export interface ClaudeStreamInput {
  messages: ClaudeMessage[];
  system?: string;
  maxTokens?: number;
  temperature?: number;
  /** When provided + demo mode active, fallback to this cache entry if first chunk doesn't arrive in time. */
  cacheKey?: string;
  /** ms to wait for the first chunk before serving cache. Default 4000. */
  cacheTimeoutMs?: number;
}

export interface ClaudeStreamState {
  text: string;
  isStreaming: boolean;
  error: ClaudeApiError | null;
  start: (input: ClaudeStreamInput) => void;
  cancel: () => void;
  reset: () => void;
}

const DEFAULT_CACHE_TIMEOUT_MS = 12000;
const SIMULATED_CHARS_PER_SEC = 110;

export function useClaudeStream(): ClaudeStreamState {
  const [text, setText] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<ClaudeApiError | null>(null);
  const controllerRef = useRef<AbortController | null>(null);
  const cacheTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cacheStreamRafRef = useRef<number | null>(null);
  const usingCacheRef = useRef(false);
  const mountedRef = useRef(true);
  /** True once at least one chunk arrived for the current request. Prevents
      premature cache fallback when the API was already responding. */
  const receivedFirstChunkRef = useRef(false);

  const clearCacheTimers = useCallback(() => {
    if (cacheTimerRef.current) {
      clearTimeout(cacheTimerRef.current);
      cacheTimerRef.current = null;
    }
    if (cacheStreamRafRef.current) {
      cancelAnimationFrame(cacheStreamRafRef.current);
      cacheStreamRafRef.current = null;
    }
  }, []);

  const cancel = useCallback(() => {
    controllerRef.current?.abort();
    controllerRef.current = null;
    clearCacheTimers();
    usingCacheRef.current = false;
    if (mountedRef.current) setIsStreaming(false);
  }, [clearCacheTimers]);

  const reset = useCallback(() => {
    cancel();
    if (mountedRef.current) {
      setText('');
      setError(null);
    }
  }, [cancel]);

  const streamCachedText = useCallback((cached: string) => {
    usingCacheRef.current = true;
    const start = performance.now();
    const total = cached.length;
    setText('');

    const tick = () => {
      if (!mountedRef.current) return;
      const elapsedSec = (performance.now() - start) / 1000;
      const cursor = Math.min(total, Math.floor(elapsedSec * SIMULATED_CHARS_PER_SEC));
      setText(cached.slice(0, cursor));
      if (cursor < total) {
        cacheStreamRafRef.current = requestAnimationFrame(tick);
      } else {
        cacheStreamRafRef.current = null;
        if (mountedRef.current) setIsStreaming(false);
      }
    };
    cacheStreamRafRef.current = requestAnimationFrame(tick);
  }, []);

  const start = useCallback(
    (input: ClaudeStreamInput) => {
      controllerRef.current?.abort();
      clearCacheTimers();
      const controller = new AbortController();
      controllerRef.current = controller;
      usingCacheRef.current = false;

      setError(null);
      setText('');
      setIsStreaming(true);
      receivedFirstChunkRef.current = false;

      // Demo mode + cacheKey → race: schedule cache fallback after timeout
      const cached = input.cacheKey
        ? getCachedById(input.cacheKey)
        : (() => {
            const lastUserMsg = [...input.messages].reverse().find((m) => m.role === 'user');
            return lastUserMsg && typeof lastUserMsg.content === 'string'
              ? getCachedByHints(lastUserMsg.content)
              : null;
          })();

      if (isDemoMode() && cached) {
        const timeoutMs = input.cacheTimeoutMs ?? DEFAULT_CACHE_TIMEOUT_MS;
        cacheTimerRef.current = setTimeout(() => {
          if (usingCacheRef.current) return;
          // CRITICAL: only abort and use cache if NO chunk has arrived yet.
          // Using a ref avoids stale closure over `text`.
          if (
            !controller.signal.aborted &&
            !receivedFirstChunkRef.current
          ) {
            console.info(
              `[demo] stream timeout (${timeoutMs}ms), serving cache (${input.cacheKey ?? 'hint-matched'}).`,
            );
            controller.abort();
            streamCachedText(cached);
          }
        }, timeoutMs);
      }

      streamClaude(
        input.messages,
        input.system,
        (_chunk, full) => {
          if (!controller.signal.aborted && mountedRef.current && !usingCacheRef.current) {
            // First chunk arrived — mark it and disable the cache timeout
            receivedFirstChunkRef.current = true;
            clearCacheTimers();
            setText(full);
          }
        },
        {
          signal: controller.signal,
          maxTokens: input.maxTokens,
          temperature: input.temperature,
        },
      )
        .then(() => {
          if (
            !controller.signal.aborted &&
            mountedRef.current &&
            !usingCacheRef.current
          ) {
            setIsStreaming(false);
          }
        })
        .catch((err: unknown) => {
          const apiErr = err as ClaudeApiError;
          if (apiErr?.kind === 'cancelled') return;
          // If we have cache available and demo mode is on, fall back silently.
          if (isDemoMode() && cached && !usingCacheRef.current && mountedRef.current) {
            console.warn('[demo] stream failed, serving cache:', apiErr);
            streamCachedText(cached);
            return;
          }
          if (mountedRef.current) {
            setError(apiErr);
            setIsStreaming(false);
          }
        });
    },
    [clearCacheTimers, streamCachedText],
  );

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      controllerRef.current?.abort();
      clearCacheTimers();
    };
  }, [clearCacheTimers]);

  return { text, isStreaming, error, start, cancel, reset };
}

// ─────────────────────────────────────────────────────────────
// useClaudeCompletion (React Query)
// ─────────────────────────────────────────────────────────────

export interface UseClaudeCompletionInput {
  messages: ClaudeMessage[];
  system?: string;
  maxTokens?: number;
  temperature?: number;
  enabled?: boolean;
  queryKey?: readonly unknown[];
}

export function useClaudeCompletion({
  messages,
  system,
  maxTokens,
  temperature,
  enabled = true,
  queryKey,
}: UseClaudeCompletionInput) {
  return useQuery<string, ClaudeApiError>({
    queryKey: queryKey ?? ['claude', 'completion', messages, system],
    queryFn: ({ signal }) =>
      claudeCompletion(messages, system, { signal, maxTokens, temperature }),
    enabled: enabled && messages.length > 0,
    staleTime: 5 * 60 * 1000,
    retry: false,
  });
}
