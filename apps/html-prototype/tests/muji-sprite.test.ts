import assert from "node:assert/strict";
import test from "node:test";
import {
  MUJI_ATLAS_COLUMNS,
  MUJI_ATLAS_ROWS,
  MUJI_DRAW_HEIGHT,
  MUJI_DRAW_OFFSET_X,
  MUJI_DRAW_OFFSET_Y,
  MUJI_DRAW_WIDTH,
  MUJI_IDLE_FRAME_MS,
  MUJI_WALK_FRAME_MS,
  getMujiAtlasMetadata,
  getMujiFrame
} from "../src/systems/MujiSprite.js";

test("Muji V2 atlas metadata uses exact six-by-eight integer cells", () => {
  assert.equal(MUJI_ATLAS_COLUMNS, 6);
  assert.equal(MUJI_ATLAS_ROWS, 8);
  assert.deepEqual(getMujiAtlasMetadata(960, 1536), {
    frameWidth: 160,
    frameHeight: 192
  });
  assert.throws(() => getMujiAtlasMetadata(1024, 1536), /divisible by 6x8/);
});

test("Muji idle and walk rows map all four directions across six frames", () => {
  const directions = ["down", "left", "right", "up"] as const;
  for (const [directionIndex, direction] of directions.entries()) {
    for (const moving of [false, true]) {
      const expectedRow = directionIndex + (moving ? 4 : 0);
      const frameDuration = moving ? MUJI_WALK_FRAME_MS : MUJI_IDLE_FRAME_MS;
      const frames = Array.from({ length: 6 }, (_, frame) => getMujiFrame(960, 1536, direction, moving, frame * frameDuration));

      assert.deepEqual(frames.map((item) => item.frame), [0, 1, 2, 3, 4, 5]);
      assert.deepEqual(frames.map((item) => item.row), Array(6).fill(expectedRow));
      assert.deepEqual(frames.map((item) => item.sourceX), [0, 160, 320, 480, 640, 800]);
      assert.deepEqual(frames.map((item) => item.sourceY), Array(6).fill(expectedRow * 192));
      assert.ok(frames.every((item) => item.frameWidth === 160 && item.frameHeight === 192));
    }
  }
});

test("Muji animation preserves the existing feet-center draw box and anchor offsets", () => {
  assert.equal(MUJI_DRAW_WIDTH, 48);
  assert.equal(MUJI_DRAW_HEIGHT, 56);
  assert.equal(MUJI_DRAW_OFFSET_X, -24);
  assert.equal(MUJI_DRAW_OFFSET_Y, -58);
});
