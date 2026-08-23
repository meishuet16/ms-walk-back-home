import assert from "node:assert/strict";
import test from "node:test";
import { chapterRegistry } from "../src/systems/ChapterRegistry.js";
import { applyChapterExperienceChoice, currentRunProgress, startChapterMemoryExperience } from "../src/systems/ChapterMemoryExperience.js";
import { emptyTendencies } from "../src/systems/TendencySystem.js";
import { initialChapterProgress } from "../src/systems/ChapterProgressManager.js";

const bakeryChapter = chapterRegistry["bakery-day"];

test("current chapter runs isolate choices and tendencies", () => {
  const baseline = emptyTendencies();
  const first = startChapterMemoryExperience({
    chapterId: bakeryChapter.id,
    eventId: bakeryChapter.canonicalClosure.historicalEventId,
    mode: "automatic",
    baselineTendencies: baseline,
    firstCompletionPending: true
  });
  const firstRun = applyChapterExperienceChoice(first, bakeryChapter.dialogue[0].choices![0]);

  const replay = startChapterMemoryExperience({
    chapterId: bakeryChapter.id,
    eventId: bakeryChapter.canonicalClosure.historicalEventId,
    mode: "manual-replay",
    baselineTendencies: baseline,
    firstCompletionPending: false
  });
  const replayRun = applyChapterExperienceChoice(replay, bakeryChapter.dialogue[0].choices![1]);

  assert.notDeepEqual(firstRun.tendencies, replayRun.tendencies);
  assert.deepEqual(replayRun.persistentContribution, emptyTendencies());
  assert.deepEqual(firstRun.choiceIds, [bakeryChapter.dialogue[0].choices![0].id]);
  assert.deepEqual(replayRun.choiceIds, [bakeryChapter.dialogue[0].choices![1].id]);
});

test("current-run progress replaces persisted reflection inputs without rewriting history", () => {
  const persisted = {
    ...initialChapterProgress(bakeryChapter.id),
    choices: ["remember"],
    tendencies: { ...emptyTendencies(), acceptance: 1 }
  };
  const run = startChapterMemoryExperience({
    chapterId: bakeryChapter.id,
    eventId: bakeryChapter.canonicalClosure.historicalEventId,
    mode: "automatic",
    baselineTendencies: persisted.tendencies,
    firstCompletionPending: false
  });
  const current = applyChapterExperienceChoice(run, bakeryChapter.dialogue[0].choices![1]);
  const transient = currentRunProgress(persisted, current);

  assert.deepEqual(transient.choices, [bakeryChapter.dialogue[0].choices![1].id]);
  assert.equal(transient.tendencies.avoidance, 1);
  assert.deepEqual(persisted.choices, ["remember"]);
  assert.equal(persisted.tendencies.avoidance, 0);
});
