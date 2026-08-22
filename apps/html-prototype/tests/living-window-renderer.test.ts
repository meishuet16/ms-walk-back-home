import assert from "node:assert/strict";
import test from "node:test";
import { sceneViewportFor, sceneTransformFor } from "../src/systems/LivingWindowRenderer.js";

test("Living Window shares the Muji scene viewport in landscape and portrait", () => {
  assert.deepEqual(sceneViewportFor("landscape", { w: 1536, h: 1024 }), { w: 960, h: 540 });
  assert.deepEqual(sceneViewportFor("portrait", { w: 941, h: 1672 }), { w: 941, h: 1672 });
  assert.deepEqual(sceneTransformFor("landscape", { w: 1536, h: 1024 }, { w: 960, h: 540 }), { source: null, destination: { x: 0, y: 0, w: 960, h: 540 } });
  assert.deepEqual(sceneTransformFor("portrait", { w: 941, h: 1672 }, { w: 941, h: 1672 }), { source: { x: 0, y: 0, w: 941, h: 1672 }, destination: { x: 0, y: 0, w: 941, h: 1672 } });
});
