import type { Choice, Tendencies } from "../types.js";
import type { Point } from "../systems/CollisionSystem.js";
import type { CutsceneAction } from "../systems/CutsceneSystem.js";
import type { SceneLayout } from "../systems/SceneLayouts.js";
import type { DialoguePortraitConfig } from "../systems/PresentationRenderer.js";

export type March30AnchorKey =
  | "et-bench-seat"
  | "ms-approach-start"
  | "ms-approach-turn"
  | "ms-talk-position"
  | "et-talk-position"
  | "et-jacket-wipe-start"
  | "ms-jacket-wipe-target"
  | "elevator-reencounter"
  | "walk-together";

export type March30AssetId =
  | "msBase"
  | "etBase"
  | "approach"
  | "waterSpraying"
  | "waterSprayed"
  | "keychains"
  | "jacketAction"
  | "jacketReaction"
  | "waterVfx"
  | "dissolve";

export type March30PropId = "gift" | "waterGun" | "ordinaryKeychain" | "phoneCharm";
export type March30DialoguePortrait = "ms" | "et" | "gift" | "waterGun" | "keychains" | DialoguePortraitConfig;

export type FrameRect = {
  source: { x: number; y: number; w: number; h: number };
  feet: { x: number; y: number };
};

export type March30Asset = {
  path: string;
  grid: string;
  frames: Record<number, FrameRect>;
  visibleBounds?: Array<{ x: number; y: number; w: number; h: number }>;
  nozzleOrigin?: { x: number; y: number };
  nozzleOriginByFrame?: Record<number, { x: number; y: number }>;
  travelBaseline?: { y: number };
  mirrorForLeft?: boolean;
};

export type March30Action =
  | { type: "wait"; duration: number }
  | { type: "spawn"; actor: "ms" | "et"; anchor: March30AnchorKey; asset: March30AssetId; frame: number; facing: "left" | "right"; offset?: Point }
  | { type: "move"; actor: "ms" | "et"; anchor: March30AnchorKey; duration: number; asset?: March30AssetId; frame?: number; facing?: "left" | "right"; offset?: Point }
  | { type: "sprite"; actor: "ms" | "et"; asset: March30AssetId; frame: number }
  | { type: "face"; actor: "ms" | "et"; facing: "left" | "right" }
  | { type: "dialogue"; speaker: "MS" | "ET"; text: string; portrait?: March30DialoguePortrait }
  | { type: "prop"; id: March30PropId; owner: "ms" | "et"; visible: boolean }
  | { type: "water-vfx"; beat: 1 | 2 | 3; frame: number; duration: number }
  | { type: "jacket-wipe" }
  | { type: "fade"; actors: Array<"ms" | "et">; duration: number }
  | { type: "reflection-choice" };

export const march30Assets: Record<March30AssetId, March30Asset> & Record<"gift" | "waterGun" | "ordinaryKeychain" | "phoneCharm", { path: string; source: FrameRect["source"] }> = {
  msBase: {
    path: "assets/330/ms-base.png",
    grid: "4x4",
    visibleBounds: [
      { x: 58, y: 34, w: 160, h: 350 }, { x: 47, y: 34, w: 161, h: 350 }, { x: 48, y: 37, w: 163, h: 347 }, { x: 46, y: 35, w: 161, h: 349 },
      { x: 62, y: 0, w: 145, h: 375 }, { x: 44, y: 0, w: 154, h: 373 }, { x: 32, y: 0, w: 162, h: 373 }, { x: 25, y: 0, w: 171, h: 376 },
      { x: 57, y: 1, w: 148, h: 383 }, { x: 47, y: 2, w: 165, h: 382 }, { x: 48, y: 3, w: 172, h: 381 }, { x: 43, y: 4, w: 177, h: 380 },
      { x: 51, y: 0, w: 159, h: 336 }, { x: 44, y: 0, w: 157, h: 349 }, { x: 48, y: 0, w: 161, h: 350 }, { x: 45, y: 0, w: 161, h: 349 }
    ],
    frames: fourByFourFrames(256, 384, [
      [51, 32, 256, 384], [0, 19, 256, 384], [9, 33, 238, 384], [7, 33, 212, 384],
      [49, 0, 256, 384], [1, 0, 256, 384], [1, 0, 246, 384], [7, 0, 208, 384],
      [49, 0, 256, 384], [1, 0, 256, 384], [1, 0, 256, 384], [1, 0, 226, 384],
      [0, 0, 256, 338], [1, 0, 256, 355], [0, 0, 256, 355], [0, 0, 210, 353]
    ])
  },
  etBase: {
    path: "assets/330/yet-base.png",
    grid: "4x4",
    visibleBounds: [
      { x: 109, y: 17, w: 150, h: 273 }, { x: 88, y: 17, w: 151, h: 273 }, { x: 57, y: 17, w: 159, h: 273 }, { x: 45, y: 17, w: 155, h: 273 },
      { x: 108, y: 1, w: 145, h: 312 }, { x: 88, y: 1, w: 152, h: 312 }, { x: 61, y: 1, w: 151, h: 312 }, { x: 44, y: 1, w: 159, h: 312 },
      { x: 102, y: 0, w: 146, h: 313 }, { x: 83, y: 0, w: 150, h: 313 }, { x: 56, y: 0, w: 156, h: 313 }, { x: 43, y: 0, w: 171, h: 313 },
      { x: 102, y: 0, w: 141, h: 262 }, { x: 83, y: 0, w: 149, h: 264 }, { x: 55, y: 0, w: 161, h: 268 }, { x: 46, y: 0, w: 155, h: 268 }
    ],
    frames: irregularFrames(
      [313, 314, 313, 314],
      [313, 314, 313, 314],
      [
        [23, 15, 308, 313], [3, 15, 314, 313], [1, 15, 308, 313], [1, 15, 276, 313],
        [0, 0, 313, 314], [0, 0, 314, 314], [1, 0, 289, 314], [5, 0, 294, 314],
        [17, 0, 306, 313], [1, 0, 314, 313], [7, 0, 313, 313], [0, 0, 272, 313],
        [0, 0, 300, 288], [1, 0, 308, 314], [1, 0, 313, 314], [0, 0, 306, 314]
      ]
    )
  },
  approach: { ...sheetAsset("assets/330/330-approach.png", "4x2", 384, 512, 4, 2, [
    [71, 13, 302, 512], [87, 13, 316, 512], [25, 17, 366, 512], [25, 13, 334, 512], [101, 0, 297, 496], [31, 0, 382, 512], [97, 0, 370, 472], [80, 0, 330, 473]
  ]), visibleBounds: [
    { x: 85, y: 15, w: 209, h: 497 }, { x: 90, y: 15, w: 214, h: 497 }, { x: 95, y: 19, w: 207, h: 493 }, { x: 87, y: 15, w: 203, h: 497 },
    { x: 106, y: 0, w: 185, h: 453 }, { x: 89, y: 0, w: 201, h: 449 }, { x: 100, y: 0, w: 205, h: 467 }, { x: 87, y: 0, w: 215, h: 467 }
  ] },
  waterSpraying: {
    ...sheetAsset("assets/330/330-water-spraying.png", "4x2", 384, 512, 4, 2, [
      [0, 4, 384, 512], [1, 18, 382, 512], [13, 14, 384, 512], [1, 16, 374, 512], [0, 0, 384, 498], [1, 0, 384, 512], [0, 0, 384, 512], [1, 0, 368, 498]
    ]),
    visibleBounds: [
      { x: 72, y: 16, w: 252, h: 487 }, { x: 46, y: 20, w: 224, h: 483 }, { x: 29, y: 15, w: 293, h: 488 }, { x: 26, y: 19, w: 295, h: 484 },
      { x: 72, y: 8, w: 223, h: 487 }, { x: 51, y: 10, w: 295, h: 484 }, { x: 30, y: 11, w: 298, h: 484 }, { x: 42, y: 0, w: 238, h: 496 }
    ],
    nozzleOriginByFrame: { 0: { x: 0.75, y: 0.43 }, 2: { x: 0.78, y: 0.4 }, 3: { x: 0.78, y: 0.4 }, 4: { x: 0.75, y: 0.43 }, 6: { x: 0.76, y: 0.42 } },
    mirrorForLeft: true
  },
  waterSprayed: { ...sheetAsset("assets/330/330-water-sprayed.png", "4x2", 384, 512, 4, 2, [
    [81, 17, 354, 500], [55, 21, 382, 500], [7, 16, 368, 500], [1, 21, 346, 506], [69, 9, 381, 512], [25, 1, 384, 492], [0, 10, 376, 494], [11, 1, 336, 493]
  ]), visibleBounds: [
    { x: 89, y: 19, w: 196, h: 474 }, { x: 71, y: 23, w: 226, h: 469 }, { x: 88, y: 18, w: 197, h: 473 }, { x: 64, y: 23, w: 225, h: 467 },
    { x: 87, y: 12, w: 198, h: 473 }, { x: 68, y: 19, w: 244, h: 466 }, { x: 87, y: 13, w: 200, h: 472 }, { x: 83, y: 19, w: 201, h: 466 }
  ] },
  keychains: { ...irregularSheetAsset("assets/330/330-keychains.png", "4x2", [313, 314, 313, 314], [627, 627], [
    [44, 35, 312, 594], [0, 32, 313, 591], [0, 33, 312, 595], [0, 33, 313, 593],
    [36, 14, 312, 578], [0, 14, 313, 578], [0, 16, 312, 578], [0, 12, 313, 578]
  ]), visibleBounds: [
    { x: 44, y: 35, w: 220, h: 560 }, { x: 38, y: 32, w: 241, h: 560 }, { x: 32, y: 36, w: 224, h: 560 }, { x: 31, y: 36, w: 258, h: 558 },
    { x: 36, y: 14, w: 274, h: 565 }, { x: 36, y: 14, w: 267, h: 565 }, { x: 36, y: 16, w: 245, h: 563 }, { x: 26, y: 12, w: 228, h: 567 }
  ] },
  jacketAction: { ...sheetAsset("assets/330/330-jacket-action.png", "4x2", 384, 512, 4, 2, [
    [49, 22, 382, 512], [7, 17, 356, 512], [15, 19, 378, 512], [33, 16, 342, 512], [0, 0, 354, 496], [7, 0, 384, 512], [1, 0, 384, 512], [7, 0, 328, 498]
  ]), visibleBounds: [
    { x: 74, y: 24, w: 224, h: 476 }, { x: 51, y: 23, w: 254, h: 477 }, { x: 26, y: 24, w: 254, h: 477 }, { x: 38, y: 18, w: 264, h: 483 },
    { x: 29, y: 8, w: 322, h: 484 }, { x: 45, y: 18, w: 280, h: 456 }, { x: 45, y: 8, w: 287, h: 481 }, { x: 62, y: 8, w: 247, h: 486 }
  ] },
  jacketReaction: { ...sheetAsset("assets/330/330-jacket-reaction.png", "3x2", 418, 627, 3, 2, [
    [0, 0, 418, 627], [9, 7, 418, 627], [0, 0, 364, 627], [0, 0, 418, 627], [3, 0, 418, 627], [1, 0, 396, 609]
  ]), visibleBounds: [
    { x: 73, y: 9, w: 320, h: 601 }, { x: 75, y: 9, w: 288, h: 601 }, { x: 67, y: 9, w: 246, h: 601 },
    { x: 81, y: 0, w: 248, h: 598 }, { x: 80, y: 0, w: 256, h: 602 }, { x: 67, y: 1, w: 247, h: 601 }
  ] },
  waterVfx: {
    path: "assets/330/water-vfx.png",
    grid: "6x1",
    frames: sixByOneFrames(362, 724, [
      [60, 352, 361, 399], [0, 324, 361, 407], [0, 323, 361, 407], [0, 277, 361, 434], [0, 278, 361, 434], [0, 278, 361, 434]
    ]),
    visibleBounds: [
      { x: 60, y: 352, w: 302, h: 48 }, { x: 0, y: 324, w: 362, h: 84 }, { x: 0, y: 323, w: 362, h: 85 },
      { x: 0, y: 277, w: 362, h: 158 }, { x: 0, y: 278, w: 362, h: 157 }, { x: 0, y: 278, w: 362, h: 157 }
    ],
    nozzleOrigin: { x: 0, y: 0.5 },
    travelBaseline: { y: 0.5 }
  },
  dissolve: sheetAsset("assets/330/vfx.png", "4x2", 384, 512, 4, 2),
  gift: { path: "assets/330/prop-gift-hachiware-fish-charm.png", source: { x: 503, y: 37, w: 546, h: 882 } },
  waterGun: { path: "assets/330/water-gun.png", source: { x: 294, y: 41, w: 640, h: 1054 } },
  ordinaryKeychain: { path: "assets/330/prop-xiaoba-candied-haw-keychain.png", source: { x: 493, y: 54, w: 240, h: 1081 } },
  phoneCharm: { path: "assets/330/prop-xiaoba-candied-haw-phone-charm.png", source: { x: 380, y: 43, w: 261, h: 1392 } }
};

export const march30MainMemoryActions: March30Action[] = [
  { type: "wait", duration: 0.45 },
  { type: "spawn", actor: "et", anchor: "et-bench-seat", asset: "etBase", frame: 4, facing: "left" },
  { type: "spawn", actor: "ms", anchor: "ms-approach-start", asset: "approach", frame: 0, facing: "right" },
  { type: "wait", duration: 0.55 },
  { type: "move", actor: "ms", anchor: "ms-approach-turn", duration: 0.85, asset: "approach", frame: 1, facing: "right" },
  { type: "wait", duration: 0.4 },
  { type: "sprite", actor: "ms", asset: "approach", frame: 2 },
  { type: "face", actor: "ms", facing: "left" },
  { type: "wait", duration: 0.55 },
  { type: "face", actor: "ms", facing: "right" },
  { type: "move", actor: "ms", anchor: "ms-talk-position", duration: 1.15, asset: "approach", frame: 7, facing: "right" },
  { type: "move", actor: "et", anchor: "et-talk-position", duration: 0.35, asset: "etBase", frame: 5, facing: "left" },
  { type: "sprite", actor: "ms", asset: "msBase", frame: 8 },
  { type: "sprite", actor: "et", asset: "etBase", frame: 5 },
  { type: "dialogue", speaker: "MS", text: "halo~早上好叶同学" },
  { type: "wait", duration: 0.5 },
  { type: "prop", id: "gift", owner: "et", visible: true },
  { type: "wait", duration: 0.42 },
  { type: "prop", id: "gift", owner: "ms", visible: true },
  { type: "wait", duration: 0.35 },
  { type: "prop", id: "gift", owner: "et", visible: false },
  { type: "prop", id: "gift", owner: "ms", visible: false },
  { type: "prop", id: "waterGun", owner: "ms", visible: true },
  { type: "dialogue", speaker: "ET", text: "这是什么", portrait: "gift" },
  { type: "dialogue", speaker: "MS", text: "水枪", portrait: "waterGun" },
  { type: "dialogue", speaker: "ET", text: "里面有水啊？可以喷水的吗 怎样哦？" },
  { type: "dialogue", speaker: "MS", text: "有 你拿来我教你" },
  { type: "prop", id: "waterGun", owner: "ms", visible: false },
  { type: "sprite", actor: "et", asset: "waterSpraying", frame: 0 },
  { type: "wait", duration: 0.35 },
  { type: "sprite", actor: "et", asset: "waterSpraying", frame: 2 },
  { type: "wait", duration: 0.45 },
  { type: "sprite", actor: "ms", asset: "waterSprayed", frame: 0 },
  { type: "water-vfx", beat: 1, frame: 3, duration: 0.22 },
  { type: "wait", duration: 0.28 },
  { type: "sprite", actor: "ms", asset: "waterSprayed", frame: 3 },
  { type: "water-vfx", beat: 2, frame: 3, duration: 0.22 },
  { type: "wait", duration: 0.28 },
  { type: "sprite", actor: "ms", asset: "waterSprayed", frame: 5 },
  { type: "water-vfx", beat: 3, frame: 3, duration: 0.22 },
  { type: "wait", duration: 0.65 },
  { type: "dialogue", speaker: "ET", text: "哇塞真的可以喷水ei", portrait: "waterGun" },
  { type: "sprite", actor: "ms", asset: "waterSprayed", frame: 7 },
  { type: "wait", duration: 0.65 },
  { type: "sprite", actor: "et", asset: "etBase", frame: 5 },
  { type: "sprite", actor: "ms", asset: "msBase", frame: 8 },
  { type: "sprite", actor: "ms", asset: "keychains", frame: 2 },
  { type: "dialogue", speaker: "MS", text: "。。。！！！" },
  { type: "dialogue", speaker: "MS", text: "两个同款图案的挂饰里面你选一个", portrait: "keychains" },
  { type: "dialogue", speaker: "ET", text: "哇老你zomok 不是我送你礼物吗 怎么变成你送我了" },
  { type: "dialogue", speaker: "MS", text: "哎呀你不懂 我是行走的小八仓库 库存多的很~" },
  { type: "dialogue", speaker: "ET", text: "哇我还有得选啊 有什么差别" },
  { type: "dialogue", speaker: "MS", text: "一个是普通钥匙圈 另外一个是手机挂饰那种" },
  { type: "sprite", actor: "ms", asset: "msBase", frame: 8 },
  { type: "prop", id: "ordinaryKeychain", owner: "et", visible: true },
  { type: "prop", id: "phoneCharm", owner: "ms", visible: true },
  { type: "prop", id: "ordinaryKeychain", owner: "et", visible: false },
  { type: "dialogue", speaker: "MS", text: "walao你刚刚拿水枪喷我 还不止一下,你惨了，我记住了", portrait: "waterGun" },
  { type: "wait", duration: 0.55 },
  { type: "move", actor: "et", anchor: "et-jacket-wipe-start", duration: 0.55, asset: "etBase", frame: 5, facing: "left" },
  { type: "wait", duration: 0.45 },
  { type: "move", actor: "et", anchor: "ms-jacket-wipe-target", duration: 0.65, asset: "etBase", frame: 5, facing: "left", offset: { x: 58, y: 0 } },
  { type: "sprite", actor: "et", asset: "jacketAction", frame: 4 },
  { type: "sprite", actor: "ms", asset: "jacketReaction", frame: 4 },
  { type: "jacket-wipe" },
  { type: "wait", duration: 0.85 },
  { type: "dialogue", speaker: "ET", text: "惨了这个家伙要打我了" },
  { type: "dialogue", speaker: "MS", text: "不会啦 你那么可怜 上到6pm才放学 我1pm就放学了嘻嘻" },
  { type: "dialogue", speaker: "ET", text: "我去！挑衅我" },
  { type: "dialogue", speaker: "MS", text: "拜拜~" },
  { type: "dialogue", speaker: "ET", text: "拜拜" },
  { type: "wait", duration: 0.75 },
  { type: "fade", actors: ["ms", "et"], duration: 0.8 },
  { type: "reflection-choice" }
];

export const march30ReflectionChoices: Choice[] = [
  { id: "march30-direct-approach", label: "她就这么自然地拿着她的外套走过来了。", effects: { closeness: 1, honesty: 1 }, response: "嗯。我记得的是这个距离。" },
  { id: "march30-three-sprays", label: "她刚刚明明是那个拿水枪喷人的。", effects: { acceptance: 1 }, response: "三下。不是一下。记住了。" },
  { id: "march30-leave-action-open", label: "先不要替这个动作解释。", effects: { distance: 1, honesty: 1 }, response: "动作是真的。意思先留空。" }
];

export const march30EchoActions: March30Action[] = [
  { type: "wait", duration: 0.55 },
  { type: "spawn", actor: "et", anchor: "elevator-reencounter", asset: "etBase", frame: 4, facing: "left", offset: { x: 26, y: 0 } },
  { type: "spawn", actor: "ms", anchor: "elevator-reencounter", asset: "msBase", frame: 8, facing: "right", offset: { x: -26, y: 0 } },
  { type: "wait", duration: 0.7 },
  { type: "dialogue", speaker: "MS", text: "额嘿嘿好巧哈哈 又见面了 太有缘了" },
  { type: "dialogue", speaker: "ET", text: "是咯~你怎么在这里" },
  { type: "dialogue", speaker: "MS", text: "我要去五楼买吃的" },
  { type: "dialogue", speaker: "ET", text: "你等下上课在哪个mpk" },
  { type: "dialogue", speaker: "MS", text: "我在隔壁blok上课" },
  { type: "dialogue", speaker: "ET", text: "但是隔壁blok上完了下一堂课又换来这里上啦" },
  { type: "dialogue", speaker: "MS", text: "sda有用到电脑吗" },
  { type: "dialogue", speaker: "ET", text: "有啊" },
  { type: "dialogue", speaker: "MS", text: "噢那还好我有带到" },
  { type: "dialogue", speaker: "ET", text: "看slide要用到罢了哈哈" },
  { type: "dialogue", speaker: "MS", text: "什么屁 看slide我带tab不就好了呜呜" },
  { type: "move", actor: "ms", anchor: "walk-together", duration: 0.9, asset: "msBase", frame: 9, facing: "right", offset: { x: -26, y: 0 } },
  { type: "move", actor: "et", anchor: "walk-together", duration: 0.9, asset: "etBase", frame: 6, facing: "right", offset: { x: 26, y: 0 } },
  { type: "dialogue", speaker: "MS", text: "哎哟我们还是那么顺路 太有缘分了" },
  { type: "sprite", actor: "ms", asset: "msBase", frame: 9 },
  { type: "sprite", actor: "et", asset: "etBase", frame: 6 },
  { type: "dialogue", speaker: "ET", text: "昨晚真的没睡觉吗" },
  { type: "dialogue", speaker: "MS", text: "真的啊" },
  { type: "dialogue", speaker: "ET", text: "为什么不睡" },
  { type: "dialogue", speaker: "MS", text: "失眠啊" },
  { type: "dialogue", speaker: "ET", text: "是不是又半夜抢asnb" },
  { type: "dialogue", speaker: "MS", text: "walao没钱抢asnb 更失眠了呜呜" },
  { type: "wait", duration: 1.1 },
  { type: "dialogue", speaker: "MS", text: "你在哪里上课哦 我们竟然真的那么顺路的吗 这都还没到你教室" },
  { type: "fade", actors: ["ms", "et"], duration: 0.75 }
];

export const march30EchoReflectionChoices: Choice[] = [
  { id: "march30-encounters", label: "今天到底要遇到几次。", effects: { acceptance: 1 }, response: "两次。已经够巧了。" },
  { id: "march30-avoidance", label: "明明刚刚才特地避开她。", effects: { honesty: 1, avoidance: 1 }, response: "所以才会记得。" },
  { id: "march30-companions", label: "这种巧合我当然会记得。", effects: { closeness: 1, companionship: 1 }, response: "嗯，走了那么久。" }
];

export const march30ClosingLines = {
  acceptance: "那天没有答案。只有三下水，还有一件拿来擦脸的 jacket。",
  closeness: "我记得她从长椅那边走过来的距离。",
  honesty: "我还是会想那个动作是什么意思。只是这一次，不替她回答。",
  companionship: "我们只是见面、拜拜，然后又在下一趟电梯见面。",
  distance: "东西留下来了。那个早上也已经走完了。",
  canonical: "那天早上，她们在二楼道别。后来下一趟电梯打开，又遇见了。"
} as const;

export function resolveMarch30Anchor(layout: SceneLayout, key: March30AnchorKey): Point | null {
  if (key === "elevator-reencounter") return layout.echoAnchors["elevator-reencounter"] ?? null;
  if (key === "walk-together") return layout.echoAnchors["walk-together"] ?? layout.echoAnchors["walking-together"] ?? null;
  return layout.anchors[key] ?? null;
}

export function resolveMarch30CutsceneActions(layout: SceneLayout, actions: March30Action[]): CutsceneAction[] {
  return actions.flatMap((action): CutsceneAction[] => {
    if (action.type === "wait" || action.type === "dialogue" || action.type === "face" || action.type === "prop" || action.type === "fade") {
      if (action.type === "face") return [{ type: "face", actor: action.actor, direction: action.facing }];
      if (action.type === "prop") {
        const asset = march30Assets[action.id];
        return [{ type: "prop", id: action.id, assetId: asset.path, owner: action.owner, visible: action.visible }];
      }
      return [action.type === "dialogue" ? action : action.type === "fade" ? action : { type: "wait", duration: action.duration }];
    }
    if (action.type === "spawn") {
      const point = resolveMarch30Anchor(layout, action.anchor);
      if (!point) throw new Error(`March 30 anchor not found: ${action.anchor}`);
      return [{ type: "spawn", actor: action.actor, kind: "human", x: point.x + (action.offset?.x ?? 0), y: point.y + (action.offset?.y ?? 0), facing: action.facing, sprite: { assetId: action.asset, frame: action.frame } }];
    }
    if (action.type === "move") {
      const point = resolveMarch30Anchor(layout, action.anchor);
      if (!point) throw new Error(`March 30 anchor not found: ${action.anchor}`);
      return [{ type: "move", actor: action.actor, x: point.x + (action.offset?.x ?? 0), y: point.y + (action.offset?.y ?? 0), duration: action.duration, sprite: action.asset ? { assetId: action.asset, frame: action.frame ?? 0 } : undefined }];
    }
    if (action.type === "sprite") return [{ type: "sprite", actor: action.actor, sprite: { assetId: action.asset, frame: action.frame } }];
    if (action.type === "water-vfx") return [{ type: "effect", id: `march30-spray-${action.beat}`, kind: "water-vfx", actor: "et", target: "ms", frame: action.frame, duration: action.duration }];
    return [];
  });
}

export function resolveMarch30Closing(tendencies: Tendencies): string {
  const scores = Object.entries(march30ClosingLines)
    .filter(([key]) => key !== "canonical")
    .map(([key, line]) => ({ key, line, score: tendencies[key as keyof Tendencies] ?? 0 }));
  scores.sort((a, b) => b.score - a.score || ["acceptance", "closeness", "honesty", "companionship", "distance"].indexOf(a.key) - ["acceptance", "closeness", "honesty", "companionship", "distance"].indexOf(b.key));
  return `${scores[0]?.line ?? march30ClosingLines.acceptance}\n${march30ClosingLines.canonical}`;
}

function fourByFourFrames(width: number, height: number, bounds: number[][]): Record<number, FrameRect> {
  return Object.fromEntries(bounds.map((bound, index) => {
    const col = index % 4;
    const row = Math.floor(index / 4);
    return [index, { source: { x: col * width, y: row * height, w: width, h: height }, feet: { x: (bound[0] + bound[2]) / 2, y: bound[3] } }];
  }));
}

function irregularFrames(widths: number[], heights: number[], bounds: number[][]): Record<number, FrameRect> {
  const xOffsets = widths.map((_, index) => widths.slice(0, index).reduce((sum, value) => sum + value, 0));
  const yOffsets = heights.map((_, index) => heights.slice(0, index).reduce((sum, value) => sum + value, 0));
  return Object.fromEntries(bounds.map((bound, index) => {
    const col = index % widths.length;
    const row = Math.floor(index / widths.length);
    return [index, { source: { x: xOffsets[col], y: yOffsets[row], w: widths[col], h: heights[row] }, feet: { x: (bound[0] + bound[2]) / 2, y: bound[3] } }];
  }));
}

function sixByOneFrames(width: number, height: number, bounds: number[][]): Record<number, FrameRect> {
  return Object.fromEntries(bounds.map((bound, index) => [index, { source: { x: index * width, y: 0, w: width, h: height }, feet: { x: width / 2, y: height } }]));
}

function sheetAsset(path: string, grid: string, width: number, height: number, columns: number, rows: number, bounds?: number[][]): March30Asset {
  return {
    path,
    grid,
    frames: Object.fromEntries(Array.from({ length: columns * rows }, (_, index) => {
      const col = index % columns;
      const row = Math.floor(index / columns);
      const bound = bounds?.[index] ?? [0, 0, width, height];
      return [index, { source: { x: col * width, y: row * height, w: width, h: height }, feet: { x: (bound[0] + bound[2]) / 2, y: bound[3] } }];
    }))
  };
}

function irregularSheetAsset(path: string, grid: string, widths: number[], heights: number[], bounds: number[][]): March30Asset {
  return { path, grid, frames: irregularFrames(widths, heights, bounds) };
}
