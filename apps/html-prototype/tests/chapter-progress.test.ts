import assert from "node:assert/strict";
import test from "node:test";
import { beginChapterVisit, consumeAutomaticChapterTrigger, createChapterTriggerSession, finishChapterWalkthrough, initialChapterProgress, recordChapterChoice, resetChapterTriggerSession } from "../src/systems/ChapterProgressManager.js";
import { emptyTendencies } from "../src/systems/TendencySystem.js";

test("entering a chapter marks it visited but not walked through", () => {
  const progress = beginChapterVisit(initialChapterProgress("bakery-day"));

  assert.equal(progress.state, "visited");
  assert.equal(progress.visited, true);
  assert.equal(progress.walkedThrough, false);
});

test("leaving early keeps a chapter available for return", () => {
  const progress = beginChapterVisit(initialChapterProgress("bakery-day"));

  assert.equal(progress.state, "visited");
  assert.equal(progress.walkedThrough, false);
});

test("canonical closure marks a chapter walked through and preserves first reflection", () => {
  const started = beginChapterVisit(initialChapterProgress("bakery-day"));
  const chosen = recordChapterChoice(started, "remember", emptyTendencies());
  const walked = finishChapterWalkthrough(chosen, "yumido-accepting", "accepting");
  const replayed = finishChapterWalkthrough(walked, "yumido-rewriting", "rewriting");

  assert.equal(walked.state, "walkedThrough");
  assert.equal(walked.walkedThrough, true);
  assert.equal(replayed.closingQuoteId, "yumido-accepting");
  assert.equal(replayed.reflectionTone, "accepting");
});

test("automatic Chapter trigger stays consumed after cutscene completion", () => {
  let session = createChapterTriggerSession("labis-motor-day");
  const first = consumeAutomaticChapterTrigger(session);
  assert.equal(first.allowed, true);
  session = first.session;

  assert.equal(consumeAutomaticChapterTrigger(session).allowed, false);
  session = resetChapterTriggerSession(session);
  assert.equal(consumeAutomaticChapterTrigger(session).allowed, true);
});
