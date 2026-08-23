import type { SceneOrientation } from "./SceneLayouts.js";
import { validateProjectAssetPath } from "./SceneDebugPreview.js";

export type NormalizedPoint = { x: number; y: number };
export type NormalizedRect = { x: number; y: number; w: number; h: number };
export type ManifestEchoAnchor = NormalizedPoint & { radius: number };
export type ManifestObstacle = NormalizedRect & { id?: string };
export type ManifestInteraction = NormalizedPoint & { id: string; label?: string; radius: number };
export type ManifestTrigger = { id: string; rect: NormalizedRect; chapterId: string; eventId: string; once?: boolean };
export type ManifestPlacementSlot = NormalizedPoint & { id: string; kind: "chapter" | "fragment"; radius: number };
export type ManifestGroup = { id: string; name: string; members: string[] };
export type ManifestPreview = {
  id: string;
  name: string;
  asset: string;
  kind?: "single" | "pair" | "multi" | "prop" | "vfx";
  anchorId?: string;
  x?: number;
  y?: number;
  offsetX?: number;
  offsetY?: number;
  scale?: number;
  flip?: boolean;
  opacity?: number;
  z?: number;
};
export type ManifestConstraint =
  | { id: string; type: "relative-x"; left: string; right: string }
  | { id: string; type: "relative-y"; above: string; below: string }
  | { id: string; type: "shared-baseline"; first: string; second: string; tolerancePx?: number };

export type ManifestOrientation = {
  asset: string;
  size: { w: number; h: number };
  spawn: NormalizedPoint;
  obstacles?: ManifestObstacle[];
  interactions?: ManifestInteraction[];
  triggers?: ManifestTrigger[];
  placementSlots?: ManifestPlacementSlot[];
  echoAnchors?: Record<string, ManifestEchoAnchor>;
  anchors?: Record<string, NormalizedPoint>;
  groups?: ManifestGroup[];
  previews?: ManifestPreview[];
  constraints?: ManifestConstraint[];
};

export type SceneAuthoringManifest = {
  manifestVersion: 1;
  chapterId: string;
  sceneId: string;
  label: string;
  orientations: Partial<Record<SceneOrientation, ManifestOrientation>>;
};

export type ManifestIssue = { path: string; message: string; severity: "error" | "warning" };
export type ManifestValidationResult = {
  manifest: SceneAuthoringManifest | null;
  errors: ManifestIssue[];
  warnings: ManifestIssue[];
  valid: boolean;
};

const orientationNames: SceneOrientation[] = ["landscape", "portrait"];

function makeIssue(path: string, message: string, severity: ManifestIssue["severity"]): ManifestIssue {
  return { path, message, severity };
}
function finite(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}
function text(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}
function normalizedPoint(value: unknown): value is NormalizedPoint {
  const item = value as Partial<NormalizedPoint> | null;
  return Boolean(item && finite(item.x) && finite(item.y) && item.x >= 0 && item.x <= 1 && item.y >= 0 && item.y <= 1);
}
function normalizedRect(value: unknown): value is NormalizedRect {
  const item = value as Partial<NormalizedRect> | null;
  return Boolean(item && finite(item.x) && finite(item.y) && finite(item.w) && finite(item.h) &&
    item.x >= 0 && item.y >= 0 && item.w > 0 && item.h > 0 && item.x + item.w <= 1 && item.y + item.h <= 1);
}
function object(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}
function duplicateIssues(values: string[], path: string): ManifestIssue[] {
  const seen = new Set<string>();
  const result: ManifestIssue[] = [];
  for (const value of values) {
    if (seen.has(value)) result.push(makeIssue(path, "Duplicate ID \"" + value + "\".", "error"));
    seen.add(value);
  }
  return result;
}
function pointIds(section: ManifestOrientation): Set<string> {
  return new Set([
    ...Object.keys(section.anchors ?? {}).map((id) => "anchor:" + id),
    ...Object.keys(section.echoAnchors ?? {}).map((id) => "echo-anchor:" + id)
  ]);
}

export function parseSceneAuthoringManifest(textValue: string): { value: unknown | null; errors: ManifestIssue[] } {
  try {
    return { value: JSON.parse(textValue), errors: [] };
  } catch (error) {
    return { value: null, errors: [makeIssue("$", error instanceof Error ? error.message : "Invalid JSON.", "error")] };
  }
}

export function validateSceneAuthoringManifest(input: unknown, assetPaths?: ReadonlySet<string>): ManifestValidationResult {
  const errors: ManifestIssue[] = [];
  const warnings: ManifestIssue[] = [];
  const raw = object(input);
  if (raw.manifestVersion !== 1) {
    errors.push(makeIssue("manifestVersion", "Unsupported Scene Authoring Manifest version; expected 1.", "error"));
    return { manifest: null, errors, warnings, valid: false };
  }
  if (!text(raw.chapterId)) errors.push(makeIssue("chapterId", "chapterId is required.", "error"));
  if (!text(raw.sceneId) || /[\\\/:*?"<>|]/.test(String(raw.sceneId))) errors.push(makeIssue("sceneId", "sceneId must be a safe non-empty identifier.", "error"));
  if (!text(raw.label)) errors.push(makeIssue("label", "label is required.", "error"));
  const rawOrientations = object(raw.orientations);
  const normalized: SceneAuthoringManifest = {
    manifestVersion: 1,
    chapterId: String(raw.chapterId ?? "").trim(),
    sceneId: String(raw.sceneId ?? "").trim(),
    label: String(raw.label ?? "").trim(),
    orientations: {}
  };
  const present = orientationNames.filter((orientation) => rawOrientations[orientation] !== undefined);
  if (!present.length) errors.push(makeIssue("orientations", "At least one orientation is required.", "error"));
  for (const orientation of present) {
    const section = object(rawOrientations[orientation]);
    const path = "orientations." + orientation;
    const size = object(section.size);
    if (!finite(size.w) || size.w <= 0 || !finite(size.h) || size.h <= 0) errors.push(makeIssue(path + ".size", "size.w and size.h must be positive finite numbers.", "error"));
    const asset = String(section.asset ?? "");
    try { validateProjectAssetPath(asset); } catch (error) { errors.push(makeIssue(path + ".asset", error instanceof Error ? error.message : "Invalid asset path.", "error")); }
    if (assetPaths && asset && !assetPaths.has(asset)) warnings.push(makeIssue(path + ".asset", "Asset was not found in the discovered project asset inventory.", "warning"));
    const spawn = section.spawn ?? { x: 0.5, y: 0.5 };
    if (!normalizedPoint(spawn)) errors.push(makeIssue(path + ".spawn", "spawn must use normalized x/y values from 0 to 1.", "error"));
    for (const [field, values] of [["obstacles", section.obstacles], ["triggers", section.triggers]] as const) {
      if (values !== undefined && !Array.isArray(values)) errors.push(makeIssue(path + "." + field, "Expected an array.", "error"));
    }
    const anchors = object(section.anchors);
    const echoes = object(section.echoAnchors);
    for (const [id, value] of Object.entries(anchors)) if (!normalizedPoint(value)) errors.push(makeIssue(path + ".anchors." + id, "Anchor must use normalized x/y values.", "error"));
    for (const [id, value] of Object.entries(echoes)) {
      const echo = object(value);
      if (!normalizedPoint(echo) || !finite((echo as Record<string, unknown>).radius) || Number((echo as Record<string, unknown>).radius) <= 0) errors.push(makeIssue(path + ".echoAnchors." + id, "Echo anchor needs normalized x/y and positive radius.", "error"));
    }
    for (const [index, value] of (Array.isArray(section.obstacles) ? section.obstacles : []).entries()) {
      if (!normalizedRect(value)) errors.push(makeIssue(path + ".obstacles." + index, "Obstacle must be a normalized in-bounds rectangle.", "error"));
    }
    for (const [index, value] of (Array.isArray(section.interactions) ? section.interactions : []).entries()) {
      const interaction = object(value);
      if (!text(interaction.id) || !normalizedPoint(interaction)) errors.push(makeIssue(path + ".interactions." + index, "Interaction needs id and normalized x/y.", "error"));
      if (!finite((interaction as Record<string, unknown>).radius) || Number((interaction as Record<string, unknown>).radius) <= 0) errors.push(makeIssue(path + ".interactions." + index + ".radius", "Interaction radius must be positive.", "error"));
    }
    for (const [index, value] of (Array.isArray(section.placementSlots) ? section.placementSlots : []).entries()) {
      const slot = object(value);
      if (!text(slot.id) || !normalizedPoint(slot) || !["chapter", "fragment"].includes(String((slot as Record<string, unknown>).kind)) || !finite((slot as Record<string, unknown>).radius) || Number((slot as Record<string, unknown>).radius) <= 0) {
        errors.push(makeIssue(path + ".placementSlots." + index, "Placement slot needs id, kind, normalized x/y, and positive radius.", "error"));
      }
    }
    const groupValues = Array.isArray(section.groups) ? section.groups : [];
    errors.push(...duplicateIssues(groupValues.map((item) => String(object(item).id ?? "")), path + ".groups"));
    const ids = pointIds(section as ManifestOrientation);
    for (const [index, value] of groupValues.entries()) {
      const group = object(value);
      if (!text(group.id) || !text(group.name) || !Array.isArray(group.members)) errors.push(makeIssue(path + ".groups." + index, "Group needs id, name, and members.", "error"));
      for (const member of Array.isArray(group.members) ? group.members : []) if (!ids.has(String(member))) errors.push(makeIssue(path + ".groups." + index + ".members", "Unknown point \"" + String(member) + "\".", "error"));
    }
    const previewValues = Array.isArray(section.previews) ? section.previews : [];
    errors.push(...duplicateIssues(previewValues.map((item) => String(object(item).id ?? "")), path + ".previews"));
    for (const [index, value] of previewValues.entries()) {
      const preview = object(value);
      try { validateProjectAssetPath(String(preview.asset ?? "")); } catch (error) { errors.push(makeIssue(path + ".previews." + index + ".asset", error instanceof Error ? error.message : "Invalid preview asset.", "error")); }
      if (preview.anchorId !== undefined && !ids.has("anchor:" + String(preview.anchorId)) && !ids.has("echo-anchor:" + String(preview.anchorId))) errors.push(makeIssue(path + ".previews." + index + ".anchorId", "Preview anchor binding does not resolve.", "error"));
      if ("approval" in preview || "canonicalCandidate" in preview) warnings.push(makeIssue(path + ".previews." + index, "Preview approval metadata is ignored on import; imported previews start PREVIEW ONLY.", "warning"));
    }
    errors.push(...duplicateIssues((Array.isArray(section.interactions) ? section.interactions : []).map((item) => String(object(item).id ?? "")), path + ".interactions"));
    errors.push(...duplicateIssues((Array.isArray(section.placementSlots) ? section.placementSlots : []).map((item) => String(object(item).id ?? "")), path + ".placementSlots"));
    errors.push(...duplicateIssues((Array.isArray(section.triggers) ? section.triggers : []).map((item) => String(object(item).id ?? "")), path + ".triggers"));
    errors.push(...duplicateIssues((Array.isArray(section.obstacles) ? section.obstacles : []).map((item) => String(object(item).id ?? "")), path + ".obstacles"));
    const constraintValues = Array.isArray(section.constraints) ? section.constraints : [];
    errors.push(...duplicateIssues(constraintValues.map((item) => String(object(item).id ?? "")), path + ".constraints"));
    for (const [index, value] of constraintValues.entries()) {
      const constraint = object(value);
      if (!text(constraint.id) || !["relative-x", "relative-y", "shared-baseline"].includes(String(constraint.type))) errors.push(makeIssue(path + ".constraints." + index, "Constraint needs an id and supported type.", "error"));
      const refs = constraint.type === "relative-x" ? [constraint.left, constraint.right] : constraint.type === "relative-y" ? [constraint.above, constraint.below] : [constraint.first, constraint.second];
      for (const ref of refs) if (ref !== undefined && !ids.has("anchor:" + String(ref)) && !ids.has("echo-anchor:" + String(ref))) errors.push(makeIssue(path + ".constraints." + index, "Constraint point reference does not resolve.", "error"));
    }
    const normalizedSection = { ...(section as unknown as ManifestOrientation), spawn: normalizedPoint(spawn) ? spawn : { x: 0.5, y: 0.5 } };
    normalized.orientations[orientation] = normalizedSection;
  }
  return { manifest: errors.length ? null : normalized, errors, warnings, valid: errors.length === 0 };
}

export function normalizedPointToScene(point: NormalizedPoint, size: { w: number; h: number }): { x: number; y: number } {
  return { x: point.x * size.w, y: point.y * size.h };
}
export function normalizedRectToScene(rect: NormalizedRect, size: { w: number; h: number }): { x: number; y: number; w: number; h: number } {
  return { x: rect.x * size.w, y: rect.y * size.h, w: rect.w * size.w, h: rect.h * size.h };
}
export function normalizedRadiusToScene(radius: number, size: { w: number; h: number }): number {
  return radius * Math.min(size.w, size.h);
}
export function summarizeSceneAuthoringManifest(manifest: SceneAuthoringManifest): string[] {
  return Object.entries(manifest.orientations).flatMap(([orientation, section]) => [
    orientation + ": " + (section?.size.w ?? 0) + "×" + (section?.size.h ?? 0),
    (section?.anchors ? Object.keys(section.anchors).length : 0) + " anchors, " + (section?.echoAnchors ? Object.keys(section.echoAnchors).length : 0) + " echo anchors",
    (section?.obstacles?.length ?? 0) + " collision drafts, " + (section?.previews?.length ?? 0) + " preview imports"
  ]);
}




