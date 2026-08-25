# June 25 Portrait-First Chapter Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the canonical authored June 25 chapter for scene `625` and a backward-compatible shared portrait-sequence runtime.

**Architecture:** Keep all June 25 semantics in `src/fixtures/june25Chapter.ts` and the authored runtime registry. Add optional sequence definitions beside the existing 624 single-portrait fields. Let `app.ts` orchestrate generic sequence state, availability, reflection, and completion without owning 625 content.

**Tech Stack:** TypeScript, Node built-in test runner, Canvas/DOM rendering already used by `apps/html-prototype`.

## Global Constraints

- Preserve the existing uncommitted 625 assets, SceneLayout JSON, and manifest entry.
- Correct only the nine documented landscape Echo-anchor radii; preserve all approved 625 x/y coordinates and other geometry.
- Do not modify the generic normalized-radius helper unless a failing test proves an actual generic defect.
- Keep 624 on `echoPortraitIds` / `echoPortraitDialogues` unchanged.
- Do not add 625 WORLD actors, human sprites, choreography, or a chapter-specific renderer.
- Keep all 625 sequence IDs, mappings, dialogue, availability, diary content, reflections, and ending data fixture/authored-runtime driven.
- Reuse `assets/labis/book-with-ms-photos.png` through the existing diary presentation.
- Do not commit or push.

---

### Task 1: Add failing generic portrait-sequence tests

**Files:**
- Modify: `apps/html-prototype/tests/memory-portrait-presentation.test.ts`
- Modify: `apps/html-prototype/tests/echo-portrait.test.ts`
- Modify: `apps/html-prototype/tests/authored-chapter-registry.test.ts`

**Interfaces:**
- Consumes: existing `renderMemoryPortrait`, 624 authored runtime definition.
- Produces: executable expectations for additive sequence data and contained opaque portraits.

- [ ] **Step 1: Write the failing tests**

Add tests that import the new sequence types/helpers and assert:

```ts
test("portrait sequence renders a beat using the shared contained portrait renderer", () => {
  const sequence = {
    id: "example-sequence",
    beats: [{
      portrait: "assets/example/full-background.png",
      dialogue: [{ speaker: "Memory", text: "first line" }]
    }]
  };
  const markup = renderMemoryPortraitSequenceBeat(sequence, 0, 0, {
    orientation: "landscape",
    width: 1280,
    height: 720
  });
  assert.match(markup, /src="assets\/example\/full-background\.png"/);
  assert.match(markup, /object-fit:contain/);
  assert.match(markup, /data-action="portrait-sequence-next"/);
});

test("624 keeps its existing single-portrait authored runtime fields", () => {
  const runtime = authoredRuntimeByScene["624"];
  assert.deepEqual(runtime.echoPortraitIds?.["carrot-milk-memory"], "june24-angela-st-echo");
  assert.equal(runtime.portraitSequences, undefined);
});
```

- [ ] **Step 2: Run the focused tests and verify the expected failure**

Run from `apps/html-prototype`:

```powershell
npm test -- --test-name-pattern="portrait sequence|624 keeps"
```

Expected: TypeScript/build failure because the new sequence API and runtime fields do not yet exist.

---

### Task 2: Implement the minimal generic sequence presentation API

**Files:**
- Modify: `apps/html-prototype/src/systems/MemoryPortraitPresentation.ts`
- Modify: `apps/html-prototype/tests/memory-portrait-presentation.test.ts`

**Interfaces:**
- Consumes: `DialoguePortrait`, `MemoryPortraitViewport`, `renderMemoryPortrait`.
- Produces: `AuthoredPortraitDialogueLine`, `AuthoredPortraitBeat`, `AuthoredPortraitSequence`, and a shared beat renderer used by `app.ts`.

- [ ] **Step 1: Add the smallest types and renderer needed by the failing test**

Define the three sequence types, then add a renderer that selects the requested beat and dialogue line, resolves the existing responsive layout, and delegates to `renderMemoryPortrait` with `presentationData: "portrait-sequence"` and the supplied action. Do not add WORLD-coordinate fields or transparent-image assumptions.

- [ ] **Step 2: Run the focused tests and verify they pass**

```powershell
npm test -- --test-name-pattern="portrait sequence|624 keeps"
```

Expected: PASS.

---

### Task 3: Add authored-runtime sequence definitions and generic availability helpers

**Files:**
- Modify: `apps/html-prototype/src/systems/AuthoredChapterRegistry.ts`
- Modify: `apps/html-prototype/tests/authored-chapter-registry.test.ts`

**Interfaces:**
- Consumes: `AuthoredPortraitSequence` from `MemoryPortraitPresentation.ts`.
- Produces: optional `portraitSequences`, `mainPortraitSequenceId`, `echoPortraitSequenceIds`, and `echoAvailability` fields plus a generic availability resolver.

- [ ] **Step 1: Extend the runtime type additively**

Add optional fields equivalent to:

```ts
portraitSequences?: Record<string, AuthoredPortraitSequence>;
mainPortraitSequenceId?: string;
echoPortraitSequenceIds?: Record<string, string>;
echoAvailability?: Record<string, { requiresMainCompletion?: boolean }>;
```

Keep all existing fields and the 624 entry unchanged.

- [ ] **Step 2: Add failing availability tests before wiring the app**

Test that an authored Echo with `requiresMainCompletion: true` is unavailable before completion and available after completion, while an explicitly ungated Echo is available in both states. Test that legacy `echoRequiresMainCompletion: false` preserves 624 behavior.

- [ ] **Step 3: Implement the generic availability resolver**

Resolve explicit per-Echo rules first; otherwise use the legacy chapter-wide rule. Return a boolean only. Do not reference scene IDs.

- [ ] **Step 4: Run focused tests**

```powershell
npm test -- --test-name-pattern="authored runtime|availability|624"
```

Expected: PASS.

---

### Task 4: Add failing June 25 fixture, registry, Forest, and exact layout tests

**Files:**
- Create: `apps/html-prototype/tests/june25-chapter.test.ts`
- Modify: `apps/html-prototype/tests/scene-layouts.test.ts`

**Interfaces:**
- Consumes: approved `public/assets/625/**` and `public/scene-layouts/625/**` files.
- Produces: exact contract tests for the fixture and approved geometry.

- [ ] **Step 1: Write tests before creating the fixture**

Assert:

- `chapterRegistry["june25-so-i-came"]` exists with runtime scene `625`, date `2026-06-25`, exact title, location, and canonical diary ID;
- Forest contains and routes the chapter through the existing registry;
- `authoredRuntimeByScene["625"]` exists with no WORLD actor runtime assets/actions;
- landscape and portrait files exist with dimensions `1672×941` and `941×1672`;
- approved spawn values match both JSON files exactly;
- the exact 12 interaction IDs are present in both layouts;
- the nine landscape Echo radii match their interaction radii while all approved x/y values remain unchanged;
- portrait Echo radii remain `56`;
- the shared diary asset path is exactly `assets/labis/book-with-ms-photos.png`;
- the authored diary body exactly matches Section 7 and is not replaced with raw source material.

Assert exact mappings and sequence order:

```ts
assert.deepEqual(mainSequence.beats.map((beat) => beat.portrait), [
  "assets/625/memory-portrait/07A-locked.png",
  "assets/625/memory-portrait/07B-realize.png",
  "assets/625/memory-portrait/07C-speechless.png",
  "assets/625/memory-portrait/08A-late-night-conversation.png",
  "assets/625/memory-portrait/08B.png"
]);
```

Also assert door, desk, wardrobe, hairdryer, cards, night, morning, and laundry mappings, with desk and morning each containing two beats.

- [ ] **Step 2: Run the tests and verify the expected failure**

```powershell
npm test -- --test-name-pattern="June 25|scene 625|625"
```

Expected: FAIL because the fixture and registrations do not yet exist.

---

### Task 5: Implement the June 25 authored fixture and registrations

**Files:**
- Create: `apps/html-prototype/src/fixtures/june25Chapter.ts`
- Modify: `apps/html-prototype/src/fixtures/authoredDiaryEntries.ts`
- Modify: `apps/html-prototype/src/fixtures/chapterPlan.ts`
- Modify: `apps/html-prototype/src/systems/ChapterRegistry.ts`
- Modify: `apps/html-prototype/src/systems/AuthoredChapterRegistry.ts`

**Interfaces:**
- Consumes: generic sequence types and approved layout JSON.
- Produces: complete fixture-driven June 25 chapter and runtime definition.

- [ ] **Step 1: Add fixture identity and canonical diary entry**

Export `june25Chapter`, `june25DiaryEntry`, and the authored runtime data from one fixture. Use the exact Section 7 body supplied by the user, joined only by the existing diary-entry representation. Do not import or substitute raw June 25/26 source material.

- [ ] **Step 2: Add every authored sequence and dialogue line**

Use the exact approved portrait filenames, casing, beat ordering, and dialogue from the request. Keep `bed-main-memory` as the main sequence and keep `bed-night-memory`, `bed-foot-morning-memory`, and `laundry-left-memory` as separate interactions.

- [ ] **Step 3: Add reflection and ending data**

Define the single required reflection prompt with its three choices/effects/responses and the four restrained ending quote variants. Do not add romance adjudication or a moral lesson.

- [ ] **Step 4: Register the chapter**

Add the June 25 Forest entry, `chapterRegistry` entry, authored runtime scene `625` entry, exact shared diary entry, explicit per-Echo availability, and empty 625 actor asset map. The runtime resolver must not create WORLD actors or choreography.

- [ ] **Step 5: Run focused fixture tests**

```powershell
npm test -- --test-name-pattern="June 25|scene 625|625"
```

Expected: PASS.

---

### Task 6: Add failing lifecycle and app-orchestration tests

**Files:**
- Modify: `apps/html-prototype/tests/chapter-memory-experience.test.ts`
- Modify: `apps/html-prototype/tests/memory-portrait-presentation.test.ts`
- Modify: `apps/html-prototype/tests/june25-chapter.test.ts`

**Interfaces:**
- Consumes: sequence fixture and generic availability resolver.
- Produces: regression coverage for continuous beats, locked/unlocked Echo state, first completion, replay, and diary isolation.

- [ ] **Step 1: Test sequence progression without WORLD reset**

Use the pure sequence state/advance API or a testable orchestration helper to assert that advancing a dialogue line keeps the same beat, advancing the final line of a beat changes directly to the next beat, and only the final line closes the sequence. Assert no intermediate WORLD reset callback is invoked.

- [ ] **Step 2: Test Main and Echo availability**

Assert `bed-night-memory` is inactive before Main completion, including no glow/prompt candidate, and becomes active after completion without reconstructing the scene. Assert ungated Echoes remain active before Main completion.

- [ ] **Step 3: Test first completion versus replay**

Assert first completion marks `june25-bed-main-memory` once and yields a single tendency contribution; replay does not add another contribution, clear reflection history, relock Portrait 09, or mark unrelated Echoes complete.

- [ ] **Step 4: Test diary isolation**

Assert opening/closing the canonical diary does not complete Main, unlock Portrait 09, duplicate tendency persistence, or alter Reflection state.

- [ ] **Step 5: Run tests and verify expected failure**

```powershell
npm test -- --test-name-pattern="sequence progression|bed-night|replay|diary isolation"
```

Expected: FAIL because app orchestration does not yet consume the new sequence fields.

---

### Task 7: Implement generic app sequence orchestration and locked Echo behavior

**Files:**
- Modify: `apps/html-prototype/src/app.ts`
- Modify: `apps/html-prototype/src/systems/MemoryPortraitPresentation.ts`

**Interfaces:**
- Consumes: authored runtime sequence mappings, availability resolver, existing chapter progress methods, shared renderers.
- Produces: additive generic runtime behavior used by 625 while preserving all legacy authored paths.

- [ ] **Step 1: Add generic sequence state and start/advance/finish functions**

Keep sequence state separate from `CutsceneSystem` and existing `echoPortraitState`. Store only sequence ID, mode, interaction ID, beat index, and dialogue index. Start Main from `mainPortraitSequenceId`; start sequence Echoes from `echoPortraitSequenceIds`; otherwise fall back to current Cutscene or single-portrait behavior.

- [ ] **Step 2: Render sequence dialogue through `MemoryPortraitPresentation`**

Render the current beat and line with the shared contained layout. Keep the overlay open while changing lines and beats. Do not clear the WORLD between beats. Use a generic `portrait-sequence-next` action and preserve focus/accessibility behavior.

- [ ] **Step 3: Wire completion to existing chapter lifecycle**

On first Main completion, call existing completion/progress methods once, unlock availability immediately, open the existing authored Reflection lifecycle, and return to the WORLD after the portrait sequence closes. On replay, finish without first-completion persistence or relocking.

- [ ] **Step 4: Apply per-Echo availability to active object and glow rendering**

Before Main completion, exclude gated Echo interactions from `activeObject` and from `drawAuthoredInteractionTells`. After completion, recompute from current progress in the same update loop. Do not add a 625-specific branch.

- [ ] **Step 5: Preserve 624 fallback behavior**

Leave `startEchoPortrait`, `showEchoPortrait`, and the existing 624 runtime fields operational when no sequence mapping is present. Do not add sequence data to 624.

- [ ] **Step 6: Run focused tests**

```powershell
npm test -- --test-name-pattern="sequence progression|bed-night|replay|diary isolation|624"
```

Expected: PASS.

---

### Task 8: Correct only the approved 625 landscape Echo radii and add regression coverage

**Files:**
- Modify: `apps/html-prototype/public/scene-layouts/625/landscape.json`
- Modify: `apps/html-prototype/tests/scene-layouts.test.ts`
- Modify: `apps/html-prototype/tests/scene-debug-authoring.test.ts` only if a focused regression proves a generic issue

**Interfaces:**
- Consumes: existing approved 625 layout coordinates.
- Produces: corrected landscape Echo radii with coordinate preservation.

- [ ] **Step 1: Add a failing regression assertion**

Read the approved landscape JSON and assert each affected Echo radius equals its matching interaction radius, each affected Echo x/y equals its pre-existing approved value, and portrait Echo radii remain `56`.

- [ ] **Step 2: Run the regression and verify it fails on the corrupted JSON**

```powershell
npm test -- --test-name-pattern="625.*radius|Echo radius|normalized-radius"
```

Expected: FAIL because the nine landscape radii are currently multiplied by `941`.

- [ ] **Step 3: Correct only the nine radius values**

Replace only: milk `58`, door `66`, desk `58`, cards `46`, wardrobe `68`, hairdryer `48`, night `44`, morning `42`, laundry `58`. Do not reformat or alter any other layout field.

- [ ] **Step 4: Run the regression and inspect the diff**

```powershell
npm test -- --test-name-pattern="625.*radius|Echo radius|normalized-radius"
git diff -- apps/html-prototype/public/scene-layouts/625/landscape.json
```

Expected: PASS; diff contains only the nine radius-value changes in that file. If a generic normalization test fails, fix the shared helper with its own regression; otherwise leave it unchanged.

---

### Task 9: Run full verification and browser acceptance

**Files:**
- No intentional source changes; fix failures using a new failing test first.

- [ ] **Step 1: Run focused tests**

```powershell
Set-Location apps/html-prototype
npm test -- --test-name-pattern="June 25|625|SceneLayout|Memory Portrait|Echo Portrait|diary|authored registry|chapter lifecycle|624"
```

- [ ] **Step 2: Run the complete suite**

```powershell
npm test
```

- [ ] **Step 3: Run typecheck and production build**

```powershell
npm run typecheck
npm run build
```

- [ ] **Step 4: Run repository hygiene checks**

```powershell
git diff --check
git status --short --branch
git rev-list --left-right --count HEAD...origin/main
```

- [ ] **Step 5: Run browser acceptance if available**

Start the local app using the existing development script and exercise scene 625 in both landscape and portrait. Verify authored spawn/collision traversal, every interaction and glow, diary content and shared book asset, automatic Main trigger, continuous portrait beats without WORLD flashing, locked/unlocked Portrait 09, replay, Reflection, exit, and absence of MS/ET WORLD actors. If browser execution is unavailable, report that explicitly without claiming visual acceptance passed.

- [ ] **Step 6: Final handoff**

Report starting HEAD and ahead/behind, created/modified files, generic capability extension, radius-bug result, exact interaction IDs, sequence/mapping/unlock details, diary asset/body verification, focused/full test counts, typecheck/build results, browser result, diff-check result, and final status. Do not commit or push.

