(() => {
  const optionSignature = (select) => [...select.options]
    .map((option) => `${option.value}:${option.textContent ?? ""}:${option.selected}`)
    .join("|");

  const syncMainPresetDisplay = (tool) => {
    const bar = tool.querySelector(".spin-preset-bar");
    const label = bar?.querySelector("label");
    const select = label?.querySelector("[data-toolbox-field='spin-preset']");
    if (!(bar instanceof HTMLElement) || !(label instanceof HTMLElement) || !(select instanceof HTMLSelectElement)) return;

    label.classList.add("spin-preset-native-label");
    select.classList.add("spin-preset-native-source");
    const nativeAction = bar.querySelector(":scope > [data-action]");
    if (nativeAction instanceof HTMLElement) nativeAction.classList.add("spin-main-redundant-edit");

    let display = bar.querySelector(".spin-main-preset-display");
    if (!(display instanceof HTMLElement)) {
      display = document.createElement("div");
      display.className = "spin-main-preset-display";
      display.setAttribute("aria-label", "Current preset");
      display.innerHTML = `<span class="spin-main-preset-kicker">PRESET</span><span class="spin-main-preset-value"></span><span class="spin-main-preset-chevron" aria-hidden="true">•</span>`;
      label.after(display);
    }
    const selected = select.selectedOptions[0]?.textContent?.trim() || "Preset";
    const value = display.querySelector(".spin-main-preset-value");
    if (value && value.textContent !== selected) value.textContent = selected;

    const summary = tool.querySelector(".spin-choice-summary b");
    if (summary) summary.textContent = "Edit wheel →";
  };

  const closeSwitcher = (root) => {
    root?.classList.remove("open");
    const trigger = root?.querySelector(".spin-preset-switch-trigger");
    if (trigger instanceof HTMLButtonElement) trigger.setAttribute("aria-expanded", "false");
  };

  const syncEditorSwitcher = (tool) => {
    const row = tool.querySelector(".spin-editor-preset-row");
    const select = row?.querySelector("[data-spin-editor-preset]");
    if (!(row instanceof HTMLElement) || !(select instanceof HTMLSelectElement)) return;

    select.classList.add("spin-editor-preset-native");
    select.closest("label")?.classList.add("spin-editor-preset-native-label");

    let root = row.querySelector(".spin-preset-switcher");
    if (!(root instanceof HTMLElement)) {
      root = document.createElement("div");
      root.className = "spin-preset-switcher";
      root.innerHTML = `<button type="button" class="spin-preset-switch-trigger" aria-haspopup="listbox" aria-expanded="false"><span><small>CURRENT PRESET</small><strong></strong></span><b aria-hidden="true">⌄</b></button><div class="spin-preset-switch-menu" role="listbox" aria-label="Choose preset"></div>`;
      row.prepend(root);
      const trigger = root.querySelector(".spin-preset-switch-trigger");
      trigger?.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        const open = !root.classList.contains("open");
        root.classList.toggle("open", open);
        if (trigger instanceof HTMLButtonElement) trigger.setAttribute("aria-expanded", String(open));
      });
    }

    const signature = optionSignature(select);
    if (root.dataset.signature !== signature) {
      root.dataset.signature = signature;
      const menu = root.querySelector(".spin-preset-switch-menu");
      if (menu instanceof HTMLElement) {
        menu.replaceChildren();
        [...select.options].forEach((option) => {
          const button = document.createElement("button");
          button.type = "button";
          button.className = "spin-preset-switch-option";
          button.dataset.value = option.value;
          button.setAttribute("role", "option");
          button.setAttribute("aria-selected", String(option.selected));
          button.innerHTML = `<span>${option.textContent ?? "Preset"}</span><b aria-hidden="true">${option.selected ? "✓" : ""}</b>`;
          button.addEventListener("click", (event) => {
            event.preventDefault();
            event.stopPropagation();
            const live = document.querySelector(".spin-wheel-tool [data-spin-editor-preset]");
            if (!(live instanceof HTMLSelectElement)) return;
            live.value = button.dataset.value ?? "";
            live.dispatchEvent(new Event("change", { bubbles: true }));
            closeSwitcher(root);
          });
          menu.append(button);
        });
      }
    }
    const current = select.selectedOptions[0]?.textContent?.trim() || "Preset";
    const strong = root.querySelector(".spin-preset-switch-trigger strong");
    if (strong && strong.textContent !== current) strong.textContent = current;
  };

  const decorate = () => {
    const tool = document.querySelector(".spin-wheel-tool");
    if (!(tool instanceof HTMLElement)) return;
    syncMainPresetDisplay(tool);
    syncEditorSwitcher(tool);
  };

  document.addEventListener("click", (event) => {
    const target = event.target instanceof Element ? event.target : null;
    document.querySelectorAll(".spin-preset-switcher.open").forEach((root) => {
      if (root instanceof HTMLElement && !root.contains(target)) closeSwitcher(root);
    });
  });
  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;
    document.querySelectorAll(".spin-preset-switcher.open").forEach((root) => {
      if (root instanceof HTMLElement) closeSwitcher(root);
    });
  });

  let frame = 0;
  const schedule = () => {
    if (frame) return;
    frame = requestAnimationFrame(() => {
      frame = 0;
      decorate();
    });
  };
  new MutationObserver(schedule).observe(document.documentElement, { childList: true, subtree: true });
  document.addEventListener("change", schedule);
  window.addEventListener("DOMContentLoaded", schedule, { once: true });
})();
