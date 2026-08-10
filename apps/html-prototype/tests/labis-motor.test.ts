import assert from "node:assert/strict";
import test from "node:test";
import { labisMotorChapter } from "../src/fixtures/labisMotorChapter.js";
import { canStartLabisMotorMemory, labisDiaryMemorySpot, labisInteractionForPoint, labisMemoryTriggers, labisMotorMemoryActions } from "../src/fixtures/labisMotorMemory.js";
import { chapterRegistry, forestEntries, routeForestEntry } from "../src/systems/ChapterRegistry.js";
import { CutsceneSystem } from "../src/systems/CutsceneSystem.js";
import { activeMemoryTrigger } from "../src/systems/MemoryTrigger.js";
import { SaveManager } from "../src/systems/SaveManager.js";
import { emptyTendencies } from "../src/systems/TendencySystem.js";

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
  assert.equal(door.title.includes("motor"), true);
  assert.equal(chapterRegistry["labis-motor-day"].runtimeScene, "labis");
  assert.equal(chapterRegistry["labis-motor-day"].location, "Labis");
  assert.equal(routeForestEntry(door).kind, "implemented-chapter");
});

test("labis memory trigger respects once-completed events", () => {
  const trigger = labisMemoryTriggers[0];
  assert.equal(activeMemoryTrigger({ x: trigger.rect.x + 20, y: trigger.rect.y + 20 }, labisMemoryTriggers, new Set())?.eventId, "july19-motor-learning");
  assert.equal(activeMemoryTrigger({ x: trigger.rect.x + 20, y: trigger.rect.y + 20 }, labisMemoryTriggers, new Set(["july19-motor-learning"])), null);
});

test("labis motor trigger requires the diary memory to be read first", () => {
  const trigger = labisMemoryTriggers[0];
  assert.equal(canStartLabisMotorMemory({ x: trigger.rect.x + 20, y: trigger.rect.y + 20 }, new Set(), new Set()), false);
  assert.equal(canStartLabisMotorMemory({ x: trigger.rect.x + 20, y: trigger.rect.y + 20 }, new Set(["labis-motor-day"]), new Set()), true);
});

test("labis diary memory remains repeatable and is not covered by the motor trigger", () => {
  const point = { x: labisDiaryMemorySpot.x, y: labisDiaryMemorySpot.y };

  assert.equal(labisInteractionForPoint(point, new Set(), new Set()), "diary memory");
  assert.equal(labisInteractionForPoint(point, new Set(["labis-motor-day"]), new Set()), "diary memory");
  assert.equal(canStartLabisMotorMemory(point, new Set(["labis-motor-day"]), new Set()), false);
});

test("labis chapter offers multiple philosophical reflection endings", () => {
  assert.ok(labisMotorChapter.dialogue.some((node) => (node.choices?.length ?? 0) >= 3));
  assert.ok(labisMotorChapter.reflectionQuotes.length >= 3);
});

test("labis cutscene reaches ET dialogue and completes after acknowledgement", () => {
  const cutscene = new CutsceneSystem(labisMotorMemoryActions);
  for (let i = 0; i < 600 && !cutscene.currentDialogue; i += 1) cutscene.update(1 / 30);

  assert.equal(cutscene.currentDialogue?.speaker, "ET");
  assert.equal(cutscene.currentDialogue?.text, "单凭这一点，没有白来。");
  assert.equal(cutscene.actors.has("motor"), true);

  cutscene.advanceDialogue();
  cutscene.update(1 / 30);
  assert.equal(cutscene.currentDialogue?.speaker, "Memory");
  cutscene.advanceDialogue();
  for (let i = 0; i < 120 && !cutscene.completed; i += 1) cutscene.update(1 / 30);

  assert.equal(cutscene.completed, true);
  assert.equal(cutscene.actors.size, 0);
});

test("journey save preserves completed labis memory events", () => {
  installStorage();
  const manager = new SaveManager();
  manager.saveJourney({
    version: 1,
    savedAt: "now",
    scene: "labis",
    player: { x: 760, y: 560 },
    visitedMemories: ["labis-motor"],
    walkedThroughMemories: ["labis-motor-day"],
    choices: [],
    tendencies: emptyTendencies(),
    readMemories: ["july19-motor-learning"],
    completedMemoryEvents: ["july19-motor-learning"],
    room: { visits: 0, reflections: [] },
    finalJourney: []
  });

  assert.deepEqual(manager.loadJourney()?.completedMemoryEvents, ["july19-motor-learning"]);
  assert.equal(labisMotorChapter.canonicalClosure.historicalEventId, "july19-motor-learning");
});
