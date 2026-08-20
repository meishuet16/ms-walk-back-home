import type { ChapterDefinition } from "../types.js";

export const march30Chapter: ChapterDefinition = {
  id: "march30-too-fated",
  runtimeScene: "330-corridor",
  date: "03.30",
  title: "Too Fated",
  mood: "a quiet morning that keeps reconstructing itself",
  weather: "clear corridor light",
  location: "330 Corridor",
  characters: ["Muji", "MS", "ET"],
  objects: ["bench", "elevator", "gift", "water gun", "Xiaoba charms", "jacket"],
  evidence: ["authored-330-corridor-scene-layout"],
  memoryText: ["03.30 · Too Fated", "A quiet walk through the 330 corridor reconstructs a morning: a bench, three sprays of water, a jacket wipe, and the next elevator."],
  dialogue: [],
  canonicalClosure: {
    historicalEventId: "march30-bench-memory",
    lines: ["那天早上，她们在二楼道别。", "后来下一趟电梯打开，又遇见了。"]
  },
  reflectionQuotes: [
    {
      id: "march30-too-fated-reflection",
      tone: "accepting",
      title: "330 Corridor",
      lines: ["那天没有答案。只有三下水，还有一件拿来擦脸的 jacket。"]
    }
  ]
};
