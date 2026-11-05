# MEMORY.md — Diario de Estudio
Memoria entre sesiones. Máximo ~50 líneas; resume o elimina lo que ya no aporte.
## Estado actual
- v1 funcionando: registrar sesiones (fecha, tema, minutos), racha actual y mejor, total
semanal, días del mes, lista, calendario, mapa de calor de 12 semanas, modo temporizador y
objetivo semanal en tarjeta propia. Datos en localStorage; JS en inglés y textos en español.
## Decisiones (y por qué)
- Sin backend ni dependencias: cualquiera debe poder abrirlo con doble clic.
- La fecha del formulario está bloqueada a la de hoy (readonly, con aviso al pulsar):
sustituye a la antigua fecha editable. Para registrar otro día, cambiar la fecha del equipo.
- Calendario: mes actual acotado al rango, semana empezando en lunes, marca días con sesión,
excluye futuros y navega entre el primer y el último mes con registros.
- Temporizador: al cancelar se guarda el tiempo realizado (floor); si no llega a 8 minutos se
pide confirmación y, si se cancela, no se guarda. Un solo botón Pausar/Reanudar. Sonido de
cañón sintetizado con Web Audio (sin archivos). No persiste al recargar.
- Mejor racha = secuencia consecutiva más larga del historial; excluye futuras e incluye la
racha actual cuando es la mayor.
- Total semanal: suma de minutos entre el lunes y hoy (semana natural, fecha local); varias
sesiones del día se suman y los futuros no cuentan.
- Días del mes: días distintos con sesión del 1 a hoy (mes natural); siempre el mes actual,
aunque se navegue en el calendario.
- Mapa de calor (spec 001): 12 semanas, umbrales 30/60/90, "no transcurrido", resumen
accesible, solo lectura, paleta azul de alto contraste; importar queda fuera; error y respaldo.
- Objetivo semanal (spec 002): único, en minutos, entero 1–10.080, sin migración; clave
independiente `diario-estudio-objetivo` (`{"minutes":600}`) y respaldo
`diario-estudio-objetivo-respaldo` (con marca de tiempo si ya existe) antes de reemplazar un
valor ilegible. El progreso reutiliza `calculateWeekMinutes`; no hay mensaje de confirmación ni
celebración (RF-1.8, RF-4.7) y un objetivo ilegible se trata como «sin objetivo».
- Con sesiones ilegibles, «— min» en la tarjeta superior y en el progreso del objetivo, más
«No se puede calcular el progreso.»; el cálculo no cambia, solo la presentación.
- Diseño "cuaderno de estudio": papel cuadriculado, tinta verde y subrayador amarillo; serif
para títulos y números, sans para la interfaz y mono para fechas y cronómetro.
- El repo versiona `.agents/`, `.opencode/` y `skills-lock.json` como muestra del flujo con IA.
- Chrome DevTools MCP en `opencode.json` conecta con un Chromium en `127.0.0.1:9222`; sin ese
navegador las herramientas fallan. Snapshot y captura de viewport van bien; la de página
completa puede agotar el tiempo.
- Constitución en `docs/constitution.md`; `tests/logic.test.js` cubre fechas, rachas, semana,
mes, migración, mapa de calor y objetivo semanal (46 tests, `node --test`).
## Aprendizajes y errores a evitar
- OpenCode V2 exige `mcp.servers` con `type: "local"` y `command` como array; el formato
`mcpServers` de Claude Desktop no se lee.
- Un JSON inválido en `opencode.json` hace que OpenCode descarte el archivo entero; validarlo
con `node -e JSON.parse`.
- En este equipo el navegador está en `/usr/bin/chromium`; se lanza con
`chromium --remote-debugging-port=9222`.
- Verificado con MCP: racha 3, 75 min, mapa 84 celdas, consola limpia, 375 px sin
desbordamiento y `forced-colors` solo por CSS.
## Próximos pasos
- Spec 002 implementada y verificada (T-01 a T-10); pendiente validación formal y commit.
- Spec 001 cerrada y publicada; pendiente versionar la skill y los comandos SDD.
