const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const APP_CODE = fs.readFileSync(path.join(__dirname, "..", "app.js"), "utf8");

const EXPORTS = [
  "dateToLocal",
  "todayLocal",
  "textToDate",
  "prettyDate",
  "isValidLocalDate",
  "isValidMinutes",
  "daysWithSession",
  "calculateStreak",
  "calculateBestStreak",
  "startOfWeek",
  "calculateWeekMinutes",
  "calculateMonthDays",
  "monthsWithRecords",
  "initialMonth",
  "heatMapWindowStart",
  "heatMapLevel",
  "groupValidSessionsByDate",
  "buildHeatMap",
  "summarizeHeatMap",
  "formatHeatMapSummary",
  "monthLabelsForWeeks",
  "formatDayAriaLabel",
  "readSessions",
  "saveSessions",
  "formatTime",
];

function makeElement(tag = "div") {
  const classes = new Set();
  const element = {
    tagName: tag,
    children: [],
    textContent: "",
    value: "",
    disabled: false,
    readOnly: false,
    className: "",
    classList: {
      add(name) {
        classes.add(name);
      },
      remove(name) {
        classes.delete(name);
      },
      contains(name) {
        return classes.has(name);
      },
    },
    appendChild(child) {
      element.children.push(child);
      return child;
    },
    setAttribute(name, value) {
      element.attributes[name] = String(value);
    },
    getAttribute(name) {
      return element.attributes[name] ?? null;
    },
    addEventListener() {},
    focus() {},
    reset() {},
  };

  element.attributes = {};

  Object.defineProperty(element, "innerHTML", {
    get() {
      return "";
    },
    set() {
      element.children = [];
    },
  });

  return element;
}

function makeStorage(initial = {}) {
  const values = new Map(Object.entries(initial));
  return {
    getItem(key) {
      return values.has(key) ? values.get(key) : null;
    },
    setItem(key, value) {
      values.set(key, String(value));
    },
    removeItem(key) {
      values.delete(key);
    },
  };
}

// Loads app.js in a minimal DOM so the pure functions can be tested without a browser.
function loadApp({ sessions = null, legacySessions = null, rawStorage = null } = {}) {
  const initial = {};
  if (sessions) initial["diario-estudio-sesiones"] = JSON.stringify(sessions);
  if (legacySessions) initial["diarioDeEstudio.sesiones"] = JSON.stringify(legacySessions);
  if (rawStorage) Object.assign(initial, rawStorage);

  const storage = makeStorage(initial);
  const elements = new Map();
  const document = {
    getElementById(id) {
      if (!elements.has(id)) elements.set(id, makeElement());
      return elements.get(id);
    },
    createElement(tag) {
      return makeElement(tag);
    },
    addEventListener() {},
  };

  const sandbox = {
    document,
    localStorage: storage,
    window: {},
    setInterval: () => 1,
    clearInterval: () => {},
    console,
  };

  vm.createContext(sandbox);
  vm.runInContext(`${APP_CODE}\n;globalThis.__test = { ${EXPORTS.join(", ")} };`, sandbox);

  return { api: sandbox.__test, storage, elements };
}

const session = (date, minutes = 10) => ({ date, topic: "Test", minutes });

test("date helpers round-trip and format dates", () => {
  const { api } = loadApp();

  assert.equal(api.dateToLocal(api.textToDate("2026-11-15")), "2026-11-15");
  assert.equal(api.dateToLocal(new Date(2026, 10, 1)), "2026-11-01");
  assert.equal(api.prettyDate("2026-11-15"), "15/11/2026");
});

test("isValidLocalDate accepts only real local dates", () => {
  const { api } = loadApp();

  assert.equal(api.isValidLocalDate("2026-11-02"), true);
  assert.equal(api.isValidLocalDate("2024-02-29"), true); // leap year
  assert.equal(api.isValidLocalDate("2026-02-29"), false); // not a leap year
  assert.equal(api.isValidLocalDate("2026-13-01"), false);
  assert.equal(api.isValidLocalDate("2026-04-31"), false);
  assert.equal(api.isValidLocalDate("2026-1-1"), false);
  assert.equal(api.isValidLocalDate(""), false);
  assert.equal(api.isValidLocalDate(null), false);
  assert.equal(api.isValidLocalDate(undefined), false);
});

test("isValidMinutes accepts only finite positive numbers", () => {
  const { api } = loadApp();

  assert.equal(api.isValidMinutes(1), true);
  assert.equal(api.isValidMinutes(30), true);
  assert.equal(api.isValidMinutes(29.9), true);
  assert.equal(api.isValidMinutes(0.5), true);

  assert.equal(api.isValidMinutes(0), false);
  assert.equal(api.isValidMinutes(-1), false);
  assert.equal(api.isValidMinutes(Number.NaN), false);
  assert.equal(api.isValidMinutes(Infinity), false);
  assert.equal(api.isValidMinutes(-Infinity), false);
  assert.equal(api.isValidMinutes("30"), false);
  assert.equal(api.isValidMinutes(null), false);
  assert.equal(api.isValidMinutes(undefined), false);
});

test("startOfWeek uses Monday as the first day", () => {
  const { api } = loadApp();

  assert.equal(api.startOfWeek("2026-11-15"), "2026-11-09"); // Sunday
  assert.equal(api.startOfWeek("2026-11-09"), "2026-11-09"); // Monday
  assert.equal(api.startOfWeek("2026-11-08"), "2026-11-02"); // previous Sunday
});

test("heatMapWindowStart returns the Monday 11 weeks before", () => {
  const { api } = loadApp();

  assert.equal(api.heatMapWindowStart("2026-11-02"), "2026-08-17"); // Monday
  assert.equal(api.heatMapWindowStart("2026-11-04"), "2026-08-17"); // Wednesday
  assert.equal(api.heatMapWindowStart("2026-11-08"), "2026-08-17"); // Sunday
  assert.equal(api.heatMapWindowStart("2026-01-01"), "2025-10-13"); // year boundary
});

test("heatMapLevel applies the fixed thresholds", () => {
  const { api } = loadApp();

  assert.equal(api.heatMapLevel(0), 0);
  assert.equal(api.heatMapLevel(0.1), 1);
  assert.equal(api.heatMapLevel(29.9), 1);
  assert.equal(api.heatMapLevel(30), 2);
  assert.equal(api.heatMapLevel(59.9), 2);
  assert.equal(api.heatMapLevel(60), 3);
  assert.equal(api.heatMapLevel(89.9), 3);
  assert.equal(api.heatMapLevel(90), 4);
  assert.equal(api.heatMapLevel(600), 4);
});

test("groupValidSessionsByDate sums valid sessions and ignores the rest", () => {
  const { api } = loadApp();
  const today = "2026-11-04";
  const sessions = [
    { date: "2026-11-04", topic: "A", minutes: 30 },
    { date: "2026-11-04", topic: "B", minutes: 15 },
    { date: "2026-11-03", topic: "C", minutes: 25 },
    { date: "2026-11-05", topic: "future", minutes: 99 },
    { date: "2026-02-30", topic: "invalid date", minutes: 10 },
    { date: "2026-11-02", topic: "zero", minutes: 0 },
    { date: "2026-11-01", topic: "negative", minutes: -5 },
    { date: "2026-10-31", topic: "text", minutes: "20" },
    { date: "2026-10-30", topic: "nan", minutes: Number.NaN },
  ];

  const byDate = api.groupValidSessionsByDate(sessions, today);

  assert.equal(byDate.get("2026-11-04"), 45);
  assert.equal(byDate.get("2026-11-03"), 25);
  assert.equal(byDate.has("2026-11-05"), false);
  assert.equal(byDate.has("2026-02-30"), false);
  assert.equal(byDate.has("2026-11-02"), false);
  assert.equal(byDate.has("2026-11-01"), false);
  assert.equal(byDate.has("2026-10-31"), false);
  assert.equal(byDate.has("2026-10-30"), false);
  assert.equal(api.groupValidSessionsByDate(null, today).size, 0);
});

test("buildHeatMap creates 12 weeks of 7 days with future state", () => {
  const { api } = loadApp();
  const today = "2026-11-04"; // Wednesday
  const sessions = [
    { date: "2026-11-04", topic: "hoy", minutes: 30 },
    { date: "2026-11-04", topic: "extra", minutes: 5 },
    { date: "2026-11-03", topic: "ayer", minutes: 25 },
    { date: "2026-11-02", topic: "anteayer", minutes: 20 },
    { date: "2026-11-05", topic: "futuro", minutes: 99 },
    { date: "2026-02-30", topic: "mala", minutes: 10 },
  ];

  const map = api.buildHeatMap(sessions, today);

  assert.equal(map.start, api.heatMapWindowStart(today));
  assert.equal(map.weeks.length, 12);
  assert.equal(map.weeks.every((week) => week.length === 7), true);

  const days = map.weeks.flat();
  assert.equal(days.length, 84);
  assert.equal(days[0].date, map.start);
  assert.equal(days[83].date, "2026-11-08"); // Sunday of the current week

  const todayDay = days.find((day) => day.date === today);
  assert.equal(todayDay.minutes, 35);
  assert.equal(todayDay.level, 2);
  assert.equal(todayDay.isFuture, false);

  const yesterday = days.find((day) => day.date === "2026-11-03");
  assert.equal(yesterday.level, 1);

  const future = days.find((day) => day.date === "2026-11-05");
  assert.equal(future.isFuture, true);
  assert.equal(future.minutes, 0);
  assert.equal(future.level, 0);

  assert.equal(days.some((day) => day.date === "2026-02-30"), false);
  assert.equal(map.summary.daysWithStudy, 3);
  assert.equal(map.summary.totalMinutes, 80);
});

test("summarizeHeatMap counts valid study days and minutes", () => {
  const { api } = loadApp();
  const days = [
    { date: "2026-11-02", minutes: 0, level: 0, isFuture: false },
    { date: "2026-11-03", minutes: 30.5, level: 2, isFuture: false },
    { date: "2026-11-04", minutes: 10, level: 1, isFuture: false },
    { date: "2026-11-05", minutes: 99, level: 4, isFuture: true },
  ];

  const summary = api.summarizeHeatMap(days);
  assert.equal(summary.daysWithStudy, 2);
  assert.equal(summary.totalMinutes, 40.5);
});

test("formatHeatMapSummary uses the exact format and comma decimals", () => {
  const { api } = loadApp();

  assert.equal(
    api.formatHeatMapSummary({ daysWithStudy: 3, totalMinutes: 125 }),
    "Periodo: 12 semanas · Días con estudio: 3 · Minutos totales: 125.",
  );
  assert.equal(
    api.formatHeatMapSummary({ daysWithStudy: 2, totalMinutes: 40.5 }),
    "Periodo: 12 semanas · Días con estudio: 2 · Minutos totales: 40,5.",
  );
});

test("monthLabelsForWeeks labels the column containing day 1", () => {
  const { api } = loadApp();
  const map = api.buildHeatMap([], "2026-01-15");
  const labels = api.monthLabelsForWeeks(map.weeks);

  assert.equal(labels.length, 12);
  assert.equal(labels[0], "nov 2025"); // first label includes the year
  assert.equal(labels[5], "dic 2025");
  assert.equal(labels[9], "ene 2026"); // January includes the year
  assert.equal(labels[1], "");
  assert.equal(labels[11], "");
});

test("formatDayAriaLabel describes each day in Spanish", () => {
  const { api } = loadApp();

  assert.equal(
    api.formatDayAriaLabel({ date: "2026-11-02", minutes: 45, level: 2, isFuture: false }),
    "2 de noviembre de 2026: 45 minutos",
  );
  assert.equal(
    api.formatDayAriaLabel({ date: "2026-11-03", minutes: 1, level: 1, isFuture: false }),
    "3 de noviembre de 2026: 1 minuto",
  );
  assert.equal(
    api.formatDayAriaLabel({ date: "2026-11-04", minutes: 0, level: 0, isFuture: false }),
    "4 de noviembre de 2026: sin sesión",
  );
  assert.equal(
    api.formatDayAriaLabel({ date: "2026-11-05", minutes: 0, level: 0, isFuture: true }),
    "5 de noviembre de 2026: no transcurrido",
  );
});

test("readSessions reports unreadable data without losing the raw value", () => {
  const raw = "{not json";
  const { api } = loadApp({ rawStorage: { "diario-estudio-sesiones": raw } });
  const result = api.readSessions();

  assert.equal(result.unreadable, true);
  assert.deepEqual([...result.sessions], []);
  assert.equal(result.raw, raw);
});

test("readSessions reports readable empty data", () => {
  const { api } = loadApp();
  const result = api.readSessions();

  assert.equal(result.unreadable, false);
  assert.deepEqual([...result.sessions], []);
  assert.equal(result.raw, null);
});

test("readSessions rejects a non-array payload", () => {
  const raw = '{"hello":1}';
  const { api } = loadApp({ rawStorage: { "diario-estudio-sesiones": raw } });
  const result = api.readSessions();

  assert.equal(result.unreadable, true);
  assert.equal(result.raw, raw);
});

test("saveSessions backs up unreadable data before overwriting", () => {
  const raw = "{not json";
  const { api, storage } = loadApp({ rawStorage: { "diario-estudio-sesiones": raw } });

  const saved = api.saveSessions(
    [{ date: "2026-11-02", topic: "Test", minutes: 30 }],
    raw,
  );

  assert.equal(saved, true);
  assert.equal(storage.getItem("diario-estudio-sesiones-respaldo"), raw);
  const stored = JSON.parse(storage.getItem("diario-estudio-sesiones"));
  assert.equal(stored.length, 1);
  assert.equal(stored[0].minutes, 30);
});

test("calculateStreak counts consecutive days ending today", () => {
  const { api } = loadApp();
  const today = "2026-11-15";

  assert.equal(
    api.calculateStreak(
      [session("2026-11-15"), session("2026-11-14"), session("2026-11-13")],
      today,
    ),
    3,
  );

  // Today has no session, but yesterday does: the streak stays alive.
  assert.equal(
    api.calculateStreak([session("2026-11-14"), session("2026-11-13")], today),
    2,
  );

  // A gap stops the streak.
  assert.equal(api.calculateStreak([session("2026-11-15"), session("2026-11-13")], today), 1);

  // Several sessions on the same day count once.
  assert.equal(
    api.calculateStreak(
      [session("2026-11-15"), session("2026-11-15"), session("2026-11-14")],
      today,
    ),
    2,
  );

  // Future sessions do not create a streak today.
  assert.equal(api.calculateStreak([session("2026-11-16")], today), 0);
});

test("calculateBestStreak finds the longest run and ignores future dates", () => {
  const { api } = loadApp();
  const today = "2026-11-15";

  const history = [
    session("2026-11-01"),
    session("2026-11-02"),
    session("2026-11-03"),
    session("2026-11-10"),
    session("2026-11-11"),
    session("2026-11-12"),
  ];
  assert.equal(api.calculateBestStreak(history, today), 3);

  const withFuture = [
    ...history,
    session("2026-11-20"),
    session("2026-11-21"),
    session("2026-11-22"),
    session("2026-11-23"),
  ];
  assert.equal(api.calculateBestStreak(withFuture, today), 3);

  const currentRun = [
    session("2026-11-01"),
    session("2026-11-13"),
    session("2026-11-14"),
    session("2026-11-15"),
  ];
  assert.equal(api.calculateBestStreak(currentRun, today), 3);
});

test("calculateWeekMinutes adds Monday-to-today minutes only", () => {
  const { api } = loadApp();
  const today = "2026-11-15"; // Sunday

  const sessions = [
    session("2026-11-08", 10), // previous Sunday
    session("2026-11-09", 20), // Monday
    session("2026-11-10", 30),
    session("2026-11-10", 5), // same day adds up
    session("2026-11-15", 40),
    session("2026-11-16", 50), // future Monday
  ];

  assert.equal(api.calculateWeekMinutes(sessions, today), 95);
  assert.equal(api.calculateWeekMinutes([], today), 0);
});

test("calculateMonthDays counts distinct days in the current month", () => {
  const { api } = loadApp();
  const today = "2026-11-15";

  const sessions = [
    session("2026-10-31"),
    session("2026-11-01"),
    session("2026-11-01"),
    session("2026-11-02"),
    session("2026-11-15"),
    session("2026-11-20"),
  ];

  assert.equal(api.calculateMonthDays(sessions, today), 3);
  assert.equal(
    api.calculateMonthDays([session("2026-11-01"), session("2026-10-31")], "2026-11-01"),
    1,
  );
});

test("daysWithSession counts each day once", () => {
  const { api } = loadApp();
  const days = api.daysWithSession([session("2026-11-15"), session("2026-11-15")]);

  assert.equal(days.size, 1);
});

test("monthsWithRecords and initialMonth respect the data range", () => {
  const { api } = loadApp();
  const today = "2026-11-15";
  const sessions = [
    session("2026-09-10"),
    session("2026-10-05"),
    session("2026-12-01"), // future
  ];

  assert.deepEqual([...api.monthsWithRecords(sessions, today)], ["2026-09", "2026-10"]);

  const clamped = api.initialMonth(sessions, today);
  assert.equal(clamped.getFullYear(), 2026);
  assert.equal(clamped.getMonth(), 9); // October, the last month with data
  assert.equal(clamped.getDate(), 1);

  const empty = api.initialMonth([], today);
  assert.equal(empty.getFullYear(), 2026);
  assert.equal(empty.getMonth(), 10); // November, the current month
});

test("formatTime formats seconds as MM:SS", () => {
  const { api } = loadApp();

  assert.equal(api.formatTime(0), "00:00");
  assert.equal(api.formatTime(65), "01:05");
  assert.equal(api.formatTime(600), "10:00");
});

test("readSessions migrates legacy data without losing sessions", () => {
  const { storage } = loadApp({
    legacySessions: [{ fecha: "2026-11-01", tema: "Álgebra", minutos: 30 }],
  });

  const saved = JSON.parse(storage.getItem("diario-estudio-sesiones"));
  assert.deepEqual(saved, [{ date: "2026-11-01", topic: "Álgebra", minutes: 30 }]);
});
