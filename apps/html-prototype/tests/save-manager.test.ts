import assert from "node:assert/strict";
import test from "node:test";
import { SaveManager } from "../src/systems/SaveManager.js";
import type { DiaryEntry, SaveState } from "../src/types.js";

class MemoryStorage {
  private values = new Map<string, string>();

  getItem(key: string): string | null {
    return this.values.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.values.set(key, value);
  }

  removeItem(key: string): void {
    this.values.delete(key);
  }
}

function installStorage(): void {
  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    value: new MemoryStorage()
  });
}

function legacyState(diaryEntries: DiaryEntry[]): SaveState {
  return {
    version: 1,
    savedAt: "2026-08-06T00:00:00.000Z",
    scene: "forest",
    player: { x: 10, y: 20 },
    openedDoors: ["yumido"],
    completedChapters: ["bakery-day"],
    choices: ["remember"],
    tendencies: {
      acceptance: 1,
      avoidance: 0,
      closeness: 0,
      distance: 0,
      honesty: 1,
      concealment: 0,
      companionship: 0,
      intervention: 0
    },
    scrapbook: ["old collectible text"],
    favorites: [],
    timelineCompleted: ["Yumido Bread"],
    selectedChapter: "Yumido Bread",
    settings: { rain: true, muted: false, volume: 0.45, compact: false, reducedMotion: false },
    readMemories: ["bakery-day"],
    diaryEntries,
    room: { visits: 1, gifts: 0, outfit: "raincoat", diary: ["quiet room"], water: 3, warmth: 2 },
    endingProgress: ["walk-home-together"]
  };
}

test("diary library autosaves independently from journey progress", () => {
  installStorage();
  const manager = new SaveManager();
  const entry: DiaryEntry = {
    id: "diary-1",
    date: "2026-08-06",
    title: "Library",
    body: "The diary stays.",
    memoryKind: "diary",
    scrapbookLayout: { elements: [] }
  };

  manager.saveDiaryLibrary({ version: 1, savedAt: "now", entries: [entry], legacyArtifacts: [] });
  manager.saveJourney({ version: 1, savedAt: "now", scene: "forest", player: { x: 1, y: 2 }, visitedMemories: ["yumido"], walkedThroughMemories: [], choices: [], tendencies: legacyState([]).tendencies, readMemories: [], room: { visits: 0, reflections: [] }, finalJourney: [] });
  manager.resetJourney();

  assert.equal(manager.loadDiaryLibrary()?.entries[0]?.body, "The diary stays.");
  assert.equal(manager.loadJourney(), null);
});

test("legacy v1 autosave migrates diary entries as diary-only and keeps old scrapbook as legacy artifacts", () => {
  installStorage();
  const manager = new SaveManager();
  const diaryEntries: DiaryEntry[] = [{ id: "old-diary", date: "2026-08-06", title: "Old", body: "Preserve me.", memoryKind: "chapter", chapterId: "bakery-day" }];

  manager.autosave(legacyState(diaryEntries));
  const migrated = manager.migrateLegacyAutosave();

  assert.equal(migrated.diary.entries[0].body, "Preserve me.");
  assert.equal(migrated.diary.entries[0].memoryKind, "chapter");
  assert.deepEqual(migrated.diary.legacyArtifacts, ["old collectible text"]);
  assert.deepEqual(migrated.journey.walkedThroughMemories, ["bakery-day"]);
  assert.deepEqual(migrated.journey.visitedMemories, ["yumido"]);
  assert.deepEqual(migrated.journey.room.reflections, ["quiet room"]);
});
