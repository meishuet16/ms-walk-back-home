import assert from "node:assert/strict";
import test from "node:test";
import { normalizeTrimRange, mediaOutputFilename, createMediaProcessingState, cancelMediaProcessing } from "../src/systems/MediaToolkit.js";

test("media trim ranges are clamped and validated", () => {
  assert.deepEqual(normalizeTrimRange(-2, 4, 10), { start: 0, end: 4 });
  assert.deepEqual(normalizeTrimRange(8, 4, 10), { start: 4, end: 8 });
  assert.throws(() => normalizeTrimRange(3, 3, 10));
  assert.throws(() => normalizeTrimRange(0, 11, 10));
});

test("media output names and cancellation are deterministic", () => {
  assert.equal(mediaOutputFilename("song.mp3", "trimmed", "wav"), "song-trimmed.wav");
  const state = createMediaProcessingState();
  assert.equal(cancelMediaProcessing(state).status, "cancelled");
});
