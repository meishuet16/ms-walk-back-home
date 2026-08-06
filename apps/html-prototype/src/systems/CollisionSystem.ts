export type Rect = { x: number; y: number; w: number; h: number };
export type Point = { x: number; y: number };

export function inAnyRect(point: Point, rects: Rect[]): boolean {
  return rects.some((rect) => point.x >= rect.x && point.x <= rect.x + rect.w && point.y >= rect.y && point.y <= rect.y + rect.h);
}

export function blocked(point: Point, blockers: Rect[]): boolean {
  return inAnyRect(point, blockers);
}
