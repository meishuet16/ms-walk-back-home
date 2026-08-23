import assert from "node:assert/strict";
import { test } from "node:test";
import { cloneSceneLayout, makeDefaultLayout } from "../src/systems/SceneLayouts.js";
import {
  applyPointTextEdit,
  bulkAddPoints,
  createDraftPoint,
  deletePoints,
  filterPointEntries,
  movePoints,
  normalizeSceneId,
  parseAnchorManifest,
  portraitDraftFromLandscape,
  sceneIdentity
} from "../src/systems/SceneDebugModel.js";

const layout = () => makeDefaultLayout("disposable", "Disposable", "landscape");

test("scene identity trims ids and keeps orientation distinct", () => {
  assert.equal(normalizeSceneId(" 406 "), "406");
  assert.equal(sceneIdentity("406", "landscape"), "406::landscape");
  assert.notEqual(sceneIdentity("406", "landscape"), sceneIdentity("406", "portrait"));
});

test("bulk add trims blanks, staggers draft points, and skips duplicate ids atomically", () => {
  const source = layout();
  source.anchors.existing = { x: 10, y: 20 };
  const result = bulkAddPoints(source, " existing\nnew-a\n\nnew-b ", "anchor");
  assert.deepEqual(Object.keys(source.anchors), ["existing"]);
  assert.deepEqual(result.added, ["new-a", "new-b"]);
  assert.deepEqual(result.skipped, ["existing"]);
  assert.equal(result.invalid.length, 0);
  assert.notDeepEqual(result.layout.anchors["new-a"], result.layout.anchors["new-b"]);
});

test("manifest parser separates anchors and echo anchors", () => {
  const result = parseAnchorManifest("[ANCHORS]\na\nb\n[ECHO ANCHORS]\nx\ny");
  assert.deepEqual(result.anchors, ["a", "b"]);
  assert.deepEqual(result.echoAnchors, ["x", "y"]);
  assert.deepEqual(result.invalid, []);
});

test("bulk text edit preserves coordinates, removes absent points, and drafts new points", () => {
  const source = layout();
  source.anchors.a = { x: 10, y: 20 };
  source.anchors.b = { x: 30, y: 40 };
  const result = applyPointTextEdit(source, "[ANCHORS]\na\nc");
  assert.deepEqual(result.layout.anchors.a, { x: 10, y: 20 });
  assert.equal(result.layout.anchors.b, undefined);
  assert.deepEqual(result.added, ["c"]);
  assert.deepEqual(result.removed, ["b"]);
});

test("point filtering returns both point types with selection keys", () => {
  const source = layout();
  source.anchors.ruffle = { x: 1, y: 2 };
  source.echoAnchors["et-lock"] = { x: 3, y: 4, radius: 8 };
  assert.deepEqual(filterPointEntries(source, "et", "all").map((item) => item.key), ["echo-anchor:et-lock"]);
  assert.deepEqual(filterPointEntries(source, "", "anchors").map((item) => item.key), ["anchor:ruffle"]);
});

test("multi-move and delete preserve exact point identity", () => {
  const source = layout();
  source.anchors.a = { x: 1, y: 2 };
  source.echoAnchors.e = { x: 3, y: 4, radius: 9 };
  const moved = movePoints(source, ["anchor:a", "echo-anchor:e"], { x: 5, y: -2 });
  assert.deepEqual(moved.anchors.a, { x: 6, y: 0 });
  assert.deepEqual(moved.echoAnchors.e, { x: 8, y: 2, radius: 9 });
  const deleted = deletePoints(moved, ["anchor:a", "echo-anchor:e"]);
  assert.equal(deleted.anchors.a, undefined);
  assert.equal(deleted.echoAnchors.e, undefined);
});

test("portrait draft maps landscape coordinates without mutating either source", () => {
  const landscape = layout();
  landscape.size = { w: 1000, h: 500 };
  landscape.spawn = { x: 250, y: 100 };
  landscape.anchors.a = { x: 500, y: 250 };
  const portrait = makeDefaultLayout("disposable", "Disposable", "portrait");
  portrait.size = { w: 400, h: 800 };
  const result = portraitDraftFromLandscape(landscape, portrait);
  assert.deepEqual(landscape.spawn, { x: 250, y: 100 });
  assert.deepEqual(result.layout.spawn, { x: 100, y: 160 });
  assert.deepEqual(result.layout.anchors.a, { x: 200, y: 400 });
  assert.equal(result.isDraft, true);
});

test("draft point helper stays inside a safe authoring area", () => {
  const point = createDraftPoint(17, { w: 100, h: 100 });
  assert.ok(point.x > 0 && point.x < 100);
  assert.ok(point.y > 0 && point.y < 100);
});



