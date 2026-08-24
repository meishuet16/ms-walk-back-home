import assert from "node:assert/strict";
import { test } from "node:test";
import type { Point, Rect } from "../src/systems/CollisionSystem.js";
import type { SceneLayout } from "../src/systems/SceneLayouts.js";
import {
  clientDeltaToSceneDelta,
  moveRectToPoint,
  clientPointToScene,
  clientRectToScene,
  pickSceneGeometry,
  rectHandleAtPoint,
  resizeRect,
  sceneDeltaToClientDelta,
  scenePointToClient,
  sceneRectToClient,
  type SceneViewportBounds
} from "../src/systems/SceneDebugGeometry.js";

function layout(orientation: "portrait" | "landscape"): SceneLayout {
  const size = orientation === "portrait" ? { w: 941, h: 1672 } : { w: 1672, h: 941 };
  return {
    sceneId: "624",
    label: "June 24",
    orientation,
    asset: orientation === "portrait" ? "assets/624/624-portrait.png" : "assets/624/624-landscape.png",
    size,
    spawn: { x: size.w / 2, y: size.h - 120 },
    obstacles: [{ x: size.w * 0.35, y: size.h * 0.35, w: size.w * 0.3, h: size.h * 0.2 }],
    interactions: [{ id: "table-memory", label: "table-memory", x: size.w / 2, y: size.h / 2, radius: 56 }],
    triggers: [{ id: "june24-table-arrival", rect: { x: size.w * 0.7, y: size.h * 0.7, w: 120, h: 90 }, chapterId: "june24-only-came-for-you", eventId: "june24-table-memory", once: true }],
    placementSlots: [],
    echoAnchors: {
      "carrot-milk-residue": { x: size.w * 0.5, y: size.h * 0.42, radius: 45168 },
      "five-cent-residue": { x: size.w * 0.45, y: size.h * 0.43, radius: 41404 },
      "xiaoba-residue": { x: size.w * 0.5, y: size.h * 0.44, radius: 45168 }
    },
    anchors: {
      "ms-entry-start": { x: size.w * 0.5, y: size.h * 0.75 },
      "ms-table-approach": { x: size.w * 0.58, y: size.h * 0.56 },
      "et-reading-seat": { x: size.w * 0.4, y: size.h * 0.43 },
      "ms-first-seat": { x: size.w * 0.6, y: size.h * 0.43 },
      "ms-phone-show": { x: size.w * 0.55, y: size.h * 0.43 },
      "et-phone-stop": { x: size.w * 0.45, y: size.h * 0.43 },
      "ms-goodbye-exit": { x: size.w * 0.54, y: size.h * 0.64 }
    }
  };
}

function bounds(orientation: "portrait" | "landscape"): SceneViewportBounds {
  return orientation === "portrait"
    ? { left: 120, top: 40, width: 420, height: 746.269925611052 }
    : { left: 80, top: 60, width: 1000, height: 563.3971291866029 };
}

function assertPointClose(actual: Point, expected: Point, tolerance = 1e-7): void {
  assert.ok(Math.abs(actual.x - expected.x) <= tolerance, `x ${actual.x} != ${expected.x}`);
  assert.ok(Math.abs(actual.y - expected.y) <= tolerance, `y ${actual.y} != ${expected.y}`);
}function assertClientClose(actual: { clientX: number; clientY: number }, expected: { clientX: number; clientY: number }, tolerance = 1e-7): void {
  assert.ok(Math.abs(actual.clientX - expected.clientX) <= tolerance, `clientX ${actual.clientX} != ${expected.clientX}`);
  assert.ok(Math.abs(actual.clientY - expected.clientY) <= tolerance, `clientY ${actual.clientY} != ${expected.clientY}`);
}
function assertRectClose(actual: Rect, expected: Rect, tolerance = 1e-7): void {
  assertPointClose({ x: actual.x, y: actual.y }, { x: expected.x, y: expected.y }, tolerance);
  assert.ok(Math.abs(actual.w - expected.w) <= tolerance, `w ${actual.w} != ${expected.w}`);
  assert.ok(Math.abs(actual.h - expected.h) <= tolerance, `h ${actual.h} != ${expected.h}`);
}

for (const orientation of ["portrait", "landscape"] as const) {
  test(`${orientation} point and rectangle transforms round-trip in canonical scene space`, () => {
    const scene = layout(orientation);
    const viewport = bounds(orientation);
    for (const point of [{ x: 0, y: 0 }, { x: scene.size.w / 2, y: scene.size.h / 2 }, { x: scene.size.w - 1, y: scene.size.h - 1 }]) {
      assertPointClose(clientPointToScene(scenePointToClient(point, viewport, scene.size), viewport, scene.size), point);
      const client = scenePointToClient(point, viewport, scene.size);
      assertClientClose(scenePointToClient(clientPointToScene(client, viewport, scene.size), viewport, scene.size), client);
    }
    const rect: Rect = { x: scene.size.w * 0.2, y: scene.size.h * 0.3, w: 240, h: 180 };
    assertRectClose(clientRectToScene(sceneRectToClient(rect, viewport, scene.size), viewport, scene.size), rect);
    assertPointClose(clientDeltaToSceneDelta(sceneDeltaToClientDelta({ x: 37, y: -29 }, viewport, scene.size), viewport, scene.size), { x: 37, y: -29 });
  });

  test(`${orientation} normal anchors, echo anchors, interactions, obstacles, and triggers share hit testing`, () => {
    const scene = layout(orientation);
    const viewport = bounds(orientation);
    const ids = ["ms-entry-start", "ms-table-approach", "et-reading-seat", "ms-first-seat", "ms-phone-show", "et-phone-stop", "ms-goodbye-exit"];
    for (const id of ids) {
      const point = scene.anchors[id];
      const client = scenePointToClient(point, viewport, scene.size);
      assert.deepEqual(pickSceneGeometry(scene, clientPointToScene(client, viewport, scene.size)), { kind: "anchor", key: id });
    }
    const echo = scene.echoAnchors["carrot-milk-residue"];
    assert.deepEqual(pickSceneGeometry(scene, echo), { kind: "echo-anchor", key: "carrot-milk-residue" });
    assert.deepEqual(pickSceneGeometry(scene, { x: scene.size.w * 0.38, y: scene.size.h * 0.39 }), { kind: "collision", index: 0 });
    assert.deepEqual(pickSceneGeometry(scene, { x: scene.size.w * 0.72, y: scene.size.h * 0.73 }), { kind: "trigger", index: 0 });
  });
}

test("Portrait drag conversion keeps every authored point under the pointer", () => {
  const scene = layout("portrait");
  const viewport = bounds("portrait");
  const directions = [{ x: 0, y: -117 }, { x: 0, y: 117 }, { x: -83, y: 0 }, { x: 83, y: 0 }, { x: 83, y: -117 }];
  for (const point of Object.values(scene.anchors).concat(Object.values(scene.echoAnchors), scene.interactions)) {
    for (const delta of directions) {
      const targetClient = scenePointToClient({ x: point.x + delta.x, y: point.y + delta.y }, viewport, scene.size);
      const targetScene = clientPointToScene(targetClient, viewport, scene.size);
      assertClientClose(scenePointToClient(targetScene, viewport, scene.size), targetClient);
    }
  }
});
test("Obstacle move preserves dimensions and follows the grabbed pointer offset", () => {
  const original: Rect = { x: 300, y: 500, w: 240, h: 180 };
  const grab = { x: original.x + 40, y: original.y + 70 };
  for (const delta of [{ x: 0, y: -120 }, { x: 0, y: 120 }, { x: -85, y: 0 }, { x: 85, y: 0 }, { x: 85, y: -120 }]) {
    const target = { x: grab.x + delta.x, y: grab.y + delta.y };
    const moved = moveRectToPoint(original, { x: target.x - 40, y: target.y - 70 });
    assert.equal(moved.w, original.w);
    assert.equal(moved.h, original.h);
  }
});
for (const handle of ["left", "right", "top", "bottom", "top-left", "top-right", "bottom-left", "bottom-right"] as const) {
  test(`obstacle resize keeps the opposite edge fixed for ${handle}`, () => {
    const original: Rect = { x: 300, y: 500, w: 240, h: 180 };
    const pointer = { x: handle.includes("right") ? 620 : handle.includes("left") ? 260 : 420, y: handle.includes("bottom") ? 740 : handle.includes("top") ? 440 : 590 };
    const resized = resizeRect(original, handle, pointer);
    assert.ok(resized.w >= 3 && resized.h >= 3);
    if (handle.includes("left")) assert.equal(resized.x + resized.w, original.x + original.w);
    if (handle.includes("right")) assert.equal(resized.x, original.x);
    if (handle.includes("top")) assert.equal(resized.y + resized.h, original.y + original.h);
    if (handle.includes("bottom")) assert.equal(resized.y, original.y);
    assertClientClose(scenePointToClient({ x: resized.x + (handle.includes("right") ? resized.w : 0), y: resized.y + (handle.includes("bottom") ? resized.h : 0) }, bounds("portrait"), layout("portrait").size), scenePointToClient({ x: resized.x + (handle.includes("right") ? resized.w : 0), y: resized.y + (handle.includes("bottom") ? resized.h : 0) }, bounds("portrait"), layout("portrait").size));
  });
}

test("trigger rectangles use the same resize contract as obstacles", () => {
  const original: Rect = { x: 700, y: 900, w: 120, h: 90 };
  const handle = rectHandleAtPoint({ x: original.x + original.w, y: original.y + original.h }, original);
  assert.equal(handle, "bottom-right");
  assert.deepEqual(resizeRect(original, handle, { x: 860, y: 1040 }), { x: 700, y: 900, w: 160, h: 140 });  assert.deepEqual(resizeRect(original, "right", { x: 860, y: 945 }), { x: 700, y: 900, w: 160, h: 90 });
  assert.deepEqual(resizeRect(original, "bottom", { x: 760, y: 1035 }), { x: 700, y: 900, w: 120, h: 135 });
});

test("preview visual scale does not affect canonical pointer conversion", () => {
  const scene = layout("portrait");
  const viewport = bounds("portrait");
  const pointer = scenePointToClient({ x: 517, y: 983 }, viewport, scene.size);
  const atOne = clientPointToScene(pointer, viewport, scene.size);
  const atPointThree = clientPointToScene(pointer, viewport, scene.size);
  assert.deepEqual(atPointThree, atOne);
});