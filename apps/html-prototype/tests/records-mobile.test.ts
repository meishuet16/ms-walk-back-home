import assert from "node:assert/strict";
import test from "node:test";
import { createRecordsMobileState, transitionRecordsMobile } from "../src/systems/RecordsMobile.js";

test("mobile Records opens one secondary surface at a time", () => {
  const crate = transitionRecordsMobile(createRecordsMobileState(), { type: "open-crate" });
  const globalMenu = transitionRecordsMobile(crate, { type: "open-global-menu" });

  assert.equal(crate.crateOpen, true);
  assert.deepEqual(globalMenu, { crateOpen: false, layer: "global-menu", organizeMode: false });
});

test("contextual song targeting never contains playback selection state", () => {
  const state = transitionRecordsMobile(createRecordsMobileState(), { type: "open-track-menu", trackId: "user-2" });

  assert.equal(state.crateOpen, true);
  assert.equal(state.actionTrackId, "user-2");
  assert.equal("selectedTrackId" in state, false);
  assert.equal("playing" in state, false);
});

test("Organize belongs to the crate and resets when the crate closes", () => {
  const organized = transitionRecordsMobile(createRecordsMobileState(), { type: "enter-organize" });
  const closed = transitionRecordsMobile(organized, { type: "close-crate" });

  assert.deepEqual(organized, { crateOpen: true, layer: "none", organizeMode: true });
  assert.deepEqual(closed, createRecordsMobileState());
});

test("editing keeps the contextual track without opening playback", () => {
  const menu = transitionRecordsMobile(createRecordsMobileState(), { type: "open-track-menu", trackId: "built-in-a" });
  const editor = transitionRecordsMobile(menu, { type: "open-track-editor" });

  assert.deepEqual(editor, { crateOpen: true, layer: "track-editor", organizeMode: false, actionTrackId: "built-in-a" });
});

test("closing a contextual layer forgets its song target but keeps the crate", () => {
  const menu = transitionRecordsMobile(createRecordsMobileState(), { type: "open-track-menu", trackId: "user-2" });
  const closed = transitionRecordsMobile(menu, { type: "close-layer" });

  assert.deepEqual(closed, { crateOpen: true, layer: "none", organizeMode: false });
});
