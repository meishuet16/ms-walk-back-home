# Walk Back Home Art Lock

Version: v1

This document defines the visual direction for Walk Back Home. It is authoritative for all future production art integration.

The concept image at `.private-spec/art/concepts/asset-direction-v1.png` is a private visual-language reference only. It is not production art, not a sprite sheet, not a tileset, and must never be imported into Godot or committed to source control.

## Non-Negotiable Rules

- Do not crop, trace, copy, extract, or redraw directly from private reference images.
- Do not use concept sheets or mood references as gameplay backgrounds.
- Do not generate new placeholder or programmer-art replacements for production visuals.
- Do not wire unapproved generated art into runtime scenes.
- Production environments must be built from original modular tiles, sprites, props, and VFX supplied externally.
- Godot remains the canonical runtime for playable Forest and Chapter experiences.
- HTML canvas fallback remains temporary and must not receive new gameplay or visual systems.

## Visual Language

Walk Back Home should feel like a quiet, melancholic, top-down pixel-art memory world.

Target qualities:

- cinematic blue-hour and night atmosphere
- dense layered forest vegetation and readable interior detail
- cool blue-green backgrounds balanced by warm amber lamps
- small playable character scale within a larger, emotionally spacious world
- top-down farming-RPG readability
- restrained pixel palette with soft lighting relationships
- clear tile rhythm at 16x16 scale
- character readability at 16x20 base scale
- warm, intimate bakery interiors with handcrafted wood and soft window light
- forest compositions with paths, layered foliage, portal glow, rain, fireflies, and depth

## Scale

- Base tile size: `16x16`
- Base character size: `16x20`
- Recommended display scale: `3x` or `4x` nearest-neighbor
- Characters should remain small relative to the environment.
- Forest and bakery spaces should read as navigable tile-based scenes, not single painted backgrounds.

## Muji

Muji must keep the approved water-bottle silhouette.

Required traits:

- translucent smoky blue-gray bottle body
- dark navy cap
- dark navy loop handle
- visible bottle outline and readable glass volume
- visible measurement markings when scale permits
- tiny arms and legs
- simple readable face
- expressive but not childish
- original four-direction idle and walk animation

Muji must not become a generic mascot, animal, blob, cube, or unrelated character shape.

## Friend A And NPCs

Friend A is a small human bakery friend at the same world scale as Muji.

Required traits:

- readable 16x20 silhouette
- gentle bakery-world palette
- grounded, quiet expression
- original four-direction idle and walk animation
- proportions consistent with the approved visual direction

Future NPCs should follow the same scale and readability rules.

## Environment

Forest:

- layered canopy, trunks, roots, bushes, flowers, rocks, lamps, paths, doors, portal glow
- cool blue-green shadow mass with warm light accents
- portal should be a physical object or light inside the forest, never an HTML-style card
- foreground foliage may occlude the player for depth

Bakery:

- warm wood floor and wall tiles
- counters, shelves, bread racks, tables, chairs, lamps, plants, window and door elements
- cozy amber interior lighting
- readable object placement for interaction targets

All environments must be assembled from modular external assets:

- tiles
- sprite sheets
- props
- animated VFX

## Palette

Palette relationships matter more than exact sampled colors.

Use:

- cool forest shadows and blue-hour ambient tones
- dark greens and blue-grays for depth
- warm amber/yellow/orange for lamps, bakery light, and player guidance
- restrained neutrals for stone, wood, skin, bottle shadows, and UI
- bright blue only for portal/water/memory glow accents

Avoid:

- saturated candy palettes
- generic high-contrast programmer colors
- flat single-hue scenes
- pure black outlines everywhere when softer shadow edges are more appropriate

## Asset Pipeline

External production assets must be dropped into the paths defined by:

- `apps/game/art_pipeline/art_lock_v1_assets.json`
- `docs/art-lock-v1-asset-pipeline.md`

The integration pipeline may define:

- TileMap layer structure
- sprite import settings
- nearest-neighbor filtering
- AnimationPlayer frame mapping
- CharacterBody2D integration
- prop placement hooks
- lighting nodes
- shader hooks
- validation scripts

The integration pipeline must not create production art.

## Approval Gate

Before runtime visual replacement:

- externally supplied assets must be present
- assets must pass validation
- assets must be reviewed visually against this Art Lock
- existing mechanics must remain functional
- no private reference image may appear in source control, Godot imports, web exports, screenshots used as runtime assets, or generated production files

