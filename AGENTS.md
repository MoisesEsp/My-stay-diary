# AGENTS.md — Diario de Estudio
Web estática para registrar sesiones de estudio y motivarse viendo la racha de días
seguidos. Proyecto didáctico: el código debe poder entenderlo alguien que empieza a
programar.
## Stack y estructura
- HTML, CSS y JavaScript puros: sin frameworks, librerías, npm, bundler ni build.
- `index.html` (estructura), `styles.css` (estilos), `app.js` (lógica y datos).
- Debe funcionar abriendo `index.html` con doble clic (`file://`): nada de módulos ES
(`type="module"`), `fetch` a archivos locales ni nada que requiera servidor.
## Convenciones
- Textos de la interfaz en español.
- Código simple, nombres descriptivos y comentarios solo donde aporten.
- Diseño limpio y responsive; cualquier pantalla nueva debe verse bien en el móvil.
## Datos
- localStorage, clave `diario-estudio-sesiones`: array de `{ date: "AAAA-MM-DD", topic,
minutes }`.
- Si cambias la forma de los datos, mantén compatibilidad con lo ya guardado o el usuario
perderá sus sesiones.
## Fechas y racha (fácil equivocarse)
- Trabaja siempre con la fecha local del usuario. Nunca uses `toISOString()` ni `new
Date("AAAA-MM-DD")`: se interpretan en UTC y desplazan el día.
- Racha = días consecutivos con al menos 1 sesión que terminan hoy. Si hoy no hay sesión
pero ayer sí, la racha sigue viva y se cuenta desde ayer.
- Varias sesiones el mismo día cuentan como un solo día. Las fechas futuras no suman.
- Mejor racha = la secuencia más larga de días consecutivos con al menos 1 sesión en todo
  el historial. No usa la regla de "ayer sigue viva" (eso es solo para la racha actual).
  Excluye las fechas futuras e incluye la racha actual cuando es la más larga.
- El formulario solo registra la fecha actual del equipo: el campo de fecha está bloqueado
  (readonly) y al pulsarlo se muestra un aviso. No se permiten registros pasados ni futuros.
## Calendario
- Muestra el mes que se está viendo, con la semana empezando en lunes.
- Marca los días con al menos 1 sesión (fecha local) y excluye las fechas futuras.
- La navegación va del mes del primer registro al del último, sin pasar del mes actual; los
  meses intermedios sin datos se muestran vacíos y los botones se desactivan en los extremos.
## Temporizador de sesión
- El botón del formulario es "Iniciar sesión": al pulsarlo arranca una cuenta atrás (MM:SS)
  con los minutos indicados. Mientras corre, ese botón se oculta y aparecen un único botón
  Pausar/Reanudar y otro Cancelar. Tema y minutos quedan bloqueados durante la sesión.
- Al terminar la cuenta atrás se guarda la sesión con los minutos completos, se muestra
  "¡Tiempo terminado!" y suena un breve sonido de cañón (Web Audio, sin archivos externos).
- Al cancelar se guarda el tiempo realizado = minutos originales - minutos restantes,
  redondeando hacia abajo (floor). Si el tiempo realizado NO llega a 8 minutos, la cuenta se
  pausa y se pide confirmación: "Continuar la sesión" o "Cancelar la sesión definitivamente"
  (en este último caso no se guarda nada). Una sesión de menos de 8 minutos nunca se guarda.
- El estado del temporizador no persiste al recargar la página.
## Forma de trabajar
- Haz solo lo que se pide: no añadas funcionalidades por tu cuenta.
- Cambios pequeños y enfocados; no reescribas lo que ya funciona.
- Al terminar, resume qué has cambiado y cualquier decisión que deba revisar.
- Antes de hacer commit o push, muestra siempre el mensaje de commit propuesto y
  espera el OK del usuario. No hagas commit ni push sin su aprobación explícita.
## Memoria
- Al empezar, lee `MEMORY.md` para conocer el estado del proyecto y las decisiones
tomadas.
- Al terminar una tarea, actualízalo: estado actual, decisiones importantes (con su
porqué) y errores a evitar.
- Mantenlo breve (máximo ~50 líneas): resume o elimina lo que ya no aporte.
- Si algo se convierte en una regla permanente, propón moverlo a `AGENTS.md` en lugar de
dejarlo en la memoria.
- No guardes nunca datos sensibles (claves, tokens, datos personales)
## Límites
- ✅ Siempre: respetar las reglas de fechas y racha, mantener los textos en español.
- ✅ Siempre: actualizar `MEMORY.md` al terminar cada tarea.
- ⚠️ Pregunta antes: crear archivos nuevos, cambiar el formato de los datos guardados.
- 🚫 Nunca: añadir dependencias, frameworks o un paso de build.
## Verificación
- No hay tests ni lint. Probar abriendo `index.html` en el navegador.
- Para empezar de cero: DevTools → Application → Local Storage → borrar la clave
`diario-estudio-sesiones`.

