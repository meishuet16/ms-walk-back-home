import assert from "node:assert/strict";
import test from "node:test";
import { reflectionPaperStyles } from "../src/systems/ReflectionWall.js";
import { installReflectionWallPaperCatalog, reflectionWallExtraPaperStyles } from "../src/systems/ReflectionWallPaperCatalogBridge.js";
import { REFLECTION_WALL_BACKGROUND_KEY } from "../src/systems/ReflectionWallVisualPolishBridge.js";

test("reference paper catalog adds playful stationery without duplicate ids", () => {
  const before = reflectionPaperStyles.length;
  installReflectionWallPaperCatalog();
  const ids = reflectionPaperStyles.map((style) => style.id);
  assert.equal(reflectionPaperStyles.length >= before + 8, true);
  assert.equal(new Set(ids).size, ids.length);
  for (const style of reflectionWallExtraPaperStyles()) assert.equal(ids.includes(style.id), true);
});

test("paper catalog installation is idempotent", () => {
  installReflectionWallPaperCatalog();
  const once = reflectionPaperStyles.length;
  installReflectionWallPaperCatalog();
  assert.equal(reflectionPaperStyles.length, once);
});

test("reflection wall background uses a dedicated local persistence key", () => {
  assert.equal(REFLECTION_WALL_BACKGROUND_KEY, "walk-back-home:reflection-wall-background:v1");
});
