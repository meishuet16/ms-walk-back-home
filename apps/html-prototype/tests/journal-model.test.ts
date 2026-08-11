import assert from "node:assert/strict";
import test from "node:test";
import { createDiaryLibrary } from "../src/systems/DiaryLibrary.js";
import { makeDiaryEntry } from "../src/systems/DiaryImport.js";
import { deriveJournalMonths, hasMoreTimelineEntries, journalBatchSize, makeMonthlyJournalImagePdf, monthlyBookSummaries, monthlyPdfFilename, selectedOrLatestMonth, visibleTimelineEntries } from "../src/systems/JournalModel.js";

function entry(date: string, title: string) {
  return makeDiaryEntry(date, title, `${title} body`, `entry-${date}-${title}`);
}

test("journal months derive from diary library without duplicating entries", () => {
  const entries = [entry("2026-07-19", "Labis"), entry("2026-07-19", "Night"), entry("2026-06-02", "Rain")];
  const months = deriveJournalMonths(entries);

  assert.deepEqual(months.map((month) => month.key), ["2026-07", "2026-06"]);
  assert.equal(months[0].entries.length, 2);
  assert.deepEqual(months[0].entries.map((item) => item.title).sort(), ["Labis", "Night"]);
});

test("timeline initially shows five entries and show more reveals batches", () => {
  const entries = Array.from({ length: 8 }, (_, index) => entry(`2026-07-${String(index + 1).padStart(2, "0")}`, `Day ${index + 1}`));
  const month = selectedOrLatestMonth(entries, "2026-07");

  assert.equal(visibleTimelineEntries(month, journalBatchSize).length, 5);
  assert.equal(hasMoreTimelineEntries(month, journalBatchSize), true);
  assert.equal(visibleTimelineEntries(month, journalBatchSize + 5).length, 8);
  assert.equal(hasMoreTimelineEntries(month, journalBatchSize + 5), false);
});

test("monthly books and pdf export are derived on demand", async () => {
  const library = createDiaryLibrary([entry("2026-07-19", "Labis"), entry("2026-06-02", "Rain")]);
  const books = monthlyBookSummaries(library.entries);
  const july = selectedOrLatestMonth(library.entries, "2026-07");
  const before = JSON.stringify(library);
  const pdf = makeMonthlyJournalImagePdf(july, [{ dataUrl: "data:image/jpeg;base64,AAAA", width: 1200, height: 1600 }]);
  const pdfText = await pdf.text();

  assert.deepEqual(books.map((book) => book.key), ["2026-07", "2026-06"]);
  assert.equal(books[0].entryCount, 1);
  assert.equal(monthlyPdfFilename("2026-07"), "WalkBackHome-Journal-2026-07.pdf");
  assert.equal(pdf.type, "application/pdf");
  assert.ok(pdfText.includes("%PDF-1.4"));
  assert.ok(pdfText.includes("/Subtype /Image"));
  assert.ok(pdfText.includes("/DCTDecode"));
  assert.equal(JSON.stringify(library), before);
});
