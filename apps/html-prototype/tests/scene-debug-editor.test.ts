import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import { cloneSceneLayout, getSceneLayout, loadSceneLayoutOverrides, setSceneLayout } from "../src/systems/SceneLayouts.js";

const mainSource = readFileSync("src/main.ts", "utf8");
const editorSource = readFileSync("src/systems/SceneDebugEditor.ts", "utf8");
const devServerSource = readFileSync("scripts/dev-server.mjs", "utf8");
const appSource = readFileSync("src/app.ts", "utf8");

test("debug scene mode mounts Scene Debug Editor v2 instead of normal gameplay", () => {
  assert.match(mainSource, /new URLSearchParams\(window\.location\.search\)\.get\("debug"\) === "scene"/);
  assert.match(mainSource, /new SceneDebugEditor\(root\)\.mount\(\)/);
});

test("Scene Debug Editor exposes required authoring tools and actions", () => {
  for (const label of ["Scene Debug Editor", "+ Add Scene", "Landscape", "Portrait", "Select", "Spawn", "Collision", "Interaction", "Trigger", "Placement Slot", "Anchor", "Echo Anchor", "Preview", "Inspector", "Delete Selected", "Save Layout", "Copy JSON", "Download Backup JSON"]) {
    assert.match(editorSource, new RegExp(label.replace(/[+]/g, "\\+"), "i"));
  }
  assert.match(editorSource, /data-debug-field="scene"/);
  assert.match(editorSource, /data-debug-field="orientation"/);
  assert.match(editorSource, /data-debug-field="slot-kind"/);
  assert.match(editorSource, /Chapter Slot/);
  assert.match(editorSource, /Fragment Slot/);
  assert.match(editorSource, /Echo Anchor/);
  assert.match(editorSource, /data-debug-field="echo-key"/);
  assert.doesNotMatch(editorSource, /labisEchoes/);
  assert.doesNotMatch(editorSource, /sceneId === "labis"/);
});

test("debug save flow writes through localhost-only endpoints and never arbitrary paths", () => {
  assert.match(devServerSource, /\/__debug\/scene-layout/);
  assert.match(devServerSource, /\/__debug\/save-scene-layout/);
  assert.match(devServerSource, /\/__debug\/add-scene/);
  assert.match(devServerSource, /isLocalhost\(req\)/);
  assert.match(devServerSource, /sanitizeSceneId/);
  assert.match(devServerSource, /asset\.includes\("\.\."\)/);
  assert.match(devServerSource, /resolveSceneFile/);
  assert.match(devServerSource, /public\/scene-layouts/);
  assert.match(devServerSource, /placementSlots/);
  assert.match(devServerSource, /placementSlot\(value\)/);
});

test("debug saves update the scene-layout directory served first after refresh", () => {
  assert.match(devServerSource, /const servedSceneRoot = resolve\(root, "dist\/scene-layouts"\)/);
  assert.match(devServerSource, /for \(const base of \[sceneRoot, servedSceneRoot, distSceneRoot\]\)/);
  assert.match(devServerSource, /upsertManifestScene[\s\S]*servedSceneRoot/);
});

test("330 authored layouts retain every supplied backup anchor and echo anchor", () => {
  for (const orientation of ["landscape", "portrait"] as const) {
    const layout = JSON.parse(readFileSync(join("public/assets/330", `330-corridor-${orientation}.json`), "utf8"));
    const authored = JSON.parse(readFileSync(join("public/scene-layouts/330-corridor", `${orientation}.json`), "utf8"));
    assert.deepEqual(authored.anchors, layout.anchors, `${orientation} normal anchors`);
    assert.deepEqual(authored.echoAnchors, layout.echoAnchors, `${orientation} echo anchors`);
  }
});

test("saving portrait layout through runtime model does not mutate landscape", () => {
  const landscapeBefore = cloneSceneLayout(getSceneLayout("muji-room", "landscape"));
  const portrait = cloneSceneLayout(getSceneLayout("muji-room", "portrait"));
  const portraitBefore = cloneSceneLayout(portrait);
  portrait.spawn = { x: 111, y: 222 };
  portrait.obstacles = [{ x: 3, y: 4, w: 5, h: 6 }];
  try {
    setSceneLayout(portrait);
    assert.deepEqual(getSceneLayout("muji-room", "landscape"), landscapeBefore);
    assert.deepEqual(getSceneLayout("muji-room", "portrait").spawn, { x: 111, y: 222 });
  } finally {
    setSceneLayout(portraitBefore);
  }
});

test("runtime can load saved scene-layout JSON overrides after refresh", async () => {
  const originalFetch = globalThis.fetch;
  const portraitBefore = cloneSceneLayout(getSceneLayout("bakery", "portrait"));
  globalThis.fetch = (async (input: string | URL | Request) => {
    const url = String(input);
    if (url.includes("manifest.json")) {
      return new Response(JSON.stringify({ scenes: [{ id: "bakery", label: "Yumido Bakery" }] }), { status: 200 });
    }
    if (url.includes("bakery/portrait.json")) {
      const layout = cloneSceneLayout(getSceneLayout("bakery", "portrait"));
      layout.spawn = { x: 321, y: 654 };
      layout.interactions = [{ id: "friend-a", label: "Friend A", x: 100, y: 200, radius: 44 }];
      return new Response(JSON.stringify(layout), { status: 200 });
    }
    return new Response("Not found", { status: 404 });
  }) as typeof fetch;
  try {
    await loadSceneLayoutOverrides();
    assert.deepEqual(getSceneLayout("bakery", "portrait").spawn, { x: 321, y: 654 });
    assert.equal(getSceneLayout("bakery", "portrait").interactions[0].label, "Friend A");
  } finally {
    globalThis.fetch = originalFetch;
    setSceneLayout(portraitBefore);
  }
});

test("Labis motor cutscene uses orientation-aware anchors without duplicating the sequence", () => {
  assert.match(appSource, /labisMotorActionsForCurrentLayout/);
  assert.match(appSource, /motor-spawn/);
  assert.match(appSource, /ms-spawn/);
  assert.match(appSource, /motor-mid/);
  assert.match(appSource, /motor-end/);
  assert.doesNotMatch(appSource, /labisMotorPortraitMemoryActions/);
});

test("Labis echoes resolve through orientation-aware anchors for rendering and proximity", () => {
  assert.match(appSource, /resolveLabisEchoesForCurrentLayout/);
  assert.match(appSource, /availableLabisEchoAtPlayer[\s\S]*resolveLabisEchoesForCurrentLayout/);
  assert.match(appSource, /drawLabisMemoryTells[\s\S]*resolveLabisEchoesForCurrentLayout/);
  assert.match(appSource, /drawLabisEchoVisual[\s\S]*resolveLabisEchoForCurrentLayout/);
});
