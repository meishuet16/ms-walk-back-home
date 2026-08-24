import type { Point, Rect } from "./CollisionSystem.js";
import type { SceneLayout } from "./SceneLayouts.js";

export type SceneViewportBounds = { left: number; top: number; width: number; height: number };
export type SceneSize = { w: number; h: number };
export type ClientPoint = { clientX: number; clientY: number };
export type ClientRect = { left: number; top: number; width: number; height: number };

export type SceneGeometrySelection =
  | { kind: "spawn" }
  | { kind: "collision"; index: number }
  | { kind: "interaction"; index: number }
  | { kind: "trigger"; index: number }
  | { kind: "placement-slot"; index: number }
  | { kind: "echo-anchor"; key: string }
  | { kind: "anchor"; key: string };

export type RectHandle = "left" | "right" | "top" | "bottom" | "top-left" | "top-right" | "bottom-left" | "bottom-right";

export function clientPointToScene(point: ClientPoint, bounds: SceneViewportBounds, scene: SceneSize): Point {
  return {
    x: ((point.clientX - bounds.left) / bounds.width) * scene.w,
    y: ((point.clientY - bounds.top) / bounds.height) * scene.h
  };
}

export function scenePointToClient(point: Point, bounds: SceneViewportBounds, scene: SceneSize): ClientPoint {
  return {
    clientX: bounds.left + (point.x / scene.w) * bounds.width,
    clientY: bounds.top + (point.y / scene.h) * bounds.height
  };
}

export function clientDeltaToSceneDelta(delta: Point, bounds: SceneViewportBounds, scene: SceneSize): Point {
  return { x: (delta.x / bounds.width) * scene.w, y: (delta.y / bounds.height) * scene.h };
}

export function sceneDeltaToClientDelta(delta: Point, bounds: SceneViewportBounds, scene: SceneSize): Point {
  return { x: (delta.x / scene.w) * bounds.width, y: (delta.y / scene.h) * bounds.height };
}

export function sceneRectToClient(rect: Rect, bounds: SceneViewportBounds, scene: SceneSize): ClientRect {
  const topLeft = scenePointToClient({ x: rect.x, y: rect.y }, bounds, scene);
  const bottomRight = scenePointToClient({ x: rect.x + rect.w, y: rect.y + rect.h }, bounds, scene);
  return { left: topLeft.clientX, top: topLeft.clientY, width: bottomRight.clientX - topLeft.clientX, height: bottomRight.clientY - topLeft.clientY };
}

export function clientRectToScene(rect: ClientRect, bounds: SceneViewportBounds, scene: SceneSize): Rect {
  const topLeft = clientPointToScene({ clientX: rect.left, clientY: rect.top }, bounds, scene);
  const bottomRight = clientPointToScene({ clientX: rect.left + rect.width, clientY: rect.top + rect.height }, bounds, scene);
  return { x: topLeft.x, y: topLeft.y, w: bottomRight.x - topLeft.x, h: bottomRight.y - topLeft.y };
}

function distanceSquared(a: Point, b: Point): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return dx * dx + dy * dy;
}

function pointInRect(point: Point, rect: Rect): boolean {
  return point.x >= rect.x && point.x <= rect.x + rect.w && point.y >= rect.y && point.y <= rect.y + rect.h;
}

export function pickSceneGeometry(layout: SceneLayout, point: Point, hitRadius = 24): SceneGeometrySelection | null {
  const candidates: Array<{ selection: SceneGeometrySelection; point: Point; priority: number }> = [
    { selection: { kind: "spawn" }, point: layout.spawn, priority: 0 },
    ...layout.interactions.map((item, index) => ({ selection: { kind: "interaction", index } as const, point: item, priority: 1 })),
    ...layout.placementSlots.map((item, index) => ({ selection: { kind: "placement-slot", index } as const, point: item, priority: 2 })),
    ...Object.entries(layout.echoAnchors).map(([key, item]) => ({ selection: { kind: "echo-anchor", key } as const, point: item, priority: 4 })),
    ...Object.entries(layout.anchors).map(([key, item]) => ({ selection: { kind: "anchor", key } as const, point: item, priority: 3 }))
  ];
  const pointHit = candidates
    .map((candidate) => ({ ...candidate, distance: distanceSquared(point, candidate.point) }))
    .filter((candidate) => candidate.distance <= hitRadius * hitRadius)
    .sort((a, b) => a.distance - b.distance || a.priority - b.priority)[0];
  if (pointHit) return pointHit.selection;

  const collision = layout.obstacles.findIndex((rect) => pointInRect(point, rect));
  if (collision >= 0) return { kind: "collision", index: collision };
  const trigger = layout.triggers.findIndex((item) => pointInRect(point, item.rect));
  if (trigger >= 0) return { kind: "trigger", index: trigger };
  return null;
}

export function rectHandleAtPoint(point: Point, rect: Rect, hitRadius = 18): RectHandle | null {
  const left = Math.abs(point.x - rect.x) <= hitRadius;
  const right = Math.abs(point.x - (rect.x + rect.w)) <= hitRadius;
  const top = Math.abs(point.y - rect.y) <= hitRadius;
  const bottom = Math.abs(point.y - (rect.y + rect.h)) <= hitRadius;
  if (left && top) return "top-left";
  if (right && top) return "top-right";
  if (left && bottom) return "bottom-left";
  if (right && bottom) return "bottom-right";
  if (left && point.y >= rect.y - hitRadius && point.y <= rect.y + rect.h + hitRadius) return "left";
  if (right && point.y >= rect.y - hitRadius && point.y <= rect.y + rect.h + hitRadius) return "right";
  if (top && point.x >= rect.x - hitRadius && point.x <= rect.x + rect.w + hitRadius) return "top";
  if (bottom && point.x >= rect.x - hitRadius && point.x <= rect.x + rect.w + hitRadius) return "bottom";
  return null;
}

export function moveRectToPoint(rect: Rect, topLeft: Point): Rect {
  return { ...rect, x: topLeft.x, y: topLeft.y };
}

export function resizeRect(rect: Rect, handle: RectHandle, pointer: Point, minSize = 3): Rect {
  const right = rect.x + rect.w;
  const bottom = rect.y + rect.h;
  let left = rect.x;
  let top = rect.y;
  let nextRight = right;
  let nextBottom = bottom;
  if (handle.includes("left")) left = Math.min(pointer.x, right - minSize);
  if (handle.includes("right")) nextRight = Math.max(pointer.x, left + minSize);
  if (handle.includes("top")) top = Math.min(pointer.y, bottom - minSize);
  if (handle.includes("bottom")) nextBottom = Math.max(pointer.y, top + minSize);
  return { x: left, y: top, w: nextRight - left, h: nextBottom - top };
}