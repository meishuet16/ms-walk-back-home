import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";
import { march30Chapter as legacyMarch30Chapter } from "../src/fixtures/march30Chapter.js";
import {
  march30EchoAvailability,
  march30PortraitSequences,
  march30RefinedChapter,
  march30RefinedReflectionChoices,
  resolveMarch30RefinedActions
} from "../src/fixtures/march30RefinedChapter.js";
import { authoredRuntimeByScene } from "../src/systems/AuthoredChapterRegistry.js";
import { startChapterMemoryExperience } from "../src/systems/ChapterMemoryExperience.js";
import { resolveChapterReflection } from "../src/systems/EndingResolver.js";
import { renderMemoryPortraitSequenceBeat } from "../src/systems/MemoryPortraitPresentation.js";

const root = process.cwd();
const layout = JSON.parse(readFileSync(join(root, "public/scene-layouts/330/landscape.json"), "utf8"));

function geometryOnly(layoutValue: Record<string, unknown>): Record<string, unknown> {
  const { sceneId: _sceneId, label: _label, interactions, ...rest } = layoutValue;
  return {
    ...rest,
    interactions: (interactions as Array<Record<string, unknown>>).map(({ id: _id, label: _interactionLabel, ...geometry }) => geometry)
  };
}

test("refined March 30 is additive and leaves the legacy 330-corridor chapter definition intact", () => {
  assert.equal(legacyMarch30Chapter.runtimeScene, "330-corridor");
  assert.equal(march30RefinedChapter.runtimeScene, "330");
  assert.equal(march30RefinedChapter.id, legacyMarch30Chapter.id);
  assert.deepEqual(march30RefinedChapter.canonicalClosure, legacyMarch30Chapter.canonicalClosure);
});

test("refined March 30 is registered in the shared authored runtime", () => {
  const runtime = authoredRuntimeByScene["330"];
  assert.ok(runtime);
  assert.equal(runtime.chapter, march30RefinedChapter);
  assert.equal(runtime.triggerId, "main-memory");
  assert.equal(runtime.mainInteractionId, "march30-bench-memory");
  assert.equal(runtime.reflectionAfterEchoId, "elevator");
  assert.deepEqual(runtime.echoPortraitSequenceIds, { elevator: "march30-elevator" });
  assert.deepEqual(march30EchoAvailability, { elevator: { requiresMainCompletion: true } });
  assert.equal(layout.triggers[0].eventId, runtime.mainInteractionId);
});

test("refined March 30 preserves Main WORLD choreography while using modern portrait-free dialogue", () => {
  const actions = resolveMarch30RefinedActions(layout, "main");
  assert.equal(actions.filter((action) => action.type === "spawn").length, 2);
  assert.equal(actions.filter((action) => action.type === "effect").length, 3);
  const dialogue = actions.filter((action) => action.type === "dialogue");
  assert.ok(dialogue.length > 20);
  assert.equal(dialogue.every((action) => action.portrait === undefined), true);
  assert.equal(dialogue.at(-1)?.text, "拜拜");
});

test("Elevator Echo no longer replays WORLD choreography and is dialogue-only portrait-ready presentation", () => {
  assert.deepEqual(resolveMarch30RefinedActions(layout, "echo"), []);
  const sequence = march30PortraitSequences["march30-elevator"];
  assert.ok(sequence);
  assert.equal(sequence.beats.length, 1);
  assert.equal(sequence.beats[0].portrait, "");
  assert.equal(sequence.beats[0].dialogue[0].text, "额嘿嘿好巧哈哈 又见面了 太有缘了");
  assert.equal(sequence.beats[0].dialogue.at(-1)?.text, "这都还没到你教室 我们竟然真的那么顺路的吗 ");
  const rendered = renderMemoryPortraitSequenceBeat(sequence, 0, 0, { orientation: "portrait", width: 390, height: 844 });
  assert.match(rendered, /额嘿嘿好巧哈哈 又见面了 太有缘了/);
  assert.doesNotMatch(rendered, /memory-portrait-image/);
  assert.match(rendered, /portrait-sequence-next/);
});

test("March 30 Reflection is a three-question current-run chain", () => {
  assert.equal(march30RefinedReflectionChoices.length, 3);
  assert.deepEqual(march30RefinedReflectionChoices.map((point) => point.choices.length), [3, 3, 3]);
  const run = startChapterMemoryExperience({ chapterId: march30RefinedChapter.id, mode: "automatic" });
  assert.equal(run.mainCompleted, false);
  assert.deepEqual(run.reflectionChoiceIds, []);
  assert.equal(run.discoveredEchoIds.size, 0);
  assert.equal(Object.values(run.tendencies).every((value) => value === 0), true);
});

test("March 30 endings route from current-run tendencies while canonical closure stays fixed", () => {
  const ordinary = resolveChapterReflection(march30RefinedChapter, {
    choices: [],
    tendencies: { acceptance: 3, avoidance: 0, closeness: 0, distance: 1, honesty: 0, holding: 0, concealment: 0, companionship: 2, intervention: 0 }
  });
  const fate = resolveChapterReflection(march30RefinedChapter, {
    choices: [],
    tendencies: { acceptance: 0, avoidance: 0, closeness: 2, distance: 0, honesty: 0, holding: 4, concealment: 0, companionship: 0, intervention: 0 }
  });
  const heavy = resolveChapterReflection(march30RefinedChapter, {
    choices: [],
    tendencies: { acceptance: 0, avoidance: 0, closeness: 1, distance: 0, honesty: 4, holding: 0, concealment: 0, companionship: 0, intervention: 0 }
  });
  const notReady = resolveChapterReflection(march30RefinedChapter, {
    choices: [],
    tendencies: { acceptance: 0, avoidance: 2, closeness: 1, distance: 0, honesty: 0, holding: 1, concealment: 0, companionship: 0, intervention: 0 }
  });

  assert.equal(ordinary.quoteId, "march30-ordinary-morning");
  assert.equal(fate.quoteId, "march30-still-call-it-fate");
  assert.equal(heavy.quoteId, "march30-what-made-it-heavy");
  assert.equal(notReady.quoteId, "march30-no-answer-yet");
  for (const reflection of [ordinary, fate, heavy, notReady]) {
    assert.equal(reflection.historicalEventId, "march30-bench-memory");
    assert.deepEqual(reflection.closureLines, ["那天早上，她们在二楼道别。", "后来下一趟电梯打开，又遇见了。"]);
  }
});

test("refined 330 layouts preserve approved legacy geometry", () => {
  for (const orientation of ["landscape", "portrait"] as const) {
    const legacy = JSON.parse(readFileSync(join(root, `public/scene-layouts/330-corridor/${orientation}.json`), "utf8"));
    const refined = JSON.parse(readFileSync(join(root, `public/scene-layouts/330/${orientation}.json`), "utf8"));
    assert.deepEqual(geometryOnly(refined), geometryOnly(legacy));
  }
});
