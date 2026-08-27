import type { DiaryLibraryState, JourneyState, LivingWindowPersistedState, PersonalMusicLibraryState, PersonalPlayerState, ReflectionWallState, SaveState, ToolboxPersistedState } from "../types.js";
import { normalizeDiaryEntry } from "./DiaryImport.js";
import { filterPersistableDiaryEntries } from "./DiaryOwnership.js";
import { normalizePlaybackMode } from "./PersonalMusic.js";
import { createReflectionWallState, migrateLegacyReflectionWall, normalizeReflectionWallState } from "./ReflectionWall.js";
import { chapterRegistry } from "./ChapterRegistry.js";
import { normalizeMiniGamesState, type MiniGamesState } from "./games/MiniGamesState.js";

const key = (slot: number) => `walk-back-home:html-prototype:v1:slot-${slot}`;
const autosaveKey = "walk-back-home:html-prototype:v1:autosave";
const diaryLibraryKey = "walk-back-home:html-prototype:v2:diary-library";
const journeyKey = "walk-back-home:html-prototype:v2:journey";
const musicLibraryKey = "walk-back-home:html-prototype:v1:music-library";
const personalPlayerKey = "walk-back-home:html-prototype:v1:personal-player";
const reflectionWallKey = "walk-back-home:html-prototype:v1:reflection-wall";
const toolboxStateKey = "walk-back-home:html-prototype:v1:toolbox";
const livingWindowStateKey = "walk-back-home:html-prototype:v1:living-window";
const miniGamesStateKey = "walk-back-home:html-prototype:v1:mini-games";

export function stripLegacyJourneyProgress(state: JourneyState): JourneyState {
  const legacy = state as JourneyState & Record<string, unknown>;
  const {
    visitedMemories: _visitedMemories,
    walkedThroughMemories: _walkedThroughMemories,
    choices: _choices,
    tendencies: _tendencies,
    readMemories: _readMemories,
    completedMemoryEvents: _completedMemoryEvents,
    ...canonical
  } = legacy;
  return {
    ...canonical,
    room: {
      ...canonical.room,
      residueIds: canonical.room.residueIds?.filter((id) => !Object.prototype.hasOwnProperty.call(chapterRegistry, id))
    }
  } as JourneyState;
}

export class SaveManager {
  constructor(private ownerId = "") {}

  saveDiaryLibrary(state: DiaryLibraryState): void {
    localStorage.setItem(this.ownerKey(diaryLibraryKey), JSON.stringify({ ...state, entries: filterPersistableDiaryEntries(state.entries), savedAt: new Date().toISOString() }));
  }

  loadDiaryLibrary(): DiaryLibraryState | null {
    const state = this.parseVersioned<DiaryLibraryState>(localStorage.getItem(this.ownerKey(diaryLibraryKey)));
    return state ? { ...state, entries: filterPersistableDiaryEntries(state.entries) } : null;
  }

  saveJourney(state: JourneyState): void {
    localStorage.setItem(this.ownerKey(journeyKey), JSON.stringify({ ...stripLegacyJourneyProgress(state), savedAt: new Date().toISOString() }));
  }

  loadJourney(): JourneyState | null {
    const state = this.parseVersioned<JourneyState>(localStorage.getItem(this.ownerKey(journeyKey)));
    return state ? stripLegacyJourneyProgress(state) : null;
  }

  saveMusicLibrary(state: PersonalMusicLibraryState): void {
    localStorage.setItem(this.ownerKey(musicLibraryKey), JSON.stringify({ ...state, savedAt: new Date().toISOString() }));
  }

  loadMusicLibrary(): PersonalMusicLibraryState | null {
    return this.parseVersioned<PersonalMusicLibraryState>(localStorage.getItem(this.ownerKey(musicLibraryKey)));
  }

  savePersonalPlayer(state: PersonalPlayerState): void {
    localStorage.setItem(this.ownerKey(personalPlayerKey), JSON.stringify(state));
  }

  loadPersonalPlayer(): PersonalPlayerState | null {
    const parsed = this.parseVersioned<PersonalPlayerState>(localStorage.getItem(this.ownerKey(personalPlayerKey)));
    if (!parsed) return null;
    const legacyMode = normalizePlaybackMode(parsed.playbackMode);
    const { playbackMode: _playbackMode, ...player } = parsed;
    return {
      ...player,
      shuffleEnabled: player.shuffleEnabled || legacyMode === "shuffle",
      repeatOne: player.repeatOne || legacyMode === "repeat-one"
    };
  }

  saveReflectionWall(state: ReflectionWallState): void {
    localStorage.setItem(this.ownerKey(reflectionWallKey), JSON.stringify({ ...state, savedAt: new Date().toISOString() }));
  }

  loadReflectionWall(): ReflectionWallState | null {
    return normalizeReflectionWallState(this.parseRaw(localStorage.getItem(this.ownerKey(reflectionWallKey))));
  }

  saveToolboxState(state: ToolboxPersistedState): void {
    localStorage.setItem(this.ownerKey(toolboxStateKey), JSON.stringify(state));
  }

  loadToolboxState(): ToolboxPersistedState | null {
    return this.parseVersioned<ToolboxPersistedState>(localStorage.getItem(this.ownerKey(toolboxStateKey)));
  }

  saveLivingWindowState(state: LivingWindowPersistedState): void {
    localStorage.setItem(this.ownerKey(livingWindowStateKey), JSON.stringify(state));
  }

  loadLivingWindowState(): LivingWindowPersistedState | null {
    return this.parseVersioned<LivingWindowPersistedState>(localStorage.getItem(this.ownerKey(livingWindowStateKey)));
  }

  saveMiniGamesState(state: MiniGamesState): void {
    localStorage.setItem(this.ownerKey(miniGamesStateKey), JSON.stringify(normalizeMiniGamesState(state)));
  }

  loadMiniGamesState(): MiniGamesState {
    try {
      return normalizeMiniGamesState(this.parseRaw(localStorage.getItem(this.ownerKey(miniGamesStateKey))));
    } catch {
      return normalizeMiniGamesState(null);
    }
  }
  resetJourney(): void {
    localStorage.removeItem(this.ownerKey(journeyKey));
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
      room: {
        visits: legacy?.room?.visits ?? 0,
        reflections: legacy?.room?.diary ?? [],
        lampOn: (legacy?.room?.warmth ?? 0) > 0,
      },
      finalJourney: legacy?.endingProgress ?? []
    };
    this.saveDiaryLibrary(diary);
    this.saveJourney(journey);
    this.saveReflectionWall(migrateLegacyReflectionWall(this.loadReflectionWall() ?? createReflectionWallState(), journey.room, new Date(now)));
    return { diary, journey };
  }

  save(slot: number, state: SaveState): void {
    localStorage.setItem(this.ownerKey(key(slot)), JSON.stringify({ ...state, slot, savedAt: new Date().toISOString() }));
  }

  autosave(state: SaveState): void {
    localStorage.setItem(this.ownerKey(autosaveKey), JSON.stringify({ ...state, savedAt: new Date().toISOString() }));
  }

  load(slot: number): SaveState | null {
    return this.parse(localStorage.getItem(this.ownerKey(key(slot))));
  }

  loadAutosave(): SaveState | null {
    return this.parse(localStorage.getItem(this.ownerKey(autosaveKey)));
  }

  delete(slot: number): void {
    localStorage.removeItem(this.ownerKey(key(slot)));
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

  private parseRaw(value: string | null): unknown {
    if (!value) return null;
    return JSON.parse(value) as unknown;
  }

  private ownerKey(storageKey: string): string {
    return this.ownerId ? `${storageKey}:owner:${encodeURIComponent(this.ownerId)}` : storageKey;
  }
}
