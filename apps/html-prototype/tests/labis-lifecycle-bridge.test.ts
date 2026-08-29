import assert from "node:assert/strict";
import test from "node:test";
import { normalizeLabisTriggerChapterId, shouldRouteLabisFilterToReflection } from "../src/systems/LabisLifecycleBridge.js";

test("legacy Labis automatic trigger uses the same per-entry chapter trigger session", () => {
  assert.equal(normalizeLabisTriggerChapterId("july19-motor-day"), "labis-motor-day");
  assert.equal(normalizeLabisTriggerChapterId("march30-too-fated"), "march30-too-fated");
});

test("only the approved filter choice routes immediately to final Reflection", () => {
  assert.equal(shouldRouteLabisFilterToReflection("filter"), true);
  assert.equal(shouldRouteLabisFilterToReflection("motor"), false);
  assert.equal(shouldRouteLabisFilterToReflection("photo"), false);
  assert.equal(shouldRouteLabisFilterToReflection(null), false);
});
