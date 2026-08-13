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

test("monthly pdf renders diary photos in large readable slots", () => {
  assert.match(appSource, /drawDiaryPhotosOnPdfPage\(pageCtx, photos\.slice\(0, photosDrawn\), 150, nextY, 2, 300, 42\)/);
  assert.match(appSource, /offset \+= 4/);
  assert.match(appSource, /drawDiaryPhotosOnPdfPage\(ctx, pagePhotos, 150, 260, 2, 390, 64\)/);
});

test("timeline date filtering uses a calendar-style input instead of month dropdowns", () => {
  assert.match(appSource, /id="timeline-date-input" type="date"/);
  assert.match(appSource, /id="timeline-date-scope"/);
  assert.doesNotMatch(appSource, /id="timeline-month-select"/);
  assert.doesNotMatch(appSource, /id="timeline-day-select"/);
});
