import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { RoomLifeDirector, chooseRoomLifeDecision, roomLifeDecisionWeights } from "../src/systems/room-life/RoomLifeDirector.js";
import type { SceneLayout } from "../src/systems/SceneLayouts.js";

const layout = JSON.parse(readFileSync("public/scene-layouts/muji-room/landscape.json", "utf8")) as SceneLayout;

function input(overrides: Partial<Parameters<RoomLifeDirector["update"]>[0]> = {}): Parameters<RoomLifeDirector["update"]>[0] {
  return {
    now: 0,
    dt: 0.1,
    position: { ...layout.anchors["life-center"] },
    layout,
    blocked: false,
    playerIntent: false,
    weatherCondition: null,
    musicPlaying: false,
    night: false,
    lampOn: true,
    ...overrides
  };
}

test("player input immediately cancels autonomous movement and thought", () => {
  const director = new RoomLifeDirector({ random: () => 0 });
  director.update(input({ now: 20_000 }));
  const autonomous = director.update(input({ now: 25_000 }));
  assert.notEqual(autonomous.mode, "player");
  const takenOver = director.update(input({ now: 25_001, playerIntent: true, position: { x: 432, y: 287 } }));
  assert.equal(takenOver.mode, "player");
  assert.equal(takenOver.moving, false);
  assert.equal(takenOver.thought, null);
});

test("director emits movement intention without mutating world position", () => {
  const director = new RoomLifeDirector({ random: () => 0.8 });
  const position = { ...layout.anchors["life-center"] };
  director.update(input({ now: 20_000, position }));
  const frame = director.update(input({ now: 40_000, position }));
  assert.equal(position.x, layout.anchors["life-center"].x);
  assert.equal(position.y, layout.anchors["life-center"].y);
  assert.ok(Math.abs(frame.movement.x) <= 1);
  assert.ok(Math.abs(frame.movement.y) <= 1);
});

test("stopping autonomous movement preserves the current facing contract", () => {
  const director = new RoomLifeDirector({ random: () => 0 });
  const walking = director.update(input({ now: 20_000 }));
  const stopped = director.update(input({ now: 20_001, playerIntent: true }));
  assert.equal(walking.facing === undefined || typeof walking.facing === "string", true);
  assert.equal(stopped.facing, undefined);
});

test("destination activity exposes an authored arrival-facing direction", () => {
  const director = new RoomLifeDirector({ random: () => 0 });
  const frame = director.update(input({ now: 9_000, position: { ...layout.anchors["life-window"] } }));
  assert.equal(frame.mode, "autonomous-activity");
  assert.equal(frame.activity, "window-watch");
  assert.equal(frame.facing, "up");
});

test("thought timing stays deterministic and bubbles never appear during player control", () => {
  const director = new RoomLifeDirector({ random: () => 0.5 });
  const before = director.update(input({ now: 0 }));
  const entered = director.update(input({ now: 9_000 }));
  const thought = director.update(input({ now: 12_000 }));
  const dismissed = director.update(input({ now: 12_001, playerIntent: true }));
  assert.equal(before.thought, null);
  assert.equal(entered.mode === "player", false);
  assert.equal(typeof thought.thought, "string");
  assert.equal(dismissed.thought, null);
});

test("context weighting makes rain, music, and night lamp more likely without forcing an action", () => {
  const clear = roomLifeDecisionWeights({ weatherCondition: null, musicPlaying: false, night: false, lampOn: false });
  const rain = roomLifeDecisionWeights({ weatherCondition: "rain", musicPlaying: false, night: false, lampOn: false });
  const music = roomLifeDecisionWeights({ weatherCondition: null, musicPlaying: true, night: false, lampOn: false });
  const bedside = roomLifeDecisionWeights({ weatherCondition: null, musicPlaying: false, night: true, lampOn: true });
  assert.ok(rain["life-window"] > clear["life-window"]);
  assert.ok(music["life-records"] > clear["life-records"]);
  assert.ok(bedside["life-bedside"] > clear["life-bedside"]);
  assert.ok(rain["do-nothing"] > 0);
  assert.ok(chooseRoomLifeDecision({ weatherCondition: "rain", musicPlaying: false, night: false, lampOn: false }, () => 0) === "do-nothing");
});

test("nearby graph entry begins activity without forcing a return to center", () => {
  const director = new RoomLifeDirector({ random: () => 0 });
  const frame = director.update(input({ now: 9_000, position: { ...layout.anchors["life-window"] } }));
  assert.equal(frame.mode, "autonomous-activity");
  assert.equal(frame.destination, "life-window");
  assert.equal(frame.activity, "window-watch");
  assert.equal(frame.moving, false);
});

test("blocked panels pause movement and restart the idle delay on close", () => {
  const director = new RoomLifeDirector({ random: () => 0 });
  const paused = director.update(input({ now: 20_000, blocked: true }));
  const resumed = director.update(input({ now: 20_001, blocked: false }));
  assert.equal(paused.mode, "paused");
  assert.equal(paused.moving, false);
  assert.equal(resumed.mode, "player");
  assert.equal(resumed.moving, false);
});

test("a route that stops making progress returns to autonomous idle", () => {
  const randomValues = [0, 0, 0.99, 0, 0, 0];
  const director = new RoomLifeDirector({ random: () => randomValues.shift() ?? 0 });
  const position = { ...layout.anchors["life-waypoint-upper"] };
  director.update(input({ now: 9_000, position }));
  director.update(input({ now: 20_000, position }));
  const walking = director.update(input({ now: 20_100, position }));
  const stalled = director.update(input({ now: 21_700, dt: 1.6, position }));
  assert.equal(walking.mode, "autonomous-walk");
  assert.equal(walking.moving, true);
  assert.equal(stalled.mode, "autonomous-idle");
  assert.equal(stalled.moving, false);
});

test("failed graph entry retries on a bounded cooldown instead of every frame", () => {
  const blockedLayout: SceneLayout = {
    ...layout,
    size: { w: 600, h: 500 },
    obstacles: [{ x: 100, y: 200, w: 100, h: 100 }],
    anchors: Object.fromEntries([
      "life-center", "life-window", "life-records", "life-bedside", "life-waypoint-upper", "life-waypoint-window", "life-waypoint-records"
    ].map((id) => [id, { x: 300, y: 250 }]))
  } as SceneLayout;
  const openLayout = { ...blockedLayout, obstacles: [] };
  const director = new RoomLifeDirector({ random: () => 0 });
  const position = { x: 20, y: 250 };
  const failed = director.update(input({ now: 9_000, position, layout: blockedLayout }));
  const tooSoon = director.update(input({ now: 9_001, position, layout: openLayout }));
  const retried = director.update(input({ now: 12_001, position, layout: openLayout }));
  assert.equal(failed.mode, "autonomous-idle");
  assert.equal(tooSoon.mode, "autonomous-idle");
  assert.equal(retried.mode, "autonomous-activity");
  assert.deepEqual(position, { x: 20, y: 250 });
});

test("anti-stagnation nudges decisions after repeated idle outcomes but remains capped", () => {
  const clear = { weatherCondition: null, musicPlaying: false, night: false, lampOn: false } as const;
  const normal = roomLifeDecisionWeights(clear, 0);
  const repeated = roomLifeDecisionWeights(clear, 3);
  const capped = roomLifeDecisionWeights(clear, 100);
  assert.ok(repeated["do-nothing"] < normal["do-nothing"]);
  assert.ok(repeated["do-nothing"] > 0);
  assert.ok(repeated["life-window"] > normal["life-window"]);
  assert.deepEqual(capped, roomLifeDecisionWeights(clear, 5));
});

test("bubble typography is based on screen scale and uses strong readable styling", () => {
  const appSource = readFileSync("src/app.ts", "utf8");
  assert.match(appSource, /getBoundingClientRect\(\)\.width/);
  assert.match(appSource, /15 \* canvasToScreen/);
  assert.match(appSource, /rgba\(255, 248, 226, \.96\)/);
  assert.match(appSource, /fontWeight = "600"/);
});

test("Room Life state is session-only and does not alter persistence model declarations", () => {
  const appSource = readFileSync("src/app.ts", "utf8");
  const typesSource = readFileSync("src/types.ts", "utf8");
  assert.doesNotMatch(appSource.slice(appSource.indexOf("private makeJourney"), appSource.indexOf("private applyDiaryLibrary")), /roomLife|RoomLife/);
  assert.doesNotMatch(typesSource, /RoomLife/);
});
