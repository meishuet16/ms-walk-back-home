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
  dialogue: [
    { id: "enter", speaker: "Memory", portrait: "none", text: "The bakery is warmer than Muji remembered. The rain stays outside the window." },
    { id: "friend-asks", speaker: "Friend A", portrait: "friend", text: "你还记得那天吗？我当时好像一直没说完。", choices: [
      { id: "remember", label: "我记得。", effects: { honesty: 1, acceptance: 1 }, response: "Friend A nods, relieved that nothing has to be corrected first." },
      { id: "unimportant", label: "好像已经不重要了。", effects: { avoidance: 1, concealment: 1 }, response: "The lamp grows brighter, but the room becomes a little quieter." },
      { id: "sad", label: "你那时候其实很难过，对吗？", effects: { closeness: 1, companionship: 1 }, response: "Friend A looks down. “嗯。只是那时不知道怎么讲。”" }
    ] },
    { id: "pastry", speaker: "Memory", portrait: "none", text: "The pastry on the counter is smaller than the version in the story.", choices: [
      { id: "keep", label: "保留记忆原本的样子", effects: { acceptance: 1, honesty: 1 }, response: "Muji leaves the small pastry exactly where it is." },
      { id: "pretty", label: "把它改成更美好的版本", effects: { intervention: 1, concealment: 1 }, response: "For a second, the room looks perfect. Then the voices soften into distance." },
      { id: "quiet", label: "不碰它，只安静地待一会儿", effects: { companionship: 2 }, response: "Nobody says anything. It is enough for now." }
    ] },
    { id: "leave", speaker: "Friend A", portrait: "friend", text: "要走了吗？", choices: [
      { id: "goodbye", label: "向 Friend A 道别", effects: { closeness: 1, acceptance: 1 }, response: "“下次见。” It sounds ordinary, and somehow that helps." },
      { id: "silent-leave", label: "安静地离开", effects: { distance: 1 }, response: "The door opens without complaint." },
      { id: "remember-me", label: "问 Friend A 是否还记得自己", effects: { closeness: 1, intervention: 1 }, response: "Friend A smiles awkwardly. “我记得一点点。”" }
    ] }
  ]
};

export const forestDoors = [
  { id: "segamat", date: "07.31", title: "Went to Segamat", x: 700, y: 260, chapterId: "bakery-day" },
  { id: "yumido", date: "07.28", title: "Yumido Bread", x: 1120, y: 210, chapterId: "bakery-day" },
  { id: "night", date: "07.27", title: "Night Walk", x: 430, y: 300, chapterId: "bakery-day" },
  { id: "palapes", date: "07.26", title: "Palapes Meeting", x: 1240, y: 660, chapterId: "bakery-day" }
];
