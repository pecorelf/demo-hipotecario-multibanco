#!/usr/bin/env python3
"""
Migración de literales de cliente a la capa de identidad.

A diferencia de un reemplazo textual, este script distingue el contexto
sintáctico de cada ocurrencia: atributo JSX, texto JSX, cadena de JavaScript o
plantilla literal. Cada contexto exige una forma distinta de interpolación.
"""

import re
from pathlib import Path

RAIZ = Path('src')
EXTS = {'.ts', '.tsx'}
EXCLUIR = {'src/theme/banks.ts', 'src/lib/brand.ts', 'src/theme/ThemeProvider.tsx'}

# ── Sustituciones textuales seguras: no cambian la sintaxis ──
DIRECTAS = [
    ('Yelitza Manrique', 'Camila Reinoso'),
    ('Yelitza', 'Camila'),
    ('Manrique', 'Reinoso'),
    ('Francisco Pecorella', 'Andrés Fuenzalida'),
    ('Pecorella', 'Fuenzalida'),
    ('Patricia Vergara Méndez', 'Patricia Soto Miranda'),
    ('Patricia Vergara', 'Patricia Soto'),
    ('Vergara Méndez', 'Soto Miranda'),
    ('Vergara', 'Soto'),
    ('Inmobiliaria Aconcagua S.A.', 'Inmobiliaria Los Almendros'),
    ('Inmobiliaria Aconcagua', 'Inmobiliaria Los Almendros'),
    ('Edificio Aconcagua', 'Edificio Los Almendros'),
    ('Aconcagua', 'Los Almendros'),
    ('José Musalem Saffie', 'Fernando Undurraga Silva'),
    ('Musalem Saffie', 'Undurraga Silva'),
    ('Musalem', 'Undurraga'),
    ('Av. Apoquindo 4500, dpto 1203', 'Av. Los Leones 1240, dpto 803'),
    ('Av. Apoquindo 4500 dpto 1203', 'Av. Los Leones 1240 dpto 803'),
    ('Apoquindo 4500, dpto 1203', 'Los Leones 1240, dpto 803'),
    ('Apoquindo 4500', 'Los Leones 1240'),
    ('Edificio Apoquindo Plaza', 'Edificio Parque Los Leones'),
    ('Apoquindo', 'Los Leones'),
    ('Las Condes', 'Providencia'),
    ('HC-2026-0042', 'HIP-2026-0042'),
    ('HC-2026', 'HIP-2026'),
    ('NEO/TF/PUC', 'CRM/Core/Originación'),
    ('NEO, TF y PUC', 'el CRM, el core y la plataforma de originación'),
    ('NEO y TF', 'el CRM y el core'),
    ('sistema NEO', 'CRM comercial'),
    ('Sistema NEO', 'CRM comercial'),
    ('15.234.678-6', '16.482.930-7'),
    ('Deloitte Digital Chile', 'Nuestra consultora'),
    ('Deloitte Digital', 'Nuestra consultora'),
    ('Deloitte', 'Nuestra consultora'),
    ('deloitte-2026', 'demo-2026'),
    ('#E00B0B', 'var(--color-accent-primary)'),
    ('#EC0000', 'var(--color-accent-primary)'),
    ("'Santander Text', ", ''),
    ('Santander Text', 'var(--font-brand)'),
    # Rutas de recursos: se neutralizan antes de tocar la marca
    ('/santander-logo.png', '/logo-institucion.png'),
    ('santander-logo', 'logo-institucion'),
]

# ── Marca: token → expresión del tema ──
MARCA = [
    ('Banco Santander Chile', 'BRAND.legalName'),
    ('Santander Chile', 'BRAND.name'),
    ('Banco Santander', 'BRAND.name'),
    ('Santander', 'BRAND.shortName'),
    ('Eugenia', 'BRAND.assistantName'),
]

TOKENS = [t for t, _ in MARCA]
RX_TOKENS = re.compile('|'.join(re.escape(t) for t in TOKENS))
MAPA = dict(MARCA)


def tiene_marca(s: str) -> bool:
    return bool(RX_TOKENS.search(s))


def a_plantilla(contenido: str) -> str:
    """Convierte el contenido de una cadena en plantilla con interpolación."""
    return RX_TOKENS.sub(lambda m: '${' + MAPA[m.group(0)] + '}', contenido)


def solo_token(contenido: str) -> str | None:
    """Si el contenido es exactamente un token, devuelve su expresión."""
    c = contenido.strip()
    return MAPA.get(c)


def migrar_linea(linea: str) -> str:
    if not tiene_marca(linea):
        return linea

    # 1 · Atributos JSX con comillas dobles: attr="…"
    def attr_doble(m):
        attr, contenido = m.group(1), m.group(2)
        if not tiene_marca(contenido):
            return m.group(0)
        exacto = solo_token(contenido)
        if exacto:
            return f'{attr}={{{exacto}}}'
        return f'{attr}={{`{a_plantilla(contenido)}`}}'

    linea = re.sub(r'(\b[\w-]+)="([^"]*)"', attr_doble, linea)

    # 2 · Atributos JSX con llaves y comillas simples: attr={'…'}
    def attr_llave(m):
        attr, contenido = m.group(1), m.group(2)
        if not tiene_marca(contenido):
            return m.group(0)
        exacto = solo_token(contenido)
        if exacto:
            return f'{attr}={{{exacto}}}'
        return f'{attr}={{`{a_plantilla(contenido)}`}}'

    linea = re.sub(r"(\b[\w-]+)=\{'([^']*)'\}", attr_llave, linea)

    if not tiene_marca(linea):
        return linea

    # 3 · Plantillas literales existentes: se interpola dentro
    def plantilla(m):
        return '`' + a_plantilla(m.group(1)) + '`'

    linea = re.sub(r'`([^`]*)`', plantilla, linea)

    if not tiene_marca(linea):
        return linea

    # 4 · Cadenas de JavaScript con comillas simples
    def cadena_simple(m):
        contenido = m.group(1)
        if not tiene_marca(contenido):
            return m.group(0)
        exacto = solo_token(contenido)
        if exacto:
            return exacto
        return '`' + a_plantilla(contenido) + '`'

    linea = re.sub(r"'([^']*)'", cadena_simple, linea)

    if not tiene_marca(linea):
        return linea

    # 5 · Cadenas con comillas dobles no capturadas antes
    def cadena_doble(m):
        contenido = m.group(1)
        if not tiene_marca(contenido):
            return m.group(0)
        exacto = solo_token(contenido)
        if exacto:
            return exacto
        return '`' + a_plantilla(contenido) + '`'

    linea = re.sub(r'"([^"]*)"', cadena_doble, linea)

    if not tiene_marca(linea):
        return linea

    # 6 · Texto suelto en JSX o comentarios
    linea = RX_TOKENS.sub(lambda m: '{' + MAPA[m.group(0)] + '}', linea)

    return linea


def agregar_import(texto: str) -> str:
    if "from '@/lib/brand'" in texto:
        return texto
    lineas = texto.split('\n')
    ultimo = -1
    for i, l in enumerate(lineas):
        s = l.strip()
        if s.startswith('import ') or s.startswith('} from '):
            ultimo = i
    if ultimo == -1:
        return "import { BRAND } from '@/lib/brand';\n" + texto
    lineas.insert(ultimo + 1, "import { BRAND } from '@/lib/brand';")
    return '\n'.join(lineas)


def main():
    modificados = 0
    for ruta in RAIZ.rglob('*'):
        if ruta.suffix not in EXTS:
            continue
        if str(ruta).replace('\\', '/') in EXCLUIR:
            continue

        original = ruta.read_text(encoding='utf-8')
        texto = original
        for viejo, nuevo in DIRECTAS:
            texto = texto.replace(viejo, nuevo)

        texto = '\n'.join(migrar_linea(l) for l in texto.split('\n'))

        if 'BRAND.' in texto:
            texto = agregar_import(texto)

        if texto != original:
            ruta.write_text(texto, encoding='utf-8')
            modificados += 1

    print(f'{modificados} archivos migrados')


if __name__ == '__main__':
    main()
