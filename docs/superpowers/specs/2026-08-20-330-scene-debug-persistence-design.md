# 330 Scene Debug Persistence and Sprite Scale Design

## Scope

Fix the March 30 Scene Debug save/reload path and set March 30 runtime material scale to 1.2×, with only the standalone Xiaoba fish-charm gift, water gun, and both standalone candied-haw keychain props retained at 2×. The two JSON files under `public/assets/330/` are backup data, not instruction documents; their authored coordinates are the restoration source for the matching `public/scene-layouts/330-corridor/*.json` files. Add data-driven prop portraits for the gift/water-gun/keychain dialogue beats, compact mobile overlays, always-visible interaction tells, and an editable Journal entry that remains the same authored chapter in Forest.

## Root cause

The dev server serves `/scene-layouts/*` from `dist/scene-layouts` first, but the debug save endpoint writes only to `public/scene-layouts` and `dist/public/scene-layouts`. A save followed by refresh therefore reloads the stale `dist/scene-layouts` copy. The stale Portrait copy is missing normal anchors and echo anchors; stale Landscape data can restore visibly displaced coordinates.

## Design

1. Make the debug save and manifest writers update the exact `dist/scene-layouts` directory that the dev server serves first, while retaining the source and `dist/public` mirrors.
2. Restore/verify both 330 runtime layout files against their supplied JSON backups, including Portrait's `walking-together` echo key and all normal anchors.
3. Add centralized March 30 render scales: default `1.2`, and `2` only for standalone `gift`, `waterGun`, `ordinaryKeychain`, and `phoneCharm`. Apply the default to other March 30 characters, action sheets including `waterSpraying` and `keychains`, dissolve material, diary prop, water VFX, and dialogue portraits. Background images and authored world coordinates remain unchanged.
4. Add data-driven left dialogue portraits for the standalone fish-charm gift, water gun, and two standalone candied-haw keychains, without double-rendering baked action-sheet props.
5. Keep March 30 dialogue, reflection choices, ending quote, and short diary reading compact and centered inside the mobile Portrait stage. Crop prop dialogue portraits to their inspected visible source bounds so transparent sheet margins do not make the objects unreadably small. Make all authored interaction tells readable from scene entry.
6. Preserve the authored chapter ID when Journal saves an edited March 30 entry, suppress its duplicate derived Forest node, and use the saved content when the corridor diary interaction is opened.
7. Keep reflection choices available after replay, and give the final March 30 ending quote the existing `Keep this` Reflection Wall action.
8. Crop actor rendering to actual per-frame alpha bounds while preserving cell geometry for scale and anchor alignment.
9. Add regression tests for save-path alignment, backup anchor preservation, prop hide timing, scale bindings, dialogue portraits, replay reflection, compact overlays, always-visible tells, alpha cropping, and editable diary seeding.

## Verification

Run the HTML prototype tests, workspace typecheck, workspace build, and a local save/reload smoke check. Browser verification will confirm the debug endpoint serves the saved layout after refresh when the local dev server is available.
