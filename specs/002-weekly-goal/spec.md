# Especificación 002 — Objetivo semanal de estudio
Estado: implementada

## 1. Contexto y objetivo

El Diario de Estudio ya muestra el total de minutos estudiados en la semana actual, además de la racha, el calendario, la lista de sesiones y el mapa de calor. Ese total informa de lo hecho, pero no de lo que la persona se había propuesto hacer.

Esta funcionalidad añade un objetivo semanal expresado en minutos: la persona puede fijar cuántos minutos quiere estudiar a la semana, consultar cuánto lleva acumulado en la semana actual y cambiar o quitar ese objetivo. El objetivo es único y se repite igual todas las semanas hasta que se cambie o se quite. La información se reúne en una tarjeta propia, independiente de la tarjeta superior de racha y total semanal. El propósito es motivar el estudio mostrando la distancia entre lo propuesto y lo conseguido, y saber cuándo se alcanza la meta.

El objetivo es un dato nuevo e independiente de las sesiones. No crea, modifica ni reinterpreta sesiones, y no cambia el cálculo del total semanal existente. El progreso es una vista derivada de las sesiones ya guardadas.

## 2. Usuarios

- **Usuario principal:** la persona que usa el diario en su equipo y registra sus sesiones de estudio. Quiere marcarse una meta semanal y comprobar su avance sin hacer cuentas.
- **Contexto de uso:** una sola persona por equipo. No hay cuentas, roles ni permisos; cualquier persona con acceso al equipo puede consultar el diario, registrar sesiones y fijar o cambiar el objetivo.

## 3. Historias de usuario

- **US-1:** Como estudiante, quiero fijar cuántos minutos quiero estudiar cada semana para tener una meta concreta.
- **US-2:** Como estudiante, quiero ver cuántos minutos llevo esta semana frente a mi objetivo para saber si voy por buen camino.
- **US-3:** Como estudiante, quiero cambiar mi objetivo cuando mis circunstancias cambien, para que la meta siga siendo realista.
- **US-4:** Como estudiante, quiero poder quitar el objetivo para volver a usar el diario sin una meta marcada.
- **US-5:** Como estudiante, quiero que la aplicación me indique de forma clara cuándo he alcanzado el objetivo, para saber si lo he cumplido.
- **US-6:** Como estudiante, quiero que mi objetivo siga ahí al recargar la página o volver otro día, para no tener que volver a escribirlo.
- **US-7:** Como persona que usa lector de pantalla o amplía el texto, quiero fijar el objetivo y entender mi progreso sin depender del color, para usar la funcionalidad en igualdad de condiciones.

## 4. Definiciones

- **Objetivo semanal:** cantidad de minutos que la persona quiere estudiar en una semana. Se expresa siempre en minutos.
- **Objetivo vigente:** el único objetivo guardado por la persona. Se aplica a cualquier semana hasta que se cambie o se quite.
- **Tarjeta del objetivo:** tarjeta propia situada inmediatamente después de la tarjeta superior de racha y total semanal y antes de la sección «Nueva sesión», donde se muestran el objetivo, el progreso y sus controles.
- **Semana actual:** semana natural que empieza en lunes y termina en domingo y que contiene hoy, según la fecha local del equipo.
- **Progreso semanal:** suma de los minutos de las sesiones con fecha local desde el lunes de la semana actual hasta hoy, ambos incluidos. Las sesiones futuras no cuentan y varias sesiones del mismo día se suman. Coincide con el total semanal que ya muestra el diario.
- **Objetivo alcanzado:** existe un objetivo vigente y el progreso semanal es igual o mayor que ese objetivo.
- **Sin objetivo:** no hay ningún objetivo guardado.

## 5. Requisitos funcionales

### RF-1 — Fijar el objetivo

La persona podrá fijar un objetivo semanal en minutos desde la propia página, sin pasos externos.

Criterios de aceptación:

- **RF-1.1** El sistema deberá ofrecer en la tarjeta del objetivo una forma visible de fijar un objetivo semanal en minutos.
- **RF-1.2** CUANDO la persona confirme un número entero de minutos entre 1 y 10.080, EL SISTEMA deberá guardarlo como objetivo vigente y mostrarlo.
- **RF-1.3** El sistema deberá mostrar el objetivo con el formato «N min».
- **RF-1.4** SI el valor introducido no es un número entero entre 1 y 10.080, incluidos 0, los negativos, los decimales, el texto y los valores fuera del rango, ENTONCES EL SISTEMA no deberá guardarlo, conservará el objetivo anterior si existía y mostrará el mensaje «El objetivo debe ser un número entero de minutos entre 1 y 10.080».
- **RF-1.5** El sistema deberá permitir fijar un objetivo aunque todavía no exista ninguna sesión guardada.
- **RF-1.6** El sistema no deberá modificar ninguna sesión al fijar el objetivo.
- **RF-1.7** El sistema deberá mantener un único objetivo vigente; no habrá objetivos distintos por semana.
- **RF-1.8** El sistema no deberá mostrar un mensaje de confirmación al guardar el objetivo.

### RF-2 — Ver el objetivo y el progreso de la semana actual

Cuando exista un objetivo vigente, la aplicación mostrará el objetivo y el progreso de la semana actual de forma comprensible.

Criterios de aceptación:

- **RF-2.1** CUANDO exista un objetivo vigente, EL SISTEMA deberá mostrar en la tarjeta del objetivo el objetivo con el formato «N min» y el progreso con la etiqueta «Minutos esta semana: N min», distinta de la etiqueta del total de la tarjeta superior.
- **RF-2.2** El sistema deberá calcular el progreso con la fecha local del equipo, desde el lunes de la semana actual hasta hoy, sin incluir fechas futuras.
- **RF-2.3** CUANDO haya varias sesiones en un mismo día de la semana actual, EL SISTEMA deberá sumar sus minutos al progreso.
- **RF-2.4** SI la semana actual no tiene sesiones, ENTONCES EL SISTEMA deberá mostrar «Minutos esta semana: 0 min».
- **RF-2.5** El sistema deberá usar para el progreso el mismo total semanal que ya muestra el diario, sin alterar su cálculo ni su significado.
- **RF-2.6** CUANDO se guarde una sesión, EL SISTEMA deberá actualizar el progreso sin recargar la página.
- **RF-2.7** CUANDO se cargue la página o vuelva a mostrarse tras haber estado oculta, EL SISTEMA deberá recalcular el progreso con la fecha local del momento.
- **RF-2.8** El sistema deberá mostrar el progreso mediante texto y números legibles, no solo mediante color o forma.
- **RF-2.9** CUANDO se pase de una semana a otra, EL SISTEMA deberá mantener el objetivo vigente y, en el siguiente recálculo, reiniciar el progreso a 0 minutos, contando solo las sesiones de la nueva semana.
- **RF-2.10** El sistema deberá mostrar la tarjeta del objetivo inmediatamente después de la tarjeta superior de racha y total semanal y antes de la sección «Nueva sesión», sin cambiar el orden del resto de secciones.
- **RF-2.11** CUANDO el progreso tenga decimales, EL SISTEMA deberá mostrarlo con coma decimal y el sufijo «min», por ejemplo «99,5 min».

### RF-3 — Cambiar y quitar el objetivo

La persona podrá sustituir el objetivo vigente por otro o eliminarlo.

Criterios de aceptación:

- **RF-3.1** CUANDO exista un objetivo vigente, EL SISTEMA deberá ofrecer en la tarjeta del objetivo una forma visible de cambiarlo.
- **RF-3.2** CUANDO la persona confirme un nuevo valor válido según RF-1, EL SISTEMA deberá reemplazar el objetivo anterior por el nuevo y recalcular la comparación con el progreso.
- **RF-3.3** CUANDO exista un objetivo vigente, EL SISTEMA deberá ofrecer en la tarjeta del objetivo una forma visible de quitarlo.
- **RF-3.4** CUANDO la persona elija quitar el objetivo, EL SISTEMA deberá dejarlo sin definir y dejar de mostrar la comparación y el estado de cumplimiento.
- **RF-3.5** El sistema no deberá modificar ni eliminar sesiones al cambiar o quitar el objetivo.
- **RF-3.6** CUANDO se quite el objetivo, EL SISTEMA deberá mantener visible la tarjeta del objetivo con el total de minutos de la semana actual y la invitación de RF-5.2.

### RF-4 — Alcanzar el objetivo

Mientras exista un objetivo vigente, la aplicación comparará el progreso con el objetivo y mostrará si se ha alcanzado.

Criterios de aceptación:

- **RF-4.1** MIENTRAS el progreso semanal sea menor que el objetivo, EL SISTEMA deberá mostrar el estado «Objetivo no alcanzado».
- **RF-4.2** CUANDO el progreso semanal sea igual o mayor que el objetivo, EL SISTEMA deberá mostrar un estado visible con el texto «Objetivo alcanzado» y el progreso real.
- **RF-4.3** CUANDO el progreso semanal sea mayor que el objetivo, EL SISTEMA deberá seguir mostrando el progreso real sin recortarlo al valor del objetivo.
- **RF-4.4** El sistema deberá distinguir el estado de objetivo alcanzado mediante texto, no solo mediante color.
- **RF-4.5** CUANDO se alcance el objetivo, EL SISTEMA no deberá modificar ni duplicar sesiones.
- **RF-4.6** CUANDO cambie el objetivo, EL SISTEMA deberá volver a evaluar el estado de cumplimiento con el progreso actual.
- **RF-4.7** El sistema no deberá añadir resaltado especial, sonido ni animación al alcanzar el objetivo; la respuesta será únicamente el estado y el texto.

### RF-5 — Sin objetivo definido

Si no existe un objetivo vigente, la aplicación no inventará una comparación ni un estado de cumplimiento.

Criterios de aceptación:

- **RF-5.1** SI no existe un objetivo vigente, ENTONCES EL SISTEMA no deberá mostrar progreso frente a objetivo ni estado de objetivo alcanzado.
- **RF-5.2** SI no existe un objetivo vigente, ENTONCES la tarjeta del objetivo deberá permanecer visible con el total de minutos de la semana actual, la invitación con el texto «Todavía no has fijado un objetivo semanal.» y un botón «Fijar objetivo».
- **RF-5.3** SI no existe un objetivo vigente, ENTONCES el resto del diario deberá seguir funcionando sin cambios, incluido el total de minutos de la semana actual de la tarjeta superior.

### RF-6 — Persistencia e integridad

El objetivo deberá conservarse entre recargas y visitas en el mismo navegador y equipo, sin afectar a los datos existentes.

Criterios de aceptación:

- **RF-6.1** CUANDO la persona fije o cambie el objetivo y la operación se complete, EL SISTEMA deberá conservarlo al recargar la página, en visitas posteriores y en las semanas siguientes, desde el mismo navegador y equipo, hasta que se cambie o se quite.
- **RF-6.2** El sistema deberá conservar las sesiones existentes con su forma y significado actuales; el objetivo se guardará de forma independiente.
- **RF-6.3** SI los datos de sesiones guardados no se pueden leer, ENTONCES EL SISTEMA deberá mantener visible la tarjeta del objetivo, mostrar «No se puede calcular el progreso.» y mostrar «— min» en lugar de una cifra de progreso; además, el total semanal de la tarjeta superior también deberá mostrar «— min» y no «0 min». Este comportamiento es solo la presentación del estado de error y no altera el cálculo del total semanal.
- **RF-6.4** SI el objetivo guardado no se puede interpretar o no es válido, ENTONCES EL SISTEMA deberá tratarlo como sin objetivo y ofrecer fijarlo de nuevo, sin modificar ni eliminar las sesiones.
- **RF-6.5** SI el sistema debe reemplazar un valor de objetivo ilegible, ENTONCES deberá conservar antes una copia íntegra del valor original.
- **RF-6.6** SI no se puede guardar el objetivo, ENTONCES EL SISTEMA deberá mostrar un mensaje de error en español y mantener el objetivo anterior si existía.

### RF-7 — Accesibilidad

La funcionalidad deberá poder usarse y entenderse con teclado, lector de pantalla, zoom y preferencias de contraste.

Criterios de aceptación:

- **RF-7.1** El sistema deberá asociar una etiqueta en español al campo de minutos del objetivo.
- **RF-7.2** El sistema deberá permitir fijar, cambiar y quitar el objetivo usando solo el teclado.
- **RF-7.3** El sistema deberá anunciar los mensajes de error y los cambios de estado de cumplimiento a las tecnologías de asistencia.
- **RF-7.4** El sistema deberá identificar el objetivo, el progreso y el estado de cumplimiento con texto comprensible en español.
- **RF-7.5** El sistema deberá mantener el foco visible y un orden de tabulación lógico en los controles del objetivo.
- **RF-7.6** El estado de cumplimiento no deberá depender únicamente del color; deberá incluir una etiqueta textual.

### RF-8 — Adaptación a pantallas pequeñasa

La funcionalidad deberá integrarse en la página existente y verse bien en el móvil.

Criterios de aceptación:

- **RF-8.1** El sistema deberá mostrar el objetivo, su edición y el progreso sin provocar desplazamiento horizontal en una pantalla de 375 px de ancho.
- **RF-8.2** El sistema deberá mantener los controles del objetivo visibles y utilizables con pantalla táctil.
- **RF-8.3** El sistema deberá conservar la legibilidad del objetivo y del progreso con zoom al 200 % y con texto ampliado.
- **RF-8.4** El sistema deberá mantener el resto de secciones del diario sin cambios y sin solapamientos.

## 6. Requisitos no funcionales

- **RNF-1 — Simplicidad:** la funcionalidad no añadirá dependencias, librerías ni pasos de compilación; deberá seguir funcionando al abrir el diario sin servidor.
- **RNF-2 — Idioma:** todos los textos visibles y los mensajes estarán en español.
- **RNF-3 — Integridad:** el objetivo no alterará, corregirá ni eliminará sesiones; los datos existentes mantendrán su compatibilidad.
- **RNF-4 — Fechas:** el progreso usará siempre la fecha local del equipo; nunca se desplazará un día por usar UTC. La semana empezará en lunes y las fechas futuras no contarán.
- **RNF-5 — Determinismo:** el cálculo del progreso y del estado de cumplimiento deberá poder realizarse como una función pura que reciba la fecha de referencia como dato de entrada, sin depender de la interfaz.
- **RNF-6 — Accesibilidad:** el contraste del texto y de los controles será de al menos 4,5:1 para texto y 3:1 para elementos no textuales; la información no dependerá solo del color.
- **RNF-7 — Responsive:** la vista deberá caber a 375 px de ancho sin desplazamiento horizontal y mantener los controles utilizables.
- **RNF-8 — Consistencia:** el progreso respetará las mismas reglas de semana, fecha local y exclusión de futuros que el total semanal existente.
- **RNF-9 — Rendimiento:** el objetivo y el progreso deberán estar visibles en 100 ms o menos tras la carga o el guardado en el equipo de referencia.
- **RNF-10 — Sincronización:** no habrá sincronización en vivo entre pestañas; el objetivo y el progreso se actualizarán al cargar, al guardar y al volver a mostrar la página.

## 7. Casos límite

- Progreso exactamente igual al objetivo: estado «Objetivo alcanzado».
- Progreso mayor que el objetivo: se muestra el progreso real y el estado «Objetivo alcanzado»; no se recorta a la meta.
- Progreso de 0 minutos con objetivo definido: estado «Objetivo no alcanzado».
- Progreso con decimales: se compara con el objetivo sin redondear y se muestra con coma decimal, por ejemplo «99,5 min»; 99,5 minutos no alcanzan un objetivo de 100 y 100,0 minutos sí lo alcanzan.
- Objetivo fijado un domingo: el progreso incluye de lunes a domingo de esa misma semana.
- Cambio de semana: el objetivo único sigue vigente y, en el siguiente recálculo tras el cambio de semana, el progreso vuelve a 0 minutos; solo cuentan las sesiones de la semana nueva y el estado pasa a «Objetivo no alcanzado» hasta sumar minutos.
- Sesión guardada justo después de alcanzar el objetivo: el progreso y el estado se actualizan sin recargar.
- Varias sesiones el mismo día: sus minutos se suman una sola vez al progreso, como suma de minutos.
- Sesión con fecha futura: no cuenta para el progreso.
- Sesión con fecha anterior al lunes de la semana actual: no cuenta para el progreso.
- Sin sesiones: «Minutos esta semana: 0 min» si hay objetivo.
- Sin objetivo: la tarjeta del objetivo sigue visible con el total semanal actual, la invitación «Todavía no has fijado un objetivo semanal.» y el botón «Fijar objetivo»; no se muestra comparación ni estado de cumplimiento.
- Objetivo quitado: la tarjeta del objetivo sigue visible con el total semanal actual, la invitación «Todavía no has fijado un objetivo semanal.» y el botón «Fijar objetivo»; desaparece la comparación y no cambian las sesiones ni el total semanal.
- Objetivo cambiado a un valor menor que el progreso actual: el estado pasa a «Objetivo alcanzado» de inmediato.
- Objetivo cambiado a un valor mayor que el progreso actual: el estado pasa a «Objetivo no alcanzado».
- Valor 1: válido; se guarda como objetivo.
- Valor 10080: válido; representa una semana entera de minutos y se guarda como objetivo.
- Valor 10081: inválido; no se guarda, se muestra el mensaje de RF-1.4 y se conserva el objetivo anterior si existía.
- Valor 0: inválido; no se guarda, se muestra el mensaje de RF-1.4 y se conserva el objetivo anterior si existía.
- Valor negativo: inválido; no se guarda, se muestra el mensaje de RF-1.4 y se conserva el objetivo anterior si existía.
- Valor decimal: inválido; no se guarda, se muestra el mensaje de RF-1.4 y se conserva el objetivo anterior si existía.
- Valor de texto o campo vacío: inválido; no se guarda, se muestra el mensaje de RF-1.4 y se conserva el objetivo anterior si existía.
- Objetivo guardado ilegible o con forma desconocida: se trata como sin objetivo, sin tocar las sesiones.
- Datos de sesiones ilegibles: el objetivo sigue visible, se muestra «No se puede calcular el progreso.» y «— min» en la tarjeta del objetivo, y el total semanal de la tarjeta superior también muestra «— min» en lugar de «0 min».
- Almacenamiento no disponible al guardar el objetivo: mensaje de error y se conserva el objetivo anterior.
- Página abierta al cambiar el día: el progreso no se actualiza solo a medianoche; se recalcula al guardar o al volver a mostrar la página.
- Otra pestaña guarda una sesión: no hay sincronización en vivo; al volver a esta pestaña se recalcula.
- Pantalla de 375 px, zoom al 200 %, texto grande, alto contraste o lector de pantalla: se aplican RF-7 y RF-8.

## 8. Fuera de alcance

- Objetivos diarios, mensuales, por tema o por asignatura.
- Varios objetivos simultáneos o varios objetivos por semana.
- Historial de objetivos, comparación entre semanas o informes de cumplimiento.
- Rachas de objetivos cumplidos, insignias, niveles o recompensas.
- Recordatorios, notificaciones, avisos por correo o alarmas.
- Cálculo de objetivos automáticos o recomendados.
- Cambiar el cálculo del total semanal, la racha, el calendario, la lista de sesiones o el mapa de calor; el estado de error de RF-6.3 solo cambia lo que se muestra y no el cálculo.
- Editar o borrar sesiones desde la funcionalidad del objetivo.
- Añadir campos nuevos a las sesiones o cambiar su formato.
- Sincronización entre dispositivos, cuentas, exportación, importación o envío de datos a un servidor.
- Sonidos, animaciones, resaltados especiales o efectos decorativos ligados al cumplimiento.
- Traducciones a otros idiomas.
- Modo oscuro o cambios del tema visual.

## 9. Criterios de finalización

La funcionalidad se considerará terminada cuando:

- Se pueda fijar desde la tarjeta del objetivo un número entero de minutos entre 1 y 10.080.
- Cuando el valor sea inválido, incluidos 0, negativos, decimales, texto y valores fuera del rango, no se guarde, se muestre el mensaje «El objetivo debe ser un número entero de minutos entre 1 y 10.080» y se conserve el objetivo anterior si existía.
- El objetivo se muestre con el formato «N min» y el progreso con la etiqueta «Minutos esta semana: N min»; el progreso se calcule de lunes a hoy con fecha local y sin fechas futuras.
- La tarjeta del objetivo aparezca inmediatamente después de la tarjeta superior de racha y total semanal y antes de la sección «Nueva sesión», sin cambiar el orden del resto de secciones.
- Se pueda cambiar el objetivo y recalcular la comparación.
- Se pueda quitar el objetivo y dejar de mostrar la comparación sin afectar a las sesiones; la tarjeta seguirá visible con el total semanal, la invitación «Todavía no has fijado un objetivo semanal.» y el botón «Fijar objetivo».
- Al alcanzar el objetivo se muestre el estado «Objetivo alcanzado» con el progreso real, mediante texto y sin resaltado especial, sonido ni animación.
- Mientras no se alcance el objetivo se muestre el estado «Objetivo no alcanzado».
- Sin objetivo definido, la tarjeta siga visible con el total semanal actual, la invitación «Todavía no has fijado un objetivo semanal.» y el botón «Fijar objetivo», sin comparación ni estado de cumplimiento.
- El progreso con decimales se muestre con coma decimal, por ejemplo «99,5 min».
- El objetivo único se conserve entre recargas, visitas y semanas en el mismo navegador y equipo, y el progreso vuelva a empezar en el siguiente recálculo tras cada cambio de semana.
- Los datos de sesiones existentes sigan intactos y compatibles, y los datos ilegibles no provoquen pérdidas.
- Cuando las sesiones no se puedan leer, se muestre «No se puede calcular el progreso.» y «— min» en la tarjeta del objetivo, y el total semanal de la tarjeta superior también muestre «— min» en lugar de «0 min».
- El progreso se actualice al cargar, al guardar una sesión y al volver a mostrar la página.
- La funcionalidad sea usable con teclado y lector de pantalla, y quepa a 375 px sin desplazamiento horizontal.
- Todos los textos visibles estén en español.
- Los tests automáticos de la lógica estén en verde con el runner nativo del proyecto.
- La consola del navegador no muestre errores durante la verificación.

## 10. Dudas abiertas

Ninguna. Todas las decisiones de esta versión están cerradas.
