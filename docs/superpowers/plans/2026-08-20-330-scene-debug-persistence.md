# 330 Scene Debug Persistence Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stop 330 Scene Debug layouts from reverting or losing Portrait echo/anchor data, apply the corrected March 30 material scales, and expose the 330 diary as an editable Journal entry.

**Architecture:** Preserve the existing SceneLayout and SceneDebugEditor architecture. Align the dev server's write mirrors with its existing static-file precedence, retain the supplied 330 backups as authored layout data, use centralized March 30-only scales in the existing actor/prop/effect drawing paths, and seed the diary through the existing DiaryLibrary.

**Tech Stack:** TypeScript, browser Canvas 2D, Node HTTP dev server, Node test runner, JSON SceneLayout fixtures.

## Global Constraints

- Do not redesign SceneLayout or create a chapter-specific rendering engine.
- Do not regenerate or rename assets.
- Keep environment background dimensions and authored world coordinates unchanged.
- Treat `public/assets/330/330-corridor-landscape.json` and `330-corridor-portrait.json` as backup data.

---

### Task 1: Lock the save/reload regression

**Files:**
- Modify: `apps/html-prototype/tests/scene-debug-editor.test.ts`
- Modify: `apps/html-prototype/tests/march30-memory.test.ts`

- [ ] Add tests asserting the saved layout directory is the first `/scene-layouts` directory served and that both supplied 330 backups retain all anchors and echo anchors in the authored layouts.
- [ ] Run the focused tests and confirm they fail against the stale write-mirror behavior or stale fixture state.

### Task 2: Fix debug save mirrors and restore authored 330 data

**Files:**
- Modify: `apps/html-prototype/scripts/dev-server.mjs`
- Modify: `apps/html-prototype/public/scene-layouts/330-corridor/landscape.json`
- Modify: `apps/html-prototype/public/scene-layouts/330-corridor/portrait.json`

- [ ] Add `dist/scene-layouts` as an explicit save/manifest mirror, matching the static server's first candidate.
- [ ] Keep `public/scene-layouts` and `dist/public/scene-layouts` synchronized.
- [ ] Restore both layout files from the supplied backups without changing their authored coordinates.
- [ ] Re-run the focused persistence tests.

### Task 3: Apply corrected March 30 material scales and keychain timing

**Files:**
- Modify: `apps/html-prototype/src/app.ts`
- Modify: `apps/html-prototype/src/styles.css`
- Modify: `apps/html-prototype/tests/march30-ui.test.ts`

- [ ] Add March 30-only `1.2` and `2` scales; use `2` only for standalone water-gun and both candied-haw keychain props and `1.2` for action sheets.
- [ ] Add explicit prop portraits for the water-gun question and two-keychain selection dialogue.
- [ ] Crop the gift/water-gun/keychain portrait props to their inspected source bounds, keep them at the requested 2x prop scale, and compact/center mobile March 30 overlays and short diary reading inside the Portrait stage.
- [ ] Scale the fish-charm gift at 2x and use it as ET's left dialogue portrait for `这是什么`; use the water gun for MS's `水枪` answer.
- [ ] Preserve `chapterId: march30-too-fated` when Journal saves the seeded entry, suppress its duplicate Forest-derived node, and keep the edited content as the chapter diary source.
- [ ] Show Reflection choices after replay and add `Keep this` to the March 30 ending quote.
- [ ] Render March 30 actors from actual PNG alpha bounds inside their inspected frame cells.
- [ ] Hide `ordinaryKeychain` immediately before the `walao你拿水枪喷我 还不止一下` dialogue.
- [ ] Keep all asset source rects, feet origins, nozzle origins, and SceneLayout coordinates unchanged.
- [ ] Add assertions that the scales are centralized and all relevant draw paths use them.
- [ ] Run focused tests, then the complete test suite.

### Task 4: Seed the editable March 30 Journal entry

**Files:**
- Modify: `apps/html-prototype/src/fixtures/authoredDiaryEntries.ts`
- Modify: `apps/html-prototype/src/app.ts`
- Modify: `apps/html-prototype/tests/diary-library.test.ts`
- Modify: `apps/html-prototype/tests/march30-ui.test.ts`

- [ ] Seed `chapterId: "march30-too-fated"` with date `2026-03-30` through the existing authored diary seed path.
- [ ] Keep the existing Journal reader/editor actions so the entry can be modified.
- [ ] Make the 330 corridor diary interaction read the saved entry body when one exists.
- [ ] Run the focused diary tests.

### Task 5: Verify the repository

**Files:**
- No additional production files.

- [ ] Run `npm test` in `apps/html-prototype`.
- [ ] Run root `npm run typecheck`.
- [ ] Run root `npm run build`.
- [ ] If the local dev server is available, save/reload both orientations and verify Portrait echoes/anchors remain present and Landscape coordinates do not change.
