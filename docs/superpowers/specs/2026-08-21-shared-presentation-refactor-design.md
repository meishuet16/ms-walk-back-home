# Shared Presentation Refactor Design

**Goal:** Generalize VN, lightweight RPG, reflection-choice, and reflection presentation by role while preserving all authored chapter data and current shorthand portrait visuals.

## Architecture

`src/systems/PresentationRenderer.ts` owns pure, chapter-independent presentation markup, safe local-image validation, sizing, offsets, and shared role classes. `app.ts` and chapter fixture/config resolvers remain responsible for deciding which presentation is active and resolving authored shorthand/crop knowledge into renderer-neutral portrait models.

The shared public portrait config contains only `src`, `width`, `height`, `offsetX`, and `offsetY`. March 30 crop/source bounds, shorthand IDs, sprite classes, gameplay scale, SceneLayout data, and cutscene state never move into the renderer.

Existing shorthand portraits remain compatible: March 30 keeps its current sprite and transparent-source crop behavior, Bakery keeps its existing `friend`/`muji` resolution, and Labis motor VN keeps an empty portrait when none is supplied. Direct local image paths normalize `assets/...` and `/assets/...`, reject traversal/filesystem/remote/scheme-bearing paths, and render an empty portrait when invalid.

## Presentation roles

- `vn`: centered portrait-bearing dialogue, including custom local images.
- `rpg`: compact dark translucent in-scene dialogue/narration.
- `reflection-choice`: stacked lightweight reflective choices.
- `reflection`: quiet compact response, ending quote, or afterimage.

Only lightweight roles receive lower stage-relative placement. Normal `.modal` and `.vn` remain centered, including diary/journal surfaces and existing Bakery, March 30, and Labis VN dialogue.

## Responsive rules

VN portrait regions stay bounded and clipped; requested image dimensions are preferred sizes with stable portrait-region constraints, intrinsic aspect ratio preservation, and portrait-local offsets. Lightweight overlays use stage-relative bottom placement, safe-area spacing, and control-aware clearance so the order remains scene, lightweight overlay, gap, joystick/A controls. Landscape RPG width remains approximately `min(66%, 650px)`.

## Invariants

No narrative text, choice IDs/effects/tendencies, progression, cutscene timing, sprite frames, SceneLayout/anchors, gameplay prop scale, actor scale, water VFX, or authored crop metadata changes. The pre-existing March 30 jacket-wipe offset `68` is preserved.

## Verification

Add focused tests for renderer/path/sizing/role behavior and source-level regressions for centered VN/modal behavior, shared RPG/reflection placement, shorthand compatibility, narrative invariants, crop metadata, and gameplay scale. Run the focused tests, full prototype test suite, typecheck, build, `git diff --check`, and browser checks at 390×844 Portrait plus the current landscape/Desktop viewport when browser tooling is available.
