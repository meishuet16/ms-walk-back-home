# Mobile Layout Regression Fix Design

## Goal

Repair the mobile gameplay regressions on the current mobile-layout HEAD while preserving all authored portrait scene-layout JSON and assets. The pass also makes Timeline Select All operate on the complete filtered result set.

## Root causes

- InputManager.mountTouchControls appends the only .touch-controls node to #app, but fullscreen is requested on .game-shell; fullscreen renders only descendants of .game-shell.
- The same input manager starts a 240ms drag timer for gameplay pointerdown, so a held joystick movement can become UI repositioning.
- open-map calls returnToForest even though showMap already renders the Walk Back Home selection modal.
- The runtime requests scene-layouts/... from the served dist root, while the build only copies source files to dist/public/scene-layouts.
- Timeline Select All uses the paginated visible slice instead of the complete current filtered result set.

## Design

The app will mount exactly one touch-control container inside .game-shell, which keeps it in the fullscreen subtree. InputManager will retain only gameplay pointer state in normal mode. Position editing will be an explicit Settings-only session owned by the app: a draft position map is opened from Edit Touch Controls, controls become draggable with an editing indicator, and Save/Cancel/Reset operate on the existing walk-back-home-touch-controls localStorage key. Bounds are clamped against the current viewport and re-applied when the viewport or fullscreen state changes.

Gameplay chrome visibility will be derived from state: the hamburger is shown only for the four gameplay scenes with no full content overlay; touch controls use the same gameplay/overlay rule plus the existing mobile/forced-touch condition. Opening any content overlay therefore hides both, and clearing it restores them when the scene is still playable.

The build will keep the existing dist/public copy and add a root-level dist/scene-layouts copy. Runtime loading will continue to request scene-layouts/..., and tests will exercise the exact built path plus authored fields for forest, Muji Room, bakery, and Labis portrait layouts. Timeline Select All will select every entry in the complete currentTimelineMonthView result, while rendering may remain paginated.

## Testing

Focused source/runtime tests will cover one touch-control mount and fullscreen ancestry, gameplay-only joystick behavior, explicit edit mode persistence/cancel/reset/clamping, routing, derived hamburger visibility, production layout output/loading, authored-data preservation, and complete Timeline selection. Existing typecheck, test, and build commands remain the final gates. Authored files under apps/html-prototype/public/scene-layouts/ will be hash-compared before and after the pass.

## Constraints

- Do not reset, regenerate, normalize, overwrite, or recreate saved Scene Debug Editor layouts.
- Do not add paid services or automatic AI calls.
- Do not rename or replace portrait assets.
- Do not push without user confirmation.
