import assert from "node:assert/strict";
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
