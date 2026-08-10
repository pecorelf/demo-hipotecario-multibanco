# Instructivo v12 — Activar Password + Audit Log

Esta versión agrega:
- 🔒 Pantalla de login con contraseña
- 📊 Log de accesos (quién entró, cuándo, qué páginas vio)
- 👁️ Endpoint admin para ver el log

**Tiempo estimado: 15 minutos**.

---

## Paso 1 — Subir el código nuevo a GitHub (2 min)

Descomprimí el zip `hipotecia-poc-v12.zip` **encima de tu carpeta actual** (sobrescribe). O si lo descomprimís en otro lugar, copiá los archivos nuevos/modificados encima.

Después, en PowerShell:

```powershell
cd C:\Users\fpecorella\proyectos-pocs\hipotecia-poc-v2\hipotecia-poc

git add .
git commit -m "v12: password + audit log"
git push
```

Vercel detecta el cambio y arranca un build automático. **No te apures, primero hacé los pasos 2 y 3 abajo antes de probar.**

---

## Paso 2 — Habilitar Vercel KV (3 min)

Vercel KV es un storage simple (Redis-compatible) que vamos a usar para el log. Es gratis hasta cierto límite, más que suficiente para una demo.

1. **https://vercel.com/dashboard** → tu proyecto `hipoteca-poc-santander`
2. Click en **Storage** (en el menú superior del proyecto)
3. Click el botón **Create Database**
4. En el modal:
   - Tipo: elegí **KV** (Redis-compatible)
   - Nombre: `hipoteca-poc-logs` (o el que quieras)
   - Region: elegí la más cercana a `iad1` (US East). Generalmente "Washington, D.C., USA (iad1)".
5. Click **Create**
6. Cuando termine de crearse, te aparece el dashboard del KV.
7. Vercel te pregunta si querés **conectarla al proyecto** — decí **Yes** y elegí `hipoteca-poc-santander`.
8. Marcá los 3 ambientes (Production, Preview, Development).
9. Click **Connect**.

Esto agrega 4 variables de entorno automáticamente: `KV_URL`, `KV_REST_API_URL`, `KV_REST_API_TOKEN`, `KV_REST_API_READ_ONLY_TOKEN`. **No las toques.**

> Si por algún motivo no ves la opción "KV" sino solo "Postgres" o "Blob", asegurate de estar en el plan Hobby y refrescá la página. Vercel a veces toma unos segundos en habilitarla.

---

## Paso 3 — Agregar 2 env vars nuevas (3 min)

En Vercel → tu proyecto → **Settings** → **Environment Variables**:

### Variable 1 — La contraseña

- **Key:** `POC_PASSWORD`
- **Value:** `deloitte-2026`
- **Environments:** marcá los 3 (Production, Preview, Development)
- Click **Save**

### Variable 2 — El token admin

- **Key:** `ADMIN_TOKEN`
- **Value:** un string aleatorio largo. Generá uno con:
  - **Linux/Mac:** `openssl rand -hex 24`
  - **Online:** https://www.random.org/strings/ (32 chars alfanuméricos)
  - **Ejemplo:** `f3a2c8e1b7d4f6a9c2e5b8d1f4a7c3e6b9d2f5a8c1e4`
- **Environments:** marcá los 3
- Click **Save**

**Guardá el ADMIN_TOKEN en un lugar seguro** (Notepad temporal, después en 1Password / Notion). Lo vas a necesitar para acceder al log.

---

## Paso 4 — Forzar redeploy (2 min)

Las env vars no se aplican retroactivamente. Hay que disparar un nuevo deploy:

1. Vercel → tu proyecto → solapa **Deployments**
2. El último deploy (probablemente del push del Paso 1) debería estar arriba
3. Si dice **Ready** en verde, perfecto — pero las env vars del Paso 3 NO se aplicaron porque las agregaste después
4. Click los **3 puntos** (...) a la derecha del último deploy
5. Click **Redeploy**
6. En el modal, **desmarcá** "Use existing Build Cache"
7. Click **Redeploy**
8. Esperá 2-3 minutos a que termine

---

## Paso 5 — Probar el login (3 min)

1. Abrí tu URL en una **pestaña incógnito** (importante — sin caché)
2. Deberías ver la **pantalla de login** con el campo "Contraseña"
3. Ingresá `deloitte-2026` y click **Ingresar**
4. Si funciona, te lleva al POC normal
5. Probá Eugenia para confirmar que sigue funcionando

### Si ves la pantalla de login PERO el password no funciona

- Volvé a Vercel → Settings → Environment Variables
- Verificá que `POC_PASSWORD` existe Y tiene el valor exacto que vas a tipear
- Verificá que está marcada para **Production**
- Volvé a hacer Redeploy (Paso 4)

### Si NO ves la pantalla de login

- Probable causa: el deploy todavía no terminó o falló
- Andá a Deployments y revisá el estado del último

---

## Paso 6 — Ver el log de accesos (2 min)

Abrí en el navegador:

```
https://tu-url.vercel.app/api/admin/logs?token=TU_ADMIN_TOKEN
```

Reemplazá:
- `tu-url.vercel.app` por la URL real de tu deploy
- `TU_ADMIN_TOKEN` por el token que pusiste en la env var ADMIN_TOKEN

Vas a ver una página tipo dashboard con:
- Cantidad total de eventos
- Logins exitosos / fallidos
- Sesiones únicas
- IPs únicas
- Navegaciones
- Tabla completa de eventos

### Opciones de export

- **CSV:** click el botón "Descargar CSV" (lo mismo, agregar `&format=csv` a la URL)
- **JSON:** click el botón "Ver JSON"

### Guardá el link admin

Una vez funcione, **guardalo en favoritos** o un Notion. Cada vez que querés ver quién entró al POC, abrís ese link.

---

## Paso 7 — Compartir con Santander

Ahora sí estás listo para mandar el link a Carolina y al equipo de Santander.

**Te recomiendo este formato:**

```
Asunto: POC Hipotecario · Acceso de prueba

Carolina,

Te comparto el link al POC del rediseño hipotecario:
https://tu-url.vercel.app

Contraseña: deloitte-2026

El POC es una demostración funcional del flujo cliente-banco
bajo el enfoque agéntico que conversamos. Podés navegar por:
- Vista del cliente (login con cualquier RUT y clave)
- Vista del ejecutivo Santander
- Operación interna, jefatura, gobierno tecnológico
- Y más en el catálogo /demo

Cualquier feedback es bienvenido.

Saludos,
Francisco
```

> 💡 **Mandá el link en un mail y la contraseña por WhatsApp / Teams**.
> No las dos cosas en el mismo medio — es buena práctica de seguridad.

---

## Lo que tenés disponible ahora

```
URL POC:        https://tu-url.vercel.app
URL Admin:      https://tu-url.vercel.app/api/admin/logs?token=XXX
Password POC:   deloitte-2026
Admin token:    (el que generaste)
API key:        en Anthropic Console, con límite US$50/mes
```

## Si querés cambiar la contraseña después

1. Vercel → Settings → Environment Variables
2. Edit en `POC_PASSWORD` → nuevo valor
3. Redeploy (Paso 4)

Cambio cero código.

## Si querés revocar TODOS los accesos activos

Las sesiones duran 24h. Si querés invalidarlas todas inmediatamente:

1. Cambiá `POC_PASSWORD` por otro valor (aunque sea agregar un caracter)
2. Redeploy
3. Todas las sesiones existentes pasan a ser inválidas

Si después querés volver a la clave anterior, lo hacés igual.

---

## Posibles problemas

### "Server not configured: POC_PASSWORD missing"

- Falta la env var. Volvé al Paso 3.

### "Server not configured: ADMIN_TOKEN missing" al abrir /api/admin/logs

- Falta la env var ADMIN_TOKEN. Volvé al Paso 3.

### "Unauthorized" al abrir /api/admin/logs

- El token en la URL no coincide con la env var ADMIN_TOKEN.
- Verificá que copiaste bien el token (sin espacios, sin newlines).

### El log está vacío

- KV no está conectado al proyecto. Volvé al Paso 2 punto 7.
- O nadie entró todavía después de habilitar el log.

### La pantalla de login no aparece

- POC_PASSWORD no está configurada. La validación del PasswordGate falla en `/api/auth` y vuelve un error que el frontend interpreta como "error de red".
- Configurá la env var y redeploy.

---

¿Algo no funciona? Decime en qué paso y qué error ves.
