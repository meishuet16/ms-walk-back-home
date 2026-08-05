import type { DiaryEntry, MemoryGraphRecord, PortalManifest } from "@walk/shared";

const CONFIRMED_ENTRIES_KEY = "walk.fixture.import.confirmed";
const CONFIRMED_RAW_IMPORT_KEY = "walk.fixture.import.raw.confirmed";
const MEMORY_GRAPHS_KEY = "walk.fixture.memory-graphs";
const PORTAL_MANIFEST_KEY = "walk.fixture.portal-manifest";

export type DiaryImportRuntimeStorage = {
  saveConfirmedEntries: (entries: DiaryEntry[]) => void;
  saveConfirmedRawImport: (rawImportText: string) => void;
  saveMemoryGraphRecords: (records: MemoryGraphRecord[]) => void;
  listMemoryGraphRecords: () => MemoryGraphRecord[];
  savePortalManifest: (manifest: PortalManifest) => void;
  loadPortalManifest: () => PortalManifest | null;
};

export function createLocalDiaryImportRuntimeStorage(storage: Storage): DiaryImportRuntimeStorage {
  return {
    saveConfirmedEntries(entries) {
      storage.setItem(CONFIRMED_ENTRIES_KEY, JSON.stringify(entries));
    },
    saveConfirmedRawImport(rawImportText) {
      storage.setItem(CONFIRMED_RAW_IMPORT_KEY, rawImportText);
    },
    saveMemoryGraphRecords(records) {
      storage.setItem(MEMORY_GRAPHS_KEY, JSON.stringify(records));
    },
    listMemoryGraphRecords() {
      const value = storage.getItem(MEMORY_GRAPHS_KEY);
      return value ? (JSON.parse(value) as MemoryGraphRecord[]) : [];
    },
    savePortalManifest(manifest) {
      storage.setItem(PORTAL_MANIFEST_KEY, JSON.stringify(manifest));
    },
    loadPortalManifest() {
      const value = storage.getItem(PORTAL_MANIFEST_KEY);
      return value ? (JSON.parse(value) as PortalManifest) : null;
    }
  };
}
