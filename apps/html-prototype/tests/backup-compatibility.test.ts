import assert from "node:assert/strict";
import test from "node:test";
import { parseBackupBundle } from "../src/systems/BackupManager.js";

test("older version-1 backups without capsule supplements still parse", () => {
  const parsed = parseBackupBundle(JSON.stringify({
    app: "walk-back-home-html-prototype",
    version: 1,
    exportedAt: "2026-08-01T00:00:00.000Z",
    provider: { mode: "manual-file", label: "Local backup file" },
    diaryLibrary: null,
    journey: null,
    reflectionWall: null,
    musicLibrary: null,
    personalPlayer: null,
    blobs: []
  }));

  assert.ok(parsed);
  assert.deepEqual(parsed.blobs, []);
});
