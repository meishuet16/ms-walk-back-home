# ADR 0001: Retain Godot Web for Playable MVP

Date: 2026-08-05

## Context

Godot is the canonical runtime for the final Memory Forest and Memory Chapter experiences. The Next.js HTML canvas forest at `apps/web/public/game/memory-forest.html` remains a temporary fallback only and must not receive new chapter gameplay systems.

## Measurements

- Godot version checked locally: `4.7.1.stable.official.a13da4feb`.
- Headless project open check: succeeds with `--path apps/game --quit`.
- Headless scene open checks: `res://scenes/forest/memory_forest.tscn` and `res://scenes/chapters/bakery_day.tscn` both start without parse errors.
- Current checked-in fallback size: `apps/web/public/game/memory-forest.html` is 9,938 bytes.
- Godot Web export status on this machine: blocked by missing export templates. Godot reports no `web_nothreads_debug.zip` or `web_nothreads_release.zip` under `C:/Users/User/AppData/Roaming/Godot/export_templates/4.7.1.stable/`.
- Observed generated Godot Web bundle size: not measurable until the free Godot 4.7.1 web export templates are installed.
- Next.js production build routes include `/forest`, and the web embed now requests `/game/index.html` first. If that Godot export file is absent, it falls back to `/game/memory-forest.html`.
- Desktop and mobile-sized Godot Web viewport loading could not be measured in this environment because the export artifact was not produced.

## Mobile Usability

Keyboard controls remain the desktop baseline. Godot now includes adaptive touch controls for narrow or touch-capable viewports: a virtual directional control and an interaction button. The controls are hidden on wider non-touch desktop viewports.

## Build And Export Friction

The web app builds normally through npm. Godot scene parsing works headlessly when logs are written inside the workspace. The current export friction is local tooling, not app code: Godot needs matching free export templates installed before a web build can be produced and loaded in Next.js.

## Decision

Retain Godot for the MVP. It keeps Forest and Chapter logic canonical in one playable engine, supports keyboard and touch, and avoids duplicating gameplay into the HTML fallback. Revisit only after a successful Godot Web export can be measured for load time and bundle size on desktop and mobile-sized browser viewports.
