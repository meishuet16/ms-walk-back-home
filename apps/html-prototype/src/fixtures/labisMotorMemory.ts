import type { CutsceneAction } from "../systems/CutsceneSystem.js";
import type { MemoryTrigger } from "../systems/MemoryTrigger.js";
import type { Rect } from "../systems/CollisionSystem.js";
import type { Point } from "../systems/CollisionSystem.js";
import { activeMemoryTrigger } from "../systems/MemoryTrigger.js";

export const labisSpawn = { x: 750, y: 650 };

export const labisBlockers: Rect[] = [
  { x: 0, y: 0, w: 1536, h: 145 },
  { x: 0, y: 0, w: 95, h: 864 },
  { x: 1450, y: 0, w: 86, h: 864 },
  { x: 0, y: 790, w: 1536, h: 74 },
  { x: 110, y: 130, w: 310, h: 210 },
  { x: 430, y: 115, w: 245, h: 170 },
  { x: 735, y: 115, w: 245, h: 170 },
  { x: 1025, y: 115, w: 360, h: 190 },
  { x: 170, y: 520, w: 120, h: 80 },
  { x: 1220, y: 500, w: 130, h: 88 }
];

export const labisMemoryTriggers: MemoryTrigger[] = [
  {
    id: "labis-motor-learning-zone",
    rect: { x: 520, y: 465, w: 430, h: 170 },
    chapterId: "labis-motor-day",
    eventId: "july19-motor-learning",
    once: true
  }
];

export function canStartLabisMotorMemory(point: Point, readMemories: Set<string>, completedEventIds: Set<string>): boolean {
  if (!readMemories.has("labis-motor-day")) return false;
  return Boolean(activeMemoryTrigger(point, labisMemoryTriggers, completedEventIds));
}

export const labisMotorMemoryActions: CutsceneAction[] = [
  { type: "wait", duration: 0.42 },
  { type: "spawn", actor: "motor", kind: "compound-motor", x: 570, y: 555, facing: "right", expression: "nervous", label: "ET + motor" },
  { type: "spawn", actor: "ms", kind: "human", x: 528, y: 558, facing: "right", expression: "attentive", color: "#45614d", label: "MS" },
  { type: "wait", duration: 0.45 },
  { type: "move", actor: "motor", x: 710, y: 548, duration: 1.7, expression: "nervous" },
  { type: "move", actor: "ms", x: 650, y: 552, duration: 1.0, expression: "attentive" },
  { type: "wait", duration: 0.25 },
  { type: "move", actor: "motor", x: 890, y: 530, duration: 2.0, expression: "nervous" },
  { type: "expression", actor: "motor", value: "happy" },
  { type: "face", actor: "motor", direction: "left" },
  { type: "wait", duration: 0.35 },
  { type: "dialogue", speaker: "ET", text: "单凭这一点，没有白来。" },
  { type: "dialogue", speaker: "Memory", text: "那个下午当时没有发光，只是后来一直没有散掉。" },
  { type: "wait", duration: 0.7 },
  { type: "despawn", actor: "motor" },
  { type: "despawn", actor: "ms" }
];
