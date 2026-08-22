# Reflection Wall Simplification Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Remove the draggable freeform Reflection Wall view, expose the existing Stack as the renamed Wall view, keep List, cap pinned notes at ten, keep the filter menu open during filter changes, and make Pin/Favourite states visually prominent.

**Architecture:** Keep persisted note data compatible, but reduce ReflectionWallView to the user-facing Wall (implemented by the existing Stack renderer) and List. Remove the old freeform canvas/drag path from the app UI and pointer handling. Add a pure pin-cap rule in the Reflection Wall system, and render shared flag badges plus active detail controls for both views.

**Tech Stack:** TypeScript, DOM-rendered HTML templates, CSS, Node test runner.

## Global Constraints

- Do not delete persisted reflection notes or private user data.
- Keep the MVP local-first with no paid dependencies.
- Preserve unrelated user changes, including scene-debug files and portrait layout data.
- Do not push changes without user confirmation.

---

### Task 1: Lock the new view and pin/filter behavior with failing tests

**Files:**
- Modify: `apps/html-prototype/tests/ui-policy.test.ts`
- Modify: `apps/html-prototype/tests/reflection-wall.test.ts`

**Interfaces:**
- The view contract becomes `ReflectionWallView = "wall" | "list"`, with Wall rendered through `renderReflectionStack`.
- Pin toggling must preserve existing pinned notes and reject a new pin when ten other notes are already pinned.
- Filter actions must not close `.reflection-wall-filter-menu`.

- [ ] Add UI policy assertions that the toolbar exposes only Wall/List, no longer references the freeform wall canvas renderer, renders visible flag badges, and includes active Pin/Favourite controls.
- [ ] Add system tests for the tenth-pin cap and for leaving an already-pinned note toggleable when the cap is reached.
- [ ] Run the focused tests and confirm the new assertions fail against the current implementation.

---

### Task 2: Replace the freeform Wall with Stack-as-Wall

**Files:**
- Modify: `apps/html-prototype/src/types.ts`
- Modify: `apps/html-prototype/src/app.ts`
- Modify: `apps/html-prototype/src/styles.css`

**Interfaces:**
- `ReflectionWallView` accepts only `"wall" | "list"`.
- `renderReflectionToolbar` emits `[["wall", "Wall"], ["list", "List"]]`.
- Wall rendering calls `renderReflectionStack(notes)`; List rendering remains unchanged.

- [ ] Remove the freeform canvas renderer, drag-only state, auto-scroll helpers, and wall pointer-drag branch; leave stack/list note opening and editing intact.
- [ ] Keep backward compatibility for persisted view/position fields by treating old stored wall data as ordinary notes and ignoring obsolete canvas coordinates.
- [ ] Update the toolbar and refresh/open branches so Wall maps to Stack and no freeform surface is produced.
- [ ] Remove obsolete freeform-wall CSS while retaining Stack/List responsive scrolling styles.
- [ ] Run the focused tests and typecheck the app path.

---

### Task 3: Enforce a maximum of ten pinned notes

**Files:**
- Modify: `apps/html-prototype/src/systems/ReflectionWall.ts`
- Modify: `apps/html-prototype/src/app.ts`
- Test: `apps/html-prototype/tests/reflection-wall.test.ts`

**Interfaces:**
- `toggleReflectionNoteFlag(state, id, "pinned")` returns the unchanged state when pinning a new note would exceed ten pinned notes.
- Unpinning an existing pinned note remains allowed.
- The app shows a concise toast when the cap prevents pinning.

- [ ] Implement the pure cap in `toggleReflectionNoteFlag`.
- [ ] Update `toggleReflectionFlag` to avoid overwriting state when the cap is reached and show the cap feedback.
- [ ] Run the reflection-wall tests and confirm the cap behavior.

---

### Task 4: Make Pin/Favourite states visually obvious and keep filters open

**Files:**
- Modify: `apps/html-prototype/src/app.ts`
- Modify: `apps/html-prototype/src/styles.css`
- Modify: `apps/html-prototype/tests/ui-policy.test.ts`

**Interfaces:**
- Stack cards and List rows display `📌 Pinned` and `★ Favourite` badges when active.
- Detail actions use active classes and explicit labels `Pinned`/`Favourite`.
- `setReflectionWallFilter`, `setReflectionWallView`, and `setReflectionWallSort` update the body without closing the filter details element; only the existing close/navigation action closes the modal.

- [ ] Add a shared flag-badge renderer and include it in Stack cards and List rows.
- [ ] Add active classes and icon labels to detail Pin/Favourite buttons.
- [ ] Add strong CSS for badge contrast, borders, and active actions.
- [ ] Preserve the filter menu open state while re-rendering, including after selecting a filter, view, or sort.
- [ ] Run focused tests and a mobile browser smoke check for Wall/List, badges, pin cap feedback, and filter persistence.

---

### Task 5: Final verification

**Files:**
- No new files.

- [ ] Run the focused Reflection Wall/UI suite.
- [ ] Run the app-path TypeScript check.
- [ ] Run `git diff --check` scoped to changed Reflection Wall files.
- [ ] Report any unrelated full-suite failures without modifying unrelated scene-debug work.
