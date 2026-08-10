/**
 * /api/track — Logs page visits.
 *
 * Called by the frontend each time the user navigates to a new route.
 * Records: timestamp, IP, session, which page, and how long they were
 * on the previous page.
 *
 * Requires a valid session cookie (issued by /api/auth). Anyone without
 * a session is rejected silently.
 */

import { kv } from '@vercel/kv';

export const config = {
  runtime: 'edge',
  regions: ['iad1'],
};

interface TrackRequest {
  page: string;
  previousPage?: string;
  previousDurationSec?: number;
}

const SESSION_COOKIE = 'poc_session';

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  // Extract session from cookie
  const sessionId = getSessionId(req);
  if (!sessionId) {
    // No session = no tracking (visitor didn't authenticate, can't have
    // navigated past the login screen). Return 200 to avoid noisy errors
    // in the browser console.
    return jsonResponse({ ok: true, ignored: true }, 200);
  }

  let body: TrackRequest;
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ error: 'Invalid JSON body' }, 400);
  }

  if (!body.page || typeof body.page !== 'string') {
    return jsonResponse({ error: 'page required' }, 400);
  }

  // Defensive: limit page length to avoid abuse
  const page = body.page.slice(0, 200);
  const previousPage = body.previousPage?.slice(0, 200);
  const previousDurationSec =
    typeof body.previousDurationSec === 'number' &&
    body.previousDurationSec >= 0 &&
    body.previousDurationSec < 86400
      ? body.previousDurationSec
      : undefined;

  const entry = {
    type: 'page_visit' as const,
    timestamp: new Date().toISOString(),
    ip: getClientIP(req),
    userAgent: req.headers.get('user-agent') ?? 'unknown',
    sessionId,
    page,
    previousPage,
    durationSec: previousDurationSec,
  };

  try {
    const score = Date.parse(entry.timestamp);
    const key = 'access_log';
    await kv.zadd(key, { score, member: JSON.stringify(entry) });
    await kv.zremrangebyrank(key, 0, -10_001);
  } catch (err) {
    console.error('[track] log failed:', err);
    // Still return ok — tracking failures shouldn't break the UX
  }

  return jsonResponse({ ok: true }, 200);
}

function jsonResponse(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function getSessionId(req: Request): string | null {
  const cookieHeader = req.headers.get('cookie');
  if (!cookieHeader) return null;
  const cookies = Object.fromEntries(
    cookieHeader.split(';').map((kv) => {
      const [k, ...v] = kv.trim().split('=');
      return [k, v.join('=')];
    }),
  );
  return cookies[SESSION_COOKIE] ?? null;
}

function getClientIP(req: Request): string {
  const xff = req.headers.get('x-forwarded-for');
  if (xff) return xff.split(',')[0].trim();
  const real = req.headers.get('x-real-ip');
  if (real) return real;
  return 'unknown';
}
