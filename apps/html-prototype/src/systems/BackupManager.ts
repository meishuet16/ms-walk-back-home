import type { DiaryLibraryState, JourneyState, PersonalMusicLibraryState, PersonalPlayerState, ReflectionWallState } from "../types.js";
import { normalizeReflectionWallState } from "./ReflectionWall.js";
import { filterPersistableDiaryEntries } from "./DiaryOwnership.js";
import { stripLegacyJourneyProgress } from "./SaveManager.js";
import { normalizeMiniGamesState, type MiniGamesState } from "./games/MiniGamesState.js";
import { CAPSULE_STORAGE_KEY, normalizeCapsuleMachineState, saveCapsuleMachineState } from "./CapsuleMachine.js";
import { CapsuleMediaStore } from "./CapsuleMediaStore.js";
import { REFLECTION_WALL_BACKGROUND_KEY } from "./ReflectionWallVisualPolishBridge.js";

export type BackupBlobKind = "music" | "journal-media" | "capsule-media" | "capsule-state" | "reflection-wall-background";

export type BackupBlobEntry = {
  key: string;
  kind?: BackupBlobKind;
  type: string;
  dataUrl: string;
};

export type BackupBlobWriter = {
  putBlob(key: string, blob: Blob): Promise<void>;
};

export type BackupKeyValueWriter = Pick<Storage, "setItem" | "removeItem">;

export type WalkBackupBundle = {
  app: "walk-back-home-html-prototype";
  version: 1;
  exportedAt: string;
  provider: {
    mode: "manual-file";
    label: string;
  };
  diaryLibrary: DiaryLibraryState | null;
  journey: JourneyState | null;
  reflectionWall: ReflectionWallState | null;
  musicLibrary: PersonalMusicLibraryState | null;
  personalPlayer: PersonalPlayerState | null;
  miniGamesState: MiniGamesState;
  blobs: BackupBlobEntry[];
};

export function createBackupBundle(input: Omit<WalkBackupBundle, "app" | "version" | "exportedAt" | "provider" | "miniGamesState"> & { miniGamesState?: MiniGamesState | null }, now = new Date()): WalkBackupBundle {
  return {
    app: "walk-back-home-html-prototype",
    version: 1,
    exportedAt: now.toISOString(),
    provider: {
      mode: "manual-file",
      label: "Local backup file"
    },
      diaryLibrary: input.diaryLibrary ? { ...input.diaryLibrary, entries: filterPersistableDiaryEntries(input.diaryLibrary.entries) } : null,
      journey: input.journey ? stripLegacyJourneyProgress(input.journey) : null,
      reflectionWall: input.reflectionWall,
      musicLibrary: input.musicLibrary,
      personalPlayer: input.personalPlayer,
      miniGamesState: normalizeMiniGamesState(input.miniGamesState),
      blobs: input.blobs
  };
}

export function parseBackupBundle(text: string): WalkBackupBundle | null {
  try {
    const parsed = JSON.parse(text) as Partial<WalkBackupBundle>;
    if (parsed.app !== "walk-back-home-html-prototype" || parsed.version !== 1) return null;
    return {
      app: parsed.app,
      version: parsed.version,
      exportedAt: typeof parsed.exportedAt === "string" ? parsed.exportedAt : new Date().toISOString(),
      provider: parsed.provider?.mode === "manual-file" ? parsed.provider : { mode: "manual-file", label: "Local backup file" },
      diaryLibrary: parsed.diaryLibrary?.version === 1 ? parsed.diaryLibrary : null,
      journey: parsed.journey?.version === 1 ? stripLegacyJourneyProgress(parsed.journey) : null,
      reflectionWall: normalizeReflectionWallState(parsed.reflectionWall),
      musicLibrary: parsed.musicLibrary?.version === 1 ? parsed.musicLibrary : null,
      personalPlayer: parsed.personalPlayer?.version === 1 ? parsed.personalPlayer : null,
      miniGamesState: normalizeMiniGamesState(parsed.miniGamesState),
      blobs: Array.isArray(parsed.blobs) ? parsed.blobs.filter(isBackupBlobEntry) : []
    };
  } catch {
    return null;
  }
}

export function walkBackupFilename(now = new Date()): string {
  return `walk-back-home-backup-${now.toISOString().slice(0, 10)}.json`;
}

export async function restoreBackupBlobEntries(
  blobs: BackupBlobEntry[],
  stores: {
    journalStore: BackupBlobWriter;
    musicStore: BackupBlobWriter;
    capsuleStore?: BackupBlobWriter;
    localStorage?: BackupKeyValueWriter;
  }
): Promise<void> {
  const capsuleStore = stores.capsuleStore ?? (typeof indexedDB !== "undefined" ? new CapsuleMediaStore() : null);
  const localStore = stores.localStorage ?? (typeof localStorage !== "undefined" ? localStorage : null);

  for (const entry of blobs) {
    const response = await fetch(entry.dataUrl);
    const source = await response.blob();
    const blob = source.type === entry.type ? source : new Blob([await source.arrayBuffer()], { type: entry.type });

    if (entry.kind === "capsule-state") {
      if (!localStore) continue;
      try {
        const state = normalizeCapsuleMachineState(JSON.parse(await blob.text()));
        saveCapsuleMachineState(localStore, state);
      } catch {
        // Ignore a malformed supplemental state entry without blocking the rest of a valid backup.
      }
      continue;
    }

    if (entry.kind === "reflection-wall-background") {
      if (!localStore) continue;
      const background = await blob.text();
      if (background) localStore.setItem(REFLECTION_WALL_BACKGROUND_KEY, background);
      else localStore.removeItem(REFLECTION_WALL_BACKGROUND_KEY);
      continue;
    }

    if (entry.kind === "capsule-media") {
      if (capsuleStore) await capsuleStore.putBlob(entry.key, blob);
      continue;
    }

    await (entry.kind === "journal-media" ? stores.journalStore : stores.musicStore).putBlob(entry.key, blob);
  }
}

function isBackupBlobEntry(value: unknown): value is BackupBlobEntry {
  if (!value || typeof value !== "object") return false;
  const candidate = value as BackupBlobEntry;
  return typeof candidate.key === "string"
    && (
      candidate.kind === undefined
      || candidate.kind === "music"
      || candidate.kind === "journal-media"
      || candidate.kind === "capsule-media"
      || candidate.kind === "capsule-state"
      || candidate.kind === "reflection-wall-background"
    )
    && typeof candidate.type === "string"
    && typeof candidate.dataUrl === "string"
    && candidate.dataUrl.startsWith("data:");
}
