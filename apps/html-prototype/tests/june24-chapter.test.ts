import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { chapterRegistry, forestEntries, routeForestEntry } from "../src/systems/ChapterRegistry.js";
import { createDiaryLibrary, forestNodesForMonth } from "../src/systems/DiaryLibrary.js";
import { authoredChapterDiaryEntries } from "../src/fixtures/authoredDiaryEntries.js";
import { june24Assets, june24Chapter, june24FrameRegistries, june24ReflectionChoices, resolveJune24Actions } from "../src/fixtures/june24Chapter.js";
import type { SceneLayout } from "../src/systems/SceneLayouts.js";
import { applyChapterExperienceChoice, startChapterMemoryExperience } from "../src/systems/ChapterMemoryExperience.js";
import { createChapterTriggerSession, consumeAutomaticChapterTrigger, resetChapterTriggerSession } from "../src/systems/ChapterProgressManager.js";
import { emptyTendencies } from "../src/systems/TendencySystem.js";

const appRoot = process.cwd().endsWith("html-prototype") ? process.cwd() : resolve(process.cwd(), "apps/html-prototype");
const root = resolve(appRoot, "public/scene-layouts/624");
const readLayout = (orientation: "portrait" | "landscape") => JSON.parse(readFileSync(resolve(root, `${orientation}.json`), "utf8")) as SceneLayout;
const appSource = readFileSync(resolve(appRoot, "src/app.ts"), "utf8");

test("June 24 is registered with its authored diary entry", () => {
  assert.equal(chapterRegistry[june24Chapter.id], june24Chapter);
  assert.deepEqual(authoredChapterDiaryEntries.find((entry) => entry.id === june24Chapter.diaryEntryId), {
    id: "authored-diary-june24-only-came-for-you",
    chapterId: "june24-only-came-for-you",
    date: "2026-06-24",
    title: "06.24 · 只为你而来",
    body: "一张桌子、一杯胡萝卜奶和一只丑小八，留下了没有说完的下午。",
    location: "the study table",
    weather: "quiet afternoon",
    memoryKind: "chapter",
    mood: "quiet",
    photos: [],
    scrapbookLayout: { elements: [] }
  });
});

test("June 24 keeps the authored layout trigger and semantic asset mapping", () => {
  for (const orientation of ["portrait", "landscape"] as const) {
    const layout = readLayout(orientation);
    assert.equal(layout.sceneId, "624");
    assert.equal(layout.triggers.find((trigger) => trigger.id === "june24-table-arrival")?.eventId, "june24-table-memory");
    assert.equal(layout.triggers.find((trigger) => trigger.id === "june24-table-arrival")?.once, true);
  }
  const actions = resolveJune24Actions(readLayout("portrait"), "main");
  const firstSpawn = actions.find((action) => action.type === "spawn");
  assert.equal(firstSpawn?.type, "spawn");
  if (firstSpawn?.type === "spawn") assert.equal(firstSpawn.sprite?.assetId, june24FrameRegistries.et.right[0]);
  assert.equal(june24FrameRegistries.ms.up[1], "assets/624/ms-base/up/up-02.png");
  assert.equal(june24FrameRegistries.ms.up[2], "assets/624/ms-base/up/up-03.png");
  assert.equal(june24FrameRegistries.ms.up[3], "assets/624/ms-base/up/up-04.png");
  assert.equal(june24FrameRegistries.et.right[0], "assets/624/624-table/table-facing-right/01-sitting-reading.png");
});

test("June 24 main sequence preserves cause, reaction, dialogue and reflection checkpoints", () => {
  const actions = resolveJune24Actions(readLayout("portrait"), "main");
  const phoneShow = actions.findIndex((action) => action.type === "sprite" && action.sprite.assetId.includes("02-show-phone"));
  const stop = actions.findIndex((action) => action.type === "sprite" && action.sprite.assetId.includes("04-hand-stop-phone"));
  const reaction = actions.findIndex((action) => action.type === "sprite" && action.sprite.assetId.includes("03-phone-hand-stopped-reaction"));
  const noFlip = actions.findIndex((action) => action.type === "dialogue" && action.text.includes("不用翻"));
  assert.ok(phoneShow >= 0 && phoneShow < stop && stop < reaction && reaction < noFlip);
  assert.deepEqual(june24ReflectionChoices.map((reflection) => reflection.id), ["june24-reflection-1", "june24-reflection-2", "june24-reflection-3"]);
  assert.equal(actions.filter((action) => action.type === "checkpoint").length, 3);
  assert.equal(new Set(actions.filter((action) => action.type === "spawn").map((action) => action.actor)).size, 2);
});

test("June 24 approach uses the authored cycle, scale, facing, and feet metadata", () => {
  const actions = resolveJune24Actions(readLayout("portrait"), "main");
  const approach = actions.find((action) => action.type === "move" && action.actor === "ms");
  assert.equal(approach?.type, "move");
  if (approach?.type === "move") {
    assert.deepEqual(approach.spriteCycle?.map((frame) => frame.assetId), [
      "assets/624/ms-base/up/up-02.png",
      "assets/624/ms-base/up/up-03.png",
      "assets/624/ms-base/up/up-04.png",
      "assets/624/ms-base/up/up-03.png"
    ]);
    assert.equal(approach.visualScale, 0.3);
    assert.equal(approach.arrivalFacing, "left");
    assert.equal(approach.x, readLayout("portrait").anchors["ms-table-approach"].x);
  }
  assert.deepEqual(june24Assets["assets/624/ms-base/up/up-03.png"].feet, { x: 0.5, y: 1 });
});
test("June 24 shares full replay progression while protecting first-completion contribution", () => {
  const first = startChapterMemoryExperience({
    chapterId: june24Chapter.id,
    eventId: june24Chapter.canonicalClosure.historicalEventId,
    mode: "automatic",
    baselineTendencies: emptyTendencies(),
    firstCompletionPending: true
  });
  const firstRun = applyChapterExperienceChoice(first, june24ReflectionChoices[0].choices[0]);
  const replay = startChapterMemoryExperience({
    chapterId: june24Chapter.id,
    eventId: june24Chapter.canonicalClosure.historicalEventId,
    mode: "manual-replay",
    baselineTendencies: emptyTendencies(),
    firstCompletionPending: false
  });
  const replayRun = applyChapterExperienceChoice(replay, june24ReflectionChoices[1].choices[1]);
  assert.equal(firstRun.choiceIds.length, 1);
  assert.equal(replayRun.choiceIds.length, 1);
  assert.deepEqual(replayRun.persistentContribution, emptyTendencies());
  assert.equal(replayRun.eventId, june24Chapter.canonicalClosure.historicalEventId);
});

test("June 24 automatic trigger resets on re-entry and Echo Portraits are independent", () => {
  let session = createChapterTriggerSession(june24Chapter.id);
  const first = consumeAutomaticChapterTrigger(session);
  assert.equal(first.allowed, true);
  session = resetChapterTriggerSession(first.session);
  assert.equal(consumeAutomaticChapterTrigger(session).allowed, true);
  assert.match(appSource, /"624"[\s\S]*echoRequiresMainCompletion: false/);
  assert.match(appSource, /private startEchoPortrait/);
  assert.match(appSource, /echo-portrait-next/);
});

test("June 24 has a Forest entrance that routes into Scene 624", () => {
  const entry = forestEntries.find((item) => item.chapterId === june24Chapter.id);
  assert.ok(entry, "June 24 must be registered as a Forest door");
  assert.equal(entry?.date, "06.24");
  assert.equal(forestNodesForMonth(forestEntries, createDiaryLibrary(), "2026-06").some((item) => item.id === entry?.id), true);
  const route = routeForestEntry(entry!);
  assert.equal(route.kind, "implemented-chapter");
  if (route.kind === "implemented-chapter") {
    assert.equal(route.chapter.id, june24Chapter.id);
    assert.equal(route.chapter.runtimeScene, "624");
  }
});
