export const MUJI_ATLAS_COLUMNS = 6;
export const MUJI_ATLAS_ROWS = 8;
export const MUJI_IDLE_FRAME_MS = 420;
export const MUJI_WALK_FRAME_MS = 140;

export const MUJI_DRAW_WIDTH = 48;
export const MUJI_DRAW_HEIGHT = 56;
export const MUJI_DRAW_OFFSET_X = -24;
export const MUJI_DRAW_OFFSET_Y = -58;

export const MUJI_DIRECTIONS = ["down", "left", "right", "up"] as const;
export type MujiDirection = (typeof MUJI_DIRECTIONS)[number];

export function getMujiAtlasMetadata(imageWidth: number, imageHeight: number): { frameWidth: number; frameHeight: number } {
  if (imageWidth % MUJI_ATLAS_COLUMNS !== 0 || imageHeight % MUJI_ATLAS_ROWS !== 0) {
    throw new Error(`Muji atlas dimensions must be divisible by ${MUJI_ATLAS_COLUMNS}x${MUJI_ATLAS_ROWS}`);
  }
  return {
    frameWidth: imageWidth / MUJI_ATLAS_COLUMNS,
    frameHeight: imageHeight / MUJI_ATLAS_ROWS
  };
}

export function getMujiFrame(
  imageWidth: number,
  imageHeight: number,
  direction: MujiDirection,
  moving: boolean,
  time: number
): { frame: number; row: number; sourceX: number; sourceY: number; frameWidth: number; frameHeight: number } {
  const { frameWidth, frameHeight } = getMujiAtlasMetadata(imageWidth, imageHeight);
  const frame = Math.floor(time / (moving ? MUJI_WALK_FRAME_MS : MUJI_IDLE_FRAME_MS)) % MUJI_ATLAS_COLUMNS;
  const row = MUJI_DIRECTIONS.indexOf(direction) + (moving ? 4 : 0);
  return {
    frame,
    row,
    sourceX: frame * frameWidth,
    sourceY: row * frameHeight,
    frameWidth,
    frameHeight
  };
}
