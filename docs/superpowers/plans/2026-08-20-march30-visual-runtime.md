# March 30 Visual Runtime Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build and verify the March 30 `330-corridor` visual memory runtime using the authored layouts and inspected assets.

**Architecture:** Extend the existing generic CutsceneSystem and SceneActorRenderer with typed sprite/prop/VFX/fade state. Keep all March 30 choreography, copy, asset frame rectangles, offsets, and anchor names in a data fixture resolved against the active SceneLayout.

**Tech Stack:** TypeScript, Canvas 2D, Node test runner, existing static HTML prototype build.

## Global Constraints

- Do not perform another broad architecture refactor.
- Do not regenerate or rename assets.
- Do not double-render props baked into action sheets.
- Do not use rounded equal-width slicing for non-divisible sheets.
- Keep reflection choices after the historical action, never inside the wipe timeline.
- Keep the MVP local and deterministic with no paid services.

---

### Task 1: Lock the inspected March 30 asset metadata and fixture contract

**Files:**
- Create: `apps/html-prototype/src/fixtures/march30Memory.ts`
- Create: `apps/html-prototype/tests/march30-memory.test.ts`

**Interfaces:**
- Produces `march30Assets`, `march30MainMemoryActions`, `march30EchoActions`, `march30ReflectionChoices`, `resolveMarch30Anchor(layout, key)`, and `march30AssetFrame(assetId, frame)`.

- [ ] Write tests asserting every asset path, grid, explicit non-rounded frame rectangles, visible prop bounds, water-VFX visible bounds/baseline, exact anchor alias behavior, and the canonical dialogue/choice copy.
- [ ] Run `npm test -- --test-name-pattern="March 30"` after adding the tests; expect failures because the fixture does not exist.
- [ ] Add the fixture with the inspected metadata, symbolic anchor actions, main timeline, echo timelines, reflection choices, and tendency closure variants.
- [ ] Run the focused tests and confirm they pass.

### Task 2: Extend generic cutscene state for sprite frames, props, VFX, and fades

**Files:**
- Modify: `apps/html-prototype/src/systems/CutsceneSystem.ts`
- Modify: `apps/html-prototype/src/systems/SceneActorRenderer.ts`
- Create: `apps/html-prototype/tests/cutscene-visuals.test.ts`

**Interfaces:**
- `CutsceneSystem` exposes actor visual state, prop state, VFX state, and fade state while preserving existing Labis action compatibility.
- `drawSceneSprite(...)` renders an explicit `SpriteFrame` with stable destination feet/origin data.

- [ ] Write failing tests for sprite frame transitions, attached prop visibility, effect timing, and fade completion.
- [ ] Run the focused tests and confirm the expected missing-capability failures.
- [ ] Add the smallest typed action variants for `sprite`, `prop`, `water-vfx`, `fade`, and actor opacity/visibility.
- [ ] Implement explicit source rectangles and deterministic action progression without changing existing Labis behavior.
- [ ] Run the focused tests and then the existing cutscene/typecheck tests.

### Task 3: Integrate the March 30 runtime into the authored scene path

**Files:**
- Modify: `apps/html-prototype/src/app.ts`
- Modify: `apps/html-prototype/src/fixtures/march30Chapter.ts`
- Modify: `apps/html-prototype/src/systems/EndingResolver.ts` only if the existing generic resolver needs the smallest optional closure hook
- Modify: `apps/html-prototype/tests/mobile-regressions.test.ts` only for March 30 runtime assertions

**Interfaces:**
- Authored runtime starts `march30` only from the layout’s `main-memory` trigger or explicit post-completion interactions.
- The active layout supplies all normal and echo world positions; no duplicate Portrait action script exists.

- [ ] Add failing integration/source tests for trigger gating, Muji lock, main action order, three sprays, post-history reflection, echo gating, replay, and exit routing.
- [ ] Run focused tests and confirm failures before implementation.
- [ ] Add March 30 state fields and lifecycle methods to `WalkBackHomeApp`, keeping them isolated from Labis state.
- [ ] Resolve the current orientation’s anchors at runtime, render memory actors by depth, derive the water effect from rendered actor positions, and preserve action-sheet props without overlays.
- [ ] Add the exact reflection choices and after-history dialogue/closure handling.
- [ ] Run focused integration tests and existing regression tests.

### Task 4: Verify production paths and manual visuals

**Files:**
- Modify: only files required by failing verification, if any

- [ ] Run `npm run typecheck` from `apps/html-prototype`.
- [ ] Run `npm test` from `apps/html-prototype`.
- [ ] Run `npm run build` from `apps/html-prototype`.
- [ ] Start the local dev server and inspect Landscape and Portrait in a browser where available.
- [ ] Verify Forest → March 30, main-memory staging, three sprays, keychains, silent jacket wipe, reflections, replay, elevator echo, walk-together echo, exit, save/reload, Labis/Bakery, and mobile controls.
- [ ] Record exact changed files, bindings, grids, offsets, remaining anchor issues, and anything not automatically verifiable.
