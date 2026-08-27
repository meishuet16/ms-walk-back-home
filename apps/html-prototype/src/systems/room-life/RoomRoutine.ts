import { inAnyRect, type Point } from "../CollisionSystem.js";
import type { SceneLayout } from "../SceneLayouts.js";

export const ROOM_LIFE_DESTINATION_IDS = ["life-center", "life-window", "life-records", "life-bedside"] as const;
export const ROOM_LIFE_WAYPOINT_IDS = ["life-waypoint-upper", "life-waypoint-window", "life-waypoint-records"] as const;
export const ROOM_LIFE_NODE_IDS = [...ROOM_LIFE_DESTINATION_IDS, ...ROOM_LIFE_WAYPOINT_IDS] as const;

export type RoomLifeDestinationId = (typeof ROOM_LIFE_DESTINATION_IDS)[number];
export type RoomLifeWaypointId = (typeof ROOM_LIFE_WAYPOINT_IDS)[number];
export type RoomLifeNodeId = (typeof ROOM_LIFE_NODE_IDS)[number];
export type RoomLifeActivity = "center-idle" | "window-watch" | "records-listen" | "bedside-idle";
export type RoomLifeAnchors = Record<RoomLifeNodeId, Point>;

const spokeRoutes: Record<RoomLifeDestinationId, readonly RoomLifeNodeId[]> = {
  "life-center": ["life-center"],
  "life-window": ["life-center", "life-waypoint-upper", "life-waypoint-window", "life-window"],
  "life-records": ["life-center", "life-waypoint-upper", "life-waypoint-records", "life-records"],
  "life-bedside": ["life-center", "life-waypoint-upper", "life-bedside"]
};

const activityByDestination: Record<RoomLifeDestinationId, RoomLifeActivity> = {
  "life-center": "center-idle",
  "life-window": "window-watch",
  "life-records": "records-listen",
  "life-bedside": "bedside-idle"
};

export function resolveRoomLifeAnchors(layout: Pick<SceneLayout, "anchors">): RoomLifeAnchors | null {
  const anchors = {} as RoomLifeAnchors;
  for (const id of ROOM_LIFE_NODE_IDS) {
    const point = layout.anchors?.[id];
    if (!point || !Number.isFinite(point.x) || !Number.isFinite(point.y)) return null;
    anchors[id] = { x: point.x, y: point.y };
  }
  return anchors;
}

export function roomLifeActivityFor(node: RoomLifeNodeId): RoomLifeActivity | null {
  return ROOM_LIFE_DESTINATION_IDS.includes(node as RoomLifeDestinationId) ? activityByDestination[node as RoomLifeDestinationId] : null;
}

export function roomLifeRoute(from: RoomLifeDestinationId, to: RoomLifeDestinationId): RoomLifeNodeId[] | null {
  if (!spokeRoutes[from] || !spokeRoutes[to]) return null;
  if (from === to) return [from];
  return [...spokeRoutes[from].slice().reverse(), ...spokeRoutes[to].slice(1)];
}

export function roomLifeRouteFromNode(from: RoomLifeNodeId, to: RoomLifeDestinationId): RoomLifeNodeId[] | null {
  if (!ROOM_LIFE_NODE_IDS.includes(from) || !spokeRoutes[to]) return null;
  if (from === to) return [from];
  if (from === "life-center") return [...spokeRoutes[to]];
  if (from === "life-waypoint-upper") return [from, "life-center", ...spokeRoutes[to].slice(1)];
  const connectedDestination = from === "life-waypoint-window" ? "life-window" : from === "life-waypoint-records" ? "life-records" : null;
  if (!connectedDestination) return null;
  if (to === connectedDestination) return [from, to];
  return [from, "life-waypoint-upper", "life-center", ...spokeRoutes[to].slice(1)];
}

export function roomLifeSegmentIsSafe(start: Point, end: Point, layout: Pick<SceneLayout, "size" | "obstacles">): boolean {
  if (!inBounds(start, layout.size) || !inBounds(end, layout.size)) return false;
  const distance = Math.hypot(end.x - start.x, end.y - start.y);
  const samples = Math.max(1, Math.ceil(distance / 8));
  for (let index = 0; index <= samples; index += 1) {
    const progress = index / samples;
    const point = {
      x: start.x + (end.x - start.x) * progress,
      y: start.y + (end.y - start.y) * progress
    };
    if (inAnyRect(point, layout.obstacles)) return false;
  }
  return true;
}

export function roomLifeRouteIsSafe(route: readonly RoomLifeNodeId[] | null, layout: Pick<SceneLayout, "anchors" | "size" | "obstacles">): boolean {
  const anchors = resolveRoomLifeAnchors(layout);
  if (!route || !anchors) return false;
  for (let index = 1; index < route.length; index += 1) {
    const start = anchors[route[index - 1]];
    const end = anchors[route[index]];
    if (!start || !end || !roomLifeSegmentIsSafe(start, end, layout)) return false;
  }
  return true;
}

export function findRoomLifeEntry(position: Point, layout: Pick<SceneLayout, "anchors" | "size" | "obstacles">, maxDistance = 96): RoomLifeNodeId | null {
  const anchors = resolveRoomLifeAnchors(layout);
  if (!anchors || !inBounds(position, layout.size) || inAnyRect(position, layout.obstacles)) return null;
  return ROOM_LIFE_NODE_IDS
    .map((id) => ({ id, distance: Math.hypot(position.x - anchors[id].x, position.y - anchors[id].y) }))
    .filter(({ id, distance }) => distance <= maxDistance && roomLifeSegmentIsSafe(position, anchors[id], layout))
    .sort((a, b) => a.distance - b.distance)[0]?.id ?? null;
}

function inBounds(point: Point, size: { w: number; h: number }): boolean {
  return point.x >= 0 && point.y >= 0 && point.x <= size.w && point.y <= size.h;
}
