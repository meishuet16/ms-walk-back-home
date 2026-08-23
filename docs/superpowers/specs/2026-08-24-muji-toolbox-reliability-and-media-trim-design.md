# Muji Toolbox Reliability and Media Trim Design

## Goal

Make the Muji Room Toolbox immediate and dependable: Spinwheel actions respond to one click without rebuilding or scrolling the overlay, Media provides a real waveform-based single-range cutter with millisecond controls, and PDF/Media jobs always finish in an explicit success, error, or cancelled state with usable output.

This is one focused Toolbox reliability pass. It does not replace the application framework, add cloud processing, add paid services, or redesign unrelated Muji Room tools.

## Confirmed Problems

### Spinwheel

The delegated `change` handler calls `renderToolboxOverlay()` after a text input loses focus. Clicking Add choice or Create preset first triggers blur/change, which replaces the button DOM before its click finishes. The first click is swallowed. The same full `innerHTML` replacement resets focus and overlay scroll, causing the jump to the top.

### Media

Metadata loading has no timeout and can wait indefinitely. The FFmpeg worker load is not connected to the caller's abort signal, has no stage-specific timeout, and creates a fresh engine for each export. The current numeric-only UI cannot show the audio, place a cut visually, zoom, or drag a precise range.

### PDF

The PDF-to-images success path returns before its final overlay render, leaving the visible status at "Processing locally..." after completion. The development server also lacks explicit `.mjs` and `.wasm` MIME types, which can stop module workers from loading. Existing tests do not prove complete UI settlement and downloadable output.

## Chosen Approach

Use a stable Toolbox shell with focused DOM updates and small, testable models/controllers.

A minimal change-handler patch plus scroll restoration would preserve the underlying event race. A full framework migration would be disproportionate. The chosen approach keeps the current TypeScript application and delegated events while changing the update contract:

- opening, closing, or switching tools may mount a subview;
- typing, selection, dragging, playback, progress, preset changes, and choice changes never replace the Toolbox root;
- domain state changes first, then only the affected list, canvas, field, or status region is patched;
- focus, text selection, and scroll remain intact during ordinary interaction;
- a required subview remount captures and restores the meaningful focus target and scroll position.

## Architecture

`app.ts` remains responsible for overlay lifecycle, tool switching, persistence, and delegated event routing. It will not contain waveform math, FFmpeg lifecycle rules, or PDF job-state transitions.

`ToolboxView.ts` continues to render markup but gives each interactive region a stable hook. A focused interaction layer classifies events as state synchronization, which never remounts markup, or structural actions, which patch only the affected region.

PDF and Media share an explicit local-job lifecycle: `idle`, `validating`, `loading-engine`, `processing`, `success`, `error`, and `cancelled`. Every started job settles in success, error, or cancelled. Each job owns an `AbortController`, increasing job id, status message, and optional progress. Late results from an older id are ignored; starting a replacement cancels the active job. Status updates patch only the status element and never clear selected files.

## Spinwheel Experience

- Add choice commits a non-empty draft on the first click, appends one row, clears/refocuses the draft, persists choices, and redraws only the wheel.
- Enter in the draft performs the same action.
- Remove updates only the list and wheel.
- Create preset commits a valid name on the first click, updates preset controls, clears/refocuses the field, and persists presets.
- Choosing or deleting a preset does not move scroll.
- Invalid or duplicate actions show inline feedback.

Spinwheel uses the approved Clean Instrument direction: charcoal and steel surfaces, ivory text, fine technical dividers, and restrained sage accents. The wheel has a clean hub, readable labels, balanced segments, and a precise fixed pointer. Motion respects reduced-motion preferences, results use an `aria-live` region, and all actions remain keyboard-operable.

## Media Waveform Cutter

### Scope

The cutter keeps one continuous range and exports one clip. Multiple split regions, effects, fades, and server-side transcoding are outside this pass.

### Load and waveform

After file selection, the browser reads the audio locally and decodes it with Web Audio. Channel samples are reduced into deterministic min/max peak buckets; uploads and decoded samples are neither persisted nor logged.

Metadata and decode operations have explicit timeouts. Decoded and metadata durations reconcile to one finite positive duration. If waveform decoding is unsupported, exact time fields and a duration rail remain available with a clear explanation.

The timeline contains a real amplitude waveform, shaded keep-range, left/right trim handles, distinct playhead, adaptive time ticks, and `mm:ss.mmm` start/end/duration readouts. Pointer capture keeps dragging stable outside the canvas. Values clamp to integer milliseconds and preserve `0 <= start < end <= duration`.

Zoom ranges from `1x` to `32x`, centered on the visible playhead or selection midpoint. Above `1x`, horizontal pan changes the viewport without changing trim. An overview rail shows the visible window and selected range.

Time inputs accept `mm:ss.mmm` and normalized decimal seconds. Arrow adjusts 1 ms, Shift+Arrow 10 ms, and Ctrl/Command+Arrow 100 ms. Pointer and keyboard edits immediately synchronize the selection and readouts without remounting.

### Preview and export

Play previews from the playhead and stops at the end handle; Play selection starts at the start handle. Editing the end during playback safely updates the stop boundary.

Export is explicit. One local FFmpeg instance is reused for the page session unless a fatal failure or cancellation requires termination. Load and execution receive the job abort signal and separate timeouts. A non-zero FFmpeg exit becomes a visible error. Object URLs and in-memory worker files are released after completion. Preview never waits for FFmpeg, and no file leaves the browser.

## PDF Reliability

Each operation validates file count and type before processing. PDF-to-images settles state and patches the UI before returning downloads. Success reports an observable artifact count such as "3 PNG files ready." The server serves `.mjs` as JavaScript and `.wasm` as WebAssembly. Worker/document failures become explicit errors with retry; long work supports cancellation and timeout; final cleanup runs on every outcome.

Files and generated artifacts remain in memory or object URLs and never enter saved game data or diagnostic logs.

## Error Handling

- Validation preserves files and editable controls.
- Loading/processing states show stage-specific text and Cancel.
- Timeout errors identify the failed stage.
- Cancellation settles and enables immediate retry.
- A failed worker is discarded before retry.
- Status uses `aria-live="polite"`; errors also use an alert role.
- Cleanup revokes URLs, listeners, and temporary files without clearing trim values or Spinwheel data.

## Persistence and Privacy

Spin choices and presets continue to use owner-scoped Toolbox persistence. Media/PDF files, waveform samples, outputs, progress, and errors are session-only. No paid dependency, API key, cloud upload, or automatic AI call is introduced.

## Testing Strategy

Interaction regression tests reproduce blur/change/click ordering and prove Add choice/Create preset each execute once without replacing the overlay root, losing focus, or moving scroll. Enter parity is covered.

Pure waveform tests cover peak reduction, millisecond clamping, range invariants, time parsing/formatting, pixel-time mapping, zoom anchoring, pan bounds, playhead behavior, and keyboard increments.

Injected fake Media/PDF adapters verify engine reuse, abort propagation, stage timeouts, non-zero exits, stale-result rejection, cleanup, download creation, and every final state. Server tests assert `.mjs` and `.wasm` content types. Only fictional generated fixtures may be committed.

Final verification includes focused tests, the full HTML prototype suite, TypeScript checking, production build, `git diff --check`, and a browser smoke test proving one-click Spinwheel behavior, waveform drag/zoom/preview/export, and a PDF operation with real downloadable output. If browser automation is unavailable, that limitation is reported and end-to-end correctness is not claimed from static tests alone.

## Acceptance Criteria

- Add choice and Create preset respond to one click after editing.
- Spinwheel does not rebuild the Toolbox root, lose focus unexpectedly, or jump to the top.
- Spinwheel matches Clean Instrument in Landscape and Portrait.
- Decodable audio shows a waveform; unsupported decoding retains exact-time fallback.
- Handles, playhead, `1x`-`32x` zoom, pan, preview, and millisecond editing stay synchronized.
- Media exports one local clip or a specific recoverable error and never remains indefinitely Loading.
- Every PDF operation produces observable output or a specific recoverable error and never remains indefinitely Loading.
- All processing is local, free, explicit, and privacy-preserving.
