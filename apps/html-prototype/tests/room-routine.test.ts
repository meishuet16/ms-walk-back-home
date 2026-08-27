import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  findRoomLifeEntry,
  resolveRoomLifeAnchors,
  roomLifeActivityFor,
  roomLifeRoute,
  roomLifeRouteFromNode,
  roomLifeRouteIsSafe,
  roomLifeSegmentIsSafe,
  type RoomLifeDestinationId,
  type RoomLifeNodeId
} from "../src/systems/room-life/RoomRoutine.js";
import type { SceneLayout } from "../src/systems/SceneLayouts.js";

function fixture(orientation: "landscape" | "portrait"): SceneLayout {
  return JSON.parse(readFileSync(`public/scene-layouts/muji-room/${orientation}.json`, "utf8")) as SceneLayout;
}

test("Room Life resolves every authored destination and waypoint from the active layout", () => {
  for (const orientation of ["landscape", "portrait"] as const) {
    const anchors = resolveRoomLifeAnchors(fixture(orientation));
    assert.ok(anchors);
    assert.equal(anchors["life-center"].x, fixture(orientation).anchors["life-center"].x);
    assert.equal(anchors["life-window"].y, fixture(orientation).anchors["life-window"].y);
  }
});

test("portrait and landscape Room Life coordinates remain orientation-specific", () => {
  const landscape = resolveRoomLifeAnchors(fixture("landscape"));
  const portrait = resolveRoomLifeAnchors(fixture("portrait"));
  assert.ok(landscape && portrait);
  assert.notDeepEqual(landscape, portrait);
  assert.notEqual(landscape["life-window"].y, portrait["life-window"].y);
});

test("waypoints are navigation-only and never resolve to activities", () => {
  for (const node of ["life-waypoint-upper", "life-waypoint-window", "life-waypoint-records"] as const) {
    assert.equal(roomLifeActivityFor(node as RoomLifeNodeId), null);
  }
  for (const destination of ["life-center", "life-window", "life-records", "life-bedside"] as const) {
    assert.notEqual(roomLifeActivityFor(destination as RoomLifeDestinationId), null);
  }
});

test("explicit destination routes use only the authored waypoint graph", () => {
  assert.deepEqual(roomLifeRoute("life-center", "life-window"), [
    "life-center", "life-waypoint-upper", "life-waypoint-window", "life-window"
  ]);
  assert.deepEqual(roomLifeRoute("life-center", "life-records"), [
    "life-center", "life-waypoint-upper", "life-waypoint-records", "life-records"
  ]);
  assert.deepEqual(roomLifeRoute("life-center", "life-bedside"), [
    "life-center", "life-waypoint-upper", "life-bedside"
  ]);
  assert.deepEqual(roomLifeRoute("life-window", "life-center"), [
    "life-window", "life-waypoint-window", "life-waypoint-upper", "life-center"
  ]);
  assert.deepEqual(roomLifeRoute("life-window", "life-records"), [
    "life-window", "life-waypoint-window", "life-waypoint-upper", "life-center",
    "life-waypoint-upper", "life-waypoint-records", "life-records"
  ]);
  assert.deepEqual(roomLifeRouteFromNode("life-waypoint-window", "life-records"), [
    "life-waypoint-window", "life-waypoint-upper", "life-center", "life-waypoint-upper",
    "life-waypoint-records", "life-records"
  ]);
});

test("authored route segments are safe in both orientations", () => {
  for (const orientation of ["landscape", "portrait"] as const) {
    const layout = fixture(orientation);
    for (const destination of ["life-window", "life-records", "life-bedside"] as const) {
      const route = roomLifeRoute("life-center", destination);
      assert.ok(route);
      assert.equal(roomLifeRouteIsSafe(route, layout), true, `${orientation} route to ${destination}`);
    }
  }
});

test("graph entry accepts a nearby destination and rejects an unsafe position", () => {
  const layout = fixture("landscape");
  assert.equal(findRoomLifeEntry(layout.anchors["life-window"], layout), "life-window");
  assert.equal(findRoomLifeEntry({ x: 250, y: 130 }, layout), null);
});

test("graph entry accepts a farther collision-safe node without a 96-unit cutoff", () => {
  const layout: SceneLayout = {
    ...fixture("landscape"),
    size: { w: 600, h: 500 },
    obstacles: [],
    anchors: {
      "life-center": { x: 300, y: 250 },
      "life-window": { x: 300, y: 150 },
      "life-records": { x: 450, y: 250 },
      "life-bedside": { x: 150, y: 250 },
      "life-waypoint-upper": { x: 300, y: 200 },
      "life-waypoint-window": { x: 300, y: 175 },
      "life-waypoint-records": { x: 400, y: 200 }
    }
  };
  const position = { x: 20, y: 250 };
  assert.ok(Math.hypot(position.x - layout.anchors["life-bedside"].x, position.y - layout.anchors["life-bedside"].y) > 96);
  assert.equal(findRoomLifeEntry(position, layout), "life-bedside");
});

test("blocked graph-entry segments remain rejected", () => {
  const layout: SceneLayout = {
    ...fixture("landscape"),
    size: { w: 600, h: 500 },
    obstacles: [{ x: 100, y: 200, w: 100, h: 100 }],
    anchors: {
      "life-center": { x: 300, y: 250 },
      "life-window": { x: 300, y: 250 },
      "life-records": { x: 300, y: 250 },
      "life-bedside": { x: 300, y: 250 },
      "life-waypoint-upper": { x: 300, y: 250 },
      "life-waypoint-window": { x: 300, y: 250 },
      "life-waypoint-records": { x: 300, y: 250 }
    }
  };
  const position = { x: 20, y: 250 };
  assert.equal(roomLifeSegmentIsSafe(position, layout.anchors["life-center"], layout), false);
  assert.equal(findRoomLifeEntry(position, layout), null);
});

test("missing Room Life anchors fail safely", () => {
  const layout = fixture("landscape");
  delete layout.anchors["life-window"];
  assert.equal(resolveRoomLifeAnchors(layout), null);
  assert.equal(roomLifeRouteIsSafe(null, layout), false);
});
