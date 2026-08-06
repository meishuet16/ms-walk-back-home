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

test("single bakery chapter choices can branch into distinct ending stories", () => {
  const honest = emptyTendencies();
  honest.acceptance = 1;
  honest.honesty = 1;

  const avoidant = emptyTendencies();
  avoidant.avoidance = 1;
  avoidant.concealment = 1;

  const rewrite = emptyTendencies();
  rewrite.intervention = 1;
  rewrite.concealment = 1;

  const close = emptyTendencies();
  close.closeness = 1;
  close.companionship = 1;

  assert.equal(resolveEnding(honest).id, "walk-home-together");
  assert.equal(resolveEnding(avoidant).id, "unopened-door");
  assert.equal(resolveEnding(rewrite).id, "prettier-memory");
  assert.equal(resolveEnding(close).id, "stay-with-you");
});

test("long-term choices can resolve to at least four distinct endings", () => {
  const acceptance = emptyTendencies();
  acceptance.acceptance = 3;
  acceptance.honesty = 3;

  const avoidance = emptyTendencies();
  avoidance.avoidance = 3;
  avoidance.distance = 3;

  const revision = emptyTendencies();
  revision.intervention = 3;
  revision.concealment = 3;

  const companionship = emptyTendencies();
  companionship.closeness = 3;
  companionship.companionship = 3;

  const endings = new Set([
    resolveEnding(acceptance).id,
    resolveEnding(avoidance).id,
    resolveEnding(revision).id,
    resolveEnding(companionship).id
  ]);

  assert.ok(endings.size >= 4);
});
