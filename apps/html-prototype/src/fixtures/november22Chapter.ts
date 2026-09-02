import type { ChapterDefinition, Choice, DiaryEntry, ReflectionChoice } from "../types.js";
import type { AuthoredPortraitBeat, AuthoredPortraitSequence } from "../systems/MemoryPortraitPresentation.js";

const portrait = (filename: string): string => `assets/1122/memory-portrait/${filename}`;
const beat = (filename: string, dialogue: Array<{ speaker: string; text: string }>): AuthoredPortraitBeat => ({
  portrait: portrait(filename),
  dialogue
});
const memory = (text: string) => ({ speaker: "Memory", text });
const ms = (text: string) => ({ speaker: "我", text });
const et = (text: string) => ({ speaker: "她", text });
const friend = (text: string) => ({ speaker: "朋友", text });

export const november22MainPortraitSequence: AuthoredPortraitSequence = {
  id: "1122-main",
  beats: [
    beat("echo-hi.png", [
      memory("那天早上考完试出来，朋友都在哀嚎考题的抽象程度"),
      memory("我蹲在地上逗椅子底下的猫"),
      memory("结果一转头看到一个熟悉的身影"),
      memory("大脑当机了几秒 愣了几秒才认出彼此"),
      memory("今天竟然给我遇到了。")
    ]),
    beat("echo-bye.png", [
      et("怎样 刚刚考试 ok 吗？"),
      ms("不 ok。"),
      et("蛤，怎样不 ok 勒？"),
      memory("我指了指另一个刚刚在哀嚎的朋友"),
      ms("你问她就懂了。"),
      memory("然后其中一个朋友当场拆台。"),
      friend("你知道吗。她一个小时多就很快做完。"),
      friend("然后开始东张西望了。"),
      friend("她还讲她不会做。屁勒。"),
      ms("emmm……ok..."),
      ms("考得挺好的。"),
      ms("假笑.jpg"),
      et("ok就好。"),
      memory("她离开后，朋友都让我收一收那不值钱的笑容"),
      friend("你不要再笑了。"),
      friend("收敛一点。")
    ]),
    beat("echo-drop.png", [
      memory("然后我开始思考。"),
      memory("气泡水什么时候要给她。"),
      memory("其实刚才见面的时候也可以当面给。"),
      memory("但是我想了一下。"),
      ms("……"),
      memory("算了。"),
      memory("还是按照原计划。"),
      memory("去她宿舍楼下。"),
      memory("放脚车后篮。")
    ]),
    beat("echo-drop.png", [
      memory("本来计划午餐回来放的"),
      memory("结果计划落空。")
    ]),
    beat("echo-drop.png", [
      ms("……"),
      memory("没关系。"),
      memory("还有晚上。"),
      memory("非常小算盘.jpg。")
    ]),
    beat("echo-drop.png", [
      memory("晚上终于去到目的地。"),
      memory("在一群 motor 里面找了一下。"),
      memory("找到目标脚车了。"),
      memory("然后我很快速地——"),
      memory("放进去。"),
      memory("走人。"),
      memory("空投计划，通。")
    ]),
    beat("echo-drop.png", [
      ms("我可真是个甜菜。")
    ])
  ]
};

export const november22PortraitSequences: Record<string, AuthoredPortraitSequence> = {
  "1122-main": november22MainPortraitSequence,
  "1122-dark-corridor": {
    id: "1122-dark-corridor",
    beats: [beat("echo-corridor.png", [
      memory("回到宿舍。"),
      memory("我吃饱太得空。"),
      memory("突然走去 dobi 看有没有人洗衣。"),
      memory("穿过那条又长又暗的走廊。"),
      memory("去到 dobi。"),
      memory("很多人。"),
      memory("ok。没有我的份。"),
      ms("……"),
      memory("于是我又灰溜溜回去。"),
      memory("路途太阴森，回程我用跑的。"),
      memory("然后。"),
      memory("她开始跟我讲鬼故事。"),
      ms("……"),
      memory("而且那些故事的场景。"),
      memory("跟我每天的必经之路。"),
      memory("完美重叠。"),
      ms("……"),
      memory("我要碎掉了。")
    ])]
  },
  "1122-dobi-invite": {
    id: "1122-dobi-invite",
    beats: [beat("echo-car-02.png", [
      et("我明天也要去 dobi 洗衣。"),
      ms("哇那你可以顺便也帮我拿去洗。"),
      et("如果你要我是 ok 的哦。"),
      et("我早上五点去洗。"),
      ms("……"),
      ms("这是什么阴间时间。"),
      et("dobi 没人的时间。"),
      et("我等下开车来你的 blok 载你。"),
      ms("真的早上五点吗 bruhh。"),
      et("看你。"),
      et("没人拿枪逼你。"),
      ms("很乐意。"),
      ms("快拿枪逼我。"),
      et("有人乐意就好。"),
      et("嘻嘻。"),
      memory("凌晨四点五十分。"),
      et("起床了吗"),
      ms("还醒着"),
      et("哈哈哈哈"),
      memory("然后她真的开车来了。"),
      et("你没睡吗？"),
      ms("这个作息很正常呀嘻嘻。"),
      et("哇，我至少有睡到。"),
      memory("开到路口的时候，她突然想起昨天的事。"),
      et("诶，我昨天讲的话，你不要放心上诶。"),
      ms("……"),
      memory("我想了一下才反应过来她再说鬼故事的事情。"),
      ms("太迟了。\n已经放心上了。"),
      memory("我看着她把车开出 KTF。"),
      memory("看了一会儿。"),
      et("诶。"),
      et("我要去哪里？"),
      ms("我也在思考。"),
      et("真是 der。\n你怎么不提醒我？"),
      ms("我以为你这么做一定有自己的道理。\n有自己的想法。嘻嘻。"),
      et("屁啦。"),
      memory("然后我们又 U-turn 回去了。")
    ])]
  },
  "1122-car-mbti": {
    id: "1122-car-mbti",
    beats: [beat("echo-car-02.png", [
      ms("诶，你 MBTI 是什么？"),
      et("ENTJ。"),
      et("铁 E。"),
      et("铁 J。"),
      et("不会变的。"),
      et("但是我不是那种会主动跟陌生人讲话、\n对陌生人很 friendly 的人。"),
      et("我是主动高冷。"),
      ms("不是啊。"),
      ms("你连高冷都看起来那么 cute。"),
      et("什么！！"),
      memory("然后就到了。"),
      memory("我回房间躺着了。")
    ])]
  },
  "1122-wrong-way-again": {
    id: "1122-wrong-way-again",
    beats: [beat("echo-car-02.png", [
      memory("我又看着她把车开出了宿舍区。"),
      ms("你又要去哪儿呀？"),
      et("诶。"),
      et("哎呀，我又在干什么。"),
      et("你怎么不提醒我？"),
      ms("again。"),
      ms("你一定有自己的想法。"),
      et("noooooo。"),
      et("我没有自己的想法呜呜呜。"),
      ms("早知道我等你载我回你的宿舍才提醒你。"),
      et("喂！！！")
    ])]
  },
  "1122-memory-laundry-pods": {
    id: "1122-memory-laundry-pods",
    beats: [beat("echo-dobi01.png", [
      memory("到了 dobi。"),
      et("完了。\n我没带洗衣液。"),
      ms("我有洗衣球。"),
      memory("我本来只想给她一粒。结果投了三粒。"),
      ms("……"),
      et("……"),
      memory("不知道为什么。"),
      memory("我们两个突然都莫名其妙的笑了。")
    ])]
  },
  "1122-dobi-conversation": {
    id: "1122-dobi-conversation",
    beats: [
      beat("echo-dobi02.png", [
        memory("其实也没有什么特别重要的话题。"),
        memory("只是衣服一直在转。"),
        memory("我们就一直坐在那里。"),
        memory("天也差不多亮了。")
      ]),
      beat("echo-dobi04.png", [
        memory("她的衣服洗好了。"),
        memory("但是我的还没烘干好。"),
        memory("所以我们继续等。")
      ])
    ]
  },
  "1122-memory-empty-room-rain": {
    id: "1122-memory-empty-room-rain",
    beats: [
      beat("echo-empty-room.png", [
        memory("学校突然变得很空。全部人都回家了。"),
        memory("我本来应该做 project。"),
        memory("但是完全不想动。")
      ]),
      beat("echo-photo-kept.png", [
        memory("早上明明还很开心。"),
        memory("下午突然就没电了。")
      ])
    ]
  }
};

export const november22EchoPortraitSequenceIds: Record<string, string> = {
  "dark-corridor": "1122-dark-corridor",
  "dobi-invite": "1122-dobi-invite",
  "car-mbti": "1122-car-mbti",
  "wrong-way-again": "1122-wrong-way-again",
  "memory-laundry-pods": "1122-memory-laundry-pods",
  "dobi-conversation": "1122-dobi-conversation",
  "memory-empty-room-rain": "1122-memory-empty-room-rain"
};

export const november22EchoAnchors: Record<string, string> = Object.fromEntries(
  Object.keys(november22EchoPortraitSequenceIds).map((id) => [id, id])
);

export const november22EchoAvailability: Record<string, { requiresMainCompletion?: boolean }> = Object.fromEntries(
  Object.keys(november22EchoPortraitSequenceIds).map((id) => [id, { requiresMainCompletion: true }])
);

const choice = (id: string, label: string, effects: Choice["effects"], response: string): ReflectionChoice => ({ id, label, effects, response });

export const november22ReflectionChoices: Array<{ id: string; prompt: string; choices: ReflectionChoice[] }> = [
  {
    id: "1122-reflection-morning",
    prompt: "现在回头看，那天早上为什么留得这么清楚？",
    choices: [
      choice("1122-connection-morning", "因为她真的来了。", { closeness: 1, companionship: 1 }, "五点很早。\n洗衣也没什么特别。\n可她真的把车开过来了。"),
      choice("1122-acceptance-morning", "因为那几个小时很普通。", { acceptance: 1 }, "没有什么需要纪念的大事。\n洗衣、等衣服、聊早餐、聊作业。\n也许正因为这样，才一直记得。"),
      choice("1122-uncertainty-morning", "因为那时候的我太开心了。", { avoidance: 1, concealment: 1 }, "开心是真的。\n后来的害怕也是真的。\n它们不需要互相证明谁才是真的。")
    ]
  },
  {
    id: "1122-reflection-warning",
    prompt: "后来我为什么那么快开始警告自己？",
    choices: [
      choice("1122-guarded-warning", "我怕自己越来越陌生。", { distance: 1, honesty: 1 }, "那时候的我已经注意到了自己的重心在移动。\n注意到，不代表已经失去自己。"),
      choice("1122-uncertainty-warning", "我怕快乐不是我的。", { avoidance: 1, concealment: 1 }, "好像只要快乐来自别人，就必须赶快收回来一点。\n可一段共同发生的时间，本来就会属于两个人。"),
      choice("1122-acceptance-warning", "我只是太累了。", { acceptance: 1 }, "三点起床、五点出门、睡眠不足、朋友离开、整天下雨。\n有些空虚，也许真的没有那么宏大的答案。")
    ]
  },
  {
    id: "1122-reflection-meaning",
    prompt: "那我现在还需要知道，那些事对她意味着什么吗？",
    choices: [
      choice("1122-connection-meaning", "想知道。", { closeness: 1 }, "想知道没有错。\n只是那一天本身已经不会因此改变。"),
      choice("1122-acceptance-meaning", "不知道也可以。", { acceptance: 1 }, "她为什么等、为什么来、为什么留下。\n有些答案没有被写下来。\n发生过的部分已经够完整。"),
      choice("1122-guarded-meaning", "我更想知道，那时候的我为什么那么害怕。", { distance: 1, honesty: 1 }, "她留下了几个小时。\n我却已经开始练习怎么把自己往回拉。\n也许真正需要重新看的，一直是这一边。")
    ]
  }
];

export const november22Chapter: ChapterDefinition = {
  id: "1122-before-sunrise",
  diaryEntryId: "authored-diary-november22-before-sunrise",
  runtimeScene: "1122",
  date: "11.21–11.22",
  title: "Before Sunrise",
  mood: "a real morning without a required meaning",
  weather: "rain into the quiet before dawn",
  location: "dobi",
  characters: ["Muji", "MS", "ET", "朋友"],
  objects: ["sparkling water", "bicycle basket", "car", "laundry pods", "washing machine"],
  evidence: ["approved-1122-portrait-world", "approved-1122-landscape-world", "approved-1122-memory-portraits"],
  dialogue: [],
  canonicalClosure: {
    historicalEventId: "1122-main-memory",
    lines: [
      "那天，凌晨五点的开心是真的。",
      "下午一个人的空虚也是真的。",
      "意识到自己不想把全部安全感压在别人身上，这也是真的。",
      "但这三件事不需要互相定罪。"
    ]
  },
  reflectionQuotes: [
    {
      id: "1122-connection-heavy",
      tone: "holding",
      preference: { closeness: 1, companionship: 1 },
      lines: ["「后来最先忘掉的，反而不是五点。」"],
      afterline: "那个凌晨，我们一起等到衣服洗完，然后各自回去了。"
    },
    {
      id: "1122-acceptance-heavy",
      tone: "accepting",
      preference: { acceptance: 1 },
      lines: ["「洗衣机转了很久。我们也就坐在那里。」"],
      afterline: "原来很开心的一天，也可以安静得很快。"
    },
    {
      id: "1122-uncertainty-heavy",
      tone: "not-ready",
      preference: { avoidance: 1, concealment: 1 },
      lines: ["「我还是不知道那些事是什么意思。」"],
      afterline: "也许那天没有那么复杂。我只是很累，也真的很开心。"
    },
    {
      id: "1122-guarded-heavy",
      tone: "rewriting",
      preference: { distance: 1, honesty: 1 },
      lines: ["「那天早上很开心。下午也确实很空。」"],
      afterline: "有些落差，不一定是谁拿走了什么。"
    }
  ]
};

export const november22DiaryBody = [
  "11.21–11.22 · Before Sunrise",
  "那两天一直下雨。",
  "十一月二十一号早上，我去考试。写得很快，剩下的时间只能坐在那里东张西望。考完以后，大家都在复盘题目，我蹲在小卖部外面玩猫，然后抬头看见你走过来。",
  "我愣了几秒才打招呼。旁边的人马上开始笑，说我的笑容太不值钱。后来你准备走的时候，又绕回来问我考试怎么样。你走以后，她们告诉我，你刚才好像特地在等我跟你说拜拜。",
  "我不知道她们有没有看得太多。",
  "只记得自己听完以后，又笑了一下。",
  "下午我一直带着一瓶气泡水。原本可以当面给你，却不知道为什么觉得那样太正式，所以还是按照原计划，想偷偷放进你的脚车后篮。",
  "那瓶明明“不是特地送你的”气泡水，就这样跟着我唱 K、吃饭，再一路回到学校。朋友看不下去，问我为什么一直带着。",
  "我还是说，没什么。",
  "晚上终于去了你宿舍楼下。我在一排 motor 里面找到脚车，把气泡水和一张小纸条放进后篮，然后很快走掉。",
  "后来回宿舍，我一个人经过很暗的走廊，越走越怕，最后直接跑起来。你看到我发的 status，很快问我回到宿舍了吗。",
  "聊着聊着，说到了洗衣。",
  "你说，明天早上五点去 dobi。",
  "我开玩笑叫你顺便帮我洗。",
  "你说，可以啊。",
  "还说可以开车来载我。",
  "我问，真的五点吗。",
  "你说，看你，没人拿枪逼你。",
  "我说，很乐意，快拿枪逼我。",
  "那时候我大概只把它当成一句很好玩的玩笑。",
  "后来我去冲凉。出来以后，看见你发来一张照片。",
  "是那瓶气泡水。",
  "你写：喂！！！",
  "再后来，你发现里面还有纸条，把它发到动态，说被治愈了。",
  "我看着手机偷笑。",
  "那天晚上没有睡多少。",
  "凌晨4:50，你发消息来。",
  "起床了吗。",
  "我回，还醒着。",
  "然后你真的开车来了。",
  "天还没有亮，学校很安静。我们去 dobi，把衣服丢进洗衣机，然后坐下来等。",
  "你提起前一天的空投，问我到底怎样偷偷放进去的。又问我是不是也喜欢小八。",
  "我没有很会回答。",
  "因为有些东西，那时候连我自己都还没有想清楚。",
  "洗衣机一直转。",
  "我们就坐在那里聊天。聊一些很普通的东西，功课、比赛、早餐，还有之后要做什么。",
  "后来你的衣服洗好了，你却没有马上走。",
  "你坐在那里，等我的衣服烘完。",
  "其实你完全可以先回去。",
  "我那时候甚至想过，要不要主动叫你走。",
  "最后还是没有说。",
  "有一点不好意思。",
  "又有一点，不想那个早上那么快结束。",
  "回去的时候，天已经亮了。",
  "我后来想，这两天其实也没有发生什么很特别的事情。",
  "只是前一天，我偷偷给你留了一点东西。",
  "第二天，天还没亮，你真的来了。",
  "没有谁说这代表什么。",
  "它也不一定代表什么。",
  "只是那时候的我，好像已经开始把这种很普通的事情，记得比别的事情清楚一点。",
  "下午大家陆续回家以后，宿舍忽然变得很空。早上的开心退下去，我一个人待在房间，第一次认真提醒自己：",
  "不要把太多情绪放在一个人身上。",
  "我那时候已经知道这个道理。",
  "只是还没有很会做到。",
  "毕竟有时候，一天变得很好，并不是因为发生了什么了不起的事情。",
  "只是因为一句前一天说过的话，",
  "第二天真的有人记得。"
];

export const november22DiaryEntry: DiaryEntry = {
  id: "authored-diary-november22-before-sunrise",
  source: "authored",
  date: "2025-11-21",
  title: "11.21–11.22 · Before Sunrise",
  body: november22DiaryBody.join("\n\n"),
  location: "dobi",
  weather: "rain into the quiet before dawn",
  memoryKind: "chapter",
  mood: "quiet",
  chapterId: november22Chapter.id,
  photos: [],
  scrapbookLayout: { elements: [] }
};
