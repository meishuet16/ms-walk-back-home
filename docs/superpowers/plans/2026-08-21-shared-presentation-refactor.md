# Shared Presentation Refactor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add shared role-based presentation rendering and generic safe local VN portraits without changing authored chapter behavior.

**Architecture:** Add a focused pure `PresentationRenderer.ts`. Keep March 30 shorthand/crop resolution in `app.ts`/fixture data, pass resolved portrait models to the renderer, and generalize lightweight Labis CSS by shared role selectors with compatibility aliases.

**Tech Stack:** TypeScript, DOM string rendering, CSS, Node test runner, existing HTML prototype build.

## Global Constraints

- Preserve all canonical dialogue/narrative data, choice IDs/effects/tendencies, SceneLayout/anchor data, crop metadata, gameplay prop scale, and the existing jacket-wipe offset `68`.
- Do not introduce paid dependencies, assets, AI calls, or a new UI framework.
- Reject unsafe portrait paths and render invalid portraits empty.
- Keep `.vn`/normal `.modal` centered; lower only shared lightweight roles.

### Task 1: Add failing shared renderer tests

**Files:**
- Create: `apps/html-prototype/tests/presentation-renderer.test.ts`
- Test source assertions: `apps/html-prototype/tests/march30-ui.test.ts`, `apps/html-prototype/tests/ui-policy.test.ts`

- [ ] Write tests for safe `assets/...` and `/assets/...` normalization, rejection of traversal/filesystem/remote/scheme paths, dimension/offset markup, empty invalid portraits, and role markup classes.
- [ ] Add source-level assertions for all three VN paths, shared role classes, centered VN/modal selectors, lower stage-relative lightweight selectors, and absence of March 30 branches in `PresentationRenderer.ts`.
- [ ] Run `npm test -- --test-name-pattern="presentation|shared|portrait"` after the build exists; confirm new tests fail for missing module/behavior.

### Task 2: Implement pure shared presentation renderer

**Files:**
- Create: `apps/html-prototype/src/systems/PresentationRenderer.ts`
- Modify: `apps/html-prototype/src/types.ts` or `apps/html-prototype/src/systems/CutsceneSystem.ts` only where shared portrait/presentation types must be imported.

- [ ] Implement `DialoguePortraitConfig`, `DialoguePortrait`, `DialoguePresentation`, and `MemoryOverlayPresentation` with no chapter-specific fields.
- [ ] Implement path normalization/validation and portrait markup with stable region constraints, intrinsic aspect ratio preservation, and portrait-local offsets.
- [ ] Implement pure VN, RPG, reflection-choice, and reflection markup helpers that escape dynamic text/attributes.
- [ ] Run the focused renderer tests and confirm they pass.

### Task 3: Route existing VN paths through shared rendering

**Files:**
- Modify: `apps/html-prototype/src/app.ts`
- Preserve: `apps/html-prototype/src/fixtures/march30Memory.ts`
- Modify tests: `apps/html-prototype/tests/march30-ui.test.ts`, `apps/html-prototype/tests/labis-motor.test.ts`, `apps/html-prototype/tests/ui-policy.test.ts`

- [ ] Adapt Cutscene dialogue portrait typing to accept the shared portrait union without changing authored fixtures.
- [ ] Keep March 30 shorthand resolution and crop/source metadata in app/fixture code, but pass resolved render models to the shared renderer; do not add March 30 knowledge to `PresentationRenderer.ts`.
- [ ] Route March 30, Bakery, and Labis motor VN through the shared VN helper; preserve Bakery shorthand behavior and Labis empty portrait behavior.
- [ ] Assert the `68` jacket offset and all March 30 crop metadata remain unchanged.
- [ ] Run focused VN and portrait tests.

### Task 4: Generalize RPG/reflection roles and positioning

**Files:**
- Modify: `apps/html-prototype/src/app.ts`
- Modify: `apps/html-prototype/src/styles.css`
- Modify: `apps/html-prototype/tests/ui-policy.test.ts`, `apps/html-prototype/tests/march30-ui.test.ts`, `apps/html-prototype/tests/labis-production.test.ts`

- [ ] Emit shared `.rpg-dialogue`, `.reflection-choice-ui`, `.reflection-choice-card`, and `.reflection` classes from shared helpers; retain Labis selector aliases.
- [ ] Migrate Labis choices/reflections and March 30 choices/responses/end quotes to shared lightweight roles without changing text, IDs, effects, tendencies, or progression.
- [ ] Use stage-relative, safe-area-aware, control-aware bottom spacing for lightweight roles only; preserve centered `.vn`, `.modal`, diary, and journal rules.
- [ ] Remove repeated `reflection` subtitles from March 30 choice cards.
- [ ] Run focused UI policy/regression tests.

### Task 5: Full verification and local commit

**Files:**
- Modify only files proven necessary by Tasks 1–4.

- [ ] Run focused tests, then `npm test` from `apps/html-prototype`.
- [ ] Run `npm run typecheck`, `npm run build`, and `git diff --check`.
- [ ] If browser tooling is available, inspect 390×844 Portrait and current landscape/Desktop for March 30, Labis, Bakery, diary, and journal surfaces; report only actual checks.
- [ ] Review `git diff` to confirm the pre-existing `march30Memory.ts` offset `68` is preserved and unrelated user files are untouched.
- [ ] Commit locally with a focused message; do not push.
