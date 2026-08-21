import type { ReflectionNote, ReflectionWallFilter, ReflectionWallSort, ReflectionWallState, ReflectionWallView, RoomJourneyState } from "../types.js";

export const reflectionPaperStyles = [
  { id: "cream-torn", label: "Cream Torn" },
  { id: "blue-lined", label: "Blue Lined" },
  { id: "sage-memo", label: "Sage Memo" },
  { id: "grid-paper", label: "Grid Paper" },
  { id: "tracing-paper", label: "Tracing Paper" },
  { id: "blue-clipped", label: "Blue Clipped" },
  { id: "taped-card", label: "Taped Card" },
  { id: "soft-square", label: "Soft Square" }
] as const;

export const defaultReflectionStyleId = "paper-mix";

type CreateOptions = {
  now?: Date;
  styleId?: string;
  position?: { x: number; y: number };
  rotation?: number;
};

type VisibleOptions = {
  view: ReflectionWallView;
  sort: ReflectionWallSort;
  search: string;
  filter?: ReflectionWallFilter;
  now?: Date;
};

export type ReflectionNoteDimensions = {
  widthPercent: number;
  heightPercent: number;
  edgePercent?: number;
};

export function clampReflectionNotePosition(
  position: { x: number; y: number },
  dimensions: ReflectionNoteDimensions = { widthPercent: 28, heightPercent: 24, edgePercent: 4 }
): { x: number; y: number } {
  const edge = Math.max(0, dimensions.edgePercent ?? 4);
  const minX = edge + Math.max(0, dimensions.widthPercent) / 2;
  const maxX = 100 - edge - Math.max(0, dimensions.widthPercent) / 2;
  const minY = edge + Math.max(0, dimensions.heightPercent) / 2;
  const maxY = 100 - edge - Math.max(0, dimensions.heightPercent) / 2;
  return {
    x: Math.round(Math.max(minX, Math.min(maxX, position.x)) * 100) / 100,
    y: Math.round(Math.max(minY, Math.min(maxY, position.y)) * 100) / 100
  };
}

export function createReflectionWallState(now = new Date()): ReflectionWallState {
  return {
    version: 1,
    savedAt: now.toISOString(),
    defaultStyleId: defaultReflectionStyleId,
    migratedLegacyKeys: [],
    notes: []
  };
}

export function createReflectionNote(state: ReflectionWallState, text: string, options: CreateOptions = {}): ReflectionWallState {
  const trimmed = text.trim().slice(0, 500);
  if (!trimmed) return state;
  const now = options.now ?? new Date();
  const id = `reflection-${now.getTime()}-${state.notes.length + 1}`;
  const position = options.position ?? nextReflectionPosition(state.notes);
  const styleId = options.styleId && options.styleId !== defaultReflectionStyleId ? options.styleId : selectPaperStyle(id);
  return saveWall({
    ...state,
    notes: [
      ...state.notes,
      {
        id,
        text: trimmed,
        createdAt: now.toISOString(),
        styleId,
        x: clampPercent(position.x),
        y: clampPercent(position.y),
        rotation: clampRotation(options.rotation ?? seededRotation(id)),
        source: "manual"
      }
    ]
  }, now);
}

export function createChapterReflectionNote(state: ReflectionWallState, text: string, chapterId: string, options: CreateOptions = {}): ReflectionWallState {
  const next = createReflectionNote(state, text, options);
  const createdId = next.notes.at(-1)?.id;
  if (!createdId) return next;
  return {
    ...next,
    notes: next.notes.map((note) => note.id === createdId ? { ...note, source: "chapter", chapterId } : note)
  };
}

export function updateReflectionNote(state: ReflectionWallState, id: string, text: string, now = new Date()): ReflectionWallState {
  const trimmed = text.trim().slice(0, 500);
  if (!trimmed) return state;
  return saveWall({
    ...state,
    notes: state.notes.map((note) => note.id === id ? { ...note, text: trimmed, updatedAt: now.toISOString() } : note)
  }, now);
}

export function moveReflectionNote(state: ReflectionWallState, id: string, position: { x: number; y: number }, now = new Date()): ReflectionWallState {
  return saveWall({
    ...state,
    notes: state.notes.map((note) => note.id === id ? { ...note, x: clampPercent(position.x), y: clampPercent(position.y) } : note)
  }, now);
}

export function changeReflectionPaper(state: ReflectionWallState, id: string, styleId: string, now = new Date()): ReflectionWallState {
  const nextStyle = validStyleId(styleId) ? styleId : selectPaperStyle(id);
  return saveWall({
    ...state,
    notes: state.notes.map((note) => note.id === id ? { ...note, styleId: nextStyle, updatedAt: now.toISOString() } : note)
  }, now);
}

export function toggleReflectionNoteFlag(state: ReflectionWallState, id: string, flag: "pinned" | "favorite", now = new Date()): ReflectionWallState {
  return saveWall({
    ...state,
    notes: state.notes.map((note) => note.id === id ? { ...note, [flag]: !note[flag], updatedAt: now.toISOString() } : note)
  }, now);
}

export function deleteReflectionNote(state: ReflectionWallState, id: string, now = new Date()): ReflectionWallState {
  return saveWall({ ...state, notes: state.notes.filter((note) => note.id !== id) }, now);
}

export function searchReflectionNotes(notes: ReflectionNote[], query: string): ReflectionNote[] {
  const needle = query.trim().toLocaleLowerCase();
  if (!needle) return notes;
  return notes.filter((note) => note.text.toLocaleLowerCase().includes(needle));
}

export function filterReflectionNotes(notes: ReflectionNote[], filter: ReflectionWallFilter, now = new Date()): ReflectionNote[] {
  if (filter === "all") return notes;
  if (filter === "manual") return notes.filter((note) => note.source === "manual");
  if (filter === "chapter") return notes.filter((note) => note.source === "chapter");
  if (filter === "pinned") return notes.filter((note) => note.pinned);
  if (filter === "favorites") return notes.filter((note) => note.favorite);
  return notes.filter((note) => isWithinDateFilter(note.createdAt, filter, now));
}

export function sortReflectionNotes(notes: ReflectionNote[], sort: ReflectionWallSort): ReflectionNote[] {
  if (sort === "manual") return [...notes];
  return [...notes].sort((a, b) => sort === "newest"
    ? b.createdAt.localeCompare(a.createdAt)
    : a.createdAt.localeCompare(b.createdAt));
}

export function visibleReflectionNotes(state: ReflectionWallState, options: VisibleOptions): ReflectionNote[] {
  const filtered = filterReflectionNotes(searchReflectionNotes(state.notes, options.search), options.filter ?? "all", options.now);
  return options.view === "wall" && options.sort === "manual" ? [...filtered] : sortReflectionNotes(filtered, options.sort);
}

export function migrateLegacyReflectionWall(state: ReflectionWallState, room: Partial<RoomJourneyState> | null | undefined, now = new Date()): ReflectionWallState {
  if (!room) return state;
  const legacyTexts = [
    room.reflectionNote?.trim(),
    ...(room.reflections ?? [])
      .map((line) => line.startsWith("Reflection:") ? line.replace(/^Reflection:\s*/, "").trim() : "")
  ].filter((value): value is string => Boolean(value));
  return legacyTexts.reduce((next, text) => {
    const key = `legacy:${text}`;
    if (next.migratedLegacyKeys.includes(key)) return next;
    const withNote = createReflectionNote(next, text, { now, styleId: "cream-torn" });
    return { ...withNote, migratedLegacyKeys: [...withNote.migratedLegacyKeys, key] };
  }, state);
}

export function normalizeReflectionWallState(value: unknown, now = new Date()): ReflectionWallState | null {
  if (!value || typeof value !== "object") return null;
  const candidate = value as ReflectionWallState;
  if (candidate.version !== 1 || !Array.isArray(candidate.notes)) return null;
  return {
    version: 1,
    savedAt: typeof candidate.savedAt === "string" ? candidate.savedAt : now.toISOString(),
    defaultStyleId: typeof candidate.defaultStyleId === "string" ? candidate.defaultStyleId : defaultReflectionStyleId,
    migratedLegacyKeys: Array.isArray(candidate.migratedLegacyKeys) ? candidate.migratedLegacyKeys.filter((item) => typeof item === "string") : [],
    notes: candidate.notes.filter(isReflectionNote).map((note) => ({
      ...note,
      x: clampPercent(note.x),
      y: clampPercent(note.y),
      rotation: clampRotation(note.rotation),
      styleId: validStyleId(note.styleId) ? note.styleId : selectPaperStyle(note.id)
    }))
  };
}

function saveWall(state: ReflectionWallState, now: Date): ReflectionWallState {
  return { ...state, savedAt: now.toISOString() };
}

function clampPercent(value: number): number {
  return Math.max(4, Math.min(96, Number.isFinite(value) ? Math.round(value * 100) / 100 : 50));
}

function clampRotation(value: number): number {
  return Math.max(-2.5, Math.min(2.5, Number.isFinite(value) ? Math.round(value * 10) / 10 : 0));
}

function nextReflectionPosition(notes: ReflectionNote[]): { x: number; y: number } {
  const columns = 5;
  const index = notes.length;
  const x = 14 + (index % columns) * 18 + ((index * 7) % 5);
  const y = 18 + (Math.floor(index / columns) % 5) * 16 + ((index * 11) % 6);
  return { x, y };
}

function seededRotation(seed: string): number {
  const total = [...seed].reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return ((total % 51) - 25) / 10;
}

function selectPaperStyle(seed: string): string {
  const total = [...seed].reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return reflectionPaperStyles[total % reflectionPaperStyles.length].id;
}

function validStyleId(styleId: string): boolean {
  return reflectionPaperStyles.some((style) => style.id === styleId);
}

function isWithinDateFilter(value: string, filter: ReflectionWallFilter, now: Date): boolean {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return false;
  if (filter === "today") return date.toDateString() === now.toDateString();
  if (filter === "month") return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth();
  if (filter === "week") {
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);
    start.setDate(start.getDate() - start.getDay());
    const end = new Date(start);
    end.setDate(start.getDate() + 7);
    return date >= start && date < end;
  }
  return true;
}

function isReflectionNote(value: unknown): value is ReflectionNote {
  if (!value || typeof value !== "object") return false;
  const note = value as ReflectionNote;
  return typeof note.id === "string"
    && typeof note.text === "string"
    && typeof note.createdAt === "string"
    && typeof note.styleId === "string"
    && typeof note.x === "number"
    && typeof note.y === "number"
    && typeof note.rotation === "number"
    && (note.source === "manual" || note.source === "chapter");
}
