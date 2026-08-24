import assert from "node:assert/strict";
import test from "node:test";
import { createTrimTimeline, formatTimelineTime, panTimeline, parseTimelineTime, reduceAudioPeaks, setPlayhead, setTrimBoundary, timeAtPixel, timelineKeyboardStep, zoomTimeline } from "../src/systems/WaveformModel.js";

test("timeline uses exact milliseconds and stable formatting", () => {
  assert.equal(parseTimelineTime("01:01.234"), 61234);
  assert.equal(parseTimelineTime("1.005"), 1005);
  assert.equal(formatTimelineTime(61234), "01:01.234");
  const state = createTrimTimeline(10000);
  assert.deepEqual(setTrimBoundary(state, "start", 1200), { ...state, startMs: 1200, playheadMs: 1200 });
  assert.throws(() => setTrimBoundary(state, "end", 0), /after start/);
  assert.equal(setPlayhead(state, 99999).playheadMs, 10000);
});

test("zoom anchors the playhead and pan remains bounded", () => {
  const state = { ...createTrimTimeline(100000), playheadMs: 50000 };
  const zoomed = zoomTimeline(state, 4);
  assert.equal(zoomed.zoom, 4);
  assert.equal(panTimeline(zoomed, -999999).viewportStartMs, 0);
  assert.equal(panTimeline(zoomed, 999999).viewportStartMs, 75000);
  assert.equal(timeAtPixel(zoomed, 1000, 1000), zoomed.viewportStartMs + 25000);
});

test("peak reduction combines channels deterministically", () => {
  assert.deepEqual(reduceAudioPeaks([Float32Array.from([-1, -.5, .5, 1]), Float32Array.from([-.5, 0, .5, .5])], 2), [
    { min: -.75, max: -.25 }, { min: .5, max: .75 }
  ]);
});

test("keyboard precision follows modifier increments", () => {
  assert.equal(timelineKeyboardStep({ shiftKey: false, ctrlKey: false, metaKey: false }), 1);
  assert.equal(timelineKeyboardStep({ shiftKey: true, ctrlKey: false, metaKey: false }), 10);
  assert.equal(timelineKeyboardStep({ shiftKey: false, ctrlKey: true, metaKey: false }), 100);
});
