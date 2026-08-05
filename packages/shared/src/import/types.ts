import type { DiaryEntryInput } from "../schemas/diary-entry";

export type ImportDraftEntry = {
  id: string;
  entryDate: string;
  title: string;
  body: string;
  weather?: string;
  confidence: number;
  warnings: string[];
  peopleCandidates: string[];
  placeCandidates: string[];
};

export type DiaryImportResult = {
  rawText: string;
  drafts: ImportDraftEntry[];
  warnings: string[];
};

export type ConfirmedImportEntry = DiaryEntryInput;
