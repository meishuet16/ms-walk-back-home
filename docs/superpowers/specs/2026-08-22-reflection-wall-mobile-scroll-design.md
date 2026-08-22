# Reflection Wall Mobile Portrait Scroll Design

## Scope

Fix only the Reflection Wall `wall` view on mobile portrait screens. Keep the existing freeform, absolute-positioned memo layout and drag interaction. The existing `stack` and `list` views are out of scope.

## Current problem

The wall surface has a bounded mobile height and its memos use `position: absolute`. Absolutely positioned children do not contribute to the surface's intrinsic height, so a memo placed lower on the wall cannot create additional vertical scroll space. As the number of memos grows, notes are forced into the same usable area or become unreachable below the viewport.

## Chosen approach

Keep the wall as a freeform canvas and make the portrait canvas height content-aware. When rendering the wall, calculate a minimum canvas height from the rendered memo dimensions and each memo's persisted/clamped `y` coordinate. Add enough bottom padding for the lowest memo and a small breathing room. The wall surface remains the scroll container, with vertical scrolling available on portrait screens.

The calculation must use the same mobile memo dimensions that are used by `clampReflectionNotePosition`, so notes remain inside the scrollable canvas. Existing persisted coordinates remain unchanged; rendering may clamp the visual position as it already does, but it must not rewrite notes merely because the canvas grew.

## Interaction and layout

- Portrait wall surface: vertical scrolling is available when the content height exceeds the viewport.
- Horizontal freeform behavior remains available where the existing wall canvas requires it.
- Memo drag continues to calculate coordinates against `.reflection-wall-surface` and saves the same normalized wall-local coordinates.
- Toolbar stays outside the scrolling wall surface.
- Desktop wall sizing and all stack/list behavior remain unchanged.

## Testing

Add a focused UI-policy regression assertion covering the portrait wall's content-aware height hook/style. Keep the existing reflection wall model tests unchanged unless a pure helper is extracted for the height calculation. Run the html-prototype test suite and typecheck/build after the change.

## Non-goals

- Do not convert wall memos to a single-column flow.
- Do not change memo persistence, ordering, filtering, paper styles, or drag semantics.
- Do not modify the already-implemented stack/list portrait scroll surfaces.

