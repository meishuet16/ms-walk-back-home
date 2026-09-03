import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { chapterRegistry, forestEntries, routeForestEntry } from "../src/systems/ChapterRegistry.js";
import { authoredRuntimeByScene } from "../src/systems/AuthoredChapterRegistry.js";
import { createDiaryLibrary, forestNodesForMonth } from "../src/systems/DiaryLibrary.js";
import { authoredChapterDiaryEntries } from "../src/fixtures/authoredDiaryEntries.js";
import { june24Assets, june24Chapter, june24EchoDialogues, june24FrameRegistries, june24ReflectionChoices, resolveJune24Actions } from "../src/fixtures/june24Chapter.js";
import type { SceneLayout } from "../src/systems/SceneLayouts.js";
import { applyChapterExperienceChoice, startChapterMemoryExperience } from "../src/systems/ChapterMemoryExperience.js";
import { createChapterTriggerSession, consumeAutomaticChapterTrigger, resetChapterTriggerSession } from "../src/systems/ChapterProgressManager.js";
import { emptyTendencies } from "../src/systems/TendencySystem.js";
import { authoredContentExpectations } from "../src/fixtures/generated/authoredContentExpectations.js";

const appRoot = process.cwd().endsWith("html-prototype") ? process.cwd() : resolve(process.cwd(), "apps/html-prototype");
const root = resolve(appRoot, "public/scene-layouts/624");
const readLayout = (orientation: "portrait" | "landscape") => JSON.parse(readFileSync(resolve(root, `${orientation}.json`), "utf8")) as SceneLayout;
const appSource = readFileSync(resolve(appRoot, "src/app.ts"), "utf8");

test("June 24 is registered with its authored diary entry", () => {
  assert.equal(chapterRegistry[june24Chapter.id], june24Chapter);
  const entry = authoredChapterDiaryEntries.find((candidate) => candidate.id === june24Chapter.diaryEntryId);
  assert.ok(entry);
  assert.equal(entry?.id, "authored-diary-june24-only-came-for-you");
  assert.equal(entry?.source, "authored");
  assert.equal(entry?.chapterId, "june24-only-came-for-you");
  assert.equal(entry?.date, "2026-06-24");
  assert.equal(entry?.title, authoredContentExpectations.chapters.june24.diary?.title);
  assert.equal(entry?.body, authoredContentExpectations.chapters.june24.diary?.body);
  assert.equal(entry?.location, "the study table");
  assert.equal(entry?.weather, "quiet afternoon");
  assert.equal(entry?.memoryKind, "chapter");
  assert.equal(entry?.mood, "quiet");
  assert.deepEqual(entry?.photos, []);
  assert.deepEqual(entry?.scrapbookLayout, { elements: [] });
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
  const noFlip = actions.findIndex((action, index) => index > reaction && action.type === "dialogue");
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
test("June 24 table states retarget both actors to their authored anchors", () => {
  const layout = readLayout("portrait");
  const actions = resolveJune24Actions(layout, "main");
  const expectedMoves = [
    ["ms", "ms-first-seat", "01-sitting-opposite"],
    ["ms", "ms-carrot-seat", "04-hold-carrot-milk"],
    ["et", "et-carrot-seat", "05-drink-carrot-milk"],
    ["ms", "ms-second-seat", "01-sitting-opposite"],
    ["ms", "ms-xiaoba-give", "05-give-xiaoba"],
    ["et", "et-xiaoba-receive", "06-hold-ugly-xiaoba"],
    ["ms", "ms-phone-show", "02-show-phone"],
    ["et", "et-phone-stop", "04-hand-stop-phone"],
    ["ms", "ms-head-down-seat", "06-head-down-table"],
    ["et", "et-guilt-seat", "07-guilt-quiet"],
    ["ms", "ms-goodbye-stand", "07-goodbye-stand"],
    ["et", "et-goodbye-look", "08-goodbye-look"]
  ] as const;
  for (const [actor, anchor, assetSuffix] of expectedMoves) {
    const target = layout.anchors[anchor];
    const action = actions.find((candidate) => candidate.type === "move" && candidate.actor === actor && candidate.sprite?.assetId?.endsWith(assetSuffix + ".png") && candidate.x === target.x && candidate.y === target.y);
    assert.equal(action?.type, "move", actor + " " + assetSuffix + " must be an authored-anchor move");
    if (action?.type === "move") {
      assert.deepEqual({ x: action.x, y: action.y }, target);
    }
  }
});

test("June 24 authored interactions win over overlapping residue fallbacks", () => {
  assert.match(appSource, /this\.activeObject = availableInteraction\?\.id \?\? echoActive \?\? ""/);
  assert.deepEqual(authoredRuntimeByScene["624"]?.echoPortraitIds, {
    "carrot-milk-memory": "june24-angela-st-echo",
    "five-cent-memory": "june24-room-study-echo",
    "xiaoba-memory": "june24-haircut-echo"
  });
});
test("June 24 shares full replay progression with fresh run state", () => {
  const first = startChapterMemoryExperience({
    chapterId: june24Chapter.id,
    mode: "automatic"
  });
  const firstRun = applyChapterExperienceChoice(first, june24ReflectionChoices[0].choices[0]);
  const replay = startChapterMemoryExperience({
    chapterId: june24Chapter.id,
    mode: "manual-replay"
  });
  const replayRun = applyChapterExperienceChoice(replay, june24ReflectionChoices[1].choices[1]);
  assert.equal(firstRun.reflectionChoiceIds.length, 1);
  assert.equal(replayRun.reflectionChoiceIds.length, 1);
  assert.notEqual(replayRun.reflectionChoiceIds[0], firstRun.reflectionChoiceIds[0]);
  assert.equal(replayRun.tendencies.acceptance, 1);
  assert.equal(replayRun.tendencies.closeness, 1);
  assert.equal(replayRun.tendencies.companionship, 0);
});

test("June 24 automatic trigger resets on re-entry and Echo Portraits are independent", () => {
  let session = createChapterTriggerSession(june24Chapter.id);
  const first = consumeAutomaticChapterTrigger(session);
  assert.equal(first.allowed, true);
  session = resetChapterTriggerSession(first.session);
  assert.equal(consumeAutomaticChapterTrigger(session).allowed, true);
  assert.equal(authoredRuntimeByScene["624"]?.echoRequiresMainCompletion, false);
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


test("June 24 follows the exact authored dialogue sequence", () => {
  const actions = resolveJune24Actions(readLayout("portrait"), "main");
  const dialogue = actions
    .filter((action) => action.type === "dialogue")
    .map((action) => action.speaker + ": " + action.text);
  assert.deepEqual(dialogue.map((line) => line.split(": ", 1)[0]), [
    "她", "我", "她", "我", "她", "我", "她", "我", "她", "她", "我", "她", "我", "她", "她", "我", "她", "我", "我", "她", "我", "她", "她", "我", "她", "我", "她", "她", "我", "我", "她", "我", "她", "我", "她", "我", "我", "她", "我", "她", "我", "她", "我", "她", "我", "她", "我", "她", "我", "她", "我", "她", "她", "我", "她", "我", "她"
  ]);
  assert.deepEqual(dialogue.map((line) => ({ text: line.slice(line.indexOf(": ") + 2) })), authoredContentExpectations.chapters.june24.dialogue.map((line) => ({ text: line.text })));
});

test("June 24 keeps the authored physical beat order and exact table states", () => {
  const actions = resolveJune24Actions(readLayout("portrait"), "main");
  const spritePaths = actions.filter((action) => action.type === "sprite").map((action) => action.sprite.assetId);
  assert.deepEqual(spritePaths, [
    "assets/624/624-table/table-facing-left/01-sitting-opposite.png",
    "assets/624/624-table/table-facing-left/04-hold-carrot-milk.png",
    "assets/624/624-table/table-facing-right/05-drink-carrot-milk.png",
    "assets/624/624-table/table-facing-left/01-sitting-opposite.png",
    "assets/624/624-table/table-facing-right/01-sitting-reading.png",
    "assets/624/624-table/table-facing-left/05-give-xiaoba.png",
    "assets/624/624-table/table-facing-right/06-hold-ugly-xiaoba.png",
    "assets/624/624-table/table-facing-left/01-sitting-opposite.png",
    "assets/624/624-table/table-facing-right/03-surprised-5-23.png",
    "assets/624/624-table/table-facing-left/02-show-phone.png",
    "assets/624/624-table/table-facing-right/04-hand-stop-phone.png",
    "assets/624/624-table/table-facing-left/03-phone-hand-stopped-reaction.png",
    "assets/624/624-table/table-facing-right/07-guilt-quiet.png",
    "assets/624/624-table/table-facing-left/06-head-down-table.png",
    "assets/624/624-table/table-facing-right/01-sitting-reading.png",
    "assets/624/624-table/table-facing-left/07-goodbye-stand.png",
    "assets/624/624-table/table-facing-right/08-goodbye-look.png"  ]);
  const indices = {
    show: actions.findIndex((action) => action.type === "sprite" && action.sprite.assetId.endsWith("02-show-phone.png")),
    stop: actions.findIndex((action) => action.type === "sprite" && action.sprite.assetId.endsWith("04-hand-stop-phone.png")),
    reaction: actions.findIndex((action) => action.type === "sprite" && action.sprite.assetId.endsWith("03-phone-hand-stopped-reaction.png")),
    dialogue: actions.findIndex((action, index) => index > actions.findIndex((candidate) => candidate.type === "sprite" && candidate.sprite.assetId.endsWith("03-phone-hand-stopped-reaction.png")) && action.type === "dialogue")
  };
  assert.ok(indices.show < indices.stop && indices.stop < indices.reaction && indices.reaction < indices.dialogue);
  assert.equal(actions.filter((action) => action.type === "wait").some((action) => action.duration >= 0.28), true);
});

test("June 24 reflection choices use the authored prompts, responses, and effects", () => {
  assert.deepEqual(june24ReflectionChoices.map((point) => ({
    prompt: point.prompt,
    choices: point.choices.map(({ label, response }) => ({ label, response }))
  })), authoredContentExpectations.chapters.june24.reflections);
  assert.deepEqual(june24ReflectionChoices.map((point) => ({
    id: point.id,
    choiceIds: point.choices.map((choice) => choice.id),
    effects: point.choices.map((choice) => choice.effects)
  })), [
    {
      id: "june24-reflection-1",
      choiceIds: ["june24-reflection-1-a", "june24-reflection-1-b", "june24-reflection-1-c"],
      effects: [{ acceptance: 1, honesty: 1 }, { honesty: 1, distance: 1 }, { acceptance: 1, companionship: 1 }]
    },
    {
      id: "june24-reflection-2",
      choiceIds: ["june24-reflection-2-a", "june24-reflection-2-b", "june24-reflection-2-c"],
      effects: [{ honesty: 1 }, { acceptance: 1, closeness: 1 }, { distance: 1, honesty: 1 }]
    },
    {
      id: "june24-reflection-3",
      choiceIds: ["june24-reflection-3-a", "june24-reflection-3-b", "june24-reflection-3-c"],
      effects: [{ honesty: 1, acceptance: 1 }, { avoidance: 1, acceptance: 1 }, { closeness: 1, companionship: 1 }]
    }
  ]);
});

test("June 24 Echoes use the exact secondary memories and stop at their uncertainty", () => {
  for (const [id, expectedSpeakers] of Object.entries({
    "june24-angela-st-echo": ["朋友", "我", "朋友", "我", "我", "朋友", "我"],
    "june24-room-study-echo": ["她", "我", "她", "我", "她"],
    "june24-haircut-echo": ["我", "她", "我", "她", "我"]
  })) {
    const lines = june24EchoDialogues[id as keyof typeof june24EchoDialogues];
    assert.deepEqual(lines.map(({ speaker }) => speaker), expectedSpeakers);
    const expected = authoredContentExpectations.chapters.june24.collections?.[id as keyof typeof authoredContentExpectations.chapters.june24.collections];
    assert.deepEqual(lines.map(({ text }) => ({ text })), expected?.map((line: { text: string }) => ({ text: line.text })));
  }
  assert.equal(june24EchoDialogues["june24-room-study-echo"].length, authoredContentExpectations.chapters.june24.collections?.["june24-room-study-echo"]?.length);
  assert.equal(june24EchoDialogues["june24-haircut-echo"].length, authoredContentExpectations.chapters.june24.collections?.["june24-haircut-echo"]?.length);
});
