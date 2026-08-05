import { fictionalDiaryEntries } from "../fixtures/diary-entries";
import {
  DiaryEntryInputSchema,
  DiaryEntryPatchSchema,
  type DiaryEntry,
  type DiaryEntryInput,
  type DiaryEntryPatch
} from "../schemas/diary-entry";

export type DiaryStore = {
  listEntries: () => Promise<DiaryEntry[]>;
  getEntry: (id: string) => Promise<DiaryEntry | null>;
  createEntry: (input: DiaryEntryInput) => Promise<DiaryEntry>;
  updateEntry: (id: string, patch: DiaryEntryPatch) => Promise<DiaryEntry>;
  deleteEntry: (id: string) => Promise<void>;
};

export function createFixtureDiaryStore(seed: DiaryEntry[] = fictionalDiaryEntries): DiaryStore {
  const entries = new Map(seed.map((entry) => [entry.id, { ...entry }]));

  return {
    async listEntries() {
      return [...entries.values()].sort((a, b) => a.entryDate.localeCompare(b.entryDate));
    },
    async getEntry(id) {
      const entry = entries.get(id);
      return entry ? { ...entry } : null;
    },
    async createEntry(input) {
      const parsed = DiaryEntryInputSchema.parse(input);
      const timestamp = new Date("2030-01-01T12:00:00.000Z").toISOString();
      const entry: DiaryEntry = {
        id: `fixture-entry-${String(entries.size + 1).padStart(3, "0")}`,
        ...parsed,
        privacyTag: "fictional",
        createdAt: timestamp,
        updatedAt: timestamp
      };
      entries.set(entry.id, entry);
      return { ...entry };
    },
    async updateEntry(id, patch) {
      const existing = entries.get(id);
      if (!existing) {
        throw new Error(`Diary entry not found: ${id}`);
      }
      const parsed = DiaryEntryPatchSchema.parse(patch);
      const updated: DiaryEntry = {
        ...existing,
        ...parsed,
        updatedAt: new Date("2030-01-01T12:30:00.000Z").toISOString()
      };
      entries.set(id, updated);
      return { ...updated };
    },
    async deleteEntry(id) {
      entries.delete(id);
    }
  };
}
