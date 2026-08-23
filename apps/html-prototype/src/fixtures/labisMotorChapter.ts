import type { ChapterDefinition } from "../types.js";
import { labisChoicePoints, labisMemoryReflections } from "./labisMemoryEchoes.js";

export const labisMotorChapter: ChapterDefinition = {
  id: "labis-motor-day",
  diaryEntryId: "authored-diary-labis-motor-day",
  runtimeScene: "labis",
  date: "2026-07-19",
  title: "07.19 · 单凭这一点，没有白来",
  mood: "ordinary, funny, domestic, worth remembering",
  weather: "Sunny",
  location: "Labis, Johor",
  characters: ["ET", "MS", "Muji"],
  objects: ["motor", "family shop", "photos", "chicken porridge", "fried noodles", "filter manual", "Kancil", "badminton", "chicken cake"],
  evidence: ["labis-july19-background", "local-only-labis-production-assets"],
  dialogue: labisChoicePoints.map((point) => ({
    id: `labis-choice-${point.id}`,
    speaker: "Muji",
    portrait: "none",
    text: point.prompt,
    choices: point.choices
  })),
  canonicalClosure: {
    historicalEventId: "july19-motor-learning",
    lines: [
      "ET 学会了驾 motor。",
      "ET 拍下了书里的照片。",
      "那天也有鸡粥、炒面、剪刘海、Kancil、羽球和过滤器说明书。"
    ]
  },
  reflectionQuotes: labisMemoryReflections.map((reflection, index) => ({
    id: reflection.id,
    tone: index === 0 ? "accepting" : index === 1 ? "holding" : index === 2 ? "not-ready" : "rewriting",
    title: reflection.title,
    lines: reflection.lines
  }))
};
