import assert from "node:assert/strict";
import test from "node:test";
import { createBackupBundle, parseBackupBundle, restoreBackupBlobEntries, walkBackupFilename } from "../src/systems/BackupManager.js";
import { CAPSULE_STORAGE_KEY } from "../src/systems/CapsuleMachine.js";
import { REFLECTION_WALL_BACKGROUND_KEY } from "../src/systems/ReflectionWallVisualPolishBridge.js";

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

test("backup preserves explicit Journal and Capsule supplemental blob kinds", () => {
  const bundle = createBackupBundle({
    diaryLibrary: { version: 1, savedAt: "now", entries: [], legacyArtifacts: [] },
    journey: null,
    reflectionWall: null,
    musicLibrary: null,
    personalPlayer: null,
    blobs: [
      { key: "journal-media/entry/audio-1", kind: "journal-media", type: "audio/mp4", dataUrl: "data:audio/mp4;base64,AA==" },
      { key: "capsule-media-1", kind: "capsule-media", type: "image/jpeg", dataUrl: "data:image/jpeg;base64,AA==" },
      { key: CAPSULE_STORAGE_KEY, kind: "capsule-state", type: "application/json", dataUrl: "data:application/json;base64,e30=" },
      { key: REFLECTION_WALL_BACKGROUND_KEY, kind: "reflection-wall-background", type: "text/plain", dataUrl: "data:text/plain;base64," }
    ]
  });

  const parsed = parseBackupBundle(JSON.stringify(bundle));

  assert.deepEqual(parsed?.blobs.map((entry) => entry.kind), ["journal-media", "capsule-media", "capsule-state", "reflection-wall-background"]);
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

test("restore routes Journal, Music, Capsule media, Capsule state, and Reflection background", async () => {
  const journal = new Map<string, Blob>();
  const music = new Map<string, Blob>();
  const capsule = new Map<string, Blob>();
  const storage = new Map<string, string>();
  const journalStore = { putBlob: async (key: string, blob: Blob) => { journal.set(key, blob); } };
  const musicStore = { putBlob: async (key: string, blob: Blob) => { music.set(key, blob); } };
  const capsuleStore = { putBlob: async (key: string, blob: Blob) => { capsule.set(key, blob); } };
  const localStorage = {
    setItem: (key: string, value: string) => { storage.set(key, value); },
    removeItem: (key: string) => { storage.delete(key); }
  };
  const capsuleState = JSON.stringify({
    version: 1,
    savedAt: "2026-08-31T14:00:00.000Z",
    thoughts: [{ id: "capsule-1", text: "hello", createdAt: "2026-08-31T14:00:00.000Z", status: "machine", drawCount: 0, attachments: [] }]
  });
  const capsuleStateUrl = `data:application/json;base64,${Buffer.from(capsuleState).toString("base64")}`;
  const wall = "data:image/jpeg;base64,d2FsbA==";
  const wallUrl = `data:text/plain;base64,${Buffer.from(wall).toString("base64")}`;

  await restoreBackupBlobEntries([
    { key: "journal-media/entry/audio-1", kind: "journal-media", type: "audio/webm", dataUrl: "data:audio/webm;base64,dm9pY2U=" },
    { key: "music/audio/old", type: "audio/mpeg", dataUrl: "data:audio/mpeg;base64,bXVzaWM=" },
    { key: "capsule-media-1", kind: "capsule-media", type: "image/jpeg", dataUrl: "data:image/jpeg;base64,cGhvdG8=" },
    { key: CAPSULE_STORAGE_KEY, kind: "capsule-state", type: "application/json", dataUrl: capsuleStateUrl },
    { key: REFLECTION_WALL_BACKGROUND_KEY, kind: "reflection-wall-background", type: "text/plain", dataUrl: wallUrl }
  ], { journalStore, musicStore, capsuleStore, localStorage });

  assert.equal(await journal.get("journal-media/entry/audio-1")?.text(), "voice");
  assert.equal(await music.get("music/audio/old")?.text(), "music");
  assert.equal(await capsule.get("capsule-media-1")?.text(), "photo");
  assert.equal(JSON.parse(storage.get(CAPSULE_STORAGE_KEY) ?? "{}").thoughts?.[0]?.text, "hello");
  assert.equal(storage.get(REFLECTION_WALL_BACKGROUND_KEY), wall);
  assert.equal(journal.get("journal-media/entry/audio-1")?.type, "audio/webm");
});

test("restoring an explicit empty Reflection background removes the current photo", async () => {
  const storage = new Map<string, string>([[REFLECTION_WALL_BACKGROUND_KEY, "old-photo"]]);
  const emptyStore = { putBlob: async () => {} };
  await restoreBackupBlobEntries([
    { key: REFLECTION_WALL_BACKGROUND_KEY, kind: "reflection-wall-background", type: "text/plain", dataUrl: "data:text/plain;base64," }
  ], {
    journalStore: emptyStore,
    musicStore: emptyStore,
    capsuleStore: emptyStore,
    localStorage: {
      setItem: (key, value) => { storage.set(key, value); },
      removeItem: (key) => { storage.delete(key); }
    }
  });

  assert.equal(storage.has(REFLECTION_WALL_BACKGROUND_KEY), false);
});
