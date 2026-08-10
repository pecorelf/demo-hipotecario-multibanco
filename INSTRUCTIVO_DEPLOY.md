# Instructivo de Deploy — POC Hipotecario a Vercel

Este es el paso a paso de lo que vos hacés para que el POC quede online.
Estimado de tiempo: **30-45 minutos** la primera vez, ~10 minutos las siguientes.

---

## Resumen de la arquitectura

```
Frontend (React/Vite) ─────► /api/claude (Edge Function) ─────► Anthropic API
   Sin API key                    Con API key                       
   (público)                      (sólo server-side)                
```

Cuando alguien usa el POC:
1. El frontend llama a `/api/claude` (mismo dominio)
2. La Edge Function de Vercel agarra la API key de Anthropic de las env vars del servidor
3. Hace la llamada real a Anthropic
4. Devuelve la respuesta al frontend (streaming SSE si corresponde)

La API key **nunca** está en el navegador. Cero exposición a Santander.

---

## Paso 1 — Crear cuenta en Vercel (5 min)

1. Andá a **https://vercel.com/signup**
2. Hacé sign up con tu cuenta de GitHub (recomendado) o de Google.
   - Si no tenés GitHub, después te conviene crearte una porque Vercel
     se integra mejor cuando el código está en un repo.
3. Cuando te pregunte el plan, elegí **Hobby** (gratis).

> 💡 Si más adelante necesitás funciones de >10 segundos o password
> protection automática, podés actualizar a Pro (US$20/mes).

---

## Paso 2 — Crear API key dedicada en Anthropic (5 min)

Esto es importante: la key que usás para desarrollo NO la pongas en
el deploy de Santander. Creamos una nueva, con límite mensual.

1. Andá a **https://console.anthropic.com**
2. Loguéate con tu cuenta.
3. En el menú izquierdo: **Settings → API Keys**.
4. Click en **Create Key**.
5. Nombre: `hipotecia-santander-prod`
6. Workspace: el que uses para Deloitte (si tenés varios).
7. **IMPORTANTE — Click en "Set spend limit"** (o "Set budget"):
   - Monthly limit: **US$50** (suficiente para varias semanas de demo)
   - Si te quedas corto, después lo subís.
8. Copiá la key que te muestra. **Sólo se ve una vez**. Guardala
   en algún lado seguro (1Password, Notion privado, lo que uses).

> Si Santander de alguna forma obtuviera esta key, lo peor que puede
> pasar es US$50 de gasto. Después la revocás y problema cerrado.

---

## Paso 3 — Subir el código a GitHub (10 min)

Vercel funciona mejor cuando el código está en un repositorio Git.
Te permite redeploys automáticos cuando cambies código.

1. Andá a **https://github.com/new**
2. Repo name: `hipotecia-poc-santander`
3. **Marcá "Private"** (importante — código sensible)
4. NO marques "Initialize with README" (ya tenés archivos).
5. Click **Create repository**.
6. GitHub te muestra los comandos para hacer push. Anotá:
   ```
   git remote add origin https://github.com/TU_USUARIO/hipotecia-poc-santander.git
   ```

Ahora desde tu terminal local:

```bash
# Descomprimí el zip que te entregué (hipotecia-poc-v11.zip)
cd hipotecia-poc

# Inicializá git
git init
git add .
git commit -m "Initial POC para Santander"

# Conectá con GitHub
git branch -M main
git remote add origin https://github.com/TU_USUARIO/hipotecia-poc-santander.git
git push -u origin main
```

> ⚠️ Antes de hacer `git add .`, verificá que `.gitignore` tenga
> `.env` y `node_modules`. El POC ya viene con esto pero
> chequealo: `cat .gitignore`. **Si subís un `.env` con tu API key
> a GitHub, esa key queda comprometida y hay que revocarla.**

---

## Paso 4 — Conectar Vercel a GitHub (5 min)

1. En Vercel, click en **Add New... → Project**
2. **Import Git Repository** → seleccioná `hipotecia-poc-santander`.
3. Vercel detecta automáticamente que es un proyecto Vite.
4. **Framework Preset**: debería decir "Vite" (si dice otra cosa, cambialo).
5. **Root Directory**: dejalo en `./` (default).
6. **Build Command**: `npm run build` (default).
7. **Output Directory**: `dist` (default).
8. **NO HAGAS DEPLOY TODAVÍA**. Antes configurá las env vars (paso siguiente).

---

## Paso 5 — Configurar la API key en Vercel (3 min)

En la pantalla de import del proyecto, antes de hacer deploy:

1. Expandí la sección **Environment Variables**.
2. Agregá una variable:
   - Name: `ANTHROPIC_API_KEY`
   - Value: la key que copiaste en el Paso 2
   - Environments: marcá las 3 (Production, Preview, Development)
3. Click **Add**.

> 💡 Si te olvidás de esto y deployás sin la key, el POC se va a romper
> al primer click. Lo arreglás yendo a Settings → Environment Variables
> y haciendo redeploy.

---

## Paso 6 — Deploy (5 min)

1. Click en **Deploy**.
2. Esperá 1-2 minutos. Vercel:
   - Clona tu repo
   - Instala dependencies
   - Corre `npm run build`
   - Despliega el frontend a su CDN
   - Crea la Edge Function `/api/claude`
3. Cuando termine, te da una URL tipo:
   `https://hipotecia-poc-santander.vercel.app`

---

## Paso 7 — Verificar que funciona (3 min)

1. Abrí la URL en una pestaña incógnito.
2. Deberías ver el flujo de cliente Santander.
3. Loguéate con el RUT default y conversá con Eugenia.
4. Si Eugenia responde, **todo está OK**. La API key está bien configurada
   y el proxy funciona.
5. Si te aparece un error "ANTHROPIC_API_KEY missing" o similar,
   volvé a Vercel → Settings → Environment Variables y verificá que
   la variable existe Y está marcada para Production.

---

## Paso 8 — Compartir con Carolina

Por ahora (turno 1) **no hay password**. Cualquiera con el link entra.

Recomendación:
- Compartí el link sólo con Carolina y eventualmente su equipo cercano.
- **NO** lo metas en el deck PPT todavía (cuando agreguemos password
  en turno 2, podés).
- Si Carolina lo abre y todo se ve bien, podemos pasar al turno 2 con
  password + audit log.

---

## Problemas comunes y soluciones

### "Function execution timed out"

El plan Hobby tiene un timeout máximo de 60 segundos para Edge Functions
con streaming, así que esto no debería pasar. Si pasa:
- Probable causa: el modelo está tardando demasiado (raro)
- Solución: actualizá a Pro o reportame en el próximo turno

### "ANTHROPIC_API_KEY missing"

- Andá a Vercel → tu proyecto → Settings → Environment Variables
- Verificá que existe `ANTHROPIC_API_KEY` y tiene valor
- Verificá que está marcada para "Production"
- En el menú superior → Deployments → último deploy → click los tres
  puntos → "Redeploy" (con la opción "Use existing Build Cache" desmarcada)

### "Error de red" al usar el POC

- Abrí DevTools → Network
- Buscá la llamada a `/api/claude`
- Mirá el status code y el response
- Si status 502 → problema en la Edge Function (mostrame el response)
- Si status 401 → la key está mal copiada
- Si status 429 → Anthropic está rate-limiteándote (esperá 1 minuto)

### "Cuesta caro"

- Cada conversación con Eugenia cuesta entre US$0.01 y US$0.05
- Con el límite mensual de US$50, soportás varios cientos de demos
- Si te acercás al límite, te avisa Anthropic por email
- Si lo pasás, se corta automáticamente

---

## Lo que viene después (turno 2)

Cuando me confirmes que el deploy quedó OK, en el turno 2 implemento:
- Pantalla de login con password
- Log de accesos (quién entró, cuándo, desde qué IP)
- Endpoint admin para que vos veas el log

Para eso vas a tener que agregar 2 env vars más en Vercel:
`POC_PASSWORD` y `ADMIN_TOKEN`. Eso te lo explico cuando lleguemos.

---

¿Te trabaste en algún paso? Decime en qué número estás y qué pasa.
