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
    "Labis 的下午很晒，马路前面的灰尘被车轮带起来，又慢慢落回去。那天本来没有什么特别的安排，只是她一直说要我教她驾 motor。",
    "我记得 motor 很轻，声音也不大。MS 在后面帮她稳着，ET 坐在前面，整个人都很小心，好像一用力就会把下午弄坏。",
    "后来 MS 松开手，她还真的继续往前走了。不是很快，也不是很帅，可是那一小段路突然变得很长。",
    "她回头的时候笑了一下，说：单凭这一点，没有白来。",
    "那时候谁都不知道，这种普通到几乎不会被写进日记的下午，后来会变成值得回来的地方。"
  ],
  dialogue: [
    {
      id: "labis-after-ride",
      speaker: "MS",
      portrait: "none",
      text: "后来我一直在想，为什么这种小到几乎不值得宣布的事，会在记忆里留下这么清楚的位置。",
      choices: [
        {
          id: "quiet",
          label: "因为普通没有防备",
          effects: { acceptance: 1, honesty: 1 },
          response: "对。普通的下午不会要求我们记得它，所以它留下来的时候，反而更像是真的。"
        },
        {
          id: "unimportant",
          label: "也许只是刚好记得",
          effects: { distance: 1, avoidance: 1 },
          response: "也可以。不是每个记忆都需要意义，有些只是没有离开。"
        },
        {
          id: "pretty",
          label: "我想把它写得更亮一点",
          effects: { closeness: 1, intervention: 1 },
          response: "可以，但不要把它写成别的东西。让光落在原来的灰尘上，就已经够了。"
        }
      ]
    },
    {
      id: "labis-keeps-distance",
      speaker: "ET",
      portrait: "none",
      text: "如果那天没有学会，也许也不会怎样。可是学会了以后，好像回去的路就多了一点点勇气。"
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
    },
    {
      id: "labis-motor-not-ready",
      tone: "not-ready",
      lines: ["如果今天还看不出意义，也没有关系。", "记忆有时只是先替我们保存，还不急着解释。"]
    },
    {
      id: "labis-motor-rewriting",
      tone: "rewriting",
      lines: ["可以把下午写得亮一点。", "但真正亮的地方，是它原本没有想证明什么。"]
    }
  ]
};
