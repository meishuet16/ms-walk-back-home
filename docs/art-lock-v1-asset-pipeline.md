# Art Lock V1 Asset Pipeline

Date: 2026-08-05

Art Lock v1 is the canonical visual specification for Walk Back Home. Codex must not generate production art for this project. External art supplies the pixels; Codex integrates, validates, imports, and wires those assets without changing gameplay.

## Hard Rules

- Reference images are mood references only.
- Never crop, trace, or copy mood-reference artwork into production assets.
- Never use a complete illustration as a gameplay background.
- Every visible environment must be reconstructed from original modular assets.
- The minimum production unit is tile, sprite, or prop.
- If an asset conflicts with Art Lock v1, Art Lock v1 wins.
- Generated/debug sprites and tiles must not replace working runtime visuals without explicit visual approval.

## Required Files

Place externally supplied art under `apps/game/assets/external/`.

| Asset | Required Path | Dimensions |
| --- | --- | --- |
| Muji | `sprites/muji_v1.png` | `64x80`, 4 columns x 4 rows, `16x20` frames |
| Friend A / NPC | `sprites/friend_a_v1.png` | `64x80`, 4 columns x 4 rows, `16x20` frames |
| Forest tiles | `tiles/forest_v1.png` | `256x128`, 16 columns x 8 rows, `16x16` tiles |
| Bakery tiles | `tiles/bakery_v1.png` | `256x128`, 16 columns x 8 rows, `16x16` tiles |
| Props | `props/props_v1.png` | `256x128`, 16 columns x 8 rows, `16x16` cells |
| VFX | `vfx/vfx_v1.png` | `128x64`, 8 columns x 4 rows, `16x16` frames |

The machine-readable contract lives at `apps/game/art_pipeline/art_lock_v1_assets.json`.

## Sprite Configuration

Muji and NPC rows:

- Row 0: down
- Row 1: up
- Row 2: left
- Row 3: right

Columns:

- Column 0: idle
- Columns 0-3: 4-frame walk cycle

Godot import settings:

- Importer: texture
- Filter: nearest / disabled
- Mipmaps: disabled
- Compression: lossless or uncompressed for pixel art
- Premultiplied alpha: disabled unless the supplied art specifically requires it

## TileMap Layer Structure

Future scene integration should use these TileMap layers:

- `Background`: base ground and far environment
- `Midground`: walkable paths, trunks, counters, doors, collision-aligned features
- `Foreground`: overlapping leaves, canopy edges, interior occluders
- `LightingVfx`: warm lamps, portal glow, rain, fireflies, wind movement

## Prop Placement Hooks

Existing gameplay data remains canonical:

- Forest portals use portal manifest `x/y` positions.
- Bakery NPCs use `ChapterManifest.npcs.position`.
- Bakery interactive objects use `ChapterManifest.interactiveObjects.position`.
- Completion state and chapter flow remain unchanged.

## Validation

Run:

```powershell
python scripts/validate-art-lock-assets.py
```

Default mode reports missing external art as `pending` and exits 0 so fixture mechanics remain runnable before art delivery.

Strict mode fails if any required external file is absent or malformed:

```powershell
python scripts/validate-art-lock-assets.py --strict
```
