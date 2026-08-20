import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";
import { march30EchoActions, march30MainMemoryActions, resolveMarch30CutsceneActions } from "../src/fixtures/march30Memory.js";

const root = process.cwd();
const layout = JSON.parse(readFileSync(join(root, "public/scene-layouts/330-corridor/landscape.json"), "utf8"));

test("March 30 resolver binds symbolic choreography to authored anchors", () => {
  const actions = resolveMarch30CutsceneActions(layout, march30MainMemoryActions);
  const spawns = actions.filter((action) => action.type === "spawn");
  assert.equal(spawns.length, 2);
  assert.deepEqual([spawns[0].x, spawns[0].y], [layout.anchors["et-bench-seat"].x, layout.anchors["et-bench-seat"].y]);
  assert.equal(actions.filter((action) => action.type === "effect").length, 3);
  assert.equal(actions.filter((action) => action.type === "dialogue" && action.text === "惨了这个家伙要打我了").length, 1);
  assert.equal(actions.filter((action) => action.type === "dialogue" && action.text === "不会啦 你那么可怜 上到6pm才放学 我1pm就放学了嘻嘻").length, 1);
  assert.equal(actions.filter((action) => action.type === "dialogue" && action.text.startsWith("我去！")).length, 1);
});

test("March 30 echo keeps the elevator reveal and paired walking offset data", () => {
  const actions = resolveMarch30CutsceneActions(layout, march30EchoActions);
  const spawns = actions.filter((action) => action.type === "spawn");
  assert.equal(spawns.length, 2);
  assert.equal(actions.filter((action) => action.type === "move").length, 2);
  assert.ok(actions.find((action) => action.type === "dialogue" && action.text.includes("太有缘了")));
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
