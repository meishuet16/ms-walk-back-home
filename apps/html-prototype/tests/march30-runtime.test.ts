import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";
import { march30EchoActions, march30MainMemoryActions, resolveMarch30CutsceneActions } from "../src/fixtures/march30Memory.js";
import { authoredContentExpectations } from "../src/fixtures/generated/authoredContentExpectations.js";

const root = process.cwd();
const layout = JSON.parse(readFileSync(join(root, "public/scene-layouts/330-corridor/landscape.json"), "utf8"));

test("March 30 resolver binds symbolic choreography to authored anchors", () => {
  const actions = resolveMarch30CutsceneActions(layout, march30MainMemoryActions);
  const spawns = actions.filter((action) => action.type === "spawn");
  assert.equal(spawns.length, 2);
  assert.deepEqual([spawns[0].x, spawns[0].y], [layout.anchors["et-bench-seat"].x, layout.anchors["et-bench-seat"].y]);
  assert.equal(actions.filter((action) => action.type === "effect").length, 3);
  const dialogue = actions.filter((action) => action.type === "dialogue");
  assert.equal(dialogue[20]?.text, authoredContentExpectations.chapters.march30.dialogue[20]?.text);
  assert.equal(dialogue[21]?.text, authoredContentExpectations.chapters.march30.dialogue[21]?.text);
  assert.equal(dialogue[22]?.text, authoredContentExpectations.chapters.march30.dialogue[22]?.text);
});

test("March 30 echo keeps the elevator reveal and paired walking offset data", () => {
  const actions = resolveMarch30CutsceneActions(layout, march30EchoActions);
  const spawns = actions.filter((action) => action.type === "spawn");
  assert.equal(spawns.length, 2);
  assert.equal(actions.filter((action) => action.type === "move").length, 2);
  assert.deepEqual(actions.filter((action) => action.type === "dialogue").map((action) => action.text), authoredContentExpectations.chapters.march30.collections?.echo?.map((line) => line.text));
});

test("app routes authored 330-corridor into the March 30 visual runtime", () => {
  const source = readFileSync(join(process.cwd(), "src/app.ts"), "utf8");
  assert.match(source, /updateMarch30Scene/);
  assert.match(source, /drawMarch30Scene/);
  assert.match(source, /startMarch30Memory/);
  assert.match(source, /march30-reflection-choice/);
  assert.match(source, /water-vfx/);
  assert.doesNotMatch(source, /This authored memory scene is ready for its future chapter/);
});
