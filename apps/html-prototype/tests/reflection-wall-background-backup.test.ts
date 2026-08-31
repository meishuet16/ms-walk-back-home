import assert from "node:assert/strict";
import test from "node:test";
import { REFLECTION_WALL_BACKGROUND_KEY } from "../src/systems/ReflectionWallVisualPolishBridge.js";

test("Reflection Wall custom background uses a stable backup key", () => {
  assert.equal(REFLECTION_WALL_BACKGROUND_KEY, "walk-back-home:reflection-wall-background:v1");
});
