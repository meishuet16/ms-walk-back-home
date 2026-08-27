import type { Point, Rect } from "./CollisionSystem.js";
import { inAnyRect } from "./CollisionSystem.js";
import type { RoomJourneyState } from "../types.js";

export type RoomInteractionId = "door" | "journal" | "lamp" | "window" | "records" | "toolbox" | "reflection";

export type RoomInteraction = {
  id: RoomInteractionId;
  label: string;
  x: number;
  y: number;
  radius: number;
};

export type MusicTrack = {
  id: string;
  title: string;
  src: string;
  duration?: number;
};

export type VinylRecord = {
  id: string;
  title: string;
  subtitle?: string;
  sideA?: MusicTrack;
  sideB?: MusicTrack;
  coverAsset?: string;
  recordAsset?: string;
  unlockedByDefault?: boolean;
};

function slugifyAudioName(value: string): string {
  const ascii = value
    .normalize("NFKD")
    .replace(/[^\x00-\x7F]/g, "")
    .toLowerCase()
    .replace(/\.mp3$/i, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 42);
  return ascii || `track-${Math.abs([...value].reduce((sum, char) => sum + char.charCodeAt(0), 0))}`;
}

function titleFromAudioName(fileName: string): { title: string; subtitle: string } {
  const base = fileName.replace(/\.mp3$/i, "");
  const cleaned = base.replace(/\s*\([^)]*\)\s*/g, " ").trim();
  const [title = cleaned, ...subtitleParts] = cleaned.split("-").map((part) => part.trim()).filter(Boolean);
  return {
    title: title || base,
    subtitle: subtitleParts.join(" / ") || "local audio"
  };
}

export const roomSize = { w: 960, h: 540 };

export const roomSpawn: Point = { x: 126, y: 438 };

export const roomObstacles: Rect[] = [
  { x: 0, y: 0, w: 960, h: 62 },
  { x: 0, y: 0, w: 68, h: 540 },
  { x: 892, y: 0, w: 68, h: 540 },
  { x: 0, y: 494, w: 960, h: 46 },
  { x: 128, y: 88, w: 190, h: 98 },
  { x: 612, y: 86, w: 222, h: 126 },
  { x: 784, y: 294, w: 74, h: 104 },
  { x: 374, y: 354, w: 176, h: 88 },
  { x: 84, y: 224, w: 98, h: 142 },
  { x: 804, y: 210, w: 66, h: 96 }
];

export type RoomMovementGeometry = {
  size: { w: number; h: number };
  obstacles: Rect[];
};

export const roomInteractions: RoomInteraction[] = [
  { id: "door", label: "Return to Forest", x: 126, y: 456, radius: 58 },
  { id: "journal", label: "Journal", x: 620, y: 250, radius: 72 },
  { id: "lamp", label: "Lamp", x: 218, y: 210, radius: 58 },
  { id: "window", label: "Look Outside", x: 486, y: 164, radius: 80 },
  { id: "records", label: "Records", x: 748, y: 356, radius: 46 },
  { id: "toolbox", label: "Toolbox", x: 562, y: 316, radius: 62 },
  { id: "reflection", label: "Reflection Note", x: 504, y: 450, radius: 62 }
];

export const vinylRecords: VinylRecord[] = [
  {
    id: "rain-window",
    title: "Rain at the Window",
    subtitle: "room sketch",
    sideA: { id: "rain-window-a", title: "Side A", src: "assets/audio/forest.mp3" },
    unlockedByDefault: true
  },
  {
    id: "bakery-loop",
    title: "Small Bread Light",
    subtitle: "memory sketch",
    sideA: { id: "bakery-loop-a", title: "Side A", src: "assets/audio/bakery.mp3" },
    unlockedByDefault: true
  }
];

export function createDefaultRoomState(): RoomJourneyState {
  return {
    visits: 0,
    reflections: ["The room waits without asking for proof."],
    lampOn: true,
    musicOn: false,
    residueIds: [],
    selectedVinylId: vinylRecords[0].id,
    vinylPlaying: false,
    vinylCovers: {},
    reflectionNote: ""
  };
}

export function moveRoomPlayer(player: Point, x: number, y: number, dt: number, geometry: RoomMovementGeometry = { size: roomSize, obstacles: roomObstacles }): Point {
  const speed = 155;
  const magnitude = Math.hypot(x, y);
  const input = magnitude > 1 ? { x: x / magnitude, y: y / magnitude } : { x, y };
  const next = { x: player.x + input.x * speed * dt, y: player.y + input.y * speed * dt };
  const outsideRoom = next.x < 0 || next.y < 0 || next.x > geometry.size.w || next.y > geometry.size.h;
  return outsideRoom || inAnyRect(next, geometry.obstacles) ? player : next;
}

export function nearestRoomInteraction(player: Point): RoomInteraction | null {
  return roomInteractions.find((interaction) => Math.hypot(player.x - interaction.x, player.y - interaction.y) <= interaction.radius) ?? null;
}

export function canReachRoomInteraction(id: RoomInteractionId): boolean {
  const interaction = roomInteractions.find((item) => item.id === id);
  if (!interaction) return false;
  const samples: Point[] = [
    { x: interaction.x, y: interaction.y },
    { x: interaction.x + interaction.radius * 0.7, y: interaction.y },
    { x: interaction.x - interaction.radius * 0.7, y: interaction.y },
    { x: interaction.x, y: interaction.y + interaction.radius * 0.7 },
    { x: interaction.x, y: interaction.y - interaction.radius * 0.7 }
  ];
  return samples.some((point) => point.x > 0 && point.y > 0 && point.x < roomSize.w && point.y < roomSize.h && !inAnyRect(point, roomObstacles));
}

export function normalizeRoomWindowState(state: RoomJourneyState & { windowFocus?: boolean }): RoomJourneyState {
  const { windowFocus: _legacyWindowFocus, ...normalized } = state;
  return normalized;
}

export function toggleRoomLamp(state: RoomJourneyState): RoomJourneyState {
  return { ...state, visits: state.visits + 1, lampOn: !state.lampOn };
}

export function selectVinylRecord(state: RoomJourneyState, recordId: string, records: VinylRecord[] = vinylRecords): RoomJourneyState {
  const record = records.find((item) => item.id === recordId) ?? records[0] ?? vinylRecords[0];
  return { ...state, selectedVinylId: record.id, vinylPlaying: true, musicOn: true };
}

export function currentVinylTrack(state: RoomJourneyState, records: VinylRecord[] = vinylRecords): MusicTrack {
  return (records.find((record) => record.id === state.selectedVinylId) ?? records[0] ?? vinylRecords[0]).sideA!;
}

export function vinylPlayerActions(): Array<"toggle-play" | "close"> {
  return ["toggle-play", "close"];
}

export function vinylRecordsFromAudioFiles(fileNames: string[]): VinylRecord[] {
  return fileNames
    .filter((fileName) => fileName.toLowerCase().endsWith(".mp3"))
    .sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }))
    .map((fileName) => {
      const metadata = titleFromAudioName(fileName);
      const id = `audio-${slugifyAudioName(fileName)}`;
      return {
        id,
        title: metadata.title,
        subtitle: metadata.subtitle,
        sideA: {
          id: `${id}-a`,
          title: "Side A",
          src: `assets/audio/${encodeURIComponent(fileName)}`
        },
        unlockedByDefault: true
      };
    });
}

export function withCustomVinylCover(state: RoomJourneyState, recordId: string, coverSrc: string): RoomJourneyState {
  return {
    ...state,
    vinylCovers: {
      ...(state.vinylCovers ?? {}),
      [recordId]: coverSrc
    }
  };
}
