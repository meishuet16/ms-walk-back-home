import type { DiaryEntry, DiaryLibraryState, DiaryMedia } from "../types.js";

export type PendingJournalAudio = {
  mediaId: string;
  tempKey: string;
  blob: Blob;
  duration: number;
  mimeType: string;
  displayName?: string;
  createdAt: string;
};

type JournalMediaBlobWriter = {
  putBlob(key: string, blob: Blob): Promise<void>;
  deleteBlob(key: string): Promise<void>;
};

export function makeJournalAudioMedia(input: {
  id: string;
  storageKey: string;
  mimeType: string;
  duration: number;
  displayName?: string;
  createdAt?: string;
}): DiaryMedia {
  return {
    id: input.id,
    type: "audio",
    storageKey: input.storageKey,
    mimeType: input.mimeType,
    duration: Math.max(0, input.duration),
    displayName: input.displayName,
    createdAt: input.createdAt ?? new Date().toISOString()
  };
}

export function journalMediaBlobKey(entryId: string, mediaId: string): string {
  return `journal-media/${entryId}/${mediaId}`;
}

export function journalMediaTempKey(entryId: string, mediaId: string): string {
  return `journal-media-temp/${entryId}/${mediaId}`;
}

export function collectReferencedJournalMediaKeys(library: DiaryLibraryState): string[] {
  const keys = new Set<string>();
  for (const entry of library.entries) {
    for (const media of entry.media ?? []) {
      if (media.type === "audio" && media.storageKey && !media.storageKey.startsWith("journal-media-temp/")) keys.add(media.storageKey);
    }
  }
  return [...keys];
}

export async function commitPendingJournalAudio(store: JournalMediaBlobWriter, entryId: string, pending: PendingJournalAudio[]): Promise<DiaryMedia[]> {
  const committed: DiaryMedia[] = [];
  for (const item of pending) {
    const storageKey = journalMediaBlobKey(entryId, item.mediaId);
    await store.putBlob(storageKey, item.blob);
    committed.push(makeJournalAudioMedia({
      id: item.mediaId,
      storageKey,
      mimeType: item.mimeType,
      duration: item.duration,
      displayName: item.displayName,
      createdAt: item.createdAt
    }));
    await store.deleteBlob(item.tempKey);
  }
  return committed;
}

export function audioStorageKeys(entry: DiaryEntry): string[] {
  return (entry.media ?? [])
    .filter((media): media is Extract<DiaryMedia, { type: "audio" }> => media.type === "audio")
    .map((media) => media.storageKey);
}
