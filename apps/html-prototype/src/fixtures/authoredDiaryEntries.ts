import { bakeryChapter } from "./chapterPlan.js";
import { labisMotorChapter } from "./labisMotorChapter.js";
import { march30Chapter } from "./march30Chapter.js";
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
  },
  {
    id: "authored-diary-march30-too-fated",
    date: "2026-03-30",
    title: "03.30 · Too Fated",
    body: (march30Chapter.memoryText ?? []).slice(1).join("\n\n"),
    location: march30Chapter.location,
    weather: march30Chapter.weather,
    memoryKind: "chapter",
    mood: "calm",
    chapterId: "march30-too-fated",
    photos: [],
    scrapbookLayout: { elements: [] }
  }
];
