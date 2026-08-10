import type { ChapterDefinition, ChapterProgress, ChapterReflection, ReflectionTone, Tendencies } from "../types.js";

export type Ending = {
  id: string;
  title: string;
  body: string;
  lines: string[];
};

function toneFromProgress(progress: ChapterProgress): ReflectionTone {
  const picked = new Set(progress.choices);
  if (picked.has("labis-final-photo")) return "rewriting";
  if (picked.has("labis-final-happy")) return "holding";
  if (picked.has("labis-final-silent")) return "not-ready";
  if (picked.has("labis-final-accept")) return "accepting";
  if (picked.has("pretty") || picked.has("rewrite-me")) return "rewriting";
  if (picked.has("quiet") || picked.has("remember-me") || picked.has("sad") || picked.has("labis-teach-hold") || picked.has("labis-release-hold")) return "holding";
  if (picked.has("unimportant") || picked.has("silent-leave")) return "not-ready";
  return "accepting";
}

export function resolveChapterReflection(chapter: ChapterDefinition, progress: ChapterProgress): ChapterReflection {
  const tone = toneFromProgress(progress);
  const quote = chapter.reflectionQuotes.find((item) => item.tone === tone) ?? chapter.reflectionQuotes[0];
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
