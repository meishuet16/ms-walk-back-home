# Local Records and Cloud Sync Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stop syncing user Records to Supabase, clean legacy `music_tracks` metadata for the signed-in user, and preserve local playback plus GitHub-shipped audio.

**Architecture:** Keep `MusicBlobStore`, `PersonalMusic`, and the local backup path unchanged. Narrow `CloudSyncBundle` to diary, journey, reflection, and room state; strip the local `personalPlayer` from the journey payload; make `SupabaseSync.push` delete only the current user's legacy music rows and make `pull` ignore that table.

**Tech Stack:** TypeScript, Node test runner, Supabase JavaScript client contract, existing IndexedDB `MusicBlobStore`.

## Global Constraints

- Do not upload audio, cover images, or user Records blobs to Supabase Storage.
- Do not add an LRC cloud table in this change.
- Keep public audio under `apps/html-prototype/public/assets/audio` unchanged.
- Do not stage or modify unrelated attachments, mobile packages, or zip files.

---

### Task 1: Lock the cloud sync boundary with failing tests

**Files:**
- Modify: `apps/html-prototype/tests/supabase-sync.test.ts`

**Interfaces:**
- Consumes: `SupabaseSync.push`, `SupabaseSync.pull`, and the existing `CloudSyncBundle` shape.
- Produces: regression coverage proving the request table calls contain no music upsert/select and do contain a user-scoped legacy delete.

- [ ] **Step 1: Write the failing tests**

Add a recording fake Supabase client and tests that call `push` and `pull`, then assert:

```ts
assert.deepEqual(calls.filter((call) => call.table === "music_tracks"), [
  { operation: "delete", table: "music_tracks", column: "user_id", value: "user-1" }
]);
```

Also assert `pull` never records a `music_tracks` call.

- [ ] **Step 2: Run the focused test and verify it fails**

Run:

```bash
npm test -- --test-name-pattern="music tracks|Records"
```

Expected: FAIL because the current implementation upserts and selects `music_tracks`, and the fake client does not yet support the required delete-only contract.

### Task 2: Remove Records from cloud payloads and purge legacy rows

**Files:**
- Modify: `apps/html-prototype/src/systems/SupabaseSync.ts`
- Modify: `apps/html-prototype/src/app.ts`

**Interfaces:**
- Consumes: the existing auth/session and local `MusicBlobStore` behavior.
- Produces: a `CloudSyncBundle` without `musicLibrary` or top-level `personalPlayer`; `push` strips `journey.personalPlayer`, deletes the current user's old `music_tracks` rows; `pull` returns no music library and leaves local Records untouched.

- [ ] **Step 1: Implement the minimum Supabase contract change**

In `SupabaseSync.ts`:

```ts
export type CloudSyncBundle = {
  diaryLibrary: DiaryLibraryState;
  journey: JourneyState;
  reflectionWall: ReflectionWallState;
};
```

Add `delete().eq(...)` to the local client type, call:

```ts
await this.throwOnError(client.from("music_tracks").delete().eq("user_id", userId));
```

at the end of `push`, remove the music upsert, strip `journey.personalPlayer` before the journey upsert, and remove the music query/result from `pull`.

In `app.ts`, remove `musicLibrary` and `personalPlayer` from `makeCloudBundle()`, remove cloud-pull assignments to `this.musicLibrary` and `this.personalPlayer`, and leave local save, local playback, backup, and restore paths unchanged.

- [ ] **Step 2: Run the focused test and verify it passes**

Run:

```bash
npm test -- --test-name-pattern="music tracks|Records"
```

Expected: PASS with one user-scoped delete and no music select/upsert.

### Task 3: Clarify the UI and verify the full app

**Files:**
- Modify: `apps/html-prototype/src/systems/SupabaseSync.ts`
- Modify: `apps/html-prototype/src/app.ts`

**Interfaces:**
- Consumes: the cloud boundary from Task 2.
- Produces: user-facing wording that cloud sync excludes local Records.

- [ ] **Step 1: Update sync status/help copy**

Make the cloud status and backup/sync explanation state that imported Records audio and covers remain local; do not suggest that cloud sync restores them.

- [ ] **Step 2: Run all tests and build checks**

Run:

```bash
npm test
npm run typecheck
npm run build
```

Expected: all tests pass, typecheck succeeds, and the production build completes.

- [ ] **Step 3: Inspect the final diff**

Run:

```bash
git diff --check
git status --short
```

Confirm only the approved spec, plan, sync code, app wiring, and regression tests are changed; local attachment/package/zip files remain untracked.
