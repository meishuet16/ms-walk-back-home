import assert from "node:assert/strict";
import test from "node:test";
import { addPhotoAttachment, addPhotoElement, createCutoutElement, diaryTextFrame, moveScrapbookElement, removePhotoAttachment } from "../src/systems/ScrapbookComposer.js";
import { createDiaryLibrary, openDiaryPageForDate, upsertDiaryPageDraft } from "../src/systems/DiaryLibrary.js";
import { makeDiaryEntry, normalizeDiaryEntry } from "../src/systems/DiaryImport.js";
import { diaryMoodOptions } from "../src/systems/DiaryMood.js";

test("write today creates a diary page draft for the requested date", () => {
  const opened = openDiaryPageForDate(createDiaryLibrary(), "2026-08-10");

  assert.equal(opened.entry.date, "2026-08-10");
  assert.equal(opened.entry.memoryKind, "diary");
  assert.equal(opened.entry.mood, "calm");
  assert.equal(opened.created, true);
  assert.equal(opened.library.entries.length, 1);
});

test("diary page mood is normalized and preserved on entries", () => {
  const entry = normalizeDiaryEntry({
    date: "2026-08-10",
    title: "Mood",
    body: "A fictional page.",
    mood: "excited"
  });
  const invalid = normalizeDiaryEntry({
    date: "2026-08-11",
    title: "Mood fallback",
    body: "Another page.",
    mood: "stormy" as never
  });

  assert.equal(entry.mood, "excited");
  assert.equal(invalid.mood, "calm");
});

test("journal mood options have distinct gentle expressions", () => {
  assert.equal(diaryMoodOptions.length, 5);
  assert.equal(new Set(diaryMoodOptions.map((mood) => mood.expression)).size, diaryMoodOptions.length);
  assert.equal(diaryMoodOptions.some((mood) => mood.expression === "sparkle-smile"), true);
});

test("write today reuses the existing diary page for that date", () => {
  const existing = makeDiaryEntry("2026-08-10", "Rain Desk", "Fictional text.");
  const opened = openDiaryPageForDate(createDiaryLibrary([existing]), "2026-08-10");

  assert.equal(opened.entry.id, existing.id);
  assert.equal(opened.created, false);
  assert.equal(opened.library.entries.length, 1);
});

test("upserting a diary page draft preserves photos and layout on the diary entry", () => {
  const entry = addPhotoElement(
    addPhotoAttachment(makeDiaryEntry("2026-08-10", "Rain Desk", "Fictional text."), {
      id: "photo-1",
      storageKey: "diary-images/photo-1",
      src: "blob://photo-1",
      caption: "desk"
    }),
    "photo-1",
    "element-1"
  );
  const moved = moveScrapbookElement(entry, "element-1", 145, -20);
  const saved = upsertDiaryPageDraft(createDiaryLibrary(), moved);
  const element = saved.entries[0].scrapbookLayout?.elements[0];

  assert.equal(saved.entries[0].photos?.[0].storageKey, "diary-images/photo-1");
  assert.equal(element?.x, 100);
  assert.equal(element?.y, 0);
});

test("removing an attached photo clears its placed page elements", () => {
  const entry = addPhotoElement(
    createCutoutElement(
      addPhotoAttachment(makeDiaryEntry("2026-08-10", "Clear", "Fictional text."), {
        id: "photo-1",
        storageKey: "diary-images/photo-1",
        src: "blob://photo-1",
        caption: "desk"
      }),
      "photo-1",
      "cutout-1",
      "circle"
    ),
    "photo-1",
    "element-1"
  );
  const cleared = removePhotoAttachment(entry, "photo-1");

  assert.equal(cleared.photos?.length, 0);
  assert.deepEqual(cleared.scrapbookLayout?.elements, []);
});

test("cutout elements stay attached to the current diary page", () => {
  const entry = createCutoutElement(makeDiaryEntry("2026-08-10", "Sticker", "Fictional text."), "photo-1", "cutout-1", "circle");

  assert.deepEqual(entry.scrapbookLayout?.elements[0], {
    id: "cutout-1",
    type: "cutout",
    sourcePhotoId: "photo-1",
    crop: { shape: "circle" },
    x: 52,
    y: 46,
    scale: 1,
    rotation: -4,
    zIndex: 1
  });
});

test("diary writing has a stable page-local frame on the same composition page", () => {
  assert.deepEqual(diaryTextFrame(), {
    x: 5,
    y: 6,
    w: 48,
    h: 82
  });
});
