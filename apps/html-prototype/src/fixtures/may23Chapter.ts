import type { Choice, ChapterDefinition } from "../types.js";
import type { Point } from "../systems/CollisionSystem.js";
import type { CutsceneAction, CutsceneDialogue } from "../systems/CutsceneSystem.js";
import type { ActorFacing, SceneSpriteAsset } from "../systems/SceneActorRenderer.js";
import type { SceneLayout } from "../systems/SceneLayouts.js";
import type { DialoguePortrait } from "../systems/PresentationRenderer.js";

export type May23Direction = "down" | "left" | "right" | "up";
export type May23FrameName = "idle" | "walkA" | "passing" | "walkB";
export type May23ActorId = "ms" | "et" | "tung-ern";
export type May23FrameRegistry = Record<May23Direction, Record<May23FrameName, string>>;

const frameNames: Record<May23FrameName, string> = {
  idle: "01-idle.png",
  walkA: "02-walk-step-a.png",
  passing: "03-passing-step.png",
  walkB: "04-walk-step-b.png"
};

const actorFolders: Record<May23ActorId, string> = {
  ms: "ms-base",
  et: "et-base",
  "tung-ern": "te-base"
};

const frameSize: Record<May23ActorId, Record<May23Direction, { w: number; h: number }>> = {
  ms: {
    down: { w: 306, h: 320 }, left: { w: 306, h: 299 }, right: { w: 306, h: 288 }, up: { w: 306, h: 322 }
  },
  et: {
    down: { w: 314, h: 314 }, left: { w: 314, h: 296 }, right: { w: 314, h: 278 }, up: { w: 314, h: 314 }
  },
  "tung-ern": {
    down: { w: 181, h: 304 }, left: { w: 181, h: 271 }, right: { w: 181, h: 247 }, up: { w: 211, h: 259 }
  }
};

function framePath(actor: May23ActorId, direction: May23Direction, frame: May23FrameName): string {
  return `assets/523/base/${actorFolders[actor]}/${direction}/${frameNames[frame]}`;
}

export function createMay23FrameRegistry(actor: May23ActorId): May23FrameRegistry {
  return {
    down: { idle: framePath(actor, "down", "idle"), walkA: framePath(actor, "down", "walkA"), passing: framePath(actor, "down", "passing"), walkB: framePath(actor, "down", "walkB") },
    left: { idle: framePath(actor, "left", "idle"), walkA: framePath(actor, "left", "walkA"), passing: framePath(actor, "left", "passing"), walkB: framePath(actor, "left", "walkB") },
    right: { idle: framePath(actor, "right", "idle"), walkA: framePath(actor, "right", "walkA"), passing: framePath(actor, "right", "passing"), walkB: framePath(actor, "right", "walkB") },
    up: { idle: framePath(actor, "up", "idle"), walkA: framePath(actor, "up", "walkA"), passing: framePath(actor, "up", "passing"), walkB: framePath(actor, "up", "walkB") }
  };
}

export const may23FrameRegistries: Record<May23ActorId, May23FrameRegistry> = {
  ms: createMay23FrameRegistry("ms"),
  et: createMay23FrameRegistry("et"),
  "tung-ern": createMay23FrameRegistry("tung-ern")
};

const visibleBoundsByPath: Record<string, { x: number; y: number; w: number; h: number }> = {
  [framePath("ms", "down", "idle")]: { x: 0, y: 11, w: 305, h: 309 },
  [framePath("ms", "down", "walkA")]: { x: 0, y: 11, w: 306, h: 309 },
  [framePath("ms", "down", "passing")]: { x: 0, y: 13, w: 306, h: 307 },
  [framePath("ms", "down", "walkB")]: { x: 1, y: 14, w: 274, h: 306 },
  [framePath("ms", "left", "idle")]: { x: 47, y: 0, w: 232, h: 299 },
  [framePath("ms", "left", "walkA")]: { x: 0, y: 0, w: 306, h: 307 },
  [framePath("ms", "left", "passing")]: { x: 0, y: 0, w: 304, h: 305 },
  [framePath("ms", "left", "walkB")]: { x: 19, y: 0, w: 248, h: 307 },
  [framePath("ms", "right", "idle")]: { x: 23, y: 0, w: 282, h: 288 },
  [framePath("ms", "right", "walkA")]: { x: 0, y: 0, w: 304, h: 288 },
  [framePath("ms", "right", "passing")]: { x: 0, y: 0, w: 288, h: 292 },
  [framePath("ms", "right", "walkB")]: { x: 1, y: 0, w: 284, h: 295 },
  [framePath("ms", "up", "idle")]: { x: 0, y: 0, w: 301, h: 277 },
  [framePath("ms", "up", "walkA")]: { x: 0, y: 0, w: 306, h: 296 },
  [framePath("ms", "up", "passing")]: { x: 0, y: 0, w: 306, h: 322 },
  [framePath("ms", "up", "walkB")]: { x: 1, y: 0, w: 294, h: 322 },
  [framePath("et", "down", "idle")]: { x: 23, y: 15, w: 285, h: 299 },
  [framePath("et", "down", "walkA")]: { x: 2, y: 15, w: 311, h: 299 },
  [framePath("et", "down", "passing")]: { x: 1, y: 15, w: 307, h: 299 },
  [framePath("et", "down", "walkB")]: { x: 1, y: 15, w: 275, h: 299 },
  [framePath("et", "left", "idle")]: { x: 0, y: 0, w: 314, h: 295 },
  [framePath("et", "left", "walkA")]: { x: 0, y: 0, w: 313, h: 280 },
  [framePath("et", "left", "passing")]: { x: 1, y: 0, w: 288, h: 284 },
  [framePath("et", "left", "walkB")]: { x: 5, y: 0, w: 289, h: 286 },
  [framePath("et", "right", "idle")]: { x: 17, y: 0, w: 274, h: 278 },
  [framePath("et", "right", "walkA")]: { x: 8, y: 0, w: 305, h: 277 },
  [framePath("et", "right", "passing")]: { x: 7, y: 0, w: 306, h: 275 },
  [framePath("et", "right", "walkB")]: { x: 0, y: 0, w: 272, h: 284 },
  [framePath("et", "up", "idle")]: { x: 0, y: 0, w: 300, h: 288 },
  [framePath("et", "up", "walkA")]: { x: 0, y: 0, w: 307, h: 314 },
  [framePath("et", "up", "passing")]: { x: 1, y: 0, w: 312, h: 314 },
  [framePath("et", "up", "walkB")]: { x: 0, y: 0, w: 306, h: 314 },
  [framePath("tung-ern", "down", "idle")]: { x: 0, y: 0, w: 181, h: 304 },
  [framePath("tung-ern", "down", "walkA")]: { x: 0, y: 0, w: 181, h: 304 },
  [framePath("tung-ern", "down", "passing")]: { x: 0, y: 0, w: 182, h: 304 },
  [framePath("tung-ern", "down", "walkB")]: { x: 0, y: 1, w: 181, h: 303 },
  [framePath("tung-ern", "left", "idle")]: { x: 0, y: 0, w: 181, h: 271 },
  [framePath("tung-ern", "left", "walkA")]: { x: 0, y: 0, w: 181, h: 271 },
  [framePath("tung-ern", "left", "passing")]: { x: 0, y: 0, w: 182, h: 273 },
  [framePath("tung-ern", "left", "walkB")]: { x: 0, y: 0, w: 166, h: 271 },
  [framePath("tung-ern", "right", "idle")]: { x: 0, y: 0, w: 181, h: 247 },
  [framePath("tung-ern", "right", "walkA")]: { x: 0, y: 0, w: 181, h: 249 },
  [framePath("tung-ern", "right", "passing")]: { x: 1, y: 0, w: 181, h: 250 },
  [framePath("tung-ern", "right", "walkB")]: { x: 1, y: 0, w: 180, h: 250 },
  [framePath("tung-ern", "up", "idle")]: { x: 0, y: 0, w: 211, h: 259 },
  [framePath("tung-ern", "up", "walkA")]: { x: 0, y: 0, w: 157, h: 261 },
  [framePath("tung-ern", "up", "passing")]: { x: 0, y: 0, w: 171, h: 255 },
  [framePath("tung-ern", "up", "walkB")]: { x: 0, y: 0, w: 147, h: 260 }
};
function makeFrameAsset(path: string, size: { w: number; h: number }): SceneSpriteAsset {
  return {
    path,
    source: { x: 0, y: 0, w: size.w, h: size.h },
    visibleBounds: visibleBoundsByPath[path] ?? { x: 0, y: 0, w: size.w, h: size.h },
    feet: { x: 0.5, y: 1 },
    baseHeight: size.h
  };
}

export const may23Assets: Record<string, SceneSpriteAsset> = Object.fromEntries(
  (Object.entries(may23FrameRegistries) as Array<[May23ActorId, May23FrameRegistry]>).flatMap(([actor, registry]) =>
    (Object.entries(registry) as Array<[May23Direction, Record<May23FrameName, string>]>).flatMap(([direction, frames]) =>
      (Object.entries(frames) as Array<[May23FrameName, string]>).map(([frame, path]) => [
        path,
        makeFrameAsset(path, frameSize[actor][direction])
      ])
    )
  )
);

export const may23Chapter: ChapterDefinition = {
  id: "may23-i-arrived",
  diaryEntryId: "authored-diary-may23-i-arrived",
  runtimeScene: "523",
  date: "2026-05-23",
  title: "05.23 · 我到了，你呢",
  mood: "rain, silence, and a walk that turned back",
  weather: "Rain",
  location: "KTHO",
  characters: ["Muji", "MS", "ET", "Tung Ern"],
  objects: ["hostel lobby", "toilet-side doorway", "bus stop", "phone", "rain"],
  evidence: ["authored-523-portrait-scene-layout", "authored-523-landscape-scene-layout", "may23-individual-character-frames"],
  dialogue: [],
  canonicalClosure: {
    historicalEventId: "may23-hostel-memory",
    lines: ["那晚最后没有散到步。", "MS 一个人走了回去。"]
  },
  reflectionQuotes: [
    { id: "may23-accepting", tone: "accepting", preference: { honesty: 1, acceptance: 1 }, lines: ["19:29，她问：你在哪里。", "那时候，我已经走了一半。"], afterline: "那天我是真的到了。" },
    { id: "may23-holding", tone: "holding", preference: { closeness: 1, companionship: 1 }, lines: ["我在巴士站看她们上楼。", "手机还是没有亮。"], afterline: "我那时还想再等一下。" },
    { id: "may23-not-ready", tone: "not-ready", preference: { distance: 1, acceptance: 1 }, lines: ["我还是回了头。", "走了几步，下一句是：算了啦。"], afterline: "有些路，当时就是没有办法一次走完。" },
    { id: "may23-rewriting", tone: "rewriting", preference: { honesty: 1, closeness: 1 }, lines: ["后来我不再替那半个小时补剧情。", "我只记得，我到了。"], afterline: "其他没有发生的，就让它没有发生。" }
  ]
};

const choice = (id: string, label: string, effects: Choice["effects"], response: string): Choice => ({ id, label, effects, response });

export const may23ReflectionChoices: Array<{ id: string; prompt: string; choices: Choice[] }> = [
  {
    id: "may23-reflection-1",
    prompt: "那时候，你最想替这段沉默解释什么？",
    choices: [
      choice("may23-silence-unseen", "也许她真的没看到。", { avoidance: 1, concealment: 1 }, "也许。\n日记里没有留下答案。"),
      choice("may23-silence-arrived", "我不知道她有没有看到。\n我只知道我已经到了。", { honesty: 1, acceptance: 1 }, "对。\n那一部分不需要猜。"),
      choice("may23-silence-waited", "我那时还是想等她回我。", { closeness: 1, companionship: 1 }, "所以你又走了一圈。")
    ]
  },
  {
    id: "may23-reflection-2",
    prompt: "看见她们回来以后，你当时还在等什么？",
    choices: [
      choice("may23-return-question", "等她终于问我在哪里。", { closeness: 1, companionship: 1 }, "后来她真的问了。\n已经是 19:29。"),
      choice("may23-return-reason", "等一个能让我继续解释下去的理由。", { avoidance: 1, concealment: 1 }, "那天你替很多空白留了位置。"),
      choice("may23-return-nothing", "其实已经没有什么好等的了。", { distance: 1, acceptance: 1 }, "但那时你还没有走完。")
    ]
  },
  {
    id: "may23-reflection-3",
    prompt: "现在回头看，最难放下的是哪一步？",
    choices: [
      choice("may23-step-back", "她问我在哪里以后，\n我真的回头了。", { honesty: 1, closeness: 1 }, "你已经走了一半。\n还是回了头。"),
      choice("may23-serious", "我一直以为，只要我认真一点，\n事情就会发生。", { honesty: 1, acceptance: 1 }, "那天你确实很认真。\n事情还是照自己的方向发生了。"),
      choice("may23-two-person-road", "我不想再一个人走完两个人的路。", { distance: 1, acceptance: 1 }, "那条路后来还是你自己走回去了。")
    ]
  }
];

export const may23EchoAnchors: Record<string, string> = {
  "judge-stars": "judge-star-paper",
  "tart-after-rain": "tart-white-bag",
  "laundry-weight": "laundry-weight"
};

export const may23EchoDialogues: Record<
  string,
  Array<{
    speaker: string;
    text: string;
    portrait?: DialoguePortrait;
  }>
> = {
  "bus-stop-memory": [
    {
      speaker: "MS",
      text: "明天你要去flying fox吗",
      portrait: "assets/523/memory-portrait/bus-stop-memory.png"
    },
    {
      speaker: "ET",
      text: "我明天回家啦 又放你飞机了哈哈哈",
      portrait: "assets/523/memory-portrait/bus-stop-memory.png"
    },
    {
      speaker: "MS",
      text: "靠背哦",
      portrait: "assets/523/memory-portrait/bus-stop-memory.png"
    },
    {
      speaker: "MS",
      text: "去完再回",
      portrait: "assets/523/memory-portrait/bus-stop-memory.png"
    },
    {
      speaker: "ET",
      text: "靠背哦",
      portrait: "assets/523/memory-portrait/bus-stop-memory.png"
    },
    {
      speaker: "ET",
      text: "早八 巴士",
      portrait: "assets/523/memory-portrait/bus-stop-memory.png"
    },
    {
      speaker: "MS",
      text: "靠北哦 sad",
      portrait: "assets/523/memory-portrait/bus-stop-memory.png"
    },
    {
      speaker: "MEMORY",
      text: "后来朋友问我：\n“你没有提早跟她讲是吗？”",
      portrait: "assets/523/memory-portrait/bus-stop-memory.png"
    },
    {
      speaker: "MEMORY",
      text: "我那时候想问，\n是我没提早讲吗。",
      portrait: "assets/523/memory-portrait/bus-stop-memory.png"
    },
    {
      speaker: "MEMORY",
      text: "我原本就是因为她会去，\n才跟朋友约了这个活动。",
      portrait: "assets/523/memory-portrait/bus-stop-memory.png"
    },
    {
      speaker: "MEMORY",
      text: "后来她不去了。\n我们也取消了。",
      portrait: "assets/523/memory-portrait/bus-stop-memory.png"
    }
  ],
  "judge-stars": [
    { speaker: "MS", text: "ziqi 说，她看见 judge 的纸。" ,portrait: "assets/523/memory-portrait/judge-stars.png"  },
    { speaker: "MS", text: "我们组一颗星。学姐那组两颗。" ,portrait: "assets/523/memory-portrait/judge-stars.png"  },
    { speaker: "MS", text: "那时候我们还以为，是第一和第二。后来学姐那组第三。我们什么也没有。" ,portrait: "assets/523/memory-portrait/judge-stars.png"   }
  ],
  "tart-after-rain": [
    { speaker: "ET", text: "下雨后送温暖。" ,portrait: "assets/523/memory-portrait/tart-after-rain.png"  },
    { speaker: "MS", text: "有心的话留三粒给我。" ,portrait: "assets/523/memory-portrait/tart-after-rain.png"  },
    { speaker: "ET", text: "对不起美雪 我不该每天挑衅你\n结果你以德报怨！！" ,portrait: "assets/523/memory-portrait/tart-after-rain.png"  }
  ],
  "laundry-weight": [
    { speaker: "MS", text: "那天后来，脚车还是坏着。" ,portrait: "assets/523/memory-portrait/laundry-weight.png"  },
    { speaker: "MS", text: "我自己扛着很重很重的衣服，走进黑暗的走廊，一路走去 dobi。" ,portrait: "assets/523/memory-portrait/laundry-weight.png"  },
    { speaker: "MS", text: "洗好了，又自己扛回来。" ,portrait: "assets/523/memory-portrait/laundry-weight.png"  }
  ]
};

export type May23Position = { anchor: string; offset?: Point };

function point(layout: SceneLayout, position: May23Position): Point {
  const base = layout.anchors[position.anchor];
  if (!base) throw new Error(`Missing May23 authored anchor: ${position.anchor}`);
  return { x: base.x + (position.offset?.x ?? 0), y: base.y + (position.offset?.y ?? 0) };
}

function sprite(actor: May23ActorId, direction: May23Direction, frame: May23FrameName): { assetId: string; frame: number } {
  return { assetId: may23FrameRegistries[actor][direction][frame], frame: 0 };
}
function spriteForPath(
  layout: SceneLayout,
  actor: May23ActorId,
  from: string,
  to: string,
  portraitDirection: May23Direction,
  frame: May23FrameName
): { assetId: string; frame: number } {
  return sprite(actor, directionBetween(layout, from, to, portraitDirection), frame);
}

function cycle(actor: May23ActorId, direction: May23Direction): Array<{ assetId: string; frame: number }> {
  const frames = may23FrameRegistries[actor][direction];
  return [frames.walkA, frames.passing, frames.walkB, frames.passing].map((assetId) => ({ assetId, frame: 0 }));
}

function directionBetween(layout: SceneLayout, from: string, to: string, portraitDirection: May23Direction): May23Direction {
  if (layout.orientation !== "landscape") return portraitDirection;
  const start = point(layout, { anchor: from });
  const end = point(layout, { anchor: to });
  if (Math.abs(end.x - start.x) > Math.abs(end.y - start.y)) return end.x >= start.x ? "right" : "left";
  return end.y >= start.y ? "down" : "up";
}

function groupMove(layout: SceneLayout, actor: May23ActorId, from: string, to: string, portraitDirection: May23Direction, startScale: number, endScale: number): { actor: string; x: number; y: number; facing: ActorFacing; visualScale: number; startVisualScale: number; sprite: { assetId: string; frame: number }; spriteCycle: Array<{ assetId: string; frame: number }>; spriteCycleDuration: number } {
  const direction = directionBetween(layout, from, to, portraitDirection);
  const target = point(layout, { anchor: to });
  return { actor, x: target.x, y: target.y, facing: direction, visualScale: endScale, startVisualScale: startScale, sprite: sprite(actor as May23ActorId, direction, "passing"), spriteCycle: cycle(actor as May23ActorId, direction), spriteCycleDuration: 0.16 };
}

function move(layout: SceneLayout, actor: May23ActorId, from: string, to: string, movementDirection: May23Direction, duration: number, startScale: number, endScale = startScale, arrivalFacing: May23Direction = movementDirection, dialogue?: CutsceneDialogue, dialogueAtProgress = 0.35): CutsceneAction {
  const direction = directionBetween(layout, from, to, movementDirection);
  const target = point(layout, { anchor: to });
  const finalFacing = layout.orientation === "landscape" ? direction : arrivalFacing;
  const action: Extract<CutsceneAction, { type: "move" }> = {
    type: "move",
    actor,
    x: target.x,
    y: target.y,
    duration,
    facing: direction,
    movementDirection: direction,
    arrivalFacing: finalFacing,
    visualScale: endScale,
    startVisualScale: startScale,
    sprite: sprite(actor, direction, "passing"),
    spriteCycle: cycle(actor, direction),
    spriteCycleDuration: 0.16
  };
  if (dialogue) {
    action.dialogue = dialogue;
    action.dialogueAtProgress = dialogueAtProgress;
  }
  return action;
}

export function resolveMay23Actions(layout: SceneLayout, mode: "main" | "echo", echoId = ""): CutsceneAction[] {
  if (mode === "echo") return (may23EchoDialogues[echoId] ?? []).map((line) => ({ type: "dialogue", speaker: line.speaker, text: line.text, portrait: line.portrait}));
  const msLobby = point(layout, { anchor: "ms-lobby-arrival" });
  const etStairs = point(layout, { anchor: "et-stairs-arrival" });
  const teStairs = point(layout, { anchor: "tung-ern-stairs-arrival" });
  const etLobby = point(layout, { anchor: "et-lobby-cross" });
  const teLobby = point(layout, { anchor: "tung-ern-lobby-cross" });
  const etExit = point(layout, { anchor: "et-exit-position" });
  const teExit = point(layout, { anchor: "tung-ern-exit-position" });
  const msWatch = point(layout, { anchor: "ms-watch-exit" });
  return [
    { type: "dialogue", speaker: "MS", text: "为了证明你不是飞机王 现在来散步",portrait: "assets/523/memory-portrait/bus-stop-memory.png" },
    { type: "dialogue", speaker: "ET", text: "来啊",portrait:"assets/624/echo-portraits/et-portraits/02-speaking.png"  },
    { type: "dialogue", speaker: "ET", text: "认真的",portrait:"assets/624/echo-portraits/et-portraits/02-speaking.png"  },
    { type: "dialogue", speaker: "MS", text: "letsgo",portrait: "assets/523/memory-portrait/bus-stop-memory.png" },
    { type: "dialogue", speaker: "MS", text: "不出来是狗",portrait: "assets/523/memory-portrait/bus-stop-memory.png" },
    { type: "spawn", actor: "ms", kind: "human", x: msLobby.x, y: msLobby.y, facing: directionBetween(layout, "ms-lobby-arrival", "ms-toilet-doorway", "up"), sprite: sprite("ms", directionBetween(layout, "ms-lobby-arrival", "ms-toilet-doorway", "up"), "passing"), visualScale: 0.3 },
    { type: "dialogue", speaker: "MS", text: "我到了 你呢" ,portrait: "assets/523/memory-portrait/bus-stop-memory.png"},
    move(layout, "ms", "ms-lobby-arrival", "ms-toilet-doorway", "up", 1.2, 0.3, 0.2, "down"),
    { type: "sprite", actor: "ms", sprite: sprite("ms", "down", "idle"), visualScale: 0.2 },
    { type: "spawn", actor: "et", kind: "human", x: etStairs.x, y: etStairs.y, facing: directionBetween(layout, "et-stairs-arrival", "et-lobby-cross", "down"), sprite: sprite("et", directionBetween(layout, "et-stairs-arrival", "et-lobby-cross", "down"), "passing"), visualScale: 0.25 },
    { type: "spawn", actor: "tung-ern", kind: "human", x: teStairs.x, y: teStairs.y, facing: directionBetween(layout, "tung-ern-stairs-arrival", "tung-ern-lobby-cross", "down"), sprite: sprite("tung-ern", directionBetween(layout, "tung-ern-stairs-arrival", "tung-ern-lobby-cross", "down"), "passing"), visualScale: 0.25 },
    { type: "moveGroup", duration: 1.05, moves: [
      groupMove(layout, "et", "et-stairs-arrival", "et-lobby-cross", "right", 0.25, 0.3),
      groupMove(layout, "tung-ern", "tung-ern-stairs-arrival", "tung-ern-lobby-cross", "right", 0.25, 0.3)
    ] },
    { type: "dialogue", speaker: "ET", text: "你吃了吗 letsgo",portrait: "assets/523/memory-portrait/01.png" },
    { type: "moveGroup", duration: 0.9, moves: [
      groupMove(layout, "et", "et-lobby-cross", "et-exit-position", "right", 0.3, 0.3),
      groupMove(layout, "tung-ern", "tung-ern-lobby-cross", "tung-ern-exit-position", "right", 0.3, 0.3)
    ] },
    { type: "wait", duration: 1.4 },
    { type: "despawn", actor: "et" },
    { type: "despawn", actor: "tung-ern" },
    move(layout, "ms", "ms-toilet-doorway", "ms-watch-exit", "down", 0.45, 0.2, 0.31),
    { type: "sprite", actor: "ms", sprite: spriteForPath(layout, "ms", "ms-toilet-doorway", "ms-watch-exit", "down", "passing"), visualScale: 0.31 },
    move(layout, "ms", "ms-watch-exit", "ms-wander-start", "down", 0.75, 0.31, 0.3),
    { type: "face", actor: "ms", direction: "up" },
    { type: "sprite", actor: "ms", sprite: spriteForPath(layout, "ms", "ms-watch-exit", "ms-wander-start", "up", "walkA"), visualScale: 0.3 },
    move(layout, "ms", "ms-wander-start", "ms-wander-far-end", "up", 1.2, 0.3, 0.25),
    { type: "sprite", actor: "ms", sprite: spriteForPath(layout, "ms", "ms-wander-start", "ms-wander-far-end", "up", "passing"), visualScale: 0.25 },
    { type: "wait", duration: 0.45 },
    move(layout, "ms", "ms-wander-far-end", "ms-wander-return", "down", 0.85, 0.25, 0.3),
    { type: "sprite", actor: "ms", sprite: spriteForPath(layout, "ms", "ms-wander-far-end", "ms-wander-return", "down", "passing"), visualScale: 0.3 },
    move(layout, "ms", "ms-wander-return", "ms-bus-stop-wait", "down", 0.9, 0.3),
    { type: "sprite", actor: "ms", sprite: spriteForPath(layout, "ms", "ms-wander-return", "ms-bus-stop-wait", "left", "idle"), visualScale: 0.3 },
    { type: "wait", duration: 1.1 },
    { type: "spawn", actor: "et", kind: "human", x: point(layout, { anchor: "et-return-path" }).x, y: point(layout, { anchor: "et-return-path" }).y, facing: directionBetween(layout, "et-return-path", "et-return-stairs", "up"), sprite: sprite("et", directionBetween(layout, "et-return-path", "et-return-stairs", "up"), "passing"), visualScale: 0.3 },
    { type: "spawn", actor: "tung-ern", kind: "human", x: point(layout, { anchor: "tung-ern-return-path" }).x, y: point(layout, { anchor: "tung-ern-return-path" }).y, facing: directionBetween(layout, "tung-ern-return-path", "tung-ern-return-stairs", "up"), sprite: sprite("tung-ern", directionBetween(layout, "tung-ern-return-path", "tung-ern-return-stairs", "up"), "passing"), visualScale: 0.3 },
    { type: "moveGroup", duration: 0.9, moves: [
      groupMove(layout, "et", "et-return-path", "et-return-stairs", "up", 0.3, 0.3),
      groupMove(layout, "tung-ern", "tung-ern-return-path", "tung-ern-return-stairs", "up", 0.3, 0.3)
    ] },
    { type: "despawn", actor: "et" },
    { type: "despawn", actor: "tung-ern" },
    { type: "dialogue", speaker: "MS", text: "她还是没有回我。",portrait: "assets/523/memory-portrait/bus-stop-memory.png" },
    { type: "dialogue", speaker: "MS", text: "我甚至还在想，\n她是不是买了东西回来给我。",portrait: "assets/523/memory-portrait/bus-stop-memory.png" },
    { type: "dialogue", speaker: "MS", text: "结果都是我以为。",portrait: "assets/523/memory-portrait/bus-stop-memory.png" },
    move(layout, "ms", "ms-bus-stop-wait", "ms-walk-away", "down", 0.85, 0.3),
    { type: "sprite", actor: "ms", sprite: spriteForPath(layout, "ms", "ms-bus-stop-wait", "ms-walk-away", "down", "passing"), visualScale: 0.3 },
    move(layout, "ms", "ms-walk-away", "ms-halfway-home", "down", 1.1, 0.3),
    { type: "sprite", actor: "ms", sprite: spriteForPath(layout, "ms", "ms-walk-away", "ms-halfway-home", "down", "passing"), visualScale: 0.3 },
    { type: "dialogue", speaker: "ET", text: "你在哪里！！！！" ,portrait: "assets/523/memory-portrait/01.png"},
    { type: "wait", duration: 0.22 },
    { type: "face", actor: "ms", direction: "up" },
    move(layout, "ms", "ms-halfway-home", "ms-return-stop", "up", 0.8, 0.3, 0.3, "up", { speaker: "ET", text: "算了啦 我8：30要去吃饭" ,portrait: "assets/523/memory-portrait/bus-stop-memory.png"}, 0.35),
    { type: "sprite", actor: "ms", sprite: spriteForPath(layout, "ms", "ms-halfway-home", "ms-return-stop", "up", "passing"), visualScale: 0.3 },
    { type: "dialogue", speaker: "ET", text: "刚跟朋友走mecar" ,portrait: "assets/523/memory-portrait/01.png"},
    { type: "dialogue", speaker: "ET", text: "哈哈哈哈" ,portrait: "assets/523/memory-portrait/01.png"},
    { type: "checkpoint", id: "may23-reflection-1" },
    { type: "checkpoint", id: "may23-reflection-2" },
    { type: "checkpoint", id: "may23-reflection-3" },
    { type: "despawn", actor: "ms" }
  ];
}
