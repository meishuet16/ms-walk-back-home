import assert from "node:assert/strict";
import test from "node:test";
import {
  addPhotoAttachment,
  addPhotoElement,
  deleteScrapbookElement,
  layerScrapbookElement,
  moveScrapbookElement,
  resizeScrapbookElement,
  rotateScrapbookElement
} from "../src/systems/ScrapbookComposer.js";
import { makeDiaryEntry } from "../src/systems/DiaryImport.js";

test("photo attachments are stored on the diary entry", () => {
  const entry = makeDiaryEntry("2026-08-09", "Photo Day", "The table was full of paper.");
  const withPhoto = addPhotoAttachment(entry, { id: "photo-1", src: "data:image/png;base64,abc", caption: "paper" });

  assert.equal(withPhoto.photos?.length, 1);
  assert.equal(withPhoto.photos?.[0].caption, "paper");
  assert.equal(withPhoto.scrapbookLayout?.elements.length, 0);
});

test("photo can be placed, moved, resized, rotated, layered, and deleted", () => {
  const entry = addPhotoAttachment(makeDiaryEntry("2026-08-09", "Photo Day", "Body."), {
    id: "photo-1",
    src: "data:image/png;base64,abc"
  });
  const placed = addPhotoElement(entry, "photo-1", "element-1");
  const moved = moveScrapbookElement(placed, "element-1", 25, 36);
  const resized = resizeScrapbookElement(moved, "element-1", 1.35);
  const rotated = rotateScrapbookElement(resized, "element-1", -12);
  const layered = layerScrapbookElement(rotated, "element-1", "front");
  const element = layered.scrapbookLayout?.elements[0];

  assert.equal(element?.type, "photo");
  assert.equal(element?.x, 25);
  assert.equal(element?.y, 36);
  assert.equal(element?.scale, 1.35);
  assert.equal(element?.rotation, -12);
  assert.equal(element?.zIndex, 2);
  assert.equal(deleteScrapbookElement(layered, "element-1").scrapbookLayout?.elements.length, 0);
});
