import type { DiaryEntry, DiaryMedia, DiaryPhoto, ScrapbookElement, ScrapbookLayout } from "../types.js";

const defaultLayout = (): ScrapbookLayout => ({ elements: [] });

export function diaryTextFrame(): { x: number; y: number; w: number; h: number } {
  return { x: 5, y: 6, w: 48, h: 82 };
}

function withLayout(entry: DiaryEntry): DiaryEntry {
  return {
    ...entry,
    photos: entry.photos ?? [],
    media: entry.media ?? [],
    scrapbookLayout: entry.scrapbookLayout ?? defaultLayout()
  };
}

function updateElement(entry: DiaryEntry, elementId: string, updater: (element: ScrapbookElement) => ScrapbookElement): DiaryEntry {
  const base = withLayout(entry);
  return {
    ...base,
    scrapbookLayout: {
      elements: base.scrapbookLayout!.elements.map((element) => element.id === elementId ? updater(element) : element)
    }
  };
}

function clampPercent(value: number): number {
  return Math.max(0, Math.min(100, value));
}

export function addPhotoAttachment(entry: DiaryEntry, photo: DiaryPhoto): DiaryEntry {
  const base = withLayout(entry);
  const photos = base.photos!.some((item) => item.id === photo.id)
    ? base.photos!.map((item) => item.id === photo.id ? photo : item)
    : [...base.photos!, photo];
  return { ...base, photos };
}

export function removePhotoAttachment(entry: DiaryEntry, photoId: string): DiaryEntry {
  const base = withLayout(entry);
  return {
    ...base,
    photos: base.photos!.filter((photo) => photo.id !== photoId),
    scrapbookLayout: {
      elements: base.scrapbookLayout!.elements.filter((element) =>
        element.type === "photo" ? element.photoId !== photoId : element.sourcePhotoId !== photoId
      )
    }
  };
}

export function addPhotoElement(entry: DiaryEntry, photoId: string, elementId: string): DiaryEntry {
  const base = withLayout(entry);
  const maxZ = Math.max(0, ...base.scrapbookLayout!.elements.map((element) => element.zIndex));
  return {
    ...base,
    scrapbookLayout: {
      elements: [
        ...base.scrapbookLayout!.elements,
        {
          id: elementId,
          type: "photo",
          photoId,
          x: 40,
          y: 40,
          scale: 1,
          rotation: 0,
          zIndex: maxZ + 1
        }
      ]
    }
  };
}

export function addJournalMedia(entry: DiaryEntry, media: DiaryMedia): DiaryEntry {
  const base = withLayout(entry);
  const nextMedia = base.media!.some((item) => item.id === media.id)
    ? base.media!.map((item) => item.id === media.id ? media : item)
    : [...base.media!, media];
  return { ...base, media: nextMedia };
}

export function removeJournalMedia(entry: DiaryEntry, mediaId: string): DiaryEntry {
  const base = withLayout(entry);
  return { ...base, media: base.media!.filter((media) => media.id !== mediaId) };
}

export function diaryMediaItems(entry: DiaryEntry): DiaryMedia[] {
  const photos = (entry.photos ?? []).map((photo): DiaryMedia => ({
    id: photo.id,
    type: "image",
    storageKey: photo.storageKey,
    src: photo.src,
    caption: photo.caption,
    crop: photo.crop
  }));
  return [...photos, ...(entry.media ?? [])];
}

export function attachPhotoAndPlaceOnPage(entry: DiaryEntry, photo: DiaryPhoto, elementId: string): DiaryEntry {
  return addPhotoElement(addPhotoAttachment(entry, photo), photo.id, elementId);
}

export function createCutoutElement(entry: DiaryEntry, sourcePhotoId: string, elementId: string, shape: "rectangle" | "circle" = "rectangle"): DiaryEntry {
  const base = withLayout(entry);
  const maxZ = Math.max(0, ...base.scrapbookLayout!.elements.map((element) => element.zIndex));
  return {
    ...base,
    scrapbookLayout: {
      elements: [
        ...base.scrapbookLayout!.elements,
        {
          id: elementId,
          type: "cutout",
          sourcePhotoId,
          crop: { shape },
          x: 52,
          y: 46,
          scale: 1,
          rotation: -4,
          zIndex: maxZ + 1
        }
      ]
    }
  };
}

export function moveScrapbookElement(entry: DiaryEntry, elementId: string, x: number, y: number): DiaryEntry {
  return updateElement(entry, elementId, (element) => ({ ...element, x: clampPercent(x), y: clampPercent(y) }));
}

export function resizeScrapbookElement(entry: DiaryEntry, elementId: string, scale: number): DiaryEntry {
  return updateElement(entry, elementId, (element) => ({ ...element, scale: Math.max(0.2, Math.min(3, scale)) }));
}

export function rotateScrapbookElement(entry: DiaryEntry, elementId: string, rotation: number): DiaryEntry {
  return updateElement(entry, elementId, (element) => ({ ...element, rotation }));
}

export function layerScrapbookElement(entry: DiaryEntry, elementId: string, direction: "front" | "back"): DiaryEntry {
  const base = withLayout(entry);
  const zValues = base.scrapbookLayout!.elements.map((element) => element.zIndex);
  const targetZ = direction === "front" ? Math.max(0, ...zValues) + 1 : Math.min(0, ...zValues) - 1;
  return updateElement(base, elementId, (element) => ({ ...element, zIndex: targetZ }));
}

export function deleteScrapbookElement(entry: DiaryEntry, elementId: string): DiaryEntry {
  const base = withLayout(entry);
  return {
    ...base,
    scrapbookLayout: {
      elements: base.scrapbookLayout!.elements.filter((element) => element.id !== elementId)
    }
  };
}
