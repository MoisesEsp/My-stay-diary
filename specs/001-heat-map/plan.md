# Plan 001 — Mapa de calor de estudio

## 1. Alcance y restricciones

Implementa la especificación `specs/001-heat-map/spec.md` respetando `docs/constitution.md`: HTML, CSS y JavaScript puros; sin dependencias ni build; funciona con `file://`; lógica pura separada de la interfaz; tests con el runner nativo de Node, sin instalar paquetes; datos existentes intactos; textos visibles en español y código en inglés.

Este documento describe el qué técnico y el cómo; no contiene código de implementación, solo pseudocódigo.

## 2. Archivos que se crean o modifican

| Archivo | Acción | Responsabilidad | RF |
|---|---|---|---|
| `index.html` | Modificar | Añadir la sección del mapa entre la lista de sesiones y el calendario: título, resumen, etiquetas de mes/día, cuadrícula, mensaje y leyenda. Sin lógica. | RF-4, RF-5, RF-6, RF-8, RF-9, RF-10 |
| `styles.css` | Modificar | Estilos de la sección, cuadrícula 12 × 7, cinco estados de intensidad, estado “no transcurrido”, leyenda, resumen, mensajes, etiquetas y adaptación a 375 px. | RF-1.5, RF-3, RF-5, RF-6, RF-8, RF-9, RF-10; RNF-1, RNF-2 |
| `app.js` | Modificar | Funciones puras del mapa, lectura con estado de error y respaldo de datos ilegibles, renderizado, etiquetas accesibles y actualización al cargar, guardar y volver a mostrar la página. | RF-1, RF-2, RF-3, RF-7, RF-8, RF-9, RF-10; RNF-3, RNF-4, RNF-5, RNF-8, RNF-9, RNF-10 |
| `tests/logic.test.js` | Modificar | Ampliar el cargador de `app.js` y añadir pruebas de ventana, sesiones válidas, umbrales, resumen, etiquetas y estado de lectura. | RF-1, RF-2, RF-3, RF-7, RF-8, RF-9, RF-10; RNF-7, RNF-9 |
| `MEMORY.md` | Modificar al terminar | Registrar el estado y las decisiones del mapa. No forma parte de la funcionalidad. | — |
| `docs/constitution.md` | Solo lectura | Principios que condicionan el plan. | — |
| `specs/001-heat-map/spec.md` | Solo lectura | Requisitos y criterios de aceptación. | — |

No se crean archivos nuevos de aplicación. La lógica sigue en `app.js` para no romper el doble clic ni introducir módulos.

## 3. Funciones puras de lógica

Todas viven en `app.js`, no tocan el DOM ni el almacenamiento y reciben la fecha de referencia cuando la necesitan. Se reutilizan las funciones existentes `dateToLocal`, `textToDate` y `startOfWeek`.

| Función | Entrada | Salida | RF |
|---|---|---|---|
| `isValidLocalDate(text)` | Texto de fecha | Verdadero si cumple `AAAA-MM-DD` y es una fecha local real; falso en otro caso. | RF-2.5, RNF-5 |
| `isValidMinutes(value)` | Valor de minutos | Verdadero si es un número finito mayor que 0. | RF-2.4 |
| `heatMapWindowStart(today)` | `today` como `AAAA-MM-DD` | Lunes de la semana que está 11 semanas antes de la semana de `today`. | RF-1.2 |
| `heatMapLevel(minutes)` | Minutos totales del día | 0 para vacío; 1, 2, 3 o 4 según los umbrales `[0,30)`, `[30,60)`, `[60,90)`, `[90,∞)`. | RF-3 |
| `groupValidSessionsByDate(sessions, today)` | Sesiones y `today` | Mapa fecha → total de minutos válidos; ignora sesiones inválidas y futuras. | RF-2.1, RF-2.3, RF-2.4, RF-2.5 |
| `buildHeatMap(sessions, today)` | Sesiones y `today` | `{ start, today, weeks, summary }`; 12 semanas de 7 días; cada día `{ date, minutes, level, isFuture }`. | RF-1, RF-2, RF-3, RF-8, RF-10 |
| `summarizeHeatMap(days)` | Días del mapa | `{ daysWithStudy, totalMinutes }`; excluye futuros y días con 0 minutos. | RF-10 |
| `monthLabelsForWeeks(weeks)` | 12 semanas | 12 etiquetas de mes o vacío; etiqueta en la columna que contiene el día 1; año en la primera etiqueta y en diciembre/enero. | RF-1.5 |
| `formatDayAriaLabel(day)` | Día del mapa | Texto accesible en español: fecha + minutos, “sin sesión” o “no transcurrido”. | RF-10.4, RF-10.5 |
| `formatHeatMapSummary(summary)` | Resumen | Texto “Periodo: 12 semanas · Días con estudio: N · Minutos totales: M.”, con coma decimal si hace falta. | RF-10.1, RF-10.6 |

Decisiones de forma:

- `level` es siempre 0–4. `isFuture` distingue el estado “no transcurrido”; el renderizador comprueba `isFuture` antes que `level`.
- `today` se pasa como texto para evitar relojes ocultos y permitir pruebas con fechas fijas.
- `buildHeatMap` no lee datos: recibe el array de sesiones ya leído.
- Los textos visibles se generan en las funciones de formato, pero siguen siendo funciones puras.

## 4. Algoritmo del mapa en pseudocódigo

```text
FUNCIÓN heatMapWindowStart(today)
  lunesActual ← startOfWeek(today)
  fecha ← textToDate(lunesActual)
  fecha ← fecha - 77 días
  DEVOLVER dateToLocal(fecha)
FIN

FUNCIÓN buildHeatMap(sessions, today)
  inicio ← heatMapWindowStart(today)
  fechaInicio ← textToDate(inicio)

  // 1. Agrupar solo sesiones válidas y no futuras.
  porFecha ← mapa vacío
  PARA CADA sesión EN sessions
    SI NO isValidLocalDate(sesión.date) ENTONCES continuar
    SI NO isValidMinutes(sesión.minutes) ENTONCES continuar
    SI sesión.date > today ENTONCES continuar
    porFecha[sesión.date] ← (porFecha[sesión.date] o 0) + sesión.minutes
  FIN PARA

  // 2. Construir 84 días consecutivos.
  días ← lista vacía
  PARA i DESDE 0 HASTA 83
    fecha ← fechaInicio + i días
    textoFecha ← dateToLocal(fecha)
    esFuturo ← textoFecha > today
    minutos ← 0
    SI NO esFuturo ENTONCES minutos ← porFecha[textoFecha] o 0
    nivel ← SI esFuturo ENTONCES 0 SI NO heatMapLevel(minutos)
    añadir a días { date: textoFecha, minutes: minutos, level: nivel, isFuture: esFuturo }
  FIN PARA

  // 3. Agrupar en 12 columnas de 7 días (lunes a domingo).
  semanas ← lista vacía
  PARA w DESDE 0 HASTA 11
    añadir a semanas los días[w*7 .. w*7+6]
  FIN PARA

  resumen ← summarizeHeatMap(días)
  DEVOLVER { start: inicio, today: today, weeks: semanas, summary: resumen }
FIN

FUNCIÓN summarizeHeatMap(días)
  díasConEstudio ← 0
  minutosTotales ← 0
  PARA CADA día EN días
    SI NO día.isFuture Y día.minutes > 0 ENTONCES
      díasConEstudio ← díasConEstudio + 1
      minutosTotales ← minutosTotales + día.minutes
    FIN SI
  FIN PARA
  DEVOLVER { daysWithStudy: díasConEstudio, totalMinutes: minutosTotales }
FIN

FUNCIÓN monthLabelsForWeeks(semanas)
  etiquetas ← 12 posiciones vacías
  primeraEtiqueta ← verdadero
  PARA CADA semana, índice EN semanas
    PARA CADA día EN semana
      SI día.date termina en "-01" ENTONCES
        mes ← mes de día.date
        etiqueta ← abreviatura del mes
        SI primeraEtiqueta O mes = enero O mes = diciembre ENTONCES
          etiqueta ← etiqueta + " " + año
        FIN SI
        etiquetas[índice] ← etiqueta
        primeraEtiqueta ← falso
        romper
      FIN SI
    FIN PARA
  FIN PARA
  DEVOLVER etiquetas
FIN
```

Cobertura: RF-1.1, RF-1.2, RF-1.3, RF-1.5, RF-2.1, RF-2.3, RF-2.4, RF-2.5, RF-3, RF-8, RF-10.2, RF-10.3.

## 5. Cómo se pinta en la interfaz

### 5.1 Estructura

La sección se inserta inmediatamente después de “Mis sesiones” y antes del calendario mensual:

```text
┌─────────────────────────────────────────────┐
│ Últimas 12 semanas                          │
│ Periodo: 12 semanas · Días con estudio: N   │
│ · Minutos totales: M                        │
│                                             │
│        sep        oct        nov            │
│ lun  █ █ ░ ░ █ █ █ █ ░ █ █ █               │
│ mié  █ ░ ░ █ █ ░ █ █ █ ░ █ █               │
│ vie  ░ █ █ ░ █ █ ░ █ ░ █ ░ █               │
│                                             │
│ [mensaje de vacío o error, si aplica]       │
│                                             │
│ Sin sesión  ░  1  ░  2  ░  3  ░  4  ░      │
│ No transcurrido  ▨                         │
└─────────────────────────────────────────────┘
```

La cuadrícula tiene 12 columnas (semanas) y 7 filas (lunes a domingo). Las etiquetas de día se alinean con lunes, miércoles y viernes. Las etiquetas de mes se colocan encima de la columna que contiene el día 1.

### 5.2 Renderizado

| Función de interfaz | Responsabilidad | RF |
|---|---|---|
| `renderHeatMap(sessions, unreadable)` | Orquesta el renderizado; si `unreadable` es verdadero, muestra el estado de error; si no, llama a `buildHeatMap` con `todayLocal()`. | RF-7, RF-8, RF-9, RF-10 |
| `renderHeatMapGrid(map)` | Crea las 84 celdas en orden cronológico (semana a semana), asigna clase de nivel o de futuro y `aria-label` con `formatDayAriaLabel`. | RF-1, RF-3, RF-10.4 |
| `renderHeatMapMonths(map)` | Pinta las etiquetas de mes con `monthLabelsForWeeks`. | RF-1.5 |
| `renderHeatMapSummary(summary)` | Pinta el resumen con `formatHeatMapSummary`. | RF-10.1 |
| `renderHeatMapMessage(state)` | Muestra el mensaje de vacío, el de error o ninguno. | RF-8.2, RF-9.1 |
| `renderHeatMapLegend()` | Pinta la leyenda estática con los cinco estados y “no transcurrido”. | RF-5 |

La leyenda es estática y se construye una vez; no depende de los datos. El mensaje de vacío y el de error son excluyentes.

### 5.3 Estados visuales

- **Vacío (0 min):** relleno verde muy claro con borde de tinta.
- **Nivel 1:** verde claro.
- **Nivel 2:** verde medio.
- **Nivel 3:** verde oscuro.
- **Nivel 4:** verde muy oscuro.
- **No transcurrido:** fondo transparente con borde discontinuo; nunca se confunde con el vacío.
- **Error de datos:** cuadrícula con los días transcurridos vacíos, los futuros “no transcurrido”, mensaje de error y resumen con “—”.
- **Vacío real:** misma cuadrícula, mensaje “Aún no hay minutos registrados en estas 12 semanas.” y resumen con 0.

Los colores propuestos para la escala azul de alto contraste son `#7f8d9a` (vacío), `#5f83a6`, `#42678c`, `#2c4d6e` y `#18324b`; el borde de celda usa `#2f3a45`. Los cinco rellenos tienen contraste ≥3,3:1 contra la tarjeta y la luminosidad decrece con el nivel. La leyenda y el resumen usan la tinta existente con contraste 5,45:1.

### 5.4 Accesibilidad y responsive

- La sección se asocia al título mediante `aria-labelledby`.
- La cuadrícula se expone como lista de 84 celdas en orden cronológico, de la semana más antigua a la actual; cada celda tiene `aria-label` con fecha y estado. Las etiquetas visuales de mes y día son decorativas para lectores de pantalla, porque la información ya está en cada celda.
- La leyenda es una lista de texto, no solo cuadros de color.
- No hay celdas interactivas, `tabindex`, tooltips ni clics: RF-6 se cumple por ausencia de manejadores.
- La cuadrícula usa CSS Grid con 12 columnas y 7 filas, celdas de al menos 10 × 10 px y separación de 2–3 px. A 375 px no hay desplazamiento horizontal.
- Si las etiquetas de mes o día no caben, se ocultan las menos prioritarias; el resumen y la leyenda permanecen.
- La vista funciona con zoom al 200 %, texto grande y alto contraste. En `forced-colors` se mantienen bordes `CanvasText` y las etiquetas accesibles; la intensidad se consulta en la leyenda y en las etiquetas de celda.

### 5.5 Actualización

- Al cargar: `readSessions()` devuelve `{ sessions, unreadable, raw }`; se guarda el estado y se llama a `renderHeatMap`.
- Al guardar una sesión: `saveSession()` actualiza el array, guarda y llama a `renderHeatMap(sessions, false)` además de los renderizados existentes. Si el estado previo era ilegible, antes de sobrescribir se conserva el valor original en una clave de respaldo; así no se pierde el dato. El mapa solo se repinta si el guardado termina correctamente.
- Al cancelar sin guardar: no se llama al renderizado del mapa.
- Al volver a mostrar la página: se vuelven a leer las sesiones y se repintan el mapa y las vistas existentes para reflejar cambios de otra pestaña o del día.
- No se usa `setInterval` para medianoche: la fecha se toma en cada recálculo.

Cobertura: RF-4, RF-5, RF-6, RF-7, RF-8, RF-9, RF-10; RNF-1, RNF-2, RNF-10.

## 6. Decisiones técnicas justificadas y alternativas descartadas

1. **Mantener toda la lógica en `app.js`.** Evita módulos ES, `fetch` y un paso de build; respeta la constitución y el doble clic. Alternativa descartada: crear `heat-map.js` o un módulo ES, que obligaría a cambiar la carga y podría romper `file://`. Cubre RF-1–RF-10; RNF-7.
2. **Separar `buildHeatMap` del renderizado.** La función pura recibe sesiones y `today`, se prueba sin navegador y el render solo pinta. Alternativa descartada: calcular dentro de `renderHeatMap`, que mezclaría DOM y lógica y dificultaría los tests. Cubre RF-1, RF-2, RF-3, RF-10; RNF-9.
3. **Precalcular 84 días y agruparlos en 12 semanas.** Un solo recorrido produce días, niveles y resumen; el render es directo y el rendimiento es constante. Alternativa descartada: calcular cada celda al crear el DOM, con lógica duplicada y más riesgo de desajustes. Cubre RF-1, RF-2, RF-3, RF-10; RNF-3.
4. **`readSessions()` devuelve `{ sessions, unreadable, raw }`.** Permite distinguir “no hay datos” de “no se pudieron leer”, activar RF-9 y conservar el valor original para un respaldo antes de sobrescribir. Alternativa descartada: devolver siempre un array y usar una bandera global; se pierde la diferencia y se contamina el estado. Cubre RF-9; RNF-4.
5. **Umbrales fijos.** El color significa lo mismo en cualquier periodo y no cambia al añadir datos. Alternativa descartada: escala relativa al mejor día, que haría incomparables dos mapas con datos distintos. Cubre RF-3.
6. **Estado “no transcurrido” separado del vacío.** Evita que los días futuros parezcan días no estudiados. Alternativa descartada: usar el mismo vacío para ambos, que confunde pasado y futuro. Cubre RF-1.3, RF-3.6, RF-5.
7. **Escala azul de alto contraste + borde oscuro.** La luminosidad distingue los niveles, los rellenos cumplen 3:1 contra la tarjeta y el borde aporta contorno; no depende solo del tono. Alternativa descartada: varios tonos o tooltips como única explicación, que fallan con daltonismo y con RF-6. Cubre RF-3, RF-5; RNF-1.
8. **CSS Grid y etiquetas ARIA por celda.** Es simple, responsive y accesible sin interacción. Alternativa descartada: `<canvas>`, que no expone celdas accesibles, o una tabla, que añade semántica de tabla a una cuadrícula visual. Cubre RF-1, RF-6, RF-10; RNF-1, RNF-2.
9. **Actualizar al volver a mostrar la página, sin temporizador de medianoche.** Cubre el cambio de día y otra pestaña sin `setInterval` permanente. Alternativa descartada: un temporizador que compruebe la medianoche, más complejo y sin beneficio claro. Cubre RF-7; RNF-10.
10. **Etiqueta de mes en la primera columna que contiene el día 1, con año en la primera etiqueta y al cambiar de año.** Da orientación sin repetir el mes en cada columna. Alternativa descartada: etiquetar todas las columnas o no etiquetar ninguna; la primera opción satura y la segunda desorienta. Cubre RF-1.5.
11. **Formateadores puros para resumen y etiquetas accesibles.** Permiten probar los textos exactos y mantener el render simple. Alternativa descartada: construir los textos dentro del render, que los hace dependientes del DOM y difíciles de testear. Cubre RF-10; RNF-9.
12. **Ampliar `tests/logic.test.js` en lugar de añadir un framework.** Reutiliza el cargador de `app.js` y el DOM simulado; no añade dependencias. Alternativa descartada: instalar un framework de tests, prohibido por la constitución. Cubre RNF-7.
13. **Protección de datos ilegibles.** Si `readSessions` detecta un conjunto ilegible, conserva el valor original y, antes de que un guardado lo sobrescriba, lo copia a una clave de respaldo (`diario-estudio-sesiones-respaldo`). Si esa clave ya existe, se conserva y se usa una clave con marca de tiempo para no perder respaldos anteriores. El mapa muestra el error; tras un guardado correcto, el nuevo array es legible y el respaldo conserva el original. El respaldo no se usa para construir el mapa y no altera el formato de las sesiones. Alternativa descartada: sobrescribir sin respaldo, que perdería datos, o bloquear el guardado, que rompería RF-9.4. Cubre RF-9; RNF-4; principio 5 de la constitución.

## 7. Estrategia de tests con `node --test`

Se amplía `tests/logic.test.js`, que ya carga `app.js` en un contexto `vm` con DOM y `localStorage` simulados. No se instala nada.

### 7.1 Cambios en el cargador de tests

- Añadir las nuevas funciones a la lista exportada al contexto de pruebas.
- Adaptar el arranque de la aplicación a `readSessions()` devolviendo `{ sessions, unreadable, raw }`.
- Permitir sembrar almacenamiento corrupto, por ejemplo con un valor no JSON, para probar RF-9.
- Mantener las pruebas existentes de racha, semana, mes y migración.

### 7.2 Casos de prueba

| Grupo | Casos | RF |
|---|---|---|
| Ventana | `heatMapWindowStart` con hoy lunes, miércoles y domingo; cruce de año; 12 × 7 = 84 días; primera y última fecha; una sesión del domingo anterior al primer lunes no aparece. | RF-1 |
| Sesiones válidas | Varias sesiones el mismo día; minutos 0, negativos, `NaN`, infinito y texto; fechas inválidas, ausentes y futuras. | RF-2 |
| Umbrales | 0; 0,1; 29,9; 30; 59,9; 60; 89,9; 90; 600. | RF-3 |
| Estados | Día vacío; día futuro; semana actual parcial con hoy lunes y con hoy domingo. | RF-1.3, RF-3.6 |
| Resumen | Días con estudio distintos; minutos totales; exclusión de futuros, ceros e inválidos; formato con coma decimal. | RF-10 |
| Etiquetas | Etiqueta accesible con minutos, “sin sesión” y “no transcurrido”; etiquetas de mes en columnas con día 1; año en la primera, diciembre y enero. | RF-1.5, RF-10.4 |
| Lectura | Sin datos; datos corruptos; migración legacy; array no válido; datos válidos con registros inválidos; datos corruptos más guardado → respaldo antes de sobrescribir. | RF-9 |
| Vacío/error | Sin sesiones; solo futuras; solo ceros/inválidas; resumen 0/0 y mensajes exactos. | RF-8, RF-9 |
| Fechas | 29 de febrero en año bisiesto y no bisiesto; 31 de diciembre/1 de enero. | RF-2.5, RNF-5 |

Comando único: `node --test`. Todos los tests deben quedar en verde antes de tocar la interfaz.

### 7.3 Verificación de interfaz con el MCP de Chrome DevTools

Además de los tests de lógica, y según `AGENTS.md`:

- Abrir `index.html` en el Chromium de 9222 con el perfil temporal.
- Sembrar sesiones de prueba: hoy, ayer, anteayer, varias el mismo día y valores en los límites.
- Comprobar: sección antes del calendario, 12 × 7 celdas, resumen correcto, leyenda, estado futuro, estado vacío y estado de error con datos corruptos.
- Comprobar que el mapa se actualiza tras guardar una sesión y que no cambia al cancelar sin guardar.
- Revisar la consola sin errores.
- Emular 375 px y verificar que no hay desplazamiento horizontal; hacer captura.
- Revisar las etiquetas accesibles con una instantánea del árbol de accesibilidad.

## 8. Orden de implementación y riesgos

1. Funciones puras y tests en `node --test`.
2. Estructura y estilos de la sección.
3. Renderizado y etiquetas accesibles.
4. Conexión con carga, guardado y visibilidad.
5. Verificación con el MCP y captura a 375 px.
6. Actualización de `MEMORY.md`.

Riesgos principales:

- Desplazamiento de un día al calcular la ventana o al agrupar semanas.
- Confundir “no transcurrido” con “vacío”.
- Distinguir datos ilegibles de datos vacíos.
- Que 12 columnas no quepan a 375 px sin romper la legibilidad.
- Que el modo de alto contraste del sistema no muestre la intensidad cromática; se mantienen bordes visibles y etiquetas accesibles.
- Que el respaldo no se escriba antes de sobrescribir o que un guardado fallido repinte el mapa.

## 9. Trazabilidad RF → plan

| RF | Dónde se cubre | Tests |
|---|---|---|
| RF-1 | Sección 3 (`heatMapWindowStart`, `buildHeatMap`), sección 4, sección 5 | Ventana, 84 días, estados, etiquetas |
| RF-2 | Sección 3 (`isValidLocalDate`, `isValidMinutes`, `groupValidSessionsByDate`), sección 4 | Sesiones válidas, sumas, inválidas, futuras |
| RF-3 | Sección 3 (`heatMapLevel`), sección 4, sección 5.3 | Umbrales y decimales |
| RF-4 | Sección 2 (`index.html`, `styles.css`), sección 5.1 | Verificación MCP |
| RF-5 | Sección 2, sección 5.2 y 5.3 | Verificación MCP y leyenda |
| RF-6 | Sección 5.4 (sin manejadores) | Verificación MCP |
| RF-7 | Sección 5.5 (carga, guardado, visibilidad) | Verificación MCP |
| RF-8 | Sección 5.2 y 5.3; `summarizeHeatMap` | Vacío, solo futuras, solo ceros |
| RF-9 | Sección 6, decisión 4 (`readSessions` con estado), sección 5.2 | Lectura corrupta, respaldo y migración |
| RF-10 | Sección 3 (`summarizeHeatMap`, `formatDayAriaLabel`, `formatHeatMapSummary`), sección 5.4 | Resumen, etiquetas y formatos |
| RNF-1 | Sección 5.3 y 5.4 | Contraste, ARIA, zoom, MCP |
| RNF-2 | Sección 5.4 | 375 px y captura |
| RNF-3 | Sección 3 y 4 (precálculo de 84 celdas) | Medición en MCP |
| RNF-4 | Sección 5.5 y decisión 13 | Tests de lectura, respaldo y verificación de no escritura |
| RNF-5 | Sección 3 y 7.2 | Fechas, bisiestos y cruces |
| RNF-6 | Sección 5 | Revisión de textos |
| RNF-7 | Sección 6.12 y 7 | `node --test` sin dependencias |
| RNF-8 | Sección 3 y 4 | Casos de fechas y futuros |
| RNF-9 | Sección 3 (`today` como parámetro) | Tests con fechas fijas |
| RNF-10 | Sección 5.5 | Verificación de visibilidad y otra pestaña |

No quedan dudas abiertas: la especificación está cerrada y este plan la cubre completa.
