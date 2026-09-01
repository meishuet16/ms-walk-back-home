import test from "node:test";
import assert from "node:assert/strict";
import {
  STORY_CHAPTER_IDS,
  currentStoryChapterId,
  markStoryChapterCompleted,
  normalizeStoryRouteProgress,
  storyChapterState,
  storyCompletionCount
} from "../src/systems/StoryRoute.js";

test("story route keeps the authored chronological order, excludes Bakery, and keeps Final Dream last", () => {
  assert.deepEqual(STORY_CHAPTER_IDS, [
    "oct29-a-little-closer",
    "1122-before-sunrise",
    "march30-too-fated",
    "april05-come-down",
    "april06-not-gone-yet",
    "april25-just-good-friends",
    "may23-i-arrived",
    "june24-only-came-for-you",
    "june25-so-i-came",
    "labis-motor-day",
    "july21-why-cant-you-stay",
    "final-dream-tomorrow"
  ]);
  assert.equal(STORY_CHAPTER_IDS.includes("bakery-day" as never), false);
});

test("only the first incomplete chapter is current", () => {
  let progress = normalizeStoryRouteProgress(null);
  assert.equal(currentStoryChapterId(progress), "oct29-a-little-closer");
  assert.equal(storyChapterState("oct29-a-little-closer", progress), "current");
  assert.equal(storyChapterState("1122-before-sunrise", progress), "locked");

  progress = markStoryChapterCompleted(progress, "oct29-a-little-closer");
  assert.equal(storyChapterState("oct29-a-little-closer", progress), "completed");
  assert.equal(storyChapterState("1122-before-sunrise", progress), "current");
  assert.equal(storyChapterState("march30-too-fated", progress), "locked");
  assert.equal(storyCompletionCount(progress), 1);
});

test("progress normalization ignores unknown and removed chapter ids", () => {
  const progress = normalizeStoryRouteProgress({ completedChapterIds: ["oct29-a-little-closer", "bakery-day", "not-a-chapter", "oct29-a-little-closer"] });
  assert.deepEqual(progress.completedChapterIds, ["oct29-a-little-closer"]);
});
