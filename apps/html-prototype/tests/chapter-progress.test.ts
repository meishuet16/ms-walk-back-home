import assert from "node:assert/strict";
import test from "node:test";
import { chapterRegistry } from "../src/systems/ChapterRegistry.js";
import { authoredEchoIsAvailable, authoredRuntimeByScene } from "../src/systems/AuthoredChapterRegistry.js";
import { applyChapterExperienceChoice, currentRunReflectionInput, markChapterEchoDiscovered, markChapterMainCompleted, startChapterMemoryExperience } from "../src/systems/ChapterMemoryExperience.js";
import { resolveChapterReflection } from "../src/systems/EndingResolver.js";
import { consumeAutomaticChapterTrigger, createChapterTriggerSession, resetChapterTriggerSession } from "../src/systems/ChapterProgressManager.js";

test("a new chapter run starts with no authored completion or discovery", () => {
  const run = startChapterMemoryExperience({ chapterId: "bakery-day", mode: "automatic" });

  assert.equal(run.mainCompleted, false);
  assert.deepEqual(run.reflectionChoiceIds, []);
  assert.deepEqual([...run.discoveredEchoIds], []);
  assert.equal(run.resolvedReflection, undefined);
});

test("replay resolves its closing quote from the current run only", () => {
  const chapter = chapterRegistry["bakery-day"];
  const first = applyChapterExperienceChoice(
    startChapterMemoryExperience({ chapterId: chapter.id, mode: "automatic" }),
    chapter.dialogue[0].choices![0]
  );
  const firstReflection = resolveChapterReflection(chapter, currentRunReflectionInput(first));
  const replay = applyChapterExperienceChoice(
    startChapterMemoryExperience({ chapterId: chapter.id, mode: "manual-replay" }),
    chapter.dialogue[0].choices![1]
  );
  const replayReflection = resolveChapterReflection(chapter, currentRunReflectionInput(replay));

  assert.notEqual(firstReflection.quoteId, replayReflection.quoteId);
  assert.deepEqual(replay.reflectionChoiceIds, [chapter.dialogue[0].choices![1].id]);
  assert.notDeepEqual(replay.tendencies, first.tendencies);
});

test("main completion and echo discovery reset on a fresh run", () => {
  const first = markChapterEchoDiscovered(markChapterMainCompleted(startChapterMemoryExperience({ chapterId: "625", mode: "automatic" })), "bed-night-memory");
  const second = startChapterMemoryExperience({ chapterId: "625", mode: "automatic" });

  assert.equal(first.mainCompleted, true);
  assert.equal(first.discoveredEchoIds.has("bed-night-memory"), true);
  assert.equal(second.mainCompleted, false);
  assert.equal(second.discoveredEchoIds.has("bed-night-memory"), false);
});

test("625 bed-night-memory is gated by main completion in the current run", () => {
  const runtime = authoredRuntimeByScene["625"];
  const fresh = startChapterMemoryExperience({ chapterId: "625", mode: "automatic" });
  const completed = markChapterMainCompleted(fresh);

  assert.equal(authoredEchoIsAvailable(runtime, "bed-night-memory", fresh.mainCompleted), false);
  assert.equal(authoredEchoIsAvailable(runtime, "bed-night-memory", completed.mainCompleted), true);
  assert.equal(authoredEchoIsAvailable(runtime, "bed-night-memory", startChapterMemoryExperience({ chapterId: "625", mode: "automatic" }).mainCompleted), false);
});

test("automatic Chapter trigger is once per visit and resets on re-entry", () => {
  let session = createChapterTriggerSession("labis-motor-day");
  const first = consumeAutomaticChapterTrigger(session);
  assert.equal(first.allowed, true);
  session = first.session;

  assert.equal(consumeAutomaticChapterTrigger(session).allowed, false);
  session = resetChapterTriggerSession(session);
  assert.equal(consumeAutomaticChapterTrigger(session).allowed, true);
});

test("historical completion does not block a fresh automatic visit", () => {
  let session = createChapterTriggerSession("april06-not-gone-yet");
  const first = consumeAutomaticChapterTrigger(session);
  assert.equal(first.allowed, true);
  session = resetChapterTriggerSession(first.session);

  assert.equal(consumeAutomaticChapterTrigger(session).allowed, true);
});
