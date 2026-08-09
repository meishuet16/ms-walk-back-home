import type { ChapterDefinition, ChapterProgress, ChapterReflection, ReflectionTone, Tendencies } from "../types.js";

export type Ending = {
  id: string;
  title: string;
  body: string;
  lines: string[];
};

function toneFromProgress(progress: ChapterProgress): ReflectionTone {
  const picked = new Set(progress.choices);
  if (picked.has("pretty") || picked.has("rewrite-me")) return "rewriting";
  if (picked.has("quiet") || picked.has("remember-me") || picked.has("sad")) return "holding";
  if (picked.has("unimportant") || picked.has("silent-leave")) return "not-ready";
  return "accepting";
}

export function resolveChapterReflection(chapter: ChapterDefinition, progress: ChapterProgress): ChapterReflection {
  const tone = toneFromProgress(progress);
  const quote = chapter.reflectionQuotes.find((item) => item.tone === tone) ?? chapter.reflectionQuotes[0];
  return {
    tone: quote.tone,
    quoteId: quote.id,
    lines: quote.lines,
    historicalEventId: chapter.canonicalClosure.historicalEventId,
    closureLines: chapter.canonicalClosure.lines
  };
}
