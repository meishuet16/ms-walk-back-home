# Muji Toolbox Scoped Improvements Design

## Goal

Deliver four strictly gated improvements in `apps/html-prototype` on the current `main`: restore real local media export, distinguish PDF extraction from page organization, refine Spinwheel mobile interaction and winner feedback, and present Living Window weather/moon data in a more human-readable hierarchy.

## Scope and gates

Work proceeds in this order and stops if the current gate cannot be verified:

1. P0 Media: reproduce and trace the FFmpeg load path, fix only the proven root cause, and prove a fresh-build export, cached second export, and cancellation.
2. P1 PDF: preserve the existing PDF engine, introduce supported split/extract modes, and turn reorder/delete into a visual page organizer with a non-empty output guard.
3. P2 Spinwheel: preserve randomness and desktop behavior; use responsive mobile summary/editor/preset controls and a restrained winner reveal.
4. P3 Living Window: consume only real Open-Meteo and local moon-calculation data; add deterministic rain summary, local time/date, hourly strip when available, and a readable moon card.

No authored Chapter/diary content, scene layouts/assets/registration, Muji Room gameplay, Reflection Wall, Scene Debug Editor, Supabase behavior, CI, or unrelated repository cleanup is in scope.

## Architecture

Existing module boundaries remain the integration contract. `MediaToolkit.ts` and `LocalJob.ts` own FFmpeg lifecycle and abortable stages; `PdfToolkit.ts` owns PDF operations; `SpinWheel.ts`, `ToolboxView.ts`, and `app.ts` own wheel state/render/event coordination; `LivingWindow.ts`, `MoonPhase.ts`, and the existing Living Window branch in `app.ts` own weather/moon view-model and presentation. New pure helpers are preferred for parsing, summaries, and organizer state so focused tests can exercise them without the full scene runtime.

P0 diagnostics will expose the resolved built core URLs and fetch metadata through testable seams or a diagnostic script without logging user media. The loader will keep bounded timeouts, abort propagation, reusable engine caching, and fatal-engine invalidation. PDF operations will reuse the current `pdf-lib` path and only add UI/state needed to make the operations meaningfully different.

## UX decisions

- Split / Extract explicitly communicates output: selected pages as one PDF, every page, every N pages, or pipe-separated groups only where the engine supports it.
- Reorder / Delete presents numbered page cards/previews with explicit move controls that remain usable on touch; deletion of the final page is blocked.
- Mobile Spinwheel leads with header, compact preset bar, contained wheel, choice summary/editor, and an easy-to-reach primary Spin action. Rename/delete remain in overflow or management UI. A winner card appears after the wheel settles with subtle scale/fade and restrained paper-gold accents.
- Living Window leads with location/local date-time, current conditions, rain-soon summary only when hourly probability exists, a horizontal next-hours strip, a larger moon card with deterministic phase copy, and compact later forecast/telemetry sections.

## Testing and verification

Each priority follows red-green-refactor for new pure behavior and focused tests before the next priority. Verification includes the repository's current HTML prototype and shared-package typecheck/test/build commands, fresh `dist` FFmpeg asset checks, real media export acceptance, PDF artifact/order checks, responsive interaction checks where available, `git diff --check`, and a final scope audit. Only code/tests/docs required for this task may be committed; no runtime personal data or generated media is committed.
