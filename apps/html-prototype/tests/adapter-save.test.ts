import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";
import { chapterPlanToHtmlScene } from "../src/adapters/chapterPlanAdapter.js";
import { bakeryChapter, forestDoors } from "../src/fixtures/chapterPlan.js";
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
    endingProgress: []
  };
  assert.equal(save.version, 1);
  assert.deepEqual(save.completedChapters, ["bakery-day"]);
  assert.deepEqual(save.readMemories, ["bakery-day"]);
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

test("global music loops the local bakery mp3 without creating a YouTube player", () => {
  assert.equal(globalMusic.label, "Bakery loop");
  assert.equal(globalMusic.src, "assets/audio/bakery.mp3");
  assert.equal(sceneMusic.bakery.src, globalMusic.src);
  assert.equal(sceneMusic.forest.src, globalMusic.src);
  assert.ok(!("videoId" in sceneMusic.bakery));
  assert.ok(!("list" in sceneMusic.forest));
  assert.ok(existsSync(resolve("public", globalMusic.src)));
  assert.ok(sceneMusicDataUri("forest").startsWith("data:audio/wav;base64,"));
  assert.ok(sceneMusicDataUri("bakery").startsWith("data:audio/wav;base64,"));
});
