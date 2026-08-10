/**
 * /api/auth — Validates the visitor password.
 *
 * Reads the POC_PASSWORD env var (server-side only, never exposed).
 * On success: sets an HttpOnly cookie that lasts 24h, logs the access.
 * On failure: returns 401, logs the failed attempt (for security audit).
 *
 * The cookie is signed implicitly via the env var — anyone who knows
 * the password gets a session. We don't try to bind sessions to IPs
 * because that breaks corporate networks with proxies/NAT.
 */

import { kv } from '@vercel/kv';

export const config = {
  runtime: 'edge',
  regions: ['iad1'],
};

const SESSION_COOKIE = 'poc_session';
const SESSION_DURATION_SECONDS = 24 * 60 * 60; // 24 hours

interface AuthRequest {
  password: string;
}

interface AccessLog {
  type: 'login_ok' | 'login_failed' | 'page_visit';
  timestamp: string;
  ip: string;
  userAgent: string;
  sessionId?: string;
  page?: string;
  durationSec?: number;
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  const expectedPassword = process.env.POC_PASSWORD;
  if (!expectedPassword) {
    return jsonResponse(
      { error: 'Server not configured: POC_PASSWORD missing' },
      500,
    );
  }

  let body: AuthRequest;
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ error: 'Invalid JSON body' }, 400);
  }

  if (!body.password || typeof body.password !== 'string') {
    return jsonResponse({ error: 'Password required' }, 400);
  }

  const ip = getClientIP(req);
  const userAgent = req.headers.get('user-agent') ?? 'unknown';
  const timestamp = new Date().toISOString();

  // Constant-time comparison to mitigate timing attacks
  if (!constantTimeEquals(body.password, expectedPassword)) {
    // Log failed attempt (best-effort, don't fail if KV is down)
    void logAccess({
      type: 'login_failed',
      timestamp,
      ip,
      userAgent,
    });
    return jsonResponse({ error: 'Contraseña incorrecta' }, 401);
  }

  // Success — issue a session
  const sessionId = generateSessionId();
  void logAccess({
    type: 'login_ok',
    timestamp,
    ip,
    userAgent,
    sessionId,
  });

  const cookie = buildSessionCookie(sessionId);
  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Set-Cookie': cookie,
    },
  });
}

// ─── Helpers ─────────────────────────────────────────────────

function jsonResponse(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function getClientIP(req: Request): string {
  // Vercel sets x-forwarded-for with the real client IP
  const xff = req.headers.get('x-forwarded-for');
  if (xff) return xff.split(',')[0].trim();
  const real = req.headers.get('x-real-ip');
  if (real) return real;
  return 'unknown';
}

function constantTimeEquals(a: string, b: string): boolean {
  if (a.length !== b.length) {
    // Still do a fake compare to avoid leaking length via timing
    let diff = 1;
    for (let i = 0; i < Math.max(a.length, b.length); i++) {
      diff |= (a.charCodeAt(i % a.length) ^ b.charCodeAt(i % b.length)) || 0;
    }
    return false;
  }
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

function generateSessionId(): string {
  // 16 random bytes hex-encoded — 32 chars, ~128 bits of entropy
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function buildSessionCookie(sessionId: string): string {
  return [
    `${SESSION_COOKIE}=${sessionId}`,
    'Path=/',
    `Max-Age=${SESSION_DURATION_SECONDS}`,
    'HttpOnly',
    'Secure',
    'SameSite=Lax',
  ].join('; ');
}

async function logAccess(entry: AccessLog): Promise<void> {
  try {
    // Use a sorted set: score is timestamp (ms), value is JSON entry.
    // This lets us range-query by date efficiently from the admin endpoint.
    const score = Date.parse(entry.timestamp);
    const key = 'access_log';
    await kv.zadd(key, { score, member: JSON.stringify(entry) });
    // Cap the log at 10k entries (defensive: trim the oldest)
    await kv.zremrangebyrank(key, 0, -10_001);
  } catch (err) {
    // Don't fail the request if logging fails
    console.error('[auth] logAccess failed:', err);
  }
}
