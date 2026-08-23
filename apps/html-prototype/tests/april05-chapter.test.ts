import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import { authoredChapterDiaryEntries } from "../src/fixtures/authoredDiaryEntries.js";
import { forestEntries } from "../src/systems/ChapterRegistry.js";
import { chapterRegistry, routeForestEntry } from "../src/systems/ChapterRegistry.js";
import { consumeAutomaticChapterTrigger, createChapterTriggerSession } from "../src/systems/ChapterProgressManager.js";

const loadApril05 = () => import("../src/fixtures/" + "april05Chapter.js");

const requiredAnchors = [
  "ms-wait-position", "angela-wait-position", "st-wait-position",
  "et-entrance-spawn", "et-arrival-position", "ms-spray-position", "et-sprayed-position",
  "et-ruffle-start", "et-ruffle-contact", "ms-ruffle-target",
  "et-trash-start", "et-trash-position", "et-trash-return",
  "ms-friends-spray-position", "angela-sprayed-position", "st-sprayed-position",
  "et-lock-position", "ms-locked-target", "et-final-talk-position", "ms-final-talk-position",
  "et-goodbye-position", "et-exit-position"
];

test("April 5 is registered as the authored 405 chapter and Forest route", async () => {
  const { april05Chapter } = await loadApril05();
  assert.equal(april05Chapter.id, "april05-come-down");
  assert.equal(april05Chapter.runtimeScene, "405");
  assert.equal(april05Chapter.date, "04.05");
  assert.equal(april05Chapter.title, "下来一下");
  assert.equal(april05Chapter.location, "KTHO residential-college entrance / front sitting area");
  assert.equal(april05Chapter.canonicalClosure.historicalEventId, "april05-ktho-night-memory");
  assert.equal(chapterRegistry["april05-come-down"], april05Chapter);
  const forestEntry = forestEntries.find((entry) => entry.chapterId === april05Chapter.id);
  assert.ok(forestEntry);
  assert.equal(routeForestEntry(forestEntry!).kind, "implemented-chapter");
});

test("April 5 owns one canonical editable diary record", async () => {
  const { april05Chapter } = await loadApril05();
  const entries = authoredChapterDiaryEntries.filter((entry) => entry.chapterId === april05Chapter.id);
  assert.equal(entries.length, 1);
  assert.equal(entries[0].id, "authored-diary-april05-come-down");
  assert.equal(entries[0].memoryKind, "chapter");
  assert.equal(entries[0].date, "2026-04-05");
});

test("405 authored JSON preserves exact interaction, trigger, anchor, and echo contracts", () => {
  for (const orientation of ["landscape", "portrait"] as const) {
    const layout = JSON.parse(readFileSync(join("public", "scene-layouts", "405", orientation + ".json"), "utf8")) as {
      sceneId: string;
      label: string;
      interactions: Array<{ id: string }>;
      triggers: Array<{ id: string; rect: unknown; chapterId: string; eventId: string; once: boolean }>;
      anchors: Record<string, unknown>;
      echoAnchors: Record<string, unknown>;
    };
    assert.equal(layout.sceneId, "405");
    assert.equal(layout.label, "405");
    assert.deepEqual(layout.interactions.map((item) => item.id).sort(), ["diary", "main-memory-replay", "bench", "bicycle", "cat-echo", "exit"].sort());
    assert.deepEqual(layout.triggers, [{
      id: "main-memory",
      rect: layout.triggers[0].rect,
      chapterId: "april05-come-down",
      eventId: "april05-ktho-night-memory",
      once: true
    }]);
    assert.deepEqual(Object.keys(layout.anchors).sort(), [...requiredAnchors].sort());
    assert.deepEqual(Object.keys(layout.echoAnchors).sort(), ["bicycle-st-comment", "cat-approach", "phone-after-return"].sort());
    for (const deleted of ["ms-bench-seat", "et-bench-seat", "angela-bench-position", "st-bench-position"]) {
      assert.equal(Object.hasOwn(layout.anchors, deleted), false, deleted);
    }
  }
});

test("April 5 has three standalone reflection points with three choices each", async () => {
  const { april05ReflectionChoices } = await loadApril05();
  assert.equal(april05ReflectionChoices.length, 3);
  assert.deepEqual(april05ReflectionChoices.flatMap((point: { choices: unknown[] }) => point.choices).length, 9);
  assert.deepEqual(april05ReflectionChoices.map((point: { id: string }) => point.id), [
    "april-five-sad-thing", "april-five-happy-because-see-you", "april-five-quiz"
  ]);
});

test("April 5 automatic trigger is visit-scoped and retriggers on re-entry", () => {
  const firstSession = createChapterTriggerSession("april05-come-down");
  const first = consumeAutomaticChapterTrigger(firstSession);
  const second = consumeAutomaticChapterTrigger(first.session);
  const reentry = consumeAutomaticChapterTrigger(createChapterTriggerSession("april05-come-down"));
  assert.equal(first.allowed, true);
  assert.equal(second.allowed, false);
  assert.equal(reentry.allowed, true);
});