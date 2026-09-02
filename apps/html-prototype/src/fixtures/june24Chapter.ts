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

const msFrame = (direction: June24Direction, frame: number): string =>
  "assets/624/ms-base/" + direction + "/" + direction + "-" + String(frame).padStart(2, "0") + ".png";
const tableFrame = (side: "left" | "right", frame: string): string =>
  "assets/624/624-table/table-facing-" + side + "/" + frame + ".png";

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
  "01-sitting-reading",
  "02-look-up-greeting",
  "03-surprised-5-23",
  "04-hand-stop-phone",
  "05-drink-carrot-milk",
  "06-hold-ugly-xiaoba",
  "07-guilt-quiet",
  "08-goodbye-look"
].map((frame) => tableFrame("right", frame)).concat([
  "01-sitting-opposite",
  "02-show-phone",
  "03-phone-hand-stopped-reaction",
  "04-hold-carrot-milk",
  "05-give-xiaoba",
  "06-head-down-table",
  "07-goodbye-stand",
  "08-goodbye-walk"
].map((frame) => tableFrame("left", frame)));

export const june24Assets: Record<string, SceneSpriteAsset> = Object.fromEntries([
  ...Object.values(june24FrameRegistries.ms).flat(),
  ...Object.values(june24FrameRegistries.et).flat(),
  ...tableAssets
].map((path) => [path, asset(path, path.endsWith("07-goodbye-stand.png") ? 311 : 384)]));

const point = (layout: SceneLayout, anchor: string) => {
  const value = layout.anchors[anchor];
  if (!value) throw new Error("Missing June 24 authored anchor: " + anchor);
  return value;
};

const sprite = (assetId: string, frame = 0) => ({ assetId, frame });
const ms = (direction: June24Direction, frame: number) => sprite(june24FrameRegistries.ms[direction][frame - 1]);
const et = (frame: string) => sprite(tableFrame("right", frame));
const table = (side: "left" | "right", frame: string) => sprite(tableFrame(side, frame));
const cycle = (direction: June24Direction) => [2, 3, 4, 3].map((frame) => ms(direction, frame));

const move = (
  layout: SceneLayout,
  actor: "ms" | "et",
  targetAnchor: string,
  direction: ActorFacing,
  duration: number,
  spriteState: { assetId: string; frame: number },
  arrivalFacing: ActorFacing = direction,
  dialogue?: CutsceneDialogue
): CutsceneAction => {
  const target = point(layout, targetAnchor);
  const action: Extract<CutsceneAction, { type: "move" }> = {
    type: "move",
    actor,
    x: target.x,
    y: target.y,
    duration,
    facing: direction,
    movementDirection: direction,
    arrivalFacing,
    sprite: spriteState,
    spriteCycle: actor === "ms" && spriteState.assetId === msFrame(direction, 2) ? cycle(direction) : undefined,
    spriteCycleDuration: 0.16,
    visualScale: 0.3,
    startVisualScale: 0.3
  };
  if (dialogue) {
    action.dialogue = dialogue;
    action.dialogueAtProgress = 0.45;
  }
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
    { id: "june24-holding", tone: "holding", preference: { closeness: 1, companionship: 1 }, lines: ["她继续读书。", "我趴在桌上看了一会。"], afterline: "那天下午，好像也没有什么特别的。" },
    { id: "june24-not-ready", tone: "not-ready", preference: { distance: 1, avoidance: 1 }, lines: ["她说对不起。", "我第一句问的是：然后呢。"], afterline: "有些话听到了，也不会立刻知道该放哪里。" },
    { id: "june24-rewriting", tone: "rewriting", preference: { honesty: 1, acceptance: 1 }, lines: ["我没有再翻照片。", "她说，她懂了。"], afterline: "原来有些证明，不需要真的打开。" }
  ]
};

const choice = (id: string, label: string, effects: Choice["effects"], response: string): Choice => ({ id, label, effects, response });

export const june24ReflectionChoices: Array<{ id: string; prompt: string; choices: Choice[] }> = [
  {
    id: "june24-reflection-1",
    prompt: "后来知道她真的以为你没来，\n那 5 月 23 日会变得不一样吗？",
    choices: [
      choice("june24-reflection-1-a", "会吧。至少我终于知道她当时在想什么。", { acceptance: 1, honesty: 1 }, "知道后来发生了什么，\n和重新走一遍那天，不是一回事。"),
      choice("june24-reflection-1-b", "不会。那天我还是一个人走了那么久。", { honesty: 1, distance: 1 }, "对。\n后来的解释没有替当时的你走那段路。"),
      choice("june24-reflection-1-c", "我不知道。\n好像轻了一点，又没有真的轻。", { acceptance: 1, companionship: 1 }, "有些答案只是把空白填上。\n不一定会把重量拿走。")
    ]
  },
  {
    id: "june24-reflection-2",
    prompt: "她问“为什么你那时候不叫住我”，\n你最在意的是哪一部分？",
    choices: [
      choice("june24-reflection-2-a", "我明明已经说过“我到了”。", { honesty: 1 }, "那句话那天就已经在那里。"),
      choice("june24-reflection-2-b", "原来她真的以为我没有来。", { acceptance: 1, closeness: 1 }, "这件事，\n你到一个月后才知道。"),
      choice("june24-reflection-2-c", "为什么最后还是要我再走过去一次。", { distance: 1, honesty: 1 }, "当时的你，\n也问过类似的问题。")
    ]
  },
  {
    id: "june24-reflection-3",
    prompt: "她说“我很愧疚”的时候，\n你为什么没有说话？",
    choices: [
      choice("june24-reflection-3-a", "因为那时候的我确实觉得自己那时候有点可怜。", { honesty: 1, acceptance: 1 }, "你没有替过去的自己否认这件事。"),
      choice("june24-reflection-3-b", "因为我不知道该不该原谅什么。", { avoidance: 1, acceptance: 1 }, "也不一定需要当场决定。"),
      choice("june24-reflection-3-c", "因为听到她也记得，\n我已经够了。", { closeness: 1, companionship: 1 }, "那一刻没有再多一句。")
    ]
  }
];

export const june24EchoDialogues: Record<string, Array<{ speaker: string; text: string }>> = {
  "june24-angela-st-echo": [
    { speaker: "朋友", text: "诶你没有看到et吗\n她在楼下坐着诶\n你没有去找她吗" },
    { speaker: "我", text: "蛤\n我zomok会看到她" },
    { speaker: "朋友", text: "她现在眼里已经没有et了" },
    { speaker: "我", text: "啊对对对" },
    { speaker: "我", text: "。。。\n她现在在楼下？\n为啥 她在这里干嘛" },
    { speaker: "朋友", text: "温习吧\n对 她就在这里楼下坐着\n你现在下去就可以看到她了" },
    { speaker: "我", text: "噢噢\n。。。\n科科" }
  ],
  "june24-room-study-echo": [
    { speaker: "她", text: "我明天可以申请我不要散步吗\n我要做功课\n我在你那里做功课就好😂" },
    { speaker: "我", text: "可以啊\n认真的\n你走路来咯" },
    { speaker: "她", text: "如果你不得空\n我们就取消 哈哈哈" },
    { speaker: "我", text: "我就是不要啊\n我就看你会不会走路来\n我不得空也可以有空的" },
    { speaker: "她", text: "okokok\n你明天等我走来" }
  ],
  "june24-haircut-echo": [
    { speaker: "我", text: "你刘海长了欸\n我可以帮你剪" },
    { speaker: "她", text: "我理你都傻" },
    { speaker: "我", text: "我妈妈可以帮你剪\n你放假来我家\n我妈妈免费帮你剪头发➕染头发" },
    { speaker: "她", text: "考完试收拾完房间再看" },
    { speaker: "我", text: "希望这次不要再放我飞机了" }
  ]
};

export function resolveJune24Actions(layout: SceneLayout, mode: "main" | "echo", echoId = ""): CutsceneAction[] {
  if (mode === "echo") {
    return (june24EchoDialogues[echoId] ?? []).map((line) => ({ type: "dialogue", speaker: line.speaker, text: line.text }));
  }

  const msEntry = point(layout, "ms-entry-start");
  const actions: CutsceneAction[] = [
    { type: "spawn", actor: "et", kind: "human", x: point(layout, "et-reading-seat").x, y: point(layout, "et-reading-seat").y, facing: "right", sprite: et("01-sitting-reading"), visualScale: 0.3 },
    { type: "spawn", actor: "ms", kind: "human", x: msEntry.x, y: msEntry.y, facing: "up", sprite: ms("up", 1), visualScale: 0.3 },
    move(layout, "ms", "ms-table-approach", "up", 1.2, ms("up", 2), "left"),
    move(layout, "ms", "ms-first-seat", "left", 0.12, table("left", "01-sitting-opposite"), "left"),
    { type: "sprite", actor: "ms", sprite: table("left", "01-sitting-opposite"), visualScale: 0.3 },
    { type: "dialogue", speaker: "她", text: "哈喽" },
    { type: "dialogue", speaker: "我", text: "hi屁噢" },
    { type: "dialogue", speaker: "她", text: "zomok你在这里的\n你怎样知道我在这里\n你不用上课吗" },
    { type: "dialogue", speaker: "我", text: "我没有上课啊" },
    { type: "dialogue", speaker: "她", text: "骗人\nangela讲你们上philosophy" },
    { type: "dialogue", speaker: "我", text: "对啊angela上罢了" },
    { type: "dialogue", speaker: "她", text: "真的么" },
    { type: "dialogue", speaker: "我", text: "对啊我没有上课\n特地来这里只为了找你的" },
    { type: "dialogue", speaker: "我", text: "我现在不止钱包破洞\n脖子也破洞" },
    move(layout, "ms", "ms-carrot-seat", "left", 0.12, table("left", "04-hold-carrot-milk"), "left"),
    { type: "sprite", actor: "ms", sprite: table("left", "04-hold-carrot-milk"), visualScale: 0.3 },
    { type: "dialogue", speaker: "她", text: "哇你一大早就喝冰的 够力" },
    { type: "dialogue", speaker: "她", text: "你看我的小八可爱吗" },
    { type: "dialogue", speaker: "我", text: "可爱啊 欸我有更可爱的\n等下我拿给你 嘿嘿" },
    { type: "dialogue", speaker: "她", text: "一定是很丑的\n我不要 你不要来了" },
    { type: "dialogue", speaker: "我", text: "谁理你 就来" },
    { type: "dialogue", speaker: "她", text: "walao你不要留这杯东西在这边\n等下我喝掉" },
    { type: "dialogue", speaker: "我", text: "给你喝咯\n我不要了 很难喝\n等下要丢了" },
    { type: "dialogue", speaker: "她", text: "walao难喝就给我啦" },
    move(layout, "et", "et-carrot-seat", "right", 0.12, table("right", "05-drink-carrot-milk"), "right"),
    { type: "sprite", actor: "et", sprite: table("right", "05-drink-carrot-milk"), visualScale: 0.3 },
    { type: "dialogue", speaker: "她", text: "哇老你喝什么东西来的\n够难喝哦\nteh tarik吗" },
    { type: "dialogue", speaker: "我", text: "萝卜啊" },
    { type: "dialogue", speaker: "她", text: "哇靠谁家好人喝萝卜" },
    move(layout, "ms", "ms-second-seat", "left", 0.12, table("left", "01-sitting-opposite"), "left"),
    { type: "sprite", actor: "ms", sprite: table("left", "01-sitting-opposite"), visualScale: 0.3 },
    move(layout, "et", "et-reading-seat", "right", 0.12, table("right", "01-sitting-reading"), "right"),
    { type: "sprite", actor: "et", sprite: table("right", "01-sitting-reading"), visualScale: 0.3 },
    { type: "dialogue", speaker: "她", text: "你要一直坐在这里吗？你朋友几时来哦" },
    { type: "dialogue", speaker: "我", text: "怎么？我就是想坐在这里看你读书啊\n你越不给我在这里\n我越要在这里" },
    move(layout, "ms", "ms-xiaoba-give", "left", 0.12, table("left", "05-give-xiaoba"), "left"),
    { type: "sprite", actor: "ms", sprite: table("left", "05-give-xiaoba"), visualScale: 0.3 },
    move(layout, "et", "et-xiaoba-receive", "right", 0.12, table("right", "06-hold-ugly-xiaoba"), "right"),
    { type: "sprite", actor: "et", sprite: table("right", "06-hold-ugly-xiaoba"), visualScale: 0.3 },
    move(layout, "ms", "ms-second-seat", "left", 0.12, table("left", "01-sitting-opposite"), "left"),
    { type: "sprite", actor: "ms", sprite: table("left", "01-sitting-opposite"), visualScale: 0.3 },
    { type: "dialogue", speaker: "我", text: "其实我5月23号那天真的去了" },
    { type: "sprite", actor: "et", sprite: table("right", "03-surprised-5-23"), visualScale: 0.3 },
    { type: "dialogue", speaker: "她", text: "真的吗\n你不要骗我" },
    { type: "dialogue", speaker: "我", text: "真的啊" },
    { type: "dialogue", speaker: "她", text: "我不信\n你一定是在车大炮" },
    move(layout, "ms", "ms-phone-show", "left", 0.12, table("left", "02-show-phone"), "left"),
    { type: "sprite", actor: "ms", sprite: table("left", "02-show-phone"), visualScale: 0.3 },
    { type: "dialogue", speaker: "我", text: "包真的啊\n我还看到你的背影了" },
    move(layout, "et", "et-phone-stop", "right", 0.12, table("right", "04-hand-stop-phone"), "right"),
    { type: "sprite", actor: "et", sprite: table("right", "04-hand-stop-phone"), visualScale: 0.3 },
    { type: "wait", duration: 0.35 },
    { type: "sprite", actor: "ms", sprite: table("left", "03-phone-hand-stopped-reaction"), visualScale: 0.3 },
    { type: "dialogue", speaker: "她", text: "ok我懂了不用翻相册了\n为什么你那时候不叫住我" },
    { type: "dialogue", speaker: "我", text: "叫住你？\n怎样叫住你？" },
    { type: "wait", duration: 0.2 },
    { type: "dialogue", speaker: "我", text: "为什么要叫住你？" },
    { type: "dialogue", speaker: "她", text: "喊我名字\n然后过来跟我讲你真的来了啊" },
    { type: "dialogue", speaker: "我", text: "可是我那他不是早就说过我到了吗" },
    { type: "dialogue", speaker: "她", text: "呜呜呜呜\n对不起\n我以为你在车大炮" },
    { type: "dialogue", speaker: "我", text: "我从来没有骗过你\n一直都是你在放我飞机" },
    { type: "checkpoint", id: "june24-reflection-1" },
    { type: "dialogue", speaker: "她", text: "对不起" },
    { type: "dialogue", speaker: "我", text: "对不起然后呢\n后续呢" },
    { type: "dialogue", speaker: "她", text: "我真的没时间了\n这个礼拜final week\n下个礼拜study week\n后个礼拜就exam了" },
    { type: "dialogue", speaker: "我", text: "呜呜呜 " },
    { type: "dialogue", speaker: "她", text: "哎呀你干嘛 不要扮可怜勒\nok咯拜四我们去散步" },
    { type: "dialogue", speaker: "我", text: "你看我信吗\n你走过来我宿舍咯" },
    { type: "dialogue", speaker: "她", text: "看你信不信咯\n就是明天" },
    { type: "dialogue", speaker: "我", text: "呵呵" },
    { type: "dialogue", speaker: "她", text: "球球你不要转那个五毛回来了\n等下欠人东西我心里总觉得不踏实" },
    { type: "dialogue", speaker: "我", text: "ok那我不要还你\n然后也继续讲你\n我不亏诶" },
    { type: "dialogue", speaker: "她", text: "可以啊\n至少我知道我还了" },
    { type: "checkpoint", id: "june24-reflection-2" },
    move(layout, "et", "et-guilt-seat", "right", 0.12, table("right", "07-guilt-quiet"), "right"),
    { type: "sprite", actor: "et", sprite: table("right", "07-guilt-quiet"), visualScale: 0.3 },
    { type: "dialogue", speaker: "她", text: "我很愧疚" },
    { type: "dialogue", speaker: "我", text: "怎么了" },
    { type: "dialogue", speaker: "她", text: "想到那天你来了\n可是我和别人走掉了" },
    { type: "wait", duration: 0.8 },
    { type: "checkpoint", id: "june24-reflection-3" },
    move(layout, "ms", "ms-head-down-seat", "left", 0.12, table("left", "06-head-down-table"), "left"),
    { type: "sprite", actor: "ms", sprite: table("left", "06-head-down-table"), visualScale: 0.3 },
    move(layout, "et", "et-reading-seat", "right", 0.12, table("right", "01-sitting-reading"), "right"),
    { type: "sprite", actor: "et", sprite: table("right", "01-sitting-reading"), visualScale: 0.3 },
    { type: "wait", duration: 0.9 },
    move(layout, "ms", "ms-goodbye-stand", "left", 0.12, table("left", "07-goodbye-stand"), "left"),
    { type: "sprite", actor: "ms", sprite: table("left", "07-goodbye-stand"), visualScale: 0.3 },
    move(layout, "et", "et-goodbye-look", "right", 0.12, table("right", "08-goodbye-look"), "right"),
    { type: "sprite", actor: "et", sprite: table("right", "08-goodbye-look"), visualScale: 0.3 },
    { type: "dialogue", speaker: "我", text: "我朋友来带我走了\n你开心了咯" },
    { type: "dialogue", speaker: "我", text: "我靠你们琢磨偷拍我" },
    { type: "dialogue", speaker: "她", text: "哇靠琢磨他们突然要拍你" },
    move(layout, "ms", "ms-goodbye-exit", "down", 0.9, table("left", "08-goodbye-walk"), "down"),
    { type: "fade", actors: ["ms", "et"], duration: 0.45 },
    { type: "despawn", actor: "ms" },
    { type: "despawn", actor: "et" }
  ];
  return actions;
}
