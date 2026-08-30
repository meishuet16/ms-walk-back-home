(() => {
  // Preserve the original select -> confirm interaction contract so the selected
  // tool's description remains readable before opening it. Mobile gets swipe
  // paging as an additional affordance; the existing arrows/dots stay usable.
  let swipe = null;
  let suppressClickUntil = 0;
  let transitionIntent = null;
  let transitionGhost = null;

  const reducedMotion = () => window.matchMedia?.("(prefers-reduced-motion: reduce)").matches === true;

  function rootFromEventTarget(target) {
    return target instanceof Element ? target.closest(".toolbox-panel.world-toolbox-root") : null;
  }

  function makeToolGhost(tool, rect) {
    if (!tool || reducedMotion()) return null;
    transitionGhost?.remove();
    const ghost = document.createElement("div");
    ghost.className = "world-tool-transition-ghost";
    ghost.setAttribute("aria-hidden", "true");
    const object = document.createElement("span");
    object.className = `world-tool-object world-tool-object-${tool}`;
    ghost.append(object);
    Object.assign(ghost.style, {
      left: `${rect.left}px`,
      top: `${rect.top}px`,
      width: `${rect.width}px`,
      height: `${rect.height}px`
    });
    document.body.append(ghost);
    transitionGhost = ghost;
    return ghost;
  }

  function animateGhostTo(ghost, from, to, mode) {
    if (!(ghost instanceof HTMLElement) || reducedMotion()) {
      ghost?.remove();
      if (transitionGhost === ghost) transitionGhost = null;
      return;
    }
    const dx = to.left - from.left;
    const dy = to.top - from.top;
    const sx = Math.max(.35, to.width / Math.max(1, from.width));
    const sy = Math.max(.35, to.height / Math.max(1, from.height));
    const opening = mode === "open";
    const animation = ghost.animate([
      { transform: "translate3d(0,0,0) scale(1)", opacity: opening ? 1 : .88, filter: "brightness(1) drop-shadow(0 8px 10px rgba(0,0,0,.35))" },
      { offset: .42, transform: `translate3d(${dx * .42}px,${dy * .42 - (opening ? 10 : -8)}px,0) scale(${opening ? 1.09 : .92})`, opacity: 1, filter: "brightness(1.18) drop-shadow(0 14px 16px rgba(0,0,0,.42))" },
      { transform: `translate3d(${dx}px,${dy}px,0) scale(${sx},${sy})`, opacity: opening ? 0 : .28, filter: "brightness(1.08) drop-shadow(0 4px 8px rgba(0,0,0,.25))" }
    ], {
      duration: opening ? 360 : 320,
      easing: opening ? "cubic-bezier(.2,.82,.22,1)" : "cubic-bezier(.3,.7,.25,1)",
      fill: "forwards"
    });
    animation.finished.finally(() => {
      ghost.remove();
      if (transitionGhost === ghost) transitionGhost = null;
    });
  }

  function finishPendingTransition() {
    if (!transitionIntent) return;
    const intent = transitionIntent;

    if (intent.mode === "open") {
      const panel = document.querySelector(".toolbox-panel.world-toolbox-tool");
      if (!(panel instanceof HTMLElement) || panel.dataset.worldTool !== intent.tool) return;
      transitionIntent = null;
      panel.classList.add("world-tool-transition-enter");
      const target = panel.querySelector(".toolbox-tool-body, .world-tool-workbench-label") || panel;
      const targetRect = target.getBoundingClientRect();
      const destination = {
        left: targetRect.left + targetRect.width * .5 - Math.min(96, targetRect.width * .22) * .5,
        top: targetRect.top + Math.min(54, targetRect.height * .1),
        width: Math.min(96, Math.max(62, targetRect.width * .22)),
        height: Math.min(92, Math.max(60, targetRect.width * .2))
      };
      if (transitionGhost) animateGhostTo(transitionGhost, intent.from, destination, "open");
      window.setTimeout(() => panel.classList.remove("world-tool-transition-enter"), 430);
      return;
    }

    if (intent.mode === "close") {
      const root = document.querySelector(".toolbox-panel.world-toolbox-root");
      if (!(root instanceof HTMLElement)) return;
      const slot = root.querySelector(`.toolbox-slot[data-tool='${CSS.escape(intent.tool)}'] .toolbox-slot-icon`);
      if (!(slot instanceof HTMLElement)) return;
      transitionIntent = null;
      root.classList.add("world-tool-transition-return");
      const to = slot.getBoundingClientRect();
      if (transitionGhost) animateGhostTo(transitionGhost, intent.from, to, "close");
      window.setTimeout(() => root.classList.remove("world-tool-transition-return"), 400);
    }
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

  // Capture transition geometry before the app replaces the Toolbox DOM. The
  // original buttons still execute the actual state change; this is visual only.
  document.addEventListener("click", (event) => {
    if (!(event.target instanceof Element)) return;
    const confirm = event.target.closest(".world-toolbox-root [data-action='toolbox-confirm']");
    if (confirm) {
      const root = confirm.closest(".toolbox-panel.world-toolbox-root");
      const selected = root?.querySelector(".toolbox-slot.selected[data-tool]");
      const icon = selected?.querySelector(".toolbox-slot-icon");
      if (selected instanceof HTMLElement && icon instanceof HTMLElement) {
        const tool = selected.dataset.tool || "";
        const from = icon.getBoundingClientRect();
        transitionIntent = { mode: "open", tool, from };
        makeToolGhost(tool, from);
        root.classList.add("world-tool-transition-depart");
      }
      return;
    }

    const back = event.target.closest(".world-toolbox-tool [data-action='toolbox-back'], .world-toolbox-tool .spin-world-back");
    if (back) {
      const panel = back.closest(".toolbox-panel.world-toolbox-tool");
      if (panel instanceof HTMLElement) {
        const tool = panel.dataset.worldTool || "";
        const body = panel.querySelector(".toolbox-tool-body") || panel;
        const bodyRect = body.getBoundingClientRect();
        const size = Math.min(96, Math.max(70, bodyRect.width * .2));
        const from = {
          left: bodyRect.left + bodyRect.width / 2 - size / 2,
          top: bodyRect.top + Math.min(68, bodyRect.height * .12),
          width: size,
          height: size
        };
        transitionIntent = { mode: "close", tool, from };
        makeToolGhost(tool, from);
        panel.classList.add("world-tool-transition-depart");
      }
    }
  }, true);

  // A swipe that starts on a card can otherwise synthesize a delayed click and
  // unexpectedly change selection after the page has moved.
  document.addEventListener("click", (event) => {
    if (performance.now() > suppressClickUntil) return;
    const slot = event.target instanceof Element ? event.target.closest(".world-toolbox-root .toolbox-slot") : null;
    if (!slot) return;
    event.preventDefault();
    event.stopImmediatePropagation();
  }, true);

  const observer = new MutationObserver(() => queueMicrotask(finishPendingTransition));
  const start = () => {
    observer.observe(document.body, { childList: true, subtree: true });
    finishPendingTransition();
  };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start, { once: true });
  else start();
})();
