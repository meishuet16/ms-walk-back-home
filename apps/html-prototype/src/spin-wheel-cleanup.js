(() => {
  const rawText = (node, ignoredClass) => {
    if (!(node instanceof HTMLElement)) return "";
    return [...node.childNodes]
      .filter((child) => !(child instanceof HTMLElement && child.classList.contains(ignoredClass)))
      .map((child) => child.textContent ?? "")
      .join("")
      .trim();
  };

  const winnerText = (tool) => rawText(tool?.querySelector(".spin-winner-card strong"), "spin-winner-emoji");

  const findWinnerRemove = (tool, winner) => {
    if (!(tool instanceof HTMLElement) || !winner) return null;
    for (const row of tool.querySelectorAll(".spin-choice-list li:not(.empty)")) {
      const label = rawText(row.querySelector("span"), "spin-choice-emoji");
      if (label === winner) return row.querySelector("[data-action='toolbox-spin-remove']");
    }
    return null;
  };

  const normalizeResult = (tool) => {
    const card = tool.querySelector(".spin-winner-card");
    if (!(card instanceof HTMLElement)) return;

    // Remove every enhancement left by older preview scripts before rebuilding a single stable layout.
    card.querySelectorAll(".spin-result-back, .spin-use-remove, [data-spin-flow], [data-spin-cleanup]").forEach((node) => node.remove());

    const nativeKeep = card.querySelector("[data-action='toolbox-spin-keep']");
    const nativeSpin = card.querySelector("[data-action='toolbox-spin']");
    const actions = nativeKeep?.parentElement;
    if (!(nativeKeep instanceof HTMLButtonElement) || !(nativeSpin instanceof HTMLButtonElement) || !(actions instanceof HTMLElement)) return;

    actions.classList.add("spin-result-actions-clean");
    nativeSpin.textContent = "Spin again";
    nativeSpin.classList.add("spin-result-secondary");
    nativeKeep.textContent = "Use result";
    nativeKeep.classList.add("spin-result-primary");
    nativeKeep.setAttribute("aria-label", "Use result and keep all choices in the wheel");

    const back = document.createElement("button");
    back.type = "button";
    back.className = "spin-result-back-clean";
    back.dataset.spinCleanup = "back";
    back.textContent = "← Back to wheel";
    back.setAttribute("aria-label", "Return to wheel without changing choices");
    card.prepend(back);

    const remove = document.createElement("button");
    remove.type = "button";
    remove.className = "spin-result-remove-clean";
    remove.dataset.spinCleanup = "remove";
    remove.textContent = "Use & remove";
    remove.setAttribute("aria-label", "Use result and remove this choice from the next round");
    actions.after(remove);

    let hint = card.querySelector(".spin-result-choice-hint");
    if (!(hint instanceof HTMLElement)) {
      hint = document.createElement("small");
      hint.className = "spin-result-choice-hint";
      hint.textContent = "Keep it for future spins, or remove it for allocation rounds.";
      card.append(hint);
    }
  };

  const normalizeEditor = (tool) => {
    const sheet = tool.querySelector(".spin-choice-sheet");
    if (!(sheet instanceof HTMLElement)) return;
    const manage = sheet.querySelector(".spin-manage-presets");
    const menu = sheet.querySelector(".spin-preset-menu");
    if (manage instanceof HTMLButtonElement) {
      manage.textContent = menu ? "Done" : "Manage";
      manage.setAttribute("aria-expanded", String(Boolean(menu)));
    }
  };

  const decorate = () => {
    const tool = document.querySelector(".spin-wheel-tool");
    if (!(tool instanceof HTMLElement)) return;
    normalizeResult(tool);
    normalizeEditor(tool);
  };

  document.addEventListener("click", (event) => {
    const button = event.target instanceof Element ? event.target.closest("button") : null;
    if (!(button instanceof HTMLButtonElement)) return;
    const tool = button.closest(".spin-wheel-tool");
    if (!(tool instanceof HTMLElement)) return;

    if (button.dataset.spinCleanup === "back") {
      event.preventDefault();
      event.stopImmediatePropagation();
      const nativeKeep = tool.querySelector(".spin-winner-card [data-action='toolbox-spin-keep']");
      if (nativeKeep instanceof HTMLButtonElement) nativeKeep.click();
      return;
    }

    if (button.dataset.spinCleanup === "remove") {
      event.preventDefault();
      event.stopImmediatePropagation();
      const winner = winnerText(tool);
      const nativeKeep = tool.querySelector(".spin-winner-card [data-action='toolbox-spin-keep']");
      if (!(nativeKeep instanceof HTMLButtonElement)) return;
      nativeKeep.click();
      window.setTimeout(() => {
        const nextTool = document.querySelector(".spin-wheel-tool");
        const remove = findWinnerRemove(nextTool, winner);
        if (remove instanceof HTMLButtonElement) remove.click();
      }, 40);
      return;
    }

    if (button.matches(".spin-editor-close")) {
      // If preset management is expanded, collapse it first so reparented native controls
      // cannot survive inside a detached sheet and block the next editor open.
      const menu = tool.querySelector(".spin-choice-sheet .spin-preset-menu");
      const manage = tool.querySelector(".spin-choice-sheet .spin-manage-presets");
      if (menu && manage instanceof HTMLButtonElement) {
        event.preventDefault();
        event.stopImmediatePropagation();
        manage.click();
        window.setTimeout(() => {
          const close = document.querySelector(".spin-wheel-tool .spin-editor-close");
          if (close instanceof HTMLButtonElement) close.click();
        }, 30);
      }
    }
  }, true);

  let frame = 0;
  const schedule = () => {
    if (frame) return;
    frame = requestAnimationFrame(() => {
      frame = 0;
      decorate();
    });
  };
  new MutationObserver(schedule).observe(document.documentElement, { childList: true, subtree: true });
  window.addEventListener("DOMContentLoaded", schedule, { once: true });
})();
