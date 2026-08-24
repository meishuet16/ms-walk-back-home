import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";
import { toolboxPages, createToolboxState, moveToolSelection, selectTool, confirmTool, toolboxToolRegistry } from "../src/systems/ToolboxModel.js";
import { addSpinChoiceToPreset, createSpinPreset, normalizeSelectedPresetId, spinChoiceIndex, spinWheelGeometry, spinTargetRotation, winnerIndexAtPointer } from "../src/systems/SpinWheel.js";
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

test("Spin actions patch stable regions without rebuilding the Toolbox root", () => {
  const source = readFileSync(resolve(process.cwd(), "src/app.ts"), "utf8");
  assert.match(source, /addSpinChoiceToPreset/);
  assert.match(source, /data-action=toolbox-spin-add/);
  assert.match(source, /refreshSpinWheelView/);
  const addStart = source.indexOf('action === "toolbox-spin-add"');
  const addEnd = source.indexOf('action === "toolbox-spin-remove"', addStart);
  assert.doesNotMatch(source.slice(addStart, addEnd), /renderToolboxOverlay/);
  assert.match(source.slice(addStart, addEnd), /refreshSpinWheelView/);
});
test("Spin Add integration accumulates Latin and Chinese choices into real wheel segments", () => {
  let presets = [createSpinPreset("today", "Today", ["A"])];
  let selectedPresetId = "today";
  for (const choice of ["McD", "鸭饭", "面"]) {
    const result = addSpinChoiceToPreset(presets, selectedPresetId, choice);
    assert.equal(result.added, true);
    presets = result.presets;
    selectedPresetId = result.selectedPresetId;
  }
  const choices = presets[0].choices;
  assert.deepEqual(choices, ["A", "McD", "鸭饭", "面"]);
  const geometry = spinWheelGeometry(choices);
  assert.equal(geometry.segments.length, 4);
  const rotation = spinTargetRotation(choices.length, 3, () => .25, false);
  assert.equal(winnerIndexAtPointer(rotation, choices.length), 3);
});

test("Spin Add tolerates stale preset state and New preset uses an inline naming flow", () => {
  const source = readFileSync(resolve(process.cwd(), "src/app.ts"), "utf8");
  assert.match(source, /toolbox-spin-add.*spinSpinning/);
  assert.match(source, /toolbox-preset-create/);
  assert.doesNotMatch(source, /window.prompt/);
  assert.match(source, /syncSpinWheelForm[\s\S]*?button\.type = "button"/);
  assert.match(source, /field === "spin-choice"[\s\S]*?this\.spinChoiceDraft/);
  assert.match(source, /field === "spin-preset-name"[\s\S]*?this\.spinPresetNameDraft/);
});

test("Media editor controls dispatch through the Toolbox action gate", () => {
  const source = readFileSync(resolve(process.cwd(), "src/app.ts"), "utf8");
  const gateStart = source.indexOf('if (["toolbox-close"');
  const gateEnd = source.indexOf("].includes(action)", gateStart);
  const gate = source.slice(gateStart, gateEnd);
  for (const action of ["media-zoom-in", "media-zoom-out", "media-zoom-reset", "media-play-selection"]) assert.match(gate, new RegExp('"' + action + '"'));
});

test("Local PDF and media jobs patch stable Toolbox regions and expose cancellation", () => {
  const source = readFileSync(resolve(process.cwd(), "src/app.ts"), "utf8");
  for (const method of ["processPdfLocally", "processMediaLocally"]) {
    const start = source.indexOf(`private async ${method}`);
    const end = source.indexOf("\n  private ", start + 1);
    const body = source.slice(start, end < 0 ? undefined : end);
    assert.match(body, /refreshToolbox(?:Pdf|Media)View/);
    assert.doesNotMatch(body, /renderToolboxOverlay\(\)/);
  }
  assert.match(source, /pdf-cancel/);
  assert.match(source, /media-cancel/);
  assert.match(source, /this\.mediaAbortController\?\.abort\(\)/);
});

test("Waveform seeking synchronizes the media preview cursor", () => {
  const source = readFileSync(resolve(process.cwd(), "src/app.ts"), "utf8");
  const start = source.indexOf("private updateMediaWaveformPointer");
  const end = source.indexOf("\n  private playMediaSelection", start);
  assert.match(source.slice(start, end), /currentTime/);
});

test("Selecting PDF files patches the summary without remounting the file control", () => {
  const source = readFileSync(resolve(process.cwd(), "src/app.ts"), "utf8");
  const start = source.indexOf('if (field === "pdf-files"');
  const end = source.indexOf('if (field === "media-mode"', start);
  const body = source.slice(start, end);
  assert.match(body, /refreshToolboxPdfView/);
  assert.doesNotMatch(body, /renderToolboxOverlay/);
});
