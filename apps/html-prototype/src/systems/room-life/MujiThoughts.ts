export type MujiThoughtContext = "ambient" | "wander" | "window" | "rain" | "records" | "bedside";

export const MUJI_THOUGHT_POOLS: Readonly<Record<MujiThoughtContext, readonly string[]>> = {
  ambient: ["房间今天很安静。", "……要去哪里来着。", "算了。", "再待一下。"],
  wander: ["去那边看看。", "慢慢走。", "刚才是不是走过这里了。"],
  window: ["外面好安静。", "看一下。", "天好像变了。"],
  rain: ["还没停。", "外面湿湿的。", "雨还在下。"],
  records: ["这首又来了。", "这一段很好听。", "再听一下。"],
  bedside: ["有点晚了。", "再待一下好了。", "今天也差不多了。"]
};

export function selectMujiThought(context: MujiThoughtContext, random: () => number = Math.random): string {
  const pool = MUJI_THOUGHT_POOLS[context];
  const sampled = random();
  const value = Number.isFinite(sampled) ? Math.max(0, Math.min(0.999999, sampled)) : 0;
  return pool[Math.floor(value * pool.length)] ?? pool[0];
}
