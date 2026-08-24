import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { authoredChapterDiaryEntries } from "../src/fixtures/authoredDiaryEntries.js";
import { canMutateDiary, getCanonicalAuthoredDiaryEntry, resolveDiarySource } from "../src/systems/DiaryOwnership.js";
import { makeDiaryEntry, updateDiaryMemoryKind } from "../src/systems/DiaryImport.js";
import { createDiaryLibrary, deleteDiaryEntriesByIds, deleteDiaryEntryById, getDiaryTimeline, mergeCanonicalAndPersonalDiaries, seedAuthoredChapterDiaryEntries, upsertDiaryEntry } from "../src/systems/DiaryLibrary.js";
import { deriveJournalMonths, monthlyBookSummaries } from "../src/systems/JournalModel.js";
import { addJournalMedia, addPhotoAttachment, addPhotoElement, createCutoutElement, moveScrapbookElement, removeJournalMedia } from "../src/systems/ScrapbookComposer.js";
import type { DiaryEntry } from "../src/types.js";

const appSource = readFileSync(new URL("../../src/app.ts", import.meta.url), "utf8");

class MemoryStorage implements Storage {
  private values = new Map<string, string>();
  get length(): number { return this.values.size; }
  clear(): void { this.values.clear(); }
  getItem(key: string): string | null { return this.values.get(key) ?? null; }
  key(index: number): string | null { return [...this.values.keys()][index] ?? null; }
  removeItem(key: string): void { this.values.delete(key); }
  setItem(key: string, value: string): void { this.values.set(key, value); }
}

function installStorage(): void {
  Object.defineProperty(globalThis, "localStorage", { configurable: true, value: new MemoryStorage() });
}

function personalEntry(id = "personal-1"): DiaryEntry {
  return { ...makeDiaryEntry("2026-08-01", "Personal note", "A player-owned note.", id), source: "personal" };
}

test("authored fixture entries are explicitly classified as authored", () => {
  assert.ok(authoredChapterDiaryEntries.length > 0);
  assert.equal(authoredChapterDiaryEntries.every((entry) => entry.source === "authored"), true);
});

test("legacy entries without source remain personal and editable", () => {
  const legacy = makeDiaryEntry("2026-08-02", "Legacy note", "Still mine.", "legacy-personal");
  assert.equal(legacy.source, "personal");
  assert.equal(resolveDiarySource(legacy), "personal");
  assert.equal(canMutateDiary(legacy), true);
});

test("canonical authored entries remain visible in Journal timeline, monthly books, and Forest linkage", () => {
  const library = seedAuthoredChapterDiaryEntries(createDiaryLibrary());
  const timeline = getDiaryTimeline(library);
  const months = deriveJournalMonths(library.entries);
  const books = monthlyBookSummaries(library.entries);
  const labis = library.entries.find((entry) => entry.chapterId === "labis-motor-day");

  assert.ok(labis);
  assert.equal(timeline.some((entry) => entry.id === labis.id), true);
  assert.equal(months.some((month) => month.entries.some((entry) => entry.id === labis.id)), true);
  assert.equal(books.some((book) => book.key === "2026-07" && book.entryCount > 0), true);
  assert.equal(getCanonicalAuthoredDiaryEntry(labis.id)?.chapterId, "labis-motor-day");
});

test("stale persisted authored copies are replaced by current fixture content without duplication", () => {
  const fixture = authoredChapterDiaryEntries.find((entry) => entry.id === "authored-diary-march30-too-fated")!;
  const stale = { ...fixture, source: "personal" as const, body: "OLD" };
  const personal = personalEntry("personal-kept");
  const merged = mergeCanonicalAndPersonalDiaries([stale, personal]);
  const current = merged.find((entry) => entry.id === fixture.id);

  assert.equal(current?.body, fixture.body);
  assert.equal(current?.source, "authored");
  assert.equal(merged.filter((entry) => entry.id === fixture.id).length, 1);
  assert.equal(merged.some((entry) => entry.id === personal.id), true);
});

test("a later fixture version becomes visible without clearing persisted state", () => {
  const oldFixture = { ...authoredChapterDiaryEntries[0], body: "BODY A" };
  const newFixture = { ...oldFixture, body: "BODY B" };
  const first = mergeCanonicalAndPersonalDiaries([oldFixture], [oldFixture]);
  const second = mergeCanonicalAndPersonalDiaries(first, [newFixture]);

  assert.equal(second.find((entry) => entry.id === oldFixture.id)?.body, "BODY B");
});

test("known authored IDs cannot be forged into personal imported entries", () => {
  const fixture = authoredChapterDiaryEntries[0];
  const imported = { ...fixture, source: "personal" as const, body: "FORGED" };
  const merged = upsertDiaryEntry(createDiaryLibrary(), imported);

  assert.equal(merged.entries.find((entry) => entry.id === fixture.id)?.body, fixture.body);
  assert.equal(merged.entries.find((entry) => entry.id === fixture.id)?.source, "authored");
});

test("single and bulk deletion preserve authored entries while removing selected personal entries", () => {
  const authored = authoredChapterDiaryEntries[0];
  const first = createDiaryLibrary([authored, personalEntry("personal-a"), personalEntry("personal-b")]);
  const afterSingle = deleteDiaryEntryById(first, authored.id);
  const afterBulk = deleteDiaryEntriesByIds(first, new Set([authored.id, "personal-a", "personal-b"]));

  assert.equal(afterSingle.entries.some((entry) => entry.id === authored.id), true);
  assert.deepEqual(afterBulk.entries.map((entry) => entry.id), [authored.id]);
});

test("canonical authored entries reject memory-kind, media, crop, and scrapbook mutations", () => {
  const authored = authoredChapterDiaryEntries[0];
  const photo = { id: "photo-1", src: "data:image/png;base64,fixture", caption: "fixture" };
  const media = { id: "image-1", type: "image" as const, src: "data:image/png;base64,fixture" };

  assert.equal(updateDiaryMemoryKind(authored, "diary"), authored);
  assert.equal(addPhotoAttachment(authored, photo), authored);
  assert.equal(addJournalMedia(authored, media), authored);
  assert.equal(removeJournalMedia(authored, media.id), authored);
  assert.equal(addPhotoElement(authored, photo.id, "element-1"), authored);
  assert.equal(createCutoutElement(authored, photo.id, "cutout-1"), authored);
  assert.equal(moveScrapbookElement(authored, "missing", 10, 10), authored);
});

test("personal entries remain editable, deletable, and media/scrapbook enabled", () => {
  const entry = personalEntry();
  const photo = { id: "photo-1", src: "data:image/png;base64,fixture", caption: "fixture" };
  const withPhoto = addPhotoElement(addPhotoAttachment(entry, photo), photo.id, "element-1");
  const withMedia = addJournalMedia(withPhoto, { id: "image-1", type: "image", src: "data:image/png;base64,fixture" });
  const updated = upsertDiaryEntry(createDiaryLibrary(), withMedia);

  assert.notEqual(updated.entries[0], entry);
  assert.equal(updated.entries[0].photos?.length, 1);
  assert.equal(updated.entries[0].media?.length, 1);
  assert.equal(deleteDiaryEntryById(updated, entry.id).entries.length, 0);
});

test("SaveManager persists personal diaries only", async () => {
  installStorage();
  const { SaveManager } = await import("../src/systems/SaveManager.js");
  const manager = new SaveManager();
  manager.saveDiaryLibrary(createDiaryLibrary([authoredChapterDiaryEntries[0], personalEntry()]));
  const raw = JSON.parse(localStorage.getItem("walk-back-home:html-prototype:v2:diary-library")!);

  assert.deepEqual(raw.entries.map((entry: DiaryEntry) => entry.id), ["personal-1"]);
});

test("Diary UI never opens canonical authored entries in the normal editor", () => {
  const editorStart = appSource.indexOf("private showDiaryEditor(editId = \"\")");
  const editorEnd = appSource.indexOf("private async saveDiaryEntry", editorStart);
  const editor = appSource.slice(editorStart, editorEnd);
  const readerStart = appSource.indexOf("private showDiaryReader(entryId = \"\")");
  const readerEnd = appSource.indexOf("private showDiaryEditor(editId = \"\")", readerStart);
  const reader = appSource.slice(readerStart, readerEnd);
  const chapterStart = appSource.indexOf("private showChapterDiaryFrame(entry: DiaryEntry)");
  const chapterEnd = appSource.indexOf("private inspectPastry", chapterStart);
  const chapterFrame = appSource.slice(chapterStart, chapterEnd);

  assert.match(editor, /isCanonicalAuthoredDiary/);
  assert.match(editor, /showDiaryReader/);
  assert.match(reader, /Authored Memory/);
  assert.match(reader, /authored \? ""/);
  assert.match(reader, /journal-edit-current/);
  assert.match(reader, /timeline-request-delete-entry/);
  assert.doesNotMatch(chapterFrame, /edit-chapter-diary/);
});

test("app save, delete, autosave, media, and scrapbook entry points enforce ownership", () => {
  const guardedMethods = [
    ["private async saveDiaryEntry", "private readDiaryDraftFromOverlay"],
    ["private deleteDiaryEntry", "private setDiaryMemoryKind"],
    ["private removeSelectedJournalMedia", "private async confirmJournalMediaDelete"],
    ["private cropSelectedJournalMedia", "private applyJournalCrop"],
    ["private addPhotoToScrapbook", "private selectScrapbookElement"],
    ["private updateDiaryEntry", "private activeScrapbookEntry"],
    ["private showScrapbookComposer", "private updateDiaryEntry"]
  ] as const;

  for (const [startMarker, endMarker] of guardedMethods) {
    const start = appSource.indexOf(startMarker);
    const end = appSource.indexOf(endMarker, start + startMarker.length);
    const method = appSource.slice(start, end < 0 ? undefined : end);
    assert.match(method, /canMutateDiary|isCanonicalAuthoredDiary|activeScrapbookEntry/);
  }
});
