# March 30 Visual Runtime Design

**Goal:** Implement the complete data-driven visual narrative for `march30-too-fated` in the authored `330-corridor` Landscape and Portrait layouts.

## Scope

- Preserve the existing Forest/chapter registration, SceneLayout, save, reflection-wall, mobile-control, Labis, and Bakery systems.
- Add only the generic cutscene/rendering capabilities required for sprite-sheet frames, attached props, derived water VFX, actor fades, and replayable echoes.
- Keep Muji as the only playable actor. Past MS and ET are rendered actors while a memory is active.

## Asset bindings

All paths are relative to `public`:

| Role | Asset | Actual structure |
| --- | --- | --- |
| Landscape environment | `assets/330/330-landscape.png` | 1672×941 opaque image |
| Portrait environment | `assets/330/330-portrait.png` | 941×1672 opaque image |
| MS base | `assets/330/ms-base.png` | 4×4, exact 256×384 cells |
| ET base | `assets/330/yet-base.png` | 4×4, 313/314×313/314 cells; explicit fractional frame rectangles |
| MS approach | `assets/330/330-approach.png` | 4×2, exact 384×512 cells |
| ET water action | `assets/330/330-water-spraying.png` | 4×2, exact 384×512 cells; gun is baked in |
| MS sprayed reaction | `assets/330/330-water-sprayed.png` | 4×2, exact 384×512 cells; water accents are baked in |
| MS keychain action | `assets/330/330-keychains.png` | 4×2, 313/314×627 cells; charms are baked in |
| ET jacket action | `assets/330/330-jacket-action.png` | 4×2, exact 384×512 cells; jacket is baked in |
| MS jacket reaction | `assets/330/330-jacket-reaction.png` | 3×2, exact 418×627 cells |
| Water VFX | `assets/330/water-vfx.png` | 6×1, 362×724 cells; visible-pixel bounds and nozzle baseline are configured explicitly |
| Memory dissolve | `assets/330/vfx.png` | 4×2, exact 384×512 cells |
| Standalone handoff props | gift, ordinary keychain, phone charm | single-image RGBA assets; cropped to visible bounds at render time |
| Standalone water gun | `assets/330/water-gun.png` | used only for non-baked handoff/inspection states, never overlaid on water/jacket action sheets |

The filename `yet-base.png` is retained; pixel inspection establishes that it is the canonical ET identity.

## Runtime design

`march30Memory.ts` owns the chapter data: symbolic anchor references, action timeline, dialogue, reflection choices, echo timelines, asset frame metadata, feet/origin offsets, and exact copy. `CutsceneSystem` remains the generic executor and is extended with typed visual actions rather than chapter-specific engines.

Actor rendering uses explicit per-frame rectangles. A frame has a stable feet anchor and destination height; source rectangles are never calculated by rounding alternating 313/314 cells. Props use visible alpha bounds and are attached to an actor/state when applicable. Water VFX is drawn along the vector from ET’s configured gun-nozzle point to MS’s rendered target point, using a per-frame visible baseline; it is not placed at the sheet cell center.

The main timeline locks Muji input, materializes ET at `et-bench-seat`, stages the MS approach/hesitation/recognition, performs gift handoff, shows the water-gun conversation and exactly three distinct spray actions, presents the two baked-in keychain options, stages the jacket approach and silent wipe, completes the required post-wipe dialogue and goodbye, then fades the actors. Reflection Choice #1 appears only after the historical timeline and does not affect it.

The completed bench event unlocks explicit replay through `bench-memory`. The elevator echo is gated on that event and resolves `elevator-reencounter`, then the walk-together segment resolves `walk-together`; Portrait also accepts the authored `walking-together` key as a compatibility alias without duplicating choreography. Reflection Choice #2 follows the echo. Closing uses the existing chapter progress/reflection-wall path with March 30 tendency-dependent closure lines.

## Verification

- Unit tests cover asset metadata/grids/bounds, action ordering, three spray count, reflection placement after goodbye/dissolve, anchor resolution, echo gating, and exact canonical copy.
- Existing tests and `typecheck`, `tests`, and `build` must pass.
- Browser/manual verification must inspect Landscape and Portrait, main-memory choreography, replay, elevator/walk echo, Forest exit, save/reload, Labis/Bakery, and mobile controls. Any remaining anchor issue is reported rather than silently corrected.
