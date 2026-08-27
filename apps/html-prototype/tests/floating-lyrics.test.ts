import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  FLOATING_LYRICS_EDGE_MARGIN,
  clampFloatingLyricsOverlay,
  floatingLyricsPresentationMode,
  isFloatingLyricsDrag,
  resizeFloatingLyricsOverlay
} from "../src/systems/FloatingLyrics.js";

test("Floating Lyrics clamps CSS-stage coordinates without canvas scaling", () => {
  const overlay = clampFloatingLyricsOverlay({ x: 600, y: 400, width: 220, height: 120 }, 700, 440);

  assert.equal(overlay.x, 700 - 220 - FLOATING_LYRICS_EDGE_MARGIN);
  assert.equal(overlay.y, 440 - 120 - FLOATING_LYRICS_EDGE_MARGIN);
});

test("Floating Lyrics keeps drag movement in CSS pixels", () => {
  const start = { x: 80, y: 90 };
  const next = clampFloatingLyricsOverlay({ x: start.x + 37, y: start.y + 24, width: 180, height: 96 }, 500, 360);

  assert.deepEqual({ x: next.x, y: next.y }, { x: 117, y: 114 });
});

test("Floating Lyrics free resize changes width independently", () => {
  const resized = resizeFloatingLyricsOverlay({ x: 20, y: 30, width: 180, height: 100 }, 48, 0, 640, 480);

  assert.equal(resized.width, 228);
  assert.equal(resized.height, 100);
});

test("Floating Lyrics free resize changes height independently", () => {
  const resized = resizeFloatingLyricsOverlay({ x: 20, y: 30, width: 180, height: 100 }, 0, 42, 640, 480);

  assert.equal(resized.width, 180);
  assert.equal(resized.height, 142);
});

test("Floating Lyrics resize respects minimum and maximum dimensions", () => {
  assert.equal(resizeFloatingLyricsOverlay({ x: 0, y: 0, width: 180, height: 100 }, -500, -500, 640, 480).width, 96);
  assert.equal(resizeFloatingLyricsOverlay({ x: 0, y: 0, width: 180, height: 100 }, 500, 500, 640, 480).width, 520);
  assert.equal(resizeFloatingLyricsOverlay({ x: 0, y: 0, width: 180, height: 100 }, 500, 500, 640, 480).height, 260);
});

test("Floating Lyrics selects presentation density from actual CSS size", () => {
  assert.equal(floatingLyricsPresentationMode(280, 140), "large");
  assert.equal(floatingLyricsPresentationMode(180, 92), "compact");
  assert.equal(floatingLyricsPresentationMode(120, 60), "mini");
});

test("Floating Lyrics distinguishes a tap from a drag with a small movement threshold", () => {
  assert.equal(isFloatingLyricsDrag(100, 100, 104, 103), false);
  assert.equal(isFloatingLyricsDrag(100, 100, 108, 100), true);
});

test("Floating Lyrics integration uses stage CSS bounds and free resize", () => {
  const source = readFileSync("src/app.ts", "utf8");
  assert.match(source, /clampLyricsOverlay\([\s\S]*stageRect\.width[\s\S]*stageRect\.height/);
  assert.doesNotMatch(source, /const scaleX = this\.canvas\.width \/ stageRect\.width/);
  assert.doesNotMatch(source, /const scaleY = this\.canvas\.height \/ stageRect\.height/);
  assert.doesNotMatch(source, /const delta = \(deltaX \+ deltaY\) \/ 2/);
  assert.match(source, /floatingLyricsPresentationMode/);
  assert.match(source, /floatingLyricsGestureSuppressed/);
});
