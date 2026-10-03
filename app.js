// ============================================================
//  Diario de Estudio - versión simple
//  Guarda las sesiones en localStorage, calcula la racha y pinta el calendario.
// ============================================================

// Clave con la que guardamos las sesiones en el navegador.
const CLAVE = "diario-estudio-sesiones";

// Clave usada por versiones anteriores. Solo sirve para migrar datos.
const CLAVE_ANTIGUA = "diarioDeEstudio.sesiones";

// Nombres en español para el calendario.
const MESES = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];
const DIAS_SEMANA = ["lun", "mar", "mié", "jue", "vie", "sáb", "dom"];

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
//  Calendario
// ------------------------------------------------------------

// Devuelve los meses ("AAAA-MM") con algún registro, del más antiguo al más
// nuevo. Las fechas futuras no cuentan.
function mesesConRegistros(sesiones) {
  const hoy = hoyLocal();
  const meses = sesiones
    .map((s) => s.date)
    .filter((date) => date <= hoy)
    .map((date) => date.slice(0, 7));
  return [...new Set(meses)].sort();
}

// Elige el mes que se muestra al abrir: el actual, acotado al rango de datos.
function mesInicial(sesiones) {
  const mesActual = hoyLocal().slice(0, 7);
  const meses = mesesConRegistros(sesiones);

  if (meses.length === 0) return textoAFecha(`${mesActual}-01`);

  const minMes = meses[0];
  const maxMes = meses[meses.length - 1];

  let elegido = mesActual;
  if (mesActual < minMes) elegido = minMes;
  if (mesActual > maxMes) elegido = maxMes;

  return textoAFecha(`${elegido}-01`);
}

// Pinta el calendario del mes que se está viendo (variable global mesMostrado).
function mostrarCalendario(sesiones) {
  const dias = diasConSesion(sesiones);
  const hoy = hoyLocal();

  const anio = mesMostrado.getFullYear();
  const mes = mesMostrado.getMonth();
  const mesTexto = `${anio}-${String(mes + 1).padStart(2, "0")}`;

  // Título: por ejemplo "octubre 2026".
  document.getElementById("tituloMes").textContent = `${MESES[mes]} ${anio}`;

  // Límites de navegación: del primer al último mes con registros.
  const meses = mesesConRegistros(sesiones);
  const minMes = meses.length ? meses[0] : mesTexto;
  const maxMes = meses.length ? meses[meses.length - 1] : mesTexto;
  document.getElementById("mesAnterior").disabled = mesTexto <= minMes;
  document.getElementById("mesSiguiente").disabled = mesTexto >= maxMes;

  const contenedor = document.getElementById("calendario");
  contenedor.innerHTML = "";

  // Cabecera con los nombres de los días (la semana empieza en lunes).
  DIAS_SEMANA.forEach((nombre) => {
    const celda = document.createElement("div");
    celda.className = "dia-semana";
    celda.textContent = nombre;
    contenedor.appendChild(celda);
  });

  // Huecos vacíos para que el día 1 caiga en su columna.
  const primerDia = new Date(anio, mes, 1);
  const huecos = (primerDia.getDay() + 6) % 7; // 0 = lunes
  for (let i = 0; i < huecos; i++) {
    const hueco = document.createElement("div");
    hueco.className = "dia-vacio";
    contenedor.appendChild(hueco);
  }

  // Un cuadro por cada día del mes.
  const totalDias = new Date(anio, mes + 1, 0).getDate();
  for (let dia = 1; dia <= totalDias; dia++) {
    const fechaTexto = fechaALocal(new Date(anio, mes, dia));

    const celda = document.createElement("div");
    celda.className = "dia";
    celda.textContent = dia;

    // Se marca si hubo sesión y el día no es futuro.
    if (fechaTexto <= hoy && dias.has(fechaTexto)) {
      celda.classList.add("estudiado");
    }

    contenedor.appendChild(celda);
  }
}

// ------------------------------------------------------------
//  Poner todo en marcha
// ------------------------------------------------------------

const formulario = document.getElementById("formulario");
const campoFecha = document.getElementById("fecha");
const campoTema = document.getElementById("tema");
const campoMinutos = document.getElementById("minutos");
const cajaError = document.getElementById("error");
const cajaNotaFecha = document.getElementById("notaFecha");

// El campo de fecha queda fijo en hoy: solo se registra la fecha del equipo.
campoFecha.readOnly = true;
campoFecha.value = hoyLocal();

// Si se intenta cambiar la fecha, explicamos por qué no se puede.
function avisarFechaBloqueada() {
  cajaNotaFecha.textContent =
    "Solo puedes registrar la sesión de hoy. Si la fecha de tu equipo es incorrecta, cámbiala en los ajustes del sistema.";
}
campoFecha.addEventListener("click", avisarFechaBloqueada);
campoFecha.addEventListener("focus", avisarFechaBloqueada);
campoFecha.addEventListener("keydown", (evento) => {
  evento.preventDefault();
  avisarFechaBloqueada();
});

// Al cargar la página pintamos todos los datos.
let sesiones = leerSesiones();
let mesMostrado = mesInicial(sesiones);

mostrarRacha(sesiones);
mostrarSesiones(sesiones);
mostrarCalendario(sesiones);

// Botones para cambiar de mes en el calendario.
document.getElementById("mesAnterior").addEventListener("click", () => {
  mesMostrado = new Date(mesMostrado.getFullYear(), mesMostrado.getMonth() - 1, 1);
  mostrarCalendario(sesiones);
});
document.getElementById("mesSiguiente").addEventListener("click", () => {
  mesMostrado = new Date(mesMostrado.getFullYear(), mesMostrado.getMonth() + 1, 1);
  mostrarCalendario(sesiones);
});

// Al enviar el formulario, validamos y guardamos.
formulario.addEventListener("submit", (evento) => {
  evento.preventDefault();

  // La fecha es siempre la de hoy en el equipo.
  const fecha = hoyLocal();
  const tema = campoTema.value.trim();
  const minutos = Number(campoMinutos.value);

  // Validación sencilla con mensajes en español.
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
  mostrarCalendario(sesiones);

  // Limpiamos el formulario (la fecha vuelve a hoy).
  formulario.reset();
  campoFecha.value = hoyLocal();
  campoTema.focus();
});
