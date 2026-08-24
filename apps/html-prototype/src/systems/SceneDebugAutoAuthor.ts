import { cloneSceneLayout, type SceneLayout, type SceneOrientation } from "./SceneLayouts.js";
import { pointKey, type EditorPointGroup } from "./SceneDebugModel.js";
import { normalizedPointToScene, normalizedRadiusToScene, normalizedRectToScene, type ManifestOrientation, type SceneAuthoringManifest } from "./SceneDebugAuthoringManifest.js";

export type CollisionReviewStatus = "draft-review-required";
export type CollisionReviewEntry = { id: string; rect: { x: number; y: number; w: number; h: number }; status: CollisionReviewStatus };
export type AutoAuthorPreviewImport = {
  id: string;
  name: string;
  asset: string;
  status: "preview-only" | "missing-asset";
  anchorId?: string;
  kind?: "single" | "pair" | "multi" | "prop" | "vfx";
  scale?: number;
  flip?: boolean;
  offsetX?: number;
  offsetY?: number;
  opacity?: number;
  z?: number;
};
export type AutoAuthorSummary = {
  orientation: SceneOrientation;
  layoutChanged: boolean;
  existingLayoutDetected: boolean;
  requiresExplicitChoice: boolean;
  counts: { anchors: number; echoAnchors: number; obstacles: number; interactions: number; triggers: number; previews: number; groups: number; constraints: number };
};
export type AutoAuthorPlan = {
  manifest: SceneAuthoringManifest;
  orientation: SceneOrientation;
  candidate: SceneLayout;
  groups: EditorPointGroup[];
  previews: AutoAuthorPreviewImport[];
  collisionReviews: CollisionReviewEntry[];
  constraints: NonNullable<ManifestOrientation["constraints"]>;
  summary: AutoAuthorSummary;
};
export type AutoAuthorApplyMode = "preserve-existing" | "replace-existing" | "new";

function sectionFor(manifest: SceneAuthoringManifest, orientation: SceneOrientation): ManifestOrientation {
  const section = manifest.orientations[orientation];
  if (!section) throw new Error("Manifest does not define " + orientation + ".");
  return section;
}
function pointFromId(member: string): EditorPointGroup["members"][number] {
  const [kind, id] = member.split(":");
  return pointKey(kind === "echo-anchor" ? "echo-anchor" : "anchor", id ?? member);
}

export function buildAutoAuthorPlan(
  manifest: SceneAuthoringManifest,
  orientation: SceneOrientation,
  existingLayout: SceneLayout,
  options: { existingLayoutDetected?: boolean; assetPaths?: ReadonlySet<string> } = {}
): AutoAuthorPlan {
  const section = sectionFor(manifest, orientation);
  const size = section.size;
  const candidate: SceneLayout = {
    sceneId: manifest.sceneId,
    label: manifest.label,
    orientation,
    asset: section.asset,
    size: { ...size },
    spawn: normalizedPointToScene(section.spawn, size),
    obstacles: (section.obstacles ?? []).map((rect) => normalizedRectToScene(rect, size)),
    interactions: (section.interactions ?? []).map((item) => ({ id: item.id, label: item.label ?? item.id, ...normalizedPointToScene(item, size), radius: item.radius })),
    triggers: (section.triggers ?? []).map((item) => ({ id: item.id, rect: normalizedRectToScene(item.rect, size), chapterId: item.chapterId, eventId: item.eventId, once: item.once ?? true })),
    placementSlots: (section.placementSlots ?? []).map((item) => ({ id: item.id, kind: item.kind, ...normalizedPointToScene(item, size), radius: item.radius })),
    echoAnchors: Object.fromEntries(Object.entries(section.echoAnchors ?? {}).map(([id, item]) => [id, { ...normalizedPointToScene(item, size), radius: normalizedRadiusToScene(item.radius, size) }])),
    anchors: Object.fromEntries(Object.entries(section.anchors ?? {}).map(([id, item]) => [id, normalizedPointToScene(item, size)]))
  };
  const groups = (section.groups ?? []).map((group) => ({ id: group.id, name: group.name.trim() || group.id, members: [...new Set(group.members.map(pointFromId))] }));
  const previews = (section.previews ?? []).map((item) => ({
    id: item.id,
    name: item.name,
    asset: item.asset,
    status: options.assetPaths && !options.assetPaths.has(item.asset) ? "missing-asset" as const : "preview-only" as const,
    anchorId: item.anchorId,
    kind: item.kind,
    scale: item.scale,
    flip: item.flip,
    offsetX: item.offsetX,
    offsetY: item.offsetY,
    opacity: item.opacity,
    z: item.z
  }));
  const collisionReviews = (section.obstacles ?? []).map((rect, index) => ({
    id: rect.id ?? "collision-" + (index + 1),
    rect: normalizedRectToScene(rect, size),
    status: "draft-review-required" as const
  }));
  const existingLayoutDetected = options.existingLayoutDetected ?? false;
  return {
    manifest,
    orientation,
    candidate,
    groups,
    previews,
    collisionReviews,
    constraints: section.constraints ?? [],
    summary: {
      orientation,
      layoutChanged: JSON.stringify(candidate) !== JSON.stringify(existingLayout),
      existingLayoutDetected,
      requiresExplicitChoice: existingLayoutDetected,
      counts: {
        anchors: Object.keys(candidate.anchors).length,
        echoAnchors: Object.keys(candidate.echoAnchors).length,
        obstacles: candidate.obstacles.length,
        interactions: candidate.interactions.length,
        triggers: candidate.triggers.length,
        previews: previews.length,
        groups: groups.length,
        constraints: (section.constraints ?? []).length
      }
    }
  };
}

export function applyAutoAuthorPlan(plan: AutoAuthorPlan, mode: AutoAuthorApplyMode, existingLayout: SceneLayout): { layout: SceneLayout; layoutChanged: boolean } {
  if (plan.summary.existingLayoutDetected && mode === "new") throw new Error("An existing authored layout was detected; choose preserve-existing or replace-existing explicitly.");
  if (mode === "preserve-existing") return { layout: cloneSceneLayout(existingLayout), layoutChanged: false };
  return { layout: cloneSceneLayout(plan.candidate), layoutChanged: true };
}



