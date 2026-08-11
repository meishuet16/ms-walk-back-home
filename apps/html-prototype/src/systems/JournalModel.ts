import type { DiaryEntry } from "../types.js";

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
  daysWritten: number;
  theme: "forest" | "cream" | "rain" | "brown" | "yellow" | "rose";
};

export const journalBatchSize = 5;

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

export function visibleTimelineEntries(month: JournalMonth, visibleCount: number): DiaryEntry[] {
  return month.entries.slice(0, Math.max(journalBatchSize, visibleCount));
}

export function hasMoreTimelineEntries(month: JournalMonth, visibleCount: number): boolean {
  return month.entries.length > Math.max(journalBatchSize, visibleCount);
}

export function monthlyBookSummaries(entries: DiaryEntry[]): MonthlyBookSummary[] {
  return deriveJournalMonths(entries).map((month, index) => ({
    key: month.key,
    label: month.label,
    year: month.year,
    month: month.month,
    entryCount: month.entries.length,
    photoCount: month.entries.reduce((sum, entry) => sum + (entry.photos?.length ?? 0), 0),
    daysWritten: new Set(month.entries.map((entry) => entry.date)).size,
    theme: themes[index % themes.length]
  }));
}

export function monthlyPdfFilename(monthKey: string): string {
  return `WalkBackHome-Journal-${monthKey}.pdf`;
}

function escapePdfText(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)").replace(/\r?\n/g, " ");
}

export function makeMonthlyJournalPdf(month: JournalMonth): Blob {
  const pages = [
    {
      title: `Walk Back Home Journal`,
      lines: [month.label, `${month.entries.length} entries`, `${new Set(month.entries.map((entry) => entry.date)).size} written days`]
    },
    ...month.entries.map((entry) => ({
      title: `${entry.date} · ${entry.title}`,
      lines: [
        entry.body || "Empty draft",
        `${entry.photos?.length ?? 0} photos · ${entry.scrapbookLayout?.elements.length ?? 0} placed elements`
      ]
    }))
  ];
  const objects: string[] = [];
  const pageRefs: number[] = [];
  objects.push("<< /Type /Catalog /Pages 2 0 R >>");
  objects.push("<< /Type /Pages /Kids [] /Count 0 >>");
  for (const page of pages) {
    const contentId = objects.length + 2;
    const pageId = objects.length + 1;
    pageRefs.push(pageId);
    objects.push(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 420 595] /Resources << /Font << /F1 ${contentId + 1} 0 R >> >> /Contents ${contentId} 0 R >>`);
    const body = [
      "q 0.96 0.90 0.78 rg 32 36 356 520 re f Q",
      "q 0.52 0.33 0.18 RG 32 36 356 520 re S Q",
      "BT /F1 18 Tf 48 520 Td (" + escapePdfText(page.title.slice(0, 60)) + ") Tj ET",
      ...page.lines.flatMap((line, index) => {
        const chunks = line.match(/.{1,58}/g) ?? [""];
        return chunks.slice(0, 11 - index).map((chunk, chunkIndex) => `BT /F1 10 Tf 52 ${486 - (index * 88 + chunkIndex * 14)} Td (${escapePdfText(chunk)}) Tj ET`);
      })
    ].join("\n");
    objects.push(`<< /Length ${body.length} >>\nstream\n${body}\nendstream`);
    objects.push("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>");
  }
  objects[1] = `<< /Type /Pages /Kids [${pageRefs.map((ref) => `${ref} 0 R`).join(" ")}] /Count ${pageRefs.length} >>`;
  let pdf = "%PDF-1.4\n";
  const offsets = [0];
  objects.forEach((object, index) => {
    offsets.push(pdf.length);
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });
  const xref = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (const offset of offsets.slice(1)) pdf += `${String(offset).padStart(10, "0")} 00000 n \n`;
  pdf += `trailer\n<< /Root 1 0 R /Size ${objects.length + 1} >>\nstartxref\n${xref}\n%%EOF`;
  return new Blob([pdf], { type: "application/pdf" });
}
