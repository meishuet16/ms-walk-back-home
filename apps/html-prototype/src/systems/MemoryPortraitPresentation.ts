import type { DialoguePortrait, DialoguePortraitConfig } from "./PresentationRenderer.js";
import { normalizeLocalAssetPath, renderRpgDialogue } from "./PresentationRenderer.js";

export type MemoryPortraitViewport = {
  orientation: "portrait" | "landscape";
  width: number;
  height: number;
};

export type MemoryPortraitLayout = {
  portrait: DialoguePortraitConfig;
  width: number;
  height: number;
  fit: "contain";
  position: "center-top" | "center";
};

export type MemoryPortraitRenderOptions = {
  portrait: DialoguePortrait;
  speaker: string;
  text: string;
  layout: MemoryPortraitLayout;
  canAdvance: boolean;
  action?: string;
  presentationClassName?: string;
  presentationId?: string;
  presentationData?: string;
  nextButtonClassName?: string;
  nextButtonAriaLabel?: string;
};

export type MemoryDialogueRenderOptions = {
  speaker: string;
  text: string;
  portrait?: DialoguePortrait;
  viewport: MemoryPortraitViewport;
  action: string;
};

export type AuthoredPortraitDialogueLine = {
  speaker: string;
  text: string;
};

export type AuthoredPortraitBeat = {
  portrait: DialoguePortrait;
  dialogue: AuthoredPortraitDialogueLine[];
};

export type AuthoredPortraitSequence = {
  id: string;
  beats: AuthoredPortraitBeat[];
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function positiveOrFallback(value: number, fallback: number): number {
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

export function resolveMemoryPortraitLayout(
  portrait: DialoguePortrait,
  viewport: MemoryPortraitViewport,
): MemoryPortraitLayout {
  const config: DialoguePortraitConfig = typeof portrait === "string" ? { src: portrait } : { ...portrait };
  const viewportWidth = positiveOrFallback(viewport.width, 390);
  const viewportHeight = positiveOrFallback(viewport.height, 844);
  const isPortrait = viewport.orientation === "portrait";
  const defaultWidth = isPortrait ? viewportWidth * 0.88 : Math.min(viewportWidth * 0.42, 620);
  const width = Math.min(positiveOrFallback(config.width ?? defaultWidth, defaultWidth), viewportWidth);
  const defaultHeight = isPortrait ? width * (9 / 16) : Math.min(viewportHeight * 0.72, 420);
  const height = Math.min(positiveOrFallback(config.height ?? defaultHeight, defaultHeight), viewportHeight);

  return {
    portrait: config,
    width,
    height,
    fit: "contain",
    position: isPortrait ? "center-top" : "center",
  };
}

export function renderMemoryPortrait(options: MemoryPortraitRenderOptions): string {
  const src = normalizeLocalAssetPath(options.layout.portrait.src);
  if (!src) return "";
  const className = options.presentationClassName ?? "memory-portrait";
  const id = options.presentationId ? " id=\"" + escapeHtml(options.presentationId) + "\"" : "";
  const dataPresentation = options.presentationData ?? "memory-portrait";
  const action = options.action ?? "memory-portrait-next";
  const offsetX = options.layout.portrait.offsetX ?? 0;
  const offsetY = options.layout.portrait.offsetY ?? 0;
  const position = options.layout.position === "center-top" ? "center top" : "center center";
  const style = [
    "max-width:" + options.layout.width + "px",
    "max-height:" + options.layout.height + "px",
    "object-fit:" + options.layout.fit,
    "object-position:" + position,
    "transform:translate(" + offsetX + "px," + offsetY + "px)",
  ].join(";");
  const buttonClass = options.nextButtonClassName ?? "memory-portrait-next";
  const ariaLabel = options.nextButtonAriaLabel ? " aria-label=\"" + escapeHtml(options.nextButtonAriaLabel) + "\"" : "";
  const nextButton = options.canAdvance
    ? "<button class=\"" + escapeHtml(buttonClass) + "\" type=\"button\" data-action=\"" + escapeHtml(action) + "\"" + ariaLabel + ">&#9660;</button>"
    : "";

  return "<div class=\"" + escapeHtml(className) + "\"" + id + " data-presentation=\"" + escapeHtml(dataPresentation) + "\">" +
    "<div class=\"memory-portrait-art\"><img class=\"memory-portrait-image\" src=\"" + escapeHtml(src) +
    "\" alt=\"\" style=\"" + escapeHtml(style) + "\"></div>" +
    "<div class=\"memory-portrait-dialogue\"><span>" + escapeHtml(options.speaker) + "</span><p>" +
    escapeHtml(options.text) + "</p>" + nextButton + "</div></div>";
}

export function renderMemoryDialogue(options: MemoryDialogueRenderOptions): string {
  if (!options.portrait) {
    return renderRpgDialogue({ speaker: options.speaker, text: options.text, action: options.action });
  }

  return renderMemoryPortrait({
    portrait: options.portrait,
    speaker: options.speaker,
    text: options.text,
    layout: resolveMemoryPortraitLayout(options.portrait, options.viewport),
    canAdvance: true,
    action: options.action,
  });
}

export function renderMemoryPortraitSequenceBeat(
  sequence: AuthoredPortraitSequence,
  beatIndex: number,
  dialogueIndex: number,
  viewport: MemoryPortraitViewport,
  action = "portrait-sequence-next"
): string {
  const beat = sequence.beats[beatIndex];
  const line = beat?.dialogue[dialogueIndex];
  if (!beat || !line) return "";
  const layout = resolveMemoryPortraitLayout(beat.portrait, viewport);
  return renderMemoryPortrait({
    portrait: beat.portrait,
    speaker: line.speaker,
    text: line.text,
    layout,
    canAdvance: true,
    action,
    presentationClassName: "memory-portrait portrait-sequence",
    presentationId: "portrait-sequence",
    presentationData: "portrait-sequence",
    nextButtonAriaLabel: "Continue"
  });
}
