import assert from "node:assert/strict";
import test from "node:test";
import {
  developerHiddenRecordIds,
  filterTracksForLibraryView,
  hideBuiltInRecord,
  installRecordsLibraryVisibilityBridge,
  libraryView,
  normalizedHiddenBuiltInIds,
  personalPlaybackCandidates,
  restoreBuiltInRecord
} from "../src/systems/RecordsLibraryVisibilityBridge.js";

const tracks = [
  { id: "chapter-theme", source: "built-in" as const },
  { id: "forest-theme", source: "built-in" as const },
  { id: "my-song", source: "user" as const }
];

test("Records visibility keeps old saves backward compatible", () => {
  assert.deepEqual(normalizedHiddenBuiltInIds({}), []);
  assert.equal(libraryView({}), "all");
  assert.deepEqual(filterTracksForLibraryView(tracks, {}).map((track) => track.id), ["chapter-theme", "forest-theme", "my-song"]);
});

test("Records visibility hides a built-in record from normal library views without deleting it", () => {
  const player = hideBuiltInRecord({}, "chapter-theme");
  assert.deepEqual(filterTracksForLibraryView(tracks, player).map((track) => track.id), ["forest-theme", "my-song"]);
  assert.equal(tracks.some((track) => track.id === "chapter-theme"), true);
});

test("Records visibility shows hidden built-in records only in the Hidden view", () => {
  const player = { ...hideBuiltInRecord({}, "chapter-theme"), libraryView: "hidden" as const };
  assert.deepEqual(filterTracksForLibraryView(tracks, player).map((track) => track.id), ["chapter-theme"]);
});

test("Records visibility filters My Music and Built-in independently", () => {
  const hidden = hideBuiltInRecord({}, "chapter-theme");
  assert.deepEqual(filterTracksForLibraryView(tracks, { ...hidden, libraryView: "personal" }).map((track) => track.id), ["my-song"]);
  assert.deepEqual(filterTracksForLibraryView(tracks, { ...hidden, libraryView: "built-in" }).map((track) => track.id), ["forest-theme"]);
});

test("Records visibility excludes hidden built-ins from personal playback candidates", () => {
  const player = hideBuiltInRecord({}, "chapter-theme");
  assert.deepEqual(personalPlaybackCandidates(tracks, player).map((track) => track.id), ["forest-theme", "my-song"]);
});

test("Records visibility restores a hidden built-in to Records and playback candidates", () => {
  const hidden = hideBuiltInRecord({}, "chapter-theme");
  const restored = restoreBuiltInRecord(hidden, "chapter-theme");
  assert.deepEqual(normalizedHiddenBuiltInIds(restored), []);
  assert.equal(personalPlaybackCandidates(tracks, restored).some((track) => track.id === "chapter-theme"), true);
});

test("Records visibility deduplicates hidden ids so repeated Hide is harmless", () => {
  const once = hideBuiltInRecord({}, "chapter-theme");
  const twice = hideBuiltInRecord(once, "chapter-theme");
  assert.deepEqual(normalizedHiddenBuiltInIds(twice), ["chapter-theme"]);
});

test("developer-hidden built-ins never enter Records or the personal playback queue", () => {
  developerHiddenRecordIds.add("chapter-theme");
  try {
    assert.deepEqual(filterTracksForLibraryView(tracks, {}).map((track) => track.id), ["forest-theme", "my-song"]);
    assert.deepEqual(filterTracksForLibraryView(tracks, { libraryView: "hidden", hiddenBuiltInRecordIds: ["chapter-theme"] }).map((track) => track.id), []);
    assert.deepEqual(personalPlaybackCandidates(tracks, {}).map((track) => track.id), ["forest-theme", "my-song"]);
  } finally {
    developerHiddenRecordIds.delete("chapter-theme");
  }
});

test("developer-hidden policy does not delete or mutate the underlying bundled track", () => {
  developerHiddenRecordIds.add("chapter-theme");
  try {
    const player = hideBuiltInRecord({}, "chapter-theme");
    assert.deepEqual(normalizedHiddenBuiltInIds(player), []);
    assert.equal(tracks.find((track) => track.id === "chapter-theme")?.source, "built-in");
  } finally {
    developerHiddenRecordIds.delete("chapter-theme");
  }
});

test("Records bridge preserves the app's scene guard for track-ended events", async () => {
  let endedRan = false;
  const prototype = {
    visibleMusicTracks() { return tracks; },
    allPersonalTracks() { return tracks; },
    async handlePersonalTrackEnded(this: { scene?: string }) {
      if (this.scene !== "forest") return;
      endedRan = true;
    }
  };
  installRecordsLibraryVisibilityBridge(prototype);
  const app = Object.assign(Object.create(prototype), {
    scene: "chapter-memory",
    personalPlayer: { playing: true, hiddenBuiltInRecordIds: ["chapter-theme"], libraryView: "hidden" as const }
  });
  await app.handlePersonalTrackEnded();
  assert.equal(endedRan, false);
});

test("Records playback controls use playable candidates without changing the active library view", async () => {
  let observedIds: string[] = [];
  const prototype = {
    visibleMusicTracks() { return tracks; },
    allPersonalTracks() { return tracks; },
    async playAdjacentPersonalTrack(this: { visibleMusicTracks: () => typeof tracks }) {
      observedIds = this.visibleMusicTracks().map((track) => track.id);
    }
  };
  installRecordsLibraryVisibilityBridge(prototype);
  const app = Object.assign(Object.create(prototype), {
    personalPlayer: { hiddenBuiltInRecordIds: ["chapter-theme"], libraryView: "hidden" as const }
  });
  await app.playAdjacentPersonalTrack(1);
  assert.deepEqual(observedIds, ["forest-theme", "my-song"]);
  assert.equal(app.personalPlayer.libraryView, "hidden");
});
