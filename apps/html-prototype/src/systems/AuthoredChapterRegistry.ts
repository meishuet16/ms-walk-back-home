import type { ChapterDefinition, Choice } from "../types.js";
import { april05Assets, april05Chapter, april05EchoActions, april05EchoAnchors, april05MainMemoryActions, april05ReflectionChoices, resolveApril05Actions, type April05EchoId } from "../fixtures/april05Chapter.js";
import { april06Assets, april06Chapter, april06EchoActions, april06MainMemoryActions, april06ReflectionChoices, resolveApril06Actions } from "../fixtures/april06Chapter.js";
import { may23Assets, may23Chapter, may23EchoAnchors, may23ReflectionChoices, resolveMay23Actions } from "../fixtures/may23Chapter.js";
import { june24Assets, june24Chapter, june24EchoDialogues, june24ReflectionChoices, resolveJune24Actions } from "../fixtures/june24Chapter.js";
import type { CutsceneAction } from "./CutsceneSystem.js";
import type { SceneSpriteAsset } from "./SceneActorRenderer.js";
import type { SceneLayout } from "./SceneLayouts.js";

export type AuthoredRuntimeDefinition = {
  chapter: ChapterDefinition;
  assets: Record<string, SceneSpriteAsset>;
  resolveActions: (layout: SceneLayout, mode: "main" | "echo", echoId?: string) => CutsceneAction[];
  reflectionChoices: Array<{ id: string; prompt: string; choices: Choice[] }>;
  echoAnchors: Record<string, string>;
  triggerId?: string;
  mainInteractionId?: string;
  echoRequiresMainCompletion?: boolean;
  echoPortraitIds?: Record<string, string>;
  echoPortraitDialogues?: Record<string, Array<{ speaker: string; text: string }>>;
};

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
  }
};
