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
  assert.doesNotMatch(appSource, /drawForestMonthSign\(cameraX/);
});

test("primary navigation is consolidated at the top and HUD has no button row", () => {
  assert.match(appSource, /renderTopNav/);
  assert.match(appSource, /data-action="open-room">Muji Room/);
  assert.match(appSource, /data-action="reflection-wall">Reflection Wall/);
  assert.match(appSource, /data-action="music">Music:/);
  assert.doesNotMatch(appSource, /<button data-action="new">Begin Journey<\/button>/);
  assert.doesNotMatch(appSource, /hud-actions/);
  assert.doesNotMatch(stylesSource, /\.hud-actions/);
});

test("secondary actions live inside settings instead of the forest HUD", () => {
  assert.match(appSource, /data-action="new">Begin Journey<span>/);
  assert.match(appSource, /data-action="continue">Continue<span>/);
  assert.match(appSource, /data-action="credits">Credits<span>/);
  assert.match(appSource, /data-action="rain">Rain:/);
  assert.match(appSource, /data-action="fullscreen">Fullscreen/);
  assert.match(appSource, /data-action="compact">\$\{this\.settings\.compact/);
  assert.doesNotMatch(appSource, /data-action="mute"/);
});

test("re-entering Muji Room from the top nav preserves the current room position", () => {
  assert.match(appSource, /const alreadyInRoom = this\.scene === "muji-room"/);
  assert.match(appSource, /this\.player = alreadyInRoom \? this\.player : \{ \.\.\.roomSpawn \}/);
});

test("Muji Room objects can be activated by tapping their scene positions", () => {
  assert.match(appSource, /this\.canvas\.addEventListener\("click", \(event\) => this\.handleCanvasClick\(event\)\)/);
  assert.match(appSource, /private handleCanvasClick\(event: MouseEvent\): void/);
  assert.match(appSource, /private activateRoomInteraction\(interaction: RoomInteraction\): void/);
});

test("mobile controls use contextual interaction copy instead of keyboard-only E", () => {
  assert.equal(inputSource.includes(">E<"), false);
  assert.match(inputSource, /touch-action-label/);
  assert.match(appSource, /setTouchInteractionLabel/);
  assert.match(appSource, /mobileHudPrompt/);
  assert.match(appSource, /Virtual joystick · A/);
  assert.match(inputSource, />A</);
});

test("floating records transport is clickable and not part of the lyric drag target", () => {
  assert.match(appSource, /floating-controls-bar/);
  assert.match(appSource, /this\.musicPlayer\.addEventListener\("click"/);
  assert.match(stylesSource, /\.floating-controls-bar/);
  assert.match(stylesSource, /touch-action:\s*manipulation/);
});

test("mobile portrait and landscape layouts have explicit touch behavior", () => {
  assert.match(inputSource, /Virtual joystick/);
  assert.match(stylesSource, /\.touch-controls\s*\{\s*display:\s*flex/s);
  assert.match(appSource, /rotate-hint/);
  assert.match(stylesSource, /#app\[data-scene="forest"\] \.rotate-hint/);
  assert.match(stylesSource, /\.reflection-wall-surface[\s\S]*touch-action:\s*pan-x pan-y/);
  assert.match(stylesSource, /\.wall-note[\s\S]*touch-action:\s*none/);
  assert.match(stylesSource, /@media\s*\(orientation:\s*landscape\)\s*and\s*\(max-height:\s*520px\)/);
  assert.match(stylesSource, /\.paper-fields[\s\S]*position:\s*static/);
});
