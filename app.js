// ============================================================
//  Diario de Estudio - simple version
//  Stores sessions in localStorage, calculates streaks and renders the calendar.
//  Code identifiers and comments are in English; user-facing texts stay in Spanish.
// ============================================================

// Key used to store sessions in the browser.
const STORAGE_KEY = "diario-estudio-sesiones";

// Key used by older versions. Only needed for migration.
const LEGACY_STORAGE_KEY = "diarioDeEstudio.sesiones";

// Spanish names for the calendar UI.
const MONTHS = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];
const WEEKDAYS = ["lun", "mar", "mié", "jue", "vie", "sáb", "dom"];

// ------------------------------------------------------------
//  Date helpers (always the user's LOCAL date)
// ------------------------------------------------------------

// Converts a Date object to "YYYY-MM-DD" using the local date.
// Do not use toISOString(): it uses UTC and may shift the day.
function dateToLocal(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

// Returns today's date as "YYYY-MM-DD".
function todayLocal() {
  return dateToLocal(new Date());
}

// Converts a "YYYY-MM-DD" string to a local Date at 00:00.
function textToDate(text) {
  const [year, month, day] = text.split("-").map(Number);
  return new Date(year, month - 1, day);
}

// Shows "YYYY-MM-DD" as "DD/MM/YYYY" for easier reading.
function prettyDate(text) {
  const [year, month, day] = text.split("-");
  return `${day}/${month}/${year}`;
}

// ------------------------------------------------------------
//  Read and write sessions
// ------------------------------------------------------------

// Reads saved sessions. Returns an empty list when there is nothing.
function readSessions() {
  const data = localStorage.getItem(STORAGE_KEY);
  if (data) {
    try {
      return JSON.parse(data);
    } catch (error) {
      return [];
    }
  }

  // No data under the new key. Check the legacy key and migrate the sessions
  // to the current shape ({ date, topic, minutes }).
  const legacyData = localStorage.getItem(LEGACY_STORAGE_KEY);
  if (!legacyData) return [];

  try {
    const legacySessions = JSON.parse(legacyData);
    const migrated = legacySessions.map((session) => ({
      // Legacy Spanish keys are kept here only for compatibility.
      date: session.date !== undefined ? session.date : session.fecha,
      topic: session.topic !== undefined ? session.topic : session.tema,
      minutes: session.minutes !== undefined ? session.minutes : session.minutos,
    }));
    saveSessions(migrated);
    return migrated;
  } catch (error) {
    return [];
  }
}

// Saves the full list of sessions.
function saveSessions(sessions) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
}

// ------------------------------------------------------------
//  Streak
// ------------------------------------------------------------

// Returns a Set with the days that have at least one session.
// Several sessions on the same day count as a single day.
function daysWithSession(sessions) {
  return new Set(sessions.map((session) => session.date));
}

// Calculates consecutive study days ending today.
// If there is no session today but there was one yesterday, the streak stays alive.
function calculateStreak(sessions, today = todayLocal()) {
  const days = daysWithSession(sessions);

  // Start from today.
  let cursor = textToDate(today);

  // If today has no session, try yesterday (the streak is not broken yet).
  if (!days.has(dateToLocal(cursor))) {
    cursor.setDate(cursor.getDate() - 1);
  }

  // Count backwards while days have sessions.
  let streak = 0;
  while (days.has(dateToLocal(cursor))) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
}

// Calculates the best streak: the longest run of consecutive days with at least
// one session in the whole history.
// It does not use the "yesterday stays alive" rule (that is only for the current streak).
// Future dates do not count.
function calculateBestStreak(sessions, today = todayLocal()) {
  // Days with a session, without future dates, sorted oldest to newest.
  // The "YYYY-MM-DD" format already sorts correctly as text.
  const days = [...daysWithSession(sessions)]
    .filter((day) => day <= today)
    .sort();

  let best = 0; // longest run found
  let current = 0; // run currently being counted
  let previous = null;

  days.forEach((day) => {
    // Is this day exactly the one after the previous one?
    let isNext = false;
    if (previous !== null) {
      const previousDate = textToDate(previous);
      previousDate.setDate(previousDate.getDate() + 1);
      isNext = dateToLocal(previousDate) === day;
    }

    // Consecutive days grow the run; anything else starts a new run at 1.
    current = isNext ? current + 1 : 1;
    if (current > best) best = current;
    previous = day;
  });

  return best;
}

// ------------------------------------------------------------
//  Weekly minutes
// ------------------------------------------------------------

// Returns the Monday of the week containing today as "YYYY-MM-DD" (local date).
function startOfWeek(today = todayLocal()) {
  const date = textToDate(today);
  const offset = (date.getDay() + 6) % 7; // Monday = 0
  date.setDate(date.getDate() - offset);
  return dateToLocal(date);
}

// Adds up the minutes of this week's sessions (Monday through today).
function calculateWeekMinutes(sessions, today = todayLocal()) {
  const start = startOfWeek(today);
  return sessions
    .filter((session) => session.date >= start && session.date <= today)
    .reduce((total, session) => total + session.minutes, 0);
}

// ------------------------------------------------------------
//  Days studied this month
// ------------------------------------------------------------

// Counts distinct days with a session in the current month (day 1 through today).
function calculateMonthDays(sessions, today = todayLocal()) {
  const monthPrefix = today.slice(0, 7); // "YYYY-MM"

  return [...daysWithSession(sessions)]
    .filter((day) => day.startsWith(monthPrefix) && day <= today)
    .length;
}

// ------------------------------------------------------------
//  Rendering
// ------------------------------------------------------------

// Shows the current streak and the best streak.
function renderStreak(sessions) {
  document.getElementById("rachaNumero").textContent = calculateStreak(sessions);
  document.getElementById("mejorRachaNumero").textContent = calculateBestStreak(sessions);
}

// Shows the minutes studied this week.
function renderWeekMinutes(sessions) {
  document.getElementById("minutosSemana").textContent = calculateWeekMinutes(sessions);
}

// Shows the distinct days studied this month.
function renderMonthDays(sessions) {
  const days = calculateMonthDays(sessions);
  document.getElementById("diasMes").textContent = days;
  document.getElementById("diasMesTexto").textContent =
    days === 1 ? "día este mes" : "días este mes";
}

// Shows the session list, newest first.
function renderSessions(sessions) {
  const list = document.getElementById("listaSesiones");
  const emptyMessage = document.getElementById("mensajeVacio");

  list.innerHTML = "";

  if (sessions.length === 0) {
    emptyMessage.classList.remove("oculto");
    return;
  }
  emptyMessage.classList.add("oculto");

  // Copy and sort without changing the original array.
  const ordered = [...sessions].sort((a, b) => {
    if (a.date === b.date) return 0;
    return a.date < b.date ? 1 : -1; // newest first
  });

  ordered.forEach((session) => {
    const item = document.createElement("li");
    item.className = "sesion";

    const info = document.createElement("div");
    info.className = "sesion-info";

    const topic = document.createElement("span");
    topic.className = "sesion-tema";
    topic.textContent = session.topic;

    const date = document.createElement("span");
    date.className = "sesion-fecha";
    date.textContent = prettyDate(session.date);

    info.appendChild(topic);
    info.appendChild(date);

    const minutes = document.createElement("span");
    minutes.className = "sesion-minutos";
    minutes.textContent = `${session.minutes} min`;

    item.appendChild(info);
    item.appendChild(minutes);
    list.appendChild(item);
  });
}

// ------------------------------------------------------------
//  Calendar
// ------------------------------------------------------------

// Returns the months ("YYYY-MM") with at least one record, oldest to newest.
// Future dates do not count.
function monthsWithRecords(sessions, today = todayLocal()) {
  const months = sessions
    .map((session) => session.date)
    .filter((date) => date <= today)
    .map((date) => date.slice(0, 7));
  return [...new Set(months)].sort();
}

// Chooses the month shown on load: the current one, clamped to the data range.
function initialMonth(sessions, today = todayLocal()) {
  const currentMonth = today.slice(0, 7);
  const months = monthsWithRecords(sessions, today);

  if (months.length === 0) return textToDate(`${currentMonth}-01`);

  const minMonth = months[0];
  const maxMonth = months[months.length - 1];

  let chosen = currentMonth;
  if (currentMonth < minMonth) chosen = minMonth;
  if (currentMonth > maxMonth) chosen = maxMonth;

  return textToDate(`${chosen}-01`);
}

// Renders the calendar for the month being viewed (global shownMonth).
function renderCalendar(sessions, today = todayLocal()) {
  const days = daysWithSession(sessions);
  const year = shownMonth.getFullYear();
  const month = shownMonth.getMonth();
  const monthText = `${year}-${String(month + 1).padStart(2, "0")}`;

  // Title: for example "octubre 2026".
  document.getElementById("tituloMes").textContent = `${MONTHS[month]} ${year}`;

  // Navigation limits: from the first to the last month with records.
  const months = monthsWithRecords(sessions, today);
  const minMonth = months.length ? months[0] : monthText;
  const maxMonth = months.length ? months[months.length - 1] : monthText;
  document.getElementById("mesAnterior").disabled = monthText <= minMonth;
  document.getElementById("mesSiguiente").disabled = monthText >= maxMonth;

  const container = document.getElementById("calendario");
  container.innerHTML = "";

  // Header with weekday names (the week starts on Monday).
  WEEKDAYS.forEach((name) => {
    const cell = document.createElement("div");
    cell.className = "dia-semana";
    cell.textContent = name;
    container.appendChild(cell);
  });

  // Empty cells so day 1 falls in its column.
  const firstDay = new Date(year, month, 1);
  const gaps = (firstDay.getDay() + 6) % 7; // 0 = Monday
  for (let i = 0; i < gaps; i++) {
    const gap = document.createElement("div");
    gap.className = "dia-vacio";
    container.appendChild(gap);
  }

  // One cell per day of the month.
  const totalDays = new Date(year, month + 1, 0).getDate();
  for (let day = 1; day <= totalDays; day++) {
    const dateText = dateToLocal(new Date(year, month, day));

    const cell = document.createElement("div");
    cell.className = "dia";
    cell.textContent = day;

    // Mark the day only when it has a session and is not in the future.
    if (dateText <= today && days.has(dateText)) {
      cell.classList.add("estudiado");
    }

    container.appendChild(cell);
  }
}

// ------------------------------------------------------------
//  Session timer
// ------------------------------------------------------------

// If a cancelled session does not reach this many minutes, it is not saved.
const MIN_MINUTES_TO_SAVE = 8;

// State of the running session.
let sessionState = "idle"; // "idle" | "running" | "paused"
let stateBeforeCancel = "idle";
let originalMinutes = 0;
let remainingSeconds = 0;
let sessionInterval = null;
let currentTopic = "";

// Converts seconds to "MM:SS".
function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(rest).padStart(2, "0")}`;
}

// Shows the time left.
function updateTimer() {
  timerText.textContent = formatTime(remainingSeconds);
}

// Locks or unlocks the topic and minutes while the session runs.
function lockFields(locked) {
  topicField.disabled = locked;
  minutesField.disabled = locked;
}

// Plays a short cannon sound with the Web Audio API (no external files).
function playCannonSound() {
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx) return;

  const context = new AudioCtx();
  const now = context.currentTime;
  const duration = 0.6;

  // "Boom": a low tone that drops and fades quickly.
  const oscillator = context.createOscillator();
  const volume = context.createGain();
  oscillator.type = "sine";
  oscillator.frequency.setValueAtTime(140, now);
  oscillator.frequency.exponentialRampToValueAtTime(40, now + duration);
  volume.gain.setValueAtTime(0.9, now);
  volume.gain.exponentialRampToValueAtTime(0.001, now + duration);
  oscillator.connect(volume);
  volume.connect(context.destination);
  oscillator.start(now);
  oscillator.stop(now + duration);

  // Initial "crack": a very short burst of noise.
  const samples = Math.floor(context.sampleRate * 0.15);
  const buffer = context.createBuffer(1, samples, context.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < samples; i++) {
    data[i] = (Math.random() * 2 - 1) * (1 - i / samples);
  }
  const noise = context.createBufferSource();
  const noiseVolume = context.createGain();
  noise.buffer = buffer;
  noiseVolume.gain.setValueAtTime(0.5, now);
  noiseVolume.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
  noise.connect(noiseVolume);
  noiseVolume.connect(context.destination);
  noise.start(now);

  // Close the context when done to release resources.
  oscillator.onended = () => context.close();
}

// Saves the session with the given minutes and refreshes the screen.
function saveSession(minutes) {
  sessions.push({ date: todayLocal(), topic: currentTopic, minutes });
  saveSessions(sessions);
  renderStreak(sessions);
  renderWeekMinutes(sessions);
  renderMonthDays(sessions);
  renderSessions(sessions);
  renderCalendar(sessions);
}

// Leaves the form ready for a new session.
function resetSessionUI() {
  clearInterval(sessionInterval);
  sessionInterval = null;
  sessionState = "idle";

  lockFields(false);
  actionButton.classList.remove("oculto");
  timerBox.classList.add("oculto");
  sessionControls.classList.add("oculto");
  pauseResumeButton.textContent = "Pausar sesión";

  form.reset();
  dateField.value = todayLocal();
  topicField.focus();
}

// Starts the countdown.
function startSession(topic, minutes) {
  currentTopic = topic;
  originalMinutes = minutes;
  remainingSeconds = minutes * 60;
  sessionState = "running";

  lockFields(true);
  actionButton.classList.add("oculto");
  timerBox.classList.remove("oculto");
  sessionControls.classList.remove("oculto");
  endMessage.classList.add("oculto");
  pauseResumeButton.textContent = "Pausar sesión";
  updateTimer();

  sessionInterval = setInterval(sessionTick, 1000);
}

// Every second decreases the remaining time.
function sessionTick() {
  remainingSeconds--;
  if (remainingSeconds <= 0) {
    remainingSeconds = 0;
    updateTimer();
    finishSession();
    return;
  }
  updateTimer();
}

// Pauses or resumes the countdown (single button).
function togglePauseResume() {
  if (sessionState === "running") {
    clearInterval(sessionInterval);
    sessionInterval = null;
    sessionState = "paused";
    pauseResumeButton.textContent = "Reanudar sesión";
  } else if (sessionState === "paused") {
    sessionState = "running";
    sessionInterval = setInterval(sessionTick, 1000);
    pauseResumeButton.textContent = "Pausar sesión";
  }
}

// Time is up: save the full session.
function finishSession() {
  resetSessionUI();
  saveSession(originalMinutes);
  endMessage.textContent = "¡Tiempo terminado! Sesión guardada.";
  endMessage.classList.remove("oculto");
  playCannonSound();
}

// The user presses "Cancelar sesión".
function cancelSession() {
  // Remember whether it was running or paused so it can resume later.
  stateBeforeCancel = sessionState;

  // Pause the countdown while the user decides.
  if (sessionState === "running") {
    clearInterval(sessionInterval);
    sessionInterval = null;
  }

  const elapsedSeconds = originalMinutes * 60 - remainingSeconds;
  const elapsedMinutes = Math.floor(elapsedSeconds / 60);

  // If it reaches the minimum, save it directly with the elapsed time.
  if (elapsedMinutes >= MIN_MINUTES_TO_SAVE) {
    resetSessionUI();
    saveSession(elapsedMinutes);
    endMessage.textContent = `Sesión guardada: ${elapsedMinutes} min.`;
    endMessage.classList.remove("oculto");
    return;
  }

  // Otherwise, ask before discarding it.
  sessionState = "paused";
  modalText.textContent =
    `Has estudiado ${elapsedMinutes} minuto(s). Como no llegas a ` +
    `${MIN_MINUTES_TO_SAVE} minutos, si cancelas la sesión no se guardará. ` +
    "¿Qué quieres hacer?";
  cancelModal.classList.remove("oculto");
}

// The user decides to continue the session.
function continueSession() {
  cancelModal.classList.add("oculto");

  if (stateBeforeCancel === "running") {
    sessionState = "running";
    sessionInterval = setInterval(sessionTick, 1000);
    pauseResumeButton.textContent = "Pausar sesión";
  } else {
    sessionState = "paused";
    pauseResumeButton.textContent = "Reanudar sesión";
  }
}

// The user confirms cancellation: nothing is saved.
function cancelDefinitively() {
  cancelModal.classList.add("oculto");
  resetSessionUI();
}

// ------------------------------------------------------------
//  Start everything
// ------------------------------------------------------------

const form = document.getElementById("formulario");
const dateField = document.getElementById("fecha");
const topicField = document.getElementById("tema");
const minutesField = document.getElementById("minutos");
const errorBox = document.getElementById("error");
const dateNote = document.getElementById("notaFecha");

// Timer references.
const timerBox = document.getElementById("temporizadorCaja");
const timerText = document.getElementById("temporizador");
const sessionControls = document.getElementById("controlesSesion");
const actionButton = document.getElementById("botonAccion");
const pauseResumeButton = document.getElementById("botonPausarReanudar");
const cancelButton = document.getElementById("botonCancelar");
const endMessage = document.getElementById("mensajeFin");
const cancelModal = document.getElementById("modalCancelar");
const modalText = document.getElementById("modalTexto");
const modalContinue = document.getElementById("modalContinuar");
const modalCancelDefinitive = document.getElementById("modalCancelarDefinitivo");

// The date field is fixed to today: only the device's date can be recorded.
dateField.readOnly = true;
dateField.value = todayLocal();

// If the user tries to change the date, explain why they cannot.
function warnDateLocked() {
  dateNote.textContent =
    "Solo puedes registrar la sesión de hoy. Si la fecha de tu equipo es incorrecta, cámbiala en los ajustes del sistema.";
}
dateField.addEventListener("click", warnDateLocked);
dateField.addEventListener("focus", warnDateLocked);
dateField.addEventListener("keydown", (event) => {
  event.preventDefault();
  warnDateLocked();
});

// On load, render all data.
let sessions = readSessions();
let shownMonth = initialMonth(sessions);

renderStreak(sessions);
renderWeekMinutes(sessions);
renderMonthDays(sessions);
renderSessions(sessions);
renderCalendar(sessions);

// Buttons to change the calendar month.
document.getElementById("mesAnterior").addEventListener("click", () => {
  shownMonth = new Date(shownMonth.getFullYear(), shownMonth.getMonth() - 1, 1);
  renderCalendar(sessions);
});
document.getElementById("mesSiguiente").addEventListener("click", () => {
  shownMonth = new Date(shownMonth.getFullYear(), shownMonth.getMonth() + 1, 1);
  renderCalendar(sessions);
});

// Timer controls.
pauseResumeButton.addEventListener("click", togglePauseResume);
cancelButton.addEventListener("click", cancelSession);
modalContinue.addEventListener("click", continueSession);
modalCancelDefinitive.addEventListener("click", cancelDefinitively);

// Escape means "continue the session".
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !cancelModal.classList.contains("oculto")) {
    continueSession();
  }
});

// On form submit, validate and start the timer.
form.addEventListener("submit", (event) => {
  event.preventDefault();

  // If a session is already running, do nothing.
  if (sessionState !== "idle") return;

  const topic = topicField.value.trim();
  const minutes = Number(minutesField.value);

  // Simple validation with Spanish messages.
  if (!topic) {
    errorBox.textContent = "Escribe el tema de la sesión.";
    return;
  }
  if (!minutes || minutes <= 0) {
    errorBox.textContent = "Los minutos deben ser mayores que 0.";
    return;
  }

  errorBox.textContent = "";
  endMessage.classList.add("oculto");
  startSession(topic, minutes);
});
