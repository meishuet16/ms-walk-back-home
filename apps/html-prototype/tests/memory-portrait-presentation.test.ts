import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { CutsceneSystem, type CutsceneAction } from "../src/systems/CutsceneSystem.js";
import {
  renderMemoryDialogue,
  renderMemoryPortrait,
  resolveMemoryPortraitLayout
} from "../src/systems/MemoryPortraitPresentation.js";
import { renderRpgDialogue } from "../src/systems/PresentationRenderer.js";

const appSource = readFileSync("src/app.ts", "utf8");
const echoSource = readFileSync("src/systems/EchoPortraitPresentation.ts", "utf8");
const cutsceneSource = readFileSync("src/systems/CutsceneSystem.ts", "utf8");

test("generic Memory Portrait resolves string and config portraits from viewport space", () => {
  const portrait = resolveMemoryPortraitLayout("assets/example/et-questioning.png", {
    orientation: "portrait",
    width: 390,
    height: 844
  });
  const landscape = resolveMemoryPortraitLayout({
    src: "assets/example/et-questioning.png",
    width: 220,
    height: 180,
    offsetX: 4
  }, {
    orientation: "landscape",
    width: 1280,
    height: 720
  });

  assert.deepEqual(portrait.portrait, { src: "assets/example/et-questioning.png" });
  assert.equal(portrait.fit, "contain");
  assert.equal(portrait.position, "center-top");
  assert.notEqual(portrait.width, landscape.width);
  assert.equal(landscape.portrait.offsetX, 4);
  assert.equal(landscape.width, 220);
  assert.equal(landscape.height, 180);
  assert.equal("x" in portrait, false);
  assert.equal("y" in portrait, false);
  assert.equal("anchor" in portrait, false);
  assert.equal("visualScale" in portrait, false);
});

test("generic Memory Portrait renders actual presentation markup without world coordinates", () => {
  const layout = resolveMemoryPortraitLayout("assets/example/et-questioning.png", {
    orientation: "landscape",
    width: 1280,
    height: 720
  });
  const markup = renderMemoryPortrait({
    portrait: "assets/example/et-questioning.png",
    speaker: "<ET>",
    text: "look <here>",
    layout,
    canAdvance: true,
    action: "authored-dialogue-next"
  });

  assert.match(markup, /data-presentation="memory-portrait"/);
  assert.match(markup, /class="[^"]*memory-portrait/);
  assert.match(markup, /src="assets\/example\/et-questioning\.png"/);
  assert.match(markup, /&lt;ET&gt;/);
  assert.match(markup, /look &lt;here&gt;/);
  assert.match(markup, /data-action="authored-dialogue-next"/);
  assert.match(markup, /object-fit:contain/);
  assert.doesNotMatch(markup, /SceneLayout|worldX|worldY|anchor|visualScale|\bx=|\by=/);
});

test("authored dialogue uses exact RPG_BOTTOM fallback and generic portrait rendering", () => {
  const viewport = { orientation: "portrait" as const, width: 390, height: 844 };
  const plain = renderMemoryDialogue({
    speaker: "Memory",
    text: "ordinary line",
    viewport,
    action: "authored-dialogue-next"
  });
  const before = renderRpgDialogue({ speaker: "Memory", text: "ordinary line", action: "authored-dialogue-next" });
  assert.equal(plain, before);

  const portrait = renderMemoryDialogue({
    speaker: "ET",
    text: "portrait line",
    portrait: { src: "assets/example/et-questioning.png", width: 190 },
    viewport,
    action: "authored-dialogue-next"
  });
  assert.match(portrait, /data-presentation="memory-portrait"/);
  assert.match(portrait, /max-width:190px/);
  assert.match(portrait, /data-action="authored-dialogue-next"/);
  assert.doesNotMatch(portrait, /class="rpg-dialogue"/);
});

test("portrait metadata stays in the existing CutsceneDialogue portrait field", () => {
  assert.match(cutsceneSource, /portrait\?: DialoguePortrait/);
  assert.doesNotMatch(cutsceneSource, /memoryPortrait\?/);

  const actions: CutsceneAction[] = [
    { type: "spawn", actor: "et", kind: "human", x: 42, y: 84, visualScale: 0.3 },
    { type: "dialogue", speaker: "ET", text: "portrait", portrait: "assets/example/et-questioning.png" }
  ];
  const cutscene = new CutsceneSystem(actions);
  cutscene.update(0);
  cutscene.update(0);
  assert.deepEqual(cutscene.actors.get("et"), {
    id: "et",
    x: 42,
    y: 84,
    facing: "right",
    expression: undefined,
    visible: true,
    kind: "human",
    color: undefined,
    sprite: undefined,
    opacity: 1,
    visualScale: 0.3,
    label: undefined
  });
  assert.equal(cutscene.currentDialogue?.portrait, "assets/example/et-questioning.png");
});

test("authored dialogue is wired to the shared presentation and existing lifecycle", () => {
  assert.match(appSource, /renderMemoryDialogue/);
  assert.match(appSource, /authored-dialogue-next/);
  assert.match(appSource, /private advanceAuthoredDialogue/);
  assert.match(appSource, /this\.overlay\.innerHTML = ""/);
  assert.match(appSource, /finishAuthoredCutscene[\s\S]*this\.overlay\.innerHTML = ""/);
  assert.doesNotMatch(appSource, /authoredOverlayMode = "memory-portrait"/);
});

test("Echo compatibility wrapper delegates to the generic Memory Portrait renderer", () => {
  assert.match(echoSource, /renderMemoryPortrait/);
  assert.match(echoSource, /resolveMemoryPortraitLayout/);
  assert.doesNotMatch(echoSource, /return .*echo-portrait/);
});