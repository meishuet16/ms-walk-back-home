import assert from "node:assert/strict";
import test from "node:test";
import { resolveEnding } from "../src/systems/EndingResolver.js";
import { applyChoice, emptyTendencies } from "../src/systems/TendencySystem.js";
import type { Choice } from "../src/types.js";

test("choices accumulate tendencies without exposing raw values to UI", () => {
  const choice: Choice = {
    id: "remember",
    label: "我记得。",
    effects: { acceptance: 1, honesty: 1 },
    response: "Friend A nods."
  };
  const next = applyChoice(emptyTendencies(), choice);
  assert.equal(next.acceptance, 1);
  assert.equal(next.honesty, 1);
  assert.equal(next.avoidance, 0);
});

test("ending resolver supports the intervention and concealment ending", () => {
  const t = emptyTendencies();
  t.intervention = 3;
  t.concealment = 3;
  assert.equal(resolveEnding(t).id, "prettier-memory");
});

test("ending resolver supports the companionship ending", () => {
  const t = emptyTendencies();
  t.closeness = 2;
  t.companionship = 3;
  t.acceptance = 1;
  assert.equal(resolveEnding(t).id, "stay-with-you");
});
