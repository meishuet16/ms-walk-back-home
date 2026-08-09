import assert from "node:assert/strict";
import test from "node:test";
import { chapterRegistry, forestEntries, routeForestEntry } from "../src/systems/ChapterRegistry.js";
import { resolveChapterReflection } from "../src/systems/EndingResolver.js";
import { emptyTendencies } from "../src/systems/TendencySystem.js";
import type { ChapterProgress } from "../src/types.js";

function progress(choices: string[]): ChapterProgress {
  return {
    chapterId: "bakery-day",
    state: "visited",
    visited: true,
    memoryRead: true,
    dialogueCompleted: true,
    walkedThrough: false,
    choices,
    tendencies: emptyTendencies()
  };
}

test("only authored chapter entries route to their implementation", () => {
  const yumido = forestEntries.find((entry) => entry.id === "yumido");
  const segamat = forestEntries.find((entry) => entry.id === "segamat");

  const yumidoRoute = routeForestEntry(yumido!);
  const segamatRoute = routeForestEntry(segamat!);

  assert.equal(yumidoRoute.kind, "implemented-chapter");
  if (yumidoRoute.kind === "implemented-chapter") assert.equal(yumidoRoute.chapter.id, "bakery-day");
  assert.equal(segamatRoute.kind, "stub");
  if (segamatRoute.kind === "stub") assert.equal(segamatRoute.message, "This memory is not yet authored.");
});

test("chapter reflection choices select different quotes without changing the historical event", () => {
  const chapter = chapterRegistry["bakery-day"];
  const honest = resolveChapterReflection(chapter, progress(["remember", "keep", "goodbye"]));
  const rewriting = resolveChapterReflection(chapter, progress(["pretty", "rewrite-me"]));
  const holding = resolveChapterReflection(chapter, progress(["quiet", "remember-me"]));

  assert.notEqual(honest.quoteId, rewriting.quoteId);
  assert.notEqual(holding.quoteId, rewriting.quoteId);
  assert.equal(honest.historicalEventId, chapter.canonicalClosure.historicalEventId);
  assert.equal(rewriting.historicalEventId, chapter.canonicalClosure.historicalEventId);
  assert.deepEqual(honest.closureLines, rewriting.closureLines);
});
