import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { test } from "node:test";
import {
  extractDialoguePresentation,
  extractReflectionPresentation,
  ownedGeneratedPaths,
  ownedSourcePaths,
  serializeAuthoredContent,
  type AuthoredContentManifest
} from "../src/authoring/authoredContent.js";
import { authoredContentManifest } from "../src/authoring/authoredContentManifest.js";
import { authoredContentExpectations } from "../src/fixtures/generated/authoredContentExpectations.js";

const sampleManifest: AuthoredContentManifest = {
  version: 1,
  chapters: {
    sample: {
      display: { title: "A" },
      dialogue: [{ text: "line", portrait: "assets/a.png" }]
    }
  }
};

test("extracts dialogue text and portrait but not behavioral fields", () => {
  const result = extractDialoguePresentation([
    { type: "dialogue", id: "event-1", speaker: "MS", text: "edited", portrait: "assets/a.png" },
    { type: "checkpoint", id: "strict-checkpoint" }
  ]);

  assert.deepEqual(result, [{ text: "edited", portrait: "assets/a.png" }]);
  assert.equal(JSON.stringify(result).includes("strict-checkpoint"), false);
  assert.equal(JSON.stringify(result).includes("MS"), false);
});

test("extracts authored dialogue attached to a movement action", () => {
  assert.deepEqual(extractDialoguePresentation([
    { type: "move", id: "strict-move-id", dialogue: { text: "edited move copy", portrait: "assets/a.png" } }
  ]), [{ text: "edited move copy", portrait: "assets/a.png" }]);
});

test("serializes the same manifest byte-for-byte regardless of object insertion order", () => {
  const first = serializeAuthoredContent(sampleManifest);
  const second = serializeAuthoredContent({
    version: 1,
    chapters: {
      sample: {
        dialogue: [{ portrait: "assets/a.png", text: "line" }],
        display: { title: "A" }
      }
    }
  });

  assert.equal(first, second);
});

test("portrait presentation config is copied without promoting structural fields", () => {
  assert.deepEqual(extractDialoguePresentation([
    { type: "dialogue", speaker: "ET", text: "line", portrait: { src: "assets/et.png", height: 200, offsetY: 8 } }
  ]), [{ text: "line", portrait: { src: "assets/et.png", height: 200, offsetY: 8 } }]);
});

test("reflection extraction copies prompts and copy but not choice ids or effects", () => {
  assert.deepEqual(extractReflectionPresentation([{
    id: "strict-reflection-id",
    prompt: "edited prompt",
    choices: [{ id: "strict-choice-id", label: "edited label", response: "edited response", effects: { honesty: 1 } }]
  }]), [{ prompt: "edited prompt", choices: [{ label: "edited label", response: "edited response" }] }]);
});

test("the explicit manifest contains current authored chapter presentation fields", () => {
  assert.ok(authoredContentManifest.chapters.march30);
  assert.ok(authoredContentManifest.chapters.april05);
  assert.ok(authoredContentManifest.chapters.april06);
  assert.ok(authoredContentManifest.chapters.may23);
  assert.ok(authoredContentManifest.chapters.june24);
  assert.ok(authoredContentManifest.chapters.june25);
  assert.ok(authoredContentManifest.chapters.july21);
  assert.ok(authoredContentManifest.chapters.march30.dialogue.length > 0);
  assert.ok(authoredContentManifest.chapters.july21.dialogue.length > 0);
});

test("generated expectations match the explicit manifest", () => {
  assert.equal(serializeAuthoredContent(authoredContentManifest), serializeAuthoredContent(authoredContentExpectations));
});

test("generated ownership is a fixed allowlist", () => {
  assert.deepEqual(ownedGeneratedPaths, ["apps/html-prototype/src/fixtures/generated/authoredContentExpectations.ts"]);
  assert.ok(ownedSourcePaths.includes("apps/html-prototype/src/authoring/authoredContentManifest.ts"));
});

test("syncable portrait asset paths remain independently backed by real files", () => {
  const assetPaths = new Set<string>();
  const visit = (value: unknown): void => {
    if (typeof value === "string" && /^assets\/.+\.(png|jpg|jpeg|webp|gif|svg)$/i.test(value)) {
      assetPaths.add(value);
      return;
    }
    if (Array.isArray(value)) {
      value.forEach(visit);
      return;
    }
    if (typeof value === "object" && value !== null) Object.values(value).forEach(visit);
  };
  visit(authoredContentExpectations);
  const publicRoot = resolve(process.cwd().endsWith("html-prototype") ? process.cwd() : resolve(process.cwd(), "apps/html-prototype"), "public");
  for (const assetPath of assetPaths) assert.equal(existsSync(resolve(publicRoot, assetPath)), true, assetPath);
});
