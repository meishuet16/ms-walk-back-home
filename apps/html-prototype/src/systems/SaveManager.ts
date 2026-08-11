import type { DiaryLibraryState, JourneyState, PersonalMusicLibraryState, PersonalPlayerState, SaveState } from "../types.js";
import { normalizeDiaryEntry } from "./DiaryImport.js";
import { normalizePlaybackMode } from "./PersonalMusic.js";

const key = (slot: number) => `walk-back-home:html-prototype:v1:slot-${slot}`;
const autosaveKey = "walk-back-home:html-prototype:v1:autosave";
const diaryLibraryKey = "walk-back-home:html-prototype:v2:diary-library";
const journeyKey = "walk-back-home:html-prototype:v2:journey";
const musicLibraryKey = "walk-back-home:html-prototype:v1:music-library";
const personalPlayerKey = "walk-back-home:html-prototype:v1:personal-player";

export class SaveManager {
  saveDiaryLibrary(state: DiaryLibraryState): void {
    localStorage.setItem(diaryLibraryKey, JSON.stringify({ ...state, savedAt: new Date().toISOString() }));
  }

  loadDiaryLibrary(): DiaryLibraryState | null {
    return this.parseVersioned<DiaryLibraryState>(localStorage.getItem(diaryLibraryKey));
  }

  saveJourney(state: JourneyState): void {
    localStorage.setItem(journeyKey, JSON.stringify({ ...state, savedAt: new Date().toISOString() }));
  }

  loadJourney(): JourneyState | null {
    return this.parseVersioned<JourneyState>(localStorage.getItem(journeyKey));
  }

  saveMusicLibrary(state: PersonalMusicLibraryState): void {
    localStorage.setItem(musicLibraryKey, JSON.stringify({ ...state, savedAt: new Date().toISOString() }));
  }

  loadMusicLibrary(): PersonalMusicLibraryState | null {
    return this.parseVersioned<PersonalMusicLibraryState>(localStorage.getItem(musicLibraryKey));
  }

  savePersonalPlayer(state: PersonalPlayerState): void {
    localStorage.setItem(personalPlayerKey, JSON.stringify(state));
  }

  loadPersonalPlayer(): PersonalPlayerState | null {
    const parsed = this.parseVersioned<PersonalPlayerState>(localStorage.getItem(personalPlayerKey));
    return parsed ? { ...parsed, playbackMode: normalizePlaybackMode(parsed.playbackMode) } : null;
  }

  resetJourney(): void {
    localStorage.removeItem(journeyKey);
  }

  migrateLegacyAutosave(): { diary: DiaryLibraryState; journey: JourneyState } {
    const legacy = this.loadAutosave();
    const now = new Date().toISOString();
    const diary: DiaryLibraryState = {
      version: 1,
      savedAt: now,
      entries: (legacy?.diaryEntries ?? []).map((entry) => normalizeDiaryEntry(entry)),
      legacyArtifacts: legacy?.scrapbook ?? []
    };
    const journey: JourneyState = {
      version: 1,
      savedAt: now,
      scene: legacy?.scene ?? "title",
      player: legacy?.player ?? { x: 880, y: 690 },
      visitedMemories: legacy?.openedDoors ?? [],
      walkedThroughMemories: legacy?.completedChapters ?? [],
      choices: legacy?.choices ?? [],
      tendencies: legacy?.tendencies ?? {
        acceptance: 0,
        avoidance: 0,
        closeness: 0,
        distance: 0,
        honesty: 0,
        concealment: 0,
        companionship: 0,
        intervention: 0
      },
      readMemories: legacy?.readMemories ?? [],
      completedMemoryEvents: [],
      room: {
        visits: legacy?.room?.visits ?? 0,
        reflections: legacy?.room?.diary ?? [],
        lampOn: (legacy?.room?.warmth ?? 0) > 0,
        residueIds: legacy?.completedChapters ?? []
      },
      finalJourney: legacy?.endingProgress ?? []
    };
    this.saveDiaryLibrary(diary);
    this.saveJourney(journey);
    return { diary, journey };
  }

  save(slot: number, state: SaveState): void {
    localStorage.setItem(key(slot), JSON.stringify({ ...state, slot, savedAt: new Date().toISOString() }));
  }

  autosave(state: SaveState): void {
    localStorage.setItem(autosaveKey, JSON.stringify({ ...state, savedAt: new Date().toISOString() }));
  }

  load(slot: number): SaveState | null {
    return this.parse(localStorage.getItem(key(slot)));
  }

  loadAutosave(): SaveState | null {
    return this.parse(localStorage.getItem(autosaveKey));
  }

  delete(slot: number): void {
    localStorage.removeItem(key(slot));
  }

  list(): Array<SaveState | null> {
    return [1, 2, 3].map((slot) => this.load(slot));
  }

  private parse(value: string | null): SaveState | null {
    if (!value) return null;
    const parsed = JSON.parse(value) as SaveState;
    return parsed.version === 1 ? parsed : null;
  }

  private parseVersioned<T extends { version: number }>(value: string | null): T | null {
    if (!value) return null;
    const parsed = JSON.parse(value) as T;
    return parsed.version === 1 ? parsed : null;
  }
}
