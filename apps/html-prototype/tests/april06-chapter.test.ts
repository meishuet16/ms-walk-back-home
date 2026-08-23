import assert from "node:assert/strict";
import { test } from "node:test";
import { april06Chapter, april06ReflectionChoices } from "../src/fixtures/april06Chapter.js";
import { chapterRegistry, forestEntries, routeForestEntry } from "../src/systems/ChapterRegistry.js";
import type { TendencyKey } from "../src/types.js";

test("April 6 is registered as the authored 406 chapter", () => {
  assert.equal(april06Chapter.id, "april06-not-gone-yet");
  assert.equal(april06Chapter.runtimeScene, "406");
  assert.equal(april06Chapter.date, "04.06");
  assert.equal(april06Chapter.title, "还没走啊？");
  assert.equal(april06Chapter.canonicalClosure.historicalEventId, "april06-mcd-lobby-memory");
  assert.equal(chapterRegistry["april06-not-gone-yet"], april06Chapter);
  assert.equal(routeForestEntry(forestEntries.find((entry) => entry.chapterId === april06Chapter.id)!).kind, "implemented-chapter");
});

test("April 6 reflection checkpoints expose exactly three choices using only supported tendency keys", () => {
  assert.equal(april06ReflectionChoices.length, 3);
  const supported = new Set<TendencyKey>([
    "acceptance", "avoidance", "closeness", "distance",
    "honesty", "concealment", "companionship", "intervention"
  ]);
  for (const checkpoint of april06ReflectionChoices) {
    assert.equal(checkpoint.choices.length, 3);
    for (const choice of checkpoint.choices) {
      for (const key of Object.keys(choice.effects)) assert.equal(supported.has(key as TendencyKey), true);
    }
  }
});

test("April 6 keeps the canonical closure factual and singular", () => {
  assert.deepEqual(april06Chapter.canonicalClosure.lines, [
    "MS leaves the McDonald's in the KTHO lobby.",
    "ET comes downstairs before MS can leave.",
    "MS returns to the waiting Perodua Alza."
  ]);
  assert.equal(new Set(april06Chapter.canonicalClosure.lines).size, 3);
});
