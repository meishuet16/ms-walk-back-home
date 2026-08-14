import { forestDoors } from "../fixtures/chapterPlan.js";
import { labisBlockers, labisDiaryMemorySpot, labisMemoryTriggers, labisSpawn } from "../fixtures/labisMotorMemory.js";
import { roomInteractions, roomObstacles, roomSpawn, roomSize } from "./MujiRoom.js";
import type { Point, Rect } from "./CollisionSystem.js";
import type { MemoryTrigger } from "./MemoryTrigger.js";

export type SceneOrientation = "landscape" | "portrait";

export type SceneInteraction = {
  id: string;
  label: string;
  x: number;
  y: number;
  radius: number;
};

export type SceneLayout = {
  sceneId: string;
  label: string;
  orientation: SceneOrientation;
  asset: string;
  size: { w: number; h: number };
  spawn: Point;
  obstacles: Rect[];
  interactions: SceneInteraction[];
  triggers: MemoryTrigger[];
  anchors: Record<string, Point>;
};

export type SceneLayoutId = "forest" | "muji-room" | "bakery" | "labis";
export type SceneLayoutManifestEntry = { label: string; layouts: Record<SceneOrientation, SceneLayout> };
export type SceneLayoutManifest = Record<string, SceneLayoutManifestEntry>;

type ViewportSize = { width: number; height: number };

const portraitSize = { w: 941, h: 1672 };
const portraitSpawn = { x: portraitSize.w / 2, y: portraitSize.h / 2 };

function portraitLayout(sceneId: SceneLayoutId, label: string, asset: string): SceneLayout {
  return {
    sceneId,
    label,
    orientation: "portrait",
    asset,
    size: { ...portraitSize },
    spawn: { ...portraitSpawn },
    obstacles: [],
    interactions: [],
    triggers: [],
    anchors: {}
  };
}

export const sceneLayoutManifest: SceneLayoutManifest = {
  forest: {
    label: "Forest",
    layouts: {
      landscape: {
        sceneId: "forest",
        label: "Forest",
        orientation: "landscape",
        asset: "assets/forest.png",
        size: { w: 1536, h: 864 },
        spawn: { x: 880, y: 690 },
        obstacles: [
          { x: 0, y: 0, w: 1536, h: 88 },
          { x: 0, y: 0, w: 120, h: 864 },
          { x: 1428, y: 0, w: 108, h: 864 },
          { x: 0, y: 780, w: 1536, h: 125 }
        ],
        interactions: forestDoors.map((door) => ({
          id: door.id,
          label: `${door.date} ${door.title}`,
          x: door.x,
          y: door.y,
          radius: 86
        })),
        triggers: [],
        anchors: {}
      },
      portrait: portraitLayout("forest", "Forest", "assets/forest-potrait.png")
    }
  },
  "muji-room": {
    label: "Muji Room",
    layouts: {
      landscape: {
        sceneId: "muji-room",
        label: "Muji Room",
        orientation: "landscape",
        asset: "assets/muji-room.png",
        size: { ...roomSize },
        spawn: { ...roomSpawn },
        obstacles: roomObstacles.map((rect) => ({ ...rect })),
        interactions: roomInteractions.map((interaction) => ({ ...interaction })),
        triggers: [],
        anchors: {}
      },
      portrait: portraitLayout("muji-room", "Muji Room", "assets/muji-room-potrait.png")
    }
  },
  bakery: {
    label: "Yumido Bakery",
    layouts: {
      landscape: {
        sceneId: "bakery",
        label: "Yumido Bakery",
        orientation: "landscape",
        asset: "assets/bakery.png",
        size: { w: 1536, h: 510 },
        spawn: { x: 450, y: 420 },
        obstacles: [
          { x: 0, y: 0, w: 1536, h: 210 },
          { x: 0, y: 0, w: 40, h: 560 },
          { x: 1490, y: 0, w: 50, h: 560 },
          { x: 0, y: 505, w: 1536, h: 80 },
          { x: 0, y: 0, w: 980, h: 300 },
          { x: 760, y: 168, w: 245, h: 130 },
          { x: 1000, y: 330, w: 460, h: 170 },
          { x: 70, y: 345, w: 335, h: 150 },
          { x: 640, y: 385, w: 355, h: 120 }
        ],
        interactions: [
          { id: "diary-memory", label: "diary memory", x: 735, y: 325, radius: 88 },
          { id: "friend-a", label: "Friend A", x: 600, y: 430, radius: 90 },
          { id: "pastry", label: "pastry", x: 840, y: 250, radius: 70 },
          { id: "exit", label: "exit", x: 80, y: 300, radius: 105 }
        ],
        triggers: [],
        anchors: {
          friend: { x: 600, y: 430 },
          "diary-memory": { x: 735, y: 325 }
        }
      },
      portrait: portraitLayout("bakery", "Yumido Bakery", "assets/bakery-potrait.png")
    }
  },
  labis: {
    label: "Labis Memory Chapter",
    layouts: {
      landscape: {
        sceneId: "labis",
        label: "Labis Memory Chapter",
        orientation: "landscape",
        asset: "assets/labis-july19.png",
        size: { w: 1536, h: 864 },
        spawn: { ...labisSpawn },
        obstacles: labisBlockers.map((rect) => ({ ...rect })),
        interactions: [
          {
            id: "diary-memory",
            label: "diary memory",
            x: labisDiaryMemorySpot.x,
            y: labisDiaryMemorySpot.y,
            radius: labisDiaryMemorySpot.radius
          },
          { id: "motor-memory", label: "motor memory", x: 740, y: 545, radius: 88 },
          { id: "family-shop", label: "family shop", x: 1040, y: 345, radius: 96 },
          { id: "exit", label: "exit", x: 135, y: 735, radius: 90 }
        ],
        triggers: labisMemoryTriggers.map((trigger) => ({ ...trigger, rect: { ...trigger.rect } })),
        anchors: {
          "diary-memory": { x: labisDiaryMemorySpot.x, y: labisDiaryMemorySpot.y },
          "motor-spawn": { x: 570, y: 555 },
          "ms-spawn": { x: 528, y: 558 },
          "motor-mid": { x: 710, y: 548 },
          "ms-mid": { x: 650, y: 552 },
          "motor-end": { x: 890, y: 530 }
        }
      },
      portrait: portraitLayout("labis", "Labis Memory Chapter", "assets/719-potrait.png")
    }
  }
};

export function getSceneLayout(sceneId: string, orientation: SceneOrientation): SceneLayout {
  const scene = sceneLayoutManifest[sceneId];
  if (!scene) throw new Error(`Unknown scene layout: ${sceneId}`);
  return scene.layouts[orientation];
}

export function cloneSceneLayout(layout: SceneLayout): SceneLayout {
  return {
    ...layout,
    size: { ...layout.size },
    spawn: { ...layout.spawn },
    obstacles: layout.obstacles.map((rect) => ({ ...rect })),
    interactions: layout.interactions.map((interaction) => ({ ...interaction })),
    triggers: layout.triggers.map((trigger) => ({ ...trigger, rect: { ...trigger.rect } })),
    anchors: Object.fromEntries(Object.entries(layout.anchors).map(([key, point]) => [key, { ...point }]))
  };
}

export function setSceneLayout(layout: SceneLayout): void {
  const current = sceneLayoutManifest[layout.sceneId] ?? {
    label: layout.label,
    layouts: {
      landscape: makeDefaultLayout(layout.sceneId, layout.label, "landscape"),
      portrait: makeDefaultLayout(layout.sceneId, layout.label, "portrait")
    }
  };
  sceneLayoutManifest[layout.sceneId] = {
    label: layout.label || current.label,
    layouts: {
      ...current.layouts,
      [layout.orientation]: normalizeSceneLayout(layout)
    }
  };
}

export function addSceneLayoutEntry(sceneId: string, label: string): SceneLayoutManifestEntry {
  const entry: SceneLayoutManifestEntry = sceneLayoutManifest[sceneId] ?? {
    label,
    layouts: {
      landscape: makeDefaultLayout(sceneId, label, "landscape"),
      portrait: makeDefaultLayout(sceneId, label, "portrait")
    }
  };
  sceneLayoutManifest[sceneId] = entry;
  return entry;
}

export function makeDefaultLayout(sceneId: string, label: string, orientation: SceneOrientation, asset = `assets/scenes/${sceneId}-${orientation}.png`): SceneLayout {
  const size = orientation === "portrait" ? { ...portraitSize } : { w: 960, h: 540 };
  return {
    sceneId,
    label,
    orientation,
    asset,
    size,
    spawn: { x: size.w / 2, y: size.h / 2 },
    obstacles: [],
    interactions: [],
    triggers: [],
    anchors: {}
  };
}

export function normalizeSceneLayout(layout: SceneLayout): SceneLayout {
  return {
    sceneId: safeText(layout.sceneId),
    label: safeText(layout.label),
    orientation: layout.orientation === "portrait" ? "portrait" : "landscape",
    asset: safeText(layout.asset),
    size: {
      w: positiveNumber(layout.size?.w, layout.orientation === "portrait" ? portraitSize.w : 960),
      h: positiveNumber(layout.size?.h, layout.orientation === "portrait" ? portraitSize.h : 540)
    },
    spawn: normalizePoint(layout.spawn, portraitSpawn),
    obstacles: Array.isArray(layout.obstacles) ? layout.obstacles.map(normalizeRect) : [],
    interactions: Array.isArray(layout.interactions) ? layout.interactions.map((interaction) => ({
      id: safeText(interaction.id),
      label: safeText(interaction.label || interaction.id),
      x: finiteNumber(interaction.x, 0),
      y: finiteNumber(interaction.y, 0),
      radius: positiveNumber(interaction.radius, 48)
    })) : [],
    triggers: Array.isArray(layout.triggers) ? layout.triggers.map((trigger) => ({
      id: safeText(trigger.id),
      rect: normalizeRect(trigger.rect),
      chapterId: safeText(trigger.chapterId),
      eventId: safeText(trigger.eventId),
      once: Boolean(trigger.once)
    })) : [],
    anchors: layout.anchors && typeof layout.anchors === "object"
      ? Object.fromEntries(Object.entries(layout.anchors).map(([key, point]) => [safeText(key), normalizePoint(point, { x: 0, y: 0 })]))
      : {}
  };
}

export async function loadSceneLayoutOverrides(basePath = "scene-layouts"): Promise<void> {
  try {
    const manifestResponse = await fetch(`${basePath}/manifest.json?ts=${Date.now()}`, { cache: "no-store" });
    if (!manifestResponse.ok) return;
    const manifest = await manifestResponse.json() as { scenes?: Array<{ id: string; label: string }> };
    for (const scene of manifest.scenes ?? []) {
      const sceneId = safeText(scene.id);
      const label = safeText(scene.label || scene.id);
      if (!sceneId) continue;
      addSceneLayoutEntry(sceneId, label);
      await Promise.all((["landscape", "portrait"] as const).map(async (orientation) => {
        try {
          const response = await fetch(`${basePath}/${sceneId}/${orientation}.json?ts=${Date.now()}`, { cache: "no-store" });
          if (!response.ok) return;
          setSceneLayout(await response.json() as SceneLayout);
        } catch {
          // Keep built-in fallback when a saved layout is absent or malformed.
        }
      }));
    }
  } catch {
    // Static builds without scene-layout JSON keep the built-in layouts.
  }
}

export function selectSceneOrientation(viewport: ViewportSize): SceneOrientation {
  return viewport.height > viewport.width ? "portrait" : "landscape";
}

export function scenePortraitAssetPaths(): Record<SceneLayoutId, string> {
  return Object.fromEntries(
    Object.entries(sceneLayoutManifest).map(([sceneId, scene]) => [sceneId, scene.layouts.portrait.asset])
  ) as Record<SceneLayoutId, string>;
}

function safeText(value: unknown): string {
  return String(value ?? "").trim();
}

function finiteNumber(value: unknown, fallback: number): number {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function positiveNumber(value: unknown, fallback: number): number {
  return Math.max(1, finiteNumber(value, fallback));
}

function normalizePoint(value: unknown, fallback: Point): Point {
  const point = value as Partial<Point> | null | undefined;
  return {
    x: finiteNumber(point?.x, fallback.x),
    y: finiteNumber(point?.y, fallback.y)
  };
}

function normalizeRect(value: unknown): Rect {
  const rect = value as Partial<Rect> | null | undefined;
  return {
    x: finiteNumber(rect?.x, 0),
    y: finiteNumber(rect?.y, 0),
    w: positiveNumber(rect?.w, 1),
    h: positiveNumber(rect?.h, 1)
  };
}
