# April 6 · 还没走啊？ Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the April 6 KTHO MCD delivery chapter, optional water-gun echo, authored 406 routing, shared presentation, and regression coverage without replacing local Scene Debug data or adding an April-specific subsystem.

**Architecture:** Put all chapter content, typed scripts, asset metadata, and reflection choices in `src/fixtures/april06Chapter.ts`. Resolve every position from the active authored `SceneLayout`. Extend `CutsceneSystem` only with a small generic checkpoint/position capability required by reflection pauses, and extend `SceneActorRenderer`/the March 30 source-bounds path for 406 sprites, props, vehicle, and VFX.

**Tech Stack:** TypeScript, Canvas, existing CutsceneSystem/SceneLayouts/SceneActorRenderer, shared PresentationRenderer HTML/CSS, Node test runner, npm scripts.

## Global Constraints

- Preserve all existing user/local changes under `public/assets/406`, `public/scene-layouts/406`, and the modified layout manifest.
- Do not regenerate, rename, normalize, or replace assets or authored JSON.
- Do not create April06-specific systems, a parallel renderer, a new router, or a new UI family.
- Keep trigger `main-memory`, event `april06-mcd-lobby-memory`, and `once: true`.
- Resolve the one semantic echo anchor as `watergun-crossing` in landscape and `r-watergun-crossing` in portrait.
- Use only the existing eight tendency keys; never expose raw effects in UI.
- Preserve canonical facts and never infer ET's internal state or romantic intent.
- Reuse Labis RPG dialogue/reflection UI and March 30 responsive/source-bounds behavior.
- No paid dependencies or automatic AI calls.

---

### Task 1: Fixture, choices, chapter registry, and Forest entry

**Files**
- Create: `apps/html-prototype/src/fixtures/april06Chapter.ts`
- Modify: `apps/html-prototype/src/fixtures/chapterPlan.ts`
- Modify: `apps/html-prototype/src/systems/ChapterRegistry.ts`
- Test: `apps/html-prototype/tests/april06-chapter.test.ts`

**Produces**
`april06Chapter: ChapterDefinition`, `april06ReflectionChoices`, typed anchor/script/asset metadata, registry key `april06-not-gone-yet`, and a Forest entry dated `04.06` titled `还没走啊？`.

- [ ] Write failing tests for registry identity, runtime scene `406`, closure event `april06-mcd-lobby-memory`, Forest routing, three choices per checkpoint, and the supported tendency-key set.
- [ ] Run `npm run build; node --test dist/tests/april06-chapter.test.js` from `apps/html-prototype`; expect failure because the fixture is absent.
- [ ] Implement the fixture with the approved metadata, exact three choice groups/effects, factual canonical closure, and reflection quotes using existing `ReflectionTone` values. Add the Forest entry through `forestDoors`; fallback x/y values must not affect placement slots.
- [ ] Run the focused test again; expect PASS.

Use this exact chapter identity:

~~~ts
export const april06Chapter: ChapterDefinition = {
  id: "april06-not-gone-yet",
  runtimeScene: "406",
  date: "04.06",
  title: "还没走啊？",
  mood: "a humid ordinary hostel night where a quick delivery fails to stay anonymous",
  weather: "quiet humid night after an earlier rainy day",
  location: "KTHO Lobby",
  characters: ["Muji", "MS", "ET"],
  objects: ["McDonald's takeaway", "fries", "water container memory", "Perodua Alza", "KTHO lobby"],
  evidence: ["authored-406-landscape-scene-layout", "authored-406-portrait-scene-layout"],
  dialogue: [],
  canonicalClosure: {
    historicalEventId: "april06-mcd-lobby-memory",
    lines: ["MS leaves the McDonald's in the KTHO lobby.", "ET comes downstairs before MS can leave.", "MS returns to the waiting Perodua Alza."]
  },
  reflectionQuotes: april06ReflectionQuotes
};
~~~

---

### Task 2: Minimal shared layout/cutscene capabilities

**Files**
- Modify: `apps/html-prototype/src/systems/SceneLayouts.ts`
- Modify: `apps/html-prototype/src/systems/CutsceneSystem.ts`
- Test: `apps/html-prototype/tests/scene-layouts.test.ts`
- Test: `apps/html-prototype/tests/cutscene-visuals.test.ts`

**Produces**
`resolveSceneEchoAnchor(layout, "watergun-crossing")`, optional `CutsceneAction { type: "checkpoint"; id }`, `currentCheckpoint`, `resolveCheckpoint()`, and optional positioned prop state.

- [ ] Add failing tests proving landscape resolves `watergun-crossing`, portrait resolves `r-watergun-crossing`, unknown aliases return null, and a checkpoint pauses before the next action.
- [ ] Run `npm run build; node --test dist/tests/scene-layouts.test.js dist/tests/cutscene-visuals.test.js`; expect failure.
- [ ] Implement this resolver without mutating layouts:

~~~ts
export function resolveSceneEchoAnchor(layout: SceneLayout, semanticId: string): EchoAnchor | null {
  if (semanticId !== "watergun-crossing") return layout.echoAnchors[semanticId] ?? null;
  const key = layout.orientation === "portrait" ? "r-watergun-crossing" : "watergun-crossing";
  return layout.echoAnchors[key] ?? null;
}
~~~

Add only the checkpoint action because the existing runner otherwise cannot pause for the three shared reflection UIs. `update()` must stop while dialogue/checkpoint is active; `resolveCheckpoint()` clears the checkpoint and uses existing `nextAction()`. Add optional prop `position` and positioned image-effect fields only if required by rendering. Do not add April names to shared systems.
- [ ] Run the focused tests; expect PASS and confirm existing March 30/Labis tests remain green.

---

### Task 3: Shared actor/prop renderer extension and approved asset registry

**Files**
- Modify: `apps/html-prototype/src/systems/SceneActorRenderer.ts`
- Modify: `apps/html-prototype/src/app.ts`
- Modify: `apps/html-prototype/src/fixtures/april06Chapter.ts`
- Test: `apps/html-prototype/tests/cutscene-visuals.test.ts`
- Test: `apps/html-prototype/tests/april06-chapter.test.ts`

**Produces**
Generic `SceneSpriteAsset` metadata and draw support for visible bounds, feet anchors, mirroring, individual-frame images, owner/world props, one vehicle, and one headlight VFX.

- [ ] Add failing tests that assert all 406 paths are local approved paths, `mcd.path === "assets/406/mcd.png"`, the Alza path is `assets/406/prop/vehicle-406-arrival.png` or its approved arrival frame, and the headlight path is `assets/406/prop/vfx-406-vehicle-headlights.png`.
- [ ] Add a CutsceneSystem state test showing three `prop` actions with the same ID leave exactly one `mcd` record and transfer ownership MS → world position → ET.
- [ ] Inspect alpha bounds of the actual approved PNGs and record measured bounds in the fixture. Do not substitute art.
- [ ] Extend the existing March 30 crop/feet math into `SceneActorRenderer.ts` or an exported helper. Keep `imageSmoothingEnabled = false`, preserve the procedural fallback, and use `assets/330/ms-base.png` / `yet-base.png` only for ordinary idle fallback.
- [ ] Render the single MCD from owner position or authored world position; render one Alza actor from approved arrival frames; render headlight VFX as transparent and scene-contained.
- [ ] Run `npm run build; node --test dist/tests/cutscene-visuals.test.js dist/tests/april06-chapter.test.js`; expect PASS.

---

### Task 4: Main memory, optional echo, interactions, and shared UI

**Files**
- Modify: `apps/html-prototype/src/app.ts`
- Modify: `apps/html-prototype/src/fixtures/april06Chapter.ts`
- Modify: `apps/html-prototype/src/styles.css` only for measured generic fixes
- Test: `apps/html-prototype/tests/april06-runtime.test.ts`

**Produces**
One generic authored cutscene state in `WalkBackHomeApp`; no April-specific runtime system.

- [ ] Add failing action-contract tests asserting the main script contains all eleven authored anchors and exact canonical strings including `叶同学 你的宵夜已送到`, `诶还没走啊~`, `为了要抓你嘛`, `njhl`, and `5.30am`. Assert the echo uses one semantic anchor and no physical water-gun prop.
- [ ] Define typed anchor actions after the March 30 pattern. Resolve main coordinates from `layout.anchors`; resolve the echo only with `resolveSceneEchoAnchor(layout, "watergun-crossing")` plus small relative offsets. Use exact filenames under `assets/406`.
- [ ] Add minimal generic authored-cutscene fields and reset them in memory entry, Forest return, new journey, and journey restore. Do not reset completed events except existing reset paths.
- [ ] Update authored-scene dispatch so trigger detection happens before movement, active cutscene/dialogue/checkpoint skips `moveInLayout`, and completion calls the existing chapter progress/ending flow.
- [ ] Use existing `renderRpgDialogue` with `dialogue-open lightweight-presentation`; use `renderReflectionChoice` for the three checkpoints and `renderReflection` for neutral responses. Apply choices through `applyChoice` and `recordChapterChoice`; never display tendency values or answer ET's uncertainty.
- [ ] Stage the required action sequence: MS drop/photo/escape, empty-car pause, choice 1, ET catch, choice 2, MCD pickup/fries/chat, choice 3, headlights/Alza return, goodbye, MS exit pickup, shared fade, completion quote.
- [ ] After completion, expose concise `mcd-drop-memory` and `roadside-empty-car` residue and route `exit` through existing `returnToForest`. Start the optional water-gun echo only after main completion; it must not create another event.
- [ ] Extend the existing authored/March 30 draw path for actors sorted by world Y, the one MCD, Alza/headlights, and interaction tells. Use portrait layout coordinates directly.
- [ ] Run `npm run build; node --test dist/tests/april06-runtime.test.js dist/tests/scene-layouts.test.js dist/tests/cutscene-visuals.test.js`; expect PASS.

---

### Task 5: Backward-compatible tendency-based ending quote selection

**Files**
- Modify: `apps/html-prototype/src/systems/EndingResolver.ts`
- Modify: `apps/html-prototype/src/types.ts` only if generic quote preference metadata is necessary
- Modify: `apps/html-prototype/src/fixtures/april06Chapter.ts`
- Test: `apps/html-prototype/tests/tendency-ending.test.ts`
- Test: `apps/html-prototype/tests/chapter-reflection.test.ts`

- [ ] Add a failing test creating April 6 progress with acceptance/companionship, honesty/closeness, and distance tendencies and assert three distinct quote IDs with identical canonical closure lines.
- [ ] Run `npm run build; node --test dist/tests/tendency-ending.test.js dist/tests/april06-chapter.test.js`; expect failure if fixed legacy choice IDs cannot distinguish these states.
- [ ] Keep existing explicit Bakery/Labis/March 30 choice-ID checks first. Add only a generic tendency fallback or quote preference metadata using supported keys and deterministic tie-breaking `acceptance`, `honesty`, `closeness`, `companionship`, `distance`, `concealment`.
- [ ] Run the existing chapter-reflection/tendency tests plus April 6 tests; expect PASS without legacy behavior changes.

---

### Task 6: Responsive regression and full verification

**Files**
- Modify: `apps/html-prototype/src/styles.css` only if shared rules need a measured fix
- Test: `apps/html-prototype/tests/mobile-regressions.test.ts`
- Test: `apps/html-prototype/tests/presentation-renderer.test.ts`

- [ ] Assert April 6 uses `data-presentation="rpg"`, `data-presentation="reflection-choice"`, `.lightweight-presentation`, and does not render raw effects, speech bubbles, or custom April classes.
- [ ] Verify generic CSS keeps dialogue/reflection centered in portrait, content-driven in height, and touch controls available; do not add `data-scene="406"` hacks.
- [ ] If browser verification is available, run `npm run dev` and verify Forest entry, both layouts/aliases, once-only trigger, MCD uniqueness, empty-car pause, ET catch/fry/chat, Alza/headlights, ending/Forest exit, touch controls, and March 30/Labis/Bakery regressions.
- [ ] Run from `apps/html-prototype`: `npm run typecheck`, `npm run build`, and `npm test`.
- [ ] Run `git diff --check`, `git diff --stat`, and `git status --short`; confirm user-owned 406 assets/layouts remain present and unstaged unless explicitly changed by the user.
- [ ] Report exact files/assets/layouts used, shared UI choices, test/typecheck/build/browser results, and any unverified visual limitations. Never claim browser verification unless it was run.
