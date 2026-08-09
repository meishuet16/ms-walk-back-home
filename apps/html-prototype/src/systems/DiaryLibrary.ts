import type { DiaryEntry, DiaryLibraryState, MemoryKind } from "../types.js";
import { diaryEntriesToForestMemories, diaryEntriesToTimeline, updateDiaryMemoryKind, type DiaryForestMemory, type DiaryTimelineItem } from "./DiaryImport.js";

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
