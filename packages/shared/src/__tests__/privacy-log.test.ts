import { describe, expect, it } from "vitest";
import { redactDiaryLogPayload } from "../privacy/redact-log";

describe("redactDiaryLogPayload", () => {
  it("redacts raw diary content and preserves operational metadata", () => {
    const redacted = redactDiaryLogPayload({
      event: "diary_entry_saved",
      entryId: "entry-123",
      body: "I met Fictional Person at a made-up address.",
      title: "Private raw title",
      mood: "nostalgic",
      nested: {
        rawContent: "sensitive line",
        count: 2
      }
    });

    expect(redacted).toEqual({
      event: "diary_entry_saved",
      entryId: "entry-123",
      body: "[redacted]",
      title: "[redacted]",
      mood: "nostalgic",
      nested: {
        rawContent: "[redacted]",
        count: 2
      }
    });
  });

  it("redacts sensitive fields inside arrays without mutating the original payload", () => {
    const payload = {
      event: "batch_import_reviewed",
      entries: [
        {
          entryId: "fixture-entry-001",
          diaryText: "fictional sensitive diary line",
          photoCaption: "fictional sensitive photo caption",
          importPath: "imports/fictional-private.md"
        }
      ],
      generatedGraph: {
        summary: "fictional generated summary",
        nodeCount: 4
      }
    };

    const redacted = redactDiaryLogPayload(payload);

    expect(redacted).toEqual({
      event: "batch_import_reviewed",
      entries: [
        {
          entryId: "fixture-entry-001",
          diaryText: "[redacted]",
          photoCaption: "[redacted]",
          importPath: "[redacted]"
        }
      ],
      generatedGraph: "[redacted]"
    });
    expect(payload.entries[0]?.diaryText).toBe("fictional sensitive diary line");
  });
});
