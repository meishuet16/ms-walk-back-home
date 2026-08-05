import { describe, expect, it } from "vitest";
import { redactDiaryLogPayload } from "../privacy/redact-log";

describe("redactDiaryLogPayload", () => {
  it("redacts raw diary content and preserves operational metadata", () => {
    const redacted = redactDiaryLogPayload({
      event: "diary_entry_saved",
      entryId: "entry-123",
      body: "I met Real Person Name at a private address.",
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
});
