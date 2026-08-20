import assert from "node:assert/strict";
import test from "node:test";
import { CutsceneSystem, type CutsceneAction } from "../src/systems/CutsceneSystem.js";

test("generic cutscene keeps explicit actor sprite frames and attached props", () => {
  const actions: CutsceneAction[] = [
    { type: "spawn", actor: "ms", kind: "human", x: 12, y: 40, sprite: { assetId: "msBase", frame: 8 } },
    { type: "sprite", actor: "ms", sprite: { assetId: "approach", frame: 7 } },
    { type: "prop", id: "gift", assetId: "gift", owner: "ms", visible: true }
  ];
  const cutscene = new CutsceneSystem(actions);

  cutscene.update(0);
  cutscene.update(0);
  cutscene.update(0);

  assert.deepEqual(cutscene.actors.get("ms")?.sprite, { assetId: "approach", frame: 7 });
  assert.deepEqual(cutscene.props.get("gift"), { id: "gift", assetId: "gift", owner: "ms", visible: true });
});

test("generic cutscene exposes timed effects and fades without changing Labis action semantics", () => {
  const actions: CutsceneAction[] = [
    { type: "spawn", actor: "et", kind: "human", x: 0, y: 40 },
    { type: "effect", id: "spray-1", kind: "water-vfx", actor: "et", target: "ms", frame: 3, duration: 0.2 },
    { type: "fade", actors: ["et"], duration: 0.3 }
  ];
  const cutscene = new CutsceneSystem(actions);

  cutscene.update(0);
  cutscene.update(0.1);
  assert.equal(cutscene.effects.get("spray-1")?.kind, "water-vfx");
  assert.equal(cutscene.effects.get("spray-1")?.progress, 0.5);
  cutscene.update(0.1);
  assert.equal(cutscene.effects.has("spray-1"), false);
  cutscene.update(0);
  cutscene.update(0.15);
  assert.equal(cutscene.actors.get("et")?.opacity, 0.5);
  cutscene.update(0.15);
  assert.equal(cutscene.actors.get("et")?.opacity, 0);
});
