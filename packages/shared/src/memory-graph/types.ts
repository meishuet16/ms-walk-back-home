import type { DiaryEntry } from "../schemas/diary-entry";
import type { MemoryGraph } from "../schemas/memory-graph";

export type GenerationState = "idle" | "processing" | "playable" | "failed";

export type DiaryParserOptions = {
  forceInvalidModule?: boolean;
};

export type DiaryParserResult =
  | {
      state: "playable";
      graph: MemoryGraph;
      errors: [];
    }
  | {
      state: "failed";
      graph: null;
      errors: string[];
    };

export type DiaryParser = {
  parse: (entry: DiaryEntry, options?: DiaryParserOptions) => Promise<DiaryParserResult>;
};

export type MemoryGraphRecord = {
  id: string;
  entryId: string;
  state: GenerationState;
  graph: MemoryGraph | null;
  errors: string[];
  updatedAt: string;
};
