import type { DiaryImportResult, ImportDraftEntry } from "./types";

const CHINESE_DATE = /^(\d{4})年(\d{1,2})月(\d{1,2})日(?:\s+(.+))?$/;
const ISO_DATE = /^(\d{4})-(\d{1,2})-(\d{1,2})(?:\s+(.+))?$/;
const ENGLISH_DATE =
  /^(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2}),\s+(\d{4})(?:\s+(.+))?$/i;

const MONTHS: Record<string, string> = {
  january: "01",
  february: "02",
  march: "03",
  april: "04",
  may: "05",
  june: "06",
  july: "07",
  august: "08",
  september: "09",
  october: "10",
  november: "11",
  december: "12"
};

type Heading = {
  date: string;
  title: string;
  weather?: string;
};

export function parseDiaryImport(rawText: string): DiaryImportResult {
  const lines = rawText.replace(/\r\n/g, "\n").split("\n");
  const drafts: ImportDraftEntry[] = [];
  let current: { heading: Heading; bodyLines: string[] } | null = null;

  for (const line of lines) {
    const heading = parseHeading(line.trim());
    if (heading) {
      if (current) {
        drafts.push(toDraft(current.heading, current.bodyLines, drafts.length));
      }
      current = { heading, bodyLines: [] };
      continue;
    }
    if (current) {
      current.bodyLines.push(line);
    }
  }

  if (current) {
    drafts.push(toDraft(current.heading, current.bodyLines, drafts.length));
  }

  if (drafts.length === 0) {
    return {
      rawText,
      drafts: [
        {
          id: "import-draft-001",
          entryDate: "",
          title: "Untitled imported note",
          body: rawText.trim(),
          confidence: 0.2,
          warnings: ["No date heading detected."],
          peopleCandidates: [],
          placeCandidates: []
        }
      ],
      warnings: ["No date heading detected."]
    };
  }

  return { rawText, drafts, warnings: [] };
}

function parseHeading(line: string): Heading | null {
  const chinese = CHINESE_DATE.exec(line);
  if (chinese) {
    return {
      date: formatDate(chinese[1]!, chinese[2]!, chinese[3]!),
      title: line,
      weather: chinese[4]
    };
  }

  const iso = ISO_DATE.exec(line);
  if (iso) {
    return {
      date: formatDate(iso[1]!, iso[2]!, iso[3]!),
      title: line,
      weather: iso[4]
    };
  }

  const english = ENGLISH_DATE.exec(line);
  if (english) {
    return {
      date: formatDate(english[3]!, MONTHS[english[1]!.toLowerCase()]!, english[2]!),
      title: line,
      weather: english[4]
    };
  }

  return null;
}

function toDraft(heading: Heading, bodyLines: string[], index: number): ImportDraftEntry {
  const body = bodyLines.join("\n").trim();
  return {
    id: `import-draft-${String(index + 1).padStart(3, "0")}`,
    entryDate: heading.date,
    title: heading.title,
    body,
    weather: heading.weather,
    confidence: body.length > 0 ? 0.95 : 0.7,
    warnings: body.length > 0 ? [] : ["Entry has a date heading but no body."],
    peopleCandidates: [],
    placeCandidates: []
  };
}

function formatDate(year: string, month: string, day: string): string {
  return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
}
