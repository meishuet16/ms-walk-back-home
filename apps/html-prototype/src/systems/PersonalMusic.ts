import type { LyricsOverlayState, MusicPlaybackMode, MusicSort, PersonalPlayerState, SceneId, SyncedLyricLine, UserMusicTrack } from "../types.js";
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
    playbackMode: "next"
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

export function clampLyricsOverlay(overlay: LyricsOverlayState, stageWidth: number, stageHeight: number): LyricsOverlayState {
  const width = Math.max(180, Math.min(360, overlay.width ?? 280));
  return {
    x: Math.max(0, Math.min(stageWidth - width, overlay.x)),
    y: Math.max(0, Math.min(stageHeight - 84, overlay.y)),
    width
  };
}

export function personalMusicShouldPlayInScene(scene: SceneId): boolean {
  return scene === "muji-room" || scene === "forest";
}

export function personalMusicShouldResumeAfterScene(from: SceneId, to: SceneId): boolean {
  return !personalMusicShouldPlayInScene(from) && personalMusicShouldPlayInScene(to);
}

export function nextTrackIdForPlayback(ids: string[], currentId: string | undefined, mode: MusicPlaybackMode, random = Math.random): string | undefined {
  if (!ids.length) return undefined;
  if (mode === "repeat-one" && currentId) return currentId;
  const currentIndex = Math.max(0, ids.findIndex((id) => id === currentId));
  if (mode === "shuffle" && ids.length > 1) {
    const candidates = ids.filter((id) => id !== currentId);
    return candidates[Math.floor(random() * candidates.length)] ?? candidates[0];
  }
  return ids[(currentIndex + 1) % ids.length];
}

export function normalizePlaybackMode(value: unknown): MusicPlaybackMode {
  return value === "repeat-one" || value === "shuffle" || value === "next" ? value : "next";
}
