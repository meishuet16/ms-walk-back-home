import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";
import { getSceneLayout, loadSceneLayoutOverrides, setSceneLayout } from "../src/systems/SceneLayouts.js";
import { makeDiaryEntry } from "../src/systems/DiaryImport.js";
import { makeTimelineMonthView, selectedOrLatestMonth, selectAllTimelineEntryIds } from "../src/systems/JournalModel.js";

const appSource = readFileSync("src/app.ts", "utf8");
const inputSource = readFileSync("src/systems/InputManager.ts", "utf8");
const stylesSource = readFileSync("src/styles.css", "utf8");
const buildSource = readFileSync("scripts/build.mjs", "utf8");

test("fullscreen touch controls mount once inside the fullscreen gameplay shell", () => {
  assert.match(appSource, /this\.input\.mountTouchControls\(\(\) => this\.interact\(\),\s*root\.querySelector<HTMLElement>\("\.game-shell"\)/);
  assert.doesNotMatch(inputSource, /this\.root\.append\(wrap\)/);
  assert.match(inputSource, /mountParent\.append\(wrap\)/);
  assert.equal((inputSource.match(/className = "touch-controls"/g) ?? []).length, 1);
  assert.match(stylesSource, /\.game-shell:fullscreen[\s\S]*\.touch-controls/);
});

test("normal gameplay never turns a held joystick or A button into draggable UI", () => {
  assert.doesNotMatch(inputSource, /dragTimer|dragControl|setTimeout\(|240/);
  assert.doesNotMatch(inputSource, /prepareTouchControlDrag|moveTouchControl|finishTouchControlDrag/);
  assert.match(inputSource, /pointercancel/);
  assert.match(inputSource, /this\.touch = \{ x: 0, y: 0 \}/);
  assert.match(appSource, /Edit Touch Controls/);
  assert.match(appSource, /Save Touch Controls/);
  assert.match(appSource, /Cancel Touch Control Editing/);
  assert.match(appSource, /Reset to Default/);
  assert.match(inputSource, /touchControlStorageKey = "walk-back-home-touch-controls"/);
});

test("Walk Back Home and Forest keep separate menu routes", () => {
  assert.match(appSource, /if \(action === "open-map"\) this\.showMap\(\)/);
  assert.match(appSource, /if \(action === "forest"\) \{\s*this\.returnToForest\(\);\s*\}/);
});

test("hamburger visibility is derived from gameplay scene and overlay state", () => {
  assert.match(appSource, /isGameplayScene/);
  assert.match(appSource, /syncGameplayChromeVisibility/);
  assert.match(appSource, /dataset\.gameplayHamburger/);
  assert.match(stylesSource, /\.gameplay-hamburger-hidden/);
});

test("production build copies authored scene layouts to the runtime URL", () => {
  assert.match(buildSource, /resolve\(root, "dist\/scene-layouts"\)/);
  const required = [
    "scene-layouts/manifest.json",
    "scene-layouts/forest/portrait.json",
    "scene-layouts/muji-room/portrait.json",
    "scene-layouts/bakery/portrait.json",
    "scene-layouts/labis/portrait.json"
  ];
  for (const relative of required) {
    assert.equal(existsSync(join("dist", relative)), true, "missing dist/" + relative);
  }
});

test("committed portrait overrides load authored fields instead of empty defaults", async () => {
  const originalFetch = globalThis.fetch;
  const originalLayouts = new Map([
    ["forest", getSceneLayout("forest", "portrait")],
    ["muji-room", getSceneLayout("muji-room", "portrait")],
    ["bakery", getSceneLayout("bakery", "portrait")],
    ["labis", getSceneLayout("labis", "portrait")]
  ]);
  const manifest = readFileSync("public/scene-layouts/manifest.json", "utf8");
  globalThis.fetch = (async (input: string | URL | Request) => {
    const url = String(input).split("?")[0];
    const source = url.endsWith("manifest.json")
      ? manifest
      : readFileSync(join("public", url), "utf8");
    return new Response(source, { status: 200 });
  }) as typeof fetch;
  try {
    await loadSceneLayoutOverrides();
    const muji = getSceneLayout("muji-room", "portrait");
    assert.notDeepEqual(muji.spawn, { x: 470.5, y: 836 });
    assert.ok(muji.obstacles.length > 0);
    assert.deepEqual(muji.interactions.map((item) => item.id), ["door", "lamp", "journal", "window", "records", "residue", "reflection"]);
    assert.ok(getSceneLayout("forest", "portrait").obstacles.length > 0);
    assert.ok(getSceneLayout("bakery", "portrait").interactions.length > 0);
    assert.ok(getSceneLayout("labis", "portrait").triggers.length > 0);
  } finally {
    globalThis.fetch = originalFetch;
    for (const [sceneId, layout] of originalLayouts) setSceneLayout(layout);
  }
});

test("Select All selects every entry in the filtered result, not only the first page", () => {
  const entries = Array.from({ length: 8 }, (_, index) => makeDiaryEntry(
    "2026-07-" + String(index + 1).padStart(2, "0"),
    "Entry " + (index + 1),
    index % 2 === 0 ? "keep" : "skip",
    "entry-" + (index + 1)
  ));
  const month = selectedOrLatestMonth(entries, "2026-07");
  const filtered = makeTimelineMonthView(month, "date-desc", "keep");
  assert.deepEqual(selectAllTimelineEntryIds(filtered), filtered.entries.map((entry) => entry.id));
  assert.equal(selectAllTimelineEntryIds(filtered).length, 4);
});
