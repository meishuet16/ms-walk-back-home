import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";
import { toolboxPages, createToolboxState, moveToolSelection, selectTool, confirmTool, toolboxToolRegistry } from "../src/systems/ToolboxModel.js";
import { normalizeSelectedPresetId, spinChoiceIndex, spinWheelGeometry, spinTargetRotation, winnerIndexAtPointer } from "../src/systems/SpinWheel.js";
import { evaluateCalculator, formatCalculatorValue } from "../src/systems/Calculator.js";
import { convertUnit, formatUnitValue, swapUnits } from "../src/systems/UnitConverter.js";
import { completeTimerIfNeeded, createTimerState, startTimer, timerRemaining } from "../src/systems/TimerTool.js";
import { dateDifference, addDateDays, localDateString, relativeDateLabel } from "../src/systems/DateTool.js";

test("toolbox registry keeps six-slot pages stable and leaves page two sparse", () => {
  const pages = toolboxPages();
  assert.deepEqual(pages.map((page) => page.map((tool) => tool.id)), [
    ["spin-wheel", "calculator", "converter", "currency", "timer", "date"],
    ["pdf", "media"]
  ]);
  assert.equal(toolboxToolRegistry.length, 8);
  assert.equal(createToolboxState({ selected: "pdf" }).page, 1);
  assert.equal(moveToolSelection(createToolboxState({ selected: "pdf" }), "right", 2).selected, "media");
  assert.equal(confirmTool(selectTool(createToolboxState({ selected: "pdf" }), "pdf")).selected, "pdf");
});

test("spin geometry chooses one winner and maps the pointer back to that index", () => {
  assert.equal(spinChoiceIndex(["A", "B", "C"], () => .5), 1);
  const target = spinTargetRotation(3, 1, () => .25, false);
  const geometry = spinWheelGeometry(["A", "B", "C"], target);
  assert.equal(geometry.segments.length, 3);
  assert.equal(winnerIndexAtPointer(target, 3), 1);
});

test("calculator uses contextual percentages and compact output", () => {
  assert.equal(evaluateCalculator("200 + 10%").value, 220);
  assert.equal(evaluateCalculator("200 - 10%").value, 180);
  assert.equal(evaluateCalculator("200 * 10%").value, 20);
  assert.equal(evaluateCalculator("200 / 10%").value, 2000);
  assert.equal(formatCalculatorValue(.1 + .2), "0.3");
});

test("converter swaps units and formats reactive results", () => {
  assert.equal(convertUnit("length", 100, "cm", "m"), 1);
  assert.deepEqual(swapUnits("cm", "m"), { from: "m", to: "cm" });
  assert.equal(formatUnitValue(1), "1");
});

test("timer completion is a single state transition and never goes negative", () => {
  let state = startTimer(createTimerState("timer", 1000), 10);
  assert.equal(timerRemaining(state, 2010), 0);
  const completed = completeTimerIfNeeded(state, 2010);
  assert.equal(completed.completed, true);
  state = completed.state;
  assert.equal(completeTimerIfNeeded(state, 3010).completed, false);
});

test("date helpers support local-date relative labels", () => {
  assert.equal(dateDifference("2026-03-30", "2026-04-02"), 3);
  assert.equal(addDateDays("2026-02-28", 2), "2026-03-02");
  assert.equal(relativeDateLabel("2026-09-09", "2026-08-23"), "17 days until");
  assert.equal(relativeDateLabel("2026-08-01", "2026-08-23"), "22 days since");
});

test("stale Spin preset ids restore to the first available preset", () => {
  const presets = [{ id: "today", name: "Today", choices: ["A"] }, { id: "names", name: "Names", choices: ["Mochi"] }];
  assert.equal(normalizeSelectedPresetId(presets, "deleted-preset"), "today");
  assert.equal(normalizeSelectedPresetId(presets, "names"), "names");
});

test("local date helper uses the local calendar fields", () => {
  const date = new Date(2026, 7, 23, 23, 59, 58);
  const expected = [date.getFullYear(), String(date.getMonth() + 1).padStart(2, "0"), String(date.getDate()).padStart(2, "0")].join("-");
  assert.equal(localDateString(date), expected);
});

test("Toolbox keyboard guards protect handled events and focused buttons", () => {
  const source = readFileSync(resolve(process.cwd(), "src/app.ts"), "utf8");
  assert.ok((source.match(/if \(event\.defaultPrevented\) return;/g) ?? []).length >= 2);
  assert.match(source, /input, textarea, select, button, audio, video/);
  assert.doesNotMatch(source, /focusedControl && event\.key !== "Escape"/);
});
