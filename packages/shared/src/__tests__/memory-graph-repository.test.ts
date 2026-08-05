import { describe, expect, it } from "vitest";
import { fictionalMemoryGraph } from "../fixtures/memory-graph";
import { createInMemoryMemoryGraphRepository } from "../memory-graph/memory-graph-repository";

describe("createInMemoryMemoryGraphRepository", () => {
  it("tracks generation states and stores validated graphs at runtime", async () => {
    const repository = createInMemoryMemoryGraphRepository();

    await expect(repository.getState("fixture-001")).resolves.toBe("idle");

    await repository.setState("fixture-001", "processing");
    await expect(repository.getState("fixture-001")).resolves.toBe("processing");

    const record = await repository.saveGraph(fictionalMemoryGraph);
    expect(record.state).toBe("playable");

    await expect(repository.getState("fixture-001")).resolves.toBe("playable");
    await expect(repository.list()).resolves.toEqual([record]);
  });
});
