import type { DiaryEntry, DiaryPhoto, ScrapbookElement, ScrapbookLayout } from "../types.js";

const defaultLayout = (): ScrapbookLayout => ({ elements: [] });

function withLayout(entry: DiaryEntry): DiaryEntry {
  return {
    ...entry,
    photos: entry.photos ?? [],
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

export function addPhotoAttachment(entry: DiaryEntry, photo: DiaryPhoto): DiaryEntry {
  const base = withLayout(entry);
  const photos = base.photos!.some((item) => item.id === photo.id)
    ? base.photos!.map((item) => item.id === photo.id ? photo : item)
    : [...base.photos!, photo];
  return { ...base, photos };
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

export function moveScrapbookElement(entry: DiaryEntry, elementId: string, x: number, y: number): DiaryEntry {
  return updateElement(entry, elementId, (element) => ({ ...element, x, y }));
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
