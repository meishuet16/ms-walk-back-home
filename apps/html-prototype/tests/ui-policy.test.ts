import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const appSource = readFileSync("src/app.ts", "utf8");
const inputSource = readFileSync("src/systems/InputManager.ts", "utf8");
const stylesSource = readFileSync("src/styles.css", "utf8");

test("normal UI does not expose removed prototype modules", () => {
  for (const forbidden of ["Relationships", "<h2>Tendency", "Save / Load", "Slot 1", "Slot 2", "Slot 3"]) {
    assert.equal(appSource.includes(forbidden), false, forbidden);
  }
});

test("normal UI does not expose emotional score text", () => {
  for (const forbidden of ["Acceptance +", "Avoidance +", "Closeness +", "Honesty +", "Water 0", "Warmth 0"]) {
    assert.equal(appSource.includes(forbidden), false, forbidden);
  }
});

test("forest HUD exposes month switch controls outside the Walk Back Home modal", () => {
  assert.match(appSource, /forest-month-hud/);
  assert.match(appSource, /data-action="forest-month-prev"/);
  assert.match(appSource, /data-action="forest-month-next"/);
});

test("mobile controls use contextual interaction copy instead of keyboard-only E", () => {
  assert.equal(inputSource.includes(">E<"), false);
  assert.match(inputSource, /touch-action-label/);
  assert.match(appSource, /setTouchInteractionLabel/);
  assert.match(appSource, /mobileHudPrompt/);
  assert.match(appSource, /Virtual joystick · Interact/);
});

test("floating records transport is clickable and not part of the lyric drag target", () => {
  assert.match(appSource, /floating-controls-bar/);
  assert.match(stylesSource, /\.floating-controls-bar/);
  assert.match(stylesSource, /touch-action:\s*manipulation/);
});

test("mobile portrait and landscape layouts have explicit touch behavior", () => {
  assert.match(inputSource, /Virtual joystick/);
  assert.match(stylesSource, /\.touch-controls\s*\{\s*display:\s*flex/s);
  assert.match(stylesSource, /\.reflection-wall-surface[\s\S]*touch-action:\s*pan-x pan-y/);
  assert.match(stylesSource, /\.wall-note[\s\S]*touch-action:\s*none/);
  assert.match(stylesSource, /@media\s*\(orientation:\s*landscape\)\s*and\s*\(max-height:\s*520px\)/);
  assert.match(stylesSource, /\.paper-fields[\s\S]*position:\s*static/);
});
