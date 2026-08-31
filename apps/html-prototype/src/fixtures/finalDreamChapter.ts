import type { ChapterDefinition, DiaryEntry } from "../types.js";

export type FinalDreamFrame = {
  id: string;
  image: string;
  speaker?: "Memory" | "MS" | "ET";
  text?: string;
  portrait?: string;
  treatment?: "scene" | "fragment" | "hero" | "ending";
};

const asset = (name: string): string => `assets/end/${name}`;

export const finalDreamMusic = "assets/audio/Dear D (亲爱的告诉你)-项睿娴.mp3";
export const finalDreamMorningImage = asset("FD-11 — MORNING EMPTY ROAD.png");

export const finalDreamFrames: FinalDreamFrame[] = [
  { id: "bus-arrival", image: asset("FD-01 — BUS DREAM ESTABLISHING.png"), speaker: "Memory", text: "后来，我做过一个梦。\n梦里我们在一辆巴士上。", treatment: "scene" },
  { id: "bus-haircut", image: asset("FD-01 — BUS DREAM ESTABLISHING.png"), speaker: "ET", text: "你要不要去剪头发？", portrait: asset("FINAL DREAM DREAM PORTRAIT — ET TALKING.png"), treatment: "scene" },
  { id: "bus-listen", image: asset("FD-01 — BUS DREAM ESTABLISHING.png"), speaker: "MS", text: "蛤？现在？", portrait: asset("DREAM PORTRAIT — MS LISTENING.png"), treatment: "scene" },
  { id: "tomorrow-01", image: asset("FD-02 — “TOMORROW” BUS HERO FRAME.png"), speaker: "ET", text: "你要的话就去咯。", portrait: asset("FINAL DREAM DREAM PORTRAIT — ET “TOMORROW” CASUAL VARIANT.png"), treatment: "hero" },
  { id: "tomorrow-02", image: asset("FD-02 — “TOMORROW” BUS HERO FRAME.png"), speaker: "ET", text: "酱我今天先不回。\n明天再走。", treatment: "hero" },
  { id: "tomorrow-reaction", image: asset("FD-02 — “TOMORROW” BUS HERO FRAME.png"), speaker: "MS", text: "……好啊。", portrait: asset("FINAL DREAM DREAM PORTRAIT — MS QUIET REACTION.png"), treatment: "hero" },
  { id: "tomorrow-memory", image: asset("FD-02 — “TOMORROW” BUS HERO FRAME.png"), speaker: "Memory", text: "梦里的我没有觉得这句话有什么奇怪。\n好像本来就应该这样。", treatment: "hero" },
  { id: "video-call", image: asset("FD-03 — VIDEO CALL MEMORY FRAGMENT.png"), speaker: "Memory", text: "后来你在巴士上跟家里 video call。\n好像还在投诉我什么。", portrait: asset("FINAL DREAM DREAM PORTRAIT — ET VIDEO CALL.png"), treatment: "fragment" },
  { id: "video-call-fade", image: asset("FD-03 — VIDEO CALL MEMORY FRAGMENT.png"), speaker: "Memory", text: "具体讲了什么，我醒来以后已经记不清了。", treatment: "fragment" },
  { id: "car", image: asset("FD-04 — CAR TRANSITION.png"), speaker: "Memory", text: "下车以后，啊 gor 来载我们。\n然后不知道为什么，我们去了海边。", treatment: "scene" },
  { id: "shop", image: asset("FD-05 — SEASIDE LOCAL PRODUCTS SHOP.png"), speaker: "Memory", text: "那里有一间卖土产的小店。\n门外就是海。远一点的地方还有船。", treatment: "scene" },
  { id: "pastry", image: asset("FD-06 — PASTRY MEMORY FRAGMENT.png"), speaker: "Memory", text: "我记得芋头饼。\n也记得凤梨酥。", treatment: "fragment" },
  { id: "pastry-fade", image: asset("FD-06 — PASTRY MEMORY FRAGMENT.png"), speaker: "Memory", text: "其他东西已经慢慢想不起来了。", treatment: "fragment" },
  { id: "route", image: asset("FD-07 — ROUTE MEMORY FRAGMENT.png"), speaker: "MS", text: "等下要怎样走哦。\n我又不认路。", treatment: "fragment" },
  { id: "route-memory", image: asset("FD-07 — ROUTE MEMORY FRAGMENT.png"), speaker: "Memory", text: "梦里的我居然还在烦这种东西。", treatment: "fragment" },
  { id: "sea", image: asset("FD-08 — SEA REVEAL HERO IMAGE.png"), speaker: "Memory", text: "可是那一天没有需要被解决的事。\n你只是还没有走。", treatment: "hero" },
  { id: "sea-extra-day", image: asset("FD-08 — SEA REVEAL HERO IMAGE.png"), speaker: "Memory", text: "现实里没有多出来的那一天。\n梦替我放了一天在这里。", treatment: "hero" },
  { id: "walk", image: asset("FD-09-10 — FINAL WALKING HERO CG.png"), speaker: "Memory", text: "没有告白。\n没有答案。\n也没有谁突然变成另一个人。", treatment: "hero" },
  { id: "walk-choice", image: asset("FD-09-10 — FINAL WALKING HERO CG.png"), speaker: "Memory", text: "只是生活原本可以照常继续，\n而你自己选择在这里待一下。", treatment: "hero" },
  { id: "walk-last", image: asset("FD-09-10 — FINAL WALKING HERO CG.png"), speaker: "MS", text: "我不知道下一站在哪里。\n这一次，好像也不用知道。\n反正今天还没有结束。\n你明天才走。", treatment: "hero" }
];

export const finalDreamEndingLines = [
  "后来我还是醒了。",
  "没有多出来的那一天。",
  "有些事情后来没有发生，",
  "有些话也一直没有说完。",
  "没关系。",
  "至少有那么一段路，我们确实一起走过。",
  "你有你的下一站。",
  "我也该继续走了。",
  "可是天已经亮了。",
  "回家吧。"
] as const;

export const finalDreamCredits = [
  "a game by Muji",
  "based on things that happened",
  "and one thing that didn't",
  "thank you for walking with me"
] as const;

export const finalDreamChapter: ChapterDefinition = {
  id: "final-dream-tomorrow",
  diaryEntryId: "authored-diary-final-dream-tomorrow",
  runtimeScene: "final-dream",
  date: "??.??",
  title: "Tomorrow",
  mood: "a bright blue dream already beginning to disappear",
  weather: "天快亮了",
  location: "somewhere that did not happen",
  characters: ["MS", "ET"],
  objects: ["bus", "phone", "local pastries", "route", "sea", "ships"],
  evidence: ["approved-final-dream-cg-set", "approved-final-ending-copy"],
  dialogue: [],
  canonicalClosure: {
    historicalEventId: "final-dream-wake-up",
    lines: [...finalDreamEndingLines]
  },
  reflectionQuotes: []
};

export const finalDreamDiaryEntry: DiaryEntry = {
  id: "authored-diary-final-dream-tomorrow",
  source: "authored",
  date: "2026-08-16",
  title: "我居然在离你最近的时候 意识到我离你很远。",
  body: [
    "后来我做了一个梦。",
    "梦里的你问我要不要去剪头发。",
    "如果我要，你就先不回。会陪我多一天。",
    "梦里的你真的留下来了。",
    "把现实里的“我要回家了。”改成“明天再走。”，就够我醒来以后幸福很久。也难过很久。",
    "我喜欢的本来就是一个有自己方向的你。",
    "不是因为我追上来了。只是因为是我。所以你自己想。",
    "原来我真正想要的一直都不是轰轰烈烈，也不是谁需要谁。只是生活原本可以照常继续，而你自己选择在这里待一下。",
    "很久以前，我站在球网的另一边，因为没有听清楚你的话，所以自己朝你走近了一点。",
    "后来才发现，有些路确实不是再走几步就能到。",
    "但至少那一次，我是真的走到你面前了。也真的听见了。",
    "就记得这个吧。"
  ].join("\n\n"),
  location: "梦里",
  weather: "暴雨",
  memoryKind: "chapter",
  mood: "calm",
  chapterId: "final-dream-tomorrow",
  photos: [],
  scrapbookLayout: { elements: [] }
};
