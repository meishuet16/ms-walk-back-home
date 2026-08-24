# Memory Portrait Presentation Generalization Implementation Plan

> **For agentic workers:** Execute this plan inline with test-first checkpoints. Do not modify Scene 624 assets, SceneLayout JSON, world actor choreography, or Cutscene schema.

**Goal:** Generalize the June 24 Echo Portrait renderer into one reusable presentation-space Memory Portrait primitive and let authored Main Memory dialogue consume the existing CutsceneDialogue.portrait field.

**Architecture:** Add MemoryPortraitPresentation.ts as the only generic portrait layout/markup implementation. Keep EchoPortraitPresentation.ts as a thin semantic ID-to-approved-asset wrapper that delegates layout and rendering to the generic module. Route portrait-bearing authored dialogue through the same generic renderer while preserving portrait-less renderRpgDialogue() output and the existing authored dialogue lifecycle.

**Tech Stack:** TypeScript, Node test runner, existing HTML/CSS overlay, existing DialoguePortrait and CutsceneDialogue.portrait contracts.

## Global Constraints

- Do not modify Chapter 624 design, SceneLayout coordinates, approved assets, world actor mappings, anchors, sprite scale, choreography, reflection text, Echo dialogue, interaction IDs, or canonical behavior.
- Do not add a parallel portrait field or dialogue schema.
- Memory Portrait must remain presentation-space only and must not accept world x/y, anchors, camera coordinates, collision data, or actor visualScale.
- Preserve the three June 24 Echo ID-to-asset mappings exactly.
- Preserve portrait-less RPG_BOTTOM dialogue markup and lifecycle.
- Preserve unrelated uncommitted work; commit only shared portrait files, focused tests, and this plan document.
- Do not push.

---

### Task 1: Add failing generic presentation tests

**Files:**
- Create: apps/html-prototype/tests/memory-portrait-presentation.test.ts
- Modify: apps/html-prototype/tests/presentation-renderer.test.ts only if a shared compatibility assertion is required.

**Interfaces:**
- Test resolveMemoryPortraitLayout(portrait, viewport).
- Test renderMemoryPortrait(options).
- Test existing renderRpgDialogue() output remains unchanged.
- Test CutsceneDialogue continues to expose only portrait?: DialoguePortrait.

- [ ] Write tests for string and config DialoguePortrait inputs, portrait and landscape viewport sizing, contain markup, escaped speaker/text, advance action, and absence of world-coordinate fields.
- [ ] Write a failing test proving Echo compatibility APIs delegate to generic Memory Portrait output while retaining exact June 24 assets.
- [ ] Write a failing test proving the authored dialogue path uses the generic renderer when portrait is defined and preserves RPG markup when it is absent.
- [ ] Run npm run build; node --test dist/tests/memory-portrait-presentation.test.js dist/tests/echo-portrait.test.js dist/tests/presentation-renderer.test.js and confirm failures are caused by the missing generic API/consumer integration.

### Task 2: Implement the single generic presentation primitive

**Files:**
- Create: apps/html-prototype/src/systems/MemoryPortraitPresentation.ts
- Modify: apps/html-prototype/src/systems/EchoPortraitPresentation.ts
- Modify: apps/html-prototype/src/systems/PresentationRenderer.ts only to reuse existing local asset normalization if needed.

**Interfaces:**
- MemoryPortraitViewport: orientation, width, height.
- MemoryPortraitLayout: portrait config, width, height, fit contain, position center-top or center.
- resolveMemoryPortraitLayout(portrait, viewport) returns MemoryPortraitLayout.
- MemoryPortraitRenderOptions: portrait, speaker, text, layout, canAdvance, action, optional presentationClassName and presentationId.
- renderMemoryPortrait(options) returns string.

- [ ] Normalize string portraits to { src } and preserve config width/height as responsive max dimensions.
- [ ] Resolve only viewport/orientation/config dimensions; never introduce x/y or world fields.
- [ ] Render one shared presentation markup with contain-fitting image, dialogue, escaped text, and configurable advance action.
- [ ] Keep Echo-specific class/data compatibility through render options rather than a second renderer.
- [ ] Make EchoPortraitPresentation.ts retain its public compatibility APIs, exact mapping table, and delegate both layout and markup to MemoryPortraitPresentation.ts.

### Task 3: Integrate authored Main Memory dialogue

**Files:**
- Modify: apps/html-prototype/src/app.ts
- Modify: apps/html-prototype/src/styles.css

- [ ] Import the generic layout/renderer in app.ts.
- [ ] In showAuthoredDialogue(), branch only on dialogue.portrait: no portrait uses the exact existing renderRpgDialogue() call; a portrait uses generic Memory Portrait markup with action authored-dialogue-next and current viewport orientation.
- [ ] Keep authoredOverlayMode as dialogue and retain advanceAuthoredDialogue() cleanup.
- [ ] Generalize Echo CSS selectors to the shared memory portrait class while retaining compatibility selectors for .echo-portrait.
- [ ] Do not add chapter registration, SceneLayout reads, world actor changes, or persistent portrait state.

### Task 4: Verify and refactor

**Files:**
- Modify: focused tests/docs only if an assertion or usage example needs correction.

- [ ] Run focused generic, Echo, CutsceneSystem, PresentationRenderer, authored runtime, chapter experience, and June 24 tests.
- [ ] Run typecheck and production build.
- [ ] Run the full suite and record unrelated baseline failures accurately.
- [ ] Attempt Portrait/Landscape browser acceptance only if browser tooling connects; otherwise report the tooling blocker and do not claim visual acceptance.
- [ ] Inspect git diff --check, confirm no Scene 624/layout/asset files are staged, and commit only shared portrait implementation, focused tests, and this plan.