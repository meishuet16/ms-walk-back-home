import { describe, expect, it } from "vitest";
import { createFixtureDiaryStore } from "../diary/fixture-store";

describe("createFixtureDiaryStore", () => {
  it("starts with fictional entries and supports create, update, and delete", async () => {
    const store = createFixtureDiaryStore();

    const initialEntries = await store.listEntries();
    expect(initialEntries).toHaveLength(2);
    expect(initialEntries[0]?.privacyTag).toBe("fictional");

    const created = await store.createEntry({
      entryDate: "2030-01-03",
      title: "Rain by the lantern road",
      body: "A fictional walk home under soft rain.",
      mood: "quiet",
      weather: "rain"
    });

    expect(created.id).toMatch(/^fixture-entry-/);
    expect(await store.getEntry(created.id)).toMatchObject({
      title: "Rain by the lantern road",
      privacyTag: "fictional"
    });

    const updated = await store.updateEntry(created.id, { mood: "hopeful" });
    expect(updated.mood).toBe("hopeful");

    await store.deleteEntry(created.id);
    expect(await store.getEntry(created.id)).toBeNull();
  });
});
