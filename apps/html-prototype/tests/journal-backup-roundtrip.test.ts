import assert from "node:assert/strict";
import test from "node:test";
import { createBackupBundle, parseBackupBundle, restoreBackupBlobEntries, type BackupBlobWriter } from "../src/systems/BackupManager.js";
import { makeJournalAudioMedia } from "../src/systems/JournalMedia.js";
import { makeDiaryEntry } from "../src/systems/DiaryImport.js";

test("legacy backup chapter progress is ignored while unrelated Room state survives", () => {
  const parsed = parseBackupBundle(JSON.stringify({
    app: "walk-back-home-html-prototype",
    version: 1,
    exportedAt: "now",
    provider: { mode: "manual-file", label: "Local backup file" },
    diaryLibrary: null,
    journey: {
      version: 1,
      savedAt: "now",
      scene: "forest",
      player: { x: 1, y: 2 },
      visitedMemories: ["yumido"],
      walkedThroughMemories: ["bakery-day"],
      choices: ["remember"],
      tendencies: { acceptance: 1 },
      readMemories: ["bakery-day"],
      completedMemoryEvents: ["yumido-rain-conversation-ends"],
      room: { visits: 3, reflections: ["keep this room note"], residueIds: ["bakery-day", "generic-room-residue"] },
      finalJourney: []
    },
    reflectionWall: null,
    musicLibrary: null,
    personalPlayer: null,
    blobs: []
  }));

  assert.equal("completedMemoryEvents" in (parsed?.journey ?? {}), false);
  assert.equal(parsed?.journey?.room.visits, 3);
  assert.deepEqual(parsed?.journey?.room.reflections, ["keep this room note"]);
  assert.deepEqual(parsed?.journey?.room.residueIds, ["generic-room-residue"]);
});

test("normal backup round trip preserves referenced Journal audio binary", async () => {
  const storageKey = "journal-media/entry/audio-1";
  const sourceBytes = new Uint8Array([0, 1, 2, 255]);
  const sourceBlob = new Blob([sourceBytes], { type: "audio/webm" });
  const source = new Map([[storageKey, sourceBlob]]);
  const entry = { ...makeDiaryEntry("2026-08-21", "Voice", "Fixture."), media: [makeJournalAudioMedia({ id: "audio-1", storageKey, mimeType: sourceBlob.type, duration: 1.25 })] };
  const bundle = createBackupBundle({
    diaryLibrary: { version: 1, savedAt: "now", entries: [entry], legacyArtifacts: [] },
    journey: null,
    reflectionWall: null,
    musicLibrary: null,
    personalPlayer: null,
    blobs: [{ key: storageKey, kind: "journal-media", type: sourceBlob.type, dataUrl: "data:audio/webm;base64,AAE C/w==".replace(" ", "") }]
  });
  const restored = new Map<string, Blob>();
  const journalStore: BackupBlobWriter = { putBlob: async (key, blob) => { restored.set(key, blob); } };
  const musicStore: BackupBlobWriter = { putBlob: async () => {} };
  await restoreBackupBlobEntries(bundle.blobs, { journalStore, musicStore });

  const restoredBlob = restored.get(storageKey);
  assert.ok(restoredBlob);
  assert.deepEqual(new Uint8Array(await restoredBlob.arrayBuffer()), new Uint8Array([0, 1, 2, 255]));
  assert.equal(restoredBlob.type, "audio/webm");
  assert.equal(bundle.diaryLibrary?.entries[0]?.media?.[0]?.storageKey, storageKey);
  assert.equal(source.get(storageKey)?.type, "audio/webm");
});
