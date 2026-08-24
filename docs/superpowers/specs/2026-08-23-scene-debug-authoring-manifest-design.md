# Scene Debug Authoring Manifest v1

## Goal

Extend the existing Scene Debug Editor with a deterministic, reviewable authoring workflow without changing the runtime SceneLayout schema or authored scene-layout files.

## Architecture

- SceneDebugAuthoringManifest.ts owns the JSON v1 boundary: parsing, validation, safe project-asset paths, normalized geometry, and editor-only metadata types.
- SceneDebugAutoAuthor.ts converts a validated manifest into a transactional plan containing a runtime-compatible layout candidate plus editor-only groups, preview imports, collision-review records, and constraint definitions.
- SceneDebugConstraints.ts evaluates deterministic relative-x, relative-y, and shared-baseline rules without moving points.
- SceneDebugViewport.ts contains pure scene/viewport transform math. Zoom and pan are presentation state only.
- SceneDebugEditor.ts remains the coordinator and reuses the existing point, group, preview, approval, handoff, save, and Add Scene systems.

## Safety rules

Validation is pure. Auto Author is transactional: parse, validate, resolve, summarize, then apply once. Existing authored layouts are never silently replaced. Auto-imported previews are PREVIEW ONLY. Canonical approval and implementation handoff remain explicit and editor-only. Saving serializes only the existing SceneLayout fields.

Imported collision rectangles are DRAFT / REVIEW REQUIRED. Constraint validation is read-only. The viewport uses independent sidebar/stage scroll containers.

