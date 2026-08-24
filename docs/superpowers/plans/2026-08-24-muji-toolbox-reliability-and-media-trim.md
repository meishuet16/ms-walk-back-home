# Muji Toolbox Reliability and Media Trim Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make Spinwheel respond once without remounting, add a precise local waveform cutter, and make Media/PDF jobs always settle with observable output or a recoverable error.

**Architecture:** Keep the existing TypeScript app and delegated events, but introduce focused pure models for job state and waveform math. The Toolbox root stays mounted during ordinary interaction; `app.ts` orchestrates focused patches while Media/PDF processors own browser engine lifecycles and return artifacts rather than mutating UI.

**Tech Stack:** TypeScript ES2022, browser DOM/Canvas/Web Audio, @ffmpeg/ffmpeg + @ffmpeg/core, pdf-lib, pdfjs-dist, Node test runner, esbuild.

## Global Constraints

- Processing stays local and explicit; do not add paid APIs, cloud uploads, or automatic AI calls.
- Use fictional generated fixtures only; never commit real uploads, diary content, logs, embeddings, or `.private-spec/`.
- Preserve the user's unrelated Scene Debug, scene manifest, asset 624, and zip changes.
- Media and PDF files, waveform samples, output URLs, progress, and errors remain session-only.
- One trim range produces one output clip; multi-split editing, fades, and effects are out of scope.
- Spinwheel uses the approved Clean Instrument palette: charcoal, steel, ivory, and restrained sage.
- Run red-green-refactor for each task and keep the app runnable after every commit.
- Do not push without asking the user.

## File Map

- Create `apps/html-prototype/src/systems/LocalJob.ts`: deterministic job phases, stale-job protection, abort, and timeout wrapper.
- Create `apps/html-prototype/src/systems/ToolboxInteraction.ts`: field update policy used to prevent draft blur/change remounts.
- Create `apps/html-prototype/src/systems/WaveformModel.ts`: millisecond timeline, peak reduction, zoom, pan, parsing, and pointer mapping.
- Create `apps/html-prototype/src/systems/MediaWaveform.ts`: Web Audio decoding and Canvas rendering.
- Create `apps/html-prototype/src/systems/PdfProcessor.ts`: validation plus artifact-returning PDF orchestration.
- Modify `apps/html-prototype/src/systems/MediaToolkit.ts`: reusable injectable FFmpeg processor.
- Modify `apps/html-prototype/src/systems/PdfToolkit.ts`: abortable PDF.js rasterization and cleanup.
- Modify `apps/html-prototype/src/systems/ToolboxView.ts`: stable patch hooks, waveform markup, job controls, accessible status.
- Modify `apps/html-prototype/src/app.ts`: focused Spin/Media/PDF orchestration and pointer/preview lifecycle.
- Modify `apps/html-prototype/src/styles.css`: Clean Instrument Spinwheel and responsive cutter layout.
- Modify `apps/html-prototype/scripts/dev-server.mjs`: correct `.mjs` and `.wasm` MIME types.
- Add focused tests under `apps/html-prototype/tests/` for every new module and integration contract.

---

### Task 1: Local Job Lifecycle and Worker MIME

**Files:**
- Create: `apps/html-prototype/src/systems/LocalJob.ts`
- Create: `apps/html-prototype/tests/local-job.test.ts`
- Create: `apps/html-prototype/tests/dev-server-mime.test.ts`
- Modify: `apps/html-prototype/scripts/dev-server.mjs:8-20`

**Interfaces:**
- Produces: `LocalJobPhase`, `LocalJobState`, `createLocalJobState()`, `beginLocalJob()`, `advanceLocalJob()`, `settleLocalJob()`, `localJobIsCurrent()`, and `runAbortableStage<T>()`.
- Consumers: Media and PDF orchestration in Tasks 5 and 6.

- [ ] **Step 1: Write failing state, timeout, and MIME tests**

```ts
import assert from "node:assert/strict";
import test from "node:test";
import {
  advanceLocalJob,
  beginLocalJob,
  createLocalJobState,
  localJobIsCurrent,
  runAbortableStage,
  settleLocalJob
} from "../src/systems/LocalJob.js";

test("local jobs reject stale updates and always use terminal settlement", () => {
  const started = beginLocalJob(createLocalJobState(), "validating", "Checking files");
  assert.equal(started.id, 1);
  assert.equal(advanceLocalJob(started, 0, "processing", "Old").message, "Checking files");
  const done = settleLocalJob(started, 1, "success", "Ready");
  assert.equal(done.phase, "success");
  assert.equal(localJobIsCurrent(done, 1), true);
});

test("abortable stages abort work and name the timed out stage", async () => {
  let aborted = false;
  await assert.rejects(
    runAbortableStage({
      label: "Media engine",
      timeoutMs: 5,
      run: (signal) => new Promise<void>((_resolve, reject) => {
        signal.addEventListener("abort", () => { aborted = true; reject(signal.reason); }, { once: true });
      })
    }),
    /Media engine timed out/
  );
  assert.equal(aborted, true);
});
```

Add `dev-server-mime.test.ts` that reads `scripts/dev-server.mjs` and asserts:

```ts
assert.match(source, /"\.mjs": "text\/javascript; charset=utf-8"/);
assert.match(source, /"\.wasm": "application\/wasm"/);
```

- [ ] **Step 2: Run the build to verify the new import fails**

Run from `apps/html-prototype`: `npm run build`

Expected: FAIL because `src/systems/LocalJob.ts` does not exist.

- [ ] **Step 3: Implement deterministic state transitions and abortable stages**

```ts
export type LocalJobPhase =
  | "idle" | "validating" | "loading-engine" | "processing"
  | "success" | "error" | "cancelled";

export type LocalJobState = {
  id: number;
  phase: LocalJobPhase;
  progress: number;
  message: string;
};

export function createLocalJobState(): LocalJobState {
  return { id: 0, phase: "idle", progress: 0, message: "" };
}

export function beginLocalJob(previous: LocalJobState, phase: "validating" | "loading-engine", message: string): LocalJobState {
  return { id: previous.id + 1, phase, progress: 0, message };
}

export function advanceLocalJob(state: LocalJobState, id: number, phase: "loading-engine" | "processing", message: string, progress = state.progress): LocalJobState {
  return id === state.id ? { ...state, phase, message, progress: Math.max(0, Math.min(1, progress)) } : state;
}

export function settleLocalJob(state: LocalJobState, id: number, phase: "success" | "error" | "cancelled", message: string): LocalJobState {
  return id === state.id ? { ...state, phase, message, progress: phase === "success" ? 1 : state.progress } : state;
}

export function localJobIsCurrent(state: LocalJobState, id: number): boolean {
  return state.id === id;
}

export async function runAbortableStage<T>(options: {
  label: string;
  timeoutMs: number;
  parentSignal?: AbortSignal;
  run: (signal: AbortSignal) => Promise<T>;
}): Promise<T> {
  const controller = new AbortController();
  const relay = () => controller.abort(options.parentSignal?.reason ?? new DOMException("Cancelled", "AbortError"));
  options.parentSignal?.addEventListener("abort", relay, { once: true });
  const timer = setTimeout(() => controller.abort(new Error(options.label + " timed out")), options.timeoutMs);
  try {
    return await options.run(controller.signal);
  } finally {
    clearTimeout(timer);
    options.parentSignal?.removeEventListener("abort", relay);
  }
}
```

Add the two MIME entries to the existing `mime` map.

- [ ] **Step 4: Build and run focused tests**

Run: `npm run build`

Run: `node --test dist/tests/local-job.test.js dist/tests/dev-server-mime.test.js`

Expected: PASS.

- [ ] **Step 5: Commit the lifecycle foundation**

```bash
git add apps/html-prototype/src/systems/LocalJob.ts apps/html-prototype/tests/local-job.test.ts apps/html-prototype/tests/dev-server-mime.test.ts apps/html-prototype/scripts/dev-server.mjs
git commit -m "fix: settle local toolbox jobs"
```

---

### Task 2: Stable One-Click Spinwheel and Clean Instrument UI

**Files:**
- Create: `apps/html-prototype/src/systems/ToolboxInteraction.ts`
- Create: `apps/html-prototype/tests/toolbox-interaction.test.ts`
- Modify: `apps/html-prototype/src/systems/ToolboxView.ts:92-96`
- Modify: `apps/html-prototype/src/app.ts:860-1018,1263-1313`
- Modify: `apps/html-prototype/src/styles.css:5222-5290,5623-5668`
- Modify: `apps/html-prototype/tests/toolbox-completion.test.ts:81-113`

**Interfaces:**
- Produces: `toolboxFieldChangeEffect(field)` returning `"draft-only" | "patch" | "remount"`.
- Produces: exported `renderSpinChoiceItems()` and `renderSpinPresetOptions()`.
- Produces in `app.ts`: `refreshSpinWheelView(options?)`, which preserves panel/list scroll and never replaces `.toolbox-panel`.

- [ ] **Step 1: Write the blur/change/click regression test**

```ts
import assert from "node:assert/strict";
import test from "node:test";
import { toolboxFieldChangeEffect } from "../src/systems/ToolboxInteraction.js";

test("Spin draft change cannot remount the button before click", () => {
  const draft = new EventTarget();
  const button = new EventTarget();
  let remounts = 0;
  let clicks = 0;
  draft.addEventListener("change", () => {
    if (toolboxFieldChangeEffect("spin-choice") === "remount") remounts += 1;
  });
  button.addEventListener("click", () => { clicks += 1; });
  draft.dispatchEvent(new Event("change"));
  button.dispatchEvent(new Event("click"));
  assert.deepEqual({ remounts, clicks }, { remounts: 0, clicks: 1 });
  assert.equal(toolboxFieldChangeEffect("spin-preset-name"), "draft-only");
  assert.equal(toolboxFieldChangeEffect("spin-preset"), "patch");
});
```

Update `toolbox-completion.test.ts` so it asserts the Spin action blocks call `refreshSpinWheelView` and do not call `renderToolboxOverlay`.

- [ ] **Step 2: Run the build and confirm the missing module failure**

Run: `npm run build`

Expected: FAIL on `ToolboxInteraction.js`.

- [ ] **Step 3: Add the field policy and focused Spin render hooks**

```ts
export type ToolboxFieldChangeEffect = "draft-only" | "patch" | "remount";

export function toolboxFieldChangeEffect(field: string | undefined): ToolboxFieldChangeEffect {
  if (field === "spin-choice" || field === "spin-preset-name") return "draft-only";
  if (field === "spin-preset" || field === "pdf-files" || field === "media-file") return "patch";
  return "remount";
}
```

Give the Spin preset select, preset options, choice list, result, status, and Spin button stable `data-spin-region` hooks. Export the two small HTML renderers and keep all text escaped.

- [ ] **Step 4: Replace Spin remounts with focused patches**

Implement `refreshSpinWheelView({ focusChoice = false, focusPreset = false } = {})` using this contract:

```ts
const panel = this.overlay.querySelector<HTMLElement>(".toolbox-panel");
const list = this.overlay.querySelector<HTMLElement>("[data-spin-region=choices]");
const panelScroll = panel?.scrollTop ?? 0;
const listScroll = list?.scrollTop ?? 0;
// Patch select.options, list.innerHTML, result.textContent, status.textContent,
// Spin disabled/text, then redraw only the canvas.
if (panel) panel.scrollTop = panelScroll;
if (list) list.scrollTop = listScroll;
if (focusChoice) this.overlay.querySelector<HTMLInputElement>("[data-toolbox-field=spin-choice]")?.focus();
```

In `handleToolboxFieldChange`, return immediately for `draft-only`; use the focused patch for `spin-preset`. In Add/Create/Remove/Rename/Delete and spin start/finish, persist state and call `refreshSpinWheelView`, not `renderToolboxOverlay`.

- [ ] **Step 5: Apply the Clean Instrument styles**

Use CSS variables scoped to `.spin-wheel-tool`:

```css
.spin-wheel-tool {
  --instrument-charcoal: #161a1b;
  --instrument-steel: #566166;
  --instrument-ivory: #f0eadc;
  --instrument-sage: #9eae9b;
}
.spin-wheel-stage { background: radial-gradient(circle, #303638 0, #171b1c 68%); border-color: #566166; }
.spin-pointer, .spin-wheel-result { color: var(--instrument-sage); }
.spin-choice-list li { border-left: 2px solid #566166; background: rgba(240, 234, 220, .055); }
.spin-wheel-tool :focus-visible { outline: 2px solid var(--instrument-sage); outline-offset: 2px; }
@media (prefers-reduced-motion: reduce) {
  .spin-wheel-tool * { scroll-behavior: auto; transition-duration: 0.01ms !important; }
}
```

Update the Canvas palette, hub, pointer alignment, and label contrast to match these tokens.

- [ ] **Step 6: Build and run Spin/Toolbox tests**

Run: `npm run build`

Run: `node --test dist/tests/toolbox-interaction.test.js dist/tests/toolbox-completion.test.js dist/tests/toolbox-model.test.js dist/tests/toolbox-utilities.test.js`

Expected: PASS.

- [ ] **Step 7: Commit the stable Spinwheel**

```bash
git add apps/html-prototype/src/systems/ToolboxInteraction.ts apps/html-prototype/src/systems/ToolboxView.ts apps/html-prototype/src/app.ts apps/html-prototype/src/styles.css apps/html-prototype/tests/toolbox-interaction.test.ts apps/html-prototype/tests/toolbox-completion.test.ts
git commit -m "fix: make Spinwheel actions immediate"
```

---

### Task 3: Millisecond Waveform Timeline Model

**Files:**
- Create: `apps/html-prototype/src/systems/WaveformModel.ts`
- Create: `apps/html-prototype/tests/waveform-model.test.ts`

**Interfaces:**
- Produces: `WaveformPeak`, `TrimTimelineState`, `createTrimTimeline()`, `setTrimBoundary()`, `setPlayhead()`, `parseTimelineTime()`, `formatTimelineTime()`, `reduceAudioPeaks()`, `timeAtPixel()`, `zoomTimeline()`, `panTimeline()`, and `timelineKeyboardStep()`.
- Consumers: Media waveform view and App integration in Task 4.

- [ ] **Step 1: Write failing math and invariant tests**

```ts
test("timeline uses exact milliseconds and stable formatting", () => {
  assert.equal(parseTimelineTime("01:01.234"), 61234);
  assert.equal(parseTimelineTime("1.005"), 1005);
  assert.equal(formatTimelineTime(61234), "01:01.234");
  const state = createTrimTimeline(10000);
  assert.deepEqual(setTrimBoundary(state, "start", 1200), { ...state, startMs: 1200, playheadMs: 1200 });
  assert.throws(() => setTrimBoundary(state, "end", 0), /after start/);
});

test("zoom anchors the playhead and pan remains bounded", () => {
  const state = { ...createTrimTimeline(100000), playheadMs: 50000 };
  const zoomed = zoomTimeline(state, 4);
  assert.equal(zoomed.zoom, 4);
  assert.ok(zoomed.viewportStartMs <= 50000 && 50000 <= zoomed.viewportStartMs + 25000);
  assert.equal(panTimeline(zoomed, -999999).viewportStartMs, 0);
  assert.equal(timelineKeyboardStep({ shiftKey: true, ctrlKey: false, metaKey: false }), 10);
});
```

Add a deterministic stereo peak test using two short `Float32Array` channels.

- [ ] **Step 2: Run the build and verify it fails**

Run: `npm run build`

Expected: FAIL because `WaveformModel.ts` is missing.

- [ ] **Step 3: Implement integer-millisecond timeline operations**

Use this state shape:

```ts
export type TrimTimelineState = {
  durationMs: number;
  startMs: number;
  endMs: number;
  playheadMs: number;
  zoom: number;
  viewportStartMs: number;
};

export type WaveformPeak = { min: number; max: number };
```

Clamp zoom to `1..32`, boundaries and playhead to integer milliseconds, and viewport start to `0..durationMs - durationMs / zoom`. `timeAtPixel` maps a clamped CSS pixel position through the visible window. `reduceAudioPeaks` averages channels per sample and records min/max per bucket without retaining source arrays.

- [ ] **Step 4: Build and run the model test**

Run: `npm run build`

Run: `node --test dist/tests/waveform-model.test.js`

Expected: PASS.

- [ ] **Step 5: Commit the pure timeline model**

```bash
git add apps/html-prototype/src/systems/WaveformModel.ts apps/html-prototype/tests/waveform-model.test.ts
git commit -m "feat: add precise waveform timeline model"
```

---

### Task 4: Waveform Decode, Canvas Interaction, Preview, and Responsive UI

**Files:**
- Create: `apps/html-prototype/src/systems/MediaWaveform.ts`
- Create: `apps/html-prototype/tests/media-waveform.test.ts`
- Modify: `apps/html-prototype/src/systems/ToolboxView.ts:6-51,128-130`
- Modify: `apps/html-prototype/src/app.ts:316-329,860-925,1201-1246,1263-1313`
- Modify: `apps/html-prototype/src/styles.css:5270-5290,5631-5668`

**Interfaces:**
- Produces: `decodeWaveform(file, options)`, `drawWaveform(canvas, peaks, timeline)`, and `drawWaveformOverview(canvas, timeline)`.
- App state adds `mediaTimeline: TrimTimelineState`, `mediaPeaks: WaveformPeak[]`, `mediaPreviewUrl`, `mediaWaveformStatus`, and drag mode `"start" | "end" | "playhead" | "pan" | null`.

- [ ] **Step 1: Write failing decode-helper and markup-contract tests**

Use an injected fake decoder:

```ts
const decoded = await decodeWaveform(new Blob([new Uint8Array([1])]), {
  bucketCount: 2,
  signal: new AbortController().signal,
  decode: async () => ({
    duration: 2,
    channels: [Float32Array.from([-1, 0, .5, 1])]
  })
});
assert.equal(decoded.durationMs, 2000);
assert.equal(decoded.peaks.length, 2);
```

Update the Toolbox view test to assert hooks for `data-media-waveform`, `data-media-overview`, two range handles, playhead, zoom controls, pan controls, preview, cancel, and `mm:ss.mmm` fields.

- [ ] **Step 2: Run the build and verify the new module is missing**

Run: `npm run build`

Expected: FAIL on `MediaWaveform.js`.

- [ ] **Step 3: Implement abortable Web Audio decode and Canvas drawing**

```ts
export async function decodeWaveform(file: Blob, options: {
  bucketCount: number;
  signal: AbortSignal;
  decode?: (bytes: ArrayBuffer) => Promise<{ duration: number; channels: Float32Array[] }>;
}): Promise<{ durationMs: number; peaks: WaveformPeak[] }> {
  if (options.signal.aborted) throw options.signal.reason;
  const bytes = await file.arrayBuffer();
  const decoded = options.decode
    ? await options.decode(bytes)
    : await decodeWithAudioContext(bytes, options.signal);
  return {
    durationMs: Math.round(decoded.duration * 1000),
    peaks: reduceAudioPeaks(decoded.channels, options.bucketCount)
  };
}
```

Draw only the peaks intersecting the visible timeline, selected-range shading, millisecond-aware ticks, both handles, and playhead. Scale backing-store dimensions by `devicePixelRatio` while pointer math uses CSS pixels.

- [ ] **Step 4: Replace numeric-only Media markup with the cutter**

Render:
- file and operation controls;
- preview host;
- main waveform Canvas with slider semantics;
- overview Canvas;
- start/end `mm:ss.mmm` inputs;
- selected duration;
- Play selection, Stop, zoom `1x/2x/4x/8x/16x/32x`, pan left/right, Export, and Cancel;
- job status/progress with stable hooks.

Use `aria-valuemin`, `aria-valuemax`, `aria-valuenow`, and text labels for the active handles.

- [ ] **Step 5: Integrate loading, pointer capture, keyboard precision, and preview**

On file selection:
1. cancel the previous decode;
2. revoke the previous preview URL;
3. create the audio/video preview URL;
4. call metadata loading and `decodeWaveform` through `runAbortableStage`;
5. initialize `createTrimTimeline(durationMs)`;
6. patch only Media regions and draw.

Add root pointer handlers that call `setPointerCapture`, choose the closest handle/playhead or pan mode, convert pixels with `timeAtPixel`, and redraw without remounting. Input Arrow uses 1 ms, Shift 10 ms, and Ctrl/Meta 100 ms. Preview sets `currentTime = startMs / 1000`, updates the playhead with `requestAnimationFrame`, and pauses at `endMs`.

- [ ] **Step 6: Add responsive Clean Instrument cutter CSS**

Use a charcoal waveform surface, steel grid/ticks, ivory peaks, sage selected peaks/playhead, minimum 44 px touch handles, tabular time fields, horizontally safe zoom controls, and an overview rail. At portrait widths, stack the fields and keep Canvas width at 100% without overflowing the panel.

- [ ] **Step 7: Build and run waveform/UI tests**

Run: `npm run build`

Run: `node --test dist/tests/waveform-model.test.js dist/tests/media-waveform.test.js dist/tests/toolbox-completion.test.js`

Expected: PASS.

- [ ] **Step 8: Commit the interactive cutter**

```bash
git add apps/html-prototype/src/systems/MediaWaveform.ts apps/html-prototype/src/systems/ToolboxView.ts apps/html-prototype/src/app.ts apps/html-prototype/src/styles.css apps/html-prototype/tests/media-waveform.test.ts apps/html-prototype/tests/toolbox-completion.test.ts
git commit -m "feat: add waveform media cutter"
```

---

### Task 5: Reusable Abortable FFmpeg Export

**Files:**
- Modify: `apps/html-prototype/src/systems/MediaToolkit.ts:1-82`
- Modify: `apps/html-prototype/tests/media-toolkit.test.ts:1-16`
- Modify: `apps/html-prototype/src/app.ts:1219-1246`
- Modify: `apps/html-prototype/src/systems/ToolboxView.ts:128-130`

**Interfaces:**
- Produces: injectable `FFmpegAdapter`, `MediaProcessor`, singleton `defaultMediaProcessor`, and compatible `processMediaFile()`.
- `MediaProcessor.process()` accepts `signal`, `onStage`, and `onProgress`; `reset()` terminates a failed worker.

- [ ] **Step 1: Expand tests with a fake engine**

```ts
test("media processor loads once, checks exit codes, and cleans files", async () => {
  const calls: string[] = [];
  const fake = makeFakeFfmpeg({
    load: async () => { calls.push("load"); return true; },
    exec: async () => 0,
    readFile: async () => new Uint8Array([1, 2, 3])
  });
  const processor = new MediaProcessor(async () => fake, async (url) => url);
  const file = new File([new Uint8Array([9])], "tone.wav", { type: "audio/wav" });
  await processor.process(file, "trim-audio", trimOptions);
  await processor.process(file, "trim-audio", trimOptions);
  assert.equal(calls.filter((call) => call === "load").length, 1);
  assert.equal(fake.deleted.length, 4);
});
```

Add cases for abort during load, timeout, non-zero `exec`, progress clamping, and `reset()` after a fatal failure.

- [ ] **Step 2: Run the focused test and confirm API failure**

Run: `npm run build`

Expected: FAIL because `MediaProcessor` is not exported.

- [ ] **Step 3: Refactor to a reusable processor**

Define an adapter matching the installed signatures:

```ts
export interface FFmpegAdapter {
  load(config: { coreURL: string; wasmURL: string }, options?: { signal?: AbortSignal }): Promise<boolean>;
  exec(args: string[], timeout?: number, options?: { signal?: AbortSignal }): Promise<number>;
  writeFile(path: string, data: Uint8Array, options?: { signal?: AbortSignal }): Promise<boolean>;
  readFile(path: string, encoding?: string, options?: { signal?: AbortSignal }): Promise<Uint8Array | string>;
  deleteFile(path: string): Promise<boolean>;
  on(event: "progress", callback: (event: { progress: number }) => void): void;
  off(event: "progress", callback: (event: { progress: number }) => void): void;
  terminate(): void;
}
```

Cache the loaded adapter. Pass the abort signal into `load`, `writeFile`, `exec`, and `readFile`. Use a 30 second load timeout and 120 second execution timeout. Throw `Media processing exited with code N` for non-zero exit. Delete input/output and unregister progress in `finally`; keep a healthy loaded worker alive.

- [ ] **Step 4: Connect export to job state and Cancel**

Use `beginLocalJob`, advance to `loading-engine` and `processing`, patch only status/progress, and settle success/error/cancelled. Ignore completions whose id is no longer current. Add `toolbox-media-cancel` to abort the active controller and stop previ

- [ ] **Step 5: Build and run Media tests**

Run: `npm run build`

Run: `node --test dist/tests/local-job.test.js dist/tests/media-toolkit.test.js dist/tests/media-waveform.test.js`

Expected: PASS.

- [ ] **Step 6: Commit reliable Media export**

```bash
git add apps/html-prototype/src/systems/MediaToolkit.ts apps/html-prototype/src/app.ts apps/html-prototype/src/systems/ToolboxView.ts apps/html-prototype/tests/media-toolkit.test.ts
git commit -m "fix: make local media export abortable"
```

---

### Task 6: Artifact-Returning PDF Processor and Settled UI

**Files:**
- Create: `apps/html-prototype/src/systems/PdfProcessor.ts`
- Create: `apps/html-prototype/tests/pdf-processor.test.ts`
- Modify: `apps/html-prototype/src/systems/PdfToolkit.ts:104-120`
- Modify: `apps/html-prototype/tests/pdf-toolkit.test.ts:39-44`
- Modify: `apps/html-prototype/src/app.ts:316-320,1153-1199,1279-1313`
- Modify: `apps/html-prototype/src/systems/ToolboxView.ts:40-50,124-126`

**Interfaces:**
- Produces: `PdfMode`, `PdfRequest`, `PdfArtifact`, `validatePdfRequest()`, and `processPdfRequest(request, deps?)`.
- `pdfToPngImages(file, scale, options)` accepts `signal` and `onProgress` and destroys PDF.js tasks/documents on completion.

- [ ] **Step 1: Write failing validation and PDF-to-images settlement tests**

```ts
test("PDF to images returns observable artifacts instead of an early UI return", async () => {
  const file = new File([new Uint8Array([1])], "sample.pdf", { type: "application/pdf" });
  const result = await processPdfRequest(
    { mode: "pdf-to-images", files: [file], range: "" },
    { pdfToImages: async () => [new Blob(["a"]), new Blob(["b"])] }
  );
  assert.deepEqual(result.artifacts.map((item) => item.filename), ["sample-page-1.png", "sample-page-2.png"]);
  assert.equal(result.message, "2 PNG files ready");
});

test("PDF modes validate file count and MIME before processing", () => {
  assert.throws(() => validatePdfRequest({ mode: "merge", files: [], range: "" }), /Choose/);
  assert.throws(() => validatePdfRequest({ mode: "images-to-pdf", files: [pdfFile], range: "" }), /image/);
});
```

Extend `pdf-toolkit.test.ts` with fake abort/cleanup expectations for rasterization helpers.

- [ ] **Step 2: Run the build and confirm the missing processor failure**

Run: `npm run build`

Expected: FAIL on `PdfProcessor.js`.

- [ ] **Step 3: Implement validation and artifact-returning orchestration**

```ts
export type PdfArtifact = { blob: Blob; filename: string };
export type PdfProcessorDependencies = {
  merge: typeof mergePdfFiles;
  imagesToPdf: typeof imagesToPdf;
  optimize: typeof optimizePdf;
  pageCount: (file: Blob) => Promise<number>;
  deletePages: typeof deletePdfPages;
  reorderOrExtract: typeof reorderOrExtractPdf;
  pdfToImages: (file: Blob, signal?: AbortSignal) => Promise<Blob[]>;
};

export async function processPdfRequest(request: PdfRequest, deps = defaultPdfDependencies): Promise<{
  artifacts: PdfArtifact[];
  message: string;
}> {
  validatePdfRequest(request);
  const first = request.files[0];
  request.signal?.throwIfAborted();
  if (request.mode === "pdf-to-images") {
    const images = await deps.pdfToImages(first, request.signal);
    const base = first.name.replace(/\.pdf$/i, "") || "document";
    return {
      artifacts: images.map((blob, index) => ({ blob, filename: `${base}-page-${index + 1}.png` })),
      message: `${images.length} PNG file${images.length === 1 ? "" : "s"} ready`
    };
  }
  let bytes: Uint8Array;
  let filename: string;
  let message: string;
  if (request.mode === "merge") {
    bytes = await deps.merge(request.files);
    filename = pdfOutputFilename(first.name, "merged");
    message = `Merged PDF ready: ${filename}`;
  } else if (request.mode === "images-to-pdf") {
    bytes = await deps.imagesToPdf(request.files);
    filename = pdfOutputFilename(first.name, "document");
    message = `PDF ready: ${filename}`;
  } else if (request.mode === "compress") {
    const optimized = await deps.optimize(first);
    bytes = optimized.bytes;
    filename = pdfOutputFilename(first.name, "optimized");
    message = `${optimized.report.message}: ${filename}`;
  } else {
    const operation = parsePdfPageOperation(request.range, await deps.pageCount(first));
    bytes = operation.deleteMode
      ? await deps.deletePages(first, operation.pages)
      : await deps.reorderOrExtract(first, operation.pages);
    const suffix = request.mode === "extract" ? "pages" : "reordered";
    filename = pdfOutputFilename(first.name, suffix);
    message = `PDF ready: ${filename}`;
  }
  request.signal?.throwIfAborted();
  return {
    artifacts: [{ blob: new Blob([bytes.buffer as ArrayBuffer], { type: "application/pdf" }), filename }],
    message
  };
}
```

Move page counting and operation branching out of `app.ts` into this processor. Keep existing PdfToolkit pure operations unchanged except for raster cancellation/cleanup.

- [ ] **Step 4: Add abort and cleanup to PDF.js rasterization**

Attach one abort listener that calls `documentTask.destroy()`. Check `signal.throwIfAborted()` between pages, report `pageNumber / numPages`, and call `page.cleanup()` plus `pdfDocument.destroy()` in `finally`.

- [ ] **Step 5: Replace App branching with one settled job path**

The App flow is:

```ts
const started = beginLocalJob(this.pdfJob, "validating", "Checking files...");
this.pdfJob = started;
this.refreshToolboxPdfJob();
try {
  this.pdfJob = advanceLocalJob(this.pdfJob, started.id, "processing", "Processing locally...");
  const result = await runAbortableStage({
    label: "PDF processing",
    timeoutMs: 120000,
    parentSignal: controller.signal,
    run: (signal) => processPdfRequest({ mode, files, range, signal })
  });
  if (!localJobIsCurrent(this.pdfJob, started.id)) return;
  result.artifacts.forEach((item) => this.downloadLocalBlob(item.blob, item.filename));
  this.pdfJob = settleLocalJob(this.pdfJob, started.id, "success", result.message);
} catch (error) {
  const phase = controller.signal.aborted ? "cancelled" : "error";
  this.pdfJob = settleLocalJob(this.pdfJob, started.id, phase, readableJobError(error));
} finally {
  this.refreshToolboxPdfJob();
}
```

Add Process, Cancel, Retry, progress, and accessible status hooks. There is no success-path return before settlement.

- [ ] **Step 6: Build and run PDF tests**

Run: `npm run build`

Run: `node --test dist/tests/local-job.test.js dist/tests/pdf-toolkit.test.js dist/tests/pdf-processor.test.js dist/tests/dev-server-mime.test.js`

Expected: PASS.

- [ ] **Step 7: Commit reliable PDF jobs**

```bash
git add apps/html-prototype/src/systems/PdfProcessor.ts apps/html-prototype/src/systems/PdfToolkit.ts apps/html-prototype/src/systems/ToolboxView.ts apps/html-prototype/src/app.ts apps/html-prototype/tests/pdf-processor.test.ts apps/html-prototype/tests/pdf-toolkit.test.ts
git commit -m "fix: settle local PDF processing"
```

---

### Task 7: Full Regression and Browser Proof

**Files:**
- Modify only if verification exposes a scoped defect in files already listed above.
- Do not modify the user's unrelated Scene Debug or asset files.

**Interfaces:**
- Consumes all completed tasks.
- Produces verification evidence for first-click Spin, waveform trim/export, and PDF output.

- [ ] **Step 1: Run all focused Toolbox tests**

Run from `apps/html-prototype`:

```bash
node --test dist/tests/toolbox-interaction.test.js dist/tests/toolbox-completion.test.js dist/tests/toolbox-model.test.js dist/tests/toolbox-utilities.test.js dist/tests/waveform-model.test.js dist/tests/media-waveform.test.js dist/tests/media-toolkit.test.js dist/tests/pdf-toolkit.test.js dist/tests/pdf-processor.test.js dist/tests/local-job.test.js dist/tests/dev-server-mime.test.js
```

Expected: PASS with no skipped tests.

- [ ] **Step 2: Run full static verification**

Run: `npm run typecheck`

Run: `npm run build`

Run: `npm test`

Run from repository root: `git diff --check`

Expected: all commands exit 0.

- [ ] **Step 3: Start or reuse the local server**

Run: `npm run dev`

Expected: the prototype is reachable at `http://localhost:4173`. If the port is already owned by this repo's dev server, reuse it instead of starting a duplicate.

- [ ] **Step 4: Verify Spinwheel in a real browser**

Open Muji Room Toolbox, enter Spinwheel, type a new choice, and click Add once. Assert the row and wheel segment appear, focus returns to the draft, and panel `scrollTop` does not change. Type a new preset name and click Create preset once. Repeat in portrait viewport and confirm no horizontal overflow.

- [ ] **Step 5: Verify Media with a fictional generated tone**

Use a generated WAV tone, not personal audio. Confirm the waveform draws, both handles drag, playhead seeks, zoom reaches 32x, pan changes only the viewport, time inputs accept `00:00.001`, modifier-key steps are correct, preview stops at the end handle, and export downloads one playable clip. Cancel one export and confirm the UI settles to Cancelled and retries.

- [ ] **Step 6: Verify PDF with a fictional generated document**

Use a generated two-page PDF. Run PDF-to-images and confirm two PNG downloads plus a settled success message. Run one PDF output operation and open the downloaded PDF. Trigger one validation error and confirm the files remain selected and retry is available.

- [ ] **Step 7: Review the final diff and worktree isolation**

Run: `git status --short`

Run: `git diff --stat HEAD~6..HEAD`

Confirm only Toolbox/Media/PDF files and their tests/docs were changed by this work. Do not stage or edit the pre-existing Scene Debug, scene-layout, asset 624, or zip changes.

- [ ] **Step 8: Commit any verification-only scoped correction**

If verification required a correction, stage only its listed Toolbox file and matching regression test, then commit:

```bash
git commit -m "fix: close toolbox verification gap"
```

If no correction was required, create no empty commit.
