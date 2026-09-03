import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";
import {
  july21Chapter,
  july21DiaryBody,
  july21DiaryEntry,
  july21EchoAvailability,
  july21EchoPortraitSequenceIds,
  july21MainPortraitSequence,
  july21PortraitSequences,
  july21ReflectionChoices
} from "../src/fixtures/july21Chapter.js";
import { authoredEchoIsAvailable, authoredRuntimeByScene } from "../src/systems/AuthoredChapterRegistry.js";
import { chapterRegistry, forestEntries, routeForestEntry } from "../src/systems/ChapterRegistry.js";
import { applyChapterExperienceChoice, currentRunReflectionInput, markChapterEchoDiscovered, markChapterMainCompleted, nextChapterReflectionPoint, startChapterMemoryExperience } from "../src/systems/ChapterMemoryExperience.js";
import { resolveChapterReflection } from "../src/systems/EndingResolver.js";
import { renderMemoryPortraitSequenceBeat } from "../src/systems/MemoryPortraitPresentation.js";
import type { SceneLayout } from "../src/systems/SceneLayouts.js";
import { sharedChapterDiaryBookAssetPath } from "../src/systems/DiaryLibrary.js";
import { renderReflection } from "../src/systems/PresentationRenderer.js";
import { authoredContentExpectations } from "../src/fixtures/generated/authoredContentExpectations.js";

const runtime = authoredRuntimeByScene["721"];
const echoIds = [
  "travel-memory",
  "eggtoast-money-memory",
  "bedroom-memory",
  "family-memory",
  "money-back-memory",
  "kexing-memory",
  "morning-memory",
  "departure-memory",
  "left-behind-memory"
];

function loadLayout(orientation: "portrait" | "landscape"): SceneLayout {
  return JSON.parse(readFileSync(join("public", "scene-layouts", "721", `${orientation}.json`), "utf8")) as SceneLayout;
}

test("721 is one registered playable chapter and not a July 20 chapter", () => {
  assert.equal(chapterRegistry[july21Chapter.id], july21Chapter);
  assert.equal(forestEntries.filter((entry) => entry.chapterId === july21Chapter.id).length, 1);
  assert.equal(forestEntries.some((entry) => entry.date.includes("07.20")), false);
  assert.equal(routeForestEntry(forestEntries.find((entry) => entry.chapterId === july21Chapter.id)!).kind, "implemented-chapter");
  assert.equal(forestEntries.find((entry) => entry.chapterId === july21Chapter.id)?.date, "07.21–07.22");
  assert.equal(july21Chapter.date, "07.21–07.22");
  assert.equal(july21Chapter.title, authoredContentExpectations.chapters.july21.display.title);
});

test("721 layouts use the exact approved scene assets and geometry", () => {
  const portrait = loadLayout("portrait");
  const landscape = loadLayout("landscape");

  assert.equal(portrait.asset, "assets/721/721-portrait.png");
  assert.equal(landscape.asset, "assets/721/721-landscape.png");
  assert.deepEqual(portrait.size, { w: 941, h: 1672 });
  assert.deepEqual(landscape.size, { w: 1672, h: 941 });
  assert.deepEqual(portrait.spawn, { x: 577.2262762209768, y: 1051.7199807439918 });
  assert.deepEqual(landscape.spawn, { x: 887.7868100272512, y: 694.3550985395913 });
  assert.deepEqual(portrait.interactions.map(({ id, x, y, radius }) => ({ id, x, y, radius })), [
    { id: "travel-memory", x: 314.97354064517435, y: 1440.7554027311953, radius: 50 },
    { id: "eggtoast-money-memory", x: 693.0254381023806, y: 791.7356409767485, radius: 46 },
    { id: "bedroom-memory", x: 822.781290044694, y: 661.1908720534999, radius: 50 },
    { id: "family-memory", x: 376.13737716248954, y: 893.0903277326946, radius: 54 },
    { id: "money-back-memory", x: 269.1802259225102, y: 642.7149691589021, radius: 44 },
    { id: "sofa-main-memory", x: 483.67400000000004, y: 519.992, radius: 48 },
    { id: "kexing-memory", x: 694.9262922439216, y: 518.6047071890345, radius: 44 },
    { id: "morning-memory", x: 442.238671798198, y: 387.3130425002001, radius: 46 },
    { id: "departure-memory", x: 514.7921359568668, y: 730.8016551843979, radius: 54 },
    { id: "left-behind-memory", x: 719.3171236330835, y: 1131.240315065892, radius: 48 },
    { id: "exit", x: 675.1365389628157, y: 1429.3682615626622, radius: 64 },
    { id: "diary", x: 704.6700591865898, y: 931.4399324670808, radius: 50 }
  ]);
  assert.deepEqual(landscape.interactions.map(({ id, x, y, radius }) => ({ id, x, y, radius })), [
    { id: "travel-memory", x: 1370.983767393993, y: 588.5677433085709, radius: 52 },
    { id: "eggtoast-money-memory", x: 540.272965793755, y: 452.66628045727737, radius: 48 },
    { id: "bedroom-memory", x: 563.464, y: 266.303, radius: 54 },
    { id: "family-memory", x: 354.464, y: 587.184, radius: 56 },
    { id: "money-back-memory", x: 210.672, y: 652.1129999999999, radius: 44 },
    { id: "sofa-main-memory", x: 785.8399999999999, y: 397.102, radius: 50 },
    { id: "kexing-memory", x: 1004.872, y: 398.984, radius: 46 },
    { id: "morning-memory", x: 1185.4479999999999, y: 455.44399999999996, radius: 48 },
    { id: "departure-memory", x: 1142.6866334053045, y: 584.8822974632872, radius: 56 },
    { id: "left-behind-memory", x: 1164.7113805114047, y: 755.5796555016166, radius: 48 },
    { id: "exit", x: 1446.1760292034248, y: 453.77696773114684, radius: 66 },
    { id: "diary", x: 430.9919640432837, y: 808.0889928246394, radius: 52 }
  ]);
});

test("721 Echo anchors are interaction-scale and preserve every approved semantic ID", () => {
  for (const orientation of ["portrait", "landscape"] as const) {
    const layout = loadLayout(orientation);
    assert.deepEqual(Object.keys(layout.echoAnchors), echoIds);
    for (const id of echoIds) assert.equal(layout.echoAnchors[id].radius, layout.interactions.find((item) => item.id === id)?.radius, `${orientation}:${id}`);
  }
});

test("721 reuses the Labis diary book and the exact authored body", () => {
  assert.equal(sharedChapterDiaryBookAssetPath, "assets/labis/book-with-ms-photos.png");
  assert.equal(july21DiaryEntry.body, july21DiaryBody.join("\n\n"));
  assert.equal(july21DiaryEntry.chapterId, july21Chapter.id);
  assert.equal(july21DiaryEntry.title, authoredContentExpectations.chapters.july21.diary?.title);
  assert.equal(july21DiaryEntry.body, authoredContentExpectations.chapters.july21.diary?.body);
});

test("721 Main is one continuous five-beat portrait sequence in semantic order", () => {
  assert.deepEqual(july21MainPortraitSequence.beats.map((beat) => beat.portrait), authoredContentExpectations.chapters.july21.beatPortraits?.["july21-main"]);
  const dialogue = july21MainPortraitSequence.beats.flatMap((beat) => beat.dialogue);
  assert.deepEqual(dialogue.map((line) => line.speaker), [
    "她", "她", "她", "Memory", "Memory", "Memory", "我", "她", "我", "我", "她", "我", "她", "我", "她", "Memory", "她", "我", "她", "她", "她", "我", "我", "她", "她", "我", "Memory", "Memory", "我", "她", "我", "她", "我", "她", "她", "她", "她", "她", "我", "她", "我", "我", "我", "我", "她", "她", "她"
  ]);
  assert.deepEqual(dialogue.map((line) => ({ text: line.text })), authoredContentExpectations.chapters.july21.dialogue.map((line) => ({ text: line.text })));
  for (const [index, beat] of july21MainPortraitSequence.beats.entries()) {
    for (let line = 0; line < beat.dialogue.length; line += 1) {
      const markup = renderMemoryPortraitSequenceBeat(july21MainPortraitSequence, index, line, { orientation: "landscape", width: 1280, height: 720 });
      assert.match(markup, /data-action="portrait-sequence-next"/);
    }
  }
});

test("721 Echo portrait sequences cover every authored interaction and use the approved assets", () => {
  assert.deepEqual(Object.keys(july21EchoPortraitSequenceIds), echoIds);
  const paths = Object.fromEntries(Object.entries(july21PortraitSequences).map(([id, sequence]) => [
    id,
    sequence.beats.map((beat) => typeof beat.portrait === "string" ? beat.portrait : beat.portrait.src)
  ]));
  assert.deepEqual(paths, authoredContentExpectations.chapters.july21.beatPortraits);
});

test("721 uses current-run Main, departure, and left-behind gating", () => {
  const fresh = startChapterMemoryExperience({ chapterId: july21Chapter.id, mode: "automatic" });
  const mainComplete = markChapterMainCompleted(fresh);
  const departed = markChapterEchoDiscovered(mainComplete, "departure-memory");
  const leftBehind = markChapterEchoDiscovered(departed, "left-behind-memory");

  assert.equal(authoredEchoIsAvailable(runtime, "travel-memory", fresh.mainCompleted, fresh.discoveredEchoIds), true);
  assert.equal(authoredEchoIsAvailable(runtime, "kexing-memory", fresh.mainCompleted, fresh.discoveredEchoIds), false);
  assert.equal(authoredEchoIsAvailable(runtime, "kexing-memory", mainComplete.mainCompleted, mainComplete.discoveredEchoIds), true);
  assert.equal(authoredEchoIsAvailable(runtime, "left-behind-memory", mainComplete.mainCompleted, mainComplete.discoveredEchoIds), false);
  assert.equal(authoredEchoIsAvailable(runtime, "left-behind-memory", departed.mainCompleted, departed.discoveredEchoIds), true);
  assert.deepEqual([...leftBehind.discoveredEchoIds], ["departure-memory", "left-behind-memory"]);
  assert.equal(runtime.reflectionAfterEchoId, "left-behind-memory");
});

test("721 reflection choices all carry their authored response and current-run effects", () => {
  assert.equal(july21ReflectionChoices.length, 3);
  assert.equal(july21ReflectionChoices.every((point) => point.choices.length === 3), true);
  assert.equal(july21ReflectionChoices.flatMap((point) => point.choices).every((choice) => Boolean(choice.response)), true);
  const run = july21ReflectionChoices.reduce(
    (current, point) => applyChapterExperienceChoice(current, point.choices[0]),
    startChapterMemoryExperience({ chapterId: july21Chapter.id, mode: "automatic" })
  );
  assert.deepEqual(currentRunReflectionInput(run).choices, july21ReflectionChoices.map((point) => point.choices[0].id));
  assert.equal(run.tendencies.closeness, 2);
  assert.equal(run.tendencies.honesty, 2);
  assert.equal(resolveChapterReflection(july21Chapter, currentRunReflectionInput(run)).closureLines.at(-1), "水壶却留在车上。");
});

test("721 reflection progresses R1 response to R2 response to R3 response before ending", () => {
  let run = startChapterMemoryExperience({ chapterId: july21Chapter.id, mode: "automatic" });
  let reflectionId = july21ReflectionChoices[0].id;
  const selectedIds: string[] = [];

  for (let index = 0; index < july21ReflectionChoices.length; index += 1) {
    const point = july21ReflectionChoices.find((item) => item.id === reflectionId);
    assert.ok(point, `missing reflection point ${reflectionId}`);
    const selected = point.choices[0];
    assert.ok(selected.response, `missing response for ${selected.id}`);
    const responseMarkup = renderReflection({ lines: [selected.response], actions: '<button data-action="authored-reflection-next">Continue walking</button>' });
    assert.match(responseMarkup, /authored-reflection-next/);
    selectedIds.push(selected.id);
    run = applyChapterExperienceChoice(run, selected);

    const next = nextChapterReflectionPoint(july21ReflectionChoices, reflectionId);
    if (index < july21ReflectionChoices.length - 1) {
      assert.ok(next, `reflection ${reflectionId} ended before the next question`);
      reflectionId = next.id;
    } else {
      assert.equal(next, null);
    }
  }

  assert.deepEqual(run.reflectionChoiceIds, selectedIds);
  assert.equal(run.tendencies.closeness, 2);
  assert.equal(run.tendencies.honesty, 2);
  assert.equal(run.tendencies.holding, 1);
  const ending = resolveChapterReflection(july21Chapter, currentRunReflectionInput(run));
  assert.equal(ending.quoteId, "july21-holding");
  assert.deepEqual(ending.closureLines, ["那天下午，她还是走了。", "水壶却留在车上。"]);
});

test("721 authored runtime is data-driven and does not add chapter-specific renderer branches", () => {
  assert.equal(runtime.chapter, july21Chapter);
  assert.equal(runtime.mainPortraitSequenceId, "july21-main");
  assert.equal(runtime.reflectionAfterEchoId, "left-behind-memory");
  assert.deepEqual(runtime.echoAvailability, july21EchoAvailability);
  const appSource = readFileSync(join("src", "app.ts"), "utf8");
  assert.doesNotMatch(appSource, /july21|721/);
});
