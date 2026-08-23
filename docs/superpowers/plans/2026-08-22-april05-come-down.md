# April 5 “下来一下” Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the authored April 5 Scene 405 chapter as a replayable, orientation-safe playable memory using the existing chapter registry, authored layouts, shared dialogue/reflection UI, shared diary record, and the smallest reusable actor/prop/effect runtime extensions.

**Architecture:** Add a focused `april05Chapter.ts` fixture containing the chapter contract, asset metadata, semantic choreography, reflection choices, and optional echoes. Generalize the existing authored-scene path from its current 406-only assumptions to a chapter-configured authored runtime, while retaining `CutsceneSystem`, `SceneActorRenderer`, `drawSceneSpriteAsset`, RPG-bottom dialogue, standalone reflection choices, chapter-scoped trigger sessions, and existing diary/ending persistence. Keep 405 layout JSON geometry untouched; main positions resolve from authored anchors, while its three secondary echoes resolve directly from `cat-approach`, `bicycle-st-comment`, and `phone-after-return`. Preserve the existing orientation-specific alias resolver for 406 only.

**Tech Stack:** TypeScript ES2022, DOM Canvas 2D, Node `node:test`, static authored PNG/JSON assets, existing local fixture adapters.

## Global Constraints

- Latest remote `main` reference: `5d14e1c2722334d6e1d1f647b4d69255704a822c`.
- Target `apps/html-prototype`; keep the app runnable after each milestone.
- `sceneId`, `label`, and `runtimeScene` are `405`; chapter id is `april05-come-down`; date is `04.05`; title is `下来一下`.
- Authored 405 landscape and portrait JSON geometry is the source of truth and must not be rewritten or recalculated.
- Preserve the existing 406 `watergun-crossing` / `r-watergun-crossing` alias resolver; 405 must not add those keys. 405 uses exactly `cat-approach`, `bicycle-st-comment`, and `phone-after-return`.
- Use existing RPG-bottom dialogue, standalone reflection choices, Journal editor, chapter progress, trigger session, and ending quote UI; no 405-specific subsystem or UI family.
- Required interactions in both orientations are exactly `diary`, `main-memory-replay`, `bench`, `bicycle`, `cat-echo`, and `exit`.
- Required echo anchors are exactly `cat-approach`, `bicycle-st-comment`, and `phone-after-return`.
- Required canonical anchors are exactly the keys in the locked Visual Semantic Map; do not add `ms-bench-seat`, `et-bench-seat`, `angela-bench-position`, or `st-bench-position`.
- Reuse approved March 30 assets and approved 405 assets only; do not generate replacement art.
- One automatic main-memory event is `april05-ktho-night-memory`, consumed once per chapter visit and not suppressed by historical completion on re-entry.
- Manual replay runs the full main experience. Replays never add persistent tendency/reward contribution after first completion.
- Never commit `.private-spec/`, real diary data, uploads, generated memory graphs, embeddings, scene caches, secrets, or personal logs. Do not push.

## File Map

- Create: `apps/html-prototype/src/fixtures/april05Chapter.ts` — chapter definition, reflection choices, approved asset metadata, canonical main/echo action resolution.
- Create: `apps/html-prototype/tests/april05-chapter.test.ts` — registry, Forest, diary, interaction, anchor, and reflection contract tests.
- Create: `apps/html-prototype/tests/april05-runtime.test.ts` — action order, sprite identity/facing, hair ruffle/lock, VFX/prop ownership, lifecycle, replay, and echo tests.
- Modify: `apps/html-prototype/src/fixtures/chapterPlan.ts` — add the 04.05 Forest entry.
- Modify: `apps/html-prototype/src/fixtures/authoredDiaryEntries.ts` — add one canonical editable April 5 diary entry.
- Modify: `apps/html-prototype/src/systems/ChapterRegistry.ts` — register `april05Chapter`.
- Modify: `apps/html-prototype/src/systems/SceneLayouts.ts` only for a regression-safe alias fallback if required; never mutate authored JSON.
- Modify: `apps/html-prototype/src/systems/CutsceneSystem.ts` only for generic effect asset metadata if 405 water VFX cannot be expressed by the current action shape.
- Modify: `apps/html-prototype/src/systems/SceneActorRenderer.ts` only if a generic asset/visible-bounds/feet helper is required; reuse the current source-bounds path.
- Modify: `apps/html-prototype/src/app.ts` — chapter-configured authored routing, preload/render 405 assets, interactions, echo/replay/diary/ending.
- Modify: `apps/html-prototype/src/styles.css` only for a proven shared mobile overflow/focus correction.
- Modify: `apps/html-prototype/public/scene-layouts/manifest.json` only if 405 is absent; preserve both existing JSON files byte-for-byte when present.

## Locked Pre-Implementation Evidence

- Pass 1 fetched and inspected latest `origin/main` before source edits.
- Pass 2 inspected all 405 individual `hair-ruffle`, `hair-ruffled`, `lock`, `locked`, ST (`su`), and Angela (`te`) PNG states and measured transparent bounds.
- Pass 3 locked `docs/superpowers/plans/2026-08-22-april05-come-down-visual-semantic-map.md`.

### Task 1: Add failing chapter/asset/layout contract tests

**Files:** Create `apps/html-prototype/tests/april05-chapter.test.ts` and `apps/html-prototype/tests/april05-runtime.test.ts`.

**Interfaces:** Consume current `chapterRegistry`, `forestEntries`, `findChapterDiaryEntry`, `resolveSceneEchoAnchor`, `CutsceneSystem`, and layout JSONs. Produce assertions for `april05Chapter`, `april05Assets`, `april05MainMemoryActions`, `april05EchoActions`, and `resolveApril05Actions` before those exports exist.

- [ ] **Step 1: Write the failing chapter contract tests.** Assert id/runtime/date/title, registry and Forest route, one canonical diary entry, exact interactions in both JSONs, exact trigger fields, exact required anchors, exactly three echo anchors, and no deleted anchors.
- [ ] **Step 2: Write the failing runtime tests.** Assert approved asset paths and normalized visible-bounds/feet metadata, ST/Angela mapping, ordered main dialogue/visual states, one water-gun prop, water VFX actor/target, paired hair-ruffle/lock states, three checkpoints, fixed closure lines, final fade/despawn order, and three dialogue-only secondary echo sets with no physical prop.
- [ ] **Step 3: Run the focused tests and verify RED.** From `apps/html-prototype`, run `npm run build; node --test dist/tests/april05-chapter.test.js dist/tests/april05-runtime.test.js`. Expected: the new imports/exports are missing or assertions fail because April 5 is not implemented.

### Task 2: Implement the April 5 fixture and shared authored-data registration

**Files:** Create `apps/html-prototype/src/fixtures/april05Chapter.ts`; modify `chapterPlan.ts`, `authoredDiaryEntries.ts`, and `ChapterRegistry.ts`.

**Interfaces:** Export `april05Chapter: ChapterDefinition`, `april05Assets`, `april05ReflectionChoices`, `april05MainMemoryActions`, `april05EchoActions`, and `resolveApril05Actions(layout, actions): CutsceneAction[]`. Resolve main positions through `layout.anchors[key]` and secondary echo positions through the three authored echo keys; throw a descriptive error for missing authored anchors.

- [ ] **Step 1: Add canonical chapter/diary/Forest data.** Use diary id `authored-diary-april05-come-down`, date `2026-04-05`, `memoryKind: "chapter"`, `chapterId: "april05-come-down"`, and physical location `KTHO entrance/front sitting area`.
- [ ] **Step 2: Add approved metadata.** Define individual 405 PNG entries with source, visible bounds, normalized feet, and no guessed grid. Define reused March 30 frame entries from existing metadata for MS/ET/water-spray/water-gun/VFX/dissolve; keep `mirrorForLeft` only where the reused sheet requires it.
- [ ] **Step 3: Add the canonical main sequence.** Use existing spawn/move/moveGroup/sprite/spriteGroup/face/prop/effect/dialogue/checkpoint/fade/despawn actions. Include exactly one canonical water-gun prop id, one main-memory event, three reflection checkpoints, and the exact dialogue/closure order from the Visual Semantic Map.
- [ ] **Step 4: Add optional echoes.** Use the authored `cat-approach`, `bicycle-st-comment`, and `phone-after-return` anchors for the three secondary echo sets. Add no physical water-gun prop, second persistent event, or second main anchor. Keep the sets dialogue-only when no approved cat art exists.
- [ ] **Step 5: Run focused tests and verify fixture GREEN.** Run `npm run build; node --test dist/tests/april05-chapter.test.js dist/tests/april05-runtime.test.js`; fixture assertions should pass before app integration.

### Task 3: Generalize the existing authored runtime minimally

**Files:** Modify `CutsceneSystem.ts`, `SceneActorRenderer.ts`, and `app.ts`.

**Interfaces:** Add no checkpoint framework. Keep CutsceneSystem sequencing unchanged. Add only optional effect asset metadata if required. Select `april05Assets` or `april06Assets` by authored chapter/runtime scene; actor rendering continues through `drawSceneActor` and `drawSceneSpriteAsset`.

- [ ] **Step 1: Add failing shared-runtime assertions.** Prove a 405 cutscene resolves irregular visible bounds, preserves explicit facing through move, retains one world prop id, and carries effect actor/target/asset through the generic action type.
- [ ] **Step 2: Run RED.** Run `npm run build; node --test dist/tests/april05-runtime.test.js`; the new effect metadata/lookup assertion should fail before production changes.
- [ ] **Step 3: Implement the smallest extension.** Pass the selected authored asset map and image map into the existing actor pipeline; resolve props from that map; reuse the March 30 nozzle-to-target water-VFX geometry through one shared helper while preserving 406 dissolve behavior.
- [ ] **Step 4: Run GREEN.** Run `npm run build; node --test dist/tests/april05-runtime.test.js`.

### Task 4: Wire 405 lifecycle, interactions, replay, reflection, and diary sync

**Files:** Modify `apps/html-prototype/src/app.ts`; modify `styles.css` only if browser evidence proves a shared correction is needed.

**Interfaces:** Use `chapterRegistry[this.currentMemoryKey()]`, existing `startChapterMemoryRun`, `recordChapterExperienceChoice`, `completeChapterMemoryRun`, `showChapterDiary`, `showChapterEndingQuote`, and `chapterTriggerSessions`. Automatic trigger consumes once per `enterCurrentMemory` visit; Forest return deletes that chapter session; re-entry creates a fresh session even after historical completion.

- [ ] **Step 1: Add failing source/lifecycle tests.** Assert the generic authored branch is not 406-only, 405’s six interactions route correctly, main trigger and replay start the full actions, chapter and Journal share one entry, and Forest return clears visit-scoped trigger state.
- [ ] **Step 2: Run RED.** Run `npm run build; node --test dist/tests/april05-chapter.test.js dist/tests/april05-runtime.test.js`; app-source lifecycle assertions should fail.
- [ ] **Step 3: Implement chapter-configured routing.** Replace literal 406 checks with an authored chapter lookup; use shared RPG-bottom dialogue and standalone reflection choice rendering for all 405 checkpoints; keep the existing `showChapterDiary`/Journal editor as the canonical diary path.
- [ ] **Step 4: Implement anti-farming/replay.** Do not add persistent tendencies, choices, residues, or completed event ids on replay after first completion. Let current-run quote selection vary locally without replacing the first stored closing quote/tone.
- [ ] **Step 5: Run GREEN.** Run `npm run build; node --test dist/tests/april05-chapter.test.js dist/tests/april05-runtime.test.js`.

### Task 5: Verify both orientations and the whole project

**Files:** Modify only files required by failures found in Tasks 1–4.

- [ ] **Step 1: Run `npm test`** from `apps/html-prototype`; record baseline failures separately from regressions.
- [ ] **Step 2: Run `npm run typecheck` and `npm run build`** independently; confirm dist contains both 405 JSONs, PNGs, and manifest.
- [ ] **Step 3: Browser-verify landscape** at `http://127.0.0.1:4173/`: enter 04.05, check background, identities, trigger, water hit, hair ruffle, lock, reflections, ending, six interactions, and echoes.
- [ ] **Step 4: Browser-verify portrait**: for the existing 406 chapter, check the `r-watergun-crossing` alias, reachability, source-bounds foot anchoring, and no black screen/overflow.
- [ ] **Step 5: Run `git status --short`, `git diff --check`, and `git diff --stat`**; confirm temp inspection copies are outside the repo and no private/personal data is tracked.

### Task 6: Handoff without push

- [ ] **Step 1:** Report latest main, changed files, authored JSON preservation, visual map, runtime sequence, identity/facing, prop/effect ownership, presentation strategy, lifecycle/anti-farming, tests, typecheck/build/browser results, and limitations.
- [ ] **Step 2:** Do not commit or push unless the user explicitly asks later.
