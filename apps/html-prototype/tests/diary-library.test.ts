import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { createDiaryLibrary, deleteDiaryEntriesByIds, deleteDiaryEntryById, findChapterDiaryEntry, forestNodesForMonth, getDiaryForestMemories, getDiaryTimeline, seedAuthoredChapterDiaryEntries, setDiaryEntryKind, sharedChapterDiaryBookAssetPath, upsertDiaryEntry } from "../src/systems/DiaryLibrary.js";
import { forestDoors } from "../src/fixtures/chapterPlan.js";
import { chapterRegistry } from "../src/systems/ChapterRegistry.js";
import { makeDiaryEntry } from "../src/systems/DiaryImport.js";

const appSource = readFileSync(new URL("../../src/app.ts", import.meta.url), "utf8");

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
  assert.ok(labis.body.includes("有些幸福安静得像普通的一天"));
  assert.equal(getDiaryForestMemories(library).some((entry) => entry.kind === "chapter" && entry.chapterId === "labis-motor-day"), true);
});

test("March 30 seeds its 330 corridor diary as an editable chapter entry", () => {
  const library = seedAuthoredChapterDiaryEntries(createDiaryLibrary());
  const march30 = library.entries.find((entry) => entry.chapterId === "march30-too-fated");

  assert.ok(march30);
  assert.equal(march30.date, "2026-03-30");
  assert.equal(march30.memoryKind, "chapter");
  assert.match(march30.body, /水枪里的水落在脸上/);
});

test("playable chapters resolve one canonical diary entry by stable id and live edits", () => {
  const seeded = seedAuthoredChapterDiaryEntries(createDiaryLibrary());
  const original = findChapterDiaryEntry(seeded.entries, "april06-not-gone-yet", "authored-diary-april06-not-gone-yet");
  assert.ok(original);
  assert.equal(original?.id, "authored-diary-april06-not-gone-yet");

  const edited = upsertDiaryEntry(seeded, { ...original!, body: "A current fictional April 6 note." });
  assert.equal(findChapterDiaryEntry(edited.entries, "april06-not-gone-yet", original?.id)?.body, "A current fictional April 6 note.");
  assert.equal(edited.entries.filter((entry) => entry.chapterId === "april06-not-gone-yet").length, 1);
});

test("every playable chapter points to one seeded canonical diary entry and the shared book asset is singular", () => {
  const seeded = seedAuthoredChapterDiaryEntries(createDiaryLibrary());
  for (const chapter of Object.values(chapterRegistry)) {
    assert.ok(chapter.diaryEntryId);
    assert.equal(findChapterDiaryEntry(seeded.entries, chapter.id, chapter.diaryEntryId)?.id, chapter.diaryEntryId);
  }
  assert.equal(sharedChapterDiaryBookAssetPath, "assets/labis/book-with-ms-photos.png");
  assert.equal(seeded.entries.filter((entry) => entry.id === "authored-diary-april06-not-gone-yet").length, 1);
});

test("authored March 30 has one Forest node while its Journal entry remains editable", () => {
  const library = seedAuthoredChapterDiaryEntries(createDiaryLibrary());
  const nodes = forestNodesForMonth(forestDoors, library, "2026-03");
  assert.equal(nodes.filter((node) => "chapterId" in node && node.chapterId === "march30-too-fated").length, 1);
  assert.equal(nodes.some((node) => "userEntryId" in node && node.userEntryId === "authored-diary-march30-too-fated"), false);
});

test("Chapter diary opens its centered memory frame while keeping Journal editing available", () => {
  const chapterDiaryMethodStart = appSource.indexOf("private showChapterDiary(chapterId: string)");
  const chapterDiaryMethodEnd = appSource.indexOf("private inspectPastry", chapterDiaryMethodStart);
  const chapterDiaryMethod = appSource.slice(chapterDiaryMethodStart, chapterDiaryMethodEnd);

  assert.match(chapterDiaryMethod, /this\.showChapterDiaryFrame\(entry\)/);
  assert.doesNotMatch(chapterDiaryMethod, /this\.showDiaryReader\(entry\.id\)/);
  assert.match(appSource, /data-action="edit-chapter-diary"/);
  assert.match(appSource, /upsertDiaryPageDraft\(this\.makeDiaryLibrary\(\), savedEntry\)/);
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

test("bulk deleting selected diary ids clears multiple entries at once", () => {
  const keep = makeDiaryEntry("2026-08-09", "Keep", "A.");
  const removeOne = makeDiaryEntry("2026-08-10", "Remove One", "B.");
  const removeTwo = makeDiaryEntry("2026-08-11", "Remove Two", "C.");
  const library = createDiaryLibrary([keep, removeOne, removeTwo]);

  const next = deleteDiaryEntriesByIds(library, new Set([removeOne.id, removeTwo.id]));

  assert.deepEqual(next.entries.map((entry) => entry.id), [keep.id]);
});
