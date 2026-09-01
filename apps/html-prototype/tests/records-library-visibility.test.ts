import { describe, expect, it } from "vitest";
import {
  filterTracksForLibraryView,
  hideBuiltInRecord,
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

describe("Records library visibility", () => {
  it("keeps old saves backward compatible", () => {
    expect(normalizedHiddenBuiltInIds({})).toEqual([]);
    expect(libraryView({})).toBe("all");
    expect(filterTracksForLibraryView(tracks, {}).map((track) => track.id)).toEqual(["chapter-theme", "forest-theme", "my-song"]);
  });

  it("hides a built-in record from normal library views without deleting it", () => {
    const player = hideBuiltInRecord({}, "chapter-theme");
    expect(filterTracksForLibraryView(tracks, player).map((track) => track.id)).toEqual(["forest-theme", "my-song"]);
    expect(tracks.map((track) => track.id)).toContain("chapter-theme");
  });

  it("shows hidden built-in records only in the Hidden view", () => {
    const player = { ...hideBuiltInRecord({}, "chapter-theme"), libraryView: "hidden" as const };
    expect(filterTracksForLibraryView(tracks, player).map((track) => track.id)).toEqual(["chapter-theme"]);
  });

  it("filters My Music and Built-in independently", () => {
    const hidden = hideBuiltInRecord({}, "chapter-theme");
    expect(filterTracksForLibraryView(tracks, { ...hidden, libraryView: "personal" }).map((track) => track.id)).toEqual(["my-song"]);
    expect(filterTracksForLibraryView(tracks, { ...hidden, libraryView: "built-in" }).map((track) => track.id)).toEqual(["forest-theme"]);
  });

  it("excludes hidden built-ins from personal next, previous, shuffle and auto-next candidates", () => {
    const player = hideBuiltInRecord({}, "chapter-theme");
    expect(personalPlaybackCandidates(tracks, player).map((track) => track.id)).toEqual(["forest-theme", "my-song"]);
  });

  it("restores a hidden built-in to Records and playback candidates", () => {
    const hidden = hideBuiltInRecord({}, "chapter-theme");
    const restored = restoreBuiltInRecord(hidden, "chapter-theme");
    expect(normalizedHiddenBuiltInIds(restored)).toEqual([]);
    expect(personalPlaybackCandidates(tracks, restored).map((track) => track.id)).toContain("chapter-theme");
  });

  it("deduplicates hidden ids so repeated Hide is harmless", () => {
    const once = hideBuiltInRecord({}, "chapter-theme");
    const twice = hideBuiltInRecord(once, "chapter-theme");
    expect(normalizedHiddenBuiltInIds(twice)).toEqual(["chapter-theme"]);
  });
});
