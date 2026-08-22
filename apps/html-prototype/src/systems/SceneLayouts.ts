import { forestDoors } from "../fixtures/chapterPlan.js";
import { labisBlockers, labisDiaryMemorySpot, labisMemoryTriggers, labisSpawn } from "../fixtures/labisMotorMemory.js";
import { roomInteractions, roomObstacles, roomSpawn, roomSize } from "./MujiRoom.js";
import { inAnyRect, type Point, type Rect } from "./CollisionSystem.js";
import type { MemoryTrigger } from "./MemoryTrigger.js";

export type SceneOrientation = "landscape" | "portrait";

export type SceneInteraction = {
  id: string;
  label: string;
  x: number;
  y: number;
  radius: number;
};

export type PlacementSlotKind = "chapter" | "fragment";

export type PlacementSlot = {
  id: string;
  kind: PlacementSlotKind;
  x: number;
  y: number;
  radius: number;
};

export type EchoAnchor = Point & { radius: number };

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
  placementSlots: PlacementSlot[];
  echoAnchors: Record<string, EchoAnchor>;
  anchors: Record<string, Point>;
};

export type ForestDynamicNode = {
  id: string;
  date: string;
  title: string;
  x: number;
  y: number;
  kind?: "chapter" | "fragment";
};

export type ResolvedForestDynamicNode<T extends ForestDynamicNode> = T & {
  radius: number;
  placementSlotId: string;
};

export type SceneLayoutId = string;
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
    placementSlots: [],
    echoAnchors: {},
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
        interactions: [],
        triggers: [],
        placementSlots: forestDoors.map((door, index) => ({
          id: `chapter-slot-${String(index + 1).padStart(2, "0")}`,
          kind: "chapter",
          x: door.x,
          y: door.y,
          radius: 86
        })),
        echoAnchors: {},
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
        placementSlots: [],
        echoAnchors: {},
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
        placementSlots: [],
        echoAnchors: {},
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
        placementSlots: [],
        echoAnchors: {},
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
    placementSlots: (layout.placementSlots ?? []).map((slot) => ({ ...slot })),
    echoAnchors: Object.fromEntries(Object.entries(layout.echoAnchors ?? {}).map(([key, anchor]) => [key, { ...anchor }])),
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
    placementSlots: [],
    echoAnchors: {},
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
    placementSlots: Array.isArray(layout.placementSlots) ? layout.placementSlots.map(normalizePlacementSlot) : [],
    echoAnchors: layout.echoAnchors && typeof layout.echoAnchors === "object"
      ? Object.fromEntries(Object.entries(layout.echoAnchors).map(([key, anchor]) => [safeText(key), normalizeEchoAnchor(anchor)]))
      : {},
    anchors: layout.anchors && typeof layout.anchors === "object"
      ? Object.fromEntries(Object.entries(layout.anchors).map(([key, point]) => [safeText(key), normalizePoint(point, { x: 0, y: 0 })]))
      : {}
  };
}

export function resolveForestDynamicPlacements<T extends ForestDynamicNode>(
  nodes: T[],
  layout: SceneLayout,
  monthKey: string
): Array<ResolvedForestDynamicNode<T>> {
  const occupied: Array<{ x: number; y: number; radius: number }> = layout.interactions.map((interaction) => ({
    x: interaction.x,
    y: interaction.y,
    radius: interaction.radius
  }));
  const slots = layout.placementSlots ?? [];
  return nodes.map((node, index) => {
    const kind = node.kind === "fragment" ? "fragment" : "chapter";
    const candidates = slots.filter((slot) => slot.kind === kind);
    const slot = candidates.find((candidate) => isPlacementAvailable(candidate, occupied, layout.obstacles));
    const placement = slot ?? overflowPlacement(node.id, kind, layout, monthKey, index, occupied);
    occupied.push({ x: placement.x, y: placement.y, radius: placement.radius });
    return {
      ...node,
      x: placement.x,
      y: placement.y,
      radius: placement.radius,
      placementSlotId: placement.id
    };
  });
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

function normalizePlacementSlot(value: unknown): PlacementSlot {
  const slot = value as Partial<PlacementSlot> | null | undefined;
  const kind = slot?.kind === "fragment" ? "fragment" : "chapter";
  return {
    id: safeText(slot?.id || `${kind}-slot`),
    kind,
    x: finiteNumber(slot?.x, 0),
    y: finiteNumber(slot?.y, 0),
    radius: positiveNumber(slot?.radius, kind === "fragment" ? 44 : 86)
  };
}

function normalizeEchoAnchor(value: unknown): EchoAnchor {
  const anchor = value as Partial<EchoAnchor> | null | undefined;
  return {
    x: finiteNumber(anchor?.x, 0),
    y: finiteNumber(anchor?.y, 0),
    radius: positiveNumber(anchor?.radius, 56)
  };
}

function isPlacementAvailable(slot: PlacementSlot, occupied: Array<{ x: number; y: number; radius: number }>, obstacles: Rect[]): boolean {
  if (inAnyRect(slot, obstacles)) return false;
  return !occupied.some((item) => Math.hypot(item.x - slot.x, item.y - slot.y) < Math.max(item.radius, slot.radius));
}

function overflowPlacement(
  nodeId: string,
  kind: PlacementSlotKind,
  layout: SceneLayout,
  monthKey: string,
  index: number,
  occupied: Array<{ x: number; y: number; radius: number }>
): PlacementSlot {
  const radius = kind === "fragment" ? 44 : 82;
  const safe = {
    x: radius,
    y: radius,
    w: Math.max(radius * 2, layout.size.w - radius * 2),
    h: Math.max(radius * 2, layout.size.h - radius * 2)
  };
  const seed = stableHash(`${nodeId}|${monthKey}|${layout.orientation}|${kind}`);
  for (let attempt = 0; attempt < 48; attempt += 1) {
    const mixed = stableHash(`${seed}|${attempt}`);
    const x = safe.x + (mixed % 1000) / 1000 * safe.w;
    const y = safe.y + (Math.floor(mixed / 1000) % 1000) / 1000 * safe.h;
    const slot = { id: `overflow-${kind}-${index + 1}`, kind, x, y, radius };
    if (isPlacementAvailable(slot, occupied, layout.obstacles)) return slot;
  }
  return {
    id: `overflow-${kind}-${index + 1}`,
    kind,
    x: Math.min(layout.size.w - radius, radius + (index * radius * 2.7) % safe.w),
    y: Math.min(layout.size.h - radius, radius + Math.floor(index / 4) * radius * 2.7),
    radius
  };
}

function stableHash(value: string): number {
  let hash = 2166136261;
  for (const char of value) {
    hash ^= char.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export function resolveSceneEchoAnchor(layout: SceneLayout, semanticId: string): EchoAnchor | null {
  if (semanticId !== "watergun-crossing") return layout.echoAnchors[semanticId] ?? null;
  const key = layout.orientation === "portrait" ? "r-watergun-crossing" : "watergun-crossing";
  return layout.echoAnchors[key] ?? null;
}
