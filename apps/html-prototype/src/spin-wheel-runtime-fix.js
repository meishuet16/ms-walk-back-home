(() => {
  const fallbackIcons = ["🐱", "⭐", "🌿", "☁️", "🍀", "🌙", "📖", "🧸", "🌼", "🫧", "🎐", "🪵"];
  const emojiFor = (value) => {
    const text = String(value ?? "").trim().toLowerCase();
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
    for (const char of text || "choice") hash = (hash * 33 + (char.codePointAt(0) ?? 0)) >>> 0;
    return fallbackIcons[hash % fallbackIcons.length];
  };

  /* spin-wheel-world.js decorates canvas text, but its old transform only used the
     translation component. Native wheel labels are drawn after rotate/translate, so
     x/y must also be transformed or every label collapses into the wheel centre. */
  const previousFillText = CanvasRenderingContext2D.prototype.fillText;
  CanvasRenderingContext2D.prototype.fillText = function(text, x, y, maxWidth) {
    const canvas = this.canvas;
    if (!(canvas instanceof HTMLCanvasElement) || !canvas.classList.contains("spin-wheel-canvas") || typeof text !== "string") {
      return maxWidth === undefined
        ? previousFillText.call(this, text, x, y)
        : previousFillText.call(this, text, x, y, maxWidth);
    }

    const label = text.trim();
    if (!label) return;
    const matrix = this.getTransform();
    const px = matrix.a * x + matrix.c * y + matrix.e;
    const py = matrix.b * x + matrix.d * y + matrix.f;
    const display = label.length > 9 ? `${label.slice(0, 8)}…` : label;

    this.save();
    this.resetTransform();
    this.textAlign = "center";
    this.textBaseline = "middle";
    this.fillStyle = "#f1dfb9";
    this.shadowColor = "rgba(0,0,0,.58)";
    this.shadowBlur = 3;
    this.font = "700 14px Georgia, 'Times New Roman', serif";

    /* Temporarily remove the marker so the previous decorator delegates to native
       fillText instead of applying its incorrect wheel transform a second time. */
    canvas.classList.remove("spin-wheel-canvas");
    try {
      previousFillText.call(this, display, px, py - 11, 106);
      this.shadowBlur = 1;
      this.font = "22px 'Apple Color Emoji', 'Segoe UI Emoji', 'Noto Color Emoji', sans-serif";
      previousFillText.call(this, emojiFor(label), px, py + 16);
    } finally {
      canvas.classList.add("spin-wheel-canvas");
      this.restore();
    }
  };

  const normalizeResult = () => {
    const tool = document.querySelector(".spin-wheel-tool");
    const card = tool?.querySelector(".spin-winner-card");
    if (!(tool instanceof HTMLElement) || !(card instanceof HTMLElement)) return;

    const nativeKeep = card.querySelector("button[data-action='toolbox-spin-keep']:not(.spin-result-back)");
    const spinAgain = card.querySelector("button[data-action='toolbox-spin']");
    if (!(nativeKeep instanceof HTMLButtonElement) || !(spinAgain instanceof HTMLButtonElement)) return;
    const actions = nativeKeep.parentElement;
    if (!(actions instanceof HTMLElement)) return;
    actions.classList.add("spin-winner-actions");

    /* Remove any controls injected by an earlier decorator pass. This is deliberately
       idempotent so a render/mutation cannot accumulate duplicate buttons again. */
    actions.querySelectorAll(".spin-result-back").forEach((node) => node.remove());
    actions.querySelectorAll(".spin-use-remove").forEach((node) => node.remove());

    nativeKeep.textContent = "Use result";
    nativeKeep.classList.add("spin-use-result");
    nativeKeep.title = "Accept this result and keep every choice on the wheel";
    nativeKeep.setAttribute("aria-label", "Use result and keep this choice in the wheel");

    const choices = [...tool.querySelectorAll(".spin-choice-list li:not(.empty) > span")]
      .map((node) => {
        if (!(node instanceof HTMLElement)) return "";
        return [...node.childNodes]
          .filter((child) => !(child instanceof HTMLElement && child.classList.contains("spin-choice-emoji")))
          .map((child) => child.textContent ?? "")
          .join("")
          .trim();
      });
    const winnerNode = card.querySelector("strong");
    const winner = winnerNode instanceof HTMLElement
      ? [...winnerNode.childNodes]
          .filter((child) => !(child instanceof HTMLElement && child.classList.contains("spin-winner-emoji")))
          .map((child) => child.textContent ?? "")
          .join("")
          .trim()
      : "";
    const winnerIndex = choices.findIndex((choice) => choice === winner);

    const back = document.createElement("button");
    back.type = "button";
    back.className = "spin-result-back";
    back.textContent = "← Back to wheel";
    back.setAttribute("aria-label", "Close result and return to wheel without changing choices");
    back.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      nativeKeep.click();
    });

    const remove = document.createElement("button");
    remove.type = "button";
    remove.className = "spin-use-remove";
    remove.textContent = "Use & remove";
    remove.title = "Accept this result and remove it from the next round";
    remove.setAttribute("aria-label", "Use result and remove this choice from the next round");
    if (winnerIndex >= 0) {
      remove.dataset.action = "toolbox-spin-remove";
      remove.dataset.index = String(winnerIndex);
    } else {
      remove.disabled = true;
    }

    actions.replaceChildren(back, spinAgain, nativeKeep, remove);
  };

  let frame = 0;
  const schedule = () => {
    if (frame) return;
    frame = requestAnimationFrame(() => {
      frame = 0;
      normalizeResult();
    });
  };
  new MutationObserver((mutations) => {
    if (mutations.some((mutation) => mutation.type === "childList" && (mutation.addedNodes.length || mutation.removedNodes.length))) schedule();
  }).observe(document.documentElement, { childList: true, subtree: true });
  window.addEventListener("DOMContentLoaded", schedule, { once: true });
})();
