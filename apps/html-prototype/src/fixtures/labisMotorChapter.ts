import type { ChapterDefinition } from "../types.js";

export const labisMotorChapter: ChapterDefinition = {
  id: "labis-motor-day",
  runtimeScene: "labis",
  date: "07.19",
  title: "学会驾 motor 的下午",
  mood: "ordinary, warm, quietly precious",
  weather: "sunny afternoon",
  location: "Labis",
  characters: ["ET", "MS"],
  objects: ["motor"],
  evidence: ["labis-july19-background"],
  memoryText: [
    "2026-07-19 · 学会驾 motor 的下午",
    "Labis 的下午很晒，马路前面的灰尘被车轮带起来，又慢慢落回去。那天本来没有什么特别的安排，只是她一直说要我教她驾 motor。",
    "我记得 motor 很轻，声音也不大。MS 在后面帮她稳着，ET 坐在前面，整个人都很小心，好像一用力就会把下午弄坏。",
    "后来 MS 松开手，她还真的继续往前走了。不是很快，也不是很帅，可是那一小段路突然变得很长。",
    "她回头的时候笑了一下，说：单凭这一点，没有白来。",
    "那时候谁都不知道，这种普通到几乎不会被写进日记的下午，后来会变成值得回来的地方。"
  ],
  dialogue: [
    {
      id: "labis-teach",
      speaker: "MS",
      portrait: "none",
      text: "你不是讲要教我驾 motor 咩",
      choices: [
        {
          id: "labis-teach-hold",
          label: "我扶着，你慢慢来。",
          effects: { companionship: 1 },
          response: "MS：我扶着，你慢慢来。<br>ET：你不要突然放手啊。<br>MS：知道啦。真的真的。"
        },
        {
          id: "labis-teach-simple",
          label: "很简单罢了，走走走。",
          effects: { acceptance: 1 },
          response: "MS：很简单罢了，走走走。<br>ET：等下等下。<br>MS：慢慢放。<br>ET：我在放了啦。"
        },
        {
          id: "labis-teach-tease",
          label: "你不是很厉害？自己来。",
          effects: { closeness: 1, intervention: 1 },
          response: "MS：你不是很厉害，自己来咯。<br>ET：蛤？？ms，你至少扶一下啦。<br>MS：哈哈哈哈好啦。"
        }
      ]
    },
    {
      id: "labis-release",
      speaker: "MS",
      portrait: "none",
      text: "第二次，她又说再来。MS 跟在旁边。看前面，不要一直看下面。",
      choices: [
        {
          id: "labis-release-hold",
          label: "继续扶着。",
          effects: { companionship: 1 },
          response: "ET：你是不是还扶着。<br>MS：嗯。<br>ET：可以放了啦。"
        },
        {
          id: "labis-release-slow",
          label: "慢慢松手。",
          effects: { acceptance: 1 },
          response: "ET：你没有扶了？！<br>MS：你不是会了吗。<br>ET：walao。"
        },
        {
          id: "labis-release-tell",
          label: "可以了，你自己来。",
          effects: { acceptance: 1, honesty: 1 },
          response: "ET：可以咩。<br>MS：可以。"
        }
      ]
    },
    {
      id: "labis-remember",
      speaker: "ET",
      portrait: "none",
      text: "单凭这一点，没有白来。",
      choices: [
        {
          id: "labis-final-accept",
          label: "嗯，没有白来。",
          effects: { acceptance: 1 },
          response: "MS：嗯，没有白来。<br>ET：是不是。<br>MS：是啦。"
        },
        {
          id: "labis-final-happy",
          label: "你开心就好。",
          effects: { companionship: 1 },
          response: "MS：你开心就好。<br>ET：我很开心啊。<br>MS：看得出。"
        },
        {
          id: "labis-final-photo",
          label: "早知道就拍下来。",
          effects: { intervention: 1 },
          response: "MS：早知道刚才拍下来。<br>ET：拍来做么。<br>MS：不知道，留着咯。<br>ET：以后再驾啦。"
        },
        {
          id: "labis-final-silent",
          label: "……",
          effects: { distance: 1 },
          response: "ET：做么。<br>MS：没有啊。<br>ET：奇怪的人。"
        }
      ]
    }
  ],
  canonicalClosure: {
    historicalEventId: "july19-motor-learning",
    lines: [
      "ET 学会了驾 motor。",
      "那天下午，她说单凭这一点，没有白来。"
    ]
  },
  reflectionQuotes: [
    {
      id: "labis-motor-ordinary",
      tone: "accepting",
      title: "没有白来",
      lines: ["那时候我没有想过，", "一个人学会往前走，也会成为我的记忆。"],
      afterline: "她学会了。那就已经足够。"
    },
    {
      id: "labis-motor-holding",
      tone: "holding",
      title: "她很开心",
      lines: ["我记不得那天下午说过多少话。", "但我还记得，她骑回来的时候在笑。"],
      afterline: "有些东西留下来，不是因为重要，只是因为舍不得忘。"
    },
    {
      id: "labis-motor-rewriting",
      tone: "rewriting",
      title: "以后再驾",
      lines: ["当时说“以后”的时候，", "谁都没有觉得那是一个需要兑现的约定。", "所以我不想用后来发生的事，", "去责怪那时候相信这句话的自己。"],
      afterline: "后来是真的。那天下午也是真的。"
    },
    {
      id: "labis-motor-not-ready",
      tone: "not-ready",
      title: "单凭这一点",
      lines: ["她说，单凭这一点，没有白来。", "那我今天，就先记到这里。"],
      afterline: "不是每一次回来，都必须带走一个答案。"
    }
  ]
};
