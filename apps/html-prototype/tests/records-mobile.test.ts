import assert from "node:assert/strict";
import test from "node:test";
import { createRecordsMobileState, transitionRecordsMobile } from "../src/systems/RecordsMobile.js";

test("mobile Records opens one secondary surface at a time", () => {
  const crate = transitionRecordsMobile(createRecordsMobileState(), { type: "open-crate" });
  const globalMenu = transitionRecordsMobile(crate, { type: "open-global-menu" });

  assert.equal(crate.crateOpen, true);
  assert.deepEqual(globalMenu, { crateOpen: false, layer: "global-menu", organizeMode: false, batchEditorOpen: false });
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

  assert.deepEqual(organized, { crateOpen: true, layer: "none", organizeMode: true, batchEditorOpen: false });
  assert.deepEqual(closed, createRecordsMobileState());
});

test("editing keeps the contextual track without opening playback", () => {
  const menu = transitionRecordsMobile(createRecordsMobileState(), { type: "open-track-menu", trackId: "built-in-a" });
  const editor = transitionRecordsMobile(menu, { type: "open-track-editor" });

  assert.deepEqual(editor, { crateOpen: true, layer: "track-editor", organizeMode: false, batchEditorOpen: false, actionTrackId: "built-in-a" });
});

test("editing from the global menu returns to the player instead of opening the crate", () => {
  const globalMenu = transitionRecordsMobile(createRecordsMobileState(), { type: "open-global-menu" });
  const editor = transitionRecordsMobile(globalMenu, { type: "open-track-editor-for", trackId: "built-in-a" });
  const closed = transitionRecordsMobile(editor, { type: "close-layer" });

  assert.deepEqual(editor, { crateOpen: false, layer: "track-editor", organizeMode: false, batchEditorOpen: false, actionTrackId: "built-in-a" });
  assert.deepEqual(closed, createRecordsMobileState());
});

test("closing a contextual layer forgets its song target but keeps the crate", () => {
  const menu = transitionRecordsMobile(createRecordsMobileState(), { type: "open-track-menu", trackId: "user-2" });
  const closed = transitionRecordsMobile(menu, { type: "close-layer" });

  assert.deepEqual(closed, { crateOpen: true, layer: "none", organizeMode: false, batchEditorOpen: false });
});

test("batch metadata stays progressively disclosed inside Organize", () => {
  const idle = createRecordsMobileState();
  const ignored = transitionRecordsMobile(idle, { type: "open-batch-editor" });
  const organized = transitionRecordsMobile(idle, { type: "enter-organize" });
  const editing = transitionRecordsMobile(organized, { type: "open-batch-editor" });
  const collapsed = transitionRecordsMobile(editing, { type: "close-batch-editor" });

  assert.deepEqual(ignored, idle);
  assert.equal(editing.organizeMode, true);
  assert.equal(editing.batchEditorOpen, true);
  assert.equal(collapsed.batchEditorOpen, false);
});

test("leaving Organize closes the batch metadata editor", () => {
  const organized = transitionRecordsMobile(createRecordsMobileState(), { type: "enter-organize" });
  const editing = transitionRecordsMobile(organized, { type: "open-batch-editor" });
  const left = transitionRecordsMobile(editing, { type: "leave-organize" });

  assert.deepEqual(left, { crateOpen: true, layer: "none", organizeMode: false, batchEditorOpen: false });
});
