import type { DiaryEntry, MemoryKind } from "../types.js";
import { normalizeDiaryMood } from "./DiaryMood.js";

export type DiaryTimelineItem = {
  id: string;
  date: string;
  title: string;
  body: string;
  memoryKind: MemoryKind;
  chapterId?: string;
  hasScrapbookLayout: boolean;
};

export type DiaryTimelineSort = "date-desc" | "date-asc" | "title-asc";

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

const authoredChapterIds = new Set(["bakery-day", "labis-motor-day"]);

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

export function diaryEntriesToTimeline(entries: DiaryEntry[], sort: DiaryTimelineSort = "date-desc"): DiaryTimelineItem[] {
  return sortDiaryEntriesForTimeline(entries, sort).map(diaryEntryToTimelineItem);
}

export function sortDiaryEntriesForTimeline(entries: DiaryEntry[], sort: DiaryTimelineSort = "date-desc"): DiaryEntry[] {
  return [...entries].sort((a, b) => {
    const newestFirst = b.date.localeCompare(a.date) || b.id.localeCompare(a.id);
    if (sort === "date-asc") return a.date.localeCompare(b.date) || a.id.localeCompare(b.id);
    if (sort === "title-asc") return a.title.localeCompare(b.title) || newestFirst;
    return newestFirst;
  });
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

export function normalizeDiaryEntry(entry: Partial<DiaryEntry> & Pick<DiaryEntry, "date" | "title" | "body">): DiaryEntry {
  return {
    id: entry.id || makeDiaryId(entry.date, entry.title),
    date: entry.date.trim(),
    title: entry.title.trim() || "Untitled Memory",
    body: entry.body.trim(),
    location: entry.location?.trim(),
    weather: entry.weather?.trim(),
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
  const markdownEntries = parseMarkdownDiaryImport(text);
  if (markdownEntries.length) return markdownEntries;
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [date = "", title = "", ...bodyParts] = line.split("|").map((part) => part.trim());
      const body = bodyParts.join(" | ").trim();
      if (!isIsoDate(date)) return null;
      return makeDiaryEntry(date, title || "Untitled Memory", body || line);
    })
    .filter((entry): entry is DiaryEntry => Boolean(entry))
    .filter((entry) => entry.body.length > 0);
}

function cleanMarkdownInline(value: string): string {
  return value
    .replace(/\*\*/g, "")
    .replace(/__+/g, "")
    .replace(/`/g, "")
    .trim();
}

function isDiaryHeading(line: string): boolean {
  return /^#{1,3}/.test(line.trim()) && parseHeadingDateWeather(line.trim()) !== null;
}

function parseHeadingDateWeather(heading: string): { date: string; title?: string; weather?: string } | null {
  const cleaned = cleanMarkdownInline(heading.replace(/^#{1,3}\s*/, ""));
  const match = cleaned.match(/^(\d{4}-\d{2}-\d{2}|\d{4}年\d{1,2}月\d{1,2}日)(?:\s*[-:｜|]\s*(.+)|\s+(.+))?$/);
  if (!match) return null;
  const date = normalizeImportDate(match[1]);
  const tail = (match[2] ?? match[3] ?? "").trim();
  const weatherWords = /雨|晴|阴|云|风|雪|storm|rain|sunny|cloud|clear/i;
  return {
    date,
    weather: tail && weatherWords.test(tail) ? tail : undefined,
    title: tail && !weatherWords.test(tail) ? tail : undefined
  };
}

function normalizeImportDate(value: string): string {
  const chinese = value.match(/^(\d{4})年(\d{1,2})月(\d{1,2})日$/);
  if (!chinese) return value;
  const [, year, month, day] = chinese;
  return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
}

function isIsoDate(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value.trim());
}

function parseMarkdownDiaryImport(text: string): DiaryEntry[] {
  const lines = text.replace(/\r\n/g, "\n").split("\n");
  const headingIndexes = lines.map((line, index) => isDiaryHeading(line) ? index : -1).filter((index) => index >= 0);
  if (!headingIndexes.length) return [];
  return headingIndexes
    .map((start, index) => parseMarkdownDiaryBlock(lines.slice(start, headingIndexes[index + 1] ?? lines.length)))
    .filter((entry): entry is DiaryEntry => Boolean(entry));
}

function parseMarkdownDiaryBlock(lines: string[]): DiaryEntry | null {
  const headingMeta = parseHeadingDateWeather(lines[0] ?? "");
  if (!headingMeta) return null;
  const metadata: Partial<Pick<DiaryEntry, "title" | "location" | "weather">> = { weather: headingMeta.weather };
  const bodyLines: string[] = [];
  for (const rawLine of lines.slice(1)) {
    const line = rawLine.trim();
    const titleHeading = line.match(/^#{2,4}\s+(.+)$/);
    if (titleHeading && !metadata.title) {
      metadata.title = cleanMarkdownInline(titleHeading[1]);
      continue;
    }
    const field = line.match(/^(title|location|weather|标题|地点|天气)\s*[:：]\s*(.+)$/i);
    if (field) {
      const key = field[1].toLowerCase();
      const value = cleanMarkdownInline(field[2]);
      if (key === "title" || key === "标题") metadata.title = value;
      if (key === "location" || key === "地点") metadata.location = value;
      if (key === "weather" || key === "天气") metadata.weather = value;
      continue;
    }
    bodyLines.push(rawLine);
  }
  const body = bodyLines.join("\n").trim();
  const derivedTitle = bodyLines.map((line) => line.trim()).find(Boolean)?.slice(0, 32);
  return normalizeDiaryEntry({
    date: headingMeta.date,
    title: metadata.title ?? headingMeta.title ?? derivedTitle ?? "Untitled Memory",
    body,
    location: metadata.location,
    weather: metadata.weather
  });
}

export function diaryEntryToDoor(entry: DiaryEntry, index: number): DiaryDoor {
  const memory = diaryEntryToForestMemory(updateDiaryMemoryKind(entry, "chapter"), index);
  if (!memory || memory.kind !== "chapter") throw new Error("Expected chapter diary entry");
  return memory;
}
