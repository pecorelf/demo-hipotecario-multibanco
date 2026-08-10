# Tus nuevas Llaves — Guía de demostración

Guía completa para presentar el demo end-to-end. Pensada para una audiencia
ejecutiva (Felipe, Yelitza, sponsors de Santander) en 18 a 22 minutos.

---

## 1 · Setup previo (5 minutos antes)

Asegúrate de tener todo listo **antes de empezar el demo**, no durante.

### Una sola vez

```bash
unzip hipotecia-poc.zip
cd hipotecia-poc
npm install
cp .env.example .env.local
```

Edita `.env.local` y agrega tu API key:

```
VITE_ANTHROPIC_API_KEY=sk-ant-tu-key-acá
```

### Antes de cada demo

```bash
npm run dev
```

Abre `http://localhost:5173` y verifica que la API responde — el atajo es ir a
`/test` y clickear "Run test". Si responde en menos de 5 segundos, todo bien.

Activa el **modo presentador** y el **cache fallback**:

1. Ir a `http://localhost:5173/demo`
2. En el panel de control de la derecha, activar el toggle **"Modo demo"**

Esto garantiza que si la API se demora más de 4 segundos en cualquier
respuesta crítica, se sirve una respuesta cacheada sin que se note.

### Checklist final (1 minuto antes)

- [ ] WiFi estable.
- [ ] Browser en pantalla completa (F11).
- [ ] Zoom del browser al 100% (no 90%, no 110%).
- [ ] Otras pestañas cerradas.
- [ ] DevTools cerrado.
- [ ] Sonido del computador silenciado (por si suena Slack a mitad de demo).
- [ ] Modo demo activado en `/demo` (toggle prendido).
- [ ] Has hecho click en "Resetear estado" para empezar limpio.

---

## 2 · Orden recomendado

Las 8 escenas en orden, con sus tiempos objetivo:

| # | Pantalla | Ruta | Rol | Tiempo |
|---|----------|------|-----|--------|
| 1 | Onboarding con Eugenia | `/cliente` | Cliente | 2,5 min |
| 2 | Documentos auto-validados | `/cliente/documentos` | Cliente | 2,5 min |
| 3 | Time travel auditable | `/cliente/credito` | Cliente | 3,0 min |
| 4 | Cockpit del ejecutivo + copiloto | `/ejecutivo` | Ejecutivo | 3,0 min |
| 5 | Back office cierra el loop | `/backoffice` | Back office | 2,5 min |
| 6 | Audio a caso | `/ejecutivo/audio` | Ejecutivo | 2,5 min |
| 7 | Portal Inmobiliaria | `/inmobiliaria` | Corredora | 2,0 min |
| 8 | Comparador honesto | `/comparador` | Cliente | 2,5 min |
| **Total** | | | | **20,5 min** |

**Cómo navegar:** abre `/demo` en una pestaña separada y úsalo como tu
"prompter". Cada escena tiene su guion y un botón "Ir" que cambia de rol
automáticamente y te lleva a la URL correcta.

---

## 3 · Talking points por escena

### Escena 1 — Onboarding con Eugenia (`/cliente`)

**Casos cubiertos:** 1, 9, 10.

**Qué decir (60 segundos):**

> Hoy un cliente abre la app del banco y se encuentra con un formulario de
> Hoy un cliente abre la app del banco y se encuentra con un formulario de
> 60 campos. La promesa de Tus nuevas Llaves es otra: el cliente conversa con
> Eugenia, una agente IA, en lenguaje natural. Eugenia ya sabe quién es
> —porque el banco tiene esos datos— y sólo pide lo que falta. La sensación
> es de tener una asesora real, no un formulario disfrazado.

**Qué clickear:**
1. Click en el chip **"Pareja casa"** o escribe: *"Estamos buscando comprar nuestra primera casa con mi pareja"*
2. Espera el streaming de Eugenia (~6 s, o cache instantáneo si la API tarda).
3. Muestra el caso pre-armado que aparece: journey, datos a rescatar, datos a preguntar.
4. Click **"Ver mi crédito en detalle"** para avanzar.

---

### Escena 2 — Documentos auto-validados (`/cliente/documentos`)

**Casos cubiertos:** 2, 3.

**Qué decir (60 segundos):**

> La parte más tediosa de un crédito hipotecario es juntar papeles. Acá
> Eugenia ya rescató lo que el banco tenía (cédula, AFP, SII) y está
> buscando lo que está pendiente. Pero el momento clave es cuando el
> cliente sube un documento nuevo: el sistema no sólo lo recibe, lo lee,
> lo valida y, cuando hay una inconsistencia, te avisa antes de que entres
> a un proceso largo.

**Qué clickear:**
1. Scrollea para mostrar las 3 secciones: rescatado / buscando / pendiente.
2. En la sección "Pendiente", arrastra cualquier archivo al primer slot (Certificado de matrimonio).
3. Espera la extracción en vivo (~5 s).
4. Cuando aparece la inconsistencia: click **"Discutir con Eugenia"**.
5. En el drawer lateral, Eugenia explica la inconsistencia en lenguaje humano.

---

### Escena 3 — Time travel auditable (`/cliente/credito`)

**Casos cubiertos:** 5, 13.

**Qué decir (80 segundos):**

> Acá está la vista de "mi crédito". Arriba lo que el cliente necesita ver
> hoy: en qué estamos, qué falta, cuándo. Pero abajo está la diferencia: el
> time travel. Cada decisión del proceso es auditable. Podemos volver a
> cualquier momento del caso y reproducir exactamente qué sabíamos, qué
> pasó, y qué se decidió —incluido el razonamiento de las decisiones
> automáticas, escrito para un auditor.

**Qué clickear:**
1. Scrollea hasta **"Historia del caso"**.
2. Usa flecha izquierda **(←)** en el teclado para retroceder lento, 3 o 4 eventos.
3. Observa cómo cambia el snapshot del lado izquierdo según el momento.
4. Avanza al evento **"Cruce con CMF y bureau interno"** (el #8).
5. Click **"Ver razonamiento ⌄"** — aparece la explicación regulatoria streameando.

---

### Escena 4 — Cockpit del ejecutivo (`/ejecutivo`)

**Casos cubiertos:** 4, 5, 8, 11.

**Qué decir (90 segundos):**

> Ahora cambiemos a la vista del ejecutivo de Santander. Yelitza Manrique
> abre su cockpit y ve su bandeja del día. El caso de Francisco tiene una
> alerta. A la derecha, su copiloto IA ya analizó el caso y le susurra al
> oído: hay una inconsistencia entre la liquidación y Previred. Le da la
> causa probable, le sugiere el próximo paso, le da contexto humano. Y si
> Yelitza decide que el caso necesita criterio del back office, lo deriva
> con una nota que el sistema redacta solo.

**Qué clickear:**
1. Francisco ya está seleccionado por defecto (border rojo en el inbox).
2. Muestra el **copiloto a la derecha**: ALERTA + PRÓXIMO PASO + CONTEXTO ÚTIL.
3. En el centro, scrollea hasta **"Atención"** en el tab Resumen.
4. Click **"Derivar a back office con esta nota"**.
5. Modal abre con la nota pre-redactada — muestra que es editable, luego click **"Derivar"**.
6. Observa el banner ámbar y el pill "Derivado" en el inbox.

---

### Escena 5 — Back office (`/backoffice`)

**Casos cubiertos:** 4, 7.

**Qué decir (75 segundos):**

> El caso que Yelitza derivó hace cinco minutos ya está acá. La jefa de
> operaciones del back office tiene la cola de derivaciones, los cuellos
> de botella por fase, las razones de rechazo del mes, la productividad de
> su equipo. Y arriba a la derecha, el copiloto del back office le da una
> observación accionable basada en patrones de los datos —no genéricos,
> específicos de hoy.

**Qué clickear:**
1. Muestra el **insight del copiloto** arriba a la derecha.
2. Scrollea a la **Card C** "Casos derivados que requieren mi atención".
3. Francisco está arriba con pill **"Nuevo"** y la nota que escribió Yelitza.
4. Click en su fila para abrir el drawer.
5. Muestra las 3 acciones: Devolver, Aprobar excepción, Escalar a comité.
6. Click **"Aprobar excepción"** → banner verde de acción registrada.

---

### Escena 6 — Audio a caso (`/ejecutivo/audio`)

**Casos cubiertos:** 15.

**Qué decir (60 segundos):**

> Acá quiero mostrarles algo distinto. Imagínense que Yelitza acaba de
> salir de una llamada con un prospecto que llegó por LinkedIn. La
> conversación duró 8 minutos. En lugar de transcribir manualmente, sube
> el audio. Lo que ven a continuación es el caso emergiendo de la
> conversación, en vivo, sin que Yelitza toque nada.

**Qué clickear:**
1. Click **"Usa la grabación de muestra →"** (atajo del demo).
2. Observa los 3 pasos avanzar y la transcripción reveladora (~5 s).
3. A la derecha, los campos del caso aparecen progresivamente: nombre, RUT, intención, monto, propiedad, documentos, próximos pasos, preocupaciones.
4. Cuando termina, click **"Crear caso con estos datos"**.
5. Te lleva al cockpit — Antonia Vergara aparece arriba con pill "Nuevo · audio".

---

### Escena 7 — Portal Inmobiliaria (`/inmobiliaria`)

**Casos cubiertos:** 6, 12.

**Qué decir (50 segundos):**

> Hasta ahora vimos al cliente, al ejecutivo, al back office. Pero el
> ecosistema hipotecario incluye a las corredoras inmobiliarias —que son
> nuestra puerta de entrada al cliente nuevo. Tus nuevas Llaves se abre a ellas
> como API. La corredora ingresa los datos del comprador interesado, en
> segundos tiene una pre-aprobación. Y para cerrar, Claude le redacta el
> email que la corredora envía al cliente.

**Qué clickear:**
1. Form ya está pre-llenado con datos de Antonia.
2. Click **"Solicitar pre-aprobación"**.
3. Loader editorial con 4 pasos (~6 s, o cache).
4. Muestra el resultado: pill grande verde, stats UF/tasa/cuota/vigencia, explicación.
5. Click **"Enviar oferta al cliente"**.
6. Modal con email pre-redactado streameando — muestra los botones "Copiar" y "Enviar".

---

### Escena 8 — Comparador honesto (`/comparador`)

**Casos cubiertos:** 14.

**Qué decir (90 segundos — éste es el cierre, dale tiempo):**

> Cierro con la pantalla más audaz del proyecto. La pregunta era: ¿qué
> pasaría si en lugar de defender automáticamente nuestra oferta, le
> diéramos al cliente una comparación honesta? Acá el motor de Claude
> analiza las ofertas y dice la verdad —aunque la nuestra no gane. Si gana
> la competencia, le decimos "antes de aceptarla, hablemos". Esa
> honestidad es lo que retiene a un cliente. Un cliente que se queda
> porque el banco fue honesto vale el doble que uno que se queda por
> inercia.

**Qué clickear:**
1. Arrastra cualquier archivo al slot **"Competidor 1"** (PDF, imagen, lo que sea).
2. Click **"Comparar ofertas"**.
3. Loader con 5 pasos (~10 s, o cache).
4. Muestra la tabla con los winners por categoría (border accent en celda ganadora).
5. Lee en voz alta la **conclusión del análisis**.
6. Mostrar la card final, que cambia según el resultado:
   - Si gana Santander → "Mejor opción para ti" con CTA de cierre.
   - Si gana el competidor → la card honesta con "antes de aceptarla, hablemos".

> **Nota:** el modo demo serve un cache donde Santander gana. Si quieres
> mostrar el escenario contrario (Santander pierde), apaga el modo demo en
> `/demo` antes de esta escena, así Claude responde sin sesgar — con
> temperature 0.8, ~40% de las veces gana un competidor.

---

## 4 · Si algo falla — fallbacks

### Caso A: la API tarda más de 4 segundos

**No pasa nada.** Con el modo demo activado, el sistema sirve la respuesta
cacheada automáticamente sin que se note. El timing es transparente.

### Caso B: la API tira un error 500 o se cae el WiFi

**No pasa nada.** El mismo cache cubre los errores. Si pierdes conexión a
mitad del streaming, el sistema te sirve la versión cacheada como respaldo.

Las 5 respuestas críticas están cacheadas:
- Eugenia onboarding (Escena 1)
- Auditor del cruce CMF (Escena 3)
- Copiloto de Francisco (Escena 4)
- Audio extraction de Antonia (Escena 6)
- Comparador honesto - Santander gana (Escena 8)

Las otras llamadas (insight del back office, email de inmobiliaria,
explicaciones del Auditor para otros eventos) **no tienen cache**. Si la API
falla en una de esas, vas a ver un error en la pantalla. En ese caso:

1. No te detengas en la pantalla rota.
2. Explica con palabras lo que debería pasar.
3. Pasa a la siguiente escena.
4. Resetea el estado al terminar.

### Caso C: el modal "Crear caso" no funciona en `/ejecutivo/audio`

Si después de hacer click "Crear caso con estos datos" no te lleva al
cockpit:

1. Click manual en el botón "Ejecutivo" del role switcher arriba a la derecha.
2. Antonia debería aparecer arriba en el inbox.

### Caso D: navegas a una pantalla y se ve rara

Click en **"Resetear estado"** en `/demo` (panel derecho) y volvé a la escena.
No recarga la página, pero limpia todo el state de Zustand.

### Caso E: el cliente Santander te pregunta algo técnico que no puedes responder

> "Esa es una decisión de arquitectura que estamos puliendo con vuestro
> equipo técnico. Lo que ves hoy es la experiencia del usuario final. La
> capa de integración con tus core systems la diseñamos sobre la base de
> lo que defina vuestro CIO."

---

## 5 · Cómo cerrar la demo (1 minuto)

Después de la Escena 8, en lugar de cerrar el browser, recapitula:

> Cubrimos los 15 casos de uso en 20 minutos. Lo que vieron no es un
> mockup — es una aplicación funcional con el motor de Claude integrado en
> 6 puntos del proceso. La capa visual está pulida para una demo, pero la
> arquitectura es la que llevaríamos a una primera ola de implementación.
>
> Lo siguiente sería un sprint de 4 semanas con vuestro equipo para definir
> qué integración hacemos primero. Mi sugerencia es empezar por el flujo
> de derivación cliente → ejecutivo → back office, porque cierra el loop
> de orquestación humano + IA y es donde más valor estimamos en los
> primeros 90 días.

---

## 6 · Tiempos detallados

| Escena | Decir | Clickear | Buffer | Total |
|--------|-------|----------|--------|-------|
| 1 — Onboarding | 60 s | 60 s | 30 s | **2,5 min** |
| 2 — Documentos | 60 s | 60 s | 30 s | **2,5 min** |
| 3 — Time travel | 80 s | 80 s | 20 s | **3,0 min** |
| 4 — Cockpit | 90 s | 70 s | 20 s | **3,0 min** |
| 5 — Back office | 75 s | 60 s | 15 s | **2,5 min** |
| 6 — Audio | 60 s | 70 s | 20 s | **2,5 min** |
| 7 — Inmobiliaria | 50 s | 50 s | 20 s | **2,0 min** |
| 8 — Comparador | 90 s | 60 s | 0 | **2,5 min** |
| Cierre | 60 s | — | — | **1,0 min** |
| | | | **TOTAL** | **~21 min** |

Con preguntas durante el demo, sumar 2-4 minutos. Total esperado: **23-25
minutos**.

---

## 7 · Después de la demo

1. Vuelve a `/demo`.
2. Click **"Resetear estado"** (limpia Antonia, Francisco derivado, etc.).
3. Si vas a tener otra demo en seguida, el modo demo queda activado para la siguiente.

Para preparar la siguiente demo desde cero: reset + arrancar desde `/cliente`.

---

## 8 · Recursos adicionales

- **README.md** del proyecto: estado del repo, módulos, decisiones técnicas.
- **DESIGN_SYSTEM.md**: tokens, tipografía, colores, componentes.
- **/test** en el browser: diagnóstico de la API en vivo.
- **/demo** en el browser: este guion como modo presentador interactivo.
