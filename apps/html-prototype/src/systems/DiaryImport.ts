import type { DiaryEntry, DiaryMood, MemoryKind } from "../types.js";

export type DiaryTimelineItem = {
  id: string;
  date: string;
  title: string;
  body: string;
  memoryKind: MemoryKind;
  chapterId?: string;
  hasScrapbookLayout: boolean;
};

export type DiaryForestMemory =
  | {
      id: string;
      kind: "fragment";
      date: string;
      title: string;
      x: number;
      y: number;
      excerpt: string;
      userEntryId: string;
    }
  | {
      id: string;
      kind: "chapter";
      date: string;
      title: string;
      x: number;
      y: number;
      chapterId: string;
      implemented: boolean;
      memoryText: string[];
      userEntryId: string;
    };

export type DiaryDoor = Extract<DiaryForestMemory, { kind: "chapter" }>;

const authoredChapterIds = new Set(["bakery-day"]);

const datePositionPool = [
  { x: 530, y: 205 },
  { x: 860, y: 250 },
  { x: 360, y: 430 },
  { x: 1180, y: 400 },
  { x: 610, y: 635 },
  { x: 1040, y: 675 },
  { x: 280, y: 650 },
  { x: 1290, y: 250 }
];

export function diaryEntryToTimelineItem(entry: DiaryEntry): DiaryTimelineItem {
  return {
    id: entry.id,
    date: entry.date,
    title: entry.title,
    body: entry.body,
    memoryKind: entry.memoryKind,
    chapterId: entry.chapterId,
    hasScrapbookLayout: Boolean(entry.scrapbookLayout?.elements.length)
  };
}

export function diaryEntriesToTimeline(entries: DiaryEntry[]): DiaryTimelineItem[] {
  return [...entries]
    .sort((a, b) => b.date.localeCompare(a.date))
    .map(diaryEntryToTimelineItem);
}

export function diaryEntryToForestMemory(entry: DiaryEntry, index: number): DiaryForestMemory | null {
  if (entry.memoryKind === "diary") return null;
  const position = datePositionPool[index % datePositionPool.length];
  if (entry.memoryKind === "fragment") {
    return {
      id: entry.id,
      kind: "fragment",
      date: entry.date,
      title: entry.title,
      x: position.x,
      y: position.y,
      excerpt: entry.body,
      userEntryId: entry.id
    };
  }
  const chapterId = entry.chapterId || entry.id;
  return {
    id: entry.id,
    kind: "chapter",
    date: entry.date,
    title: entry.title,
    x: position.x,
    y: position.y,
    chapterId,
    implemented: authoredChapterIds.has(chapterId),
    userEntryId: entry.id,
    memoryText: [
      `${entry.date} · ${entry.title}`,
      entry.body,
      authoredChapterIds.has(chapterId)
        ? "This diary entry is linked to an authored chapter."
        : "This memory has not been authored as a full chapter yet."
    ]
  };
}

export function diaryEntriesToForestMemories(entries: DiaryEntry[]): DiaryForestMemory[] {
  return entries
    .map((entry, index) => diaryEntryToForestMemory(entry, index))
    .filter((entry): entry is DiaryForestMemory => Boolean(entry));
}

export function updateDiaryMemoryKind(entry: DiaryEntry, memoryKind: MemoryKind, chapterId = entry.chapterId): DiaryEntry {
  return {
    ...entry,
    memoryKind,
    chapterId: memoryKind === "chapter" ? chapterId || entry.id : undefined
  };
}

function normalizeMemoryKind(value: unknown): MemoryKind {
  return value === "fragment" || value === "chapter" || value === "diary" ? value : "diary";
}

function normalizeDiaryMood(value: unknown): DiaryMood {
  return value === "sad" || value === "blank" || value === "happy" || value === "excited" || value === "calm" ? value : "calm";
}

export function normalizeDiaryEntry(entry: Partial<DiaryEntry> & Pick<DiaryEntry, "date" | "title" | "body">): DiaryEntry {
  return {
    id: entry.id || makeDiaryId(entry.date, entry.title),
    date: entry.date.trim(),
    title: entry.title.trim() || "Untitled Memory",
    body: entry.body.trim(),
    memoryKind: normalizeMemoryKind(entry.memoryKind),
    mood: normalizeDiaryMood(entry.mood),
    chapterId: entry.memoryKind === "chapter" ? entry.chapterId || entry.id : undefined,
    photos: entry.photos ?? [],
    scrapbookLayout: entry.scrapbookLayout ?? { elements: [] }
  };
}

export function makeDiaryEntry(
  date: string,
  title: string,
  body: string,
  id = makeDiaryId(date, title),
  memoryKind: MemoryKind = "diary"
): DiaryEntry {
  return normalizeDiaryEntry({
    id,
    date,
    title,
    body,
    memoryKind
  });
}

export function makeDiaryId(date: string, title: string): string {
  const slug = `${date}-${title}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
  return `diary-${slug || Date.now()}`;
}

export function parseDiaryImport(text: string): DiaryEntry[] {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [date = "", title = "", ...bodyParts] = line.split("|").map((part) => part.trim());
      const body = bodyParts.join(" | ").trim();
      return makeDiaryEntry(date, title || "Untitled Memory", body || line);
    })
    .filter((entry) => entry.date.length > 0 && entry.body.length > 0);
}

export function diaryEntryToDoor(entry: DiaryEntry, index: number): DiaryDoor {
  const memory = diaryEntryToForestMemory(updateDiaryMemoryKind(entry, "chapter"), index);
  if (!memory || memory.kind !== "chapter") throw new Error("Expected chapter diary entry");
  return memory;
}
