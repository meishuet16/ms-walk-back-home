import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  buildLyricsViewerLines,
  createLyricsViewerState,
  markLyricsManuallyScrolled,
  returnToCurrentLyric,
  seekTargetForLyricLine
} from "../src/systems/LyricsViewer.js";
import type { SyncedLyricLine } from "../src/types.js";

const lines: SyncedLyricLine[] = [
  { time: 2, text: "First" },
  { time: 8, text: "Second" },
  { time: 14, text: "Third" }
];

test("full lyrics model keeps every synced line and resolves the active line", () => {
  const state = createLyricsViewerState(lines, 8.5);
  const rendered = buildLyricsViewerLines(lines, state.activeIndex);

  assert.equal(rendered.length, 3);
  assert.equal(state.activeIndex, 1);
  assert.equal(rendered[1].state, "active");
});

test("manual lyric scrolling suspends automatic following without a seek target", () => {
  const state = markLyricsManuallyScrolled(createLyricsViewerState(lines, 8));

  assert.equal(state.followEnabled, false);
  assert.equal(state.showReturnControl, true);
});

test("Return to current lyric resumes following without changing playback time", () => {
  const state = returnToCurrentLyric(markLyricsManuallyScrolled(createLyricsViewerState(lines, 8)), lines, 8.5);

  assert.equal(state.followEnabled, true);
  assert.equal(state.showReturnControl, false);
  assert.equal(state.activeIndex, 1);
  assert.equal(state.seekTo, null);
});

test("tapping a lyric line returns its exact timestamp and resumes following", () => {
  const result = seekTargetForLyricLine(lines, 2);

  assert.deepEqual(result, { seekTo: 14, activeIndex: 2, followEnabled: true });
  assert.equal(seekTargetForLyricLine(lines, 99), null);
});

test("P1 integration keeps scroll browsing separate from seek and preserves one AudioManager", () => {
  const source = readFileSync("src/app.ts", "utf8");
  assert.match(source, /data-action="open-full-lyrics"/);
  assert.match(source, /full-lyrics-scroll/);
  assert.match(source, /full-lyrics-return/);
  assert.match(source, /seekPersonalMusic\(target\.seekTo\)/);
  assert.match(source, /this\.audio/);
  const scrollHandler = source.slice(source.indexOf("private handleFullLyricsScroll"), source.indexOf("private handleFullLyricsUserInput"));
  assert.doesNotMatch(scrollHandler, /seek|audio/);
  assert.match(source, /private closeFullLyrics\(\)/);
  assert.match(source, /No synced lyrics/);
});

test("async lyric loading refreshes an open Full Lyrics view without resetting browse state", () => {
  const source = readFileSync("src/app.ts", "utf8");
  assert.match(source, /private refreshRecordsLyricsUI\(currentTime: number\)[\s\S]*if \(this\.fullLyricsOpen\) \{[\s\S]*this\.refreshFullLyricsUI\(currentTime\)/);
  assert.equal(markLyricsManuallyScrolled(createLyricsViewerState(lines, 8)).followEnabled, false);
  assert.match(source, /refreshFullLyricsUI\(currentTime\)/);
});

test("Full Lyrics only suspends follow for explicit user scroll input", () => {
  const source = readFileSync("src/app.ts", "utf8");
  assert.match(source, /private handleFullLyricsUserInput\(/);
  assert.match(source, /addEventListener\("wheel",/);
  const scrollHandler = source.slice(source.indexOf("private handleFullLyricsScroll"), source.indexOf("private handleFullLyricsUserInput"));
  assert.doesNotMatch(scrollHandler, /fullLyricsAutoScrolling|markLyricsManuallyScrolled/);
  assert.match(source, /handleFullLyricsUserInput/);
});

test("Full Lyrics is an immersive Records view with readable lyrics and a bottom player dock", () => {
  const source = readFileSync("src/app.ts", "utf8");
  const styles = readFileSync("src/styles.css", "utf8");
  const render = source.slice(source.indexOf("private renderFullLyrics"), source.indexOf("private handleFullLyricsScroll"));

  assert.match(render, /full-lyrics-track/);
  assert.match(render, /track\?\.artist/);
  assert.match(render, /full-lyrics-player/);
  assert.match(render, /data-music-seek/);
  assert.match(render, /data-action="music-prev"[\s\S]*data-action="vinyl-pause"[\s\S]*data-action="music-next"/);
  assert.match(render, /buildLyricsViewerLines\(lines, state\.activeIndex\)/);
  assert.doesNotMatch(render, /notebook|ruled|lyric-card/);
  assert.match(styles, /\.full-lyrics-panel\s*\{[\s\S]*grid-template-rows:\s*auto minmax\(0, 1fr\) auto/);
  assert.doesNotMatch(styles, /\.full-lyrics-scroll\s*\{[\s\S]*padding:\s*34vh/);
  assert.match(styles, /\.full-lyrics-line\s*\{[\s\S]*color:\s*rgba\(245, 222, 184, \.6/);
});
