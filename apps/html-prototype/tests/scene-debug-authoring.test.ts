import assert from "node:assert/strict";
import { test } from "node:test";
import { makeDefaultLayout } from "../src/systems/SceneLayouts.js";
import { applyAutoAuthorPlan, buildAutoAuthorPlan } from "../src/systems/SceneDebugAutoAuthor.js";
import { parseSceneAuthoringManifest, normalizedPointToScene, validateSceneAuthoringManifest } from "../src/systems/SceneDebugAuthoringManifest.js";
import { validateConstraints } from "../src/systems/SceneDebugConstraints.js";
import { SceneDebugEditor } from "../src/systems/SceneDebugEditor.js";
import { createPreviewState, type PreviewItem, type PreviewState } from "../src/systems/SceneDebugPreview.js";
import { centerPan, fitZoom, sceneToViewport, viewportToScene } from "../src/systems/SceneDebugViewport.js";

function rawManifest() {
  return {
    manifestVersion: 1,
    chapterId: "fixture-chapter",
    sceneId: "disposable-scene",
    label: "Disposable Scene",
    orientations: {
      landscape: {
        asset: "assets/fixture-scene.png",
        size: { w: 1000, h: 500 },
        spawn: { x: 0.25, y: 0.5 },
        obstacles: [{ id: "wall", x: 0.1, y: 0.1, w: 0.2, h: 0.1 }],
        interactions: [{ id: "door", label: "Door", x: 0.8, y: 0.5, radius: 40 }],
        anchors: { left: { x: 0.2, y: 0.4 }, right: { x: 0.7, y: 0.4 } },
        echoAnchors: { echo: { x: 0.5, y: 0.8, radius: 0.1 } },
        groups: [{ id: "actors", name: "Actors", members: ["anchor:left", "anchor:right"] }],
        previews: [{ id: "hero", name: "Hero", asset: "assets/hero.png", anchorId: "left", approval: { status: "canonical-candidate" } }],
        constraints: [
          { id: "left-right", type: "relative-x", left: "left", right: "right" },
          { id: "baseline", type: "shared-baseline", first: "left", second: "right", tolerancePx: 2 }
        ]
      }
    }
  };
}

test("manifest parser is pure and reports malformed JSON", () => {
  const result = parseSceneAuthoringManifest("{");
  assert.equal(result.value, null);
  assert.equal(result.errors.length, 1);
});

test("manifest v1 validates normalized geometry and warns that approval is ignored", () => {
  const result = validateSceneAuthoringManifest(rawManifest(), new Set(["assets/fixture-scene.png", "assets/hero.png"]));
  assert.equal(result.valid, true);
  assert.equal(result.manifest?.manifestVersion, 1);
  assert.equal(result.warnings.some((item) => item.message.includes("PREVIEW ONLY")), true);
});

test("manifest validation rejects unsafe assets, duplicates, and unresolved group members", () => {
  const invalid = rawManifest() as any;
  invalid.orientations.landscape.asset = "../secret.png";
  invalid.orientations.landscape.groups.push({ id: "actors", name: "Duplicate", members: ["anchor:missing"] });
  const result = validateSceneAuthoringManifest(invalid);
  assert.equal(result.valid, false);
  assert.equal(result.errors.some((item) => item.path.endsWith(".asset")), true);
  assert.equal(result.errors.some((item) => item.message.includes("Duplicate ID")), true);
  assert.equal(result.errors.some((item) => item.message.includes("Unknown point")), true);
});

test("normalized conversion is deterministic and does not mutate the manifest", () => {
  const point = { x: 0.25, y: 0.5 };
  assert.deepEqual(normalizedPointToScene(point, { w: 1000, h: 500 }), { x: 250, y: 250 });
  assert.deepEqual(point, { x: 0.25, y: 0.5 });
});

test("Auto Author produces runtime fields plus editor-only review metadata", () => {
  const validated = validateSceneAuthoringManifest(rawManifest()).manifest;
  assert.ok(validated);
  const existing = makeDefaultLayout("disposable-scene", "Existing", "landscape");
  const plan = buildAutoAuthorPlan(validated, "landscape", existing, {
    existingLayoutDetected: true,
    assetPaths: new Set(["assets/fixture-scene.png"])
  });
  assert.equal(plan.candidate.spawn.x, 250);
  assert.equal(plan.candidate.anchors.left.x, 200);
  assert.equal(plan.collisionReviews[0].status, "draft-review-required");
  assert.equal(plan.previews[0].status, "missing-asset");
  assert.deepEqual(Object.keys(plan.candidate).sort(), ["anchors", "asset", "echoAnchors", "interactions", "label", "obstacles", "orientation", "placementSlots", "sceneId", "size", "spawn", "triggers"]);
  assert.equal(plan.groups[0].members[0], "anchor:left");
});

test("Auto Author plan preserves manifest preview transform fields", () => {
  const raw = rawManifest() as any;
  raw.orientations.landscape.previews[0] = {
    ...raw.orientations.landscape.previews[0],
    kind: "pair",
    scale: 0.3,
    flip: true,
    offsetX: 12,
    offsetY: -7,
    opacity: 0.45,
    z: 6
  };
  const validated = validateSceneAuthoringManifest(raw).manifest;
  assert.ok(validated);

  const plan = buildAutoAuthorPlan(validated, "landscape", makeDefaultLayout("disposable-scene", "Existing", "landscape"));

  assert.deepEqual(plan.previews[0], {
    id: "hero",
    name: "Hero",
    asset: "assets/hero.png",
    status: "preview-only",
    anchorId: "left",
    kind: "pair",
    scale: 0.3,
    flip: true,
    offsetX: 12,
    offsetY: -7,
    opacity: 0.45,
    z: 6
  });
});

test("applying an Auto Author preview plan creates transformed items and keeps omitted defaults", () => {
  const raw = rawManifest() as any;
  raw.orientations.landscape.previews = [
    {
      id: "transformed",
      name: "Transformed",
      asset: "assets/hero.png",
      anchorId: "left",
      scale: 0.3,
      flip: true,
      offsetX: 12,
      offsetY: -7,
      opacity: 0.45,
      z: 6
    },
    { id: "defaults", name: "Defaults", asset: "assets/hero.png", anchorId: "right" }
  ];
  const validated = validateSceneAuthoringManifest(raw).manifest;
  assert.ok(validated);
  const plan = buildAutoAuthorPlan(validated, "landscape", makeDefaultLayout("disposable-scene", "Existing", "landscape"));
  const editor = new SceneDebugEditor({} as HTMLElement) as unknown as {
    autoAuthorPlan: typeof plan;
    previewState: PreviewState;
    importAutoAuthorPreviews(): void;
  };
  editor.autoAuthorPlan = plan;
  editor.previewState = createPreviewState("disposable-scene", "landscape");

  editor.importAutoAuthorPreviews();

  assert.deepEqual(
    editor.previewState.items.map(({ scale, flip, offsetX, offsetY, opacity, z }) => ({ scale, flip, offsetX, offsetY, opacity, z })),
    [
      { scale: 0.3, flip: true, offsetX: 12, offsetY: -7, opacity: 0.45, z: 6 },
      { scale: 1, flip: false, offsetX: 0, offsetY: 0, opacity: 1, z: 0 }
    ]
  );
});

test("preview scale does not alter its resolved anchor position", () => {
  const raw = rawManifest() as any;
  raw.orientations.landscape.previews[0].scale = 0.3;
  const validated = validateSceneAuthoringManifest(raw).manifest;
  assert.ok(validated);
  const existing = makeDefaultLayout("disposable-scene", "Existing", "landscape");
  const plan = buildAutoAuthorPlan(validated, "landscape", existing);
  const applied = applyAutoAuthorPlan(plan, "replace-existing", existing);
  const editor = new SceneDebugEditor({} as HTMLElement) as unknown as {
    autoAuthorPlan: typeof plan;
    layout: typeof applied.layout;
    previewState: PreviewState;
    importAutoAuthorPreviews(): void;
    previewAnchorPoint(item: PreviewItem): { x: number; y: number };
  };
  editor.autoAuthorPlan = plan;
  editor.layout = applied.layout;
  editor.previewState = createPreviewState("disposable-scene", "landscape");
  editor.importAutoAuthorPreviews();
  const preview = editor.previewState.items[0];

  const atManifestScale = editor.previewAnchorPoint(preview);
  const atDifferentScale = editor.previewAnchorPoint({ ...preview, scale: 4 });

  assert.equal(preview.scale, 0.3);
  assert.deepEqual(atManifestScale, { x: 200, y: 200 });
  assert.deepEqual(atDifferentScale, atManifestScale);
  assert.deepEqual(applied.layout.anchors.left, { x: 200, y: 200 });
});

test("Auto Author requires explicit replacement choice and can preserve existing layout", () => {
  const validated = validateSceneAuthoringManifest(rawManifest()).manifest;
  assert.ok(validated);
  const existing = makeDefaultLayout("disposable-scene", "Existing", "landscape");
  existing.anchors.keep = { x: 11, y: 22 };
  const plan = buildAutoAuthorPlan(validated, "landscape", existing, { existingLayoutDetected: true });
  assert.throws(() => applyAutoAuthorPlan(plan, "new", existing), /explicitly/);
  const preserved = applyAutoAuthorPlan(plan, "preserve-existing", existing);
  assert.deepEqual(preserved.layout.anchors, { keep: { x: 11, y: 22 } });
  assert.notEqual(preserved.layout, existing);
});

test("constraints report pass/fail/warning without moving points", () => {
  const layout = makeDefaultLayout("fixture", "Fixture", "landscape");
  layout.anchors.left = { x: 10, y: 20 };
  layout.anchors.right = { x: 30, y: 20 };
  const before = JSON.stringify(layout);
  const results = validateConstraints(layout, [
    { id: "x", type: "relative-x", left: "left", right: "right" },
    { id: "baseline", type: "shared-baseline", first: "left", second: "right", tolerancePx: 1 },
    { id: "missing", type: "relative-y", above: "left", below: "unknown" }
  ]);
  assert.deepEqual(results.map((item) => item.status), ["pass", "pass", "warning"]);
  assert.equal(JSON.stringify(layout), before);
});

test("viewport zoom round-trips coordinates and never changes scene coordinates", () => {
  const transform = { zoom: 2, panX: 30, panY: -10 };
  const source = { x: 125, y: 80 };
  assert.deepEqual(viewportToScene(sceneToViewport(source, transform), transform), source);
  assert.equal(fitZoom({ w: 1000, h: 500 }, { w: 600, h: 400 }, 20), 0.56);
  assert.deepEqual(centerPan({ w: 1000, h: 500 }, { w: 600, h: 400 }, 0.5), { x: 50, y: 75 });
});


