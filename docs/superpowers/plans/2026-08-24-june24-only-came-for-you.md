# June 24 “Only Came Here for You” Implementation Plan

> For agentic workers: use the executing-plans workflow and complete the tasks in order. Every production change is preceded by a focused failing test.

**Goal:** Implement Chapter 624 Round 3 end-to-end using the saved authored layouts and exact approved assets, with shared RPG-bottom Main Memory and presentation-space Echo Portraits.

**Architecture:** Add one June 24 fixture for chapter data, frame metadata, semantic action choreography, reflection choices, and Echo definitions. Register it through the existing authored runtime, extending only the shared runtime and presentation layer needed for full-experience replay and responsive Echo Portrait overlays. SceneLayout remains the sole spatial source of truth.

**Tech Stack:** TypeScript, Canvas 2D, DOM/CSS overlays, Node test runner, npm, existing HTML prototype runtime.

## Global Constraints

- Preserve all unrelated local worktree changes, including current Scene Debug authoring work.
- Do not modify approved Scene 624 JSON coordinates or regenerate/replace assets.
- Main Memory presentation is RPG_BOTTOM.
- Echo Portraits are presentation-space only and never use SceneLayout/world actor coordinates.
- visualScale changes sprite size only; world feet and interaction coordinates are invariant.
- Use exact approved assets and existing tendency keys only.
- Automatic and manual Main Memory both run the full experience; persistent first-completion effects do not farm.
- Do not push. Commit only after all verification passes, as explicitly requested.

---

### Task 1: Capture baseline and write the focused June 24 red tests

**Files:**
- Create: apps/html-prototype/tests/june24-chapter.test.ts
- Create: apps/html-prototype/tests/echo-portrait.test.ts
- Modify: none

**Interfaces:**
- Tests import the future exports from src/fixtures/june24Chapter.ts and the shared Echo Portrait presentation module.
- Tests read the existing saved JSON from public/scene-layouts/624 and assert byte-level authored values for required anchors.

- [ ] Step 1: Record the current worktree status and the exact SHA of origin/main without staging or modifying existing user changes.

Run: git status --short; git rev-parse HEAD; git rev-parse origin/main

- [ ] Step 2: Add failing chapter tests covering the required registration and semantic contract.

The test file must assert:

1. chapterRegistry contains june24-only-came-for-you with runtimeScene 624;
2. the June 24 diary entry has chapterId june24-only-came-for-you and date 2026-06-24;
3. both saved layouts use their exact background path and contain the authored trigger;
4. the trigger resolves june24-table-arrival → june24-only-came-for-you / june24-table-memory;
5. required anchor values match the saved JSON in both orientations;
6. resolveJune24Actions(layout, main) starts ET at et-reading-seat and MS at ms-entry-start;
7. the 624 frame registry uses individual up/down/left/right PNGs with idle/walkA/passing/walkB mapping;
8. the approved semantic action paths, topology, ownership, and physical phone/Xiaoba order are present;
9. the Main Memory action list contains three reflection checkpoints and closes with the approved goodbye states;
10. visualScale 0.3 is applied to sprites without changing the authored feet position.

- [ ] Step 3: Add failing Echo Portrait tests covering exact asset mapping, semantic IDs, and presentation isolation.

The test file must assert:

1. each semantic Echo ID resolves its exact approved portrait path;
2. Portrait and Landscape resolve the same asset for each semantic Echo;
3. Echo data has no SceneLayout anchor or world actor position field;
4. the shared presentation model accepts orientation and viewport intent without a world coordinate;
5. rendered markup contains the exact local asset and bounded responsive presentation hooks;
6. the model has an explicit disposable/finished state and does not expose interaction coordinates;
7. Echo completion is represented separately from Main Memory completion/reward state.

- [ ] Step 4: Run the focused tests and confirm they fail because the June 24 fixture and Echo Portrait module are not yet registered.

Run: npm test --workspace @walk/html-prototype -- june24

Expected: TypeScript/test failure identifying missing June 24 exports/registration, not a passing test or an unrelated environment failure.

### Task 2: Add the June 24 fixture and exact asset/frame registry

**Files:**
- Create: apps/html-prototype/src/fixtures/june24Chapter.ts
- Modify: apps/html-prototype/src/systems/ChapterRegistry.ts
- Modify: apps/html-prototype/src/fixtures/authoredDiaryEntries.ts
- Test: apps/html-prototype/tests/june24-chapter.test.ts

**Interfaces:**
- Export june24Chapter, june24Assets, june24FrameRegistries, june24ReflectionChoices, june24EchoDefinitions, and resolveJune24Actions(layout, mode, echoId?).
- resolveJune24Actions consumes only the passed SceneLayout for world positions.

- [ ] Step 1: Implement the exact 624 MS frame registry.

Use assets/624/ms-base/{direction}/{direction}-{01|02|03|04}.png. Treat 01 as idle, 02 as walkA, 03 as passing, and 04 as walkB. Create SceneSpriteAsset metadata from actual PNG dimensions and visible bounds, with feet anchored at the ground-contact point. Do not use the 523 registry or runtime sprite-sheet slicing.

- [ ] Step 2: Implement the exact table-action asset map.

Bind each semantic anchor to its approved path, scale 0.3, flip false, offset 0, opacity 1, and z-order 0. Use table-facing-right for ET and table-facing-left for MS exactly as approved. Include the supplied surprised, phone reaction, guilt, quiet, and goodbye PNGs.

- [ ] Step 3: Implement anchor helpers and orientation-specific movement direction.

Create a point(layout, anchorId) helper that throws when a required authored anchor is missing. Create the 624 UP walking cycle as [walkA, passing, walkB, passing]. Movement direction and arrival facing must be separate. The entry move uses UP in Portrait and the deterministic direction derived from the selected layout in Landscape, while arrival facing is the approved seated orientation.

- [ ] Step 4: Implement the full Main Memory action list.

Use spawn, move, moveGroup, sprite, spriteGroup, prop, wait, dialogue, checkpoint, and despawn actions already supported by CutsceneSystem. Preserve this sequence: ET reading materialization; MS entry; ordinary talk; neck joke; carrot-milk callback with one owner; second return; Xiaoba handoff; May 23 reveal; MS phone show; ET hand stop; visible pause; MS stopped reaction; apology/then-what conversation; five-cent exchange; guilt; silence; head-down quiet table; goodbye stand/look/walk; dissolve/cleanup.

Do not add standalone carrot milk, Xiaoba, phone, or duplicate actor instances. Props must carry explicit owner values or be baked into the approved action frame.

- [ ] Step 5: Implement the three reflection choice points, exact responses/effects, quote directions, chapter definition, and canonical closure.

Use only the existing tendency keys. The canonical closure event ID is june24-table-memory. Register the diary entry id authored-diary-june24-only-came-for-you with concise factual text and location KTHO/university study table context.

- [ ] Step 6: Register the chapter and diary entry through existing registries.

Add the chapter to ChapterRegistry and authoredChapterDiaryEntries. Do not add a second persistence path or change the DiaryLibrary schema.

- [ ] Step 7: Run only the focused June 24 tests.

Run: npm test --workspace @walk/html-prototype

Expected: June 24 fixture/registration assertions pass or fail only at the shared runtime/presentation assertions still pending. Fix fixture failures before continuing.

### Task 3: Add shared Echo Portrait presentation

**Files:**
- Create: apps/html-prototype/src/systems/EchoPortraitPresentation.ts
- Modify: apps/html-prototype/src/systems/PresentationRenderer.ts
- Modify: apps/html-prototype/src/styles.css
- Test: apps/html-prototype/tests/echo-portrait.test.ts

**Interfaces:**
- EchoPortraitDefinition: id, assetPath, lines, semanticSpeaker, presentationMode, orientationPolicy, and optional pacing.
- EchoPortraitLayout: orientation, viewportWidth, viewportHeight, maxWidth, maxHeight, side, and sceneDim.
- renderEchoPortrait(definition, layout): string.
- resolveEchoPortraitLayout(orientation, viewportWidth, viewportHeight): EchoPortraitLayout.
- isEchoPortraitComplete(state): boolean.

- [ ] Step 1: Implement the failing shared presentation API expected by the tests.

The API must be presentation-only. It must not accept SceneLayout, SceneActor, camera, world position, interaction point, or visualScale arguments. Asset paths must pass normalizeLocalAssetPath before rendering.

- [ ] Step 2: Implement exact responsive layout rules.

Portrait uses a bounded lower-side overlay that does not replace the scene and leaves the RPG dialogue/UI area reachable. Landscape may use more lateral width but preserves aspect ratio and meaningful scene visibility. Use shared class names and a small reusable modifier rather than June-24-only CSS.

- [ ] Step 3: Add the shared markup and CSS for materialization/dissolve.

Render the exact portrait asset, semantic speaker/line content, and a close/continue action. Add a state class for entering/exiting without changing the underlying canvas or player coordinates.

- [ ] Step 4: Run the Echo Portrait tests and relevant presentation tests.

Run: npm test --workspace @walk/html-prototype

Expected: all Echo Portrait and existing shared presentation tests pass, with no asset substitution or world-coordinate references.

### Task 4: Integrate Scene 624 into the shared authored runtime and lifecycle

**Files:**
- Modify: apps/html-prototype/src/app.ts
- Modify: apps/html-prototype/src/systems/ChapterProgressManager.ts only if a shared lifecycle regression requires it
- Modify: apps/html-prototype/src/systems/ChapterMemoryExperience.ts only if a shared current-run completion hook is required
- Modify: apps/html-prototype/src/systems/CutsceneSystem.ts only if a failing regression test proves a generic capability is missing
- Test: apps/html-prototype/tests/june24-chapter.test.ts
- Test: apps/html-prototype/tests/chapter-progress.test.ts
- Test: apps/html-prototype/tests/chapter-memory-experience.test.ts

**Interfaces:**
- authoredRuntimeByScene["624"] uses june24Chapter, june24Assets, resolveJune24Actions, june24ReflectionChoices, and the three compatibility interaction mappings.
- Echo Portrait lifecycle is independent from authoredCutscene and chapterMemoryRun.

- [ ] Step 1: Write/extend failing lifecycle tests for Scene 624.

Prove first trigger allowed, second trigger blocked in the same visit, manual table-memory replay allowed after auto trigger, leave/re-enter creating a fresh auto-trigger session, full replay reaching all reflection checkpoints/current-run ending, and Echo completion not contributing Main Memory completion/reward.

- [ ] Step 2: Register Scene 624 in authoredRuntimeByScene and preserve the existing generic authored render path.

Use triggerId june24-table-arrival and mainInteractionId table-memory. Do not add Scene 624-specific coordinate transforms.

- [ ] Step 3: Route the compatibility interaction IDs.

Keep table-memory as the full Main Memory replay. Route the three compatibility IDs to their semantic Echo definitions. Do not route them to Main Memory fragments, and do not require completion of Main Memory before a secondary Echo unless the approved lifecycle already requires it.

- [ ] Step 4: Add Echo Portrait state to the shared app overlay lifecycle.

When an Echo starts, retain the current gameplay scene and player position, set a shared overlay mode, show the exact portrait/dialogue, and stop world interaction only while the overlay is active. On completion, clear the overlay and restore normal Muji exploration without changing player coordinates.

- [ ] Step 5: Fix Main Memory full-experience completion through the shared lifecycle.

Automatic and manual runs must both continue from the canonical CutsceneSystem actions through the three reflection checkpoints, current-run quote resolution, and canonical closure. Do not let manual replay stop after raw cutscene completion. Persistent contribution must remain first-completion guarded.

- [ ] Step 6: Ensure the phone dialogue panel does not obscure the physical contact checkpoint.

Use the existing RPG-bottom responsive CSS and the approved action order. Do not move actors or anchors to compensate for overlay geometry.

- [ ] Step 7: Run focused lifecycle and chapter tests.

Run: npm test --workspace @walk/html-prototype

Expected: the new Scene 624 tests and existing lifecycle tests pass. Any regression must be fixed in shared code with a new regression assertion.

### Task 5: Verify runtime spatial invariants and exact rendering bindings

**Files:**
- Modify: apps/html-prototype/src/systems/SceneActorRenderer.ts only if a failing test identifies a generic feet/scale defect
- Modify: apps/html-prototype/src/systems/CutsceneSystem.ts only if a failing test identifies a generic movement/arrival-facing defect
- Test: apps/html-prototype/tests/june24-chapter.test.ts
- Test: apps/html-prototype/tests/scene-layouts.test.ts
- Test: apps/html-prototype/tests/cutscene-visuals.test.ts
- Test: apps/html-prototype/tests/presentation-renderer.test.ts

**Interfaces:**
- SceneLayout coordinates remain authored absolute world feet positions.
- drawSceneSpriteAsset and CutsceneSystem preserve those positions when visualScale changes or movement interpolates.

- [ ] Step 1: Add explicit portrait and landscape feet assertions for all static key states.

Use the saved JSON values directly and compare resolved actions’ actor x/y to the exact anchors. Assert ET x is left of MS x in both orientations.

- [ ] Step 2: Add exact asset and order assertions.

Assert the runtime action list contains the approved asset path for every key pose, phone ordering show → stop → reaction → dialogue, Xiaoba give → receive, guilt, quiet, and goodbye. Assert that the phone owner is MS and no duplicate prop/actor action is emitted.

- [ ] Step 3: Run focused shared runtime tests.

Run: npm test --workspace @walk/html-prototype

Expected: all SceneLayout, CutsceneSystem, SceneActorRenderer, presentation, and June 24 focused tests pass.

### Task 6: Run build, full suite, and browser acceptance; fix regressions

**Files:**
- Modify only files implicated by failing tests or browser evidence.
- Do not modify apps/html-prototype/public/scene-layouts/624/portrait.json.
- Do not modify apps/html-prototype/public/scene-layouts/624/landscape.json.
- Do not modify approved PNGs under apps/html-prototype/public/assets/624.

- [ ] Step 1: Run typecheck.

Run: npm run typecheck --workspace @walk/html-prototype

Expected: exit code 0.

- [ ] Step 2: Run the production build.

Run: npm run build --workspace @walk/html-prototype

Expected: exit code 0 and a current dist build.

- [ ] Step 3: Run the full workspace test suite.

Run: npm test

Expected: record pass count and separate any pre-existing unrelated failure with its exact test name/output.

- [ ] Step 4: Start the local prototype server for browser acceptance.

Run: npm run dev --workspace @walk/html-prototype

Open the reported localhost URL in Portrait viewport first, then Landscape. Use the actual rendered browser state, not only HTTP/page-load checks.

- [ ] Step 5: Verify Portrait checkpoints.

Confirm ET left/reading, MS entry feet at ms-entry-start, UP cycle to ms-table-approach, first seated topology, singular carrot milk, surprised reveal, visible phone contact before “不用翻了”, MS stopped reaction, singular Xiaoba handoff, ET guilt, head-down quiet ending, approved goodbye, and clean return to Muji exploration.

- [ ] Step 6: Verify Portrait Echoes.

Activate carrot-milk-memory, five-cent-memory, and xiaoba-memory. Confirm the current Scene 624 remains visible, exact portrait assets appear, no world actors are created, no Main Memory reward/reflection runs, Echo 2 stops at its approved uncertainty, and exploration resumes after each overlay.

- [ ] Step 7: Verify Landscape regression.

Confirm no blank render, correct scene asset, correct ET-left/MS-right topology, independent authored coordinates, stable feet under scale, exact action assets, no orientation leakage, bounded portraits, no stretching, visible scene context, and clean Echo disposal.

- [ ] Step 8: Repeat focused tests, typecheck, build, and full suite after every fix.

Do not claim acceptance until fresh commands confirm the final state.

### Task 7: Final diff review and commit

**Files:**
- Only implementation, focused tests, and the approved spec/plan documents.

- [ ] Step 1: Verify approved layout and asset integrity.

Run: git diff --quiet -- apps/html-prototype/public/scene-layouts/624/portrait.json apps/html-prototype/public/scene-layouts/624/landscape.json

Run: git status --short

Expected: the approved 624 layout JSON files are unchanged; pre-existing unrelated changes remain visible and are not staged.

- [ ] Step 2: Review the complete diff and check privacy/worktree constraints.

Run: git diff --check; git diff --stat; git status --short

Confirm no .private-spec, real diary, raw upload, generated cache, secret, log, or unrelated deletion is staged.

- [ ] Step 3: Stage only the June 24 implementation, focused tests, spec, and plan.

Run: git add apps/html-prototype/src apps/html-prototype/tests/june24-chapter.test.ts apps/html-prototype/tests/echo-portrait.test.ts docs/superpowers/specs/2026-08-24-june24-only-came-for-you-design.md docs/superpowers/plans/2026-08-24-june24-only-came-for-you.md

Do not stage the pre-existing deleted 405.zip/523.zip or unrelated manifest/asset changes unless the final diff proves they are part of this request.

- [ ] Step 4: Commit after fresh verification.

Run: git commit -m "feat: implement June 24 memory chapter"

- [ ] Step 5: Verify the commit and final worktree.

Run: git show --stat --oneline HEAD; git status --short

Confirm no push was performed and report the final commit SHA, changed files, focused test count, full-suite result, browser results, and any pre-existing unrelated failures.
