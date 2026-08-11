import assert from "node:assert/strict";
import test from "node:test";
import type { UserMusicTrack } from "../src/types.js";
import {
  activeLyricIndexAt,
  builtInRecordIds,
  clampLyricsOverlay,
  createDefaultPersonalPlayerState,
  filterAndSortMusic,
  isBuiltInTrackId,
  nextTrackIdForPlayback,
  normalizePlaybackMode,
  parseLrc,
  personalMusicShouldPlayInScene,
  personalMusicShouldResumeAfterScene
} from "../src/systems/PersonalMusic.js";

const tracks: UserMusicTrack[] = [
  { id: "user-2", title: "雨天", artist: "林小雨", audioBlobKey: "blob-2", addedAt: 30, lastPlayedAt: 40 },
  { id: "user-1", title: "Another Song", artist: "mei", audioBlobKey: "blob-1", addedAt: 20 },
  { id: "user-3", title: "beta", artist: "Alpha", audioBlobKey: "blob-3", addedAt: 10 }
];

test("personal music defaults preserve present-scene preferences without media data", () => {
  const state = createDefaultPersonalPlayerState();

  assert.equal(state.version, 1);
  assert.equal(state.visualMode, "vinyl");
  assert.equal(state.librarySort, "recently-added");
  assert.equal(state.lyricsVisible, true);
  assert.equal(state.playbackPosition, 0);
  assert.equal(state.shuffleEnabled, false);
  assert.equal(state.repeatOne, false);
});

test("music library search is case-insensitive and unicode-safe", () => {
  assert.deepEqual(filterAndSortMusic(tracks, "RAIN", "title").map((track) => track.id), []);
  assert.deepEqual(filterAndSortMusic(tracks, "雨", "title").map((track) => track.id), ["user-2"]);
  assert.deepEqual(filterAndSortMusic(tracks, "MEI", "title").map((track) => track.id), ["user-1"]);
});

test("music library sorting supports title artist and recently added", () => {
  assert.deepEqual(filterAndSortMusic(tracks, "", "title").map((track) => track.id), ["user-1", "user-3", "user-2"]);
  assert.deepEqual(filterAndSortMusic(tracks, "", "artist").map((track) => track.id), ["user-3", "user-1", "user-2"]);
  assert.deepEqual(filterAndSortMusic(tracks, "", "recently-added").map((track) => track.id), ["user-2", "user-1", "user-3"]);
  assert.deepEqual(filterAndSortMusic(tracks, "", "recently-played").map((track) => track.id), ["user-2", "user-1", "user-3"]);
});

test("built-in records cannot be deleted by imported music helpers", () => {
  assert.equal(builtInRecordIds.length >= 2, true);
  assert.equal(isBuiltInTrackId(builtInRecordIds[0]), true);
  assert.equal(isBuiltInTrackId("user-song"), false);
});

test("lrc parser supports common timestamp formats and Chinese text", () => {
  const lines = parseLrc([
    "[00:17.800]第二句歌词",
    "not a timestamp",
    "[00:12]第一句歌词",
    "[00:23.15]第三句歌词"
  ].join("\n"));

  assert.deepEqual(lines, [
    { time: 12, text: "第一句歌词" },
    { time: 17.8, text: "第二句歌词" },
    { time: 23.15, text: "第三句歌词" }
  ]);
});

test("active lyric follows seek time in both directions", () => {
  const lines = parseLrc("[00:01]one\n[00:05]two\n[00:09]three");

  assert.equal(activeLyricIndexAt(lines, 6), 1);
  assert.equal(activeLyricIndexAt(lines, 2), 0);
  assert.equal(activeLyricIndexAt(lines, 0), -1);
});

test("floating lyrics clamp within the stage", () => {
  assert.deepEqual(clampLyricsOverlay({ x: -50, y: 999, width: 900 }, 960, 540), { x: 0, y: 456, width: 360 });
});

test("personal music belongs to room and forest but yields to memory chapters", () => {
  assert.equal(personalMusicShouldPlayInScene("muji-room"), true);
  assert.equal(personalMusicShouldPlayInScene("forest"), true);
  assert.equal(personalMusicShouldPlayInScene("bakery"), false);
  assert.equal(personalMusicShouldPlayInScene("labis"), false);
  assert.equal(personalMusicShouldResumeAfterScene("bakery", "forest"), true);
  assert.equal(personalMusicShouldResumeAfterScene("labis", "muji-room"), true);
});

test("personal music playback modes resolve repeat next and shuffle", () => {
  const ids = ["a", "b", "c"];

  assert.equal(nextTrackIdForPlayback(ids, "b", { repeatOne: true }), "b");
  assert.equal(nextTrackIdForPlayback(ids, "b"), "c");
  assert.equal(nextTrackIdForPlayback(ids, "c"), "a");
  assert.equal(nextTrackIdForPlayback(ids, "b", { shuffleEnabled: true }, () => 0), "a");
  assert.equal(nextTrackIdForPlayback(ids, "b", { shuffleEnabled: true }, () => 0.99), "c");
  assert.equal(normalizePlaybackMode("shuffle"), "shuffle");
  assert.equal(normalizePlaybackMode("old-save"), "next");
});
