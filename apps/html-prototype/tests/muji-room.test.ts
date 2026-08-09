import assert from "node:assert/strict";
import test from "node:test";
import { canReachRoomInteraction, createDefaultRoomState, moveRoomPlayer, roomInteractions, roomObstacles, selectVinylRecord, toggleRoomLamp, vinylPlayerActions, vinylRecords, vinylRecordsFromAudioFiles, withCustomVinylCover } from "../src/systems/MujiRoom.js";

test("muji room movement blocks walls and major furniture while leaving interactions reachable", () => {
  const start = { x: 126, y: 438 };
  const outside = moveRoomPlayer(start, -300, 0, 1);
  const intoDesk = moveRoomPlayer({ x: 315, y: 312 }, 0, -180, 1);

  assert.equal(outside.x, start.x);
  assert.equal(outside.y, start.y);
  assert.equal(intoDesk.y, 312);
  assert.equal(roomObstacles.some((rect) => rect.w > 120 && rect.h > 40), true);
  assert.equal(roomInteractions.every((interaction) => canReachRoomInteraction(interaction.id)), true);
});

test("room journey state stores lamp and selected vinyl without emotional scores", () => {
  const state = createDefaultRoomState();
  const lampOff = toggleRoomLamp(state);
  const vinylState = selectVinylRecord(lampOff, "rain-window");

  assert.equal(lampOff.lampOn, false);
  assert.equal(vinylState.selectedVinylId, "rain-window");
  assert.equal("warmth" in vinylState, false);
  assert.equal("water" in vinylState, false);
});

test("vinyl records use local prototype audio sources", () => {
  assert.equal(vinylRecords.length >= 2, true);
  assert.equal(vinylRecords.every((record) => record.unlockedByDefault), true);
  assert.equal(vinylRecords.every((record) => record.sideA?.src.startsWith("assets/audio/")), true);
});

test("records interaction is anchored at the radio and room no longer exposes rest as a primary prompt", () => {
  const records = roomInteractions.find((interaction) => interaction.id === "records");

  assert.ok(records);
  assert.equal(records.x >= 760 && records.x <= 850, true);
  assert.equal(records.y >= 280 && records.y <= 380, true);
  assert.equal(roomInteractions.some((interaction) => interaction.label === "Rest"), false);
});

test("vinyl player actions avoid duplicate stop and play pause controls", () => {
  assert.deepEqual(vinylPlayerActions(), ["toggle-play", "close"]);
});

test("vinyl records can be generated from every local audio folder mp3", () => {
  const records = vinylRecordsFromAudioFiles([
    "bakery.mp3",
    "forest.mp3",
    "Dear D (亲爱的告诉你)-项睿娴.mp3"
  ]);

  assert.equal(records.length, 3);
  assert.deepEqual(records.map((record) => record.id), [
    "audio-bakery",
    "audio-dear-d",
    "audio-forest"
  ]);
  assert.equal(records[1].title, "Dear D");
  assert.equal(records[1].subtitle, "项睿娴");
  assert.equal(records[1].sideA?.src, "assets/audio/Dear%20D%20(%E4%BA%B2%E7%88%B1%E7%9A%84%E5%91%8A%E8%AF%89%E4%BD%A0)-%E9%A1%B9%E7%9D%BF%E5%A8%B4.mp3");
});

test("custom vinyl covers are stored on room journey state by record id", () => {
  const state = withCustomVinylCover(createDefaultRoomState(), "audio-forest", "data:image/png;base64,cover");

  assert.equal(state.vinylCovers?.["audio-forest"], "data:image/png;base64,cover");
});
