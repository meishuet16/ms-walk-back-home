import assert from "node:assert/strict";
import test from "node:test";
import { chapterPlanToHtmlScene } from "../src/adapters/chapterPlanAdapter.js";
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
    endingProgress: []
  };
  assert.equal(save.version, 1);
  assert.deepEqual(save.completedChapters, ["bakery-day"]);
});
