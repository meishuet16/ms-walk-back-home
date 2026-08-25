import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import { forestDoors } from "../src/fixtures/chapterPlan.js";
import { labisBlockers, labisDiaryMemorySpot, labisMemoryTriggers, labisSpawn } from "../src/fixtures/labisMotorMemory.js";
import { roomInteractions, roomObstacles, roomSpawn } from "../src/systems/MujiRoom.js";
import {
  cloneSceneLayout,
  getSceneLayout,
  resolveForestDynamicPlacements,
  sceneLayoutManifest,
  scenePortraitAssetPaths,
  selectSceneOrientation,
  setSceneLayout
} from "../src/systems/SceneLayouts.js";
import type { SceneLayout } from "../src/systems/SceneLayouts.js";

test("portrait scene layouts preconfigure exact existing portrait artwork paths", () => {
  assert.deepEqual(scenePortraitAssetPaths(), {
    forest: "assets/forest-potrait.png",
    "muji-room": "assets/muji-room-potrait.png",
    bakery: "assets/bakery-potrait.png",
    labis: "assets/719-potrait.png"
  });

  for (const sceneId of Object.keys(sceneLayoutManifest)) {
    const portrait = getSceneLayout(sceneId, "portrait");
    assert.equal(portrait.orientation, "portrait");
    assert.equal(portrait.size.w, 941);
    assert.equal(portrait.size.h, 1672);
  }
});

test("portrait layouts start with safe spatial defaults instead of landscape artwork or coordinates", () => {
  for (const sceneId of Object.keys(sceneLayoutManifest)) {
    const portrait = getSceneLayout(sceneId, "portrait");
    const landscape = getSceneLayout(sceneId, "landscape");

    assert.notEqual(portrait.asset, landscape.asset);
    assert.deepEqual(portrait.spawn, { x: 470.5, y: 836 });
    assert.deepEqual(portrait.obstacles, []);
    assert.deepEqual(portrait.interactions, []);
    assert.deepEqual(portrait.triggers, []);
    assert.deepEqual(portrait.anchors, {});
    assert.deepEqual(portrait.placementSlots, []);
  }
});

test("landscape scene layouts preserve current authored coordinates", () => {
  assert.deepEqual(getSceneLayout("muji-room", "landscape").spawn, roomSpawn);
  assert.deepEqual(getSceneLayout("muji-room", "landscape").obstacles, roomObstacles);
  assert.deepEqual(getSceneLayout("muji-room", "landscape").interactions, roomInteractions);

  assert.deepEqual(getSceneLayout("labis", "landscape").spawn, labisSpawn);
  assert.deepEqual(getSceneLayout("labis", "landscape").obstacles, labisBlockers);
  assert.deepEqual(getSceneLayout("labis", "landscape").triggers, labisMemoryTriggers);
  assert.deepEqual(getSceneLayout("labis", "landscape").interactions[0], {
    id: "diary-memory",
    label: "diary memory",
    x: labisDiaryMemorySpot.x,
    y: labisDiaryMemorySpot.y,
    radius: labisDiaryMemorySpot.radius
  });

  assert.deepEqual(
    getSceneLayout("forest", "landscape").placementSlots.map((item) => ({ kind: item.kind, x: item.x, y: item.y })),
    forestDoors.map((door) => ({ kind: "chapter", x: door.x, y: door.y }))
  );
  assert.deepEqual(getSceneLayout("forest", "landscape").interactions, []);
});

test("625 preserves authored geometry while exporting the nine intended landscape Echo radii", () => {
  const landscape = JSON.parse(readFileSync(join("public", "scene-layouts", "625", "landscape.json"), "utf8")) as SceneLayout;
  assert.deepEqual(landscape.spawn, { x: 1446.28, y: 701.045 });
  assert.deepEqual(landscape.interactions.map(({ id, x, y, radius }) => ({ id, x, y, radius })), [
    { id: "milk-residue", x: 1414.512, y: 315.235, radius: 58 },
    { id: "door-arrival", x: 1297.472, y: 366.99, radius: 66 },
    { id: "desk-memory", x: 944.68, y: 334.055, radius: 58 },
    { id: "cards-memory", x: 916.2560000000001, y: 418.745, radius: 46 },
    { id: "wardrobe-memory", x: 317.68, y: 663.405, radius: 68 },
    { id: "hairdryer-memory", x: 1148.664, y: 512.845, radius: 48 },
    { id: "bed-main-memory", x: 593.56, y: 319.94, radius: 48 },
    { id: "bed-night-memory", x: 610.28, y: 442.27, radius: 44 },
    { id: "bed-foot-morning-memory", x: 627, y: 550.485, radius: 42 },
    { id: "laundry-left-memory", x: 1128.6000000000001, y: 795.145, radius: 58 },
    { id: "exit", x: 739.1551278557871, y: 836.478590224078, radius: 70 },
    { id: "diary", x: 1438.0000758376432, y: 818.0000628553477, radius: 56 }
  ]);
  assert.deepEqual(Object.fromEntries(Object.entries(landscape.echoAnchors).map(([id, point]) => [id, point.radius])), {
    "milk-residue": 58,
    "door-arrival": 66,
    "desk-memory": 58,
    "cards-memory": 46,
    "wardrobe-memory": 68,
    "hairdryer-memory": 48,
    "bed-night-memory": 44,
    "bed-foot-morning-memory": 42,
    "laundry-left-memory": 58
  });

  const portrait = JSON.parse(readFileSync(join("public", "scene-layouts", "625", "portrait.json"), "utf8")) as SceneLayout;
  assert.deepEqual(portrait.spawn, { x: 562.4999709742476, y: 1014.0000337664598 });
  assert.equal(portrait.interactions.find((item) => item.id === "bed-night-memory")?.radius, 56);
  assert.equal(portrait.echoAnchors["bed-night-memory"]?.radius, 56);
});

test("orientation selection resolves portrait only for portrait viewports", () => {
  assert.equal(selectSceneOrientation({ width: 390, height: 844 }), "portrait");
  assert.equal(selectSceneOrientation({ width: 844, height: 390 }), "landscape");
  assert.equal(selectSceneOrientation({ width: 960, height: 960 }), "landscape");
});

test("Forest placement slots persist by type without duplicating content", () => {
  const landscapeBefore = cloneSceneLayout(getSceneLayout("forest", "landscape"));
  const portraitBefore = cloneSceneLayout(getSceneLayout("forest", "portrait"));
  const portrait = cloneSceneLayout(portraitBefore);
  portrait.placementSlots = [
    { id: "chapter-slot-01", kind: "chapter", x: 120, y: 220, radius: 80 },
    { id: "fragment-slot-01", kind: "fragment", x: 320, y: 420, radius: 52 }
  ];
  try {
    setSceneLayout(portrait);
    assert.deepEqual(getSceneLayout("forest", "portrait").placementSlots, portrait.placementSlots);
    assert.deepEqual(getSceneLayout("forest", "landscape"), landscapeBefore);
    assert.equal(JSON.stringify(getSceneLayout("forest", "portrait")).includes("memoryText"), false);
  } finally {
    setSceneLayout(landscapeBefore);
    setSceneLayout(portraitBefore);
  }
});

test("Forest dynamic memories resolve to stable orientation-aware slots", () => {
  const layout = {
    ...cloneSceneLayout(getSceneLayout("forest", "portrait")),
    placementSlots: [
      { id: "chapter-slot-01", kind: "chapter" as const, x: 101, y: 201, radius: 70 },
      { id: "chapter-slot-02", kind: "chapter" as const, x: 301, y: 401, radius: 70 },
      { id: "fragment-slot-01", kind: "fragment" as const, x: 501, y: 601, radius: 42 }
    ],
    interactions: [{ id: "room-entry", label: "Muji Room", x: 301, y: 401, radius: 70 }]
  };
  const nodes = [
    { id: "new-chapter", date: "2026-07-12", title: "New Chapter", x: 1, y: 1, chapterId: "new-chapter" },
    { id: "new-fragment", kind: "fragment" as const, date: "2026-07-13", title: "New Fragment", x: 2, y: 2, excerpt: "private", userEntryId: "new-fragment" }
  ];

  const first = resolveForestDynamicPlacements(nodes, layout, "2026-07");
  const second = resolveForestDynamicPlacements(nodes, layout, "2026-07");

  assert.deepEqual(second, first);
  assert.deepEqual(first.find((node) => node.id === "new-chapter"), {
    ...nodes[0],
    x: 101,
    y: 201,
    radius: 70,
    placementSlotId: "chapter-slot-01"
  });
  assert.deepEqual(first.find((node) => node.id === "new-fragment"), {
    ...nodes[1],
    x: 501,
    y: 601,
    radius: 42,
    placementSlotId: "fragment-slot-01"
  });
});

test("Forest deterministic overflow does not hide extra dynamic memories", () => {
  const layout = {
    ...cloneSceneLayout(getSceneLayout("forest", "portrait")),
    placementSlots: [{ id: "fragment-slot-01", kind: "fragment" as const, x: 150, y: 250, radius: 45 }]
  };
  const nodes = [
    { id: "fragment-a", kind: "fragment" as const, date: "2026-07-13", title: "A", x: 1, y: 1, excerpt: "a", userEntryId: "fragment-a" },
    { id: "fragment-b", kind: "fragment" as const, date: "2026-07-14", title: "B", x: 2, y: 2, excerpt: "b", userEntryId: "fragment-b" }
  ];

  const placed = resolveForestDynamicPlacements(nodes, layout, "2026-07");

  assert.equal(placed.length, 2);
  assert.equal(placed[0].placementSlotId, "fragment-slot-01");
  assert.equal(placed[1].placementSlotId?.startsWith("overflow-fragment-"), true);
  assert.deepEqual(resolveForestDynamicPlacements(nodes, layout, "2026-07"), placed);
});

test("Labis echo anchors persist as spatial overrides without duplicating echo content", () => {
  const landscapeBefore = cloneSceneLayout(getSceneLayout("labis", "landscape"));
  const portraitBefore = cloneSceneLayout(getSceneLayout("labis", "portrait"));
  const portrait = cloneSceneLayout(portraitBefore);
  portrait.echoAnchors = {
    "july19-badminton": { x: 222, y: 333, radius: 99 }
  };
  try {
    setSceneLayout(portrait);
    assert.deepEqual(getSceneLayout("labis", "portrait").echoAnchors, portrait.echoAnchors);
    assert.deepEqual(getSceneLayout("labis", "landscape"), landscapeBefore);
    assert.equal(JSON.stringify(getSceneLayout("labis", "portrait")).includes("presentation"), false);
    assert.equal(JSON.stringify(getSceneLayout("labis", "portrait")).includes("requires"), false);
  } finally {
    setSceneLayout(landscapeBefore);
    setSceneLayout(portraitBefore);
  }
});
