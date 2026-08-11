import type { ChapterDefinition } from "../types.js";
import { labisChoicePoints, labisMemoryReflections } from "./labisMemoryEchoes.js";

export const labisMotorChapter: ChapterDefinition = {
  id: "labis-motor-day",
  runtimeScene: "labis",
  date: "2026-07-19",
  title: "07.19 · 单凭这一点，没有白来",
  mood: "ordinary, funny, domestic, worth remembering",
  weather: "Sunny",
  location: "Labis, Johor",
  characters: ["ET", "MS", "Muji"],
  objects: ["motor", "family shop", "photos", "chicken porridge", "fried noodles", "filter manual", "Kancil", "badminton", "chicken cake"],
  evidence: ["labis-july19-background", "local-only-labis-production-assets"],
  memoryText: [
    "2026-07-19 · Labis, Johor · Sunny",
    "那天没有什么大事。回家放了行李，去阿爸阿妈店，吃鸡粥，下午又有人被叫去吃炒面。",
    "ET 学 motor，从紧张到稳住，再到回头笑。MS 只是扶着、跟着、然后松手。",
    "她看到书里的照片，还拍起来说以后可以威胁 MS。MS 的反应不是震惊，是完全没跟上。",
    "她剪了头发和刘海，看起来很喜欢。傍晚打了一下羽球。后来她坐在饭厅，陪阿妈研究过滤器说明书。",
    "这些事情普通到当时不会发光。只是后来想起来，普通也会留下来。"
  ],
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
