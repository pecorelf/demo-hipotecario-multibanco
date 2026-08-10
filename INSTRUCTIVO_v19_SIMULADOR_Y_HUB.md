# v19 · Simulador de Impacto + Hub del Inmueble · Integración

Este paquete contiene **dos features nuevas** para sumar a tu POC v17:

```
1. Simulador de Impacto     /ejecutivo/simulador-impacto
2. Hub del Inmueble         /cliente/mi-inmueble
                            /ejecutivo/inmueble
                            /cliente/mi-inmueble?shared=1 (modo compartido)
```

## Archivos en el paquete

```
src/pages/13-simulador-impacto/index.tsx     ← NUEVO
src/pages/14-hub-inmueble/index.tsx          ← NUEVO
src/App.tsx                                  ← Modificado
INSTRUCTIVO_v19_SIMULADOR_Y_HUB.md           ← Este archivo
```

---

## Paso 1 · Copiar los archivos nuevos

Copiá los dos directorios completos a tu proyecto local en la misma ruta:

```
src/pages/13-simulador-impacto/
src/pages/14-hub-inmueble/
```

Ninguno tiene dependencias externas extra. Usan solo lo que ya está
en el POC (lucide-react, react-router-dom, tailwind, tu sistema de
componentes UI).

---

## Paso 2 · Editar `src/App.tsx`

### Imports

Agregá estos imports junto a los otros imports de páginas:

```tsx
import SimuladorImpacto from '@/pages/13-simulador-impacto';
import HubInmueble from '@/pages/14-hub-inmueble';
```

### Rutas

Dentro de `<Routes>`, agregá las 3 rutas nuevas cerca del cockpit:

```tsx
<Route path="ejecutivo/simulador-impacto" element={<SimuladorImpacto />} />
<Route path="cliente/mi-inmueble" element={<HubInmueble />} />
<Route path="ejecutivo/inmueble" element={<HubInmueble />} />
```

---

## Paso 3 · Agregar cards en el DemoHub

En tu `src/pages/00-portal/DemoHub.tsx` agregá dos cards nuevas.
Adaptá al patrón visual que ya tenés.

```tsx
{
  route: '/ejecutivo/simulador-impacto',
  kicker: 'Caso de negocio',
  title: 'Simulador de Impacto',
  description:
    'Sala de decisión para el rediseño hipotecario. Funnel 8.000 → 1.000, ' +
    'palancas de mejora y proyección económica con valor presente neto.',
  icon: <TrendingUp size={20} />,
},
{
  route: '/cliente/mi-inmueble',
  kicker: 'Custodia digital',
  title: 'Hub del Inmueble',
  description:
    'Bóveda permanente con toda la documentación, línea de tiempo del inmueble, ' +
    'acciones de cliente (refinanciar, vender, comprar otro) y opción de compartir ' +
    'acceso temporal con un asesor.',
  icon: <Building2 size={20} />,
  featured: true,
},
```

Importá los iconos arriba del archivo:

```tsx
import { TrendingUp, Building2 } from 'lucide-react';
```

---

## Paso 4 · Agregar link en Cockpit Ejecutivo

En `src/pages/04-ejecutivo-cockpit/index.tsx`, en el header agregá
**dos** botones:

```tsx
<div className="flex items-center gap-2">
  <Link
    to="/ejecutivo/simulador-impacto"
    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-accent text-text-inverse text-body-sm font-medium hover:bg-accent-muted transition-colors"
  >
    <TrendingUp size={14} />
    Simulador de Impacto
  </Link>
  <Link
    to="/ejecutivo/inmueble"
    className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-border-hairline text-body-sm hover:bg-bg-sunken transition-colors"
  >
    <Building2 size={14} />
    Ver bóveda del cliente
  </Link>
</div>
```

Imports al inicio:

```tsx
import { Link } from 'react-router-dom';
import { TrendingUp, Building2 } from 'lucide-react';
```

---

## Paso 5 · Agregar link en ClienteSeguimiento (opcional pero recomendado)

En `src/pages/10-cliente-seguimiento/ClienteSeguimiento.tsx`,
agregá un link discreto al Hub del Inmueble en el header del cliente:

```tsx
<Link
  to="/cliente/mi-inmueble"
  className="inline-flex items-center gap-1.5 text-body-sm text-text-secondary hover:text-accent"
>
  <Building2 size={14} />
  Mi inmueble
</Link>
```

Esto le permite al cliente acceder a la bóveda directamente desde
la vista activa de su operación.

---

## Configuración del Hub del Inmueble

Si querés ajustar los datos del inmueble demo, los valores están todos
juntos arriba del archivo `src/pages/14-hub-inmueble/index.tsx`:

```ts
const INMUEBLE: InmuebleData = {
  direccion: 'Av. Apoquindo 4500, dpto 1203',
  comuna: 'Las Condes',
  valorTasadoUF: 6850,
  saldoDeudorUF: 4720,
  pagadoUF: 40,
  dividendoMensualUF: 28.5,
  plazoRestante: '24 años, 11 meses',
  plusvaliaEtiqueta: 'positiva',
  // ...
};
```

Los documentos bajo custodia (17 en total) están en el array
`DOCUMENTOS` justo debajo. Cada uno tiene categoría, autor, fecha,
y estado de vigencia.

---

## Modos del Hub

El Hub del Inmueble es una vista DUAL controlada por URL:

```
/cliente/mi-inmueble                  → Vista del cliente
/ejecutivo/inmueble                   → Vista del ejecutivo
/cliente/mi-inmueble?shared=1&t=XXX   → Modo compartido (banner + read-only)
```

La diferencia entre vistas:

### Vista del CLIENTE
- Saludo personalizado
- KPIs en tono positivo (plusvalía destacada como "Positiva")
- 3 acciones: Refinanciar · Vender · Comprar otro
- Botón "Compartir acceso" para generar link temporal

### Vista del EJECUTIVO
- Header: "Bóveda de Francisco Pecorella · HC-2026-0042"
- Botón "Volver al cockpit"
- 3 acciones: Generar oferta refi · Pre-aprobar · Cross-sell
- Misma bóveda documental (solo lectura del estado actual)

### Modo COMPARTIDO
- Banner amarillo "Vista compartida por X · El link caduca el Y"
- Sin acciones, sin compartir, solo bóveda visible
- Útil para demo: muestra que el cliente puede dar acceso a su abogado

---

## Cómo cuenta esto en la demo

Cuando le muestres esto a Carolina o a Trautmann:

```
1. Arrancá en /cliente/mi-inmueble (vista cliente)
   "Acá ven cómo queda el cliente DESPUÉS de cursada la hipoteca.
    No se va del ecosistema Santander. Tiene su expediente
    completo en una bóveda permanente."

2. Recorré la línea de tiempo y la bóveda con tabs
   "13 documentos del proceso, 3 del cierre, 4 del inmueble.
    Vigencias gestionadas automáticamente."

3. Mostrá el banner de vencidos
   "Cuando un certificado expira, el sistema detecta y propone
    reemisión proactiva. Esto es ingreso adicional para
    Santander."

4. Click en 'Refinanciar' o 'Comprar otro'
   "Acá viene la promesa: el inmueble como puerta a más
    negocio. Cross-sell natural."

5. Click en 'Compartir acceso'
   "El cliente puede dar vista parcial a su abogado o asesor.
    Diferenciación frente a la competencia."

6. Cambiá a /ejecutivo/inmueble
   "La misma bóveda, pero ahora el banco. Yelitza ve el caso
    completo y puede gestionar ofertas, pre-aprobaciones,
    cross-sell. Todo en un lugar."
```

---

## Cosas que NO incluí (a propósito)

- Plusvalía con número específico → solo etiqueta "Positiva"
  (mantiene la promesa sin comprometer al banco con una cifra)
- Costos explícitos de reemisión → solo trámite y plazo
- Datos de otros inmuebles del cliente → fuera de alcance demo
- Firmas digitales reales → simulado
- Descargas reales de PDF → alert simulado

---

## Build verificado

El paquete fue construido con:

```
✓ npm run build           sin errores
✓ Vite bundling           OK
✓ TypeScript strict       OK
✓ Tailwind purge          OK
```

Cualquier ajuste de copy o datos, me avisás.
