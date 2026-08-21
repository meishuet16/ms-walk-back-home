import assert from "node:assert/strict";
import test from "node:test";
import { createDiaryLibrary } from "../src/systems/DiaryLibrary.js";
import { makeDiaryEntry } from "../src/systems/DiaryImport.js";
import { defaultMonthlyCover, deriveJournalMonths, filterJournalEntries, hasMoreTimelineEntries, journalBatchSize, makeMonthlyJournalImagePdf, makeTimelineMonthView, matchesLiteralJournalQuery, monthlyBookSummaries, monthlyPdfFilename, monthlyPdfPagePlan, searchJournalEntries, selectedOrLatestMonth, selectAllTimelineEntryIds, timelineCursorKeyForStep, upsertMonthlyCover, visibleTimelineEntries } from "../src/systems/JournalModel.js";

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

test("Select All uses the complete filtered timeline result", () => {
  const entries = Array.from({ length: 7 }, (_, index) => entry("2026-07-" + String(index + 1).padStart(2, "0"), "Day " + (index + 1)));
  const month = makeTimelineMonthView(selectedOrLatestMonth(entries, "2026-07"), "date-desc");

  assert.equal(visibleTimelineEntries(month, journalBatchSize).length, journalBatchSize);
  assert.equal(selectAllTimelineEntryIds(month).length, entries.length);
});

test("timeline date cursor steps years without falling back to month mode", () => {
  assert.equal(timelineCursorKeyForStep("2026-04", "year", -1), "2025-04");
  assert.equal(timelineCursorKeyForStep("2026-04", "year", 1), "2027-04");
  assert.equal(timelineCursorKeyForStep("2026-04", "month", -1), "2026-03");
  assert.equal(timelineCursorKeyForStep("2026-04", "date", 1), "2026-05");
});

test("timeline month view filters by keyword before batching", () => {
  const entries = [
    makeDiaryEntry("2026-07-01", "Market", "Bought noodles.", "entry-market"),
    makeDiaryEntry("2026-07-02", "Labis", "单凭这一点，没有白来。", "entry-labis", "chapter"),
    makeDiaryEntry("2026-07-03", "Rain", "Bus stop.", "entry-rain", "fragment")
  ];
  const month = selectedOrLatestMonth(entries, "2026-07");

  assert.deepEqual(searchJournalEntries(entries, "labis").map((item) => item.id), ["entry-labis"]);
  assert.deepEqual(makeTimelineMonthView(month, "date-desc", "点", "chapter").entries.map((item) => item.id), ["entry-labis"]);
  assert.deepEqual(filterJournalEntries(entries, { memoryKind: "fragment" }).map((item) => item.id), ["entry-rain"]);
  assert.deepEqual(makeTimelineMonthView(month, "date-desc", "", "all", "2026-07-01").entries.map((item) => item.id), ["entry-market"]);
});

test("selected empty months remain navigable for public Forest chapters", () => {
  const month = selectedOrLatestMonth([], "2026-03");
  assert.equal(month.key, "2026-03");
  assert.deepEqual(month.entries, []);
});

test("timeline keyword matching is literal for Chinese phrases", () => {
  assert.equal(matchesLiteralJournalQuery("欢喜", "喜欢"), false);
  assert.equal(matchesLiteralJournalQuery("欢喜", "欢"), true);
  assert.equal(matchesLiteralJournalQuery("我很喜欢这里", "喜欢"), true);
});

test("monthly books and pdf export are derived on demand", async () => {
  const library = createDiaryLibrary([entry("2026-07-19", "Labis"), entry("2026-06-02", "Rain")]);
  const books = monthlyBookSummaries(library.entries);
  const july = selectedOrLatestMonth(library.entries, "2026-07");
  const before = JSON.stringify(library);
  const pdf = makeMonthlyJournalImagePdf(july, [{ dataUrl: "data:image/jpeg;base64,/9j/2Q==", width: 1200, height: 1600 }]);
  const pdfText = await pdf.text();
  const pdfBytes = new Uint8Array(await pdf.arrayBuffer());

  assert.deepEqual(books.map((book) => book.key), ["2026-07", "2026-06"]);
  assert.equal(books[0].entryCount, 1);
  assert.equal(monthlyPdfFilename("2026-07"), "WalkBackHome-Journal-2026-07.pdf");
  assert.equal(pdf.type, "application/pdf");
  assert.ok(pdfText.includes("%PDF-1.4"));
  assert.ok(pdfText.includes("/Subtype /Image"));
  assert.ok(pdfText.includes("/DCTDecode"));
  assert.ok(pdfBytes.some((byte, index) => byte === 0xff && pdfBytes[index + 1] === 0xd8 && pdfBytes[index + 2] === 0xff));
  assert.equal(JSON.stringify(library), before);
});

test("monthly books account for video media and local cover metadata", () => {
  const library = createDiaryLibrary([{
    ...entry("2026-07-19", "Labis"),
    photos: [{ id: "photo-1", src: "data:image/png;base64,photo" }],
    media: [
      { id: "video-1", type: "video", src: "data:video/mp4;base64,video", caption: "ride.mp4" },
      { id: "audio-1", type: "audio", storageKey: "journal-media/e/audio-1", mimeType: "audio/webm", duration: 2 }
    ]
  }]);
  const withCover = upsertMonthlyCover(library, "2026-07", {
    src: "data:image/jpeg;base64,cover",
    crop: "top",
    updatedAt: "2026-08-13T00:00:00.000Z"
  });
  const books = monthlyBookSummaries(withCover.entries, withCover.monthlyCovers);

  assert.equal(books[0].photoCount, 1);
  assert.equal(books[0].videoCount, 1);
  assert.equal(books[0].audioCount, 1);
  assert.equal(books[0].cover?.crop, "top");
  assert.equal(books[0].cover?.caption, undefined);
  assert.equal(defaultMonthlyCover("2026-07").src.startsWith("linear-gradient"), true);
});

test("monthly pdf plan includes image media and excludes raw videos", () => {
  const plan = monthlyPdfPagePlan(selectedOrLatestMonth([{
    ...entry("2026-07-19", "Video"),
    media: [
      { id: "image-1", type: "image", src: "data:image/jpeg;base64,image", caption: "inline" },
      { id: "video-1", type: "video", src: "data:video/mp4;base64,raw-video", caption: "ride.mp4" }
    ]
  }], "2026-07"));

  assert.equal(plan.some((item) => item.type === "image" && item.id === "image-1"), true);
  assert.equal(plan.map((item) => String(item.type)).includes("video-poster"), false);
});
