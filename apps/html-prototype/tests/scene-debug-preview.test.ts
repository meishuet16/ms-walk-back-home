import assert from "node:assert/strict";
import { test } from "node:test";
import {
  addPreviewItem,
  approveCanonicalCandidate,
  copyAllApprovedMappings,
  copyImplementationHandoff,
  createPreviewItem,
  createPreviewState,
  updatePreviewAsset,
  validateProjectAssetPath
} from "../src/systems/SceneDebugPreview.js";

test("project preview paths are restricted to public assets", () => {
  assert.equal(validateProjectAssetPath("assets/405/ruffle/06.png"), "assets/405/ruffle/06.png");
  assert.throws(() => validateProjectAssetPath("../secret.png"));
  assert.throws(() => validateProjectAssetPath("/absolute.png"));
  assert.throws(() => validateProjectAssetPath("https://example.com/a.png"));
});

test("preview items support bound, free, and visual authoring properties", () => {
  const state = addPreviewItem(createPreviewState("406", "landscape"), createPreviewItem({
    name: "spray",
    projectPath: "assets/405/ruffle/06.png",
    anchorId: "et-ruffle-contact"
  }));
  const item = state.items[0];
  assert.equal(item.anchorId, "et-ruffle-contact");
  assert.equal(item.freePosition, false);
  assert.equal(item.scale, 1);
  assert.equal(item.visible, true);
  assert.equal(JSON.stringify(item).includes("SceneLayout"), false);
});

test("approval is orientation-specific and resets when the asset changes", () => {
  const state = addPreviewItem(createPreviewState("406", "landscape"), createPreviewItem({ name: "contact", projectPath: "assets/405/contact.png", anchorId: "et-contact" }));
  const approved = approveCanonicalCandidate(state, state.items[0].id);
  assert.equal(approved.items[0].approval?.orientation, "landscape");
  assert.equal(approved.items[0].approval?.status, "canonical-candidate");
  const changed = updatePreviewAsset(approved, state.items[0].id, { projectPath: "assets/405/contact-2.png" });
  assert.equal(changed.items[0].approval, undefined);
});

test("local previews cannot be approved as canonical candidates", () => {
  const state = addPreviewItem(createPreviewState("406", "portrait"), createPreviewItem({ name: "local", localUrl: "blob:test" }));
  assert.throws(() => approveCanonicalCandidate(state, state.items[0].id), /project-relative/);
});

test("copy mapping includes exact path, anchor, transform, and orientation", () => {
  let state = addPreviewItem(createPreviewState("406", "portrait"), createPreviewItem({ name: "car", projectPath: "assets/406/prop/car.png", anchorId: "vehicle-arrival", scale: 1.4, flip: true, offsetX: 3, offsetY: -2 }));
  state = approveCanonicalCandidate(state, state.items[0].id);
  const text = copyAllApprovedMappings(state);
  assert.match(text, /406 portrait/);
  assert.match(text, /assets\/406\/prop\/car\.png/);
  assert.match(text, /vehicle-arrival/);
  assert.match(text, /scale: 1\.4/);
  assert.match(text, /flip: true/);
});

test("handoff explicitly separates preview from runtime implementation", () => {
  let state = addPreviewItem(createPreviewState("406", "landscape"), createPreviewItem({ name: "car", projectPath: "assets/406/car.png", anchorId: "arrival" }));
  state = approveCanonicalCandidate(state, state.items[0].id);
  const handoff = copyImplementationHandoff(state);
  assert.match(handoff, /user-approved canonical runtime candidates/);
  assert.match(handoff, /SceneLayout anchor coordinates should be preserved/);
  assert.match(handoff, /must not silently substitute/);
});

