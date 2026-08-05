import { describe, expect, it } from "vitest";
import { DiaryEntrySchema, MemoryGraphSchema, fictionalMemoryGraph } from "../index";

describe("shared schemas", () => {
  it("validates diary entries with fictional privacy tags", () => {
    const parsed = DiaryEntrySchema.parse({
      id: "fixture-entry-001",
      entryDate: "2030-01-01",
      title: "A fictional bakery day",
      body: "Friend A and the narrator visited a small bakery.",
      mood: "nostalgic",
      weather: "sunny",
      privacyTag: "fictional",
      createdAt: "2030-01-01T10:00:00.000Z",
      updatedAt: "2030-01-01T10:00:00.000Z"
    });

    expect(parsed.privacyTag).toBe("fictional");
  });

  it("validates the fictional Memory Graph fixture", () => {
    expect(MemoryGraphSchema.parse(fictionalMemoryGraph).entryId).toBe("fixture-001");
  });
});
