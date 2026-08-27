import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { authoredChapterDiaryEntries } from "../src/fixtures/authoredDiaryEntries.js";
import { may23Assets, may23Chapter, may23EchoDialogues, may23FrameRegistries, resolveMay23Actions } from "../src/fixtures/may23Chapter.js";
import { chapterRegistry, forestEntries, routeForestEntry } from "../src/systems/ChapterRegistry.js";
import { CutsceneSystem, type CutsceneAction } from "../src/systems/CutsceneSystem.js";
import type { SceneLayout } from "../src/systems/SceneLayouts.js";
import { drawSceneActor } from "../src/systems/SceneActorRenderer.js";
import { sharedChapterDiaryBookAssetPath } from "../src/systems/DiaryLibrary.js";
import { authoredContentExpectations } from "../src/fixtures/generated/authoredContentExpectations.js";

function loadLayout(orientation: "portrait" | "landscape"): SceneLayout {
  return JSON.parse(readFileSync(`public/scene-layouts/523/${orientation}.json`, "utf8")) as SceneLayout;
}

test("May23 chapter is registered with its runtime scene and editable diary entry", () => {
  assert.equal(chapterRegistry["may23-i-arrived"], may23Chapter);
  assert.equal(may23Chapter.runtimeScene, "523");
  assert.equal(authoredChapterDiaryEntries.find((entry) => entry.chapterId === may23Chapter.id)?.id, may23Chapter.diaryEntryId);
});

test("May23 chapter has a discoverable Forest door that routes to scene 523", () => {
  const entry = forestEntries.find((item) => item.chapterId === may23Chapter.id);
  assert.ok(entry);
  assert.equal(entry.date, "05.23");
  const route = routeForestEntry(entry);
  assert.equal(route.kind, "implemented-chapter");
  if (route.kind === "implemented-chapter") assert.equal(route.chapter.runtimeScene, "523");
});

test("May23 authored layouts preserve both orientation assets and a boolean primary trigger", () => {
  const portrait = loadLayout("portrait");
  const landscape = loadLayout("landscape");
  assert.equal(portrait.asset, "assets/523/523-portrait.png");
  assert.equal(landscape.asset, "assets/523/523-landscape.png");
  assert.equal(portrait.triggers[0]?.id, "hostel-lobby-arrival");
  assert.equal(portrait.triggers[0]?.once, true);
  assert.equal(landscape.triggers[0]?.once, true);
  for (const id of ["ms-lobby-arrival", "ms-halfway-home", "ms-return-stop", "et-lobby-cross", "tung-ern-lobby-cross"]) assert.ok(portrait.anchors[id]);
});

test("May23 frame registries provide four native directional frames for every historical actor", () => {
  for (const registry of Object.values(may23FrameRegistries)) {
    for (const frames of Object.values(registry)) {
      assert.deepEqual(Object.keys(frames), ["idle", "walkA", "passing", "walkB"]);
      for (const path of Object.values(frames)) assert.match(path, /^assets\/523\/base\/(ms-base|et-base|te-base)\/(down|left|right|up)\/0[1-4]-/);
    }
  }
});

test("May23 Portrait action resolver keeps approved facing semantics and historical ownership", () => {
  const layout = loadLayout("portrait");
  const actions = resolveMay23Actions(layout, "main");
  const moveTo = (anchor: string) => actions.find((action): action is Extract<CutsceneAction, { type: "move" }> => action.type === "move" && action.x === layout.anchors[anchor]?.x && action.y === layout.anchors[anchor]?.y);
  assert.equal(moveTo("ms-wander-start")?.facing, "down");
  const upMove = actions.find((action): action is Extract<CutsceneAction, { type: "move" }> => action.type === "move" && action.actor === "ms" && action.spriteCycle?.[0]?.assetId.includes("/up/") === true);
  const mainDialogues = actions.flatMap((action) => {
    if (action.type === "dialogue") return [{ speaker: action.speaker, text: action.text }];
    if (action.type === "move" && action.dialogue) return [{ speaker: action.dialogue.speaker, text: action.dialogue.text }];
    return [];
  });
  assert.equal(upMove?.facing, "up");
  assert.equal(mainDialogues[5]?.speaker, "MS");
  assert.equal(mainDialogues[6]?.speaker, "ET");
  assert.deepEqual(mainDialogues.map((action) => action.speaker), [
    "MS", "ET", "ET", "MS", "MS", "MS", "ET", "MS", "MS", "MS", "ET", "ET", "ET", "ET"
  ]);
  assert.deepEqual(mainDialogues.map((action) => action.text), authoredContentExpectations.chapters.may23.dialogue.map((line) => line.text));
  assert.equal(actions.filter((action) => action.type === "spawn" && action.actor === "et").length, 2);
  assert.equal(actions.filter((action) => action.type === "spawn" && action.actor === "tung-ern").length, 2);
});

test("May23 approved Portrait candidates keep native asset sizing and exact canonical frame states", () => {
  const layout = loadLayout("portrait");
  const actions = resolveMay23Actions(layout, "main");
  const toilet = actions.find((action): action is Extract<CutsceneAction, { type: "move" }> =>
    action.type === "move" && action.x === layout.anchors["ms-toilet-doorway"]?.x && action.y === layout.anchors["ms-toilet-doorway"]?.y
  );
  assert.equal(toilet?.movementDirection, "up");
  assert.equal(toilet?.arrivalFacing, "down");
  assert.equal(toilet?.sprite?.assetId, "assets/523/base/ms-base/up/03-passing-step.png");
  assert.equal(toilet?.visualScale, 0.2);
  const sprites = actions.filter((action): action is Extract<CutsceneAction, { type: "sprite" }> => action.type === "sprite");
  const spriteIds = sprites.map((action) => action.sprite.assetId + ":" + action.visualScale);
  for (const expected of [
    "assets/523/base/ms-base/up/02-walk-step-a.png:0.3",
    "assets/523/base/ms-base/up/03-passing-step.png:0.25",
    "assets/523/base/ms-base/down/03-passing-step.png:0.3",
    "assets/523/base/ms-base/left/01-idle.png:0.3"
  ]) assert.ok(spriteIds.includes(expected), expected);
  for (const asset of Object.values(may23Assets)) assert.equal((asset as { baseHeight?: number }).baseHeight, asset.source.h);
  assert.deepEqual(may23Assets["assets/523/base/ms-base/down/03-passing-step.png"]?.visibleBounds, { x: 0, y: 13, w: 306, h: 307 });
  for (const asset of Object.values(may23Assets)) {
    assert.equal(asset.feet.x, 0.5);
    assert.equal(asset.feet.y, 1);
  }
});
test("May23 Portrait separates MS movement direction from arrival facing", () => {
  const layout = loadLayout("portrait");
  const actions = resolveMay23Actions(layout, "main");
  const moveIndex = actions.findIndex((action) =>
    action.type === "move" &&
    action.actor === "ms" &&
    action.x === layout.anchors["ms-toilet-doorway"]?.x &&
    action.y === layout.anchors["ms-toilet-doorway"]?.y
  );
  assert.ok(moveIndex >= 0);
  const move = actions[moveIndex] as Extract<CutsceneAction, { type: "move" }>;
  assert.equal(move.movementDirection, "up");
  assert.equal(move.arrivalFacing, "down");
  assert.deepEqual(move.spriteCycle?.map((frame) => frame.assetId), [
    "assets/523/base/ms-base/up/02-walk-step-a.png",
    "assets/523/base/ms-base/up/03-passing-step.png",
    "assets/523/base/ms-base/up/04-walk-step-b.png",
    "assets/523/base/ms-base/up/03-passing-step.png"
  ]);
  const arrival = actions[moveIndex + 1];
  assert.equal(arrival?.type, "sprite");
  if (arrival?.type === "sprite") {
    assert.equal(arrival.visualScale, 0.2);
    assert.equal(arrival.sprite.assetId, "assets/523/base/ms-base/down/01-idle.png");
  }
});

test("CutsceneSystem applies arrival facing only after directional movement reaches its anchor", () => {
  const system = new CutsceneSystem([
    { type: "spawn", actor: "ms", kind: "human", x: 0, y: 100, facing: "up", sprite: { assetId: "idle", frame: 0 } },
    {
      type: "move",
      actor: "ms",
      x: 0,
      y: 0,
      duration: 1,
      facing: "up",
      movementDirection: "up",
      arrivalFacing: "down",
      sprite: { assetId: "up-passing", frame: 0 },
      spriteCycle: [{ assetId: "up-walk", frame: 0 }]
    }
  ]);
  system.update(0);
  system.update(0.5);
  assert.equal(system.actors.get("ms")?.facing, "up");
  system.update(0.5);
  assert.equal(system.actors.get("ms")?.facing, "down");
});

test("May23 optional memory keeps authored points and uses the shared Labis diary book asset", () => {
  const portrait = loadLayout("portrait");
  const landscape = loadLayout("landscape");
  assert.deepEqual(portrait.interactions.find((item) => item.id === "bus-stop-memory"), {
    id: "bus-stop-memory",
    label: "bus-stop-memory",
    x: 620.9239363926974,
    y: 987.5071921698855,
    radius: 56
  });
  assert.deepEqual(landscape.interactions.find((item) => item.id === "bus-stop-memory"), {
    id: "bus-stop-memory",
    label: "bus-stop-memory",
    x: 846.1660851037549,
    y: 197.21118855279278,
    radius: 56
  });
  assert.deepEqual(portrait.anchors["ms-bus-stop-wait"], { x: 727.6091342982497, y: 1109.0607008651577 });
  assert.deepEqual(landscape.anchors["ms-bus-stop-wait"], { x: 775.3133822699041, y: 175.18691930645988 });
  assert.equal(sharedChapterDiaryBookAssetPath, "assets/labis/book-with-ms-photos.png");
  const optionalLines = may23EchoDialogues["bus-stop-memory"];
  assert.deepEqual(optionalLines.map(({ text, portrait }) => ({ text, portrait })), authoredContentExpectations.chapters.may23.collections?.["bus-stop-memory"]);
  assert.deepEqual(optionalLines.map(({ speaker }) => speaker), ["MS", "ET", "MS", "MS", "ET", "ET", "MS", "MEMORY", "MEMORY", "MEMORY", "MEMORY"]);
  const optionalActions = resolveMay23Actions(portrait, "echo", "bus-stop-memory");
  assert.equal(optionalActions.every((action) => action.type === "dialogue"), true);
  assert.equal(optionalActions.some((action) => action.type === "checkpoint" || action.type === "move" || action.type === "spawn"), false);
  assert.ok(resolveMay23Actions(portrait, "main").some((action) =>
    action.type === "move" &&
    action.actor === "ms" &&
    action.x === portrait.anchors["ms-bus-stop-wait"]?.x &&
    action.y === portrait.anchors["ms-bus-stop-wait"]?.y
  ));
});
test("May23 wires bus-stop-memory as a non-completing optional authored echo", () => {
  const appSource = readFileSync("src/app.ts", "utf8");
  assert.match(appSource, /this\.activeObject === "bus-stop-memory"/);
  assert.match(appSource, /startAuthoredCutscene\("echo", false, "bus-stop-memory"\)/);
  assert.match(appSource, /sharedChapterDiaryBookAssetPath/);
  assert.match(appSource, /interaction\.id === "diary-memory"/);
});
test("sprite visual scale preserves the authored world feet position", () => {
  const assetId = "assets/523/base/ms-base/down/03-passing-step.png";
  const asset = may23Assets[assetId];
  const drawCalls: unknown[][] = [];
  const context = {
    save: () => undefined,
    restore: () => undefined,
    drawImage: (...args: unknown[]) => drawCalls.push(args)
  } as unknown as CanvasRenderingContext2D;
  for (const visualScale of [0.2, 0.3, 0.31]) {
    drawCalls.length = 0;
    drawSceneActor(
      context,
      { id: "ms", x: 493.827517643779, y: 704.2577465025928, facing: "down", visible: true, kind: "human", sprite: { assetId, frame: 0 }, visualScale },
      0,
      0,
      1,
      { [assetId]: asset },
      new Map([[asset.path, {} as CanvasImageSource]])
    );
    const draw = drawCalls[0];
    assert.ok(draw);
    const renderedBottom = Number(draw[6]) + Number(draw[8]);
    assert.ok(Math.abs(renderedBottom - 704.2577465025928) < 0.000001, String(visualScale) + " changed world feet position");
  }
});
test("Cutscene move dialogue pauses and resumes the same authored movement", () => {
  const system = new CutsceneSystem([
    { type: "spawn", actor: "ms", kind: "human", x: 0, y: 0, facing: "up", visualScale: 0.3, sprite: { assetId: "idle", frame: 0 } },
    {
      type: "move",
      actor: "ms",
      x: 100,
      y: 0,
      duration: 1,
      facing: "up",
      visualScale: 0.3,
      startVisualScale: 0.3,
      sprite: { assetId: "passing", frame: 0 },
      dialogue: { speaker: "ET", text: "算了啦" },
      dialogueAtProgress: 0.25
    }
  ]);
  system.update(0);
  system.update(0.25);
  assert.equal(system.currentDialogue?.text, "算了啦");
  assert.ok((system.actors.get("ms")?.x ?? 0) > 0 && (system.actors.get("ms")?.x ?? 0) < 100);
  system.advanceDialogue();
  system.update(0.75);
  assert.equal(system.actors.get("ms")?.x, 100);
});
test("May23 19:29 ordering requires physical return movement before 算了啦", () => {
  const layout = loadLayout("portrait");
  const actions = resolveMay23Actions(layout, "main");
  const where = (predicate: (action: typeof actions[number]) => boolean) => actions.findIndex(predicate);
  const expectedMain = authoredContentExpectations.chapters.may23.dialogue;
  const question = where((action) => action.type === "dialogue" && action.text === expectedMain[10]?.text);
  const returnMove = where((action) => action.type === "move" && action.actor === "ms" && action.y === layout.anchors["ms-return-stop"]?.y);
  const returnDialogue = actions.find((action) => action.type === "move" && action.dialogue?.text === expectedMain[11]?.text);
  assert.ok(question >= 0 && returnMove > question && returnDialogue);
  if (returnDialogue?.type === "move") assert.equal(returnDialogue.dialogueAtProgress, 0.35);
});

test("CutsceneSystem animates moving actors and interpolates their visual scale", () => {
  const system = new CutsceneSystem([
    { type: "spawn", actor: "ms", kind: "human", x: 0, y: 0, visualScale: 0.3, sprite: { assetId: "idle", frame: 0 } },
    { type: "move", actor: "ms", x: 10, y: 0, duration: 1, facing: "up", startVisualScale: 0.3, visualScale: 0.2, spriteCycle: [{ assetId: "walk-a", frame: 0 }, { assetId: "passing", frame: 0 }], spriteCycleDuration: 0.1 },
    { type: "sprite", actor: "ms", sprite: { assetId: "up-idle", frame: 0 }, visualScale: 0.2 }
  ]);
  system.update(0);
  system.update(0.2);
  const moving = system.actors.get("ms")!;
  assert.equal(moving.facing, "up");
  assert.equal(moving.x, 2);
  assert.ok(Math.abs((moving.visualScale ?? 0) - 0.28) < 0.000001);
  assert.equal(moving.sprite?.assetId, "walk-a");
  system.update(0.8);
  system.update(0);
  assert.equal(system.actors.get("ms")?.sprite?.assetId, "up-idle");
});
test("May23 landscape actions select native directional rows while preserving the pair identity", () => {
  const layout = loadLayout("landscape");
  const actions = resolveMay23Actions(layout, "main");
  const firstPairMove = actions.find((action) => action.type === "moveGroup");
  assert.equal(firstPairMove?.type, "moveGroup");
  if (firstPairMove?.type === "moveGroup") {
    assert.equal(firstPairMove.moves.find((move) => move.actor === "et")?.facing, "right");
    assert.equal(firstPairMove.moves.find((move) => move.actor === "tung-ern")?.facing, "right");
    assert.ok(firstPairMove.moves.every((move) => move.spriteCycle?.length === 4));
  }
});
