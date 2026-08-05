import { z } from "zod";
import type { MemoryGraph } from "../schemas/memory-graph";

export const DialogueSourceSchema = z.enum([
  "exact_quote",
  "reconstructed",
  "generic_contextual",
  "muji_observation",
  "silent_beat"
]);

const PointSchema = z
  .object({
    x: z.number().min(0).max(960),
    y: z.number().min(0).max(540)
  })
  .strict();

export const ChapterSceneSchema = z
  .object({
    id: z.string().min(1),
    module: z.enum(["bakery_shop", "home_room", "outdoor_road", "transition_screen"]),
    order: z.number().int().nonnegative(),
    title: z.string().min(1)
  })
  .strict();

export const ChapterNpcSchema = z
  .object({
    id: z.string().min(1),
    sceneId: z.string().min(1),
    displayName: z.string().min(1),
    role: z.string().min(1),
    position: PointSchema
  })
  .strict();

export const ChapterInteractiveObjectSchema = z
  .object({
    id: z.string().min(1),
    sceneId: z.string().min(1),
    label: z.string().min(1),
    type: z.string().min(1),
    position: PointSchema
  })
  .strict();

export const ChapterObjectiveSchema = z
  .object({
    id: z.string().min(1),
    order: z.number().int().nonnegative(),
    prompt: z.string().min(1),
    targetId: z.string().min(1).optional(),
    completion: z.enum(["enter_scene", "talk", "inspect", "exit"])
  })
  .strict();

export const ChapterDialogueNodeSchema = z
  .object({
    id: z.string().min(1),
    speakerId: z.string().min(1),
    text: z.string().min(1),
    source: DialogueSourceSchema,
    objectiveId: z.string().min(1).optional()
  })
  .strict();

export const ChapterEndingSchema = z
  .object({
    id: z.string().min(1),
    text: z.string().min(1),
    returnTarget: z.literal("forest")
  })
  .strict();

export const ChapterManifestSchema = z
  .object({
    id: z.string().min(1),
    entryId: z.string().min(1),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    title: z.string().min(1),
    scenes: z.array(ChapterSceneSchema).min(1),
    playerSpawn: PointSchema.extend({ sceneId: z.string().min(1) }).strict(),
    npcs: z.array(ChapterNpcSchema),
    interactiveObjects: z.array(ChapterInteractiveObjectSchema),
    objectives: z.array(ChapterObjectiveSchema).min(1),
    dialogueNodes: z.array(ChapterDialogueNodeSchema),
    ending: ChapterEndingSchema,
    validationErrors: z.array(z.string().min(1))
  })
  .strict();

export const ChapterCompletionStateSchema = z
  .object({
    chapterId: z.string().min(1),
    entryId: z.string().min(1),
    completed: z.boolean(),
    completedAt: z.string().datetime().nullable()
  })
  .strict();

export type DialogueSource = z.infer<typeof DialogueSourceSchema>;
export type ChapterManifest = z.infer<typeof ChapterManifestSchema>;
export type ChapterCompletionState = z.infer<typeof ChapterCompletionStateSchema>;

export function createChapterManifestFromMemoryGraph(graph: MemoryGraph): ChapterManifest {
  const firstCharacter = graph.characters?.[0];
  const firstObject = graph.objects?.[0];
  const firstDialogue = graph.dialogueCandidates?.[0];

  return ChapterManifestSchema.parse({
    id: `chapter-${graph.entryId}`,
    entryId: graph.entryId,
    date: graph.date,
    title: graph.title,
    scenes: [
      {
        id: "bakery",
        module: "bakery_shop",
        order: 0,
        title: "Small bakery"
      }
    ],
    playerSpawn: { sceneId: "bakery", x: 88, y: 312 },
    npcs: [
      {
        id: firstCharacter?.id ?? "npc_friend_01",
        sceneId: "bakery",
        displayName: firstCharacter?.displayName ?? "Friend A",
        role: firstCharacter?.role ?? "friend",
        position: { x: 420, y: 295 }
      }
    ],
    interactiveObjects: [
      {
        id: firstObject?.id ?? "obj_pastry",
        sceneId: "bakery",
        label: firstObject?.label ?? "pastry",
        type: firstObject?.type ?? "food",
        position: { x: 610, y: 304 }
      }
    ],
    objectives: [
      { id: "enter-bakery", order: 0, prompt: "Enter Bakery", completion: "enter_scene" },
      {
        id: "talk-to-friend-a",
        order: 1,
        prompt: "Approach Friend A and talk",
        targetId: firstCharacter?.id ?? "npc_friend_01",
        completion: "talk"
      },
      {
        id: "inspect-pastry",
        order: 2,
        prompt: "Inspect the pastry",
        targetId: firstObject?.id ?? "obj_pastry",
        completion: "inspect"
      },
      { id: "walk-to-exit", order: 3, prompt: "Walk to the exit", targetId: "exit_bakery", completion: "exit" }
    ],
    dialogueNodes: [
      {
        id: "dialogue-friend-a-01",
        speakerId: firstCharacter?.id ?? "npc_friend_01",
        text: firstDialogue?.text ?? "This place smells good.",
        source: firstDialogue?.source ?? "reconstructed",
        objectiveId: "talk-to-friend-a"
      },
      {
        id: "dialogue-muji-01",
        speakerId: "muji",
        text: "Muji remembers the warm light on the counter.",
        source: "muji_observation",
        objectiveId: "inspect-pastry"
      }
    ],
    ending: {
      id: "ending-return-to-forest",
      text: "Bakery Day settles into the forest as a lit doorway.",
      returnTarget: "forest"
    },
    validationErrors: []
  });
}

export function parseChapterManifest(input: unknown) {
  return ChapterManifestSchema.safeParse(input);
}

export function parseChapterCompletionState(input: unknown) {
  return ChapterCompletionStateSchema.safeParse(input);
}
