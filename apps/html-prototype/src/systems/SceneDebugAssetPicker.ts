export type ProjectAssetEntry = {
  path: string;
  name: string;
  folder: string;
  prioritized: boolean;
};

export type ProjectAssetFilter = {
  sceneId?: string;
  query?: string;
  folder?: string;
  showAll?: boolean;
  limit?: number;
};

function normalize(value: string): string {
  return value.trim().replace(/\\/g, "/");
}

export function projectAssetFolders(paths: readonly string[], sceneId?: string): string[] {
  const folders = new Set<string>();
  for (const raw of paths) {
    const path = normalize(raw);
    const slash = path.lastIndexOf("/");
    if (slash < 0) continue;
    const parts = path.slice(0, slash).split("/");
    for (let index = 1; index <= parts.length; index += 1) folders.add(parts.slice(0, index).join("/"));
  }
  return [...folders].sort((a, b) => {
    const preferred = sceneId ? "assets/" + sceneId : "";
    const aPreferred = a === preferred || a.startsWith(preferred + "/");
    const bPreferred = b === preferred || b.startsWith(preferred + "/");
    return Number(bPreferred) - Number(aPreferred) || a.localeCompare(b);
  });
}

export function filterProjectAssets(paths: readonly string[], filter: ProjectAssetFilter = {}): ProjectAssetEntry[] {
  const query = normalize(filter.query ?? "").toLowerCase();
  const folder = normalize(filter.folder ?? "");
  const scenePrefix = filter.sceneId ? "assets/" + normalize(filter.sceneId).replace(/^assets\//, "") + "/" : "";
  const entries = paths.map((raw) => normalize(raw)).filter((path) => {
    if (!/^assets\/.+\.(png|webp|jpg|jpeg)$/i.test(path)) return false;
    if (folder && !(path === folder || path.startsWith(folder + "/"))) return false;
    if (query && !path.toLowerCase().includes(query)) return false;
    return true;
  }).map((path) => {
    const slash = path.lastIndexOf("/");
    return { path, name: path.slice(slash + 1), folder: path.slice(0, slash), prioritized: Boolean(scenePrefix && path.startsWith(scenePrefix)) };
  });
  entries.sort((a, b) => Number(b.prioritized) - Number(a.prioritized) || a.path.localeCompare(b.path));
  return entries.slice(0, filter.limit ?? 120);
}

export type AnchorPickerEntry = {
  id: string;
  kind: "free" | "anchor" | "echo-anchor";
  label: string;
  x?: number;
  y?: number;
};

export function filterAnchorPickerEntries(
  layout: { anchors: Record<string, { x: number; y: number }>; echoAnchors: Record<string, { x: number; y: number; radius: number }> },
  query = ""
): AnchorPickerEntry[] {
  const normalizedQuery = query.trim().toLowerCase();
  const entries: AnchorPickerEntry[] = [
    { id: "", kind: "free", label: "Free Position" },
    ...Object.entries(layout.anchors).map(([id, point]) => ({ id, kind: "anchor" as const, label: "Anchor · (" + Math.round(point.x) + ", " + Math.round(point.y) + ")", x: point.x, y: point.y })),
    ...Object.entries(layout.echoAnchors).map(([id, point]) => ({ id, kind: "echo-anchor" as const, label: "Echo Anchor · (" + Math.round(point.x) + ", " + Math.round(point.y) + ")", x: point.x, y: point.y }))
  ];
  return entries.filter((entry) => !normalizedQuery || entry.id.toLowerCase().includes(normalizedQuery) || entry.label.toLowerCase().includes(normalizedQuery));
}
