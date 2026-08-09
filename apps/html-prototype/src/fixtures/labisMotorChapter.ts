import type { ChapterDefinition } from "../types.js";

export const labisMotorChapter: ChapterDefinition = {
  id: "labis-motor-day",
  runtimeScene: "labis",
  date: "07.19",
  title: "学会驾 motor 的下午",
  mood: "ordinary, warm, quietly precious",
  weather: "sunny afternoon",
  location: "Labis",
  characters: ["ET", "MS"],
  objects: ["motor"],
  evidence: ["labis-july19-background"],
  memoryText: [
    "2026-07-19 · 学会驾 motor 的下午",
    "她一直要我教她驾 motor。",
    "然后她真的学会了。"
  ],
  dialogue: [
    {
      id: "et-learns-motor",
      speaker: "ET",
      portrait: "none",
      text: "单凭这一点，没有白来。"
    }
  ],
  canonicalClosure: {
    historicalEventId: "july19-motor-learning",
    lines: [
      "The afternoon stays ordinary.",
      "ET learns to keep the motor moving.",
      "Muji leaves Labis without making the memory louder than it was."
    ]
  },
  reflectionQuotes: [
    {
      id: "labis-motor-ordinary",
      tone: "accepting",
      lines: ["那天下午没有变成电影。", "只是后来才知道，普通也会发光。"]
    },
    {
      id: "labis-motor-holding",
      tone: "holding",
      lines: ["马路还是那条马路。", "有些记忆，是因为没有预告才珍贵。"]
    }
  ]
};
