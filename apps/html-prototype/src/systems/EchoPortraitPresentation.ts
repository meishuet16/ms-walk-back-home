import { normalizeLocalAssetPath } from "./PresentationRenderer.js";

export type EchoPortraitId = "june24-angela-st-echo" | "june24-room-study-echo" | "june24-haircut-echo" | (string & {});
export type EchoPortraitViewport = { orientation: "portrait" | "landscape"; width: number; height: number };
export type EchoPortraitLayout = {
  asset: string;
  width: number;
  height: number;
  fit: "contain";
  position: "center-top" | "center";
};

const echoPortraitAssets: Record<string, string> = {
  "june24-angela-st-echo": "assets/624/echo-portraits/group-echoes/01-morning-angela-st.png",
  "june24-room-study-echo": "assets/624/echo-portraits/et-portraits/03-guilt-quiet.png",
  "june24-haircut-echo": "assets/624/echo-portraits/group-echoes/02-haircut-home-invite.png"
};

export function resolveEchoPortraitLayout(echoId: EchoPortraitId, viewport: EchoPortraitViewport): EchoPortraitLayout {
  const asset = echoPortraitAssets[echoId];
  if (!asset) throw new Error(`Missing Echo Portrait asset: ${echoId}`);
  const safeWidth = Number.isFinite(viewport.width) && viewport.width > 0 ? viewport.width : 390;
  const safeHeight = Number.isFinite(viewport.height) && viewport.height > 0 ? viewport.height : 844;
  const portrait = viewport.orientation === "portrait";
  return {
    asset,
    width: portrait ? Math.min(safeWidth * 0.82, 420) : Math.min(safeWidth * 0.42, 620),
    height: portrait ? Math.min(safeHeight * 0.48, 520) : Math.min(safeHeight * 0.72, 420),
    fit: "contain",
    position: portrait ? "center-top" : "center"
  };
}

export type EchoPortraitRenderOptions = {
  echoId: EchoPortraitId;
  speaker: string;
  text: string;
  layout: EchoPortraitLayout;
  canAdvance: boolean;
  action?: string;
};

export function renderEchoPortrait(options: EchoPortraitRenderOptions): string {
  const asset = normalizeLocalAssetPath(options.layout.asset);
  if (!asset) return "";
  const action = options.action ?? "echo-portrait-next";
  const button = options.canAdvance ? `<button class="echo-portrait-next" data-action="${escapeHtml(action)}" aria-label="Continue">▼</button>` : "";
  return `<div class="echo-portrait" data-presentation="echo-portrait"><div class="echo-portrait-art"><img src="${escapeHtml(asset)}" alt="" style="max-width:${px(options.layout.width)};max-height:${px(options.layout.height)};object-fit:${options.layout.fit};object-position:center"></div><div class="echo-portrait-dialogue"><span>${escapeHtml(options.speaker)}</span><p>${escapeHtml(options.text)}</p>${button}</div></div>`;
}

function px(value: number): string { return `${Math.max(1, value)}px`; }
function escapeHtml(value: string): string { return value.replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" })[character] ?? character); }
