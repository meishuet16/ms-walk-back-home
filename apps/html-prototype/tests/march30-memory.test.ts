import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";
import type { SceneLayout } from "../src/systems/SceneLayouts.js";
import {
  march30Assets,
  march30EchoActions,
  march30MainMemoryActions,
  march30ReflectionChoices,
  resolveMarch30Anchor,
  type March30Action,
  type March30AnchorKey
} from "../src/fixtures/march30Memory.js";

test("March 30 asset metadata uses the inspected sheets without rounded frame slicing", () => {
  assert.equal(march30Assets.msBase.path, "assets/330/ms-base.png");
  assert.equal(march30Assets.msBase.grid, "4x4");
  assert.deepEqual(march30Assets.msBase.frames[0].source, { x: 0, y: 0, w: 256, h: 384 });
  assert.deepEqual(march30Assets.msBase.visibleBounds?.[0], { x: 58, y: 34, w: 160, h: 350 });
  assert.equal(march30Assets.etBase.path, "assets/330/yet-base.png");
  assert.equal(march30Assets.etBase.frames[1].source.w, 314);
  assert.equal(march30Assets.etBase.frames[1].source.x, 313);
  assert.deepEqual(march30Assets.etBase.visibleBounds?.[1], { x: 88, y: 17, w: 151, h: 273 });
  assert.equal(march30Assets.keychains.grid, "4x2");
  assert.equal(march30Assets.jacketReaction.grid, "3x2");
  assert.equal(march30Assets.waterVfx.grid, "6x1");
  assert.ok(march30Assets.waterVfx.visibleBounds);
  assert.deepEqual(march30Assets.waterVfx.visibleBounds[3], { x: 0, y: 277, w: 362, h: 158 });
  assert.deepEqual(march30Assets.waterVfx.nozzleOrigin, { x: 0, y: 0.5 });
  assert.deepEqual(march30Assets.waterVfx.travelBaseline, { y: 0.5 });
});

test("March 30 action data keeps the wipe and goodbye before reflection choice one", () => {
  const types = march30MainMemoryActions.map((action) => action.type);
  const wipe = types.indexOf("jacket-wipe");
  const choice = types.indexOf("reflection-choice");
  assert.ok(wipe > -1);
  assert.ok(choice > wipe);
  assert.equal(march30MainMemoryActions.filter((action) => action.type === "water-vfx").length, 3);
  assert.deepEqual(march30MainMemoryActions.filter((action) => action.type === "water-vfx").map((action) => action.beat), [1, 2, 3]);
  assert.deepEqual(march30ReflectionChoices.map((choice) => choice.label), [
    "她就这么自然地拿着她的外套走过来了。",
    "她刚刚明明是那个拿水枪喷人的。",
    "先不要替这个动作解释。"
  ]);
  const keychainFrame = march30MainMemoryActions.findIndex((action) => action.type === "sprite" && action.actor === "ms" && action.asset === "keychains");
  const keychainProp = march30MainMemoryActions.findIndex((action) => action.type === "prop" && action.id === "ordinaryKeychain");
  const baseBeforeProps = march30MainMemoryActions.findIndex((action, index) => index > keychainFrame && action.type === "sprite" && action.actor === "ms" && action.asset === "msBase");
  assert.ok(keychainFrame < baseBeforeProps && baseBeforeProps < keychainProp);
  const keychainHide = march30MainMemoryActions.findIndex((action) => action.type === "prop" && action.id === "ordinaryKeychain" && !action.visible);
  const sprayComplaint = march30MainMemoryActions.findIndex((action) => action.type === "dialogue" && action.text.startsWith("walao你刚刚拿水枪喷我"));
  assert.ok(keychainHide > keychainProp && keychainHide < sprayComplaint);
});

test("March 30 resolves all authored normal and echo anchors per orientation", () => {
  for (const orientation of ["landscape", "portrait"] as const) {
    const layout = JSON.parse(readFileSync(join("public", "scene-layouts", "330-corridor", `${orientation}.json`), "utf8")) as SceneLayout;
    for (const key of Object.keys(layout.anchors)) {
      assert.deepEqual(resolveMarch30Anchor(layout, key as March30AnchorKey), layout.anchors[key], `${orientation}:${key}`);
    }
    for (const key of Object.keys(layout.echoAnchors)) {
      const resolverKey = key === "walking-together" ? "walk-together" : key as "elevator-reencounter" | "walk-together";
      assert.deepEqual(resolveMarch30Anchor(layout, resolverKey), layout.echoAnchors[key], `${orientation}:${key}`);
    }
  }
  assert.equal(march30EchoActions.some((action) => action.type === "move" && action.anchor === "walk-together"), true);
});

test("March 30 canonical dialogue and echo copy are data, not reflection branches", () => {
  const text = march30MainMemoryActions.filter((action) => action.type === "dialogue").map((action) => action.text);
  assert.ok(text.includes("halo~早上好叶同学"));
  assert.ok(text.includes("这是什么"));
  assert.ok(text.includes("里面有水啊？可以喷水的吗 怎样哦？"));
  assert.ok(text.includes("惨了这个家伙要打我了"));
  assert.ok(text.includes("不会啦 你那么可怜 上到6pm才放学 我1pm就放学了嘻嘻"));
  assert.ok(text.some((line) => line.startsWith("我去！")));
  const echoText = march30EchoActions.filter((action) => action.type === "dialogue").map((action) => action.text);
  assert.ok(echoText.includes("额嘿嘿好巧哈哈 又见面了 太有缘了"));
  assert.ok(echoText.includes("哎哟又遇到了 我们还是那么顺路 太有缘分了"));
});

test("March 30 uses the authored direct portraits for the keychain dialogue beats", () => {
  const waterQuestion = march30MainMemoryActions.find((action) => action.type === "dialogue" && action.text === "这是什么");
  const keychainChoice = march30MainMemoryActions.find((action) => action.type === "dialogue" && action.text === "这边两个同款图案的挂饰里面你选一个吧");
  assert.equal(waterQuestion?.type, "dialogue");
  assert.deepEqual(waterQuestion?.portrait, { src: "assets/330/330-1.png", height: 200, offsetY: 8 });
  assert.equal(keychainChoice?.type, "dialogue");
  assert.deepEqual(keychainChoice?.portrait, { src: "assets/330/330-7.png", height: 200, offsetY: 8 });
});

test("March 30 uses the authored direct portraits for ET's question and MS's answer", () => {
  const giftQuestion = march30MainMemoryActions.find((action) => action.type === "dialogue" && action.text === "这是什么");
  const waterGunAnswer = march30MainMemoryActions.find((action) => action.type === "dialogue" && action.text === "水枪");
  assert.equal(giftQuestion?.type, "dialogue");
  assert.deepEqual(giftQuestion?.portrait, { src: "assets/330/330-1.png", height: 200, offsetY: 8 });
  assert.equal(waterGunAnswer?.type, "dialogue");
  assert.deepEqual(waterGunAnswer?.portrait, { src: "assets/330/330-2.png", height: 200, offsetY: 8 });
});

test("March 30 dialogue actions accept the shared generic portrait config", () => {
  const action: Extract<March30Action, { type: "dialogue" }> = {
    type: "dialogue",
    speaker: "MS",
    text: "test",
    portrait: {
      src: "assets/330/test.png",
      height: 200,
      offsetY: 8
    }
  };

  assert.deepEqual(action.portrait, {
    src: "assets/330/test.png",
    height: 200,
    offsetY: 8
  });
});
