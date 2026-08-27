import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";
import {
  MUJI_DIRECTIONS,
  MUJI_IDLE_FRAME_MS,
  MUJI_WALK_FRAME_MS,
  MUJI_FRAME_REGISTRY,
  getMujiDrawPlacement,
  getMujiFrame,
  type MujiAnimation
} from "../src/systems/MujiSprite.js";

const expectedStates: Array<[MujiAnimation, (typeof MUJI_DIRECTIONS)[number], number, number]> = [
  ["idle", "down", 1, 6],
  ["idle", "left", 7, 12],
  ["idle", "right", 13, 18],
  ["idle", "up", 19, 24],
  ["walk", "down", 25, 30],
  ["walk", "left", 31, 36],
  ["walk", "right", 37, 42],
  ["walk", "up", 43, 48]
];

test("Muji V2 supplies exactly 48 transparent frame files with metadata", () => {
  const metadata = JSON.parse(readFileSync("public/assets/muji-sheet-v2/crop-metadata.json", "utf8")) as {
    sourceSize: [number, number];
    crops: Array<{ file: string; x: number; y: number; w: number; h: number }>;
  };

  assert.deepEqual(metadata.sourceSize, [960, 1536]);
  assert.equal(MUJI_FRAME_REGISTRY.length, 48);
  assert.equal(metadata.crops.length, 48);
  for (const [index, frame] of MUJI_FRAME_REGISTRY.entries()) {
    const crop = metadata.crops[index];
    assert.equal(existsSync(`public/${frame.path}`), true, frame.path);
    assert.equal(crop.file, `${frame.id}.png`);
    assert.deepEqual(frame.cropOrigin, { x: crop.x, y: crop.y });
    assert.deepEqual(frame.sourceSize, { width: crop.w, height: crop.h });
  }
});

test("Muji V2 semantic mapping has exactly six frames per confirmed state", () => {
  for (const [animation, direction, first, last] of expectedStates) {
    const frames = MUJI_FRAME_REGISTRY.filter((frame) => frame.animation === animation && frame.direction === direction);
    assert.equal(frames.length, 6);
    assert.deepEqual(frames.map((frame) => Number(frame.id.slice(-2))), Array.from({ length: 6 }, (_, index) => first + index));
    assert.equal(Number(frames.at(-1)?.id.slice(-2)), last);
  }
  assert.notEqual(MUJI_FRAME_REGISTRY.find((frame) => frame.id === "muji-07")?.path, MUJI_FRAME_REGISTRY.find((frame) => frame.id === "muji-13")?.path);
});

test("Muji idle and walk animation select all six frames without changing direction", () => {
  for (const direction of MUJI_DIRECTIONS) {
    const idleFrames = Array.from({ length: 6 }, (_, frame) => getMujiFrame(direction, "idle", frame * MUJI_IDLE_FRAME_MS));
    const walkFrames = Array.from({ length: 6 }, (_, frame) => getMujiFrame(direction, "walk", frame * MUJI_WALK_FRAME_MS));
    assert.deepEqual(idleFrames.map((frame) => frame.id), MUJI_FRAME_REGISTRY.filter((frame) => frame.animation === "idle" && frame.direction === direction).map((frame) => frame.id));
    assert.deepEqual(walkFrames.map((frame) => frame.id), MUJI_FRAME_REGISTRY.filter((frame) => frame.animation === "walk" && frame.direction === direction).map((frame) => frame.id));
    assert.ok(idleFrames.every((frame) => frame.direction === direction));
    assert.ok(walkFrames.every((frame) => frame.direction === direction));
  }
});

test("Muji stopping transitions walk to the matching idle direction", () => {
  for (const direction of MUJI_DIRECTIONS) {
    const walking = getMujiFrame(direction, "walk", MUJI_WALK_FRAME_MS * 3);
    const stopped = getMujiFrame(direction, "idle", MUJI_IDLE_FRAME_MS * 3);
    assert.equal(walking.direction, direction);
    assert.equal(stopped.direction, direction);
    assert.equal(stopped.animation, "idle");
  }
});

test("Muji cropped frames reconstruct one stable feet anchor without changing world position", () => {
  const worldPosition = { x: 480, y: 312 };
  const placements = MUJI_FRAME_REGISTRY.map((frame) => getMujiDrawPlacement(frame, frame.sourceSize.width, frame.sourceSize.height, worldPosition, 0.3));
  for (const placement of placements) {
    assert.ok(Math.abs(placement.anchorWorldX - worldPosition.x) < 0.000001);
    assert.ok(Math.abs(placement.anchorWorldY - worldPosition.y) < 0.000001);
  }
  const narrow = placements.find((placement) => placement.id === "muji-12")!;
  const regular = placements.find((placement) => placement.id === "muji-11")!;
  assert.notEqual(narrow.width, regular.width);
  assert.equal(worldPosition.x, 480);
  assert.equal(worldPosition.y, 312);
});
