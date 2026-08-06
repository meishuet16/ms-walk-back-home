import type { DiaryEntry } from "../types.js";

export type DiaryDoor = {
  id: string;
  date: string;
  title: string;
  x: number;
  y: number;
  chapterId: string;
  memoryText: string[];
  userEntryId: string;
};

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

export function makeDiaryEntry(date: string, title: string, body: string, id = makeDiaryId(date, title)): DiaryEntry {
  return {
    id,
    date: date.trim(),
    title: title.trim() || "Untitled Memory",
    body: body.trim()
  };
}

export function diaryEntryToDoor(entry: DiaryEntry, index: number): DiaryDoor {
  const position = datePositionPool[index % datePositionPool.length];
  return {
    id: entry.id,
    date: entry.date,
    title: entry.title,
    x: position.x,
    y: position.y,
    chapterId: entry.id,
    userEntryId: entry.id,
    memoryText: [
      `${entry.date} · ${entry.title}`,
      entry.body,
      "Muji does not know whether this day wants to become a chapter yet. For now, the forest gives it a small light."
    ]
  };
}
