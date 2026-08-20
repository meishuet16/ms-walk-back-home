import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const appSource = readFileSync(new URL("../../src/app.ts", import.meta.url), "utf8");
const cssSource = readFileSync(new URL("../../src/styles.css", import.meta.url), "utf8");

test("forest fragments open their journal page instead of the timeline", () => {
  const fragmentModal = appSource.match(/This memory is a small light[\s\S]*?<\/div><\/div>`;/)?.[0] ?? "";

  assert.match(appSource, /data-action="open-diary-page"/);
  assert.doesNotMatch(fragmentModal, /data-action="open-timeline"/);
});

test("timeline preview photos stay below the text instead of overlaying it", () => {
  const previewGridRule = cssSource.match(/\.diary-page-preview \.preview-photo-grid \{[\s\S]*?\}/)?.[0] ?? "";

  assert.match(previewGridRule, /display:\s*grid/);
  assert.doesNotMatch(previewGridRule, /position:\s*absolute/);
  assert.doesNotMatch(previewGridRule, /bottom:/);
});

test("monthly pdf appends imported photos after diary text on the entry page flow", () => {
  assert.doesNotMatch(appSource, /pages\.push\(\.\.\.await this\.renderDiaryPhotoPdfPages/);
  assert.match(appSource, /drawDiaryPhotosOnPdfPage/);
});

test("monthly pdf flows diary text and photos continuously instead of restarting each entry", () => {
  assert.match(appSource, /renderMonthlyPdfFlowPages/);
  assert.match(appSource, /appendDiaryEntryToPdfFlow/);
  assert.doesNotMatch(appSource, /renderDiaryPhotoContinuationPages/);
  assert.doesNotMatch(appSource, /ctx\.fillText\(entry\.title \|\| "Untitled Memory", 150, 170\)/);
});

test("timeline date filtering uses a calendar-style input instead of month dropdowns", () => {
  assert.match(appSource, /id="timeline-date-input" type="date"/);
  assert.match(appSource, /id="timeline-date-scope"/);
  assert.doesNotMatch(appSource, /id="timeline-month-select"/);
  assert.doesNotMatch(appSource, /id="timeline-day-select"/);
});

test("Books year navigation has a dedicated action and never routes to Timeline", () => {
  assert.match(appSource, /data-action="journal-books-year"/);
  assert.match(appSource, /action === "journal-books-year"\) this\.selectBooksYear/);
  assert.match(appSource, /private selectBooksYear\(year: string\)[\s\S]*?this\.showMonthlyBooks\(\);/);
  assert.match(appSource, /private filterTimelineYear\(year: string\)[\s\S]*?this\.showTimeline\(\);/);
  assert.match(appSource, /private selectedTimelineMonthKey/);
  assert.match(appSource, /private selectedBooksYear/);
  assert.match(appSource, /private selectedBooksMonthKey/);
});

test("Books month navigation remains in Books/Reader and crop renderer is shared", () => {
  const monthNavigation = appSource.match(/private moveJournalMonth\([\s\S]*?\n  private journalNavigationState/)?.[0] ?? "";
  assert.match(monthNavigation, /if \(this\.journalMode === "books"\) this\.showMonthlyBooks\(\);/);
  assert.match(monthNavigation, /else this\.openMonthlyBook\(this\.selectedBooksMonthKey\);/);
  assert.doesNotMatch(monthNavigation, /else this\.showTimeline\(\)/);
  assert.ok((appSource.match(/this\.renderJournalImageCrop\(item,/g) ?? []).length >= 2);
  const readerCropRule = cssSource.match(/\.journal-reading-photo-frame \.journal-inline-photo \{[\s\S]*?\}/)?.[0] ?? "";
  const inlineCropRule = cssSource.match(/  \.journal-inline-photo \{[\s\S]*?\n  \}/)?.[0] ?? "";
  assert.doesNotMatch(readerCropRule, /object-fit:\s*cover/);
  assert.doesNotMatch(inlineCropRule, /object-fit:\s*cover/);
  assert.match(readerCropRule, /height:\s*auto/);
  assert.match(inlineCropRule, /height:\s*auto/);
});
