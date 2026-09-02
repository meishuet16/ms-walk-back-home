import type { ChapterDefinition, Choice, DiaryEntry, ReflectionChoice } from "../types.js";
import type { CutsceneAction } from "../systems/CutsceneSystem.js";
import type { AuthoredPortraitBeat, AuthoredPortraitSequence } from "../systems/MemoryPortraitPresentation.js";
import type { SceneLayout } from "../systems/SceneLayouts.js";

const portrait = (name: string): string => `assets/425/memory-portrait/${name}.png`;
const beat = (image: string, dialogue: Array<{ speaker: string; text: string }>): AuthoredPortraitBeat => ({ portrait: portrait(image), dialogue });
const memory = (text: string) => ({ speaker: "Memory", text });
const ms = (text: string) => ({ speaker: "我", text });
const et = (text: string) => ({ speaker: "她", text });
const friend = (text: string) => ({ speaker: "朋友", text });
const sharedFriend = (text: string) => ({ speaker: "那个共同朋友", text });
const angela = (text: string) => ({ speaker: "朋友", text });

export const april25MainPortraitSequence: AuthoredPortraitSequence = {
  id: "apr25-main",
  beats: [
    beat("echo-wait", [
      memory("傍晚骑脚车，要回的时候，我本来只是打算经过她宿舍楼下 装水了顺路去朋友房间。"),
      memory("结果一转进去。"),
      memory("远远就看到一个熟悉的身影。"),
      ms("哇塞。"),
      memory("今天竟然给我遇到了。")
    ]),
    beat("echo-wait", [
      et("我远远就看到一个骑脚车的身影。"),
      et("感觉是你。"),
      et("所以我就多等了一下。"),
      ms("好有缘哦。"),
      et("巧咯。来剪刘海。"),
      ms("真的假的 我满头大汗 wor。")
    ]),
    beat("echo-look", [
      memory("我去装水喝。"),
      memory("然后把脚车放在旁边。"),
      memory("她叫我去 lobby 里面坐。")
    ]),
    beat("echo-chat", [
      memory("她拍了一张我坐在她对面的照片发给朋友。"),
      memory("我也拍她坐在我对面的照片发给同个人。"),
      sharedFriend("。。。上一秒她才发给我罢了。"),
      memory("那个朋友叫她下次打羽球 jio 我。"),
      et("很 ok 啊。"),
      et("Jio 你去了一定很热闹。")
    ]),
    beat("echo-ig", [
      memory("然后她当着我的面看我发的单人照 IG Story。"),
      ms("。。。你可以不要当面鞭尸吗。"),
      memory("她看了我一眼，还是 like 了。"),
      et("哇，这是哪个天使。")
    ]),
    beat("echo-chat", [
      memory("过后我们又坐了一会。"),
      memory("她突然开口问"),
      et("你有什么话要讲吗？"),
      ms("蛤？"),
      ms("讲什么？"),
      ms("跟谁讲？"),
      et("跟我讲啊。"),
      et("八卦什么的。"),
      memory("后来我就跟她确认下一次爬山的时间。"),
      memory("本来还想 jio 她去别一个活动。"),
      memory("她其实 ok，也得空。"),
      memory("只是车程太远了。")
    ]),
    beat("echo-hair-start", [
      memory("然后就是剪刘海环节。"),
      memory("她带我去厕所剪。"),
      memory("她下手完全不犹豫。"),
      memory("我全程举着手机录 vlog。")
    ]),
    beat("echo-hair-02", [
      memory("剪到一半。"),
      memory("她突然对着我的脸吹气。"),
      memory("把碎头发吹走。"),
      ms("what。"),
      memory("她笑得很大声。。。")
    ]),
    beat("echo-hair-03", [
      memory("她的剪刀一直划过我的眉毛。"),
      memory("我很害怕。"),
      memory("一直皱着脸。"),
      et("不要皱着脸先。"),
      ms("我的眉毛。。。")
    ]),
    beat("echo-hair-04", [
      memory("大概十分钟就好了。"),
      memory("她看起来很满意她的试验品。")
    ]),
    beat("echo-bang", [
      et("可爱的刘海。"),
      ms("定位错了吧。"),
      ms("我要帅气。"),
      et("不要要求那么高。")
    ]),
    beat("echo-argue", [
      memory("回到 lobby 的时候遇到朋友。"),
      angela("很可爱的刘海。"),
      ms("错了错了。"),
      ms("我不要可爱。"),
      et("不要那么执着帅气风格。"),
      ms("你懂她刚才剪刀感觉要剪掉我的眉毛吗。"),
      et("什么。"),
      et("你一直皱着脸。")
    ]),
    beat("echo-ig", [
      memory("我顺便逼她 repost 我发的剪头发视频。"),
      memory("告诉她不 repost 就不让她回房间。"),
      memory("最后她勉强发了 CF story。"),
      et("这里有屁孩逼我转发。")
    ]),
    beat("echo-arm", [
      memory("我后来 show muscle 视频给她们看。"),
      memory("她一看到就要跟我掰手腕。"),
      memory("朋友帮我录。"),
      memory("然后她输了。"),
      et("哇佬 我的 muscle 没有你大粒。"),
      ms("哎哟。"),
      ms("你放水了。"),
      ms("我之前都没有赢过。"),
      et("那我就是你赢的第一个人。"),
      memory("然后她不服输。"),
      memory("换个位置又来一次。"),
      memory("又输了。"),
      ms("是角度问题吗。"),
      ms("不确定。")
    ]),
    beat("echo-argue", [
      et("不然现在比跑步。"),
      et("跑整个学校一圈。"),
      et("绝对可以拉爆你。")
    ]),
    beat("echo-wait", [
      ms("跑步我肯定被你拉爆。"),
      ms("我骑脚车你跑步就可以。"),
      memory("最后也没有真的跑。"),
      memory("散场以前我又约她明天剪头发。"),
      et("明天不可以 我要去练羽球。"),
      et("我和你认识的那个朋友报名混双了。")
    ]),
    beat("echo-arm", [
      ms("他约你就去。"),
      et("是比赛我就去啊。"),
      ms("那你放他飞机。"),
      ms("为什么你可以放我飞机，不可以放别人飞机。"),
      et("怎样放。"),
      et("给报名费了 ei。"),
      ms("haizz，又是他。"),
      et("怎么了？"),
      et("那个男生有黑历史吗？"),
      ms("也没什么。"),
      ms("只是一个感觉有点奇怪的男生。"),
      et("是朋友就快点告诉我。"),
      ms("没什么啦。"),
      et("那明天他如果要拉人打球，我可以拉你吗？"),
      ms("。。。")
    ]),
    beat("echo-invite", [
      memory("回到宿舍冲好凉。"),
      memory("那个男生还真的来找我。"),
      memory("还 mention 她也去。"),
      ms("欸 是你叫他问的吗？"),
      et("他要你啦。"),
      et("你来就可以陪我了哈哈哈。"),
      et("一起受苦。"),
      ms("什么鬼。"),
      ms("你提的是吗？"),
      et("他先提的。")
    ]),
    beat("echo-invite", [
      memory("。。。"),
      memory("剪头发视频一发。"),
      memory("好多 message。"),
      memory("群里也炸了。"),
      memory("大家都被震惊了。"),
      memory("感觉妈妈要打我了 把头发给别人剪"),
      memory("妈妈问我那是谁"),
      ms("我的一个朋友。")
    ])
  ]
};

export const april25PortraitSequences: Record<string, AuthoredPortraitSequence> = {
  "apr25-main": april25MainPortraitSequence,
  "apr26-badminton-companion": {
    id: "apr26-badminton-companion",
    beats: [
      beat("echo-badminton-arrival", [
        et("结果你最后还是来陪我了。"),
        ms("我来看你打罢了。"),
        et("你不要下场打吗？"),
        ms("我晕车了哦。"),
        et("去你的。")
      ]),
      beat("echo-badminton2", [
        et("你看这是什么。"),
        ms("好眼熟。"),
        ms("哇，是我送的 ACE 钥匙圈。"),
        et("挂在这里是不是很适合？"),
        ms("不适合。"),
        et("=_= 无语")
      ]),
      beat("echo-badminton", [
        memory("后来她知道我不喜欢开球。"),
        memory("还是一直把球留给我开。"),
        et("不要逃避了。来这粒也给你开。"),
        ms("。。。我谢谢你。")
      ])
    ]
  },
  "apr26-watermelon-juice": {
    id: "apr26-watermelon-juice",
    beats: [
      beat("echo-watermelon-01", [
        memory("打完球吃午餐的时候，她点了一杯西瓜汁。"),
        memory("说是叫给我喝的。"),
        et("你给我喝哦。"),
        ms("别急呀。"),
        ms("你等我吃完。"),
        et("快点喝。"),
        et("你不要拒绝我 ei。"),
        et("等下我伤心了，吃不下了。"),
        ms("你别急呀 你等我吞完我的食物先。"),
        memory("我吞完以后。")
      ]),
      beat("echo-watermelon", [
        memory("她直接把西瓜汁送到我嘴边。"),
        et("你要我喂你是吗？"),
        et("来。"),
        et("公主请喝水。"),
        memory("只有一根吸管。"),
        memory("我最后还是喝了。")
      ])
    ]
  },
  "apr26-car-introvert": {
    id: "apr26-car-introvert",
    beats: [
      beat("echo-introvert", [
        et("怎样，今天什么感想？"),
        ms("啥感想？"),
        et("为什么你今天这么安静？"),
        ms("我是大i人啊。"),
        ms("而且我跟他也是第一次见 ei。"),
        et("屁啦。"),
        et("你对着我又不看你i。"),
        ms("嘿嘿。")
      ])
    ]
  },
  "apr26-st-room": {
    id: "apr26-st-room",
    beats: [
      beat("echo-guilty", [
        friend("你觉得你们现在是什么关系？"),
        ms("朋友。"),
        memory("然后我开始讲我真正介意的东西。"),
        ms("我觉得很愧疚。"),
        ms("我觉得对她不公平。"),
        memory("朋友好像并不这样觉得。"),
        memory("她说，我的想法不一定就是对方的想法。"),
        memory("她也说，也许事情不一定只有我想的那一种。"),
        memory("她让我去确认清楚。")
      ]),
      beat("echo-guilty", [
        ms("可是问了又如何。"),
        ms("朋友就是朋友。"),
        memory("最后我在她房间坐了三个小时。"),
        memory("想到最后还是想不通。"),
        memory("半夜十二点才骑脚车回自己房间。")
      ])
    ]
  }
};

const choice = (id: string, label: string, effects: Choice["effects"], response: string): ReflectionChoice => ({ id, label, effects, response });

export const april25ReflectionChoices: Array<{ id: string; prompt: string; choices: ReflectionChoice[] }> = [
  {
    id: "apr25-reflection-waited",
    prompt: "她说，远远觉得那个骑脚车的人像我。\n所以多等了一下。\n\n现在想起这件事，我最想留下哪一部分？",
    choices: [
      choice("apr25-waited-simple", "她只是等了我一下。这样就够了。", { acceptance: 1, companionship: 1 }, "她没有说为什么这件事应该特别。\n\n只是认出一个身影以后，没有马上走。"),
      choice("apr25-waited-happy", "我确实因为她等了而开心。", { closeness: 1, honesty: 1 }, "那时候我骑进去，看见她还在那里。\n\n开心这件事，不需要先知道她为什么等。"),
      choice("apr25-waited-question", "我还是会想，她为什么愿意多等一下。", { holding: 1, closeness: 1 }, "最后的最后还是只留下她自己当时的答案：\n\n“感觉是你。”\n\n再后面的，没有答案。")
    ]
  },
  {
    id: "apr25-reflection-small-things",
    prompt: "那两天后来留下来的，\n是一口气、一根吸管、几句玩笑，\n还有很多人问：“你们现在什么关系？”",
    choices: [
      choice("apr25-small-things-no-label", "不需要替每个动作取一个名字。", { acceptance: 1, honesty: 1 }, "头发吹走了。\n\n西瓜汁也喝完了。\n\n它们先只是这样发生过。"),
      choice("apr25-small-things-mattered", "对我来说，它们确实不普通。", { closeness: 1, holding: 1, honesty: 1 }, "别人看见的是十几秒的视频。\n\n我记住的，却是她说“不要皱着脸先”的时候。"),
      choice("apr25-small-things-step-back", "就是因为在意，我才会想退远一点。", { avoidance: 1, distance: 1, concealment: 1 }, "那两天最奇怪的地方，大概就是这样。\n\n刚刚还很开心。\n\n安静下来以后，又想往后退。")
    ]
  },
  {
    id: "apr26-reflection-guilt",
    prompt: "那晚我说：\n\n“她对我越好，我越愧疚。”",
    choices: [
      choice("apr26-guilt-feeling", "我把自己的感觉，当成了对她的冒犯。", { honesty: 1, acceptance: 1 }, "我那晚一直在替一件没有说出口的事道歉。\n\n可是她当时没有给它定过罪。"),
      choice("apr26-guilt-want-more", "我怕我想要的，比好朋友多。", { honesty: 1, closeness: 1, holding: 1 }, "“好朋友或许是的。”\n\n难的是后面那半句。\n\n我一直没有说。"),
      choice("apr26-guilt-dont-know", "我不知道她怎么想，所以那时候宁愿不动。", { avoidance: 1, concealment: 1, distance: 1 }, "那晚我没有去问她。\n\n半夜十二点以后，还是带着疑问自己骑脚车回宿舍。")
    ]
  }
];

export const april25EchoPortraitSequenceIds: Record<string, string> = {
  "badminton-companion-echo": "apr26-badminton-companion",
  "watermelon-juice-echo": "apr26-watermelon-juice",
  "car-introvert-echo": "apr26-car-introvert",
  "st-room-echo": "apr26-st-room"
};

export const april25EchoAvailability: Record<string, { requiresMainCompletion?: boolean; requiresEchoIds?: string[] }> = {
  "badminton-companion-echo": { requiresMainCompletion: true },
  "watermelon-juice-echo": { requiresMainCompletion: true },
  "car-introvert-echo": { requiresMainCompletion: true },
  "st-room-echo": { requiresMainCompletion: true }
};

export const april25EchoAnchors: Record<string, string> = Object.fromEntries(Object.keys(april25EchoPortraitSequenceIds).map((id) => [id, id]));
export const april25Assets = {};

export function resolveApril25Actions(_layout: SceneLayout, _mode: "main" | "echo", _echoId = ""): CutsceneAction[] {
  return [];
}

export const april25Chapter: ChapterDefinition = {
  id: "april25-just-good-friends",
  diaryEntryId: "authored-diary-april25-just-good-friends",
  runtimeScene: "425",
  date: "04.25–04.26",
  title: "只是朋友",
  mood: "quiet",
  weather: "晴",
  location: "April 26 memory residues",
  characters: ["MS", "ET", "friends"],
  objects: ["bicycle", "scissors", "badminton bag", "watermelon juice"],
  evidence: ["approved-425-portrait-world", "approved-425-landscape-world", "approved-425-memory-portraits"],
  dialogue: [],
  canonicalClosure: {
    historicalEventId: "apr25-main-memory",
    lines: [
      "4 月 26 日晚上，我在朋友房间待到凌晨十二点。",
      "那时候我仍然把我们叫作“好朋友”。",
      "我始终没有去问，她怎么看这段关系。"
    ]
  },
  reflectionQuotes: [
    {
      id: "apr25-accepting",
      tone: "accepting",
      preference: { acceptance: 2, companionship: 1 },
      lines: ["那两天后来没有被证明成什么。", "但也没有因此变得比较少。"],
      afterline: "刘海还是剪了。第二天我也还是去了。"
    },
    {
      id: "apr25-holding",
      tone: "holding",
      preference: { holding: 2, closeness: 1 },
      lines: ["我还是会记得她说，", "远远觉得那个骑脚车的人像我。"],
      afterline: "所以她多等了一下。"
    },
    {
      id: "apr25-not-ready",
      tone: "not-ready",
      preference: { avoidance: 2, distance: 1, concealment: 1 },
      lines: ["那晚我想了很多种退后的方法。", "最后哪一种也没有说给她听。"],
      afterline: "只是那天半夜，我还是没有思考出答案"
    },
    {
      id: "apr25-honest-without-answer",
      tone: "rewriting",
      preference: { honesty: 2 },
      lines: ["我可以承认，那时候我的感觉或许是真的。", "至于她怎么想，那两天没有答案。"],
      afterline: "未来好在还是未来。"
    }
  ]
};

export const april25DiaryBody = [
  "04.25–04.26 · Just Friends",
  "那两天其实没有发生什么很大的事情。",
  "四月二十五号中午醒来的时候，第一条听见的是你的语音。你说，早安，你的饭团到了。我还很认真地问，你怎么知道。",
  "后来才想起来，那阵子我好像常常买。名字一次又一次出现在订单里面，被你看见，也不是什么奇怪的事。",
  "晚上我去骑脚车。骑完以后，本来只是想去你宿舍楼下装水，再去找别人。",
  "转进去的时候，远远看见一个很熟悉的人。",
  "你说，你也是远远看到一个骑脚车的人，觉得好像是我，所以多等了一下。",
  "我第一反应还是那句。",
  "好有缘哦。",
  "那时候我很喜欢把这种事情叫作缘分。",
  "后来才觉得，也许真正让我开心的，从来不是刚好遇见。",
  "是你本来可以走，却因为觉得那个人可能是我，所以多站了一会儿。",
  "我们后来坐在 lobby 聊天。你拍我，我也拍你。你当着我的面看我发的照片，还留言说，这是哪个天使。",
  "我嘴上一直嫌你烦。",
  "其实也没有真的想让你停。",
  "后来你突然说，要帮我剪刘海。",
  "我刚骑完脚车，满头都是汗，还是跟着你去了厕所。你拿着剪刀下手一点都不犹豫，我却一直担心自己的眉毛会不会顺便一起消失。",
  "碎头发落在脸上的时候，你很自然地凑过来，对着我的脸吹了一口气。",
  "我愣了一下。",
  "你已经在笑了。",
  "好像刚才什么都没有发生。",
  "可能真的什么都没有发生。",
  "剪完以后，你很满意，说很可爱。",
  "我说，我要的是帅气。",
  "后来朋友来了，也说可爱。你们两个像讲好的一样，我一个人坚持了半天，最后还是没有人理。",
  "再后来你看到我练 muscle 的视频，突然要跟我掰手腕。",
  "第一次输了，你不服，换了位置又来一次。",
  "还是输。",
  "你说，我是第一个赢你的人。",
  "那天的视频后来被别人看见。",
  "有人问我，我们两个到底是什么关系。",
  "我说，只是好朋友。",
  "那时候我应该是真的这样觉得。",
  "至少我不知道还能叫什么。",
  "第二天，我还是去了球场。",
  "其实前一晚睡得很迟，早上起来也很累。上车以后还晕车。你坐在副驾驶，我一路都觉得自己到底为什么要来。",
  "到了球场，一进门就看见你。",
  "你也看见我。",
  "然后我们两个不知道为什么先笑了。",
  "你说：结果你最后还是来陪我了。",
  "我马上说，我只是来看你打罢了。",
  "那时候我好像很喜欢把一些东西说轻一点。",
  "陪就是陪。",
  "偏偏要说只是来看。",
  "想来就是想来。",
  "又总觉得应该顺便找一个别的理由。",
  "后来你问我为什么天天吃饭团。你说，每天整理订单都看到我的名字，还很认真地谢谢我支持。",
  "我也不知道为什么连续买了那么多天。",
  "可能真的只是好吃。",
  "只是现在想起来觉得很好玩。",
  "一个人的名字出现在另一个人的生活里，有时候就是从这种很无聊的地方开始。",
  "一张订单。",
  "一条语音。",
  "一句早安。",
  "然后某一天，对方已经知道那个名字今天又出现了。",
  "后来你突然给我看你的羽球 bag。",
  "上面挂着我以前送你的 Ace 钥匙圈。",
  "你问，挂在这里是不是很适合。",
  "我说，不适合。",
  "你白了我一眼。",
  "其实很适合。",
  "我只是那时候不知道为什么，不太想让你发现，我看到它还在那里，会有一点开心。",
  "后来真的下场打球。",
  "六个人里面五个人都在为了比赛练习，只有我是来玩的。结果最后打最久的好像也是我。",
  "你一直叫我不要把球打那么高，又一直逼我练开球。",
  "我说，我又没有比赛。",
  "你说，下次。",
  "双打的时候，你知道我会逃开球，所以一直把机会留给我。",
  "你说，不要逃避了。",
  "那时候当然只是在讲羽球。",
  "我也只是觉得你很烦。",
  "后来再想起这句话，才发现那阵子的我确实很会逃。",
  "不太敢承认自己为什么那么想来。",
  "不太敢承认为什么你说“陪我”，我会记那么久。",
  "不太敢承认一个钥匙圈还挂在你的 bag 上，居然也可以让我开心。",
  "不过这些都是后来才有的答案。",
  "那时候我只是继续打球。",
  "打完以后，我们去买水。你说请我喝，我说我不喝饮料。",
  "你还是买了。",
  "第一次让我喝的时候，我还很小心，没有碰到瓶口。",
  "后来去吃 Arabic food，你又点了西瓜汁，说是给我喝的。",
  "我一直拖，说等我吃完。",
  "你隔一会儿就把杯子推回来，说快点喝，不要拒绝你，不然你会伤心到吃不下。",
  "最后你直接把西瓜汁送到我面前。",
  "你说，你要我喂你是吗。",
  "来，公主请喝水。",
  "我看了一眼那根已经被你用过的吸管。",
  "停了一下。",
  "然后还是喝了。",
  "那时候我只觉得，你这个 e 人攻势实在太猛，我招架不住。",
  "现在想起来，真正让我招架不住的可能从来不是那杯西瓜汁。",
  "是你做很多事情的时候都太自然了。",
  "自然到我不知道哪些事情值得记，哪些其实根本没有别的意思。",
  "你会在我下场以后走过来，抓着我的肩膀念我。",
  "经过的时候又顺手揉乱我的头发，说这个刘海真的很可爱。",
  "你记得我平时没有那么安静，所以那天回程车上还问我今天怎么了。",
  "我说，我本来就是 i 人。",
  "你说：屁啦，你对着我又不看你 i。",
  "我只会嘿嘿。",
  "其实那句话也没有错。",
  "有些人不会真的把你变成另外一种人。",
  "只是她在的时候，你好像比较愿意往外走一点。",
  "后来我又想起前一天别人问我的那个问题。",
  "我们到底是什么关系。",
  "如果那时候再问一次，我大概还是会回答一样。",
  "朋友。",
  "因为那些事情本来就可以发生在朋友之间。",
  "等一个人一下，替她剪头发，挂着她送的东西，陪她打球，把饮料推过去，顺手揉乱她的头发。",
  "没有哪一件事情单独拿出来，可以证明什么。",
  "我也不想替那时候的你，把它们改写成别的意思。",
  "只是很奇怪。",
  "为什么那么多普通的小事，后来偏偏都没有忘。",
  "我记得你远远认出脚车上的我。",
  "记得脸上的碎头发。",
  "记得那个 Ace 还挂在那里。",
  "记得你说，结果你最后还是来陪我了。",
  "记得一杯被推回来很多次的西瓜汁。",
  "甚至记得那根吸管。",
  "可能那时候真正开始改变的，并不是我们之间的关系。",
  "只是我看你的方式。",
  "朋友这个答案一直都没有错。",
  "只是从那两天开始，",
  "我好像第一次发现，",
  "有些朋友，会被记得比别的朋友仔细一点。"
];

export const april25DiaryEntry: DiaryEntry = {
  id: "authored-diary-april25-just-good-friends",
  source: "authored",
  date: "2026-04-25",
  title: "04.25–04.26 · Just Friends",
  body: april25DiaryBody.join("\n\n"),
  location: "April 26 memories",
  weather: "晴",
  memoryKind: "chapter",
  mood: "quiet",
  chapterId: april25Chapter.id,
  photos: [],
  scrapbookLayout: { elements: [] }
};
