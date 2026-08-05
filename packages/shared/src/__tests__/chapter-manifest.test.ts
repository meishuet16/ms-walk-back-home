import { describe, expect, it } from "vitest";
import { fictionalMemoryGraph } from "../fixtures/memory-graph";
import {
  ChapterCompletionStateSchema,
  ChapterManifestSchema,
  createChapterManifestFromMemoryGraph,
  parseChapterCompletionState,
  parseChapterManifest
} from "../chapter/chapter-manifest";

describe("chapter manifest", () => {
  it("converts the Bakery Day memory graph into ordered scenes and objectives", () => {
    const manifest = createChapterManifestFromMemoryGraph(fictionalMemoryGraph);

    expect(ChapterManifestSchema.parse(manifest)).toMatchObject({
      id: "chapter-fixture-001",
      entryId: fictionalMemoryGraph.entryId,
      date: fictionalMemoryGraph.date,
      title: fictionalMemoryGraph.title,
      playerSpawn: { sceneId: "bakery", x: 88, y: 312 },
      ending: { id: "ending-return-to-forest", returnTarget: "forest" }
    });
    expect(manifest.scenes.map((scene) => scene.id)).toEqual(["bakery"]);
    expect(manifest.objectives.map((objective) => objective.id)).toEqual([
      "enter-bakery",
      "talk-to-friend-a",
      "inspect-pastry",
      "walk-to-exit"
    ]);
  });

  it("preserves dialogue source labels without promoting reconstructed dialogue", () => {
    const manifest = createChapterManifestFromMemoryGraph(fictionalMemoryGraph);

    expect(manifest.dialogueNodes).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "dialogue-friend-a-01",
          speakerId: "npc_friend_01",
          source: "reconstructed"
        }),
        expect.objectContaining({
          id: "dialogue-muji-01",
          speakerId: "muji",
          source: "muji_observation"
        })
      ])
    );
  });

  it("rejects invalid chapter data", () => {
    const result = parseChapterManifest({
      id: "",
      entryId: "",
      date: "not-a-date",
      title: "",
      scenes: [],
      playerSpawn: { sceneId: "", x: -1, y: -1 },
      npcs: [],
      interactiveObjects: [],
      objectives: [],
      dialogueNodes: [],
      ending: { id: "", returnTarget: "" },
      validationErrors: []
    });

    expect(result.success).toBe(false);
  });

  it("serializes completion state safely", () => {
    const parsed = parseChapterCompletionState({
      chapterId: "chapter-fixture-001",
      entryId: "fixture-001",
      completed: true,
      completedAt: "2026-08-05T12:00:00.000Z"
    });

    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(ChapterCompletionStateSchema.parse(parsed.data).completed).toBe(true);
    }
  });
});
