import type { HtmlChapterScene } from "../types.js";

export type ForestDoor = {
  id: string;
  date: string;
  title: string;
  chapterId: string;
  x: number;
  y: number;
};

export const bakeryChapter: HtmlChapterScene = {
  id: "bakery-day",
  diaryEntryId: "authored-diary-bakery-day",
  date: "07.28",
  title: "Yumido Bread",
  mood: "warm, unfinished",
  weather: "soft rain",
  location: "Bakery",
  characters: ["Friend A"],
  objects: ["pastry", "window", "door"],
  evidence: ["fictional-fixture-evidence"],
  dialogue: [
    { id: "friend-asks", speaker: "她", portrait:{ src: "assets/friend-a.png",height: 180
}, text: "你读完了那一天。奇怪吧，日记只写了几行，可人会在没写下来的地方长大。那天我不是真的要你解释，我只是想知道：如果一句话没有被接住，它会不会一辈子都在原地等。", choices: [
      { id: "remember", label: "我接住了，只是太晚才敢承认。", effects: { honesty: 1, acceptance: 1 }, response: "她低头笑了一下。她说，太晚不是没有，太晚只是青春最常用的时区。" },
      { id: "unimportant", label: "我一直希望那句话不重要。", effects: { avoidance: 1, concealment: 1 }, response: "她看着窗上的雨痕。她说，不重要有时候不是答案，是把疼痛折小以后藏进口袋。" },
      { id: "sad", label: "你那时是在问我会不会留下。", effects: { closeness: 1, companionship: 1 }, response: "她的肩膀慢慢松下来。她说，对，不是永远留下，只是那一刻不要把我交给沉默。" }
    ] },
    { id: "what-now", speaker: "她",  portrait:{ src: "assets/friend-a.png",height: 180
}, text: "桌上的甜面包还是那么小。回忆最残忍的地方不是它会变暗，是我们后来太会修饰它。你现在可以把它讲得漂亮一点，也可以让它继续难看。你想怎么记得我？", choices: [
      { id: "keep", label: "照原样记得你，也照原样记得我。", effects: { acceptance: 1, honesty: 1 }, response: "她说，那就让甜面包继续小吧。小不是失败，小只是没有被故事胀大。" },
      { id: "pretty", label: "我想把那天改得温柔一点。", effects: { intervention: 1, concealment: 1 }, response: "灯光忽然变好看了。她却轻声说，如果一切都被改得温柔，那我当时的难过要去哪里住呢。" },
      { id: "quiet", label: "我不急着解释，先陪你坐到雨停。", effects: { companionship: 2 }, response: "她没有立刻原谅，也没有继续追问。她只是把椅子往旁边挪了一点。" }
    ] },
    { id: "leave", speaker: "她", portrait:{ src: "assets/friend-a.png",height: 180
}, text: "如果我们都不能回到十几岁的身体里重新说话，那至少可以决定：以后想起这一天时，要让哪一种自己活下来。你要带哪一个自己离开？", choices: [
      { id: "goodbye", label: "带走真实，不带走责怪。", effects: { closeness: 1, acceptance: 1 }, response: "她说，那我也把真实带走。不是为了审判你，是为了证明我曾经认真存在过。" },
      { id: "silent-leave", label: "带走安静，答案以后再说。", effects: { distance: 1, avoidance: 1 }, response: "她点头。安静没有伤人，却像一张没寄出的明信片，永远停在雨季。" },
      { id: "remember-me", label: "带走这次没有走开的我。", effects: { closeness: 1, companionship: 1 }, response: "她说，那就够了。有些陪伴不是把人救出来，只是在旁边承认：这里真的很冷。" },
      { id: "rewrite-me", label: "带走一个比较不会痛的版本。", effects: { intervention: 1, concealment: 1 }, response: "她把椅子往旁边挪了一点，在更亮的灯下变得模糊。她说，如果你一定要让我不痛，也请不要顺手把我删掉。" }
    ] }
  ]
};

export const forestDoors: ForestDoor[] = [
  { id: "labis-motor", date: "07.19", title: "719", x: 930, y: 520, chapterId: "labis-motor-day" },
  { id: "july21-one-more-day", date: "07.21–07.22", title: "One More Day", x: 1180, y: 520, chapterId: "july21-why-cant-you-stay" },
  { id: "segamat", date: "07.31", title: "Went to Segamat", x: 700, y: 260, chapterId: "segamat-bakery" },
  { id: "yumido", date: "07.28", title: "Yumido Bread", x: 1120, y: 210, chapterId: "bakery-day" },
  { id: "night", date: "07.27", title: "Night Walk", x: 430, y: 300, chapterId: "night-bakery" },
  { id: "palapes", date: "07.26", title: "Palapes Meeting", x: 1240, y: 660, chapterId: "palapes-bakery" },
  { id: "march30-too-fated", date: "03.30", title: "Too Fated", x: 0, y: 0, chapterId: "march30-too-fated" },
  { id: "april05-come-down", date: "04.05", title: "下来一下", x: 0, y: 0, chapterId: "april05-come-down" },
  { id: "april06-not-gone-yet", date: "04.06", title: "还没走啊？", x: 0, y: 0, chapterId: "april06-not-gone-yet" },
  { id: "april25-just-good-friends", date: "04.25–04.26", title: "只是好朋友", x: 0, y: 0, chapterId: "april25-just-good-friends" },
  { id: "may23-i-arrived", date: "05.23", title: "我到了，你呢", x: 0, y: 0, chapterId: "may23-i-arrived" },
  { id: "june24-only-came-for-you", date: "06.24", title: "只为你而来", x: 0, y: 0, chapterId: "june24-only-came-for-you" },
  { id: "june25-so-i-came", date: "06.25", title: "所以我就来了。", x: 0, y: 0, chapterId: "june25-so-i-came" },
  { id: "november22-before-sunrise", date: "11.21–11.22", title: "Before Sunrise", x: 0, y: 0, chapterId: "1122-before-sunrise" }
];
