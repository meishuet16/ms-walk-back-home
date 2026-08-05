import {
  createPortalManifestFromGraphRecords,
  fictionalMemoryGraph,
  type MemoryGraphRecord
} from "@walk/shared";
import { NextResponse } from "next/server";

export function GET() {
  const seedRecord: MemoryGraphRecord = {
    id: "memory-graph-seed-001",
    entryId: fictionalMemoryGraph.entryId,
    state: "playable",
    graph: fictionalMemoryGraph,
    errors: [],
    updatedAt: "2026-08-01T12:00:00.000Z"
  };

  return NextResponse.json(createPortalManifestFromGraphRecords([seedRecord]));
}
