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

  const basePalette = ["#536f5e", "#c16e4d", "#c9a66d", "#d8b26f", "#445c78", "#9b604b", "#6f8c80", "#8b7058"];
  const highlightPalette = ["#73977d", "#e08a5c", "#e0bd79", "#efc879", "#5f7fa6", "#b9785d", "#8cab9e", "#a58a6d"];
  const originalFillText = CanvasRenderingContext2D.prototype.fillText;
  const originalClearRect = CanvasRenderingContext2D.prototype.clearRect;
  const originalFill = CanvasRenderingContext2D.prototype.fill;
  const segmentState = new WeakMap();

  const isWheelContext = (ctx) => ctx.canvas instanceof HTMLCanvasElement && ctx.canvas.classList.contains("spin-wheel-canvas");
  const currentChoices = () => [...document.querySelectorAll(".spin-wheel-tool .spin-choice-list li:not(.empty) > span")]
    .map((node) => node.textContent?.replace(/^\S+\s*/, "").trim() || node.textContent?.trim() || "")
    .filter(Boolean);
  const winnerText = () => document.querySelector(".spin-wheel-tool .spin-winner-card strong")?.textContent?.replace(/^\S+\s*/, "").trim() ?? "";

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
    const winner = winnerText();
    const selected = Boolean(winner && choices[index] === winner);
    const previous = this.fillStyle;
    const previousShadowColor = this.shadowColor;
    const previousShadowBlur = this.shadowBlur;
    this.fillStyle = (selected ? highlightPalette : basePalette)[index % basePalette.length];
    if (selected) {
      this.shadowColor = "rgba(255, 207, 106, .95)";
      this.shadowBlur = 17;
    }
    const result = originalFill.apply(this, args);
    this.fillStyle = previous;
    this.shadowColor = previousShadowColor;
    this.shadowBlur = previousShadowBlur;
    return result;
  };

  CanvasRenderingContext2D.prototype.fillText = function(text, x, y, maxWidth) {
    if (!isWheelContext(this) || typeof text !== "string") {
      if (maxWidth === undefined) return originalFillText.call(this, text, x, y);
      return originalFillText.call(this, text, x, y, maxWidth);
    }

    const label = text.trim();
    if (!label) return;
    const matrix = this.getTransform();
    const px = matrix.e;
    const py = matrix.f;
    const emoji = emojiFor(label);
    const winner = winnerText();
    const selected = winner === label;

    this.save();
    this.resetTransform();
    this.textAlign = "center";
    this.textBaseline = "middle";
    this.shadowColor = selected ? "rgba(255, 218, 132, .9)" : "rgba(0,0,0,.48)";
    this.shadowBlur = selected ? 8 : 2;
    this.fillStyle = selected ? "#fff0bd" : "#f1dfbc";
    this.font = "700 16px Georgia, 'Times New Roman', serif";
    const display = label.length > 8 ? label.slice(0, 7) + "…" : label;
    originalFillText.call(this, display, px, py - 10, 100);
    this.shadowBlur = selected ? 9 : 0;
    this.font = "24px 'Apple Color Emoji', 'Segoe UI Emoji', 'Noto Color Emoji', sans-serif";
    originalFillText.call(this, emoji, px, py + 17);
    this.restore();
  };

  const decorateChoiceIcons = (tool) => {
    tool.querySelectorAll(".spin-choice-list li:not(.empty)").forEach((item) => {
      const label = item.querySelector("span");
      if (!label) return;
      const raw = label.textContent?.replace(/^\S+\s*/, "").trim() || label.textContent?.trim() || "";
      let icon = label.querySelector(".spin-choice-emoji");
      if (!icon) {
        icon = document.createElement("span");
        icon.className = "spin-choice-emoji";
        icon.setAttribute("aria-hidden", "true");
        label.prepend(icon);
      }
      icon.textContent = emojiFor(raw);
    });

    const summary = tool.querySelector(".spin-choice-summary small");
    if (summary) {
      const labels = currentChoices().slice(0, 3);
      summary.textContent = labels.length ? labels.map((value) => `${emojiFor(value)} ${value}`).join("  ·  ") : "Add a choice to begin.";
    }
  };

  const decorateChoiceEditor = (tool) => {
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
      sheet.setAttribute("aria-label", "Edit Spin Wheel choices");
      sheet.innerHTML = `<header class="spin-choice-sheet-header"><div><small>SPIN WHEEL</small><strong>Edit choices</strong></div><button type="button" data-action="toolbox-spin-edit" aria-label="Done editing choices">×</button></header><p class="spin-choice-sheet-hint">Add, remove, and review the choices on this wheel.</p>`;
      tool.append(sheet);
    }

    if (editor.parentElement !== sheet) sheet.append(editor);
    tool.classList.add("choice-sheet-open");

    const list = editor.querySelector(".spin-choice-list");
    if (list && !list.dataset.choiceSheetPrepared) {
      list.dataset.choiceSheetPrepared = "true";
      requestAnimationFrame(() => { list.scrollTop = list.scrollHeight; });
    }

    const input = editor.querySelector("#toolbox-spin-choice");
    if (input && !input.dataset.choiceSheetFocused) {
      input.dataset.choiceSheetFocused = "true";
      input.setAttribute("enterkeyhint", "done");
      input.setAttribute("autocomplete", "off");
      input.setAttribute("aria-label", "New Spin Wheel choice");
      requestAnimationFrame(() => {
        try { input.focus({ preventScroll: true }); } catch { input.focus(); }
      });
    }
  };

  const decorate = () => {
    const tool = document.querySelector(".spin-wheel-tool");
    if (!tool) return;
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

    const more = tool.querySelector("[data-action='toolbox-preset-menu']");
    if (more) more.textContent = "Edit";

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

    const winner = tool.querySelector(".spin-winner-card");
    if (winner && stage && winner.parentElement !== stage) stage.append(winner);
    tool.classList.toggle("has-winner", Boolean(winner));
    tool.classList.toggle("is-spinning", primary?.textContent?.includes("Spinning") ?? false);

    decorateChoiceIcons(tool);
    decorateChoiceEditor(tool);

    const winnerLabel = tool.querySelector(".spin-winner-card strong");
    if (winnerLabel) {
      const raw = winnerLabel.textContent?.replace(/^\S+\s*/, "").trim() || winnerLabel.textContent?.trim() || "";
      let icon = winnerLabel.querySelector(".spin-winner-emoji");
      if (!icon) {
        icon = document.createElement("span");
        icon.className = "spin-winner-emoji";
        icon.setAttribute("aria-hidden", "true");
        winnerLabel.prepend(icon);
      }
      icon.textContent = emojiFor(raw);
    }
  };

  document.addEventListener("keydown", (event) => {
    if (event.key !== "Enter" || event.isComposing) return;
    const input = event.target instanceof HTMLInputElement ? event.target : null;
    if (!input?.matches("#toolbox-spin-choice")) return;
    const editor = input.closest(".spin-choice-editor.open");
    const add = editor?.querySelector("[data-action='toolbox-spin-add']");
    if (!add || !input.value.trim()) return;
    event.preventDefault();
    add.click();
  });

  const observer = new MutationObserver(() => requestAnimationFrame(decorate));
  observer.observe(document.documentElement, { subtree: true, childList: true });
  window.addEventListener("DOMContentLoaded", decorate, { once: true });
})();
