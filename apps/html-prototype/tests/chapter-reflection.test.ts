import assert from "node:assert/strict";
import test from "node:test";
import { chapterRegistry, forestEntries, routeForestEntry } from "../src/systems/ChapterRegistry.js";
import { createDiaryLibrary, forestNodesForMonth } from "../src/systems/DiaryLibrary.js";
import { resolveChapterReflection } from "../src/systems/EndingResolver.js";
import { emptyTendencies } from "../src/systems/TendencySystem.js";
import type { ChapterReflectionInput } from "../src/systems/ChapterMemoryExperience.js";

function progress(choices: string[]): ChapterReflectionInput {
  return {
    choices,
    tendencies: emptyTendencies()
  };
}

test("only authored chapter entries route to their implementation", () => {
  const yumido = forestEntries.find((entry) => entry.id === "yumido");
  const segamat = forestEntries.find((entry) => entry.id === "segamat");
  const march30 = forestEntries.find((entry) => entry.chapterId === "march30-too-fated");

  const yumidoRoute = routeForestEntry(yumido!);
  const segamatRoute = routeForestEntry(segamat!);

  assert.equal(yumidoRoute.kind, "implemented-chapter");
  if (yumidoRoute.kind === "implemented-chapter") assert.equal(yumidoRoute.chapter.id, "bakery-day");
  assert.equal(segamatRoute.kind, "stub");
  if (segamatRoute.kind === "stub") assert.equal(segamatRoute.message, "This memory is not yet authored.");
  assert.ok(march30);
  const march30Route = routeForestEntry(march30);
  assert.equal(march30Route.kind, "implemented-chapter");
  if (march30Route.kind === "implemented-chapter") assert.equal(march30Route.chapter.runtimeScene, "330-corridor");
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

test("March 30 authored chapter appears through the Forest month placement input", () => {
  const nodes = forestNodesForMonth(forestEntries, createDiaryLibrary(), "2026-03");
  const march30 = nodes.find((node) => "chapterId" in node && node.chapterId === "march30-too-fated");
  assert.ok(march30);
  assert.equal(march30?.title, "Too Fated");
});
