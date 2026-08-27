import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import { applyChapterExperienceChoice, startChapterMemoryExperience } from "../src/systems/ChapterMemoryExperience.js";
import { CutsceneSystem, type CutsceneAction } from "../src/systems/CutsceneSystem.js";
import { resolveSceneEchoAnchor, type SceneLayout } from "../src/systems/SceneLayouts.js";
import { emptyTendencies } from "../src/systems/TendencySystem.js";
import { authoredContentExpectations } from "../src/fixtures/generated/authoredContentExpectations.js";

const loadApril05 = () => import("../src/fixtures/" + "april05Chapter.js");

function layout(orientation: "landscape" | "portrait"): SceneLayout {
  return JSON.parse(readFileSync(join("public", "scene-layouts", "405", orientation + ".json"), "utf8")) as SceneLayout;
}

function resolvedActions(fixture: { resolveApril05Actions: (layout: SceneLayout, actions: unknown[]) => CutsceneAction[]; april05MainMemoryActions: unknown[] }, orientation: "landscape" | "portrait" = "landscape"): CutsceneAction[] {
  return fixture.resolveApril05Actions(layout(orientation), fixture.april05MainMemoryActions);
}

function advanceUntilDialogue(cutscene: CutsceneSystem, text: string): CutsceneSystem {
  for (let step = 0; step < 2400; step += 1) {
    cutscene.update(0.2);
    if (cutscene.currentDialogue?.text === text) return cutscene;
    if (cutscene.currentDialogue) cutscene.advanceDialogue();
    if (cutscene.currentCheckpoint) cutscene.resolveCheckpoint();
  }
  throw new Error("dialogue not reached: " + text);
}

function dialogueActionIndex(actions: readonly CutsceneAction[], dialogueIndex: number): number {
  let current = -1;
  return actions.findIndex((action) => {
    if (action.type !== "dialogue") return false;
    current += 1;
    return current === dialogueIndex;
  });
}

function advanceUntilState(cutscene: CutsceneSystem, predicate: (cutscene: CutsceneSystem) => boolean): CutsceneSystem {
  for (let step = 0; step < 2400; step += 1) {
    cutscene.update(0.08);
    if (predicate(cutscene)) return cutscene;
    if (cutscene.currentDialogue) cutscene.advanceDialogue();
    if (cutscene.currentCheckpoint) cutscene.resolveCheckpoint();
  }
  throw new Error("expected cutscene state not reached");
}

function assetPath(fixture: { april05Assets: Record<string, { path: string }> }, assetId: string): string {
  return fixture.april05Assets[assetId]?.path ?? assetId;
}

test("April 5 uses only approved 405 and reused March 30 assets with irregular-frame metadata", async () => {
  const fixture = await loadApril05();
  const paths = Object.values(fixture.april05Assets as Record<string, { path: string }>).map((asset) => asset.path);
  assert.ok(paths.includes("assets/330/ms-base.png"));
  assert.ok(paths.includes("assets/330/yet-base.png"));
  assert.ok(paths.includes("assets/405/405-water-spraying/frame-01.png"));
  assert.ok(paths.includes("assets/405/405-water-sprayed/et-april05-water-sprayed-frame-01.png"));
  assert.ok(paths.includes("assets/330/water-gun.png"));
  assert.equal(paths.includes("assets/330/330-water-spraying.png"), false);
  assert.equal(paths.includes("assets/330/330-water-sprayed.png"), false);
  assert.ok(paths.some((path: string) => path.includes("assets/405/friend/su/")));
  assert.ok(paths.some((path: string) => path.includes("assets/405/friend/te/")));
  assert.equal(fixture.april05Assets["ms-wait"].materialScale, 1.2);
  assert.equal(fixture.april05Assets["et-wait"].materialScale, 1.2);
const expectedEtSources = [[384, 502], [363, 499], [380, 467], [356, 446], [348, 469], [359, 498], [353, 471], [293, 497]];
  for (let index = 0; index < 8; index += 1) {
    const suffix = String(index + 1).padStart(2, "0");
    const ms = fixture.april05Assets[`ms-water-spraying-${suffix}`];
    const et = fixture.april05Assets[`et-water-sprayed-${suffix}`];
    assert.deepEqual(ms.source, { x: 0, y: 0, w: 408, h: 536 });
    assert.equal(ms.materialScale, 1.2);
    assert.equal(ms.mirrorForLeft, false);
    assert.ok(ms.visibleBounds && ms.visibleBounds.w > 0 && ms.visibleBounds.h > 0);
    assert.ok(ms.feet.x > 0 && ms.feet.y > 0);
    assert.deepEqual([et.source.w, et.source.h], expectedEtSources[index]);
    assert.equal(et.materialScale, 1.2);
    assert.equal(et.mirrorForLeft, false);
    assert.ok(et.visibleBounds && et.visibleBounds.w > 0 && et.visibleBounds.h > 0);
    assert.ok(et.feet.x > 0 && et.feet.y > 0);
  }
  assert.ok(paths.every((path: string) => path.startsWith("assets/")));
  assert.equal(fixture.april05Assets["et-hair-ruffle-06"].visibleBounds.w > 0, true);
  assert.equal(fixture.april05Assets["et-hair-ruffle-06"].feet.y > 0, true);
  assert.notEqual(fixture.april05Assets["et-lock-05"].source.h, fixture.april05Assets["et-lock-01"].source.h);
});

test("April 5 resolver preserves authored anchors, topology, facing, and the three secondary echoes", async () => {
  const fixture = await loadApril05();
  const landscape = layout("landscape");
  const portrait = layout("portrait");
for (const authoredLayout of [landscape, portrait]) {
    assert.ok(authoredLayout.anchors["et-sprayed-position"].x < authoredLayout.anchors["ms-spray-position"].x, "both authored orientations keep ET left of MS");
  }
  const resolvedLandscape = resolvedActions(fixture, "landscape");
  const resolvedPortrait = fixture.resolveApril05Actions(portrait, fixture.april05MainMemoryActions);
  const spray = resolvedLandscape.find((action) => action.type === "move" && action.actor === "ms" && action.x === landscape.anchors["ms-spray-position"].x);
  const etSprayTarget = resolvedLandscape.find((action) => action.type === "move" && action.actor === "et" && action.x === landscape.anchors["et-sprayed-position"].x);
  assert.equal(spray?.type, "move");
  assert.equal((spray as Extract<CutsceneAction, { type: "move" }>).facing, "left");
  assert.equal(etSprayTarget?.type, "move");
  assert.ok((etSprayTarget as Extract<CutsceneAction, { type: "move" }>).x < (spray as Extract<CutsceneAction, { type: "move" }>).x);
  assert.equal(resolveSceneEchoAnchor(landscape, "watergun-crossing"), null);
  assert.equal(resolveSceneEchoAnchor(portrait, "watergun-crossing"), null);
  for (const echoId of ["cat-approach", "bicycle-st-comment", "phone-after-return"]) {
    assert.deepEqual(resolveSceneEchoAnchor(landscape, echoId), landscape.echoAnchors[echoId]);
    assert.deepEqual(resolveSceneEchoAnchor(portrait, echoId), portrait.echoAnchors[echoId]);
  }
  assert.ok(resolvedPortrait.length > 0);
  assert.deepEqual(Object.keys(landscape.echoAnchors).sort(), ["bicycle-st-comment", "cat-approach", "phone-after-return"].sort());
  assert.deepEqual(Object.keys(portrait.echoAnchors).sort(), ["bicycle-st-comment", "cat-approach", "phone-after-return"].sort());
});

test("April 5 canonical water hit preserves visible identity, topology, gun ownership, and hit order", async () => {
  const fixture = await loadApril05();
  const actions = resolvedActions(fixture);
  const oldPaths = ["assets/330/330-water-spraying.png", "assets/330/330-water-sprayed.png"];
  assert.equal(Object.values(fixture.april05Assets as Record<string, { path: string }>).some((asset) => oldPaths.includes(asset.path)), false);
  const effects = actions.filter((action): action is Extract<CutsceneAction, { type: "effect" }> => action.type === "effect" && action.kind === "water-vfx");
  assert.equal(effects.length, 1);
  assert.equal(effects[0].actor, "ms");
  assert.equal(effects[0].target, "et");
const msFrameFourIndex = actions.findIndex((action) => action.type === "sprite" && action.actor === "ms" && assetPath(fixture, action.sprite.assetId).endsWith("assets/405/405-water-spraying/frame-04.png"));
  const effectIndex = actions.findIndex((action) => action.type === "effect" && action.id === "april05-water-hit");
  const etFrameOneIndex = actions.findIndex((action) => action.type === "sprite" && action.actor === "et" && assetPath(fixture, action.sprite.assetId).endsWith("assets/405/405-water-sprayed/et-april05-water-sprayed-frame-01.png"));
  const hitDialogueIndex = dialogueActionIndex(actions, 3);
  assert.ok(msFrameFourIndex >= 0 && msFrameFourIndex < effectIndex && effectIndex < etFrameOneIndex && etFrameOneIndex < hitDialogueIndex, "visible hit order is encoded");
  const cutscene = new CutsceneSystem(actions);
  const leadIn = advanceUntilState(cutscene, (state) => state.props.get("water-gun")?.visible === true);
  const leadInGun = leadIn.props.get("water-gun");
  assert.equal(leadInGun?.owner, "ms");
  assert.equal([...leadIn.props.values()].filter((prop) => prop.id === "water-gun" && prop.visible).length, 1);
  assert.equal([...leadIn.props.values()].some((prop) => prop.owner === "et"), false);
  const spray = advanceUntilState(cutscene, (state) => assetPath(fixture, state.actors.get("ms")?.sprite?.assetId ?? "").includes("assets/405/405-water-spraying/frame-04.png"));
  assert.match(assetPath(fixture, spray.actors.get("ms")?.sprite?.assetId ?? ""), /assets[\\/]405[\\/]405-water-spraying[\\/]frame-04\.png/);
  assert.ok((spray.actors.get("et")?.x ?? 0) < (spray.actors.get("ms")?.x ?? 0));
  assert.equal(spray.props.get("water-gun")?.visible, false);
  const activeHit = advanceUntilState(cutscene, (state) => state.effects.has("april05-water-hit"));
  assert.equal(activeHit.effects.get("april05-water-hit")?.actor, "ms");
  assert.equal(activeHit.effects.get("april05-water-hit")?.target, "et");
  const resolvedHit = advanceUntilDialogue(cutscene, authoredContentExpectations.chapters.april05.dialogue[3]!.text);
  assert.match(assetPath(fixture, resolvedHit.actors.get("ms")?.sprite?.assetId ?? ""), /assets[\\/]405[\\/]405-water-spraying[\\/]frame-08\.png/);
  assert.match(assetPath(fixture, resolvedHit.actors.get("et")?.sprite?.assetId ?? ""), /assets[\\/]405[\\/]405-water-sprayed[\\/]et-april05-water-sprayed-frame-08\.png/);
  assert.ok((resolvedHit.actors.get("et")?.x ?? 0) < (resolvedHit.actors.get("ms")?.x ?? 0));
  assert.equal(resolvedHit.currentDialogue?.speaker, "ET");
  assert.equal([...resolvedHit.props.values()].filter((prop) => prop.id === "water-gun" && prop.visible).length, 0);
  assert.equal(assetPath(fixture, resolvedHit.actors.get("ms")?.sprite?.assetId ?? "").includes("assets/330/330-water-spraying.png"), false);
  assert.equal(assetPath(fixture, resolvedHit.actors.get("et")?.sprite?.assetId ?? "").includes("assets/330/330-water-sprayed.png"), false);
});
test("April 5 hair ruffle and side-lock use dedicated synchronized pairs without a duplicate held prop", async () => {
  const fixture = await loadApril05();
  const actions = resolvedActions(fixture);
  const cutscene = new CutsceneSystem(actions);
  const ruffleDialogue = authoredContentExpectations.chapters.april05.dialogue[4]!.text;
  const ruffle = advanceUntilDialogue(cutscene, ruffleDialogue);
  const ruffleMs = assetPath(fixture, ruffle.actors.get("ms")?.sprite?.assetId ?? "");
  const ruffleEt = assetPath(fixture, ruffle.actors.get("et")?.sprite?.assetId ?? "");
  assert.match(ruffleMs, /assets\\405\\405-hair-ruffled\\08\.png|assets\/405\/405-hair-ruffled\/08\.png/);
  assert.match(ruffleEt, /assets\\405\\405-hair-ruffle\\08\.png|assets\/405\/405-hair-ruffle\/08\.png/);
  assert.equal([...ruffle.props.values()].filter((prop) => prop.id === "water-gun" && prop.visible).length, 0);
  const lock = advanceUntilDialogue(new CutsceneSystem(actions), authoredContentExpectations.chapters.april05.dialogue[6]!.text);
  assert.match(assetPath(fixture, lock.actors.get("ms")?.sprite?.assetId ?? ""), /assets[\\/]405[\\/]locked[\\/]08\.png/);
  assert.match(assetPath(fixture, lock.actors.get("et")?.sprite?.assetId ?? ""), /assets[\\/]405[\\/]lock[\\/]08\.png/);
  assert.ok((lock.actors.get("et")?.x ?? 0) < (lock.actors.get("ms")?.x ?? 0));
});

test("April 5 canonical dialogue and goodbye ordering are preserved", async () => {
  const fixture = await loadApril05();
  const actions = fixture.april05MainMemoryActions.filter((action: { type: string }) => action.type === "dialogue") as Array<{ type: "dialogue"; speaker: string; text: string }>;
  assert.deepEqual(actions.map((action) => action.speaker), ["MS", "ET", "MS", "ET", "ET", "ST", "ET", "MS", "ET", "ET", "ET", "MS", "ET", "MS", "ET", "ET", "MS", "ET", "MS", "ET", "ET", "ET"]);
  assert.deepEqual(actions.map(({ text }) => text), authoredContentExpectations.chapters.april05.dialogue.map((line) => line.text));
  const finalDialogueIndex = fixture.april05MainMemoryActions.reduce((last: number, action: { type: string }, index: number) => action.type === "dialogue" ? index : last, -1);
  const fadeIndex = fixture.april05MainMemoryActions.findIndex((action: { type: string }) => action.type === "fade");
  const despawnIndex = fixture.april05MainMemoryActions.findIndex((action: { type: string }) => action.type === "despawn");
  assert.ok(finalDialogueIndex >= 0 && finalDialogueIndex < fadeIndex && fadeIndex < despawnIndex);
});

test("April 5 secondary echoes stay dialogue-only and do not add a physical water gun or event", async () => {
  const fixture = await loadApril05();
  const echoSets = fixture.april05EchoActions as Record<string, Array<{ type: string; text?: string; asset?: string }>>;
  assert.deepEqual(Object.keys(echoSets).sort(), ["bicycle", "cat-echo", "phone-after-return"]);
  for (const [id, actions] of Object.entries(echoSets)) {
    const expected = authoredContentExpectations.chapters.april05.collections?.[id as keyof typeof authoredContentExpectations.chapters.april05.collections];
    assert.deepEqual(actions.filter((action) => action.type === "dialogue").map(({ text }) => ({ text })), expected?.map((line: { text: string }) => ({ text: line.text })));
  }
  assert.equal(Object.values(echoSets).some((actions) => actions.some((action) => action.type === "prop")), false);
});

test("April 5 keeps the three checkpoints and fixed factual closure", async () => {
  const fixture = await loadApril05();
  assert.deepEqual(fixture.april05MainMemoryActions.filter((action: { type: string; id?: string }) => action.type === "checkpoint").map((action: { id?: string }) => action.id), [
    "april-five-sad-thing", "april-five-happy-because-see-you", "april-five-quiz"
  ]);
  assert.deepEqual(fixture.april05Chapter.canonicalClosure.lines, authoredContentExpectations.chapters.april05.closure);
  const propIds = new Set(fixture.april05MainMemoryActions.filter((action: { type: string; id?: string }) => action.type === "prop").map((action: { id?: string }) => action.id));
  assert.deepEqual([...propIds], ["water-gun"]);
});

test("April 5 is routed through the shared authored runtime and not a 406-only branch", () => {
  const appSource = readFileSync(join("src", "app.ts"), "utf8");
  assert.match(appSource, /authoredRuntimeByScene/);
  assert.match(appSource, /april05Chapter/);
  assert.doesNotMatch(appSource, /this\\.scene === "406"/);
});
test("April 5 current-run replay starts with fresh tendencies", () => {
  const choice = { id: "april05-choice", label: "keep the fact", effects: { acceptance: 1 }, response: "noted" };
  const first = applyChapterExperienceChoice(startChapterMemoryExperience({ chapterId: "april05-come-down", mode: "automatic" }), choice);
  const replay = startChapterMemoryExperience({ chapterId: "april05-come-down", mode: "manual-replay" });
  assert.equal(first.tendencies.acceptance, 1);
  assert.deepEqual(replay.tendencies, emptyTendencies());
  assert.deepEqual(replay.reflectionChoiceIds, []);
});
