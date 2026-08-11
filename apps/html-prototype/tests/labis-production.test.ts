import assert from "node:assert/strict";
import test from "node:test";
import { labisMotorChapter } from "../src/fixtures/labisMotorChapter.js";
import { labisAssetManifest, labisAssetPath, labisProductionAssetPaths } from "../src/fixtures/labisAssetRegistry.js";
import { labisChoicePoints, labisEchoes, labisReflectionTieBreakOrder, resolveLabisMemoryReflection } from "../src/fixtures/labisMemoryEchoes.js";
import { emptyTendencies } from "../src/systems/TendencySystem.js";

test("labis production assets are referenced semantically and stay local-only paths", () => {
  assert.equal(labisAssetPath("et", "ride_happy"), "assets/labis/et-motor-happy.png");
  assert.equal(labisAssetPath("et", "photo_smug"), "assets/labis/et-photo-smugs.png");
  assert.equal(labisAssetPath("et", "haircut_happy"), "assets/labis/et-haircut.png");
  assert.equal(labisAssetPath("ms", "confused"), "assets/labis/ms-confuse.png");
  assert.equal(labisAssetPath("prop", "chicken_porridge"), "assets/labis/props/chicken-porridge.png");
  assert.equal(labisAssetPath("prop", "fried_noodles"), "assets/labis/props/fried-noodles.png");
  assert.equal(labisAssetPath("prop", "badminton"), "assets/labis/props/badminton.png");
  assert.equal(labisAssetPath("prop", "missing"), undefined);
  assert.ok(labisProductionAssetPaths.every((path) => path.startsWith("assets/labis/")));
  assert.ok(labisProductionAssetPaths.includes(labisAssetManifest.chickenCake));
});

test("labis chapter identity uses the July 19 authored title and canonical motor closure", () => {
  assert.equal(labisMotorChapter.id, "labis-motor-day");
  assert.equal(labisMotorChapter.date, "2026-07-19");
  assert.equal(labisMotorChapter.title, "07.19 · 单凭这一点，没有白来");
  assert.equal(labisMotorChapter.location, "Labis, Johor");
  assert.equal(labisMotorChapter.weather, "Sunny");
  assert.equal(labisMotorChapter.canonicalClosure.historicalEventId, "july19-motor-learning");
});

test("labis memory echoes keep distinct presentation levels instead of text terminals", () => {
  assert.deepEqual(labisEchoes.map((echo) => [echo.id, echo.presentation]), [
    ["july19-photo-threat", "secondary-echo"],
    ["july19-chicken-porridge", "visual-echo"],
    ["july19-fried-noodles", "visual-echo"],
    ["july19-haircut", "visual-echo"],
    ["july19-kancil", "environmental-trace"],
    ["july19-badminton", "environmental-trace"],
    ["july19-filter-evening", "secondary-visual-echo"],
    ["july19-chicken-cake", "hidden-keyframe"]
  ]);
  assert.equal(labisEchoes.find((echo) => echo.id === "july19-kancil")?.usesExistingMapVehicle, true);
  assert.equal(labisEchoes.find((echo) => echo.id === "july19-fried-noodles")?.requires?.[0], "july19-chicken-porridge");
});

test("labis memory echoes remain replayable and use readable discovery anchors", () => {
  assert.ok(labisEchoes.every((echo) => echo.repeatable));
  const kancil = labisEchoes.find((echo) => echo.id === "july19-kancil");
  assert.ok(kancil);
  assert.equal(kancil.usesExistingMapVehicle, true);
  assert.ok(kancil.x >= 1160 && kancil.x <= 1320);
  assert.ok(kancil.y >= 220 && kancil.y <= 340);
  assert.ok(kancil.radius >= 120);
  const filter = labisEchoes.find((echo) => echo.id === "july19-filter-evening");
  assert.ok(filter);
  assert.ok(filter.radius >= 145);
  assert.equal(filter.tell, "paper");
});

test("labis choice points expose interpretation choices without stat labels", () => {
  assert.deepEqual(labisChoicePoints.map((point) => [point.id, point.prompt, point.choices.length]), [
    ["motor", "这一幕，你想记住什么？", 3],
    ["photo", "这种画面，要怎么收进记忆里？", 3],
    ["filter", "这样的普通，要怎么记住？", 3]
  ]);
  assert.ok(labisChoicePoints.every((point) => point.choices.every((choice) => !/[+]\d|Good|Bad|Romantic|Platonic/i.test(choice.label))));
});

test("labis memory reflection resolves by tendencies with deterministic tie break", () => {
  assert.deepEqual(labisReflectionTieBreakOrder, ["acceptance", "companionship", "distance", "closeness"]);
  assert.equal(resolveLabisMemoryReflection({ ...emptyTendencies(), acceptance: 2, honesty: 2 }).id, "labis-reflection-acceptance");
  assert.equal(resolveLabisMemoryReflection({ ...emptyTendencies(), companionship: 2, closeness: 2 }).id, "labis-reflection-companionship");
  assert.equal(resolveLabisMemoryReflection({ ...emptyTendencies(), distance: 2, acceptance: 2 }).id, "labis-reflection-letting-go");
  assert.equal(resolveLabisMemoryReflection({ ...emptyTendencies(), closeness: 2, intervention: 2 }).id, "labis-reflection-not-ready");
  assert.equal(resolveLabisMemoryReflection({ ...emptyTendencies(), acceptance: 1, companionship: 1 }).id, "labis-reflection-acceptance");
});
