# Mobile Layout Regression Fix Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix fullscreen touch controls, gameplay-only input, explicit touch-control editing, Walk Back Home routing, hamburger visibility, production scene-layout loading, and complete Timeline Select All on the current `mobile-layout` HEAD.

**Architecture:** Keep one touch-control DOM node under `.game-shell`. Separate gameplay input from an explicit app-controlled edit session, with position persistence remaining behind the existing localStorage key. Derive gameplay chrome from scene/overlay state, copy authored layouts to both existing and runtime production paths, and select all entries from the full filtered Timeline model rather than the paginated renderer.

**Tech Stack:** TypeScript, DOM APIs, Node test runner, npm workspace scripts, static build script, existing authored JSON fixtures.

## Global Constraints

- Preserve every file under `apps/html-prototype/public/scene-layouts/` byte-for-byte.
- Preserve existing portrait assets, including the four `*-potrait.png` files.
- Keep the app runnable after every milestone.
- Use deterministic local behavior; do not introduce paid dependencies.
- Do not use long-press, hold duration, joystick movement, or A-button gestures to enter edit mode.
- Do not push; commit locally only after final verification.

---

### Task 1: Capture authored-data baseline and add regression tests

**Files:**
- Modify: `apps/html-prototype/tests/ui-policy.test.ts`
- Modify: `apps/html-prototype/tests/scene-debug-editor.test.ts`
- Modify: `apps/html-prototype/tests/scene-layouts.test.ts`
- Create: `apps/html-prototype/tests/mobile-regressions.test.ts`

**Interfaces:**
- Tests consume `InputManager`, `SceneLayouts`, the build script, app source, and authored JSON through stable source/runtime boundaries.
- Tests produce failing regression evidence before production implementation.

- [ ] **Step 1: Add failing assertions for the requested behavior.**

  Cover: one touch-control mount under `.game-shell`; absence of the 240ms drag path; explicit edit-mode API and persistence key; `open-map` → `showMap()` while `forest` → `returnToForest()`; derived hamburger visibility; root-level production scene-layout copy; authored portrait fields for all four scenes and Muji Room interaction IDs; and Timeline Select All selecting the complete filtered set.

- [ ] **Step 2: Add a focused pure selection regression test.**

  Use a result set larger than `journalBatchSize` and assert Select All returns every filtered ID, while the rendered visible slice remains paginated.

- [ ] **Step 3: Run the focused tests and confirm expected failures.**

  Run `npm test -w apps/html-prototype`.

  Expected: failures identify the old `open-map` route, long-press drag implementation, paginated Select All behavior, missing production copy, and missing explicit edit-mode behavior.

### Task 2: Separate gameplay touch input from explicit control editing

**Files:**
- Modify: `apps/html-prototype/src/systems/InputManager.ts`
- Modify: `apps/html-prototype/src/app.ts`
- Modify: `apps/html-prototype/src/styles.css`
- Test: `apps/html-prototype/tests/mobile-regressions.test.ts`

**Interfaces:**
- `InputManager.mountTouchControls(onInteract, mountParent?)` mounts one control container and keeps it under the supplied fullscreen parent.
- `InputManager.beginTouchControlEdit()`, `saveTouchControlEdit()`, `cancelTouchControlEdit()`, `resetTouchControlEdit()`, `isTouchControlEditing()`, and `clampTouchControlsToViewport()` expose the explicit editing lifecycle used by Settings.
- Normal pointerdown/move/up/cancel only updates movement or queues interaction; edit pointerdown/move/up/cancel only changes draft positions.

- [ ] **Step 1: Implement gameplay-only pointer lifecycle.**

  Remove `dragTimer`, `prepareTouchControlDrag`, `dragControl`, and every 240ms path. Joystick pointer release/cancel/leave resets movement immediately. A button pointer events do not move controls and click queues only interaction in gameplay.

- [ ] **Step 2: Implement explicit edit-session drafts.**

  Read the existing storage key on mount, snapshot positions on edit entry, keep edits in memory until Save, make Cancel restore the snapshot, make Reset use lower-left/lower-right defaults, persist only on Save, and clamp positions using `window.innerWidth`, `window.innerHeight`, element dimensions, and a safe margin.

- [ ] **Step 3: Mount exactly one control container below `.game-shell`.**

  Pass `.game-shell` or `.stage-wrap` as the mount parent and ensure no second mount is created during rerender or edit-mode transitions.

- [ ] **Step 4: Add editing affordances and viewport-safe CSS.**

  Add a clear editing class/attribute and Save, Cancel, Reset to Default actions. Keep touch-control z-index/overlay behavior, lower-left/lower-right defaults, forgiving control sizes, and fullscreen portrait/landscape positioning.

- [ ] **Step 5: Run focused input/edit tests and typecheck.**

  Run `npm test -w apps/html-prototype -- --test-name-pattern "touch|control|fullscreen"` and `npm run typecheck -w apps/html-prototype`.

### Task 3: Derive gameplay hamburger/touch visibility and fix routing

**Files:**
- Modify: `apps/html-prototype/src/app.ts`
- Modify: `apps/html-prototype/src/styles.css`
- Modify: `apps/html-prototype/tests/ui-policy.test.ts`
- Test: `apps/html-prototype/tests/mobile-regressions.test.ts`

**Interfaces:**
- `isGameplayScene(scene)` identifies `forest`, `bakery`, `labis`, and `muji-room`.
- `syncGameplayChromeVisibility()` derives hamburger and touch-control visibility from gameplay scene, overlay state, fullscreen/edit state, and the existing mobile/force-touch condition.

- [ ] **Step 1: Route `open-map` to `showMap()`.**

  Preserve `forest` as the only action that calls `returnToForest()` and verify the existing chapter/memory modal remains the rendered destination.

- [ ] **Step 2: Make hamburger visibility state-derived.**

  Render or mark the menu hidden when the scene is not gameplay or a full overlay is open; restore it only when the underlying scene is gameplay and the overlay is empty. Keep fullscreen menu z-index separate from touch controls so all three remain interactive.

- [ ] **Step 3: Apply visibility synchronization at render/state boundaries.**

  Update the root dataset/class from `drawHud()` or an equivalent central state boundary, and call it after overlay open/close and scene transitions rather than scattering one-off hides.

- [ ] **Step 4: Run routing/visibility tests.**

  Run `npm test -w apps/html-prototype -- --test-name-pattern "map|hamburger|overlay|gameplay"`.

### Task 4: Fix production scene-layout deploy path and authored loading tests

**Files:**
- Modify: `apps/html-prototype/scripts/build.mjs`
- Modify: `apps/html-prototype/tests/scene-debug-editor.test.ts`
- Modify: `apps/html-prototype/tests/scene-layouts.test.ts`
- Test: `apps/html-prototype/tests/mobile-regressions.test.ts`

**Interfaces:**
- Build output contains both `dist/public/scene-layouts/...` and `dist/scene-layouts/...`.
- `loadSceneLayoutOverrides("scene-layouts")` resolves the root-level production URL.

- [ ] **Step 1: Add production build assertions.**

  Build to the existing `dist` directory and assert `dist/scene-layouts/manifest.json` plus forest portrait, Muji Room portrait, bakery portrait, and Labis portrait exist.

- [ ] **Step 2: Copy the authored scene-layout directory to the runtime root.**

  Keep the existing `dist/public` copy, then copy `public/scene-layouts` to `dist/scene-layouts` without transforming the JSON.

- [ ] **Step 3: Add runtime authored-field assertions.**

  Load the committed JSON through the same URL shape and assert non-default spawn/obstacles/interactions/triggers/anchors, including Muji Room `door`, `lamp`, `journal`, `window`, `records`, `residue`, and `reflection`.

- [ ] **Step 4: Run the build-path and preservation checks.**

  Run `npm run build -w apps/html-prototype`, the focused layout tests, and compare all authored layout SHA-256 hashes with the captured baseline.

### Task 5: Make Timeline Select All select the complete filtered set

**Files:**
- Modify: `apps/html-prototype/src/app.ts`
- Modify: `apps/html-prototype/src/systems/JournalModel.ts` if a pure helper is needed
- Modify: `apps/html-prototype/tests/journal-navigation.test.ts` or `apps/html-prototype/tests/journal-model.test.ts`

**Interfaces:**
- Select All consumes `currentTimelineMonthView()` and stores every matching entry ID in `selectedTimelineEntryIds`.
- Rendering may continue using `visibleTimelineEntries(month, timelineVisibleCount)` for pagination.

- [ ] **Step 1: Add a failing test with more entries than one page.**

  Assert all filtered IDs are selected even when only the first `journalBatchSize` entries are rendered.

- [ ] **Step 2: Change Select All to use the complete filtered result.**

  Replace the paginated `visibleTimelineEntries(...).map(...)` source with `this.currentTimelineMonthView().entries.map(...)`, preserving filter/sort scope and delete confirmation behavior.

- [ ] **Step 3: Run the Timeline regression test.**

  Run `npm test -w apps/html-prototype -- --test-name-pattern "Select All|timeline"` and confirm it passes.

### Task 6: Full verification, diff review, and local commit

**Files:**
- Review all modified files; do not stage unrelated pre-existing worktree changes.

- [ ] **Step 1: Run required commands.**

  Run exactly:

  ```powershell
  npm run typecheck -w apps/html-prototype
  npm test -w apps/html-prototype
  npm run build -w apps/html-prototype
  ```

- [ ] **Step 2: Verify authored-data preservation.**

  Compare all source layout hashes and inspect `git diff -- apps/html-prototype/public/scene-layouts`. Expected: no diff.

- [ ] **Step 3: Perform manual viewport/fullscreen flow checks.**

  Verify 390x844 and 844x390, fullscreen in both orientations, gameplay joystick/A/menu interaction, edit Save/Cancel/Reset, Walk Back Home modal routing, Muji Room portrait authored interactions, and hamburger hide/restore across content overlays.

- [ ] **Step 4: Inspect the final diff and commit only implementation/docs/tests.**

  Use `git diff --check`, `git diff --stat`, and `git status --short`. Stage only files changed by this task, then commit with a focused message such as `fix(html): repair mobile gameplay regressions`.

- [ ] **Step 5: Report commit hash and push status.**

  Report the exact commit hash, state that no push was performed pending user confirmation, list changed files/tests, and include command results plus authored-data preservation evidence.
