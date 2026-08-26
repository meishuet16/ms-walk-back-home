# Authored Chapter Replayable Runs Design

## Goal

Make authored chapters replayable by keeping all authored gameplay interpretation in one in-memory `AuthoredChapterRun`, while preserving unrelated personal persistence and the existing once-per-visit trigger session.

## Scope

This is a shared-runtime semantic migration for the existing Bakery, Labis, 330, 405, 406, 523, 624, and 625 chapters. It does not add or rewrite chapter content, layouts, assets, dialogue, portraits, diary pages, coordinates, or registrations.

## Runtime model

`ChapterMemoryExperience.ts` will own the session-only run shape:

```ts
type AuthoredChapterRun = {
  chapterId: string;
  mainCompleted: boolean;
  discoveredEchoIds: Set<string>;
  reflectionChoiceIds: string[];
  tendencies: Tendencies;
  resolvedReflection?: ChapterReflection;
  diaryRead: boolean;
};
```

The app has exactly one current run reference. Entering a chapter creates a fresh run with `mainCompleted: false`, an empty discovery set, empty reflection choices, zero tendencies, and `diaryRead: false`. Main completion and Echo discovery mutate that run only. Returning to Forest sets it to `null`; no run is serialized.

The existing `ChapterTriggerSession` remains separate and session-only. Entering a chapter creates a new trigger session, and leaving removes it. Its once-per-current-visit behavior is not tied to completion history.

## Reflection and endings

`EndingResolver` will consume a narrow current-run input containing only reflection choice IDs and tendencies. It will retain its existing scoring and deterministic tie-breaking. Completion records the resolved reflection on the current run and displays that reflection immediately; it never falls back to an earlier quote or tone.

Reflection choices will use a narrowly scoped optional-response type. An authored response is rendered and advanced with Continue. A missing response advances directly to the next checkpoint or closing quote, while the choice ID and tendency effects are still recorded in the current run. Normal dialogue `Choice.response` remains required.

## Authored availability

Authored Runtime scenes derive Main-gated Echo availability from `currentRun.mainCompleted`. Labis derives its optional Echo prerequisites, ordering, and count from `currentRun.discoveredEchoIds`. No persisted `completedMemoryEvents`, unlocked Echo collection, or global tendency baseline participates in these decisions. The existing 625 portrait sequences and `bed-night-memory` availability rules remain data-driven and unchanged.

## Persistence boundary

The canonical `JourneyState` payload will retain scene/player navigation, Room state, personal player state, and final journey data, but will omit authored gameplay history: visited/walked/read sets, choices, tendencies, and completed event IDs. SaveManager will strip those properties when writing or loading old Journey JSON. Backup and cloud-loaded legacy Journey objects will be accepted and passed through the same current-state application path without seeding a run. Legacy autosave migration will preserve diary, Room, and other personal data but will not convert chapter completion into Journey progress or Room residue.

`RoomJourneyState.residueIds` remains available as a generic Room field. The authored chapter completion methods stop writing chapter IDs into it; the legacy autosave adapter stops importing `completedChapters` into it. All unrelated Room fields and behavior remain persisted.

When a saved navigation scene is an authored chapter scene, applying the save will return to Forest with no active run rather than displaying a chapter scene without its session state.

## Verification

Focused tests will cover fresh choices, tendencies, closure recalculation, absence of first-completion contribution, 625 Main/Echo session gating, Echo discovery reset, trigger reset, optional reflection responses, 624 and 625 portrait regressions, legacy Journey/backup tolerance, and preservation of unrelated diary/Room data. The full suite, typecheck, production build, diff check, and available browser acceptance will run before handoff.
