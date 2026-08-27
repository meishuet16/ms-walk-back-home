export const MUJI_ATLAS_COLUMNS = 6;
export const MUJI_ATLAS_ROWS = 8;
export const MUJI_IDLE_FRAME_MS = 420;
export const MUJI_WALK_FRAME_MS = 140;

export const MUJI_DRAW_WIDTH = 48;
export const MUJI_DRAW_HEIGHT = 56;
export const MUJI_DRAW_OFFSET_X = -24;
export const MUJI_DRAW_OFFSET_Y = -58;
export const MUJI_FRAME_VISUAL_SCALE = MUJI_DRAW_HEIGHT / 192;

export const MUJI_DIRECTIONS = ["down", "left", "right", "up"] as const;
export type MujiDirection = (typeof MUJI_DIRECTIONS)[number];
export type MujiAnimation = "idle" | "walk";

export type MujiFrame = {
  id: string;
  path: string;
  animation: MujiAnimation;
  direction: MujiDirection;
  cropOrigin: { x: number; y: number };
  sourceSize: { width: number; height: number };
  sourceCell: { x: number; y: number; width: number; height: number };
};

type Crop = { x: number; y: number; w: number; h: number };

// These are the crop origins supplied with the 48 production PNGs. They stay
// in source-atlas space so the renderer can compensate for cropped padding.
const MUJI_CROPS: readonly Crop[] = [
  { x: 7, y: 0, w: 160, h: 192 },
  { x: 161.9340659340659, y: 0, w: 160, h: 192 },
  { x: 325, y: 2, w: 160, h: 192 },
  { x: 473.8131868131869, y: 0, w: 160, h: 192 },
  { x: 630.8131868131868, y: 0, w: 160, h: 192 },
  { x: 789, y: 0, w: 160, h: 192 },
  { x: 7, y: 173.5604395604396, w: 160, h: 192 },
  { x: 173, y: 176.37362637362634, w: 160, h: 192 },
  { x: 322.1208791208791, y: 176.74725274725273, w: 160, h: 192 },
  { x: 482.4395604395604, y: 176.5604395604396, w: 160, h: 192 },
  { x: 634.3736263736263, y: 181.8131868131868, w: 160, h: 192 },
  { x: 785.7472527472527, y: 179.74725274725276, w: 157.3736263736264, h: 192 },
  { x: 1, y: 354, w: 160, h: 192 },
  { x: 164.1868131868132, y: 357.2527472527472, w: 160, h: 192 },
  { x: 327.8131868131868, y: 357.74725274725273, w: 160, h: 192 },
  { x: 491.065934065934, y: 354.1868131868132, w: 160, h: 192 },
  { x: 631.7472527472528, y: 359.934065934066, w: 160, h: 192 },
  { x: 778, y: 354, w: 160, h: 192 },
  { x: 0, y: 537.3736263736264, w: 160, h: 192 },
  { x: 161.93406593406596, y: 536.9340659340659, w: 160, h: 192 },
  { x: 321.56043956043953, y: 542.9340659340659, w: 160, h: 192 },
  { x: 473.6263736263736, y: 540.3076923076923, w: 160, h: 192 },
  { x: 625.6263736263736, y: 535, w: 160, h: 192 },
  { x: 785.8131868131868, y: 537.3736263736264, w: 160, h: 192 },
  { x: 5.626373626373621, y: 720.3736263736264, w: 160, h: 192 },
  { x: 178, y: 720, w: 160, h: 192 },
  { x: 324.5604395604396, y: 720.1868131868132, w: 160, h: 192 },
  { x: 474.1868131868132, y: 723, w: 160, h: 192 },
  { x: 625.7472527472528, y: 720.3736263736263, w: 160, h: 192 },
  { x: 780.3736263736263, y: 720.1868131868132, w: 160, h: 192 },
  { x: 9.747252747252745, y: 893.3736263736263, w: 160, h: 192 },
  { x: 170, y: 890.7472527472528, w: 160, h: 192 },
  { x: 325.1208791208791, y: 902.3736263736264, w: 160, h: 192 },
  { x: 482.5604395604396, y: 899.3736263736264, w: 160, h: 192 },
  { x: 636.4395604395604, y: 899, w: 160, h: 192 },
  { x: 786.3736263736264, y: 896, w: 160, h: 192 },
  { x: 14.065934065934059, y: 1076.7472527472528, w: 160, h: 192 },
  { x: 167, y: 1076, w: 160, h: 192 },
  { x: 321.9340659340659, y: 1076, w: 160, h: 192 },
  { x: 479.2527472527473, y: 1079, w: 160, h: 192 },
  { x: 625.5604395604395, y: 1079.1868131868132, w: 160, h: 192 },
  { x: 777.3736263736264, y: 1085, w: 160, h: 192 },
  { x: 2.813186813186803, y: 1258.7472527472528, w: 160, h: 192 },
  { x: 166.6263736263736, y: 1261.7472527472528, w: 160, h: 192 },
  { x: 324.99999999999994, y: 1262.1868131868132, w: 160, h: 192 },
  { x: 474.1868131868132, y: 1267.5604395604396, w: 160, h: 192 },
  { x: 628.3736263736263, y: 1264.5604395604396, w: 160, h: 192 },
  { x: 772.3736263736264, y: 1267.3736263736264, w: 160, h: 192 }
];

const MUJI_SOURCE_CELL_WIDTH = 160;
const MUJI_SOURCE_ROW_PITCH = 180;
const MUJI_SOURCE_ANCHOR = { x: 80, y: 180 };

const stateForIndex = (index: number): { animation: MujiAnimation; direction: MujiDirection } => ({
  animation: index < 24 ? "idle" : "walk",
  direction: MUJI_DIRECTIONS[Math.floor(index / 6) % MUJI_DIRECTIONS.length]
});

export const MUJI_FRAME_REGISTRY: readonly MujiFrame[] = MUJI_CROPS.map((crop, index) => {
  const { animation, direction } = stateForIndex(index);
  const column = index % MUJI_ATLAS_COLUMNS;
  const row = Math.floor(index / MUJI_ATLAS_COLUMNS);
  return {
    id: `muji-${String(index + 1).padStart(2, "0")}`,
    path: `assets/muji-sheet-v2/muji-${String(index + 1).padStart(2, "0")}.png`,
    animation,
    direction,
    cropOrigin: { x: crop.x, y: crop.y },
    sourceSize: { width: crop.w, height: crop.h },
    sourceCell: {
      x: column * MUJI_SOURCE_CELL_WIDTH,
      y: row * MUJI_SOURCE_ROW_PITCH,
      width: MUJI_SOURCE_CELL_WIDTH,
      height: crop.h
    }
  };
});

export function getMujiFrame(direction: MujiDirection, animation: MujiAnimation, time: number): MujiFrame {
  const frames = MUJI_FRAME_REGISTRY.filter((frame) => frame.direction === direction && frame.animation === animation);
  return frames[Math.floor(Math.max(0, time) / (animation === "walk" ? MUJI_WALK_FRAME_MS : MUJI_IDLE_FRAME_MS)) % frames.length];
}

export type MujiDrawPlacement = {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  anchorWorldX: number;
  anchorWorldY: number;
};

export function getMujiDrawPlacement(
  frame: MujiFrame,
  imageWidth: number,
  imageHeight: number,
  worldPosition: { x: number; y: number },
  visualScale: number
): MujiDrawPlacement {
  const anchorX = frame.sourceCell.x + MUJI_SOURCE_ANCHOR.x - frame.cropOrigin.x;
  const anchorY = frame.sourceCell.y + MUJI_SOURCE_ANCHOR.y - frame.cropOrigin.y;
  return {
    id: frame.id,
    x: worldPosition.x - anchorX * visualScale,
    y: worldPosition.y - anchorY * visualScale,
    width: imageWidth * visualScale,
    height: imageHeight * visualScale,
    anchorWorldX: worldPosition.x,
    anchorWorldY: worldPosition.y
  };
}
