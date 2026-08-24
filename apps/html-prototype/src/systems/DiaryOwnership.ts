import { authoredChapterDiaryEntries } from "../fixtures/authoredDiaryEntries.js";
import type { DiaryEntry, DiarySource } from "../types.js";

const authoredById = new Map(authoredChapterDiaryEntries.map((entry) => [entry.id, entry]));
const authoredByChapterId = new Map(
  authoredChapterDiaryEntries
    .filter((entry): entry is DiaryEntry & { chapterId: string } => Boolean(entry.chapterId))
    .map((entry) => [entry.chapterId, entry])
);

export function getCanonicalAuthoredDiaryEntry(idOrEntry: string | Pick<DiaryEntry, "id" | "chapterId">): DiaryEntry | null {
  if (typeof idOrEntry === "string") return authoredById.get(idOrEntry) ?? authoredByChapterId.get(idOrEntry) ?? null;
  return authoredById.get(idOrEntry.id) ?? (idOrEntry.chapterId ? authoredByChapterId.get(idOrEntry.chapterId) : undefined) ?? null;
}

export function isCanonicalAuthoredDiary(entryOrId: string | Pick<DiaryEntry, "id" | "chapterId">): boolean {
  return Boolean(getCanonicalAuthoredDiaryEntry(entryOrId));
}

export function resolveDiarySource(entry: Pick<DiaryEntry, "id" | "chapterId" | "source">): DiarySource {
  if (isCanonicalAuthoredDiary(entry)) return "authored";
  return entry.source ?? "personal";
}

export function canMutateDiary(entryOrId: string | Pick<DiaryEntry, "id" | "chapterId" | "source">): boolean {
  if (typeof entryOrId === "string") return !isCanonicalAuthoredDiary(entryOrId);
  return resolveDiarySource(entryOrId) === "personal";
}

export function filterPersistableDiaryEntries(entries: DiaryEntry[]): DiaryEntry[] {
  return entries.filter((entry) => canMutateDiary(entry));
}
