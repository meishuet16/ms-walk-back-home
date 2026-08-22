import type { ToolboxPersistedState } from "../types.js";

export const toolboxToolIds = ["spin-wheel", "calculator", "converter", "currency", "timer", "date"] as const;
export type ToolboxToolId = typeof toolboxToolIds[number];

export type ToolboxView =
  | { screen: "root"; selected: ToolboxToolId }
  | { screen: "tool"; selected: ToolboxToolId };

export function isToolboxSelection(value: unknown): value is ToolboxToolId {
  return typeof value === "string" && (toolboxToolIds as readonly string[]).includes(value);
}

export function createToolboxState(saved?: Partial<ToolboxPersistedState>): Extract<ToolboxView, { screen: "root" }> {
  return { screen: "root", selected: isToolboxSelection(saved?.selected) ? saved.selected : "spin-wheel" };
}

export function selectTool(state: ToolboxView, tool: ToolboxToolId): ToolboxView {
  return state.screen === "root" ? { screen: "root", selected: tool } : state;
}

export function confirmTool(state: ToolboxView): ToolboxView {
  return state.screen === "root" ? { screen: "tool", selected: state.selected } : state;
}

export function backTool(state: ToolboxView): ToolboxView | null {
  return state.screen === "tool" ? { screen: "root", selected: state.selected } : null;
}

export function moveToolSelection(
  state: Extract<ToolboxView, { screen: "root" }>,
  direction: "up" | "down" | "left" | "right",
  columns: 2 | 3
): Extract<ToolboxView, { screen: "root" }> {
  const index = toolboxToolIds.indexOf(state.selected);
  const row = Math.floor(index / columns);
  const column = index % columns;
  const rowCount = Math.ceil(toolboxToolIds.length / columns);
  let nextIndex = index;
  if (direction === "left") nextIndex = row * columns + Math.max(0, column - 1);
  if (direction === "right") nextIndex = row * columns + Math.min(columns - 1, column + 1);
  if (direction === "up") nextIndex = Math.max(0, index - columns);
  if (direction === "down") nextIndex = Math.min(toolboxToolIds.length - 1, index + columns);
  if (row >= rowCount || nextIndex >= toolboxToolIds.length) nextIndex = index;
  return { screen: "root", selected: toolboxToolIds[nextIndex] };
}
