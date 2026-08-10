import type { DiaryEntry, DiaryLibraryState, MemoryKind } from "../types.js";
import { diaryEntriesToForestMemories, diaryEntriesToTimeline, updateDiaryMemoryKind, type DiaryForestMemory, type DiaryTimelineItem } from "./DiaryImport.js";
import { makeDiaryEntry, normalizeDiaryEntry } from "./DiaryImport.js";

export function createDiaryLibrary(entries: DiaryEntry[] = [], legacyArtifacts: string[] = []): DiaryLibraryState {
  return {
    version: 1,
    savedAt: new Date().toISOString(),
    entries,
    legacyArtifacts
  };
}

export function upsertDiaryEntry(library: DiaryLibraryState, entry: DiaryEntry): DiaryLibraryState {
  const index = library.entries.findIndex((item) => item.id === entry.id);
  const entries = [...library.entries];
  if (index >= 0) entries[index] = entry;
  else entries.push(entry);
  return { ...library, entries, savedAt: new Date().toISOString() };
}

export function upsertDiaryPageDraft(library: DiaryLibraryState, entry: DiaryEntry): DiaryLibraryState {
  return upsertDiaryEntry(library, normalizeDiaryEntry(entry));
}

export function openDiaryPageForDate(library: DiaryLibraryState, date: string): { library: DiaryLibraryState; entry: DiaryEntry; created: boolean } {
  const existing = library.entries.find((entry) => entry.date === date);
  if (existing) return { library, entry: existing, created: false };
  const entry = makeDiaryEntry(date, "Untitled Memory", "");
  const nextLibrary = upsertDiaryEntry(library, entry);
  return { library: nextLibrary, entry, created: true };
}

export function createNewDiaryPage(library: DiaryLibraryState, date: string): { library: DiaryLibraryState; entry: DiaryEntry } {
  const entry = makeDiaryEntry(date, "Untitled Memory", "", `diary-${date}-${Date.now()}-${library.entries.length + 1}`);
  const nextLibrary = upsertDiaryEntry(library, entry);
  return { library: nextLibrary, entry };
}

export function formatDiaryWeekday(date: string): string {
  const parsedDate = new Date(`${date}T00:00:00`);
  return Number.isNaN(parsedDate.getTime()) ? "" : ["周日", "周一", "周二", "周三", "周四", "周五", "周六"][parsedDate.getDay()];
}

export function setDiaryEntryKind(library: DiaryLibraryState, id: string, memoryKind: MemoryKind, chapterId?: string): DiaryLibraryState {
  return {
    ...library,
    savedAt: new Date().toISOString(),
    entries: library.entries.map((entry) => entry.id === id ? updateDiaryMemoryKind(entry, memoryKind, chapterId) : entry)
  };
}

export function deleteDiaryEntryById(library: DiaryLibraryState, id: string): DiaryLibraryState {
  return {
    ...library,
    savedAt: new Date().toISOString(),
    entries: library.entries.filter((entry) => entry.id !== id)
  };
}

export function getDiaryTimeline(library: DiaryLibraryState): DiaryTimelineItem[] {
  return diaryEntriesToTimeline(library.entries);
}

export function getDiaryForestMemories(library: DiaryLibraryState): DiaryForestMemory[] {
  return diaryEntriesToForestMemories(library.entries);
}
