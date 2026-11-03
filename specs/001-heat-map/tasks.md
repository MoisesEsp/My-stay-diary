# Tareas 001 — Mapa de calor de estudio

Regla común: cada tarea deja `node --test` en verde, no añade dependencias y no toca nada fuera de su alcance. La lógica se prueba en `tests/logic.test.js`; la interfaz se verifica con el MCP de Chrome DevTools. Si una tarea supera los 30 minutos, se divide.

- [x] **T-01 — Validar fechas y minutos** (~20 min)
  - Depende de: —
  - RF: RF-2.4, RF-2.5
  - Hecho cuando: `node --test` pasa los casos de fecha válida, fecha imposible, 29 de febrero bisiesto/no bisiesto, minutos 0, negativos, `NaN`, infinito y texto.

- [x] **T-02 — Calcular el inicio de las 12 semanas** (~20 min)
  - Depende de: T-01
  - RF: RF-1.2, RF-1.3
  - Hecho cuando: `node --test` verifica que `heatMapWindowStart` devuelve el lunes correcto con hoy lunes, miércoles y domingo, y en el cruce de año.

- [x] **T-03 — Asignar niveles de intensidad** (~20 min)
  - Depende de: T-02
  - RF: RF-3
  - Hecho cuando: `node --test` pasa los límites 0, 0,1, 29,9, 30, 59,9, 60, 89,9, 90 y 600 minutos.

- [x] **T-04 — Agrupar sesiones válidas por día** (~25 min)
  - Depende de: T-01
  - RF: RF-2.1, RF-2.3, RF-2.4, RF-2.5
  - Hecho cuando: `node --test` verifica que se suman varias sesiones, se ignoran fechas inválidas, minutos inválidos, sesiones de 0 minutos y sesiones futuras.

- [x] **T-05 — Construir las 12 semanas del mapa** (~30 min)
  - Depende de: T-02, T-03, T-04
  - RF: RF-1.1, RF-1.2, RF-1.3, RF-2, RF-3, RF-8, RF-10.2, RF-10.3
  - Hecho cuando: `node --test` verifica 12 columnas × 7 días, 84 fechas consecutivas, semana actual parcial, días futuros marcados como futuros, niveles correctos y sesiones fuera de la ventana ignoradas.

- [x] **T-06 — Calcular el resumen del periodo** (~20 min)
  - Depende de: T-05
  - RF: RF-10.1, RF-10.2, RF-10.3, RF-10.6
  - Hecho cuando: `node --test` verifica días con estudio, minutos totales, exclusión de futuros/ceros/inválidos y formato con coma decimal.

- [x] **T-07 — Calcular las etiquetas de mes** (~25 min)
  - Depende de: T-05
  - RF: RF-1.5
  - Hecho cuando: `node --test` verifica una etiqueta en la columna que contiene el día 1, año en la primera etiqueta, diciembre y enero, y 12 posiciones de salida.

- [x] **T-08 — Formatear la etiqueta accesible de cada día** (~20 min)
  - Depende de: T-05
  - RF: RF-10.4, RF-10.5
  - Hecho cuando: `node --test` verifica los textos exactos con minutos, “sin sesión” y “no transcurrido”, en español y con coma decimal.

- [x] **T-09 — Leer datos con estado de error y respaldo** (~30 min)
  - Depende de: T-01
  - RF: RF-9
  - Hecho cuando: `node --test` verifica `{ sessions, unreadable, raw }` con datos válidos, sin datos, JSON corrupto, array no válido y migración legacy; además, un guardado tras datos corruptos crea el respaldo antes de sobrescribir y las pruebas existentes siguen pasando.

- [x] **T-10 — Añadir la estructura de la sección** (~20 min)
  - Depende de: T-09
  - RF: RF-4, RF-5, RF-6, RF-8, RF-9, RF-10
  - Hecho cuando: la página abre sin errores y el MCP muestra la sección “Últimas 12 semanas” entre “Mis sesiones” y el calendario, con título, resumen, contenedor de meses, días, cuadrícula, mensaje y leyenda.

- [x] **T-11 — Pintar la cuadrícula, estados y accesibilidad** (~30 min)
  - Depende de: T-10, T-05
  - RF: RF-1.1, RF-1.3, RF-3, RF-5, RF-10.4
  - Hecho cuando: el MCP muestra 84 celdas en 12 columnas × 7 filas, los cinco estados más “no transcurrido”, una etiqueta accesible por celda y ningún desplazamiento horizontal a 375 px.

- [x] **T-12 — Pintar meses, resumen, leyenda y mensajes** (~25 min)
  - Depende de: T-10, T-06, T-07, T-08
  - RF: RF-1.5, RF-5, RF-8, RF-9, RF-10.1
  - Hecho cuando: el MCP muestra el resumen exacto, las etiquetas de mes, la leyenda completa y los mensajes de vacío y error con el texto especificado.

- [x] **T-13 — Conectar carga, guardado y visibilidad** (~25 min)
  - Depende de: T-09, T-11, T-12
  - RF: RF-7, RF-8, RF-9
  - Hecho cuando: al cargar se pinta el mapa; al guardar una sesión se actualiza sin recargar; al cancelar sin guardar no cambia; al volver a mostrar la página se recalcula; y el estado de error se mantiene cuando corresponde.

- [x] **T-14 — Verificar el flujo principal con el MCP** (~30 min)
  - Depende de: T-13
  - RF: RF-4, RF-5, RF-6, RF-7, RF-10
  - Hecho cuando: con sesiones de hoy, ayer y anteayer se ven 12 × 7 celdas, resumen y leyenda correctos; guardar actualiza el mapa; no hay tooltips ni clics; la consola está limpia; y la captura a 375 px no tiene desbordamiento.

- [x] **T-15 — Verificar estados límite con el MCP** (~30 min)
  - Depende de: T-13
  - RF: RF-1.3, RF-8, RF-9, RF-10
  - Hecho cuando: con almacenamiento vacío se ve el mensaje de vacío; con JSON corrupto se ve el mensaje de error y el respaldo se crea al guardar; los días futuros se ven como “no transcurrido”; y la instantánea de accesibilidad contiene fecha y estado por celda.

- [x] **T-16 — Actualizar la memoria del proyecto** (~10 min)
  - Depende de: T-14, T-15
  - RF: —
  - Hecho cuando: `MEMORY.md` refleja el estado, las decisiones del mapa y los tests, sin datos sensibles y sin superar ~50 líneas.

## Cobertura

- RF-1: T-02, T-05, T-07, T-11, T-15.
- RF-2: T-01, T-04, T-05.
- RF-3: T-03, T-05, T-11.
- RF-4: T-10, T-14.
- RF-5: T-10, T-11, T-12, T-14.
- RF-6: T-10, T-14.
- RF-7: T-13, T-14.
- RF-8: T-05, T-12, T-13, T-15.
- RF-9: T-09, T-10, T-12, T-13, T-15.
- RF-10: T-06, T-08, T-11, T-12, T-14, T-15.

- RNF-1: T-10, T-11, T-14, T-15.
- RNF-2: T-11, T-14.
- RNF-3: T-05, T-14.
- RNF-4: T-09, T-13, T-15.
- RNF-5: T-01, T-02, T-05.
- RNF-6: T-08, T-10, T-12.
- RNF-7: T-01 a T-09, T-16.
- RNF-8: T-02, T-05.
- RNF-9: T-02 a T-08.
- RNF-10: T-13, T-15.
