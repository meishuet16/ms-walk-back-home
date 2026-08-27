export type MujiThoughtContext = "ambient" | "wander" | "window" | "rain" | "records" | "bedside";

export const MUJI_THOUGHT_POOLS: Readonly<Record<MujiThoughtContext, readonly string[]>> = {
  ambient: ["房间今天很安静。", "……", "嗯。", "再待一下。", "好像没什么事。", "今天慢慢的。", "不知道要做什么。", "先待着。", "这里也不错。", "刚刚在想什么来着。", "忘记了。", "算了。", "好像有点安静过头。", "时间走得好慢。", "发一下呆。", "什么都不做也可以。"],
  wander: ["去那边看看。", "慢慢走。", "换个地方。", "走一下。", "刚才是不是来过这里。", "去看看别的地方。", "这边。", "那边好像不错。", "绕一下。", "不赶时间。"],
  window: ["外面好安静。", "看一下。", "外面还亮着。", "树一直在动。", "那边好像有光。", "今天窗外很好看。", "再看一下。", "风好像有一点。", "外面感觉很远。"],
  rain: ["还没停。", "雨还在下。", "外面湿湿的。", "听得到雨。", "雨声蛮舒服的。", "今天一直湿湿的。", "窗外都是水。"],
  records: ["这首又来了。", "这一段很好听。", "再听一下。", "这边比较好听。", "好像听过很多次了。", "还是会想听。", "刚好播到这里。", "这首很适合现在。", "先不要关。"],
  bedside: ["有点晚了。", "再待一下好了。", "今天也差不多了。", "这里比较安静。", "有点累。", "慢一点。", "今晚好安静。", "灯开着刚刚好。", "再一下就好。"]
};

export function selectMujiThought(context: MujiThoughtContext, random: () => number = Math.random, recentThoughts: readonly string[] = []): string | null {
  return selectThoughtFromPool(MUJI_THOUGHT_POOLS[context], random, recentThoughts);
}

export function selectThoughtFromPool(pool: readonly string[], random: () => number = Math.random, recentThoughts: readonly string[] = []): string | null {
  if (!pool.length) return null;
  if (normalizeRandom(random()) < 0.18) return null;
  const fresh = pool.filter((thought) => !recentThoughts.includes(thought));
  const candidates = fresh.length ? fresh : pool.filter((thought) => thought !== recentThoughts[0] || pool.length === 1);
  const safeCandidates = candidates.length ? candidates : pool;
  return safeCandidates[Math.floor(normalizeRandom(random()) * safeCandidates.length)] ?? safeCandidates[0] ?? null;
}

function normalizeRandom(sampled: number): number {
  return Number.isFinite(sampled) ? Math.max(0, Math.min(0.999999, sampled)) : 0;
}
