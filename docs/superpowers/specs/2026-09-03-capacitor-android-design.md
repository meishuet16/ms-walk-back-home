# Walk Back Home Capacitor Android Design

## Goal

Add the first maintainable Capacitor Android application for Walk Back Home without creating a second frontend or changing the canonical web/Vercel application. The existing `apps/html-prototype` build remains the sole source of UI, gameplay, chapter content, and local assets; both Vercel and Capacitor consume its production output in `apps/html-prototype/dist`.

## Baseline and scope

- Baseline: `1c729fbd68810f4824cea485c1cb00d7ca140472`, the verified current `origin/main` at audit time.
- Feature branch: `codex/capacitor-android`, created from `origin/main` in an isolated project-local worktree.
- Permanent Android application ID: `com.meishuet16.walkbackhome`.
- Capacitor: `8.5.1`, selected as the current stable release and compatible with the repository's Node engine floor (`>=20.9.0`).
- Android is an additional packaging target for the existing app, not a new app surface.
- Downloader/yt-dlp work, backend changes, storage migration, broad asset optimization, chapter/content changes, and redesign are out of scope.

The initial repository audit found the existing TypeScript/esbuild app, local relative asset paths, browser Fullscreen API action, localStorage persistence, IndexedDB blob stores, bundled FFmpeg and PDF.js workers, Supabase runtime configuration, responsive portrait/landscape CSS, touch controls, and a 765-test HTML-prototype suite plus 28 shared-package tests. The untouched baseline typecheck and tests passed; `authored:check` was already stale and is not modified by this milestone.

## Architecture

The root project receives Capacitor configuration and native dependencies. `capacitor.config.ts` points Capacitor at `apps/html-prototype/dist`, and the generated `android/` project is tracked as native source. The existing root `npm run build` and `apps/html-prototype/vercel.json` remain unchanged for Vercel.

The root scripts provide an explicit build-and-sync path. A post-sync verifier discovers the generated Android web asset directory from the synced project rather than assuming a path, then checks representative local assets and runtime workers physically exist.

No live Vercel URL is used as the Android app source. Core navigation, Forest, authored Chapters, Muji Room, bundled audio, lyrics, scene layouts, FFmpeg, and PDF.js remain local to the packaged web assets. Supabase, Weather, OAuth, and other inherently network-dependent behavior retains its existing remote boundary.

## Capacitor APIs and platform boundary

Use the installed Capacitor 8.5.1 API surface exactly as exposed by the packages:

- `@capacitor/core` provides the web/native platform check and bundled `SystemBars` API.
- `@capacitor/app` provides the Android Back event and app lifecycle event.
- `@capacitor/android` supplies the Android platform project.
- `@capacitor/cli` supplies configuration, platform add, sync, and native build commands.

The small `CapacitorBridge` module owns only platform integration. It must be inert in a normal browser and must not own application navigation state. The app exposes one narrow native-back entry point that reuses its existing state and action machinery. The bridge forwards Android Back to that entry point and falls back to the platform's existing history/exit semantics only when the app has no in-app destination.

## Fullscreen and system bars

The existing Settings `Fullscreen` action remains the only user-facing fullscreen control.

- Browser: preserve the existing `document.fullscreenElement`, `requestFullscreen`, `exitFullscreen`, and `.game-shell:fullscreen` behavior.
- Android: the same action toggles `SystemBars.hide()` and `SystemBars.show()` for both status and navigation/gesture bars, and applies a `.native-fullscreen` state class so the existing fullscreen layout rules remain active without requiring the WebView Fullscreen API.
- App resume: if native fullscreen was active, reapply the hide operation after resume because Android may restore system UI while the activity was paused. If it was inactive, leave bars visible.
- Failure: native API errors leave the app in a consistent visible-bar state and use the existing toast path; no silent remote fallback is introduced.
- Orientation and keyboard transitions: preserve the active native fullscreen state, allow the existing responsive layout to recalculate, and avoid hiding bars while text input is being handled by the system.

Capacitor 8 `SystemBars` configuration is preferred, not treated as a universal guarantee. Configure its exposed inset handling for CSS injection and use those injected variables as fallbacks alongside the existing browser `env(safe-area-inset-*)` values. Do not add a second safe-area plugin unless an Android verification reproduces a concrete defect that the built-in API cannot address.

## Safe areas and viewport

Evaluate the existing mobile CSS, which already uses safe-area environment values. Add `viewport-fit=cover` because the Android edge-to-edge model needs the viewport to expose cutout and system-bar regions to the existing safe-area-aware layout. Update only the safe-area value expressions necessary to prefer Capacitor's injected `--safe-area-inset-top/right/bottom/left` variables while retaining browser `env(...)` fallbacks. Do not redesign spacing or replace the existing responsive system.

The Android project must retain edge-to-edge-compatible system-bar behavior and must not force a fixed orientation. The generated Activity's keyboard behavior is inspected; use the smallest configuration needed to keep `adjustResize`/WebView viewport behavior correct for Journal, Settings, Toolbox, Reflection Wall, and other forms.

## Android Back behavior

The existing application state and action handlers are authoritative. The native-back entry point follows the topmost currently active surface, using existing methods or existing `data-action` controls where those are already the centralized close path. Expected ordering is:

1. close the topmost Capsule, Journal editor, Living Window, Lyrics, Records, Toolbox sub-surface, Reflection, or generic overlay;
2. otherwise return from an active gameplay scene to Forest through the existing `returnToForest` flow;
3. otherwise honor the native event's existing history/exit behavior.

The bridge does not maintain a separate screen stack or duplicate overlay model.

## Storage, media, PDF, files, and network

Keep localStorage, IndexedDB, object URLs, personal Music blobs, Journal media blobs, backup/restore, file inputs, generated Blob exports, FFmpeg WASM/core/worker loading, PDF.js worker loading, pdf-lib, canvas rendering, and touch waveform behavior unchanged. Verification must exercise their existing code paths under the Android WebView where tooling permits. Native filesystem support is not added preemptively.

The existing Supabase/config integration remains unchanged. The Android origin is local and secure (`https://localhost`); any OAuth allowlist requirement is documented as deployment configuration, not solved by adding a new backend.

## Verification strategy

Automated verification:

- existing `npm run typecheck`, `npm test`, `npm run build`, and `git diff --check`;
- preserve and report the pre-existing `npm run authored:check` failure without running its modifying update command;
- focused tests for native platform/fullscreen decisions, Back dispatch, CSS safe-area/fullscreen rules, Capacitor configuration, and the asset verifier;
- `npm run build` followed by Capacitor sync;
- physical presence checks in the actual synced Android web asset directory for Forest, Muji Room, an authored Chapter background, a portrait/sprite, scene JSON, lyrics, BGM, FFmpeg core JS/WASM, FFmpeg worker files, and the PDF worker;
- Android/Gradle debug build and APK inspection only if the installed SDK/JDK/toolchain genuinely supports them.

The final report distinguishes automated, emulator, physical-device, and unverified behavior. Missing Android tooling is reported precisely with exact commands for local completion; no build or device result is inferred.

## Real-device acceptance checklist

Physical-device testing remains required for cold launch, network-disabled launch, Home, Forest, authored Chapters, backgrounds, sprites, portraits, BGM, Muji Room, Journal, Records, Reflection Wall, Living Window online/offline behavior, Toolbox, file picker, FFmpeg, PDF operations, Blob exports, IndexedDB/localStorage persistence after restart, portrait, landscape, orientation switching, the existing Fullscreen action, immersive/system bars, cutouts, gesture navigation, keyboard open/close, Back handling, pause/resume, and configured Supabase behavior.

## Risks

- The existing production output is approximately 1.15 GB because it includes many large authored PNGs and local runtime assets. This milestone records the observation but does not optimize unrelated assets.
- Android SDK/Gradle/JDK availability may prevent automated native build or device validation in the current environment.
- Android WebView versions may differ in safe-area env behavior, media memory pressure, Blob export behavior, and FFmpeg/PDF worker constraints. Each is verified or explicitly marked unverified rather than assumed compatible.
