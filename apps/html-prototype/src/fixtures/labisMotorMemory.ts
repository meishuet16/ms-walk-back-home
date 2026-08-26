import type { CutsceneAction } from "../systems/CutsceneSystem.js";
import type { MemoryTrigger } from "../systems/MemoryTrigger.js";
import type { Rect } from "../systems/CollisionSystem.js";
import type { Point } from "../systems/CollisionSystem.js";
import { activeMemoryTrigger } from "../systems/MemoryTrigger.js";

export const labisSpawn = { x: 750, y: 650 };
export const labisDiaryMemorySpot = { x: 760, y: 604, radius: 76 };

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
    rect: { x: 540, y: 455, w: 380, h: 78 },
    chapterId: "labis-motor-day",
    eventId: "july19-motor-learning",
    once: true
  }
];

function inDiaryMemorySpot(point: Point): boolean {
  return Math.hypot(point.x - labisDiaryMemorySpot.x, point.y - labisDiaryMemorySpot.y) < labisDiaryMemorySpot.radius;
}

export function canStartLabisMotorMemory(point: Point, _diaryRead: boolean, _mainCompleted: boolean): boolean {
  if (inDiaryMemorySpot(point)) return false;
  return Boolean(activeMemoryTrigger(point, labisMemoryTriggers, new Set()));
}

export function labisInteractionForPoint(point: Point, diaryRead: boolean, mainCompleted: boolean): "diary memory" | "motor memory" | "" {
  if (inDiaryMemorySpot(point)) return "diary memory";
  if (mainCompleted && Math.hypot(point.x - 740, point.y - 545) < 88) return "motor memory";
  if (!diaryRead && activeMemoryTrigger(point, labisMemoryTriggers, new Set())) return "diary memory";
  return "";
}

export const labisMotorMemoryActions: CutsceneAction[] = [
  { type: "wait", duration: 0.42 },
  { type: "spawn", actor: "motor", kind: "compound-motor", x: 570, y: 555, facing: "right", expression: "ride_nervous", label: "ET + motor" },
  { type: "spawn", actor: "ms", kind: "human", x: 528, y: 558, facing: "right", expression: "hold_motor", color: "#f4eee6", label: "MS" },
  { type: "wait", duration: 0.45 },
  { type: "move", actor: "motor", x: 710, y: 548, duration: 1.7, expression: "ride_nervous" },
  { type: "move", actor: "ms", x: 650, y: 552, duration: 1.0, expression: "follow" },
  { type: "wait", duration: 0.25 },
  { type: "expression", actor: "ms", value: "release" },
  { type: "wait", duration: 0.32 },
  { type: "move", actor: "motor", x: 890, y: 530, duration: 2.0, expression: "ride" },
  { type: "expression", actor: "ms", value: "watch" },
  { type: "expression", actor: "motor", value: "ride_happy" },
  { type: "face", actor: "motor", direction: "left" },
  { type: "expression", actor: "motor", value: "look_back_happy" },
  { type: "wait", duration: 0.42 },
  { type: "dialogue", speaker: "ET", text: "单凭这一点，没有白来。" ,portrait: {
    src: "assets/labis/et-motor-lookback.png",
    height: 180
  }},
  { type: "wait", duration: 0.7 },
  { type: "despawn", actor: "motor" },
  { type: "despawn", actor: "ms" }
];
