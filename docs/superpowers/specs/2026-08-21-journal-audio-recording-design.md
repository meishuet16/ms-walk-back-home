# Journal Audio Recording Design

## Scope

Add voice recording to `apps/html-prototype` Journal editing while preserving the existing photo/video data-URL model. New audio uses a generic local Journal media blob/reference layer. Existing Journal photos and videos are not migrated.

## Architecture

Add `JournalMediaBlobStore`, a generic IndexedDB-backed local blob store with `putBlob`, `getBlob`, `deleteBlob`, `entries`, `objectUrlFor`, and object-URL revocation/cleanup. The store is not audio-specific so a future migration can move image/video media onto the same abstraction.

Extend `DiaryMedia` with `type: "audio"`. Audio entries persist only durable metadata and a `storageKey`; they do not persist a data URL or object URL. Legacy photo/video entries continue to deserialize and render exactly as before.

Add small pure helpers for audio metadata, supported MediaRecorder MIME selection, and backup reference collection so the UI remains responsible for DOM behavior while storage and serialization boundaries remain testable.

## Recording and editor lifecycle

The Edit Journal toolbar gains a visually consistent Record Audio action. A user action requests `getUserMedia({ audio: true })`; recording begins only after permission succeeds. `MediaRecorder` uses the first supported MIME type from the runtime-tested fallback list, collects chunks, tracks elapsed time, and exposes Stop plus Pause/Resume when supported.

After Stop, all stream tracks and timers are released. The resulting Blob is stored under a temporary editor-local storage key and rendered through a temporary object URL for preview. The editor keeps the audio attachment out of persisted `DiaryEntry` state until the existing Journal save path commits it. Cancel, close, navigation, or removal deletes the temporary blob and revokes its object URL. Existing saved audio is loaded lazily by `storageKey`; unavailable local blobs render a compact local-media-unavailable state.

The implementation prevents more than one active recorder and keeps microphone denial or unsupported MediaRecorder as recoverable editor messages. Existing text and photo/video draft behavior is preserved.

## Persistence, backup, and restore

On explicit Journal save, the audio Blob is moved/retained under its durable `storageKey`, and the saved `DiaryMedia.audio` contains metadata such as id, type, storageKey, mimeType, duration, createdAt, and optional display name. No Blob, base64 data, or object URL is written to `DiaryEntry`.

Normal backup collection is extended to include only Journal blob keys referenced by persisted audio media, alongside the existing music blob entries. The existing JSON/data-URL backup envelope remains unchanged; Journal audio blob bytes use the same `BackupBlobEntry` representation. Restore writes those entries into `JournalMediaBlobStore` before applying the diary library. The full round-trip test verifies binary bytes and MIME type, not only metadata.

Removing saved audio removes its reference and deletes the local blob when no persisted entry still references that key. Existing photo/video backup behavior remains unchanged.

## Supabase behavior

Before diary rows are pushed, audio media is serialized as metadata/reference only with its binary-bearing `src` absent. Existing photo/video cloud serialization remains unchanged. Pulling audio metadata never claims cross-device binary synchronization. On the local device, matching local audio can be preserved when cloud metadata is applied; on another device without the blob, playback shows the unavailable state. No Supabase Storage or external upload is added.

## Rendering and mobile behavior

The Journal reader renders saved audio as a compact, non-autoplaying native audio control after lazy object-URL resolution. The editor renders existing and newly recorded audio previews with Play/Pause and Remove controls. Timeline, Books, Forest, and dense cards use a lightweight voice-note indicator rather than autoplaying or embedding full players. Portrait controls stay inside the existing editor modal, use existing touch-target sizing, and respect safe-area padding and scroll containment.

The existing photo-first ordering behavior of `diaryMediaItems` is documented and left unchanged unless an audio-specific rendering path requires a minimal guard.

## Tests

Add focused tests for:

- audio type compatibility and legacy fixture normalization;
- MIME selection and unsupported recorder handling;
- permission denial, stop/track cleanup, pause/resume, cancel/remove cleanup, and no simultaneous recorder;
- save/reopen/lazy resolution and unchanged-audio non-duplication;
- saved-audio removal and multiple audio attachments;
- no autoplay and mobile portrait UI source policy;
- referenced-only backup collection, binary restore, MIME/reference recovery, and existing photo/video backup regression;
- Supabase audio sanitization without raw binary/base64 while preserving legacy photo/video behavior.

The release regression test performs: create entry → attach audio Blob → save → normal backup → clear local state → restore → retrieve entry → resolve `storageKey` → verify restored bytes/type and playable reference.

## Expected files

Likely changes are limited to `types.ts`, `app.ts`, `styles.css`, `ScrapbookComposer.ts`, `BackupManager.ts`, `SupabaseSync.ts`, the new generic Journal media blob-store/helper modules, focused Journal/backup/Supabase/UI tests, and `PRODUCTION.md`.
