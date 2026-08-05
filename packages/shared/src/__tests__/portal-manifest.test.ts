import { describe, expect, it } from "vitest";
import { fictionalMemoryGraph } from "../fixtures/memory-graph";
import {
  PortalManifestSchema,
  createPortalManifestFromGraphRecords,
  parsePortalManifest
} from "../forest/portal-manifest";
import type { MemoryGraphRecord } from "../memory-graph/types";

describe("portal manifest", () => {
  it("turns playable graph records into validated forest portals", () => {
    const records: MemoryGraphRecord[] = [
      {
        id: "memory-graph-001",
        entryId: fictionalMemoryGraph.entryId,
        state: "playable",
        graph: fictionalMemoryGraph,
        errors: [],
        updatedAt: "2026-08-01T12:00:00.000Z"
      }
    ];

    const manifest = createPortalManifestFromGraphRecords(records);

    expect(PortalManifestSchema.parse(manifest).portals).toEqual([
      expect.objectContaining({
        entryId: fictionalMemoryGraph.entryId,
        chapterId: `chapter-${fictionalMemoryGraph.entryId}`,
        date: fictionalMemoryGraph.date,
        chapterTitle: fictionalMemoryGraph.title,
        mood: fictionalMemoryGraph.mood?.primary,
        state: "playable"
      })
    ]);
  });

  it("keeps processing and failed records safe without leaking graph content", () => {
    const records: MemoryGraphRecord[] = [
      {
        id: "memory-graph-002",
        entryId: "confirmed-entry-002",
        state: "processing",
        graph: null,
        errors: [],
        updatedAt: "2026-08-01T12:00:00.000Z"
      },
      {
        id: "memory-graph-003",
        entryId: "confirmed-entry-003",
        state: "failed",
        graph: null,
        errors: ["locations.0.module: invalid enum value"],
        updatedAt: "2026-08-01T12:00:00.000Z"
      }
    ];

    const manifest = createPortalManifestFromGraphRecords(records);

    expect(manifest.portals).toEqual([
      expect.objectContaining({ entryId: "confirmed-entry-002", state: "processing" }),
      expect.objectContaining({ entryId: "confirmed-entry-003", state: "locked", validationErrors: ["Graph generation failed"] })
    ]);
  });

  it("rejects invalid web-to-forest portal payloads", () => {
    const parsed = parsePortalManifest({
      version: "1.0",
      generatedAt: "2026-08-01T12:00:00.000Z",
      portals: [{ id: "", entryId: "", date: "not-a-date", chapterTitle: "", mood: "", state: "playable", x: -1, y: -1 }]
    });

    expect(parsed.success).toBe(false);
  });
});
