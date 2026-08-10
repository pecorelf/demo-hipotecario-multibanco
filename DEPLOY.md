# Despliegue en Vercel

## 1 · Repositorio

Crear un repositorio nuevo. No reutilizar el del proyecto de origen: así nadie
llega por un enlace antiguo a una versión con identidad de cliente.

```bash
git init
git add .
git commit -m "Demostración multi-institución"
git remote add origin <url-del-repositorio>
git push -u origin main
```

## 2 · Proyecto en Vercel

Importar el repositorio desde el panel de Vercel. La configuración se detecta
sola: Vite, `npm run build`, salida en `dist`.

## 3 · Almacenamiento para los logotipos

Los logotipos y las personalizaciones se guardan en Vercel KV. Sin él la
aplicación funciona igual, pero las personalizaciones quedan solo en el
navegador de quien las hizo.

En el panel del proyecto:

```
Storage → Create Database → KV → Connect
```

Al conectarlo, Vercel añade `KV_REST_API_URL` y `KV_REST_API_TOKEN`
automáticamente. No hay que copiarlas a mano.

## 4 · Variables de entorno

En `Settings → Environment Variables`:

| Variable | Para qué sirve |
|---|---|
| `POC_PASSWORD` | Contraseña de acceso a la demostración |
| `ADMIN_TOKEN` | Token de `/admin`. Debe ser distinto de la contraseña |
| `ANTHROPIC_API_KEY` | Asistente conversacional |

`VITE_BYPASS_AUTH` es solo para desarrollo local: no configurarla en Vercel.

## 5 · Verificación

```
□ La demostración pide contraseña
□ /admin pide el token
□ Al subir un logotipo y recargar, el logotipo persiste
□ Los enlaces /?t=<institución> muestran la identidad correcta
□ El asistente conversacional responde
```

---

## Sobre los logotipos

Se admiten PNG, JPG, SVG y WebP.

Los vectoriales se conservan tal cual. Los mapas de bits se reescalan a 80
píxeles de altura y se convierten a WebP antes de guardarse: un archivo de
varios cientos de kilobytes queda en unas pocas decenas. Sin esa reducción, un
logotipo en alta resolución podría superar el límite de tamaño por registro.

La transparencia se conserva. Conviene usar logotipos con fondo transparente,
porque se muestran sobre superficies claras.

## Si el almacenamiento falla

La aplicación no se rompe. El orden de resolución es:

1. Personalización guardada
2. Preset en código
3. Tema neutro

Un fallo de almacenamiento durante una demostración hace caer al preset, nunca
a la identidad de otra institución.
