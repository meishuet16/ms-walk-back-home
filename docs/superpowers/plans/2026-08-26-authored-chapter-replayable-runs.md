# Authored Chapter Replayable Runs Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate authored chapter gameplay from persistent first-completion history to one fresh in-memory run per chapter entry.

**Architecture:** `ChapterMemoryExperience.ts` owns the only current authored run, including Main completion, Echo discovery, reflection choices, tendencies, and resolved reflection. `app.ts` creates and discards that run at chapter boundaries; `ChapterTriggerSession` remains a separate current-visit trigger guard. `JourneyState` and all persistence adapters retain personal state while stripping or ignoring legacy authored-progress fields.

**Tech Stack:** TypeScript, Node `node:test`, esbuild, browser Canvas runtime, localStorage, optional Supabase/backup adapters.

## Global Constraints

- Do not implement the July 21–22 chapter.
- Do not rewrite approved authored fixture narrative, layouts, coordinates, assets, portraits, diary content, or registration.
- The MVP remains local and free by default.
- Do not persist authored chapter gameplay history or current `AuthoredChapterRun`.
- Preserve unrelated diary, Reflection Wall, Muji Room, music, toolbox, settings, backup, and cloud behavior.
- Do not commit or push.

### Task 1: Lock the current-run API with failing tests

**Files:**
- Modify: `apps/html-prototype/tests/chapter-memory-experience.test.ts`
- Modify: `apps/html-prototype/tests/chapter-progress.test.ts`
- Modify: `apps/html-prototype/tests/april05-runtime.test.ts`
- Modify: `apps/html-prototype/tests/june24-chapter.test.ts`

**Interfaces:**
- Consumes: existing ChapterMemoryExperience and ChapterProgressManager exports.
- Produces: tests specifying `mainCompleted`, `discoveredEchoIds`, `reflectionChoiceIds`, zero fresh tendencies, no persistent contribution, and trigger reset behavior.

- [ ] **Step 1: Replace the first-completion test assertions**

Change the current-run tests so a fresh run is created with `{ chapterId, mode }`, uses `reflectionChoiceIds`, starts with empty tendencies, and has no `persistentContribution` or `firstCompletionPending` properties. Assert that a second run contains only its own choice and tendency effect.

- [ ] **Step 2: Add the required semantic cases**

Add focused assertions for:

```ts
const runA = applyChapterExperienceChoice(startChapterMemoryExperience({ chapterId: "bakery-day", mode: "automatic" }), choiceA);
const runB = applyChapterExperienceChoice(startChapterMemoryExperience({ chapterId: "bakery-day", mode: "automatic" }), choiceB);
assert.deepEqual(runB.reflectionChoiceIds, [choiceB.id]);
assert.notDeepEqual(runA.tendencies, runB.tendencies);
assert.equal("persistentContribution" in runA, false);
assert.equal("firstCompletionPending" in runA, false);
```

Also cover Main completion/discovery reset through the exported run helpers, and update the obsolete `ChapterProgress` replay expectation to assert the new result is current-run based.

- [ ] **Step 3: Run the focused tests and verify they fail for the intended API/semantic reason**

Run: `npm test -- --test-name-pattern="chapter runs|current run|first-completion|automatic Chapter trigger"` from `apps/html-prototype`.

Expected: failures mention removed constructor fields/properties or the old preserved-closure behavior, not fixture-loading or syntax errors.

### Task 2: Implement the single session-only run and reflection input

**Files:**
- Modify: `apps/html-prototype/src/systems/ChapterMemoryExperience.ts`
- Modify: `apps/html-prototype/src/systems/EndingResolver.ts`
- Modify: `apps/html-prototype/src/types.ts`
- Modify: `apps/html-prototype/src/systems/ChapterProgressManager.ts`

**Interfaces:**
- Consumes: `Tendencies`, `Choice`, `ChapterReflection`, and current reflection resolver scoring.
- Produces: `AuthoredChapterRun`, fresh-run creation, current-run choice application, Main/discovery helpers, and a resolver input `{ choices: string[]; tendencies: Tendencies }`.

- [ ] **Step 1: Add the narrow optional-response type**

In `types.ts`, keep `Choice.response: string` unchanged and add:

```ts
export type ReflectionChoice = Omit<Choice, "response"> & { response?: string };
```

Use it only for authored reflection choice collections.

- [ ] **Step 2: Replace the old experience fields**

Define `AuthoredChapterRun` with `chapterId`, `mainCompleted`, `discoveredEchoIds`, `reflectionChoiceIds`, `tendencies`, optional `resolvedReflection`, and `diaryRead`. Make `startChapterMemoryExperience({ chapterId, mode })` return empty state. Apply effects directly to the run’s tendencies and append only the current choice ID. Add helpers for marking Main complete, marking an Echo discovered, marking the diary read, and converting the run to resolver input.

- [ ] **Step 3: Make EndingResolver consume current-run input**

Change `toneFromProgress` and `preferredQuote` to read `input.choices` and `input.tendencies`; preserve all existing scoring, choice-ID mappings, and quote order. Remove the `ChapterProgress` import and type dependency.

- [ ] **Step 4: Remove obsolete ChapterProgress behavior**

Delete the persistent-shaped `ChapterProgress` type and all progress/finish functions from `ChapterProgressManager.ts`. Retain only `ChapterTriggerSession`, `createChapterTriggerSession`, `consumeAutomaticChapterTrigger`, and `resetChapterTriggerSession`. Re-run the focused tests; expected failures should now be only call-site updates and changed assertions.

### Task 3: Migrate app runtime to the single run

**Files:**
- Modify: `apps/html-prototype/src/app.ts`
- Modify: `apps/html-prototype/src/systems/AuthoredChapterRegistry.ts`
- Modify: `apps/html-prototype/src/fixtures/labisMotorMemory.ts`

**Interfaces:**
- Consumes: `AuthoredChapterRun`, current-run helpers, `ReflectionChoice`, and `authoredEchoIsAvailable`.
- Produces: fresh entry/exit lifecycle, run-based Main/Echo gating, run-based reflection resolution, optional response handling, and preserved trigger-session behavior.

- [ ] **Step 1: Remove global authored-progress state**

Remove `visitedMemories`, `walkedThroughMemories`, `readMemories`, `choices`, `tendencies`, `completedMemoryEvents`, and `chapterProgress` from `WalkBackHomeApp`. Remove their reset/save/load call sites. Keep `chapterMemoryRun` as the sole authored gameplay state.

- [ ] **Step 2: Create exactly one run at chapter entry and discard it at Forest return**

At `enterCurrentMemory`, reset any previous run and create a fresh run after routing succeeds. On `finishReturnToForest`, set the run to `null`. Do not recreate it when starting a Main replay or Echo during the same chapter visit; those actions operate on the existing run.

- [ ] **Step 3: Replace gates with current-run state**

Use `chapterMemoryRun?.mainCompleted === true` for authored Main-gated Echoes and `chapterMemoryRun?.discoveredEchoIds` for Labis prerequisites, priority, count, and the “continue before exit” path. Mark Main complete when the Main cutscene/portrait sequence ends, and mark Echo discovery when an Echo finishes. Preserve the data-driven `echoAvailability` path for 625.

- [ ] **Step 4: Resolve and display closure from this run**

Make all `resolveChapterReflection` calls pass the current run input. Completion stores the newly resolved reflection on the run and never merges with or falls back to historical data. Remove `firstCompletionPending`, `persistentContribution`, global tendency commits, and `room.residueIds` writes from authored completion methods.

- [ ] **Step 5: Support missing reflection responses**

In authored reflection choice handling, record the choice first. If `choice.response` is non-empty, render it and wait for Continue. If it is absent/empty, advance immediately through the existing checkpoint/closing path. Do not invent text and do not alter normal dialogue choices.

- [ ] **Step 6: Preserve current-visit triggers**

Keep `chapterTriggerSessions` creation on entry, consumption once per visit, deletion on Forest return, and reset behavior. Ensure no trigger condition checks persisted completion.

### Task 4: Remove authored history from persistence without broad rewrite

**Files:**
- Modify: `apps/html-prototype/src/types.ts`
- Modify: `apps/html-prototype/src/systems/SaveManager.ts`
- Modify: `apps/html-prototype/src/systems/BackupManager.ts`
- Modify: `apps/html-prototype/src/systems/SupabaseSync.ts`
- Modify: `apps/html-prototype/tests/save-manager.test.ts`
- Modify: `apps/html-prototype/tests/adapter-save.test.ts`
- Modify: `apps/html-prototype/tests/supabase-sync.test.ts`
- Modify: `apps/html-prototype/tests/journal-backup-roundtrip.test.ts`

**Interfaces:**
- Consumes: narrowed `JourneyState`, old v1 SaveState/autosave JSON, legacy backup/cloud Journey JSON.
- Produces: canonical Journey payload without authored history and tolerant readers that preserve unrelated personal data.

- [ ] **Step 1: Narrow the canonical JourneyState type**

Remove only `visitedMemories`, `walkedThroughMemories`, `choices`, `tendencies`, `readMemories`, and `completedMemoryEvents` from `JourneyState`. Keep `scene`, `player`, `room`, optional personal player, and final journey fields. Keep `SaveState` as the legacy autosave/slot compatibility shape.

- [ ] **Step 2: Strip legacy fields on Journey save/load**

Add a small SaveManager normalizer that destructures the six legacy fields and returns the remaining version-1 JourneyState. Apply it in `saveJourney` and `loadJourney`. Old extra properties are ignored; malformed unrelated user data is not deleted.

- [ ] **Step 3: Stop legacy authored imports**

In `migrateLegacyAutosave`, do not populate the new Journey payload from `openedDoors`, `completedChapters`, `choices`, `tendencies`, `readMemories`, or completion events. Preserve migrated diary entries, scrapbook artifacts, Room visits/reflections/lamp state, and other personal state. Do not map `completedChapters` into `room.residueIds`.

- [ ] **Step 4: Make backup/cloud legacy loads tolerant**

Ensure parsed legacy Journey objects can be accepted by backup restore and cloud pull, then pass through the same stripped current Journey shape before application. Keep personal diary, Reflection Wall, Room, music, and media behavior unchanged.

- [ ] **Step 5: Avoid restoring an authored scene without a run**

When applying a saved navigation state whose scene is an authored chapter scene, restore Forest navigation with no current run rather than leaving the app in a chapter scene with missing session state.

### Task 5: Update focused regression coverage

**Files:**
- Modify: `apps/html-prototype/tests/chapter-memory-experience.test.ts`
- Modify: `apps/html-prototype/tests/chapter-progress.test.ts`
- Modify: `apps/html-prototype/tests/chapter-reflection.test.ts`
- Modify: `apps/html-prototype/tests/tendency-ending.test.ts`
- Modify: `apps/html-prototype/tests/authored-chapter-registry.test.ts`
- Modify: `apps/html-prototype/tests/june24-chapter.test.ts`
- Modify: `apps/html-prototype/tests/memory-portrait-presentation.test.ts`
- Modify: `apps/html-prototype/tests/labis-motor.test.ts`
- Modify: `apps/html-prototype/tests/muji-room.test.ts`
- Modify: `apps/html-prototype/tests/backup-manager.test.ts`
- Modify: `apps/html-prototype/tests/ui-policy.test.ts`

**Interfaces:**
- Consumes: migrated runtime and persistence APIs.
- Produces: explicit acceptance coverage for replay, 625 gating, 624/625 presentation, Labis session Echoes, optional responses, legacy tolerance, and Room coupling removal.

- [ ] **Step 1: Add two-run closure and tendency tests**

Resolve Bakery or another existing authored chapter once with path A and once with path B using two separately created runs. Assert distinct quote IDs where authored scoring differs, current-run-only choice IDs/tendencies, and no first-completion contribution.

- [ ] **Step 2: Add 625 Main/Echo reset tests**

Assert `bed-night-memory` is unavailable for a new run, available after marking Main complete, and unavailable again for a newly created run. Assert Echo discovery is absent in the new run.

- [ ] **Step 3: Add optional-response presentation tests**

Construct a reflection choice without `response` and assert the app source/flow advances without generated response text while its effects remain in resolver input. Keep the authored-response assertion for 624/625 content.

- [ ] **Step 4: Add persistence compatibility tests**

Save a canonical Journey and assert its serialized JSON has none of the six legacy fields. Load old Journey/backup/cloud-shaped JSON containing those fields and assert no crash, no run seeding, and preservation of diary/Room/personal data. Assert authored chapter completion no longer changes `room.residueIds`.

- [ ] **Step 5: Run focused regressions and fix implementation, not unrelated assertions**

Run: `npm test -- --test-name-pattern="chapter|reflection|ending|625|624|Labis|save|backup|cloud|portrait|Muji Room"`.

Expected: all focused migration and existing content/presentation tests pass.

### Task 6: Full verification and handoff

**Files:**
- No additional source files expected.

**Interfaces:**
- Consumes: complete migrated workspace.
- Produces: verified test/build results and an audit-backed final report; no commit or push.

- [ ] **Step 1: Re-scan obsolete references**

Run `rg -n --glob '!public/**' 'visitedMemories|walkedThroughMemories|readMemories|completedMemoryEvents|chapterProgress|firstCompletionPending|persistentContribution|closingQuoteId|reflectionTone|recordChapterChoice|finishChapterWalkthrough|markChapterMemoryRead|beginChapterVisit' apps/html-prototype/src apps/html-prototype/tests` and inspect every remaining match. Only legacy compatibility parsing/types/tests documenting old input may remain, and they must not seed runtime state.

- [ ] **Step 2: Run the required verification commands**

From `apps/html-prototype`, run `npm test`, `npm run typecheck`, and `npm run build`. From the repository root, run `git diff --check`.

- [ ] **Step 3: Perform browser acceptance if available**

Run the dev server and manually exercise an older reflection chapter plus 625 through two visits, checking current-run closure changes, 625 Echo gating, optional Echo interaction, portrait sequence continuity, no WORLD flash, no new console errors, and Forest return. If browser automation is unavailable, report that explicitly.

- [ ] **Step 4: Recheck final repository state**

Run `git status --short --branch` and `git rev-list --left-right --count HEAD...origin/main`. Confirm no commit or push occurred, list files created/modified, and report exact verification counts/results.
