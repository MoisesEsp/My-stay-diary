# MEMORY.md — Diario de Estudio
Memoria del proyecto entre sesiones. Máximo ~50 líneas: resume o elimina lo que ya no
aporte.
## Estado actual
- v1 funcionando: registrar sesiones (fecha, tema, minutos), racha actual, mejor racha,
lista de sesiones y calendario del mes.
- Datos en localStorage.
## Decisiones (y por qué)
- Sin backend ni dependencias: cualquiera debe poder abrirlo con doble clic.
- La fecha del formulario está bloqueada a la de hoy (readonly, con aviso al pulsar):
sustituye a la antigua fecha editable. Para registrar otro día, cambiar la fecha del equipo.
- Calendario: mes actual acotado al rango, semana empezando en lunes, marca días con sesión,
excluye futuros y navega entre el primer y el último mes con registros.
- Mejor racha = secuencia consecutiva más larga del historial; excluye fechas futuras e
incluye la racha actual cuando es la mayor.
## Aprendizajes y errores a evitar
- (vacío por ahora)
## Próximos pasos
- (vacío por ahora)
