import assert from "node:assert/strict";
import test from "node:test";
import { confirmTool, createToolboxState, moveToolSelection, selectTool, backTool } from "../src/systems/ToolboxModel.js";

test("toolbox defaults to Spin Wheel and restores only valid remembered selections", () => {
  assert.equal(createToolboxState().selected, "spin-wheel");
  assert.equal(createToolboxState({ selected: "calculator" }).selected, "calculator");
  assert.equal(createToolboxState({ selected: "missing" }).selected, "spin-wheel");
});

test("toolbox selection moves through a portrait two-column grid", () => {
  const state = createToolboxState();
  assert.equal(moveToolSelection(state, "right", 2).selected, "calculator");
  assert.equal(moveToolSelection(state, "down", 2).selected, "converter");
  assert.equal(moveToolSelection(moveToolSelection(state, "right", 2), "down", 2).selected, "currency");
});

test("toolbox selection moves through a landscape three-column grid", () => {
  const state = createToolboxState({ selected: "calculator" });
  assert.equal(moveToolSelection(state, "down", 3).selected, "timer");
  assert.equal(moveToolSelection(state, "left", 3).selected, "spin-wheel");
});

test("select does not enter and confirm enters the selected tool", () => {
  const selected = selectTool(createToolboxState(), "timer");
  assert.equal(selected.screen, "root");
  assert.equal(selected.selected, "timer");
  assert.deepEqual(confirmTool(selected), { screen: "tool", selected: "timer" });
});

test("back returns to root and then closes", () => {
  const root = createToolboxState();
  assert.deepEqual(backTool(confirmTool(root)), root);
  assert.equal(backTool(root), null);
});
