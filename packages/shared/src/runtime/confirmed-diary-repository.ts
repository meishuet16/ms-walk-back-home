import type { DiaryEntry, DiaryEntryInput } from "../schemas/diary-entry";

export type ConfirmedDiaryRepository = {
  list: () => Promise<DiaryEntry[]>;
  saveMany: (entries: DiaryEntryInput[]) => Promise<DiaryEntry[]>;
};

export function createInMemoryConfirmedDiaryRepository(seed: DiaryEntry[] = []): ConfirmedDiaryRepository {
  const entries = [...seed];

  return {
    async list() {
      return entries.map((entry) => ({ ...entry }));
    },
    async saveMany(nextEntries) {
      const saved = nextEntries.map((entry, index) => {
        const now = new Date("2026-08-01T12:00:00.000Z").toISOString();
        return {
          id: `confirmed-entry-${String(entries.length + index + 1).padStart(3, "0")}`,
          ...entry,
          privacyTag: "fictional" as const,
          createdAt: now,
          updatedAt: now
        };
      });
      entries.push(...saved);
      return saved.map((entry) => ({ ...entry }));
    }
  };
}
