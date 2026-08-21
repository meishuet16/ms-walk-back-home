# Journal Audio Edit Controls and Delete Confirmation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Make Journal audio attachments selectable/removable like visual media, require a centered delete confirmation, and place Record voice between photo and video controls in one row.

**Architecture:** Reuse the existing `selectedJournalMediaId`, inline media tools, and Journal editor confirmation-modal pattern. Add a dedicated pending delete target so confirmation does not mutate diary state until confirmed. Keep native `<audio controls>` clicks outside selection handling, and keep the existing local Blob/reference architecture unchanged.

**Tech Stack:** TypeScript, DOM string rendering in `apps/html-prototype/src/app.ts`, CSS media queries, Node test runner with source-level UI policy tests.

## Global Constraints

- Preserve existing photo/video data-URL storage and behavior.
- Audio remains metadata/reference-only in `DiaryEntry`; do not change Blob storage, backup, restore, or Supabase architecture.
- Do not fix mixed photo/video ordering.
- Do not autoplay audio.
- The attached image is a visual layout reference; the user's written request is authoritative.

---

### Task 1: Define the failing UI regression tests

**Files:**
- Modify: `apps/html-prototype/tests/journal-audio-editor.test.ts`

- [ ] **Step 1: Add tests for audio selection/removal confirmation and three-column toolbar layout**

Add assertions that `app.ts` contains:

```ts
assert.match(appSource, /journal-audio-delete-confirmation/);
assert.match(appSource, /journal-audio-delete-confirm/);
assert.match(appSource, /journal-audio-delete-cancel/);
assert.match(appSource, /pendingJournalMediaDeleteId/);
assert.match(appSource, /journal-audio-recording-panel/);
assert.match(stylesSource, /mobile-editor-toolbar[\\s\\S]*grid-template-columns:\\s*repeat\\(3/);
```

Also assert the audio selector is not the native player itself:

```ts
assert.match(appSource, /event\.target as HTMLElement\)\.closest\("audio"\)/);
```

- [ ] **Step 2: Run the focused test and verify it fails for the missing behavior**

Run from `apps/html-prototype` after building:

```powershell
npm run build
node --test dist/tests/journal-audio-editor.test.js
```

Expected: the existing three tests pass, and the new assertions fail because the confirmation target and three-column toolbar are not implemented yet.

- [ ] **Step 3: Commit the red test**

```powershell
git add apps/html-prototype/tests/journal-audio-editor.test.ts
git commit -m "test: specify journal audio edit confirmation"
```

### Task 2: Implement selection-safe audio removal confirmation

**Files:**
- Modify: `apps/html-prototype/src/app.ts:handleClick`, Journal editor state fields, `renderJournalInlineMedia`, `removeSelectedJournalMedia`

**Interfaces:**
- Reuse `selectedJournalMediaId` for selected audio.
- Add `pendingJournalMediaDeleteId: string` for an audio delete request awaiting confirmation.
- Add `confirmJournalMediaDelete()` and `cancelJournalMediaDelete()` methods.

- [ ] **Step 1: Add the pending-delete state and failing-action wiring**

Add the field:

```ts
private pendingJournalMediaDeleteId = "";
```

Add click handling before generic Journal media actions:

```ts
if (action === "journal-audio-delete-confirm") {
  this.confirmJournalMediaDelete();
  return;
}
if (action === "journal-audio-delete-cancel") {
  this.cancelJournalMediaDelete();
  return;
}
```

- [ ] **Step 2: Render a centered confirmation modal instead of deleting audio immediately**

Change the audio branch in `removeSelectedJournalMedia(mediaId)` to set `pendingJournalMediaDeleteId`, rerender the editor, and return. Keep existing image/video removal behavior unchanged. Add an editor fragment after the crop modal:

```ts
private renderJournalAudioDeleteConfirmation(entry?: DiaryEntry): string {
  if (!entry || !this.pendingJournalMediaDeleteId) return "";
  const media = diaryMediaItems(entry).find((item) => item.id === this.pendingJournalMediaDeleteId && item.type === "audio");
  if (!media) return "";
  return `<div class="modal game-panel journal-audio-delete-confirmation" role="dialog" aria-modal="true" aria-label="Confirm voice note deletion">
    <div><strong>Delete this voice note?</strong><p>This removes the recording from this journal.</p></div>
    <div class="delete-confirmation-actions"><button data-action="journal-audio-delete-cancel">Cancel</button><button class="danger" data-action="journal-audio-delete-confirm">Delete</button></div>
  </div>`;
}
```

Render it inside `.diary-page-editor` after `renderJournalCropModal(editing)`.

- [ ] **Step 3: Confirm deletion only after the user chooses Delete**

Implement `confirmJournalMediaDelete()` to:

1. Find the active editor entry and requested media id.
2. Remove a pending audio item from `pendingJournalAudio`, delete its temp Blob, and clear its object URL maps; or remove a saved audio item through the existing draft/update path.
3. If the saved audio `storageKey` is no longer referenced by the diary library, call `journalMediaBlobStore.deleteBlob(storageKey)`.
4. Clear the pending delete id and selected media id.
5. Rerender the editor and show `Media removed`.

Implement `cancelJournalMediaDelete()` by clearing only the pending delete id and rerendering the current editor.

- [ ] **Step 4: Run focused tests and verify green**

```powershell
npm run build
node --test dist/tests/journal-audio-editor.test.js
```

Expected: all focused Journal audio editor tests pass.

- [ ] **Step 5: Commit the behavior**

```powershell
git add apps/html-prototype/src/app.ts apps/html-prototype/tests/journal-audio-editor.test.ts
git commit -m "feat: confirm journal audio deletion"
```

### Task 3: Put Record voice in the photo/video toolbar row

**Files:**
- Modify: `apps/html-prototype/src/app.ts:showDiaryEditor`
- Modify: `apps/html-prototype/src/styles.css:mobile editor toolbar rules`
- Modify: `apps/html-prototype/tests/journal-audio-editor.test.ts`

- [ ] **Step 1: Extend the failing test for the three-button order**

Assert the editor source places the controls in this order:

```ts
const toolbar = appSource.match(/<div class="mobile-editor-toolbar">[\\s\\S]*?<\\/div>/)?.[0] ?? "";
assert.ok(toolbar.indexOf('aria-label="Add photo"') < toolbar.indexOf('aria-label="Record audio"'));
assert.ok(toolbar.indexOf('aria-label="Record audio"') < toolbar.indexOf('aria-label="Add video"'));
```

- [ ] **Step 2: Move the recording control into the toolbar markup**

Keep the existing recording state machine, but render the idle recording button as the third toolbar cell. The toolbar should contain:

```html
<button data-action="journal-add-inline-media" aria-label="Add photo">…</button>
<button data-action="journal-record-audio" aria-label="Record audio">🎙<span>Record voice</span></button>
<button data-action="journal-add-inline-media" aria-label="Add video">…</button>
```

When recording is active, update only the middle cell to show Stop/Pause or Resume and the timer. Keep the desktop recording panel available if the desktop layout does not use the mobile toolbar.

- [ ] **Step 3: Adjust mobile CSS to one row without changing visual media sizing**

Set the mobile toolbar to three equal columns:

```css
@media (max-width: 700px) {
  .mobile-editor-toolbar {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}
```

Remove the separate bottom-positioned recording panel from the mobile editor layout, but retain its desktop rule where needed. Do not change `.journal-inline-photo`, video, or media-dock sizing.

- [ ] **Step 4: Run focused tests and verify green**

```powershell
npm run build
node --test dist/tests/journal-audio-editor.test.js dist/tests/ui-policy.test.js
```

Expected: all focused editor/UI policy tests pass.

- [ ] **Step 5: Commit the layout change**

```powershell
git add apps/html-prototype/src/app.ts apps/html-prototype/src/styles.css apps/html-prototype/tests/journal-audio-editor.test.ts
git commit -m "fix: align journal voice recording controls"
```

### Task 4: Final regression verification

**Files:**
- No production changes expected.

- [ ] **Step 1: Run the feature-focused suite**

```powershell
cd apps/html-prototype
npm run build
node --test dist/tests/journal-audio-editor.test.js dist/tests/journal-media*.test.js dist/tests/journal-backup-roundtrip.test.js dist/tests/supabase-sync.test.js dist/tests/ui-policy.test.js
```

Expected: all feature-focused tests pass.

- [ ] **Step 2: Run typecheck, full build, full suite, and whitespace validation**

From the repository root:

```powershell
npm run typecheck -w apps/html-prototype
npm run build -w apps/html-prototype
npm test -w apps/html-prototype
git diff --check
```

Expected: typecheck/build/diff checks pass. The full suite may retain the already documented six authored-scene baseline failures; no new audio/editor failures are acceptable.

- [ ] **Step 3: Inspect the final worktree**

```powershell
git status --short
git log --oneline -6
```

Do not add or remove the unrelated untracked `apps/html-prototype/public/assets/406/` directory.
