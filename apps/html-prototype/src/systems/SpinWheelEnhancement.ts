const STYLE_ID = "spin-wheel-enhancement-v4";
const icons = ["🐱", "⭐", "🌿", "☁️", "🍀", "🌙", "📖", "🧸", "🌼", "🫧", "🎐", "🪵"];

function emojiFor(value: string): string {
  const text = value.trim().toLowerCase();
  const rules: Array<[RegExp, string]> = [
    [/寿司|sushi/, "🍣"], [/拉面|ramen|noodle|面/, "🍜"], [/汉堡|burger/, "🍔"],
    [/饭|rice|nasi/, "🍚"], [/鸡|chicken/, "🍗"], [/pizza|披萨/, "🍕"], [/甜|cake|dessert|蛋糕/, "🍰"],
    [/咖啡|coffee/, "☕"], [/茶|tea/, "🍵"], [/电影|movie|cinema/, "🎬"], [/学习|study|读书|revision/, "📚"],
    [/游戏|game/, "🎮"], [/散步|walk/, "🌿"], [/骑|bike|cycling/, "🚲"], [/睡|sleep|nap/, "🌙"]
  ];
  for (const [pattern, emoji] of rules) if (pattern.test(text)) return emoji;
  let hash = 0;
  for (const char of text) hash = (hash * 33 + (char.codePointAt(0) ?? 0)) >>> 0;
  return icons[hash % icons.length] ?? "✦";
}

function rawText(node: Element | null): string {
  if (!(node instanceof HTMLElement)) return "";
  let text = "";
  Array.from(node.childNodes).forEach((child) => {
    if (child instanceof HTMLElement && (child.classList.contains("spin-choice-emoji") || child.classList.contains("spin-winner-emoji"))) return;
    text += child.textContent ?? "";
  });
  return text.trim();
}

function choices(tool: Element): string[] {
  return Array.from(tool.querySelectorAll(".spin-choice-list li:not(.empty) > span"), (node) => rawText(node)).filter(Boolean);
}

function winner(tool: Element): string {
  return rawText(tool.querySelector(".spin-winner-card strong"));
}

function injectStyles(): void {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = `
.toolbox-panel:has(.spin-wheel-tool){background:linear-gradient(145deg,#31443c,#263934 42%,#1d2d2b)!important;border:2px solid #8e7043!important;box-shadow:0 22px 60px rgba(0,0,0,.55),inset 0 0 0 2px rgba(221,185,105,.11)!important}
.spin-wheel-tool{position:relative;display:flex;flex-direction:column;gap:12px;color:#f0dfba;max-width:760px;margin:0 auto;padding:2px 2px 12px}.spin-wheel-tool button,.spin-wheel-tool select,.spin-wheel-tool input{min-height:44px}
.spin-preset-bar{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:10px;align-items:end;padding:10px 12px;background:linear-gradient(180deg,#142320,#1d2d28);border:1px solid rgba(185,145,74,.58);border-radius:12px}.spin-preset-bar label{display:grid;gap:5px;color:#b9ad91;font-size:11px;letter-spacing:.11em;text-transform:uppercase}.spin-preset-bar select{width:100%;background:#172724;color:#ead9b5;border:1px solid #765f3c;border-radius:8px;padding:0 10px}.spin-preset-bar>button{padding:0 15px;background:#3a493f;color:#e5d4ac;border:1px solid #8c7144;border-radius:8px;font-weight:700}
.spin-wheel-stage{position:relative;display:grid;place-items:center;min-height:330px;padding:18px;border-radius:20px;background:radial-gradient(circle at 50% 43%,#314a45 0 27%,#223632 58%,#152522 100%);border:1px solid #795f37;box-shadow:inset 0 18px 42px rgba(0,0,0,.3),inset 0 0 0 5px rgba(15,29,27,.32)}
.spin-wheel-frame{position:relative;width:min(76vw,330px);aspect-ratio:1;display:grid;place-items:center;border-radius:50%;padding:13px;background:radial-gradient(circle,#c5a05c 0 2%,#604c2f 3% 5%,#d0a85d 6% 7%,#5f4b2f 8% 9%,#9e7b43 10% 11%,#1d2b29 12%);box-shadow:0 13px 24px rgba(0,0,0,.42),inset 0 1px rgba(255,225,149,.34)}.spin-wheel-frame::after{content:"";position:absolute;inset:7px;border-radius:50%;border:1px dashed rgba(244,210,130,.28);pointer-events:none}#app .spin-wheel-canvas{display:block!important;width:100%!important;height:auto!important;aspect-ratio:1/1!important;max-width:none!important;max-height:none!important;filter:saturate(.88) contrast(1.06)}.spin-pointer{z-index:6;color:#e0b65f!important;text-shadow:0 2px 0 #4f3923,0 0 10px rgba(224,182,95,.32);font-size:27px!important;transform:translateY(7px)}
.spin-primary-action{width:min(100%,360px);align-self:center;min-height:54px!important;border-radius:11px!important;background:linear-gradient(#d3ab5d,#a77c39)!important;color:#241b12!important;border:1px solid #e7c57d!important;box-shadow:0 5px 0 #694923,0 8px 16px rgba(0,0,0,.28)!important;font-weight:900!important;letter-spacing:.08em;text-transform:uppercase}.spin-choice-summary{width:100%;display:flex;justify-content:space-between;align-items:center;gap:12px;text-align:left;padding:10px 13px!important;border-radius:11px!important;background:#1d302d!important;border:1px solid #6f5d3b!important;color:#e1d0aa!important}.spin-choice-summary>span{display:grid;gap:3px}.spin-choice-summary small{color:#aa9f85;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:min(58vw,460px)}.spin-choice-summary b{color:#d5b269;font-size:12px}
.spin-choice-editor:not(.open){display:none!important}.spin-choice-sheet,.spin-preset-sheet{position:absolute;z-index:40;inset:10px;display:flex;flex-direction:column;max-height:calc(100% - 20px);overflow:hidden;border-radius:15px;background:linear-gradient(155deg,#30423a,#1d2e2a 65%,#182724);border:1px solid #a17d45;box-shadow:0 20px 48px rgba(0,0,0,.62)}.spin-wheel-tool.choice-sheet-open::after,.spin-wheel-tool.preset-sheet-open::after{content:"";position:absolute;z-index:35;inset:-14px;background:rgba(7,15,14,.58);backdrop-filter:blur(2px);border-radius:18px;pointer-events:none}.spin-choice-sheet-header{display:flex;justify-content:space-between;align-items:center;padding:14px 15px 10px;border-bottom:1px solid rgba(187,147,74,.3)}.spin-choice-sheet-header div{display:grid;gap:2px}.spin-choice-sheet-header small{font-size:10px;letter-spacing:.15em;color:#a79778}.spin-choice-sheet-header strong{font-size:18px;color:#ecdcb8}.spin-choice-sheet-header button{width:44px;min-width:44px;padding:0;border-radius:50%;background:#1b2a27;border:1px solid #765f3c;color:#dfc994;font-size:25px}.spin-choice-sheet-hint{margin:0;padding:10px 15px;color:#aca087;font-size:12px;line-height:1.45;background:rgba(15,27,25,.42)}
.spin-choice-sheet .spin-choice-editor{display:flex!important;min-height:0;flex:1;flex-direction:column;padding:0!important;background:transparent!important;border:0!important}.spin-choice-list{min-height:0;flex:1;overflow:auto;margin:0!important;padding:10px 12px!important;display:grid;align-content:start;gap:7px}.spin-choice-list li{min-height:48px;padding:6px 7px 6px 12px!important;background:#213632!important;border:1px solid rgba(135,108,64,.52)!important;border-radius:9px!important}.spin-choice-list li>span{display:flex;align-items:center;gap:9px;color:#e8d8b4}.spin-choice-emoji{width:27px;text-align:center;font-size:20px}.spin-choice-list button{min-width:44px;border-radius:8px!important;background:#3e3027!important;border:1px solid #76503c!important;color:#dcb39c!important}.spin-choice-add{position:sticky;bottom:0;display:grid!important;grid-template-columns:1fr auto;gap:8px;padding:11px 12px calc(11px + env(safe-area-inset-bottom));background:#182925;border-top:1px solid rgba(183,142,70,.45)}.spin-choice-add input,.spin-preset-menu input{background:#10211e!important;color:#eee0bf!important;border:1px solid #735e3d!important;border-radius:8px!important;padding:0 11px!important}.spin-choice-add button{min-width:72px;border-radius:8px!important;background:#b58b48!important;color:#241b12!important;border:1px solid #d2af68!important;font-weight:800}
.spin-preset-current{margin:10px 13px 0;padding:11px 12px;border-radius:9px;background:#1a2c29;border:1px solid #65563b;display:grid;gap:3px}.spin-preset-current small,.spin-preset-new-title{font-size:10px;letter-spacing:.12em;color:#9f9276}.spin-preset-current strong{color:#ead8b0}.spin-preset-sheet .spin-preset-menu{display:grid!important;gap:12px;padding:12px 13px 15px;background:transparent!important;border:0!important}.spin-preset-menu label{display:grid;gap:6px}.spin-preset-menu>div{display:grid!important;grid-template-columns:1fr 1fr;gap:8px}.spin-preset-menu [data-action="toolbox-preset-create"]{grid-column:1/-1;background:#b58b48!important;color:#241b12!important;border:1px solid #d2af68!important;font-weight:800}.spin-preset-menu [data-action="toolbox-preset-rename"]{background:#31443d!important;color:#e2d2af!important;border:1px solid #715f40!important}.spin-preset-menu [data-action="toolbox-preset-delete"]{background:#352824!important;color:#d9a795!important;border:1px solid #6f493d!important}
.spin-winner-card{position:absolute!important;z-index:20;inset:20px!important;margin:auto!important;width:min(calc(100% - 36px),360px)!important;height:max-content!important;padding:14px!important;border-radius:15px!important;background:linear-gradient(155deg,#33463e,#1b2d29)!important;border:1px solid #d0a457!important;box-shadow:0 18px 48px rgba(0,0,0,.68)!important;text-align:center}.spin-result-topline{display:flex;align-items:center;justify-content:space-between;margin-bottom:5px}.spin-result-topline small{letter-spacing:.12em;color:#b6a98b!important}.spin-result-back{width:42px;min-width:42px!important;min-height:38px!important;padding:0!important;border-radius:9px!important;background:#1b2b28!important;border:1px solid #6d5a3b!important;color:#d5be89!important;font-size:19px!important}.spin-winner-card>strong{display:flex!important;justify-content:center;align-items:center;gap:8px;margin:7px 0 2px;color:#f1ddb0!important;font-size:25px!important}.spin-winner-emoji{font-size:27px}.spin-winner-card>span{color:#b9ac90!important}.spin-result-actions{display:grid!important;grid-template-columns:1fr 1fr;gap:8px;margin-top:14px}.spin-result-actions button{min-height:46px!important;border-radius:9px!important}.spin-result-use{grid-column:1/-1;background:linear-gradient(#d0a85a,#a57a38)!important;color:#241b12!important;border:1px solid #e1bd72!important;font-weight:850}.spin-result-remove{background:#32463e!important;color:#ead9b5!important;border:1px solid #826a43!important}.spin-result-again{background:#1a2c29!important;color:#d6c49e!important;border:1px solid #62543a!important}.spin-result-helper{display:block;margin-top:9px;color:#998d75;font-size:10px;line-height:1.35}
@media(max-width:600px){.spin-wheel-stage{min-height:300px;padding:13px 9px}.spin-wheel-frame{width:min(73vw,306px);padding:11px}.spin-choice-sheet,.spin-preset-sheet{position:fixed;left:8px;right:8px;top:max(8px,env(safe-area-inset-top));bottom:8px;inset-block:auto;max-height:none}.spin-result-actions{grid-template-columns:1fr}.spin-result-use{grid-column:auto}}
@media(max-width:360px){.spin-wheel-frame{width:min(70vw,276px)}.spin-preset-menu>div{grid-template-columns:1fr}}
`;
  document.head.append(style);
}

function installCanvasTheme(): void {
  const marker = CanvasRenderingContext2D.prototype as CanvasRenderingContext2D & { __spinWheelV4?: boolean };
  if (marker.__spinWheelV4) return;
  marker.__spinWheelV4 = true;
  const native = ["#d7ad70", "#8f7154", "#b7c7b0", "#a98968", "#d5c69a", "#6f887e"];
  const palette = ["#3f5f5a", "#8d4c3d", "#b08e4d", "#29434d", "#687553", "#9c6845", "#344f46", "#735e47"];
  const selectedPalette = ["#64847c", "#b9634c", "#d5b15f", "#486979", "#8e986a", "#c68758", "#537164", "#987e60"];
  const originalFill = CanvasRenderingContext2D.prototype.fill;
  const originalText = CanvasRenderingContext2D.prototype.fillText;
  const originalClear = CanvasRenderingContext2D.prototype.clearRect;
  const segmentIndex = new WeakMap<CanvasRenderingContext2D, number>();
  const wheel = (ctx: CanvasRenderingContext2D) => ctx.canvas.classList.contains("spin-wheel-canvas");
  const dynamic = CanvasRenderingContext2D.prototype as unknown as Record<string, unknown>;

  dynamic.clearRect = function(this: CanvasRenderingContext2D, ...args: unknown[]) {
    if (wheel(this)) segmentIndex.set(this, 0);
    (originalClear as unknown as (...values: unknown[]) => void).apply(this, args);
  };
  dynamic.fill = function(this: CanvasRenderingContext2D, ...args: unknown[]) {
    if (!wheel(this)) { (originalFill as unknown as (...values: unknown[]) => void).apply(this, args); return; }
    const current = typeof this.fillStyle === "string" ? this.fillStyle.toLowerCase() : "";
    if (!native.includes(current)) { (originalFill as unknown as (...values: unknown[]) => void).apply(this, args); return; }
    const index = segmentIndex.get(this) ?? 0;
    segmentIndex.set(this, index + 1);
    const tool = this.canvas.closest(".spin-wheel-tool");
    const picked = tool ? winner(tool) : "";
    const isSelected = Boolean(tool && picked && choices(tool)[index] === picked);
    const old = this.fillStyle;
    this.fillStyle = (isSelected ? selectedPalette : palette)[index % palette.length] ?? old;
    (originalFill as unknown as (...values: unknown[]) => void).apply(this, args);
    this.fillStyle = old;
  };
  dynamic.fillText = function(this: CanvasRenderingContext2D, text: unknown, x: unknown, y: unknown, maxWidth?: unknown) {
    if (!wheel(this) || typeof text !== "string" || typeof x !== "number" || typeof y !== "number") {
      const args = maxWidth === undefined ? [text, x, y] : [text, x, y, maxWidth];
      (originalText as unknown as (...values: unknown[]) => void).apply(this, args);
      return;
    }
    const label = text.trim();
    if (!label) return;
    const matrix = this.getTransform();
    const tool = this.canvas.closest(".spin-wheel-tool");
    const isSelected = Boolean(tool && winner(tool) === label);
    this.save();
    this.resetTransform();
    this.textAlign = "center";
    this.textBaseline = "middle";
    this.fillStyle = isSelected ? "#ffe5a2" : "#ead9b5";
    this.shadowColor = isSelected ? "rgba(226,184,94,.8)" : "rgba(0,0,0,.5)";
    this.shadowBlur = isSelected ? 7 : 2;
    this.font = "700 15px Georgia, 'Times New Roman', serif";
    originalText.call(this, label.length > 8 ? `${label.slice(0, 7)}…` : label, matrix.e, matrix.f - 10, 102);
    this.shadowBlur = 0;
    this.font = "23px 'Apple Color Emoji','Segoe UI Emoji','Noto Color Emoji',sans-serif";
    originalText.call(this, emojiFor(label), matrix.e, matrix.f + 17);
    this.restore();
  };
}

function decorateChoices(tool: HTMLElement): void {
  tool.querySelectorAll(".spin-choice-list li:not(.empty)").forEach((row) => {
    const label = row.querySelector("span");
    if (!(label instanceof HTMLElement)) return;
    const raw = rawText(label);
    let icon = label.querySelector(".spin-choice-emoji");
    if (!icon) { icon = document.createElement("span"); icon.className = "spin-choice-emoji"; icon.setAttribute("aria-hidden", "true"); label.prepend(icon); }
    icon.textContent = emojiFor(raw);
  });
  const summary = tool.querySelector(".spin-choice-summary small");
  if (summary) summary.textContent = choices(tool).slice(0, 3).map((value) => `${emojiFor(value)} ${value}`).join(" · ") || "Add a choice to begin.";
}

function decorateWinner(tool: HTMLElement): void {
  const card = tool.querySelector<HTMLElement>(".spin-winner-card");
  if (!card || card.dataset.flowV4) return;
  const picked = winner(tool);
  if (!picked) return;
  card.dataset.flowV4 = "true";
  const index = Math.max(0, choices(tool).findIndex((value) => value === picked));
  const strong = card.querySelector<HTMLElement>("strong");
  if (strong) { const icon = document.createElement("span"); icon.className = "spin-winner-emoji"; icon.textContent = emojiFor(picked); strong.prepend(icon); }
  const label = card.querySelector(":scope > small");
  if (label) {
    const top = document.createElement("div"); top.className = "spin-result-topline"; label.before(top); top.append(label);
    const back = document.createElement("button"); back.type = "button"; back.className = "spin-result-back"; back.dataset.action = "toolbox-spin-keep"; back.setAttribute("aria-label", "Back to wheel"); back.textContent = "←"; top.append(back);
  }
  const actionDiv = Array.from(card.children).find((child) => child.tagName === "DIV" && !child.classList.contains("spin-result-topline"));
  if (!(actionDiv instanceof HTMLElement)) return;
  actionDiv.className = "spin-result-actions";
  actionDiv.replaceChildren();
  const use = document.createElement("button"); use.type = "button"; use.className = "spin-result-use"; use.dataset.action = "toolbox-spin-keep"; use.textContent = "Use result";
  const remove = document.createElement("button"); remove.type = "button"; remove.className = "spin-result-remove"; remove.dataset.action = "toolbox-spin-remove"; remove.dataset.index = String(index); remove.textContent = "Use & remove";
  const again = document.createElement("button"); again.type = "button"; again.className = "spin-result-again"; again.dataset.action = "toolbox-spin"; again.textContent = "Spin again";
  actionDiv.append(use, remove, again);
  const helper = document.createElement("small"); helper.className = "spin-result-helper"; helper.textContent = "Use & remove excludes the picked choice from the next round."; actionDiv.after(helper);
}

function decorateSheets(tool: HTMLElement): void {
  const editor = tool.querySelector<HTMLElement>(".spin-choice-editor.open");
  if (editor) {
    let sheet = tool.querySelector<HTMLElement>(".spin-choice-sheet");
    if (!sheet) { sheet = document.createElement("section"); sheet.className = "spin-choice-sheet"; sheet.setAttribute("role", "dialog"); sheet.innerHTML = `<header class="spin-choice-sheet-header"><div><small>SPIN WHEEL</small><strong>Edit choices</strong></div><button type="button" data-action="toolbox-spin-edit" aria-label="Done editing choices">×</button></header><p class="spin-choice-sheet-hint">Add people or options here. A picked choice stays until you choose <b>Use & remove</b>.</p>`; tool.append(sheet); }
    if (editor.parentElement !== sheet) sheet.append(editor);
    tool.classList.add("choice-sheet-open");
  } else { tool.querySelector(".spin-choice-sheet")?.remove(); tool.classList.remove("choice-sheet-open"); }

  const menu = tool.querySelector<HTMLElement>(".spin-preset-menu");
  if (menu) {
    let sheet = tool.querySelector<HTMLElement>(".spin-preset-sheet");
    if (!sheet) { sheet = document.createElement("section"); sheet.className = "spin-preset-sheet"; sheet.setAttribute("role", "dialog"); sheet.innerHTML = `<header class="spin-choice-sheet-header"><div><small>SPIN WHEEL</small><strong>Preset settings</strong></div><button type="button" data-action="toolbox-preset-menu" aria-label="Close preset settings">×</button></header><p class="spin-choice-sheet-hint">Keep separate wheels for different situations.</p><div class="spin-preset-current"><small>CURRENT PRESET</small><strong></strong></div>`; tool.append(sheet); }
    if (menu.parentElement !== sheet) sheet.append(menu);
    tool.classList.add("preset-sheet-open");
    const select = tool.querySelector<HTMLSelectElement>("[data-toolbox-field='spin-preset']");
    const current = sheet.querySelector(".spin-preset-current strong"); if (current) current.textContent = select?.selectedOptions[0]?.textContent ?? "Current preset";
    const input = menu.querySelector<HTMLInputElement>("[data-toolbox-field='spin-preset-name']");
    if (input) { input.placeholder = "New preset name…"; const label = input.closest("label"); if (label && !label.querySelector(".spin-preset-new-title")) { const title = document.createElement("span"); title.className = "spin-preset-new-title"; title.textContent = "CREATE NEW PRESET"; label.prepend(title); } }
    const create = menu.querySelector("[data-action='toolbox-preset-create']"); if (create) create.textContent = "+ Create preset";
    const rename = menu.querySelector("[data-action='toolbox-preset-rename']"); if (rename) rename.textContent = "Rename current";
    const remove = menu.querySelector("[data-action='toolbox-preset-delete']"); if (remove) remove.textContent = "Delete current";
  } else { tool.querySelector(".spin-preset-sheet")?.remove(); tool.classList.remove("preset-sheet-open"); }
}

function decorate(): void {
  const tool = document.querySelector<HTMLElement>(".spin-wheel-tool");
  if (!tool) return;
  tool.dataset.spinEnhancement = "v4-bundled";
  const more = tool.querySelector<HTMLElement>("[data-action='toolbox-preset-menu']"); if (more && !more.closest(".spin-preset-sheet")) more.textContent = "Edit";
  const canvas = tool.querySelector(".spin-wheel-canvas");
  if (canvas && !canvas.closest(".spin-wheel-frame")) { const frame = document.createElement("div"); frame.className = "spin-wheel-frame"; canvas.before(frame); frame.append(canvas); }
  decorateChoices(tool); decorateWinner(tool); decorateSheets(tool);
}

export function installSpinWheelEnhancement(): void {
  injectStyles();
  installCanvasTheme();
  let frame = 0;
  const schedule = () => { if (frame) return; frame = requestAnimationFrame(() => { frame = 0; decorate(); }); };
  const observer = new MutationObserver((mutations) => { if (mutations.some((mutation) => mutation.type === "childList" && (mutation.addedNodes.length || mutation.removedNodes.length))) schedule(); });
  observer.observe(document.documentElement, { subtree: true, childList: true });
  if (document.readyState === "loading") window.addEventListener("DOMContentLoaded", schedule, { once: true }); else schedule();
}
