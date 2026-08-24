import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";
import { waveformPeaksInView } from "../src/systems/MediaWaveform.js";
import { createTrimTimeline } from "../src/systems/WaveformModel.js";

test("waveform viewport selects only visible peaks", () => {
  const peaks = Array.from({ length: 100 }, (_, index) => ({ min: -index / 100, max: index / 100 }));
  const visible = waveformPeaksInView(peaks, { ...createTrimTimeline(100000), zoom: 4, viewportStartMs: 25000 });
  assert.equal(visible.length, 25);
  assert.deepEqual(visible[0], peaks[25]);
  assert.deepEqual(visible.at(-1), peaks[49]);
});

test("waveform decoding closes its audio context when cancelled", () => {
  const source = readFileSync(resolve(process.cwd(), "src/systems/MediaWaveform.ts"), "utf8");
  assert.match(source, /signal\?\.addEventListener\("abort"/);
  assert.match(source, /context\.close\(\)/);
});
