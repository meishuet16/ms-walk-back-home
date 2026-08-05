import { MemoryGraphSchema, type MemoryGraph } from "../schemas/memory-graph";
import type { GenerationState, MemoryGraphRecord } from "./types";

export type MemoryGraphRepository = {
  getState: (entryId: string) => Promise<GenerationState>;
  setState: (entryId: string, state: GenerationState, errors?: string[]) => Promise<MemoryGraphRecord>;
  saveGraph: (graph: MemoryGraph) => Promise<MemoryGraphRecord>;
  list: () => Promise<MemoryGraphRecord[]>;
};

export function createInMemoryMemoryGraphRepository(seed: MemoryGraphRecord[] = []): MemoryGraphRepository {
  const records = new Map(seed.map((record) => [record.entryId, cloneRecord(record)]));

  return {
    async getState(entryId) {
      return records.get(entryId)?.state ?? "idle";
    },
    async setState(entryId, state, errors = []) {
      const existing = records.get(entryId);
      const record: MemoryGraphRecord = {
        id: existing?.id ?? `memory-graph-${String(records.size + 1).padStart(3, "0")}`,
        entryId,
        graph: existing?.graph ?? null,
        state,
        errors,
        updatedAt: new Date("2026-08-01T12:00:00.000Z").toISOString()
      };
      records.set(entryId, record);
      return cloneRecord(record);
    },
    async saveGraph(graph) {
      const parsed = MemoryGraphSchema.parse(graph);
      const existing = records.get(parsed.entryId);
      const record: MemoryGraphRecord = {
        id: existing?.id ?? `memory-graph-${String(records.size + 1).padStart(3, "0")}`,
        entryId: parsed.entryId,
        graph: parsed,
        state: "playable",
        errors: [],
        updatedAt: new Date("2026-08-01T12:00:00.000Z").toISOString()
      };
      records.set(parsed.entryId, record);
      return cloneRecord(record);
    },
    async list() {
      return [...records.values()].map(cloneRecord);
    }
  };
}

function cloneRecord(record: MemoryGraphRecord): MemoryGraphRecord {
  return {
    ...record,
    graph: record.graph ? structuredClone(record.graph) : null,
    errors: [...record.errors]
  };
}
