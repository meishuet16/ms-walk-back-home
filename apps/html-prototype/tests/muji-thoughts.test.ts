import assert from "node:assert/strict";
import test from "node:test";
import { MUJI_THOUGHT_POOLS, selectMujiThought, selectThoughtFromPool } from "../src/systems/room-life/MujiThoughts.js";

test("Muji thought pools keep the requested short contextual copy", () => {
  assert.ok(MUJI_THOUGHT_POOLS.ambient.includes("房间今天很安静。"));
  assert.ok(MUJI_THOUGHT_POOLS.wander.includes("慢慢走。"));
  assert.ok(MUJI_THOUGHT_POOLS.window.includes("外面好安静。"));
  assert.ok(MUJI_THOUGHT_POOLS.rain.includes("雨还在下。"));
  assert.ok(MUJI_THOUGHT_POOLS.records.includes("再听一下。"));
  assert.ok(MUJI_THOUGHT_POOLS.bedside.includes("有点晚了。"));
});

test("thought selection is deterministic with an injected random source", () => {
  assert.equal(selectMujiThought("ambient", () => 0.5), MUJI_THOUGHT_POOLS.ambient[8]);
  assert.equal(selectMujiThought("window", () => 0.999999), MUJI_THOUGHT_POOLS.window.at(-1));
});

test("thought selection never invents rain context in the ambient pool", () => {
  assert.equal(MUJI_THOUGHT_POOLS.ambient.some((line) => line.includes("雨")), false);
});

test("thought pools expand without changing the quiet contextual tone", () => {
  assert.ok(MUJI_THOUGHT_POOLS.ambient.length >= 12);
  assert.ok(MUJI_THOUGHT_POOLS.wander.length >= 8);
  assert.ok(MUJI_THOUGHT_POOLS.window.length >= 8);
  assert.ok(MUJI_THOUGHT_POOLS.records.length >= 8);
  assert.ok(MUJI_THOUGHT_POOLS.bedside.length >= 8);
});

test("recent thought history suppresses exact repeats and recent three when alternatives exist", () => {
  const pool = MUJI_THOUGHT_POOLS.ambient;
  const selected = selectThoughtFromPool(pool, () => 0, [pool[0], pool[1], pool[2]]);
  assert.notEqual(selected, pool[0]);
  assert.notEqual(selected, pool[1]);
  assert.notEqual(selected, pool[2]);
});

test("thought selection safely supports a one-item pool", () => {
  assert.equal(selectThoughtFromPool(["嗯。"], () => 0.5, ["嗯。"]), "嗯。");
});

test("silence is a valid thought-selection result", () => {
  assert.equal(selectMujiThought("ambient", () => 0.05), null);
});
