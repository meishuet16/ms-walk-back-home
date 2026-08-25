# June 25 Portrait-First Chapter Design

## Goal

Add the canonical June 25–26 authored chapter for runtime scene `625` while extending the shared authored runtime with the smallest reusable portrait-sequence capability.

## Constraints

- Treat the existing uncommitted `625` assets, SceneLayout JSON, and manifest entry as authoritative.
- Change only the nine documented landscape Echo-anchor radii; preserve every approved 625 coordinate and asset filename.
- Keep 624 on the existing single-portrait `echoPortraitIds` / `echoPortraitDialogues` path.
- Keep June 25 content, mappings, availability, diary body, reflections, and ending data fixture/authored-runtime driven.
- Reuse `assets/labis/book-with-ms-photos.png` through the existing shared diary presentation.
- Do not add June 25 WORLD actors, human sprites, choreography, or a chapter-specific renderer.

## Architecture

`MemoryPortraitPresentation.ts` will own the generic portrait-sequence data types and shared rendering contract. A sequence contains ordered beats; each beat contains one opaque portrait and its dialogue lines. The existing `renderMemoryPortrait` layout remains the renderer, using `object-fit: contain` and the current responsive viewport sizing.

`AuthoredRuntimeDefinition` will gain optional sequence definitions and mappings:

- `portraitSequences`
- `mainPortraitSequenceId`
- `echoPortraitSequenceIds`
- `echoAvailability`

Existing single-portrait fields remain unchanged and continue to drive 624.

`app.ts` will only orchestrate generic sequence state and lifecycle. It will resolve the sequence and availability from the authored runtime definition, retain the overlay while dialogue advances, switch beats without returning to the WORLD, and close back into the normal chapter lifecycle. It will not contain 625 IDs, dialogue, asset paths, or authored semantics.

## June 25 authored data

`src/fixtures/june25Chapter.ts` will own:

- `june25Chapter` with identity `june25-so-i-came`, runtime scene `625`, date `2026-06-25`, and title `06.25 · 所以我就来了。`;
- the canonical Section 7 diary entry body, kept distinct from raw source diary material;
- portrait sequence definitions and all dialogue lines;
- the semantic Echo mappings and availability rules;
- the single required Reflection prompt and choices;
- restrained ending quote variants;
- an empty WORLD actor asset set and no actor choreography.

The chapter will be registered in `ChapterRegistry`, `AuthoredChapterRegistry`, and the existing Forest entry list. The canonical diary entry will be included in the shared authored diary seed without changing the diary renderer.

## Lifecycle

- Automatic entry uses the approved authored trigger and starts the main portrait sequence.
- First completion marks `june25-bed-main-memory` complete once, persists the normal tendency contribution once, unlocks `bed-night-memory`, and begins the existing Reflection lifecycle.
- Manual replay uses `bed-main-memory`, replays the same sequence, and does not duplicate tendencies, reset Reflection history, relock Echoes, or clear discovered state.
- `bed-night-memory` is locked both in interaction selection and in glow/prompt rendering before Main completion; it becomes active immediately after completion in the current scene.
- Other Echoes use their authored per-Echo availability and remain independently usable.
- Diary open/close only reads the canonical chapter diary and does not affect Main completion, Echo unlocks, Reflection state, or tendencies.

## Geometry and Scene Debug

The approved `public/scene-layouts/625/{landscape,portrait}.json` files remain the runtime source of truth. The nine landscape Echo-anchor radii will be corrected to their matching interaction radii while preserving all x/y values. The generic normalized-radius helper will not be changed unless a focused regression test proves it is defective.

## Verification

Focused tests will cover the chapter registry, authored runtime definition, exact approved layouts/assets, all interaction IDs and mappings, sequence ordering, locked/unlocked Echo behavior, opaque portrait rendering, no WORLD actors, replay/completion semantics, canonical diary body and shared book asset, and 624 compatibility. Then run the full test suite, typecheck, production build, `git diff --check`, and browser acceptance in landscape and portrait when available. No commit or push will be performed.
