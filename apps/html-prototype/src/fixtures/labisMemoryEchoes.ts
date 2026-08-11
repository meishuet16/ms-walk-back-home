import type { Choice, Tendencies } from "../types.js";

export type LabisPresentationLevel =
  | "secondary-echo"
  | "visual-echo"
  | "environmental-trace"
  | "secondary-visual-echo"
  | "hidden-keyframe";

export type LabisEcho = {
  id: string;
  label: string;
  prompt: string;
  presentation: LabisPresentationLevel;
  x: number;
  y: number;
  radius: number;
  tell: "steam" | "reflection" | "windshield" | "sound" | "paper" | "hidden-star" | "character";
  requires?: string[];
  repeatable?: boolean;
  usesExistingMapVehicle?: boolean;
};

export type LabisChoicePoint = {
  id: "motor" | "photo" | "filter";
  prompt: string;
  choices: Choice[];
};

export type LabisReflection = {
  id: string;
  title: string;
  lines: string[];
  tendencyScore: (tendencies: Tendencies) => number;
};

export const labisEchoes: LabisEcho[] = [
  { id: "july19-photo-threat", label: "照片", prompt: "E · 回想照片", presentation: "secondary-echo", x: 1040, y: 350, radius: 115, tell: "character", requires: ["july19-motor-learning"], repeatable: true },
  { id: "july19-chicken-porridge", label: "鸡粥", prompt: "E · 回想鸡粥", presentation: "visual-echo", x: 1088, y: 360, radius: 120, tell: "steam", repeatable: true },
  { id: "july19-fried-noodles", label: "炒面", prompt: "E · 回想炒面", presentation: "visual-echo", x: 1088, y: 360, radius: 120, tell: "steam", requires: ["july19-chicken-porridge"], repeatable: true },
  { id: "july19-haircut", label: "玻璃", prompt: "E · 回想刘海", presentation: "visual-echo", x: 632, y: 326, radius: 118, tell: "reflection", repeatable: true },
  { id: "july19-kancil", label: "那辆 Kancil", prompt: "E · 那辆 Kancil", presentation: "environmental-trace", x: 1245, y: 285, radius: 145, tell: "windshield", repeatable: true, usesExistingMapVehicle: true },
  { id: "july19-badminton", label: "啪", prompt: "E · 回想羽球", presentation: "environmental-trace", x: 290, y: 660, radius: 132, tell: "sound", repeatable: true },
  { id: "july19-filter-evening", label: "说明书", prompt: "E · 回想说明书", presentation: "secondary-visual-echo", x: 980, y: 420, radius: 180, tell: "paper", requires: ["july19-motor-learning"], repeatable: true },
  { id: "july19-chicken-cake", label: "昨晚", prompt: "E · 回想昨晚", presentation: "hidden-keyframe", x: 435, y: 610, radius: 92, tell: "hidden-star", requires: ["july19-motor-learning"], repeatable: true }
];

export const labisChoicePoints: LabisChoicePoint[] = [
  {
    id: "motor",
    prompt: "这一幕，你想记住什么？",
    choices: [
      { id: "labis-motor-happy", label: "她是真的很开心。", effects: { acceptance: 1, companionship: 1 }, response: "Muji：她开心，就已经够完整了。" },
      { id: "labis-motor-release", label: "原来放手以后，她真的会自己往前。", effects: { distance: 1, acceptance: 1 }, response: "Muji：有些陪伴不是一直扶着。<br>是知道什么时候可以松手。" },
      { id: "labis-motor-face", label: "我想把这个表情记牢一点。", effects: { closeness: 1, companionship: 1 }, response: "Muji：因为这一幕不会再重新发生一次。" }
    ]
  },
  {
    id: "photo",
    prompt: "这种画面，要怎么收进记忆里？",
    choices: [
      { id: "labis-photo-funny", label: "所以才会记这么久吧。", effects: { acceptance: 1, honesty: 1 }, response: "Muji：有些事情没有意义。<br>只是很好笑。" },
      { id: "labis-photo-annoying", label: "她真的很欠打。", effects: { closeness: 1 }, response: "Muji：嗯。<br>这一条我不反驳。" },
      { id: "labis-photo-no-answer", label: "可是她为什么会想拍那些照片？", effects: { intervention: 1, closeness: 1 }, response: "Muji：……这一次先不要替她回答。" }
    ]
  },
  {
    id: "filter",
    prompt: "这样的普通，要怎么记住？",
    choices: [
      { id: "labis-filter-family", label: "比我还像这个家的人。", effects: { companionship: 1, closeness: 1 }, response: "Muji：明明第一次来。<br>却已经坐在那里一起研究说明书了。" },
      { id: "labis-filter-e-person", label: "可能这就是 E 人吧。", effects: { acceptance: 1 }, response: "Muji：很好。<br>今天的哲学结论到这里。" },
      { id: "labis-filter-ordinary", label: "这样的普通，好像最难保存。", effects: { honesty: 1, closeness: 1 }, response: "Muji：没有告别。<br>没有什么重要的话。<br>只是有人坐在饭厅里。" }
    ]
  }
];

export const labisReflectionTieBreakOrder = ["acceptance", "companionship", "distance", "closeness"] as const;

export const labisMemoryReflections: LabisReflection[] = [
  {
    id: "labis-reflection-acceptance",
    title: "Memory Reflection",
    lines: ["离开 Labis 的时候，我没有多带走一个答案。", "那天不能被改写，只能被重新解释。", "原来所谓值得记住，有时只是普通的一天没有被后来的人删掉。", "07.19 · Labis"],
    tendencyScore: (tendencies) => tendencies.acceptance + tendencies.honesty
  },
  {
    id: "labis-reflection-companionship",
    title: "Memory Reflection",
    lines: ["有些陪伴不是一句话，也不是一种关系的名字。", "只是有人吃了饭、剪了头发、学了 motor，然后自然地坐进你家的傍晚。", "记忆没有替那天加意义；它只是承认，那些细节真的曾经同时存在。", "07.19 · Labis"],
    tendencyScore: (tendencies) => tendencies.companionship + tendencies.closeness
  },
  {
    id: "labis-reflection-letting-go",
    title: "Memory Reflection",
    lines: ["我记得松手之后，motor 还在往前。", "那不是失去控制，也不是证明谁不需要谁。", "我不能改写那个动作，只能解释自己为什么一直记得。", "07.19 · Labis"],
    tendencyScore: (tendencies) => tendencies.distance + tendencies.acceptance
  },
  {
    id: "labis-reflection-not-ready",
    title: "Memory Reflection",
    lines: ["我还是会想问，普通的动作后来为什么会变重。", "但 Walk Back Home 不是审问过去。", "这一次，我把问题带走，没有替任何人补上答案。", "07.19 · Labis"],
    tendencyScore: (tendencies) => tendencies.closeness + tendencies.intervention
  }
];

const tieBreakById = new Map(labisMemoryReflections.map((reflection, index) => [reflection.id, index]));

export function resolveLabisMemoryReflection(tendencies: Tendencies): LabisReflection {
  return [...labisMemoryReflections].sort((a, b) => {
    const score = b.tendencyScore(tendencies) - a.tendencyScore(tendencies);
    if (score !== 0) return score;
    return (tieBreakById.get(a.id) ?? 0) - (tieBreakById.get(b.id) ?? 0);
  })[0];
}
