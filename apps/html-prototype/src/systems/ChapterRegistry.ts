import { bakeryChapter, forestDoors } from "../fixtures/chapterPlan.js";
import { labisMotorChapter } from "../fixtures/labisMotorChapter.js";
import { march30Chapter } from "../fixtures/march30Chapter.js";
import { april06Chapter } from "../fixtures/april06Chapter.js";
import type { ChapterDefinition } from "../types.js";

export type AuthoredForestEntry = (typeof forestDoors)[number];

export type ForestRoute =
  | { kind: "implemented-chapter"; chapter: ChapterDefinition }
  | { kind: "stub"; message: string };

export const chapterRegistry: Record<string, ChapterDefinition> = {
  "bakery-day": {
    ...bakeryChapter,
    runtimeScene: "bakery",
    canonicalClosure: {
      historicalEventId: "yumido-rain-conversation-ends",
      lines: [
        "Friend A finishes the conversation.",
        "The rain slows outside Yumido Bread.",
        "Muji walks toward the door and carries the day back to the forest."
      ]
    },
    reflectionQuotes: [
      {
        id: "yumido-accepting",
        tone: "accepting",
        lines: ["那块面包还是那么小。", "这一次，我没有再把故事说大。"]
      },
      {
        id: "yumido-rewriting",
        tone: "rewriting",
        lines: ["我差一点又把那天改得温柔一点。", "还好，她原来的声音还在。"]
      },
      {
        id: "yumido-holding",
        tone: "holding",
        lines: ["雨已经停了。", "我还是陪她多坐了一会。"]
      },
      {
        id: "yumido-not-ready",
        tone: "not-ready",
        lines: ["我还是没有准备好回答。", "但这一次，我知道自己在逃什么。"]
      }
    ]
  },
  "labis-motor-day": labisMotorChapter,
  "march30-too-fated": march30Chapter,
  "april06-not-gone-yet": april06Chapter
};

export const forestEntries = forestDoors;

export function routeForestEntry(entry: AuthoredForestEntry): ForestRoute {
  const chapter = chapterRegistry[entry.chapterId];
  if (!chapter) return { kind: "stub", message: "This memory is not yet authored." };
  return { kind: "implemented-chapter", chapter };
}
