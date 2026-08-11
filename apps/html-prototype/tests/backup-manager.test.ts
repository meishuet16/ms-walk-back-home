import assert from "node:assert/strict";
import test from "node:test";
import { createBackupBundle, parseBackupBundle, walkBackupFilename } from "../src/systems/BackupManager.js";

test("backup bundle keeps local-first state in a portable JSON envelope", () => {
  const bundle = createBackupBundle({
    diaryLibrary: { version: 1, savedAt: "now", entries: [], legacyArtifacts: [] },
    journey: null,
    reflectionWall: { version: 1, savedAt: "now", defaultStyleId: "paper-mix", migratedLegacyKeys: [], notes: [] },
    musicLibrary: { version: 1, savedAt: "now", tracks: [] },
    personalPlayer: null,
    blobs: [{ key: "music/cover/a", type: "image/png", dataUrl: "data:image/png;base64,AA==" }]
  }, new Date("2026-08-11T08:00:00.000Z"));

  assert.equal(bundle.version, 1);
  assert.equal(bundle.app, "walk-back-home-html-prototype");
  assert.equal(bundle.exportedAt, "2026-08-11T08:00:00.000Z");
  assert.deepEqual(Object.keys(bundle).includes("chapterDefinitions"), false);
  assert.equal(bundle.reflectionWall?.version, 1);
  assert.equal(bundle.blobs[0].key, "music/cover/a");
  assert.deepEqual(parseBackupBundle(JSON.stringify(bundle)), bundle);
  assert.equal(walkBackupFilename(new Date("2026-08-11T08:00:00.000Z")), "walk-back-home-backup-2026-08-11.json");
});

test("backup parser rejects unrelated files", () => {
  assert.equal(parseBackupBundle("{}"), null);
  assert.equal(parseBackupBundle("not json"), null);
});
