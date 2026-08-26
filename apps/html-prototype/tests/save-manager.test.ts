import assert from "node:assert/strict";
import test from "node:test";
import { SaveManager } from "../src/systems/SaveManager.js";
import type { DiaryEntry, PersonalMusicLibraryState, PersonalPlayerState, ReflectionWallState, SaveState } from "../src/types.js";

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
      intervention: 0,
      holding: 0
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
  manager.saveJourney({ version: 1, savedAt: "now", scene: "forest", player: { x: 1, y: 2 }, room: { visits: 0, reflections: [] }, finalJourney: [] });
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
  assert.equal("walkedThroughMemories" in migrated.journey, false);
  assert.equal("visitedMemories" in migrated.journey, false);
  assert.deepEqual(migrated.journey.room.reflections, ["quiet room"]);
  assert.equal(migrated.journey.room.residueIds, undefined);
});

test("new Journey saves never write legacy authored progress fields", () => {
  installStorage();
  const manager = new SaveManager();
  const legacyCompatibleJourney = {
    version: 1 as const,
    savedAt: "now",
    scene: "forest" as const,
    player: { x: 1, y: 2 },
    room: { visits: 4, reflections: ["room note"] },
    finalJourney: [],
    visitedMemories: ["yumido"],
    walkedThroughMemories: ["bakery-day"],
    choices: ["remember"],
    tendencies: legacyState([]).tendencies,
    readMemories: ["bakery-day"],
    completedMemoryEvents: ["yumido-rain-conversation-ends"]
  } as never;

  manager.saveJourney(legacyCompatibleJourney);
  const persisted = JSON.parse(localStorage.getItem("walk-back-home:html-prototype:v2:journey") ?? "{}");
  assert.equal("visitedMemories" in persisted, false);
  assert.equal("completedMemoryEvents" in persisted, false);
  assert.equal(persisted.room.visits, 4);
});

test("diary library reload preserves photo attachments and scrapbook layout", () => {
  installStorage();
  const manager = new SaveManager();
  const entry: DiaryEntry = {
    id: "diary-composer",
    date: "2026-08-11",
    title: "Composer",
    body: "A fictional page.",
    memoryKind: "diary",
    photos: [{ id: "photo-1", src: "data:image/png;base64,abc", caption: "paper" }],
    scrapbookLayout: {
      elements: [{ id: "element-1", type: "photo", photoId: "photo-1", x: 25, y: 36, scale: 1.35, rotation: -12, zIndex: 2 }]
    }
  };

  manager.saveDiaryLibrary({ version: 1, savedAt: "now", entries: [entry], legacyArtifacts: [] });
  const reloaded = manager.loadDiaryLibrary();

  assert.equal(reloaded?.entries[0].photos?.[0].src, "data:image/png;base64,abc");
  assert.deepEqual(reloaded?.entries[0].scrapbookLayout?.elements[0], entry.scrapbookLayout?.elements[0]);
});

test("music library persists imported metadata separately from journey reset", () => {
  installStorage();
  const manager = new SaveManager();
  const library: PersonalMusicLibraryState = {
    version: 1,
    savedAt: "now",
    tracks: [{
      id: "user-song",
      title: "雨天",
      artist: "美雪",
      audioBlobKey: "audio-blob",
      coverBlobKey: "cover-blob",
      syncedLyrics: [{ time: 1.2, text: "第一句" }],
      addedAt: 123
    }]
  };

  manager.saveMusicLibrary(library);
  manager.saveJourney({ version: 1, savedAt: "now", scene: "forest", player: { x: 1, y: 2 }, room: { visits: 0, reflections: [] }, finalJourney: [] });
  manager.resetJourney();

  assert.equal(manager.loadJourney(), null);
  assert.equal(manager.loadMusicLibrary()?.tracks[0].title, "雨天");
  assert.equal(manager.loadMusicLibrary()?.tracks[0].artist, "美雪");
  assert.equal(manager.loadMusicLibrary()?.tracks[0].syncedLyrics?.[0].text, "第一句");
});

test("personal player state persists without media blobs", () => {
  installStorage();
  const manager = new SaveManager();
  const player: PersonalPlayerState = {
    version: 1,
    selectedTrackId: "user-song",
    playing: true,
    playbackPosition: 42,
    visualMode: "cover",
    lyricsVisible: true,
    lyricsOverlay: { x: 20, y: 30, width: 260 },
    librarySort: "artist",
    librarySearch: "雨",
    shuffleEnabled: true,
    repeatOne: false,
    customTrackMeta: { "audio-hu-xia": { title: "胡夏 Xia Hu", artist: "Those Bygone Years" } },
    customTrackLyrics: { "audio-hu-xia": { syncedLyrics: [{ time: 1, text: "第一句" }], plainLyrics: "[00:01]第一句" } },
    playerBackgroundBlobKey: "bg-blob"
  };

  manager.savePersonalPlayer(player);

  assert.deepEqual(manager.loadPersonalPlayer(), player);
});

test("old personal player saves gain a default playback mode", () => {
  installStorage();
  localStorage.setItem("walk-back-home:html-prototype:v1:personal-player", JSON.stringify({
    version: 1,
    selectedTrackId: "user-song",
    playing: true,
    playbackPosition: 42,
    visualMode: "cover",
    lyricsVisible: true,
    lyricsOverlay: { x: 20, y: 30, width: 260 },
    librarySort: "artist",
    librarySearch: "雨"
  }));
  const manager = new SaveManager();

  assert.equal(manager.loadPersonalPlayer()?.shuffleEnabled, false);
  assert.equal(manager.loadPersonalPlayer()?.repeatOne, false);
});

test("reflection wall persists separately from resettable journey state", () => {
  installStorage();
  const manager = new SaveManager();
  const wall: ReflectionWallState = {
    version: 1,
    savedAt: "now",
    defaultStyleId: "paper-mix",
    migratedLegacyKeys: [],
    notes: [{
      id: "note-1",
      text: "墙上的纸还在",
      createdAt: "2026-08-11T11:42:00.000Z",
      styleId: "cream-torn",
      x: 24,
      y: 34,
      rotation: -1,
      source: "manual"
    }]
  };

  manager.saveReflectionWall(wall);
  manager.saveJourney({ version: 1, savedAt: "now", scene: "forest", player: { x: 1, y: 2 }, room: { visits: 0, reflections: [] }, finalJourney: [] });
  manager.resetJourney();

  assert.equal(manager.loadJourney(), null);
  assert.equal(manager.loadReflectionWall()?.notes[0].text, "墙上的纸还在");
});

test("toolbox and living window state use versioned local namespaces", () => {
  installStorage();
  const manager = new SaveManager();
  const toolbox = { version: 1 as const, selected: "spin-wheel", selectedPresetId: "today", converterUnits: { lengthFrom: "cm" }, currencyFrom: "MYR", currencyTo: "USD" };
  const livingWindow = { version: 1 as const, location: { name: "Kuala Lumpur", latitude: 3.139, longitude: 101.6869 }, weather: null, currency: null };
  manager.saveToolboxState(toolbox);
  manager.saveLivingWindowState(livingWindow);
  assert.deepEqual(manager.loadToolboxState(), toolbox);
  assert.deepEqual(manager.loadLivingWindowState(), livingWindow);
});
