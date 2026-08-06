import type { HtmlChapterScene } from "../types.js";

export const bakeryChapter: HtmlChapterScene = {
  id: "bakery-day",
  date: "07.28",
  title: "Yumido Bread",
  mood: "warm, unfinished",
  weather: "soft rain",
  location: "Bakery",
  characters: ["Friend A"],
  objects: ["pastry", "window", "door"],
  evidence: ["fictional-fixture-evidence"],
  memoryText: [
    "07.28 · Yumido Bread",
    "今天雨很细，面包店的玻璃一直蒙着雾。我和 Friend A 坐在靠窗的位置，桌上只有一块很小的甜面包。她把纸袋推给我，说其实不是想要我道歉，只是想知道我有没有听见她。",
    "我当时一直看着收银台旁边的灯，假装在想别的事。其实我听见了。只是如果我承认听见，就好像要承认自己也让她一个人站在那里很久。",
    "后来我们没有吵架，也没有和好。雨停之前，她说：如果你不知道怎么回答，至少不要把我说的话改成比较容易接受的版本。",
    "我把这一天记得很乱。Muji 今天回来，不是为了替过去改台词，是为了把那句没有被认真接住的话，原样放回桌上。"
  ],
  dialogue: [
    { id: "friend-asks", speaker: "Friend A", portrait: "friend", text: "你读完了。那我可以不用从头解释了吧？那天我不是想赢，也不是想让你欠我。我只是很想知道，我说出口的东西有没有真的到达你那里。", choices: [
      { id: "remember", label: "有。我只是那时不敢承认。", effects: { honesty: 1, acceptance: 1 }, response: "Friend A lets out a small breath. “原来你不是没听见。只是那时候也很怕。”" },
      { id: "unimportant", label: "我希望它没有那么重要。", effects: { avoidance: 1, concealment: 1 }, response: "Friend A looks at the window. “我懂。可是不重要这句话，有时只是另一种把人放下。”" },
      { id: "sad", label: "你那时是在问我会不会留下。", effects: { closeness: 1, companionship: 1 }, response: "Friend A's shoulders soften. “嗯。不是永远留下，只是那一刻不要转身。”" }
    ] },
    { id: "what-now", speaker: "Muji", portrait: "muji", text: "Muji把水壶放在桌上。水壶没有答案，只有一点温度。你想怎样照看这段回忆？", choices: [
      { id: "keep", label: "保留它原本不漂亮的样子。", effects: { acceptance: 1, honesty: 1 }, response: "The pastry stays small. The room stops asking to be prettier before it can be loved." },
      { id: "pretty", label: "把它改成比较不会痛的版本。", effects: { intervention: 1, concealment: 1 }, response: "For a second the bakery becomes perfect. Friend A's voice becomes harder to hear." },
      { id: "quiet", label: "不解释，只坐到雨停。", effects: { companionship: 2 }, response: "Friend A does not smile right away, but she stops guarding the chair beside her." }
    ] },
    { id: "leave", speaker: "Friend A", portrait: "friend", text: "如果今天不能把过去修好，你希望我带走什么？", choices: [
      { id: "goodbye", label: "带走真实，不带走责怪。", effects: { closeness: 1, acceptance: 1 }, response: "“那我会记得：你终于没有替我改掉那句话。”" },
      { id: "silent-leave", label: "带走安静，我们先不用回答。", effects: { distance: 1, avoidance: 1 }, response: "Friend A nods. The silence is not cruel, but it is still silence." },
      { id: "remember-me", label: "带走我这次没有走开。", effects: { closeness: 1, companionship: 1 }, response: "Friend A looks at Muji's water bottle. “那就坐到最后一盏灯亮起来。”" },
      { id: "rewrite-me", label: "带走一个更温柔的我。", effects: { intervention: 1, concealment: 1 }, response: "The room brightens like a photograph. Friend A becomes almost easy to forgive, and almost gone." }
    ] }
  ]
};

export const forestDoors = [
  { id: "segamat", date: "07.31", title: "Went to Segamat", x: 700, y: 260, chapterId: "segamat-bakery" },
  { id: "yumido", date: "07.28", title: "Yumido Bread", x: 1120, y: 210, chapterId: "bakery-day" },
  { id: "night", date: "07.27", title: "Night Walk", x: 430, y: 300, chapterId: "night-bakery" },
  { id: "palapes", date: "07.26", title: "Palapes Meeting", x: 1240, y: 660, chapterId: "palapes-bakery" }
];
