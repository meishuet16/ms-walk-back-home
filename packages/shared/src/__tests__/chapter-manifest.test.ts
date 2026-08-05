import { describe, expect, it } from "vitest";
import { fictionalMemoryGraph } from "../fixtures/memory-graph";
import {
  ChapterCompletionStateSchema,
  ChapterManifestSchema,
  ChapterRegistrySchema,
  createBakeryChapterManifestPlanner,
  parseChapterCompletionState,
  parseChapterManifest,
  parseChapterRegistry
} from "../chapter/chapter-manifest";

describe("chapter manifest", () => {
  it("converts the Bakery Day memory graph into ordered scenes and objectives", () => {
    const planner = createBakeryChapterManifestPlanner();
    const manifest = planner.plan(fictionalMemoryGraph);

    expect(ChapterManifestSchema.parse(manifest)).toMatchObject({
      id: "chapter-fixture-001",
      template: "bakery_day",
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
    expect(manifest.interactiveObjects.map((object) => object.id)).toContain("exit_bakery");
    expect(planner.supportedTemplate).toBe("bakery_day");
  });

  it("preserves dialogue source labels without promoting reconstructed dialogue", () => {
    const manifest = createBakeryChapterManifestPlanner().plan(fictionalMemoryGraph);

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
      template: "bakery_day",
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

  it("validates the small chapter registry used by the forest", () => {
    const parsed = parseChapterRegistry({
      chapters: [
        {
          chapterId: "chapter-fixture-001",
          scenePath: "res://scenes/chapters/bakery_day.tscn",
          manifestPath: "res://chapters/bakery_day.chapter.json",
          supportedTemplate: "bakery_day"
        }
      ]
    });

    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(ChapterRegistrySchema.parse(parsed.data).chapters[0].supportedTemplate).toBe("bakery_day");
    }
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
