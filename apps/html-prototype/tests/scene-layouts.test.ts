import assert from "node:assert/strict";
import { test } from "node:test";
import { forestDoors } from "../src/fixtures/chapterPlan.js";
import { labisBlockers, labisDiaryMemorySpot, labisMemoryTriggers, labisSpawn } from "../src/fixtures/labisMotorMemory.js";
import { roomInteractions, roomObstacles, roomSpawn } from "../src/systems/MujiRoom.js";
import {
  getSceneLayout,
  sceneLayoutManifest,
  scenePortraitAssetPaths,
  selectSceneOrientation
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
    getSceneLayout("forest", "landscape").interactions.map((item) => ({ id: item.id, x: item.x, y: item.y })),
    forestDoors.map((door) => ({ id: door.id, x: door.x, y: door.y }))
  );
});

test("orientation selection resolves portrait only for portrait viewports", () => {
  assert.equal(selectSceneOrientation({ width: 390, height: 844 }), "portrait");
  assert.equal(selectSceneOrientation({ width: 844, height: 390 }), "landscape");
  assert.equal(selectSceneOrientation({ width: 960, height: 960 }), "landscape");
});
