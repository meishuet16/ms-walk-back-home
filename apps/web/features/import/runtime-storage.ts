import type { DiaryEntry, MemoryGraphRecord } from "@walk/shared";

const CONFIRMED_ENTRIES_KEY = "walk.fixture.import.confirmed";
const CONFIRMED_RAW_IMPORT_KEY = "walk.fixture.import.raw.confirmed";
const MEMORY_GRAPHS_KEY = "walk.fixture.memory-graphs";

export type DiaryImportRuntimeStorage = {
  saveConfirmedEntries: (entries: DiaryEntry[]) => void;
  saveConfirmedRawImport: (rawImportText: string) => void;
  saveMemoryGraphRecords: (records: MemoryGraphRecord[]) => void;
  listMemoryGraphRecords: () => MemoryGraphRecord[];
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
    }
  };
}
