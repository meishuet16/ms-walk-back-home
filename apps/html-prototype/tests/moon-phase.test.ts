import assert from "node:assert/strict";
import test from "node:test";
import { calculateMoonPhase, moonPhaseIndex } from "../src/systems/MoonPhase.js";

test("moon phase calculation is local and maps through the supplied eight-frame atlas", () => {
  const newMoon = calculateMoonPhase(new Date("2000-01-06T18:14:00.000Z"));
  assert.equal(newMoon.index, 0);
  assert.equal(newMoon.label, "New moon");
  assert.equal(moonPhaseIndex(new Date("2000-01-21T21:00:00.000Z")), 4);
});

test("moon phase output includes illumination and stable frame index", () => {
  const phase = calculateMoonPhase(new Date("2026-08-23T00:00:00.000Z"));
  assert.ok(phase.illuminationPercent >= 0 && phase.illuminationPercent <= 100);
  assert.ok(phase.index >= 0 && phase.index < 8);
  assert.ok(phase.ageDays >= 0 && phase.ageDays < 30);
});
