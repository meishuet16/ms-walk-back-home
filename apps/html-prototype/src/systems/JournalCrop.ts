import type { DiaryMediaCrop } from "../types.js";

export type JournalCropRenderModel = {
  crop: DiaryMediaCrop;
  sourceAspect: number;
  frameAspect: number;
  imageWidthPercent: number;
  imageHeightPercent: number;
  imageLeftPercent: number;
  imageTopPercent: number;
  objectFit: "none";
};

function finiteNumber(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function clamp(value: unknown, min: number, max: number, fallback: number): number {
  return Math.max(min, Math.min(max, finiteNumber(value, fallback)));
}

export function normalizeJournalMediaCrop(crop: unknown): DiaryMediaCrop {
  if (!crop || typeof crop !== "object") return { x: 0, y: 0, width: 100, height: 100 };
  const candidate = crop as Partial<DiaryMediaCrop>;
  const width = clamp(candidate.width, 8, 100, 100);
  const height = clamp(candidate.height, 8, 100, 100);
  return {
    x: clamp(candidate.x, 0, 100 - width, 0),
    y: clamp(candidate.y, 0, 100 - height, 0),
    width,
    height
  };
}

export function journalMediaCropRenderModel(cropValue: unknown, sourceWidth = 1, sourceHeight = 1): JournalCropRenderModel {
  const crop = normalizeJournalMediaCrop(cropValue);
  const safeWidth = Math.max(1, finiteNumber(sourceWidth, 1));
  const safeHeight = Math.max(1, finiteNumber(sourceHeight, 1));
  const sourceAspect = safeWidth / safeHeight;
  return {
    crop,
    sourceAspect,
    frameAspect: sourceAspect * crop.width / crop.height,
    imageWidthPercent: 10000 / crop.width,
    imageHeightPercent: 10000 / crop.height,
    imageLeftPercent: -crop.x / crop.width * 100,
    imageTopPercent: -crop.y / crop.height * 100,
    objectFit: "none"
  };
}

export function journalMediaCropRenderStyle(model: JournalCropRenderModel): string {
  return [
    `--crop-source-aspect:${model.sourceAspect.toFixed(4)}`,
    `--crop-aspect:${model.frameAspect.toFixed(4)}`,
    `--crop-width:${model.crop.width.toFixed(4)}`,
    `--crop-height:${model.crop.height.toFixed(4)}`,
    `--crop-img-width:${model.crop.width.toFixed(4)}`,
    `--crop-img-height:${model.crop.height.toFixed(4)}`,
    `--crop-left:${model.imageLeftPercent.toFixed(4)}%`,
    `--crop-top:${model.imageTopPercent.toFixed(4)}%`,
    `--crop-render-width:${model.imageWidthPercent.toFixed(4)}%`,
    `--crop-render-height:${model.imageHeightPercent.toFixed(4)}%`
  ].join(";") + ";";
}
