import { describe, expect, it } from "vitest";
import {
  CharacterNodeSchema,
  ConfidenceSchema,
  DiaryEntrySchema,
  MemoryGraphSchema,
  SourceEvidenceSchema,
  fictionalMemoryGraph
} from "../index";

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

  it("validates explicit Memory Graph node schemas", () => {
    expect(CharacterNodeSchema.parse({
      id: "npc_friend_01",
      displayName: "Friend A",
      role: "friend",
      evidence: [{ source: "fixture", note: "Fictional sample character", confidence: 0.9 }]
    }).displayName).toBe("Friend A");

    expect(SourceEvidenceSchema.parse({
      source: "fixture",
      note: "Fictional source note",
      confidence: 0.8
    }).source).toBe("fixture");

    expect(ConfidenceSchema.safeParse(1.1).success).toBe(false);
  });

  it("rejects malformed Memory Graph nested nodes", () => {
    const malformed = {
      ...fictionalMemoryGraph,
      characters: [
        {
          id: "npc_friend_01",
          displayName: "Friend A",
          role: "friend",
          inventedFact: "not allowed"
        }
      ],
      locations: [
        {
          id: "loc_bakery",
          module: "space_station",
          order: 1
        }
      ]
    };

    expect(MemoryGraphSchema.safeParse(malformed).success).toBe(false);
  });
});
