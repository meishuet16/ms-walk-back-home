import type { ToolboxPersistedState } from "../types.js";

export type ToolboxToolDefinition = {
  id: "spin-wheel" | "calculator" | "converter" | "currency" | "timer" | "date" | "pdf" | "media" | "mini-games";
  label: string;
  shortLabel?: string;
  description: string;
  icon: string;
  available: boolean;
};

export const toolboxToolRegistry = [
  { id: "calculator", label: "Calculator", icon: "＋", description: "算点东西。", available: true },
  { id: "timer", label: "Timer", icon: "◷", description: "计时，或者倒数。", available: true },
  { id: "date", label: "Date", icon: "日", description: "算算已经过了多少天。", available: true },
  { id: "converter", label: "Converter", icon: "↔", description: "长度、重量、温度等等。", available: true },
  { id: "currency", label: "Currency", icon: "¤", description: "看看现在值多少钱。", available: true },
  { id: "pdf", label: "PDF", icon: "▤", description: "在设备上整理 PDF 和图片。", available: true },
  { id: "media", label: "Media", icon: "♫", description: "在设备上剪辑和转换媒体。", available: true },
  { id: "spin-wheel", label: "Spin Wheel", icon: "◒", description: "不知道选什么？交给 Muji。", available: true },
  { id: "mini-games", label: "Mini Games", icon: "🎮", description: "几分钟的小小游戏。", available: true }
] as const satisfies readonly ToolboxToolDefinition[];

export const toolboxToolIds = toolboxToolRegistry.map((tool) => tool.id) as ToolboxToolId[];
export type ToolboxToolId = typeof toolboxToolRegistry[number]["id"];
export const TOOLBOX_PAGE_SIZE = 6;

export type ToolboxView =
  | { screen: "root"; page: number; selected: ToolboxToolId }
  | { screen: "tool"; page: number; selected: ToolboxToolId };

export function toolboxPages(registry: readonly ToolboxToolDefinition[] = toolboxToolRegistry): ToolboxToolDefinition[][] {
  const pages: ToolboxToolDefinition[][] = [];
  for (let index = 0; index < registry.length; index += TOOLBOX_PAGE_SIZE) pages.push([...registry.slice(index, index + TOOLBOX_PAGE_SIZE)]);
  return pages.length ? pages : [[]];
}

export function toolboxPageForTool(tool: ToolboxToolId, registry: readonly ToolboxToolDefinition[] = toolboxToolRegistry): number {
  const index = registry.findIndex((candidate) => candidate.id === tool);
  return index < 0 ? 0 : Math.floor(index / TOOLBOX_PAGE_SIZE);
}

export function toolboxToolsForPage(page: number, registry: readonly ToolboxToolDefinition[] = toolboxToolRegistry): ToolboxToolDefinition[] {
  const pages = toolboxPages(registry);
  return pages[Math.max(0, Math.min(pages.length - 1, page))] ?? [];
}

export function isToolboxSelection(value: unknown): value is ToolboxToolId {
  return typeof value === "string" && toolboxToolRegistry.some((tool) => tool.id === value);
}

export function createToolboxState(saved?: Partial<ToolboxPersistedState>): Extract<ToolboxView, { screen: "root" }> {
  const selected = isToolboxSelection(saved?.selected) ? saved.selected : "spin-wheel";
  const page = toolboxPageForTool(selected);
  return { screen: "root", page, selected };
}

export function selectTool(state: ToolboxView, tool: ToolboxToolId): ToolboxView {
  if (state.screen !== "root") return state;
  const page = toolboxPageForTool(tool);
  const pageTools = toolboxToolsForPage(page);
  return { screen: "root", page, selected: pageTools.some((candidate) => candidate.id === tool) ? tool : pageTools[0]?.id ?? state.selected };
}

export function selectToolboxPage(state: Extract<ToolboxView, { screen: "root" }>, page: number): Extract<ToolboxView, { screen: "root" }> {
  const pages = toolboxPages();
  const nextPage = Math.max(0, Math.min(pages.length - 1, page));
  const tools = pages[nextPage] ?? [];
  const selected = tools.some((tool) => tool.id === state.selected) ? state.selected : tools[0]?.id ?? state.selected;
  return { screen: "root", page: nextPage, selected };
}

export function moveToolboxPage(state: Extract<ToolboxView, { screen: "root" }>, direction: -1 | 1): Extract<ToolboxView, { screen: "root" }> {
  return selectToolboxPage(state, state.page + direction);
}

export function confirmTool(state: ToolboxView): ToolboxView {
  return state.screen === "root" ? { screen: "tool", page: state.page, selected: state.selected } : state;
}

export function backTool(state: ToolboxView): ToolboxView | null {
  return state.screen === "tool" ? { screen: "root", page: state.page, selected: state.selected } : null;
}

export function moveToolSelection(
  state: Extract<ToolboxView, { screen: "root" }>,
  direction: "up" | "down" | "left" | "right",
  columns: 2 | 3
): Extract<ToolboxView, { screen: "root" }> {
  const tools = toolboxToolsForPage(state.page);
  const currentIndex = Math.max(0, tools.findIndex((tool) => tool.id === state.selected));
  const index = currentIndex < tools.length ? currentIndex : 0;
  const row = Math.floor(index / columns);
  const column = index % columns;
  let nextIndex = index;
  if (direction === "left") nextIndex = row * columns + Math.max(0, column - 1);
  if (direction === "right") nextIndex = row * columns + Math.min(columns - 1, column + 1);
  if (direction === "up") nextIndex = index - columns;
  if (direction === "down") nextIndex = index + columns;
  if (nextIndex < 0 || nextIndex >= tools.length || (direction === "right" && Math.floor(nextIndex / columns) !== row)) nextIndex = index;
  return { screen: "root", page: state.page, selected: tools[nextIndex]?.id ?? state.selected };
}