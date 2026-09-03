import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { labisMotorChapter } from "../src/fixtures/labisMotorChapter.js";
import { canStartLabisMotorMemory, labisDiaryMemorySpot, labisInteractionForPoint, labisMemoryTriggers, labisMotorMemoryActions } from "../src/fixtures/labisMotorMemory.js";
import { chapterRegistry, forestEntries, routeForestEntry } from "../src/systems/ChapterRegistry.js";
import { CutsceneSystem } from "../src/systems/CutsceneSystem.js";
import { activeMemoryTrigger } from "../src/systems/MemoryTrigger.js";
import { SaveManager } from "../src/systems/SaveManager.js";
import { emptyTendencies } from "../src/systems/TendencySystem.js";
import { labisChoicePoints, labisEchoes, resolveLabisMemoryReflection } from "../src/fixtures/labisMemoryEchoes.js";

const appSource = readFileSync(new URL("../../src/app.ts", import.meta.url), "utf8");

class MemoryStorage {
  private values = new Map<string, string>();

  getItem(key: string): string | null {
    return this.values.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.values.set(key, value);
  }

  removeItem(key: string): void {
    this.values.delete(key);
  }
}

function installStorage(): void {
  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    value: new MemoryStorage()
  });
}

test("labis motor day is registered as a labis runtime chapter", () => {
  const door = forestEntries.find((entry) => entry.chapterId === "labis-motor-day");
  assert.ok(door);
  assert.equal(door.title, "719");
  assert.equal(chapterRegistry["labis-motor-day"].runtimeScene, "labis");
  assert.equal(chapterRegistry["labis-motor-day"].location, "Labis, Johor");
  assert.equal(routeForestEntry(door).kind, "implemented-chapter");
});

test("labis memory trigger remains available after historical completion", () => {
  const trigger = labisMemoryTriggers[0];
  assert.equal(activeMemoryTrigger({ x: trigger.rect.x + 20, y: trigger.rect.y + 20 }, labisMemoryTriggers, new Set())?.eventId, "july19-motor-learning");
  assert.equal(activeMemoryTrigger({ x: trigger.rect.x + 20, y: trigger.rect.y + 20 }, labisMemoryTriggers, new Set(["july19-motor-learning"]))?.eventId, "july19-motor-learning");
});

test("labis motor trigger can start from quiet exploration without forcing diary first", () => {
  const trigger = labisMemoryTriggers[0];
  assert.equal(canStartLabisMotorMemory({ x: trigger.rect.x + 20, y: trigger.rect.y + 20 }, false, false), true);
  assert.equal(canStartLabisMotorMemory({ x: trigger.rect.x + 20, y: trigger.rect.y + 20 }, true, true), true);
});

test("labis diary memory remains repeatable and is not covered by the motor trigger", () => {
  const point = { x: labisDiaryMemorySpot.x, y: labisDiaryMemorySpot.y };

  assert.equal(labisInteractionForPoint(point, false, false), "diary memory");
  assert.equal(labisInteractionForPoint(point, true, true), "diary memory");
  assert.equal(canStartLabisMotorMemory(point, true, true), false);
});

test("Labis photo manual and last-night echoes do not require motor completion", () => {
  for (const id of ["july19-photo-threat", "july19-filter-evening", "july19-chicken-cake"]) {
    const echo = labisEchoes.find((item) => item.id === id);
    assert.ok(echo);
    assert.equal(echo?.requires?.includes("july19-motor-learning") ?? false, false);
  }
});

test("Labis ending reflection records only the current run", () => {
  const finishEchoStart = appSource.indexOf("private finishLabisEcho");
  const reflectionStart = appSource.indexOf("private showLabisMemoryReflection");
  const finishEcho = appSource.slice(finishEchoStart, reflectionStart);
  const reflection = appSource.slice(reflectionStart, appSource.indexOf("private closeLabisReflection", reflectionStart));

  assert.match(finishEcho, /this\.markCurrentChapterEchoDiscovered\("labis-motor-day", echo\.id\)/);
  assert.doesNotMatch(finishEcho, /commitChapterMemoryRunTendencies/);
  assert.doesNotMatch(reflection, /completeChapterMemoryRun/);
  assert.doesNotMatch(reflection, /this\.chapterMemoryRun\?\.eventId/);
});

test("labis chapter offers three interpretation choice points and four memory reflections", () => {
  assert.deepEqual(labisMotorChapter.dialogue.map((node) => node.id), ["labis-choice-motor", "labis-choice-photo", "labis-choice-filter"]);
  assert.deepEqual(labisMotorChapter.dialogue.map((node) => node.choices?.length), [3, 3, 3]);
  assert.deepEqual(labisChoicePoints.map((point) => point.choices.length), [3, 3, 3]);
  assert.equal(labisMotorChapter.reflectionQuotes.length, 4);
  assert.ok(labisMotorChapter.reflectionQuotes.every((quote) => quote.title === "Memory Reflection"));
});

test("labis final reflection uses hidden tendencies instead of good or bad labels", () => {
  const reflection = resolveLabisMemoryReflection({ ...emptyTendencies(), closeness: 2, intervention: 2 });
  assert.equal(reflection.id, "labis-reflection-not-ready");
  assert.equal(reflection.title, "Memory Reflection");
  assert.equal(reflection.lines.some((line) => /Good|Bad|True/.test(line)), false);
});

test("labis cutscene reaches ET dialogue and completes after acknowledgement", () => {
  const cutscene = new CutsceneSystem(labisMotorMemoryActions);
  for (let i = 0; i < 600 && !cutscene.currentDialogue; i += 1) cutscene.update(1 / 30);

  assert.equal(cutscene.currentDialogue?.speaker, "她");
  assert.equal(cutscene.currentDialogue?.text, "单凭这一点，没有白来。");
  assert.equal(cutscene.actors.has("motor"), true);

  cutscene.advanceDialogue();
  for (let i = 0; i < 120 && !cutscene.completed; i += 1) cutscene.update(1 / 30);

  assert.equal(cutscene.completed, true);
  assert.equal(cutscene.actors.size, 0);
});

test("legacy journey chapter progress is ignored by the new save loader", () => {
  installStorage();
  localStorage.setItem("walk-back-home:html-prototype:v2:journey", JSON.stringify({
    version: 1, savedAt: "now", scene: "labis", player: { x: 760, y: 560 },
    visitedMemories: ["labis-motor"], walkedThroughMemories: ["labis-motor-day"], choices: [],
    tendencies: emptyTendencies(), readMemories: ["july19-motor-learning"], completedMemoryEvents: ["july19-motor-learning"],
    room: { visits: 2, reflections: ["unrelated room state"] }, finalJourney: []
  }));
  const journey = new SaveManager().loadJourney();
  assert.equal("completedMemoryEvents" in (journey ?? {}), false);
  assert.equal(journey?.room.visits, 2);
  assert.deepEqual(journey?.room.reflections, ["unrelated room state"]);
  assert.equal(labisMotorChapter.canonicalClosure.historicalEventId, "july19-motor-learning");
});
