import type { DiaryEntry, DiaryLibraryState, JournalBookCover, MemoryKind } from "../types.js";
import { sortDiaryEntriesForTimeline, type DiaryTimelineSort } from "./DiaryImport.js";

export type JournalMonth = {
  key: string;
  year: number;
  month: number;
  label: string;
  entries: DiaryEntry[];
};

export type MonthlyBookSummary = {
  key: string;
  label: string;
  year: number;
  month: number;
  entryCount: number;
  photoCount: number;
  videoCount: number;
  daysWritten: number;
  cover?: JournalBookCover;
  theme: "forest" | "cream" | "rain" | "brown" | "yellow" | "rose";
};

export const journalBatchSize = 5;
export type TimelineDateScope = "all" | "year" | "month" | "date";

const monthNames = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const themes: MonthlyBookSummary["theme"][] = ["forest", "cream", "rain", "brown", "yellow", "rose"];

export function monthKeyForDate(date: string): string {
  return /^\d{4}-\d{2}/.test(date) ? date.slice(0, 7) : "undated";
}

export function monthLabel(year: number, month: number): string {
  return `${monthNames[month - 1] ?? "Unknown"} ${year}`;
}

export function deriveJournalMonths(entries: DiaryEntry[]): JournalMonth[] {
  const groups = new Map<string, DiaryEntry[]>();
  for (const entry of entries) {
    const key = monthKeyForDate(entry.date);
    groups.set(key, [...(groups.get(key) ?? []), entry]);
  }
  return [...groups.entries()]
    .filter(([key]) => key !== "undated")
    .map(([key, monthEntries]) => {
      const [yearText, monthText] = key.split("-");
      const year = Number(yearText);
      const month = Number(monthText);
      return {
        key,
        year,
        month,
        label: monthLabel(year, month),
        entries: sortMonthEntries(monthEntries)
      };
    })
    .sort((a, b) => b.key.localeCompare(a.key));
}

export function sortMonthEntries(entries: DiaryEntry[]): DiaryEntry[] {
  return [...entries].sort((a, b) => {
    const date = b.date.localeCompare(a.date);
    if (date !== 0) return date;
    return b.id.localeCompare(a.id);
  });
}

export function selectedOrLatestMonth(entries: DiaryEntry[], selectedKey = ""): JournalMonth {
  const months = deriveJournalMonths(entries);
  const selected = months.find((month) => month.key === selectedKey) ?? months[0];
  if (selected) return selected;
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const key = `${year}-${String(month).padStart(2, "0")}`;
  return { key, year, month, label: monthLabel(year, month), entries: [] };
}

export function adjacentMonthKey(currentKey: string, direction: -1 | 1): string {
  const [yearText, monthText] = currentKey.split("-");
  const date = new Date(Number(yearText), Number(monthText) - 1 + direction, 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export function timelineCursorKeyForStep(currentKey: string, scope: TimelineDateScope, direction: -1 | 1): string {
  const safeKey = /^\d{4}-\d{2}$/.test(currentKey) ? currentKey : `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}`;
  if (scope === "year") {
    const [yearText, monthText] = safeKey.split("-");
    return `${Number(yearText) + direction}-${monthText}`;
  }
  return adjacentMonthKey(safeKey, direction);
}

export function visibleTimelineEntries(month: JournalMonth, visibleCount: number): DiaryEntry[] {
  return month.entries.slice(0, Math.max(journalBatchSize, visibleCount));
}

export function hasMoreTimelineEntries(month: JournalMonth, visibleCount: number): boolean {
  return month.entries.length > Math.max(journalBatchSize, visibleCount);
}

export function searchJournalEntries(entries: DiaryEntry[], query: string): DiaryEntry[] {
  const normalized = query.trim().toLocaleLowerCase();
  if (!normalized) return entries;
  return entries.filter((entry) => {
    const searchable = [
      entry.date,
      entry.title,
      entry.body,
      entry.location ?? "",
      entry.weather ?? "",
      entry.memoryKind,
      entry.chapterId ?? ""
    ].join("\n").toLocaleLowerCase();
    return searchable.includes(normalized);
  });
}

export type TimelineMemoryKindFilter = "all" | MemoryKind;

export function filterJournalEntries(entries: DiaryEntry[], options: { query?: string; memoryKind?: TimelineMemoryKindFilter; date?: string } = {}): DiaryEntry[] {
  const searched = searchJournalEntries(entries, options.query ?? "");
  return searched.filter((entry) => {
    if (options.memoryKind && options.memoryKind !== "all" && entry.memoryKind !== options.memoryKind) return false;
    if (options.date && entry.date !== options.date) return false;
    return true;
  });
}

export function makeTimelineMonthView(month: JournalMonth, sort: DiaryTimelineSort, query = "", memoryKind: TimelineMemoryKindFilter = "all", date = ""): JournalMonth {
  return {
    ...month,
    entries: sortDiaryEntriesForTimeline(filterJournalEntries(month.entries, { query, memoryKind, date }), sort)
  };
}

export function defaultMonthlyCover(monthKey: string): JournalBookCover {
  return {
    src: `linear-gradient(145deg, #f5e4bd, #b98242 54%, #4f5f43)`,
    caption: `Walk Back Home ${monthKey}`,
    updatedAt: "default"
  };
}

export function upsertMonthlyCover(library: DiaryLibraryState, monthKey: string, cover: JournalBookCover): DiaryLibraryState {
  return {
    ...library,
    monthlyCovers: {
      ...(library.monthlyCovers ?? {}),
      [monthKey]: cover
    }
  };
}

export function monthlyBookSummaries(entries: DiaryEntry[], covers: Record<string, JournalBookCover> = {}): MonthlyBookSummary[] {
  return deriveJournalMonths(entries).map((month, index) => ({
    key: month.key,
    label: month.label,
    year: month.year,
    month: month.month,
    entryCount: month.entries.length,
    photoCount: month.entries.reduce((sum, entry) => sum + (entry.photos?.length ?? 0), 0),
    videoCount: month.entries.reduce((sum, entry) => sum + (entry.media ?? []).filter((media) => media.type === "video").length, 0),
    daysWritten: new Set(month.entries.map((entry) => entry.date)).size,
    cover: covers[month.key] ?? defaultMonthlyCover(month.key),
    theme: themes[index % themes.length]
  }));
}

export function monthlyPdfFilename(monthKey: string): string {
  return `WalkBackHome-Journal-${monthKey}.pdf`;
}

export type MonthlyJournalPdfPage = {
  dataUrl: string;
  width: number;
  height: number;
};

export type MonthlyPdfPlanItem =
  | { type: "cover"; monthKey: string; cover: JournalBookCover }
  | { type: "overview"; entryCount: number; daysWritten: number }
  | { type: "entry"; id: string; title: string; date: string }
  | { type: "image"; id: string; caption?: string }
  | { type: "video-poster"; id: string; caption?: string };

export function monthlyPdfPagePlan(month: JournalMonth, cover = defaultMonthlyCover(month.key)): MonthlyPdfPlanItem[] {
  const items: MonthlyPdfPlanItem[] = [
    { type: "cover", monthKey: month.key, cover },
    { type: "overview", entryCount: month.entries.length, daysWritten: new Set(month.entries.map((entry) => entry.date)).size }
  ];
  for (const entry of [...month.entries].reverse()) {
    items.push({ type: "entry", id: entry.id, title: entry.title, date: entry.date });
    for (const photo of entry.photos ?? []) items.push({ type: "image", id: photo.id, caption: photo.caption });
    for (const media of entry.media ?? []) {
      if (media.type === "image") items.push({ type: "image", id: media.id, caption: media.caption });
      if (media.type === "video") items.push({ type: "video-poster", id: media.id, caption: media.caption });
    }
  }
  return items;
}

const textEncoder = new TextEncoder();

function pdfText(value: string): Uint8Array {
  return textEncoder.encode(value);
}

function jpegBytesFromDataUrl(dataUrl: string): Uint8Array {
  const [, encoded = ""] = dataUrl.split(",");
  const binary = atob(encoded);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  return bytes;
}

function concatBytes(parts: Uint8Array[]): Uint8Array {
  const total = parts.reduce((sum, part) => sum + part.byteLength, 0);
  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const part of parts) {
    bytes.set(part, offset);
    offset += part.byteLength;
  }
  return bytes;
}

export function makeMonthlyJournalImagePdf(month: JournalMonth, pages: MonthlyJournalPdfPage[]): Blob {
  const safePages = pages.length ? pages : [{ dataUrl: "data:image/jpeg;base64,", width: 1, height: 1 }];
  const objects: Uint8Array[] = [];
  const pageRefs: number[] = [];
  objects.push(pdfText("<< /Type /Catalog /Pages 2 0 R >>"));
  objects.push(pdfText("<< /Type /Pages /Kids [] /Count 0 >>"));
  for (const [index, page] of safePages.entries()) {
    const imageBytes = jpegBytesFromDataUrl(page.dataUrl);
    const imageId = objects.length + 1;
    const contentId = objects.length + 2;
    const pageId = objects.length + 3;
    const pageWidth = 420;
    const pageHeight = 595;
    const imageAspect = Math.max(0.01, page.width / Math.max(1, page.height));
    const pageAspect = pageWidth / pageHeight;
    const drawWidth = imageAspect > pageAspect ? pageWidth : pageHeight * imageAspect;
    const drawHeight = imageAspect > pageAspect ? pageWidth / imageAspect : pageHeight;
    const drawX = (pageWidth - drawWidth) / 2;
    const drawY = (pageHeight - drawHeight) / 2;
    const body = `q ${drawWidth.toFixed(2)} 0 0 ${drawHeight.toFixed(2)} ${drawX.toFixed(2)} ${drawY.toFixed(2)} cm /Im${index + 1} Do Q`;
    objects.push(concatBytes([
      pdfText(`<< /Type /XObject /Subtype /Image /Width ${Math.max(1, Math.round(page.width))} /Height ${Math.max(1, Math.round(page.height))} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${imageBytes.byteLength} >>\nstream\n`),
      imageBytes,
      pdfText("\nendstream")
    ]));
    objects.push(pdfText(`<< /Length ${body.length} >>\nstream\n${body}\nendstream`));
    pageRefs.push(pageId);
    objects.push(pdfText(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Resources << /XObject << /Im${index + 1} ${imageId} 0 R >> >> /Contents ${contentId} 0 R >>`));
  }
  objects[1] = pdfText(`<< /Type /Pages /Kids [${pageRefs.map((ref) => `${ref} 0 R`).join(" ")}] /Count ${pageRefs.length} >>`);
  objects.push(pdfText(`<< /Title (Walk Back Home Journal ${month.key}) /Subject (${month.entries.length} entries) >>`));
  const chunks: Uint8Array[] = [pdfText("%PDF-1.4\n")];
  const offsets = [0];
  let byteOffset = chunks[0].byteLength;
  objects.forEach((object, index) => {
    offsets.push(byteOffset);
    const header = pdfText(`${index + 1} 0 obj\n`);
    const footer = pdfText("\nendobj\n");
    chunks.push(header, object, footer);
    byteOffset += header.byteLength + object.byteLength + footer.byteLength;
  });
  const xref = byteOffset;
  let trailer = `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (const offset of offsets.slice(1)) trailer += `${String(offset).padStart(10, "0")} 00000 n \n`;
  trailer += `trailer\n<< /Root 1 0 R /Size ${objects.length + 1} >>\nstartxref\n${xref}\n%%EOF`;
  chunks.push(pdfText(trailer));
  const pdfBytes = concatBytes(chunks);
  const pdfBuffer = pdfBytes.buffer.slice(pdfBytes.byteOffset, pdfBytes.byteOffset + pdfBytes.byteLength) as ArrayBuffer;
  return new Blob([pdfBuffer], { type: "application/pdf" });
}
