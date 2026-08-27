import type { SyncedLyricLine } from "../types.js";
import { activeLyricIndexAt } from "./PersonalMusic.js";

export type LyricsViewerLineState = "active" | "near" | "idle";

export type LyricsViewerState = {
  activeIndex: number;
  followEnabled: boolean;
  showReturnControl: boolean;
  seekTo: number | null;
};

export type LyricsViewerLine = {
  index: number;
  line: SyncedLyricLine;
  state: LyricsViewerLineState;
};

export function createLyricsViewerState(lines: SyncedLyricLine[], currentTime: number): LyricsViewerState {
  return {
    activeIndex: activeLyricIndexAt(lines, currentTime),
    followEnabled: true,
    showReturnControl: false,
    seekTo: null
  };
}

export function buildLyricsViewerLines(lines: SyncedLyricLine[], activeIndex: number): LyricsViewerLine[] {
  return lines.map((line, index) => ({
    index,
    line,
    state: index === activeIndex ? "active" : Math.abs(index - activeIndex) <= 2 ? "near" : "idle"
  }));
}

export function markLyricsManuallyScrolled(state: LyricsViewerState): LyricsViewerState {
  return { ...state, followEnabled: false, showReturnControl: true, seekTo: null };
}

export function returnToCurrentLyric(state: LyricsViewerState, lines: SyncedLyricLine[], currentTime: number): LyricsViewerState {
  return {
    ...state,
    activeIndex: activeLyricIndexAt(lines, currentTime),
    followEnabled: true,
    showReturnControl: false,
    seekTo: null
  };
}

export function seekTargetForLyricLine(lines: SyncedLyricLine[], index: number): { seekTo: number; activeIndex: number; followEnabled: true } | null {
  const line = lines[index];
  if (!line || !Number.isFinite(line.time)) return null;
  return { seekTo: line.time, activeIndex: index, followEnabled: true };
}
