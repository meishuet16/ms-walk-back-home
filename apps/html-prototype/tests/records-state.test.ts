import assert from "node:assert/strict";
import test from "node:test";
import { selectAllMusicTrackIds } from "../src/systems/PersonalMusic.js";

test("Records Select All is independent from the rendered row count", () => {
  const filteredIds = Array.from({ length: 12 }, (_, index) => `track-${index + 1}`);
  const selectedIds = selectAllMusicTrackIds(filteredIds);

  assert.equal(selectedIds.length, filteredIds.length);
  assert.deepEqual(selectedIds, filteredIds);
});
