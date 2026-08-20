# Journal State and Crop Fix Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Keep Books and Timeline navigation independent and make inline/Reader Journal image crops composition-equivalent.

**Architecture:** Add pure Journal crop rendering math and pure Journal navigation state helpers. `app.ts` will consume those helpers and render one canonical crop wrapper for inline previews and Reader media. PDF export code remains untouched.

**Tech Stack:** TypeScript, Node test runner, existing HTML/CSS prototype.

## Global Constraints

- Do not change PDF export media rendering, layout, or canvas code.
- Keep crop values as percentage rectangles of the original source image.
- Do not destructively migrate saved crops or change media/data URLs.
- Prefer stored media dimensions; resolve legacy dimensions from `naturalWidth`/`naturalHeight` after load.
- Keep the MVP local and free of paid AI/service dependencies.
- Preserve video behavior, autosave, Backup/Restore, sync compatibility, monthly Books, Timeline, and scrapbook behavior.

---

### Task 1: Add failing crop math and navigation regression tests

**Files:**
- Create: `apps/html-prototype/tests/journal-crop-rendering.test.ts`
- Create: `apps/html-prototype/tests/journal-navigation.test.ts`

**Interfaces:**
- Tests will target the pure helpers `normalizeJournalMediaCrop`, `journalMediaCropRenderModel`, and the Journal navigation state helpers exported from `src/systems/JournalNavigation.ts`.

- [ ] **Step 1: Write tests for crop rectangles and render math**

  Cover full-image, square, portrait, 16:9, freeform, off-center, edge, stored dimensions, and legacy natural dimensions. Assert that the model's inverse mapping returns the saved source rectangle and that render style data contains no `object-fit: cover` instruction.

- [ ] **Step 2: Write tests for Books/Timeline state isolation**

  Assert that selecting Books 2025 changes only Books state and stays in `books`; Timeline year filtering changes only Timeline state; switching between tabs restores each cursor/filter; Books month stepping stays in Books and never returns `timeline`.

- [ ] **Step 3: Run the focused tests and verify expected failure**

Run: `npm test -w apps/html-prototype -- --test-name-pattern="crop|Books|Timeline|navigation"`

Expected: FAIL because the new helpers and separated state behavior do not yet exist.

### Task 2: Implement canonical crop model

**Files:**
- Create: `apps/html-prototype/src/systems/JournalCrop.ts`
- Modify: `apps/html-prototype/src/types.ts` only if a shared return type is needed
- Test: `apps/html-prototype/tests/journal-crop-rendering.test.ts`

**Interfaces:**
- `normalizeJournalMediaCrop(crop: unknown): DiaryMediaCrop`
- `journalMediaCropRenderModel(crop: unknown, sourceWidth?: number, sourceHeight?: number): JournalCropRenderModel`
- `journalMediaCropRenderStyle(model: JournalCropRenderModel): string`

- [ ] **Step 1: Implement percentage normalization without mutating input**

  Clamp `width` and `height` to the existing safe range, clamp `x` and `y` to keep the rectangle inside 0–100, and return a new object. Treat the canonical internal unit as percentages.

- [ ] **Step 2: Implement the frame and image placement formula**

  Use `sourceAspect = sourceWidth / sourceHeight` when valid, otherwise `1` until load; compute `frameAspect = sourceAspect * crop.width / crop.height`; compute image width/left/top from the crop percentages while preserving intrinsic image aspect.

- [ ] **Step 3: Run the focused crop tests**

Run: `npm test -w apps/html-prototype -- --test-name-pattern="crop"`

Expected: PASS for all crop math and legacy-dimension tests.

### Task 3: Separate Journal navigation state

**Files:**
- Create: `apps/html-prototype/src/systems/JournalNavigation.ts`
- Modify: `apps/html-prototype/src/app.ts`
- Test: `apps/html-prototype/tests/journal-navigation.test.ts`

**Interfaces:**
- `JournalNavigationState` contains `mode`, `timelineMonthKey`, `booksYear`, and `booksMonthKey`.
- `selectBooksYear(state, year, availableBookKeys): JournalNavigationState`
- `moveBooksMonth(state, direction, availableMonthKeys): JournalNavigationState`
- `moveTimelineMonth(state, direction, scope): JournalNavigationState`

- [ ] **Step 1: Implement the pure state transitions**

  Books transitions update only Books fields and set `mode` to `books`; Timeline transitions update only the Timeline cursor and set `mode` to `timeline`. No transition changes Timeline filters.

- [ ] **Step 2: Wire action routing and render state into `app.ts`**

  Add `selectedTimelineMonthKey`, `selectedBooksYear`, and `selectedBooksMonthKey`; change Books buttons to `journal-books-year`; route that action to a Books-only method; make Books/Reader month controls update Books state; leave `filterTimelineYear` for Timeline only.

- [ ] **Step 3: Run focused navigation tests and existing Journal tests**

Run: `npm test -w apps/html-prototype -- --test-name-pattern="Books|Timeline|navigation|journal"`

Expected: PASS, with Books year selection remaining Books and Timeline filters unchanged.

### Task 4: Use one crop renderer in inline preview and Reader

**Files:**
- Modify: `apps/html-prototype/src/app.ts`
- Modify: `apps/html-prototype/src/styles.css`
- Test: `apps/html-prototype/tests/journal-crop-rendering.test.ts`

**Interfaces:**
- `app.ts` will generate a shared `renderJournalImageCrop(media, contextClass)` wrapper for both inline and Reader contexts.

- [ ] **Step 1: Replace duplicated inline/Reader HTML with the shared wrapper**

  Use stored `media.width`/`media.height` in the initial style. When absent, add an image-load handler that sets source dimensions and recalculates only CSS variables; do not alter the saved crop object.

- [ ] **Step 2: Remove the second crop from Journal inline/Reader CSS**

  Keep the wrapper aspect ratio from the crop model, set the original image to translated/scaled intrinsic rendering, and remove `object-fit: cover` from the crop image rules. Do not modify PDF-related CSS or canvas rendering.

- [ ] **Step 3: Run crop tests and source-policy assertions**

Run: `npm test -w apps/html-prototype -- --test-name-pattern="crop|PDF"`

Expected: PASS, including a source assertion that Journal crop images do not use a second `object-fit: cover` rule and existing PDF regression tests remain unchanged.

### Task 5: Full verification and commit

**Files:**
- Verify all changed files and preserve unrelated workspace changes.

- [ ] **Step 1: Run requested verification commands**

Run:

```text
npm run typecheck -w apps/html-prototype
npm test -w apps/html-prototype
npm run build -w apps/html-prototype
```

- [ ] **Step 2: Manually verify at 390×844**

Exercise Edit Journal → Edit Crop → wide 16:9-ish crop → Crop → save → Reader, then repeat for square, portrait, very wide, and strongly left/right shifted crops. Confirm each shows the exact crop-modal source region and preserves its authored aspect.

- [ ] **Step 3: Inspect diff and commit only the completed fix/docs**

Run `git diff --check`, inspect `git diff`, stage only the fix and its tests/docs, and commit with:

```text
git commit -m "fix(journal): separate books state and preserve media crops"
```

Do not push until the user confirms.
