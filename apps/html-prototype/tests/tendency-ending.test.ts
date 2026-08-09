import assert from "node:assert/strict";
import test from "node:test";
import { chapterRegistry } from "../src/systems/ChapterRegistry.js";
import { resolveChapterReflection } from "../src/systems/EndingResolver.js";
import { applyChoice, emptyTendencies } from "../src/systems/TendencySystem.js";
import type { ChapterProgress, Choice } from "../src/types.js";

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

test("reflection resolver keeps historical closure fixed across different choices", () => {
  const base: ChapterProgress = {
    chapterId: "bakery-day",
    state: "visited",
    visited: true,
    memoryRead: true,
    dialogueCompleted: true,
    walkedThrough: false,
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
