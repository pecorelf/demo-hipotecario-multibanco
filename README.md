# Tus nuevas Llaves · POC Santander × Deloitte Digital

POC funcional para la propuesta de Deloitte Digital Chile al Banco Santander
Chile. Demuestra en vivo cómo una solución moderna resuelve el proceso
hipotecario (hoy 90–120 días) usando IA real (Claude API) sobre un cockpit
editorial sobrio.

> Promesa: **"del papel al dato, en vivo, ad-hoc a Chile"**.

---

## Setup

### 1. Pre-requisitos

- Node.js ≥ 18.18
- npm ≥ 9

### 2. Instalación

```bash
npm install
```

### 3. Configurar la API key de Anthropic

Obtener una key en https://console.anthropic.com/settings/keys (workspace de
Deloitte) y luego:

```bash
cp .env.example .env.local
```

Editar `.env.local`:

```
VITE_ANTHROPIC_API_KEY=sk-ant-...
```

**Importante:** `.env.local` está en `.gitignore`. Nunca commitearlo.

### 4. Levantar el dev server

```bash
npm run dev
```

Abre http://localhost:5173 (Vite abre el navegador automáticamente).

---

## Scripts disponibles

| Script              | Qué hace                                             |
|---------------------|------------------------------------------------------|
| `npm run dev`       | Dev server con HMR en :5173                          |
| `npm run build`     | Type-check + build de producción a `dist/`           |
| `npm run preview`   | Sirve el build de producción para inspeccionarlo     |
| `npm run typecheck` | Solo `tsc --noEmit` (útil en pre-commit)             |

---

## Stack

- **React 18** + **TypeScript strict** + **Vite 5**
- **Tailwind CSS 3** con tokens del Design System (ver `DESIGN_SYSTEM.md`)
- **React Router 6** para las 8 rutas
- **Zustand** para el estado global (rol activo, caso en curso)
- **React Query** para llamadas API (cuando aplique en módulos siguientes)
- **@anthropic-ai/sdk** con `dangerouslyAllowBrowser: true` (la key vive en `.env.local`)
- **lucide-react** para íconos
- **react-markdown** para renderizar respuestas de Claude con formato

---

## Estructura

```
src/
├── components/
│   ├── ui/        # Componentes del Design System (Kicker, Card, Button, etc.)
│   ├── ai/        # Tratamiento visual específico de IA (AiMessage, AiDecision, etc.)
│   └── layout/    # AppShell, AppHeader, AppFooter, RoleSwitcher
├── pages/         # Las 8 pantallas de la demo (una carpeta por pantalla)
├── lib/           # claude.ts (API wrapper), format.ts (RUT, UF, CLP), cn.ts
├── data/          # mock.ts — datos chilenos creíbles (clientes, casos, ejecutivos)
├── store/         # appStore.ts — Zustand
├── hooks/         # Custom hooks (vacío por ahora)
├── types/         # Domain types
└── styles/        # tokens.css — CSS custom properties
```

---

## Rutas

| Path                    | Pantalla                                    | Módulo |
|-------------------------|---------------------------------------------|--------|
| `/`                     | Redirect → `/cliente`                       | —      |
| `/cliente`              | Cliente · Onboarding                        | M1     |
| `/cliente/credito`      | Cliente · Mi crédito en curso               | M2     |
| `/cliente/documentos`   | Cliente · Documentos y datos                | M3     |
| `/ejecutivo`            | Ejecutivo · Cockpit                         | M4     |
| `/ejecutivo/audio`      | Ejecutivo · Audio a caso                    | M5     |
| `/backoffice`           | Back office · Dashboard                     | M6     |
| `/inmobiliaria`         | Corredora · Portal                          | M7     |
| `/comparador`           | Comparador honesto                          | M8     |

---

## Modelo Claude

El wrapper en `src/lib/claude.ts` exporta una constante:

```ts
export const CLAUDE_MODEL = 'claude-sonnet-4-6';
```

Si sale Sonnet 4.7 antes de la demo, se cambia ahí en una sola línea.

---

## Estado de módulos

| Módulo | Alcance                                                                   | Estado |
|--------|---------------------------------------------------------------------------|--------|
| **M0** | Bootstrap: stack, Design System, shell, store, 8 rutas placeholder        | ✅     |
| **M1** | Capa Claude API + mock case completo + hooks + `/test` para diagnóstico   | ✅     |
| **M2** | Pantalla 1 · Cliente Onboarding · Eugenia (casos 1, 9, 10)                | ✅     |
| **M3** | Pantalla 3 · Cliente Documentos (casos 2, 3)                              | ✅     |
| **M4** | Pantalla 2 · Cliente Mi crédito + Time travel (casos 5, 13)               | ✅     |
| **M5** | Pantalla 4 · Ejecutivo Cockpit + Copiloto + Derivación (casos 4, 5, 8, 11)| ✅     |
| **M6** | Pantalla 5 · Ejecutivo Audio→Caso (caso 15)                               | ✅     |
| **M7** | Pantalla 6 · Back office Dashboard (casos 4, 7)                           | ✅     |
| **M8** | Pantalla 7 · Inmobiliaria Portal (casos 6, 12)                            | ✅     |
| **M9** | Pantalla 8 · Comparador honesto (caso 14)                                 | ✅     |
| **M10**| Modo presentador `/demo` + cache fallback + reset (todos los casos)       | ✅     |

Orden de build: Opción B — narrativa primero. Los diferenciadores (M2 Cockpit,
M3 Portal, M4 Time-travel) antes que la cobertura RFP obvia.

## Verificar conexión a Claude API

Antes de empezar M2 corre `npm run dev` y abre **http://localhost:5173/test** —
escribe un prompt y verifica que aparece el texto palabra por palabra con cursor
pulsante. Si ves error `[auth]` revisa `.env.local`.

---

## Convenciones

- **Cero emojis** en UI productiva (este README es la única excepción).
- **Cero `console.log`** en código mergeado.
- **Cero `any`** en TypeScript. `unknown` y narrow.
- **Tokens del Design System siempre** — no hex hardcodeado en componentes.
- **`text-*` semántico** (`text-text-primary`), no `text-black`/`text-gray-700`.
- **Datos siempre chilenos** — ver `src/data/mock.ts`. RUTs con DV correcto.

---

## Para la demo

- Verificar `VITE_ANTHROPIC_API_KEY` antes del meeting (no la key del laptop personal).
- Tener fallback con datos pre-cacheados para escenas críticas (M2, M4, M7).
- Switch de rol arriba a la derecha — alternar entre Cliente / Ejecutivo / Back / Corredora demuestra phygital y vista 360 en una sola sesión.

---

© 2026 Deloitte Touche Tohmatsu Ltd. · Demo interna, no distribuir.
