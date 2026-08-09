import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";
import { chapterPlanToHtmlScene } from "../src/adapters/chapterPlanAdapter.js";
import { bakeryChapter, forestDoors } from "../src/fixtures/chapterPlan.js";
import { diaryEntriesToForestMemories, diaryEntriesToTimeline, parseDiaryImport, updateDiaryMemoryKind } from "../src/systems/DiaryImport.js";
import { globalMusic, sceneMusic, sceneMusicDataUri } from "../src/systems/SceneMusic.js";
import type { SaveState } from "../src/types.js";

test("chapter adapter preserves fictional metadata for HTML scene data", () => {
  const scene = chapterPlanToHtmlScene({
    id: "fixture-plan",
    date: "2026-07-28",
    title: "Fixture Bakery",
    mood: { primary: "gentle" },
    weather: { condition: "rain" }
  });
  assert.equal(scene.id, "fixture-plan");
  assert.equal(scene.title, "Fixture Bakery");
  assert.equal(scene.mood, "gentle");
  assert.equal(scene.weather, "rain");
  assert.ok(scene.dialogue.length >= 3);
});

test("save state includes a version and narrative persistence fields", () => {
  const save: SaveState = {
    version: 1,
    savedAt: "2026-08-06T00:00:00.000Z",
    scene: "forest",
    player: { x: 1, y: 2 },
    openedDoors: ["yumido"],
    completedChapters: ["bakery-day"],
    choices: ["remember"],
    tendencies: {
      acceptance: 1,
      avoidance: 0,
      closeness: 0,
      distance: 0,
      honesty: 1,
      concealment: 0,
      companionship: 0,
      intervention: 0
    },
    scrapbook: ["The small pastry that stayed small"],
    favorites: [],
    timelineCompleted: ["Yumido Bread"],
    selectedChapter: "Yumido Bread",
    settings: { rain: true, muted: true, volume: 0.2, compact: false, reducedMotion: false },
    readMemories: ["bakery-day"],
    diaryEntries: [{ id: "diary-2026-08-06", date: "2026-08-06", title: "A Quiet Test", body: "Rain on the bus window.", memoryKind: "diary" }],
    endingProgress: []
  };
  assert.equal(save.version, 1);
  assert.deepEqual(save.completedChapters, ["bakery-day"]);
  assert.deepEqual(save.readMemories, ["bakery-day"]);
  assert.equal(save.diaryEntries?.[0]?.date, "2026-08-06");
});

test("forest doors expose distinct memory instances for long-term progression", () => {
  const chapterIds = new Set(forestDoors.map((door) => door.chapterId));
  assert.equal(chapterIds.size, forestDoors.length);
});

test("friend dialogue keeps Friend A portrait throughout the conversation", () => {
  assert.ok(bakeryChapter.dialogue.length >= 3);
  assert.ok(bakeryChapter.dialogue.every((node) => node.speaker === "Friend A"));
  assert.ok(bakeryChapter.dialogue.every((node) => node.portrait === "friend"));
});

test("scene music loops local mp3 files without creating a YouTube player", () => {
  assert.equal(globalMusic.label, "Bakery loop");
  assert.equal(globalMusic.src, "assets/audio/bakery.mp3");
  assert.equal(sceneMusic.bakery.src, globalMusic.src);
  assert.equal(sceneMusic.forest.src, "assets/audio/forest.mp3");
  assert.ok(!("videoId" in sceneMusic.bakery));
  assert.ok(!("list" in sceneMusic.forest));
  assert.ok(existsSync(resolve("public", globalMusic.src)));
  assert.ok(existsSync(resolve("public", sceneMusic.forest.src)));
  assert.ok(sceneMusicDataUri("forest").startsWith("data:audio/wav;base64,"));
  assert.ok(sceneMusicDataUri("bakery").startsWith("data:audio/wav;base64,"));
});

test("diary import creates timeline entries that default to diary-only", () => {
  const entries = parseDiaryImport("2026-08-06 | Rain Letter | I kept thinking about the yellow bakery light.");
  assert.equal(entries.length, 1);
  assert.equal(entries[0].date, "2026-08-06");
  assert.equal(entries[0].title, "Rain Letter");
  assert.equal(entries[0].memoryKind, "diary");
  assert.ok(entries[0].body.includes("yellow bakery light"));

  const timeline = diaryEntriesToTimeline(entries);
  assert.equal(timeline.length, 1);
  assert.equal(timeline[0].title, "Rain Letter");
  assert.equal(diaryEntriesToForestMemories(entries).length, 0);
});

test("classification controls derived forest representation without changing the diary entry", () => {
  const [entry] = parseDiaryImport("2026-08-06 | Rain Letter | I kept thinking about the yellow bakery light.");
  const fragment = updateDiaryMemoryKind(entry, "fragment");
  const chapter = updateDiaryMemoryKind(entry, "chapter", "rain-letter");

  const fragmentMemory = diaryEntriesToForestMemories([fragment])[0];
  assert.equal(fragmentMemory.kind, "fragment");
  assert.equal(fragmentMemory.title, "Rain Letter");

  const chapterMemory = diaryEntriesToForestMemories([chapter])[0];
  assert.equal(chapterMemory.kind, "chapter");
  assert.equal(chapterMemory.chapterId, "rain-letter");
  assert.equal(chapterMemory.implemented, false);
});

test("scrapbook layout belongs to diary entries and survives timeline projection", () => {
  const [entry] = parseDiaryImport("2026-08-07 | Page With Photo | A photo stayed on the left side.");
  entry.photos = [{ id: "photo-1", src: "data:image/png;base64,fixture", caption: "window" }];
  entry.scrapbookLayout = {
    elements: [{ id: "layout-1", type: "photo", photoId: "photo-1", x: 12, y: 18, scale: 1.2, rotation: -4, zIndex: 1 }]
  };

  assert.equal(diaryEntriesToTimeline([entry])[0].hasScrapbookLayout, true);
  assert.deepEqual(entry.scrapbookLayout.elements[0], {
    id: "layout-1",
    type: "photo",
    photoId: "photo-1",
    x: 12,
    y: 18,
    scale: 1.2,
    rotation: -4,
    zIndex: 1
  });
});
