import assert from "node:assert/strict";
import test from "node:test";
import { chapterRegistry } from "../src/systems/ChapterRegistry.js";
import { applyChapterExperienceChoice, currentRunReflectionInput, startChapterMemoryExperience } from "../src/systems/ChapterMemoryExperience.js";
import { emptyTendencies } from "../src/systems/TendencySystem.js";

const bakeryChapter = chapterRegistry["bakery-day"];

test("current chapter runs isolate choices and tendencies", () => {
  const firstRun = applyChapterExperienceChoice(
    startChapterMemoryExperience({ chapterId: bakeryChapter.id, mode: "automatic" }),
    bakeryChapter.dialogue[0].choices![0]
  );
  const replayRun = applyChapterExperienceChoice(
    startChapterMemoryExperience({ chapterId: bakeryChapter.id, mode: "manual-replay" }),
    bakeryChapter.dialogue[0].choices![1]
  );

  assert.notDeepEqual(firstRun.tendencies, replayRun.tendencies);
  assert.equal("persistentContribution" in replayRun, false);
  assert.equal("firstCompletionPending" in replayRun, false);
  assert.deepEqual(firstRun.reflectionChoiceIds, [bakeryChapter.dialogue[0].choices![0].id]);
  assert.deepEqual(replayRun.reflectionChoiceIds, [bakeryChapter.dialogue[0].choices![1].id]);
});

test("a fresh authored run starts without historical completion state", () => {
  const run = startChapterMemoryExperience({ chapterId: bakeryChapter.id, mode: "automatic" });

  assert.deepEqual(run.tendencies, emptyTendencies());
  assert.deepEqual(run.reflectionChoiceIds, []);
  assert.equal(run.mainCompleted, false);
  assert.equal(run.resolvedReflection, undefined);
  assert.equal("persistentContribution" in run, false);
  assert.equal("firstCompletionPending" in run, false);
});

test("current-run reflection input contains only current choices and tendencies", () => {
  const current = applyChapterExperienceChoice(
    startChapterMemoryExperience({ chapterId: bakeryChapter.id, mode: "automatic" }),
    bakeryChapter.dialogue[0].choices![1]
  );
  const input = currentRunReflectionInput(current);

  assert.deepEqual(input.choices, [bakeryChapter.dialogue[0].choices![1].id]);
  assert.equal(input.tendencies.avoidance, 1);
  assert.deepEqual(current.reflectionChoiceIds, [bakeryChapter.dialogue[0].choices![1].id]);
});

test("a reflection choice without an authored response still affects the current closure input", () => {
  const run = applyChapterExperienceChoice(
    startChapterMemoryExperience({ chapterId: bakeryChapter.id, mode: "automatic" }),
    { id: "missing-response", label: "Keep the uncertainty", effects: { honesty: 1 } }
  );

  assert.deepEqual(run.reflectionChoiceIds, ["missing-response"]);
  assert.equal(run.tendencies.honesty, 1);
  assert.deepEqual(currentRunReflectionInput(run).choices, ["missing-response"]);
});
