# Tareas 002 — Objetivo semanal de estudio

Regla común: cada tarea deja `node --test` en verde, no añade dependencias y no toca nada fuera de su alcance. La lógica se prueba en `tests/logic.test.js`; la interfaz se verifica con el MCP de Chrome DevTools. Si una tarea supera los 30 minutos, se divide.

- [x] **T-01 — Escribir los tests de validación y normalización del objetivo (20 min).** RF-1.2, RF-1.4
  - Depende de: —
  - Enfoque: añadir primero los casos a `tests/logic.test.js`; implementar `isValidGoalMinutes` y `parseGoalMinutes` hasta ponerlos en verde.
  - Hecho cuando: `node --test` pasa los límites 1 y 10080 como válidos y 0, -1, 10081, 12.5, `"600"`, `NaN`, `Infinity`, `null` y `undefined` como inválidos; `parseGoalMinutes` acepta `" 600 "` y `"030"` y rechaza `""`, `"abc"`, `"1e3"`, `"+5"`, `"12.5"` y `"12,5"`.

- [x] **T-02 — Formatear y evaluar el estado con tests (30 min).** RF-1.3, RF-2.1, RF-2.2, RF-2.3, RF-2.4, RF-2.5, RF-2.9, RF-2.11, RF-4.1, RF-4.2, RF-4.3, RF-4.6, RF-5.1
  - Depende de: T-01
  - Hecho cuando: `node --test` verifica `600 → "600 min"`, `99.5 → "99,5 min"`, `"Minutos esta semana: 0 min"` y `"Minutos esta semana: 99,5 min"`; `formatGoalStatus` con `true`, `false` y `null`; `buildWeeklyGoalStatus` sin objetivo (`null`, `undefined`, `0`, `10081`) devuelve `hasGoal:false` y `reached:null`; con objetivo 100 y progreso 99, 100 y 130 devuelve no alcanzado, alcanzado y alcanzado sin recortar; con 99,5 frente a 100 no alcanza y con 100,0 sí; ignora futuros y sesiones de la semana anterior; y su `progress` coincide con `calculateWeekMinutes`.

- [x] **T-03 — Leer, guardar y respaldar el objetivo (30 min).** RF-6.1, RF-6.2, RF-6.4, RF-6.5, RF-6.6
  - Depende de: T-01
  - Hecho cuando: `node --test` verifica que sin clave `readGoal` devuelve `{ goal: null, unreadable: false, raw: null }`; con `{"minutes":600}` devuelve 600; con JSON inválido, array, `null`, número desnudo o `minutes` 0, decimal, 10081 o texto devuelve `{ goal: null, unreadable: true, raw: original }`; `saveGoal(600, raw)` crea `diario-estudio-objetivo-respaldo` con la copia exacta antes de escribir `{"minutes":600}`; si ya hay respaldo, lo conserva y crea una clave con marca de tiempo; un valor inválido no escribe; un fallo de escritura devuelve `false` y conserva el objetivo anterior; `clearGoal` elimina solo la clave del objetivo; un fallo de borrado devuelve `false` y conserva la clave; y la clave de sesiones no cambia. Las 24 pruebas existentes siguen pasando.

- [x] **T-04 — Añadir la estructura HTML de la tarjeta (20 min).** RF-1.1, RF-2.10, RF-3.1, RF-3.3, RF-3.6, RF-5.2, RF-6.3, RF-7.1, RF-7.4
  - Depende de: T-03
  - Hecho cuando: la página abre sin errores y el MCP muestra la sección «Objetivo semanal» entre la tarjeta superior y «Nueva sesión», con título, línea de objetivo, progreso, estado con `aria-live`, invitación, error de progreso con `aria-live`, etiqueta y campo de minutos, error del formulario con `aria-live`, botón de guardar y botón de quitar; la etiqueta «min esta semana» de la tarjeta superior tiene `id="minutosSemanaTexto"`; y `node --test` sigue en verde.

- [x] **T-05 — Estilar la tarjeta y adaptarla al móvil (25 min).** RF-4.4, RF-7.5, RF-7.6, RF-8.1, RF-8.2, RF-8.3, RF-8.4; RNF-6, RNF-7
  - Depende de: T-04
  - Hecho cuando: a 375 px no hay desplazamiento horizontal, el campo y los botones son utilizables con el dedo, el estado se distingue por texto y no solo por color, el foco es visible con teclado, al 200 % de zoom no hay solapamientos y el resto de secciones conserva su orden y aspecto. `node --test` sigue en verde.

- [x] **T-06 — Renderizar objetivo, progreso y estado (30 min).** RF-2.1, RF-2.4, RF-2.11, RF-3.4, RF-3.6, RF-4.1, RF-4.2, RF-4.3, RF-4.4, RF-5.1, RF-5.2, RF-6.3, RF-7.3, RF-7.4, RF-7.6
  - Depende de: T-02, T-04
  - Hecho cuando: con objetivo 600 y progreso 120 la tarjeta muestra «Objetivo: 600 min», «Minutos esta semana: 120 min» y «Objetivo no alcanzado»; con progreso 650 muestra «Objetivo alcanzado» y 650 min sin recortar; sin objetivo muestra «Minutos esta semana: N min», la invitación y «Fijar objetivo», sin estado de cumplimiento; con sesiones ilegibles muestra «Minutos esta semana: — min», «No se puede calcular el progreso.», deja vacío el estado y la tarjeta superior muestra «— min»; y `node --test` sigue en verde.

- [x] **T-07 — Cablear cargar, fijar, cambiar y quitar (30 min).** RF-1.2, RF-1.4, RF-1.5, RF-1.6, RF-1.7, RF-1.8, RF-3.1, RF-3.2, RF-3.4, RF-3.5, RF-3.6, RF-6.1, RF-6.4, RF-6.5, RF-6.6, RF-7.2
  - Depende de: T-03, T-06
  - Hecho cuando: al cargar se lee y pinta el objetivo; un valor válido se guarda y actualiza la tarjeta sin mensaje de confirmación; 0, -1, 10081, 12.5, texto y vacío muestran «El objetivo debe ser un número entero de minutos entre 1 y 10.080» y conservan el objetivo anterior; «Quitar objetivo» deja la tarjeta con el total, la invitación y «Fijar objetivo»; recargar conserva el objetivo; un objetivo corrupto se trata como sin objetivo y el siguiente guardado crea el respaldo; un fallo al guardar muestra «No se pudo guardar el objetivo. Inténtalo de nuevo.» y conserva el anterior; un fallo al quitar muestra «No se pudo quitar el objetivo. Inténtalo de nuevo.» y conserva el objetivo; las sesiones no cambian; el campo no se reescribe al repintar por otros motivos; y se puede usar todo con teclado.

- [x] **T-08 — Actualizar al guardar una sesión y al volver a mostrar (20 min).** RF-2.6, RF-2.7, RF-2.9, RF-4.6, RF-6.3, RNF-10
  - Depende de: T-06, T-07
  - Hecho cuando: guardar una sesión actualiza el progreso y el estado sin recargar; cancelar sin guardar no los cambia; al volver a mostrar la página se releen sesiones y objetivo y se recalculan ambos, y el campo se sincroniza solo si no tiene el foco; tras un estado de sesiones ilegibles, un guardado correcto devuelve las cifras normales; el cambio de semana se cubre con los tests de `buildWeeklyGoalStatus`; no hay temporizador de medianoche; y `node --test` sigue en verde.

- [x] **T-09 — Verificar el flujo completo con Chrome DevTools (30 min).** RF-1, RF-2, RF-3, RF-4, RF-5, RF-6, RF-7, RF-8; RNF-1, RNF-6, RNF-7, RNF-8, RNF-9
  - Depende de: T-08
  - Hecho cuando: se prueban fijar, cambiar a menor, cambiar a mayor y quitar; los límites 1 y 10080; los inválidos con el mensaje exacto y el objetivo anterior conservado; la persistencia al recargar; la ausencia de mensaje de confirmación; la actualización al guardar una sesión y la no actualización al cancelar; el error de sesiones ilegibles con «— min» en ambas tarjetas; el objetivo corrupto con respaldo al volver a fijarlo; el foco y el orden de tabulación; el árbol de accesibilidad; la consola sin errores; 375 px sin desplazamiento y 200 % de zoom; y se guarda una captura de 375 px.

- [x] **T-10 — Actualizar MEMORY.md y revisar la entrega (20 min).** —
  - Depende de: T-09
  - Hecho cuando: `MEMORY.md` refleja el estado, las decisiones del objetivo semanal, las claves nuevas y los tests, sin datos sensibles y sin superar ~50 líneas; `node --test` está en verde; y no se ha cambiado nada fuera de la spec, el plan, las tareas y los archivos previstos.

## Cobertura

- RF-1: T-01, T-06, T-07, T-09.
- RF-2: T-02, T-06, T-08, T-09.
- RF-3: T-04, T-06, T-07, T-09.
- RF-4: T-02, T-06, T-08, T-09.
- RF-5: T-04, T-06, T-07, T-09.
- RF-6: T-03, T-06, T-07, T-08, T-09.
- RF-7: T-04, T-05, T-06, T-07, T-09.
- RF-8: T-05, T-09.

- RNF-1: T-09.
- RNF-2: T-04, T-06, T-09.
- RNF-3: T-03, T-07, T-09.
- RNF-4: T-02, T-08, T-09.
- RNF-5: T-01, T-02, T-03.
- RNF-6: T-05, T-09.
- RNF-7: T-09 y el comando `node --test` de todas las tareas.
- RNF-8: T-02, T-08.
- RNF-9: T-06, T-08.
- RNF-10: T-08, T-09.
