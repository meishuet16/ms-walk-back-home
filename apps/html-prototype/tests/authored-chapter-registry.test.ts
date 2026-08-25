import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import { april05Assets, april05Chapter, april05EchoActions, april05MainMemoryActions, april05ReflectionChoices, resolveApril05Actions } from "../src/fixtures/april05Chapter.js";
import { april06Assets, april06Chapter, april06EchoActions, april06MainMemoryActions, april06ReflectionChoices, resolveApril06Actions } from "../src/fixtures/april06Chapter.js";
import { may23Assets, may23Chapter, may23EchoAnchors, may23ReflectionChoices, resolveMay23Actions } from "../src/fixtures/may23Chapter.js";
import { june24Assets, june24Chapter, june24EchoDialogues, june24ReflectionChoices, resolveJune24Actions } from "../src/fixtures/june24Chapter.js";
import { june25Chapter, june25DiaryEntry, june25EchoAvailability, june25EchoPortraitSequenceIds, june25PortraitSequences, june25ReflectionChoices } from "../src/fixtures/june25Chapter.js";
import { chapterRegistry, forestEntries, routeForestEntry } from "../src/systems/ChapterRegistry.js";
import type { SceneLayout } from "../src/systems/SceneLayouts.js";

const loadRegistry = () => import("../src/systems/AuthoredChapterRegistry.js");

function loadLayout(sceneId: string, orientation: "landscape" | "portrait" = "landscape"): SceneLayout {
  return JSON.parse(readFileSync(join("public", "scene-layouts", sceneId, `${orientation}.json`), "utf8")) as SceneLayout;
}

test("all current authored scenes preserve their independent runtime contracts", async () => {
  const { authoredRuntimeByScene } = await loadRegistry();

  assert.deepEqual(Object.keys(authoredRuntimeByScene).sort(), ["405", "406", "523", "624", "625"]);

  assert.equal(authoredRuntimeByScene["405"]?.chapter, april05Chapter);
  assert.equal(authoredRuntimeByScene["405"]?.chapter.id, "april05-come-down");
  assert.equal(authoredRuntimeByScene["405"]?.assets, april05Assets);
  assert.deepEqual(authoredRuntimeByScene["405"]?.echoAnchors, {
    "cat-echo": "cat-approach",
    bicycle: "bicycle-st-comment",
    "phone-after-return": "phone-after-return"
  });
  assert.equal(authoredRuntimeByScene["405"]?.reflectionChoices, april05ReflectionChoices);
  assert.equal(authoredRuntimeByScene["405"]?.triggerId, undefined);
  assert.equal(authoredRuntimeByScene["405"]?.mainInteractionId, undefined);

  assert.equal(authoredRuntimeByScene["406"]?.chapter, april06Chapter);
  assert.equal(authoredRuntimeByScene["406"]?.chapter.id, "april06-not-gone-yet");
  assert.equal(authoredRuntimeByScene["406"]?.assets, april06Assets);
  assert.deepEqual(authoredRuntimeByScene["406"]?.echoAnchors, { "watergun-crossing": "watergun-crossing" });
  assert.equal(authoredRuntimeByScene["406"]?.reflectionChoices, april06ReflectionChoices);
  assert.equal(authoredRuntimeByScene["406"]?.triggerId, undefined);
  assert.equal(authoredRuntimeByScene["406"]?.mainInteractionId, undefined);

  assert.equal(authoredRuntimeByScene["523"]?.chapter, may23Chapter);
  assert.equal(authoredRuntimeByScene["523"]?.chapter.id, "may23-i-arrived");
  assert.equal(authoredRuntimeByScene["523"]?.assets, may23Assets);
  assert.equal(authoredRuntimeByScene["523"]?.reflectionChoices, may23ReflectionChoices);
  assert.deepEqual(authoredRuntimeByScene["523"]?.echoAnchors, may23EchoAnchors);
  assert.equal(authoredRuntimeByScene["523"]?.triggerId, "hostel-lobby-arrival");
  assert.equal(authoredRuntimeByScene["523"]?.mainInteractionId, "hostel-lobby-memory");

  assert.equal(authoredRuntimeByScene["624"]?.chapter, june24Chapter);
  assert.equal(authoredRuntimeByScene["624"]?.chapter.id, "june24-only-came-for-you");
  assert.equal(authoredRuntimeByScene["624"]?.assets, june24Assets);
  assert.equal(authoredRuntimeByScene["624"]?.reflectionChoices, june24ReflectionChoices);
  assert.equal(authoredRuntimeByScene["624"]?.echoRequiresMainCompletion, false);
  assert.deepEqual(authoredRuntimeByScene["624"]?.echoAnchors, {
    "carrot-milk-memory": "carrot-milk-residue",
    "five-cent-memory": "five-cent-residue",
    "xiaoba-memory": "xiaoba-residue"
  });
  assert.deepEqual(authoredRuntimeByScene["624"]?.echoPortraitIds, {
    "carrot-milk-memory": "june24-angela-st-echo",
    "five-cent-memory": "june24-room-study-echo",
    "xiaoba-memory": "june24-haircut-echo"
  });
  assert.equal(authoredRuntimeByScene["624"]?.echoPortraitDialogues, june24EchoDialogues);
  assert.equal(authoredRuntimeByScene["624"]?.triggerId, "june24-table-arrival");
  assert.equal(authoredRuntimeByScene["624"]?.mainInteractionId, "table-memory");

  assert.equal(authoredRuntimeByScene["625"]?.chapter, june25Chapter);
  assert.equal(authoredRuntimeByScene["625"]?.reflectionChoices, june25ReflectionChoices);
  assert.deepEqual(authoredRuntimeByScene["625"]?.portraitSequences, june25PortraitSequences);
  assert.deepEqual(authoredRuntimeByScene["625"]?.echoPortraitSequenceIds, june25EchoPortraitSequenceIds);
  assert.deepEqual(authoredRuntimeByScene["625"]?.echoAvailability, june25EchoAvailability);
  assert.equal(authoredRuntimeByScene["625"]?.mainPortraitSequenceId, "june25-main");
  assert.equal(authoredRuntimeByScene["625"]?.mainInteractionId, "bed-main-memory");
  assert.equal(authoredRuntimeByScene["625"]?.triggerId, "june25-bed-main-trigger");
});

test("June 25 uses the canonical Section 7 diary body and shared diary asset contract", async () => {
  const { authoredRuntimeByScene } = await loadRegistry();
  const runtime = authoredRuntimeByScene["625"];
  assert.equal(june25DiaryEntry.chapterId, june25Chapter.id);
  assert.equal(june25DiaryEntry.body.split("\n\n")[0], "06.25 · She Really Came");
  assert.match(june25DiaryEntry.body, /只是有一天，在完全可以不来的时候，你还是自己走来了。/);
  assert.doesNotMatch(june25DiaryEntry.body, /raw June 25|source diary/i);
  assert.equal(runtime?.chapter.diaryEntryId, june25DiaryEntry.id);
  assert.equal(runtime?.chapter.runtimeScene, "625");
});

test("authored registry resolvers delegate unchanged for main and echo modes", async () => {
  const { authoredRuntimeByScene } = await loadRegistry();
  const layout405 = loadLayout("405");
  const layout406 = loadLayout("406");
  const layout523 = loadLayout("523");
  const layout624 = loadLayout("624");

  assert.deepEqual(
    authoredRuntimeByScene["405"]?.resolveActions(layout405, "main"),
    resolveApril05Actions(layout405, april05MainMemoryActions)
  );
  assert.deepEqual(
    authoredRuntimeByScene["405"]?.resolveActions(layout405, "echo", "cat-echo"),
    resolveApril05Actions(layout405, april05EchoActions["cat-echo"])
  );
  assert.deepEqual(
    authoredRuntimeByScene["406"]?.resolveActions(layout406, "main"),
    resolveApril06Actions(layout406, april06MainMemoryActions)
  );
  assert.deepEqual(
    authoredRuntimeByScene["406"]?.resolveActions(layout406, "echo"),
    resolveApril06Actions(layout406, april06EchoActions)
  );
  assert.deepEqual(
    authoredRuntimeByScene["523"]?.resolveActions(layout523, "main"),
    resolveMay23Actions(layout523, "main")
  );
  assert.deepEqual(
    authoredRuntimeByScene["523"]?.resolveActions(layout523, "echo", "judge-stars"),
    resolveMay23Actions(layout523, "echo", "judge-stars")
  );
  assert.deepEqual(
    authoredRuntimeByScene["624"]?.resolveActions(layout624, "main"),
    resolveJune24Actions(layout624, "main")
  );
  assert.deepEqual(
    authoredRuntimeByScene["624"]?.resolveActions(layout624, "echo", "xiaoba-memory"),
    resolveJune24Actions(layout624, "echo", "xiaoba-memory")
  );
});

test("Scene 624 retains three distinct physical, anchor, and semantic Echo routes", async () => {
  const { authoredRuntimeByScene } = await loadRegistry();
  const runtime = authoredRuntimeByScene["624"];
  assert.ok(runtime);

  const physicalInteractionIds = ["carrot-milk-memory", "five-cent-memory", "xiaoba-memory"];
  const anchorIds = physicalInteractionIds.map((id) => runtime.echoAnchors[id]);
  const semanticEchoIds = physicalInteractionIds.map((id) => runtime.echoPortraitIds?.[id]);
  assert.equal(new Set(physicalInteractionIds).size, 3);
  assert.equal(new Set(anchorIds).size, 3);
  assert.equal(new Set(semanticEchoIds).size, 3);
  assert.deepEqual(anchorIds, ["carrot-milk-residue", "five-cent-residue", "xiaoba-residue"]);
  assert.deepEqual(semanticEchoIds, ["june24-angela-st-echo", "june24-room-study-echo", "june24-haircut-echo"]);
  assert.equal(runtime.echoPortraitDialogues?.["june24-angela-st-echo"], june24EchoDialogues["june24-angela-st-echo"]);
  assert.equal(runtime.echoPortraitDialogues?.["june24-room-study-echo"], june24EchoDialogues["june24-room-study-echo"]);
  assert.equal(runtime.echoPortraitDialogues?.["june24-haircut-echo"], june24EchoDialogues["june24-haircut-echo"]);
});

test("624 keeps its existing single-portrait authored runtime fields", async () => {
  const { authoredRuntimeByScene } = await loadRegistry();
  const runtime = authoredRuntimeByScene["624"];
  assert.deepEqual(runtime?.echoPortraitIds?.["carrot-milk-memory"], "june24-angela-st-echo");
  assert.equal(runtime?.portraitSequences, undefined);
});

test("authored Echo availability is resolved per interaction and main completion", async () => {
  const { authoredEchoIsAvailable } = await loadRegistry();
  const runtime = {
    echoRequiresMainCompletion: false,
    echoAvailability: {
      "bed-night-memory": { requiresMainCompletion: true },
      "door-arrival": { requiresMainCompletion: false }
    }
  };

  assert.equal(authoredEchoIsAvailable(runtime, "bed-night-memory", false), false);
  assert.equal(authoredEchoIsAvailable(runtime, "bed-night-memory", true), true);
  assert.equal(authoredEchoIsAvailable(runtime, "door-arrival", false), true);
  assert.equal(authoredEchoIsAvailable(runtime, "unknown-echo", false), true);
});

test("importing AuthoredChapterRegistry does not mutate fixture data", async () => {
  const before = {
    april05Chapter: structuredClone(april05Chapter),
    april05Assets: structuredClone(april05Assets),
    april05ReflectionChoices: structuredClone(april05ReflectionChoices),
    april06Chapter: structuredClone(april06Chapter),
    may23Chapter: structuredClone(may23Chapter),
    june24Chapter: structuredClone(june24Chapter),
    june24EchoDialogues: structuredClone(june24EchoDialogues)
  };
  await loadRegistry();
  assert.deepEqual(april05Chapter, before.april05Chapter);
  assert.deepEqual(april05Assets, before.april05Assets);
  assert.deepEqual(april05ReflectionChoices, before.april05ReflectionChoices);
  assert.deepEqual(april06Chapter, before.april06Chapter);
  assert.deepEqual(may23Chapter, before.may23Chapter);
  assert.deepEqual(june24Chapter, before.june24Chapter);
  assert.deepEqual(june24EchoDialogues, before.june24EchoDialogues);
});

test("ChapterRegistry remains the separate Forest identity and routing registry", () => {
  assert.equal(chapterRegistry["april05-come-down"], april05Chapter);
  assert.equal(chapterRegistry["april06-not-gone-yet"], april06Chapter);
  assert.equal(chapterRegistry["may23-i-arrived"], may23Chapter);
  assert.equal(chapterRegistry["june24-only-came-for-you"], june24Chapter);
  for (const chapter of [april05Chapter, april06Chapter, may23Chapter, june24Chapter]) {
    const entry = forestEntries.find((candidate) => candidate.chapterId === chapter.id);
    assert.ok(entry);
    assert.equal(routeForestEntry(entry!).kind, "implemented-chapter");
  }
});

test("app consumes the extracted registry without owning its authored registration object", () => {
  const appSource = readFileSync(join("src", "app.ts"), "utf8");
  assert.match(appSource, /AuthoredChapterRegistry\.js/);
  assert.match(appSource, /authoredRuntimeByScene/);
  assert.doesNotMatch(appSource, /const authoredRuntimeByScene/);
});

test("authored runtime definitions do not share mutable registration objects across scenes", async () => {
  const { authoredRuntimeByScene } = await loadRegistry();
  const definitions = Object.values(authoredRuntimeByScene);
  assert.equal(new Set(definitions).size, definitions.length);
  assert.equal(new Set(definitions.map((definition) => definition.echoAnchors)).size, definitions.length);
  assert.notEqual(authoredRuntimeByScene["405"]?.echoAnchors, authoredRuntimeByScene["523"]?.echoAnchors);
  assert.notEqual(authoredRuntimeByScene["405"]?.reflectionChoices, authoredRuntimeByScene["406"]?.reflectionChoices);
});
