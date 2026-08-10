#!/usr/bin/env node
/**
 * Detector de rastros de cliente.
 *
 * Busca referencias que no deben aparecer en una demostracion generica:
 * nombres de instituciones, sistemas internos, personas reales, datos del caso
 * original y colores fijados en el codigo.
 *
 *   npm run check     informe en consola
 *   npm run check -- --strict    termina con error si hay hallazgos criticos
 *
 * Ejecutarlo antes de cada demostracion.
 */

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, extname } from 'node:path';

const RAIZ = process.cwd();
const EXTS = new Set(['.ts', '.tsx', '.js', '.jsx', '.css', '.html']);
const IGNORAR = new Set(['node_modules', 'dist', '.git', '.vercel', 'build', 'public']);

const REGLAS = [
  { p: /\bSantander\b/gi, g: 'critico', m: 'Nombre de institucion' },
  { p: /\bBanco\s+de\s+Chile\b/gi, g: 'critico', m: 'Nombre de institucion' },
  { p: /\bBancoEstado\b/gi, g: 'critico', m: 'Nombre de institucion' },
  { p: /\bScotiabank\b/gi, g: 'critico', m: 'Nombre de institucion' },
  { p: /\bFalabella\b/gi, g: 'critico', m: 'Nombre de institucion' },
  { p: /\bCoopeuch\b/gi, g: 'critico', m: 'Nombre de institucion' },
  { p: /\bIta[uú]\b/gi, g: 'critico', m: 'Nombre de institucion' },
  { p: /\bBci\b/g, g: 'critico', m: 'Nombre de institucion' },
  { p: /\bBICE\b/g, g: 'critico', m: 'Nombre de institucion' },

  { p: /\bBAMOE\b/gi, g: 'critico', m: 'Sistema interno de cliente' },
  { p: /\bDarwin\b(?!-|\/)/g, g: 'critico', m: 'Sistema interno de cliente' },
  { p: /\bGluon\b/gi, g: 'critico', m: 'Sistema interno de cliente' },
  { p: /\bUltimus\b/gi, g: 'critico', m: 'Sistema interno de cliente' },
  { p: /\bNEO\b/g, g: 'alto', m: 'Sistema interno de cliente' },
  { p: /\bPUC\b/g, g: 'alto', m: 'Sistema interno de cliente' },
  { p: /\bMaisa\b/gi, g: 'alto', m: 'Proveedor asociado a un cliente' },

  { p: /\bPecorella\b/gi, g: 'critico', m: 'Nombre de persona real' },
  { p: /\bYelitza\b/gi, g: 'critico', m: 'Nombre de persona real' },
  { p: /\bManrique\b/gi, g: 'critico', m: 'Nombre de persona real' },
  { p: /\bAlzerreca\b/gi, g: 'critico', m: 'Nombre de persona real' },
  { p: /\bTrautmann\b/gi, g: 'critico', m: 'Nombre de persona real' },
  { p: /\bAriz?t[ií]a\b/gi, g: 'critico', m: 'Nombre de persona real' },
  { p: /\bEugenia\b/gi, g: 'alto', m: 'Asistente asociado a un cliente' },

  { p: /\bMusalem\b/gi, g: 'alto', m: 'Tercero del caso original' },
  { p: /\bAconcagua\b/gi, g: 'alto', m: 'Tercero del caso original' },
  { p: /\bCibergesti[oó]n\b/gi, g: 'critico', m: 'Competidor' },
  { p: /\bDeloitte\b/gi, g: 'alto', m: 'Marca propia en vista de cliente' },

  { p: /\bHC-20\d{2}-\d{4}\b/g, g: 'alto', m: 'Referencia del caso original' },
  { p: /\bApoquindo\b/gi, g: 'alto', m: 'Direccion del caso original' },
  { p: /\b\d{1,2}\.\d{3}\.\d{3}-[\dkK]\b/g, g: 'revisar', m: 'RUT: verificar que sea ficticio' },

  { p: /#E00B0B\b/gi, g: 'alto', m: 'Color de institucion fijado en codigo' },
  { p: /#EC0000\b/gi, g: 'alto', m: 'Color de institucion fijado en codigo' },
  { p: /Santander\s*Text/gi, g: 'critico', m: 'Tipografia propietaria' },
  { p: /\bdeloitte-20\d{2}\b/gi, g: 'alto', m: 'Credencial en el codigo' },
];

const EXCEPCIONES = ['src/theme/banks.ts', 'scripts/hardening.mjs', 'INSTRUCTIVO', 'README', 'package-lock.json', 'package.json'];
const esExcepcion = (r) => EXCEPCIONES.some((e) => r.includes(e));

function* archivos(dir) {
  for (const n of readdirSync(dir)) {
    if (IGNORAR.has(n)) continue;
    const r = join(dir, n);
    if (statSync(r).isDirectory()) yield* archivos(r);
    else if (EXTS.has(extname(n))) yield r;
  }
}

const hallazgos = [];
for (const ruta of archivos(RAIZ)) {
  const rel = relative(RAIZ, ruta);
  if (esExcepcion(rel)) continue;
  readFileSync(ruta, 'utf8').split('\n').forEach((linea, i) => {
    for (const r of REGLAS) {
      r.p.lastIndex = 0;
      if (r.p.test(linea)) {
        hallazgos.push({ archivo: rel, linea: i + 1, g: r.g, m: r.m, texto: linea.trim().slice(0, 110) });
      }
    }
  });
}

const orden = { critico: 0, alto: 1, revisar: 2 };
hallazgos.sort((a, b) => orden[a.g] - orden[b.g] || a.archivo.localeCompare(b.archivo));
const c = { critico: 0, alto: 0, revisar: 0 };
hallazgos.forEach((h) => c[h.g]++);

console.log('\n  REVISION DE RASTROS DE CLIENTE');
console.log('  ' + '-'.repeat(70));

if (!hallazgos.length) {
  console.log('  Sin hallazgos. El codigo no contiene referencias a clientes.\n');
  process.exit(0);
}

let act = '';
for (const h of hallazgos) {
  if (h.g !== act) {
    act = h.g;
    console.log(`\n  ${{ critico: 'CRITICO - no puede llegar a produccion', alto: 'ALTO - revisar y corregir', revisar: 'REVISAR - puede ser legitimo' }[h.g]}\n`);
  }
  console.log(`  ${h.archivo}:${h.linea}`);
  console.log(`    ${h.m}`);
  console.log(`    ${h.texto}\n`);
}

console.log('  ' + '-'.repeat(70));
console.log(`  Criticos: ${c.critico}   Altos: ${c.alto}   Por revisar: ${c.revisar}\n`);

if (process.argv.includes('--strict') && c.critico > 0) {
  console.log('  Hallazgos criticos presentes. Corregir antes de desplegar.\n');
  process.exit(1);
}
