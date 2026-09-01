import { bakeryChapter, forestDoors } from "../fixtures/chapterPlan.js";
import { labisMotorChapter } from "../fixtures/labisMotorChapter.js";
import { march30RefinedChapter } from "../fixtures/march30RefinedChapter.js";
import { april06Chapter } from "../fixtures/april06Chapter.js";
import { april05Chapter } from "../fixtures/april05Chapter.js";
import { april25Chapter } from "../fixtures/april25Chapter.js";
import { may23Chapter } from "../fixtures/may23Chapter.js";
import { june24Chapter } from "../fixtures/june24Chapter.js";
import { june25Chapter } from "../fixtures/june25Chapter.js";
import { july21Chapter } from "../fixtures/july21Chapter.js";
import { november22Chapter } from "../fixtures/november22Chapter.js";
import { oct29Chapter } from "../fixtures/oct29Chapter.js";
import { finalDreamChapter } from "../fixtures/finalDreamChapter.js";
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
  "march30-too-fated": march30RefinedChapter,
  "april05-come-down": april05Chapter,
  "april06-not-gone-yet": april06Chapter,
  "april25-just-good-friends": april25Chapter,
  "may23-i-arrived": may23Chapter,
  "june24-only-came-for-you": june24Chapter,
  "june25-so-i-came": june25Chapter,
  "july21-why-cant-you-stay": july21Chapter,
  "1122-before-sunrise": november22Chapter,
  "oct29-a-little-closer": oct29Chapter,
  "final-dream-tomorrow": finalDreamChapter
};

export const forestEntries = forestDoors;

export function routeForestEntry(entry: AuthoredForestEntry): ForestRoute {
  const chapter = chapterRegistry[entry.chapterId];
  if (!chapter) return { kind: "stub", message: "This memory is not yet authored." };
  return { kind: "implemented-chapter", chapter };
}
