import assert from "node:assert/strict";
import test from "node:test";
import { createReflectionNote, createReflectionWallState, moveReflectionNote, reflectionPaperStyles, rotateReflectionNote } from "../src/systems/ReflectionWall.js";
import { reflectionDragIntent, reflectionWallPositionStyle } from "../src/systems/ReflectionWallExperienceBridge.js";

const now = new Date("2026-08-31T00:00:00.000Z");

test("reflection wall exposes a varied paper collection without external image assets", () => {
  assert.equal(reflectionPaperStyles.length >= 16, true);
  assert.equal(new Set(reflectionPaperStyles.map((style) => style.id)).size, reflectionPaperStyles.length);
  assert.equal(reflectionPaperStyles.some((style) => style.id === "receipt-slip"), true);
  assert.equal(reflectionPaperStyles.some((style) => style.id === "pressed-leaf"), true);
  assert.equal(reflectionPaperStyles.some((style) => style.id === "night-card"), true);
});

test("moving a note clamps normalized coordinates and brings the touched note to the front of manual order", () => {
  let state = createReflectionNote(createReflectionWallState(), "first", { now, position: { x: 20, y: 20 } });
  state = createReflectionNote(state, "second", { now: new Date("2026-08-31T00:01:00.000Z"), position: { x: 60, y: 60 } });
  const firstId = state.notes[0].id;
  const moved = moveReflectionNote(state, firstId, { x: -20, y: 140 }, new Date("2026-08-31T00:02:00.000Z"));

  assert.equal(moved.notes.at(-1)?.id, firstId);
  assert.equal(moved.notes.at(-1)?.x, 4);
  assert.equal(moved.notes.at(-1)?.y, 96);
  assert.equal(moved.notes.at(-1)?.updatedAt, "2026-08-31T00:02:00.000Z");
});

test("rotating a note is restrained to the tactile paper range", () => {
  const state = createReflectionNote(createReflectionWallState(), "paper", { now, rotation: 4.5 });
  const id = state.notes[0].id;
  const right = rotateReflectionNote(state, id, 3, new Date("2026-08-31T00:03:00.000Z"));
  const left = rotateReflectionNote(right, id, -20, new Date("2026-08-31T00:04:00.000Z"));

  assert.equal(right.notes[0].rotation, 5);
  assert.equal(left.notes[0].rotation, -5);
});

test("drag intent keeps taps separate from arrange gestures", () => {
  assert.equal(reflectionDragIntent(0), false);
  assert.equal(reflectionDragIntent(5.99), false);
  assert.equal(reflectionDragIntent(6), true);
  assert.equal(reflectionDragIntent(12), true);
});

test("wall position style uses persisted normalized coordinates and rotation", () => {
  assert.equal(
    reflectionWallPositionStyle({ x: 42.5, y: 63, rotation: -1.7 }, 123),
    "left:42.5%;top:63%;transform:translate(-50%, -50%) rotate(-1.7deg);z-index:123;"
  );
});
