import { bakeryChapter } from "./chapterPlan.js";
import { labisMotorChapter } from "./labisMotorChapter.js";
import type { DiaryEntry } from "../types.js";

export const authoredChapterDiaryEntries: DiaryEntry[] = [
  {
    id: "authored-diary-labis-motor-day",
    date: "2026-07-19",
    title: "07.19 · 单凭这一点，没有白来",
    body: [labisMotorChapter.title, ...(labisMotorChapter.memoryText ?? [])].join("\n\n"),
    location: "Labis, Johor",
    weather: "Sunny",
    memoryKind: "chapter",
    mood: "happy",
    chapterId: "labis-motor-day",
    photos: [],
    scrapbookLayout: { elements: [] }
  },
  {
    id: "authored-diary-bakery-day",
    date: "2026-07-28",
    title: "Yumido Bread",
    body: [bakeryChapter.title, ...(bakeryChapter.memoryText ?? [])].join("\n\n"),
    location: bakeryChapter.location,
    weather: bakeryChapter.weather,
    memoryKind: "chapter",
    mood: "calm",
    chapterId: "bakery-day",
    photos: [],
    scrapbookLayout: { elements: [] }
  }
];
