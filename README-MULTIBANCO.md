# Demostración multi-institución

El recorrido hipotecario completo, adaptable a la identidad de cada institución
mediante un identificador en la URL.

## Arranque

```bash
npm install
cp .env.example .env
npm run dev
```

## Enlaces por institución

```
/?t=banco-de-chile      /?t=bice
/?t=bancoestado         /?t=coopeuch
/?t=itau                /?t=bci
/?t=scotiabank          /?t=institucion-a
/?t=consorcio           /?t=banco-falabella
```

Sin parámetro se sirve la versión neutra, sin identidad de ninguna institución.
Cada enlace resuelve de forma independiente: dos personas pueden presentar a dos
instituciones distintas al mismo tiempo sin interferencia.

## Administración

`/admin`, con el token de `ADMIN_TOKEN`. Permite ajustar colores, tipografía,
logotipo y los nombres del caso, con vista previa en vivo.

## Principio de resolución

El tema se resuelve en este orden y nunca cae lateralmente:

1. Personalización guardada para el identificador solicitado
2. Preset en código
3. Tema neutro

Si el almacenamiento falla, cae al preset. Si el identificador no existe, cae al
tema neutro. **En ningún caso muestra la identidad de otra institución.**

## Revisión antes de cada demostración

```bash
npm run check
```

Busca nombres de instituciones, sistemas internos, personas reales, datos del
caso original y colores fijados en el código. Debe terminar sin hallazgos
críticos.

```
□ npm run check sin críticos
□ Colores verificados contra la identidad de la institución
□ Logotipo cargado y legible
□ Recorrido completo en el enlace correspondiente
□ Nombre del asistente coherente
```

## Qué se transformó

| Antes | Ahora |
|---|---|
| Nombre de institución fijo | `BRAND.name`, `BRAND.shortName`, `BRAND.legalName` |
| Asistente con nombre fijo | `BRAND.assistantName` |
| Personas del caso | Nombres genéricos, editables desde `/admin` |
| Dirección del inmueble | Dirección genérica |
| Competidores nombrados | Competidor A, B, C… |
| Color fijado en código | `var(--color-accent-primary)` |
| Tipografía propietaria | Sustituto de Google Fonts vía `--font-brand` |
| Sistemas internos del cliente | Nomenclatura genérica |

## Advertencias

**Los colores son aproximaciones** construidas desde la identidad pública de cada
institución. Verificar contra su manual de marca y ajustar desde `/admin`.

**Las tipografías son sustitutos.** Las familias corporativas son propietarias.

**Los logotipos no vienen incluidos.** Se cargan desde la administración.

**Revisar la propiedad intelectual antes de la primera demostración**, dado que
el código se construyó en el contexto de una propuesta comercial.

## Estado de los tipos

El proyecto arrastra avisos de TypeScript preexistentes que no impiden la
compilación ni la ejecución. Son los mismos del proyecto de origen.
