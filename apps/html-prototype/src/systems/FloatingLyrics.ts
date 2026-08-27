import type { LyricsOverlayState } from "../types.js";

export const FLOATING_LYRICS_MIN_WIDTH = 96;
export const FLOATING_LYRICS_MAX_WIDTH = 520;
export const FLOATING_LYRICS_MIN_HEIGHT = 44;
export const FLOATING_LYRICS_MAX_HEIGHT = 260;
export const FLOATING_LYRICS_EDGE_MARGIN = 8;
export const FLOATING_LYRICS_DRAG_THRESHOLD = 6;

export type FloatingLyricsPresentationMode = "large" | "compact" | "mini";

function clampDimension(value: number | undefined, minimum: number, maximum: number): number {
  return Math.max(minimum, Math.min(maximum, Number.isFinite(value) ? value as number : minimum));
}

export function clampFloatingLyricsOverlay(overlay: LyricsOverlayState, stageWidth: number, stageHeight: number): Required<LyricsOverlayState> {
  const width = clampDimension(overlay.width, FLOATING_LYRICS_MIN_WIDTH, FLOATING_LYRICS_MAX_WIDTH);
  const height = clampDimension(overlay.height, FLOATING_LYRICS_MIN_HEIGHT, FLOATING_LYRICS_MAX_HEIGHT);
  const maxX = Math.max(FLOATING_LYRICS_EDGE_MARGIN, stageWidth - width - FLOATING_LYRICS_EDGE_MARGIN);
  const maxY = Math.max(FLOATING_LYRICS_EDGE_MARGIN, stageHeight - height - FLOATING_LYRICS_EDGE_MARGIN);
  return {
    x: Math.max(FLOATING_LYRICS_EDGE_MARGIN, Math.min(maxX, Number.isFinite(overlay.x) ? overlay.x : FLOATING_LYRICS_EDGE_MARGIN)),
    y: Math.max(FLOATING_LYRICS_EDGE_MARGIN, Math.min(maxY, Number.isFinite(overlay.y) ? overlay.y : FLOATING_LYRICS_EDGE_MARGIN)),
    width,
    height
  };
}

export function resizeFloatingLyricsOverlay(
  overlay: LyricsOverlayState,
  deltaX: number,
  deltaY: number,
  stageWidth: number,
  stageHeight: number
): Required<LyricsOverlayState> {
  return clampFloatingLyricsOverlay({
    ...overlay,
    width: (overlay.width ?? 280) + deltaX,
    height: (overlay.height ?? 116) + deltaY
  }, stageWidth, stageHeight);
}

export function floatingLyricsPresentationMode(width: number, height: number): FloatingLyricsPresentationMode {
  if (width >= 220 && height >= 108) return "large";
  if (width >= 150 && height >= 72) return "compact";
  return "mini";
}

export function isFloatingLyricsDrag(startX: number, startY: number, currentX: number, currentY: number, threshold = FLOATING_LYRICS_DRAG_THRESHOLD): boolean {
  return Math.hypot(currentX - startX, currentY - startY) > threshold;
}
