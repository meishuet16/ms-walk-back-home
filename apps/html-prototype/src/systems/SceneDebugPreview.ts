import type { SceneOrientation } from "./SceneLayouts.js";

export type PreviewKind = "single" | "pair" | "multi" | "prop" | "vfx";

export type PreviewSource = {
  kind: "project" | "local";
  path?: string;
  localUrl?: string;
  fileName?: string;
};

export type CanonicalApproval = {
  sceneId: string;
  orientation: SceneOrientation;
  status: "canonical-candidate";
  approvedAt: string;
};

export type PreviewItem = {
  id: string;
  kind: PreviewKind;
  name: string;
  source: PreviewSource;
  anchorId?: string;
  freePosition: boolean;
  x: number;
  y: number;
  offsetX: number;
  offsetY: number;
  scale: number;
  flip: boolean;
  opacity: number;
  z: number;
  visible: boolean;
  showBounds: boolean;
  showAnchor: boolean;
  approval?: CanonicalApproval;
};

export type PreviewState = {
  sceneId: string;
  orientation: SceneOrientation;
  items: PreviewItem[];
  selectedId?: string;
  showAnchorPoints: boolean;
  showImageBounds: boolean;
  showVisibleBounds: boolean;
  showFeetBaseline: boolean;
};

export function validateProjectAssetPath(value: string): string {
  const path = value.trim().replace(/\\/g, "/");
  if (!path.startsWith("assets/") || path.includes("..") || path.startsWith("/") || /^[a-z]+:/i.test(path)) {
    throw new Error("A stable project-relative assets/ path is required.");
  }
  if (!/\.(png|webp|jpg|jpeg)$/i.test(path)) throw new Error("Preview assets must be PNG, WEBP, JPG, or JPEG files.");
  return path;
}

export function createPreviewState(sceneId: string, orientation: SceneOrientation): PreviewState {
  return { sceneId, orientation, items: [], showAnchorPoints: true, showImageBounds: true, showVisibleBounds: false, showFeetBaseline: false };
}

export function createPreviewItem(input: {
  name: string;
  kind?: PreviewKind;
  projectPath?: string;
  localUrl?: string;
  fileName?: string;
  anchorId?: string;
  freePosition?: boolean;
  x?: number;
  y?: number;
  offsetX?: number;
  offsetY?: number;
  scale?: number;
  flip?: boolean;
  opacity?: number;
  z?: number;
}): PreviewItem {
  const source: PreviewSource = input.projectPath
    ? { kind: "project", path: validateProjectAssetPath(input.projectPath) }
    : { kind: "local", localUrl: input.localUrl, fileName: input.fileName };
  return {
    id: `preview-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name: input.name.trim() || "Preview",
    kind: input.kind ?? "single",
    source,
    anchorId: input.anchorId,
    freePosition: input.freePosition ?? !input.anchorId,
    x: input.x ?? 0,
    y: input.y ?? 0,
    offsetX: input.offsetX ?? 0,
    offsetY: input.offsetY ?? 0,
    scale: input.scale ?? 1,
    flip: input.flip ?? false,
    opacity: input.opacity ?? 1,
    z: input.z ?? 0,
    visible: true,
    showBounds: true,
    showAnchor: Boolean(input.anchorId)
  };
}

export function addPreviewItem(state: PreviewState, item: PreviewItem): PreviewState {
  return { ...state, items: [...state.items, item], selectedId: item.id };
}

export function removePreviewItem(state: PreviewState, id: string): PreviewState {
  return { ...state, items: state.items.filter((item) => item.id !== id), selectedId: state.selectedId === id ? undefined : state.selectedId };
}

export function updatePreviewAsset(state: PreviewState, id: string, input: { projectPath?: string; localUrl?: string; fileName?: string }): PreviewState {
  return {
    ...state,
    items: state.items.map((item) => item.id !== id ? item : {
      ...item,
      source: input.projectPath
        ? { kind: "project", path: validateProjectAssetPath(input.projectPath) }
        : { kind: "local", localUrl: input.localUrl, fileName: input.fileName },
      approval: undefined
    })
  };
}

export function approveCanonicalCandidate(state: PreviewState, id: string): PreviewState {
  const item = state.items.find((candidate) => candidate.id === id);
  if (!item || item.source.kind !== "project" || !item.source.path) {
    throw new Error("Only a stable project-relative asset can be approved as a canonical candidate.");
  }
  return {
    ...state,
    items: state.items.map((candidate) => candidate.id !== id ? candidate : {
      ...candidate,
      approval: { sceneId: state.sceneId, orientation: state.orientation, status: "canonical-candidate", approvedAt: new Date().toISOString() }
    })
  };
}

export function clearCanonicalApproval(state: PreviewState, id: string): PreviewState {
  return { ...state, items: state.items.map((item) => item.id === id ? { ...item, approval: undefined } : item) };
}

function approvedItems(state: PreviewState): PreviewItem[] {
  return state.items.filter((item) => item.approval?.sceneId === state.sceneId && item.approval.orientation === state.orientation && item.source.kind === "project" && item.source.path);
}

export function copyAllApprovedMappings(state: PreviewState): string {
  const items = approvedItems(state);
  if (!items.length) return "No approved preview mappings.";
  return items.map((item, index) => [
    `[${index + 1}] ${state.sceneId} ${state.orientation}`,
    `kind: ${item.kind}`,
    `asset: ${item.source.path}`,
    `anchor: ${item.anchorId ?? "free-position"}`,
    `scale: ${item.scale}`,
    `flip: ${item.flip}`,
    `offset: (${item.offsetX}, ${item.offsetY})`,
    `opacity: ${item.opacity}`,
    `z-order: ${item.z}`,
    "status: CANONICAL CANDIDATE"
  ].join("\n")).join("\n\n");
}

export function copyPreviewMapping(state: PreviewState, id: string): string {
  const item = approvedItems(state).find((candidate) => candidate.id === id);
  if (!item) return "Preview is not an approved project-relative canonical candidate.";
  return copyAllApprovedMappings({ ...state, items: [item] });
}

export function copyImplementationHandoff(state: PreviewState): string {
  const mappings = copyAllApprovedMappings(state);
  return [
    "Scene Debug implementation handoff",
    `scene: ${state.sceneId}`,
    `orientation: ${state.orientation}`,
    "",
    "The following are user-approved canonical runtime candidates for later implementation:",
    mappings,
    "",
    "These approvals do not modify runtime code or SceneLayout JSON.",
    "SceneLayout anchor coordinates should be preserved.",
    "Later implementation must perform semantic and technical validation and must not silently substitute explicitly approved assets."
  ].join("\n");
}



