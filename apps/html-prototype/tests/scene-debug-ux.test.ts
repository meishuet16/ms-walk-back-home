import assert from "node:assert/strict";
import { test } from "node:test";
import { makeDefaultLayout } from "../src/systems/SceneLayouts.js";
import { filterProjectAssets, projectAssetFolders } from "../src/systems/SceneDebugAssetPicker.js";
import { filterAnchorPickerEntries } from "../src/systems/SceneDebugAssetPicker.js";
import { readSceneManifestFile } from "../src/systems/SceneDebugManifestIO.js";
import {
  addPreviewItem,
  approveCanonicalCandidates,
  createPreviewItem,
  createPreviewState,
  updatePreviewAsset
} from "../src/systems/SceneDebugPreview.js";

const assets = [
  "assets/405/a.png",
  "assets/405/sub/b.png",
  "assets/406/c.png",
  "assets/props/shared.webp"
];

test("asset picker prioritizes the current scene and supports folder-aware partial search", () => {
  assert.deepEqual(projectAssetFolders(assets, "405"), ["assets/405", "assets/405/sub", "assets", "assets/406", "assets/props"]);
  assert.deepEqual(filterProjectAssets(assets, { sceneId: "405" }).map((item) => item.path), ["assets/405/a.png", "assets/405/sub/b.png", "assets/406/c.png", "assets/props/shared.webp"]);
  assert.deepEqual(filterProjectAssets(assets, { sceneId: "405", folder: "assets/405/sub", query: "sub" }).map((item) => item.path), ["assets/405/sub/b.png"]);
  assert.deepEqual(filterProjectAssets(assets, { sceneId: "405", showAll: true, query: "406" }).map((item) => item.path), ["assets/406/c.png"]);
});

test("anchor picker includes Free Position and filters known anchors with coordinates", () => {
  const layout = makeDefaultLayout("405", "405", "landscape");
  layout.anchors["ms-spray-position"] = { x: 824, y: 516 };
  layout.anchors["et-sprayed-position"] = { x: 651, y: 519 };
  layout.echoAnchors["cat-approach"] = { x: 300, y: 400, radius: 24 };
  const entries = filterAnchorPickerEntries(layout, "spray");
  assert.deepEqual(entries.map((item) => item.id), ["ms-spray-position", "et-sprayed-position"]);
  assert.equal(filterAnchorPickerEntries(layout, "").some((item) => item.id === ""), true);
  assert.equal(entries[0].label.includes("824"), true);
});

test("manifest JSON file loader reads valid JSON text without applying it", async () => {
  const result = await readSceneManifestFile({ name: "405-scene-authoring-manifest.json", text: async () => "{\"manifestVersion\":1}" });
  assert.equal(result.fileName, "405-scene-authoring-manifest.json");
  assert.equal(result.text, "{\"manifestVersion\":1}");
  await assert.rejects(() => readSceneManifestFile({ name: "manifest.txt", text: async () => "{}" }), /JSON/);
});

test("bulk approval approves eligible project previews and skips missing or local previews", () => {
  let state = createPreviewState("405", "landscape");
  state = addPreviewItem(state, createPreviewItem({ name: "found-a", projectPath: "assets/405/a.png" }));
  state = addPreviewItem(state, createPreviewItem({ name: "missing", projectPath: "assets/405/missing.png" }));
  state = addPreviewItem(state, createPreviewItem({ name: "local", localUrl: "blob:local", fileName: "local.png" }));
  const result = approveCanonicalCandidates(state, state.items.map((item) => item.id), new Set(["assets/405/a.png"]));
  assert.equal(result.approved.length, 1);
  assert.equal(result.skipped.length, 2);
  assert.equal(result.state.items.filter((item) => item.approval).length, 1);
});

test("bulk approval is orientation-scoped by the caller's visible item set", () => {
  let landscape = createPreviewState("405", "landscape");
  landscape = addPreviewItem(landscape, createPreviewItem({ name: "landscape", projectPath: "assets/405/a.png" }));
  const portrait = { ...landscape, orientation: "portrait" as const };
  const result = approveCanonicalCandidates(landscape, landscape.items.map((item) => item.id), new Set(["assets/405/a.png"]));
  assert.equal(result.state.items[0].approval?.orientation, "landscape");
  assert.equal(portrait.items[0].approval, undefined);
});

test("changing a project asset clears an existing canonical approval", () => {
  let state = createPreviewState("405", "landscape");
  state = addPreviewItem(state, createPreviewItem({ name: "spray", projectPath: "assets/405/a.png" }));
  state = approveCanonicalCandidates(state, [state.items[0].id], new Set(["assets/405/a.png"])).state;
  const changed = updatePreviewAsset(state, state.items[0].id, { projectPath: "assets/405/sub/b.png" });
  assert.equal(changed.items[0].approval, undefined);
});
