const ENHANCEMENT_STYLE_ID = "spin-wheel-enhancement-v3";

const fallbackIcons = ["🐱", "⭐", "🌿", "☁️", "🍀", "🌙", "📖", "🧸", "🌼", "🫧", "🎐", "🪵"];

function emojiFor(value: string): string {
  const text = String(value ?? "").trim().toLowerCase();
  if (!text) return "✦";
  const rules: Array<[RegExp, string]> = [
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
}

function rawLabelText(node: Element | null): string {
  if (!(node instanceof HTMLElement)) return "";
  let text = "";
  for (const child of node.childNodes) {
    if (child instanceof HTMLElement && (child.classList.contains("spin-choice-emoji") || child.classList.contains("spin-winner-emoji"))) continue;
    text += child.textContent ?? "";
  }
  return text.trim();
}

function choicesFor(tool: Element): string[] {
  return [...tool.querySelectorAll(".spin-choice-list li:not(.empty) > span")]
    .map((node) => rawLabelText(node))
    .filter(Boolean);
}

function winnerFor(tool: Element): string {
  return rawLabelText(tool.querySelector(".spin-winner-card strong"));
}

function injectStyles(): void {
  if (document.getElementById(ENHANCEMENT_STYLE_ID)) return;
  const style = document.createElement("style");
  style.id = ENHANCEMENT_STYLE_ID;
  style.textContent = `
.toolbox-panel:has(.spin-wheel-tool){
  --spin-ink:#f0dfba;--spin-muted:#b7aa8d;--spin-brass:#b28a4b;--spin-brass-hi:#dfbd70;
  --spin-panel:#263833;--spin-panel-2:#1d2d2b;--spin-recess:#172523;--spin-rust:#7d493b;
  background:linear-gradient(145deg,#31443c 0%,#263934 42%,#1d2d2b 100%)!important;
  border:2px solid #8e7043!important;box-shadow:0 22px 60px rgba(0,0,0,.55),inset 0 0 0 2px rgba(221,185,105,.11)!important;
}
.toolbox-panel:has(.spin-wheel-tool)::before{content:"";position:absolute;inset:5px;pointer-events:none;border:1px solid rgba(208,169,93,.25);border-radius:inherit;background:repeating-linear-gradient(118deg,transparent 0 18px,rgba(255,255,255,.012) 19px,transparent 20px 31px)}
.spin-wheel-tool{position:relative;display:flex;flex-direction:column;gap:12px;color:var(--spin-ink);max-width:760px;margin:0 auto;padding:2px 2px 12px}
.spin-wheel-tool button,.spin-wheel-tool select,.spin-wheel-tool input{min-height:44px}
.spin-preset-bar{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:10px;align-items:end;padding:10px 12px;background:linear-gradient(180deg,rgba(20,35,32,.92),rgba(29,45,40,.92));border:1px solid rgba(185,145,74,.55);border-radius:12px;box-shadow:inset 0 1px rgba(255,224,155,.06)}
.spin-preset-bar label{display:grid;gap:5px;color:#b9ad91;font-size:11px;letter-spacing:.11em;text-transform:uppercase}.spin-preset-bar select{width:100%;background:#172724;color:#ead9b5;border:1px solid #765f3c;border-radius:8px;padding:0 10px}.spin-preset-bar>button{padding:0 15px;background:#3a493f;color:#e5d4ac;border:1px solid #8c7144;border-radius:8px;font-weight:700}
.spin-wheel-stage{position:relative;display:grid;place-items:center;min-height:330px;padding:18px;border-radius:20px;background:radial-gradient(circle at 50% 43%,#2f4642 0 28%,#233733 58%,#172724 100%);border:1px solid #795f37;box-shadow:inset 0 18px 42px rgba(0,0,0,.28),inset 0 0 0 5px rgba(15,29,27,.32)}
.spin-wheel-frame{position:relative;width:min(76vw,330px);aspect-ratio:1;display:grid;place-items:center;border-radius:50%;padding:13px;background:radial-gradient(circle,#c5a05c 0 2%,#604c2f 3% 5%,#d0a85d 6% 7%,#5f4b2f 8% 9%,#9e7b43 10% 11%,#1d2b29 12%);box-shadow:0 13px 24px rgba(0,0,0,.42),inset 0 1px rgba(255,225,149,.34)}
.spin-wheel-frame::after{content:"";position:absolute;inset:7px;border-radius:50%;border:1px dashed rgba(244,210,130,.28);pointer-events:none}
#app .spin-wheel-canvas{display:block!important;width:100%!important;height:auto!important;aspect-ratio:1/1!important;max-width:none!important;max-height:none!important;filter:saturate(.82) contrast(1.05) sepia(.06)}
.spin-pointer{z-index:6;color:#e0b65f!important;text-shadow:0 2px 0 #4f3923,0 0 10px rgba(224,182,95,.32);font-size:27px!important;transform:translateY(7px)}
.spin-wheel-result{margin-top:8px;color:#d7c59f!important;font-size:12px!important;letter-spacing:.13em;text-transform:uppercase}.spin-primary-action{order:4;width:min(100%,360px);align-self:center;min-height:54px!important;border-radius:11px!important;background:linear-gradient(#d3ab5d,#a77c39)!important;color:#241b12!important;border:1px solid #e7c57d!important;box-shadow:0 5px 0 #694923,0 8px 16px rgba(0,0,0,.28),inset 0 1px #f4d99c!important;font-weight:900!important;letter-spacing:.08em;text-transform:uppercase}.spin-primary-action:active{transform:translateY(3px);box-shadow:0 2px 0 #694923,0 5px 10px rgba(0,0,0,.25)!important}
.spin-choice-summary{order:5;width:100%;display:flex;justify-content:space-between;align-items:center;gap:12px;text-align:left;padding:10px 13px!important;border-radius:11px!important;background:#1d302d!important;border:1px solid #6f5d3b!important;color:#e1d0aa!important}.spin-choice-summary>span{display:grid;gap:3px}.spin-choice-summary small{color:#aa9f85;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:min(58vw,460px)}.spin-choice-summary b{color:#d5b269;font-size:12px}
.spin-choice-editor:not(.open){display:none!important}.spin-choice-sheet,.spin-preset-sheet{position:absolute;z-index:40;inset:10px;display:flex;flex-direction:column;max-height:calc(100% - 20px);overflow:hidden;border-radius:15px;background:linear-gradient(155deg,#30423a,#1d2e2a 65%,#182724);border:1px solid #a17d45;box-shadow:0 20px 48px rgba(0,0,0,.62),inset 0 1px rgba(255,226,159,.1)}
.spin-wheel-tool.choice-sheet-open::after,.spin-wheel-tool.preset-sheet-open::after{content:"";position:absolute;z-index:35;inset:-14px;background:rgba(7,15,14,.58);backdrop-filter:blur(2px);border-radius:18px;pointer-events:none}
.spin-choice-sheet-header{display:flex;justify-content:space-between;align-items:center;padding:14px 15px 10px;border-bottom:1px solid rgba(187,147,74,.3)}.spin-choice-sheet-header div{display:grid;gap:2px}.spin-choice-sheet-header small{font-size:10px;letter-spacing:.15em;color:#a79778}.spin-choice-sheet-header strong{font-size:18px;color:#ecdcb8}.spin-choice-sheet-header button{width:44px;min-width:44px;padding:0;border-radius:50%;background:#1b2a27;border:1px solid #765f3c;color:#dfc994;font-size:25px}.spin-choice-sheet-hint{margin:0;padding:10px 15px;color:#aca087;font-size:12px;line-height:1.45;background:rgba(15,27,25,.42)}
.spin-choice-sheet .spin-choice-editor{display:flex!important;min-height:0;flex:1;flex-direction:column;padding:0!important;background:transparent!important;border:0!important}.spin-choice-list{min-height:0;flex:1;overflow:auto;margin:0!important;padding:10px 12px!important;display:grid;align-content:start;gap:7px}.spin-choice-list li{min-height:48px;padding:6px 7px 6px 12px!important;background:#213632!important;border:1px solid rgba(135,108,64,.52)!important;border-radius:9px!important}.spin-choice-list li>span{display:flex;align-items:center;gap:9px;color:#e8d8b4}.spin-choice-emoji{width:27px;text-align:center;font-size:20px}.spin-choice-list button{min-width:44px;border-radius:8px!important;background:#3e3027!important;border:1px solid #76503c!important;color:#dcb39c!important}.spin-choice-add{position:sticky;bottom:0;display:grid!important;grid-template-columns:1fr auto;gap:8px;padding:11px 12px calc(11px + env(safe-area-inset-bottom));background:#182925;border-top:1px solid rgba(183,142,70,.45)}.spin-choice-add input{min-width:0;background:#10211e!important;color:#eee0bf!important;border:1px solid #735e3d!important;border-radius:8px!important;padding:0 11px!important}.spin-choice-add button{min-width:72px;border-radius:8px!important;background:#b58b48!important;color:#241b12!important;border:1px solid #d2af68!important;font-weight:800}
.spin-preset-sheet .spin-preset-current{margin:10px 13px 0;padding:11px 12px;border-radius:9px;background:#1a2c29;border:1px solid #65563b;display:grid;gap:3px}.spin-preset-current small,.spin-preset-new-title{font-size:10px;letter-spacing:.12em;color:#9f9276}.spin-preset-current strong{color:#ead8b0}.spin-preset-sheet .spin-preset-menu{display:grid!important;gap:12px;padding:12px 13px 15px;background:transparent!important;border:0!important}.spin-preset-menu label{display:grid;gap:6px}.spin-preset-menu input{background:#10211e!important;color:#eee0bf!important;border:1px solid #735e3d!important;border-radius:8px!important;padding:0 11px!important}.spin-preset-menu>div{display:grid!important;grid-template-columns:1fr 1fr;gap:8px}.spin-preset-menu [data-action="toolbox-preset-create"]{grid-column:1/-1;order:-1;background:#b58b48!important;color:#241b12!important;border:1px solid #d2af68!important;font-weight:800}.spin-preset-menu [data-action="toolbox-preset-rename"]{background:#31443d!important;color:#e2d2af!important;border:1px solid #715f40!important}.spin-preset-menu [data-action="toolbox-preset-delete"]{background:#352824!important;color:#d9a795!important;border:1px solid #6f493d!important}
.spin-winner-card{position:absolute!important;z-index:20;inset:20px!important;margin:auto!important;width:min(calc(100% - 36px),360px)!important;height:max-content!important;padding:14px!important;border-radius:15px!important;background:linear-gradient(155deg,#33463e,#1b2d29)!important;border:1px solid #d0a457!important;box-shadow:0 18px 48px rgba(0,0,0,.68),inset 0 1px rgba(255,226,154,.13)!important;text-align:center}.spin-result-topline{display:flex;align-items:center;justify-content:space-between;margin-bottom:5px}.spin-result-topline small{letter-spacing:.12em;color:#b6a98b!important}.spin-result-back{width:42px;min-width:42px!important;min-height:38px!important;padding:0!important;border-radius:9px!important;background:#1b2b28!important;border:1px solid #6d5a3b!important;color:#d5be89!important;font-size:19px!important}.spin-winner-card>strong{display:flex!important;justify-content:center;align-items:center;gap:8px;margin:7px 0 2px;color:#f1ddb0!important;font-size:25px!important}.spin-winner-emoji{font-size:27px}.spin-winner-card>span{color:#b9ac90!important}.spin-result-actions{display:grid!important;grid-template-columns:1fr 1fr;gap:8px;margin-top:14px}.spin-result-actions button{min-height:46px!important;border-radius:9px!important}.spin-result-use{grid-column:1/-1;background:linear-gradient(#d0a85a,#a57a38)!important;color:#241b12!important;border:1px solid #e1bd72!important;font-weight:850}.spin-result-remove{background:#32463e!important;color:#ead9b5!important;border:1px solid #826a43!important}.spin-result-again{background:#1a2c29!important;color:#d6c49e!important;border:1px solid #62543a!important}.spin-result-helper{display:block;margin-top:9px;color:#998d75;font-size:10px;line-height:1.35}
@media(max-width:600px){.toolbox-panel:has(.spin-wheel-tool){width:min(96vw,460px)!important;max-height:94dvh!important}.spin-wheel-stage{min-height:300px;padding:13px 9px}.spin-wheel-frame{width:min(73vw,306px);padding:11px}.spin-preset-bar{padding:8px 9px}.spin-choice-sheet,.spin-preset-sheet{position:fixed;left:8px;right:8px;top:max(8px,env(safe-area-inset-top));bottom:8px;inset-block:auto;max-height:none}.spin-choice-summary small{max-width:52vw}.spin-result-actions{grid-template-columns:1fr}.spin-result-use{grid-column:auto}}
@media(max-width:360px){.spin-wheel-frame{width:min(70vw,276px)}.spin-wheel-stage{min-height:275px}.spin-preset-menu>div{grid-template-columns:1fr}}
@media(prefers-reduced-motion:reduce){.spin-wheel-tool *, .spin-wheel-tool *::before,.spin-wheel-tool *::after{scroll-behavior:auto!important;transition-duration:.01ms!important;animation-duration:.01ms!important}}
`;
  document.head.append(style);
}

function installCanvasTheme(): void {
  const proto = CanvasRenderingContext2D.prototype as CanvasRenderingContext2D & { __spinWheelEnhancementV3?: boolean };
  if (proto.__spinWheelEnhancementV3) return;
  proto.__spinWheelEnhancementV3 = true;

  const basePalette = ["#425d59", "#8d4f3f", "#ad8c50", "#263e46", "#6b7652", "#a06a46", "#374e46", "#756049"];
  const highlightPalette = ["#66827b", "#b9654d", "#d4b05f", "#45606d", "#8b9468", "#c58455", "#526e62", "#947a5e"];
  const nativePalette = ["#d7ad70", "#8f7154", "#b7c7b0", "#a98968", "#d5c69a", "#6f887e"];
  const originalFill = CanvasRenderingContext2D.prototype.fill;
  const originalFillText = CanvasRenderingContext2D.prototype.fillText;
  const originalClearRect = CanvasRenderingContext2D.prototype.clearRect;
  const segmentState = new WeakMap<CanvasRenderingContext2D, number>();
  const isWheel = (ctx: CanvasRenderingContext2D) => ctx.canvas.classList.contains("spin-wheel-canvas");

  CanvasRenderingContext2D.prototype.clearRect = function(...args: Parameters<CanvasRenderingContext2D["clearRect"]>) {
    if (isWheel(this)) segmentState.set(this, 0);
    return originalClearRect.apply(this, args);
  };

  CanvasRenderingContext2D.prototype.fill = function(...args: Parameters<CanvasRenderingContext2D["fill"]>) {
    if (!isWheel(this)) return originalFill.apply(this, args);
    const style = typeof this.fillStyle === "string" ? this.fillStyle.toLowerCase() : "";
    if (!nativePalette.includes(style)) return originalFill.apply(this, args);
    const index = segmentState.get(this) ?? 0;
    segmentState.set(this, index + 1);
    const tool = this.canvas.closest(".spin-wheel-tool");
    const choices = tool ? choicesFor(tool) : [];
    const winner = tool ? winnerFor(tool) : "";
    const selected = Boolean(winner && choices[index] === winner);
    const previous = this.fillStyle;
    const shadowColor = this.shadowColor;
    const shadowBlur = this.shadowBlur;
    this.fillStyle = (selected ? highlightPalette : basePalette)[index % basePalette.length];
    if (selected) { this.shadowColor = "rgba(226,184,94,.9)"; this.shadowBlur = 14; }
    const result = originalFill.apply(this, args);
    this.fillStyle = previous;
    this.shadowColor = shadowColor;
    this.shadowBlur = shadowBlur;
    return result;
  } as CanvasRenderingContext2D["fill"];

  CanvasRenderingContext2D.prototype.fillText = function(text: string, x: number, y: number, maxWidth?: number) {
    if (!isWheel(this) || typeof text !== "string") {
      return maxWidth === undefined ? originalFillText.call(this, text, x, y) : originalFillText.call(this, text, x, y, maxWidth);
    }
    const label = text.trim();
    if (!label) return;
    const matrix = this.getTransform();
    const tool = this.canvas.closest(".spin-wheel-tool");
    const winner = tool ? winnerFor(tool) : "";
    const selected = winner === label;
    this.save();
    this.resetTransform();
    this.textAlign = "center";
    this.textBaseline = "middle";
    this.fillStyle = selected ? "#ffe5a2" : "#ead9b5";
    this.shadowColor = selected ? "rgba(226,184,94,.8)" : "rgba(0,0,0,.5)";
    this.shadowBlur = selected ? 7 : 2;
    this.font = "700 15px Georgia, 'Times New Roman', serif";
    const display = label.length > 8 ? `${label.slice(0, 7)}…` : label;
    originalFillText.call(this, display, matrix.e, matrix.f - 10, 102);
    this.shadowBlur = selected ? 7 : 0;
    this.font = "23px 'Apple Color Emoji','Segoe UI Emoji','Noto Color Emoji',sans-serif";
    originalFillText.call(this, emojiFor(label), matrix.e, matrix.f + 17);
    this.restore();
  };
}

function decorateChoices(tool: HTMLElement): void {
  tool.querySelectorAll(".spin-choice-list li:not(.empty)").forEach((row) => {
    const label = row.querySelector("span");
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
    if (icon.textContent !== emojiFor(raw)) icon.textContent = emojiFor(raw);
  });
  const summary = tool.querySelector(".spin-choice-summary small");
  if (summary) {
    const values = choicesFor(tool).slice(0, 3);
    const next = values.length ? values.map((value) => `${emojiFor(value)} ${value}`).join("  ·  ") : "Add a choice to begin.";
    if (summary.textContent !== next) summary.textContent = next;
  }
}

function decorateWinner(tool: HTMLElement): void {
  const card = tool.querySelector(".spin-winner-card");
  if (!(card instanceof HTMLElement)) return;
  const winner = winnerFor(tool);
  if (!winner) return;
  const winnerIndex = choicesFor(tool).findIndex((choice) => choice === winner);
  const strong = card.querySelector("strong");
  if (strong instanceof HTMLElement && !strong.querySelector(".spin-winner-emoji")) {
    const icon = document.createElement("span");
    icon.className = "spin-winner-emoji";
    icon.setAttribute("aria-hidden", "true");
    icon.textContent = emojiFor(winner);
    strong.prepend(icon);
  }
  let topline = card.querySelector(".spin-result-topline");
  const small = card.querySelector(":scope > small");
  if (!topline && small) {
    topline = document.createElement("div");
    topline.className = "spin-result-topline";
    small.before(topline);
    topline.append(small);
    const back = document.createElement("button");
    back.type = "button";
    back.className = "spin-result-back";
    back.dataset.action = "toolbox-spin-keep";
    back.setAttribute("aria-label", "Back to wheel");
    back.title = "Back to wheel";
    back.textContent = "←";
    topline.append(back);
  }
  const oldActions = [...card.querySelectorAll(":scope > div")].find((node) => !node.classList.contains("spin-result-topline"));
  if (oldActions && !oldActions.classList.contains("spin-result-actions")) {
    oldActions.className = "spin-result-actions";
    oldActions.innerHTML = "";
    const use = document.createElement("button");
    use.type = "button";
    use.className = "spin-result-use";
    use.dataset.action = "toolbox-spin-keep";
    use.textContent = "Use result";
    use.title = "Accept this result and keep every choice in the wheel";
    const remove = document.createElement("button");
    remove.type = "button";
    remove.className = "spin-result-remove";
    remove.dataset.action = "toolbox-spin-remove";
    remove.dataset.index = String(Math.max(0, winnerIndex));
    remove.textContent = "Use & remove";
    remove.title = `Accept ${winner} and remove it from the next round`;
    const again = document.createElement("button");
    again.type = "button";
    again.className = "spin-result-again";
    again.dataset.action = "toolbox-spin";
    again.textContent = "Spin again";
    oldActions.append(use, remove, again);
    const helper = document.createElement("small");
    helper.className = "spin-result-helper";
    helper.textContent = "Use & remove is handy for group allocation — the picked choice will not appear next round.";
    oldActions.after(helper);
  }
}

function decorateChoiceSheet(tool: HTMLElement): void {
  const editor = tool.querySelector(".spin-choice-editor.open");
  if (!(editor instanceof HTMLElement)) {
    tool.querySelector(".spin-choice-sheet")?.remove();
    tool.classList.remove("choice-sheet-open");
    return;
  }
  let sheet = tool.querySelector(".spin-choice-sheet");
  if (!(sheet instanceof HTMLElement)) {
    sheet = document.createElement("section");
    sheet.className = "spin-choice-sheet";
    sheet.setAttribute("role", "dialog");
    sheet.setAttribute("aria-modal", "true");
    sheet.innerHTML = `<header class="spin-choice-sheet-header"><div><small>SPIN WHEEL</small><strong>Edit choices</strong></div><button type="button" data-action="toolbox-spin-edit" aria-label="Done editing choices">×</button></header><p class="spin-choice-sheet-hint">Add the people or options you want to draw. Nothing is removed unless you choose <b>Use & remove</b> after a spin.</p>`;
    tool.append(sheet);
  }
  if (editor.parentElement !== sheet) sheet.append(editor);
  tool.classList.add("choice-sheet-open");
  const input = editor.querySelector<HTMLInputElement>("#toolbox-spin-choice");
  if (input) { input.setAttribute("enterkeyhint", "done"); input.setAttribute("autocomplete", "off"); }
}

function decoratePresetSheet(tool: HTMLElement): void {
  const menu = tool.querySelector(".spin-preset-menu");
  if (!(menu instanceof HTMLElement)) {
    tool.querySelector(".spin-preset-sheet")?.remove();
    tool.classList.remove("preset-sheet-open");
    return;
  }
  let sheet = tool.querySelector(".spin-preset-sheet");
  if (!(sheet instanceof HTMLElement)) {
    sheet = document.createElement("section");
    sheet.className = "spin-preset-sheet";
    sheet.setAttribute("role", "dialog");
    sheet.setAttribute("aria-modal", "true");
    sheet.innerHTML = `<header class="spin-choice-sheet-header"><div><small>SPIN WHEEL</small><strong>Preset settings</strong></div><button type="button" data-action="toolbox-preset-menu" aria-label="Close preset settings">×</button></header><p class="spin-choice-sheet-hint">Keep separate wheels for different situations. Creating a preset never changes another preset.</p><div class="spin-preset-current"><small>CURRENT PRESET</small><strong></strong></div>`;
    tool.append(sheet);
  }
  if (menu.parentElement !== sheet) sheet.append(menu);
  tool.classList.add("preset-sheet-open");
  const select = tool.querySelector<HTMLSelectElement>("[data-toolbox-field='spin-preset']");
  const current = sheet.querySelector(".spin-preset-current strong");
  if (current) current.textContent = select?.selectedOptions[0]?.textContent?.trim() || "Current preset";
  const input = menu.querySelector<HTMLInputElement>("[data-toolbox-field='spin-preset-name']");
  if (input) {
    input.placeholder = "New preset name…";
    input.setAttribute("autocomplete", "off");
    input.setAttribute("enterkeyhint", "done");
    const label = input.closest("label");
    if (label && !label.querySelector(".spin-preset-new-title")) {
      const title = document.createElement("span");
      title.className = "spin-preset-new-title";
      title.textContent = "CREATE NEW PRESET";
      label.prepend(title);
    }
  }
  const create = menu.querySelector("[data-action='toolbox-preset-create']");
  const rename = menu.querySelector("[data-action='toolbox-preset-rename']");
  const remove = menu.querySelector("[data-action='toolbox-preset-delete']");
  if (create) create.textContent = "+ Create preset";
  if (rename) rename.textContent = "Rename current";
  if (remove) remove.textContent = "Delete current";
}

function decorate(): void {
  const tool = document.querySelector<HTMLElement>(".spin-wheel-tool");
  if (!tool) return;
  tool.dataset.spinEnhancement = "v3-bundled";
  const panel = tool.closest(".toolbox-panel");
  const toolbar = panel?.querySelector(".toolbox-toolbar");
  const header = panel?.querySelector(".toolbox-header");
  const back = toolbar?.querySelector<HTMLElement>("[data-action='toolbox-back']");
  if (header && back && !header.querySelector(".spin-world-back")) {
    back.classList.add("spin-world-back");
    back.textContent = "←";
    back.setAttribute("aria-label", "Back to Toolbox");
    header.prepend(back);
  }
  const more = tool.querySelector<HTMLElement>("[data-action='toolbox-preset-menu']");
  if (more && !more.closest(".spin-preset-sheet")) more.textContent = "Edit";
  const stage = tool.querySelector(".spin-wheel-stage");
  const canvas = stage?.querySelector(".spin-wheel-canvas");
  if (canvas && !canvas.closest(".spin-wheel-frame")) {
    const frame = document.createElement("div");
    frame.className = "spin-wheel-frame";
    canvas.before(frame);
    frame.append(canvas);
  }
  decorateChoices(tool);
  decorateWinner(tool);
  decorateChoiceSheet(tool);
  decoratePresetSheet(tool);
}

function installKeyboardShortcuts(): void {
  document.addEventListener("keydown", (event) => {
    if (event.key !== "Enter" || event.isComposing) return;
    const input = event.target instanceof HTMLInputElement ? event.target : null;
    if (input?.matches("#toolbox-spin-choice") && input.value.trim()) {
      const add = input.closest(".spin-choice-editor")?.querySelector<HTMLElement>("[data-action='toolbox-spin-add']");
      if (add) { event.preventDefault(); add.click(); }
      return;
    }
    if (input?.matches("[data-toolbox-field='spin-preset-name']") && input.value.trim()) {
      const create = input.closest(".spin-preset-menu")?.querySelector<HTMLElement>("[data-action='toolbox-preset-create']");
      if (create) { event.preventDefault(); create.click(); }
    }
  });
}

export function installSpinWheelEnhancement(): void {
  injectStyles();
  installCanvasTheme();
  installKeyboardShortcuts();
  let frame = 0;
  const schedule = () => {
    if (frame) return;
    frame = requestAnimationFrame(() => { frame = 0; decorate(); });
  };
  const observer = new MutationObserver((mutations) => {
    if (mutations.some((mutation) => mutation.type === "childList" && (mutation.addedNodes.length || mutation.removedNodes.length))) schedule();
  });
  observer.observe(document.documentElement, { subtree: true, childList: true });
  if (document.readyState === "loading") window.addEventListener("DOMContentLoaded", schedule, { once: true }); else schedule();
}
