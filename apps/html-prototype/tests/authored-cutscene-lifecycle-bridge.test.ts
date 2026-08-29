import assert from "node:assert/strict";
import test from "node:test";
import { planAuthoredCutsceneCompletion } from "../src/systems/AuthoredCutsceneLifecycleBridge.js";

test("gated WORLD Main completes without showing the legacy ending", () => {
  assert.deepEqual(planAuthoredCutsceneCompletion({
    mode: "main",
    reflectionAfterEchoId: "elevator",
    reflectionChoiceCount: 3
  }), {
    markMainCompleted: true,
    markEchoId: "",
    beginReflection: false,
    showLegacyMainEnding: false
  });
});

test("the configured WORLD Echo starts the shared Reflection chain", () => {
  assert.deepEqual(planAuthoredCutsceneCompletion({
    mode: "echo",
    echoId: "elevator",
    reflectionAfterEchoId: "elevator",
    reflectionChoiceCount: 3
  }), {
    markMainCompleted: false,
    markEchoId: "elevator",
    beginReflection: true,
    showLegacyMainEnding: false
  });
});

test("unrelated Echoes still finish normally", () => {
  assert.deepEqual(planAuthoredCutsceneCompletion({
    mode: "echo",
    echoId: "gift-residue",
    reflectionAfterEchoId: "elevator",
    reflectionChoiceCount: 3
  }), {
    markMainCompleted: false,
    markEchoId: "gift-residue",
    beginReflection: false,
    showLegacyMainEnding: false
  });
});

test("WORLD chapters without an Echo Reflection gate preserve the legacy Main ending", () => {
  assert.deepEqual(planAuthoredCutsceneCompletion({
    mode: "main",
    reflectionChoiceCount: 0
  }), {
    markMainCompleted: true,
    markEchoId: "",
    beginReflection: false,
    showLegacyMainEnding: true
  });
});
