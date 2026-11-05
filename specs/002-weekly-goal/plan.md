# Plan 002 — Objetivo semanal de estudio

## 1. Alcance y restricciones

Implementa la especificación `specs/002-weekly-goal/spec.md` respetando `docs/constitution.md`: HTML, CSS y JavaScript puros; sin dependencias ni build; funciona con `file://`; lógica de cálculo separada de la interfaz; tests con el runner nativo de Node, sin instalar paquetes; datos de sesiones intactos; textos visibles en español y código en inglés.

El objetivo es un dato nuevo e independiente de las sesiones. No se crea, modifica ni reinterpreta ninguna sesión, y no se altera el cálculo del total semanal existente. El progreso es una vista derivada de `calculateWeekMinutes`.

Este documento describe el qué técnico y el cómo; no contiene código de implementación, solo pseudocódigo.

## 2. Archivos que se crean o modifican

| Archivo | Acción | Responsabilidad | RF |
|---|---|---|---|
| `index.html` | Modificar | Insertar la tarjeta «Objetivo semanal» entre la tarjeta superior y «Nueva sesión». Añadir un `id` a la etiqueta «min esta semana» de la tarjeta superior para poder sustituirla por «— min» en el estado de error. Sin lógica. | RF-1.1, RF-2.1, RF-2.10, RF-3.1, RF-3.3, RF-3.6, RF-5.2, RF-6.3, RF-7.1, RF-7.2, RF-7.4 |
| `styles.css` | Modificar | Estilos de la tarjeta, línea de objetivo, progreso, estado, invitación, campo, errores y botones. Adaptación a 375 px, zoom, foco visible y alto contraste. | RF-4.4, RF-7.5, RF-7.6, RF-8.1 a RF-8.4; RNF-6, RNF-7 |
| `app.js` | Modificar | Claves de almacenamiento del objetivo, funciones puras de validación, formato y estado, lectura/escritura con respaldo, renderizado y conexión con carga, guardado de sesión y visibilidad. | RF-1, RF-2, RF-3, RF-4, RF-5, RF-6, RF-7, RF-8; RNF-3, RNF-4, RNF-5, RNF-8, RNF-9, RNF-10 |
| `tests/logic.test.js` | Modificar | Ampliar el cargador con el objetivo, el almacenamiento corrupto y el fallo de escritura; añadir pruebas de validación, formato, estado, lectura/escritura y respaldo. | RF-1.2, RF-1.4, RF-2.11, RF-3, RF-4, RF-6; RNF-5 |
| `MEMORY.md` | Modificar al terminar | Registrar el estado, las decisiones y los tests del objetivo semanal. No forma parte de la funcionalidad. | — |
| `docs/constitution.md` | Solo lectura | Principios que condicionan el plan. | — |
| `specs/002-weekly-goal/spec.md` | Solo lectura | Requisitos y criterios de aceptación aprobados. | — |

No se crean archivos nuevos de aplicación. La lógica sigue en `app.js` para no romper el doble clic ni introducir módulos.

## 3. Datos del objetivo

### 3.1 Claves de `localStorage`

| Clave | Contenido | Uso |
|---|---|---|
| `diario-estudio-objetivo` | `{"minutes":600}` | Objetivo vigente único. |
| `diario-estudio-objetivo-respaldo` | Copia íntegra del valor original | Respaldo antes de reemplazar un objetivo ilegible. Si ya existe, se usa `diario-estudio-objetivo-respaldo-<marca de tiempo>`. |
| `diario-estudio-sesiones` | Sin cambios | Sesiones existentes. |
| `diario-estudio-sesiones-respaldo` | Sin cambios | Respaldo de sesiones ya existente. |

No hay migración: al no existir la clave del objetivo se considera «sin objetivo». Nunca se deduce un objetivo a partir de las sesiones ni se escribe dentro de la clave de sesiones.

### 3.2 Formato guardado

Se guarda un objeto JSON con un único campo numérico:

```json
{ "minutes": 600 }
```

Justificación:

- Es explícito y coherente con el resto de datos del proyecto, que ya usan JSON.
- Permite validar por campo (`minutes`) y distinguir un valor válido de una forma desconocida.
- Deja espacio a metadatos futuros sin migración, aunque esa ampliación esté fuera de alcance.
- Un entero desnudo (`600`) sería más corto, pero menos autoexplicativo y más fácil de confundir con otra forma; un objeto con campo nombrado tolera mejor la evolución y los mensajes de error.

El valor solo es válido si `minutes` es un entero entre 1 y 10.080. Cualquier otra forma se trata como ilegible.

### 3.3 Lectura y estados

`readGoal()` devuelve `{ goal, unreadable, raw }`:

| Situación | `goal` | `unreadable` | `raw` |
|---|---|---|---|
| No existe la clave | `null` | `false` | `null` |
| `{"minutes":600}` válido | `600` | `false` | `null` |
| JSON inválido, array, `null`, número desnudo o `minutes` inválido | `null` | `true` | Texto original |
| `localStorage` no disponible al leer | `null` | `true` | `null` |

Un objetivo ilegible se trata como «sin objetivo» (RF-6.4), pero se conserva `raw` en memoria para poder respaldarlo antes de la siguiente escritura (RF-6.5). El objetivo ilegible no genera un mensaje de error propio: la tarjeta muestra la invitación y permite fijarlo de nuevo.

## 4. Funciones nuevas

Todas viven en `app.js` y tienen nombre en inglés. Las que dependen de la fecha reciben `today` como parámetro; las de validación, formato y almacenamiento no inventan un parámetro de fecha porque no dependen del reloj.

| Función | Entrada | Salida | RF |
|---|---|---|---|
| `isValidGoalMinutes(value)` | Valor cualquiera | `true` solo si es un entero entre 1 y 10.080. | RF-1.2, RF-1.4 |
| `parseGoalMinutes(text)` | Texto del campo | Entero válido o `null`; rechaza vacío, texto, signos, decimales y notación científica. | RF-1.2, RF-1.4 |
| `formatMinutesValue(minutes)` | Número de minutos | Texto `"N min"` con coma decimal si hace falta. | RF-1.3, RF-2.11 |
| `formatWeeklyProgress(minutes)` | Número de minutos | Texto exacto `"Minutos esta semana: N min"`. | RF-2.1, RF-2.4, RF-2.11 |
| `formatGoalStatus(reached)` | Booleano o `null` | `"Objetivo alcanzado"`, `"Objetivo no alcanzado"` o `""` si no hay objetivo. | RF-4.1, RF-4.2, RF-5.1 |
| `buildWeeklyGoalStatus(sessions, goalMinutes, today)` | Sesiones, objetivo y fecha local | `{ hasGoal, goal, progress, reached }`; reutiliza `calculateWeekMinutes`. | RF-2.1, RF-2.2, RF-2.3, RF-2.4, RF-2.5, RF-2.9, RF-4.2, RF-4.3, RF-4.6 |
| `readGoal()` | — | `{ goal, unreadable, raw }` leyendo la clave del objetivo. | RF-6.1, RF-6.4, RF-6.5 |
| `saveGoal(minutes, rawUnreadable = null)` | Minutos válidos y texto ilegible opcional | `true` si guarda; respalda antes de reemplazar un valor ilegible; `false` si falla. | RF-1.2, RF-6.1, RF-6.5, RF-6.6 |
| `clearGoal()` | — | `true` si elimina la clave; `false` si falla. | RF-3.4, RF-6.1 |

Notas de diseño:

- `isValidGoalMinutes` no reutiliza `isValidMinutes`: esta última acepta decimales y no tiene máximo, mientras que el objetivo exige entero y rango 1–10.080.
- `parseGoalMinutes` valida el texto antes de convertirlo con `Number`, para que `"1e3"`, `"+5"`, `" "` o `""` no se cuelen como números.
- `buildWeeklyGoalStatus` no duplica el cálculo semanal: llama a `calculateWeekMinutes(sessions, today)`.
- `readGoal`, `saveGoal` y `clearGoal` son operaciones de almacenamiento, no cálculos; la lógica de progreso y estado permanece pura.
- El objetivo no se guarda por semana: es único y se aplica a cualquier semana (RF-1.7).

## 5. Algoritmos en pseudocódigo

### 5.1 Validación y normalización

```text
FUNCIÓN isValidGoalMinutes(valor)
  DEVOLVER Number.isInteger(valor)
           Y valor >= 1
           Y valor <= 10080
FIN

FUNCIÓN parseGoalMinutes(texto)
  SI typeof texto ≠ "string" ENTONCES DEVOLVER null
  limpio ← texto.trim()
  SI limpio NO cumple /^\d+$/ ENTONCES DEVOLVER null
  valor ← Number(limpio)
  SI NO isValidGoalMinutes(valor) ENTONCES DEVOLVER null
  DEVOLVER valor
FIN
```

Consecuencias: `1` y `10080` son válidos; `0`, `-1`, `10081`, `12.5`, `"600"`, `NaN` e `Infinity` no lo son. En texto, `" 600 "` se acepta; `""`, `"abc"`, `"1e3"`, `"+5"`, `"12,5"` y `"12.5"` se rechazan.

### 5.2 Progreso y estado

```text
FUNCIÓN buildWeeklyGoalStatus(sessions, goalMinutes, today)
  progreso ← calculateWeekMinutes(sessions, today)

  SI NO isValidGoalMinutes(goalMinutes) ENTONCES
    DEVOLVER { hasGoal: false, goal: null, progress: progreso, reached: null }
  FIN SI

  alcanzado ← progreso >= goalMinutes
  DEVOLVER { hasGoal: true, goal: goalMinutes, progress: progreso, reached: alcanzado }
FIN
```

- `progress` incluye de lunes a hoy, suma varias sesiones del mismo día, excluye futuros y sesiones de semanas anteriores porque `calculateWeekMinutes` ya aplica esas reglas.
- No se redondea al comparar: 99,5 minutos no alcanzan un objetivo de 100 y 100,0 sí lo alcanzan.
- Si el objetivo es menor que el progreso, `reached` es `true` y `progress` conserva el valor real, sin recortarlo.

### 5.3 Lectura, escritura y respaldo

```text
FUNCIÓN readGoal()
  INTENTAR
    raw ← localStorage.getItem(CLAVE_OBJETIVO)
  CAPTURAR
    DEVOLVER { goal: null, unreadable: true, raw: null }

  SI raw = null ENTONCES
    DEVOLVER { goal: null, unreadable: false, raw: null }
  FIN SI

  INTENTAR
    parsed ← JSON.parse(raw)
    SI parsed es objeto no array Y isValidGoalMinutes(parsed.minutes) ENTONCES
      DEVOLVER { goal: parsed.minutes, unreadable: false, raw: null }
    FIN SI
  CAPTURAR
    // JSON inválido: se trata abajo como ilegible.
  FIN INTENTAR

  DEVOLVER { goal: null, unreadable: true, raw: raw }
FIN

FUNCIÓN saveGoal(minutes, rawUnreadable = null)
  SI NO isValidGoalMinutes(minutes) ENTONCES DEVOLVER false

  INTENTAR
    SI rawUnreadable NO es null NI undefined ENTONCES
      existente ← localStorage.getItem(CLAVE_RESPALDO_OBJETIVO)
      claveRespaldo ← existente = null
        ? CLAVE_RESPALDO_OBJETIVO
        : CLAVE_RESPALDO_OBJETIVO + "-" + Date.now()
      localStorage.setItem(claveRespaldo, rawUnreadable)
    FIN SI

    localStorage.setItem(CLAVE_OBJETIVO, JSON.stringify({ minutes: minutes }))
    DEVOLVER true
  CAPTURAR
    DEVOLVER false
FIN

FUNCIÓN clearGoal()
  INTENTAR
    localStorage.removeItem(CLAVE_OBJETIVO)
    DEVOLVER true
  CAPTURAR
    DEVOLVER false
FIN
```

El respaldo se escribe **antes** de sobrescribir. Si falla la escritura del respaldo, no se escribe el objetivo nuevo y se devuelve `false`. Si falla solo la escritura final, el objetivo anterior sigue en su clave y el respaldo queda como copia extra.

### 5.4 Flujo fijar, cambiar y quitar

```text
AL CARGAR LA PÁGINA
  sesionesCargadas ← readSessions()
  objetivoCargado ← readGoal()

  sessions ← sesionesCargadas.sessions
  sessionsUnreadable ← sesionesCargadas.unreadable
  unreadableRaw ← sesionesCargadas.raw
  goal ← objetivoCargado.goal          // null si es ilegible
  goalRaw ← objetivoCargado.raw
  campo.value ← goal ≠ null ? String(goal) : ""

  renderWeekMinutes(sessions, sessionsUnreadable)
  renderWeeklyGoal(sessions, goal, sessionsUnreadable)
  // resto de renderizados existentes sin cambios
FIN

AL ENVIAR EL FORMULARIO DEL OBJETIVO
  minutos ← parseGoalMinutes(campo.value)

  SI minutos = null ENTONCES
    errorObjetivo ← "El objetivo debe ser un número entero de minutos entre 1 y 10.080"
    // no se guarda; el objetivo anterior y el progreso no cambian
    TERMINAR
  FIN SI

  guardado ← saveGoal(minutos, goalRaw)

  SI NO guardado ENTONCES
    errorObjetivo ← "No se pudo guardar el objetivo. Inténtalo de nuevo."
    // se conserva el objetivo anterior
    TERMINAR
  FIN SI

  goal ← minutos
  goalRaw ← null
  errorObjetivo ← ""
  campo.value ← String(minutos)
  renderWeeklyGoal(sessions, goal, sessionsUnreadable)
  // sin mensaje de confirmación (RF-1.8)
FIN

AL PULSAR "QUITAR OBJETIVO"
  eliminado ← clearGoal()

  SI NO eliminado ENTONCES
    errorObjetivo ← "No se pudo quitar el objetivo. Inténtalo de nuevo."
    TERMINAR
  FIN SI

  goal ← null
  goalRaw ← null
  errorObjetivo ← ""
  campo.value ← ""
  renderWeeklyGoal(sessions, goal, sessionsUnreadable)
  // las sesiones no se tocan
FIN

AL GUARDAR UNA SESIÓN CORRECTAMENTE
  renderWeekMinutes(sessions, false)
  renderWeeklyGoal(sessions, goal, false)
FIN

AL VOLVER A MOSTRAR LA PÁGINA
  sesionesCargadas ← readSessions()
  objetivoCargado ← readGoal()

  sessions ← sesionesCargadas.sessions
  sessionsUnreadable ← sesionesCargadas.unreadable
  unreadableRaw ← sesionesCargadas.raw
  goal ← objetivoCargado.goal
  goalRaw ← objetivoCargado.raw

  SI el campo de minutos NO tiene el foco ENTONCES
    campo.value ← goal ≠ null ? String(goal) : ""
  FIN SI
  renderWeekMinutes(sessions, sessionsUnreadable)
  renderWeeklyGoal(sessions, goal, sessionsUnreadable)
FIN
```

Detalles del flujo:

- Si el objetivo guardado era ilegible y la persona fija uno nuevo, `goalRaw` se pasa a `saveGoal` una sola vez; tras el éxito se limpia.
- Si el guardado falla, `goalRaw` se conserva para que el siguiente intento pueda respaldar el original.
- Al quitar, no se borra el respaldo: los respaldos son copias de seguridad y no se usan para calcular nada.
- El campo no se rellena en cada renderizado: así una sesión guardada no borra lo que la persona estaba escribiendo ni el mensaje de error. Se rellena al cargar, tras guardar el objetivo, tras quitarlo y al volver a mostrar la página si el campo no tiene el foco.

### 5.5 Renderizado y estado de error de sesiones

```text
FUNCIÓN renderWeekMinutes(sessions, sessionsUnreadable)
  SI sessionsUnreadable ENTONCES
    numeroSemana ← "— min"
    textoSemana ← ""
  SINO
    numeroSemana ← calculateWeekMinutes(sessions)
    textoSemana ← "min esta semana"
  FIN SI
FIN

FUNCIÓN renderWeeklyGoal(sessions, goal, sessionsUnreadable)
  estado ← buildWeeklyGoalStatus(sessions, goal, todayLocal())

  // Línea del objetivo
  SI estado.hasGoal ENTONCES
    mostrar lineaObjetivo con formatMinutesValue(estado.goal)
  SINO
    ocultar lineaObjetivo
  FIN SI

  // Progreso
  SI sessionsUnreadable ENTONCES
    progresoObjetivo ← "Minutos esta semana: — min"
  SINO
    progresoObjetivo ← formatWeeklyProgress(estado.progress)
  FIN SI

  // Estado de cumplimiento
  SI sessionsUnreadable O NO estado.hasGoal ENTONCES
    estadoObjetivo ← ""          // no se puede comparar o no hay meta
  SINO
    estadoObjetivo ← formatGoalStatus(estado.reached)
  FIN SI

  // Invitación
  SI estado.hasGoal ENTONCES ocultar invitacionObjetivo
  SINO mostrar invitacionObjetivo

  // Error de progreso
  SI sessionsUnreadable ENTONCES
    errorProgresoObjetivo ← "No se puede calcular el progreso."
  SINO
    errorProgresoObjetivo ← ""
  FIN SI

  // Botones
  SI estado.hasGoal ENTONCES
    botonObjetivo ← "Cambiar objetivo"
    mostrar botonQuitarObjetivo
  SINO
    botonObjetivo ← "Fijar objetivo"
    ocultar botonQuitarObjetivo
  FIN SI
FIN
```

`renderWeeklyGoal` no limpia el error del formulario: ese error solo se limpia al guardar con éxito o al quitar el objetivo. Así el error de validación no se pierde si una sesión guardada repinta la tarjeta.

## 6. Interfaz

### 6.1 Estructura y posición

La tarjeta se inserta inmediatamente después de la tarjeta superior `section.tarjeta.racha` y antes de la sección «Nueva sesión»:

```text
┌─────────────────────────────────────────────┐
│ [racha actual] [mejor racha]                │
│ [N min esta semana] [N días este mes]       │
└─────────────────────────────────────────────┘
┌─────────────────────────────────────────────┐
│ Objetivo semanal                            │
│ Objetivo: 600 min                           │
│ Minutos esta semana: 120 min                │
│ Objetivo no alcanzado                       │
│                                             │
│ Objetivo semanal en minutos                 │
│ [ 600                                    ]  │
│ [mensaje de error, si aplica]               │
│ [Cambiar objetivo] [Quitar objetivo]        │
└─────────────────────────────────────────────┘
┌─────────────────────────────────────────────┐
│ Nueva sesión                                │
│ ...                                         │
└─────────────────────────────────────────────┘
```

Sin objetivo, la misma tarjeta muestra el total semanal, la invitación y el botón «Fijar objetivo». Con sesiones ilegibles, muestra el objetivo si existe, «Minutos esta semana: — min» y el mensaje de error de progreso.

Estructura propuesta:

- `<section class="tarjeta objetivo-semanal" aria-labelledby="tituloObjetivo">`
- `<h2 id="tituloObjetivo">Objetivo semanal</h2>`
- Línea del objetivo: `#lineaObjetivo` con `#valorObjetivo`.
- Progreso: `#progresoObjetivo`.
- Estado: `#estadoObjetivo`, región `aria-live="polite"`, siempre presente en el DOM.
- Invitación: `#invitacionObjetivo`.
- Error de progreso: `#errorProgresoObjetivo`, región `aria-live="polite"`, siempre presente.
- Formulario: `#formularioObjetivo` con `#minutosObjetivo` y su `<label for="minutosObjetivo">`.
- Error del formulario: `#errorObjetivo`, región `aria-live="polite"`, siempre presente.
- Botones: `#botonObjetivo` (enviar) y `#botonQuitarObjetivo` (tipo `button`).

Las regiones `aria-live` existen desde la carga, no se crean al mostrar el mensaje, para que las tecnologías de asistencia las anuncien de forma fiable.

### 6.2 Textos exactos

| Elemento | Texto |
|---|---|
| Título | `Objetivo semanal` |
| Objetivo | `Objetivo: 600 min` (el valor usa `formatMinutesValue`) |
| Progreso | `Minutos esta semana: 120 min` |
| Estado alcanzado | `Objetivo alcanzado` |
| Estado no alcanzado | `Objetivo no alcanzado` |
| Invitación sin objetivo | `Todavía no has fijado un objetivo semanal.` |
| Botón sin objetivo | `Fijar objetivo` |
| Botón con objetivo | `Cambiar objetivo` |
| Botón de quitar | `Quitar objetivo` |
| Etiqueta del campo | `Objetivo semanal en minutos` |
| Error de validación | `El objetivo debe ser un número entero de minutos entre 1 y 10.080` |
| Error de progreso | `No se puede calcular el progreso.` |
| Progreso desconocido | `Minutos esta semana: — min` |
| Error al guardar | `No se pudo guardar el objetivo. Inténtalo de nuevo.` |
| Error al quitar | `No se pudo quitar el objetivo. Inténtalo de nuevo.` |

No hay mensaje de confirmación al guardar (RF-1.8) ni resaltado, sonido o animación al alcanzar el objetivo (RF-4.7).

### 6.3 Estados visuales

- **Sin objetivo, sesiones legibles:** línea de objetivo oculta, progreso `Minutos esta semana: 0 min` o el total real, estado vacío, invitación visible, campo vacío, botón «Fijar objetivo» y botón de quitar oculto.
- **Objetivo no alcanzado:** línea de objetivo visible, progreso real, estado «Objetivo no alcanzado», invitación oculta, campo con el objetivo vigente, botón «Cambiar objetivo» y botón de quitar visible.
- **Objetivo alcanzado:** igual que el anterior, con «Objetivo alcanzado» y el progreso real sin recortar. El estado se distingue por texto, no por color.
- **Objetivo ilegible:** se comporta como «sin objetivo»; la invitación y el botón «Fijar objetivo» aparecen, sin mensaje de error adicional. Las sesiones no se tocan.
- **Sesiones ilegibles:** línea de objetivo si existe, progreso «Minutos esta semana: — min», error «No se puede calcular el progreso.», estado de cumplimiento vacío, invitación si no hay objetivo, y la tarjeta superior muestra «— min».
- **Error de validación o guardado:** mensaje en `#errorObjetivo`; se conserva el objetivo anterior y el progreso. El campo mantiene lo que la persona escribió.

### 6.4 Accesibilidad

- La sección se asocia al título con `aria-labelledby`.
- El campo tiene `<label for="minutosObjetivo">` y `aria-describedby="errorObjetivo"`.
- `#errorObjetivo`, `#errorProgresoObjetivo` y `#estadoObjetivo` usan `aria-live="polite"` y `aria-atomic="true"`; no se usa `role="alert"` para evitar doble anuncio.
- Los botones son `type="submit"` y `type="button"` según corresponda; se puede fijar, cambiar y quitar solo con teclado y con Enter en el campo.
- El orden de tabulación es campo → guardar → quitar; el foco visible lo aportan los estilos globales de `input:focus` y `button:focus-visible`.
- El estado y el progreso se expresan con texto y números; el color no es el único indicador.
- Los textos son comprensibles en español y no dependen de iconos.

### 6.5 Responsive

- La tarjeta usa el ancho disponible y no fija anchos en píxeles.
- El campo ocupa el 100 % del ancho; los botones se apilan en columna en móvil y pueden ir en fila a partir de 480 px, con `flex: 1` y `min-width: 0`.
- Los textos largos (error y etiquetas) envuelven sin desbordar.
- A 375 px no hay desplazamiento horizontal; a 200 % de zoom se mantienen la legibilidad y el orden, sin solapamientos.
- Los controles mantienen un área táctil cómoda y el resto de secciones no cambia de orden ni de aspecto.

### 6.6 Cómo se cumple RF-6.3 sin cambiar el cálculo

`readSessions()` ya distingue datos ilegibles con `unreadable`. Ese estado se pasa a los dos puntos de presentación:

1. `renderWeekMinutes(sessions, true)` escribe «— min» en `#minutosSemana` y vacía `#minutosSemanaTexto` (el sufijo «min esta semana»); no llama a `calculateWeekMinutes` en esa rama. Al volver a datos legibles, restaura el número y el sufijo.
2. `renderWeeklyGoal(sessions, goal, true)` escribe «Minutos esta semana: — min», «No se puede calcular el progreso.» y deja vacío el estado de cumplimiento. La línea del objetivo se mantiene si existe.

`calculateWeekMinutes` no se modifica: el estado de error solo cambia lo que se muestra. Tras un guardado correcto de una sesión, `sessionsUnreadable` pasa a `false` y ambas tarjetas vuelven a mostrar cifras normales.

## 7. Decisiones técnicas justificadas y alternativas descartadas

1. **Clave independiente `diario-estudio-objetivo`.** Separa el objetivo de las sesiones, evita cualquier riesgo de pérdida o reinterpretación y no exige migración. Alternativa descartada: guardar el objetivo dentro del array o de un objeto de sesiones, que obligaría a migrar y mezclaría dos datos con ciclos de vida distintos. Cubre RF-6.1, RF-6.2; RNF-3.
2. **Formato `{ "minutes": 600 }`.** Es explícito, validable por campo y coherente con el JSON ya usado. Alternativa descartada: un entero desnudo, más corto pero menos autoexplicativo y sin sitio para evolución. Cubre RF-6.1, RF-6.4.
3. **No reutilizar `isValidMinutes` para el objetivo.** El objetivo exige entero y máximo; `isValidMinutes` acepta decimales y no tiene tope. Alternativa descartada: reutilizarla y añadir comprobaciones sueltas en la interfaz, que repartiría la regla y permitiría inconsistencias. Cubre RF-1.2, RF-1.4.
4. **Validar el texto con `/^\d+$/` antes de `Number`.** Evita que `""`, `" "`, `"1e3"`, `"+5"` o `"12.5"` se conviertan en números aceptados. Alternativa descartada: convertir con `Number` y comprobar solo el resultado, que acepta formas no previstas. Cubre RF-1.4.
5. **Reutilizar `calculateWeekMinutes` dentro de `buildWeeklyGoalStatus`.** Una sola definición del total semanal garantiza que la tarjeta superior y el objetivo nunca discrepen. Alternativa descartada: repetir el filtro y la suma en otra función, con riesgo de que una regla cambie en un sitio y no en el otro. Cubre RF-2.5, RF-2.9; RNF-8.
6. **`readGoal` devuelve `{ goal, unreadable, raw }`, como `readSessions`.** Permite tratar un objetivo ilegible como «sin objetivo» sin perder el original y respaldarlo antes de reemplazarlo. Alternativa descartada: leer y convertir directamente, que perdería el valor corrupto y no podría cumplir RF-6.5. Cubre RF-6.4, RF-6.5.
7. **Respaldar solo al reemplazar un valor ilegible.** Un cambio normal de objetivo no necesita copia y no se acumulan respaldos innecesarios. Alternativa descartada: respaldar en cada cambio, que llenaría el almacenamiento sin aportar valor. Cubre RF-6.5.
8. **Dos canales de error separados: formulario y progreso.** Tienen causas y tiempos de vida distintos; el de sesiones se recalcula en cada render y el del formulario se limpia al guardar. Alternativa descartada: un único párrafo de error, que mezclaría «No se puede calcular el progreso» con «El objetivo debe ser…» y se borraría en momentos equivocados. Cubre RF-6.3, RF-6.6, RF-7.3.
9. **El render no reescribe el campo de minutos.** Así una actualización por guardar una sesión no borra lo que la persona está escribiendo ni el error de validación. Alternativa descartada: sincronizar el campo en cada render, que produciría pérdidas de texto inesperadas. Cubre RF-7.2.
10. **Estado de cumplimiento solo con texto, sin clase de color ni animación.** Cumple RF-4.4 y RF-4.7 y evita depender del color. Alternativa descartada: resaltar con color, sonido o animación, expresamente fuera de alcance.
11. **Formato con `String(...).replace(".", ",")`, sin `Intl`.** Es determinista, no agrupa miles y coincide con el formato ya usado en el mapa de calor; el objetivo máximo se muestra «10080 min». Alternativa descartada: `toLocaleString("es-ES")`, que añade separadores de miles y puede variar entre navegadores. Cubre RF-2.11.
12. **«— min» exacto en la tarjeta superior.** `#minutosSemana` recibe «— min» y se oculta el sufijo «min esta semana» solo en el estado de error; al volver a la normalidad se restaura. Alternativa descartada: mostrar solo «—» junto al sufijo, que se lee «— min esta semana» pero no muestra exactamente «— min». Cubre RF-6.3.
13. **Releer el objetivo al volver a mostrar la página.** Mantiene la coherencia con RNF-10 y con los cambios hechos en otra pestaña, sin sincronización en vivo. Alternativa descartada: releer solo las sesiones y dejar el objetivo obsoleto. Cubre RF-2.7; RNF-10.
14. **Sin temporizador de medianoche.** La fecha se toma en cada recálculo (carga, guardado, visibilidad), como en el resto del diario. Alternativa descartada: un `setInterval` permanente, más complejo y sin beneficio. Cubre RF-2.9; RNF-10.
15. **Ampliar `tests/logic.test.js` y su cargador.** Reutiliza el DOM y el almacenamiento simulados, no añade dependencias y mantiene el comando único `node --test`. Alternativa descartada: instalar un framework, prohibido por la constitución. Cubre RNF-7.

## 8. Estrategia de tests con `node --test`

Se amplía `tests/logic.test.js`, que ya carga `app.js` en un contexto `vm` con DOM y `localStorage` simulados. No se instala nada.

### 8.1 Cambios en el cargador

- Añadir al array `EXPORTS` las funciones nuevas: `isValidGoalMinutes`, `parseGoalMinutes`, `formatMinutesValue`, `formatWeeklyProgress`, `formatGoalStatus`, `buildWeeklyGoalStatus`, `readGoal`, `saveGoal`, `clearGoal`.
- Ampliar `loadApp` con opciones para sembrar el objetivo (`goal`, `rawGoal`), para inyectar un valor corrupto y para simular fallos de escritura o de borrado.
- Ampliar `makeStorage` con `keys()` para inspeccionar respaldos con marca de tiempo y con un modo que lance al escribir o al borrar.
- Mantener las pruebas existentes de fechas, rachas, semana, mes, migración y mapa de calor.
- Evitar `classList.toggle` en el render nuevo, porque el DOM simulado solo implementa `add`, `remove` y `contains`; si se necesita, ampliar el mock.

### 8.2 Casos de prueba

| Grupo | Casos | RF |
|---|---|---|
| Validación | `1` y `10080` válidos; `0`, `-1`, `10081`, `12.5`, `"600"`, `NaN`, `Infinity`, `null` y `undefined` inválidos. | RF-1.2, RF-1.4 |
| Análisis del texto | `"1"`, `"10080"`, `" 600 "` y `"030"` válidos; `"10081"`, `"0"`, `"-5"`, `"12.5"`, `"12,5"`, `"abc"`, `""`, `"1e3"` y `"+5"` inválidos. | RF-1.2, RF-1.4 |
| Formato | `600` → `"600 min"`; `1` → `"1 min"`; `99.5` → `"99,5 min"`; `100` → `"100 min"`; `0` → `"0 min"`; progreso `0` → `"Minutos esta semana: 0 min"`; progreso `99.5` → `"Minutos esta semana: 99,5 min"`. | RF-1.3, RF-2.1, RF-2.4, RF-2.11 |
| Estado | `formatGoalStatus(true)`, `false` y `null`; objetivo `null`, `undefined`, `0` y `10081` → sin objetivo; progreso igual, menor y mayor que el objetivo; objetivo 1 y 10080. | RF-4.1, RF-4.2, RF-4.3, RF-4.6, RF-5.1 |
| Progreso | Varias sesiones el mismo día; sesión futura; sesión del domingo anterior; sesión del lunes; hoy lunes y hoy domingo; sin sesiones; decimales 99,5 frente a 100 y 100,0 frente a 100; el progreso coincide con `calculateWeekMinutes`. | RF-2.2, RF-2.3, RF-2.5, RF-2.9, RF-4.3 |
| Lectura | Sin clave; `{"minutes":600}`; JSON inválido; array; `null`; número desnudo; `minutes` 0, decimal, 10081 o texto; `raw` conservado; las sesiones no cambian. | RF-6.1, RF-6.4 |
| Escritura y respaldo | `saveGoal(600)` escribe `{"minutes":600}`; un valor inválido devuelve `false` y no escribe; un valor ilegible se respalda antes de sobrescribir con la copia exacta; si ya hay respaldo se usa una clave con marca de tiempo; un fallo de escritura devuelve `false` y conserva el objetivo anterior; `clearGoal` elimina solo la clave del objetivo; un fallo de borrado devuelve `false` y conserva la clave. | RF-6.1, RF-6.5, RF-6.6 |
| Independencia | Con sesiones corruptas, `readGoal` sigue leyendo un objetivo válido; `saveGoal` y `clearGoal` no tocan la clave de sesiones; un objetivo corrupto no cambia las sesiones. | RF-6.2, RF-6.4 |
| Regresión | Las 24 pruebas actuales siguen pasando; el arranque con objetivo, sin objetivo y con objetivo corrupto no lanza. | RNF-7 |

Comando único: `node --test`. Todos los tests deben quedar en verde antes de tocar la interfaz.

### 8.3 Verificación de interfaz con el MCP de Chrome DevTools

Además de los tests de lógica, y según `AGENTS.md`:

- Abrir `index.html` en el Chromium de 9222 con el perfil temporal.
- Sembrar sesiones de la semana actual (varias el mismo día), una de la semana anterior y una futura.
- Comprobar la posición de la tarjeta: después de la tarjeta superior y antes de «Nueva sesión».
- Sin objetivo: progreso, invitación, botón «Fijar objetivo» y estado de cumplimiento ausente.
- Fijar 600: objetivo «600 min», progreso correcto, «Objetivo no alcanzado», botón «Cambiar objetivo» y «Quitar objetivo» visible.
- Cambiar a un valor menor que el progreso: «Objetivo alcanzado» inmediato y progreso real sin recortar.
- Cambiar a un valor mayor: «Objetivo no alcanzado».
- Probar 1 y 10080 como válidos; 0, -1, 10081, 12.5, texto y campo vacío como inválidos, con el mensaje exacto y el objetivo anterior conservado.
- Quitar el objetivo: la tarjeta sigue visible con el total, la invitación y «Fijar objetivo»; las sesiones no cambian.
- Recargar: el objetivo persiste; comprobar que no aparece mensaje de confirmación al guardar.
- Guardar una sesión (temporizador de 1 min o llamada controlada a `saveSession` desde la consola): el progreso y el estado se actualizan sin recargar; cancelar sin guardar no los cambia.
- Corromper `diario-estudio-sesiones` con JSON inválido y recargar: «No se puede calcular el progreso.», «Minutos esta semana: — min» en la tarjeta del objetivo y «— min» en la superior.
- Corromper `diario-estudio-objetivo` y recargar: se trata como sin objetivo, las sesiones siguen intactas y al fijar uno nuevo se crea el respaldo.
- Revisar la consola sin errores.
- Emular 375 px y comprobar que no hay desplazamiento horizontal; revisar 200 % de zoom y hacer captura.
- Revisar el árbol de accesibilidad: etiqueta del campo, texto del objetivo, progreso, estado y regiones `aria-live`.
- Recorrer con Tab el campo, «Cambiar objetivo» y «Quitar objetivo», con foco visible y orden lógico.

## 9. Orden de implementación y riesgos

1. Tests y funciones de validación, formato y estado.
2. Lectura/escritura con respaldo.
3. Estructura HTML y estilos.
4. Renderizado de la tarjeta y estado de error.
5. Cableado de carga, guardado, cambio, quitado y visibilidad.
6. Verificación con el MCP y captura a 375 px.
7. Actualización de `MEMORY.md`.

Riesgos principales:

- Compartir la clave de sesiones o migrar datos sin necesidad.
- Tratar un objetivo ilegible como 0 y mostrar «Objetivo no alcanzado» en vez de «sin objetivo».
- Respaldar después de sobrescribir o perder el valor original si falla la escritura.
- Que la tarjeta superior muestre «0 min» cuando las sesiones son ilegibles.
- Duplicar el cálculo semanal en lugar de reutilizar `calculateWeekMinutes`.
- Redondear el progreso antes de compararlo con el objetivo.
- Aceptar `"1e3"`, `"+5"` o `""` por convertir con `Number` sin validar el texto.
- Mostrar el estado de cumplimiento cuando no hay objetivo o no se puede calcular el progreso.
- Borrar el texto que la persona está escribiendo al repintar la tarjeta tras guardar una sesión.
- Que los botones o el mensaje de error desborden a 375 px.

## 10. Trazabilidad RF → plan

| RF | Dónde se cubre | Tests / verificación |
|---|---|---|
| RF-1 | Sección 3 (claves y formato), sección 4 (`isValidGoalMinutes`, `parseGoalMinutes`, `saveGoal`), sección 5.1 y 5.4, sección 6.2 y 6.3 | Validación, análisis del texto, escritura, MCP |
| RF-2 | Sección 4 (`buildWeeklyGoalStatus`, `formatWeeklyProgress`), sección 5.2, sección 6.1 a 6.3 y 6.6 | Progreso, formato, MCP |
| RF-3 | Sección 4 (`clearGoal`), sección 5.4, sección 6.2 y 6.3 | Escritura, MCP |
| RF-4 | Sección 4 (`buildWeeklyGoalStatus`, `formatGoalStatus`), sección 5.2, sección 6.3 | Estado, progreso, MCP |
| RF-5 | Sección 4 (`buildWeeklyGoalStatus`), sección 5.5, sección 6.3 | Estado sin objetivo, MCP |
| RF-6 | Sección 3, sección 4 (`readGoal`, `saveGoal`, `clearGoal`), sección 5.3 y 5.5, sección 6.6 | Lectura, escritura, respaldo, independencia, MCP |
| RF-7 | Sección 6.2 y 6.4 | Árbol de accesibilidad, teclado, MCP |
| RF-8 | Sección 6.5 | 375 px, 200 % de zoom, MCP |
| RNF-1 | Sección 1 y 2; todo el plan | `node --test` y doble clic |
| RNF-2 | Sección 6.2 | Revisión de textos, MCP |
| RNF-3 | Sección 3.1, sección 5.3 y 5.4 | Independencia y no escritura de sesiones |
| RNF-4 | Sección 4 y 5.2 (`today` local), sección 5.5 | Fechas, futuros, cambio de semana |
| RNF-5 | Sección 4 y 5.2 | Tests con fechas fijas |
| RNF-6 | Sección 6.3 y 6.4 | Contraste y estado por texto |
| RNF-7 | Sección 6.5 | 375 px y zoom |
| RNF-8 | Sección 4 y 5.2; reutilización de `calculateWeekMinutes` | Progreso y total semanal coincidentes |
| RNF-9 | Sección 5.5 y 6 | Renderizado inmediato, MCP |
| RNF-10 | Sección 5.4 y 5.5 | Carga, guardado y visibilidad |

No quedan dudas abiertas: la especificación está cerrada y este plan la cubre completa.
