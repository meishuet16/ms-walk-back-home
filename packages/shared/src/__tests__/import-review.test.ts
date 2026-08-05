import { describe, expect, it } from "vitest";
import {
  confirmImportDrafts,
  mergeAdjacentDrafts,
  removeDraft,
  splitDraft,
  updateDraft
} from "../import/review-drafts";
import type { ImportDraftEntry } from "../import/types";

const drafts: ImportDraftEntry[] = [
  {
    id: "draft-001",
    entryDate: "2026-08-01",
    title: "First fictional day",
    body: "Line one.\nLine two.",
    confidence: 0.95,
    warnings: [],
    peopleCandidates: [],
    placeCandidates: []
  },
  {
    id: "draft-002",
    entryDate: "2026-08-02",
    title: "Second fictional day",
    body: "Another line.",
    confidence: 0.95,
    warnings: [],
    peopleCandidates: [],
    placeCandidates: []
  }
];

describe("import review draft operations", () => {
  it("updates editable metadata without changing the original draft", () => {
    const updated = updateDraft(drafts, "draft-001", { title: "Renamed", entryDate: "2026-08-03" });

    expect(updated[0]).toMatchObject({ title: "Renamed", entryDate: "2026-08-03" });
    expect(drafts[0]?.title).toBe("First fictional day");
  });

  it("merges adjacent entries and removes entries", () => {
    const merged = mergeAdjacentDrafts(drafts, "draft-001");

    expect(merged).toHaveLength(1);
    expect(merged[0]?.body).toContain("Another line.");
    expect(removeDraft(merged, merged[0]!.id)).toHaveLength(0);
  });

  it("splits an entry at a line boundary", () => {
    const split = splitDraft(drafts, "draft-001", 1);

    expect(split).toHaveLength(3);
    expect(split[0]?.body).toBe("Line one.");
    expect(split[1]?.body).toBe("Line two.");
  });

  it("confirms valid drafts as fictional diary entry inputs", () => {
    const confirmed = confirmImportDrafts(drafts);

    expect(confirmed).toHaveLength(2);
    expect(confirmed[0]).toMatchObject({
      entryDate: "2026-08-01",
      title: "First fictional day"
    });
  });
});
