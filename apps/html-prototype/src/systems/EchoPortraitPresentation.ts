import {
  renderMemoryPortrait,
  resolveMemoryPortraitLayout,
  type MemoryPortraitLayout,
  type MemoryPortraitViewport,
} from "./MemoryPortraitPresentation.js";
import type { DialoguePortrait } from "./PresentationRenderer.js";

export type EchoPortraitId =
  | "june24-angela-st-echo"
  | "june24-room-study-echo"
  | "june24-haircut-echo"
  | (string & {});

export type EchoPortraitViewport = MemoryPortraitViewport;

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
  "june24-haircut-echo": "assets/624/echo-portraits/group-echoes/02-haircut-home-invite.png",
};

export function resolveEchoPortraitLayout(
  echoId: EchoPortraitId,
  viewport: EchoPortraitViewport,
): EchoPortraitLayout {
  const asset = echoPortraitAssets[echoId];
  if (!asset) throw new Error("Missing Echo Portrait asset: " + echoId);
  const layout: MemoryPortraitLayout = resolveMemoryPortraitLayout(asset, viewport);
  return {
    asset,
    width: layout.width,
    height: layout.height,
    fit: layout.fit,
    position: layout.position,
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
  const portrait: DialoguePortrait = { src: options.layout.asset };
  return renderMemoryPortrait({
    portrait,
    speaker: options.speaker,
    text: options.text,
    layout: {
      portrait,
      width: options.layout.width,
      height: options.layout.height,
      fit: options.layout.fit,
      position: options.layout.position,
    },
    canAdvance: options.canAdvance,
    action: options.action,
    presentationClassName: "memory-portrait echo-portrait",
    presentationId: "echo-portrait",
    presentationData: "echo-portrait",
    nextButtonClassName: "echo-portrait-next",
    nextButtonAriaLabel: "Continue",
  });
}
