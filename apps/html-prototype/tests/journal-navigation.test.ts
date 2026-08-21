import assert from "node:assert/strict";
import test from "node:test";
import { createJournalNavigationState, createJournalReturnSnapshot, journalReturnTarget, moveBooksMonth, moveTimelineMonth, selectBooksYear, selectJournalTab, selectTimelineYear } from "../src/systems/JournalNavigation.js";

const months = ["2026-02", "2026-10", "2025-01", "2025-09"];

test("Books 2026 to 2025 stays in Books and shows only the selected year", () => {
  const initial = createJournalNavigationState("2026-10", "2026-10");
  const next = selectBooksYear(initial, "2025", months);

  assert.equal(next.mode, "books");
  assert.equal(next.booksYear, "2025");
  assert.equal(next.booksMonthKey, "2025-09");
  assert.equal(next.timelineMonthKey, "2026-10");
});

test("Books year selection does not modify Timeline filter state", () => {
  const initial = {
    ...createJournalNavigationState("2026-10", "2026-10"),
    timelineDateScope: "year" as const,
    timelineDateFilter: "",
    timelineFilterAppliedMessage: "Year 2025"
  };
  const next = selectBooksYear(initial, "2025", months);

  assert.equal(next.timelineDateScope, "year");
  assert.equal(next.timelineDateFilter, "");
  assert.equal(next.timelineFilterAppliedMessage, "Year 2025");
});

test("Timeline year filtering changes Timeline state without changing Books state", () => {
  const initial = {
    ...createJournalNavigationState("2026-10", "2026-10"),
    timelineDateScope: "month" as const,
    timelineDateFilter: "2026-10-04",
    timelineFilterAppliedMessage: "Applied · 1 result"
  };
  const next = selectTimelineYear(initial, "2025");

  assert.equal(next.mode, "timeline");
  assert.equal(next.timelineMonthKey, "2025-10");
  assert.equal(next.timelineDateScope, "year");
  assert.equal(next.timelineDateFilter, "");
  assert.equal(next.timelineFilterAppliedMessage, "Year 2025");
  assert.equal(next.booksYear, "2026");
  assert.equal(next.booksMonthKey, "2026-10");
});

test("switching tabs preserves each tab's navigation state", () => {
  const books = selectBooksYear(createJournalNavigationState("2026-10", "2026-10"), "2025", months);
  const timeline = selectTimelineYear(selectJournalTab(books, "timeline"), "2026");
  const restoredBooks = selectJournalTab(timeline, "books");

  assert.equal(timeline.mode, "timeline");
  assert.equal(timeline.timelineMonthKey, "2026-10");
  assert.equal(restoredBooks.mode, "books");
  assert.equal(restoredBooks.booksYear, "2025");
  assert.equal(restoredBooks.booksMonthKey, "2025-09");
});

test("Books month navigation changes only Books context", () => {
  const initial = {
    ...createJournalNavigationState("2026-10", "2025-09"),
    timelineDateScope: "year" as const,
    timelineDateFilter: "",
    timelineFilterAppliedMessage: "Year 2026"
  };
  const next = moveBooksMonth(initial, -1, months);

  assert.equal(next.mode, "books");
  assert.equal(next.booksMonthKey, "2025-01");
  assert.equal(next.booksYear, "2025");
  assert.equal(next.timelineMonthKey, "2026-10");
  assert.equal(next.timelineDateScope, "year");
});

test("Timeline month navigation changes only Timeline context", () => {
  const initial = {
    ...createJournalNavigationState("2026-10", "2025-09"),
    timelineDateScope: "month" as const,
    timelineDateFilter: "2026-10-04",
    timelineFilterAppliedMessage: "Applied · 1 result"
  };
  const next = moveTimelineMonth(initial, -1, "month");

  assert.equal(next.mode, "timeline");
  assert.equal(next.timelineMonthKey, "2026-09");
  assert.equal(next.timelineDateScope, "month");
  assert.equal(next.timelineDateFilter, "");
  assert.equal(next.timelineFilterAppliedMessage, "");
  assert.equal(next.booksYear, "2025");
  assert.equal(next.booksMonthKey, "2025-09");
});

test("reader return snapshot keeps Books surface and scroll", () => {
  const snapshot = createJournalReturnSnapshot("books", "2026-08", "2026", 428);

  assert.deepEqual(journalReturnTarget(snapshot), { mode: "books", monthKey: "2026-08", year: "2026", scrollTop: 428 });
});
