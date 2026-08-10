# v18 · Simulador de Impacto · Integración

## Qué hay en este paquete

```
src/pages/13-simulador-impacto/index.tsx     ← Archivo NUEVO
src/App.tsx                                   ← Modificado (1 import + 1 ruta)
```

El simulador funciona standalone una vez que la ruta está conectada.
Accesible en `/ejecutivo/simulador-impacto`.

---

## Cómo integrarlo en tu v17 local

### Paso 1 · Copiar el archivo del simulador

Copiá el directorio completo:

```
src/pages/13-simulador-impacto/
```

a tu proyecto local en la misma ruta. No tiene dependencias externas
salvo las que ya están en el POC.

### Paso 2 · Editar `src/App.tsx`

Agregá el import junto a los otros imports de páginas:

```tsx
import SimuladorImpacto from '@/pages/13-simulador-impacto';
```

Agregá la ruta dentro de `<Routes>` cerca del cockpit del ejecutivo:

```tsx
<Route path="ejecutivo/simulador-impacto" element={<SimuladorImpacto />} />
```

### Paso 3 · Agregar la card en el DemoHub

En tu `src/pages/00-portal/DemoHub.tsx` agregá una card más con
este contenido. Adaptalo al patrón visual que ya tenés en las
otras cards del hub:

```tsx
{
  route: '/ejecutivo/simulador-impacto',
  kicker: 'Caso de negocio',
  title: 'Simulador de Impacto',
  description:
    'Sala de decisión para el rediseño hipotecario. Funnel 8.000 → 1.000, ' +
    'palancas de mejora y proyección económica con valor presente neto.',
  icon: <TrendingUp size={20} />,
  // featured: true si querés que aparezca destacada
},
```

No olvidés importar `TrendingUp` desde `lucide-react` arriba del
archivo.

### Paso 4 · Agregar link en el Cockpit Ejecutivo

En `src/pages/04-ejecutivo-cockpit/index.tsx`, en el header de la
vista, agregá un botón visible:

```tsx
<Link
  to="/ejecutivo/simulador-impacto"
  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-accent text-text-inverse text-body-sm font-medium hover:bg-accent-muted transition-colors"
>
  <TrendingUp size={14} />
  Simulador de Impacto
</Link>
```

Recordá importar `Link` desde `react-router-dom` y `TrendingUp`
desde `lucide-react`.

---

## Parámetros del modelo

Si querés ajustar el caso de negocio, los valores están todos
juntos en la parte superior del archivo `index.tsx` del simulador:

```ts
const APPROVALS_PER_MONTH = 8_000;
const BASELINE_CURSED_PER_MONTH = 1_000;
const MAX_CONVERSION = 0.25;       // techo del rediseño
const UF_TO_CLP = 40_425;
const TICKET_UF = 4_500;
const SPREAD_ANNUAL = 0.0375;      // 3,75%
const NPV_FACTOR = 12;             // anualidad a 8% por 25 años

const LEVER_WEIGHTS = {
  reparos: 0.40,
  proactivo: 0.35,
  documental: 0.25,
};
```

Pesos suman 1.0. Si los cambiás, mantené la suma.

---

## Cifras default (sliders 30 / 25 / 35)

Con los valores por defecto, el simulador muestra a Trautmann:

```
+592 hipotecas adicionales por mes
19,9% conversión proyectada (vs 12,5% actual)
$48.585 MM CLP spread anual (año 1)
$582.000 MM CLP valor presente neto a 25 años
ROI 1.164x sobre inversión Deloitte de CLP 500 MM
```

Cifras inventadas a propósito conservadoras en el slider default.
Si Trautmann pregunta "y si lográramos más", subiendo los sliders
en vivo se llega a:

```
Escenario máximo (50 / 50 / 50):
+1.000 hipotecas adicionales por mes
25% conversión proyectada
$81.900 MM CLP spread anual
$983.000 MM CLP VPN
```

---

## Exportar a PDF

El botón "Exportar a PDF" usa `window.print()` con estilos
dedicados (@media print). Funciona en cualquier navegador
moderno sin librerías externas. El usuario debe elegir
"Guardar como PDF" en el diálogo de impresión.

Los controles (header, sliders) se ocultan en la versión
impresa. Quedan solo: hero, funnel, KPIs, antes/después,
y disclaimer. Formato A4 horizontal.

---

## Convenciones que respeté del POC v17

- Español neutro chileno (sin voseo)
- Color Santander #E00B0B vía clase `text-accent`
- Fuente Santander Text (heredada del shell)
- Pills, Kicker, PageTitle desde `@/components/ui`
- `cn` helper desde `@/lib/cn`
- Sin llamadas a Claude API (modelo determinístico)
- Tabular nums en cifras
- DemoDisclaimer al inicio del shell se mantiene
