import type { Choice, ChapterDefinition } from "../types.js";
import type { Point } from "../systems/CollisionSystem.js";
import type { CutsceneAction } from "../systems/CutsceneSystem.js";
import { resolveSceneEchoAnchor, type SceneLayout } from "../systems/SceneLayouts.js";
import type { DialoguePortrait } from "../systems/PresentationRenderer.js";

export type April06AnchorKey =
  | "ms-drop-start" | "mcd-drop-point" | "ms-escape-turn" | "ms-roadside-stop"
  | "et-lobby-spawn" | "et-catch-position" | "et-mcd-pickup" | "ms-chat-position"
  | "et-chat-position" | "car-return-edge" | "ms-exit-pickup";

export type April06Asset = {
  path: string;
  source: { x: number; y: number; w: number; h: number };
  visibleBounds: { x: number; y: number; w: number; h: number };
  feet: { x: number; y: number };
  mirrorForLeft?: boolean;
  materialScale?: number;
};

const pngAsset = (
  path: string,
  w: number,
  h: number,
  visibleBounds: April06Asset["visibleBounds"],
  options: Pick<April06Asset, "mirrorForLeft" | "materialScale"> = {}
): April06Asset => ({
  path,
  source: { x: 0, y: 0, w, h },
  visibleBounds,
  feet: {
    x: (visibleBounds.x + visibleBounds.w / 2) / w,
    y: (visibleBounds.y + visibleBounds.h) / h
  },
  ...options
});

export const april06Assets = {
  mcd: {
    path: "assets/406/mcd.png",
    source: { x: 0, y: 0, w: 1536, h: 1024 },
    visibleBounds: { x: 65, y: 38, w: 1273, h: 968 },
    feet: { x: 0.4567, y: 0.9824 }
  },
  msCarryMcd: pngAsset("assets/406/406-mcd-drop/406-mcd-drop-carrying.png", 293, 517, { x: 0, y: 28, w: 293, h: 488 }, { mirrorForLeft: true }),
  msStandMcd: pngAsset("assets/406/406-mcd-drop/406-mcd-drop-standing.png", 291, 517, { x: 35, y: 71, w: 255, h: 413 }, { mirrorForLeft: true }),
  msObserveMcd: pngAsset("assets/406/406-mcd-drop/406-mcd-drop-observe.png", 347, 517, { x: 18, y: 32, w: 320, h: 454 }, { mirrorForLeft: true }),
  msPutMcd: pngAsset("assets/406/406-mcd-drop/406-mcd-drop-put.png", 374, 517, { x: 0, y: 55, w: 373, h: 431 }, { mirrorForLeft: true }),
  msStareMcd: pngAsset("assets/406/406-mcd-drop/406-mcd-drop-staring.png", 369, 517, { x: 33, y: 12, w: 324, h: 445 }, { mirrorForLeft: true }),
  msPhotoMcd: pngAsset("assets/406/406-mcd-drop/406-mcd-drop-took-photo.png", 363, 517, { x: 10, y: 0, w: 349, h: 455 }, { mirrorForLeft: true }),
  msThinkMcd: pngAsset("assets/406/406-mcd-drop/406-mcd-drop-think.png", 355, 517, { x: 14, y: 24, w: 340, h: 475 }, { mirrorForLeft: true }),
  msLeaveMcd: pngAsset("assets/406/406-mcd-drop/406-mcd-drop-leaving.png", 271, 517, { x: 12, y: 51, w: 227, h: 442 }, { mirrorForLeft: true }),

  msEscapeHurried: pngAsset("assets/406/406-caught/406-caught-hurried walk.png", 370, 497, { x: 0, y: 19, w: 366, h: 478 }, { mirrorForLeft: true }),
  msEscapeAbrupt: pngAsset("assets/406/406-caught/406-caught-abrupt stop.png", 328, 503, { x: 4, y: 0, w: 323, h: 500 }, { mirrorForLeft: true }),
  msCaughtLookLobby: pngAsset("assets/406/406-caught/406-caught-look toward lobby.png", 261, 501, { x: 1, y: 16, w: 251, h: 482 }, { mirrorForLeft: true }),
  msCaughtAwkward: pngAsset("assets/406/406-caught/406-caught-awkward neutral.png", 287, 508, { x: 4, y: 18, w: 283, h: 480 }, { mirrorForLeft: true }),
  msCaughtChatA: pngAsset("assets/406/406-caught/406-caught-conversational idle A.png", 291, 501, { x: 6, y: 6, w: 285, h: 495 }, { mirrorForLeft: true }),
  msCaughtChatB: pngAsset("assets/406/406-caught/406-caught-conversational idle b.png", 302, 517, { x: 1, y: 6, w: 296, h: 511 }, { mirrorForLeft: true }),
  msCaughtNoticeCar: pngAsset("assets/406/406-caught/406-caught-notice approaching car.png", 302, 517, { x: 6, y: 2, w: 295, h: 499 }, { mirrorForLeft: true }),
  msCaughtTurn: pngAsset("assets/406/406-caught/406-caught-turn.png", 325, 517, { x: 18, y: 4, w: 303, h: 484 }, { mirrorForLeft: true }),

  etLobbyExit: pngAsset("assets/406/406-catch/406-catch-lobby exit.png", 326, 490, { x: 0, y: 45, w: 322, h: 435 }, { mirrorForLeft: true }),
  etWalkingOut: pngAsset("assets/406/406-catch/406-catch-walking out.png", 370, 497, { x: 1, y: 0, w: 369, h: 476 }, { mirrorForLeft: true }),
  etCatchNotice: pngAsset("assets/406/406-catch/406-catch-notice.png", 407, 497, { x: 4, y: 31, w: 397, h: 456 }, { mirrorForLeft: true }),
  etCatchAmused: pngAsset("assets/406/406-catch/406-catch-small amused reaction.png", 372, 512, { x: 0, y: 45, w: 354, h: 437 }, { mirrorForLeft: true }),
  etApproaches: pngAsset("assets/406/406-catch/406-catch-approaches.png", 344, 463, { x: 10, y: 9, w: 325, h: 433 }, { mirrorForLeft: true }),
  etCatchStop: pngAsset("assets/406/406-catch/406-catch-stop.png", 238, 449, { x: 7, y: 5, w: 208, h: 439 }, { mirrorForLeft: true }),
  etConversational: pngAsset("assets/406/406-catch/406-catch-conversational posture.png", 315, 444, { x: 14, y: 4, w: 269, h: 436 }, { mirrorForLeft: true }),

  etHoldBag: pngAsset("assets/406/406-eat/406-eat-hold bag.png", 321, 503, { x: 9, y: 44, w: 312, h: 455 }, { mirrorForLeft: true }),
  etReachBag: pngAsset("assets/406/406-eat/406-eat-reach into bag.png", 267, 505, { x: 0, y: 50, w: 263, h: 449 }, { mirrorForLeft: true }),
  etPullFry: pngAsset("assets/406/406-eat/406-eat-pull fry.png", 263, 480, { x: 6, y: 33, w: 248, h: 447 }, { mirrorForLeft: true }),
  etEatFry: pngAsset("assets/406/406-eat/406-eat-eat fry.png", 297, 480, { x: 24, y: 23, w: 273, h: 451 }, { mirrorForLeft: true }),
  etChew: pngAsset("assets/406/406-eat/406-eat-chew.png", 315, 482, { x: 6, y: 0, w: 271, h: 471 }, { mirrorForLeft: true }),
  etTalk: pngAsset("assets/406/406-eat/406-eat-talk.png", 347, 487, { x: 1, y: 14, w: 346, h: 459 }, { mirrorForLeft: true }),
  etGlance: pngAsset("assets/406/406-eat/406-eat-glance.png", 266, 464, { x: 0, y: 16, w: 264, h: 448 }, { mirrorForLeft: true }),
  etGoodbye: pngAsset("assets/406/406-eat/406-eat-small goodbye gesture..png", 353, 517, { x: 18, y: 19, w: 287, h: 450 }, { mirrorForLeft: true }),

  alza: {
    path: "assets/406/prop/vehicle-406-arrival.png",
    source: { x: 0, y: 0, w: 2172, h: 724 },
    visibleBounds: { x: 19, y: 49, w: 2153, h: 595 },
    feet: { x: 0.5, y: 0.89 }
  },
  alzaArrival4: pngAsset("assets/406/prop/vehicle-406-arrival-4.png", 140, 258, { x: 36, y: 39, w: 104, h: 194 }, { materialScale: 0.7 }),
  alzaArrival3: pngAsset("assets/406/prop/vehicle-406-arrival-3.png", 252, 452, { x: 31, y: 96, w: 198, h: 321 }, { materialScale: 0.85 }),
  alzaArrival2: pngAsset("assets/406/prop/vehicle-406-arrival-2.png", 373, 613, { x: 26, y: 46, w: 275, h: 548 }, { materialScale: 1.05 }),
  alzaArrival1: pngAsset("assets/406/prop/vehicle-406-arrival-1.png", 478, 331, { x: 19, y: 22, w: 448, h: 294 }, { materialScale: 1.25 }),
  headlights: {
    path: "assets/406/prop/vfx-406-vehicle-headlights.png",
    source: { x: 0, y: 0, w: 1767, h: 890 },
    visibleBounds: { x: 0, y: 9, w: 1767, h: 881 },
    feet: { x: 0.5, y: 0.5 }
  },

  morningMsWalking: pngAsset("assets/406/406-morning/fake-watergun/fake-watergun-walking.png", 412, 478, { x: 0, y: 0, w: 412, h: 478 }),
  morningMsNotice: pngAsset("assets/406/406-morning/fake-watergun/fake-watergun-notice.png", 342, 515, { x: 0, y: 0, w: 342, h: 515 }),
  morningMsSee: pngAsset("assets/406/406-morning/fake-watergun/fake-watergun-see.png", 351, 472, { x: 0, y: 0, w: 351, h: 472 }),
  morningMsPocket: pngAsset("assets/406/406-morning/fake-watergun/fake-watergun-pocket.png", 358, 510, { x: 0, y: 0, w: 358, h: 510 }),
  morningMsPocketDraw: pngAsset("assets/406/406-morning/fake-watergun/fake-watergun-pocket draw.png", 399, 517, { x: 0, y: 0, w: 399, h: 517 }),
  morningMsCounter: pngAsset("assets/406/406-morning/fake-watergun/fake-watergun-aim.png", 336, 515, { x: 0, y: 0, w: 336, h: 515 }),
  morningMsLaugh: pngAsset("assets/406/406-morning/fake-watergun/fake-watergun-laugh.png", 300, 475, { x: 0, y: 0, w: 300, h: 475 }),
  morningMsWalk: pngAsset("assets/406/406-morning/fake-watergun/fake-watergun-walk.png", 374, 517, { x: 0, y: 0, w: 374, h: 517 }),
  morningEtWalking: pngAsset("assets/406/406-morning/water-gun/406-water-gun-walking.png", 353, 485, { x: 30, y: 35, w: 300, h: 450 }),
  morningEtNotice: pngAsset("assets/406/406-morning/water-gun/406-water-gun-notice.png", 369, 504, { x: 2, y: 59, w: 367, h: 445 }),
  morningEtRaiseHand: pngAsset("assets/406/406-morning/water-gun/406-water-gun-raise hand.png", 374, 507, { x: 1, y: 17, w: 367, h: 490 }),
  morningEtSpray: pngAsset("assets/406/406-morning/water-gun/406-water-gun-“SPRAY” GESTURE.png", 372, 501, { x: 11, y: 27, w: 347, h: 469 }),
  morningEtHold: pngAsset("assets/406/406-morning/water-gun/406-water-gun-hold.png", 342, 464, { x: 17, y: 10, w: 305, h: 433 }),
  morningEtDodge: pngAsset("assets/406/406-morning/water-gun/406-water-gun-dodge.png", 351, 438, { x: 1, y: 0, w: 347, h: 428 }),
  morningEtAmused: pngAsset("assets/406/406-morning/water-gun/406-water-gun-amused-recovery.png", 274, 485, { x: 0, y: 1, w: 259, h: 479 }),
  morningEtContinue: pngAsset("assets/406/406-morning/water-gun/406-water-gun-continue-walking.png", 375, 525, { x: 32, y: 10, w: 281, h: 491 })
} satisfies Record<string, April06Asset>;

export type April06VisualBeat =
  | "ms-carry-mcd" | "ms-stand-mcd" | "ms-observe-mcd" | "ms-place-mcd" | "ms-stare-mcd" | "ms-photo-mcd" | "ms-think-mcd" | "ms-leave-mcd"
  | "ms-escape" | "ms-empty-car" | "ms-look-lobby" | "ms-awkward-caught" | "ms-chat-a" | "ms-chat-b" | "ms-notice-car" | "ms-turn"
  | "et-lobby-exit" | "et-walking-out" | "et-notice-ms" | "et-amused" | "et-approaches" | "et-stop" | "et-conversational"
  | "et-hold-bag" | "et-reach-bag" | "et-pull-fry" | "et-eat-fry" | "et-chew" | "et-talk" | "et-glance" | "et-goodbye"
  | "morning-ms-walking" | "morning-ms-notice" | "morning-ms-see" | "morning-ms-pocket" | "morning-ms-pocket-draw" | "morning-ms-counter" | "morning-ms-laugh" | "morning-ms-walk"
  | "morning-et-walking" | "morning-et-notice" | "morning-et-raise-hand" | "morning-et-spray" | "morning-et-hold" | "morning-et-dodge" | "morning-et-amused-recovery" | "morning-et-continue-walking"
  | "alza-enter-initial" | "alza-enter-3" | "alza-enter-2" | "alza-enter-final";

export const april06VisualMap: Record<April06VisualBeat, keyof typeof april06Assets> = {
  "ms-carry-mcd": "msCarryMcd",
  "ms-stand-mcd": "msStandMcd",
  "ms-observe-mcd": "msObserveMcd",
  "ms-place-mcd": "msPutMcd",
  "ms-stare-mcd": "msStareMcd",
  "ms-photo-mcd": "msPhotoMcd",
  "ms-think-mcd": "msThinkMcd",
  "ms-leave-mcd": "msLeaveMcd",
  "ms-escape": "msEscapeHurried",
  "ms-empty-car": "msEscapeAbrupt",
  "ms-look-lobby": "msCaughtLookLobby",
  "ms-awkward-caught": "msCaughtAwkward",
  "ms-chat-a": "msCaughtChatA",
  "ms-chat-b": "msCaughtChatB",
  "ms-notice-car": "msCaughtNoticeCar",
  "ms-turn": "msCaughtTurn",
  "et-lobby-exit": "etLobbyExit",
  "et-walking-out": "etWalkingOut",
  "et-notice-ms": "etCatchNotice",
  "et-amused": "etCatchAmused",
  "et-approaches": "etApproaches",
  "et-stop": "etCatchStop",
  "et-conversational": "etConversational",
  "et-hold-bag": "etHoldBag",
  "et-reach-bag": "etReachBag",
  "et-pull-fry": "etPullFry",
  "et-eat-fry": "etEatFry",
  "et-chew": "etChew",
  "et-talk": "etTalk",
  "et-glance": "etGlance",
  "et-goodbye": "etGoodbye",
  "morning-ms-walking": "morningMsWalking",
  "morning-ms-notice": "morningMsNotice",
  "morning-ms-see": "morningMsSee",
  "morning-ms-pocket": "morningMsPocket",
  "morning-ms-pocket-draw": "morningMsPocketDraw",
  "morning-ms-counter": "morningMsCounter",
  "morning-ms-laugh": "morningMsLaugh",
  "morning-ms-walk": "morningMsWalk",
  "morning-et-walking": "morningEtWalking",
  "morning-et-notice": "morningEtNotice",
  "morning-et-raise-hand": "morningEtRaiseHand",
  "morning-et-spray": "morningEtSpray",
  "morning-et-hold": "morningEtHold",
  "morning-et-dodge": "morningEtDodge",
  "morning-et-amused-recovery": "morningEtAmused",
  "morning-et-continue-walking": "morningEtContinue",
  "alza-enter-initial": "alzaArrival4",
  "alza-enter-3": "alzaArrival3",
  "alza-enter-2": "alzaArrival2",
  "alza-enter-final": "alzaArrival1"
};

export function resolveApril06Visual(beat: April06VisualBeat): April06Asset {
  return april06Assets[april06VisualMap[beat]];
}

export type April06ReflectionChoicePoint = { id: string; prompt: string; choices: Choice[] };

const choice = (id: string, label: string, effects: Choice["effects"], response: string): Choice => ({ id, label, effects, response });

export const april06ReflectionChoices: April06ReflectionChoicePoint[] = [
  {
    id: "delivery-anonymity",
    prompt: "她是真的想偷偷放了就跑。",
    choices: [
      choice("delivery-anonymity-quiet", "送到就好。人不用被看到。", { concealment: 1, distance: 1 }, "我先把这句话留在这里。"),
      choice("delivery-anonymity-direct", "都已经送来了，还装什么路过。", { honesty: 1, closeness: 1 }, "我先把这句话留在这里。"),
      choice("delivery-anonymity-car", "最重要的是——车为什么跑了。", { acceptance: 1, companionship: 1 }, "我先把这句话留在这里。")
    ]
  },
  {
    id: "catch-line",
    prompt: "为了要抓你嘛。",
    choices: [
      choice("catch-line-remember", "记住原话就好。", { acceptance: 1, honesty: 1 }, "我不替这句话加上没有说过的后半句。"),
      choice("catch-line-question", "我还是会想，这句话到底算什么。", { closeness: 1, intervention: 1 }, "我可以记得疑问还在。"),
      choice("catch-line-ordinary", "她就是下来拿宵夜的。", { distance: 1, acceptance: 1 }, "事情也可以只停在事情。")
    ]
  },
  {
    id: "fries-meaning",
    prompt: "本来只是一包薯条。",
    choices: [
      choice("fries-special-delivery", "可是我确实是特地送来的。", { honesty: 1, closeness: 1 }, "这件事的重量，由我自己负责。"),
      choice("fries-friends", "朋友也会带吃的。事情可以只是事情。", { acceptance: 1, companionship: 1 }, "我先让它保持普通。"),
      choice("fries-fear", "我当时最怕的，是她看懂得比我说得快。", { concealment: 1, closeness: 1 }, "害怕被看懂，也是一段事实。")
    ]
  }
];

export const april06ReflectionQuotes = [
  {
    id: "april06-accepting",
    tone: "accepting" as const,
    preference: { acceptance: 1, companionship: 1 },
    lines: [
      "那晚发生的，就只有这些。",
      "她下来了，我还没走。"
    ],
    afterline:
      "后来想想，也不需要把那几分钟解释成什么。"
  },

  {
    id: "april06-holding",
    tone: "holding" as const,
    preference: { honesty: 1, closeness: 1 },
    lines: [
      "我确实是特地送来的。",
      "至少这件事，不用装作不知道。"
    ],
    afterline:
      "我只是终于承认，那晚的我其实很想见你。"
  },

  {
    id: "april06-not-ready",
    tone: "not-ready" as const,
    preference: { concealment: 2, distance: 1 },
    lines: [
      "我记得她说了什么。",
      "不替她补下一句。"
    ],
    afterline:
      "有些话停在那晚，就已经够近了。"
  },

  {
    id: "april06-rewriting",
    tone: "rewriting" as const,
    preference: { intervention: 2, closeness: 1 },
    lines: [
      "我本来想把东西留下，把自己带走。",
      "配送成功，逃跑失败。"
    ],
    afterline:
      "如果那辆车没有先开走，这一晚大概只会是一张成功送达的照片。"
  }
];

export const april06Chapter: ChapterDefinition = {
  id: "april06-not-gone-yet",
  diaryEntryId: "authored-diary-april06-not-gone-yet",
  runtimeScene: "406",
  date: "04.06",
  title: "还没走啊？",
  mood: "a humid ordinary hostel night where a quick delivery fails to stay anonymous",
  weather: "quiet humid night after an earlier rainy day",
  location: "Lobby",
  characters: ["Muji", "MS", "ET"],
  objects: [
    "McDonald's takeaway",
    "fries",
    "water container memory",
    "Perodua Alza",
    "KTHO lobby"
  ],
  evidence: [
    "authored-406-landscape-scene-layout",
    "authored-406-portrait-scene-layout"
  ],
  dialogue: [],

canonicalClosure: {
  historicalEventId: "april06-mcd-lobby-memory",
  lines: [
    "她最后还是下来了。",
    "我们在楼下聊了一会儿。",
    "后来朋友把车开回来了，我才离开。"
  ]
},

  reflectionQuotes: april06ReflectionQuotes
};

export type April06Position = { anchor: April06AnchorKey | "watergun-crossing"; offset?: Point; echo?: boolean };
export type April06Action =
  | { type: "wait"; duration: number }
  | { type: "spawn"; actor: string; position: April06Position; asset: keyof typeof april06Assets; frame?: number; facing?: "left" | "right"; kind?: "human" | "motor" | "compound-motor"; opacity?: number }
  | { type: "move"; actor: string; position: April06Position; duration: number; asset?: keyof typeof april06Assets; frame?: number; facing?: "left" | "right" }
  | { type: "sprite"; actor: string; asset: keyof typeof april06Assets; frame?: number }
  | { type: "face"; actor: string; facing: "left" | "right" }
  | { type: "dialogue"; speaker: string; text: string;  portrait?: DialoguePortrait; }
  | { type: "checkpoint"; id: string }
  | { type: "prop"; id: "mcd"; asset: "mcd"; owner?: string; position?: April06Position; visible: boolean }
  | { type: "effect"; id: string; kind: "dissolve"; position?: April06Position; duration: number }
  | { type: "echo-beat"; id: string; ms: April06VisualBeat; et: April06VisualBeat; duration: number; msOffset: number; etOffset: number }
  | { type: "fade"; actors: string[]; duration: number };

const at = (anchor: April06AnchorKey, offset?: Point): April06Position => ({ anchor, offset });
const echoAt = (offset?: Point): April06Position => ({ anchor: "watergun-crossing", offset, echo: true });
const visual = (beat: April06VisualBeat): keyof typeof april06Assets => april06VisualMap[beat];

export const april06MainMemoryActions: April06Action[] = [
  { type: "spawn", actor: "ms", position: at("ms-drop-start"), asset: visual("ms-carry-mcd"), frame: 0, facing: "right" },
  { type: "move", actor: "ms", position: at("mcd-drop-point"), duration: 0.9, asset: visual("ms-carry-mcd"), facing: "right" },
  { type: "sprite", actor: "ms", asset: visual("ms-stand-mcd") },
  { type: "wait", duration: 0.28 },
  { type: "sprite", actor: "ms", asset: visual("ms-observe-mcd") },
  { type: "wait", duration: 0.36 },
  { type: "sprite", actor: "ms", asset: visual("ms-place-mcd") },
  { type: "wait", duration: 0.52 },
  { type: "prop", id: "mcd", asset: "mcd", position: at("mcd-drop-point"), visible: true },
  { type: "sprite", actor: "ms", asset: visual("ms-stare-mcd") },
  { type: "wait", duration: 0.38 },
  { type: "sprite", actor: "ms", asset: visual("ms-photo-mcd") },
  { type: "wait", duration: 0.48 },
  { type: "dialogue", speaker: "我", text: "同学 你的宵夜已送到。", portrait: "assets/523/memory-portrait/bus-stop-memory.png" },
  { type: "dialogue", speaker: "我", text: "请趁热食用。", portrait: "assets/523/memory-portrait/bus-stop-memory.png" },
  { type: "dialogue", speaker: "我", text: "不要食用的话你就当早餐嘻嘻，拜拜。", portrait: "assets/523/memory-portrait/bus-stop-memory.png" },
  { type: "sprite", actor: "ms", asset: visual("ms-think-mcd") },
  { type: "wait", duration: 0.42 },
  { type: "sprite", actor: "ms", asset: visual("ms-leave-mcd") },
  { type: "move", actor: "ms", position: at("ms-escape-turn"), duration: 0.72, asset: visual("ms-leave-mcd"), facing: "left" },
  { type: "move", actor: "ms", position: at("ms-roadside-stop"), duration: 0.48, asset: visual("ms-escape") , facing: "left" },
  { type: "sprite", actor: "ms", asset: visual("ms-empty-car") },
  { type: "wait", duration: 0.62 },
  { type: "dialogue", speaker: "我", text: "wtf？？？车怎么开走了？！我还没上车啊朋友们QAQ", portrait: "assets/523/memory-portrait/03.png" },
  { type: "checkpoint", id: "delivery-anonymity" },
  { type: "sprite", actor: "ms", asset: visual("ms-look-lobby") },
  { type: "wait", duration: 0.38 },

  { type: "spawn", actor: "et", position: at("et-lobby-spawn"), asset: visual("et-lobby-exit"), frame: 0, facing: "left" },
  { type: "move", actor: "et", position: at("et-catch-position"), duration: 0.62, asset: visual("et-walking-out"), facing: "left" },
  { type: "sprite", actor: "et", asset: visual("et-notice-ms") },
  { type: "wait", duration: 0.32 },
  { type: "sprite", actor: "et", asset: visual("et-amused") },
  { type: "wait", duration: 0.48 },
  { type: "dialogue", speaker: "她", text: "诶还没走啊~", portrait: "assets/624/echo-portraits/et-portraits/01-questioning.png" },
  { type: "move", actor: "et", position: at("et-catch-position"), duration: 0.38, asset: visual("et-approaches"), facing: "left" },
  { type: "sprite", actor: "et", asset: visual("et-stop") },
  { type: "wait", duration: 0.34 },
  { type: "sprite", actor: "et", asset: visual("et-conversational") },
  { type: "sprite", actor: "ms", asset: visual("ms-awkward-caught") },
  { type: "dialogue", speaker: "我", text: "……你下来的很快哦。", portrait: "assets/523/memory-portrait/01.png" },
  { type: "dialogue", speaker: "她", text: "肯定，为了要抓你嘛。", portrait: "assets/624/echo-portraits/et-portraits/01-questioning.png" },
  { type: "checkpoint", id: "catch-line" },

  { type: "prop", id: "mcd", asset: "mcd", position: at("mcd-drop-point"), visible: false },
  { type: "move", actor: "et", position: at("et-mcd-pickup"), duration: 0.55, asset: visual("et-hold-bag"), facing: "left" },
  { type: "sprite", actor: "et", asset: visual("et-reach-bag") },
  { type: "wait", duration: 0.38 },
  { type: "sprite", actor: "et", asset: visual("et-pull-fry") },
  { type: "wait", duration: 0.38 },
  { type: "sprite", actor: "et", asset: visual("et-eat-fry") },
  { type: "wait", duration: 0.56 },
  { type: "sprite", actor: "et", asset: visual("et-chew") },
  { type: "wait", duration: 0.42 },
  { type: "spawn", actor: "ms", position: at("ms-chat-position"), asset: visual("ms-chat-a"), frame: 0, facing: "right" },
  { type: "move", actor: "et", position: at("et-chat-position"), duration: 0.58, asset: visual("et-hold-bag"), facing: "left" },
  { type: "dialogue", speaker: "她", text: "你现在怎样回去？",portrait: "assets/624/echo-portraits/et-portraits/08-soft-look.png" },
  { type: "dialogue", speaker: "我", text: "我朋友等下来载我 hehe。", portrait: "assets/523/memory-portrait/01.png" },
  { type: "sprite", actor: "et", asset: visual("et-talk") },
  { type: "sprite", actor: "ms", asset: visual("ms-chat-b") },
  { type: "dialogue", speaker: "她", text: "你吃了吗？", portrait: "assets/624/echo-portraits/et-portraits/01-questioning.png" },
  { type: "dialogue", speaker: "她", text: "多少钱我转你啦。", portrait: "assets/624/echo-portraits/et-portraits/01-questioning.png" },
  { type: "dialogue", speaker: "我", text: "不用不用。", portrait: "assets/523/memory-portrait/02.png" },
  { type: "dialogue", speaker: "我", text: "你吃了就等于我吃了。", portrait: "assets/523/memory-portrait/02.png" },
  { type: "dialogue", speaker: "我", text: "你要带着我的那份吃下去嘻嘻。", portrait: "assets/523/memory-portrait/02.png" },
  { type: "dialogue", speaker: "她", text: "你朋友不在房间，有事出去了。", portrait: "assets/624/echo-portraits/et-portraits/01-questioning.png" },
  { type: "dialogue", speaker: "她", text: "明天她还要 5.30am 起床。", portrait: "assets/624/echo-portraits/et-portraits/01-questioning.png" },
  { type: "dialogue", speaker: "我", text: "噢是吗 那你几点？", portrait: "assets/523/memory-portrait/02.png" },
  { type: "dialogue", speaker: "她", text: "也是 5.30am。", portrait: "assets/624/echo-portraits/et-portraits/01-questioning.png" },
  { type: "dialogue", speaker: "她", text: "你明天有没有去 faculty 的活动？", portrait: "assets/624/echo-portraits/et-portraits/01-questioning.png" },
  { type: "dialogue", speaker: "我", text: "你去吗？", portrait: "assets/523/memory-portrait/02.png" },
  { type: "dialogue", speaker: "她", text: "我和我朋友都去。", portrait: "assets/624/echo-portraits/et-portraits/01-questioning.png" },
  { type: "dialogue", speaker: "我", text: "njhl。", portrait: "assets/523/memory-portrait/02.png" },
  { type: "dialogue", speaker: "她", text: "怎么，你有上课？", portrait: "assets/624/echo-portraits/et-portraits/01-questioning.png" },
  { type: "dialogue", speaker: "我", text: "对啊。", portrait: "assets/523/memory-portrait/02.png" },
  { type: "checkpoint", id: "fries-meaning" },

  { type: "sprite", actor: "ms", asset: visual("ms-notice-car") },
  { type: "spawn", actor: "alza", position: at("car-return-edge"), asset: visual("alza-enter-initial"), kind: "motor", facing: "left" },
  { type: "wait", duration: 0.42 },
  { type: "effect", id: "alza-headlights", kind: "dissolve", position: at("car-return-edge"), duration: 0.45 },
  { type: "sprite", actor: "alza", asset: visual("alza-enter-3") },
  { type: "wait", duration: 0.36 },
  { type: "sprite", actor: "alza", asset: visual("alza-enter-2") },
  { type: "wait", duration: 0.42 },
  { type: "sprite", actor: "alza", asset: visual("alza-enter-final") },
  { type: "wait", duration: 0.56 },
  { type: "move", actor: "et", position: at("car-return-edge"), duration: 0.78, asset: visual("et-glance"), facing: "left" },
  { type: "dialogue", speaker: "她", text: "噢你朋友来了。", portrait: "assets/624/echo-portraits/et-portraits/01-questioning.png" },
  { type: "move", actor: "et", position: at("car-return-edge"), duration: 0.32, asset: visual("et-goodbye"), facing: "left" },
  { type: "dialogue", speaker: "她", text: "拜拜。", portrait: "assets/624/echo-portraits/et-portraits/08-soft-look.png" },
  { type: "move", actor: "ms", position: at("ms-exit-pickup"), duration: 0.72, asset: visual("ms-turn"), facing: "left" },
  { type: "dialogue", speaker: "我", text: "拜拜。", portrait: "assets/523/memory-portrait/02.png" },
  { type: "fade", actors: ["ms", "et", "alza"], duration: 0.55 }
];

export const april06EchoBeats: Array<{ id: string; ms: April06VisualBeat; et: April06VisualBeat; duration: number; msOffset: number; etOffset: number }> = [
  { id: "morning-approach", ms: "morning-ms-walking", et: "morning-et-walking", duration: 0.34, msOffset: 72, etOffset: -72 },
  { id: "morning-recognition", ms: "morning-ms-notice", et: "morning-et-notice", duration: 0.34, msOffset: 40, etOffset: -40 },
  { id: "morning-joke-start", ms: "morning-ms-see", et: "morning-et-raise-hand", duration: 0.38, msOffset: 16, etOffset: -16 },
  { id: "morning-spray", ms: "morning-ms-pocket", et: "morning-et-spray", duration: 0.42, msOffset: 0, etOffset: 0 },
  { id: "morning-counter-prep", ms: "morning-ms-pocket-draw", et: "morning-et-hold", duration: 0.42, msOffset: 0, etOffset: 0 },
  { id: "morning-counter", ms: "morning-ms-counter", et: "morning-et-dodge", duration: 0.56, msOffset: -20, etOffset: 20 },
  { id: "morning-laugh", ms: "morning-ms-laugh", et: "morning-et-amused-recovery", duration: 0.62, msOffset: -80, etOffset: 80 },
  { id: "morning-pass", ms: "morning-ms-walk", et: "morning-et-continue-walking", duration: 0.52, msOffset: -174, etOffset: 174 }
];

export const april06EchoActions: April06Action[] = [
  { type: "spawn", actor: "ms", position: echoAt({ x: 96, y: 0 }), asset: visual("morning-ms-walking"), frame: 0, facing: "left" },
  { type: "spawn", actor: "et", position: echoAt({ x: -96, y: 0 }), asset: visual("morning-et-walking"), frame: 0, facing: "right" },
  ...april06EchoBeats.map((beat): April06Action => ({ type: "echo-beat", id: beat.id, ms: beat.ms, et: beat.et, duration: beat.duration, msOffset: beat.msOffset, etOffset: beat.etOffset })),
  { type: "fade", actors: ["ms", "et"], duration: 0.45 },
  { type: "wait", duration: 0.32 },
  { type: "dialogue", speaker: "朋友", text: "今天不 monday blue 了咯", portrait:"assets/624/echo-portraits/group-echoes/01-morning-angela-st.png"},
  { type: "dialogue", speaker: "我", text: "hehe 本来就不blue 你不懂昨天晚上发生了啥", portrait: "assets/523/memory-portrait/02.png" },
  { type: "dialogue", speaker: "朋友", text: "啥 快告诉我！", portrait:"assets/624/echo-portraits/group-echoes/01-morning-angela-st.png"},
  { type: "dialogue", speaker: "我", text: "hehe", portrait: "assets/523/memory-portrait/02.png" }
];

function resolvePosition(layout: SceneLayout, position: April06Position): Point {
  const base = position.echo
    ? resolveSceneEchoAnchor(layout, "watergun-crossing")
    : layout.anchors[position.anchor];
  if (!base) throw new Error(`Missing April 6 anchor: \${position.anchor}`);
  return { x: base.x + (position.offset?.x ?? 0), y: base.y + (position.offset?.y ?? 0) };
}

export function resolveApril06Actions(layout: SceneLayout, actions: April06Action[]): CutsceneAction[] {
  return actions.flatMap((action): CutsceneAction[] => {
    if (action.type === "wait" || action.type === "dialogue" || action.type === "checkpoint" || action.type === "fade") return [action];
    if (action.type === "echo-beat") {
      const base = resolvePosition(layout, echoAt());
      return [
        {
          type: "spriteGroup",
          states: [
            { actor: "ms", sprite: { assetId: visual(action.ms), frame: 0 } },
            { actor: "et", sprite: { assetId: visual(action.et), frame: 0 } }
          ]
        },
        {
          type: "moveGroup",
          duration: action.duration,
          moves: [
            { actor: "ms", x: base.x + action.msOffset, y: base.y, facing: "left" },
            { actor: "et", x: base.x + action.etOffset, y: base.y, facing: "right" }
          ]
        }
      ];
    }
    if (action.type === "spawn") {
      const point = resolvePosition(layout, action.position);
      return [{ type: "spawn", actor: action.actor, kind: action.kind ?? "human", x: point.x, y: point.y, facing: action.facing, sprite: { assetId: action.asset, frame: action.frame ?? 0 }, opacity: action.opacity }];
    }
    if (action.type === "move") {
      const point = resolvePosition(layout, action.position);
      return [{ type: "move", actor: action.actor, x: point.x, y: point.y, duration: action.duration, facing: action.facing, sprite: action.asset ? { assetId: action.asset, frame: action.frame ?? 0 } : undefined }];
    }
    if (action.type === "sprite") return [{ type: "sprite", actor: action.actor, sprite: { assetId: action.asset, frame: action.frame ?? 0 } }];
    if (action.type === "face") return [{ type: "face", actor: action.actor, direction: action.facing }];
    if (action.type === "prop") {
      const prop: CutsceneAction = {
        type: "prop",
        id: action.id,
        assetId: action.asset,
        position: action.position ? resolvePosition(layout, action.position) : undefined,
        visible: action.visible
      };
      if (action.owner !== undefined && prop.type === "prop") prop.owner = action.owner;
      return [prop];
    }
    const point = action.position ? resolvePosition(layout, action.position) : undefined;
    return [{ type: "effect", id: action.id, kind: action.kind, position: point, duration: action.duration }];
  });
}
