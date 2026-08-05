# ADR 0001: Retain Godot Web for Playable MVP

Date: 2026-08-05

## Context

Godot is the canonical runtime for the final Memory Forest and Memory Chapter experiences. The Next.js HTML canvas forest at `apps/web/public/game/memory-forest.html` remains a temporary fallback only and must not receive new chapter gameplay systems.

## Measurements

- Godot version checked locally: `4.7.1.stable.official.a13da4feb`.
- Matching free Godot Web export templates are installed locally under `C:/Users/User/AppData/Roaming/Godot/export_templates/4.7.1.stable/`.
- Required no-thread Web templates are present: `web_nothreads_debug.zip` is 10,231,638 bytes and `web_nothreads_release.zip` is 10,246,274 bytes.
- Headless project open check: succeeds with `--path apps/game --quit`.
- Headless scene open checks: `res://scenes/forest/memory_forest.tscn` and `res://scenes/chapters/bakery_day.tscn` both start without parse errors.
- Current checked-in fallback size: `apps/web/public/game/memory-forest.html` is 9,938 bytes.
- Godot Web export command used locally:
  `Godot_v4.7.1-stable_win64_console.exe --headless --path apps/game --export-release Web apps/web/public/game/index.html`.
- Export exits with code 0. Godot still prints an editor-settings save warning for `C:/Users/User/AppData/Roaming/Godot/editor_settings-4.7.tres`; it does not block the export.
- Generated Godot Web distributable is committed at `apps/web/public/game/index.*`.
- Current generated Godot Web bundle size is 39,884,371 bytes across the `index.*` files. The largest file is `index.wasm` at 39,513,091 bytes.
- The export intentionally excludes `scripts/tests/*`; the committed `.pck` contains runtime fixture data and runtime scripts only.
- Next.js `/forest` loads `/game/index.html` first. The temporary HTML fallback remains at `/game/memory-forest.html` only for missing-export development recovery.
- Development builds show a visible runtime indicator: `Godot Web runtime` for `/game/index.html`, `HTML fallback runtime` for the fallback.
- Browser viewport checks through Next.js loaded the actual Godot export at:
  - desktop `1440x900`: iframe `1425x702`, Godot console banner observed, first observed ready state after 14.3s on the first dev-server run.
  - desktop `960x540`: iframe `945x421`, Godot console banner observed, ready state after 8.4s on the warmed dev server.
  - mobile portrait `390x844`: iframe `375x658`, Godot console banner observed, ready state after 8.6s on the warmed dev server.
  - mobile landscape `844x390`: iframe `829x305`, Godot console banner observed, ready state after 8.6s on the warmed dev server.
- Browser console errors after the final viewport verification: none reported by the page.
- Memory usage was not easily observable from the in-app browser tooling, so it is not recorded for this pass.

## Mobile Usability

Keyboard controls remain the desktop baseline. Godot now includes adaptive touch controls for narrow, short, or touch-capable viewports: a virtual directional control and an interaction button. The controls are hidden on wider non-touch desktop viewports.

Manual browser verification on the real export confirmed virtual directional movement and the touch interaction button entering Bakery after Muji is positioned near the portal. Completing the chapter, returning to Forest, reload persistence, and replaying the completed portal were also verified through the Godot export embedded in Next.js. One usability caveat remains: automated touch taps on the ending overlay's E button were less reliable than keyboard E because the canvas is scaled inside a short mobile landscape iframe. This is acceptable for this mechanics proof, but later mobile polish should make the action target larger or normalize touch coordinates more explicitly.

## Build And Export Friction

The web app builds normally through npm. Godot scene parsing works headlessly when logs are written inside the workspace. Godot Web export is local-tooling dependent: the matching free export templates must be installed manually through Godot before export. No archive download or extraction is part of this repo.

Godot overwrites the generated `index.html` shell during export. The local `scripts/patch-godot-web-export.mjs` step reapplies the MVP canvas sizing and background color after export so the iframe does not show a gray strip at wide desktop sizes.

For the MVP, the distributable Godot Web export belongs in source control. This keeps the Next.js app runnable without requiring every preview or reviewer machine to have Godot and export templates installed. Transient build/editor artifacts remain ignored: `.godot/`, `.godot-user-data/`, `.next/`, `*.gd.uid`, `exports/`, fixture runtime logs, databases, uploads, imports, generated graphs, embeddings, and `.private-spec/`.

## Decision

Retain Godot for the MVP. It keeps Forest and Chapter logic canonical in one playable engine, supports keyboard and touch, and avoids duplicating gameplay into the HTML fallback. Revisit only after a successful Godot Web export can be measured for load time and bundle size on desktop and mobile-sized browser viewports.
