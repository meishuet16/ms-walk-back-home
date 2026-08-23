import type { Point, Rect } from "./CollisionSystem.js";

export type MemoryTrigger = {
  id: string;
  rect: Rect;
  chapterId: string;
  eventId: string;
  once: boolean;
};

export function activeMemoryTrigger(point: Point, triggers: MemoryTrigger[], _completedEventIds?: Set<string>): MemoryTrigger | null {
  return triggers.find((trigger) => {
    return point.x >= trigger.rect.x && point.x <= trigger.rect.x + trigger.rect.w && point.y >= trigger.rect.y && point.y <= trigger.rect.y + trigger.rect.h;
  }) ?? null;
}
