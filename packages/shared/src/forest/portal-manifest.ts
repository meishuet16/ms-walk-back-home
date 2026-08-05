import { z } from "zod";
import type { MemoryGraphRecord } from "../memory-graph/types";

export const PortalStateSchema = z.enum(["locked", "processing", "playable"]);

export const ForestPortalSchema = z
  .object({
    id: z.string().min(1),
    entryId: z.string().min(1),
    graphId: z.string().min(1).optional(),
    date: z.string().regex(/^(\d{4}-\d{2}-\d{2}|fixture)$/),
    chapterTitle: z.string().min(1),
    mood: z.string().min(1),
    state: PortalStateSchema,
    x: z.number().min(0).max(960),
    y: z.number().min(0).max(540),
    validationErrors: z.array(z.string().min(1)).optional()
  })
  .strict();

export const PortalManifestSchema = z
  .object({
    version: z.literal("1.0"),
    generatedAt: z.string().datetime(),
    portals: z.array(ForestPortalSchema)
  })
  .strict();

export type PortalState = z.infer<typeof PortalStateSchema>;
export type ForestPortal = z.infer<typeof ForestPortalSchema>;
export type PortalManifest = z.infer<typeof PortalManifestSchema>;

const PORTAL_SLOTS = [
  { x: 210, y: 210 },
  { x: 700, y: 265 },
  { x: 485, y: 405 },
  { x: 360, y: 155 },
  { x: 585, y: 160 },
  { x: 655, y: 390 }
] as const;

export function createPortalManifestFromGraphRecords(records: MemoryGraphRecord[]): PortalManifest {
  const portals = records.map((record, index) => {
    const slot = PORTAL_SLOTS[index % PORTAL_SLOTS.length];
    if (record.state === "playable" && record.graph) {
      return {
        id: `portal-${record.entryId}`,
        entryId: record.entryId,
        graphId: record.id,
        date: record.graph.date,
        chapterTitle: record.graph.title || "Untitled memory",
        mood: record.graph.mood?.primary ?? "quiet",
        state: "playable" as const,
        x: slot.x,
        y: slot.y
      };
    }

    return {
      id: `portal-${record.entryId}`,
      entryId: record.entryId,
      graphId: record.id,
      date: "fixture",
      chapterTitle: record.state === "processing" ? "Memory becoming a door" : "Memory unavailable",
      mood: record.state === "processing" ? "processing" : "locked",
      state: record.state === "processing" ? ("processing" as const) : ("locked" as const),
      x: slot.x,
      y: slot.y,
      validationErrors: record.state === "failed" ? ["Graph generation failed"] : undefined
    };
  });

  return PortalManifestSchema.parse({
    version: "1.0",
    generatedAt: new Date("2026-08-01T12:00:00.000Z").toISOString(),
    portals
  });
}

export function parsePortalManifest(input: unknown) {
  return PortalManifestSchema.safeParse(input);
}
