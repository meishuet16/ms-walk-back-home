import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import test from "node:test";
import {
  april25Chapter,
  april25DiaryBody,
  april25DiaryEntry,
  april25EchoAvailability,
  april25EchoPortraitSequenceIds,
  april25MainPortraitSequence,
  april25PortraitSequences,
  april25ReflectionChoices
} from "../src/fixtures/april25Chapter.js";
import { ownedSourcePaths } from "../src/authoring/authoredContent.js";
import { authoredContentManifest } from "../src/authoring/authoredContentManifest.js";
import { authoredContentExpectations } from "../src/fixtures/generated/authoredContentExpectations.js";
import { authoredChapterDiaryEntries } from "../src/fixtures/authoredDiaryEntries.js";
import { authoredEchoIsAvailable, authoredRuntimeByScene } from "../src/systems/AuthoredChapterRegistry.js";
import { applyChapterExperienceChoice, currentRunReflectionInput, markChapterEchoDiscovered, markChapterMainCompleted, nextChapterReflectionPoint, startChapterMemoryExperience } from "../src/systems/ChapterMemoryExperience.js";
import { chapterRegistry, forestEntries, routeForestEntry } from "../src/systems/ChapterRegistry.js";
import { sharedChapterDiaryBookAssetPath } from "../src/systems/DiaryLibrary.js";
import { resolveChapterReflection } from "../src/systems/EndingResolver.js";
import { renderMemoryPortraitSequenceBeat } from "../src/systems/MemoryPortraitPresentation.js";
import { renderReflection } from "../src/systems/PresentationRenderer.js";
import type { SceneLayout } from "../src/systems/SceneLayouts.js";

const runtime = authoredRuntimeByScene["425"];
const expectedApril25 = (authoredContentExpectations.chapters as unknown as Record<string, typeof authoredContentManifest.chapters.april25>).april25!;
const echoIds = [
  "badminton-companion-echo",
  "watermelon-juice-echo",
  "car-introvert-echo",
  "st-room-echo"
];

function loadLayout(orientation: "portrait" | "landscape"): SceneLayout {
  return JSON.parse(readFileSync(join("public", "scene-layouts", "425", `${orientation}.json`), "utf8")) as SceneLayout;
}

function stableHash(value: unknown): string {
  return createHash("sha256").update(typeof value === "string" ? value : JSON.stringify(value)).digest("hex");
}

test("425 is registered once in the authored registry, Chapter registry, Forest, and scene manifest", () => {
  assert.equal(runtime.chapter, april25Chapter);
  assert.equal(chapterRegistry[april25Chapter.id], april25Chapter);
  const doors = forestEntries.filter((entry) => entry.chapterId === april25Chapter.id);
  assert.equal(doors.length, 1);
  assert.deepEqual({ date: doors[0]?.date, title: doors[0]?.title }, { date: "04.25–04.26", title: "只是好朋友" });
  assert.equal(routeForestEntry(doors[0]!).kind, "implemented-chapter");

  const manifest = JSON.parse(readFileSync(join("public", "scene-layouts", "manifest.json"), "utf8")) as { scenes: Array<{ id: string; label: string }> };
  assert.deepEqual(manifest.scenes.filter((scene) => scene.id === "425"), [{ id: "425", label: "April 25–26 — 只是好朋友" }]);
});

test("425 layouts preserve the approved geometry with only Echo radii corrected", () => {
  const portrait = loadLayout("portrait");
  const landscape = loadLayout("landscape");

  assert.equal(stableHash(portrait), "97645d7a638e222e81f3d02de977c96fcdc5807ff2f42266063c0a553a575ebf");
  assert.equal(stableHash(landscape), "06771291885df3bd9d5ab43808097af780e891c2803d44948fae0280b737b440");
  assert.deepEqual(portrait.spawn, { x: 348.38334898886285, y: 993.5338990632923 });
  assert.deepEqual(landscape.spawn, { x: 732.9398851855229, y: 723.0512974007521 });
  assert.deepEqual(portrait.triggers, [{
    id: "apr25-ktho-main-trigger",
    rect: { x: 288.5820340221544, y: 795.0342743072194, w: 207.02, h: 125.39999999999999 },
    chapterId: "april25-just-good-friends",
    eventId: "apr25-main-memory",
    once: true
  }]);
  assert.deepEqual(landscape.triggers, [{
    id: "apr25-ktho-main-trigger",
    rect: { x: 567.5338665886612, y: 582.4704039108765, w: 217.36, h: 94.10000000000001 },
    chapterId: "april25-just-good-friends",
    eventId: "apr25-main-memory",
    once: true
  }]);
  for (const layout of [portrait, landscape]) {
    const trigger = layout.triggers.find((item) => item.id === runtime.triggerId);
    assert.ok(trigger, `${layout.orientation}: missing automatic Main trigger`);
    assert.equal(trigger.eventId, april25Chapter.canonicalClosure.historicalEventId, `${layout.orientation}: automatic Main event must match the shared trigger predicate`);
  }
  for (const layout of [portrait, landscape]) {
    assert.deepEqual(Object.keys(layout.echoAnchors), echoIds);
    for (const id of echoIds) {
      assert.equal(layout.echoAnchors[id]?.radius, layout.interactions.find((interaction) => interaction.id === id)?.radius, `${layout.orientation}:${id}`);
    }
  }
});

test("425 Main is one uninterrupted 19-beat sequence with the approved portraits and speaker ownership", () => {
  assert.equal(april25MainPortraitSequence.beats.length, 19);
  assert.deepEqual(april25MainPortraitSequence.beats.map((beat) => beat.portrait), [
    "assets/425/memory-portrait/echo-wait.png",
    "assets/425/memory-portrait/echo-wait.png",
    "assets/425/memory-portrait/echo-look.png",
    "assets/425/memory-portrait/echo-chat.png",
    "assets/425/memory-portrait/echo-ig.png",
    "assets/425/memory-portrait/echo-chat.png",
    "assets/425/memory-portrait/echo-hair-start.png",
    "assets/425/memory-portrait/echo-hair-02.png",
    "assets/425/memory-portrait/echo-hair-03.png",
    "assets/425/memory-portrait/echo-hair-04.png",
    "assets/425/memory-portrait/echo-bang.png",
    "assets/425/memory-portrait/echo-argue.png",
    "assets/425/memory-portrait/echo-ig.png",
    "assets/425/memory-portrait/echo-arm.png",
    "assets/425/memory-portrait/echo-argue.png",
    "assets/425/memory-portrait/echo-wait.png",
    "assets/425/memory-portrait/echo-arm.png",
    "assets/425/memory-portrait/echo-invite.png",
    "assets/425/memory-portrait/echo-invite.png"
  ]);
  assert.deepEqual(april25MainPortraitSequence.beats.map((beat) => beat.dialogue.map((line) => line.speaker)), [
    ["Memory", "Memory", "Memory", "我", "Memory"],
    ["她", "她", "她", "我", "她", "我"],
    ["Memory", "Memory", "Memory"],
    ["Memory", "Memory", "那个共同朋友", "Memory", "她", "她"],
    ["Memory", "我", "Memory", "她"],
    ["Memory", "Memory", "她", "我", "我", "我", "她", "她", "Memory", "Memory", "Memory", "Memory"],
    ["Memory", "Memory", "Memory", "Memory"],
    ["Memory", "Memory", "Memory", "我", "Memory"],
    ["Memory", "Memory", "Memory", "她", "我"],
    ["Memory", "Memory"],
    ["她", "我", "我", "她"],
    ["Memory", "Angela", "我", "我", "她", "我", "她", "她"],
    ["Memory", "Memory", "Memory", "她"],
    ["Memory", "Memory", "Memory", "Memory", "她", "我", "我", "我", "她", "Memory", "Memory", "Memory", "我", "我"],
    ["她", "她", "她"],
    ["我", "我", "Memory", "Memory", "她", "她"],
    ["我", "她", "我", "我", "她", "她", "我", "她", "她", "我", "我", "她", "我", "她", "我"],
    ["Memory", "Memory", "Memory", "我", "她", "她", "她", "我", "我", "她"],
    ["Memory", "Memory", "Memory", "Memory", "Memory", "Memory", "Memory", "我"]
  ]);
  assert.deepEqual(april25MainPortraitSequence.beats.map((beat) => beat.portrait), expectedApril25.beatPortraits?.["apr25-main"]);
  assert.deepEqual(april25MainPortraitSequence.beats.flatMap((beat) => beat.dialogue.map(({ text }) => ({ text }))), expectedApril25.dialogue.map(({ text }) => ({ text })));

  for (const [beatIndex, beat] of april25MainPortraitSequence.beats.entries()) {
    for (let dialogueIndex = 0; dialogueIndex < beat.dialogue.length; dialogueIndex += 1) {
      assert.match(renderMemoryPortraitSequenceBeat(april25MainPortraitSequence, beatIndex, dialogueIndex, { orientation: "landscape", width: 1280, height: 720 }), /data-action="portrait-sequence-next"/);
    }
  }
});

test("425 Echoes use the exact approved beat counts, portraits, and Main-only availability", () => {
  assert.deepEqual(april25EchoPortraitSequenceIds, {
    "badminton-companion-echo": "apr26-badminton-companion",
    "watermelon-juice-echo": "apr26-watermelon-juice",
    "car-introvert-echo": "apr26-car-introvert",
    "st-room-echo": "apr26-st-room"
  });
  assert.deepEqual(Object.fromEntries(Object.entries(april25PortraitSequences).map(([id, sequence]) => [id, sequence.beats.map((beat) => beat.portrait)])), {
    "apr25-main": april25MainPortraitSequence.beats.map((beat) => beat.portrait),
    "apr26-badminton-companion": [
      "assets/425/memory-portrait/echo-badminton-arrival.png",
      "assets/425/memory-portrait/echo-badminton2.png",
      "assets/425/memory-portrait/echo-badminton.png"
    ],
    "apr26-watermelon-juice": [
      "assets/425/memory-portrait/echo-watermelon-01.png",
      "assets/425/memory-portrait/echo-watermelon.png"
    ],
    "apr26-car-introvert": ["assets/425/memory-portrait/echo-introvert.png"],
    "apr26-st-room": [
      "assets/425/memory-portrait/echo-guilty.png",
      "assets/425/memory-portrait/echo-guilty.png"
    ]
  });
  assert.deepEqual(april25EchoAvailability, Object.fromEntries(echoIds.map((id) => [id, { requiresMainCompletion: true }])))
  const fresh = startChapterMemoryExperience({ chapterId: april25Chapter.id, mode: "automatic" });
  const mainComplete = markChapterMainCompleted(fresh);
  for (const id of echoIds) {
    assert.equal(authoredEchoIsAvailable(runtime, id, fresh.mainCompleted, fresh.discoveredEchoIds), false);
    assert.equal(authoredEchoIsAvailable(runtime, id, mainComplete.mainCompleted, mainComplete.discoveredEchoIds), true);
  }
  assert.equal(runtime.reflectionAfterEchoId, "st-room-echo");
  assert.equal(authoredEchoIsAvailable(runtime, "st-room-echo", true, new Set()), true);
  assert.deepEqual([...markChapterEchoDiscovered(mainComplete, "st-room-echo").discoveredEchoIds], ["st-room-echo"]);
});

test("425 Main completion returns to WORLD and only the ST-room Echo opens Reflection", () => {
  const appSource = readFileSync(join("src", "app.ts"), "utf8");
  assert.match(appSource, /\(mode === "main" && !runtime\.reflectionAfterEchoId\)/);
  assert.match(appSource, /\(mode === "echo" && completedEchoId === runtime\.reflectionAfterEchoId\)/);
  assert.doesNotMatch(appSource, /sceneId\s*===\s*["']425["']|chapterId\s*===\s*["']april25-just-good-friends["']|april25|apr25/i);
  const mainComplete = markChapterMainCompleted(startChapterMemoryExperience({ chapterId: april25Chapter.id, mode: "automatic" }));
  assert.equal(mainComplete.mainCompleted, true);
  assert.equal(mainComplete.resolvedReflection, undefined);
  assert.deepEqual(mainComplete.reflectionChoiceIds, []);
});

test("425 reflection runs R1 response through R3 response and all selected effects reach Ending resolution", () => {
  assert.deepEqual(april25ReflectionChoices.map((point) => point.id), ["apr25-reflection-waited", "apr25-reflection-small-things", "apr26-reflection-guilt"]);
  let run = startChapterMemoryExperience({ chapterId: april25Chapter.id, mode: "automatic" });
  let reflectionId = april25ReflectionChoices[0]!.id;
  for (let index = 0; index < april25ReflectionChoices.length; index += 1) {
    const point = april25ReflectionChoices.find((candidate) => candidate.id === reflectionId)!;
    const selected = point.choices[1]!;
    assert.ok(selected.response);
    assert.match(renderReflection({ lines: [selected.response], actions: '<button data-action="authored-reflection-next">Continue walking</button>' }), /authored-reflection-next/);
    run = applyChapterExperienceChoice(run, selected);
    const next = nextChapterReflectionPoint(april25ReflectionChoices, reflectionId);
    if (index < 2) reflectionId = next!.id;
    else assert.equal(next, null);
  }
  assert.deepEqual(run.reflectionChoiceIds, ["apr25-waited-happy", "apr25-small-things-mattered", "apr26-guilt-want-more"]);
  assert.deepEqual({ closeness: run.tendencies.closeness, honesty: run.tendencies.honesty, holding: run.tendencies.holding }, { closeness: 3, honesty: 3, holding: 2 });
  assert.equal(resolveChapterReflection(april25Chapter, currentRunReflectionInput(run)).quoteId, "apr25-holding");
});

test("425 replay runs are fresh and can resolve to different approved endings", () => {
  const resolveChoices = (choiceIndexes: number[]) => {
    const run = april25ReflectionChoices.reduce((current, point, index) => applyChapterExperienceChoice(current, point.choices[choiceIndexes[index]!]!), startChapterMemoryExperience({ chapterId: april25Chapter.id, mode: "manual-replay" }));
    return resolveChapterReflection(april25Chapter, currentRunReflectionInput(run));
  };
  assert.equal(resolveChoices([0, 0, 0]).quoteId, "apr25-accepting");
  assert.equal(resolveChoices([2, 2, 2]).quoteId, "apr25-not-ready");
  assert.equal(resolveChoices([1, 0, 0]).quoteId, "apr25-honest-without-answer");
  assert.deepEqual(resolveChoices([0, 0, 0]).closureLines, [
    "4 月 26 日晚上，我在朋友房间待到凌晨十二点。",
    "那时候我仍然把我们叫作“好朋友”。",
    "我始终没有去问，她怎么看这段关系。"
  ]);
});

test("425 uses one canonical authored Diary with the shared book artwork and no run-state dependency", () => {
  const entries = authoredChapterDiaryEntries.filter((entry) => entry.chapterId === april25Chapter.id);
  assert.deepEqual(entries, [april25DiaryEntry]);
  assert.equal(april25DiaryEntry.id, "authored-diary-april25-just-good-friends");
  assert.equal(april25DiaryEntry.title, "04.25–04.26 · Just Friends");
  assert.equal(april25DiaryEntry.body, april25DiaryBody.join("\n\n"));
  assert.equal(april25DiaryBody.length, 124);
  assert.equal(stableHash(april25DiaryEntry.body), "2643cb5be9bed58706c99c445fef9eea5c04ef771f1169a68ed6c268eaa8aac9");
  assert.equal(sharedChapterDiaryBookAssetPath, "assets/labis/book-with-ms-photos.png");
  assert.equal(april25Chapter.diaryEntryId, april25DiaryEntry.id);
  assert.equal(startChapterMemoryExperience({ chapterId: april25Chapter.id, mode: "automatic" }).diaryRead, false);
});

test("425 participates in authored-content verification and every referenced asset exists", () => {
  assert.deepEqual(authoredContentManifest.chapters.april25, expectedApril25);
  assert.ok(authoredContentManifest.chapters.april25.dialogue.length > 0);
  assert.deepEqual(authoredContentManifest.chapters.april25.beatPortraits, expectedApril25.beatPortraits);
  assert.deepEqual(authoredContentManifest.chapters.april25.reflections, expectedApril25.reflections);
  assert.deepEqual(authoredContentManifest.chapters.april25.closure, expectedApril25.closure);
  assert.deepEqual(authoredContentManifest.chapters.april25.diary, expectedApril25.diary);
  assert.ok(Array.from<string>(ownedSourcePaths).includes("apps/html-prototype/src/fixtures/april25Chapter.ts"));

  const publicRoot = resolve(process.cwd(), "public");
  const assets = new Set<string>([
    "assets/425/425-portrait.png",
    "assets/425/425-landscape.png",
    ...Object.values(april25PortraitSequences).flatMap((sequence) => sequence.beats.map((beat) => beat.portrait)).filter((portrait): portrait is string => typeof portrait === "string"),
    sharedChapterDiaryBookAssetPath
  ]);
  for (const asset of assets) assert.equal(existsSync(resolve(publicRoot, asset)), true, asset);
});
