import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  normalizeLocalAssetPath,
  renderDialoguePortrait,
  renderReflection,
  renderReflectionChoice,
  renderRpgDialogue,
  renderVnDialogue
} from "../src/systems/PresentationRenderer.js";
import { CutsceneSystem } from "../src/systems/CutsceneSystem.js";
import type { DialogueNode } from "../src/types.js";

const appSource = readFileSync("src/app.ts", "utf8");
const stylesSource = readFileSync("src/styles.css", "utf8");
const rendererSource = readFileSync("src/systems/PresentationRenderer.ts", "utf8");
const march30Source = readFileSync("src/fixtures/march30Memory.ts", "utf8");

test("normalizes supported local asset paths", () => {
  assert.equal(normalizeLocalAssetPath("assets/330/example.png"), "assets/330/example.png");
  assert.equal(normalizeLocalAssetPath("/assets/330/example.png"), "assets/330/example.png");
});

test("rejects unsafe local asset paths", () => {
  for (const path of [
    "../secret.png",
    "assets/../secret.png",
    "D:\\private\\secret.png",
    "http://example.com/a.png",
    "https://example.com/a.png",
    "//example.com/a.png",
    "data:image/png;base64,abc",
    "javascript:alert(1)",
    "assets\\330\\example.png"
  ]) {
    assert.equal(normalizeLocalAssetPath(path), null, path);
  }
});

test("renders an empty portrait when a direct local image path is invalid", () => {
  assert.equal(renderDialoguePortrait({ kind: "image", config: { src: "https://example.com/a.png" } }), "");
});

test("renders direct portraits with preferred size and portrait-local offsets", () => {
  const markup = renderDialoguePortrait({
    kind: "image",
    config: { src: "assets/330/water-gun.png", height: 180, offsetX: 4, offsetY: 10 }
  });

  assert.match(markup, /src="assets\/330\/water-gun\.png"/);
  assert.match(markup, /max-height:180px/);
  assert.match(markup, /transform:translate\(4px, 10px\)/);
  assert.doesNotMatch(markup, /width:180px/);
});

test("renders width-only portraits without forcing a height", () => {
  const markup = renderDialoguePortrait({ kind: "image", config: { src: "/assets/july20/object.png", width: 160 } });

  assert.match(markup, /src="assets\/july20\/object\.png"/);
  assert.match(markup, /max-width:160px/);
  assert.doesNotMatch(markup, /height:160px/);
});

test("cutscene dialogue accepts a future generic local portrait config", () => {
  const cutscene = new CutsceneSystem([{
    type: "dialogue",
    speaker: "Memory",
    text: "A future object",
    portrait: { src: "assets/labis/example.png", height: 180, offsetY: 10 }
  }]);

  cutscene.update(0);
  assert.deepEqual(cutscene.currentDialogue?.portrait, { src: "assets/labis/example.png", height: 180, offsetY: 10 });
});

test("shared DialogueNode accepts Bakery and future generic portrait configs", () => {
  const node: DialogueNode = {
    id: "generic-portrait",
    speaker: "Memory",
    text: "A future object",
    portrait: { src: "assets/bakery/example.png", height: 180, offsetX: 2 }
  };

  assert.deepEqual(node.portrait, { src: "assets/bakery/example.png", height: 180, offsetX: 2 });
});

test("renders shared VN, RPG, reflection-choice, and reflection roles", () => {
  assert.match(renderVnDialogue({ speaker: "MS", text: "hello", portrait: { kind: "empty" }, actions: "<button>Continue</button>" }), /class="vn"/);
  assert.match(renderRpgDialogue({ speaker: "Memory", text: "walk beside it", action: "next" }), /class="rpg-dialogue"/);
  assert.match(renderReflectionChoice({ prompt: "How will you remember it?", choices: [{ id: "one", label: "This way" }] }), /class="reflection-choice-ui"/);
  assert.match(renderReflection({ lines: ["A quiet afterimage."], actions: "<button>Close</button>" }), /class="reflection"/);
});

test("shared reflection choices do not add an implicit repeated subtitle", () => {
  const markup = renderReflectionChoice({ prompt: "How will you remember it?", choices: [{ id: "one", label: "This way" }] });
  assert.equal(markup.includes(">reflection</i>"), false);
  assert.equal(markup.includes(">reflection</small>"), false);
});

test("all existing VN paths use the shared VN renderer", () => {
  assert.match(appSource, /renderVnDialogue/);
  assert.match(appSource, /showMarch30Dialogue[\s\S]*renderVnDialogue/);
  assert.match(appSource, /showLabisCutsceneDialogue[\s\S]*renderVnDialogue/);
  assert.match(appSource, /private showDialogue[\s\S]*renderVnDialogue/);
});

test("shared RPG and reflection roles are used without Labis-owned markup", () => {
  assert.match(appSource, /renderRpgDialogue/);
  assert.match(appSource, /renderReflectionChoice/);
  assert.match(appSource, /renderReflection/);
  assert.doesNotMatch(rendererSource, /March30|march30|waterGun|keychains/);
});

test("lightweight roles use stage-relative control-aware placement while VN stays centered", () => {
  assert.match(stylesSource, /\.reflection-choice-ui[\s\S]*align-self:\s*end/);
  assert.match(stylesSource, /\.reflection[\s\S]*align-self:\s*end/);
  assert.match(stylesSource, /\.rpg-dialogue[\s\S]*align-self:\s*end/);
  assert.match(stylesSource, /safe-area-inset-bottom/);
  assert.match(stylesSource, /overlay-open:has\(\.overlay\.lightweight-presentation\)[\s\S]*display:\s*flex/);
  assert.match(stylesSource, /#app\[data-orientation="portrait"\] \.overlay > \.vn[\s\S]*align-self:\s*center/);
});

test("the existing March 30 authored jacket-wipe offset remains untouched", () => {
  assert.match(march30Source, /ms-jacket-wipe-target[\s\S]*offset: \{ x: 78, y: 0 \}/);
});
