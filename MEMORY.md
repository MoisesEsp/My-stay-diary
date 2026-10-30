# MEMORY.md — Diario de Estudio
Memoria del proyecto entre sesiones. Máximo ~50 líneas: resume o elimina lo que ya no
aporte.
## Estado actual
- v1 funcionando: registrar sesiones (fecha, tema, minutos), racha actual, mejor racha,
total de minutos de la semana, días estudiados en el mes, lista de sesiones y calendario
mensual. Modo temporizador.
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
## Aprendizajes y errores a evitar
- (vacío por ahora)
## Próximos pasos
- (vacío por ahora)
