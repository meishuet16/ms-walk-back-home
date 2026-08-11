import type { DiaryLibraryState, JourneyState, PersonalMusicLibraryState, PersonalPlayerState } from "../types.js";

export type BackupBlobEntry = {
  key: string;
  type: string;
  dataUrl: string;
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
    diaryLibrary: input.diaryLibrary,
    journey: input.journey,
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

function isBackupBlobEntry(value: unknown): value is BackupBlobEntry {
  if (!value || typeof value !== "object") return false;
  const candidate = value as BackupBlobEntry;
  return typeof candidate.key === "string" && typeof candidate.type === "string" && typeof candidate.dataUrl === "string" && candidate.dataUrl.startsWith("data:");
}
