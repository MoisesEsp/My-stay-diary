# Especificación 001 — Mapa de calor de estudio

## 1. Contexto y objetivo

El Diario de Estudio registra sesiones con fecha, tema y minutos, y ya muestra la racha, el calendario mensual y la lista de sesiones. Falta una vista que permita ver de un vistazo la constancia de las últimas semanas.

Esta funcionalidad añade un mapa de calor inspirado en GitHub: una cuadrícula de 12 semanas donde cada día se colorea según los minutos estudiados. El objetivo es que la persona detecte patrones, días flojos y rachas visualmente, sin tener que leer la lista completa. El mapa es una vista derivada y de solo lectura: no crea datos nuevos, no modifica las sesiones y no sustituye al calendario mensual.

## 2. Usuarios

- **Usuario principal:** la persona que usa el diario en su equipo y registra sus sesiones de estudio. Quiere ver su constancia reciente sin analizar la lista.
- **Contexto de uso:** una sola persona por equipo. No hay cuentas, roles ni permisos; cualquier persona con acceso al equipo puede consultar el diario y registrar sesiones.

## 3. Historias de usuario

- **US-1:** Como estudiante, quiero ver las últimas 12 semanas en una cuadrícula para identificar de un vistazo mis días constantes y mis huecos.
- **US-2:** Como estudiante, quiero que el color de cada día refleje los minutos estudiados para distinguir días ligeros de días intensos.
- **US-3:** Como estudiante, quiero una leyenda que explique los colores para interpretar el mapa sin adivinar.
- **US-4:** Como estudiante, quiero que el mapa se actualice al guardar una sesión para ver mi progreso al momento.
- **US-5:** Como estudiante, quiero un mensaje claro cuando aún no hay minutos registrados en el periodo para no confundir vacío con error.
- **US-6:** Como estudiante, quiero seguir teniendo el calendario mensual para consultar un mes concreto además del resumen reciente.
- **US-7:** Como persona que usa lector de pantalla, quiero una descripción textual del periodo y de cada día para entender el mapa sin depender del color.

## 4. Requisitos funcionales

### RF-1 — Periodo y estructura

El mapa mostrará 12 semanas naturales consecutivas. La primera columna será el lunes de la semana que está 11 semanas antes de la semana actual; la última columna será la semana actual, entendida como la semana de lunes a domingo que contiene hoy. Cada columna tendrá 7 filas, de lunes a domingo. Los días posteriores a hoy se mostrarán en el estado "no transcurrido".

Criterios de aceptación:

- **RF-1.1** Cuando se muestre el mapa, el sistema deberá presentar 12 columnas semanales y 7 filas diarias, de lunes a domingo.
- **RF-1.2** El sistema deberá empezar la primera columna en el lunes de la semana que está 11 semanas antes de la semana actual.
- **RF-1.3** El sistema deberá terminar la última columna en la semana actual y mostrar los días posteriores a hoy como "no transcurrido".
- **RF-1.4** El sistema deberá calcular el periodo con la fecha local del usuario, sin desplazar días por zona horaria.
- **RF-1.5** El sistema deberá mostrar el título "Últimas 12 semanas", una etiqueta de mes en la primera columna que contenga el día 1 de cada mes y etiquetas de día para lunes, miércoles y viernes. La etiqueta de mes incluirá el año en la primera etiqueta y en diciembre y enero.

### RF-2 — Minutos por día

Una sesión cuenta para el mapa si su fecha es una fecha local real y sus minutos son un número finito mayor que 0. El total diario es la suma de las sesiones válidas de ese día. Las sesiones inválidas se ignoran individualmente: no invalidan el resto de datos.

Criterios de aceptación:

- **RF-2.1** Cuando existan varias sesiones válidas en un mismo día, el sistema deberá sumar sus minutos para calcular la intensidad de ese día.
- **RF-2.2** Si un día no tiene sesiones válidas, el sistema deberá mostrarlo como día vacío.
- **RF-2.3** Si una sesión tiene fecha futura, el sistema deberá excluirla del mapa.
- **RF-2.4** Si una sesión tiene minutos no finitos, no numéricos, negativos o iguales a 0, el sistema deberá ignorar esa sesión y mantener las demás.
- **RF-2.5** Si una sesión tiene una fecha ausente o que no corresponde a una fecha local real, el sistema deberá ignorar esa sesión y mantener las demás.
- **RF-2.6** Cuando un día tenga solo sesiones de 0 minutos o inválidas, el sistema deberá mostrarlo como día vacío.

### RF-3 — Niveles de intensidad

El mapa usará cinco estados de intensidad: vacío y cuatro niveles. "No transcurrido" es un estado aparte, no un nivel de intensidad. Los umbrales se aplican al total diario exacto, sin redondear:

- Vacío: 0 minutos.
- Nivel 1: más de 0 y menos de 30 minutos.
- Nivel 2: 30 minutos o más y menos de 60.
- Nivel 3: 60 minutos o más y menos de 90.
- Nivel 4: 90 minutos o más.

El nivel 4 es el más intenso y el vacío el más tenue. La intensidad visual crece con el nivel.

Criterios de aceptación:

- **RF-3.1** Cuando un día tenga 0 minutos, el sistema deberá mostrarlo como vacío.
- **RF-3.2** Cuando un día tenga más de 0 y menos de 30 minutos, el sistema deberá mostrarlo con el nivel 1.
- **RF-3.3** Cuando un día tenga 30 minutos o más y menos de 60, el sistema deberá mostrarlo con el nivel 2.
- **RF-3.4** Cuando un día tenga 60 minutos o más y menos de 90, el sistema deberá mostrarlo con el nivel 3.
- **RF-3.5** Cuando un día tenga 90 minutos o más, el sistema deberá mostrarlo con el nivel 4.
- **RF-3.6** Cuando un día sea posterior a hoy, el sistema deberá mostrarlo como "no transcurrido", no como vacío.
- **RF-3.7** El sistema deberá mantener los mismos umbrales aunque cambien los datos del periodo.
- **RF-3.8** Cuando el total diario tenga decimales, el sistema deberá aplicar el umbral sin redondear: 29,9 es nivel 1, 30,0 es nivel 2, 59,9 es nivel 2, 60,0 es nivel 3, 89,9 es nivel 3 y 90,0 es nivel 4.

### RF-4 — Ubicación y convivencia con el calendario

La sección del mapa se mostrará inmediatamente antes del calendario mensual. El calendario mensual y su navegación se mantendrán sin cambios.

Criterios de aceptación:

- **RF-4.1** El sistema deberá mostrar la sección del mapa inmediatamente antes de la sección del calendario mensual.
- **RF-4.2** El sistema deberá mantener el calendario mensual y su navegación sin cambios.
- **RF-4.3** El sistema deberá mostrar ambas vistas en la misma página, sin sustituir una por la otra.

### RF-5 — Leyenda

El mapa incluirá una leyenda que relacione cada estado con su significado: sin sesión, los cuatro niveles de minutos y el estado "no transcurrido".

Criterios de aceptación:

- **RF-5.1** El sistema deberá mostrar una leyenda con el estado vacío, los cuatro niveles de intensidad y el estado "no transcurrido".
- **RF-5.2** La leyenda deberá indicar el rango de minutos de cada nivel y el significado de "no transcurrido".
- **RF-5.3** El sistema deberá mostrar la leyenda también cuando el periodo no tenga minutos registrados.
- **RF-5.4** Todos los textos de la leyenda deberán estar en español.

### RF-6 — Solo lectura

El mapa será una vista de consulta. No permitirá abrir detalles, navegar, filtrar, editar ni borrar sesiones. Las etiquetas accesibles de RF-10 no son interacción.

Criterios de aceptación:

- **RF-6.1** Cuando la persona interactúe con una celda, el sistema no deberá abrir detalles, navegar ni modificar sesiones.
- **RF-6.2** El sistema no deberá añadir, editar ni borrar sesiones desde el mapa.
- **RF-6.3** El sistema no deberá guardar datos nuevos para construir el mapa.

### RF-7 — Actualización

El mapa se recalculará al cargar la página, al guardar cualquier sesión y al volver a mostrar la página después de haber estado oculta. Guardar incluye terminar el temporizador y cancelar con 8 minutos o más. No habrá actualización automática a medianoche mientras la página permanezca visible.

Criterios de aceptación:

- **RF-7.1** Cuando se guarde una sesión, el sistema deberá actualizar el mapa sin recargar la página.
- **RF-7.2** Cuando se cancele una sesión sin guardarla, el sistema no deberá modificar el mapa.
- **RF-7.3** Cuando se cargue la página, el sistema deberá calcular el mapa con las sesiones disponibles.
- **RF-7.4** Cuando la página vuelva a mostrarse tras haber estado oculta, el sistema deberá recalcular el mapa.
- **RF-7.5** El sistema deberá tomar la fecha de referencia en cada recálculo, sin usar una fecha congelada de una carga anterior.
- **RF-7.6** Cuando la cancelación guarde la sesión por alcanzar 8 minutos o más, el sistema deberá actualizar el mapa como cualquier otro guardado.

### RF-8 — Periodo sin minutos registrados

Si ningún día del periodo tiene minutos válidos mayores que 0, el mapa mostrará la cuadrícula completa, con todos los días transcurridos en estado vacío y los futuros como "no transcurrido", y el mensaje "Aún no hay minutos registrados en estas 12 semanas." La leyenda y el resumen seguirán visibles.

Criterios de aceptación:

- **RF-8.1** Si ningún día del periodo tiene minutos válidos mayores que 0, el sistema deberá mostrar la cuadrícula completa, con los días transcurridos en estado vacío y los futuros como "no transcurrido".
- **RF-8.2** El sistema deberá mostrar el mensaje "Aún no hay minutos registrados en estas 12 semanas."
- **RF-8.3** El sistema deberá mantener visibles la leyenda y el resumen en este caso.
- **RF-8.4** Si solo hay sesiones futuras, de 0 minutos o inválidas, el sistema deberá aplicar el mismo estado vacío, el mismo estado "no transcurrido" para los días futuros y el mismo mensaje.

### RF-9 — Datos ilegibles

Si el conjunto de datos guardados no se puede leer, el mapa mostrará la cuadrícula con los días transcurridos en estado vacío y los futuros como "no transcurrido", y el mensaje "No se pudieron leer las sesiones guardadas." El resto del diario seguirá funcionando. Los registros individuales inválidos no activan este estado: se ignoran según RF-2. El valor ilegible se conserva íntegro en una copia de respaldo antes de reemplazar la clave principal.

Criterios de aceptación:

- **RF-9.1** Si el conjunto de datos guardados no se puede leer, el sistema deberá mostrar la cuadrícula con los días transcurridos en estado vacío y los futuros como "no transcurrido", y el mensaje "No se pudieron leer las sesiones guardadas."
- **RF-9.2** Si solo algunos registros son inválidos, el sistema deberá ignorarlos y mostrar los registros válidos.
- **RF-9.3** El sistema no deberá corregir ni borrar los datos ilegibles; si necesita escribir datos nuevos, conservará antes una copia íntegra en una clave de respaldo.
- **RF-9.4** El resto del diario deberá seguir funcionando aunque el mapa muestre el estado de error.
- **RF-9.5** Cuando no se puedan leer los datos, el resumen deberá mostrar "—" en los valores que no se pueden calcular.

### RF-10 — Resumen y accesibilidad

La sección mostrará un resumen textual del periodo y cada celda tendrá una etiqueta accesible con su fecha y su estado.

Criterios de aceptación:

- **RF-10.1** El sistema deberá mostrar un resumen con el formato "Periodo: 12 semanas · Días con estudio: N · Minutos totales: M."
- **RF-10.2** El sistema deberá contar como día con estudio cada día del periodo con minutos válidos mayores que 0, sin contar días futuros.
- **RF-10.3** El sistema deberá sumar en "Minutos totales" solo los minutos válidos del periodo.
- **RF-10.4** Cada celda deberá ofrecer una etiqueta accesible con la fecha y uno de estos estados: "[N] minutos", "sin sesión" o "no transcurrido".
- **RF-10.5** El sistema deberá ofrecer el resumen y las etiquetas accesibles en español.
- **RF-10.6** El sistema deberá mostrar N y M como números; si M tiene decimales, conservará su valor exacto usando la coma decimal.

## 5. Requisitos no funcionales

- **RNF-1 — Accesibilidad:** la información no dependerá solo del color. Los niveles se distinguirán también por luminosidad; el texto de la leyenda y el resumen tendrán contraste mínimo 4,5:1, y las celdas, incluidos los rellenos de los cinco estados, 3:1 contra el fondo. La vista deberá funcionar con zoom al 200 %, texto grande y modo de alto contraste; en este último se mantendrán bordes visibles y etiquetas accesibles.
- **RNF-2 — Responsive:** las 12 semanas deberán caber en una pantalla de 375 px de ancho sin desplazamiento horizontal, con celdas de al menos 10 × 10 px. Si las etiquetas de mes o día impiden el ajuste, se podrán ocultar las menos prioritarias, pero el resumen y la leyenda permanecerán visibles.
- **RNF-3 — Rendimiento:** el mapa deberá estar visible en 100 ms o menos tras la carga o el guardado en el equipo de referencia.
- **RNF-4 — Integridad:** el mapa no modificará, corregirá ni eliminará sesiones; solo leerá la información existente.
- **RNF-5 — Fechas:** se usará siempre la fecha local; nunca se desplazará un día por usar UTC. Se admitirán años bisiestos y cambios de mes o año.
- **RNF-6 — Idioma:** todos los textos visibles estarán en español.
- **RNF-7 — Simplicidad:** la funcionalidad no añadirá dependencias ni pasos de compilación; la lógica de cálculo deberá poder probarse con tests automáticos usando el runner nativo del proyecto, sin instalar paquetes.
- **RNF-8 — Consistencia:** el mapa respetará las mismas reglas de fechas y datos que el resto del diario; las fechas futuras nunca contarán.
- **RNF-9 — Determinismo:** el cálculo del periodo y de los minutos diarios deberá ser una función pura, recibir la fecha de referencia como dato de entrada y no depender de la interfaz, para poder probarse con fechas fijas.
- **RNF-10 — Sincronización:** no habrá sincronización en vivo entre pestañas; el mapa se actualizará al volver a mostrar la página, según RF-7.4.

## 6. Casos límite

- Límites con decimales: 29,9 → nivel 1; 30,0 → nivel 2; 59,9 → nivel 2; 60,0 → nivel 3; 89,9 → nivel 3; 90,0 → nivel 4.
- Día con varias sesiones: se suman y el total decide el nivel.
- Día sin sesiones válidas: estado vacío.
- Día con solo sesiones de 0 minutos o inválidas: estado vacío.
- Día futuro dentro de la semana actual: "no transcurrido"; no cuenta como día estudiado.
- Sesión con fecha futura: se excluye; si es la única, el periodo queda vacío.
- Solo sesiones futuras, de 0 minutos o inválidas: estado vacío y mensaje de RF-8.
- Semana actual parcial: si hoy es lunes, solo el lunes se evalúa y los otros seis días son "no transcurrido"; si hoy es domingo, se evalúan los siete.
- Primera columna: una sesión del domingo anterior al primer lunes no aparece en el mapa.
- Semana que cruza de mes o de año: se muestra correctamente, sin perder días.
- Cambio de año en las etiquetas: se muestra el año en la primera etiqueta y en diciembre y enero, por ejemplo "dic 2025" y "ene 2026".
- Año bisiesto: el 29 de febrero se muestra en su columna y se cuenta como un día normal.
- Cambio de hora o sesión cerca de medianoche: se usa la fecha local en el momento del recálculo.
- Página abierta al cambiar el día: no se actualiza sola a medianoche; se recalcula al guardar o al volver a mostrar la página.
- Conjunto de datos ilegible: estado de error de RF-9; el resto del diario sigue funcionando.
- Almacenamiento no disponible: mismo estado de error de RF-9.
- Registros individuales inválidos: se ignoran y los válidos siguen contando.
- Otra pestaña guarda una sesión: no hay sincronización en vivo; al volver a esta pestaña se recalcula.
- Sesión muy larga, por ejemplo 600 minutos: nivel 4.
- Primera semana del periodo sin sesiones: celdas vacías.
- El calendario mensual sigue navegando con normalidad aunque el mapa esté vacío.
- Lector de pantalla, zoom al 200 %, alto contraste o monocromo: se aplican RF-10 y RNF-1.
- Los días futuros no cuentan para "Días con estudio" ni para "Minutos totales".

## 7. Fuera de alcance

- Tooltips, clics, detalle por día, navegación o filtros desde el mapa.
- Editar o borrar sesiones desde el mapa.
- Cambiar el calendario mensual, la racha o la lista de sesiones.
- Añadir campos nuevos a las sesiones o cambiar su formato.
- Objetivos diarios configurables, umbrales personalizados o comparación con metas.
- Mapa de 52 semanas, selector de periodo, rangos personalizados o comparación entre periodos.
- Exportar, sincronizar, compartir o enviar datos a un servidor.
- Importar sesiones desde otros formatos.
- Sincronización en vivo entre pestañas.
- Actualización automática a medianoche mientras la página permanece visible.
- Corregir o reparar datos inválidos.
- Animaciones, transiciones o efectos decorativos.
- Cambios de tema visual o modo oscuro.
- Traducciones a otros idiomas.
- Un registro de errores o historial de intentos de lectura.

## 8. Criterios de finalización

La funcionalidad se considerará terminada cuando:

- El mapa muestre 12 semanas naturales desde el lunes definido en RF-1.2 hasta la semana actual, de lunes a domingo.
- Los días futuros usen el estado "no transcurrido" y no se confundan con días vacíos.
- Los minutos diarios se sumen correctamente y los cinco estados respeten los umbrales, incluidos los decimales.
- Las sesiones inválidas se ignoren individualmente y los datos ilegibles muestren el estado de error de RF-9.
- La leyenda explique los estados y el resumen muestre días con estudio y minutos totales.
- La sección aparezca antes del calendario mensual, que sigue funcionando.
- El mapa sea de solo lectura y no altere datos.
- El periodo sin minutos registrados muestre la cuadrícula con los días transcurridos vacíos, los futuros como "no transcurrido", el mensaje, la leyenda y el resumen.
- El mapa se actualice al cargar, al guardar y al volver a mostrar la página.
- Las fechas futuras no cuenten y las fechas locales sean correctas, incluidos años bisiestos y cruces de año.
- La vista quepa a 375 px sin desplazamiento horizontal y mantenga el resumen y la leyenda.
- La información sea comprensible sin depender solo del color, con etiquetas accesibles por celda.
- Los tests automáticos de la lógica estén en verde con el runner nativo del proyecto.
- La consola del navegador no muestre errores durante la verificación.

## 9. Dudas abiertas

Ninguna. Todas las decisiones de esta versión están cerradas.
