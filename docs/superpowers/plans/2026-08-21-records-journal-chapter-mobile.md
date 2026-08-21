# Records, Journal, Chapter, and Reflection Mobile Fix Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Repair the mobile portrait Records, Chapter, Journal, Reflection Wall, and shell-menu behaviors while preserving local-first data and authored fixtures.

**Architecture:** Keep `WalkHomeApp` as the orchestration boundary, but move batch music operations, Chapter trigger-session state, Journal return snapshots, and Reflection Wall position math into small pure system helpers. Update Records playback UI in place on audio time updates, keep structural redraws scroll-aware, and keep the 🎵 toggle in the existing app-level `top-actions` area only.

**Tech Stack:** TypeScript, DOM APIs, Node `node:test`, npm workspace scripts, existing local storage/blob adapters, existing static build.

## Global Constraints

- Keep the MVP local-first and deterministic; do not add paid services or automatic AI calls.
- Built-in music fixture data is immutable; user edits are local overrides.
- Mixed batch deletion removes selected user tracks, preserves selected built-ins, and reports the skipped built-in count.
- Automatic Chapter cutscene eligibility is session-local: consume it on the first trigger, block it for the entire active Chapter session including after cutscene completion, and reset only after leaving and freshly re-entering.
- The 🎵 toggle is exactly one control in the existing app-level responsive top-right control area; never duplicate it inside modals or fullscreen gameplay surfaces.
- Do not modify authored scene-layout JSON, image/audio fixtures, private runtime data, or remote state.
- Do not push; create local commits only after verification.

---

### Task 1: Add pure state helpers and failing regression tests

**Files:**
- Modify: `apps/html-prototype/tests/personal-music.test.ts`
- Modify: `apps/html-prototype/tests/chapter-progress.test.ts`
- Modify: `apps/html-prototype/tests/journal-navigation.test.ts`
- Modify: `apps/html-prototype/tests/reflection-wall.test.ts`
- Create: `apps/html-prototype/tests/records-state.test.ts`
- Modify: `apps/html-prototype/src/systems/PersonalMusic.ts`
- Modify: `apps/html-prototype/src/systems/ChapterProgressManager.ts`
- Modify: `apps/html-prototype/src/systems/JournalNavigation.ts`
- Modify: `apps/html-prototype/src/systems/ReflectionWall.ts`

**Interfaces:**
- `selectAllMusicTrackIds(ids: string[]): string[]` returns a copy of the complete filtered list.
- `removeSelectedMusicTracks(library, selectedIds, builtInIds, now?)` returns `{ library, removed, skippedBuiltInCount, blobKeysToDelete, nextTrackId }`.
- `applyBatchMusicMetadata(library, selectedIds, metadata, builtInMeta, now?)` returns `{ library, builtInMeta }` and applies only non-empty fields.
- `createChapterTriggerSession(chapterId: string): ChapterTriggerSession`, `consumeAutomaticChapterTrigger(session)`, and `resetChapterTriggerSession(session)` model one automatic trigger per active Chapter session.
- `JournalReturnSnapshot` stores `mode`, `monthKey`, `year`, and `scrollTop`; `createJournalReturnSnapshot(...)` and `journalReturnTarget(snapshot)` provide stable navigation data.
- `clampReflectionNotePosition(position, dimensions?)` clamps center coordinates so the note remains inside the wall with an edge margin.

- [ ] **Step 1: Write failing tests for complete Records selection and mixed deletion.**

```ts
test("mixed Records deletion removes users and reports skipped built-ins", () => {
  const result = removeSelectedMusicTracks(
    { version: 1, savedAt: "2026-08-21T00:00:00.000Z", tracks: [
      { id: "user-a", title: "A", audioBlobKey: "audio-a", addedAt: 1 },
      { id: "user-b", title: "B", audioBlobKey: "audio-b", addedAt: 2 }
    ] },
    ["user-a", "built-in-a"],
    ["built-in-a"],
    new Date("2026-08-21T00:00:00.000Z")
  );

  assert.deepEqual(result.removed.map((track) => track.id), ["user-a"]);
  assert.equal(result.skippedBuiltInCount, 1);
  assert.deepEqual(result.library.tracks.map((track) => track.id), ["user-b"]);
});
```

- [ ] **Step 2: Write failing tests for batch Artist/Album metadata and Select All.**

```ts
test("batch metadata updates imported tracks and built-in local overrides", () => {
  const library = { version: 1 as const, savedAt: "now", tracks: [{ id: "user-a", title: "A", artist: "old", album: "old album", audioBlobKey: "a", addedAt: 1 }] };
  const result = applyBatchMusicMetadata(library, ["user-a", "built-in-a"], { artist: "new", album: "new album" }, {});

  assert.equal(result.library.tracks[0].artist, "new");
  assert.equal(result.library.tracks[0].album, "new album");
  assert.deepEqual(result.builtInMeta["built-in-a"], { artist: "new", album: "new album" });
});

test("Select All copies every filtered Records id", () => {
  const ids = ["a", "b", "c", "d"];
  const selected = selectAllMusicTrackIds(ids);
  assert.deepEqual(selected, ids);
  assert.notEqual(selected, ids);
});
```

- [ ] **Step 3: Write failing tests for Chapter session trigger semantics.**

```ts
test("automatic Chapter trigger stays consumed after cutscene completion", () => {
  let session = createChapterTriggerSession("labis-motor-day");
  assert.equal(consumeAutomaticChapterTrigger(session).allowed, true);
  session = consumeAutomaticChapterTrigger(session).session;
  assert.equal(consumeAutomaticChapterTrigger(session).allowed, false);
  session = resetChapterTriggerSession(session);
  assert.equal(consumeAutomaticChapterTrigger(session).allowed, true);
});
```

- [ ] **Step 4: Write failing tests for Journal return snapshots and Reflection Wall edge clamping.**

```ts
test("reader return snapshot keeps Books surface and scroll", () => {
  const snapshot = createJournalReturnSnapshot("books", "2026-08", "2026", 428);
  assert.deepEqual(journalReturnTarget(snapshot), { mode: "books", monthKey: "2026-08", year: "2026", scrollTop: 428 });
});

test("reflection note center is clamped by its rendered dimensions", () => {
  assert.deepEqual(clampReflectionNotePosition({ x: 99, y: 99 }, { widthPercent: 32, heightPercent: 28, edgePercent: 4 }), { x: 80, y: 82 });
});
```

- [ ] **Step 5: Run the focused tests and confirm RED.**

Run: `npm test -w apps/html-prototype -- --test-name-pattern "mixed Records|batch metadata|Select All copies|automatic Chapter trigger|reader return snapshot|reflection note center"`

Expected: TypeScript/test failures report the missing helper exports and no production behavior is changed yet.

- [ ] **Step 6: Implement the smallest pure helpers and rerun the focused tests.**

Implement the exact interfaces above without DOM access, preserve existing `removeUserMusicTrack`, `finishChapterWalkthrough`, Journal navigation state, and note storage behavior, then run the same command.

Expected: the new focused tests pass and the existing focused system tests remain green.

- [ ] **Step 7: Commit the pure helper/test milestone.**

Run: `git add apps/html-prototype/src/systems apps/html-prototype/tests/records-state.test.ts apps/html-prototype/tests/personal-music.test.ts apps/html-prototype/tests/chapter-progress.test.ts apps/html-prototype/tests/journal-navigation.test.ts apps/html-prototype/tests/reflection-wall.test.ts; git commit -m "test: define mobile state regression contracts"`

---

### Task 2: Make Records playback UI live and scroll-stable

**Files:**
- Modify: `apps/html-prototype/src/app.ts`
- Modify: `apps/html-prototype/src/styles.css`
- Modify: `apps/html-prototype/tests/ui-policy.test.ts`
- Modify: `apps/html-prototype/tests/mobile-regressions.test.ts`

**Interfaces:**
- `refreshRecordsLyricsUI(currentTime)` updates desktop, mobile, and floating lyric surfaces in place.
- `preserveRecordsScroll()` captures the current panel scroll before structural redraw.
- `restoreRecordsScroll(renderToken)` restores only the latest Records render after its awaited media work and animation frame.

- [ ] **Step 1: Add failing source/CSS regression assertions.**

Assert that `refreshRecordsLyricsUI` queries `.records-mobile-lyrics`, mobile lyric rows carry `data-lyric-index`, the delete dialog is a sibling of the Records scroll content, and the CSS uses a fixed/bottom-sheet rule for `.records-delete-confirmation` while `.records-panel` remains the scroll container.

- [ ] **Step 2: Run the focused UI tests and confirm RED.**

Run: `npm test -w apps/html-prototype -- --test-name-pattern "records.*live|delete.*confirmation|mobile.*lyrics"`

Expected: failures identify the current desktop-only lyric refresh and in-flow delete dialog.

- [ ] **Step 3: Implement the live lyric update.**

Render desktop rows with `data-lyric-index` and mobile rows from `lyricWindowForTime`. In `refreshRecordsLyricsUI`, update active/near classes for `.lyrics-pane p`, replace the mobile three-line window only when its source indices change, and call `updatePersonalMusicOverlay()` for the floating surface. Do not call `showRecords()` from the time-update path.

- [ ] **Step 4: Implement tokenized Records scroll restoration and fixed confirmation markup.**

Add a monotonically increasing `recordsRenderToken`. Capture `scrollTop` before play, pause, next/previous, menu, cover, metadata, and delete actions. `showRecords()` captures the token before awaiting cover/background URLs, renders the dialog outside the scrollable content, then restores scroll only when its token is current. Reset the saved offset only when closing Records.

- [ ] **Step 5: Add portrait CSS constraints.**

Keep `.records-panel` scrollable, give `.records-delete-confirmation` fixed inset-safe positioning with `max-height` and internal overflow, and ensure the mobile lyric viewport cannot cause horizontal overflow.

- [ ] **Step 6: Run focused tests and typecheck.**

Run: `npm test -w apps/html-prototype -- --test-name-pattern "records.*live|delete.*confirmation|mobile.*lyrics|records.*scroll"`

Run: `npm run typecheck -w apps/html-prototype`

Expected: focused tests and typecheck pass.

- [ ] **Step 7: Commit the Records live-update milestone.**

Run: `git add apps/html-prototype/src/app.ts apps/html-prototype/src/styles.css apps/html-prototype/tests/ui-policy.test.ts apps/html-prototype/tests/mobile-regressions.test.ts; git commit -m "fix(html): keep records playback live and anchored"`

---

### Task 3: Add Records multi-select, batch edit, and mixed delete

**Files:**
- Modify: `apps/html-prototype/src/types.ts`
- Modify: `apps/html-prototype/src/app.ts`
- Modify: `apps/html-prototype/src/styles.css`
- Modify: `apps/html-prototype/tests/records-state.test.ts`
- Modify: `apps/html-prototype/tests/ui-policy.test.ts`

**Interfaces:**
- `selectedRecordIds: Set<string>` is UI-session state and is cleared on Records close or after a successful batch delete.
- `customTrackMeta` accepts `{ title?: string; artist?: string; album?: string }` for built-in local overrides.
- `renderRecordsLibraryRows()` exposes non-playing selection controls and `renderRecordsBatchToolbar()` renders batch actions.
- Mixed delete calls `removeSelectedMusicTracks`, removes app-owned blobs for user tracks, preserves built-ins, and calls `showToast("Skipped N built-in records")` when `N > 0`.

- [ ] **Step 1: Add failing markup and behavior assertions.**

Assert `app.ts` contains `selectedRecordIds`, `records-select-all`, `records-batch-delete`, `records-batch-artist`, `records-batch-album`, and the skipped-built-in toast text; assert `types.ts` includes `album` in `customTrackMeta`; assert CSS contains a portrait-safe `.records-batch-toolbar`.

- [ ] **Step 2: Run focused tests and confirm RED.**

Run: `npm test -w apps/html-prototype -- --test-name-pattern "Records.*batch|records.*select|built-in.*records"`

- [ ] **Step 3: Implement selection controls without playback side effects.**

Add click actions for selecting a row, selecting all filtered IDs, clearing selection, requesting/canceling batch delete, and applying batch metadata. Stop selection controls from bubbling into `select-vinyl`; keep the song title button as the playback target.

- [ ] **Step 4: Implement batch metadata.**

Read non-empty Artist/Album values from the batch toolbar. Apply imported updates to `musicLibrary.tracks`, update built-in `personalPlayer.customTrackMeta`, save both states, preserve the current track and scroll, and rerender Records without closing the toolbar unless the action succeeds.

- [ ] **Step 5: Implement mixed batch delete confirmation and cleanup.**

Show a fixed Records confirmation with user/built-in counts. On confirm, call the pure helper, delete returned blob keys through `MusicBlobStore`, select the helper-provided next track only when the current track was removed, preserve built-ins, toast the skipped count, clear selection, and restore Records scroll.

- [ ] **Step 6: Run focused tests and typecheck.**

Run: `npm test -w apps/html-prototype -- --test-name-pattern "Records.*batch|records.*select|built-in.*records"`

Run: `npm run typecheck -w apps/html-prototype`

- [ ] **Step 7: Commit the multi-select milestone.**

Run: `git add apps/html-prototype/src/types.ts apps/html-prototype/src/app.ts apps/html-prototype/src/styles.css apps/html-prototype/tests/records-state.test.ts apps/html-prototype/tests/ui-policy.test.ts; git commit -m "feat(html): add records multi-select editing"`

---

### Task 4: Enforce one automatic Chapter trigger per active session

**Files:**
- Modify: `apps/html-prototype/src/app.ts`
- Modify: `apps/html-prototype/tests/chapter-progress.test.ts`
- Modify: `apps/html-prototype/tests/cutscene-visuals.test.ts`
- Modify: `apps/html-prototype/tests/ui-policy.test.ts`

**Interfaces:**
- `chapterTriggerSessions: Map<string, ChapterTriggerSession>` stores only active-session eligibility and is not persisted as completion state.
- Fresh `enterCurrentMemory()` creates a new session for the Chapter.
- Leaving the Chapter clears the active session; `finishLabisMemoryEvent` and `finishMarch30Cutscene` do not clear it.
- Explicit Replay bypasses automatic eligibility; the automatic trigger path consumes eligibility exactly once.

- [ ] **Step 1: Add failing session lifecycle tests.**

Test that a first automatic start is allowed, a second start is blocked before and after a cutscene completion, and a fresh session after leaving is allowed again. Keep the existing durable `completedMemoryEvents` assertions unchanged.

- [ ] **Step 2: Run Chapter-focused tests and confirm RED.**

Run: `npm test -w apps/html-prototype -- --test-name-pattern "automatic.*Chapter|cutscene.*session|labis.*trigger|March 30.*trigger"`

- [ ] **Step 3: Wire session creation and cleanup.**

Create a new session when entering a Chapter from Forest, clear it in the common Chapter exit path, and never serialize it in `JourneyState`.

- [ ] **Step 4: Gate only automatic starts.**

Have automatic `startLabisMemory(false)` and `startMarch30Memory(false)` consume the session; return without starting if already consumed. Leave explicit Replay calls (`true`) available and preserve completion/unlock updates.

- [ ] **Step 5: Run Chapter tests and typecheck.**

Run: `npm test -w apps/html-prototype -- --test-name-pattern "automatic.*Chapter|cutscene.*session|labis.*trigger|March 30.*trigger"`

Run: `npm run typecheck -w apps/html-prototype`

- [ ] **Step 6: Commit the Chapter milestone.**

Run: `git add apps/html-prototype/src/app.ts apps/html-prototype/tests/chapter-progress.test.ts apps/html-prototype/tests/cutscene-visuals.test.ts apps/html-prototype/tests/ui-policy.test.ts; git commit -m "fix(html): scope chapter auto triggers to entry sessions"`

---

### Task 5: Preserve Journal origin, scroll, and immediate cover updates

**Files:**
- Modify: `apps/html-prototype/src/app.ts`
- Modify: `apps/html-prototype/src/styles.css`
- Modify: `apps/html-prototype/src/systems/JournalNavigation.ts`
- Modify: `apps/html-prototype/tests/journal-navigation.test.ts`
- Modify: `apps/html-prototype/tests/ui-policy.test.ts`

**Interfaces:**
- `journalReturnSnapshot: JournalReturnSnapshot | null` is captured before opening a diary viewer.
- Reader Back calls `restoreJournalOrigin()` and renders the saved Books or Timeline mode/month/year.
- `showTimeline`, `showMonthlyBooks`, and `openMonthlyBook` accept/restore a `scrollTop` without defaulting to zero after a reader return.

- [ ] **Step 1: Add failing reader-origin and Show more assertions.**

Assert separate `journal-reader-back` handling, a `journalReturnSnapshot` field, restoration calls for both `showTimeline` and `showMonthlyBooks`, and a portrait `.timeline-show-more` rule that keeps the button in normal flow and visible.

- [ ] **Step 2: Run focused Journal tests and confirm RED.**

Run: `npm test -w apps/html-prototype -- --test-name-pattern "reader.*return|Journal.*scroll|Show more|cover.*immediate"`

- [ ] **Step 3: Capture the Journal origin before opening a page.**

When `open-diary-page` is handled, read the current `.journal-panel` scrollTop, current `journalMode`, `currentBooksMonth().key` or `timelineCursorMonth().key`, and year state into `journalReturnSnapshot` before calling `showDiaryReader`.

- [ ] **Step 4: Restore the exact origin on Reader Back.**

Render the saved mode/month/year, then set the target panel scrollTop in `requestAnimationFrame`. Clear the snapshot only after successful restoration. Keep a direct `open-timeline` action for menu navigation; it must not be used by the Reader Back button.

- [ ] **Step 5: Keep Show more visible in portrait.**

Give the button a dedicated class, keep it after the entry list in normal flow, add bottom padding to the scroll container, and avoid fixed overlays covering it at 390x844.

- [ ] **Step 6: Make monthly cover changes repaint the active surface immediately.**

After the cover file is read and persisted, use the current Books/Reader month key, update the in-memory `monthlyCovers`, call the active surface renderer once, and reset the input. Ensure the generated cover style uses the new data URL immediately. Apply crop changes through the same route.

- [ ] **Step 7: Run focused tests and typecheck.**

Run: `npm test -w apps/html-prototype -- --test-name-pattern "reader.*return|Journal.*scroll|Show more|cover.*immediate"`

Run: `npm run typecheck -w apps/html-prototype`

- [ ] **Step 8: Commit the Journal milestone.**

Run: `git add apps/html-prototype/src/app.ts apps/html-prototype/src/styles.css apps/html-prototype/src/systems/JournalNavigation.ts apps/html-prototype/tests/journal-navigation.test.ts apps/html-prototype/tests/ui-policy.test.ts; git commit -m "fix(html): restore journal origin and cover updates"`

---

### Task 6: Bound Reflection Wall notes and move Music to the shell control area

**Files:**
- Modify: `apps/html-prototype/src/app.ts`
- Modify: `apps/html-prototype/src/styles.css`
- Modify: `apps/html-prototype/tests/reflection-wall.test.ts`
- Modify: `apps/html-prototype/tests/ui-policy.test.ts`

**Interfaces:**
- Reflection render and drag paths use `clampReflectionNotePosition` with mobile note dimensions and persist the clamped percentages.
- `renderTopNav()` renders one `data-action="music"` button in `.top-actions`, and no modal renderer emits another shell Music toggle.
- `settingsContent()` no longer contains Music, Credits, compact-resolution, Begin Again, or Continue actions.

- [ ] **Step 1: Add failing source/CSS assertions.**

Assert note rendering references the clamp helper, `.reflection-wall-surface` prevents horizontal overflow, mobile note bounds include both right and bottom safe margins, top nav has exactly one `data-action="music"`, and removed menu labels/actions are absent from `settingsContent`.

- [ ] **Step 2: Run focused tests and confirm RED.**

Run: `npm test -w apps/html-prototype -- --test-name-pattern "reflection.*bounds|Music.*shell|removed.*menu"`

- [ ] **Step 3: Apply edge-safe Reflection Wall positions.**

Use the pure helper when rendering all notes and while dragging. Keep stored coordinates in percentages, prevent horizontal overflow, and add mobile-safe padding/overflow rules so the full note body and controls remain tappable.

- [ ] **Step 4: Move Music to one app-level responsive control.**

Add the `🎵` button to the existing `.top-actions` control area, with the enabled state reflected in `aria-pressed`/label. `renderTopNav()` must remain the only renderer for this control; modal templates and fullscreen state changes must not create another button. Reuse the existing top-right safe-area CSS.

- [ ] **Step 5: Remove obsolete menu actions without breaking internal flows.**

Remove only the menu entries for Music, Credits, resolution, Begin Again, and Continue. Keep internal handlers until full tests prove they are dead; do not remove active Today/Journal/Forest/Room/Reflection/Settings/Backup navigation.

- [ ] **Step 6: Run focused tests and typecheck.**

Run: `npm test -w apps/html-prototype -- --test-name-pattern "reflection.*bounds|Music.*shell|removed.*menu"`

Run: `npm run typecheck -w apps/html-prototype`

- [ ] **Step 7: Commit the Reflection/menu milestone.**

Run: `git add apps/html-prototype/src/app.ts apps/html-prototype/src/styles.css apps/html-prototype/tests/reflection-wall.test.ts apps/html-prototype/tests/ui-policy.test.ts; git commit -m "fix(html): bound reflection notes and simplify shell music"`

---

### Task 7: Full verification, mobile smoke test, and final local commit

**Files:**
- Review all modified files; do not stage `.codex-remote-attachments/`, `apps/html-prototype/mobile-package/`, or `apps/html-prototype/walk-back-home-mobile-html.zip`.

- [ ] **Step 1: Run the complete verification commands.**

```powershell
npm run typecheck -w apps/html-prototype
npm test -w apps/html-prototype
npm run build -w apps/html-prototype
```

Expected: all commands exit 0; the full test suite reports 0 failures.

- [ ] **Step 2: Verify authored fixture preservation.**

Run: `git diff --check; git diff --name-only -- apps/html-prototype/public apps/html-prototype/public/scene-layouts`

Expected: no authored fixture files are modified.

- [ ] **Step 3: Run the mobile browser smoke flow.**

At 390x844 portrait verify: Records lyrics advance while audio plays; delete confirmation is visible without scrolling to the bottom; play/delete/change-track preserve Records position; Select All and mixed batch deletion preserve built-ins and report skips; Chapter cutscene starts on every fresh re-entry but not twice within one entry; Timeline Show more is visible; Books cover changes immediately; Books/Timeline viewer Back restores origin and scroll; Reflection notes remain inside the wall; exactly one top-right 🎵 toggle appears in shell/fullscreen and none in modals.

- [ ] **Step 4: Review diff and commit the final implementation.**

Run: `git diff --stat; git status --short`; stage only source/tests/style files from this plan and commit with `git commit -m "fix(html): repair mobile records journal and chapter flows"`.

- [ ] **Step 5: Report verification evidence and push status.**

Report the final commit hash, exact test/build results, fixture preservation result, and that no push was performed.
