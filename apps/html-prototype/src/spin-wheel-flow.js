(() => {
  let suppressNextRemoval = false;

  const rawText = (node) => {
    if (!(node instanceof HTMLElement)) return "";
    return [...node.childNodes]
      .filter((child) => !(child instanceof HTMLElement && child.classList.contains("spin-winner-emoji")))
      .map((child) => child.textContent ?? "")
      .join("")
      .trim();
  };

  const winnerText = (tool) => rawText(tool?.querySelector(".spin-winner-card strong"));

  const findWinnerRemoveButton = (tool, winner) => {
    if (!tool || !winner) return null;
    for (const row of tool.querySelectorAll(".spin-choice-list li:not(.empty)")) {
      const label = row.querySelector("span");
      const text = label instanceof HTMLElement
        ? [...label.childNodes]
            .filter((child) => !(child instanceof HTMLElement && child.classList.contains("spin-choice-emoji")))
            .map((child) => child.textContent ?? "")
            .join("")
            .trim()
        : "";
      if (text === winner) return row.querySelector("[data-action='toolbox-spin-remove']");
    }
    return null;
  };

  const decorateResult = () => {
    const tool = document.querySelector(".spin-wheel-tool");
    const card = tool?.querySelector(".spin-winner-card");
    if (!(tool instanceof HTMLElement) || !(card instanceof HTMLElement)) return;

    const actions = card.querySelector(".spin-winner-actions");
    const nativeKeep = card.querySelector("[data-action='toolbox-spin-keep']");
    const spinAgain = card.querySelector("[data-action='toolbox-spin-again']");
    if (!(actions instanceof HTMLElement) || !(nativeKeep instanceof HTMLButtonElement)) return;

    nativeKeep.textContent = "Use result";
    nativeKeep.title = "Accept this result and keep every choice on the wheel";
    nativeKeep.setAttribute("aria-label", "Use result and keep this choice in the wheel");
    nativeKeep.classList.add("spin-use-result");

    let remove = actions.querySelector("[data-spin-flow='use-remove']");
    if (!(remove instanceof HTMLButtonElement)) {
      remove = document.createElement("button");
      remove.type = "button";
      remove.dataset.spinFlow = "use-remove";
      remove.className = "spin-use-remove";
      remove.textContent = "Use & remove";
      remove.setAttribute("aria-label", "Use result and remove this choice from the next round");
      actions.append(remove);
    }

    let back = card.querySelector("[data-spin-flow='back']");
    if (!(back instanceof HTMLButtonElement)) {
      back = document.createElement("button");
      back.type = "button";
      back.dataset.spinFlow = "back";
      back.className = "spin-result-back";
      back.textContent = "← Back to wheel";
      back.setAttribute("aria-label", "Close result and return to wheel without changing choices");
      card.prepend(back);
    }

    const oldHint = card.querySelector(".spin-keep-hint");
    if (oldHint) oldHint.textContent = "Use result keeps the wheel unchanged · Use & remove excludes it next round";
    if (spinAgain instanceof HTMLButtonElement) spinAgain.title = "Ignore this result and spin again";
  };

  document.addEventListener("click", (event) => {
    const target = event.target instanceof Element ? event.target.closest("button") : null;
    if (!(target instanceof HTMLButtonElement)) return;

    if (suppressNextRemoval && target.matches("[data-action='toolbox-spin-remove']")) {
      suppressNextRemoval = false;
      event.preventDefault();
      event.stopImmediatePropagation();
      return;
    }

    const tool = target.closest(".spin-wheel-tool");
    if (!(tool instanceof HTMLElement)) return;

    if (target.matches("[data-action='toolbox-spin-keep']")) {
      // Native Keep already closes the result. Prevent the legacy enhancement from
      // turning that acknowledgement into a destructive remove.
      suppressNextRemoval = true;
      window.setTimeout(() => { suppressNextRemoval = false; }, 120);
      return;
    }

    if (target.dataset.spinFlow === "back") {
      event.preventDefault();
      event.stopImmediatePropagation();
      suppressNextRemoval = true;
      tool.querySelector("[data-action='toolbox-spin-keep']")?.click();
      window.setTimeout(() => { suppressNextRemoval = false; }, 120);
      return;
    }

    if (target.dataset.spinFlow === "use-remove") {
      event.preventDefault();
      event.stopImmediatePropagation();
      const winner = winnerText(tool);
      const remove = findWinnerRemoveButton(tool, winner);
      // Close the result through the native acknowledgement path, then remove the
      // captured winner explicitly. This makes allocation rounds deterministic.
      suppressNextRemoval = true;
      tool.querySelector("[data-action='toolbox-spin-keep']")?.click();
      window.setTimeout(() => {
        suppressNextRemoval = false;
        if (remove instanceof HTMLButtonElement && remove.isConnected) remove.click();
        else {
          const nextTool = document.querySelector(".spin-wheel-tool");
          const retry = findWinnerRemoveButton(nextTool, winner);
          if (retry instanceof HTMLButtonElement) retry.click();
        }
      }, 40);
    }
  }, true);

  let frame = 0;
  const schedule = () => {
    if (frame) return;
    frame = requestAnimationFrame(() => {
      frame = 0;
      decorateResult();
    });
  };
  new MutationObserver(schedule).observe(document.documentElement, { childList: true, subtree: true });
  window.addEventListener("DOMContentLoaded", schedule, { once: true });
})();
