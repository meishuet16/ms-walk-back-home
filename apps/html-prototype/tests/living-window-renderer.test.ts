import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";
import { grayscaleMaskToAlpha, sceneViewportFor, sceneTransformFor } from "../src/systems/LivingWindowRenderer.js";

test("Living Window shares the Muji scene viewport in landscape and portrait", () => {
  assert.deepEqual(sceneViewportFor("landscape", { w: 1536, h: 1024 }), { w: 960, h: 540 });
  assert.deepEqual(sceneViewportFor("portrait", { w: 941, h: 1672 }), { w: 941, h: 1672 });
  assert.deepEqual(sceneTransformFor("landscape", { w: 1536, h: 1024 }, { w: 960, h: 540 }), { source: null, destination: { x: 0, y: 0, w: 960, h: 540 } });
  assert.deepEqual(sceneTransformFor("portrait", { w: 941, h: 1672 }, { w: 941, h: 1672 }), { source: { x: 0, y: 0, w: 941, h: 1672 }, destination: { x: 0, y: 0, w: 941, h: 1672 } });
});

test("Living Window opening normalizes restored focus and renders the panel shell", () => {
  const source = readFileSync(resolve(process.cwd(), "src/app.ts"), "utf8");
  assert.match(source, /normalizeRoomWindowState/);
  assert.match(source, /this\.room = setRoomWindowFocus\(this\.room, true\)/);
  assert.match(source, /this\.livingWindowPanelOpen = true[\s\S]*?this\.renderLivingWindowOverlay\(\)/);
  assert.match(source, /living-window-panel/);
});

test("weather masks convert grayscale luminance to alpha before compositing", () => {
  const source = readFileSync(resolve(process.cwd(), "src/app.ts"), "utf8");
  assert.match(source, /getImageData/);
  assert.match(source, /destination-in/);
  assert.match(source, /drawSceneMask/);
  assert.match(source, /grayscaleMaskToAlpha/);
  assert.doesNotMatch(source, /this\.ctx\.strokeRect\(x, y, w, h\)/);
});
test("grayscale weather masks become transparent outside white glass areas", () => {
  const pixels = new Uint8ClampedArray([0, 0, 0, 255, 255, 255, 255, 255, 128, 128, 128, 255]);
  grayscaleMaskToAlpha(pixels);
  assert.deepEqual([...pixels], [255, 255, 255, 0, 255, 255, 255, 255, 255, 255, 255, 128]);
});

test("weather mask pixels are cached instead of read back on every animation frame", () => {
  const source = readFileSync(resolve(process.cwd(), "src/app.ts"), "utf8");
  assert.match(source, /weatherMaskKey/);
  assert.match(source, /weatherMaskKey !== maskKey/);
});