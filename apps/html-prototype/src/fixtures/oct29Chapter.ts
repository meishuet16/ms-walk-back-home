import type { ChapterDefinition, DiaryEntry, ReflectionChoice } from "../types.js";
import type { AuthoredPortraitBeat, AuthoredPortraitSequence } from "../systems/MemoryPortraitPresentation.js";

const portrait = (filename: string): string => `assets/1029/memory-portrait/${filename}`;
const beat = (filename: string, dialogue: Array<{ speaker: string; text: string }>): AuthoredPortraitBeat => ({
  portrait: portrait(filename),
  dialogue
});
const memory = (text: string) => ({ speaker: "Memory", text });
const ms = (text: string) => ({ speaker: "我", text });
const et = (text: string) => ({ speaker: "她", text });

export const oct29MainPortraitSequence: AuthoredPortraitSequence = {
  id: "oct29-main",
  beats: [
    beat("main-arrival.png", [
      memory("那天下午其实很累。"),
      memory("四点多还是爬起来去羽球 training。"),
      memory("一走进去。"),
      memory("大家打球都很有力。"),
      ms("……"),
      memory("我很快就得出了一个结论。"),
      ms("完了。"),
      ms("我应该是这里最菜的那个。"),
      memory("而且我穿的是 hiking 鞋。"),
      ms("很好。"),
      ms("非常专业。")
    ]),
    beat("main-single-challenge.png", [
      memory("一开始跟其他人打了一下。"),
      memory("然后她过来问我。"),
      et("你要打 single 还是 double？"),
      ms("prefer single。"),
      memory("她看了我一下。"),
      et("我也要 single。"),
      et("so kita kena lawan。"),
      et("sape menang dia dapat。"),
      ms("……"),
      memory("我突然觉得。"),
      memory("single 好像也没有那么值得坚持。"),
      ms("其实给你也可以。"),
      ms("真的。")
    ]),
    beat("main-training.png", [
      memory("然后她就开始训练我。"),
      memory("教我开球。"),
      memory("教我放球。"),
      memory("还有——"),
      memory("疯狂偷我后场。"),
      ms("呜呜呜。"),
      ms("我最讨厌后场了。"),
      et("跑起来。"),
      memory("她体力很好。"),
      memory("球也很有力。"),
      memory("我这个野生羽球人已经开始汗流浃背。")
    ]),
    beat("main-cant-hear.png", [
      memory("然后我发现另外一件事。"),
      memory("她讲话很小声。"),
      memory("偏偏球场又很吵。"),
      et("……"),
      ms("蛤？"),
      memory("我完全没有听到。"),
      memory("所以往前走了一点。")
    ]),
    beat("main-closer.png", [
      et("刚才那粒不错。"),
      ms("蛤？"),
      memory("还是听不清。"),
      memory("于是。"),
      memory("再走近一点。"),
      ms("你刚才讲什么？")
    ]),
    beat("main-good-job.png", [
      et("很棒。"),
      memory("她又重复了一次。"),
      et("很棒。"),
      memory("然后给了我一个大拇指。"),
      ms("……"),
      ms("不要 pua 我。"),
      memory("明明刚刚还一直被她偷后场。"),
      memory("跑又跑不过。"),
      memory("鞋又痛。"),
      ms("到底哪里很棒。")
    ]),
    beat("main-training-continue.png", [
      memory("后来她又夸了几次。"),
      memory("我还是经常听不见。"),
      et("……"),
      ms("蛤？"),
      memory("然后还是会走过去一点。"),
      memory("现在已经记不得。"),
      memory("那天下午到底这样走过去多少次。"),
      memory("可能根本没有很多。"),
      memory("几步而已。")
    ]),
    beat("main-training-continue.png", [
      memory("那时候当然不会觉得几步路有什么值得记的。"),
      memory("只是球场太吵。"),
      memory("那天初见时的印象就是她讲话太小声。"),
      memory("听不见。"),
      memory("就走近一点。"),
      memory("还是听不清。"),
      memory("那就再走近一点。")
    ])
  ]
};

export const oct29PortraitSequences: Record<string, AuthoredPortraitSequence> = {
  "oct29-main": oct29MainPortraitSequence,
  "oct29-singles-selection": {
    id: "oct29-singles-selection",
    beats: [
      beat("echo-singles.png", [
        memory("后来别人也想争 single。"),
        ms("我可以做候补吗？"),
        et("没有候补。"),
        et("2 single。"),
        et("2 double。"),
        memory("然后她直接叫别人跟我打十一粒。"),
        ms("……"),
        memory("我开始瑟瑟发抖。")
      ]),
      beat("echo-score.png", [
        memory("第一场打着打着。"),
        memory("好像已经差不多 10-6。"),
        et("多少了？"),
        ms("……"),
        ms("不记得了。"),
        et("是吗？"),
        et("那打多一场咯。"),
        ms("……"),
        memory("非常好。"),
        memory("谢谢。")
      ]),
      beat("echo-singles.png", [
        memory("第二场打到 4-10 的时候。"),
        memory("我已经开始怀疑人生。"),
        memory("感觉对面是不是在放水。"),
        memory("所以我也偷偷放了两粒。"),
        ms("这样比较公平。"),
        memory("结果最后。"),
        memory("还是给我赢掉了。"),
        ms("……"),
        memory("single 就这样变成我了。"),
        ms("突然想去 double。")
      ])
    ]
  },
  "oct29-hiking-shoe": {
    id: "oct29-hiking-shoe",
    beats: [
      beat("echo-shoes.png", [
        memory("打到后面。"),
        memory("我的脚开始痛了。"),
        memory("那双 hiking 鞋一直在割我的脚。"),
        et("跑起来。"),
        ms("呜呜呜。"),
        ms("不是我不跑。"),
        ms("我的鞋在杀我。")
      ]),
      beat("echo-shoes.png", [
        memory("结果后半场。"),
        memory("她甚至换拖鞋跟我打。"),
        ms("……"),
        ms("我也想脱鞋。"),
        memory("她还是继续训练。"),
        memory("我还是继续跑。"),
        memory("七点 training 结束的时候。"),
        memory("我的脚真的起泡了。"),
        ms("我的脚没救了嘤嘤嘤。")
      ])
    ]
  },
  "oct29-score-forgotten": {
    id: "oct29-score-forgotten",
    beats: [
      beat("echo-score.png", [
        et("多少了？"),
        ms("……"),
        ms("我真的不记得。"),
        et("那打多一场咯。"),
        ms("……"),
        memory("就这样。"),
        memory("因为不会记分。"),
        memory("喜提加赛一场。")
      ])
    ]
  }
};

export const oct29EchoPortraitSequenceIds: Record<string, string> = {
  "singles-selection-echo": "oct29-singles-selection",
  "hiking-shoe-echo": "oct29-hiking-shoe",
  "score-forgotten-echo": "oct29-score-forgotten"
};

export const oct29EchoAnchors: Record<string, string> = Object.fromEntries(
  Object.keys(oct29EchoPortraitSequenceIds).map((id) => [id, id])
);

export const oct29EchoAvailability: Record<string, { requiresMainCompletion?: boolean }> = Object.fromEntries(
  Object.keys(oct29EchoPortraitSequenceIds).map((id) => [id, { requiresMainCompletion: true }])
);

const choice = (id: string, label: string, effects: ReflectionChoice["effects"], response: string): ReflectionChoice => ({ id, label, effects, response });

export const oct29ReflectionChoices: Array<{ id: string; prompt: string; choices: ReflectionChoice[] }> = [
  {
    id: "oct29-reflection-closer",
    prompt: "那天下午我走过去很多次。其实只是因为听不见。现在回头看，我想怎样记住那几步？",
    choices: [
      choice("oct29-closer-ordinary", "就只是几步路。", { acceptance: 1, companionship: 1 }, "球场很吵。\n她讲话很小声。\n所以我走近了一点。\n\n当时真的只有这么多。"),
      choice("oct29-closer-mattered-later", "后来记住了，所以它才变得不一样。", { honesty: 1, holding: 1 }, "那时候没有人替它画重点。\n\n只是很多事情都忘了以后，\n这几步还在。"),
      choice("oct29-closer-beginning", "我还是会想，那是不是某种开始。", { holding: 1, closeness: 1 }, "也许。\n\n也许不是。\n\n十月二十九号的我没有停下来确认。")
    ]
  },
  {
    id: "oct29-reflection-praise",
    prompt: "我后来为什么会记得那一句“很棒”？",
    choices: [
      choice("oct29-praise-simple", "可能只是因为那时候真的很需要一点鼓励。", { acceptance: 1, companionship: 1 }, "脚很痛。\n后场也接不到。\n\n那一个大拇指来得刚刚好。"),
      choice("oct29-praise-because-her", "也可能因为，说这句话的人后来变得重要了。", { honesty: 1, closeness: 1 }, "那句话没有变。\n\n变的是后来再想起它的人。"),
      choice("oct29-praise-dont-know", "我不知道。记忆自己留下来的。", { acceptance: 1, honesty: 1 }, "有些事情没有理由。\n\n别的都淡了。\n它偏偏还在。")
    ]
  },
  {
    id: "oct29-reflection-beginning",
    prompt: "如果那天下午真的只是普通的一天，我还需要把它叫作“开始”吗？",
    choices: [
      choice("oct29-beginning-no", "不用。发生过就够了。", { acceptance: 1, distance: 1 }, "那时候她还是 coach。\n\n我还是那个穿错鞋的人。\n\n不用提前知道后来。"),
      choice("oct29-beginning-for-me", "至少对现在的我来说，这是我记得的起点。", { honesty: 1, holding: 1, closeness: 1 }, "不是关系的起点。\n\n只是记忆往回走的时候，\n最早还能看清的地方。"),
      choice("oct29-beginning-unknown", "我宁愿不知道。", { acceptance: 1, avoidance: 1 }, "那天下午没有答案。\n\n只有球网、鞋底声，\n还有一句很小声的话。")
    ]
  }
];

export const oct29Chapter: ChapterDefinition = {
  id: "oct29-a-little-closer",
  diaryEntryId: "authored-diary-oct29-a-little-closer",
  runtimeScene: "1029",
  date: "10.29",
  title: "再走近一点",
  mood: "an ordinary badminton memory remembered later",
  weather: "晴",
  location: "University badminton court",
  characters: ["MS", "ET"],
  objects: ["badminton racket", "shuttlecock", "hiking shoes", "slippers"],
  evidence: ["approved-1029-landscape-world", "approved-1029-portrait-world", "approved-1029-memory-portraits"],
  dialogue: [],
  canonicalClosure: {
    historicalEventId: "oct29-main-memory",
    lines: [
      "2025 年 10 月 29 日，我们第一次见面。training 结束的时候，她对我来说还只是 coach。",
      "我拿到了 single，脚也真的起泡了。",
      "那天我没有觉得，我们后面还会有交集。"
    ]
  },
  reflectionQuotes: [
    {
      id: "oct29-ordinary",
      tone: "accepting",
      preference: { acceptance: 2, companionship: 1 },
      lines: ["那天没有什么特别的。\n所以我想，就让它普通地留在那里。"],
      afterline: "球还在打。training 也还没有结束。"
    },
    {
      id: "oct29-remembered",
      tone: "holding",
      preference: { honesty: 2, closeness: 1 },
      lines: ["可能不是那一刻变得重要。\n只是后来，我没有把它忘掉。"],
      afterline: "她说：“很棒。”"
    },
    {
      id: "oct29-holding",
      tone: "holding",
      preference: { holding: 2, closeness: 1 },
      lines: ["如果一定要找一个最早的画面，\n我只找得到那几步路。"],
      afterline: "听不见。就再走近一点。"
    },
    {
      id: "oct29-unanswered",
      tone: "not-ready",
      preference: { avoidance: 1, acceptance: 1 },
      lines: ["我不知道那是不是开始。\n十月二十九号也没有必要知道。"],
      afterline: "那时候，我们甚至还不熟。"
    }
  ]
};

export const oct29DiaryBody = [
  "10.29 · A Little Closer",
  "那天下午其实很累。",
  "中午睡觉的时候还做了一个很奇怪的梦，梦见有人勒着我的脖子。醒来以后整个人还是昏昏沉沉的，很想继续睡。",
  "可是四点多有羽球 training。",
  "所以最后还是爬起来去了。",
  "我穿了一双根本不适合打羽球的 hiking 鞋。",
  "走进球场的时候，看见其他人打球都很有力，我很快就得出了一个结论：",
  "完了。",
  "我应该是这里最菜的那个。",
  "一开始跟几个 Malay 同学打了一下。球来得很快，我也不知道自己到底在干嘛，只记得一直跑。后来你过来问我，想打 single 还是 double。",
  "我说，prefer single。",
  "你说，你也要 single。",
  "然后看着我，很自然地说，那我们两个就要打，谁赢谁拿。",
  "我听完以后，突然觉得 single 也没有那么值得坚持。",
  "其实让给你也可以。",
  "真的。",
  "因为你打球很凶。",
  "球一直往后场飞，而我最不会接的偏偏就是后场。你又一直叫我跑起来，教我开球，教我放球。",
  "我一边被你溜，一边开始怀疑自己为什么要来。",
  "鞋子也很痛。",
  "那双 hiking 鞋一直磨脚，打到后面已经开始起水泡。",
  "可是现在回头找那一天，最先想起来的却不是脚痛。",
  "是你讲话很小声。",
  "球场其实很吵。",
  "鞋底摩擦地板的声音，球拍碰到球的声音，旁边的人讲话，还有球落在地上的声音。",
  "你站在另一边说了什么。",
  "我没有听见。",
  "所以我问：蛤？",
  "然后往前走了一点。",
  "后来又有一次。",
  "你说了一句话，我还是听不清。",
  "我只好再走过去一点，问你刚才说什么。",
  "你看着我，又重复了一次。",
  "很棒。",
  "然后给了我一个大拇指。",
  "我那时候第一反应不是开心。",
  "我只觉得：不要 pua 我。",
  "明明刚刚还一直被你打后场，跑也跑不过，鞋子又痛得要死，到底哪里很棒。",
  "可是后来你又夸了几次。",
  "我还是经常听不见。",
  "所以还是会问，蛤？",
  "然后走近一点。",
  "现在已经记不得那天下午到底走过去多少次了。",
  "可能根本没有很多。",
  "几步而已。",
  "那时候当然不会觉得几步路有什么值得记的。",
  "只是球场太吵。",
  "你讲话太小声。",
  "听不见，就走近一点。",
  "很普通。",
  "后来为了决定 single 的人选，我又跟别人打了十一分。第一场赢了。第二场打到一半，我甚至开始怀疑对方是不是故意放水。",
  "所以我也偷偷放了两粒。",
  "结果最后不知道为什么，还是赢了。",
  "single 最后真的变成我。",
  "我反而开始后悔。",
  "早知道去 double。",
  "七点左右 training 终于结束。",
  "我的脚已经起泡了。",
  "回去以后还有 OS quiz、Linux workshop，还有 pizza。整个晚上乱七八糟的，脑子里装的也都是比赛、功课，还有明天到底要去哪里借一双正常的鞋。",
  "所以如果只看那一天，其实真的没有什么特别的。",
  "没有谁在等谁。",
  "没有谁为了谁绕路。",
  "没有宿舍楼下，没有凌晨的洗衣店，没有一起回家的火车。",
  "也没有后来那些我以为自己会永远记得，最后却还是慢慢模糊掉的事情。",
  "那时候你甚至还只是 coach。",
  "一个羽球打得很厉害、体力很好、讲话有点小声，偶尔会对我竖起大拇指的人。",
  "而我也只是一个穿错鞋去 training，被打到到处跑，还很担心自己比赛会丢脸的人。",
  "我没有想过以后。",
  "没有想过我们会认识多久。",
  "没有想过以后会一起去哪里。",
  "更没有想过，有一天我会坐下来，把那一年发生过的事情一件一件重新找回来。",
  "如果那时候有人告诉我，我以后会记得这个下午，我大概也不会相信。",
  "因为真的没有什么值得记的。",
  "甚至关于你的部分，在当天的日记里也只占了一小块。",
  "可是记忆很奇怪。",
  "它不会把重要的东西提前标出来。",
  "不会有人告诉你，这一句以后会记很久，这一个动作以后还会想起，这几步路最好看清楚一点。",
  "事情发生的时候，都只是事情。",
  "所以我也不想替那一天加上后来才有的意义。",
  "我不知道那时候是不是已经有什么开始了。",
  "也不知道如果没有后来，我还会不会记得你说过那一句很棒。",
  "这些都是已经走到很远以后，才会问的问题。",
  "十月二十九号的我不知道。",
  "她只是站在球场上。",
  "球网还在中间。",
  "你站在另一边。",
  "你说了一句话。",
  "她没有听见。",
  "所以往前走了一点。",
  "还是没有听清。",
  "那就再走近一点。",
  "然后终于听见你说：",
  "很棒。",
  "就记得这个吧。"
];

export const oct29DiaryEntry: DiaryEntry = {
  id: "authored-diary-oct29-a-little-closer",
  source: "authored",
  date: "2025-10-29",
  title: "10.29 · A Little Closer",
  body: oct29DiaryBody.join("\n\n"),
  location: "University badminton court",
  weather: "晴",
  memoryKind: "chapter",
  mood: "quiet",
  chapterId: oct29Chapter.id,
  photos: [],
  scrapbookLayout: { elements: [] }
};
