# Muji Toolbox Scoped Improvements Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix real local media export first, then make PDF page operations distinct, improve Spinwheel mobile UX, and enrich Living Window weather/moon presentation without touching unrelated authored/runtime content.

**Architecture:** Keep the existing `MediaToolkit`/`LocalJob`, `PdfToolkit`, `SpinWheel`/`ToolboxView`, and `LivingWindow`/`MoonPhase` boundaries. Add only focused pure helpers and responsive rendering/state patches; `app.ts` remains orchestration.

**Tech Stack:** TypeScript, Node test runner, esbuild, `pdf-lib`, `@ffmpeg/ffmpeg`/`@ffmpeg/core`/`@ffmpeg/util`, existing HTML/CSS UI.

## Global Constraints

- Work only on `main` after a clean `HEAD == origin/main` gate.
- P0 must identify the exact failing FFmpeg stage and prove a real fresh-build export before P1.
- Do not fix P0 by increasing a timeout unless evidence proves the path is healthy and only slow.
- Preserve bounded timeout, cancellation, cached engine reuse, waveform, selection playback, and precise trim commands.
- Preserve existing PDF processing engine where possible; do not invent unsupported data or modes.
- Preserve Spinwheel randomness and desktop behavior.
- Use only provider-supplied weather/hourly data and existing deterministic moon calculations.
- Do not modify authored Chapter/diary text, scene assets/layouts/registration, gameplay, Reflection Wall, Scene Debug Editor, Supabase, CI, or unrelated cleanup.
- Never commit `.private-spec/`, real media, personal data, secrets, logs with personal content, or generated outputs.

---

### Task 1: Record the approved design and P0 diagnostics

**Files:**
- Create: `docs/superpowers/specs/2026-08-24-muji-toolbox-scoped-improvements-design.md`
- Create: `docs/superpowers/plans/2026-08-24-muji-toolbox-scoped-improvements.md`
- Inspect: `apps/html-prototype/src/systems/MediaToolkit.ts`, `apps/html-prototype/src/systems/LocalJob.ts`, `apps/html-prototype/scripts/build.mjs`, `apps/html-prototype/scripts/dev-server.mjs`, `apps/html-prototype/vercel.json`, package manifests, existing media tests.

- [ ] **Step 1: Verify the safety gate again.**

Run `git status --short; git branch --show-current; git rev-parse HEAD; git rev-parse origin/main; git rev-list --left-right --count HEAD...origin/main` and require clean `main`, equal SHAs, and `0 0`.

- [ ] **Step 2: Trace a fresh built media load before changing production code.**

Run the existing build, inspect `dist/browser/ffmpeg/ffmpeg-core.js` and `.wasm`, start the dev server, and request the exact URLs produced by the built module. Record status, MIME, byte size, and whether the body is the real asset. Use browser/runtime diagnostics or a small test seam to identify the last successful stage among module imports, URL resolution, core fetch/conversion, `new FFmpeg`, `load`, worker/WASM startup, `writeFile`, `exec`, and `readFile`.

- [ ] **Step 3: Commit only the approved design documents.**

Run `git add docs/superpowers/specs/2026-08-24-muji-toolbox-scoped-improvements-design.md docs/superpowers/plans/2026-08-24-muji-toolbox-scoped-improvements.md; git commit -m "docs: plan scoped Muji Toolbox improvements"`.

### Task 2: P0 media regression — failing tests and minimal fix

**Files:**
- Modify: `apps/html-prototype/src/systems/MediaToolkit.ts`
- Modify: `apps/html-prototype/src/systems/LocalJob.ts` only if the trace proves lifecycle behavior is causal
- Modify: `apps/html-prototype/src/app.ts` only if stage-specific error propagation needs a bounded UI change
- Modify: `apps/html-prototype/scripts/build.mjs`, `apps/html-prototype/scripts/dev-server.mjs`, or `apps/html-prototype/vercel.json` only if the trace proves a serving/build issue
- Test: `apps/html-prototype/tests/media-toolkit.test.ts`, `apps/html-prototype/tests/local-job.test.ts`, plus a focused regression test if needed

- [ ] **Step 1: Write a failing regression test for the proven root cause.**

The test must reproduce the actual failure boundary or poisoned cache/lifecycle state with injected FFmpeg and URL/fetch seams; assert the exact stage/error and that a retry can recover. Run the focused test and observe the expected failure before implementation.

- [ ] **Step 2: Implement one minimal root-cause fix.**

Keep a single reusable engine after successful load, clear rejected URL/load promises, terminate failed/cancelled engines, relay abort into `engine.load`/`exec`, and preserve cleanup. If the trace instead proves asset serving or bundling, correct only that build/server contract. Do not increase timeout as a substitute for diagnosis.

- [ ] **Step 3: Verify P0 focused tests and built resources.**

Run the media/local-job tests, fresh `npm run build`, and exact asset HTTP checks. Confirm the regression test passes and no unrelated focused test fails.

- [ ] **Step 4: Perform the real P0 acceptance test before proceeding.**

Using the freshly built app and a small real local media file, export a short MP3, verify a non-empty download, export again without reload, cancel one operation, and verify the UI settles. If the real export cannot be proven, stop and report the blocker; do not begin P1.

- [ ] **Step 5: Commit P0.**

Run `git add` only the P0 code/tests/build-serving files and commit `fix: restore local media export`.

### Task 3: P1 PDF page-operation model and tests

**Files:**
- Modify: `apps/html-prototype/src/systems/PdfToolkit.ts`
- Modify: `apps/html-prototype/src/systems/ToolboxView.ts`
- Modify: `apps/html-prototype/src/app.ts`
- Modify: `apps/html-prototype/src/styles.css`
- Test: `apps/html-prototype/tests/pdf-toolkit.test.ts`, focused toolbox/UI tests as needed

- [ ] **Step 1: Add failing tests for extract modes and organizer state.**

Cover valid ranges and output order, invalid ranges, every-page/every-N/group modes only if supported, organizer reorder/deletion/output order, final-page deletion prevention, and touch-safe explicit move state. Run focused tests and observe failure.

- [ ] **Step 2: Implement pure PDF mode parsing and organizer state.**

Keep extraction as one output PDF and add only real supported split modes. Model page ids/order independently from DOM and provide move-up/move-down/delete operations with a non-empty invariant.

- [ ] **Step 3: Implement distinct responsive PDF UI.**

Extract renders mode choice, examples, and output explanation. Reorder/Delete renders numbered compact previews with large explicit controls, final order, and one save action. Avoid manual order typing for organizer mode and prevent horizontal overflow.

- [ ] **Step 4: Verify P1 focused tests and real PDF outputs.**

Run PDF/toolbox tests and use fixture PDFs to verify extraction, implemented split modes, reorder, delete, and saved page order. Proceed only if P1 is green.

- [ ] **Step 5: Commit P1.**

Commit `feat: improve PDF page organization` with only P1 files.

### Task 4: P2 Spinwheel responsive flow and winner reveal

**Files:**
- Modify: `apps/html-prototype/src/systems/SpinWheel.ts`
- Modify: `apps/html-prototype/src/systems/ToolboxView.ts`
- Modify: `apps/html-prototype/src/app.ts`
- Modify: `apps/html-prototype/src/styles.css`
- Test: `apps/html-prototype/tests/toolbox-completion.test.ts`, `apps/html-prototype/tests/toolbox-utilities.test.ts`, and responsive/static UI tests as needed

- [ ] **Step 1: Add failing tests for winner state and mobile interaction model.**

Cover deterministic winner reveal state transitions, spin-again reset, choice editor add/remove without root remount, preset actions behind compact controls, and mobile-safe explicit interaction state. Run focused tests and observe failure.

- [ ] **Step 2: Implement the smallest state/view changes.**

Keep `spinChoiceIndex` and target rotation unchanged. Add transient reveal state and copy, stable choice editor state, and compact preset management. Patch affected DOM regions without remounting the toolbox root.

- [ ] **Step 3: Add responsive styling.**

Keep desktop sizing/layout intact; on narrow portrait widths constrain wheel to roughly 280–320 logical pixels, reduce persistent choice/preset height, keep primary Spin easy to reach, and style the restrained winner card/reveal.

- [ ] **Step 4: Verify P2 focused tests and responsive behavior.**

Run Spinwheel/toolbox tests and inspect desktop/mobile render states. Verify choice editing, preset actions, immediate spin, winner reveal, and Spin again before P3.

- [ ] **Step 5: Commit P2.**

Commit `feat: refine mobile spin wheel experience` with only P2 files.

### Task 5: P3 Living Window weather/moon model and tests

**Files:**
- Modify: `apps/html-prototype/src/systems/LivingWindow.ts`
- Modify: `apps/html-prototype/src/systems/MoonPhase.ts`
- Modify: `apps/html-prototype/src/app.ts`
- Modify: `apps/html-prototype/src/styles.css`
- Test: `apps/html-prototype/tests/living-window.test.ts`, `apps/html-prototype/tests/moon-phase.test.ts`, `apps/html-prototype/tests/living-window-lifecycle.test.ts`

- [ ] **Step 1: Add failing tests for deterministic summaries and moon copy/render state.**

Cover no-rain and likely-rain hourly summaries, forecast ordering, timezone-aware date/time formatting, all requested phase copy, illumination state, and mobile layout state. Run focused tests and observe failure.

- [ ] **Step 2: Extend the weather model only with provider data.**

Retain Open-Meteo; parse available hourly time/probability/condition/temperature arrays, expose ordered next-hours data, and derive a short deterministic rain summary. If data is absent, render an explicit unavailable state. Do not fabricate moonrise, moonset, or lunar event dates.

- [ ] **Step 3: Implement the readable Living Window presentation.**

Add local timezone date/time and labeled controls, current-weather hierarchy, next-hours strip, compact daily cards/details, and a larger moon card with phase copy and correct existing illumination calculation. Preserve the Muji/Muji Room visual language.

- [ ] **Step 4: Verify P3 focused tests and UI behavior.**

Run Living Window/moon/lifecycle tests and inspect current weather, rain summary, date/time, forecast ordering, moon card, and narrow layout. Proceed to full verification only if green.

- [ ] **Step 5: Commit P3.**

Commit `feat: enrich living window weather` with only P3 files.

### Task 6: Full verification, scope audit, and push

**Files:**
- Inspect all final changes; do not edit unrelated files.

- [ ] **Step 1: Run complete verification.**

Run `npm install`, `npm run typecheck`, `npm test`, and `npm run build`; record current test counts and build exit status for `apps/html-prototype` and `packages/shared`.

- [ ] **Step 2: Run final acceptance checks.**

Reconfirm real MP3 first/second export/cancel, PDF outputs/order, Spin mobile flow/reveal/preset actions, and Living Window weather/moon behavior from fresh build artifacts.

- [ ] **Step 3: Audit the final diff.**

Run `git diff --check`, `git status --short`, `git diff --stat`, and `git diff --name-only`; inspect the diff for excluded Chapter/diary/scene/gameplay/Reflection/Debug/Supabase/CI/content changes.

- [ ] **Step 4: Push main normally and verify remote parity.**

Run `git push origin main`, then `git fetch origin` and verify final `HEAD`, `origin/main`, and `0 0` parity. Report every commit SHA and final working-tree status.
