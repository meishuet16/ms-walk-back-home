import { cloneSceneLayout, type SceneLayout, type SceneOrientation } from "./SceneLayouts.js";
import type { Point, Rect } from "./CollisionSystem.js";

export type EditorPointKind = "anchor" | "echo-anchor";
export type PointFilter = "all" | "anchors" | "echo-anchors";
export type EditorPointKey = `${EditorPointKind}:${string}`;
export type EditorPointEntry = {
  key: EditorPointKey;
  id: string;
  kind: EditorPointKind;
  x: number;
  y: number;
  radius?: number;
};

export type EditorPointGroup = {
  id: string;
  name: string;
  members: EditorPointKey[];
};

export type BulkPointResult = {
  layout: SceneLayout;
  added: string[];
  skipped: string[];
  invalid: string[];
};

export type BulkEditResult = BulkPointResult & { removed: string[] };
export type ManifestResult = { anchors: string[]; echoAnchors: string[]; invalid: string[] };
export type PortraitDraftResult = { layout: SceneLayout; isDraft: true; obstacleWarning: string | null };

export function normalizeSceneId(value: string): string {
  return value.trim();
}

export function sceneIdentity(sceneId: string, orientation: SceneOrientation): string {
  return `${normalizeSceneId(sceneId)}::${orientation}`;
}

export function pointKey(kind: EditorPointKind, id: string): EditorPointKey {
  return `${kind}:${id}`;
}

export function pointEntries(layout: SceneLayout): EditorPointEntry[] {
  const anchors = Object.entries(layout.anchors).map(([id, point]) => ({
    key: pointKey("anchor", id), id, kind: "anchor" as const, x: point.x, y: point.y
  }));
  const echoes = Object.entries(layout.echoAnchors).map(([id, point]) => ({
    key: pointKey("echo-anchor", id), id, kind: "echo-anchor" as const,
    x: point.x, y: point.y, radius: point.radius
  }));
  return [...anchors, ...echoes].sort((a, b) => a.key.localeCompare(b.key));
}

export function filterPointEntries(layout: SceneLayout, search: string, filter: PointFilter): EditorPointEntry[] {
  const query = search.trim().toLowerCase();
  return pointEntries(layout).filter((item) => {
    const matchesFilter = filter === "all" || (filter === "anchors" ? item.kind === "anchor" : item.kind === "echo-anchor");
    return matchesFilter && (!query || item.id.toLowerCase().includes(query));
  });
}

export function createDraftPoint(index: number, size: { w: number; h: number }): Point {
  const columns = 6;
  const margin = Math.min(24, Math.max(4, Math.min(size.w, size.h) / 8));
  const gapX = Math.max(8, (size.w - margin * 2) / (columns + 1));
  const rows = 5;
  const gapY = Math.max(8, (size.h - margin * 2) / (rows + 1));
  const column = index % columns;
  const row = Math.floor(index / columns) % rows;
  return {
    x: Math.min(size.w - margin, margin + gapX * (column + 1)),
    y: Math.min(size.h - margin, margin + gapY * (row + 1))
  };
}

function cleanIds(lines: string): { ids: string[]; invalid: string[] } {
  const ids: string[] = [];
  const invalid: string[] = [];
  const seen = new Set<string>();
  for (const raw of lines.split(/\r?\n/)) {
    const id = raw.trim();
    if (!id) continue;
    if (!/^[^\\/<>\`"']+$/.test(id)) {
      invalid.push(id);
      continue;
    }
    if (seen.has(id)) continue;
    seen.add(id);
    ids.push(id);
  }
  return { ids, invalid };
}

export function parseAnchorManifest(text: string): ManifestResult {
  let section: "anchors" | "echoAnchors" | null = null;
  const anchors: string[] = [];
  const echoAnchors: string[] = [];
  const invalid: string[] = [];
  const seen = new Set<string>();
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line) continue;
    if (/^\[ANCHORS\]$/i.test(line)) { section = "anchors"; continue; }
    if (/^\[ECHO ANCHORS\]$/i.test(line)) { section = "echoAnchors"; continue; }
    if (!section) { invalid.push(line); continue; }
    if (!/^[^\\/<>\`"']+$/.test(line) || seen.has(`${section}:${line}`)) {
      if (!seen.has(`${section}:${line}`)) invalid.push(line);
      continue;
    }
    seen.add(`${section}:${line}`);
    (section === "anchors" ? anchors : echoAnchors).push(line);
  }
  return { anchors, echoAnchors, invalid };
}

function setPoint(layout: SceneLayout, kind: EditorPointKind, id: string, point: Point): void {
  if (kind === "anchor") layout.anchors[id] = { x: point.x, y: point.y };
  else layout.echoAnchors[id] = { x: point.x, y: point.y, radius: 56 };
}

function hasPoint(layout: SceneLayout, kind: EditorPointKind, id: string): boolean {
  return kind === "anchor" ? Boolean(layout.anchors[id]) : Boolean(layout.echoAnchors[id]);
}

export function bulkAddPoints(source: SceneLayout, text: string, kind: EditorPointKind): BulkPointResult {
  const layout = cloneSceneLayout(source);
  const { ids, invalid } = cleanIds(text);
  const added: string[] = [];
  const skipped: string[] = [];
  let draftIndex = pointEntries(layout).length;
  for (const id of ids) {
    if (hasPoint(layout, kind, id)) { skipped.push(id); continue; }
    setPoint(layout, kind, id, createDraftPoint(draftIndex++, layout.size));
    added.push(id);
  }
  return { layout, added, skipped, invalid };
}

export function applyPointTextEdit(source: SceneLayout, text: string): BulkEditResult {
  const manifest = parseAnchorManifest(text);
  const layout = cloneSceneLayout(source);
  const wanted = new Map<EditorPointKind, string[]>([
    ["anchor", manifest.anchors],
    ["echo-anchor", manifest.echoAnchors]
  ]);
  const removed: string[] = [];
  const added: string[] = [];
  const skipped = [...manifest.invalid];
  let draftIndex = pointEntries(layout).length;
  for (const [kind, ids] of wanted) {
    const existing = kind === "anchor" ? Object.keys(layout.anchors) : Object.keys(layout.echoAnchors);
    for (const id of existing) {
      if (!ids.includes(id)) {
        if (kind === "anchor") delete layout.anchors[id];
        else delete layout.echoAnchors[id];
        removed.push(id);
      }
    }
    for (const id of ids) {
      if (hasPoint(layout, kind, id)) continue;
      setPoint(layout, kind, id, createDraftPoint(draftIndex++, layout.size));
      added.push(id);
    }
  }
  return { layout, added, skipped, invalid: manifest.invalid, removed };
}

function entryFor(layout: SceneLayout, key: EditorPointKey): { point: Point; kind: EditorPointKind; id: string } | null {
  const separator = key.indexOf(":");
  if (separator < 0) return null;
  const kind = key.slice(0, separator) as EditorPointKind;
  const id = key.slice(separator + 1);
  if (kind === "anchor" && layout.anchors[id]) return { point: layout.anchors[id], kind, id };
  if (kind === "echo-anchor" && layout.echoAnchors[id]) return { point: layout.echoAnchors[id], kind, id };
  return null;
}

export function movePoints(source: SceneLayout, keys: EditorPointKey[], delta: Point): SceneLayout {
  const layout = cloneSceneLayout(source);
  for (const key of keys) {
    const entry = entryFor(layout, key);
    if (!entry) continue;
    const next = { x: entry.point.x + delta.x, y: entry.point.y + delta.y };
    setPoint(layout, entry.kind, entry.id, next);
    if (entry.kind === "echo-anchor") layout.echoAnchors[entry.id].radius = source.echoAnchors[entry.id]?.radius ?? layout.echoAnchors[entry.id].radius;
  }
  return layout;
}

export function deletePoints(source: SceneLayout, keys: EditorPointKey[]): SceneLayout {
  const layout = cloneSceneLayout(source);
  for (const key of keys) {
    const separator = key.indexOf(":");
    const kind = key.slice(0, separator);
    const id = key.slice(separator + 1);
    if (kind === "anchor") delete layout.anchors[id];
    if (kind === "echo-anchor") delete layout.echoAnchors[id];
  }
  return layout;
}

export function createPointGroup(groups: EditorPointGroup[], name: string, members: EditorPointKey[]): EditorPointGroup[] {
  const id = `group-${groups.length + 1}`;
  return [...groups, { id, name: name.trim() || id, members: [...new Set(members)] }];
}

export function moveGroup(source: SceneLayout, group: EditorPointGroup, delta: Point): SceneLayout {
  return movePoints(source, group.members, delta);
}

export function deleteGroup(groups: EditorPointGroup[], groupId: string, deleteMembers: boolean): { groups: EditorPointGroup[]; memberKeys: EditorPointKey[] } {
  const group = groups.find((item) => item.id === groupId);
  return { groups: groups.filter((item) => item.id !== groupId), memberKeys: deleteMembers ? (group?.members ?? []) : [] };
}

function scalePoint(point: Point, from: { w: number; h: number }, to: { w: number; h: number }): Point {
  return { x: (point.x / Math.max(1, from.w)) * to.w, y: (point.y / Math.max(1, from.h)) * to.h };
}

function scaleRect(rect: Rect, from: { w: number; h: number }, to: { w: number; h: number }): Rect {
  const topLeft = scalePoint(rect, from, to);
  return { x: topLeft.x, y: topLeft.y, w: (rect.w / Math.max(1, from.w)) * to.w, h: (rect.h / Math.max(1, from.h)) * to.h };
}

export function portraitDraftFromLandscape(landscape: SceneLayout, portrait: SceneLayout): PortraitDraftResult {
  const layout = cloneSceneLayout(portrait);
  layout.spawn = scalePoint(landscape.spawn, landscape.size, portrait.size);
  layout.anchors = Object.fromEntries(Object.entries(landscape.anchors).map(([id, point]) => [id, scalePoint(point, landscape.size, portrait.size)]));
  layout.echoAnchors = Object.fromEntries(Object.entries(landscape.echoAnchors).map(([id, point]) => [id, { ...scalePoint(point, landscape.size, portrait.size), radius: point.radius }]));
  layout.interactions = landscape.interactions.map((item) => ({ ...item, x: scalePoint(item, landscape.size, portrait.size).x, y: scalePoint(item, landscape.size, portrait.size).y, radius: pointScale(item.radius, landscape.size, portrait.size) }));
  layout.triggers = landscape.triggers.map((item) => ({ ...item, rect: scaleRect(item.rect, landscape.size, portrait.size) }));
  layout.obstacles = landscape.obstacles.map((item) => scaleRect(item, landscape.size, portrait.size));
  return { layout, isDraft: true, obstacleWarning: null };
}

function pointScale(value: number, from: { w: number; h: number }, to: { w: number; h: number }): number {
  return value * Math.min(to.w / Math.max(1, from.w), to.h / Math.max(1, from.h));
}

export function cloneEditorLayout(layout: SceneLayout): SceneLayout {
  return cloneSceneLayout(layout);
}




