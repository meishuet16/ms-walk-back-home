import assert from "node:assert/strict";
import test from "node:test";
import { toolboxFieldChangeEffect } from "../src/systems/ToolboxInteraction.js";

test("Spin draft changes do not remount the button before click", () => {
  assert.equal(toolboxFieldChangeEffect("spin-choice"), "draft-only");
  assert.equal(toolboxFieldChangeEffect("spin-preset-name"), "draft-only");
  assert.equal(toolboxFieldChangeEffect("spin-preset"), "patch");
  assert.equal(toolboxFieldChangeEffect("media-file"), "patch");
  assert.equal(toolboxFieldChangeEffect("calculator-amount"), "remount");
});
