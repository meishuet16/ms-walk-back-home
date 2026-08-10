import assert from "node:assert/strict";
import test from "node:test";
import { addPhotoAttachment, addPhotoElement, attachPhotoAndPlaceOnPage, createCutoutElement, diaryTextFrame, moveScrapbookElement, removePhotoAttachment } from "../src/systems/ScrapbookComposer.js";
import { createDiaryLibrary, createNewDiaryPage, formatDiaryWeekday, openDiaryPageForDate, upsertDiaryPageDraft } from "../src/systems/DiaryLibrary.js";
import { makeDiaryEntry, normalizeDiaryEntry, parseDiaryImport } from "../src/systems/DiaryImport.js";
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
    mood: "excited",
    location: "Desk",
    weather: "Clear rain"
  });
  const invalid = normalizeDiaryEntry({
    date: "2026-08-11",
    title: "Mood fallback",
    body: "Another page.",
    mood: "stormy" as never
  });

  assert.equal(entry.mood, "excited");
  assert.equal(entry.location, "Desk");
  assert.equal(entry.weather, "Clear rain");
  assert.equal(invalid.mood, "calm");
});

test("journal mood options have distinct gentle expressions", () => {
  assert.equal(diaryMoodOptions.length, 5);
  assert.equal(new Set(diaryMoodOptions.map((mood) => mood.expression)).size, diaryMoodOptions.length);
  assert.equal(diaryMoodOptions.some((mood) => mood.expression === "sparkle-smile"), true);
});

test("markdown diary imports support metadata and body text", () => {
  const [entry] = parseDiaryImport([
    "# 2026-08-09",
    "Title: Window Rain",
    "Location: Desk",
    "Weather: Rain turning clear",
    "",
    "A small fictional note.",
    "Second line."
  ].join("\n"));

  assert.equal(entry.date, "2026-08-09");
  assert.equal(entry.title, "Window Rain");
  assert.equal(entry.location, "Desk");
  assert.equal(entry.weather, "Rain turning clear");
  assert.equal(entry.body, "A small fictional note.\nSecond line.");
});

test("markdown diary imports can split clean heading blocks into multiple diary entries", () => {
  const imported = parseDiaryImport([
    "# **2026-08-09 小雨转晴**",
    "## 今天其实没发生什么特别的",
    "",
    "今天下午下了很久的雨。",
    "",
    "# **2026-08-10 晴**",
    "Title: 走回房间",
    "",
    "把灯打开以后，房间安静下来。"
  ].join("\n"));

  assert.equal(imported.length, 2);
  assert.equal(imported[0].date, "2026-08-09");
  assert.equal(imported[0].weather, "小雨转晴");
  assert.equal(imported[0].title, "今天其实没发生什么特别的");
  assert.equal(imported[0].body, "今天下午下了很久的雨。");
  assert.equal(imported[1].date, "2026-08-10");
  assert.equal(imported[1].weather, "晴");
  assert.equal(imported[1].memoryKind, "diary");
});

test("markdown diary imports accept compact bold date-weather headings without falling back to every line", () => {
  const imported = parseDiaryImport([
    "#**2026-08-09 小雨转晴**",
    "## 今天其实没发生什么特别的",
    "今天下午下了很久的雨。",
    "- 这一行只是正文，不是一篇新的日记。",
    "",
    "#**2026-08-10 晴**",
    "## 走回房间",
    "把灯打开以后，房间安静下来。"
  ].join("\n"));

  assert.equal(imported.length, 2);
  assert.equal(imported[0].date, "2026-08-09");
  assert.equal(imported[0].weather, "小雨转晴");
  assert.equal(imported[0].body.includes("这一行只是正文"), true);
});

test("plain import ignores non-diary markdown lines instead of creating one entry per line", () => {
  const imported = parseDiaryImport([
    "# Prompt",
    "- format every diary nicely",
    "not a diary line"
  ].join("\n"));

  assert.equal(imported.length, 0);
});

test("write today reuses the existing diary page for that date", () => {
  const existing = makeDiaryEntry("2026-08-10", "Rain Desk", "Fictional text.");
  const opened = openDiaryPageForDate(createDiaryLibrary([existing]), "2026-08-10");

  assert.equal(opened.entry.id, existing.id);
  assert.equal(opened.created, false);
  assert.equal(opened.library.entries.length, 1);
});

test("creating new diary pages does not overwrite existing entries", () => {
  const first = createNewDiaryPage(createDiaryLibrary(), "2026-08-10");
  const second = createNewDiaryPage(first.library, "2026-08-10");

  assert.notEqual(first.entry.id, second.entry.id);
  assert.equal(second.library.entries.length, 2);
});

test("diary weekday follows the selected date immediately", () => {
  assert.equal(formatDiaryWeekday("2026-08-09"), "周日");
  assert.equal(formatDiaryWeekday("2026-08-10"), "周一");
  assert.equal(formatDiaryWeekday("not-a-date"), "");
});

test("journal plus attaches and places a selected photo on the current page", () => {
  const entry = makeDiaryEntry("2026-08-10", "Current Draft", "Still being edited.");
  const updated = attachPhotoAndPlaceOnPage(
    entry,
    { id: "photo-1", storageKey: "diary-images/current/photo-1", src: "blob://photo-1", caption: "desk" },
    "element-1"
  );

  assert.equal(updated.photos?.[0].id, "photo-1");
  assert.equal(updated.scrapbookLayout?.elements[0]?.id, "element-1");
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
