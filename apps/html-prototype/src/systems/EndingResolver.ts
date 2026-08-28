import type { ChapterDefinition, ChapterReflection, ReflectionTone, Tendencies } from "../types.js";
import type { ChapterReflectionInput } from "./ChapterMemoryExperience.js";

export type Ending = {
  id: string;
  title: string;
  body: string;
  lines: string[];
};

function toneFromProgress(input: ChapterReflectionInput): ReflectionTone | null {
  const picked = new Set(input.choices);
  if (picked.has("labis-final-photo")) return "rewriting";
  if (picked.has("labis-final-happy")) return "holding";
  if (picked.has("labis-final-silent")) return "not-ready";
  if (picked.has("labis-final-accept")) return "accepting";
  if (picked.has("pretty") || picked.has("rewrite-me")) return "rewriting";
  if (picked.has("quiet") || picked.has("remember-me") || picked.has("sad") || picked.has("labis-teach-hold") || picked.has("labis-release-hold")) return "holding";
  if (picked.has("unimportant") || picked.has("silent-leave")) return "not-ready";
  if (input.tendencies.avoidance >= input.tendencies.acceptance && input.tendencies.avoidance > 0) return "not-ready";
  return null;
}

function preferredQuote(chapter: ChapterDefinition, input: ChapterReflectionInput): ChapterDefinition["reflectionQuotes"][number] | null {
  const candidates = chapter.reflectionQuotes
    .map((quote, index) => ({ quote, index, preference: quote.preference }))
    .filter((item) => item.preference);
  if (candidates.length === 0) return null;
  const scored = candidates.map((item) => ({
    ...item,
    score: Object.entries(item.preference ?? {}).reduce((total, [key, weight]) => total + (input.tendencies[key as keyof Tendencies] ?? 0) * (weight ?? 0), 0)
  }));
  scored.sort((a, b) => b.score - a.score || a.index - b.index);
  return scored[0].score > 0 ? scored[0].quote : null;
}

export function resolveChapterReflection(chapter: ChapterDefinition, input: ChapterReflectionInput): ChapterReflection {
  const explicitTone = toneFromProgress(input);
  const preferred = explicitTone === null ? preferredQuote(chapter, input) : null;
  const quote = preferred ?? chapter.reflectionQuotes.find((item) => item.tone === (explicitTone ?? "accepting")) ?? chapter.reflectionQuotes[0];
  return {
    tone: quote.tone,
    quoteId: quote.id,
    title: quote.title,
    lines: quote.lines,
    afterline: quote.afterline,
    historicalEventId: chapter.canonicalClosure.historicalEventId,
    closureLines: chapter.canonicalClosure.lines
  };
}
