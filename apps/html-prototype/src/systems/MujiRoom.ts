import type { Point, Rect } from "./CollisionSystem.js";
import { inAnyRect } from "./CollisionSystem.js";
import type { RoomJourneyState } from "../types.js";

export type RoomInteractionId = "door" | "journal" | "lamp" | "window" | "records" | "residue" | "reflection";

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

export const roomSize = { w: 960, h: 540 };

export const roomSpawn: Point = { x: 126, y: 438 };

export const roomObstacles: Rect[] = [
  { x: 0, y: 0, w: 960, h: 62 },
  { x: 0, y: 0, w: 68, h: 540 },
  { x: 892, y: 0, w: 68, h: 540 },
  { x: 0, y: 494, w: 960, h: 46 },
  { x: 128, y: 88, w: 190, h: 98 },
  { x: 612, y: 86, w: 222, h: 126 },
  { x: 706, y: 294, w: 132, h: 132 },
  { x: 374, y: 354, w: 176, h: 88 },
  { x: 84, y: 224, w: 98, h: 142 },
  { x: 804, y: 210, w: 66, h: 96 }
];

export const roomInteractions: RoomInteraction[] = [
  { id: "door", label: "Return to Forest", x: 126, y: 456, radius: 58 },
  { id: "journal", label: "Journal", x: 338, y: 234, radius: 72 },
  { id: "lamp", label: "Lamp", x: 218, y: 210, radius: 58 },
  { id: "window", label: "Look Outside", x: 486, y: 164, radius: 80 },
  { id: "records", label: "Records", x: 800, y: 334, radius: 70 },
  { id: "residue", label: "Examine", x: 562, y: 316, radius: 62 },
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
    windowFocus: false,
    selectedVinylId: vinylRecords[0].id,
    vinylPlaying: false,
    reflectionNote: ""
  };
}

export function moveRoomPlayer(player: Point, x: number, y: number, dt: number): Point {
  const speed = 155;
  const magnitude = Math.hypot(x, y);
  const input = magnitude > 1 ? { x: x / magnitude, y: y / magnitude } : { x, y };
  const next = { x: player.x + input.x * speed * dt, y: player.y + input.y * speed * dt };
  const outsideRoom = next.x < 0 || next.y < 0 || next.x > roomSize.w || next.y > roomSize.h;
  return outsideRoom || inAnyRect(next, roomObstacles) ? player : next;
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

export function toggleRoomLamp(state: RoomJourneyState): RoomJourneyState {
  return { ...state, visits: state.visits + 1, lampOn: !state.lampOn };
}

export function selectVinylRecord(state: RoomJourneyState, recordId: string): RoomJourneyState {
  const record = vinylRecords.find((item) => item.id === recordId) ?? vinylRecords[0];
  return { ...state, selectedVinylId: record.id, vinylPlaying: true, musicOn: true };
}

export function currentVinylTrack(state: RoomJourneyState): MusicTrack {
  return (vinylRecords.find((record) => record.id === state.selectedVinylId) ?? vinylRecords[0]).sideA!;
}

export function vinylPlayerActions(): Array<"toggle-play" | "close"> {
  return ["toggle-play", "close"];
}
