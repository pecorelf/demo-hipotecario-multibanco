/**
 * Persistencia de personalizaciones de identidad.
 *
 * GET    /api/theme?slug=<id>   personalizacion guardada, o null
 * POST   /api/theme             guarda (requiere token)
 * DELETE /api/theme?slug=<id>   elimina (requiere token)
 *
 * Los presets viven en el codigo y no se pueden borrar. Sin almacenamiento
 * configurado responde de forma inocua: el cliente cae al preset y guarda las
 * personalizaciones en el navegador.
 */

const PREFIJO = 'theme:';

const CAMPOS = new Set([
  'name', 'shortName', 'legalName', 'accent', 'accentMuted', 'accentSoft',
  'onAccent', 'fontFamily', 'logoUrl', 'assistantName', 'buyerName',
  'sellerName', 'inmobiliariaName', 'ejecutivoName', 'notariaName',
  'caseRef', 'propertyAddress', 'propertyComuna', 'propertyBuilding',
]);

const SLUG = /^[a-z0-9-]{2,40}$/;

async function obtenerKv() {
  if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) return null;
  try {
    const mod = await import('@vercel/kv');
    return mod.kv;
  } catch {
    return null;
  }
}

function autorizado(req) {
  const t = req.headers['x-admin-token'];
  return Boolean(process.env.ADMIN_TOKEN) && t === process.env.ADMIN_TOKEN;
}

function limpiar(theme) {
  const out = {};
  for (const [k, v] of Object.entries(theme || {})) {
    if (!CAMPOS.has(k) || typeof v !== 'string') continue;
    if (k === 'logoUrl') { if (v.length <= 500000) out[k] = v; }
    else out[k] = v.slice(0, 200);
  }
  return out;
}

export default async function handler(req, res) {
  const slug = String(req.query?.slug || req.body?.slug || '').toLowerCase();
  const kv = await obtenerKv();

  if (req.method === 'GET') {
    if (!SLUG.test(slug) || !kv) return res.status(200).json(null);
    try { return res.status(200).json((await kv.get(PREFIJO + slug)) ?? null); }
    catch { return res.status(200).json(null); }
  }

  if (req.method === 'POST') {
    if (!autorizado(req)) return res.status(401).send('No autorizado');
    if (!SLUG.test(slug)) return res.status(400).send('Identificador no valido');
    if (!kv) return res.status(503).send('Almacenamiento no configurado');
    try { await kv.set(PREFIJO + slug, limpiar(req.body?.theme)); return res.status(200).json({ ok: true }); }
    catch { return res.status(500).send('No se pudo guardar'); }
  }

  if (req.method === 'DELETE') {
    if (!autorizado(req)) return res.status(401).send('No autorizado');
    if (!SLUG.test(slug)) return res.status(400).send('Identificador no valido');
    if (!kv) return res.status(200).json({ ok: true });
    try { await kv.del(PREFIJO + slug); return res.status(200).json({ ok: true }); }
    catch { return res.status(500).send('No se pudo eliminar'); }
  }

  res.setHeader('Allow', 'GET, POST, DELETE');
  return res.status(405).send('Metodo no permitido');
}
