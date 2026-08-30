(() => {
  // Keep the model's select -> confirm contract intact, but make pointer/touch UX one step:
  // a real tap on a physical tool object selects it, then activates the existing Enter action.
  document.addEventListener("click", (event) => {
    if (!(event instanceof MouseEvent) || event.detail <= 0) return;
    const target = event.target instanceof Element
      ? event.target.closest(".world-toolbox-root .toolbox-slot[data-action='toolbox-select'][data-tool]")
      : null;
    if (!(target instanceof HTMLButtonElement)) return;

    queueMicrotask(() => {
      const root = document.querySelector(".toolbox-panel.world-toolbox-root");
      if (!(root instanceof HTMLElement)) return;
      const selected = root.querySelector(`.toolbox-slot.selected[data-tool='${CSS.escape(target.dataset.tool || "")}']`);
      if (!selected) return;
      const enter = root.querySelector("[data-action='toolbox-confirm']");
      if (enter instanceof HTMLButtonElement) enter.click();
    });
  });
})();
