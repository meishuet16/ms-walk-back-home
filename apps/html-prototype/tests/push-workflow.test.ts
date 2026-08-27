import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";
import {
  planPrePush,
  planSafePush,
  pathsOutsideOwnership,
  type PrePushPlanInput,
  type SafePushPlanInput
} from "../src/authoring/pushWorkflow.js";

const generated = ["apps/html-prototype/src/fixtures/generated/authoredContentExpectations.ts"];
const source = ["apps/html-prototype/src/authoring/authoredContentManifest.ts"];

test("unchanged pre-push verification allows the push without a sync commit", () => {
  const input: PrePushPlanInput = {
    dirtyPaths: [],
    generatedDirtyBeforeSync: [],
    changedBySync: [],
    ownedGeneratedPaths: generated,
    ownedSourcePaths: source,
    verifyPassed: true
  };
  assert.deepEqual(planPrePush(input), { outcome: "allow-push", commit: false, runVerify: true });
});

test("stale generated content creates one owned sync commit and requires retry", () => {
  const input: PrePushPlanInput = {
    dirtyPaths: ["apps/html-prototype/src/fixtures/april05Chapter.ts", "notes.txt"],
    generatedDirtyBeforeSync: [],
    changedBySync: generated,
    ownedGeneratedPaths: generated,
    ownedSourcePaths: source,
    verifyPassed: true
  };
  assert.deepEqual(planPrePush(input), { outcome: "retry-required", commit: true, runVerify: true });
});

test("behavioral/unknown generated changes block without rewriting expectations", () => {
  const input: PrePushPlanInput = {
    dirtyPaths: [],
    generatedDirtyBeforeSync: [],
    changedBySync: ["apps/html-prototype/tests/april05-runtime.test.ts"],
    ownedGeneratedPaths: generated,
    ownedSourcePaths: source,
    verifyPassed: false
  };
  assert.deepEqual(planPrePush(input), { outcome: "block", commit: false, runVerify: false });
});

test("verify failure blocks a safe push and never reaches push", () => {
  const input: SafePushPlanInput = {
    dirtyPaths: [],
    generatedDirtyBeforeSync: [],
    changedBySync: [],
    ownedGeneratedPaths: generated,
    verifyPassed: false
  };
  assert.deepEqual(planSafePush(input), { outcome: "block", commit: false, runVerify: true, push: false });
});

test("safe push commits stale expectations, verifies, then pushes without recursion", () => {
  const input: SafePushPlanInput = {
    dirtyPaths: [],
    generatedDirtyBeforeSync: [],
    changedBySync: generated,
    ownedGeneratedPaths: generated,
    verifyPassed: true
  };
  assert.deepEqual(planSafePush(input), { outcome: "push", commit: true, runVerify: true, push: true });
});

test("unrelated dirty files are never selected for the automatic commit", () => {
  assert.deepEqual(pathsOutsideOwnership(
    ["apps/html-prototype/src/fixtures/generated/authoredContentExpectations.ts", "assets/local.png"],
    generated
  ), ["assets/local.png"]);
});

test("pre-existing generated dirt is unsafe to auto-commit", () => {
  const input: PrePushPlanInput = {
    dirtyPaths: generated,
    generatedDirtyBeforeSync: generated,
    changedBySync: [],
    ownedGeneratedPaths: generated,
    ownedSourcePaths: source,
    verifyPassed: true
  };
  assert.deepEqual(planPrePush(input), { outcome: "block", commit: false, runVerify: false });
});

test("pre-existing authored source dirt remains untouched and blocks the hook", () => {
  const input: PrePushPlanInput = {
    dirtyPaths: source,
    generatedDirtyBeforeSync: [],
    changedBySync: [],
    ownedGeneratedPaths: generated,
    ownedSourcePaths: source,
    verifyPassed: true
  };
  assert.deepEqual(planPrePush(input), { outcome: "block", commit: false, runVerify: false });
});

test("push scripts enforce owned paths and never recurse or force-push", () => {
  const root = resolve(process.cwd().endsWith("html-prototype") ? resolve(process.cwd(), "..", "..") : process.cwd());
  const safePush = readFileSync(resolve(root, "scripts/safe-push.mjs"), "utf8");
  const prePush = readFileSync(resolve(root, "scripts/pre-push.mjs"), "utf8");
  assert.doesNotMatch(safePush, /--force|--no-verify/);
  assert.doesNotMatch(prePush, /git push/);
  assert.match(prePush, /npm run safe-push/);
  assert.equal((safePush.match(/\["push"\]/g) ?? []).length, 1);
  assert.match(safePush, /commitGeneratedExpectation/);
  assert.match(prePush, /commitGeneratedExpectation/);
});
