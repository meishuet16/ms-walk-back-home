import assert from "node:assert/strict";
import test from "node:test";
import { MUJI_THOUGHT_POOLS, selectMujiThought } from "../src/systems/room-life/MujiThoughts.js";

test("Muji thought pools keep the requested short contextual copy", () => {
  assert.ok(MUJI_THOUGHT_POOLS.ambient.includes("房间今天很安静。"));
  assert.ok(MUJI_THOUGHT_POOLS.wander.includes("慢慢走。"));
  assert.ok(MUJI_THOUGHT_POOLS.window.includes("外面好安静。"));
  assert.ok(MUJI_THOUGHT_POOLS.rain.includes("雨还在下。"));
  assert.ok(MUJI_THOUGHT_POOLS.records.includes("再听一下。"));
  assert.ok(MUJI_THOUGHT_POOLS.bedside.includes("有点晚了。"));
});

test("thought selection is deterministic with an injected random source", () => {
  assert.equal(selectMujiThought("ambient", () => 0), MUJI_THOUGHT_POOLS.ambient[0]);
  assert.equal(selectMujiThought("window", () => 0.999999), MUJI_THOUGHT_POOLS.window.at(-1));
});

test("thought selection never invents rain context in the ambient pool", () => {
  assert.equal(MUJI_THOUGHT_POOLS.ambient.some((line) => line.includes("雨")), false);
});
