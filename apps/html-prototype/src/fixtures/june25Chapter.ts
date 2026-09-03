import type { Choice, ChapterDefinition, DiaryEntry } from "../types.js";
import type { CutsceneAction } from "../systems/CutsceneSystem.js";
import type { AuthoredPortraitSequence } from "../systems/MemoryPortraitPresentation.js";
import type { SceneLayout } from "../systems/SceneLayouts.js";

const portrait = (filename: string): string => `assets/625/memory-portrait/${filename}`;
const memory = (text: string) => ({ speaker: "Memory", text });
const dialogue = (speaker: string, text: string) => ({ speaker, text });
const beat = (filename: string, ...lines: Array<{ speaker: string; text: string }>) => ({ portrait: portrait(filename), dialogue: lines });

export const june25PortraitSequences: Record<string, AuthoredPortraitSequence> = {
  "june25-main": {
    id: "june25-main",
    beats: [
      beat("07A-locked.png",
        memory("她讲休息一下，\n躺一下玩手机。"),
        memory("我还在想她今晚是不是睡地上。"),
        memory("我已经准备好要拿yoga mat给她躺了的时候，\n下一秒她直接躺在我旁边。"),
        dialogue("我", "！"),
        memory("然后我看着她开始刷手机。\n\n够多东西刷哦。\n我干脆也看她刷了。\n结果她突然换姿势"),
        dialogue("我", "这样拿我就看不到手机屏幕了"),
        dialogue("她", "owhh sorry。。。")
      ),
      beat("07B-realize.png",
        dialogue("她", "？？\n不对啊\n你看我手机干嘛"),
        dialogue("我", "无聊啊"),
        dialogue("她", "读你的quiz啦"),
        dialogue("我", "我等下3am才读")
      ),
      beat("07C-speechless.png",
        dialogue("她", "服了"),
        memory("但是她还是转回来给我看了。"),
        dialogue("我", "你要睡哪里"),
        dialogue("她", "不懂"),
        dialogue("我", "你要睡里面还是外面\n你会掉下去吗"),
        dialogue("她", "emmm我也可以睡地上"),
        dialogue("我", "不用啦\n塞得下啦"),
        memory("然后我给她睡里面。\n我躺外面。"),
        memory("我拿一堆娃娃压着她，\n再给她多一件被。"),
        dialogue("她", "要窒息了咯"),
        dialogue("她", "好久没抱家里的娃娃了"),
        dialogue("我", "拿去抱拿去抱"),
        dialogue("我", "不哭不哭"),
        dialogue("她", "什么鬼"),
        dialogue("我", "想哭就哭啊\n不要勉强"),
        dialogue("她", "我现在没有要哭\n昨天就有"),
        dialogue("我", "所以你昨天哭过了？"),
        dialogue("她", "对啊"),
        dialogue("我", "没事你现在也可以哭\n把未来的哭掉\n明天就不会哭了"),
        dialogue("她", "神经病"),
        memory("我把脚搭在她腿上很久了，\n她才发现。"),
        dialogue("她", "你脚搭在我腿上诶"),
        dialogue("我", "哦那我放你腰上"),
        dialogue("她", "去你的")
      ),
      beat("08A-late-night-conversation.png",
        memory("过后我们不懂聊什么，\n聊到她为什么那么累。"),
        memory("她本来要睡了，\n一直被我忽悠到一点多。"),
        dialogue("她", "我其实是一个会敏感内耗的人。"),
        dialogue("她", "所以如果可以不社交，\n我不会去。"),
        dialogue("她", "因为我会努力让一个社交圈里的每个人感到开心。"),
        dialogue("我", "你不应该逼自己那么累。"),
        dialogue("我", "证明自己可以了，\n然后呢。"),
        dialogue("我", "偶尔要听从自己身体的求救。"),
        dialogue("我", "不要虐待自己。\n不要太逼自己。"),
        dialogue("我", "要允许自己休息一下。"),
        dialogue("我", "为什么你可以让别人不要那么累，\n不可以允许自己不要那么累呢。")
      ),
      beat("08B.png",
        dialogue("她", "哇佬"),
        dialogue("她", "我本来没觉得很累的"),
        dialogue("她", "你现在害我开始这样想了"),
        dialogue("我", "哈哈哈哈不要哭不要哭"),
        memory("最近她真的累睡着了。"),
        dialogue("她", "早点睡"),
        dialogue("我", "你5am起来\n还会看到我醒着的"),
        dialogue("她", "小心脖子痛"),
        dialogue("我", "睡不睡都疼\n无所谓"),
        dialogue("她", "你现在也在虐待自己"),
        dialogue("我", "没事啦\n心脏累了自己会休息的"),
        dialogue("她", "。。。")
      )
    ]
  },
  "june25-milk": {
    id: "june25-milk",
    beats: [beat("01-waiting-with-milk.png",
      memory("我饿了，\n就去外面蹲着喝牛奶看天空。"),
      memory("我祈祷不要下雨。"),
      memory("我希望她真的可以走向我一次。")
    )]
  },
  "june25-door": {
    id: "june25-door",
    beats: [beat("02-door-arrival.png",
      dialogue("我", "我靠 牛逼"),
      dialogue("她", "什么"),
      dialogue("我", "你真的走路来meh"),
      dialogue("她", "肯定啦\n我不是讲我考试meh\n考完试我就从D06走路来了\n还好啦 不会很远\n你快点先选一杯你要的tealive喝"),
      dialogue("我", "我靠我才讲我很饿\n下一秒就天降免费tealive\n天降天使啊")
    )]
  },
  "june25-desk": {
    id: "june25-desk",
    beats: [
      beat("03-desk-and-bed.png",
        dialogue("她", "你真的一直躺吗 \n不用做东西吗"),
        dialogue("我", "我今天不想做\n忙又太忙\n无聊起来又太废哦"),
        memory("然后我们继续自己做自己的。\n\n我继续躺着玩手机。\n偶尔抬头看她做东西。"),
        dialogue("她", "我真的来这里做功课的勒。\n因为你叫我来。\n所以我就来了。\n你不可以嫌我kacau哦。\n我真的等做完了才走的哦。"),
        dialogue("我", "哪里会kacau哦\n你不要走都可以。\n明天直接去上课。"),
        dialogue("她", "我现在就一直在kacau了啊\n我一直跟你讲话\n我的歌也很吵"),
        dialogue("我", "蛤还好吧")
      ),
      beat("04-conversation.png",
        dialogue("她", "你最近好吗"),
        dialogue("我", "蛤 不好\n我的脖子都这样了"),
        dialogue("她", "只有身体吗\n精神状态也要注意了"),
        dialogue("我", "哎 没招了 精神状态良好 已经绝望了"),
        dialogue("她", "我可以跟你讲我最近发生了什么事"),
        dialogue("我", "什么事"),
        dialogue("她", "你想听吗"),
        memory("我立马从床上爬起来坐到她面前。"),
        dialogue("我", "包的啊\n我很有兴趣\n来来来快点跟我讲什么事"),
        memory("她说了最近发生的一些事情，有点沉重，我看得出她很难受"),
        memory("她觉得自己没尽到足够的责任。"),
        dialogue("我", "你不用把别人的整个人生都扛在自己身上。你已经做的很好了。"),
        dialogue("她", "。。。"),
        dialogue("她", "你听完了不要觉得有负担。"),
        dialogue("我", "不会啦")
      )
    ]
  },
  "june25-wardrobe": {
    id: "june25-wardrobe",
    beats: [beat("05-wardrobe.png",
      memory("我挑了一套蜡笔小新上衣\n和粉色蜡笔小新短裤给她。"),
      dialogue("我", "哇你一身蜡笔小新很好笑 很可爱\n帮你拍起来记录一下哈哈哈"),
      dialogue("她", "你最好不要流传出去。\n不然我的名声就毁了。"),
      dialogue("我", "怎么可能流传出去。"),
      dialogue("我", "hehe这是你自己选的睡衣。\n看得出你很喜欢"),
      dialogue("她", "屁。\n我是被迫的。\n只有蜡笔小新给我选。")
    )]
  },
  "june25-hairdryer": {
    id: "june25-hairdryer",
    beats: [beat("06-hairdryer.png",
      memory("我让她先吹干头发。\n\n我看她还在做功课，\n就灵机一动帮她吹。"),
      memory("她不好意思，\n想抢回去自己吹。\n\n我不理她。\n继续帮她吹。"),
      dialogue("她", "你是不是专业的"),
      dialogue("她", "差不多就好了"),
      memory("我不管。\n继续吹。\n\n偶尔发丝掉到她耳边，\n我也轻轻帮她撩起来。"),
      dialogue("她", "我来你这里好像来一日游那样。\n\n单凭帮我吹头发这一点\n就可以收钱了。"),
      memory("我笑而不语。\n顺手薅几下她的刘海"),
      dialogue("她", "你就是想趁机拍我头吧"),
      dialogue("我", "我厉害吧\n我下次帮你洗头"),
      dialogue("她", "这就不用了\n你帮我吹头发就很离谱了"),
      dialogue("我", "会吗"),
      dialogue("她", "平时朋友会帮忙吹头发吗")
    )]
  },
  "june25-cards": {
    id: "june25-cards",
    beats: [beat("echo-cards.png",
      memory("10pm那样，\n她差不多做好了。"),
      memory("她说要跟我玩扑克牌。"),
      memory("她自学了不懂什么塔罗算牌，\n然后给我算什么男生运女生运。"),
      memory("最后算完了，\n要我转一毛钱工钱。"),
      dialogue("我", "那你刚才说女生运里面旺我的\n可以叫她转钱给我吗"),
      dialogue("她", "我不懂\n你问看"),
      dialogue("我", "就是你啊"),
      dialogue("她", "哇靠")
    )]
  },
  "june25-night": {
    id: "june25-night",
    beats: [beat("09-night.png",
      memory("然后她睡了。"),
      memory("后半夜感觉她很多动作。\n睡相有点不老实。"),
      memory("我一直帮她盖好被子。"),
      memory("她有好几次一个大翻身朝我靠过来，\n脸正对着我的肩膀。"),
      memory("都almost贴着我了。"),
      memory("应该是因为外面走廊太亮了。\n她在找一个地方遮挡。"),
      memory("可是她每次靠近的时候，\n我都会很紧张。"),
      memory("我会很想看她的脸，\n可是又怕她突然醒来。"),
      memory("我只好保持同一个姿势，\n维持了一整夜。"),
      memory("她中间还会讲几句梦话"),
      memory("我想推她。\n\n可是不敢。"),
      memory("最后我真的整夜没睡。")
    )]
  },
  "june25-morning": {
    id: "june25-morning",
    beats: [
      beat("echo-morning A.png",
        memory("5am她的闹钟响了。"),
        memory("她起来关掉继续睡。"),
        dialogue("她", "我靠你真的没睡啊\n不懂在做什么"),
        memory("然后每十分钟又响一次。"),
        memory("到6am我有点无语。"),
        dialogue("我", "你真的不用起来吗"),
        dialogue("她", "几点了"),
        dialogue("我", "6am"),
        dialogue("我", "你还要睡吗"),
        dialogue("她", "我想"),
        dialogue("我", "可是可以吗")
      ),
      beat("echo-morning B.png",
        memory("然后她才起来准备presentation。\n\n又是她坐在桌子前。\n我躺在床上看她做牛马。"),
        dialogue("她", "你。。。\n\n算了我不要念你了"),
        dialogue("我", "什么"),
        dialogue("她", "你酱紫的睡眠哪里可以"),
        dialogue("我", "唉就是睡不着啊")
      )
    ]
  },
  "june25-laundry": {
    id: "june25-laundry",
    beats: [beat("echo-left.png",
      memory("最后我7am睡着一会儿。\n\n她出门去上课的时候，\n我才醒。"),
      memory("她穿我的衬衫去present。\n有点小搞笑。"),
      memory("醒来看手机才发现她走时发了几条信息"),
      dialogue("她", "先走了哦\n早上睡觉的人"),
      dialogue("她", "肮脏衣服我就没带回去了\n放在旁边的篮子里了"),
      memory("仿佛做了一场梦\n有点不真实"),
      memory("早上睡醒以后，\n房间又只是房间了。")
    )]
  }
};

export const june25EchoPortraitSequenceIds: Record<string, string> = {
  "milk-residue": "june25-milk",
  "door-arrival": "june25-door",
  "desk-memory": "june25-desk",
  "cards-memory": "june25-cards",
  "wardrobe-memory": "june25-wardrobe",
  "hairdryer-memory": "june25-hairdryer",
  "bed-night-memory": "june25-night",
  "bed-foot-morning-memory": "june25-morning",
  "laundry-left-memory": "june25-laundry"
};

export const june25EchoAvailability: Record<string, { requiresMainCompletion?: boolean }> = {
  "milk-residue": { requiresMainCompletion: false },
  "door-arrival": { requiresMainCompletion: false },
  "desk-memory": { requiresMainCompletion: false },
  "cards-memory": { requiresMainCompletion: false },
  "wardrobe-memory": { requiresMainCompletion: false },
  "hairdryer-memory": { requiresMainCompletion: false },
  "bed-night-memory": { requiresMainCompletion: true },
  "bed-foot-morning-memory": { requiresMainCompletion: false },
  "laundry-left-memory": { requiresMainCompletion: false }
};

export const june25EchoAnchors: Record<string, string> = {
  "milk-residue": "milk-residue",
  "door-arrival": "door-arrival",
  "desk-memory": "desk-memory",
  "cards-memory": "cards-memory",
  "wardrobe-memory": "wardrobe-memory",
  "hairdryer-memory": "hairdryer-memory",
  "bed-night-memory": "bed-night-memory",
  "bed-foot-morning-memory": "bed-foot-morning-memory",
  "laundry-left-memory": "laundry-left-memory"
};

export const june25Assets = {};

export function resolveJune25Actions(_layout: SceneLayout, _mode: "main" | "echo", _echoId = ""): CutsceneAction[] {
  return [];
}

const choice = (id: string, label: string, effects: Choice["effects"], response: string): Choice => ({ id, label, effects, response });

export const june25ReflectionChoices: Array<{ id: string; prompt: string; choices: Choice[] }> = [
  {
    id: "june25-reflection-1",
    prompt: "有些人走来，\n并不是因为非来不可。",
    choices: [
      choice("june25-reflection-1-a", "可她还是来了。", { acceptance: 1, closeness: 1 }, "门响的时候，\n她真的站在那里。"),
      choice("june25-reflection-1-b", "也许只是一个普通的晚上。", { acceptance: 1, honesty: 1 }, "也可以只是这样。\n她来做功课，\n后来天亮了。"),
      choice("june25-reflection-1-c", "后来记住的，\n反而都是很小的事。", { companionship: 1, honesty: 1 }, "两杯饮料。\n一支吹风筒。\n五点响起来的闹钟。")
    ]
  }
];

export const june25Chapter: ChapterDefinition = {
  id: "june25-so-i-came",
  diaryEntryId: "authored-diary-june25-so-i-came",
  runtimeScene: "625",
  date: "2026-06-25",
  title: "06.25 · 所以我就来了。",
  mood: "an ordinary night that did not become ordinary",
  weather: "quiet afternoon into morning",
  location: "the room",
  characters: ["Muji", "MS", "ET"],
  objects: ["milk", "Tealive", "bed", "wardrobe", "hairdryer", "playing cards", "laundry"],
  evidence: ["authored-625-portrait-scene-layout", "authored-625-landscape-scene-layout", "june25-approved-memory-portraits"],
  dialogue: [],
  canonicalClosure: {
    historicalEventId: "june25-bed-main-memory",
    lines: ["那晚没有发生什么需要被命名的事。", "只是她留下来了。", "我们就这样待到了第二天早上。"]
  },
  reflectionQuotes: [
    { id: "june25-accepting", tone: "accepting", preference: { acceptance: 1, closeness: 1 }, lines: ["她本来有很多事情要做。", "后来门还是响了。"],
    afterline: "我不需要知道她为什么来，才能承认她真的来了。" },
    { id: "june25-holding", tone: "holding", preference: { closeness: 1, companionship: 1 }, lines: ["后来有些话已经记不清了。", "倒还记得两杯饮料，\n一支吹风筒，\n和五点响起来的闹钟。"],
   afterline: "至于说过什么，反而没有这些东西记得清楚。"},
    { id: "june25-rewriting", tone: "rewriting", preference: { honesty: 1, acceptance: 1 }, lines: ["那晚没有发生什么需要被命名的事。", "只是天亮以后，\n房间里多了一篮没带走的衣服。"],
    afterline: "后来我也不再急着替那一天找一个名字。" },
    { id: "june25-not-ready", tone: "not-ready", preference: { distance: 1, acceptance: 1 }, lines: ["早上以后，", "房间又只是房间了。"],
    afterline: "至少现在，我只想把它记到天亮。" }
  ]
};

export const june25DiaryEntry: DiaryEntry = {
  id: "authored-diary-june25-so-i-came",
  source: "authored",
  date: "2026-06-25",
  title: "06.25 · She Really Came",
  body: [
    "06.25 · She Really Came",
    "那天下午我一直在看会不会下雨。你说，等考试结束、录完 group project 的 video 就来。我嘴上还是不太信，心里却一直等。后来我一个人蹲在宿舍外面喝牛奶，看着天，偷偷希望雨不要落下来。",
    "我那时候想得很简单。只是希望这一次，不是我走过去。希望你可以自己走来一次。",
    "后来真的有人敲门。",
    "我拿着手机去开门，门外站着的是你。背着很重的电脑 bag，手上还捧着两杯 Tealive。你说考试结束以后，就从 D06 一路走过来了。",
    "我到现在都还记得自己那一瞬间有多意外。不是因为那两杯饮料，也不是因为你走了多远。只是有一件我已经不太敢期待的事情，忽然很普通地发生了。",
    "你真的走来了。",
    "后来你坐在我的桌子前做功课，我躺在床上玩手机。偶尔抬头看你，你就在那边开着电脑，放自己的歌。我们没有一直讲话，也没有特地安排要做什么。你只是说，因为我叫你来，所以你就来了。还很认真地强调，你会做完东西才走。",
    "那时候我突然觉得，原来有些陪伴可以很安静。不是一直要聊天，不是一直要制造特别的瞬间。一个人做自己的事，另一个人也做自己的事。只要知道对方还在那里，好像就已经够了。",
    "后来你忽然问我最近好吗。聊着聊着，你说了一句，你可以跟我讲最近发生了什么事。然后又问，我想不想听。",
    "我从床上坐起来。",
    "那天我第一次听见很多以前不知道的事情。你说家里的事，说你不知道该怎么做，说自己很愧疚。你一直觉得自己应该再多做一点，好像只要做得够多，就可以把所有人的生活都一起撑住。",
    "我记得自己一直告诉你，不要把全部责任都往自己身上放。你和别人的人生不是同一条线。你可以关心，可以陪，可以很爱一个人，可是你不需要因为爱，就负责替他把所有路都走完。",
    "现在回头想，那些话其实也像是在说给另一个人听。",
    "你一直很会照顾别人，却好像不太会允许自己累。你会为了不让别人失望，把社交里的每个人都顾好；会为了证明自己可以，继续参加那些已经把身体弄得很疲惫的事情。后来我问你，证明了以后呢。你安慰别人不要那么累的时候很容易，为什么轮到自己就不肯。",
    "你最后有点无奈地说，本来没有觉得那么累，被我讲到开始觉得累了。",
    "我那时候只是笑。其实心里很心疼。",
    "再后来已经很晚了。你本来说要回去，最后却真的留下来。衣服、毛巾、牙刷、睡衣，全都临时从我的房间里凑。你一直说不好意思，觉得用了我的东西很麻烦。",
    "我说，我不是别人。",
    "现在想起来，这句话好像比我当时以为的重一点。",
    "后来你洗完澡，穿着那套很荒唐的蜡笔小新睡衣，我帮你吹头发。你一直觉得很离谱，说平时哪有朋友会这样。后来你又帮我洗头，小心按着我脖子后面的伤口，不让它碰到水。",
    "那一晚好像一直都是这种很小的事情。没有谁在告白，也没有谁突然变成另外一种关系。只是两个人很自然地替对方做一点点事。",
    "睡觉的时候你躺在里面，我躺在外面。你抱着娃娃，说很久没有抱家里的娃娃了。后来你睡着以后一直翻身，偶尔靠得很近。我不敢动，也不敢看太久。",
    "其实你离我只有一点点距离。",
    "可我那天第一次很清楚地知道，距离近和拥有一个人，从来不是同一件事。",
    "我整晚没有睡。不是因为发生了什么。恰恰是因为什么都没有发生。你只是睡在那里，偶尔翻身，偶尔说梦话，偶尔把被子踢掉。我就一次次替你盖回去。",
    "天快亮的时候，你的闹钟一直响。你起来看我一眼，发现我真的一整晚没睡，还问我到底在做什么。",
    "我也不知道。",
    "可能只是舍不得睡。",
    "因为那一天太普通了。普通到像以后还会有很多次。",
    "可是后来才知道，有些很像日常的东西，未必真的会成为日常。",
    "所以我记得你背着电脑走来的样子，记得两杯 Tealive，记得你坐在桌前做功课，记得那套很丑的睡衣，记得凌晨一直响的闹钟。",
    "也记得那天我曾经很安静地想：",
    "原来我真正想要的，好像一直都不是谁需要我。",
    "只是有一天，在完全可以不来的时候，你还是自己走来了。"
  ].join("\n\n"),
  location: "the room",
  weather: "quiet afternoon into morning",
  memoryKind: "chapter",
  mood: "quiet",
  chapterId: "june25-so-i-came",
  photos: [],
  scrapbookLayout: { elements: [] }
};
