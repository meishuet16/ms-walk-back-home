import assert from "node:assert/strict";
import test from "node:test";
import { chapterRegistry } from "../src/systems/ChapterRegistry.js";
import { april06Chapter } from "../src/fixtures/april06Chapter.js";
import { resolveChapterReflection } from "../src/systems/EndingResolver.js";
import { applyChoice, emptyTendencies } from "../src/systems/TendencySystem.js";
import type { Choice } from "../src/types.js";
import type { ChapterReflectionInput } from "../src/systems/ChapterMemoryExperience.js";

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

test("reflection resolver selects a quote from current choices while preserving authored closure text", () => {
  const base: ChapterReflectionInput = {
    choices: [],
    tendencies: emptyTendencies()
  };
  const chapter = chapterRegistry["bakery-day"];
  const accepting = resolveChapterReflection(chapter, { ...base, choices: ["remember", "keep"] });
  const notReady = resolveChapterReflection(chapter, { ...base, choices: ["unimportant", "silent-leave"] });
  const rewriting = resolveChapterReflection(chapter, { ...base, choices: ["pretty", "rewrite-me"] });

  assert.deepEqual(accepting.closureLines, notReady.closureLines);
  assert.deepEqual(notReady.closureLines, rewriting.closureLines);
  assert.notEqual(accepting.quoteId, notReady.quoteId);
  assert.notEqual(notReady.quoteId, rewriting.quoteId);
});

test("April 6 reflection quotes follow authored tendency preferences", () => {
  const base: ChapterReflectionInput = {
    choices: [],
    tendencies: emptyTendencies()
  };
  const accepting = resolveChapterReflection(april06Chapter, { ...base, choices: ["delivery-anonymity-car"], tendencies: { ...emptyTendencies(), acceptance: 1, companionship: 1 } });
  const holding = resolveChapterReflection(april06Chapter, { ...base, choices: ["delivery-anonymity-direct"], tendencies: { ...emptyTendencies(), honesty: 1, closeness: 1 } });
  const notReady = resolveChapterReflection(april06Chapter, { ...base, choices: ["delivery-anonymity-quiet"], tendencies: { ...emptyTendencies(), concealment: 1, distance: 1 } });
  assert.equal(accepting.quoteId, "april06-accepting");
  assert.equal(holding.quoteId, "april06-holding");
  assert.equal(notReady.quoteId, "april06-not-ready");
});
