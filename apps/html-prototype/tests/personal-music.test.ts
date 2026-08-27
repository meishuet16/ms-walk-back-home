import assert from "node:assert/strict";
import test from "node:test";
import type { UserMusicTrack } from "../src/types.js";
import {
  adjacentTrackIdForControl,
  activeLyricIndexAt,
  builtInRecordIds,
  clampLyricsOverlay,
  createDefaultPersonalPlayerState,
  filterAndSortMusic,
  lyricWindowForTime,
  isBuiltInTrackId,
  nextTrackIdForPlayback,
  normalizePlaybackMode,
  parseLrc,
  personalMusicShouldPlayInScene,
  personalMusicShouldResumeAfterScene,
  selectAllMusicTrackIds,
  applyBatchMusicMetadata,
  removeSelectedMusicTracks,
  removeUserMusicTrack
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

test("mobile records lyric window exposes previous active and next lines", () => {
  const lines = parseLrc("[00:01]first\n[00:05]second\n[00:09]third\n[00:13]fourth");

  assert.deepEqual(lyricWindowForTime(lines, 9.5), [
    { line: { time: 5, text: "second" }, state: "previous", sourceIndex: 1 },
    { line: { time: 9, text: "third" }, state: "active", sourceIndex: 2 },
    { line: { time: 13, text: "fourth" }, state: "next", sourceIndex: 3 }
  ]);
  assert.deepEqual(lyricWindowForTime(lines, 0.2).map((item) => item.state), ["previous", "active", "next"]);
  assert.deepEqual(lyricWindowForTime([], 12), []);
});

test("those bygone years lrc excerpt aligns active lyric to playback time", () => {
  const lines = parseLrc([
    "[00:18.32]又回到最初的起点",
    "[00:21.33]记忆中你青涩的脸",
    "[00:24.50]我们终於来到了这一天",
    "[01:34.31]那些年错过的大雨",
    "[01:37.28]那些年错过的爱情",
    "[01:40.08]好想拥抱你 拥抱错过的勇气"
  ].join("\n"));

  assert.equal(lines.length, 6);
  assert.equal(lines[3].time, 94.31);
  assert.equal(lines[3].text, "那些年错过的大雨");
  assert.equal(activeLyricIndexAt(lines, 95), 3);
  assert.equal(lines[activeLyricIndexAt(lines, 140.1)].text, "好想拥抱你 拥抱错过的勇气");
});

test("floating lyrics clamp within the stage", () => {
  assert.deepEqual(clampLyricsOverlay({ x: -50, y: 999, width: 900, height: 180 }, 960, 540), { x: 8, y: 352, width: 520, height: 180 });
  assert.deepEqual(clampLyricsOverlay({ x: 900, y: 500, width: 40, height: 12 }, 960, 540), { x: 856, y: 488, width: 96, height: 44 });
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

test("manual player controls honor shuffle but can move past repeat-one", () => {
  const ids = ["a", "b", "c"];

  assert.equal(adjacentTrackIdForControl(ids, "b", 1, { repeatOne: true }), "c");
  assert.equal(adjacentTrackIdForControl(ids, "b", -1, { repeatOne: true }), "a");
  assert.equal(adjacentTrackIdForControl(ids, "b", 1, { shuffleEnabled: true }, () => 0), "a");
  assert.equal(adjacentTrackIdForControl(ids, "b", 1, { shuffleEnabled: true }, () => 0.99), "c");
});

test("removing a user track plans app-owned cleanup and next selection only", () => {
  const result = removeUserMusicTrack(
    {
      version: 1,
      savedAt: "2026-08-13T00:00:00.000Z",
      tracks: [
        { id: "user-1", title: "One", audioBlobKey: "music/audio/user-1", coverBlobKey: "music/cover/user-1", addedAt: 1 },
        { id: "user-2", title: "Two", audioBlobKey: "music/audio/user-2", addedAt: 2 }
      ]
    },
    "user-1",
    ["built-in-a"]
  );

  assert.equal(result.removed?.id, "user-1");
  assert.deepEqual(result.blobKeysToDelete, ["music/audio/user-1", "music/cover/user-1"]);
  assert.deepEqual(result.library.tracks.map((track) => track.id), ["user-2"]);
  assert.equal(result.nextTrackId, "user-2");
});

test("mixed Records deletion removes users and reports skipped built-ins", () => {
  const result = removeSelectedMusicTracks(
    {
      version: 1,
      savedAt: "2026-08-21T00:00:00.000Z",
      tracks: [
        { id: "user-a", title: "A", audioBlobKey: "audio-a", addedAt: 1 },
        { id: "user-b", title: "B", audioBlobKey: "audio-b", addedAt: 2 }
      ]
    },
    ["user-a", "built-in-a"],
    ["built-in-a"],
    new Date("2026-08-21T00:00:00.000Z")
  );

  assert.deepEqual(result.removed.map((track) => track.id), ["user-a"]);
  assert.equal(result.skippedBuiltInCount, 1);
  assert.deepEqual(result.library.tracks.map((track) => track.id), ["user-b"]);
});

test("batch metadata updates imported tracks and built-in local overrides", () => {
  const library = {
    version: 1 as const,
    savedAt: "now",
    tracks: [{ id: "user-a", title: "A", artist: "old", album: "old album", audioBlobKey: "a", addedAt: 1 }]
  };
  const result = applyBatchMusicMetadata(library, ["user-a", "built-in-a"], { artist: "new", album: "new album" }, {});

  assert.equal(result.library.tracks[0].artist, "new");
  assert.equal(result.library.tracks[0].album, "new album");
  assert.deepEqual(result.builtInMeta["built-in-a"], { artist: "new", album: "new album" });
});

test("Select All copies every filtered Records id", () => {
  const ids = ["a", "b", "c", "d"];
  const selected = selectAllMusicTrackIds(ids);

  assert.deepEqual(selected, ids);
  assert.notEqual(selected, ids);
});
