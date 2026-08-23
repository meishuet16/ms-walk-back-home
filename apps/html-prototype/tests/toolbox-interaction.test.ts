import assert from "node:assert/strict";
import test from "node:test";
import { toolboxFieldChangeEffect } from "../src/systems/ToolboxInteraction.js";

test("Spin draft change cannot remount the button before click", () => {
  const draft = new EventTarget();
  const button = new EventTarget();
  let remounts = 0;
  let clicks = 0;
  draft.addEventListener("change", () => {
    if (toolboxFieldChangeEffect("spin-choice") === "remount") remounts += 1;
  });
  button.addEventListener("click", () => { clicks += 1; });
  draft.dispatchEvent(new Event("change"));
  button.dispatchEvent(new Event("click"));
  assert.deepEqual({ remounts, clicks }, { remounts: 0, clicks: 1 });
  assert.equal(toolboxFieldChangeEffect("spin-preset-name"), "draft-only");
  assert.equal(toolboxFieldChangeEffect("spin-preset"), "patch");
});
