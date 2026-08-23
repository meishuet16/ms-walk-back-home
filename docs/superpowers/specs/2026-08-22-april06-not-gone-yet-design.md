# April 6 · 还没走啊？ Design

## Goal

Implement the April 6 KTHO MCD delivery chapter in `apps/html-prototype` using the current chapter registry, authored Scene Debug layouts, shared cutscene/runtime behavior, and existing dialogue/reflection/ending UI.

The historical event remains factual and restrained: the player may change Muji's interpretation of MS's actions, but never ET's internal state or the meaning of the event.

## Current architecture fit

- `ChapterDefinition` fixtures are registered by `ChapterRegistry` and routed from `forestDoors`.
- Scene 406 is already present in `public/scene-layouts/manifest.json` and has authoritative landscape and portrait JSON layouts.
- `CutsceneSystem` already supports wait, spawn, move, face, expression, sprite, prop, effect, fade, and dialogue actions.
- March 30 contains the existing source-bounds-aware sprite/prop rendering path; April 6 will extend that path instead of creating a second scene renderer.
- Labis supplies the shared RPG bottom dialogue and standalone reflection-choice presentation patterns.
- `ChapterProgressManager`, `MemoryTrigger`, `EndingResolver`, and the existing Forest return path remain the source of truth for progress and completion.

## Runtime design

### Chapter data

Create `src/fixtures/april06Chapter.ts` with:

- chapter metadata for `april06-not-gone-yet`, runtime scene `406`, date `04.06`, title `还没走啊？`, and the approved metadata/evidence;
- the canonical closure event `april06-mcd-lobby-memory`;
- the complete main-memory action sequence;
- the optional morning water-gun echo sequence;
- the three reflection choice points and their supported tendency effects;
- reflection quotes using the existing `ReflectionTone` values and factual wording;
- the 406 asset metadata needed by the shared renderer.

Register the fixture in `ChapterRegistry` and add the April 6 Forest entry through `forestDoors`. Do not put the complete chapter definition in `app.ts`.

### Authored layout resolution

Read all runtime coordinates from the active orientation's `SceneLayout`. The landscape and portrait JSON files remain untouched.

Add a small generic echo-anchor resolver in `SceneLayouts.ts` that resolves the semantic key `watergun-crossing` as follows:

- landscape: `layout.echoAnchors["watergun-crossing"]`;
- portrait: `layout.echoAnchors["r-watergun-crossing"]`.

The resolver must not create a second anchor, copy coordinates, or mutate authored data.

### Main memory

Use the existing `main-memory` trigger and `consumeChapterTrigger("april06-not-gone-yet")`. While the cutscene is active, the authored scene update path does not call `moveInLayout`, so player movement remains locked without a separate lock system.

The existing action types will be reused first. If the current action list cannot pause for a reflection choice, add only the smallest generic pause/resume capability to `CutsceneSystem`; it must be reusable by any authored scene and must not contain April 6 names.

The action sequence stages:

1. MS appears at `ms-drop-start`, carries the MCD, walks to `mcd-drop-point`, places it, straightens, takes a photo, and turns to leave.
2. The single `mcd` prop changes from actor-held to a world prop at the authored drop point. No duplicate bag is rendered.
3. MS delivers the three approved lines using shared RPG dialogue.
4. MS moves through `ms-escape-turn` to `ms-roadside-stop`, pauses with no vehicle, and says `wtf？？？`.
5. Reflection choice 1 is shown with only supported tendency keys.
6. ET appears at `et-lobby-spawn`, moves to `et-catch-position`, and uses the approved catch assets for the ordinary catch dialogue.
7. Reflection choice 2 is shown without asserting what ET meant.
8. ET moves to `et-mcd-pickup`; the same MCD prop changes to ET-held/eating state.
9. MS and ET stage at `ms-chat-position` and `et-chat-position`; ET cycles through the approved fry/eating poses while the canonical conversation plays.
10. Reflection choice 3 is shown.
11. A subtle headlight effect precedes one Perodua Alza actor entering from `car-return-edge`.
12. ET notices the returning car, MS says goodbye, and MS moves to `ms-exit-pickup` while ET stays at the lobby.
13. The cutscene fades using the shared dissolve/fade behavior, marks `april06-mcd-lobby-memory` complete, records the chapter memory read, and shows the shared ending/reflection quote UI.

The script must not add blushes, hearts, romantic camera treatment, invented ET thoughts, friend sprites, or exact offscreen friend dialogue.

### Optional morning echo

After main-memory completion, `watergun-crossing` becomes an authored world interaction. The echo uses one semantic anchor and relative staging offsets only:

- ET uses the morning water-gun notice, spray gesture, dodge, recovery, and continue-walking assets;
- MS uses the fake-watergun notice, pocket draw, aim, laugh, and walking assets;
- no physical water gun is rendered;
- no Ziqi sprite is added;
- the echo remains short and does not alter chapter completion or create a second event.

### Post-memory interactions

Use the saved interaction IDs. `mcd-drop-memory` and `roadside-empty-car` show concise shared RPG/world-memory dialogue; `exit` uses the existing Forest return path. No new router is introduced.

## Shared rendering and presentation

Extend the existing shared actor/prop pipeline with generic asset metadata rather than creating an April-specific renderer. Metadata must support:

- individual 406 frame images and canonical March 30 MS/ET base sheets;
- visible source bounds and stable feet anchors;
- left/right mirroring where needed;
- one actor-held or world-held MCD instance;
- a vehicle actor/prop using the approved Perodua Alza frames;
- a transparent, scene-contained headlight VFX asset.

Canonical dialogue uses `renderRpgDialogue` with the Labis-style lightweight overlay so mobile controls remain available. Reflection choices use `renderReflectionChoice`; responses and ending quotes use `renderReflection` and the existing chapter ending flow. Bakery's VN renderer is not used unless a genuinely static secondary interaction requires it.

No blur, smoothing, romance-tinted overlay, oversized modal, new UI family, or April-specific mobile positioning hack is introduced.

## Reflection and ending logic

All three choice groups use exactly the requested labels/effects:

- choice 1: concealment/distance, honesty/closeness, or acceptance/companionship;
- choice 2: acceptance/honesty, closeness/intervention, or distance/acceptance;
- choice 3: honesty/closeness, acceptance/companionship, or concealment/closeness.

The choices change Muji's interpretation only. The ending quote resolver will use existing `ReflectionTone` and tendency state, with a minimal generic extension only if the current fixed choice-ID mapping cannot select April 6's quote families. It will not introduce romance or other unsupported tendency keys.

## Persistence and validation

- `once: true` and the existing completed-event set prevent replaying the main memory on trigger re-entry.
- The existing chapter progress and Forest return flow record completion and residue.
- Existing journey/save data remains compatible.
- Add focused tests for the echo alias resolver, supported reflection effects, quote selection, and the single-prop handoff.
- Run the current `typecheck`, `build`, and `test` scripts, then perform available desktop/portrait browser verification and report any unverified items explicitly.

## Worktree safety

The current untracked 406 asset folders, deleted legacy 406 composite files, modified layout manifest, and authored 406 JSON files are user/local work. They must not be regenerated, normalized, deleted, or included in unrelated changes.
