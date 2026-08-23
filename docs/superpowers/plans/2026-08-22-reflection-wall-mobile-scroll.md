# Reflection Wall Mobile Portrait Scroll Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the mobile portrait Reflection Wall `wall` canvas grow with memo density so the existing freeform notes remain draggable and can be reached by vertical scrolling.

**Architecture:** Add a pure canvas-height helper to `apps/html-prototype/src/systems/ReflectionWall.ts`. The app will use it when rendering `.reflection-wall-surface`, exposing the result as a CSS custom property. The portrait CSS will use that variable as the surface's minimum height while retaining the existing scroll container and absolute-positioned memo layout.

**Tech Stack:** TypeScript, CSS media queries, Node built-in test runner, existing html-prototype build/test scripts.

## Global Constraints

- Fix only the mobile portrait `wall` view; keep `stack` and `list` behavior unchanged.
- Preserve absolute positioning, drag interaction, persisted normalized coordinates, filtering, sorting, and paper styles.
- Keep the app runnable locally without paid APIs or services.
- Do not log or commit private diary or memory data.
- Verify with the html-prototype build, typecheck, and test suite before claiming completion.

---

### Task 1: Add the content-aware portrait wall height contract

**Files:**
- Modify: `apps/html-prototype/src/systems/ReflectionWall.ts`
- Test: `apps/html-prototype/tests/reflection-wall.test.ts`

**Interfaces:**
- Produces `reflectionWallCanvasHeight(noteCount: number, options?: ReflectionWallCanvasHeightOptions): number`.
- The helper returns at least the base wall height and increases as memo density requires additional rows; it does not mutate notes or coordinates.

- [ ] **Step 1: Write the failing test**

Append a focused test to `apps/html-prototype/tests/reflection-wall.test.ts`:

```ts
import { reflectionWallCanvasHeight } from "../src/systems/ReflectionWall.js";

test("portrait wall canvas grows when memo count needs more vertical rows", () => {
  const base = reflectionWallCanvasHeight(5);
  const crowded = reflectionWallCanvasHeight(16);

  assert.equal(base, 620);
  assert.ok(crowded > base);
  assert.equal(reflectionWallCanvasHeight(16), crowded);
});
```

Use the existing import block instead of adding a duplicate import statement.

- [ ] **Step 2: Run the focused test and verify it fails**

Run from `apps/html-prototype`:

```powershell
npm test -- --test-name-pattern="portrait wall canvas grows"
```

Expected: the build/test command fails because `reflectionWallCanvasHeight` is not exported yet.

- [ ] **Step 3: Implement the minimal helper**

In `apps/html-prototype/src/systems/ReflectionWall.ts`, add an exported options type and helper near the existing reflection-note dimension types:

```ts
export type ReflectionWallCanvasHeightOptions = {
  baseHeight?: number;
  columns?: number;
  rowHeight?: number;
  bottomPadding?: number;
};

export function reflectionWallCanvasHeight(
  noteCount: number,
  options: ReflectionWallCanvasHeightOptions = {}
): number {
  const baseHeight = Math.max(1, options.baseHeight ?? 620);
  const columns = Math.max(1, Math.floor(options.columns ?? 5));
  const rowHeight = Math.max(1, options.rowHeight ?? 150);
  const bottomPadding = Math.max(0, options.bottomPadding ?? 80);
  const rows = Math.max(1, Math.ceil(Math.max(0, noteCount) / columns));
  return Math.max(baseHeight, rows * rowHeight + bottomPadding);
}
```

- [ ] **Step 4: Run the focused test and verify it passes**

Run:

```powershell
npm test -- --test-name-pattern="portrait wall canvas grows"
```

Expected: the focused test passes.

- [ ] **Step 5: Commit the helper and regression test**

```powershell
git add apps/html-prototype/src/systems/ReflectionWall.ts apps/html-prototype/tests/reflection-wall.test.ts
git commit -m "test: define mobile reflection wall canvas growth"
```

---

### Task 2: Connect wall rendering to the portrait scroll surface

**Files:**
- Modify: `apps/html-prototype/src/app.ts`
- Modify: `apps/html-prototype/src/styles.css`
- Test: `apps/html-prototype/tests/ui-policy.test.ts`

**Interfaces:**
- Consumes `reflectionWallCanvasHeight(noteCount)` from `ReflectionWall.ts`.
- Produces a `--reflection-wall-canvas-height` inline style on `.reflection-wall-surface`.
- Portrait CSS applies the custom property as the wall's minimum height and retains `overflow-y: auto`.

- [ ] **Step 1: Write the failing UI policy test**

Add a test to `apps/html-prototype/tests/ui-policy.test.ts`:

```ts
test("Reflection Wall portrait wall grows its scroll canvas with memo count", () => {
  assert.match(appSource, /reflectionWallCanvasHeight\\(this\\.reflectionWall\\.notes\\.length\\)/);
  assert.match(appSource, /--reflection-wall-canvas-height/);
  assert.match(stylesSource, /@media\\s*\\(max-width:\\s*700px\\)[\\s\\S]*\\.reflection-wall-surface[\\s\\S]*min-height:\\s*var\\(--reflection-wall-canvas-height/);
  assert.match(stylesSource, /@media\\s*\\(max-width:\\s*700px\\)[\\s\\S]*\\.reflection-wall-surface[\\s\\S]*overflow-y:\\s*auto/);
});
```

- [ ] **Step 2: Run the focused UI policy test and verify it fails**

Run from `apps/html-prototype`:

```powershell
npm test -- --test-name-pattern="Reflection Wall portrait wall grows"
```

Expected: the test fails because the app does not emit the height variable and portrait CSS does not consume it.

- [ ] **Step 3: Implement the minimal rendering and CSS changes**

In `apps/html-prototype/src/app.ts`, import `reflectionWallCanvasHeight` from `./systems/ReflectionWall.js` and update `renderReflectionWallSurface`:

```ts
const canvasHeight = reflectionWallCanvasHeight(this.reflectionWall.notes.length);
return `<section class="reflection-wall-surface" style="--reflection-wall-canvas-height:${canvasHeight}px" aria-label="Reflection Wall">${notes || ...}</section>`;
```

Keep the existing note markup and matching behavior unchanged.

In the portrait `@media (max-width: 700px)` block in `apps/html-prototype/src/styles.css`, update only the wall surface rules:

```css
.reflection-wall-surface {
  width: 100%;
  min-width: 0;
  min-height: var(--reflection-wall-canvas-height, 620px);
  height: auto;
  overflow-x: auto;
  overflow-y: auto;
  touch-action: pan-x pan-y;
}
```

Do not alter the `.reflection-stack, .reflection-list` rules.

- [ ] **Step 4: Run the focused UI policy test and verify it passes**

Run:

```powershell
npm test -- --test-name-pattern="Reflection Wall portrait wall grows"
```

Expected: the focused UI policy test passes.

- [ ] **Step 5: Commit the wall surface integration**

```powershell
git add apps/html-prototype/src/app.ts apps/html-prototype/src/styles.css apps/html-prototype/tests/ui-policy.test.ts
git commit -m "fix: make reflection wall portrait canvas scrollable"
```

---

### Task 3: Run complete verification

**Files:**
- No additional files.

- [ ] **Step 1: Run html-prototype typecheck**

Run:

```powershell
npm run typecheck --workspace @walk/html-prototype
```

Expected: exit code 0.

- [ ] **Step 2: Run the complete html-prototype test suite**

Run from the repository root:

```powershell
npm test --workspace @walk/html-prototype
```

Expected: exit code 0 with all tests passing.

- [ ] **Step 3: Inspect the final diff and status**

```powershell
git diff HEAD~2..HEAD -- apps/html-prototype/src/systems/ReflectionWall.ts apps/html-prototype/tests/reflection-wall.test.ts apps/html-prototype/src/app.ts apps/html-prototype/src/styles.css apps/html-prototype/tests/ui-policy.test.ts
git status --short
```

Expected: only the planned wall helper, rendering/CSS integration, and tests are changed; no private data or generated runtime artifacts are staged.

