import type { Choice, ChapterDefinition } from "../types.js";
import type { Point } from "../systems/CollisionSystem.js";
import type { CutsceneAction } from "../systems/CutsceneSystem.js";
import type { SceneSpriteAsset } from "../systems/SceneActorRenderer.js";
import { resolveSceneEchoAnchor, type SceneLayout } from "../systems/SceneLayouts.js";
import { march30Assets, type March30AssetId } from "./march30Memory.js";

export type April05AnchorKey =
  | "ms-wait-position" | "angela-wait-position" | "st-wait-position"
  | "et-entrance-spawn" | "et-arrival-position" | "ms-spray-position" | "et-sprayed-position"
  | "et-ruffle-start" | "et-ruffle-contact" | "ms-ruffle-target"
  | "et-trash-start" | "et-trash-position" | "et-trash-return"
  | "ms-friends-spray-position" | "angela-sprayed-position" | "st-sprayed-position"
  | "et-lock-position" | "ms-locked-target" | "et-final-talk-position" | "ms-final-talk-position"
  | "et-goodbye-position" | "et-exit-position";

export type April05EchoId = "cat-echo" | "bicycle" | "phone-after-return";
export type April05EchoAnchorKey = "cat-approach" | "bicycle-st-comment" | "phone-after-return";

type PngAssetOptions = {
  feet?: { x: number; y: number };
  materialScale?: number;
  nozzleOrigin?: { x: number; y: number };
  mirrorForLeft?: boolean;
};

const pngAsset = (
  path: string,
  w: number,
  h: number,
  visibleBounds: { x: number; y: number; w: number; h: number },
  options: PngAssetOptions = {}
): SceneSpriteAsset => ({
  path,
  source: { x: 0, y: 0, w, h },
  visibleBounds,
  feet: options.feet ?? {
    x: (visibleBounds.x + visibleBounds.w / 2) / w,
    y: (visibleBounds.y + visibleBounds.h) / h
  },
  materialScale: options.materialScale,
  nozzleOrigin: options.nozzleOrigin,
  mirrorForLeft: options.mirrorForLeft
});

const frameAsset = (assetId: March30AssetId, frame: number): SceneSpriteAsset => {
  const asset = march30Assets[assetId];
  const source = asset.frames[frame];
  if (!source) throw new Error(`Missing March 30 frame ${assetId}:${frame}`);
  const visibleBounds = asset.visibleBounds?.[frame];
  return {
    path: asset.path,
    source: source.source,
    visibleBounds,
    feet: {
      x: source.feet.x / source.source.w,
      y: source.feet.y / source.source.h
    },
    materialScale: 1.2,
    mirrorForLeft: asset.mirrorForLeft
  };
};

type FrameTuple = [number, number, number, number, number, number];

const family = (
  prefix: string,
  directory: string,
  frames: FrameTuple[],
  fileNames: string[],
  options: PngAssetOptions = {}
): Record<string, SceneSpriteAsset> => Object.fromEntries(frames.map((frame, index) => {
  const [w, h, x, y, visibleW, visibleH] = frame;
  const key = `${prefix}-${String(index + 1).padStart(2, "0")}`;
  return [key, pngAsset(`${directory}/${fileNames[index]}.png`, w, h, { x, y, w: visibleW, h: visibleH }, options)];
}));

const hairRuffleEt = family("et-hair-ruffle", "assets/405/405-hair-ruffle", [
  [384, 512, 60, 46, 273, 449], [384, 512, 50, 72, 271, 423], [384, 512, 58, 72, 315, 423], [384, 512, 44, 56, 305, 439],
  [384, 512, 50, 10, 333, 451], [384, 512, 0, 32, 339, 419], [384, 512, 52, 22, 279, 441], [384, 512, 32, 12, 247, 449]
], ["01", "02", "03", "04", "05", "06", "07", "08"]);

const hairRuffledMs = family("ms-hair-ruffled", "assets/405/405-hair-ruffled", [
  [384, 512, 118, 24, 213, 477], [384, 512, 110, 34, 207, 469], [384, 512, 70, 56, 243, 447], [384, 512, 38, 46, 233, 455],
  [384, 512, 102, 18, 231, 465], [384, 512, 84, 20, 233, 459], [384, 512, 74, 18, 225, 463], [384, 512, 74, 26, 201, 455]
], ["01", "02", "03", "04", "05", "06", "07", "08"]);

const lockEt = family("et-lock", "assets/405/lock", [
  [384, 512, 36, 4, 261, 507], [384, 512, 58, 64, 265, 447], [321, 512, 30, 68, 251, 443], [384, 512, 0, 62, 339, 449],
  [384, 481, 60, 2, 305, 445], [384, 501, 50, 36, 283, 431], [384, 493, 48, 14, 277, 445], [384, 488, 20, 10, 281, 445]
], ["01", "02", "03", "04", "05", "06", "07", "08"]);

const lockedMs = family("ms-locked", "assets/405/locked", [
  [384, 512, 104, 40, 217, 469], [384, 512, 60, 50, 243, 457], [384, 512, 76, 52, 221, 455], [384, 512, 28, 72, 259, 435],
  [384, 512, 88, 20, 255, 443], [384, 512, 74, 18, 243, 445], [384, 512, 76, 14, 221, 449], [384, 512, 74, 18, 221, 445]
], ["01", "02", "03", "04", "05", "06", "07", "08"]);

const stFrames = family("st", "assets/405/friend/su", [
  [176, 332, 22, 18, 145, 313], [196, 334, 16, 18, 159, 315], [203, 328, 16, 20, 165, 307], [181, 335, 14, 18, 149, 317],
  [190, 290, 20, 0, 169, 289], [210, 293, 34, 0, 165, 293], [234, 299, 42, 6, 165, 293], [193, 295, 22, 0, 167, 295],
  [201, 297, 6, 0, 179, 293], [250, 293, 30, 0, 183, 293], [206, 287, 14, 2, 175, 285], [194, 293, 10, 0, 171, 291],
  [235, 311, 50, 10, 137, 289], [184, 305, 22, 4, 143, 297], [175, 299, 12, 2, 145, 297], [211, 301, 40, 2, 145, 297]
], Array.from({ length: 16 }, (_, index) => String(index + 1)));

const april05WaterSprayingMs = family("ms-water-spraying", "assets/405/405-water-spraying", [
  [408, 536, 123, 46, 231, 468], [408, 536, 84, 57, 236, 460], [408, 536, 54, 48, 339, 463], [408, 536, 16, 51, 304, 460],
  [408, 536, 42, 31, 313, 448], [408, 536, 13, 62, 374, 441], [408, 536, 40, 82, 328, 433], [408, 536, 108, 39, 219, 464]
], Array.from({ length: 8 }, (_, index) => `frame-${String(index + 1).padStart(2, "0")}`), {
  materialScale: 1.2,
  nozzleOrigin: { x: 0.12, y: 0.46 },
  mirrorForLeft: false
});

const april05WaterSprayedEt = family("et-water-sprayed", "assets/405/405-water-sprayed", [
  [384, 502, 52, 7, 277, 484], [363, 499, 9, 8, 342, 480], [380, 467, 10, 5, 336, 450], [356, 446, 9, 13, 341, 424],
  [348, 469, 7, 6, 332, 451], [359, 498, 6, 27, 334, 458], [353, 471, 9, 6, 301, 452], [293, 497, 10, 12, 273, 473]
], [
  "et-april05-water-sprayed-frame-01", "et-april05-water-sprayed-frame-02", "et-april05-water-sprayed-frame-03", "et-april05-water-sprayed-frame-04",
  "et-april05-water-sprayed-frame-05", "et-april05-water-sprayed-frame-06", "et-april05-water-sprayed-frame-07", "et-april05-water-sprayed-frame-08"
], {
  materialScale: 1.2,
  mirrorForLeft: false
});
const angelaFrames = family("angela", "assets/405/friend/te", [
  [179, 320, 16, 18, 133, 287], [189, 326, 14, 22, 141, 303], [201, 322, 20, 18, 143, 289], [167, 310, 10, 20, 129, 285],
  [194, 314, 32, 6, 149, 307], [218, 308, 0, 6, 199, 289], [230, 294, 0, 0, 193, 283], [186, 293, 12, 2, 173, 291],
  [205, 300, 14, 0, 189, 299], [236, 305, 22, 8, 175, 297], [218, 305, 22, 14, 147, 291], [208, 306, 12, 10, 181, 293],
  [187, 302, 32, 4, 123, 293], [229, 313, 0, 4, 219, 301], [193, 317, 0, 0, 187, 317], [159, 309, 12, 6, 137, 293]
], Array.from({ length: 16 }, (_, index) => String(index + 1)));

export const april05Assets: Record<string, SceneSpriteAsset> = {
  "ms-wait": frameAsset("msBase", 8),
  "ms-walk": frameAsset("msBase", 9),
  "et-wait": frameAsset("etBase", 5),
  "et-walk": frameAsset("etBase", 6),



  "water-gun": {
    path: march30Assets.waterGun.path,
    source: march30Assets.waterGun.source,
    visibleBounds: { x: 0, y: 0, w: march30Assets.waterGun.source.w, h: march30Assets.waterGun.source.h },
    feet: { x: 0.5, y: 1 },
    materialScale: 0.55
  },
  ...hairRuffleEt,
  ...hairRuffledMs,
  ...lockEt,
  ...lockedMs,
  ...stFrames,
  ...angelaFrames,
  ...april05WaterSprayingMs,
  ...april05WaterSprayedEt
};

export type April05Position = { anchor: April05AnchorKey | April05EchoAnchorKey; offset?: Point; echo?: boolean };
export type April05Action =
  | { type: "wait"; duration: number }
  | { type: "spawn"; actor: string; position: April05Position; asset: string; facing?: "left" | "right"; kind?: "human" | "motor" | "compound-motor"; opacity?: number }
  | { type: "move"; actor: string; position: April05Position; duration: number; asset?: string; facing?: "left" | "right" }
  | { type: "moveGroup"; duration: number; moves: Array<{ actor: string; position: April05Position; asset?: string; facing?: "left" | "right" }> }
  | { type: "sprite"; actor: string; asset: string }
  | { type: "spriteGroup"; states: Array<{ actor: string; asset: string }> }
  | { type: "face"; actor: string; facing: "left" | "right" }
  | { type: "dialogue"; speaker: string; text: string }
  | { type: "checkpoint"; id: string }
  | { type: "prop"; id: string; asset: string; owner?: string; position?: April05Position; visible: boolean }
  | { type: "effect"; id: string; kind: "water-vfx" | "dissolve"; actor?: string; target?: string; frame?: number; position?: April05Position; duration: number }
  | { type: "fade"; actors: string[]; duration: number }
  | { type: "despawn"; actor: string };

const at = (anchor: April05AnchorKey, offset?: Point): April05Position => ({ anchor, offset });
const dialogue = (speaker: string, text: string): April05Action => ({ type: "dialogue", speaker, text });
const sprite = (actor: string, asset: string): April05Action => ({ type: "sprite", actor, asset });
const spriteGroup = (...states: Array<[string, string]>): April05Action => ({
  type: "spriteGroup",
  states: states.map(([actor, asset]) => ({ actor, asset }))
});

const choice = (id: string, label: string, effects: Choice["effects"], response: string): Choice => ({ id, label, effects, response });

export type April05ReflectionChoicePoint = { id: string; prompt: string; choices: Choice[] };

export const april05ReflectionChoices: April05ReflectionChoicePoint[] = [
  {
    id: "april-five-sad-thing",
    prompt: "她说，还是会痛。",
    choices: [
      choice("april-five-sad-together", "原来开心和难过可以一起留在一个晚上。", { acceptance: 1, honesty: 1 }, "我先把两个事实都留在这里。"),
      choice("april-five-sad-question", "我还是想知道，她那时到底想起了什么。", { closeness: 1, intervention: 1 }, "日记没有完整的答案。我可以记得这个问题还在。"),
      choice("april-five-sad-fact", "先记住她说了什么，不替她解释。", { distance: 1, honesty: 1 }, "我不替她回答没有说出口的部分。")
    ]
  },
  {
    id: "april-five-happy-because-see-you",
    prompt: "她说，因为可以见到你。",
    choices: [
      choice("april-five-happy-complete", "她说她开心。这个事实已经够完整了。", { acceptance: 1, companionship: 1 }, "我先让这句话保持它原来的大小。"),
      choice("april-five-happy-question", "我承认，我还是会想那句话是什么意思。", { honesty: 1, closeness: 1 }, "想知道，不等于要替她补答案。"),
      choice("april-five-happy-congratulations", "然后我回了她一句‘恭喜你’。", { acceptance: 1, distance: 1 }, "有些回答说出口以后，也只是当时的回答。")
    ]
  },
  {
    id: "april-five-quiz",
    prompt: "她留下来聊到了第二天的 quiz。",
    choices: [
      choice("april-five-quiz-return", "她本来可以先回去。", { closeness: 1, companionship: 1 }, "我记得她留下来的时间，不替它找更大的理由。"),
      choice("april-five-quiz-stayed", "她留下来了。理由不用我补。", { acceptance: 1, honesty: 1 }, "这件事本身已经足够清楚。"),
      choice("april-five-quiz-close", "有些靠近只需要发生，不一定要证明什么。", { acceptance: 1, distance: 1 }, "我让这段靠近停在发生过的地方。")
    ]
  }
];

export const april05Chapter: ChapterDefinition = {
  id: "april05-come-down",
  diaryEntryId: "authored-diary-april05-come-down",
  runtimeScene: "405",
  date: "04.05",
  title: "下来一下",
  mood: "a late hostel-night memory that stays ordinary and close",
  weather: "warm night after a humid day",
  location: "KTHO residential-college entrance / front sitting area",
  characters: ["Muji", "MS", "ET", "ST", "Angela"],
  objects: ["water gun", "front sitting area", "school bag", "bicycle"],
  evidence: ["authored-405-landscape-scene-layout", "authored-405-portrait-scene-layout"],
  dialogue: [],
  canonicalClosure: {
    historicalEventId: "april05-ktho-night-memory",
    lines: ["那晚，她最后还是回去冲凉了。", "第二天早上，她还有 quiz。"]
  },
  reflectionQuotes: []
};

export const april05ReflectionQuotes = [
  { id: "april05-accepting", tone: "accepting" as const, preference: { acceptance: 1, companionship: 1 }, lines: ["她说她开心。", "后来她也说，还是会痛。", "那晚两个都是真的。"] },
  { id: "april05-closeness", tone: "holding" as const, preference: { closeness: 1 }, lines: ["我还是会记得，", "她被叫下来以后，没有马上走。"] },
  { id: "april05-honesty", tone: "holding" as const, preference: { honesty: 1 }, lines: ["我当然还是会想，", "那些动作是什么意思。", "只是这次不替她回答。"] },
  { id: "april05-distance", tone: "not-ready" as const, preference: { distance: 1 }, lines: ["她下来。", "坐了一会。", "又回去了。", "回忆不一定要比这更多。"] },
  { id: "april05-companionship", tone: "accepting" as const, preference: { companionship: 1 }, lines: ["四个人在宿舍门口尬聊到很晚。", "当时也就这样。"] }
];

april05Chapter.reflectionQuotes = april05ReflectionQuotes;

export const april05MainMemoryActions: April05Action[] = [
  { type: "wait", duration: 0.25 },
  { type: "spawn", actor: "ms", position: at("ms-wait-position"), asset: "ms-wait", facing: "right" },
  { type: "spawn", actor: "angela", position: at("angela-wait-position"), asset: "angela-01", facing: "left" },
  { type: "spawn", actor: "st", position: at("st-wait-position"), asset: "st-01", facing: "left" },
  dialogue("MS", "ei你在宿舍吗"),
  dialogue("ET", "在啊怎么 你来了啊 不要跟我讲你又晚上骑脚车"),
  dialogue("MS", "是诶我在你门口 你下来一下"),
  { type: "prop", id: "water-gun", asset: "water-gun", owner: "ms", visible: true },
  { type: "spawn", actor: "et", position: at("et-entrance-spawn"), asset: "et-walk", facing: "left" },
  { type: "move", actor: "et", position: at("et-arrival-position"), duration: 0.85, asset: "et-walk", facing: "left" },
  { type: "move", actor: "ms", position: at("ms-spray-position"), duration: 0.5, asset: "ms-wait", facing: "left" },
  { type: "move", actor: "et", position: at("et-sprayed-position"), duration: 0.2, asset: "et-wait", facing: "right" },
  { type: "prop", id: "water-gun", asset: "water-gun", owner: "ms", visible: false },
  sprite("ms", "ms-water-spraying-01"),
  { type: "wait", duration: 0.08 },
  sprite("ms", "ms-water-spraying-02"),
  { type: "wait", duration: 0.08 },
  sprite("ms", "ms-water-spraying-03"),
  { type: "wait", duration: 0.08 },
  sprite("ms", "ms-water-spraying-04"),
  { type: "effect", id: "april05-water-hit", kind: "water-vfx", actor: "ms", target: "et", frame: 3, duration: 0.28 },
sprite("ms", "ms-water-spraying-05"),
  { type: "wait", duration: 0.08 },
  sprite("ms", "ms-water-spraying-06"),
  { type: "wait", duration: 0.08 },
  sprite("ms", "ms-water-spraying-07"),
  { type: "wait", duration: 0.08 },
  sprite("ms", "ms-water-spraying-08"),
sprite("et", "et-water-sprayed-01"),
  { type: "wait", duration: 0.08 },
  sprite("et", "et-water-sprayed-02"),
  { type: "wait", duration: 0.08 },
  sprite("et", "et-water-sprayed-03"),
  { type: "wait", duration: 0.08 },
  sprite("et", "et-water-sprayed-04"),
  { type: "wait", duration: 0.08 },
  sprite("et", "et-water-sprayed-05"),
  { type: "wait", duration: 0.08 },
  sprite("et", "et-water-sprayed-06"),
  { type: "wait", duration: 0.08 },
  sprite("et", "et-water-sprayed-07"),
  { type: "wait", duration: 0.08 },
  sprite("et", "et-water-sprayed-08"),
  dialogue("ET", "！！？？wtf"),
  { type: "move", actor: "et", position: at("et-ruffle-start"), duration: 0.35, asset: "et-hair-ruffle-01", facing: "right" },
  { type: "move", actor: "ms", position: at("ms-ruffle-target"), duration: 0.25, asset: "ms-hair-ruffled-01", facing: "left" },
  spriteGroup(["et", "et-hair-ruffle-01"], ["ms", "ms-hair-ruffled-01"]),
  { type: "wait", duration: 0.18 },
  spriteGroup(["et", "et-hair-ruffle-03"], ["ms", "ms-hair-ruffled-03"]),
  { type: "wait", duration: 0.18 },
  spriteGroup(["et", "et-hair-ruffle-06"], ["ms", "ms-hair-ruffled-06"]),
  { type: "wait", duration: 0.22 },
  { type: "move", actor: "et", position: at("et-ruffle-contact"), duration: 0.2, asset: "et-hair-ruffle-07", facing: "right" },
  spriteGroup(["et", "et-hair-ruffle-08"], ["ms", "ms-hair-ruffled-08"]),
  dialogue("ET", "琢磨你们的朋友这样坏的。。。"),
  { type: "move", actor: "et", position: at("et-trash-start"), duration: 0.4, asset: "et-walk", facing: "right" },
  { type: "move", actor: "et", position: at("et-trash-position"), duration: 0.65, asset: "et-walk", facing: "right" },
  { type: "move", actor: "et", position: at("et-trash-return"), duration: 0.65, asset: "et-walk", facing: "left" },
  { type: "move", actor: "ms", position: at("ms-friends-spray-position"), duration: 0.35, asset: "ms-water-spraying-04", facing: "left" },
  { type: "move", actor: "angela", position: at("angela-sprayed-position"), duration: 0.35, asset: "angela-03", facing: "left" },
  { type: "move", actor: "st", position: at("st-sprayed-position"), duration: 0.35, asset: "st-03", facing: "right" },
  { type: "wait", duration: 0.22 },
  dialogue("ST", "你看ms无差别攻击"),
  { type: "moveGroup", duration: 0.45, moves: [
    { actor: "et", position: at("et-lock-position"), asset: "et-lock-01", facing: "right" },
    { actor: "ms", position: at("ms-locked-target"), asset: "ms-locked-01", facing: "left" }
  ] },
  spriteGroup(["et", "et-lock-01"], ["ms", "ms-locked-01"]),
  { type: "wait", duration: 0.18 },
  spriteGroup(["et", "et-lock-03"], ["ms", "ms-locked-03"]),
  { type: "wait", duration: 0.18 },
  spriteGroup(["et", "et-lock-06"], ["ms", "ms-locked-06"]),
  { type: "wait", duration: 0.22 },
  spriteGroup(["et", "et-lock-08"], ["ms", "ms-locked-08"]),
  dialogue("ET", "我真的想象不到怎么会有那么抽象random的人"),
  dialogue("MS", "啊你讲谁"),
  dialogue("ET", "啧"),
  { type: "moveGroup", duration: 0.35, moves: [
    { actor: "et", position: at("et-final-talk-position"), asset: "et-wait", facing: "right" },
    { actor: "ms", position: at("ms-final-talk-position"), asset: "ms-wait", facing: "left" }
  ] },
  dialogue("ET", "你知道今天是四月五号吗"),
  dialogue("ET", "清明节刚过，而且今年复活节也快到了。"),
  dialogue("MS", "你哭过啊"),
  dialogue("ET", "是啦 想起来一些伤心事"),
  { type: "checkpoint", id: "april-five-sad-thing" },
  dialogue("MS", "开心吗"),
  dialogue("ET", "开心啊 因为可以见到你~"),
  dialogue("ET", "你们看她不回我"),
  dialogue("MS", "啊 我要回什么 恭喜你？"),
  { type: "checkpoint", id: "april-five-happy-because-see-you" },
  dialogue("ET", "跑步可以 要我背着重重的书包跑不可以"),
  dialogue("MS", "那我帮你拿去给 faculty，书包不用背着跑。"),
  dialogue("ET", "噢真的吗 这样就可以~"),
  dialogue("ET", "明天早上还有 timetable 和 quiz，还是要回去。"),
  { type: "checkpoint", id: "april-five-quiz" },
  { type: "move", actor: "et", position: at("et-goodbye-position"), duration: 0.45, asset: "et-wait", facing: "right" },
  { type: "move", actor: "ms", position: at("ms-final-talk-position"), duration: 0.3, asset: "ms-wait", facing: "left" },
  dialogue("ET", "我不行了ms 我要去冲凉了"),
  { type: "move", actor: "et", position: at("et-exit-position"), duration: 0.75, asset: "et-walk", facing: "right" },
  { type: "fade", actors: ["ms", "et", "st", "angela"], duration: 0.5 },
  { type: "despawn", actor: "ms" },
  { type: "despawn", actor: "et" },
  { type: "despawn", actor: "st" },
  { type: "despawn", actor: "angela" }
];

export const april05EchoAnchors: Record<April05EchoId, April05EchoAnchorKey> = {
  "cat-echo": "cat-approach",
  bicycle: "bicycle-st-comment",
  "phone-after-return": "phone-after-return"
};

export const april05EchoActions: Record<April05EchoId, April05Action[]> = {
  "cat-echo": [
    dialogue("ET", "我可以接受我主动靠近它 但是它不能主动靠近我"),
    dialogue("ET", "你知道主动靠近和被靠近是不一样的吗"),
    dialogue("MUJI", "昨天她讲过这句话。今天她自己下了楼。")
  ],
  bicycle: [
    dialogue("ST", "你们两个是好朋友吗"),
    dialogue("ST", "好朋友会摸头吗"),
    dialogue("MUJI", "这是 ST 的看法，不是一个客观结论。")
  ],
  "phone-after-return": [
    dialogue("ET", "真的过了很久啦 只是今天想起来发现还是会痛"),
    dialogue("MS", "4月5号痛完了 还有6号7号要过"),
    dialogue("MS", "等你长大了就懂了"),
    dialogue("ET", "我明明比你大")
  ]
};

export function resolveApril05Actions(layout: SceneLayout, actions: April05Action[]): CutsceneAction[] {
  return actions.map((action): CutsceneAction => {
    if (action.type === "wait" || action.type === "dialogue" || action.type === "checkpoint" || action.type === "fade" || action.type === "despawn") return action;
    if (action.type === "spawn") {
      const position = resolvePosition(layout, action.position);
      return { type: "spawn", actor: action.actor, kind: action.kind ?? "human", x: position.x, y: position.y, facing: action.facing, sprite: { assetId: action.asset, frame: 0 }, opacity: action.opacity };
    }
    if (action.type === "move") {
      const position = resolvePosition(layout, action.position);
      return { type: "move", actor: action.actor, x: position.x, y: position.y, duration: action.duration, facing: action.facing, sprite: action.asset ? { assetId: action.asset, frame: 0 } : undefined };
    }
    if (action.type === "moveGroup") {
      return { type: "moveGroup", duration: action.duration, moves: action.moves.map((move) => {
        const position = resolvePosition(layout, move.position);
        return { actor: move.actor, x: position.x, y: position.y, facing: move.facing, sprite: move.asset ? { assetId: move.asset, frame: 0 } : undefined };
      }) };
    }
    if (action.type === "sprite") return { type: "sprite", actor: action.actor, sprite: { assetId: action.asset, frame: 0 } };
    if (action.type === "spriteGroup") return { type: "spriteGroup", states: action.states.map((state) => ({ actor: state.actor, sprite: { assetId: state.asset, frame: 0 } })) };
    if (action.type === "face") return { type: "face", actor: action.actor, direction: action.facing };
    if (action.type === "prop") return { type: "prop", id: action.id, assetId: action.asset, owner: action.owner, position: action.position ? resolvePosition(layout, action.position) : undefined, visible: action.visible };
    return { type: "effect", id: action.id, kind: action.kind, actor: action.actor, target: action.target, frame: action.frame, position: action.position ? resolvePosition(layout, action.position) : undefined, duration: action.duration };
  });
}

function resolvePosition(layout: SceneLayout, position: April05Position): Point {
  const point = position.echo ? resolveSceneEchoAnchor(layout, position.anchor) : layout.anchors[position.anchor];
  if (!point) throw new Error(`Missing April 5 authored anchor: ${position.anchor}`);
  return { x: point.x + (position.offset?.x ?? 0), y: point.y + (position.offset?.y ?? 0) };
}