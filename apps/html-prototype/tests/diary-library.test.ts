import assert from "node:assert/strict";
import test from "node:test";
import { createDiaryLibrary, deleteDiaryEntriesByIds, deleteDiaryEntryById, getDiaryForestMemories, getDiaryTimeline, seedAuthoredChapterDiaryEntries, setDiaryEntryKind, upsertDiaryEntry } from "../src/systems/DiaryLibrary.js";
import { makeDiaryEntry } from "../src/systems/DiaryImport.js";

test("diary library timeline includes diary-only entries while forest does not", () => {
  const library = upsertDiaryEntry(createDiaryLibrary(), makeDiaryEntry("2026-08-09", "Ordinary Day", "Lunch and class."));

  assert.equal(getDiaryTimeline(library).length, 1);
  assert.equal(getDiaryForestMemories(library).length, 0);
});

test("classification updates derived forest representation", () => {
  const library = upsertDiaryEntry(createDiaryLibrary(), makeDiaryEntry("2026-08-09", "Small Glow", "One sentence."));
  const fragmentLibrary = setDiaryEntryKind(library, library.entries[0].id, "fragment");
  const chapterLibrary = setDiaryEntryKind(fragmentLibrary, library.entries[0].id, "chapter", "future-chapter");

  assert.equal(getDiaryForestMemories(fragmentLibrary)[0].kind, "fragment");
  assert.equal(getDiaryForestMemories(chapterLibrary)[0].kind, "chapter");
});

test("deleting diary removes its derived forest memory", () => {
  const entry = makeDiaryEntry("2026-08-09", "Small Glow", "One sentence.", undefined, "fragment");
  const library = deleteDiaryEntryById(upsertDiaryEntry(createDiaryLibrary(), entry), entry.id);

  assert.equal(getDiaryTimeline(library).length, 0);
  assert.equal(getDiaryForestMemories(library).length, 0);
});

test("authored memory chapters seed editable diary entries into the timeline", () => {
  const library = seedAuthoredChapterDiaryEntries(createDiaryLibrary());
  const timeline = getDiaryTimeline(library);
  const labis = timeline.find((entry) => entry.chapterId === "labis-motor-day");

  assert.ok(labis);
  assert.equal(labis.memoryKind, "chapter");
  assert.equal(labis.date, "2026-07-19");
  assert.ok(labis.body.includes("单凭这一点"));
  assert.equal(getDiaryForestMemories(library).some((entry) => entry.kind === "chapter" && entry.chapterId === "labis-motor-day"), true);
});

test("timeline defaults to date descending and can sort ascending", () => {
  const library = createDiaryLibrary([
    makeDiaryEntry("2026-08-09", "First", "A."),
    makeDiaryEntry("2026-08-11", "Third", "C."),
    makeDiaryEntry("2026-08-10", "Second", "B.")
  ]);

  assert.deepEqual(getDiaryTimeline(library).map((entry) => entry.date), ["2026-08-11", "2026-08-10", "2026-08-09"]);
  assert.deepEqual(getDiaryTimeline(library, "date-asc").map((entry) => entry.date), ["2026-08-09", "2026-08-10", "2026-08-11"]);
});

test("timeline can sort by memory classification", () => {
  const diary = makeDiaryEntry("2026-08-09", "Diary", "A.", undefined, "diary");
  const fragment = makeDiaryEntry("2026-08-11", "Fragment", "B.", undefined, "fragment");
  const chapter = makeDiaryEntry("2026-08-10", "Chapter", "C.", undefined, "chapter");
  const library = createDiaryLibrary([diary, fragment, chapter]);

  assert.deepEqual(getDiaryTimeline(library, "kind-asc").map((entry) => entry.memoryKind), ["chapter", "fragment", "diary"]);
  assert.deepEqual(getDiaryTimeline(library, "kind-desc").map((entry) => entry.memoryKind), ["diary", "fragment", "chapter"]);
});

test("bulk deleting selected diary ids clears multiple entries at once", () => {
  const keep = makeDiaryEntry("2026-08-09", "Keep", "A.");
  const removeOne = makeDiaryEntry("2026-08-10", "Remove One", "B.");
  const removeTwo = makeDiaryEntry("2026-08-11", "Remove Two", "C.");
  const library = createDiaryLibrary([keep, removeOne, removeTwo]);

  const next = deleteDiaryEntriesByIds(library, new Set([removeOne.id, removeTwo.id]));

  assert.deepEqual(next.entries.map((entry) => entry.id), [keep.id]);
});
