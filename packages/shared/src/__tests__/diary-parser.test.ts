import { describe, expect, it } from "vitest";
import { createFixtureDiaryParser } from "../memory-graph/fixture-diary-parser";
import { MemoryGraphSchema } from "../schemas/memory-graph";

describe("createFixtureDiaryParser", () => {
  it("converts a confirmed fictional diary entry into a validated MemoryGraph", async () => {
    const parser = createFixtureDiaryParser();
    const result = await parser.parse({
      id: "confirmed-entry-001",
      entryDate: "2026-08-01",
      title: "Fictional bakery walk",
      body: "A fictional walk past a bakery and a lantern road.",
      weather: "晴",
      mood: "quiet",
      privacyTag: "fictional",
      createdAt: "2026-08-01T00:00:00.000Z",
      updatedAt: "2026-08-01T00:00:00.000Z"
    });

    expect(result.state).toBe("playable");
    if (result.state !== "playable") {
      throw new Error("Expected playable fixture graph.");
    }
    expect(MemoryGraphSchema.parse(result.graph).entryId).toBe("confirmed-entry-001");
    expect(result.graph.locations[0]?.module).toBe("bakery_shop");
    expect(result.graph.events[0]?.type).toBe("inspect");
  });

  it("returns failed state with validation errors without exposing raw diary body", async () => {
    const parser = createFixtureDiaryParser();
    const result = await parser.parse({
      id: "confirmed-entry-002",
      entryDate: "2026-08-02",
      title: "Bad fixture",
      body: "Do not leak this raw fictional sentence.",
      privacyTag: "fictional",
      createdAt: "2026-08-02T00:00:00.000Z",
      updatedAt: "2026-08-02T00:00:00.000Z"
    }, { forceInvalidModule: true });

    expect(result.state).toBe("failed");
    expect(result.graph).toBeNull();
    expect(JSON.stringify(result.errors)).not.toContain("Do not leak this raw fictional sentence.");
  });
});
