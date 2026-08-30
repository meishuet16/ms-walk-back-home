(() => {
  // Preserve the original select -> confirm interaction contract so the selected
  // tool's description remains readable before opening it. Mobile gets swipe
  // paging as an additional affordance; the existing arrows/dots stay usable.
  let swipe = null;
  let suppressClickUntil = 0;

  function rootFromEventTarget(target) {
    return target instanceof Element ? target.closest(".toolbox-panel.world-toolbox-root") : null;
  }

  document.addEventListener("touchstart", (event) => {
    const root = rootFromEventTarget(event.target);
    const grid = event.target instanceof Element ? event.target.closest(".world-toolbox-root .toolbox-grid") : null;
    if (!(root instanceof HTMLElement) || !(grid instanceof HTMLElement) || event.touches.length !== 1) return;
    const touch = event.touches[0];
    swipe = { root, x: touch.clientX, y: touch.clientY };
  }, { passive: true });

  document.addEventListener("touchend", (event) => {
    if (!swipe || event.changedTouches.length !== 1) return;
    const touch = event.changedTouches[0];
    const dx = touch.clientX - swipe.x;
    const dy = touch.clientY - swipe.y;
    const root = swipe.root;
    swipe = null;

    if (Math.abs(dx) < 54 || Math.abs(dx) <= Math.abs(dy) * 1.15) return;
    const action = dx < 0 ? "toolbox-page-next" : "toolbox-page-prev";
    const button = root.querySelector(`[data-action='${action}']`);
    if (button instanceof HTMLButtonElement && !button.disabled) {
      suppressClickUntil = performance.now() + 450;
      button.click();
    }
  }, { passive: true });

  // A swipe that starts on a card can otherwise synthesize a delayed click and
  // unexpectedly change selection after the page has moved.
  document.addEventListener("click", (event) => {
    if (performance.now() > suppressClickUntil) return;
    const slot = event.target instanceof Element ? event.target.closest(".world-toolbox-root .toolbox-slot") : null;
    if (!slot) return;
    event.preventDefault();
    event.stopImmediatePropagation();
  }, true);
})();
