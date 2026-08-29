import type { ChapterDefinition, ReflectionChoice } from "../types.js";
import type { CutsceneAction } from "../systems/CutsceneSystem.js";
import type { SceneSpriteAsset } from "../systems/SceneActorRenderer.js";
import type { SceneLayout } from "../systems/SceneLayouts.js";
import type { AuthoredPortraitSequence } from "../systems/MemoryPortraitPresentation.js";
import { march30Assets, march30MainMemoryActions, resolveMarch30CutsceneActions, type March30AssetId } from "./march30Memory.js";

const choice = (id: string, label: string, effects: ReflectionChoice["effects"], response: string): ReflectionChoice => ({ id, label, effects, response });
const ms = (text: string) => ({ speaker: "MS", text });
const et = (text: string) => ({ speaker: "ET", text });
const frameAssetId = (assetId: string, frame: number): string => `${assetId}:${frame}`;

function frameAsset(assetId: March30AssetId, frame: number): SceneSpriteAsset {
  const asset = march30Assets[assetId];
  const frameRect = asset.frames[frame];
  if (!frameRect) throw new Error(`Missing March 30 frame ${assetId}:${frame}`);
  return {
    path: asset.path,
    source: frameRect.source,
    visibleBounds: asset.visibleBounds?.[frame],
    feet: {
      x: frameRect.feet.x / frameRect.source.w,
      y: frameRect.feet.y / frameRect.source.h
    },
    materialScale: 1.2,
    nozzleOrigin: asset.nozzleOrigin,
    mirrorForLeft: asset.mirrorForLeft
  };
}

function propAsset(id: "gift" | "waterGun" | "ordinaryKeychain" | "phoneCharm"): SceneSpriteAsset {
  const asset = march30Assets[id];
  const baseHeight = id === "gift" ? 42 : id === "waterGun" ? 44 : 50;
  return {
    path: asset.path,
    source: asset.source,
    feet: { x: 0.5, y: 0.5 },
    baseHeight,
    materialScale: 2
  };
}

const actorAssetIds: March30AssetId[] = [
  "msBase", "etBase", "approach", "waterSpraying", "waterSprayed", "keychains", "jacketAction", "jacketReaction", "waterVfx", "dissolve"
];

export const march30RefinedAssets: Record<string, SceneSpriteAsset> = {
  ...Object.fromEntries(actorAssetIds.flatMap((assetId) =>
    Object.keys(march30Assets[assetId].frames).map((frame) => [frameAssetId(assetId, Number(frame)), frameAsset(assetId, Number(frame))])
  )),
  gift: propAsset("gift"),
  waterGun: propAsset("waterGun"),
  ordinaryKeychain: propAsset("ordinaryKeychain"),
  phoneCharm: propAsset("phoneCharm")
};

function refinedSpriteAction(action: CutsceneAction): CutsceneAction {
  if (action.type === "dialogue") return { ...action, portrait: undefined };
  if (action.type === "prop") return { ...action, assetId: action.id };
  if (action.type === "spawn" && action.sprite) {
    return { ...action, sprite: { ...action.sprite, assetId: frameAssetId(action.sprite.assetId, action.sprite.frame), frame: 0 } };
  }
  if (action.type === "move" && action.sprite) {
    return { ...action, sprite: { ...action.sprite, assetId: frameAssetId(action.sprite.assetId, action.sprite.frame), frame: 0 } };
  }
  if (action.type === "sprite") {
    return { ...action, sprite: { ...action.sprite, assetId: frameAssetId(action.sprite.assetId, action.sprite.frame), frame: 0 } };
  }
  return action;
}

export function resolveMarch30RefinedActions(layout: SceneLayout, mode: "main" | "echo"): CutsceneAction[] {
  if (mode === "echo") return [];
  return resolveMarch30CutsceneActions(layout, march30MainMemoryActions).map(refinedSpriteAction);
}

export const march30PortraitSequences: Record<string, AuthoredPortraitSequence> = {
  "march30-elevator": {
    id: "march30-elevator",
    beats: [
      {
        portrait: "",
        dialogue: [
          ms("额嘿嘿好巧哈哈 又见面了 太有缘了"),
          et("是咯~你怎么还在这里"),
          ms("我要去五楼买吃的"),
          et("你等下上课在哪个mpk"),
          ms("我在隔壁blok上课"),
          et("原来如此"),
          ms("ei sda有用到电脑吗"),
          et("有啊"),
          ms("噢那还好我有带到"),
          et("看slide要用到罢了哈哈"),
          ms("什么屁 看slide我带tab不就好了呜呜"),
          ms("哎哟又遇到了 我们还是那么顺路 太有缘分了"),
          et("诶你昨晚真的没睡觉吗"),
          ms("真的啊 不要不信"),
          et("为什么不睡"),
          ms("失眠啊"),
          et("是不是又半夜抢asnb"),
          ms("walao没钱抢asnb 更失眠了呜呜"),
          ms("这都还没到你教室 我们竟然真的那么顺路的吗 ")
        ]
      }
    ]
  }
};

export const march30EchoPortraitSequenceIds: Record<string, string> = {
  elevator: "march30-elevator"
};

export const march30EchoAnchors: Record<string, string> = {
  elevator: "elevator-reencounter"
};

export const march30EchoAvailability: Record<string, { requiresMainCompletion?: boolean }> = {
  elevator: { requiresMainCompletion: true }
};

export const march30RefinedReflectionChoices: Array<{ id: string; prompt: string; choices: ReflectionChoice[] }> = [
  {
    id: "march30-reflection-three-sprays",
    prompt: "她拿着我给的水枪，对着我的脸滋了三下。\n\n后来我为什么一直记得这一幕？",
    choices: [
      choice("march30-three-sprays-funny", "可能只是因为真的很好笑。", { acceptance: 1, companionship: 1 }, "三下水。\n一张湿掉的脸。\n\n她发现真的可以喷水，\n你站在那里不知道该讲什么。\n\n有些画面留下来，\n可能真的不需要更大的理由。"),
      choice("march30-three-sprays-close", "因为那时候的距离，好像已经很近了。", { holding: 1, closeness: 1 }, "也许你后来才开始注意距离。\n\n那时候没有人量过。\n没有人停下来问这算什么。\n\n她只是拿着水枪。\n你就在她前面。"),
      choice("march30-three-sprays-remained", "我不知道。只是别的细节都淡了，这个还在。", { honesty: 1, acceptance: 1 }, "记忆没有解释自己为什么留下这一格。\n\n它只是没有删掉。\n\n水还在。\n你摸脸的动作也还在。")
    ]
  },
  {
    id: "march30-reflection-jacket",
    prompt: "我的脸湿了以后，她拿自己的 jacket 帮我擦。\n\n现在回头看，我该怎样记住这个动作？",
    choices: [
      choice("march30-jacket-simple", "她只是顺手帮我擦干而已。", { acceptance: 1, companionship: 1 }, "可以。\n\n当时的事情可以就停在当时。\n\n脸湿了。\n她有一件 jacket。\n所以拿来擦了一下。\n\n不需要替那个动作提前知道后来。"),
      choice("march30-jacket-close", "可是我还是会觉得，那一刻很亲近。", { holding: 1, closeness: 1 }, "那是现在的你在形容自己的记忆。\n\n你可以承认它后来变得很重。\n\n只是别让后来的重量，\n倒回去替当时的人回答。"),
      choice("march30-jacket-uncertain", "我分不清，是那个动作特别，还是因为后来是她。", { honesty: 1, distance: 1 }, "这可能才是最难分开的地方。\n\n同一个动作，\n如果后来什么都没有发生，\n还会不会被记这么久？\n\n记忆没有留下对照组。")
    ]
  },
  {
    id: "march30-reflection-fate",
    prompt: "我们已经在二楼说了再见。\n\n后来下一趟电梯打开的时候，又碰见了。\n\n我那时候觉得：怎么又是她，太有缘了。\n\n现在我还需要把它叫作“缘分”吗？",
    choices: [
      choice("march30-fate-coincidence", "不用。碰见了，就是碰见了。", { acceptance: 2, distance: 1 }, "电梯不知道谁在等它。\n\n门打开。\n她在那里。\n你也在那里。\n\n巧合已经足够发生。\n不需要负责解释以后。"),
      choice("march30-fate-name-it", "我知道可能只是巧合，可我还是想把它叫作有缘。", { holding: 2, closeness: 1 }, "那也可以。\n\n“有缘”不一定是在替历史下结论。\n\n有时候只是现在的你，\n给一个舍不得删掉的巧合取了名字。"),
      choice("march30-fate-unknown", "我不知道。我还是会想，如果不是巧合呢？", { avoidance: 1, holding: 1, closeness: 1 }, "这个问题已经不是三月三十号能回答的了。\n\n那一天没有留下证明。\n\n只有一扇打开的电梯门。\n\n至于为什么偏偏又遇见——\n这一次，可以先不知道。")
    ]
  }
];

export const march30RefinedChapter: ChapterDefinition = {
  id: "march30-too-fated",
  diaryEntryId: "authored-diary-march30-too-fated",
  runtimeScene: "330",
  date: "03.30",
  title: "Too Fated",
  mood: "a quiet morning that keeps reconstructing itself",
  weather: "clear corridor light",
  location: "330 Corridor",
  characters: ["Muji", "MS", "ET"],
  objects: ["bench", "elevator", "gift", "water gun", "Xiaoba charms", "jacket"],
  evidence: ["authored-330-corridor-scene-layout"],
  dialogue: [],
  canonicalClosure: {
    historicalEventId: "march30-bench-memory",
    lines: ["那天早上，她们在二楼道别。", "后来下一趟电梯打开，又遇见了。"]
  },
  reflectionQuotes: [
    {
      id: "march30-ordinary-morning",
      tone: "accepting",
      preference: { acceptance: 2, distance: 1, companionship: 1 },
      title: "Ordinary Morning",
      lines: [
        "那天可能真的没有什么特别的。",
        "礼物交换了。水枪喷了三下。一件 jacket 擦过湿掉的脸。",
        "然后说再见。后来又在电梯前碰见。",
        "事情发生的时候，它们都只是事情。"
      ],
      afterline: "三月三十号不需要提前知道以后。"
    },
    {
      id: "march30-still-call-it-fate",
      tone: "holding",
      preference: { holding: 2, closeness: 1 },
      title: "I Still Call It Fate",
      lines: [
        "我知道“太有缘”可能只是后来替那一天加上的名字。",
        "可是如果一定要记住那个早晨，我还是会记得——",
        "已经说过再见了。下一扇电梯门打开，又是她。"
      ],
      afterline: "巧合没有变。只是后来，我舍不得把它叫得太普通。"
    },
    {
      id: "march30-what-made-it-heavy",
      tone: "holding",
      preference: { honesty: 2, closeness: 1 },
      title: "What Made It Heavy",
      lines: [
        "也许真正变重的，从来不是三月三十号。",
        "那天的水还是那三下。jacket 也只是那一件 jacket。电梯也只开了一次。",
        "变的是后来回头看的人。",
        "因为知道了后来，才开始觉得当时每一个很小的动作，好像都值得重新看一遍。"
      ],
      afterline: "记忆没有改变过去。它只是改变了光落下来的地方。"
    },
    {
      id: "march30-no-answer-yet",
      tone: "not-ready",
      preference: { avoidance: 2, holding: 1 },
      title: "No Answer Yet",
      lines: [
        "我还是会想，为什么偏偏又遇见。",
        "为什么那三下水会留下来。为什么那件 jacket 会留下来。",
        "为什么那么多普通的早晨里，偏偏这一段没有被忘掉。",
        "但记忆走到这里，还是没有答案。"
      ],
      afterline: "有些问题可以一起带回去，不一定要留在三月三十号解决。"
    }
  ]
};