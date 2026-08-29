(() => {
  const emojiFor = (value) => {
    const text = String(value ?? "").trim().toLowerCase();
    if (!text) return "";
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
    return "";
  };

  const originalFillText = CanvasRenderingContext2D.prototype.fillText;
  CanvasRenderingContext2D.prototype.fillText = function(text, x, y, maxWidth) {
    const isSpinWheel = this.canvas instanceof HTMLCanvasElement && this.canvas.classList.contains("spin-wheel-canvas");
    if (isSpinWheel && typeof text === "string") {
      const emoji = emojiFor(text);
      if (emoji) {
        this.save();
        this.font = "21px 'Apple Color Emoji', 'Segoe UI Emoji', 'Noto Color Emoji', sans-serif";
        this.textAlign = "center";
        this.textBaseline = "middle";
        this.globalAlpha = 0.98;
        originalFillText.call(this, emoji, Number(x), Number(y) + 27);
        this.restore();
      }
    }
    if (maxWidth === undefined) return originalFillText.call(this, text, x, y);
    return originalFillText.call(this, text, x, y, maxWidth);
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

    const winner = stage?.querySelector(".spin-winner-card");
    if (winner && stage && winner.parentElement === stage) stage.after(winner);

    tool.querySelectorAll(".spin-choice-list li:not(.empty)").forEach((item) => {
      const label = item.querySelector("span");
      if (!label || label.querySelector(".spin-choice-emoji")) return;
      const raw = label.textContent ?? "";
      const emoji = emojiFor(raw);
      if (!emoji) return;
      const icon = document.createElement("span");
      icon.className = "spin-choice-emoji";
      icon.setAttribute("aria-hidden", "true");
      icon.textContent = emoji;
      label.prepend(icon);
    });

    const winnerLabel = tool.querySelector(".spin-winner-card strong");
    if (winnerLabel && !winnerLabel.querySelector(".spin-winner-emoji")) {
      const raw = winnerLabel.textContent ?? "";
      const emoji = emojiFor(raw);
      if (emoji) {
        const icon = document.createElement("span");
        icon.className = "spin-winner-emoji";
        icon.setAttribute("aria-hidden", "true");
        icon.textContent = emoji;
        winnerLabel.prepend(icon);
      }
    }

    const result = tool.querySelector(".spin-wheel-result");
    if (result) result.textContent = result.textContent?.trim() === "Ready" ? "Ready" : result.textContent;
  };

  const observer = new MutationObserver(() => requestAnimationFrame(decorate));
  observer.observe(document.documentElement, { subtree: true, childList: true });
  window.addEventListener("DOMContentLoaded", decorate, { once: true });
})();
