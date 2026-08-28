import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";
import {
  oct29Chapter,
  oct29DiaryBody,
  oct29DiaryEntry,
  oct29EchoAvailability,
  oct29EchoPortraitSequenceIds,
  oct29MainPortraitSequence,
  oct29PortraitSequences,
  oct29ReflectionChoices
} from "../src/fixtures/oct29Chapter.js";
import { authoredContentManifest } from "../src/authoring/authoredContentManifest.js";
import { ownedSourcePaths } from "../src/authoring/authoredContent.js";
import { authoredContentExpectations } from "../src/fixtures/generated/authoredContentExpectations.js";
import { authoredEchoIsAvailable, authoredRuntimeByScene } from "../src/systems/AuthoredChapterRegistry.js";
import { applyChapterExperienceChoice, currentRunReflectionInput, markChapterEchoDiscovered, markChapterMainCompleted, nextChapterReflectionPoint, startChapterMemoryExperience } from "../src/systems/ChapterMemoryExperience.js";
import { chapterRegistry, forestEntries, routeForestEntry } from "../src/systems/ChapterRegistry.js";
import { sharedChapterDiaryBookAssetPath } from "../src/systems/DiaryLibrary.js";
import { resolveChapterReflection } from "../src/systems/EndingResolver.js";
import type { SceneLayout } from "../src/systems/SceneLayouts.js";

const publicRoot = join(process.cwd(), "public");
const echoIds = Object.keys(oct29EchoPortraitSequenceIds);

function loadLayout(orientation: "landscape" | "portrait"): SceneLayout {
  return JSON.parse(readFileSync(join(publicRoot, "scene-layouts", "1029", `${orientation}.json`), "utf8")) as SceneLayout;
}

function pngSize(path: string): { w: number; h: number } {
  const png = readFileSync(path);
  assert.equal(png.toString("ascii", 1, 4), "PNG");
  return { w: png.readUInt32BE(16), h: png.readUInt32BE(20) };
}

test("1029 is a Forest-routable chapter with the approved identity", () => {
  assert.equal(chapterRegistry[oct29Chapter.id], oct29Chapter);
  const entries = forestEntries.filter((entry) => entry.chapterId === oct29Chapter.id);
  assert.equal(entries.length, 1);
  assert.equal(entries[0]?.date, "10.29");
  assert.equal(entries[0]?.title, "A Little Closer");
  assert.equal(routeForestEntry(entries[0]!).kind, "implemented-chapter");
  assert.equal(oct29Chapter.runtimeScene, "1029");
  assert.equal(oct29Chapter.title, "再走近一点");
  assert.equal(oct29Chapter.weather, "晴");
  assert.equal(oct29Chapter.location, "University badminton court");
  assert.equal(oct29Chapter.canonicalClosure.historicalEventId, "oct29-main-memory");
});

test("1029 uses the supplied independent responsive layouts and exact corrected geometry", () => {
  const landscape = loadLayout("landscape");
  const portrait = loadLayout("portrait");
  assert.equal(landscape.asset, "assets/1029/1029-landscape.png");
  assert.equal(portrait.asset, "assets/1029/1029-portrait.png");
  assert.deepEqual(landscape.size, { w: 1672, h: 941 });
  assert.deepEqual(portrait.size, { w: 941, h: 1672 });
  assert.deepEqual(landscape.spawn, { x: 949.7062093507723, y: 767.8505068358481 });
  assert.deepEqual(portrait.spawn, { x: 188.48629303442772, y: 1356.6209231987348 });
  assert.notDeepEqual(landscape.spawn, portrait.spawn);
  assert.deepEqual(landscape.interactions, [
    { id: "oct29-main-memory", label: "oct29-main-memory", x: 808.0754236846527, y: 634.76634101205, radius: 58 },
    { id: "singles-selection-echo", label: "singles-selection-echo", x: 1170.3999999999999, y: 366.99, radius: 50 },
    { id: "hiking-shoe-echo", label: "hiking-shoe-echo", x: 535.04, y: 592.83, radius: 48 },
    { id: "score-forgotten-echo", label: "score-forgotten-echo", x: 1220.56, y: 583.42, radius: 48 },
    { id: "diary", label: "diary", x: 296.74917686406144, y: 685.2625004307243, radius: 50 },
    { id: "exit", label: "exit", x: 814.3787097799259, y: 800.1087318462364, radius: 70 }
  ]);
  assert.deepEqual(portrait.interactions, [
    { id: "oct29-main-memory", label: "oct29-main-memory", x: 443.9217830162865, y: 1287.218593440783, radius: 56 },
    { id: "singles-selection-echo", label: "singles-selection-echo", x: 786.265004509937, y: 1155.2128567784662, radius: 48 },
    { id: "hiking-shoe-echo", label: "hiking-shoe-echo", x: 723.0205653130099, y: 634.3616845520912, radius: 46 },
    { id: "score-forgotten-echo", label: "score-forgotten-echo", x: 688.466865259296, y: 1022.2253741875858, radius: 46 },
    { id: "diary", label: "diary", x: 99.21041649522142, y: 834.8219939970535, radius: 48 },
    { id: "exit", label: "exit", x: 438.49987741078945, y: 1487.6799927447742, radius: 70 }
  ]);
  for (const layout of [landscape, portrait]) {
    assert.deepEqual(layout.triggers, [{
      id: "oct29-court-main-trigger",
      rect: layout.orientation === "landscape"
        ? { x: 726.8740977396642, y: 565.3190132257705, w: 318.3299313473119, h: 158.28508633742433 }
        : { x: 270.00000437818613, y: 1089.9999817478597, w: 431.99997648751906, h: 296.000066437791 },
      chapterId: "oct29-a-little-closer",
      eventId: "oct29-main-memory",
      once: true
    }]);
  }
  assert.deepEqual(landscape.echoAnchors, {
    "singles-selection-echo": { x: 1170.3999999999999, y: 366.99, radius: 50 },
    "hiking-shoe-echo": { x: 535.04, y: 592.83, radius: 48 },
    "score-forgotten-echo": { x: 1220.56, y: 583.42, radius: 48 }
  });
  assert.deepEqual(portrait.echoAnchors, {
    "singles-selection-echo": { x: 787.0332845516918, y: 1154.444424147253, radius: 48 },
    "hiking-shoe-echo": { x: 724.5575068662525, y: 632.824819289665, radius: 46 },
    "score-forgotten-echo": { x: 693.3411329164597, y: 1024.7283496971377, radius: 46 }
  });
  assert.equal(JSON.stringify(landscape).includes("45168"), false);
  assert.equal(JSON.stringify(landscape).includes("43286"), false);
  assert.equal(JSON.stringify(landscape).includes("47050"), false);
  assert.equal(JSON.stringify(portrait).includes("45168"), false);
  assert.equal(JSON.stringify(portrait).includes("43286"), false);
  assert.equal(JSON.stringify(portrait).includes("47050"), false);
});

test("1029 has all approved scene and Memory Portrait assets", () => {
  const referenced = [
    "assets/1029/1029-landscape.png",
    "assets/1029/1029-portrait.png",
    "assets/1029/memory-portrait/main-arrival.png",
    "assets/1029/memory-portrait/main-single-challenge.png",
    "assets/1029/memory-portrait/main-training.png",
    "assets/1029/memory-portrait/main-cant-hear.png",
    "assets/1029/memory-portrait/main-closer.png",
    "assets/1029/memory-portrait/main-good-job.png",
    "assets/1029/memory-portrait/main-training-continue.png",
    "assets/1029/memory-portrait/echo-singles.png",
    "assets/1029/memory-portrait/echo-score.png",
    "assets/1029/memory-portrait/echo-shoes.png",
    sharedChapterDiaryBookAssetPath
  ];
  for (const asset of referenced) assert.equal(existsSync(join(publicRoot, asset)), true, asset);
  assert.deepEqual(pngSize(join(publicRoot, "assets/1029/1029-landscape.png")), { w: 1672, h: 941 });
  assert.deepEqual(pngSize(join(publicRoot, "assets/1029/1029-portrait.png")), { w: 941, h: 1672 });
});

test("1029 Main contains the exact eight-beat approved portrait mapping", () => {
  assert.equal(oct29MainPortraitSequence.id, "oct29-main");
  assert.deepEqual(oct29MainPortraitSequence.beats.map((beat) => beat.portrait), [
    "assets/1029/memory-portrait/main-arrival.png",
    "assets/1029/memory-portrait/main-single-challenge.png",
    "assets/1029/memory-portrait/main-training.png",
    "assets/1029/memory-portrait/main-cant-hear.png",
    "assets/1029/memory-portrait/main-closer.png",
    "assets/1029/memory-portrait/main-good-job.png",
    "assets/1029/memory-portrait/main-training-continue.png",
    "assets/1029/memory-portrait/main-training-continue.png"
  ]);
  assert.equal(oct29MainPortraitSequence.beats.length, 8);
  const dialogue = oct29MainPortraitSequence.beats.flatMap((beat) => beat.dialogue);
  assert.equal(dialogue.at(-1)?.text, "那就再走近一点。");
  assert.equal(dialogue.some((line) => line.text === "很棒。"), true);
  assert.equal(dialogue.some((line) => line.text === "不要 pua 我。"), true);
  assert.equal(dialogue.some((line) => line.text === "原来这就是开始。"), false);
});

test("1029 exposes exactly three optional-or-gated Echoes with approved portrait mappings", () => {
  assert.deepEqual(echoIds, ["singles-selection-echo", "hiking-shoe-echo", "score-forgotten-echo"]);
  assert.deepEqual(oct29EchoPortraitSequenceIds, {
    "singles-selection-echo": "oct29-singles-selection",
    "hiking-shoe-echo": "oct29-hiking-shoe",
    "score-forgotten-echo": "oct29-score-forgotten"
  });
  assert.deepEqual(Object.keys(oct29PortraitSequences), ["oct29-main", "oct29-singles-selection", "oct29-hiking-shoe", "oct29-score-forgotten"]);
  assert.deepEqual(oct29PortraitSequences["oct29-singles-selection"]?.beats.map((beat) => beat.portrait), [
    "assets/1029/memory-portrait/echo-singles.png",
    "assets/1029/memory-portrait/echo-score.png",
    "assets/1029/memory-portrait/echo-singles.png"
  ]);
  assert.deepEqual(oct29PortraitSequences["oct29-hiking-shoe"]?.beats.map((beat) => beat.portrait), [
    "assets/1029/memory-portrait/echo-shoes.png",
    "assets/1029/memory-portrait/echo-shoes.png"
  ]);
  assert.deepEqual(oct29PortraitSequences["oct29-score-forgotten"]?.beats.map((beat) => beat.portrait), [
    "assets/1029/memory-portrait/echo-score.png"
  ]);
  assert.deepEqual(oct29EchoAvailability, {
    "singles-selection-echo": { requiresMainCompletion: true },
    "hiking-shoe-echo": { requiresMainCompletion: true },
    "score-forgotten-echo": { requiresMainCompletion: true }
  });
});

test("1029 Main unlocks Echoes without launching Reflection, and only hiking shoes gates it", () => {
  const runtime = authoredRuntimeByScene["1029"]!;
  const fresh = startChapterMemoryExperience({ chapterId: oct29Chapter.id, mode: "automatic" });
  const completed = markChapterMainCompleted(fresh);
  assert.equal(runtime.mainInteractionId, "oct29-main-memory");
  assert.equal(runtime.mainPortraitSequenceId, "oct29-main");
  assert.equal(runtime.triggerId, "oct29-court-main-trigger");
  assert.equal(runtime.reflectionAfterEchoId, "hiking-shoe-echo");
  assert.equal(authoredEchoIsAvailable(runtime, "singles-selection-echo", fresh.mainCompleted), false);
  assert.equal(authoredEchoIsAvailable(runtime, "hiking-shoe-echo", fresh.mainCompleted), false);
  assert.equal(authoredEchoIsAvailable(runtime, "score-forgotten-echo", fresh.mainCompleted), false);
  for (const id of echoIds) assert.equal(authoredEchoIsAvailable(runtime, id, completed.mainCompleted), true);
  assert.notEqual(runtime.reflectionAfterEchoId, "singles-selection-echo");
  assert.notEqual(runtime.reflectionAfterEchoId, "score-forgotten-echo");
  assert.equal(runtime.reflectionChoices.length > 0, true);
});

test("1029 Reflection has three complete points and reaches all four current-run Ending routes", () => {
  assert.equal(oct29ReflectionChoices.length, 3);
  assert.equal(oct29ReflectionChoices.every((point) => point.choices.length === 3), true);
  assert.equal(oct29ReflectionChoices.flatMap((point) => point.choices).every((choice) => Boolean(choice.response)), true);
  assert.deepEqual(oct29ReflectionChoices.map((point) => point.id), [
    "oct29-reflection-closer",
    "oct29-reflection-praise",
    "oct29-reflection-beginning"
  ]);
  assert.equal(nextChapterReflectionPoint(oct29ReflectionChoices, oct29ReflectionChoices[0]!.id)?.id, "oct29-reflection-praise");
  assert.equal(nextChapterReflectionPoint(oct29ReflectionChoices, oct29ReflectionChoices[1]!.id)?.id, "oct29-reflection-beginning");
  assert.equal(nextChapterReflectionPoint(oct29ReflectionChoices, oct29ReflectionChoices[2]!.id), null);

  const routeChoices = {
    ordinary: ["oct29-closer-ordinary", "oct29-praise-simple", "oct29-beginning-no"],
    remembered: ["oct29-closer-mattered-later", "oct29-praise-because-her", "oct29-beginning-for-me"],
    holding: ["oct29-closer-beginning", "oct29-praise-simple", "oct29-beginning-for-me"],
    unanswered: ["oct29-closer-mattered-later", "oct29-praise-because-her", "oct29-beginning-unknown"]
  } as const;
  const expectedQuotes = {
    ordinary: "oct29-ordinary",
    remembered: "oct29-remembered",
    holding: "oct29-holding",
    unanswered: "oct29-unanswered"
  } as const;
  const closures = new Set<string>();
  for (const [route, ids] of Object.entries(routeChoices)) {
    let run = startChapterMemoryExperience({ chapterId: oct29Chapter.id, mode: "automatic" });
    for (const [index, id] of ids.entries()) {
      const point = oct29ReflectionChoices[index]!;
      run = applyChapterExperienceChoice(run, point.choices.find((choice) => choice.id === id)!);
    }
    const reflection = resolveChapterReflection(oct29Chapter, currentRunReflectionInput(run));
    assert.equal(reflection.quoteId, expectedQuotes[route as keyof typeof expectedQuotes]);
    assert.deepEqual(reflection.closureLines, oct29Chapter.canonicalClosure.lines);
    closures.add(reflection.closureLines.join("\n"));
  }
  assert.equal(closures.size, 1);
  assert.deepEqual(oct29Chapter.canonicalClosure.lines, [
    "2025 年 10 月 29 日，training 结束的时候，她对我来说还是 coach。",
    "我拿到了 single，脚也真的起泡了。",
    "那天我没有觉得，我们之间发生了什么特别的事。"
  ]);
});

test("1029 Diary is canonical, complete, and uses the shared Diary artwork", () => {
  assert.equal(sharedChapterDiaryBookAssetPath, "assets/labis/book-with-ms-photos.png");
  assert.equal(existsSync(join(publicRoot, sharedChapterDiaryBookAssetPath)), true);
  assert.equal(oct29DiaryEntry.body, oct29DiaryBody.join("\n\n"));
  assert.equal(oct29DiaryEntry.title, "10.29 · A Little Closer");
  assert.equal(oct29DiaryEntry.date, "2025-10-29");
  assert.equal(oct29DiaryEntry.chapterId, oct29Chapter.id);
  assert.equal(oct29Chapter.diaryEntryId, oct29DiaryEntry.id);
  assert.equal(oct29DiaryBody.at(0), "10.29 · A Little Closer");
  assert.equal(oct29DiaryBody.at(-1), "就记得这个吧。");
  assert.equal(oct29DiaryEntry.body.includes("整个晚上乱七八糟的"), true);
});

test("1029 authored content is registered, generated, and separated from WORLD interactions", () => {
  const runtime = authoredRuntimeByScene["1029"]!;
  assert.equal(runtime.chapter, oct29Chapter);
  const expectedChapter = (authoredContentExpectations.chapters as Record<string, unknown>).oct29;
  assert.deepEqual(authoredContentManifest.chapters.oct29, expectedChapter);
  assert.ok(ownedSourcePaths.includes("apps/html-prototype/src/fixtures/oct29Chapter.ts"));
  assert.ok(ownedSourcePaths.includes("apps/html-prototype/src/fixtures/authoredDiaryEntries.ts"));
  for (const orientation of ["landscape", "portrait"] as const) {
    const layout = loadLayout(orientation);
    assert.deepEqual(layout.interactions.map((item) => item.id), [
      "oct29-main-memory",
      "singles-selection-echo",
      "hiking-shoe-echo",
      "score-forgotten-echo",
      "diary",
      "exit"
    ]);
    assert.deepEqual(Object.keys(layout.echoAnchors), echoIds);
  }
  const presentationAssetNames = Object.values(oct29PortraitSequences).flatMap((sequence) => sequence.beats.map((beat) => beat.portrait));
  assert.equal(presentationAssetNames.some((asset) => typeof asset === "string" && layoutInteractionIds().includes(asset)), false);
});

function layoutInteractionIds(): string[] {
  return ["oct29-main-memory", "singles-selection-echo", "hiking-shoe-echo", "score-forgotten-echo", "diary", "exit"];
}

test("1029 starts a fresh run without stale Reflection state", () => {
  const runtime = authoredRuntimeByScene["1029"]!;
  const completed = markChapterEchoDiscovered(markChapterMainCompleted(startChapterMemoryExperience({ chapterId: oct29Chapter.id, mode: "automatic" })), "hiking-shoe-echo");
  assert.equal(authoredEchoIsAvailable(runtime, "hiking-shoe-echo", completed.mainCompleted), true);
  assert.equal(completed.resolvedReflection, undefined);
  const replay = startChapterMemoryExperience({ chapterId: oct29Chapter.id, mode: "manual-replay" });
  assert.equal(replay.mainCompleted, false);
  assert.deepEqual(replay.reflectionChoiceIds, []);
  assert.deepEqual([...replay.discoveredEchoIds], []);
  assert.equal(replay.resolvedReflection, undefined);
});
