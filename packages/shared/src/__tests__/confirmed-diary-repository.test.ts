import { describe, expect, it } from "vitest";
import { createInMemoryConfirmedDiaryRepository } from "../runtime/confirmed-diary-repository";

describe("createInMemoryConfirmedDiaryRepository", () => {
  it("persists confirmed fictional entries only after save is called", async () => {
    const repository = createInMemoryConfirmedDiaryRepository();

    await expect(repository.list()).resolves.toEqual([]);

    await repository.saveMany([
      {
        entryDate: "2026-08-01",
        title: "Confirmed fictional day",
        body: "A fictional confirmed entry.",
        mood: "quiet",
        weather: "晴"
      }
    ]);

    await expect(repository.list()).resolves.toHaveLength(1);
    await expect(repository.list()).resolves.toEqual([
      expect.objectContaining({
        id: "confirmed-entry-001",
        privacyTag: "fictional",
        title: "Confirmed fictional day"
      })
    ]);
  });
});
