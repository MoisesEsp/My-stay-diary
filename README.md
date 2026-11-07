# Diario de Estudio

Aplicación web estática para registrar sesiones de estudio y ver de un vistazo la
constancia: racha actual, mejor racha, minutos de la semana, días del mes, calendario,
mapa de calor de 12 semanas y objetivo semanal.

Funciona abriendo `index.html` con doble clic: sin instalación, sin servidor, sin
dependencias y sin conexión.

## Funcionalidades

- **Sesiones**: registro de tema y minutos, con la fecha bloqueada al día actual.
- **Temporizador**: cuenta atrás con pausa, reanudación y cancelación. Al cancelar se
  guarda el tiempo realizado; por debajo de 8 minutos pide confirmación y no guarda.
- **Racha actual y mejor racha**: días consecutivos con al menos una sesión.
- **Total semanal y días del mes**: cálculos con fecha local, sin contar fechas futuras.
- **Calendario mensual**: navegación entre los meses con registros.
- **Mapa de calor de 12 semanas**: cinco estados de intensidad, estado «no transcurrido»,
  leyenda y resumen accesible.
- **Objetivo semanal**: entre 1 y 10.080 minutos, con progreso de lunes a hoy y estados
  «Objetivo alcanzado» / «Objetivo no alcanzado».
- **Accesible y responsive**: etiquetas para lectores de pantalla, uso con teclado,
  contraste suficiente y diseño adaptado a 375 px y zoom al 200 %.
- **Datos locales**: todo se guarda en `localStorage`; no hay cuentas ni servidores.

## Cómo usarlo

1. Abre `index.html` en el navegador.
2. Registra una sesión o inicia el temporizador.
3. Opcional: fija un objetivo semanal.

Para empezar de cero, abre DevTools → Application → Local Storage y borra
`diario-estudio-sesiones`, `diario-estudio-objetivo` y sus claves de respaldo
(`*-respaldo`).

## Estructura

| Ruta | Contenido |
|---|---|
| `index.html` | Estructura de la página |
| `styles.css` | Estilos, responsive y accesibilidad visual |
| `app.js` | Lógica, cálculo de fechas, renderizado y persistencia |
| `tests/logic.test.js` | Tests de la lógica con el runner nativo de Node |
| `.gitignore` | Excluye la configuración y los artefactos del flujo de IA |

## Tests

```bash
node --test
```

46 tests cubren fechas, rachas, semana, mes, calendario, mapa de calor, objetivo
semanal, validación, persistencia y respaldo de datos ilegibles. No hay que instalar
nada.

## Desarrollo con IA: SDD, agentes, skills y MCP

Este proyecto se ha desarrollado con **Spec-Driven Development (SDD)** y un flujo de
trabajo con IA. La intención es que sirva también como ejemplo de cómo organizar el
desarrollo asistido por agentes sin perder control ni calidad.

### Flujo SDD

Cada funcionalidad recorre las mismas fases, con aprobación humana entre ellas:

1. **Constitución**: principios innegociables del proyecto.
2. **Spec**: el qué y el porqué, con requisitos verificables en formato EARS.
3. **Clarificación**: revisión tipo QA que detecta ambigüedades antes de programar.
4. **Plan**: archivos, funciones puras, algoritmo, decisiones y estrategia de tests.
5. **Tareas**: pasos de 20–30 minutos, en orden de dependencia.
6. **Implementación**: una tarea cada vez, tests primero y parada al terminar.
7. **Validación**: requisito por requisito, con tests y navegador real.
8. **Cambio**: si aparece un requisito nuevo, primero se actualiza la spec.

La regla es sencilla: **la spec manda**. Si algo no está en la spec, no se implementa;
si falta una decisión, se pregunta en lugar de inventarla.

### Reparto multiagente

- **Coordinador**: dirige el flujo, decide el siguiente paso y pide aprobación.
- **Planner**: redacta spec, plan y tareas; no toca código.
- **Implementer**: implementa una única tarea con tests primero.
- **Reviewer**: valida la spec y la implementación sin modificar nada.

El trabajo se hace en tareas pequeñas, con `node --test` como puerta y verificación en
un navegador real después de cada cambio de interfaz.

### Skills y MCP

- **Skills**: SDD, fechas locales, diseño de interfaz y depuración sistemática.
- **MCP de Chrome DevTools**: abre la página real, revisa la consola, prueba 375 px,
  inspecciona el árbol de accesibilidad y toma capturas.
- **MCP de Context7**: consulta documentación actualizada cuando hace falta.

### Qué me llevo de este proyecto

- Escribir la spec antes del código evita alcance inventado y retrabajo.
- Los tests primero convierten cada tarea en una comprobación objetiva.
- Una tarea por vez mantiene el contexto pequeño y las revisiones claras.
- Verificar en el navegador detecta lo que los tests de lógica no ven.
- Las fechas locales son la fuente de errores más sutil: nunca UTC, nunca
  `new Date("AAAA-MM-DD")`.
- Los puntos de aprobación humana son parte del flujo, no un freno.
- La configuración de la IA se mantiene fuera del repositorio para que el proyecto
  versionado sea solo la aplicación.

## Estado

- Specs 001 (mapa de calor) y 002 (objetivo semanal) implementadas y validadas.
- 46 tests en verde.
- Sin dependencias, sin build y sin paso de compilación.
