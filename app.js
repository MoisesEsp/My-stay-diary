// ============================================================
//  Diario de Estudio - versión simple
//  Guarda las sesiones en localStorage y calcula la racha.
// ============================================================

// Clave con la que guardamos las sesiones en el navegador.
const CLAVE = "diario-estudio-sesiones";

// Clave usada por versiones anteriores. Solo sirve para migrar datos.
const CLAVE_ANTIGUA = "diarioDeEstudio.sesiones";

// ------------------------------------------------------------
//  Utilidades de fecha (siempre en fecha LOCAL del usuario)
// ------------------------------------------------------------

// Convierte un objeto Date en texto "YYYY-MM-DD" usando la fecha local.
// No usamos toISOString() porque esa usa UTC y podría cambiar el día.
function fechaALocal(date) {
  const anio = date.getFullYear();
  const mes = String(date.getMonth() + 1).padStart(2, "0");
  const dia = String(date.getDate()).padStart(2, "0");
  return `${anio}-${mes}-${dia}`;
}

// Devuelve la fecha de hoy como "YYYY-MM-DD".
function hoyLocal() {
  return fechaALocal(new Date());
}

// Convierte un texto "YYYY-MM-DD" en un Date local (a las 00:00).
function textoAFecha(texto) {
  const [anio, mes, dia] = texto.split("-").map(Number);
  return new Date(anio, mes - 1, dia);
}

// Muestra "YYYY-MM-DD" como "DD/MM/YYYY" para leerlo mejor.
function fechaBonita(texto) {
  const [anio, mes, dia] = texto.split("-");
  return `${dia}/${mes}/${anio}`;
}

// ------------------------------------------------------------
//  Guardar y leer las sesiones
// ------------------------------------------------------------

// Lee las sesiones guardadas. Si no hay nada, devuelve una lista vacía.
function leerSesiones() {
  const datos = localStorage.getItem(CLAVE);
  if (datos) {
    try {
      return JSON.parse(datos);
    } catch (e) {
      return [];
    }
  }

  // No hay datos con la clave nueva. Miramos la clave antigua y migramos
  // las sesiones al formato actual ({ date, topic, minutes }).
  const antiguos = localStorage.getItem(CLAVE_ANTIGUA);
  if (!antiguos) return [];

  try {
    const sesionesAntiguas = JSON.parse(antiguos);
    const migradas = sesionesAntiguas.map((s) => ({
      date: s.date !== undefined ? s.date : s.fecha,
      topic: s.topic !== undefined ? s.topic : s.tema,
      minutes: s.minutes !== undefined ? s.minutes : s.minutos,
    }));
    guardarSesiones(migradas);
    return migradas;
  } catch (e) {
    return [];
  }
}

// Guarda la lista completa de sesiones.
function guardarSesiones(sesiones) {
  localStorage.setItem(CLAVE, JSON.stringify(sesiones));
}

// ------------------------------------------------------------
//  Racha
// ------------------------------------------------------------

// Devuelve un conjunto (Set) con los días que tienen al menos una sesión.
// Varias sesiones el mismo día cuentan como un solo día.
function diasConSesion(sesiones) {
  return new Set(sesiones.map((s) => s.date));
}

// Calcula los días seguidos estudiando que terminan hoy.
// Si hoy aún no hay sesión pero ayer sí, la racha sigue viva.
function calcularRacha(sesiones) {
  const dias = diasConSesion(sesiones);

  // Empezamos desde hoy.
  let cursor = textoAFecha(hoyLocal());

  // Si hoy no hay sesión, probamos desde ayer (la racha aún no se rompe).
  if (!dias.has(fechaALocal(cursor))) {
    cursor.setDate(cursor.getDate() - 1);
  }

  // Contamos hacia atrás mientras haya días con sesión.
  let racha = 0;
  while (dias.has(fechaALocal(cursor))) {
    racha++;
    cursor.setDate(cursor.getDate() - 1);
  }

  return racha;
}

// Calcula la mejor racha: la secuencia más larga de días consecutivos con
// al menos una sesión en todo el historial.
// No usa la regla de "ayer sigue viva" (esa es solo para la racha actual).
// Las fechas futuras no cuentan.
function calcularMejorRacha(sesiones) {
  const hoy = hoyLocal();

  // Días con sesión, sin futuros y ordenados del más antiguo al más nuevo.
  // El formato "AAAA-MM-DD" ya ordena bien como texto.
  const dias = [...diasConSesion(sesiones)]
    .filter((dia) => dia <= hoy)
    .sort();

  let mejor = 0; // la racha más larga encontrada
  let actual = 0; // la racha que estamos contando ahora
  let anterior = null;

  dias.forEach((dia) => {
    // ¿Este día es justo el siguiente al anterior?
    let esSiguiente = false;
    if (anterior !== null) {
      const fechaAnterior = textoAFecha(anterior);
      fechaAnterior.setDate(fechaAnterior.getDate() + 1);
      esSiguiente = fechaALocal(fechaAnterior) === dia;
    }

    // Si es consecutivo, la racha crece; si no, empieza de nuevo en 1.
    actual = esSiguiente ? actual + 1 : 1;
    if (actual > mejor) mejor = actual;
    anterior = dia;
  });

  return mejor;
}

// ------------------------------------------------------------
//  Dibujar en pantalla
// ------------------------------------------------------------

// Muestra los números de la racha actual y de la mejor racha.
function mostrarRacha(sesiones) {
  document.getElementById("rachaNumero").textContent = calcularRacha(sesiones);
  document.getElementById("mejorRachaNumero").textContent = calcularMejorRacha(sesiones);
}

// Muestra la lista de sesiones, de la más reciente a la más antigua.
function mostrarSesiones(sesiones) {
  const lista = document.getElementById("listaSesiones");
  const vacio = document.getElementById("mensajeVacio");

  lista.innerHTML = "";

  if (sesiones.length === 0) {
    vacio.classList.remove("oculto");
    return;
  }
  vacio.classList.add("oculto");

  // Copiamos y ordenamos sin modificar el array original.
  const ordenadas = [...sesiones].sort((a, b) => {
    if (a.date === b.date) return 0;
    return a.date < b.date ? 1 : -1; // más reciente primero
  });

  ordenadas.forEach((sesion) => {
    const item = document.createElement("li");
    item.className = "sesion";

    const info = document.createElement("div");
    info.className = "sesion-info";

    const tema = document.createElement("span");
    tema.className = "sesion-tema";
    tema.textContent = sesion.topic;

    const fecha = document.createElement("span");
    fecha.className = "sesion-fecha";
    fecha.textContent = fechaBonita(sesion.date);

    info.appendChild(tema);
    info.appendChild(fecha);

    const minutos = document.createElement("span");
    minutos.className = "sesion-minutos";
    minutos.textContent = `${sesion.minutes} min`;

    item.appendChild(info);
    item.appendChild(minutos);
    lista.appendChild(item);
  });
}

// ------------------------------------------------------------
//  Poner todo en marcha
// ------------------------------------------------------------

const formulario = document.getElementById("formulario");
const campoFecha = document.getElementById("fecha");
const campoTema = document.getElementById("tema");
const campoMinutos = document.getElementById("minutos");
const cajaError = document.getElementById("error");

// Al cargar la página: fecha de hoy por defecto y pintar datos.
campoFecha.value = hoyLocal();

let sesiones = leerSesiones();
mostrarRacha(sesiones);
mostrarSesiones(sesiones);

// Al enviar el formulario, validamos y guardamos.
formulario.addEventListener("submit", (evento) => {
  evento.preventDefault();

  const fecha = campoFecha.value;
  const tema = campoTema.value.trim();
  const minutos = Number(campoMinutos.value);

  // Validación sencilla con mensajes en español.
  if (!fecha) {
    cajaError.textContent = "Elige una fecha.";
    return;
  }
  if (!tema) {
    cajaError.textContent = "Escribe el tema de la sesión.";
    return;
  }
  if (!minutos || minutos <= 0) {
    cajaError.textContent = "Los minutos deben ser mayores que 0.";
    return;
  }

  cajaError.textContent = "";

  // Añadimos la nueva sesión y guardamos.
  sesiones.push({ date: fecha, topic: tema, minutes: minutos });
  guardarSesiones(sesiones);

  // Refrescamos la pantalla.
  mostrarRacha(sesiones);
  mostrarSesiones(sesiones);

  // Limpiamos el formulario (la fecha vuelve a hoy).
  formulario.reset();
  campoFecha.value = hoyLocal();
  campoTema.focus();
});
