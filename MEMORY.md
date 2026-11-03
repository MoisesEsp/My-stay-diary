# MEMORY.md — Diario de Estudio
Memoria del proyecto entre sesiones. Máximo ~50 líneas: resume o elimina lo que ya no
aporte.
## Estado actual
- v1 funcionando: registrar sesiones (fecha, tema, minutos), racha actual, mejor racha,
total de minutos de la semana, días estudiados en el mes, lista de sesiones y calendario
mensual. Modo temporizador. Código JS en inglés; textos en español.
- Datos en localStorage.
## Decisiones (y por qué)
- Sin backend ni dependencias: cualquiera debe poder abrirlo con doble clic.
- La fecha del formulario está bloqueada a la de hoy (readonly, con aviso al pulsar):
sustituye a la antigua fecha editable. Para registrar otro día, cambiar la fecha del equipo.
- Calendario: mes actual acotado al rango, semana empezando en lunes, marca días con sesión,
excluye futuros y navega entre el primer y el último mes con registros.
- Temporizador: al cancelar se guarda el tiempo realizado (floor); si no llega a 8 minutos se
pide confirmación y, si se cancela, no se guarda. Un solo botón Pausar/Reanudar. Sonido de
cañón sintetizado con Web Audio (sin archivos). No persiste al recargar.
- Mejor racha = secuencia consecutiva más larga del historial; excluye fechas futuras e
incluye la racha actual cuando es la mayor.
- Total semanal: suma de minutos entre el lunes y hoy (semana natural, fecha local); varias
sesiones el mismo día se suman y los futuros no cuentan. No se persiste nada nuevo.
- Días del mes: días distintos con sesión del día 1 a hoy (mes natural, fecha local); varias
sesiones el mismo día cuentan una vez, los futuros no cuentan y siempre es el mes actual,
aunque se navegue en el calendario.
- Diseño "cuaderno de estudio": papel cuadriculado, tinta verde y subrayador amarillo; serif
para títulos y números, sans para la interfaz y mono para fechas y cronómetro. Sin fuentes
externas ni imágenes, para que siga funcionando con doble clic.
- El repo versiona `.agents/`, `.opencode/` y `skills-lock.json` como muestra del flujo de
trabajo con IA. No forman parte de la web ni deben afectar al doble clic.
- Chrome DevTools MCP en `opencode.json` (paquete `@async23/...`) conecta con un Chromium
que escuche CDP en `127.0.0.1:9222`; sin ese navegador las herramientas fallan. Snapshot y
captura de viewport funcionan; la captura a página completa puede agotar el tiempo.
- Constitución en `docs/constitution.md`. La lógica se adaptó: identificadores y comentarios
en inglés, cálculos puros con `today` como parámetro y tests con `node --test`.
- `tests/logic.test.js` cubre fechas, rachas, semana, mes y migración de datos.
## Aprendizajes y errores a evitar
- OpenCode V2 exige `mcp.servers` con `type: "local"` y `command` como array. El formato
`mcpServers` de Claude Desktop no se lee.
- Un JSON inválido en `opencode.json` hace que OpenCode descarte el archivo entero y muestre
«No MCP servers configured»; conviene validarlo con `node -e JSON.parse`.
- En este equipo el navegador está en `/usr/bin/chromium` y el puerto 9222 responde con
HeadlessChrome; se puede lanzar con `chromium --remote-debugging-port=9222`.
- Probado con Chrome DevTools MCP: 3 sesiones (hoy, ayer y anteayer) → racha 3, mejor racha
3, 75 min, consola limpia y 375 px sin desbordamiento. Plural «1 día / días este mes»
corregido y probado con 1 y 3 días.
- (vacío por ahora)
## Próximos pasos
- (vacío por ahora)
