import type { ChapterDefinition, ReflectionChoice } from "../types.js";
import { april05Assets, april05Chapter, april05EchoActions, april05EchoAnchors, april05MainMemoryActions, april05ReflectionChoices, resolveApril05Actions, type April05EchoId } from "../fixtures/april05Chapter.js";
import { april06Assets, april06Chapter, april06EchoActions, april06MainMemoryActions, april06ReflectionChoices, resolveApril06Actions } from "../fixtures/april06Chapter.js";
import { april25Assets, april25Chapter, april25EchoAnchors, april25EchoAvailability, april25EchoPortraitSequenceIds, april25PortraitSequences, april25ReflectionChoices, resolveApril25Actions } from "../fixtures/april25Chapter.js";
import { may23Assets, may23Chapter, may23EchoAnchors, may23ReflectionChoices, resolveMay23Actions } from "../fixtures/may23Chapter.js";
import { june24Assets, june24Chapter, june24EchoDialogues, june24ReflectionChoices, resolveJune24Actions } from "../fixtures/june24Chapter.js";
import { june25Assets, june25Chapter, june25EchoAnchors, june25EchoAvailability, june25EchoPortraitSequenceIds, june25PortraitSequences, june25ReflectionChoices, resolveJune25Actions } from "../fixtures/june25Chapter.js";
import { july21Assets, july21Chapter, july21EchoAnchors, july21EchoAvailability, july21EchoPortraitSequenceIds, july21PortraitSequences, july21ReflectionChoices, resolveJuly21Actions } from "../fixtures/july21Chapter.js";
import { november22Chapter, november22EchoAnchors, november22EchoAvailability, november22EchoPortraitSequenceIds, november22PortraitSequences, november22ReflectionChoices } from "../fixtures/november22Chapter.js";
import type { CutsceneAction } from "./CutsceneSystem.js";
import type { SceneSpriteAsset } from "./SceneActorRenderer.js";
import type { SceneLayout } from "./SceneLayouts.js";
import type { AuthoredPortraitSequence } from "./MemoryPortraitPresentation.js";

export type AuthoredRuntimeDefinition = {
  chapter: ChapterDefinition;
  assets: Record<string, SceneSpriteAsset>;
  resolveActions: (layout: SceneLayout, mode: "main" | "echo", echoId?: string) => CutsceneAction[];
  reflectionChoices: Array<{ id: string; prompt: string; choices: ReflectionChoice[] }>;
  echoAnchors: Record<string, string>;
  triggerId?: string;
  mainInteractionId?: string;
  echoRequiresMainCompletion?: boolean;
  echoPortraitIds?: Record<string, string>;
  echoPortraitDialogues?: Record<string, Array<{ speaker: string; text: string }>>;
  portraitSequences?: Record<string, AuthoredPortraitSequence>;
  mainPortraitSequenceId?: string;
  echoPortraitSequenceIds?: Record<string, string>;
  echoAvailability?: Record<string, { requiresMainCompletion?: boolean; requiresEchoIds?: string[] }>;
  reflectionAfterEchoId?: string;
};

export function authoredEchoIsAvailable(
  runtime: Pick<AuthoredRuntimeDefinition, "echoAvailability" | "echoRequiresMainCompletion">,
  interactionId: string,
  mainMemoryCompleted: boolean,
  discoveredEchoIds: ReadonlySet<string> = new Set()
): boolean {
  const availability = runtime.echoAvailability?.[interactionId];
  const requiresMainCompletion = availability?.requiresMainCompletion
    ?? runtime.echoRequiresMainCompletion
    ?? true;
  const requiresEchoIds = availability?.requiresEchoIds ?? [];
  return (!requiresMainCompletion || mainMemoryCompleted) && requiresEchoIds.every((id) => discoveredEchoIds.has(id));
}

export const authoredRuntimeByScene: Record<string, AuthoredRuntimeDefinition> = {
  "405": {
    chapter: april05Chapter,
    assets: april05Assets,
    resolveActions: (layout, mode, echoId) => resolveApril05Actions(layout, mode === "main" ? april05MainMemoryActions : april05EchoActions[echoId as April05EchoId] ?? []),
    reflectionChoices: april05ReflectionChoices,
    echoAnchors: april05EchoAnchors
  },
  "406": {
    chapter: april06Chapter,
    assets: april06Assets,
    resolveActions: (layout, mode) => resolveApril06Actions(layout, mode === "main" ? april06MainMemoryActions : april06EchoActions),
    reflectionChoices: april06ReflectionChoices,
    echoAnchors: { "watergun-crossing": "watergun-crossing" }
  },
  "425": {
    chapter: april25Chapter,
    assets: april25Assets,
    resolveActions: (layout, mode, echoId) => resolveApril25Actions(layout, mode, echoId),
    reflectionChoices: april25ReflectionChoices,
    echoAnchors: april25EchoAnchors,
    mainInteractionId: "apr25-main-memory",
    triggerId: "apr25-ktho-main-trigger",
    portraitSequences: april25PortraitSequences,
    mainPortraitSequenceId: "apr25-main",
    echoPortraitSequenceIds: april25EchoPortraitSequenceIds,
    echoAvailability: april25EchoAvailability,
    reflectionAfterEchoId: "st-room-echo"
  },
  "523": {
    chapter: may23Chapter,
    assets: may23Assets,
    resolveActions: (layout, mode, echoId) => resolveMay23Actions(layout, mode, echoId),
    reflectionChoices: may23ReflectionChoices,
    echoAnchors: may23EchoAnchors,
    triggerId: "hostel-lobby-arrival",
    mainInteractionId: "hostel-lobby-memory"
  },
  "624": {
    chapter: june24Chapter,
    assets: june24Assets,
    resolveActions: (layout, mode, echoId) => resolveJune24Actions(layout, mode, echoId),
    reflectionChoices: june24ReflectionChoices,
    echoAnchors: {
      "carrot-milk-memory": "carrot-milk-residue",
      "five-cent-memory": "five-cent-residue",
      "xiaoba-memory": "xiaoba-residue"
    },
    echoRequiresMainCompletion: false,
    echoPortraitIds: {
      "carrot-milk-memory": "june24-angela-st-echo",
      "five-cent-memory": "june24-room-study-echo",
      "xiaoba-memory": "june24-haircut-echo"
    },
    echoPortraitDialogues: june24EchoDialogues,
    triggerId: "june24-table-arrival",
    mainInteractionId: "table-memory"
  },
  "625": {
    chapter: june25Chapter,
    assets: june25Assets,
    resolveActions: (layout, mode, echoId) => resolveJune25Actions(layout, mode, echoId),
    reflectionChoices: june25ReflectionChoices,
    echoAnchors: june25EchoAnchors,
    mainInteractionId: "bed-main-memory",
    triggerId: "june25-bed-main-trigger",
    portraitSequences: june25PortraitSequences,
    mainPortraitSequenceId: "june25-main",
    echoPortraitSequenceIds: june25EchoPortraitSequenceIds,
    echoAvailability: june25EchoAvailability
  },
  "721": {
    chapter: july21Chapter,
    assets: july21Assets,
    resolveActions: (layout, mode, echoId) => resolveJuly21Actions(layout, mode, echoId),
    reflectionChoices: july21ReflectionChoices,
    echoAnchors: july21EchoAnchors,
    mainInteractionId: "sofa-main-memory",
    triggerId: "july21-sofa-main-trigger",
    portraitSequences: july21PortraitSequences,
    mainPortraitSequenceId: "july21-main",
    echoPortraitSequenceIds: july21EchoPortraitSequenceIds,
    echoAvailability: july21EchoAvailability,
    reflectionAfterEchoId: "left-behind-memory"
  },
  "1122": {
    chapter: november22Chapter,
    assets: {},
    resolveActions: () => [],
    reflectionChoices: november22ReflectionChoices,
    echoAnchors: november22EchoAnchors,
    mainInteractionId: "main-memory",
    triggerId: "1122-main-memory-trigger",
    portraitSequences: november22PortraitSequences,
    mainPortraitSequenceId: "1122-main",
    echoPortraitSequenceIds: november22EchoPortraitSequenceIds,
    echoAvailability: november22EchoAvailability,
    reflectionAfterEchoId: "memory-empty-room-rain"
  }
};
