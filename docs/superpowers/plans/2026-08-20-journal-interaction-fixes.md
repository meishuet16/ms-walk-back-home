# Journal Interaction Fixes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Make journal navigation discard unsaved new entries safely, make media and book-cover actions update immediately, keep Records lyrics synchronized during playback, and make Timeline keyword filtering match the literal query.

**Architecture:** Keep the existing event-delegated app shell and journal state model. Add a small editor-entry snapshot/confirmation boundary in `WalkBackHomeApp`, centralize immediate re-rendering after media/cover mutations, and refresh lyric rows from the existing audio time-update path plus the app loop while Records is open. Keep search as a pure `JournalModel` helper with literal substring semantics.

**Tech Stack:** TypeScript, Node test runner, existing HTML prototype DOM/event delegation.

## Global Constraints

- Preserve existing authored scene-layout JSON and assets.
- Do not reset or regenerate saved Scene Debug Editor layouts.
- Keep changes limited to the reported journal, records, media, cover, and search regressions.
- Use the existing local-first persistence mechanisms.

---

### Task 1: Add failing regression tests

**Files:**
- Modify: `apps/html-prototype/tests/journal-model.test.ts`
- Modify: `apps/html-prototype/tests/ui-policy.test.ts`
- Modify: `apps/html-prototype/tests/mobile-regressions.test.ts`

- [ ] Add tests for literal keyword matching (`喜欢` matches entries containing `喜欢`; `欢` may match `欢喜`; `喜欢` must not match `欢喜`).
- [ ] Add source-level regression assertions for editor back/discard confirmation, immediate media/crop rerenders, monthly cover rerenders, and Records lyric refresh while open.
- [ ] Run `npm test -w apps/html-prototype` and confirm the new expectations fail against the current implementation.

### Task 2: Add editor discard confirmation

**Files:**
- Modify: `apps/html-prototype/src/app.ts`

- [ ] Snapshot the entry/library state when opening a journal editor and track whether the editor is for a new entry.
- [ ] Route the editor back action through a discard confirmation modal when a new entry has been created or editor changes are pending.
- [ ] On confirmed discard, clear the pending autosave, restore the pre-editor library snapshot, and return to Timeline without the new diary.
- [ ] On cancel, keep the editor open and preserve its current draft.
- [ ] Ensure saving clears the pending editor snapshot and keeps the diary.

### Task 3: Refresh journal media, crop, cover, and lyrics immediately

**Files:**
- Modify: `apps/html-prototype/src/app.ts`
- Modify: `apps/html-prototype/src/systems/PersonalMusic.ts` only if a pure helper is required.

- [ ] Ensure media select/crop/remove actions render their next state within the same delegated event.
- [ ] Ensure cover file and cover-crop changes save and redraw the current reader immediately.
- [ ] Refresh Records lyric rows continuously while the Records panel is open, without requiring another click.
- [ ] Keep existing playback, seek, and persistence behavior intact.

### Task 4: Verify

- [ ] Run `npm run typecheck -w apps/html-prototype`.
- [ ] Run `npm test -w apps/html-prototype`.
- [ ] Run `npm run build -w apps/html-prototype`.
- [ ] Manually verify journal discard, media crop/remove, cover update/crop, Records live lyrics, and literal Timeline search.
- [ ] Inspect the final diff and confirm no scene-layout JSON/assets changed.
