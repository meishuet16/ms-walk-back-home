# Muji Room Mobile Records Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign only the mobile Muji Room Records experience so listening happens at a physical record corner, browsing happens in My Record Crate, and management is progressively disclosed without changing existing music behavior or desktop Records.

**Architecture:** Keep playback, library, persistence, sorting, deletion, cover, background, lyrics, and metadata behavior in the existing systems and `WalkBackHomeApp`. Add one pure `RecordsMobile.ts` module for transient mobile presentation state and transitions only. Render a new mobile-only record-corner hierarchy and action sheets from `app.ts`, while leaving the existing desktop grid/footer structure intact and applying all visual changes below the existing `700px` breakpoint.

**Tech Stack:** TypeScript, delegated DOM events, HTML/CSS/SVG-style layered DOM, Node test runner, existing localStorage/IndexedDB adapters.

## Global Constraints

- Work only on branch `codex/muji-records-mobile-redesign` created from fetched `origin/main`.
- Mobile Records only; Reflection Wall, Capsule Machine, residue, Toolbox, Journal, Forest, Scene Debug, authored content, room geometry, and desktop Records behavior are out of scope.
- `RecordsMobile.ts` owns transient mobile presentation state only and must not duplicate music business logic or persistence.
- Opening a contextual song menu must never select or play that song.
- Preserve all current Records capabilities and persistence keys.
- Add no paid service, dependency, framework migration, canvas control, Three.js code, or giant static image.
- Use real buttons, visible focus, `aria-pressed`, range semantics, modal sheet labels, approximately 44×44px touch targets, and non-color state indicators.
- Respect `prefers-reduced-motion: reduce`; vinyl spin is disabled and sheets become static state changes.
- Protect desktop with mobile-specific markup/classes and selectors scoped to `@media (max-width: 700px)`.
- Verify at 320, 360, 375, 390, 430, and 480px widths, plus short/tall mobile heights and a desktop regression viewport.

---

### Task 1: Pure mobile presentation state

**Files:**
- Create: `apps/html-prototype/src/systems/RecordsMobile.ts`
- Create: `apps/html-prototype/tests/records-mobile.test.ts`

**Interfaces:**
- Consumes: transient UI action names and optional track ids only.
- Produces: `RecordsMobileState`, `createRecordsMobileState()`, and `transitionRecordsMobile(state, action)`.

- [ ] **Step 1: Write the failing state tests**

```ts
import assert from "node:assert/strict";
import test from "node:test";
import { createRecordsMobileState, transitionRecordsMobile } from "../src/systems/RecordsMobile.js";

test("mobile Records opens one secondary surface at a time", () => {
  const crate = transitionRecordsMobile(createRecordsMobileState(), { type: "open-crate" });
  const globalMenu = transitionRecordsMobile(crate, { type: "open-global-menu" });
  assert.equal(crate.crateOpen, true);
  assert.deepEqual(globalMenu, { crateOpen: false, layer: "global-menu", organizeMode: false });
});

test("contextual song targeting never contains playback selection state", () => {
  const state = transitionRecordsMobile(createRecordsMobileState(), { type: "open-track-menu", trackId: "user-2" });
  assert.equal(state.crateOpen, true);
  assert.equal(state.actionTrackId, "user-2");
  assert.equal("selectedTrackId" in state, false);
  assert.equal("playing" in state, false);
});

test("Organize belongs to the crate and resets when the crate closes", () => {
  const organized = transitionRecordsMobile(createRecordsMobileState(), { type: "enter-organize" });
  const closed = transitionRecordsMobile(organized, { type: "close-crate" });
  assert.deepEqual(organized, { crateOpen: true, layer: "none", organizeMode: true });
  assert.deepEqual(closed, createRecordsMobileState());
});

test("editing keeps the contextual track without opening playback", () => {
  const menu = transitionRecordsMobile(createRecordsMobileState(), { type: "open-track-menu", trackId: "built-in-a" });
  const editor = transitionRecordsMobile(menu, { type: "open-track-editor" });
  assert.deepEqual(editor, { crateOpen: true, layer: "track-editor", organizeMode: false, actionTrackId: "built-in-a" });
});
```

- [ ] **Step 2: Run the test and verify RED**

Run: `npm run build -w apps/html-prototype && node --test apps/html-prototype/dist/tests/records-mobile.test.js`

Expected: TypeScript fails because `src/systems/RecordsMobile.ts` does not exist.

- [ ] **Step 3: Implement the minimal pure state module**

```ts
export type RecordsMobileLayer = "none" | "global-menu" | "track-menu" | "track-editor";

export type RecordsMobileState = {
  crateOpen: boolean;
  layer: RecordsMobileLayer;
  organizeMode: boolean;
  actionTrackId?: string;
};

export type RecordsMobileAction =
  | { type: "open-crate" }
  | { type: "close-crate" }
  | { type: "open-global-menu" }
  | { type: "close-layer" }
  | { type: "open-track-menu"; trackId: string }
  | { type: "open-track-editor" }
  | { type: "enter-organize" }
  | { type: "leave-organize" };

export function createRecordsMobileState(): RecordsMobileState {
  return { crateOpen: false, layer: "none", organizeMode: false };
}

export function transitionRecordsMobile(state: RecordsMobileState, action: RecordsMobileAction): RecordsMobileState {
  if (action.type === "open-crate") return { crateOpen: true, layer: "none", organizeMode: false };
  if (action.type === "close-crate") return createRecordsMobileState();
  if (action.type === "open-global-menu") return { crateOpen: false, layer: "global-menu", organizeMode: false };
  if (action.type === "close-layer") return { ...state, layer: "none", actionTrackId: undefined };
  if (action.type === "open-track-menu") return { crateOpen: true, layer: "track-menu", organizeMode: false, actionTrackId: action.trackId };
  if (action.type === "open-track-editor") return state.actionTrackId ? { ...state, layer: "track-editor" } : state;
  if (action.type === "enter-organize") return { crateOpen: true, layer: "none", organizeMode: true };
  return { crateOpen: true, layer: "none", organizeMode: false };
}
```

- [ ] **Step 4: Run the focused test and verify GREEN**

Run: `npm run build -w apps/html-prototype && node --test apps/html-prototype/dist/tests/records-mobile.test.js`

Expected: 4 tests pass, 0 fail.

- [ ] **Step 5: Commit the state boundary**

```powershell
git add apps/html-prototype/src/systems/RecordsMobile.ts apps/html-prototype/tests/records-mobile.test.ts
git commit -m "feat(records): add mobile presentation state"
```

### Task 2: Mobile hierarchy, action targeting, and progressive disclosure

**Files:**
- Modify: `apps/html-prototype/src/app.ts:239-250, 705-760, 6028-6040, 6540-6595, 6763-6918, 7535-7920`
- Modify: `apps/html-prototype/tests/ui-policy.test.ts:130-240`
- Modify: `apps/html-prototype/tests/records-state.test.ts`

**Interfaces:**
- Consumes: `RecordsMobileState` and `transitionRecordsMobile`; existing `PersonalMusic`, `MusicBlobStore`, `SaveManager`, `MujiRoom`, and `AudioManager` methods without duplicating them.
- Produces: mobile-only Record Corner, My Record Crate, grouped global menu, per-track menu/editor, and Organize rendering.

- [ ] **Step 1: Add failing policy tests for the new hierarchy**

```ts
test("mobile Records exposes explicit Cover and Vinyl controls around a physical player", () => {
  assert.match(appSource, /records-mobile-record-player/);
  assert.match(appSource, /records-turntable-plinth/);
  assert.match(appSource, /data-action="music-visual" data-mode="vinyl" aria-pressed=/);
  assert.match(appSource, /data-action="music-visual" data-mode="cover" aria-pressed=/);
  assert.match(appSource, /data-action="open-record-crate"/);
});

test("normal My Record Crate progressively discloses management", () => {
  assert.match(appSource, /My Record Crate/);
  assert.match(appSource, /data-action="enter-record-organize"/);
  assert.match(appSource, /recordsMobile\.organizeMode/);
  assert.match(appSource, /organizeMode \? `[^`]*record-selection/s);
});

test("mobile Records separates global groups from contextual song actions", () => {
  assert.match(appSource, /records-menu-section[^]*>Song</);
  assert.match(appSource, /records-menu-section[^]*>Player</);
  assert.match(appSource, /records-menu-section[^]*>Library</);
  assert.match(appSource, /data-action="open-record-track-menu"/);
  assert.match(appSource, /recordsMobile\.actionTrackId/);
});

test("contextual actions use their target without selecting it", () => {
  const handler = appSource.match(/if \(action === "open-record-track-menu"\)[\s\S]*?\n    \}/)?.[0] ?? "";
  assert.match(handler, /transitionRecordsMobile/);
  assert.doesNotMatch(handler, /selectVinyl|playPersonalMusic|selectedTrackId\s*=/);
});
```

- [ ] **Step 2: Run the focused policy tests and verify RED**

Run: `npm run build -w apps/html-prototype && node --test apps/html-prototype/dist/tests/ui-policy.test.js apps/html-prototype/dist/tests/records-state.test.js`

Expected: new assertions fail because the physical player, explicit controls, crate copy, Organize state, and mobile action targeting are absent.

- [ ] **Step 3: Wire transient state and actions without touching playback ownership**

Add the import and field:

```ts
import { createRecordsMobileState, transitionRecordsMobile, type RecordsMobileState } from "./systems/RecordsMobile.js";

private recordsMobile: RecordsMobileState = createRecordsMobileState();
```

Add delegated actions that only transition presentation state. `open-record-track-menu` must be exactly equivalent to:

```ts
if (action === "open-record-track-menu") {
  this.preserveRecordsScroll();
  this.recordsMobile = transitionRecordsMobile(this.recordsMobile, {
    type: "open-track-menu",
    trackId: target.dataset.track ?? ""
  });
  void this.showRecords();
}
```

Use existing `selectVinyl()` only for the explicit Play action. Add `open-record-crate`, `close-record-crate`, `toggle-records-global-menu`, `close-records-mobile-layer`, `enter-record-organize`, `leave-record-organize`, `open-record-track-editor`, and `save-record-track-editor`. Leaving Organize clears `selectedRecordIds` and `pendingBatchDelete` because those are session presentation state, not library data.

- [ ] **Step 4: Render separate mobile markup while retaining the desktop grid/footer**

Keep `.records-grid` and `.records-transport` structurally unchanged. Replace only the dedicated mobile player/sheets with:

```html
<section class="records-mobile-player" aria-label="Record Corner now playing">
  <div class="records-mobile-environment" aria-hidden="true"></div>
  <button class="records-mobile-record-player vinyl" data-action="toggle-record-artwork" aria-label="Switch to Cover view">
    <span class="records-turntable-lid"></span>
    <span class="records-turntable-plinth">
      <span class="records-turntable-disc"></span>
      <span class="records-turntable-tone-arm"></span>
      <span class="records-turntable-control"></span>
    </span>
  </button>
  <div class="records-visual-switch" aria-label="Record display">
    <button data-action="music-visual" data-mode="vinyl" aria-pressed="true">Vinyl</button>
    <button data-action="music-visual" data-mode="cover" aria-pressed="false">Cover</button>
  </div>
  <div class="records-mobile-title"><h3>Track title</h3><p>Artist</p></div>
  <button class="records-mobile-lyrics" data-action="open-full-lyrics" aria-label="Open full lyrics"></button>
  <div class="time-row records-mobile-progress"></div>
  <div class="records-mobile-controls" aria-label="Playback controls"></div>
  <button class="records-open-crate" data-action="open-record-crate">My Record Crate</button>
</section>
```

The actual template interpolates the current existing cover source, playback state, lyrics, times, and labels. It must not create a second music model.

- [ ] **Step 5: Add contextual target-aware wrappers around existing metadata/cover/lyrics logic**

Change the existing upload handlers to resolve `input.dataset.track` first and current playback selection second:

```ts
const trackId = input.dataset.track || this.personalPlayer.selectedTrackId || this.currentPersonalTrack()?.id;
```

Extract the body of current metadata editing into:

```ts
private updateTrackMetadata(trackId: string, title: string, artist: string): void
```

It must continue updating imported tracks in `musicLibrary` and built-ins in `personalPlayer.customTrackMeta`. Desktop live fields call it with `selectedTrackId`; the mobile contextual editor calls it with `recordsMobile.actionTrackId`. Neither cover, lyric, nor metadata editing calls `selectVinyl()`.

- [ ] **Step 6: Render crate rows and management states**

Normal rows include a cover/initial thumbnail, title, artist, available duration, and More button, with no checkbox. When `recordsMobile.organizeMode` is true, render the existing checkbox and batch actions, including `0 selected`, Select All/Clear, Artist, Album, and Delete Selected controls. Keep imported-track deletion and built-in protection delegated to existing helpers.

- [ ] **Step 7: Run focused Records tests and verify GREEN**

Run: `npm run build -w apps/html-prototype && node --test apps/html-prototype/dist/tests/records-mobile.test.js apps/html-prototype/dist/tests/records-state.test.js apps/html-prototype/dist/tests/personal-music.test.js apps/html-prototype/dist/tests/ui-policy.test.js apps/html-prototype/dist/tests/save-manager.test.js`

Expected: all selected tests pass with no warnings.

- [ ] **Step 8: Commit the hierarchy and behavior**

```powershell
git add apps/html-prototype/src/app.ts apps/html-prototype/tests/ui-policy.test.ts apps/html-prototype/tests/records-state.test.ts
git commit -m "feat(records): redesign mobile listening hierarchy"
```

### Task 3: Mobile visual language, responsive composition, accessibility, and motion

**Files:**
- Modify: `apps/html-prototype/src/styles.css:3149-3433, 4352-4465`
- Modify: `apps/html-prototype/tests/ui-policy.test.ts`

**Interfaces:**
- Consumes: mobile-only classes rendered by Task 2.
- Produces: cool twilight environment, warm physical player, responsive crate/menu sheets, touch/focus states, and reduced-motion rules.

- [ ] **Step 1: Add failing CSS policy tests**

```ts
test("mobile Record Corner uses height-aware sizing and safe areas", () => {
  assert.match(stylesSource, /--records-hero-size:\s*min\([^;]*vw[^;]*dvh/);
  assert.match(stylesSource, /\.records-open-crate[\s\S]*min-height:\s*44px/);
  assert.match(stylesSource, /padding-bottom:[^;]*safe-area-inset-bottom/);
});

test("Records motion is restrained and reduced-motion safe", () => {
  assert.match(stylesSource, /records-vinyl-spin[^]*linear[^]*infinite/);
  assert.match(stylesSource, /records-sheet-enter[^]*\.24s[^]*ease-out/);
  assert.match(stylesSource, /prefers-reduced-motion:\s*reduce[^]*records-turntable-disc[^]*animation:\s*none/);
});

test("mobile Records keeps visible focus and physical button feedback", () => {
  assert.match(stylesSource, /records-mobile-player[^]*:focus-visible/);
  assert.match(stylesSource, /records-mobile-controls[^]*:active[^]*scale\(\.97\)/);
});
```

- [ ] **Step 2: Run the policy test and verify RED**

Run: `npm run build -w apps/html-prototype && node --test apps/html-prototype/dist/tests/ui-policy.test.js`

Expected: the new height-aware, motion, reduced-motion, focus, and physical-feedback assertions fail.

- [ ] **Step 3: Add one final mobile-only Records ruleset**

Use these exact responsive foundations and fill in only selectors rendered by Task 2:

```css
@media (max-width: 700px) {
  .records-panel.personal-records {
    --records-hero-size: min(74vw, 38dvh, 320px);
    background:
      radial-gradient(circle at 72% 18%, rgba(202, 104, 151, .22), transparent 30%),
      linear-gradient(180deg, #19162f 0%, #282044 44%, #151321 100%);
    padding-bottom: max(16px, env(safe-area-inset-bottom));
  }

  .records-mobile-record-player {
    width: var(--records-hero-size);
    min-height: var(--records-hero-size);
    transition: transform .22s ease-in-out, opacity .22s ease-out;
  }

  .records-open-crate,
  .records-mobile-controls button,
  .records-visual-switch button {
    min-height: 44px;
  }

  .records-mobile-controls button:active,
  .records-open-crate:active {
    transform: scale(.97);
    transition-duration: .12s;
  }

  .records-song-sheet.open {
    animation: records-sheet-enter .24s ease-out both;
  }
}

@media (max-width: 700px) and (max-height: 700px) {
  .records-panel.personal-records { --records-hero-size: min(62vw, 31dvh, 230px); }
  .records-mobile-player { gap: 8px; align-content: start; }
  .records-mobile-lyrics { min-height: 70px; }
}

@keyframes records-vinyl-spin { to { transform: rotate(360deg); } }
@keyframes records-sheet-enter {
  from { opacity: 0; transform: translateY(18px); }
  to { opacity: 1; transform: translateY(0); }
}

@media (prefers-reduced-motion: reduce) {
  .records-turntable-disc,
  .records-turntable-disc.is-playing { animation: none !important; }
  .records-song-sheet.open,
  .records-mobile-more.open,
  .records-track-action-sheet.open { animation: none !important; transform: none !important; }
}
```

Apply dark wood/aged plastic/brass only to the turntable and controls; keep the surrounding environment deep blue, purple, muted magenta, and pink-orange. Use a contrast overlay when `has-bg` is present. Add `:focus-visible` outlines and ensure no selector outside mobile Records is changed.

- [ ] **Step 4: Run focused tests and verify GREEN**

Run: `npm run build -w apps/html-prototype && node --test apps/html-prototype/dist/tests/records-mobile.test.js apps/html-prototype/dist/tests/ui-policy.test.js apps/html-prototype/dist/tests/mobile-regressions.test.js`

Expected: all selected tests pass.

- [ ] **Step 5: Commit responsive presentation**

```powershell
git add apps/html-prototype/src/styles.css apps/html-prototype/tests/ui-policy.test.ts
git commit -m "style(records): build mobile record corner"
```

### Task 4: Review passes, visual evidence, and repository verification

**Files:**
- Modify only files already listed if review identifies a defect.

**Interfaces:**
- Consumes: completed implementation and repository safety scripts.
- Produces: reviewed, visually evidenced, fully verified feature branch.

- [ ] **Step 1: Run the targeted Records suite**

Run:

```powershell
npm run build -w apps/html-prototype
node --test apps/html-prototype/dist/tests/records-mobile.test.js apps/html-prototype/dist/tests/records-state.test.js apps/html-prototype/dist/tests/personal-music.test.js apps/html-prototype/dist/tests/audio-manager.test.js apps/html-prototype/dist/tests/save-manager.test.js apps/html-prototype/dist/tests/muji-room.test.js apps/html-prototype/dist/tests/lyrics-viewer.test.js apps/html-prototype/dist/tests/floating-lyrics.test.js apps/html-prototype/dist/tests/ui-policy.test.js apps/html-prototype/dist/tests/mobile-regressions.test.js
```

Expected: all targeted tests pass, 0 fail.

- [ ] **Step 2: Perform Pass 2 review and fix findings with red-green tests**

Inspect hierarchy, spacing, typography, 44px targets, overflow, progressive disclosure, action targeting, focus, keyboard behavior, motion timing, easing, and desktop collateral. Any behavioral correction first receives a focused failing test, then the minimal fix.

- [ ] **Step 3: Capture visual evidence**

Run the existing local dev server and capture:

- 390×844 Vinyl mode and Cover mode.
- My Record Crate normal mode.
- Global More menu.
- Per-song menu.
- Organize mode.
- Custom background if practical without committing runtime data.
- 320×568 short viewport.
- 430×932 tall viewport.
- 1280×800 desktop Records regression view.

Also inspect 360, 375, and 480px widths interactively for overflow and safe-area behavior.

- [ ] **Step 4: Perform Pass 3 accessibility and motion polish**

Verify keyboard activation for all real buttons, visible focus, range keyboard seeking, dialog close controls, focus return, non-color playback state, and `prefers-reduced-motion: reduce`. Remove any animation that does not improve comprehension or physical response.

- [ ] **Step 5: Inspect the exact diff before repository verification**

Run:

```powershell
git status --short --branch
git diff --stat origin/main...HEAD
git diff --check
git diff origin/main...HEAD -- apps/html-prototype/src/app.ts apps/html-prototype/src/styles.css apps/html-prototype/src/systems/RecordsMobile.ts apps/html-prototype/tests/records-mobile.test.ts apps/html-prototype/tests/records-state.test.ts apps/html-prototype/tests/ui-policy.test.ts
```

Expected: only the approved plan and intended Records files appear; no private, authored, generated, or unrelated files appear.

- [ ] **Step 6: Run the full authoritative workflow**

Run: `npm run verify`

Expected: authored content check, typecheck, all tests, build, and `git diff --check` pass.

- [ ] **Step 7: Commit any verified review fixes**

```powershell
git add apps/html-prototype/src/app.ts apps/html-prototype/src/styles.css apps/html-prototype/src/systems/RecordsMobile.ts apps/html-prototype/tests/records-mobile.test.ts apps/html-prototype/tests/records-state.test.ts apps/html-prototype/tests/ui-policy.test.ts
git commit -m "fix(records): polish mobile record corner"
```

Skip this commit when review produces no changes.

- [ ] **Step 8: Confirm clean branch and request push approval**

Run:

```powershell
git status --short --branch
git log --oneline origin/main..HEAD
```

Expected: clean feature worktree and only intended commits. Do not merge main. Do not run `npm run safe-push` until the repository owner's explicit push confirmation is received.
