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
  "daysWithSession",
  "calculateStreak",
  "calculateBestStreak",
  "startOfWeek",
  "calculateWeekMinutes",
  "calculateMonthDays",
  "monthsWithRecords",
  "initialMonth",
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
    addEventListener() {},
    focus() {},
    reset() {},
  };

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
function loadApp({ sessions = null, legacySessions = null } = {}) {
  const initial = {};
  if (sessions) initial["diario-estudio-sesiones"] = JSON.stringify(sessions);
  if (legacySessions) initial["diarioDeEstudio.sesiones"] = JSON.stringify(legacySessions);

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

test("startOfWeek uses Monday as the first day", () => {
  const { api } = loadApp();

  assert.equal(api.startOfWeek("2026-11-15"), "2026-11-09"); // Sunday
  assert.equal(api.startOfWeek("2026-11-09"), "2026-11-09"); // Monday
  assert.equal(api.startOfWeek("2026-11-08"), "2026-11-02"); // previous Sunday
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
