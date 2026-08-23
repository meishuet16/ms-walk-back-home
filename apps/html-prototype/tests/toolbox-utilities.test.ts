import assert from "node:assert/strict";
import test from "node:test";
import { addSpinChoice, createSpinPreset, deleteSpinPreset, renameSpinPreset, removeSpinChoice, spinChoice } from "../src/systems/SpinWheel.js";
import { applyCalculatorInput, evaluateCalculator } from "../src/systems/Calculator.js";
import { convertUnit } from "../src/systems/UnitConverter.js";
import { createTimerState, pauseTimer, resetTimer, startTimer, timerRemaining, stopwatchElapsed } from "../src/systems/TimerTool.js";
import { addDateDays, dateDifference, parseLocalDate } from "../src/systems/DateTool.js";

test("spin wheel handles choices, presets, and injectable randomness", () => {
  assert.deepEqual(addSpinChoice([], " A "), ["A"]);
  assert.deepEqual(addSpinChoice(["A"], "A"), ["A", "A"]);
  assert.deepEqual(removeSpinChoice(["A", "B"], 0), ["B"]);
  assert.equal(spinChoice([], () => 0), null);
  assert.equal(spinChoice(["only"], () => 0.99), "only");
  assert.equal(spinChoice(["A", "B", "C"], () => 0.5), "B");
  const preset = createSpinPreset("meal", "今天吃什么", ["A", "B"]);
  assert.equal(renameSpinPreset(preset, "今晚吃什么").name, "今晚吃什么");
  assert.deepEqual(deleteSpinPreset([preset], "meal"), []);
});

test("calculator supports everyday operations, decimals, percentage, clear, and backspace", () => {
  assert.equal(evaluateCalculator("12 + 3 * 2").value, 18);
  assert.equal(evaluateCalculator("10 / 0").value, null);
  assert.equal(evaluateCalculator("12.5 - 2.5").value, 10);
  assert.equal(evaluateCalculator("200 + 10%").value, 220);
  assert.equal(applyCalculatorInput("123", "backspace"), "12");
  assert.equal(applyCalculatorInput("123", "clear"), "0");
});

test("unit converter handles length, temperature, storage, time, and invalid input", () => {
  assert.equal(convertUnit("length", 100, "cm", "m"), 1);
  assert.equal(convertUnit("temperature", 32, "F", "C"), 0);
  assert.equal(convertUnit("storage", 1, "GB", "MB"), 1024);
  assert.equal(convertUnit("time", 2, "hours", "minutes"), 120);
  assert.equal(convertUnit("length", Number.NaN, "cm", "m"), null);
});

test("timer and stopwatch use timestamps and preserve pause/resume/reset behavior", () => {
  let timer = createTimerState("timer", 10_000);
  timer = startTimer(timer, 1_000);
  assert.equal(timerRemaining(timer, 4_000), 7_000);
  timer = pauseTimer(timer, 4_000);
  assert.equal(timerRemaining(timer, 9_000), 7_000);
  timer = startTimer(timer, 10_000);
  assert.equal(timerRemaining(timer, 12_000), 5_000);
  assert.equal(timerRemaining(resetTimer(timer), 12_000), 10_000);
  let stopwatch = startTimer(createTimerState("stopwatch"), 500);
  assert.equal(stopwatchElapsed(stopwatch, 2_500), 2_000);
  stopwatch = pauseTimer(stopwatch, 2_500);
  assert.equal(stopwatchElapsed(stopwatch, 9_000), 2_000);
});

test("date helpers use local calendar dates instead of UTC parsing", () => {
  assert.deepEqual(parseLocalDate("2026-03-30"), { year: 2026, month: 3, day: 30 });
  assert.equal(dateDifference("2026-03-30", "2026-04-02"), 3);
  assert.equal(addDateDays("2026-03-30", 3), "2026-04-02");
  assert.equal(addDateDays("2026-03-30", -1), "2026-03-29");
  assert.equal(parseLocalDate("2026-02-31"), null);
});
