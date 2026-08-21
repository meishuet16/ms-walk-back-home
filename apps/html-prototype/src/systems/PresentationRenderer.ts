export type DialoguePortraitConfig = {
  src: string;
  width?: number;
  height?: number;
  offsetX?: number;
  offsetY?: number;
};

export type DialoguePortrait = string | DialoguePortraitConfig;
export type DialoguePresentation = "vn" | "rpg";
export type MemoryOverlayPresentation = "reflection-choice" | "reflection";

export type DialoguePortraitRenderModel =
  | { kind: "empty" }
  | { kind: "image"; config: DialoguePortraitConfig; alt?: string; className?: string }
  | { kind: "sprite"; className: string; ariaLabel?: string }
  | { kind: "group"; className: string; children: DialoguePortraitRenderModel[]; ariaLabel?: string }
  | {
      kind: "crop";
      width: number;
      height: number;
      backgroundImage: string;
      backgroundSize: string;
      backgroundPosition: string;
      className?: string;
      ariaLabel?: string;
    };

export type VnDialogueOptions = {
  speaker: string;
  text: string;
  portrait?: DialoguePortraitRenderModel;
  response?: string;
  actions: string;
};

export type RpgDialogueOptions = {
  speaker: string;
  text: string;
  action: string;
};

export type ReflectionChoice = {
  id: string;
  label: string;
  subtitle?: string;
};

export type ReflectionChoiceOptions = {
  prompt: string;
  choices: ReflectionChoice[];
  kicker?: string;
  title?: string;
  action?: string;
};

export type ReflectionOptions = {
  lines: string[];
  actions: string;
  kicker?: string;
  title?: string;
  leadLines?: string[];
  closureLines?: string[];
  quoteLines?: string[];
  afterline?: string;
};

export function normalizeLocalAssetPath(path: string): string | null {
  if (typeof path !== "string" || !path || path.startsWith("//") || path.includes("\\")) return null;
  if (/^[a-z][a-z\d+.-]*:/i.test(path) || /^[a-zA-Z]:[\\/]/.test(path)) return null;
  const normalized = path.startsWith("/assets/") ? path.slice(1) : path;
  if (!normalized.startsWith("assets/") || normalized.split("/").some((segment) => segment === "..")) return null;
  return normalized.length > "assets/".length ? normalized : null;
}

export function renderDialoguePortrait(model: DialoguePortraitRenderModel): string {
  if (model.kind === "empty") return "";
  if (model.kind === "group") return renderDialoguePortraits(model.children, model.className, model.ariaLabel);
  if (model.kind === "sprite") {
    const className = safeClassName(model.className);
    if (!className) return "";
    const label = model.ariaLabel ? ` role="img" aria-label="${escapeHtml(model.ariaLabel)}"` : "";
    return `<div class="${className}"${label}></div>`;
  }
  if (model.kind === "crop") {
    const backgroundImage = normalizeLocalAssetPath(model.backgroundImage);
    if (!backgroundImage || !positive(model.width) || !positive(model.height)) return "";
    const className = safeClassName(model.className ?? "dialogue-portrait-crop");
    const label = model.ariaLabel ? ` role="img" aria-label="${escapeHtml(model.ariaLabel)}"` : ` aria-hidden="true"`;
    return `<span class="${className}"${label} style="width:${px(model.width)};height:${px(model.height)};background-size:${escapeStyleValue(model.backgroundSize)};background-position:${escapeStyleValue(model.backgroundPosition)};background-image:url('${escapeCssUrl(backgroundImage)}')"></span>`;
  }

  const src = normalizeLocalAssetPath(model.config.src);
  if (!src) return "";
  const style = portraitImageStyle(model.config);
  const alt = model.alt ? escapeHtml(model.alt) : "";
  const className = safeClassName(`dialogue-portrait-image${model.className ? ` ${model.className}` : ""}`);
  if (!className) return "";
  return `<img class="${className}" src="${escapeHtml(src)}" alt="${alt}"${style ? ` style="${style}"` : ""}>`;
}

export function renderDialoguePortraits(models: DialoguePortraitRenderModel[], className = "dialogue-portrait-group", ariaLabel?: string): string {
  const safeGroupClass = safeClassName(className);
  if (!safeGroupClass) return "";
  const label = ariaLabel ? ` role="img" aria-label="${escapeHtml(ariaLabel)}"` : "";
  return `<div class="${safeGroupClass}"${label}>${models.map(renderDialoguePortrait).join("")}</div>`;
}

export function renderVnDialogue(options: VnDialogueOptions): string {
  const response = options.response ? `<p class="memory-line">${escapeHtml(options.response)}</p>` : "";
  return `<div class="vn" data-presentation="vn"><div class="vn-portrait">${renderDialoguePortrait(options.portrait ?? { kind: "empty" })}</div><div><h3>${escapeHtml(options.speaker)}</h3><p>${escapeHtml(options.text)}</p>${response}<div class="choices">${options.actions}</div></div></div>`;
}

export function renderRpgDialogue(options: RpgDialogueOptions): string {
  return `<div class="rpg-dialogue" data-presentation="rpg"><span>${escapeHtml(options.speaker)}</span><p>${escapeHtml(options.text)}</p><button data-action="${escapeHtml(options.action)}" aria-label="Continue">▼</button></div>`;
}

export function renderReflectionChoice(options: ReflectionChoiceOptions): string {
  const kicker = options.kicker ? `<span class="ending-kicker">${escapeHtml(options.kicker)}</span>` : "";
  const title = options.title ? `<h2>${escapeHtml(options.title)}</h2>` : "";
  const prompt = options.prompt ? `<p>${escapeHtml(options.prompt)}</p>` : "";
  const choices = options.choices.map((choice) => {
    const subtitle = choice.subtitle ? `<small>${escapeHtml(choice.subtitle)}</small>` : "";
    const action = options.action ?? "reflection-choice";
    return `<button class="reflection-choice-card" data-action="${escapeHtml(action)}" data-choice="${escapeHtml(choice.id)}"><span>${escapeHtml(choice.label)}</span>${subtitle}</button>`;
  }).join("");
  return `<div class="reflection-choice-ui" data-presentation="reflection-choice">${kicker}${title}${prompt}<div class="reflection-choice-list">${choices}</div></div>`;
}

export function renderReflection(options: ReflectionOptions): string {
  const kicker = options.kicker ? `<span class="ending-kicker">${escapeHtml(options.kicker)}</span>` : "";
  const title = options.title ? `<h2>${escapeHtml(options.title)}</h2>` : "";
  const lead = options.leadLines?.length ? `<p class="memory-line">${linesMarkup(options.leadLines)}</p>` : "";
  const closure = options.closureLines?.length ? `<p>${linesMarkup(options.closureLines)}</p>` : "";
  const quoteLines = options.quoteLines ?? options.lines;
  const quote = `<blockquote>${linesMarkup(quoteLines)}</blockquote>`;
  const afterline = options.afterline ? `<p class="ending-afterline">${escapeHtml(options.afterline)}</p>` : "";
  return `<div class="reflection" data-presentation="reflection">${kicker}${title}${lead}${closure}${quote}${afterline}${options.actions}</div>`;
}

function portraitImageStyle(config: DialoguePortraitConfig): string {
  const rules: string[] = [];
  if (positive(config.width)) rules.push(`max-width:${px(config.width)}`);
  if (positive(config.height)) rules.push(`max-height:${px(config.height)}`);
  if (finite(config.offsetX) || finite(config.offsetY)) rules.push(`transform:translate(${px(config.offsetX ?? 0)}, ${px(config.offsetY ?? 0)})`);
  return rules.join(";");
}

function linesMarkup(lines: string[]): string {
  return lines.map(escapeHtml).join("<br>");
}

function positive(value: number | undefined): value is number {
  return typeof value === "number" && Number.isFinite(value) && value > 0;
}

function finite(value: number | undefined): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function px(value: number): string {
  return `${value}px`;
}

function safeClassName(value: string): string {
  const names = value.trim().split(/\s+/);
  return names.every((name) => /^[A-Za-z][A-Za-z0-9_-]*$/.test(name)) ? names.join(" ") : "";
}

function escapeCssUrl(value: string): string {
  return value.replace(/[\\'\n\r()]/g, "");
}

function escapeStyleValue(value: string): string {
  return value.replace(/[;{}<>\n\r]/g, "");
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>\"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" })[character] ?? character);
}
