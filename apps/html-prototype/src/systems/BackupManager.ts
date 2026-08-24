import type { DiaryLibraryState, JourneyState, PersonalMusicLibraryState, PersonalPlayerState, ReflectionWallState } from "../types.js";
import { normalizeReflectionWallState } from "./ReflectionWall.js";
import { filterPersistableDiaryEntries } from "./DiaryOwnership.js";

export type BackupBlobEntry = {
  key: string;
  kind?: "music" | "journal-media";
  type: string;
  dataUrl: string;
};

export type BackupBlobWriter = {
  putBlob(key: string, blob: Blob): Promise<void>;
};

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
  blobs: BackupBlobEntry[];
};

export function createBackupBundle(input: Omit<WalkBackupBundle, "app" | "version" | "exportedAt" | "provider">, now = new Date()): WalkBackupBundle {
  return {
    app: "walk-back-home-html-prototype",
    version: 1,
    exportedAt: now.toISOString(),
    provider: {
      mode: "manual-file",
      label: "Local backup file"
    },
      diaryLibrary: input.diaryLibrary ? { ...input.diaryLibrary, entries: filterPersistableDiaryEntries(input.diaryLibrary.entries) } : null,
      journey: input.journey,
      reflectionWall: input.reflectionWall,
      musicLibrary: input.musicLibrary,
      personalPlayer: input.personalPlayer,
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
      journey: parsed.journey?.version === 1 ? parsed.journey : null,
      reflectionWall: normalizeReflectionWallState(parsed.reflectionWall),
      musicLibrary: parsed.musicLibrary?.version === 1 ? parsed.musicLibrary : null,
      personalPlayer: parsed.personalPlayer?.version === 1 ? parsed.personalPlayer : null,
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
  stores: { journalStore: BackupBlobWriter; musicStore: BackupBlobWriter }
): Promise<void> {
  for (const entry of blobs) {
    const response = await fetch(entry.dataUrl);
    const source = await response.blob();
    const blob = source.type === entry.type ? source : new Blob([await source.arrayBuffer()], { type: entry.type });
    await (entry.kind === "journal-media" ? stores.journalStore : stores.musicStore).putBlob(entry.key, blob);
  }
}

function isBackupBlobEntry(value: unknown): value is BackupBlobEntry {
  if (!value || typeof value !== "object") return false;
  const candidate = value as BackupBlobEntry;
  return typeof candidate.key === "string"
    && (candidate.kind === undefined || candidate.kind === "music" || candidate.kind === "journal-media")
    && typeof candidate.type === "string"
    && typeof candidate.dataUrl === "string"
    && candidate.dataUrl.startsWith("data:");
}
