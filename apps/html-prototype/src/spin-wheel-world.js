(() => {
  const fallbackIcons = ["🐱", "⭐", "🌿", "☁️", "🍀", "🌙", "📖", "🧸", "🌼", "🫧", "🎐", "🪵"];
  const emojiFor = (value) => {
    const text = String(value ?? "").trim().toLowerCase();
    if (!text) return "✦";
    const rules = [
      [/寿司|sushi/, "🍣"], [/拉面|ramen|noodle|面/, "🍜"], [/汉堡|burger/, "🍔"],
      [/沙拉|salad/, "🥗"], [/饭团|onigiri/, "🍙"], [/饭|rice|nasi/, "🍚"],
      [/鸡|chicken/, "🍗"], [/pizza|披萨/, "🍕"], [/甜|cake|dessert|蛋糕/, "🍰"],
      [/咖啡|coffee/, "☕"], [/茶|tea/, "🍵"], [/冰|ice cream/, "🍨"], [/火锅|hotpot/, "🍲"],
      [/电影|movie|cinema/, "🎬"], [/学习|study|读书|revision/, "📚"], [/游戏|game/, "🎮"],
      [/散步|walk/, "🌿"], [/骑|bike|cycling/, "🚲"], [/睡|sleep|nap/, "🌙"],
      [/约会|date/, "🌷"], [/随便|random|anything|whatever/, "🐾"],
      [/yes|可以|要/, "⭐"], [/no|不要|不行/, "☁️"]
    ];
    for (const [pattern, emoji] of rules) if (pattern.test(text)) return emoji;
    let hash = 0;
    for (const char of text) hash = (hash * 33 + (char.codePointAt(0) ?? 0)) >>> 0;
    return fallbackIcons[hash % fallbackIcons.length];
  };

  const rawLabelText = (node) => {
    if (!(node instanceof HTMLElement)) return "";
    return [...node.childNodes]
      .filter((child) => !(child instanceof HTMLElement && child.classList.contains("spin-choice-emoji")))
      .map((child) => child.textContent ?? "")
      .join("")
      .trim();
  };

  const winnerRawText = () => {
    const node = document.querySelector(".spin-wheel-tool .spin-winner-card strong");
    if (!(node instanceof HTMLElement)) return "";
    return [...node.childNodes]
      .filter((child) => !(child instanceof HTMLElement && child.classList.contains("spin-winner-emoji")))
      .map((child) => child.textContent ?? "")
      .join("")
      .trim();
  };

  const currentChoices = () => [...document.querySelectorAll(".spin-wheel-tool .spin-choice-list li:not(.empty) > span")]
    .map((node) => rawLabelText(node))
    .filter(Boolean);

  const basePalette = ["#9b7936", "#315d56", "#7b3f31", "#52664c", "#3f5563", "#8b643d", "#48665f", "#6d4b3c"];
  const highlightPalette = ["#c49a46", "#42786e", "#9b503d", "#6e825f", "#536f7e", "#aa7a49", "#5d8077", "#875f4b"];
  const originalFillText = CanvasRenderingContext2D.prototype.fillText;
  const originalClearRect = CanvasRenderingContext2D.prototype.clearRect;
  const originalFill = CanvasRenderingContext2D.prototype.fill;
  const segmentState = new WeakMap();
  const isWheelContext = (ctx) => ctx.canvas instanceof HTMLCanvasElement && ctx.canvas.classList.contains("spin-wheel-canvas");

  CanvasRenderingContext2D.prototype.clearRect = function(...args) {
    if (isWheelContext(this)) segmentState.set(this, { index: 0 });
    return originalClearRect.apply(this, args);
  };

  CanvasRenderingContext2D.prototype.fill = function(...args) {
    if (!isWheelContext(this)) return originalFill.apply(this, args);
    const style = typeof this.fillStyle === "string" ? this.fillStyle.toLowerCase() : "";
    const nativePalette = ["#d7ad70", "#8f7154", "#b7c7b0", "#a98968", "#d5c69a", "#6f887e"];
    if (!nativePalette.includes(style)) return originalFill.apply(this, args);
    const state = segmentState.get(this) ?? { index: 0 };
    const index = state.index++;
    segmentState.set(this, state);
    const choices = currentChoices();
    const winner = winnerRawText();
    const selected = Boolean(winner && choices[index] === winner);
    const previous = this.fillStyle;
    const previousShadowColor = this.shadowColor;
    const previousShadowBlur = this.shadowBlur;
    this.fillStyle = (selected ? highlightPalette : basePalette)[index % basePalette.length];
    if (selected) {
      this.shadowColor = "rgba(210,160,74,.78)";
      this.shadowBlur = 14;
    }
    const result = originalFill.apply(this, args);
    this.fillStyle = previous;
    this.shadowColor = previousShadowColor;
    this.shadowBlur = previousShadowBlur;
    return result;
  };

  CanvasRenderingContext2D.prototype.fillText = function(text, x, y, maxWidth) {
    if (!isWheelContext(this) || typeof text !== "string") {
      return maxWidth === undefined
        ? originalFillText.call(this, text, x, y)
        : originalFillText.call(this, text, x, y, maxWidth);
    }
    const label = text.trim();
    if (!label) return;
    const matrix = this.getTransform();
    const px = matrix.a * x + matrix.c * y + matrix.e;
    const py = matrix.b * x + matrix.d * y + matrix.f;
    const selected = winnerRawText() === label;
    this.save();
    this.resetTransform();
    this.textAlign = "center";
    this.textBaseline = "middle";
    this.shadowColor = "rgba(0,0,0,.5)";
    this.shadowBlur = selected ? 5 : 2;
    this.fillStyle = selected ? "#fff0bd" : "#ead8ae";
    this.font = "700 15px Georgia, 'Times New Roman', serif";
    const display = label.length > 9 ? `${label.slice(0, 8)}…` : label;
    originalFillText.call(this, display, px, py - 10, 112);
    this.shadowBlur = 0;
    this.font = "23px 'Apple Color Emoji', 'Segoe UI Emoji', 'Noto Color Emoji', sans-serif";
    originalFillText.call(this, emojiFor(label), px, py + 17);
    this.restore();
  };

  const decorateChoiceIcons = (tool) => {
    tool.querySelectorAll(".spin-choice-list li:not(.empty)").forEach((item) => {
      const label = item.querySelector("span");
      if (!(label instanceof HTMLElement)) return;
      const raw = rawLabelText(label);
      if (!raw) return;
      let icon = label.querySelector(".spin-choice-emoji");
      if (!icon) {
        icon = document.createElement("span");
        icon.className = "spin-choice-emoji";
        icon.setAttribute("aria-hidden", "true");
        label.prepend(icon);
      }
      const nextIcon = emojiFor(raw);
      if (icon.textContent !== nextIcon) icon.textContent = nextIcon;
    });
    const summary = tool.querySelector(".spin-choice-summary small");
    if (summary) {
      const labels = currentChoices().slice(0, 3);
      const text = labels.length ? labels.map((value) => `${emojiFor(value)} ${value}`).join(" · ") : "Add a choice to begin.";
      if (summary.textContent !== text) summary.textContent = text;
    }
  };

  const buildPresetHub = (tool, sheet) => {
    let hub = sheet.querySelector(".spin-editor-preset-hub");
    const sourceSelect = tool.querySelector(".spin-preset-bar [data-toolbox-field='spin-preset']");
    if (!hub) {
      hub = document.createElement("section");
      hub.className = "spin-editor-preset-hub";
      hub.innerHTML = `<div class="spin-editor-section-title"><span>PRESET</span><small>Switch or manage a saved wheel</small></div><div class="spin-editor-preset-row"><label><span class="sr-only">Preset</span><select data-spin-editor-preset></select></label><button type="button" data-action="toolbox-preset-menu" class="spin-manage-presets">Manage</button></div><div class="spin-preset-inline-slot"></div>`;
      const editor = sheet.querySelector(".spin-choice-editor");
      if (editor) sheet.insertBefore(hub, editor);
      else sheet.append(hub);
    }
    const clone = hub.querySelector("[data-spin-editor-preset]");
    if (clone instanceof HTMLSelectElement && sourceSelect instanceof HTMLSelectElement) {
      const signature = [...sourceSelect.options].map((option) => `${option.value}:${option.text}:${option.selected}`).join("|");
      if (clone.dataset.signature !== signature) {
        clone.innerHTML = sourceSelect.innerHTML;
        clone.value = sourceSelect.value;
        clone.dataset.signature = signature;
      }
      if (!clone.dataset.bound) {
        clone.dataset.bound = "true";
        clone.addEventListener("change", () => {
          const liveSelect = document.querySelector(".spin-wheel-tool .spin-preset-bar [data-toolbox-field='spin-preset']");
          if (!(liveSelect instanceof HTMLSelectElement)) return;
          liveSelect.value = clone.value;
          liveSelect.dispatchEvent(new Event("change", { bubbles: true }));
        });
      }
    }
    return hub;
  };

  const decorateEditor = (tool) => {
    const editor = tool.querySelector(".spin-choice-editor.open");
    if (!editor) {
      tool.querySelector(".spin-choice-sheet")?.remove();
      tool.classList.remove("choice-sheet-open");
      return;
    }
    let sheet = tool.querySelector(".spin-choice-sheet");
    if (!sheet) {
      sheet = document.createElement("section");
      sheet.className = "spin-choice-sheet";
      sheet.setAttribute("role", "dialog");
      sheet.setAttribute("aria-modal", "true");
      sheet.setAttribute("aria-label", "Edit Spin Wheel");
      sheet.innerHTML = `<header class="spin-choice-sheet-header"><div><small>SPIN WHEEL</small><strong>Edit wheel</strong></div><button type="button" class="spin-editor-close" data-action="toolbox-spin-edit" aria-label="Done editing Spin Wheel">×</button></header><p class="spin-choice-sheet-hint">Switch presets, manage saved wheels, and edit choices here.</p>`;
      tool.append(sheet);
    }
    if (editor.parentElement !== sheet) sheet.append(editor);
    tool.classList.add("choice-sheet-open");
    const hub = buildPresetHub(tool, sheet);
    const menu = tool.querySelector(".spin-preset-menu");
    const slot = hub.querySelector(".spin-preset-inline-slot");
    if (menu && slot && menu.parentElement !== slot) slot.append(menu);
    hub.classList.toggle("is-managing", Boolean(menu));
    const manage = hub.querySelector(".spin-manage-presets");
    if (manage) manage.textContent = menu ? "Done" : "Manage";

    if (!editor.querySelector(".spin-editor-choices-title")) {
      const title = document.createElement("div");
      title.className = "spin-editor-section-title spin-editor-choices-title";
      title.innerHTML = `<span>CHOICES</span><small>Edit what can be picked</small>`;
      editor.prepend(title);
    }
    const input = editor.querySelector("#toolbox-spin-choice");
    if (input instanceof HTMLInputElement) {
      input.setAttribute("enterkeyhint", "done");
      input.setAttribute("autocomplete", "off");
    }
  };

  const decorate = () => {
    const tool = document.querySelector(".spin-wheel-tool");
    if (!(tool instanceof HTMLElement)) return;
    const panel = tool.closest(".toolbox-panel");
    const toolbar = panel?.querySelector(".toolbox-toolbar");
    const header = panel?.querySelector(".toolbox-header");
    const back = toolbar?.querySelector("[data-action='toolbox-back']");
    if (header && back && !header.querySelector(".spin-world-back")) {
      back.classList.add("spin-world-back");
      back.textContent = "←";
      back.setAttribute("aria-label", "Back to Toolbox");
      header.prepend(back);
    }
    const stage = tool.querySelector(".spin-wheel-stage");
    const primary = tool.querySelector(".spin-primary-action");
    const summary = tool.querySelector(".spin-choice-summary");
    if (stage && primary && summary && primary.previousElementSibling !== stage) stage.after(primary);
    const canvas = stage?.querySelector(".spin-wheel-canvas");
    if (canvas && !canvas.closest(".spin-wheel-frame")) {
      const frame = document.createElement("div");
      frame.className = "spin-wheel-frame";
      canvas.before(frame);
      frame.append(canvas);
    }
    tool.classList.toggle("has-winner", Boolean(tool.querySelector(".spin-winner-card")));
    tool.classList.toggle("is-spinning", primary?.textContent?.includes("Spinning") ?? false);
    decorateChoiceIcons(tool);
    decorateEditor(tool);
  };

  let frame = 0;
  const schedule = () => {
    if (frame) return;
    frame = requestAnimationFrame(() => {
      frame = 0;
      decorate();
    });
  };
  new MutationObserver(schedule).observe(document.documentElement, { subtree: true, childList: true });
  window.addEventListener("DOMContentLoaded", schedule, { once: true });
})();
