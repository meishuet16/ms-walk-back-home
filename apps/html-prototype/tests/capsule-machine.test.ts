import test from "node:test";
import assert from "node:assert/strict";
import {
  CAPSULE_STORAGE_KEY,
  addCapsuleThought,
  capsulePreviewText,
  createCapsuleMachineState,
  drawCapsuleThought,
  keptCapsules,
  loadCapsuleMachineState,
  machineCapsules,
  removeCapsuleThought,
  saveCapsuleMachineState,
  setCapsuleStatus
} from "../src/systems/CapsuleMachine.js";

test("capsules are local thoughts that remain hidden in the machine pool", () => {
  const now = new Date("2026-08-31T08:00:00.000Z");
  let state = createCapsuleMachineState(now);
  state = addCapsuleThought(state, "first thought", now, "a");
  state = addCapsuleThought(state, "second thought", now, "b");
  assert.equal(machineCapsules(state).length, 2);
  assert.equal(keptCapsules(state).length, 0);
});

test("draw records rediscovery without removing the thought from the pool", () => {
  const now = new Date("2026-08-31T08:00:00.000Z");
  let state = addCapsuleThought(createCapsuleMachineState(now), "hello again", now, "capsule-a");
  const drawn = drawCapsuleThought(state, () => 0, new Date("2026-09-01T08:00:00.000Z"));
  assert.ok(drawn);
  assert.equal(drawn.thought.id, "capsule-a");
  assert.equal(drawn.thought.drawCount, 1);
  assert.equal(machineCapsules(drawn.state).length, 1);
});

test("keeping a capsule removes it from random draws until it is returned", () => {
  const now = new Date("2026-08-31T08:00:00.000Z");
  let state = addCapsuleThought(createCapsuleMachineState(now), "keep me", now, "capsule-a");
  state = setCapsuleStatus(state, "capsule-a", "kept", now);
  assert.equal(machineCapsules(state).length, 0);
  assert.equal(keptCapsules(state).length, 1);
  assert.equal(drawCapsuleThought(state, () => 0, now), null);
  state = setCapsuleStatus(state, "capsule-a", "machine", now);
  assert.equal(machineCapsules(state).length, 1);
});

test("removing a kept capsule permanently removes it from both collections", () => {
  const now = new Date("2026-08-31T08:00:00.000Z");
  let state = addCapsuleThought(createCapsuleMachineState(now), "delete me", now, "capsule-a");
  state = setCapsuleStatus(state, "capsule-a", "kept", now);
  state = removeCapsuleThought(state, "capsule-a", new Date("2026-08-31T09:00:00.000Z"));
  assert.equal(state.thoughts.length, 0);
  assert.equal(keptCapsules(state).length, 0);
  assert.equal(machineCapsules(state).length, 0);
});

test("capsule state persists through the local storage adapter", () => {
  const memory = new Map<string, string>();
  const storage = {
    getItem: (key: string) => memory.get(key) ?? null,
    setItem: (key: string, value: string) => { memory.set(key, value); }
  };
  const now = new Date("2026-08-31T08:00:00.000Z");
  const state = addCapsuleThought(createCapsuleMachineState(now), "stored locally", now, "capsule-a");
  saveCapsuleMachineState(storage, state);
  assert.ok(memory.has(CAPSULE_STORAGE_KEY));
  assert.equal(loadCapsuleMachineState(storage, now).thoughts[0]?.text, "stored locally");
});

test("capsule thoughts no longer truncate at 200 characters", () => {
  const now = new Date("2026-08-31T08:00:00.000Z");
  const longThought = "很长的一段想法。".repeat(120);
  const state = addCapsuleThought(createCapsuleMachineState(now), longThought, now, "long");
  assert.equal(state.thoughts[0]?.text, longThought);
  assert.ok((state.thoughts[0]?.text.length ?? 0) > 200);
});

test("kept previews are shortened without changing the saved full content", () => {
  const now = new Date("2026-08-31T08:00:00.000Z");
  const full = "Sometimes a kept capsule can be very long, but the drawer should only show a gentle preview until the user opens it.";
  const thought = addCapsuleThought(createCapsuleMachineState(now), full, now, "preview").thoughts[0]!;
  const preview = capsulePreviewText(thought, 42);
  assert.ok(preview.endsWith("…"));
  assert.ok(preview.length <= 42);
  assert.equal(thought.text, full);
});

test("capsules may contain media without text and preserve media metadata", () => {
  const now = new Date("2026-08-31T08:00:00.000Z");
  const state = addCapsuleThought(createCapsuleMachineState(now), "", now, "media-only", [{
    id: "media-1",
    kind: "image",
    name: "sunset.jpg",
    mimeType: "image/jpeg",
    size: 1234
  }]);
  assert.equal(state.thoughts.length, 1);
  assert.equal(state.thoughts[0]?.text, "");
  assert.equal(state.thoughts[0]?.attachments?.[0]?.name, "sunset.jpg");
  assert.equal(capsulePreviewText(state.thoughts[0]!), "Media capsule");
});
