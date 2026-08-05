import { DiaryEntryInputSchema } from "../schemas/diary-entry";
import type { ConfirmedImportEntry, ImportDraftEntry } from "./types";

export function updateDraft(
  drafts: ImportDraftEntry[],
  id: string,
  patch: Partial<Pick<ImportDraftEntry, "entryDate" | "title" | "body" | "weather">>
): ImportDraftEntry[] {
  return drafts.map((draft) => (draft.id === id ? { ...draft, ...patch } : { ...draft }));
}

export function mergeAdjacentDrafts(drafts: ImportDraftEntry[], id: string): ImportDraftEntry[] {
  const index = drafts.findIndex((draft) => draft.id === id);
  if (index < 0 || index >= drafts.length - 1) {
    return drafts.map((draft) => ({ ...draft }));
  }

  const current = drafts[index]!;
  const next = drafts[index + 1]!;
  const merged: ImportDraftEntry = {
    ...current,
    title: `${current.title} / ${next.title}`,
    body: [current.body, next.body].filter(Boolean).join("\n\n"),
    confidence: Math.min(current.confidence, next.confidence),
    warnings: [...current.warnings, ...next.warnings]
  };

  return [...drafts.slice(0, index), merged, ...drafts.slice(index + 2)].map((draft) => ({ ...draft }));
}

export function splitDraft(drafts: ImportDraftEntry[], id: string, lineIndex: number): ImportDraftEntry[] {
  const index = drafts.findIndex((draft) => draft.id === id);
  if (index < 0) {
    return drafts.map((draft) => ({ ...draft }));
  }

  const draft = drafts[index]!;
  const lines = draft.body.split("\n");
  const firstBody = lines.slice(0, lineIndex).join("\n").trim();
  const secondBody = lines.slice(lineIndex).join("\n").trim();
  if (!firstBody || !secondBody) {
    return drafts.map((item) => ({ ...item }));
  }

  const first = { ...draft, body: firstBody };
  const second = {
    ...draft,
    id: `${draft.id}-split`,
    title: `${draft.title} (continued)`,
    body: secondBody,
    warnings: [...draft.warnings, "Split from adjacent imported text."]
  };

  return [...drafts.slice(0, index), first, second, ...drafts.slice(index + 1)].map((item) => ({ ...item }));
}

export function removeDraft(drafts: ImportDraftEntry[], id: string): ImportDraftEntry[] {
  return drafts.filter((draft) => draft.id !== id).map((draft) => ({ ...draft }));
}

export function confirmImportDrafts(drafts: ImportDraftEntry[]): ConfirmedImportEntry[] {
  return drafts
    .filter((draft) => draft.entryDate && draft.title.trim() && draft.body.trim())
    .map((draft) =>
      DiaryEntryInputSchema.parse({
        entryDate: draft.entryDate,
        title: draft.title.trim(),
        body: draft.body.trim(),
        mood: "quiet",
        weather: draft.weather
      })
    );
}
