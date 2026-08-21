# Journal Audio Recording Implementation Plan

> For agentic workers: REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox syntax for tracking.

Goal: Add local-first Journal voice recording that saves, reopens, plays, backs up, restores, and remains metadata-only in Supabase while preserving legacy photo/video behavior.

Architecture: Keep existing DiaryPhoto and visual DiaryMedia data URLs unchanged. Add a generic IndexedDB-backed JournalMediaBlobStore for new audio blobs, with temporary keys copied explicitly to durable keys on save and cleaned up afterward. Extend backup entries with an explicit kind discriminator so Journal and Music blobs restore to their correct stores; sanitize only audio binary-bearing fields before Supabase push and preserve audio metadata on pull.

Tech Stack: TypeScript, browser MediaRecorder, navigator.mediaDevices.getUserMedia, IndexedDB, DOM object URLs, JSON backup envelope, Node node:test, existing static build.

## Global Constraints

- The MVP must run locally without any paid API or paid service.
- Do not migrate existing Journal photo/video storage.
- Do not fix the existing mixed photo/video ordering behavior.
- Audio binary must not be stored as a data URL inside DiaryEntry.
- Audio binary must not be included in Supabase diary JSON.
- Do not add Supabase Storage, Firebase, S3, backend uploads, transcription, or AI features.
- Keep the new blob store generic; do not name it AudioBlobStore.
- Recording begins only after an explicit user action and microphone access stops when recording ends or the editor lifecycle ends.
- Do not claim cross-device audio binary synchronization.
- Push code only after user confirmation; create one final local commit and do not push.

---

## File map

- Create apps/html-prototype/src/systems/JournalMediaBlobStore.ts: generic IndexedDB blob persistence and object-URL lifecycle.
- Create apps/html-prototype/src/systems/JournalAudioRecorder.ts: injectable MediaRecorder lifecycle, MIME selection, timing, pause/resume, and track cleanup.
- Create apps/html-prototype/src/systems/JournalMedia.ts: audio metadata, referenced-key collection, durable-key construction, pending-audio commit helpers, and unreferenced-key helpers.
- Modify apps/html-prototype/src/types.ts: add discriminated audio media shape while leaving visual media fields compatible.
- Modify apps/html-prototype/src/systems/ScrapbookComposer.ts: preserve visual behavior and make diaryMediaItems tolerate audio without attempting image operations.
- Modify apps/html-prototype/src/systems/BackupManager.ts: add backward-compatible kind metadata to backup blobs and validate it.
- Modify apps/html-prototype/src/systems/SupabaseSync.ts: strip audio binary-bearing fields only, while preserving audio metadata/reference and all legacy visual serialization.
- Modify apps/html-prototype/src/app.ts: integrate recorder actions, editor pending state, lazy audio object URLs, save/cancel/remove cleanup, backup/restore routing, reader/timeline rendering, and diary-blob deletion.
- Modify apps/html-prototype/src/styles.css: compact recorder, audio preview/player, unavailable state, and portrait-safe layout.
- Modify apps/html-prototype/tests/diary-page-flow.test.ts, save-manager.test.ts, backup-manager.test.ts, supabase-sync.test.ts, and ui-policy.test.ts; create focused tests for the new store/recorder/media helpers.
- Modify apps/html-prototype/PRODUCTION.md: document Journal audio local blob and backup behavior plus the existing photo-first ordering limitation.

## Task 1: Add the generic Journal media blob store

Files:
- Create apps/html-prototype/src/systems/JournalMediaBlobStore.ts
- Create apps/html-prototype/tests/journal-media-blob-store.test.ts

Interfaces:
- JournalMediaBlobStore.putBlob(key: string, blob: Blob): Promise<void>
- JournalMediaBlobStore.getBlob(key: string): Promise<Blob | null>
- JournalMediaBlobStore.deleteBlob(key: string): Promise<void>
- JournalMediaBlobStore.entries(): Promise<Array<{ key: string; blob: Blob }>>
- JournalMediaBlobStore.objectUrlFor(key: string): Promise<string | null>
- JournalMediaBlobStore.revokeObjectUrl(key: string): void
- JournalMediaBlobStore.revokeAllObjectUrls(): void
- Use IndexedDB database walk-back-home-journal-media, object store blobs, version 1.

- [ ] Step 1: Write failing store tests.

Test durable-key round trips, missing-key null behavior, cached object URLs, explicit revoke, delete cleanup, and entries enumeration. Use a fake IndexedDB adapter or a small injected adapter boundary so tests do not require a browser.

~~~ts
test("journal media blobs round-trip by durable key", async () => {
  const store = createTestJournalMediaBlobStore();
  const blob = new Blob(["voice-fixture"], { type: "audio/mp4" });
  await store.putBlob("journal-media/entry-1/audio-1", blob);
  const restored = await store.getBlob("journal-media/entry-1/audio-1");
  assert.equal(await restored?.text(), "voice-fixture");
  assert.equal(restored?.type, "audio/mp4");
});
~~~

- [ ] Step 2: Run the focused test and verify it fails.

Run:

~~~powershell
npm run build -w apps/html-prototype
node --test apps/html-prototype/dist/tests/journal-media-blob-store.test.js
~~~

Expected: FAIL because the store and test adapter do not exist.

- [ ] Step 3: Implement the minimal generic store.

Keep temporary/durable semantics out of the store. putBlob writes a key, deleteBlob revokes its cached URL before deleting, and objectUrlFor returns null for missing blobs. Do not add move, copy, or audio-specific methods.

- [ ] Step 4: Run focused tests and typecheck.

Run npm run typecheck -w apps/html-prototype and the focused test. Expected: PASS.

- [ ] Step 5: Commit the isolated store change.

~~~powershell
git add apps/html-prototype/src/systems/JournalMediaBlobStore.ts apps/html-prototype/tests/journal-media-blob-store.test.ts
git commit -m "feat: add generic journal media blob store"
~~~

## Task 2: Add recorder lifecycle and audio media helpers

Files:
- Create apps/html-prototype/src/systems/JournalAudioRecorder.ts
- Create apps/html-prototype/src/systems/JournalMedia.ts
- Create apps/html-prototype/tests/journal-audio-recorder.test.ts
- Create apps/html-prototype/tests/journal-media.test.ts
- Modify apps/html-prototype/src/types.ts

Interfaces:
- selectSupportedAudioMimeType(isTypeSupported?: (mimeType: string) => boolean): string | undefined
- JournalAudioRecorder.start(): Promise<void>
- JournalAudioRecorder.stop(): Promise<{ blob: Blob; mimeType: string; duration: number }>
- JournalAudioRecorder.pause(): void
- JournalAudioRecorder.resume(): void
- JournalAudioRecorder.cancel(): void
- JournalAudioRecorder.isActive(): boolean
- JournalAudioRecorder.elapsedMs(): number
- makeJournalAudioMedia(input: { id: string; storageKey: string; mimeType: string; duration: number; displayName?: string; createdAt?: string }): DiaryMedia
- journalMediaBlobKey(entryId: string, mediaId: string): string
- journalMediaTempKey(entryId: string, mediaId: string): string
- collectReferencedJournalMediaKeys(library: DiaryLibraryState): string[]
- commitPendingJournalAudio(store, entryId, pending): Promise<DiaryMedia[]>

PendingJournalAudio is `{ mediaId: string; tempKey: string; blob: Blob; duration: number; mimeType: string; displayName?: string; createdAt: string }`. The store argument for commitPendingJournalAudio is the structural subset `{ putBlob(key: string, blob: Blob): Promise<void>; deleteBlob(key: string): Promise<void> }`.

- [ ] Step 1: Write failing recorder and media tests.

Cover MIME order, permission rejection, one active recorder, chunk finalization, every track stopping, pause/resume guards, audio metadata without src, legacy image/video compatibility, referenced-only key collection, and explicit temporary-to-durable copy/delete sequencing.

~~~ts
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
~~~

- [ ] Step 2: Run focused tests and verify failure.

Run npm run build -w apps/html-prototype followed by the two focused built test files. Expected: FAIL with missing module, type, or helper errors.

- [ ] Step 3: Extend the media type conservatively.

Use a visual/audio discriminated union. Visual image and video keep required src; audio requires storageKey, stores mimeType, optional duration, createdAt, caption, and displayName, and has no src. Keep DiaryPhoto unchanged.

- [ ] Step 4: Implement recorder lifecycle.

Use navigator.mediaDevices.getUserMedia({ audio: true }) only from start(). Select the first supported MIME in this exact order:

~~~ts
["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/ogg;codecs=opus"]
~~~

If no type is supported, construct MediaRecorder without options. Attach dataavailable, stop, and error handlers. Stop all stream tracks in normal stop and cancel paths. Preserve the actual Blob type, falling back to the selected MIME only when the Blob has no type.

- [ ] Step 5: Implement pure media helpers and commit sequencing.

commitPendingJournalAudio must call putBlob(durableKey, blob), create metadata with the durable key, then call deleteBlob(tempKey); an empty pending list performs no writes. No store-level move abstraction is allowed.

- [ ] Step 6: Run focused tests and typecheck.

Run the two focused test files and npm run typecheck -w apps/html-prototype. Expected: PASS.

- [ ] Step 7: Commit recorder/media contracts.

~~~powershell
git add apps/html-prototype/src/types.ts apps/html-prototype/src/systems/JournalAudioRecorder.ts apps/html-prototype/src/systems/JournalMedia.ts apps/html-prototype/tests/journal-audio-recorder.test.ts apps/html-prototype/tests/journal-media.test.ts
git commit -m "feat: add journal audio media contracts"
~~~

## Task 3: Extend backup/restore with explicit Journal blob routing

Files:
- Modify apps/html-prototype/src/systems/BackupManager.ts
- Modify apps/html-prototype/src/app.ts
- Modify apps/html-prototype/tests/backup-manager.test.ts
- Create apps/html-prototype/tests/journal-backup-roundtrip.test.ts

Interfaces:
- BackupBlobEntry.kind?: "music" | "journal-media"
- Existing entries without kind remain parseable as legacy Music entries.
- backupBlobEntries returns both stores but only referenced Journal keys.

- [ ] Step 1: Write failing backup tests.

Assert Journal entries carry kind journal-media, old Music entries remain parseable without kind, orphaned Journal blobs are excluded, restore routes Journal blobs to JournalMediaBlobStore, and the full byte round trip works.

~~~ts
test("normal backup restores referenced journal audio bytes", async () => {
  const source = createTestJournalMediaBlobStore();
  const bytes = new Uint8Array([0, 1, 2, 255]);
  await source.putBlob("journal-media/entry/audio-1", new Blob([bytes], { type: "audio/webm" }));
  const library = journalLibraryWithAudio("journal-media/entry/audio-1", "audio/webm");
  const bundle = await makeTestBackupBundle(library, source);
  const restored = createTestJournalMediaBlobStore();
  await restoreBackupBlobs(bundle.blobs, restored, createTestMusicBlobStore());
  const blob = await restored.getBlob("journal-media/entry/audio-1");
  assert.deepEqual(new Uint8Array(await blob!.arrayBuffer()), bytes);
  assert.equal(blob!.type, "audio/webm");
});
~~~

- [ ] Step 2: Run focused backup tests and verify failure.

Run npm run build -w apps/html-prototype and the focused backup test files. Expected: FAIL because backup collection and routing are Music-only.

- [ ] Step 3: Add backward-compatible kind validation.

Extend BackupBlobEntry with optional kind. Accept music, journal-media, or absent kind; route absent kind to Music only at restore, without mutating parsed legacy bundle objects so existing deep-equality tests remain valid.

- [ ] Step 4: Collect referenced Journal blobs only.

In app.ts, combine existing Music entries tagged music with collectReferencedJournalMediaKeys(this.makeDiaryLibrary()). Read each referenced Journal blob from JournalMediaBlobStore; do not enumerate all Journal blobs and do not include temporary keys. Preserve the existing backup JSON envelope.

- [ ] Step 5: Route restore writes before applying diary state.

Write journal-media entries to JournalMediaBlobStore and entries with absent or music kind to MusicBlobStore, then apply diaryLibrary. A missing Journal blob in a backup must not delete the metadata attachment; the restored diary metadata remains intact.

- [ ] Step 6: Run backup round-trip and existing backup tests.

Run the focused built tests, then the complete existing backup-manager tests. Expected: PASS, including existing Music backup behavior.

- [ ] Step 7: Commit backup/restore support.

~~~powershell
git add apps/html-prototype/src/systems/BackupManager.ts apps/html-prototype/src/app.ts apps/html-prototype/tests/backup-manager.test.ts apps/html-prototype/tests/journal-backup-roundtrip.test.ts
git commit -m "feat: back up and restore journal media blobs"
~~~

## Task 4: Make Supabase audio metadata-only

Files:
- Modify apps/html-prototype/src/systems/SupabaseSync.ts
- Modify apps/html-prototype/tests/supabase-sync.test.ts

- [ ] Step 1: Write failing cloud serialization tests.

Push a bundle containing audio metadata plus an injected src data:audio test-only field. Assert the diary row keeps type, storageKey, mimeType, and duration but omits src; assert an existing image/video src remains unchanged. Simulate pull of audio metadata with no local blob and assert the returned entry still contains the audio media.

- [ ] Step 2: Run the focused Supabase test and verify failure.

Run npm run build -w apps/html-prototype and node --test apps/html-prototype/dist/tests/supabase-sync.test.js. Expected: FAIL because push currently sends entries unchanged.

- [ ] Step 3: Implement narrow audio sanitization.

Map bundle.diaryLibrary.entries through a helper that clones only entry.media audio objects and removes src if present. Leave photos, image media, video media, and all other cloud payloads untouched. Pull remains metadata-preserving and must not filter audio because local binary availability is a rendering concern.

- [ ] Step 4: Run focused Supabase tests.

Expected: PASS, including existing cloud tests and the no-Records-upload regression.

- [ ] Step 5: Commit the cloud boundary.

~~~powershell
git add apps/html-prototype/src/systems/SupabaseSync.ts apps/html-prototype/tests/supabase-sync.test.ts
git commit -m "fix: keep journal audio binary local"
~~~

## Task 5: Integrate recording into Edit Journal

Files:
- Modify apps/html-prototype/src/app.ts
- Modify apps/html-prototype/src/systems/ScrapbookComposer.ts
- Create apps/html-prototype/tests/journal-audio-editor.test.ts

State and methods:
- journalMediaBlobStore = new JournalMediaBlobStore()
- journalAudioRecorder: JournalAudioRecorder | null
- journalAudioTimer
- pendingJournalAudio = Map<string, PendingJournalAudio[]>
- journalMediaObjectUrls = Map<string, string>
- journalMediaResolution = Map<string, "loading" | "missing">
- startJournalAudioRecording, pauseJournalAudioRecording, resumeJournalAudioRecording, stopJournalAudioRecording, cancelJournalAudioRecording
- commitPendingJournalAudioForEntry, cleanupPendingJournalAudioForEntry, resolveJournalAudioMedia

- [ ] Step 1: Write failing editor/UI policy tests.

Assert explicit Record Audio action, no automatic getUserMedia on editor open, Stop, Pause/Resume controls, permission-denied message, unsupported state, audio rendering branches, no autoplay, and cleanup calls on editor cancel/close.

- [ ] Step 2: Run focused UI tests and verify failure.

Run npm run build -w apps/html-prototype and the focused editor test. Expected: FAIL because the editor contains only photo/video actions.

- [ ] Step 3: Add editor state and explicit recording actions.

Add a third mobile toolbar action labelled Record Audio. Start only from its click handler. Keep the editor open on permission denial or unsupported MediaRecorder, preserving text and existing attachments. Render Recording · mm:ss with Stop and Pause/Resume while active.

- [ ] Step 4: Store stopped audio under a temporary key.

On stop, create journal-media-temp/entryId/mediaId, write the Blob through putBlob, create pending metadata pointing at the temporary key, resolve a preview object URL lazily, and rerender the current editor. Do not add pending audio to DiaryEntry or call the normal diary-library update path.

- [ ] Step 5: Commit pending audio only on explicit save.

Make saveDiaryEntry async. Read the ordinary text/photo/video draft, call commitPendingJournalAudioForEntry, append returned durable audio metadata, persist through the existing upsertDiaryPageDraft path, then delete temp keys and clear pending state. Saving without pending audio performs no blob writes, so unchanged saved audio is not duplicated.

- [ ] Step 6: Implement cancel/remove/navigation cleanup.

Cancel/discard, close, editor replacement, pagehide, and removal must stop any active recorder, clear the timer, revoke preview URLs, delete temporary blobs, and clear pending state. Removing saved audio removes metadata and deletes its durable blob only when no remaining diary entry references that key. Preserve audio metadata when Supabase pull provides an unavailable local reference.

- [ ] Step 7: Run focused editor tests and typecheck.

Run the new editor tests, diary-page-flow.test.ts, save-manager.test.ts, and npm run typecheck -w apps/html-prototype. Expected: PASS with legacy photo/video tests unchanged.

- [ ] Step 8: Commit editor integration.

~~~powershell
git add apps/html-prototype/src/app.ts apps/html-prototype/src/systems/ScrapbookComposer.ts apps/html-prototype/tests/journal-audio-editor.test.ts
git commit -m "feat: record audio in journal editor"
~~~

## Task 6: Add lazy playback and compact surfaces

Files:
- Modify apps/html-prototype/src/app.ts
- Modify apps/html-prototype/src/styles.css
- Modify apps/html-prototype/tests/ui-policy.test.ts

- [ ] Step 1: Write failing render tests.

Assert reader/editor audio branches use a resolved object URL only after lazy resolution, do not include autoplay, show Voice note or unavailable text, and leave timeline/books/Forest previews lightweight. Assert mobile controls are contained by the existing portrait editor/media dock.

- [ ] Step 2: Implement lazy object-URL resolution.

Use JournalMediaBlobStore.objectUrlFor(storageKey) only when a Journal surface needs playback. Cache by storage key, rerender only the active entry after resolution, mark missing keys unavailable without removing metadata, and revoke URLs on deletion/pagehide.

- [ ] Step 3: Render saved reader/editor audio.

Use compact native audio controls with preload metadata only in the Journal reader and Edit Journal preview. Do not autoplay. Add a play control for pending editor audio and a Remove action. Existing image/video branches remain unchanged.

- [ ] Step 4: Render lightweight timeline/books previews.

Add a microphone/voice-note indicator and audio counts where appropriate; do not create full players or load every audio Blob in dense cards. Keep existing photo/video ordering and document it rather than refactoring it.

- [ ] Step 5: Add responsive styles.

Keep recorder and audio cards within journal-modal, journal-media-dock, and existing mobile safe-area padding. Use existing button sizing, min-width 0, max-width 100%, and scroll containment. Add styles for unavailable local media and elapsed timer.

- [ ] Step 6: Run UI policy and existing Journal tests.

Run focused UI tests plus journal-preview-pdf-regression.test.ts, journal-navigation.test.ts, and diary-page-flow.test.ts. Expected: PASS with no autoplay and no mobile overflow policy regressions.

- [ ] Step 7: Commit playback/UI surfaces.

~~~powershell
git add apps/html-prototype/src/app.ts apps/html-prototype/src/styles.css apps/html-prototype/tests/ui-policy.test.ts
git commit -m "feat: play saved journal audio locally"
~~~

## Task 7: Update production notes and run release verification

Files:
- Modify apps/html-prototype/PRODUCTION.md

- [ ] Step 1: Update production notes.

Document Journal audio as local IndexedDB media, normal backup/restore coverage, explicit backup kind routing, metadata-only Supabase behavior, missing-local-media handling, and the existing photo-first ordering limitation.

- [ ] Step 2: Run the complete verification matrix.

From the repository root run:

~~~powershell
npm run typecheck
npm run build
npm test
git diff --check
~~~

From apps/html-prototype also run focused built tests for recorder, media store, media helpers, backup round trip, Supabase, UI policy, Journal navigation, Journal model, scrapbook, save manager, and existing photo/video flows.

- [ ] Step 3: Run browser smoke checks if browser tooling is available.

Verify desktop and mobile portrait: Record → Stop → Preview → Save → Reopen → Play; denial preserves the draft; cancel stops tracks and saves no audio; existing photo/video still work; and photo + video + audio survive normal backup/restore. If browser tooling is unavailable or blocked, report that limitation explicitly.

- [ ] Step 4: Inspect the final diff and create one final local commit.

Confirm no .private-spec/, personal data, generated media, external upload code, photo/video migration, or mixed-ordering refactor was added. Then create one final local commit containing implementation and documentation changes.

~~~powershell
git status --short
git diff --check
git add apps/html-prototype docs/superpowers/plans/2026-08-21-journal-audio-recording.md
git commit -m "feat: add local journal audio recording"
~~~

## Self-review checklist

- Spec coverage: recorder permission/lifecycle, generic local storage, metadata-only DiaryMedia, lazy playback, backup/restore, explicit routing, Supabase metadata preservation, mobile layout, no autoplay, privacy, and regression tests are covered by Tasks 1–7.
- Completeness scan: this plan contains no TBD, TODO, FIXME, or unspecified implementation step.
- Type consistency: JournalMediaBlobStore, JournalAudioRecorder, JournalMedia helpers, BackupBlobEntry.kind, and app integration names are defined before use.
- Scope: no existing photo/video migration, no ordering fix, no cloud binary upload, and no transcription.
