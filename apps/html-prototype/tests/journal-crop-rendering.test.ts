import assert from "node:assert/strict";
import test from "node:test";
import { createDiaryLibrary, upsertDiaryPageDraft } from "../src/systems/DiaryLibrary.js";
import { makeDiaryEntry, normalizeDiaryEntry } from "../src/systems/DiaryImport.js";
import { journalMediaCropRenderModel, normalizeJournalMediaCrop } from "../src/systems/JournalCrop.js";

function sourceRectangleFromModel(model: ReturnType<typeof journalMediaCropRenderModel>) {
  const left = -model.imageLeftPercent / model.imageWidthPercent * 100;
  const top = -model.imageTopPercent / model.imageHeightPercent * 100;
  const width = 100 / (model.imageWidthPercent / 100);
  const height = 100 / (model.imageHeightPercent / 100);
  return { x: left, y: top, width, height };
}

test("full source crop preserves the original source rectangle", () => {
  const model = journalMediaCropRenderModel({ x: 0, y: 0, width: 100, height: 100 }, 4000, 3000);

  assert.ok(Math.abs(model.frameAspect - 4 / 3) < 0.000001);
  assert.deepEqual(sourceRectangleFromModel(model), { x: 0, y: 0, width: 100, height: 100 });
});

test("square, portrait, 16:9, freeform, off-center, and edge crops preserve their source rectangles", () => {
  const cases = [
    { crop: { x: 25, y: 25, width: 50, height: 50 }, expectedAspect: 1, source: { width: 100, height: 100 } },
    { crop: { x: 20, y: 5, width: 30, height: 70 }, expectedAspect: (4000 / 3000) * 30 / 70, source: { width: 4000, height: 3000 } },
    { crop: { x: 10, y: 20, width: 80, height: 45 }, expectedAspect: (1920 / 1080) * 80 / 45, source: { width: 1920, height: 1080 } },
    { crop: { x: 7, y: 13, width: 61, height: 37 }, expectedAspect: (3000 / 4000) * 61 / 37, source: { width: 3000, height: 4000 } },
    { crop: { x: 0, y: 0, width: 18, height: 24 }, expectedAspect: (1200 / 800) * 18 / 24, source: { width: 1200, height: 800 } },
    { crop: { x: 77, y: 68, width: 23, height: 32 }, expectedAspect: (1200 / 800) * 23 / 32, source: { width: 1200, height: 800 } }
  ];

  for (const item of cases) {
    const model = journalMediaCropRenderModel(item.crop, item.source.width, item.source.height);
    assert.ok(Math.abs(model.frameAspect - item.expectedAspect) < 0.000001);
    const actual = sourceRectangleFromModel(model);
    assert.ok(Math.abs(actual.x - item.crop.x) < 0.000001);
    assert.ok(Math.abs(actual.y - item.crop.y) < 0.000001);
    assert.ok(Math.abs(actual.width - item.crop.width) < 0.000001);
    assert.ok(Math.abs(actual.height - item.crop.height) < 0.000001);
  }
});

test("legacy media can use natural dimensions without rewriting the saved crop", () => {
  const savedCrop = { x: 12, y: 19, width: 68, height: 41 };
  const model = journalMediaCropRenderModel(savedCrop, 4032, 3024);

  assert.deepEqual(model.crop, savedCrop);
  assert.ok(Math.abs(model.frameAspect - (4032 * savedCrop.width) / (3024 * savedCrop.height)) < 0.000001);
});

test("crop normalization is percentage-based and does not mutate saved input", () => {
  const savedCrop = { x: 88, y: 91, width: 40, height: 30 };
  const normalized = normalizeJournalMediaCrop(savedCrop);

  assert.deepEqual(savedCrop, { x: 88, y: 91, width: 40, height: 30 });
  assert.deepEqual(normalized, { x: 60, y: 70, width: 40, height: 30 });
});

test("render model has no second object-fit crop", () => {
  const model = journalMediaCropRenderModel({ x: 10, y: 20, width: 80, height: 45 }, 1920, 1080);

  assert.equal(model.objectFit, "none");
});

test("saved and reloaded DiaryMedia keeps the exact crop rectangle", () => {
  const crop = { x: 37, y: 11, width: 49, height: 63 };
  const entry = {
    ...makeDiaryEntry("2025-10-15", "Crop persistence", "Fictional crop page.", "crop-persistence"),
    media: [{ id: "media-1", type: "image" as const, src: "data:image/jpeg;base64,fixture", crop }]
  };
  const saved = upsertDiaryPageDraft(createDiaryLibrary(), entry);
  const reloaded = normalizeDiaryEntry(saved.entries[0]);

  assert.deepEqual(reloaded.media?.[0]?.crop, crop);
});
