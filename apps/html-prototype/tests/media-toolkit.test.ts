import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { normalizeTrimRange, mediaOutputFilename, createMediaProcessingState, cancelMediaProcessing, mediaCommandArgs } from "../src/systems/MediaToolkit.js";

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
test("FFmpeg trim commands preserve millisecond precision", () => {
  assert.deepEqual(mediaCommandArgs("clip.mp3", "output.wav", "trim-audio", "wav", { start: 1.234, end: 9.876 }), [
    "-ss", "1.234", "-t", "8.642", "-i", "clip.mp3", "-vn", "-acodec", "pcm_s16le", "output.wav"
  ]);
});

test("every media export operation honors the selected range", () => {
  const range = { start: 2.125, end: 5.75 };
  for (const operation of ["extract-audio", "convert-audio", "trim-audio", "trim-video"] as const) {
    const extension = operation === "trim-video" ? "webm" : "mp3";
    const args = mediaCommandArgs("clip.webm", "output." + extension, operation, extension, range);
    assert.deepEqual(args.slice(0, 4), ["-ss", "2.125", "-t", "3.625"]);
  }
});

test("media processing bounds the input write and avoids awaited cleanup", () => {
  const source = readFileSync(resolve(process.cwd(), "src/systems/MediaToolkit.ts"), "utf8");
  assert.match(source, /label: "Writing media"/);
  assert.doesNotMatch(source, /await ffmpeg\.deleteFile/);
});
