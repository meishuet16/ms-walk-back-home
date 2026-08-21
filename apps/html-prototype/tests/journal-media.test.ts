import assert from "node:assert/strict";
import test from "node:test";
import { makeDiaryEntry, normalizeDiaryEntry } from "../src/systems/DiaryImport.js";
import { addJournalMedia, diaryMediaItems } from "../src/systems/ScrapbookComposer.js";
import { collectReferencedJournalMediaKeys, commitPendingJournalAudio, makeJournalAudioMedia, type PendingJournalAudio } from "../src/systems/JournalMedia.js";
import type { DiaryLibraryState } from "../src/types.js";

test("audio metadata has a durable reference and no binary source", () => {
  const media = makeJournalAudioMedia({
    id: "audio-1",
    storageKey: "journal-media/e/audio-1",
    mimeType: "audio/mp4",
    duration: 2.5
  });

  assert.equal(media.type, "audio");
  assert.equal(media.storageKey, "journal-media/e/audio-1");
  assert.equal("src" in media, false);
});

test("existing image and video media remain compatible with normalization", () => {
  const entry = normalizeDiaryEntry({
    ...makeDiaryEntry("2026-08-21", "Legacy media", "Fixture."),
    media: [
      { id: "image-1", type: "image", src: "data:image/png;base64,image" },
      { id: "video-1", type: "video", src: "data:video/mp4;base64,video", mimeType: "video/mp4" }
    ]
  });

  assert.deepEqual(diaryMediaItems(entry).map((media) => media.type), ["image", "video"]);
  assert.equal(diaryMediaItems(entry)[0].src, "data:image/png;base64,image");
});

test("referenced Journal audio collection ignores orphaned and temporary keys", () => {
  const library: DiaryLibraryState = {
    version: 1,
    savedAt: "now",
    legacyArtifacts: [],
    entries: [{
      ...makeDiaryEntry("2026-08-21", "Voice", "Fixture."),
      media: [makeJournalAudioMedia({ id: "a", storageKey: "journal-media/e/a", mimeType: "audio/ogg", duration: 1 })]
    }]
  };

  assert.deepEqual(collectReferencedJournalMediaKeys(library), ["journal-media/e/a"]);
});

test("pending audio is copied to a durable key before its temporary key is deleted", async () => {
  const calls: string[] = [];
  const store = {
    async putBlob(key: string, _blob: Blob): Promise<void> { calls.push(`put:${key}`); },
    async deleteBlob(key: string): Promise<void> { calls.push(`delete:${key}`); }
  };
  const pending: PendingJournalAudio[] = [{
    mediaId: "audio-1",
    tempKey: "journal-media-temp/entry/audio-1",
    blob: new Blob(["voice"], { type: "audio/webm" }),
    duration: 3,
    mimeType: "audio/webm",
    createdAt: "2026-08-21T00:00:00.000Z"
  }];

  const media = await commitPendingJournalAudio(store, "entry", pending);

  assert.deepEqual(calls, ["put:journal-media/entry/audio-1", "delete:journal-media-temp/entry/audio-1"]);
  assert.equal(media[0].storageKey, "journal-media/entry/audio-1");
  assert.equal("src" in media[0], false);
});

test("saving with no pending audio performs no blob writes", async () => {
  let writes = 0;
  const store = {
    async putBlob(): Promise<void> { writes += 1; },
    async deleteBlob(): Promise<void> { writes += 1; }
  };

  assert.deepEqual(await commitPendingJournalAudio(store, "entry", []), []);
  assert.equal(writes, 0);
});

test("audio attaches through generic Journal media without replacing visual media", () => {
  const entry = addJournalMedia(makeDiaryEntry("2026-08-21", "Media", "Fixture."), makeJournalAudioMedia({
    id: "audio-1",
    storageKey: "journal-media/entry/audio-1",
    mimeType: "audio/ogg",
    duration: 1
  }));

  assert.deepEqual(diaryMediaItems(entry).map((media) => media.type), ["audio"]);
  assert.equal(entry.media?.[0]?.type, "audio");
});
