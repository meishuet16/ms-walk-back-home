import { z } from "zod";

export const MemoryGraphSchema = z.object({
  version: z.string(),
  entryId: z.string(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  title: z.string(),
  summary: z.string().optional(),
  mood: z.record(z.unknown()).optional(),
  weather: z.record(z.unknown()).optional(),
  characters: z.array(z.record(z.unknown())).optional(),
  locations: z.array(z.record(z.unknown())),
  events: z.array(z.record(z.unknown())),
  objects: z.array(z.record(z.unknown())).optional(),
  dialogueCandidates: z.array(z.record(z.unknown())).optional(),
  quotes: z.array(z.record(z.unknown())).optional(),
  chapterPlan: z.record(z.unknown())
}).strict();

export type MemoryGraph = z.infer<typeof MemoryGraphSchema>;
