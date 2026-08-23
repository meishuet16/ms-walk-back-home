import type { Point } from "./CollisionSystem.js";

export type ViewportTransform = { zoom: number; panX: number; panY: number };
export function clampZoom(value: number): number { return Math.max(0.25, Math.min(4, Number.isFinite(value) ? value : 1)); }
export function sceneToViewport(point: Point, transform: ViewportTransform): Point { return { x: point.x * transform.zoom + transform.panX, y: point.y * transform.zoom + transform.panY }; }
export function viewportToScene(point: Point, transform: ViewportTransform): Point { return { x: (point.x - transform.panX) / transform.zoom, y: (point.y - transform.panY) / transform.zoom }; }
export function fitZoom(scene: { w: number; h: number }, viewport: { w: number; h: number }, padding = 32): number {
  return clampZoom(Math.min(Math.max(0.01, (viewport.w - padding * 2) / scene.w), Math.max(0.01, (viewport.h - padding * 2) / scene.h)));
}
export function centerPan(scene: { w: number; h: number }, viewport: { w: number; h: number }, zoom: number): Point {
  return { x: (viewport.w - scene.w * zoom) / 2, y: (viewport.h - scene.h * zoom) / 2 };
}

