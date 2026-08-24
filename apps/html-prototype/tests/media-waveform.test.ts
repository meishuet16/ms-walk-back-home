import assert from "node:assert/strict";
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
