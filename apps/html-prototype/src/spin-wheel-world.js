(() => {
  const emojiFor = (value) => {
    const text = String(value ?? "").trim().toLowerCase();
    if (!text) return "✦";
    const rules = [
      [/寿司|sushi/, "🍣"],
      [/拉面|ramen|面|noodle/, "🍜"],
      [/汉堡|burger/, "🍔"],
      [/沙拉|salad/, "🥗"],
      [/饭|rice|nasi|饭团/, "🍚"],
      [/鸡|chicken/, "🍗"],
      [/pizza|披萨/, "🍕"],
      [/甜|cake|dessert|蛋糕/, "🍰"],
      [/咖啡|coffee/, "☕"],
      [/茶|tea/, "🍵"],
      [/冰|ice cream/, "🍨"],
      [/火锅|hotpot/, "🍲"],
      [/电影|movie|cinema/, "🎬"],
      [/学习|study|读书|revision/, "📚"],
      [/游戏|game/, "🎮"],
      [/散步|walk/, "🌿"],
      [/骑|bike|cycling/, "🚲"],
      [/睡|sleep|nap/, "🌙"],
      [/约会|date/, "🌷"],
      [/随便|random|anything|whatever/, "🐾"],
      [/yes|可以|要/, "⭐"],
      [/no|不要|不行/, "☁️"]
    ];
    for (const [pattern, emoji] of rules) if (pattern.test(text)) return emoji;
    const fallback = ["✦", "🌿", "⭐", "☁️", "🍀", "🌙", "🧸", "📖"];
    let hash = 0;
    for (const char of text) hash = (hash * 31 + char.codePointAt(0)) >>> 0;
    return fallback[hash % fallback.length];
  };

  const originalFillText = CanvasRenderingContext2D.prototype.fillText;
  CanvasRenderingContext2D.prototype.fillText = function(text, x, y, maxWidth) {
    const canvas = this.canvas;
    const isSpinWheel = canvas instanceof HTMLCanvasElement && canvas.classList.contains("spin-wheel-canvas");
    if (isSpinWheel && typeof text === "string" && text.trim() && text !== "Ready" && text !== "Spinning…") {
      const choices = document.querySelectorAll(".spin-choice-list li:not(.empty)").length;
      if (choices <= 6) {
        const emoji = emojiFor(text);
        this.save();
        this.font = "23px 'Apple Color Emoji', 'Segoe UI Emoji', 'Noto Color Emoji', sans-serif";
        this.textAlign = "center";
        this.textBaseline = "middle";
        this.globalAlpha = 0.96;
        originalFillText.call(this, emoji, Number(x) + 30, Number(y));
        this.restore();
      }
    }
    if (maxWidth === undefined) return originalFillText.call(this, text, x, y);
    return originalFillText.call(this, text, x, y, maxWidth);
  };

  const decorate = () => {
    const tool = document.querySelector(".spin-wheel-tool");
    if (!tool) return;

    tool.querySelectorAll(".spin-choice-list li:not(.empty)").forEach((item) => {
      const label = item.querySelector("span");
      if (!label || label.querySelector(".spin-choice-emoji")) return;
      const raw = label.textContent ?? "";
      const icon = document.createElement("span");
      icon.className = "spin-choice-emoji";
      icon.setAttribute("aria-hidden", "true");
      icon.textContent = emojiFor(raw);
      label.prepend(icon);
    });

    const winner = tool.querySelector(".spin-winner-card strong");
    if (winner && !winner.querySelector(".spin-winner-emoji")) {
      const raw = winner.textContent ?? "";
      const icon = document.createElement("span");
      icon.className = "spin-winner-emoji";
      icon.setAttribute("aria-hidden", "true");
      icon.textContent = emojiFor(raw);
      winner.prepend(icon);
    }

    const summary = tool.querySelector(".spin-choice-summary small");
    if (summary && summary.dataset.decorated !== "true") {
      const labels = [...tool.querySelectorAll(".spin-choice-list li:not(.empty) > span")]
        .slice(0, 3)
        .map((node) => node.textContent?.replace(/^\S+\s*/, "").trim())
        .filter(Boolean);
      if (labels.length) summary.textContent = labels.map((label) => `${emojiFor(label)} ${label}`).join("  ·  ");
      summary.dataset.decorated = "true";
    }
  };

  const observer = new MutationObserver(() => queueMicrotask(decorate));
  observer.observe(document.documentElement, { subtree: true, childList: true });
  window.addEventListener("DOMContentLoaded", decorate, { once: true });
})();
