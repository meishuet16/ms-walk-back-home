import type { ChapterDefinition, Choice, DiaryEntry, ReflectionChoice } from "../types.js";
import type { CutsceneAction } from "../systems/CutsceneSystem.js";
import type { AuthoredPortraitBeat, AuthoredPortraitSequence } from "../systems/MemoryPortraitPresentation.js";
import type { SceneLayout } from "../systems/SceneLayouts.js";

const portrait = (name: string): string => `assets/721/memory-portrait/${name}.png`;
const beat = (image: string, dialogue: Array<{ speaker: string; text: string }>): AuthoredPortraitBeat => ({ portrait: portrait(image), dialogue });
const memory = (text: string) => ({ speaker: "Memory", text });
const ms = (text: string) => ({ speaker: "我", text });
const et = (text: string) => ({ speaker: "她", text });

export const july21MainPortraitSequence: AuthoredPortraitSequence = {
  id: "july21-main",
  beats: [
    beat("main-01", [
      et("你明天到底还有没有plan。"),
      et("我妈妈问我几时回家了。\n没有plan的话我就明天回了。"),
      et("拜三回和拜四回没什么不同。\n迟早都是要走的。"),
      memory("我觉得她是真的想离开了。"),
      memory("所以我只是看着她买明天的票。"),
      memory("她很果断。"),
      ms("为什么不能多待一天？"),
      et("你都讲不出你的 plan。"),
      ms("为什么不能没有 plan 也留下来？"),
      ms("你不能放松一下吗？"),
      et("我回家会更放松。")
    ]),
    beat("main-02", [
      ms("你可以回家很久。\n可是你只来了我家几天。"),
      et("我家人想念我了勒。"),
      ms("那我也想你啊。"),
      et("家人排第一。"),
      memory("所以我连特别的朋友都算不上。\n对吗。")
    ]),
    beat("main-03", [
      et("对我来说，\n每个朋友都没有什么不一样。"),
      ms("只有我在伤心。"),
      et("不要夸张勒。"),
      et("很正常的不是吗，只是朋友离别。"),
      et("你跟你朋友离别也会这样吗？"),
      ms("不会。"),
      ms("只对你会伤心。"),
      et("为什么？"),
      et("有什么不一样？"),
      ms("就是不一样。"),
      memory("我完全说不出。"),
      memory("太复杂了。")
    ]),
    beat("main-04", [
      ms("你可以安慰我吗？"),
      et("又不是死了或者绝交。"),
      ms("根本没有差别了。\n我以后看不到你了。"),
      et("我后个学期就回来了。"),
      ms("可是你要毕业了。"),
      et("还有很久啊。"),
      et("我都不懂你在伤心什么。"),
      et("你到底怎么了。"),
      et("到底在心碎什么？")
    ]),
    beat("main-05", [
      et("你可以正常一点吗？"),
      ms("怎样才算正常？"),
      et("你玩手机吧。"),
      ms("不要再玩了。"),
      ms("你可以别玩手机了吗？"),
      ms("。。。"),
      ms("你都要走了。"),
      et("不可以。"),
      et("你打扰到我玩手机了。"),
      et("我明天傍晚才回 我们还有明天半天 不是吗。")
    ])
  ]
};

export const july21PortraitSequences: Record<string, AuthoredPortraitSequence> = {
  "july21-main": july21MainPortraitSequence,
  "july21-travel": {
    id: "july21-travel",
    beats: [
      beat("echo-distance", [
        memory("那天去爬山，一开始还走错路。\n一脸怀疑地开车进黄泥路。"),
        memory("后来误打误撞去到那边的德教会。"),
      ]),
      beat("02", [
        et("好笑哦。\n昨天一个德教会。\n今天又另一个德教会。")
      ]),
      beat("echo-hike", [
        memory("中午太阳正好的时候，\n我们爬到山顶。"),
        memory("她一路上一直让我走她前面。\n别走她后面。"),
        memory("我不知道为什么。"),
        memory("是怕我拍她吗。"),
        memory("我不知道。")
      ]),
      beat("echo-deer", [
        et("我的火车票学生价申请通过了。"),
        memory("她要买明天的票回家。"),
      ]),
      beat("echo-ask", [
        ms("呜呜，求求你。\n后天再回，好吗。"),
        memory("她愣了一下。"),
        et("好。"),
        et("可是明天要做什么？"),
        et("如果没有东西做了，\n我就要回了。")
      ])
    ]
  },
  "july21-eggtoast": {
    id: "july21-eggtoast",
    beats: [beat("echo-distance", [
      memory("回家前，我们去吃午餐。"),
      memory("她很喜欢那家店的 omelette bowl。"),
    ]),
    beat("03", [
      et("我是一个很喜欢吃这个的人。"),
      et("这边的特别好吃。"),
    ]),
    beat("echo-distance", [
      memory("然后她买了三包排骨饼。"),
      memory("她又把钱算得很清楚转给我了。")
    ])]
  },
  "july21-bedroom": {
    id: "july21-bedroom",
    beats: [
      beat("echo-ask", [
        memory("回到家以后，\n她中途去房间睡着了。"),
        memory("醒来以后，\n又提起问我明天什么 plan。"),
        et("如果真的没有 plan 了，\n我明天就要回了。"),
        memory("她妈妈问她几时回了。"),
        ms("我看住她。"),
        et("看你的样子。\n一看就没 plan。"),
        memory("其实就算我有 plan，\n应该也不会说了。"),
        memory("因为我觉得，\n她是真的想离开。")
      ]),
      beat("echo-luggage", [
        memory("她问完明天的 plan，\n又回房间看了一下行李。")
      ])
    ]
  },
  "july21-family": {
    id: "july21-family",
    beats: [
      beat("echo-eat", [
        memory("回到店，\n又吃阿爸煮的饭菜。"),
        memory("她吃了蛮多的。"),
        memory("阿姐早早偷偷买好香饼那些，\n要给她带回去。"),
        memory("不然给她知道价钱，\n她又要转回来给我了。")
      ]),
      beat("echo-temple01", [
        memory("之后阿爸带我们去老庙。"),
        memory("她第一次点那么多支香。"),
        memory("她还主动扫地。"),
        memory("阿爸还让她去神台倒酒。"),
      ]),
         beat("echo-temple02", [
        memory("那个画面有点离谱。"),
        memory("但是好像有点合理。"),
        memory("从老庙回来，阿爸又开始炒面。"),
      ]),
      beat("01", [
        et("怎么又煮。"),
        memory("然后阿姐泡茶给她，又拿香饼出来给她吃。"),
        et("又吃？？？！")
      ])
    ]
  },
  "july21-money-back": {
    id: "july21-money-back",
    beats: [beat("echo-gift", [
      memory("我把钱全部转回给她了。"),
      memory("警告她不准转回来了。"),
      ms("不然我再转回去。"),
      memory("我还要把她来回的火车票钱也帮她出掉。"),
      memory("最后她应该是妥协了。"),
      memory("不确定。"),
      memory("还要再观察。")
    ])]
  },
  "july21-kexing": {
    id: "july21-kexing",
    beats: [beat("ms-portrait-20", [
      memory("阿姐看我很伤心。"),
      memory("她说如果是别的朋友，\n我肯定很快就赶人家回家。"),
    ]),
    beat("04", [
      et("为什么？"),
    ]),
    beat("ms-portrait-20", [
      ms("可能是我的克星。\n我接不住别人的情绪。\n我会害怕。"),
    ]),
    beat("04", [
      et("对对。\n那你也是我的克星。"),
    ]),
    beat("ms-portrait-20", [
      memory("这算什么风水轮流转呢。")
    ])]
  },
  "july21-morning": {
    id: "july21-morning",
    beats: [
      beat("ms-portrait-20", [
      memory("今天8am就起来了。"),
      memory("我比她早起。"),
      memory("我在想该不该说。"),
      memory("但是好像没必要了。"),
      memory("她起床后自己泡饮料喝。"),
      memory("去客厅开戏看。"),
      ]),
      beat("ms-portrait-19", [
      memory("我们坐在沙发上看戏。"),
      memory("我始终没有开口。"),
      ]),
      beat("echo-luggage", [
      memory("中途她去房间收行李。"),
      memory("我也去看。"),
      memory("手机留在客厅沙发。"),
      ]),
      beat("echo-watch", [
      memory("她收完了，\n又回客厅看戏。"),
      memory("我继续躺在床上思考人生。"),
      memory("她看见我的手机还留在客厅，\n便喊我出来看戏。")
    ])]
  },
  "july21-departure": {
    id: "july21-departure",
    beats: [
      beat("echo-station", [
        memory("3点多，\n我们载她回家收拾行李。"),
        memory("然后去火车站。"),
        memory("出发前还看到阿爸穿着红衣和蓝衣的人聊天。"),
      ]),
       beat("03", [
        et("那个不是蓝色的政党吗？\n你们家投红色的不是吗？"),
        et("ei，为什么你爸爸穿着红色的衣，\n跟蓝色的人聊那么欢？"),
       ]),
        beat("ms-portrait-12", [
        ms("真的诶。\n笑死。\n拍下来。")
      ]),
      beat("echo-gift", [
        memory("最后载她到火车站。"),
        memory("我给她最后的那个小八挂绳。")
      ]),
      beat("echo-leave", [
        memory("就走了。"),
        memory("很多话想说。"),
        memory("但是还是没有说出口。")
      ])
    ]
  },
  "july21-left-behind": {
    id: "july21-left-behind",
    beats: [beat("echo-muji", [
      et("我的水壶落在车上了。"),
      et("你帮我保管。"),
      et("我下下个 sem 回来跟我拿。"),
    ]),
    beat("ms-portrait-12", [
      memory("Haizzz。"),
      memory("我已经心碎了。"),
      memory("还要给我睹物思人的机会。"),
    ]),
    beat("ms-portrait-03", [
      memory("但是我还是谢谢她愿意来。\n谢谢她来过。")
    ])]
  }
};

const choice = (id: string, label: string, effects: Choice["effects"], response: string): ReflectionChoice => ({ id, label, effects, response });

export const july21ReflectionChoices: Array<{ id: string; prompt: string; choices: ReflectionChoice[] }> = [
  {
    id: "july21-reflection-1",
    prompt: "如果一个人是真的想走，\n那时候的我还在找什么理由？",
    choices: [
      choice("july21-reflection-1-a", "我只是舍不得。", { closeness: 1, honesty: 1 }, "舍不得不一定需要一个更好的 plan。\n\n有时候只是还不想走到送别那里。"),
      choice("july21-reflection-1-b", "她想回家，就让她回家。", { acceptance: 1 }, "喜欢一个人留下，\n和允许她自己决定什么时候走，\n原来并不冲突。"),
      choice("july21-reflection-1-c", "我想知道的是，她会不会自己想留下。", { closeness: 1, honesty: 1 }, "不是因为下一站还有哪里。\n\n只是因为没有安排的时候，\n她也还是想待在这里。")
    ]
  },
  {
    id: "july21-reflection-2",
    prompt: "她问：\n\n“有什么不一样？”",
    choices: [
      choice("july21-reflection-2-a", "我那时候真的说不出来。", { honesty: 1 }, "话已经走到那里。\n\n最后只剩一句：\n“就是不一样。”"),
      choice("july21-reflection-2-b", "也许我其实知道。", { closeness: 1, honesty: 1 }, "知道一件事，\n和准备好把它交给另一个人，\n好像不是同一回事。"),
      choice("july21-reflection-2-c", "没说出口的，就先留在那里。", { acceptance: 1 }, "那天没有答案。\n\n后来时间还是照自己的方向走。")
    ]
  },
  {
    id: "july21-reflection-3",
    prompt: "最后留下来的，\n是一只忘在车上的水壶。",
    choices: [
      choice("july21-reflection-3-a", "至少还有东西会回来拿。", { holding: 1, closeness: 1 }, "她只是说：\n\n“下下个 sem 回来跟我拿。”"),
      choice("july21-reflection-3-b", "不需要把它变成承诺。", { acceptance: 1, honesty: 1 }, "那天下午走得匆忙。\n\n有一样东西忘在车上。\n就这样。"),
      choice("july21-reflection-3-c", "我只是会记得。", { companionship: 1 }, "后来看见它的时候，\n\n还是会想起那几天。")
    ]
  }
];

export const july21EchoPortraitSequenceIds: Record<string, string> = {
  "travel-memory": "july21-travel",
  "eggtoast-money-memory": "july21-eggtoast",
  "bedroom-memory": "july21-bedroom",
  "family-memory": "july21-family",
  "money-back-memory": "july21-money-back",
  "kexing-memory": "july21-kexing",
  "morning-memory": "july21-morning",
  "departure-memory": "july21-departure",
  "left-behind-memory": "july21-left-behind"
};

export const july21EchoAvailability: Record<string, { requiresMainCompletion?: boolean; requiresEchoIds?: string[] }> = {
  "travel-memory": { requiresMainCompletion: false },
  "eggtoast-money-memory": { requiresMainCompletion: false },
  "bedroom-memory": { requiresMainCompletion: false },
  "family-memory": { requiresMainCompletion: false },
  "money-back-memory": { requiresMainCompletion: false },
  "kexing-memory": { requiresMainCompletion: true },
  "morning-memory": { requiresMainCompletion: true },
  "departure-memory": { requiresMainCompletion: true },
  "left-behind-memory": { requiresEchoIds: ["departure-memory"] }
};

export const july21EchoAnchors: Record<string, string> = Object.fromEntries(echoIds().map((id) => [id, id]));
function echoIds(): string[] { return Object.keys(july21EchoPortraitSequenceIds); }

export const july21Assets = {};

export function resolveJuly21Actions(_layout: SceneLayout, _mode: "main" | "echo", _echoId = ""): CutsceneAction[] {
  return [];
}

export const july21Chapter: ChapterDefinition = {
  id: "july21-why-cant-you-stay",
  diaryEntryId: "authored-diary-july21-one-more-day",
  runtimeScene: "721",
  date: "07.21–07.22",
  title: "One More Day",
  mood: "a day that was ordinary until it was leaving",
  weather: "rain into a bright afternoon",
  location: "Home",
  characters: ["Muji", "MS", "ET"],
  objects: ["train ticket", "phone", "omelette bowl", "luggage", "water bottle"],
  evidence: ["approved-721-portrait-world", "approved-721-landscape-world", "approved-721-memory-portraits"],
  dialogue: [],
  canonicalClosure: {
    historicalEventId: "july21-sofa-main-memory",
    lines: ["那天下午，她还是走了。", "水壶却留在车上。"]
  },
  reflectionQuotes: [
    { id: "july21-accepting", tone: "accepting", preference: { acceptance: 1 }, lines: ["她还是回家了。", "我也终于没有再替那一天找一个更长的理由。"], afterline: "那一天停在哪里，就让它停在哪里。" },
    { id: "july21-holding", tone: "holding", preference: { holding: 1, closeness: 1 }, lines: ["后来我还会想起那几天。", "不是因为它本来可以多一天。"], afterline: "只是已经有过的那些，我还是很舍不得忘记。" },
    { id: "july21-not-ready", tone: "not-ready", preference: { honesty: 1 }, lines: ["有些话那时没有说。", "现在也不必为了完整，重新说一遍。"], afterline: "至少现在，我还想把它留在没有说出口的时候。" },
    { id: "july21-rewriting", tone: "rewriting", preference: { companionship: 1 }, lines: ["我没有把那几天写成另一个结局。", "它就是这样发生过。"], afterline: "少掉的那一天，不会把已经一起走过的几天拿走。" }
  ]
};

export const july21DiaryBody = [
  "07.21–07.22 · One More Day",
  "那两天我一直觉得时间走得很快。",
  "七月二十一号早上下雨。我们九点多去吃芋头饭，你又把我的那份钱一起转给我。我看着转账记录觉得很好笑。明明是你来我家做客，最后却好像什么都要跟我算清楚。",
  "后来我开车去爬山地点。路有一点远，我一路都想和你讲话。想听你说最近发生的事，或者随便什么八卦也可以。",
  "我问，八卦呢。",
  "你说没有，让我讲自己的。",
  "我说，那正经的也可以。",
  "你说，我没有话要讲哦。",
  "后来车还是继续开。窗外的东西一直往后退，我也没有再问。",
  "我那时候才发现，我们好像已经很久没有像以前那样一直讲话了。晚上睡觉以前也是，各自看各自的手机。你十二点很准时地睡，我躺在旁边，总觉得应该还有一句什么话没有说。",
  "可是没有。",
  "那天我们还是去了很多地方。",
  "去爬山的时候走错了路，车开进一条黄泥路，两个人都开始怀疑到底是不是这里。后来误打误撞去了那边的又一间德教会，上香、问路。你还笑，说昨天一个德教会，今天又一个德教会。",
  "太阳很大的时候，我们终于开始爬山。一路都是上坡，很喘。你一直叫我走在你前面，不要走在你后面。",
  "我没有问为什么。",
  "那几天你好像也开始不太喜欢我拍你。以前那些很自然留下来的照片，忽然变成一件需要先问过你的事情。",
  "所以后来我就走在前面。",
  "山顶其实没有发生什么。",
  "我们还是照常下山，去庙里喂鹿、摸鱼、拍照。世界没有因为我心里那些乱七八糟的东西停下来。",
  "也是在那里，你告诉我，火车的学生票申请通过了。",
  "你可以买明天的票回家了。",
  "我半开玩笑地说，后天再回吧 求求你。",
  "你愣了一下，说，好啊。",
  "然后问我，明天要做什么。",
  "我说，明天再看。",
  "你说不行。如果没有东西做，你就明天回。",
  "后来我们又去了另一间庙，吃午餐。你很喜欢那边的omelette bowl，你说你本来就很喜欢吃这个，这家的特别好吃。吃饱后回家前我们又买了排骨饼。",
  "那一天明明已经去了很多地方。",
  "可是我一路都在想另一件事。",
  "为什么一定要有 plan，才值得多留一天。",
  "如果明天什么都不做呢。",
  "如果只是醒来，吃一点东西，看戏，躺着，各自玩手机。",
  "如果没有下一站。",
  "你会不会也愿意留下来。",
  "下午回到家，你睡了一觉。醒来以后，又问我明天有什么 plan。",
  "我看着你，最后没有再想一个地方出来。",
  "因为我忽然觉得，如果一个人是真的想回家，那我再找出一条路线、一家店、一个景点把她留下来，好像也没有什么意思。",
  "所以我坐在那里，看着你买了第二天的票。",
  "你说，星期三回和星期四回没有什么分别。",
  "迟早都是要走的。",
  "我知道。",
  "我只是那时候还不太会接受“迟早”。",
  "后来我还是忍不住问，为什么不能多待一天。",
  "你说，家里人想你了。",
  "我说，我也想你啊。",
  "你摆摆手，说，家人排第一。",
  "其实这句话一点都没有错。",
  "只是那一刻我第一次很清楚地看见，我把你放的位置，和你把我放的位置，好像从来不是同一个地方。",
  "我说，只有我在伤心。",
  "你说，不要夸张，很正常的朋友离别。",
  "你问，我跟其他朋友也会这样吗。",
  "我说，不会。",
  "只对你会。",
  "你问，为什么。有什么不一样。",
  "我说，就是不一样。",
  "然后就说不下去了。",
  "其实答案已经离嘴边很近了。",
  "近到再多说一句，很多事情可能就会有名字。",
  "可是我没有说。",
  "后来你问我，到底在心碎什么。",
  "我也答不出来。",
  "现在想想，我不是在为少掉的一天难过。",
  "一天其实很短。",
  "就算你真的多留一天，星期四还是会来。",
  "我难过的大概是，我终于明白，我一直很舍不得结束的东西，在你那里并没有正在结束。",
  "对你来说，只是回家。",
  "对我来说，那一天却已经开始告别。",
  "第二天，我八点就醒了。",
  "刷完牙以后，一个人坐在客厅发呆。阿爸阿妈都觉得奇怪，问我们为什么这么早起来。",
  "我其实还在想昨天没有说完的事情。",
  "要不要告诉你。",
  "好像真的只差一句。",
  "可是想了很久，又觉得没有必要了。",
  "后来你自己泡了一杯热饮料，坐到客厅开戏看。我也过去坐在沙发上。",
  "电视一直播。",
  "我们谁都没有提昨天。",
  "中途你回房间收行李。我也跟进去，看着你把东西一件一件放回去。我的手机还留在客厅。",
  "你收完出去以后，发现手机还在那里，又从客厅喊我出来看戏。",
  "于是我又出去。",
  "现在想起来，那几个小时其实很奇怪。",
  "我明明一直觉得，有一句很重要的话必须在你走以前说完。",
  "可是真正坐在你旁边的时候，又觉得这样也很好。",
  "电视开着。",
  "你还在。",
  "好像只要不开口，今天就还只是一个普通的早上。",
  "十点多，我们出去吃早餐。鸡蛋、面包，然后回家。你照旧把钱转给我，我也照旧想办法再转回去。",
  "后来回到阿爸店里，又开始吃。",
  "阿爸煮东西，阿姐早早买了香饼给你带回去，还故意不告诉你多少钱。大家已经知道了，只要让你知道，你一定又会把钱转回来。",
  "你好像很不习惯白白收下别人的好。",
  "一直说太多了，很夸张。",
  "我们说，你来做客，哪里有让客人请客的道理。",
  "后来我干脆把之前的钱全部转回给你，警告你不准再转。你再转回来，我就连火车票一起帮你付。",
  "不知道你是真的妥协了，还是懒得继续跟我吵。",
  "吃完以后，阿爸又带我们去老庙。",
  "走一段 kampung 路进去，你第一次拿那么多支香，还很自然地帮忙扫地。阿爸叫你去神台前倒酒，你也照做。",
  "那个画面其实有一点奇怪。",
  "可是我站在旁边看，又觉得好像没有哪里不对。",
  "你明明第一次来，却已经会坐在我家的客厅看戏，会吃阿爸煮的东西，会被阿姐塞一堆食物，会跟着去庙里上香，会在别人叫你帮忙的时候很自然地走过去。",
  "好像你已经来过很多次。",
  "可是没有。",
  "这是最后一天。",
  "回到店以后，阿爸又煮面。你一脸不可置信地问，怎么又吃。阿姐泡茶给你，又拿香饼出来。那个大包你实在吃不下了，她最后帮你弄热，装进盒子，说带去火车上吃。",
  "大家都在很自然地替你的离开准备东西。",
  "食物装进袋子。",
  "行李收进箱子。",
  "回家的票已经买好了。",
  "好像只有我还没有准备好。",
  "下午三点多，我们带你回家拿行李。",
  "搬东西上车的时候，又看见阿爸穿着红色衣服跟对面蓝色政党的人聊得很开心。你站在那里研究了一下，说，你们家不是投红色的吗，为什么阿爸可以和那人聊得那么开心。",
  "我笑着说，真的诶 有点搞笑。",
  "还拿手机拍了下来。",
  "我很喜欢自己还记得这种东西。",
  "因为到最后，我们还是在讲这些没有意义的小事。",
  "没有电影里的最后一天。",
  "没有谁在车里突然把所有秘密说完。",
  "没有一个刚好足够漂亮的告别。",
  "只是有人忘记付钱，有人一直被喂东西，有人研究邻居的政党颜色。",
  "然后车就开到了火车站。",
  "我把最后一个小八挂绳给你。",
  "其实还是有很多话想说。",
  "最后没有。",
  "我不知道是因为害怕，还是因为前一天已经隐约知道答案。",
  "也可能只是觉得，如果一件事情说出来以后只会让你为难，那留在我这里就好了。",
  "所以最后只是用语音信息叮嘱了一些很普通的东西。",
  "然后你上车。",
  "火车开走。",
  "就这样。",
  "我原本以为这一天到这里应该就结束了。",
  "后来你发消息告诉我，你的水壶落在车上了。",
  "你说，帮你保管。",
  "下下个学期回来再跟我拿。",
  "我看到那句话的时候，不知道该笑还是该哭。",
  "明明已经很努力在接受，有些东西就是会结束。",
  "你却偏偏留下了一件东西。",
  "不是信。",
  "不是照片。",
  "也不是什么值得郑重收藏的纪念品。",
  "只是一个水壶。",
  "后来我想，这样其实也很好。",
  "至少七月二十二号没有变成一个很完整的句号。",
  "你还有东西在这里。",
  "所以好像总有一个很小、很普通的理由，说明以后还会再见。",
  "回家以后，我翻了很久前几天的照片。",
  "那些照片里没有什么特别的东西。",
  "吃饭，开车，剪头发，学 motor，看戏，去庙里，坐在客厅。",
  "别人看了，说很特别。",
  "我觉得很好笑。",
  "因为在你的故事里，大概真的只是去一个朋友家住了几天。",
  "吃了很多东西。",
  "去了几个地方。",
  "然后坐火车回家。",
  "只有我偷偷把它过成了一场很长的告别。",
  "后来我才发现，七月二十一号一直想要的那一天，其实并不能解决什么。",
  "如果你真的留下，第二天还是会来。",
  "我还是会送你去车站。",
  "火车还是会开。",
  "你还是会回家。",
  "所以现在再问我，那时候到底为什么那么想让你多留一天，我好像也没有一个很好的答案。",
  "可能只是因为那几天太像日常了。",
  "像到我差一点忘记，它其实有一张回程票。",
  "晚上十二点以后，家里少了一个会准时去睡觉的人。",
  "房间还是那个房间。",
  "客厅的电视还是会开。",
  "阿爸还是会煮太多东西。",
  "路也还是那些路。",
  "只是你已经在回家的路上。",
  "而你的水壶，还留在这里。"
];

export const july21DiaryEntry: DiaryEntry = {
  id: "authored-diary-july21-one-more-day",
  source: "authored",
  date: "2026-07-21",
  title: "07.21–07.22 · One More Day",
  body: july21DiaryBody.join("\n\n"),
  location: "Family home",
  weather: "rain into a bright afternoon",
  memoryKind: "chapter",
  mood: "quiet",
  chapterId: july21Chapter.id,
  photos: [],
  scrapbookLayout: { elements: [] }
};
