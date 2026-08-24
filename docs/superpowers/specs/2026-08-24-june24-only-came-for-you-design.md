# June 24 “Only Came Here for You” Runtime Design

**Status:** Design approved in conversation; written spec pending user review.

**Scope:** Round 3 runtime implementation for apps/html-prototype.

## Goal

Implement the approved June 24 chapter june24-only-came-for-you in Scene 624 using the existing authored Portrait and Landscape SceneLayout JSON, exact approved assets, shared authored-cutscene lifecycle, shared RPG-bottom dialogue, and a shared presentation-space Echo Portrait system.

## Non-negotiable constraints

- Preserve newer uncommitted local Scene Debug/shared-system work as the source of truth.
- Do not redesign the chapter, rewrite approved dialogue, regenerate assets or Muji, silently substitute assets, or modify approved Scene 624 coordinates.
- visualScale changes rendered sprite size only; it must not alter world feet, movement, camera, interaction, or trigger coordinates.
- Landscape and Portrait consume their own authored layouts independently.
- Historical MS and ET are world actors during Main Memory; Muji remains present-day player and is faded according to the shared convention.
- Main Memory uses RPG_BOTTOM. Echo Portraits are overlay-only and never use SceneLayout/world actor coordinates.
- Use only the existing tendency keys.
- Echoes do not run Main Memory reflection flow or persistent rewards.
- No commit or push is authorized by this task.

## Existing architecture

Extend the current authored runtime seams: ChapterRegistry, AuthoredRuntimeDefinition in app.ts, CutsceneSystem, SceneActorRenderer, SceneLayouts, shared presentation renderers, and shared chapter progress/experience state. Do not create a second June-24-specific scene engine.

Preserve these local authored artifacts and all their values:

- apps/html-prototype/public/scene-layouts/624/portrait.json
- apps/html-prototype/public/scene-layouts/624/landscape.json
- apps/html-prototype/public/assets/624/

## Runtime units

### June 24 fixture

Create a focused fixture following the May 23 authored chapter pattern. It owns the chapter definition, canonical diary ID/body, exact 624 MS directional frame registry, inspected sprite metadata/feet anchors, anchor-based action resolution, complete Main Memory choreography/dialogue, three reflection choice points, current-run quote data, and optional Echo definitions.

The fixture may resolve positions from layout.anchors, but must not author replacement coordinates or use image percentages. Only the selected authored layout supplies spatial values.

### Registration and interaction routing

Register june24-only-came-for-you in ChapterRegistry with Scene 624. The trigger june24-table-arrival must resolve to chapter june24-only-came-for-you and event june24-table-memory.

Keep these interaction IDs unchanged:

- table-memory — full manual experience replay;
- carrot-milk-memory — june24-angela-st-echo;
- five-cent-memory — june24-room-study-echo;
- xiaoba-memory — june24-haircut-echo;
- exit — leave scene.

### Shared authored runtime extension

Extend the shared runtime only for Scene 624 registration, full-experience manual replay, independent Echo completion, and a reusable presentation-space Echo Portrait overlay. Main Memory cleanup must dispose actors, props, overlays, and current-run state before Muji exploration resumes.

### Echo Portrait system

Add the smallest reusable presentation abstraction that receives semantic Echo data, exact portrait path, dialogue, responsive composition intent, and pacing. It must keep the gameplay scene visible, preserve aspect ratio, keep dialogue/UI reachable, never read world anchors/camera/actor coordinates or visualScale, never mutate interaction coordinates, and restore exploration on disposal. Main Memory remains RPG_BOTTOM.

Exact mappings:

| Semantic ID | Interaction ID | Portrait asset |
| --- | --- | --- |
| june24-angela-st-echo | carrot-milk-memory | assets/624/echo-portraits/group-echoes/01-morning-angela-st.png |
| june24-room-study-echo | five-cent-memory | assets/624/echo-portraits/et-portraits/03-guilt-quiet.png |
| june24-haircut-echo | xiaoba-memory | assets/624/echo-portraits/group-echoes/02-haircut-home-invite.png |

Echo 1 is the short Angela/ST morning precursor. Echo 2 is the later-night study-message fragment and stops at 你明天等我走来. Echo 3 is the haircut/home-invitation fragment and remains unresolved. None reenacts Main Memory world actors or adds a new factual outcome.

## Main Memory choreography

Use the approved semantic sequence and exact assets:

1. ET starts at et-reading-seat with table-facing-right/01-sitting-reading.png.
2. MS starts at ms-entry-start, moves to ms-table-approach with 624 UP cycle 02 → 03 → 04 → 03, then seats at ms-first-seat with table-facing-left/01-sitting-opposite.png.
3. Continue the approved ordinary talk, neck joke, carrot-milk callback, second return, and Xiaoba handoff.
4. May 23 reveal uses table-facing-right/03-surprised-5-23.png when present and semantically valid.
5. Phone sequence: MS ms-phone-show → ET et-phone-stop physical reach/contact → visible pause → MS 03-phone-hand-stopped-reaction.png → dialogue. Phone ownership remains MS; no duplicate phone.
6. Xiaoba sequence: MS ms-xiaoba-give → ET et-xiaoba-receive; no standalone duplicate doll.
7. Carrot milk has one visible canonical owner at a time.
8. ET guilt uses 07-guilt-quiet.png; preserve visible silence before the quiet-table state.
9. Quiet table uses MS 06-head-down-table.png with ET quiet/reading state.
10. Goodbye uses MS 07-goodbye-stand.png, ET 08-goodbye-look.png, then MS 08-goodbye-walk.png at ms-goodbye-exit before dissolve.

ET is on the left facing right; MS is on the right facing left. Dedicated action assets are not automatically flipped merely because movement direction changes. Any flip must be explicit, safe, and derived from source-facing/required-facing.

## Reflection, closure, and lifecycle

Keep shared reflection mechanics and current tendency keys. Use the approved three prompts, choices, responses, and effects. Preserve both truths: ET later believed MS had not come, and that explanation does not erase May 23. Do not force forgiveness, romance, resolution, or a moral.

Use the approved current-run quote directions:

- accepting: 后来我终于知道，她真的以为我没有来。 / 但 5 月 23 日还是 5 月 23 日。
- holding: 她继续读书。我趴在桌上看了一会。 / 那天下午，好像也没有什么特别的。
- not-ready: 她说对不起。我第一句问的是：然后呢。 / 有些话听到了，也不会立刻知道该放哪里。
- rewriting: 我没有再翻照片。她说，她懂了。 / 原来有些证明，不需要真的打开。

Automatic and manual Main Memory runs share the full experience: canonical memory → all reflection choices → current-run ending quote → canonical closure. A later visit may auto-play again and may resolve a different current-run quote, while persistent first-completion contribution remains protected by shared anti-farming behavior.

## Tests-first contract

Before production changes, add focused June 24 tests and run them red. Prove registration, diary/layout/background paths, exact authored anchors, trigger IDs, 624 frame registry and paths, scale-independent feet, exact assets/topology/order/ownership, guilt/quiet/goodbye states, full replay and visit reset, Echo independence, exact Echo Portrait mapping/presentation isolation/disposal/restoration, and restrained reflection text.

Then run focused June 24 tests, relevant Scene Debug/Cutscene/SceneActorRenderer/chapter-diary tests, typecheck, production build, and full suite. Browser acceptance inspects Portrait first, then Landscape, including all Main Memory checkpoints and all three Echo Portraits.

## Out of scope

- SceneLayout authoring or coordinate changes;
- asset regeneration/replacement or Muji changes;
- new tendency keys or persistence hacks;
- a new Main Memory VN presentation mode;
- unrelated Scene Debug redesign, cleanup, commits, or pushes.

## Acceptance

Accept only when authored layouts are unchanged, approved assets are actually rendered for their semantic beats, shared feet/scale and replay invariants are proven, Echo Portraits remain presentation-space only, and Portrait/Landscape browser checks demonstrate canonical topology and choreography.
