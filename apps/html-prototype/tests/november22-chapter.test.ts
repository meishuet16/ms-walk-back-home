import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";
import {
  november22Chapter,
  november22DiaryBody,
  november22DiaryEntry,
  november22EchoAnchors,
  november22EchoPortraitSequenceIds,
  november22MainPortraitSequence,
  november22PortraitSequences,
  november22ReflectionChoices
} from "../src/fixtures/november22Chapter.js";
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
const echoIds = Object.keys(november22EchoPortraitSequenceIds);

function loadLayout(orientation: "landscape" | "portrait"): SceneLayout {
  return JSON.parse(readFileSync(join(publicRoot, "scene-layouts", "1122", `${orientation}.json`), "utf8")) as SceneLayout;
}

function pngSize(path: string): { w: number; h: number } {
  const png = readFileSync(path);
  assert.equal(png.toString("ascii", 1, 4), "PNG");
  return { w: png.readUInt32BE(16), h: png.readUInt32BE(20) };
}

test("1122 is one Forest-routable chapter spanning November 21–22", () => {
  assert.equal(chapterRegistry[november22Chapter.id], november22Chapter);
  const entries = forestEntries.filter((entry) => entry.chapterId === november22Chapter.id);
  assert.equal(entries.length, 1);
  assert.equal(entries[0]?.date, "11.21–11.22");
  assert.equal(entries[0]?.title, "Before Sunrise");
  assert.equal(routeForestEntry(entries[0]!).kind, "implemented-chapter");
  assert.equal(november22Chapter.runtimeScene, "1122");
  assert.equal(november22Chapter.canonicalClosure.historicalEventId, "1122-main-memory");
});

test("1122 keeps independent authored Landscape and Portrait assets, sizes, and geometry", () => {
  const landscape = loadLayout("landscape");
  const portrait = loadLayout("portrait");
  assert.equal(landscape.asset, "assets/1122/1122-landscape.png");
  assert.equal(portrait.asset, "assets/1122/1122-portrait.png");
  assert.deepEqual(landscape.size, { w: 1672, h: 941 });
  assert.deepEqual(portrait.size, { w: 941, h: 1672 });
  assert.deepEqual(pngSize(join(publicRoot, landscape.asset)), landscape.size);
  assert.deepEqual(pngSize(join(publicRoot, portrait.asset)), portrait.size);
  assert.notDeepEqual(landscape.spawn, portrait.spawn);
  assert.notDeepEqual(landscape.interactions.map(({ id, x, y }) => ({ id, x, y })), portrait.interactions.map(({ id, x, y }) => ({ id, x, y })));
  assert.equal(landscape.triggers[0]?.id, "1122-main-memory-trigger");
  assert.equal(portrait.triggers[0]?.id, "1122-main-memory-trigger");
  for (const layout of [landscape, portrait]) {
    const trigger = layout.triggers[0]!;
    assert.equal(trigger.chapterId, "1122-before-sunrise");
    assert.equal(trigger.eventId, "1122-main-memory");
    assert.equal(trigger.once, true);
  }
});

test("1122 authored Echo anchors preserve x/y and normalize only their corrupted radii", () => {
  const expected = {
    landscape: {
      "dark-corridor": { x: 621.1199755859375, y: 665.4800366210937, radius: 58 },
      "dobi-invite": { x: 642.5600244140626, y: 549.3300244140624, radius: 56 },
      "car-mbti": { x: 334.40000000000003, y: 809.26, radius: 54 },
      "wrong-way-again": { x: 96.80001220703116, y: 602.8599755859375, radius: 54 },
      "memory-laundry-pods": { x: 635.36, y: 338.76, radius: 54 },
      "dobi-conversation": { x: 1120.24, y: 348.17, radius: 60 },
      "memory-empty-room-rain": { x: 132.6400366210937, y: 409.32, radius: 58 }
    },
    portrait: {
      "dark-corridor": { x: 638.9100732421875, y: 1160.7199267578123, radius: 54 },
      "dobi-invite": { x: 349.28009765625, y: 1088.5598901367186, radius: 54 },
      "car-mbti": { x: 267.26178955078126, y: 1295.648338317871, radius: 52 },
      "wrong-way-again": { x: 560.1800244140625, y: 1276.3999862670898, radius: 52 },
      "memory-laundry-pods": { x: 393.564892578125, y: 314.87646484375, radius: 52 },
      "dobi-conversation": { x: 621.0600000000001, y: 418, radius: 56 },
      "memory-empty-room-rain": { x: 249.66986572265628, y: 424.5549975585937, radius: 54 }
    }
  } as const;

  for (const orientation of ["landscape", "portrait"] as const) {
    const layout = loadLayout(orientation);
    assert.deepEqual(Object.fromEntries(echoIds.map((id) => [id, layout.echoAnchors[id]])), expected[orientation]);
    for (const id of echoIds) {
      assert.equal(layout.echoAnchors[id]?.radius, layout.interactions.find((item) => item.id === id)?.radius, `${orientation}:${id}`);
    }
  }
});

test("1122 has only approved world interactions and maps every Echo to its presentation sequence", () => {
  const approved = ["main-memory", "diary", ...echoIds, "exit"];
  for (const orientation of ["landscape", "portrait"] as const) {
    const layout = loadLayout(orientation);
    assert.deepEqual(layout.interactions.map((item) => item.id), approved);
    assert.deepEqual(Object.keys(layout.echoAnchors), echoIds);
  }
  assert.deepEqual(november22EchoAnchors, Object.fromEntries(echoIds.map((id) => [id, id])));
  assert.deepEqual(Object.keys(november22PortraitSequences), ["1122-main", ...Object.values(november22EchoPortraitSequenceIds)]);
});

test("1122 Main is the approved seven-beat hi → bye → drop portrait sequence", () => {
  assert.equal(november22MainPortraitSequence.beats.length, 7);
  assert.deepEqual(november22MainPortraitSequence.beats.map((beat) => beat.portrait), [
    "assets/1122/memory-portrait/echo-hi.png",
    "assets/1122/memory-portrait/echo-bye.png",
    "assets/1122/memory-portrait/echo-drop.png",
    "assets/1122/memory-portrait/echo-drop.png",
    "assets/1122/memory-portrait/echo-drop.png",
    "assets/1122/memory-portrait/echo-drop.png",
    "assets/1122/memory-portrait/echo-drop.png"
  ]);
  const dialogue = november22MainPortraitSequence.beats.flatMap((beat) => beat.dialogue);
  assert.ok(dialogue.some((line) => line.text === "假笑.jpg"));
  assert.ok(dialogue.some((line) => line.text === "非常小算盘.jpg。"));
  assert.ok(dialogue.some((line) => line.text === "空投计划，通。"));
  assert.equal(dialogue.at(-1)?.text, "我可真是个甜菜。");
});

test("1122 Echo presentation mappings preserve the approved single and two-stage transitions", () => {
  const path = (id: string) => november22PortraitSequences[november22EchoPortraitSequenceIds[id]]!.beats.map((beat) => beat.portrait);
  assert.deepEqual(path("dark-corridor"), ["assets/1122/memory-portrait/echo-corridor.png"]);
  assert.deepEqual(path("dobi-invite"), ["assets/1122/memory-portrait/echo-car-02.png"]);
  assert.deepEqual(path("car-mbti"), ["assets/1122/memory-portrait/echo-car-02.png"]);
  assert.deepEqual(path("wrong-way-again"), ["assets/1122/memory-portrait/echo-car-02.png"]);
  assert.deepEqual(path("memory-laundry-pods"), ["assets/1122/memory-portrait/echo-dobi01.png"]);
  assert.deepEqual(path("dobi-conversation"), ["assets/1122/memory-portrait/echo-dobi02.png", "assets/1122/memory-portrait/echo-dobi04.png"]);
  assert.deepEqual(path("memory-empty-room-rain"), ["assets/1122/memory-portrait/echo-empty-room.png", "assets/1122/memory-portrait/echo-photo-kept.png"]);
  assert.equal(november22PortraitSequences["1122-dobi-conversation"]?.beats[1]?.dialogue.at(-1)?.text, "所以我们继续等。");
  assert.equal(november22PortraitSequences["1122-memory-empty-room-rain"]?.beats.at(-1)?.dialogue.at(-1)?.text, "下午突然就没电了。");
});

test("1122 reflection is exactly three prompts by three choices, with all authored responses", () => {
  assert.equal(november22ReflectionChoices.length, 3);
  assert.equal(november22ReflectionChoices.every((point) => point.choices.length === 3), true);
  assert.equal(november22ReflectionChoices.flatMap((point) => point.choices).every((choice) => Boolean(choice.response)), true);
  assert.deepEqual(november22ReflectionChoices.map((point) => point.prompt), [
    "现在回头看，那天早上为什么留得这么清楚？",
    "后来我为什么那么快开始警告自己？",
    "那我现在还需要知道，那些事对她意味着什么吗？"
  ]);
});

test("1122 routes current-run reflection through all four semantic endings and one closure", () => {
  const routeChoices = {
    connection: ["1122-connection-morning", "1122-acceptance-warning", "1122-connection-meaning"],
    acceptance: ["1122-acceptance-morning", "1122-acceptance-warning", "1122-acceptance-meaning"],
    uncertainty: ["1122-uncertainty-morning", "1122-uncertainty-warning", "1122-acceptance-meaning"],
    guarded: ["1122-acceptance-morning", "1122-guarded-warning", "1122-guarded-meaning"]
  } as const;
  const expectedQuotes = {
    connection: "1122-connection-heavy",
    acceptance: "1122-acceptance-heavy",
    uncertainty: "1122-uncertainty-heavy",
    guarded: "1122-guarded-heavy"
  } as const;
  const closures = new Set<string>();
  for (const [route, ids] of Object.entries(routeChoices)) {
    let run = startChapterMemoryExperience({ chapterId: november22Chapter.id, mode: "automatic" });
    for (const [index, id] of ids.entries()) {
      const point = november22ReflectionChoices[index]!;
      run = applyChapterExperienceChoice(run, point.choices.find((choice) => choice.id === id)!);
    }
    const reflection = resolveChapterReflection(november22Chapter, currentRunReflectionInput(run));
    assert.equal(reflection.quoteId, expectedQuotes[route as keyof typeof expectedQuotes]);
    assert.deepEqual(reflection.closureLines, november22Chapter.canonicalClosure.lines);
    closures.add(reflection.closureLines.join("\n"));
  }
  assert.equal(closures.size, 1);
  assert.deepEqual(november22Chapter.canonicalClosure.lines, [
    "那天，凌晨五点的开心是真的。",
    "下午一个人的空虚也是真的。",
    "意识到自己不想把全部安全感压在别人身上，这也是真的。",
    "但这三件事不需要互相定罪。"
  ]);
});

test("1122 run state resets on replay and the final Echo enters Reflection", () => {
  const runtime = authoredRuntimeByScene["1122"]!;
  const fresh = startChapterMemoryExperience({ chapterId: november22Chapter.id, mode: "automatic" });
  const completed = markChapterMainCompleted(fresh);
  const withFinalEcho = markChapterEchoDiscovered(completed, "memory-empty-room-rain");
  assert.equal(authoredEchoIsAvailable(runtime, "dark-corridor", false), false);
  assert.equal(authoredEchoIsAvailable(runtime, "dark-corridor", completed.mainCompleted), true);
  assert.equal(runtime.reflectionAfterEchoId, "memory-empty-room-rain");
  assert.equal(nextChapterReflectionPoint(november22ReflectionChoices, november22ReflectionChoices[0]!.id)?.id, "1122-reflection-warning");
  assert.equal(nextChapterReflectionPoint(november22ReflectionChoices, november22ReflectionChoices[2]!.id), null);
  assert.equal(withFinalEcho.resolvedReflection, undefined);
  const replay = startChapterMemoryExperience({ chapterId: november22Chapter.id, mode: "manual-replay" });
  assert.equal(replay.mainCompleted, false);
  assert.deepEqual(replay.reflectionChoiceIds, []);
  assert.deepEqual([...replay.discoveredEchoIds], []);
  assert.equal(replay.resolvedReflection, undefined);
});

test("1122 uses the canonical Labis diary book and the complete authored diary body", () => {
  assert.equal(sharedChapterDiaryBookAssetPath, "assets/labis/book-with-ms-photos.png");
  assert.equal(existsSync(join(publicRoot, sharedChapterDiaryBookAssetPath)), true);
  assert.equal(november22DiaryEntry.body, november22DiaryBody.join("\n\n"));
  assert.equal(november22DiaryEntry.body, authoredContentExpectations.chapters.november22.diary?.body);
  assert.equal(november22DiaryEntry.title, "11.21–11.22 · Before Sunrise");
  assert.equal(november22DiaryEntry.chapterId, november22Chapter.id);
  assert.equal(november22Chapter.diaryEntryId, november22DiaryEntry.id);
  assert.equal(november22DiaryBody.at(0), "11.21–11.22 · Before Sunrise");
  assert.equal(november22DiaryBody.at(-1), "第二天真的有人记得。");
});

test("1122 authored expectations are generated, discoverable, and asset-complete", () => {
  assert.deepEqual(authoredContentManifest.chapters.november22, authoredContentExpectations.chapters.november22);
  assert.ok(ownedSourcePaths.includes("apps/html-prototype/src/fixtures/november22Chapter.ts"));
  const referenced = [
    "assets/1122/1122-landscape.png",
    "assets/1122/1122-portrait.png",
    "assets/1122/memory-portrait/echo-hi.png",
    "assets/1122/memory-portrait/echo-bye.png",
    "assets/1122/memory-portrait/echo-drop.png",
    "assets/1122/memory-portrait/echo-corridor.png",
    "assets/1122/memory-portrait/echo-car-02.png",
    "assets/1122/memory-portrait/echo-dobi01.png",
    "assets/1122/memory-portrait/echo-dobi02.png",
    "assets/1122/memory-portrait/echo-dobi04.png",
    "assets/1122/memory-portrait/echo-empty-room.png",
    "assets/1122/memory-portrait/echo-photo-kept.png",
    sharedChapterDiaryBookAssetPath
  ];
  for (const asset of referenced) assert.equal(existsSync(join(publicRoot, asset)), true, asset);
});
