/**
 * /api/admin/logs — View access logs.
 *
 * Protected by ADMIN_TOKEN. Two ways to authenticate:
 *   1. Query param: /api/admin/logs?token=XXX
 *   2. Header: Authorization: Bearer XXX
 *
 * Returns an HTML page with a table of all logged events.
 * Also supports ?format=json or ?format=csv for export.
 */

import { kv } from '@vercel/kv';

export const config = {
  runtime: 'edge',
  regions: ['iad1'],
};

interface LogEntry {
  type: 'login_ok' | 'login_failed' | 'page_visit';
  timestamp: string;
  ip: string;
  userAgent: string;
  sessionId?: string;
  page?: string;
  previousPage?: string;
  durationSec?: number;
}

export default async function handler(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const expectedToken = process.env.ADMIN_TOKEN;

  if (!expectedToken) {
    return new Response('Server not configured: ADMIN_TOKEN missing', {
      status: 500,
    });
  }

  // Auth: query param or header
  const headerToken = req.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
  const queryToken = url.searchParams.get('token');
  const providedToken = headerToken ?? queryToken ?? '';

  if (!constantTimeEquals(providedToken, expectedToken)) {
    return new Response('Unauthorized', { status: 401 });
  }

  // Fetch the log entries (newest first)
  let entries: LogEntry[];
  try {
    const raw = await kv.zrange<string[]>('access_log', 0, -1, { rev: true });
    entries = (raw ?? [])
      .map((s) => {
        try {
          return JSON.parse(typeof s === 'string' ? s : JSON.stringify(s));
        } catch {
          return null;
        }
      })
      .filter((e): e is LogEntry => e !== null);
  } catch (err) {
    return new Response(`Failed to read log: ${(err as Error).message}`, {
      status: 500,
    });
  }

  const format = url.searchParams.get('format');

  if (format === 'json') {
    return new Response(JSON.stringify(entries, null, 2), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (format === 'csv') {
    const csv = entriesToCSV(entries);
    return new Response(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="access_log.csv"',
      },
    });
  }

  // Default: HTML view
  return new Response(renderHTML(entries, url), {
    status: 200,
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}

// ─── Helpers ─────────────────────────────────────────────────

function constantTimeEquals(a: string, b: string): boolean {
  if (a.length !== b.length) {
    let diff = 1;
    for (let i = 0; i < Math.max(a.length, b.length); i++) {
      diff |=
        (a.charCodeAt(i % Math.max(a.length, 1)) ^
          b.charCodeAt(i % Math.max(b.length, 1))) ||
        0;
    }
    return false;
  }
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

function entriesToCSV(entries: LogEntry[]): string {
  const headers = [
    'timestamp',
    'type',
    'ip',
    'userAgent',
    'sessionId',
    'page',
    'previousPage',
    'durationSec',
  ];
  const rows = entries.map((e) =>
    headers
      .map((h) => {
        const val = (e as any)[h];
        if (val === undefined || val === null) return '';
        const str = String(val).replace(/"/g, '""');
        return `"${str}"`;
      })
      .join(','),
  );
  return [headers.join(','), ...rows].join('\n');
}

function renderHTML(entries: LogEntry[], url: URL): string {
  const token = url.searchParams.get('token') ?? '';

  // Compute stats
  const uniqueSessions = new Set(
    entries
      .filter((e) => e.sessionId)
      .map((e) => e.sessionId),
  ).size;
  const loginOks = entries.filter((e) => e.type === 'login_ok').length;
  const loginFails = entries.filter((e) => e.type === 'login_failed').length;
  const pageVisits = entries.filter((e) => e.type === 'page_visit').length;
  const uniqueIPs = new Set(entries.map((e) => e.ip)).size;

  const rows = entries
    .map(
      (e) => `
    <tr class="row-${e.type}">
      <td class="ts">${formatTimestamp(e.timestamp)}</td>
      <td class="type">${formatType(e.type)}</td>
      <td class="ip">${escapeHTML(e.ip)}</td>
      <td class="ua" title="${escapeHTML(e.userAgent)}">${escapeHTML(
        shortenUA(e.userAgent),
      )}</td>
      <td class="session">${escapeHTML(e.sessionId?.slice(0, 8) ?? '')}</td>
      <td class="page">${escapeHTML(e.page ?? '')}</td>
      <td class="prev">${escapeHTML(e.previousPage ?? '')}</td>
      <td class="dur">${e.durationSec ? `${e.durationSec}s` : ''}</td>
    </tr>
  `,
    )
    .join('');

  return `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8" />
<title>POC Hipotecario · Access Log</title>
<style>
  * { box-sizing: border-box; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    background: #F3EEE6;
    color: #1A1A1A;
    margin: 0;
    padding: 2rem;
    font-size: 14px;
  }
  h1 {
    font-size: 1.5rem;
    margin: 0 0 0.5rem;
  }
  .subtitle {
    color: #666;
    font-size: 0.9rem;
    margin-bottom: 2rem;
  }
  .stats {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
    gap: 1rem;
    margin-bottom: 2rem;
  }
  .stat {
    background: #FBF8F2;
    border: 1px solid #DAD2C4;
    padding: 1rem;
  }
  .stat-value {
    font-size: 1.8rem;
    font-weight: 600;
    color: var(--color-accent-primary);
    font-variant-numeric: tabular-nums;
  }
  .stat-label {
    font-size: 0.75rem;
    color: #666;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    margin-top: 0.25rem;
  }
  .actions {
    margin-bottom: 1.5rem;
    display: flex;
    gap: 0.5rem;
  }
  .btn {
    display: inline-block;
    padding: 0.4rem 0.8rem;
    background: #1A1A1A;
    color: white;
    text-decoration: none;
    font-size: 0.85rem;
    border: none;
    cursor: pointer;
  }
  .btn:hover { background: #333; }
  table {
    width: 100%;
    border-collapse: collapse;
    background: #FBF8F2;
    border: 1px solid #DAD2C4;
    font-size: 0.85rem;
  }
  th, td {
    text-align: left;
    padding: 0.5rem 0.75rem;
    border-bottom: 1px solid #EEE6D9;
    vertical-align: top;
  }
  th {
    background: #1A1A1A;
    color: white;
    font-weight: 500;
    text-transform: uppercase;
    font-size: 0.7rem;
    letter-spacing: 0.1em;
  }
  .ts { font-variant-numeric: tabular-nums; color: #555; white-space: nowrap; }
  .type { font-weight: 500; }
  .row-login_ok .type { color: #2D6A3F; }
  .row-login_failed .type { color: #B00020; }
  .row-page_visit .type { color: #444; }
  .ip { font-family: monospace; font-size: 0.8rem; color: #555; }
  .ua { font-size: 0.75rem; color: #777; max-width: 200px; overflow: hidden; text-overflow: ellipsis; }
  .session { font-family: monospace; font-size: 0.75rem; color: #888; }
  .page { font-family: monospace; font-size: 0.8rem; }
  .prev { font-family: monospace; font-size: 0.75rem; color: #999; }
  .dur { color: #666; white-space: nowrap; }
  .empty {
    text-align: center;
    padding: 3rem;
    color: #888;
    font-style: italic;
  }
</style>
</head>
<body>
  <h1>POC Hipotecario · Access Log</h1>
  <div class="subtitle">${entries.length.toLocaleString('es-CL')} eventos registrados</div>

  <div class="stats">
    <div class="stat">
      <div class="stat-value">${loginOks}</div>
      <div class="stat-label">Logins exitosos</div>
    </div>
    <div class="stat">
      <div class="stat-value">${loginFails}</div>
      <div class="stat-label">Logins fallidos</div>
    </div>
    <div class="stat">
      <div class="stat-value">${uniqueSessions}</div>
      <div class="stat-label">Sesiones únicas</div>
    </div>
    <div class="stat">
      <div class="stat-value">${uniqueIPs}</div>
      <div class="stat-label">IPs únicas</div>
    </div>
    <div class="stat">
      <div class="stat-value">${pageVisits}</div>
      <div class="stat-label">Navegaciones</div>
    </div>
  </div>

  <div class="actions">
    <a class="btn" href="?token=${encodeURIComponent(token)}&format=csv">Descargar CSV</a>
    <a class="btn" href="?token=${encodeURIComponent(token)}&format=json">Ver JSON</a>
  </div>

  ${
    entries.length === 0
      ? '<div class="empty">Aún no hay eventos registrados.</div>'
      : `<table>
    <thead>
      <tr>
        <th>Timestamp</th>
        <th>Tipo</th>
        <th>IP</th>
        <th>User Agent</th>
        <th>Sesión</th>
        <th>Página</th>
        <th>Página previa</th>
        <th>Duración</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>`
  }
</body>
</html>`;
}

function escapeHTML(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatTimestamp(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleString('es-CL', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });
  } catch {
    return iso;
  }
}

function formatType(type: string): string {
  if (type === 'login_ok') return '✓ Login OK';
  if (type === 'login_failed') return '✗ Login Fallido';
  if (type === 'page_visit') return 'Navegación';
  return type;
}

function shortenUA(ua: string): string {
  // Extract a friendly snippet: device + browser
  if (/iPhone/i.test(ua)) return 'iPhone';
  if (/iPad/i.test(ua)) return 'iPad';
  if (/Android/i.test(ua)) return 'Android';
  if (/Macintosh/i.test(ua)) {
    if (/Chrome/i.test(ua)) return 'Mac · Chrome';
    if (/Safari/i.test(ua)) return 'Mac · Safari';
    if (/Firefox/i.test(ua)) return 'Mac · Firefox';
    return 'Mac';
  }
  if (/Windows/i.test(ua)) {
    if (/Edg/i.test(ua)) return 'Windows · Edge';
    if (/Chrome/i.test(ua)) return 'Windows · Chrome';
    if (/Firefox/i.test(ua)) return 'Windows · Firefox';
    return 'Windows';
  }
  if (/Linux/i.test(ua)) return 'Linux';
  return ua.slice(0, 40);
}
