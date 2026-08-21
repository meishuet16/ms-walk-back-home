import type { LyricsOverlayState, MusicPlaybackMode, MusicSort, PersonalMusicLibraryState, PersonalPlayerState, SceneId, SyncedLyricLine, UserMusicTrack } from "../types.js";
import { vinylRecords } from "./MujiRoom.js";

export const builtInRecordIds = vinylRecords.map((record) => record.id);

export function createDefaultPersonalPlayerState(): PersonalPlayerState {
  return {
    version: 1,
    playing: false,
    playbackPosition: 0,
    visualMode: "vinyl",
    lyricsVisible: true,
    lyricsOverlay: { x: 620, y: 96, width: 280 },
    librarySort: "recently-added",
    librarySearch: "",
    shuffleEnabled: false,
    repeatOne: false
  };
}

export function isBuiltInTrackId(id: string): boolean {
  return builtInRecordIds.includes(id);
}

export function filterAndSortMusic(tracks: UserMusicTrack[], search: string, sort: MusicSort): UserMusicTrack[] {
  const needle = search.trim().toLocaleLowerCase();
  const filtered = needle
    ? tracks.filter((track) => [track.title, track.artist, track.album].filter(Boolean).join(" ").toLocaleLowerCase().includes(needle))
    : [...tracks];
  return filtered.sort((a, b) => {
    if (sort === "title") return a.title.localeCompare(b.title, undefined, { sensitivity: "base" });
    if (sort === "artist") return (a.artist || "").localeCompare(b.artist || "", undefined, { sensitivity: "base" }) || a.title.localeCompare(b.title, undefined, { sensitivity: "base" });
    if (sort === "recently-played") return (b.lastPlayedAt ?? 0) - (a.lastPlayedAt ?? 0) || b.addedAt - a.addedAt;
    return b.addedAt - a.addedAt;
  });
}

export type BatchMusicMetadata = {
  artist?: string;
  album?: string;
};

export type BuiltInMusicMetadata = Record<string, BatchMusicMetadata>;

export function selectAllMusicTrackIds(ids: string[]): string[] {
  return [...ids];
}

export function applyBatchMusicMetadata(
  library: PersonalMusicLibraryState,
  selectedIds: string[],
  metadata: BatchMusicMetadata,
  builtInMeta: BuiltInMusicMetadata,
  now = new Date()
): { library: PersonalMusicLibraryState; builtInMeta: BuiltInMusicMetadata } {
  const selected = new Set(selectedIds);
  const nextMetadata = Object.fromEntries(
    Object.entries(metadata)
      .map(([key, value]) => [key, value?.trim() ?? ""] as const)
      .filter(([, value]) => Boolean(value))
  ) as BatchMusicMetadata;
  const nextLibrary = {
    ...library,
    savedAt: now.toISOString(),
    tracks: library.tracks.map((track) => selected.has(track.id)
      ? { ...track, ...nextMetadata }
      : track)
  };
  const nextBuiltInMeta = { ...builtInMeta };
  for (const id of selectedIds) {
    if (library.tracks.some((track) => track.id === id)) continue;
    if (!nextBuiltInMeta[id]) nextBuiltInMeta[id] = {};
    nextBuiltInMeta[id] = { ...nextBuiltInMeta[id], ...nextMetadata };
  }
  return { library: nextLibrary, builtInMeta: nextBuiltInMeta };
}

export function parseLrc(source: string): SyncedLyricLine[] {
  const lines: SyncedLyricLine[] = [];
  const pattern = /\[(\d{1,2}):(\d{2})(?:\.(\d{1,3}))?\]([^\n\r]*)/g;
  for (const rawLine of source.split(/\r?\n/)) {
    pattern.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(rawLine))) {
      const minutes = Number(match[1]);
      const seconds = Number(match[2]);
      const fractionText = (match[3] ?? "").padEnd(3, "0").slice(0, 3);
      const fraction = fractionText ? Number(fractionText) / 1000 : 0;
      const text = match[4].trim();
      if (!Number.isFinite(minutes) || !Number.isFinite(seconds) || !text) continue;
      lines.push({ time: minutes * 60 + seconds + fraction, text });
    }
  }
  return lines.sort((a, b) => a.time - b.time);
}

export function activeLyricIndexAt(lines: SyncedLyricLine[], currentTime: number): number {
  let active = -1;
  for (let index = 0; index < lines.length; index += 1) {
    if (lines[index].time <= currentTime) active = index;
    else break;
  }
  return active;
}

export type LyricWindowLine = {
  line: SyncedLyricLine | null;
  state: "previous" | "active" | "next";
  sourceIndex: number;
};

export function lyricWindowForTime(lines: SyncedLyricLine[], currentTime: number): LyricWindowLine[] {
  if (!lines.length) return [];
  const active = Math.max(0, activeLyricIndexAt(lines, currentTime));
  return [
    { line: lines[active - 1] ?? null, state: "previous", sourceIndex: active - 1 },
    { line: lines[active] ?? null, state: "active", sourceIndex: active },
    { line: lines[active + 1] ?? null, state: "next", sourceIndex: active + 1 }
  ];
}

export function clampLyricsOverlay(overlay: LyricsOverlayState, stageWidth: number, stageHeight: number): LyricsOverlayState {
  const width = Math.max(96, Math.min(520, overlay.width ?? 280));
  const height = Math.max(44, Math.min(260, overlay.height ?? 116));
  const maxX = Math.max(0, stageWidth - width - 8);
  const maxY = Math.max(0, stageHeight - height - 8);
  return {
    x: Math.max(0, Math.min(maxX, overlay.x)),
    y: Math.max(0, Math.min(maxY, overlay.y)),
    width,
    height
  };
}

export function personalMusicShouldPlayInScene(scene: SceneId): boolean {
  return scene === "muji-room" || scene === "forest";
}

export function personalMusicShouldResumeAfterScene(from: SceneId, to: SceneId): boolean {
  return !personalMusicShouldPlayInScene(from) && personalMusicShouldPlayInScene(to);
}

export function nextTrackIdForPlayback(ids: string[], currentId: string | undefined, options: { repeatOne?: boolean; shuffleEnabled?: boolean } = {}, random = Math.random): string | undefined {
  if (!ids.length) return undefined;
  if (options.repeatOne && currentId) return currentId;
  const currentIndex = Math.max(0, ids.findIndex((id) => id === currentId));
  if (options.shuffleEnabled && ids.length > 1) {
    const candidates = ids.filter((id) => id !== currentId);
    return candidates[Math.floor(random() * candidates.length)] ?? candidates[0];
  }
  return ids[(currentIndex + 1) % ids.length];
}

export function adjacentTrackIdForControl(ids: string[], currentId: string | undefined, direction: -1 | 1, options: { repeatOne?: boolean; shuffleEnabled?: boolean } = {}, random = Math.random): string | undefined {
  if (!ids.length) return undefined;
  const currentIndex = Math.max(0, ids.findIndex((id) => id === currentId));
  if (direction > 0 && options.shuffleEnabled && ids.length > 1) {
    const candidates = ids.filter((id) => id !== currentId);
    return candidates[Math.floor(random() * candidates.length)] ?? candidates[0];
  }
  return ids[(currentIndex + direction + ids.length) % ids.length];
}

export function normalizePlaybackMode(value: unknown): MusicPlaybackMode {
  return value === "repeat-one" || value === "shuffle" || value === "next" ? value : "next";
}

export function removeUserMusicTrack(library: PersonalMusicLibraryState, trackId: string, fallbackTrackIds: string[] = []): {
  library: PersonalMusicLibraryState;
  removed?: UserMusicTrack;
  blobKeysToDelete: string[];
  nextTrackId?: string;
} {
  const removed = library.tracks.find((track) => track.id === trackId);
  if (!removed) return { library, blobKeysToDelete: [], nextTrackId: library.tracks[0]?.id ?? fallbackTrackIds[0] };
  const tracks = library.tracks.filter((track) => track.id !== trackId);
  return {
    library: { ...library, tracks, savedAt: new Date().toISOString() },
    removed,
    blobKeysToDelete: [removed.audioBlobKey, removed.coverBlobKey].filter((key): key is string => Boolean(key)),
    nextTrackId: tracks[0]?.id ?? fallbackTrackIds[0]
  };
}

export function removeSelectedMusicTracks(
  library: PersonalMusicLibraryState,
  selectedIds: string[],
  builtInIds: string[],
  now = new Date()
): {
  library: PersonalMusicLibraryState;
  removed: UserMusicTrack[];
  skippedBuiltInCount: number;
  blobKeysToDelete: string[];
  nextTrackId?: string;
} {
  const selected = new Set(selectedIds);
  const builtIns = new Set(builtInIds);
  const removed = library.tracks.filter((track) => selected.has(track.id));
  const tracks = library.tracks.filter((track) => !selected.has(track.id));
  return {
    library: { ...library, tracks, savedAt: now.toISOString() },
    removed,
    skippedBuiltInCount: selectedIds.filter((id) => builtIns.has(id)).length,
    blobKeysToDelete: removed.flatMap((track) => [track.audioBlobKey, track.coverBlobKey].filter((key): key is string => Boolean(key))),
    nextTrackId: tracks[0]?.id
  };
}
