import { describe, expect, it } from "vitest";
import { fictionalMultiEntryImport } from "../fixtures/fictional-imports";
import { parseDiaryImport } from "../import/parse-diary-import";

describe("parseDiaryImport", () => {
  it("splits fictional multi-entry text with Chinese, ISO, and English date headings", () => {
    const result = parseDiaryImport(fictionalMultiEntryImport);

    expect(result.rawText).toContain("fictional bakery");
    expect(result.drafts).toHaveLength(3);
    expect(result.drafts.map((draft) => draft.entryDate)).toEqual([
      "2026-08-01",
      "2026-08-02",
      "2026-08-03"
    ]);
    expect(result.drafts[0]).toMatchObject({
      title: "2026年8月1日 晴",
      weather: "晴",
      confidence: 0.95
    });
  });

  it("adds warnings for missing date headings without inventing people or relationships", () => {
    const result = parseDiaryImport("A fictional undated note about Neighbor B.");

    expect(result.drafts).toHaveLength(1);
    expect(result.drafts[0]?.entryDate).toBe("");
    expect(result.drafts[0]?.peopleCandidates).toEqual([]);
    expect(result.drafts[0]?.warnings).toContain("No date heading detected.");
  });
});
