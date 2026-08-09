import assert from "node:assert/strict";
import test from "node:test";
import { createDiaryLibrary, deleteDiaryEntryById, getDiaryForestMemories, getDiaryTimeline, setDiaryEntryKind, upsertDiaryEntry } from "../src/systems/DiaryLibrary.js";
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
