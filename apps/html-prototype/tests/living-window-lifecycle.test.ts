import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";
import { normalizeRoomWindowState, createDefaultRoomState } from "../src/systems/MujiRoom.js";

test("Window interaction opens the Living Window panel without a physical weather renderer", () => {
  const source = readFileSync(resolve(process.cwd(), "src/app.ts"), "utf8");
  assert.match(source, /this\.livingWindowPanelOpen = true[\s\S]*?this\.renderLivingWindowOverlay\(\)/);
  assert.match(source, /living-window-panel/);
  assert.doesNotMatch(source, /drawLivingWindowWeather/);
  assert.doesNotMatch(source, /drawWindowFocus/);
  assert.doesNotMatch(source, /weatherCanvas|weatherMaskCanvas|getImageData|putImageData|drawSceneMask|sceneTransformFor/);
});

test("panel renders before weather loading and stays open through network failure", () => {
  const source = readFileSync(resolve(process.cwd(), "src/app.ts"), "utf8");
  const roomWindow = source.slice(source.indexOf("private roomWindow"));
  assert.match(roomWindow, /this\.livingWindowPanelOpen = true[\s\S]*?this\.renderLivingWindowOverlay\(\)[\s\S]*?void this\.loadLivingWindowWeather\(\)/);
  const roomWindowMethod = roomWindow.slice(0, roomWindow.indexOf("private roomLamp"));
  assert.doesNotMatch(roomWindowMethod, /this\.autosave\(\)/);
  assert.match(source, /catch \{[\s\S]*?livingWindowStatus = livingWindowStatusCopy\(this\.livingWindowWeather, "error"\)/);
  assert.match(source, /if \(this\.livingWindowPanelOpen\) this\.renderLivingWindowOverlay\(\)/);
});

test("legacy windowFocus is stripped while the panel remains closed after reload", () => {
  const source = readFileSync(resolve(process.cwd(), "src/app.ts"), "utf8");
  assert.doesNotMatch(source, /this\.room\.windowFocus|setRoomWindowFocus/);
  assert.match(source, /normalizeRoomWindowState\(\{ \.\.\.this\.room, \.\.\.state\.room \}\)/);
  assert.match(source, /this\.livingWindowPanelOpen = false/);
  const legacy = { ...createDefaultRoomState(), windowFocus: true };
  assert.equal("windowFocus" in normalizeRoomWindowState(legacy), false);
});

test("Window frames do not query or draw the Spin canvas while the panel is open", () => {
  const source = readFileSync(resolve(process.cwd(), "src/app.ts"), "utf8");
  const draw = source.slice(source.indexOf("private drawSpinWheelCanvas"), source.indexOf("private async processPdfLocally"));
  assert.match(draw, /if \(!this\.toolboxOpen/);
  assert.match(draw, /this\.toolboxView\.selected !== "spin-wheel"/);
});
