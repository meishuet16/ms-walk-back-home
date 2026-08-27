import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import * as april06Fixture from "../src/fixtures/april06Chapter.js";
import { april06Assets, april06EchoActions, april06MainMemoryActions, resolveApril06Actions } from "../src/fixtures/april06Chapter.js";
import { CutsceneSystem, type CutsceneAction } from "../src/systems/CutsceneSystem.js";
import type { SceneLayout } from "../src/systems/SceneLayouts.js";
import { resolveSceneAssetPath, resolveSceneEchoAnchor } from "../src/systems/SceneLayouts.js";
import { authoredContentExpectations } from "../src/fixtures/generated/authoredContentExpectations.js";

test("April 6 legacy and authored background paths resolve to the committed scene assets", () => {
  for (const orientation of ["landscape", "portrait"] as const) {
    const authored = JSON.parse(readFileSync(join("public", "scene-layouts", "406", `${orientation}.json`), "utf8")) as SceneLayout;
    const expected = `assets/406/406-${orientation}.png`;
    const legacy = { ...authored, asset: `assets/scenes/406-${orientation}.png` };
    assert.equal(resolveSceneAssetPath(legacy), expected);
    assert.equal(resolveSceneAssetPath(authored), expected);
    assert.equal(existsSync(join("public", expected)), true);
  }
});

test("April 6 resolves one semantic water-gun echo anchor per orientation without mutating authored keys", () => {
  const landscape: SceneLayout = {
    sceneId: "406", label: "April 6", orientation: "landscape", asset: "assets/406/406-landscape.png",
    size: { w: 1672, h: 941 }, spawn: { x: 0, y: 0 }, obstacles: [], interactions: [], triggers: [],
    placementSlots: [], echoAnchors: { "watergun-crossing": { x: 10, y: 20, radius: 56 } }, anchors: {}
  };
  const portrait: SceneLayout = {
    ...landscape, orientation: "portrait", asset: "assets/406/406-portrait.png", size: { w: 941, h: 1672 },
    echoAnchors: { "r-watergun-crossing": { x: 30, y: 40, radius: 90 } }
  };
  assert.deepEqual(resolveSceneEchoAnchor(landscape, "watergun-crossing"), { x: 10, y: 20, radius: 56 });
  assert.deepEqual(resolveSceneEchoAnchor(portrait, "watergun-crossing"), { x: 30, y: 40, radius: 90 });
  assert.equal(resolveSceneEchoAnchor(landscape, "unknown-echo"), null);
  assert.deepEqual(Object.keys(portrait.echoAnchors), ["r-watergun-crossing"]);
});

test("generic cutscene pauses at a checkpoint before the next action", () => {
  const cutscene = new CutsceneSystem([
    { type: "dialogue", speaker: "MS", text: "first" },
    { type: "checkpoint", id: "reflection-1" },
    { type: "dialogue", speaker: "MS", text: "second" }
  ]);
  cutscene.update(0);
  assert.equal(cutscene.currentDialogue?.text, "first");
  cutscene.advanceDialogue();
  cutscene.update(0);
  assert.equal(cutscene.currentCheckpoint, "reflection-1");
  cutscene.update(0);
  assert.equal(cutscene.currentCheckpoint, "reflection-1");
  cutscene.resolveCheckpoint();
  cutscene.update(0);
  assert.equal(cutscene.currentDialogue?.text, "second");
});

test("April 6 asset metadata stays local and uses the approved 406 props", () => {
  const paths = Object.values(april06Assets).map((asset) => asset.path);
  assert.equal(april06Assets.mcd.path, "assets/406/mcd.png");
  assert.equal(april06Assets.alza.path, "assets/406/prop/vehicle-406-arrival.png");
  assert.equal(april06Assets.headlights.path, "assets/406/prop/vfx-406-vehicle-headlights.png");
  assert.equal(paths.every((path) => path.startsWith("assets/")), true);
  assert.deepEqual(april06Assets.mcd.source, { x: 0, y: 0, w: 1536, h: 1024 });
  assert.deepEqual(april06Assets.mcd.visibleBounds, { x: 65, y: 38, w: 1273, h: 968 });
  assert.deepEqual(april06Assets.alza.source, { x: 0, y: 0, w: 2172, h: 724 });
  assert.deepEqual(april06Assets.headlights.source, { x: 0, y: 0, w: 1767, h: 890 });
});

test("the generic cutscene keeps one world MCD prop without actor ownership", () => {
  const cutscene = new CutsceneSystem([
    { type: "prop", id: "mcd", assetId: "mcd", position: { x: 10, y: 20 }, visible: true },
    { type: "prop", id: "mcd", assetId: "mcd", position: { x: 10, y: 20 }, visible: false }
  ]);
  cutscene.update(0);
  cutscene.update(0);
  assert.equal(cutscene.props.size, 1);
  assert.deepEqual(cutscene.props.get("mcd"), {
    id: "mcd", assetId: "mcd", position: { x: 10, y: 20 }, visible: false
  });
});
test("April 6 main memory keeps the authored anchors and canonical dialogue contract", () => {
  const anchorKeys = new Set(april06MainMemoryActions.flatMap((action) => ("position" in action && action.position) ? [action.position.anchor] : []));
  for (const key of [
    "ms-drop-start", "mcd-drop-point", "ms-escape-turn", "ms-roadside-stop",
    "et-lobby-spawn", "et-catch-position", "et-mcd-pickup", "ms-chat-position",
    "et-chat-position", "car-return-edge", "ms-exit-pickup"
  ] as const) assert.equal(anchorKeys.has(key), true);
  const dialogue = april06MainMemoryActions.filter((action) => action.type === "dialogue").map((action) => action.text);
  assert.deepEqual(dialogue, authoredContentExpectations.chapters.april06.dialogue.map((line) => line.text));
});

test("April 6 echo uses one semantic alias and no physical water-gun prop", () => {
  const semanticAnchors = new Set(april06EchoActions.flatMap((action) => ("position" in action && action.position) ? [action.position.anchor] : []));
  assert.deepEqual([...semanticAnchors], ["watergun-crossing"]);
  assert.equal(april06EchoActions.some((action) => action.type === "prop"), false);
});

test("generic cutscene move actions preserve their authored facing", () => {
  const cutscene = new CutsceneSystem([
    { type: "spawn", actor: "ms", kind: "human", x: 0, y: 0, facing: "right" },
    { type: "move", actor: "ms", x: 10, y: 0, duration: 0, facing: "left" }
  ]);
  cutscene.update(0);
  cutscene.update(0);
  assert.equal(cutscene.actors.get("ms")?.facing, "left");
});

const visualResolver = (april06Fixture as unknown as { resolveApril06Visual?: (beat: string) => { path: string } }).resolveApril06Visual;
const echoBeats = (april06Fixture as unknown as { april06EchoBeats?: Array<{ id: string; ms: string; et: string }> }).april06EchoBeats;

function fixtureLayout(): SceneLayout {
  const keys = ["ms-drop-start", "mcd-drop-point", "ms-escape-turn", "ms-roadside-stop", "et-lobby-spawn", "et-catch-position", "et-mcd-pickup", "ms-chat-position", "et-chat-position", "car-return-edge", "ms-exit-pickup"];
  const anchors = Object.fromEntries(keys.map((key, index) => [key, { x: 100 + index * 40, y: 300 + index * 3 }]));
  return {
    sceneId: "406", label: "April 6", orientation: "landscape", asset: "assets/406/406-landscape.png",
    size: { w: 1672, h: 941 }, spawn: { x: 0, y: 0 }, obstacles: [], interactions: [], triggers: [],
    placementSlots: [], echoAnchors: { "watergun-crossing": { x: 900, y: 500, radius: 56 } }, anchors
  };
}

function assertSubsequence(actual: string[], expected: string[]): void {
  let cursor = 0;
  for (const value of expected) {
    const index = actual.indexOf(value, cursor);
    assert.notEqual(index, -1, "missing expected visual " + value);
    cursor = index + 1;
  }
}

function advanceUntilDialogue(text: string): CutsceneSystem {
  const cutscene = new CutsceneSystem(resolveApril06Actions(fixtureLayout(), april06MainMemoryActions));
  for (let step = 0; step < 1600; step += 1) {
    cutscene.update(0.25);
    if (cutscene.currentDialogue?.text === text) return cutscene;
    if (cutscene.currentDialogue) cutscene.advanceDialogue();
    if (cutscene.currentCheckpoint) cutscene.resolveCheckpoint();
  }
  throw new Error("dialogue not reached: " + text);
}

test("April 6 semantic beats resolve to exact approved files", () => {
  const expected: Record<string, string> = {
    "ms-place-mcd": "assets/406/406-mcd-drop/406-mcd-drop-put.png",
    "ms-photo-mcd": "assets/406/406-mcd-drop/406-mcd-drop-took-photo.png",
    "ms-empty-car": "assets/406/406-caught/406-caught-abrupt stop.png",
    "et-notice-ms": "assets/406/406-catch/406-catch-notice.png",
    "et-eat-fry": "assets/406/406-eat/406-eat-eat fry.png",
    "et-goodbye": "assets/406/406-eat/406-eat-small goodbye gesture..png",
    "morning-ms-counter": "assets/406/406-morning/fake-watergun/fake-watergun-aim.png",
    "morning-et-dodge": "assets/406/406-morning/water-gun/406-water-gun-dodge.png",
    "alza-enter-initial": "assets/406/prop/vehicle-406-arrival-4.png",
    "alza-enter-final": "assets/406/prop/vehicle-406-arrival-1.png"
  };
  for (const [beat, assetPath] of Object.entries(expected)) assert.equal(visualResolver?.(beat)?.path, assetPath, beat);
});

test("April 6 main runtime consumes the required visual beats in order", () => {
  const actions = resolveApril06Actions(fixtureLayout(), april06MainMemoryActions);
  const pathsFor = (actor: string) => actions.flatMap((action) => {
    if (action.type === "spawn" && action.actor === actor && action.sprite) return [april06Assets[action.sprite.assetId as keyof typeof april06Assets]?.path ?? action.sprite.assetId];
    if (action.type === "move" && action.actor === actor && action.sprite) return [april06Assets[action.sprite.assetId as keyof typeof april06Assets]?.path ?? action.sprite.assetId];
    if (action.type === "sprite" && action.actor === actor) return [april06Assets[action.sprite.assetId as keyof typeof april06Assets]?.path ?? action.sprite.assetId];
    return [];
  });
  assertSubsequence(pathsFor("ms"), [
    "assets/406/406-mcd-drop/406-mcd-drop-put.png",
    "assets/406/406-mcd-drop/406-mcd-drop-took-photo.png",
    "assets/406/406-caught/406-caught-abrupt stop.png",
    "assets/406/406-caught/406-caught-look toward lobby.png",
    "assets/406/406-caught/406-caught-conversational idle A.png",
    "assets/406/406-caught/406-caught-turn.png"
  ]);
  assertSubsequence(pathsFor("et"), [
    "assets/406/406-catch/406-catch-notice.png",
    "assets/406/406-catch/406-catch-small amused reaction.png",
    "assets/406/406-catch/406-catch-conversational posture.png",
    "assets/406/406-eat/406-eat-eat fry.png",
    "assets/406/406-eat/406-eat-talk.png",
    "assets/406/406-eat/406-eat-glance.png",
    "assets/406/406-eat/406-eat-small goodbye gesture..png"
  ]);
  const alzaPaths = actions.flatMap((action) => action.type === "spawn" && action.actor === "alza" && action.sprite ? [april06Assets[action.sprite.assetId as keyof typeof april06Assets]?.path] : action.type === "sprite" && action.actor === "alza" ? [april06Assets[action.sprite.assetId as keyof typeof april06Assets]?.path] : []);
  assert.deepEqual(alzaPaths, [
    "assets/406/prop/vehicle-406-arrival-4.png",
    "assets/406/prop/vehicle-406-arrival-3.png",
    "assets/406/prop/vehicle-406-arrival-2.png",
    "assets/406/prop/vehicle-406-arrival-1.png"
  ]);
});

test("April 6 standalone MCD remains a world-only single prop", () => {
  const props = april06MainMemoryActions.filter((action) => action.type === "prop");
  assert.equal(props.every((action) => action.owner === undefined), true);
  assert.equal(props.some((action) => action.visible === false), true);
});

test("April 6 canonical dialogue keeps the required speaker assignments", () => {
  const dialogueActions = april06MainMemoryActions.filter((action): action is Extract<typeof april06MainMemoryActions[number], { type: "dialogue" }> => action.type === "dialogue");
  assert.deepEqual(dialogueActions.map((action) => action.speaker), ["MS", "MS", "MS", "MS", "ET", "MS", "ET", "ET", "MS", "ET", "ET", "MS", "MS", "MS", "ET", "ET", "MS", "ET", "ET", "MS", "ET", "MS", "ET", "MS", "ET", "ET", "MS"]);
  assert.deepEqual(dialogueActions.map((action) => action.text), authoredContentExpectations.chapters.april06.dialogue.map((line) => line.text));
  assert.deepEqual(dialogueActions.slice(-2).map((action) => action.speaker), ["ET", "MS"]);
});

test("April 6 chat actors consume distinct authored anchors", () => {
  const layout = fixtureLayout();
  const actions = resolveApril06Actions(layout, april06MainMemoryActions);
  const ms = actions.find((action) => action.type === "spawn" && action.actor === "ms" && action.x === layout.anchors["ms-chat-position"].x);
  const et = actions.find((action) => action.type === "move" && action.actor === "et" && action.x === layout.anchors["et-chat-position"].x);
  assert.equal(ms?.type, "spawn");
  assert.equal(et?.type, "move");
  assert.notEqual((ms as { x: number }).x, (et as { x: number }).x);
});

test("April 6 echo is synchronized dedicated PNG beats without physical props", () => {
  assert.deepEqual(echoBeats?.map((beat) => [beat.id, beat.ms, beat.et]), [
    ["morning-approach", "morning-ms-walking", "morning-et-walking"],
    ["morning-recognition", "morning-ms-notice", "morning-et-notice"],
    ["morning-joke-start", "morning-ms-see", "morning-et-raise-hand"],
    ["morning-spray", "morning-ms-pocket", "morning-et-spray"],
    ["morning-counter-prep", "morning-ms-pocket-draw", "morning-et-hold"],
    ["morning-counter", "morning-ms-counter", "morning-et-dodge"],
    ["morning-laugh", "morning-ms-laugh", "morning-et-amused-recovery"],
    ["morning-pass", "morning-ms-walk", "morning-et-continue-walking"]
  ]);
  assert.equal(april06EchoActions.some((action) => action.type === "prop"), false);
});

test("April 6 morning uses authoritative opposing starts, facing, and exact paired beat choreography", () => {
  const starts = april06EchoActions.filter((action) => action.type === "spawn");
  const msStart = starts.find((action) => action.actor === "ms");
  const etStart = starts.find((action) => action.actor === "et");
  assert.equal(msStart?.position.offset?.x, 96);
  assert.equal(etStart?.position.offset?.x, -96);
  assert.equal(msStart?.facing, "left");
  assert.equal(etStart?.facing, "right");

  for (const asset of [
    april06Assets.morningMsWalking, april06Assets.morningMsNotice, april06Assets.morningMsSee,
    april06Assets.morningMsPocket, april06Assets.morningMsPocketDraw, april06Assets.morningMsCounter,
    april06Assets.morningMsLaugh, april06Assets.morningMsWalk, april06Assets.morningEtWalking,
    april06Assets.morningEtNotice, april06Assets.morningEtRaiseHand, april06Assets.morningEtSpray,
    april06Assets.morningEtHold, april06Assets.morningEtDodge, april06Assets.morningEtAmused,
    april06Assets.morningEtContinue
  ]) assert.equal(asset.mirrorForLeft, undefined);

  const resolved = resolveApril06Actions(fixtureLayout(), april06EchoActions);
  const moveGroups = resolved.filter((action): action is Extract<CutsceneAction, { type: "moveGroup" }> => action.type === "moveGroup");
  const finalMoves = moveGroups.at(-1)?.moves ?? [];
  const msFinal = finalMoves.find((move) => move.actor === "ms");
  const etFinal = finalMoves.find((move) => move.actor === "et");
  assert.equal(msFinal?.x, 726);
  assert.equal(etFinal?.x, 1074);
  assert.equal(msFinal?.facing, "left");
  assert.equal(etFinal?.facing, "right");
  assert.ok((msFinal?.x ?? 0) < (etFinal?.x ?? 0));
});

test("April 6 morning aftermath uses the canonical offscreen dialogue after the dissolve", () => {
  const fadeIndex = april06EchoActions.findIndex((action) => action.type === "fade");
  const aftermath = april06EchoActions.slice(fadeIndex + 1).filter((action): action is Extract<typeof april06EchoActions[number], { type: "dialogue" }> => action.type === "dialogue");
  assert.deepEqual(aftermath.map(({ text, portrait }) => ({ text, portrait })), authoredContentExpectations.chapters.april06.collections?.echo);
  assert.deepEqual(aftermath.map(({ speaker }) => speaker), ["Ziqi", "MS", "Ziqi", "MS"]);
});

test("April 6 rendered-state checkpoints use approved current visuals", () => {
  const emptyCar = advanceUntilDialogue(authoredContentExpectations.chapters.april06.dialogue[3]!.text);
  assert.equal(april06Assets[emptyCar.actors.get("ms")?.sprite?.assetId as keyof typeof april06Assets]?.path, "assets/406/406-caught/406-caught-abrupt stop.png");
  const catchLine = advanceUntilDialogue(authoredContentExpectations.chapters.april06.dialogue[4]!.text);
  assert.equal(april06Assets[catchLine.actors.get("et")?.sprite?.assetId as keyof typeof april06Assets]?.path, "assets/406/406-catch/406-catch-small amused reaction.png");
  const chat = advanceUntilDialogue(authoredContentExpectations.chapters.april06.dialogue[7]!.text);
  assert.equal(april06Assets[chat.actors.get("ms")?.sprite?.assetId as keyof typeof april06Assets]?.path, "assets/406/406-caught/406-caught-conversational idle A.png");
  assert.equal(april06Assets[chat.actors.get("et")?.sprite?.assetId as keyof typeof april06Assets]?.path, "assets/406/406-eat/406-eat-hold bag.png");
  const ending = advanceUntilDialogue(authoredContentExpectations.chapters.april06.dialogue[24]!.text);
  assert.equal(april06Assets[ending.actors.get("et")?.sprite?.assetId as keyof typeof april06Assets]?.path, "assets/406/406-eat/406-eat-glance.png");
  assert.equal(april06Assets[ending.actors.get("alza")?.sprite?.assetId as keyof typeof april06Assets]?.path, "assets/406/prop/vehicle-406-arrival-1.png");
});

test("April 6 echo runtime applies each synchronized paired PNG beat", () => {
  const actions = resolveApril06Actions(fixtureLayout(), april06EchoActions);
  const groups = actions.filter((action): action is Extract<CutsceneAction, { type: "spriteGroup" }> => action.type === "spriteGroup");
  const cutscene = new CutsceneSystem(actions);
  cutscene.update(0);
  cutscene.update(0);
  for (const group of groups) {
    cutscene.update(0);
    assert.equal(cutscene.actors.get("ms")?.sprite?.assetId, group.states[0].sprite.assetId);
    assert.equal(cutscene.actors.get("et")?.sprite?.assetId, group.states[1].sprite.assetId);
    cutscene.update(1);
  }
});

test("April 6 does not invent the rejected morning echo dialogue", () => {
  const texts = april06MainMemoryActions.filter((action): action is Extract<typeof april06MainMemoryActions[number], { type: "dialogue" }> => action.type === "dialogue").map((action) => action.text);
  assert.equal(texts.includes("你也在这边？"), false);
  assert.equal(april06EchoActions.some((action) => action.type === "dialogue" && action.text === "你也在这边？"), false);
});
