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
  "isValidGoalMinutes",
  "parseGoalMinutes",
  "formatMinutesValue",
  "formatWeeklyProgress",
  "formatGoalStatus",
  "buildWeeklyGoalStatus",
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
  "readGoal",
  "saveGoal",
  "clearGoal",
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

function makeStorage(
  initial = {},
  { failRead = false, failWrite = false, failRemove = false } = {},
) {
  const values = new Map(Object.entries(initial));
  const writes = [];

  return {
    getItem(key) {
      if (failRead) throw new Error("read failed");
      return values.has(key) ? values.get(key) : null;
    },
    setItem(key, value) {
      if (failWrite) throw new Error("write failed");
      values.set(key, String(value));
      writes.push(key);
    },
    removeItem(key) {
      if (failRemove) throw new Error("remove failed");
      values.delete(key);
      writes.push(key);
    },
    keys() {
      return [...values.keys()];
    },
    writes,
  };
}

// Loads app.js in a minimal DOM so the pure functions can be tested without a browser.
function loadApp({
  sessions = null,
  legacySessions = null,
  rawStorage = null,
  goal = null,
  rawGoal = null,
  storageOptions = {},
} = {}) {
  const initial = {};
  if (sessions) initial["diario-estudio-sesiones"] = JSON.stringify(sessions);
  if (legacySessions) initial["diarioDeEstudio.sesiones"] = JSON.stringify(legacySessions);
  if (rawStorage) Object.assign(initial, rawStorage);
  if (goal !== null) initial["diario-estudio-objetivo"] = JSON.stringify({ minutes: goal });
  if (rawGoal !== null) initial["diario-estudio-objetivo"] = rawGoal;

  const storage = makeStorage(initial, storageOptions);
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

test("isValidGoalMinutes accepts only integers between 1 and 10080", () => {
  const { api } = loadApp();

  assert.equal(api.isValidGoalMinutes(1), true);
  assert.equal(api.isValidGoalMinutes(600), true);
  assert.equal(api.isValidGoalMinutes(10080), true);

  assert.equal(api.isValidGoalMinutes(0), false);
  assert.equal(api.isValidGoalMinutes(-1), false);
  assert.equal(api.isValidGoalMinutes(10081), false);
  assert.equal(api.isValidGoalMinutes(12.5), false);
  assert.equal(api.isValidGoalMinutes("600"), false);
  assert.equal(api.isValidGoalMinutes(Number.NaN), false);
  assert.equal(api.isValidGoalMinutes(Infinity), false);
  assert.equal(api.isValidGoalMinutes(null), false);
  assert.equal(api.isValidGoalMinutes(undefined), false);
});

test("parseGoalMinutes reads trimmed digit-only text", () => {
  const { api } = loadApp();

  assert.equal(api.parseGoalMinutes("1"), 1);
  assert.equal(api.parseGoalMinutes("10080"), 10080);
  assert.equal(api.parseGoalMinutes(" 600 "), 600);
  assert.equal(api.parseGoalMinutes("030"), 30);

  assert.equal(api.parseGoalMinutes("10081"), null);
  assert.equal(api.parseGoalMinutes("0"), null);
  assert.equal(api.parseGoalMinutes("-5"), null);
  assert.equal(api.parseGoalMinutes("12.5"), null);
  assert.equal(api.parseGoalMinutes("12,5"), null);
  assert.equal(api.parseGoalMinutes("abc"), null);
  assert.equal(api.parseGoalMinutes(""), null);
  assert.equal(api.parseGoalMinutes("1e3"), null);
  assert.equal(api.parseGoalMinutes("+5"), null);
  assert.equal(api.parseGoalMinutes(null), null);
  assert.equal(api.parseGoalMinutes(undefined), null);
});

test("formatMinutesValue uses the 'N min' format and comma decimals", () => {
  const { api } = loadApp();

  assert.equal(api.formatMinutesValue(600), "600 min");
  assert.equal(api.formatMinutesValue(1), "1 min");
  assert.equal(api.formatMinutesValue(99.5), "99,5 min");
  assert.equal(api.formatMinutesValue(100), "100 min");
  assert.equal(api.formatMinutesValue(0), "0 min");
  // No thousands separator: the maximum goal reads "10080 min".
  assert.equal(api.formatMinutesValue(10080), "10080 min");
});

test("formatWeeklyProgress uses the exact weekly label", () => {
  const { api } = loadApp();

  assert.equal(api.formatWeeklyProgress(0), "Minutos esta semana: 0 min");
  assert.equal(api.formatWeeklyProgress(99.5), "Minutos esta semana: 99,5 min");
  assert.equal(api.formatWeeklyProgress(600), "Minutos esta semana: 600 min");
});

test("formatGoalStatus returns the Spanish state or an empty text", () => {
  const { api } = loadApp();

  assert.equal(api.formatGoalStatus(true), "Objetivo alcanzado");
  assert.equal(api.formatGoalStatus(false), "Objetivo no alcanzado");
  assert.equal(api.formatGoalStatus(null), "");
});

test("buildWeeklyGoalStatus reports no goal for invalid goal values", () => {
  const { api } = loadApp();
  const today = "2026-11-04";
  const sessions = [session("2026-11-02", 30), session("2026-11-04", 20)];

  [null, undefined, 0, 10081].forEach((goal) => {
    const status = api.buildWeeklyGoalStatus(sessions, goal, today);

    assert.equal(status.hasGoal, false);
    assert.equal(status.goal, null);
    assert.equal(status.reached, null);
    // The weekly progress is still reported, but there is nothing to compare it with.
    assert.equal(status.progress, 50);
  });
});

test("buildWeeklyGoalStatus compares the real progress with the goal", () => {
  const { api } = loadApp();
  const today = "2026-11-04";

  const below = api.buildWeeklyGoalStatus([session("2026-11-04", 99)], 100, today);
  assert.deepEqual({ ...below }, { hasGoal: true, goal: 100, progress: 99, reached: false });

  const equal = api.buildWeeklyGoalStatus([session("2026-11-04", 100)], 100, today);
  assert.deepEqual({ ...equal }, { hasGoal: true, goal: 100, progress: 100, reached: true });

  // Above the goal: reached and the real progress is not trimmed to the goal.
  const above = api.buildWeeklyGoalStatus(
    [session("2026-11-02", 100), session("2026-11-04", 30)],
    100,
    today,
  );
  assert.deepEqual({ ...above }, { hasGoal: true, goal: 100, progress: 130, reached: true });

  // Decimals are compared without rounding: 99.5 does not reach 100.
  const decimalBelow = api.buildWeeklyGoalStatus([session("2026-11-04", 99.5)], 100, today);
  assert.equal(decimalBelow.progress, 99.5);
  assert.equal(decimalBelow.reached, false);

  // 100.0 minutes do reach a goal of 100.
  const decimalEqual = api.buildWeeklyGoalStatus([session("2026-11-04", 100.0)], 100, today);
  assert.equal(decimalEqual.progress, 100);
  assert.equal(decimalEqual.reached, true);

  // Goal limits: 1 and 10080.
  const minimum = api.buildWeeklyGoalStatus([session("2026-11-04", 1)], 1, today);
  assert.equal(minimum.reached, true);
  const maximum = api.buildWeeklyGoalStatus([session("2026-11-04", 10080)], 10080, today);
  assert.equal(maximum.reached, true);
});

test("buildWeeklyGoalStatus counts Monday through today only", () => {
  const { api } = loadApp();

  // Wednesday: several sessions today, one yesterday, a future one and the previous Sunday.
  const wednesdaySessions = [
    session("2026-11-04", 30),
    session("2026-11-04", 15),
    session("2026-11-03", 25),
    session("2026-11-05", 99), // future
    session("2026-11-01", 40), // previous Sunday
  ];
  const wednesday = api.buildWeeklyGoalStatus(wednesdaySessions, 100, "2026-11-04");
  assert.equal(wednesday.progress, 70);
  assert.equal(wednesday.reached, false);
  assert.equal(wednesday.progress, api.calculateWeekMinutes(wednesdaySessions, "2026-11-04"));

  // Monday: only today counts.
  const mondaySessions = [
    session("2026-11-02", 40),
    session("2026-11-01", 60), // previous Sunday
    session("2026-11-03", 50), // future
  ];
  const monday = api.buildWeeklyGoalStatus(mondaySessions, 40, "2026-11-02");
  assert.equal(monday.progress, 40);
  assert.equal(monday.reached, true);
  assert.equal(monday.progress, api.calculateWeekMinutes(mondaySessions, "2026-11-02"));

  // Sunday: the whole week counts, but the next Monday does not.
  const sundaySessions = [
    session("2026-11-02", 20),
    session("2026-11-08", 30),
    session("2026-11-09", 90), // next Monday, future
  ];
  const sunday = api.buildWeeklyGoalStatus(sundaySessions, 60, "2026-11-08");
  assert.equal(sunday.progress, 50);
  assert.equal(sunday.reached, false);
  assert.equal(sunday.progress, api.calculateWeekMinutes(sundaySessions, "2026-11-08"));

  // No sessions this week: progress is 0.
  const empty = api.buildWeeklyGoalStatus([], 100, "2026-11-04");
  assert.deepEqual({ ...empty }, { hasGoal: true, goal: 100, progress: 0, reached: false });
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

test("readGoal reports no goal when the key is missing", () => {
  const { api } = loadApp();

  assert.deepEqual({ ...api.readGoal() }, { goal: null, unreadable: false, raw: null });
});

test("readGoal reads a valid stored goal", () => {
  const { api } = loadApp({ rawStorage: { "diario-estudio-objetivo": '{"minutes":600}' } });
  assert.deepEqual({ ...api.readGoal() }, { goal: 600, unreadable: false, raw: null });

  const minimum = loadApp({ rawStorage: { "diario-estudio-objetivo": '{"minutes":1}' } });
  assert.equal(minimum.api.readGoal().goal, 1);

  const maximum = loadApp({ rawStorage: { "diario-estudio-objetivo": '{"minutes":10080}' } });
  assert.equal(maximum.api.readGoal().goal, 10080);
});

test("readGoal treats unknown shapes as unreadable and keeps the raw text", () => {
  const rawValues = [
    "{not json",
    "[600]",
    "null",
    "600",
    '{"minutes":0}',
    '{"minutes":12.5}',
    '{"minutes":10081}',
    '{"minutes":"600"}',
  ];

  rawValues.forEach((raw) => {
    const { api } = loadApp({ rawStorage: { "diario-estudio-objetivo": raw } });
    const result = api.readGoal();

    assert.deepEqual(
      { ...result },
      { goal: null, unreadable: true, raw },
      `expected "${raw}" to be unreadable`,
    );
  });
});

test("readGoal reports an unreadable goal when storage fails", () => {
  const { api } = loadApp({ storageOptions: { failRead: true } });

  assert.deepEqual({ ...api.readGoal() }, { goal: null, unreadable: true, raw: null });
});

test("saveGoal backs up the unreadable value before writing the new goal", () => {
  const raw = "{not json";
  const { api, storage } = loadApp({ rawGoal: raw });

  assert.equal(api.saveGoal(600, raw), true);
  assert.equal(storage.getItem("diario-estudio-objetivo-respaldo"), raw);
  assert.deepEqual(JSON.parse(storage.getItem("diario-estudio-objetivo")), { minutes: 600 });
  // The backup is written first so the original value is never lost.
  assert.deepEqual(storage.writes, [
    "diario-estudio-objetivo-respaldo",
    "diario-estudio-objetivo",
  ]);

  // The saved goal survives a later read.
  assert.deepEqual({ ...api.readGoal() }, { goal: 600, unreadable: false, raw: null });
});

test("saveGoal keeps an existing backup and adds a timestamped one", () => {
  const raw = "{another bad goal";
  const { api, storage } = loadApp({
    rawGoal: raw,
    rawStorage: { "diario-estudio-objetivo-respaldo": "previous backup" },
  });

  assert.equal(api.saveGoal(1200, raw), true);
  assert.equal(storage.getItem("diario-estudio-objetivo-respaldo"), "previous backup");

  const timestamped = storage
    .keys()
    .filter((key) => key.startsWith("diario-estudio-objetivo-respaldo-"));
  assert.equal(timestamped.length, 1);
  assert.equal(storage.getItem(timestamped[0]), raw);
  assert.deepEqual(JSON.parse(storage.getItem("diario-estudio-objetivo")), { minutes: 1200 });
});

test("saveGoal rejects invalid minutes without writing anything", () => {
  const { api, storage } = loadApp();
  const invalid = [0, -1, 10081, 12.5, "600", null, undefined, Number.NaN];

  invalid.forEach((value) => {
    assert.equal(api.saveGoal(value), false);
    assert.equal(api.saveGoal(value, "{bad goal"), false);
  });

  assert.deepEqual(storage.keys(), []);
  assert.deepEqual(storage.writes, []);
});

test("saveGoal keeps the previous goal when the write fails", () => {
  const { api, storage } = loadApp({ goal: 600, storageOptions: { failWrite: true } });

  assert.equal(api.saveGoal(300), false);
  assert.deepEqual(JSON.parse(storage.getItem("diario-estudio-objetivo")), { minutes: 600 });
  assert.deepEqual({ ...api.readGoal() }, { goal: 600, unreadable: false, raw: null });
});

test("saveGoal does not overwrite an unreadable value if its backup fails", () => {
  const raw = "{not json";
  const { api, storage } = loadApp({ rawGoal: raw, storageOptions: { failWrite: true } });

  assert.equal(api.saveGoal(600, raw), false);
  assert.equal(storage.getItem("diario-estudio-objetivo"), raw);
  assert.equal(storage.getItem("diario-estudio-objetivo-respaldo"), null);
});

test("clearGoal removes only the goal key", () => {
  const sessions = [session("2026-11-04", 30)];
  const { api, storage } = loadApp({ goal: 600, sessions });
  const sessionsBefore = storage.getItem("diario-estudio-sesiones");

  assert.equal(api.clearGoal(), true);
  assert.equal(storage.getItem("diario-estudio-objetivo"), null);
  assert.equal(storage.getItem("diario-estudio-sesiones"), sessionsBefore);
  assert.deepEqual({ ...api.readGoal() }, { goal: null, unreadable: false, raw: null });
});

test("clearGoal keeps the goal when removing it fails", () => {
  const { api, storage } = loadApp({ goal: 600, storageOptions: { failRemove: true } });

  assert.equal(api.clearGoal(), false);
  assert.deepEqual(JSON.parse(storage.getItem("diario-estudio-objetivo")), { minutes: 600 });
});

test("goal storage never touches the sessions key", () => {
  const sessions = [session("2026-11-04", 30)];
  const { api, storage } = loadApp({ sessions, rawGoal: "{not json" });
  const sessionsBefore = storage.getItem("diario-estudio-sesiones");

  assert.equal(api.saveGoal(600, "{not json"), true);
  assert.equal(api.clearGoal(), true);
  assert.equal(api.saveGoal(300), true);

  assert.equal(storage.getItem("diario-estudio-sesiones"), sessionsBefore);
  assert.equal(storage.writes.includes("diario-estudio-sesiones"), false);
  assert.equal(storage.writes.includes("diario-estudio-sesiones-respaldo"), false);
});

test("an unreadable goal does not change readable sessions", () => {
  const sessionsRaw = JSON.stringify([{ date: "2026-11-04", topic: "Test", minutes: 30 }]);
  const { api, storage } = loadApp({
    rawStorage: {
      "diario-estudio-sesiones": sessionsRaw,
      "diario-estudio-objetivo": "{not json",
    },
  });

  assert.deepEqual({ ...api.readGoal() }, { goal: null, unreadable: true, raw: "{not json" });
  assert.equal(api.readSessions().unreadable, false);
  assert.equal(storage.getItem("diario-estudio-sesiones"), sessionsRaw);
});

test("a valid goal is still read when sessions are unreadable", () => {
  const { api, storage } = loadApp({
    rawStorage: {
      "diario-estudio-sesiones": "{bad sessions",
      "diario-estudio-objetivo": '{"minutes":600}',
    },
  });
  const sessionsRaw = storage.getItem("diario-estudio-sesiones");

  assert.deepEqual({ ...api.readGoal() }, { goal: 600, unreadable: false, raw: null });
  assert.equal(api.readSessions().unreadable, true);
  assert.equal(storage.getItem("diario-estudio-sesiones"), sessionsRaw);
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
