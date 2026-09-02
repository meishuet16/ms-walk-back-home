import type { DiaryEntry, DiaryLibraryState, MemoryKind } from "../types.js";
import { authoredChapterDiaryEntries } from "../fixtures/authoredDiaryEntries.js";
import type { AuthoredForestEntry } from "./ChapterRegistry.js";
import { diaryEntriesToForestMemories, diaryEntriesToTimeline, updateDiaryMemoryKind, type DiaryForestMemory, type DiaryTimelineItem, type DiaryTimelineSort } from "./DiaryImport.js";
import { makeDiaryEntry, normalizeDiaryEntry } from "./DiaryImport.js";
import { canMutateDiary, getCanonicalAuthoredDiaryEntry, isCanonicalAuthoredDiary } from "./DiaryOwnership.js";

export const sharedChapterDiaryBookAssetPath = "assets/labis/book-with-ms-photos.png";

export function createDiaryLibrary(entries: DiaryEntry[] = [], legacyArtifacts: string[] = []): DiaryLibraryState {
  return {
    version: 1,
    savedAt: new Date().toISOString(),
    entries,
    legacyArtifacts,
    monthlyCovers: {}
  };
}

export function upsertDiaryEntry(library: DiaryLibraryState, entry: DiaryEntry): DiaryLibraryState {
  if (isCanonicalAuthoredDiary(entry)) return { ...library, entries: mergeCanonicalAndPersonalDiaries(library.entries), savedAt: new Date().toISOString() };
  const index = library.entries.findIndex((item) => item.id === entry.id);
  const entries = [...library.entries];
  if (index >= 0) entries[index] = entry;
  else entries.push(entry);
  return { ...library, entries, savedAt: new Date().toISOString() };
}

export function upsertDiaryPageDraft(library: DiaryLibraryState, entry: DiaryEntry): DiaryLibraryState {
  return upsertDiaryEntry(library, normalizeDiaryEntry(entry));
}

export function seedAuthoredChapterDiaryEntries(library: DiaryLibraryState): DiaryLibraryState {
  return { ...library, entries: mergeCanonicalAndPersonalDiaries(library.entries), savedAt: new Date().toISOString() };
}

export function mergeCanonicalAndPersonalDiaries(entries: DiaryEntry[], canonicalEntries: DiaryEntry[] = authoredChapterDiaryEntries): DiaryEntry[] {
  const canonicalById = new Map(canonicalEntries.map((entry) => [entry.id, entry]));
  const canonicalByChapterId = new Map(canonicalEntries.filter((entry) => entry.chapterId).map((entry) => [entry.chapterId, entry]));
  const isCanonical = (entry: DiaryEntry) => canonicalById.has(entry.id) || (entry.chapterId ? canonicalByChapterId.has(entry.chapterId) : false);
  const personalEntries = entries.filter((entry) => !isCanonical(entry) && canMutateDiary(entry)).map((entry) => normalizeDiaryEntry(entry));
  const currentCanonicalEntries = canonicalEntries.map((entry) => ({ ...entry, source: "authored" as const }));
  return [...personalEntries, ...currentCanonicalEntries];
}

export function findChapterDiaryEntry(entries: DiaryEntry[], chapterId: string, diaryEntryId?: string): DiaryEntry | null {
  if (diaryEntryId) {
    const canonical = getCanonicalAuthoredDiaryEntry(diaryEntryId);
    if (canonical) return canonical;
    const stable = entries.find((entry) => entry.id === diaryEntryId);
    if (stable) return stable;
  }
  const canonical = getCanonicalAuthoredDiaryEntry(chapterId);
  if (canonical) return canonical;
  return entries.find((entry) => entry.chapterId === chapterId) ?? null;
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
    entries: library.entries.map((entry) => entry.id === id && canMutateDiary(entry) ? updateDiaryMemoryKind(entry, memoryKind, chapterId) : entry)
  };
}

export function deleteDiaryEntryById(library: DiaryLibraryState, id: string): DiaryLibraryState {
  return {
    ...library,
    savedAt: new Date().toISOString(),
    entries: library.entries.filter((entry) => entry.id !== id || !canMutateDiary(entry))
  };
}

export function deleteDiaryEntriesByIds(library: DiaryLibraryState, ids: Set<string>): DiaryLibraryState {
  return {
    ...library,
    savedAt: new Date().toISOString(),
    entries: library.entries.filter((entry) => !ids.has(entry.id) || !canMutateDiary(entry))
  };
}

export function getDiaryTimeline(library: DiaryLibraryState, sort: DiaryTimelineSort = "date-desc"): DiaryTimelineItem[] {
  return diaryEntriesToTimeline(library.entries, sort);
}

export function getDiaryForestMemories(library: DiaryLibraryState): DiaryForestMemory[] {
  return diaryEntriesToForestMemories(library.entries);
}

export function forestNodesForMonth(publicEntries: AuthoredForestEntry[], library: DiaryLibraryState, monthKey: string): Array<AuthoredForestEntry | DiaryForestMemory> {
  const visiblePublicEntries = publicEntries.filter((entry) => forestEntryMatchesMonth(entry.date, monthKey, entry.year));
  const publicChapterIds = new Set(publicEntries.map((entry) => entry.chapterId));
  const privateMemories = getDiaryForestMemories(library)
    .filter((entry) => entry.date.startsWith(monthKey))
    .filter((entry) => entry.kind !== "chapter" || !publicChapterIds.has(entry.chapterId));
  return [...visiblePublicEntries, ...privateMemories];
}

function forestEntryMatchesMonth(date: string, monthKey: string, year?: number): boolean {
  const [yearText, monthText] = monthKey.split("-");
  if (year !== undefined && String(year) !== yearText) return false;
  if (/^\d{4}-\d{2}/.test(date)) return date.startsWith(monthKey);
  return date.startsWith(`${monthText}.`) || date.startsWith(`${monthText}/`);
}
