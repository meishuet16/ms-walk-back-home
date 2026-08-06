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
    { id: "friend-asks", speaker: "Friend A", portrait: "friend", text: "你读完了那一天。奇怪吧，日记只写了几行，可人会在没写下来的地方长大。那天我不是真的要你解释，我只是想知道：如果一句话没有被接住，它会不会一辈子都在原地等。", choices: [
      { id: "remember", label: "我接住了，只是太晚才敢承认。", effects: { honesty: 1, acceptance: 1 }, response: "Friend A低头笑了一下。她说，太晚不是没有，太晚只是青春最常用的时区。" },
      { id: "unimportant", label: "我一直希望那句话不重要。", effects: { avoidance: 1, concealment: 1 }, response: "Friend A看着窗上的雨痕。她说，不重要有时候不是答案，是把疼痛折小以后藏进口袋。" },
      { id: "sad", label: "你那时是在问我会不会留下。", effects: { closeness: 1, companionship: 1 }, response: "Friend A的肩膀慢慢松下来。她说，对，不是永远留下，只是那一刻不要把我交给沉默。" }
    ] },
    { id: "what-now", speaker: "Friend A", portrait: "friend", text: "桌上的甜面包还是那么小。回忆最残忍的地方不是它会变暗，是我们后来太会修饰它。你现在可以把它讲得漂亮一点，也可以让它继续难看。你想怎么记得我？", choices: [
      { id: "keep", label: "照原样记得你，也照原样记得我。", effects: { acceptance: 1, honesty: 1 }, response: "Friend A说，那就让甜面包继续小吧。小不是失败，小只是没有被故事胀大。" },
      { id: "pretty", label: "我想把那天改得温柔一点。", effects: { intervention: 1, concealment: 1 }, response: "灯光忽然变好看了。Friend A却轻声说，如果一切都被改得温柔，那我当时的难过要去哪里住呢。" },
      { id: "quiet", label: "我不急着解释，先陪你坐到雨停。", effects: { companionship: 2 }, response: "Friend A没有立刻原谅，也没有继续追问。她只是把椅子往旁边挪了一点。" }
    ] },
    { id: "leave", speaker: "Friend A", portrait: "friend", text: "如果我们都不能回到十几岁的身体里重新说话，那至少可以决定：以后想起这一天时，要让哪一种自己活下来。你要带哪一个自己离开？", choices: [
      { id: "goodbye", label: "带走真实，不带走责怪。", effects: { closeness: 1, acceptance: 1 }, response: "Friend A说，那我也把真实带走。不是为了审判你，是为了证明我曾经认真存在过。" },
      { id: "silent-leave", label: "带走安静，答案以后再说。", effects: { distance: 1, avoidance: 1 }, response: "Friend A点头。安静没有伤人，却像一张没寄出的明信片，永远停在雨季。" },
      { id: "remember-me", label: "带走这次没有走开的我。", effects: { closeness: 1, companionship: 1 }, response: "Friend A说，那就够了。有些陪伴不是把人救出来，只是在旁边承认：这里真的很冷。" },
      { id: "rewrite-me", label: "带走一个比较不会痛的版本。", effects: { intervention: 1, concealment: 1 }, response: "Friend A在更亮的灯下变得模糊。她说，如果你一定要让我不痛，也请不要顺手把我删掉。" }
    ] }
  ]
};

export const forestDoors = [
  { id: "segamat", date: "07.31", title: "Went to Segamat", x: 700, y: 260, chapterId: "segamat-bakery" },
  { id: "yumido", date: "07.28", title: "Yumido Bread", x: 1120, y: 210, chapterId: "bakery-day" },
  { id: "night", date: "07.27", title: "Night Walk", x: 430, y: 300, chapterId: "night-bakery" },
  { id: "palapes", date: "07.26", title: "Palapes Meeting", x: 1240, y: 660, chapterId: "palapes-bakery" }
];
