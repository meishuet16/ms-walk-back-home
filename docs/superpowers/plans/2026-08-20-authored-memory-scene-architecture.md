# Authored Memory Scene Architecture Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the authored `march30-too-fated` chapter appear in Memory Forest, enter the saved `330-corridor` SceneLayout, return to Forest, remain replayable, and keep authored reflection notes permanent.

**Architecture:** Generalize chapter runtime scene identifiers to any loaded SceneLayout while retaining the fixed core scene identifiers. Route the new chapter through the existing Forest registry and placement-slot resolver, then give the app a generic authored-scene draw/update/exit path with no narrative behavior. Make Scene Debug Editor anchors data-driven from each layout instead of Labis-specific fixtures.

**Tech Stack:** TypeScript, existing HTML prototype runtime, local SceneLayout JSON, Node test runner.

## Global Constraints

- Preserve all existing authored scene-layout JSON and assets, especially Muji Room.
- Use `public/scene-layouts/330-corridor` as source of truth; do not regenerate or normalize it.
- Do not implement the March 30 narrative cutscene in this pass.
- Preserve Bakery, Labis, Forest, saves, existing chapter data compatibility, and portrait support.
- A chapter may be entered and replayed indefinitely; kept Reflection Wall notes remain persisted independently of chapter replay/reset state.

---

### Task 1: Add failing architecture and persistence tests

**Files:**
- Modify: `apps/html-prototype/tests/chapter-reflection.test.ts`
- Modify: `apps/html-prototype/tests/scene-layouts.test.ts`
- Modify: `apps/html-prototype/tests/scene-debug-editor.test.ts`
- Modify: `apps/html-prototype/tests/mobile-regressions.test.ts`
- Modify: `apps/html-prototype/tests/labis-motor.test.ts`

- [ ] Add assertions that `march30-too-fated` is registered, routes to `330-corridor`, and appears in March Forest nodes.
- [ ] Add assertions that generic SceneLayout lookup accepts `330-corridor` and preserves its authored spawn, interactions, trigger, and portrait/landscape assets after override loading.
- [ ] Add source-level assertions that authored scenes use the generic draw/update/return path and that SceneDebugEditor no longer depends on `sceneId === "labis"` or `labisEchoes` for generic anchors.
- [ ] Add a Reflection Wall/SaveManager regression proving a kept chapter note survives journey reset and chapter replay does not delete it.
- [ ] Run `npm test -w apps/html-prototype` and verify the new expectations fail for the current implementation.

### Task 2: Generalize authored chapter and SceneLayout identifiers

**Files:**
- Modify: `apps/html-prototype/src/types.ts`
- Modify: `apps/html-prototype/src/fixtures/chapterPlan.ts`
- Create: `apps/html-prototype/src/fixtures/march30Chapter.ts`
- Modify: `apps/html-prototype/src/systems/ChapterRegistry.ts`
- Modify: `apps/html-prototype/src/systems/SceneLayouts.ts`

- [ ] Introduce a core-scene union plus an extensible authored runtime scene identifier.
- [ ] Define `march30-too-fated` with `runtimeScene: "330-corridor"`, empty dialogue, and a non-cutscene reflection contract.
- [ ] Add the March 30 Forest entry without relying on a new hardcoded world coordinate; let the existing placement resolver choose an authored slot or deterministic overflow.
- [ ] Keep existing Forest/Bakery/Labis definitions unchanged except for type generalization.
- [ ] Keep dynamic manifest loading and authored JSON precedence intact.

### Task 3: Add generic authored-scene runtime routing

**Files:**
- Modify: `apps/html-prototype/src/app.ts`

- [ ] Preload and resolve any scene present in `sceneLayoutManifest`.
- [ ] Render custom authored scenes through a generic layout renderer while retaining Forest, Bakery, Labis, and Muji Room specialized renderers.
- [ ] Move through generic scene obstacles, expose authored interactions/triggers, and make an authored `exit` interaction return to Forest.
- [ ] Enter `chapter.runtimeScene` without assuming Bakery/Labis music or cutscene state.
- [ ] Ensure orientation changes map the player between authored portrait and landscape layouts.
- [ ] Make chapter doors always enterable/replayable; preserve legacy saved progress fields for compatibility without using completion state to block replay.

### Task 4: Make Scene Debug Editor anchors generic

**Files:**
- Modify: `apps/html-prototype/src/systems/SceneDebugEditor.ts`

- [ ] Expose a normal `Anchor` tool for every authored scene.
- [ ] Render and edit all `layout.anchors` keys generically.
- [ ] Expose echo-anchor editing by arbitrary layout key, without importing `labisEchoes` or checking `sceneId === "labis"`.
- [ ] Preserve existing placement-slot and Labis layout behavior.
- [ ] Keep Save Layout writing the selected scene/orientation JSON through the existing endpoint.

### Task 5: Verify and review

- [ ] Run `npm run typecheck -w apps/html-prototype`.
- [ ] Run `npm test -w apps/html-prototype`.
- [ ] Run `npm run build -w apps/html-prototype`.
- [ ] Verify 330-corridor production paths and authored JSON are unchanged byte-for-byte.
- [ ] Manually enter March 30 from Forest in portrait and landscape, confirm the authored scene loads, use its exit, replay it, and confirm kept reflection notes remain in Reflection Wall.
- [ ] Review final diff and report any remaining manual Scene Debug anchor authoring work.
