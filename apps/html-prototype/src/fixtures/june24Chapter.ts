import type { Choice, ChapterDefinition } from "../types.js";
import type { CutsceneAction, CutsceneDialogue } from "../systems/CutsceneSystem.js";
import type { ActorFacing, SceneSpriteAsset } from "../systems/SceneActorRenderer.js";
import type { SceneLayout } from "../systems/SceneLayouts.js";

export type June24Direction = "down" | "left" | "right" | "up";
export type June24FrameRegistry = Record<June24Direction, string[]>;

const asset = (path: string, w = 384, h = 512): SceneSpriteAsset => ({
  path,
  source: { x: 0, y: 0, w, h },
  visibleBounds: { x: 0, y: 0, w, h },
  feet: { x: 0.5, y: 1 },
  baseHeight: h
});

const msFrame = (direction: June24Direction, frame: number): string => `assets/624/ms-base/${direction}/${direction}-${String(frame).padStart(2, "0")}.png`;
const tableFrame = (side: "left" | "right", frame: string): string => `assets/624/624-table/table-facing-${side}/${frame}.png`;

export const june24FrameRegistries: { ms: June24FrameRegistry; et: June24FrameRegistry } = {
  ms: {
    down: [1, 2, 3, 4].map((frame) => msFrame("down", frame)),
    left: [1, 2, 3, 4].map((frame) => msFrame("left", frame)),
    right: [1, 2, 3, 4].map((frame) => msFrame("right", frame)),
    up: [1, 2, 3, 4].map((frame) => msFrame("up", frame))
  },
  et: {
    down: ["01-sitting-reading", "02-look-up-greeting", "03-surprised-5-23", "04-hand-stop-phone"].map((frame) => tableFrame("right", frame)),
    left: ["01-sitting-reading", "02-look-up-greeting", "03-surprised-5-23", "04-hand-stop-phone"].map((frame) => tableFrame("right", frame)),
    right: ["01-sitting-reading", "02-look-up-greeting", "03-surprised-5-23", "04-hand-stop-phone"].map((frame) => tableFrame("right", frame)),
    up: ["01-sitting-reading", "02-look-up-greeting", "03-surprised-5-23", "04-hand-stop-phone"].map((frame) => tableFrame("right", frame))
  }
};

const tableAssets = [
  "01-sitting-reading", "02-look-up-greeting", "03-surprised-5-23", "04-hand-stop-phone", "05-drink-carrot-milk", "06-hold-ugly-xiaoba", "07-guilt-quiet", "08-goodbye-look"
].map((frame) => tableFrame("right", frame)).concat([
  "01-sitting-opposite", "02-show-phone", "03-phone-hand-stopped-reaction", "04-hold-carrot-milk", "05-give-xiaoba", "06-head-down-table", "07-goodbye-stand", "08-goodbye-walk"
].map((frame) => tableFrame("left", frame)));

export const june24Assets: Record<string, SceneSpriteAsset> = Object.fromEntries([
  ...Object.values(june24FrameRegistries.ms).flat(),
  ...Object.values(june24FrameRegistries.et).flat(),
  ...tableAssets
].map((path) => [path, asset(path, path.endsWith("07-goodbye-stand.png") ? 311 : 384)]));

const point = (layout: SceneLayout, anchor: string) => {
  const value = layout.anchors[anchor];
  if (!value) throw new Error(`Missing June 24 authored anchor: ${anchor}`);
  return value;
};

const sprite = (assetId: string, frame = 0) => ({ assetId, frame });
const ms = (direction: June24Direction, frame: number) => sprite(june24FrameRegistries.ms[direction][frame - 1]);
const et = (frame: number) => sprite(june24FrameRegistries.et.right[frame - 1]);
const table = (side: "left" | "right", frame: string) => sprite(tableFrame(side, frame));
const cycle = (direction: June24Direction) => [2, 3, 4, 3].map((frame) => ms(direction, frame));
const move = (layout: SceneLayout, actor: "ms" | "et", from: string, to: string, direction: ActorFacing, duration: number, spriteState: { assetId: string; frame: number }, dialogue?: CutsceneDialogue, arrivalFacing: ActorFacing = direction): CutsceneAction => {
  const target = point(layout, to);
  const action: Extract<CutsceneAction, { type: "move" }> = {
    type: "move", actor, x: target.x, y: target.y, duration, facing: direction, movementDirection: direction, arrivalFacing,
    sprite: spriteState, spriteCycle: actor === "ms" && spriteState.assetId === msFrame(direction, 2) ? cycle(direction) : undefined, spriteCycleDuration: 0.16, visualScale: 0.3, startVisualScale: 0.3
  };
  if (dialogue) { action.dialogue = dialogue; action.dialogueAtProgress = 0.45; }
  return action;
};

export const june24Chapter: ChapterDefinition = {
  id: "june24-only-came-for-you",
  diaryEntryId: "authored-diary-june24-only-came-for-you",
  runtimeScene: "624",
  date: "2026-06-24",
  title: "06.24 · 只为你而来",
  mood: "ordinary afternoon, interrupted by what was remembered",
  weather: "quiet afternoon",
  location: "the study table",
  characters: ["Muji", "MS", "ET"],
  objects: ["table", "carrot milk", "phone", "Xiaoba"],
  evidence: ["authored-624-portrait-scene-layout", "authored-624-landscape-scene-layout", "june24-approved-table-assets", "june24-echo-portraits"],
  dialogue: [],
  canonicalClosure: {
    historicalEventId: "june24-table-memory",
    lines: ["后来她终于知道，我真的来过。", "但 5 月 23 日还是 5 月 23 日。"]
  },
  reflectionQuotes: [
    { id: "june24-accepting", tone: "accepting", preference: { acceptance: 1, honesty: 1 }, lines: ["后来我终于知道，她真的以为我没有来。", "但 5 月 23 日还是 5 月 23 日。"] },
    { id: "june24-holding", tone: "holding", preference: { closeness: 1, companionship: 1 }, lines: ["她继续读书。我趴在桌上看了一会。", "那天下午，好像也没有什么特别的。"] },
    { id: "june24-not-ready", tone: "not-ready", preference: { distance: 1, avoidance: 1 }, lines: ["她说对不起。我第一句问的是：然后呢。", "有些话听到了，也不会立刻知道该放哪里。"] },
    { id: "june24-rewriting", tone: "rewriting", preference: { honesty: 1, acceptance: 1 }, lines: ["我没有再翻照片。她说，她懂了。", "原来有些证明，不需要真的打开。"] }
  ]
};

const choice = (id: string, label: string, effects: Choice["effects"], response: string): Choice => ({ id, label, effects, response });
export const june24ReflectionChoices: Array<{ id: string; prompt: string; choices: Choice[] }> = [
  {
    id: "june24-reflection-1",
    prompt: "听见她说“对不起”以后，你第一句想问什么？",
    choices: [
      choice("june24-why-apology", "为什么要说对不起？", { honesty: 1, closeness: 1 }, "她没有马上回答。桌上的声音还在。"),
      choice("june24-then-what", "然后呢？", { honesty: 1, acceptance: 1 }, "你问得很轻。不是每个答案都会马上出现。"),
      choice("june24-leave-it", "没关系，先不用说。", { avoidance: 1, distance: 1 }, "有些话暂时放在桌上，也是一种选择。")
    ]
  },
  {
    id: "june24-reflection-2",
    prompt: "那杯胡萝卜奶留下的是什么？",
    choices: [
      choice("june24-carrot-fact", "只是她真的喝完了。", { acceptance: 1, honesty: 1 }, "对。那是下午发生过的一件小事。"),
      choice("june24-carrot-callback", "她记得我说过的话。", { closeness: 1, companionship: 1 }, "她记得。记得不一定等于能够解释。"),
      choice("june24-carrot-distance", "我不知道，也不想替它命名。", { distance: 1, concealment: 1 }, "那就先不命名。它可以只是留在那里。")
    ]
  },
  {
    id: "june24-reflection-3",
    prompt: "现在回头看，你想把哪一句留在那张桌子上？",
    choices: [
      choice("june24-leave-proof", "我真的有来。", { honesty: 1, acceptance: 1 }, "这一次，不需要翻开手机证明。"),
      choice("june24-leave-company", "我只是想陪你。", { closeness: 1, companionship: 1 }, "那天下午，你们确实坐在一起。"),
      choice("june24-leave-open", "我还不知道。", { avoidance: 1, distance: 1 }, "不知道也可以是那天留下来的真话。")
    ]
  }
];

export const june24EchoDialogues: Record<string, Array<{ speaker: string; text: string }>> = {
  "june24-angela-st-echo": [
    { speaker: "ET", text: "早上 Angela 和 ST 也在。" },
    { speaker: "MS", text: "我记得。那时候没有发生什么特别的事。" }
  ],
  "june24-room-study-echo": [
    { speaker: "ET", text: "我还在读书。" },
    { speaker: "MS", text: "你明天等我走来。" }
  ],
  "june24-haircut-echo": [
    { speaker: "ET", text: "我剪了头发。" },
    { speaker: "MS", text: "回家吗？" },
    { speaker: "ET", text: "还不知道。" }
  ]
};

export function resolveJune24Actions(layout: SceneLayout, mode: "main" | "echo", echoId = ""): CutsceneAction[] {
  if (mode === "echo") return (june24EchoDialogues[echoId] ?? []).map((line) => ({ type: "dialogue", speaker: line.speaker, text: line.text }));
  const msEntry = point(layout, "ms-entry-start");
  return [
    { type: "spawn", actor: "et", kind: "human", x: point(layout, "et-reading-seat").x, y: point(layout, "et-reading-seat").y, facing: "right", sprite: et(1), visualScale: 0.3 },
    { type: "spawn", actor: "ms", kind: "human", x: msEntry.x, y: msEntry.y, facing: "up", sprite: ms("up", 1), visualScale: 0.3 },
    move(layout, "ms", "ms-entry-start", "ms-table-approach", "up", 1.2, ms("up", 2), undefined, "left"),
    move(layout, "ms", "ms-table-approach", "ms-first-seat", "down", 0.25, table("left", "01-sitting-opposite")),
    { type: "sprite", actor: "et", sprite: et(2), visualScale: 0.3 },
    { type: "dialogue", speaker: "ET", text: "你来了。" },
    { type: "dialogue", speaker: "MS", text: "我只为你而来。" },
    { type: "dialogue", speaker: "ET", text: "不要这样讲啦。" },
    { type: "sprite", actor: "ms", sprite: table("left", "04-hold-carrot-milk"), visualScale: 0.3 },
    { type: "sprite", actor: "et", sprite: table("right", "05-drink-carrot-milk"), visualScale: 0.3 },
    { type: "dialogue", speaker: "MS", text: "你还记得胡萝卜奶。" },
    { type: "dialogue", speaker: "ET", text: "记得啊。" },
    { type: "sprite", actor: "ms", sprite: table("left", "01-sitting-opposite"), visualScale: 0.3 },
    { type: "sprite", actor: "et", sprite: table("right", "01-sitting-reading"), visualScale: 0.3 },
    { type: "dialogue", speaker: "MS", text: "上次你以为我没有来。" },
    { type: "sprite", actor: "et", sprite: table("right", "03-surprised-5-23"), visualScale: 0.3 },
    { type: "dialogue", speaker: "ET", text: "我以为你没有来。" },
    { type: "sprite", actor: "ms", sprite: table("left", "02-show-phone"), visualScale: 0.3 },
    { type: "wait", duration: 0.35 },
    { type: "sprite", actor: "et", sprite: table("right", "04-hand-stop-phone"), visualScale: 0.3 },
    { type: "wait", duration: 0.28 },
    { type: "sprite", actor: "ms", sprite: table("left", "03-phone-hand-stopped-reaction"), visualScale: 0.3 },
    { type: "dialogue", speaker: "ET", text: "不用翻给我看。" },
    { type: "dialogue", speaker: "MS", text: "我只是想证明我真的有来。" },
    { type: "checkpoint", id: "june24-reflection-1" },
    { type: "sprite", actor: "ms", sprite: table("left", "05-give-xiaoba"), visualScale: 0.3 },
    { type: "sprite", actor: "et", sprite: table("right", "06-hold-ugly-xiaoba"), visualScale: 0.3 },
    { type: "dialogue", speaker: "MS", text: "这个给你。丑小八。" },
    { type: "dialogue", speaker: "ET", text: "很丑。" },
    { type: "checkpoint", id: "june24-reflection-2" },
    { type: "sprite", actor: "et", sprite: table("right", "07-guilt-quiet"), visualScale: 0.3 },
    { type: "wait", duration: 0.6 },
    { type: "sprite", actor: "ms", sprite: table("left", "06-head-down-table"), visualScale: 0.3 },
    { type: "sprite", actor: "et", sprite: table("right", "01-sitting-reading"), visualScale: 0.3 },
    { type: "dialogue", speaker: "ET", text: "对不起。" },
    { type: "dialogue", speaker: "MS", text: "然后呢？" },
    { type: "checkpoint", id: "june24-reflection-3" },
    { type: "sprite", actor: "ms", sprite: table("left", "07-goodbye-stand"), visualScale: 0.3 },
    { type: "sprite", actor: "et", sprite: table("right", "08-goodbye-look"), visualScale: 0.3 },
    { type: "dialogue", speaker: "MS", text: "我先走了。" },
    move(layout, "ms", "ms-goodbye-stand", "ms-goodbye-exit", "down", 0.9, table("left", "08-goodbye-walk")),
    { type: "fade", actors: ["ms", "et"], duration: 0.45 },
    { type: "despawn", actor: "ms" },
    { type: "despawn", actor: "et" }
  ];
}
