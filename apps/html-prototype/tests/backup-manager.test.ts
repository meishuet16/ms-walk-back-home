import assert from "node:assert/strict";
import test from "node:test";
import { createBackupBundle, parseBackupBundle, restoreBackupBlobEntries, walkBackupFilename } from "../src/systems/BackupManager.js";

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

test("backup preserves an explicit Journal media blob kind", () => {
  const bundle = createBackupBundle({
    diaryLibrary: { version: 1, savedAt: "now", entries: [], legacyArtifacts: [] },
    journey: null,
    reflectionWall: null,
    musicLibrary: null,
    personalPlayer: null,
    blobs: [{ key: "journal-media/entry/audio-1", kind: "journal-media", type: "audio/mp4", dataUrl: "data:audio/mp4;base64,AA==" }]
  });

  const parsed = parseBackupBundle(JSON.stringify(bundle));

  assert.equal(parsed?.blobs[0]?.kind, "journal-media");
});

test("legacy backup blobs without a kind remain valid", () => {
  const parsed = parseBackupBundle(JSON.stringify({
    app: "walk-back-home-html-prototype",
    version: 1,
    blobs: [{ key: "music/audio/old", type: "audio/mpeg", dataUrl: "data:audio/mpeg;base64,AA==" }]
  }));

  assert.equal(parsed?.blobs[0]?.kind, undefined);
  assert.equal(parsed?.blobs[0]?.key, "music/audio/old");
});

test("restore routes Journal and Music backup blobs to their own stores", async () => {
  const journal = new Map<string, Blob>();
  const music = new Map<string, Blob>();
  const journalStore = { putBlob: async (key: string, blob: Blob) => { journal.set(key, blob); } };
  const musicStore = { putBlob: async (key: string, blob: Blob) => { music.set(key, blob); } };

  await restoreBackupBlobEntries([
    { key: "journal-media/entry/audio-1", kind: "journal-media", type: "audio/webm", dataUrl: "data:audio/webm;base64,dm9pY2U=" },
    { key: "music/audio/old", type: "audio/mpeg", dataUrl: "data:audio/mpeg;base64,bXVzaWM=" }
  ], { journalStore, musicStore });

  assert.equal(await journal.get("journal-media/entry/audio-1")?.text(), "voice");
  assert.equal(await music.get("music/audio/old")?.text(), "music");
  assert.equal(journal.get("journal-media/entry/audio-1")?.type, "audio/webm");
});
