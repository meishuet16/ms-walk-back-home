import type { ToolboxToolId, ToolboxView } from "./ToolboxModel.js";
import type { SpinPreset } from "./SpinWheel.js";
import { unitsForCategory } from "./UnitConverter.js";

export type ToolboxRenderState = {
  view: ToolboxView;
  presets: SpinPreset[];
  selectedPresetId: string;
  spinChoices: string[];
  spinResult: string;
  calculatorDisplay: string;
  converterCategory: string;
  converterAmount: string;
  converterFrom: string;
  converterTo: string;
  converterResult: string;
  currencyAmount: string;
  currencyFrom: string;
  currencyTo: string;
  currencyResult: string;
  currencyStatus: string;
  timerMode: "timer" | "stopwatch";
  timerDurationSeconds: string;
  timerRemaining: string;
  stopwatchElapsed: string;
  dateStart: string;
  dateEnd: string;
  dateDays: string;
  dateResult: string;
};

const toolInfo: Record<ToolboxToolId, { name: string; icon: string; description: string }> = {
  "spin-wheel": { name: "Spin Wheel", icon: "◒", description: "不知道选什么？交给 Muji。" },
  calculator: { name: "Calculator", icon: "＋", description: "算点东西。" },
  converter: { name: "Converter", icon: "↔", description: "长度、重量、温度等等。" },
  currency: { name: "Currency", icon: "¤", description: "看看现在值多少钱。" },
  timer: { name: "Timer", icon: "◷", description: "计时，或者倒数。" },
  date: { name: "Date", icon: "日", description: "算算已经过了多少天。" }
};

const categories = ["length", "weight", "temperature", "storage", "time"];

export function toolboxToolInfo(tool: ToolboxToolId): { name: string; description: string } {
  return toolInfo[tool];
}

export function renderToolbox(state: ToolboxRenderState): string {
  const heading = state.view.screen === "root" ? "MUJI TOOLBOX" : toolInfo[state.view.selected].name;
  return `<div class="modal game-panel toolbox-panel" role="dialog" aria-modal="true" aria-label="${escapeHtml(heading)}">
    <header class="toolbox-header"><div><span class="toolbox-kicker">MUJI TOOLBOX</span><h2>${escapeHtml(heading)}</h2></div><button class="toolbox-close" data-action="toolbox-close" aria-label="Close Toolbox">×</button></header>
    ${state.view.screen === "root" ? renderRoot(state) : renderTool(state)}
  </div>`;
}

function renderRoot(state: ToolboxRenderState): string {
  const selected = state.view.selected;
  const slots = (Object.keys(toolInfo) as ToolboxToolId[]).map((tool) => `<button class="toolbox-slot${selected === tool ? " selected" : ""}" data-action="toolbox-select" data-tool="${tool}" aria-label="Select ${escapeHtml(toolInfo[tool].name)}" aria-pressed="${selected === tool}"><span class="toolbox-slot-icon" aria-hidden="true">${toolInfo[tool].icon}</span><strong>${escapeHtml(toolInfo[tool].name)}</strong></button>`).join("");
  const info = toolInfo[selected];
  return `<div class="toolbox-grid">${slots}</div><footer class="toolbox-footer"><div><strong>${escapeHtml(info.name)}</strong><span>${escapeHtml(info.description)}</span></div><button class="toolbox-confirm" data-action="toolbox-confirm">Enter</button></footer>`;
}

function renderTool(state: ToolboxRenderState): string {
  const body = state.view.selected === "spin-wheel" ? renderSpinWheel(state)
    : state.view.selected === "calculator" ? renderCalculator(state)
      : state.view.selected === "converter" ? renderConverter(state)
        : state.view.selected === "currency" ? renderCurrency(state)
          : state.view.selected === "timer" ? renderTimer(state)
            : renderDate(state);
  return `<div class="toolbox-toolbar"><button data-action="toolbox-back">← Back</button><span>Enter to choose · Esc to back</span></div><div class="toolbox-tool-body">${body}</div>`;
}

function renderSpinWheel(state: ToolboxRenderState): string {
  const presetOptions = state.presets.map((preset) => `<option value="${escapeHtml(preset.id)}" ${preset.id === state.selectedPresetId ? "selected" : ""}>${escapeHtml(preset.name)}</option>`).join("");
  const choices = state.spinChoices.map((choice, index) => `<li><span>${escapeHtml(choice)}</span><button data-action="toolbox-spin-remove" data-index="${index}" aria-label="Remove ${escapeHtml(choice)}">×</button></li>`).join("");
  return `<section class="toolbox-utility spin-wheel-tool"><div class="toolbox-field-row"><label>Preset<select data-toolbox-field="spin-preset">${presetOptions}</select></label><button data-action="toolbox-preset-new">New preset</button></div><div class="spin-wheel-disc" aria-live="polite"><span>✦</span><strong>${escapeHtml(state.spinResult || "Ready")}</strong></div><ul class="spin-choice-list">${choices || "<li class=\"empty\">Add a choice to begin.</li>"}</ul><div class="toolbox-field-row"><input id="toolbox-spin-choice" data-toolbox-field="spin-choice" placeholder="Add a choice" maxlength="80"><button data-action="toolbox-spin-add">Add</button><button class="primary" data-action="toolbox-spin">Spin</button></div><div class="toolbox-sub-actions"><button data-action="toolbox-preset-rename">Rename preset</button><button data-action="toolbox-preset-delete">Delete preset</button></div></section>`;
}

function renderCalculator(state: ToolboxRenderState): string {
  const keys = ["7", "8", "9", "÷", "4", "5", "6", "×", "1", "2", "3", "-", "0", ".", "%", "+"];
  return `<section class="toolbox-utility calculator-tool"><output class="calculator-display" aria-live="polite">${escapeHtml(state.calculatorDisplay)}</output><div class="calculator-keys">${keys.map((key) => `<button data-action="calculator-key" data-key="${escapeHtml(key)}">${escapeHtml(key)}</button>`).join("")}<button data-action="calculator-key" data-key="clear">C</button><button data-action="calculator-key" data-key="backspace">⌫</button><button class="primary wide" data-action="calculator-key" data-key="equals">=</button></div></section>`;
}

function renderConverter(state: ToolboxRenderState): string {
  const options = categories.map((category) => `<option value="${category}" ${category === state.converterCategory ? "selected" : ""}>${category}</option>`).join("");
  const unitOptions = (selected: string) => unitsForCategory(state.converterCategory).map((unit) => `<option value="${escapeHtml(unit)}" ${unit === selected ? "selected" : ""}>${escapeHtml(unit)}</option>`).join("");
  return `<section class="toolbox-utility"><label>Category<select data-toolbox-field="converter-category">${options}</select></label><label>Amount<input inputmode="decimal" data-toolbox-field="converter-amount" value="${escapeHtml(state.converterAmount)}"></label><div class="toolbox-two-col"><label>From<select data-toolbox-field="converter-from">${unitOptions(state.converterFrom)}</select></label><label>To<select data-toolbox-field="converter-to">${unitOptions(state.converterTo)}</select></label></div><output class="toolbox-result">${escapeHtml(state.converterResult || "Enter an amount")}</output></section>`;
}

function renderCurrency(state: ToolboxRenderState): string {
  const currencies = ["MYR", "SGD", "USD", "JPY", "CNY", "EUR", "GBP"];
  const options = (selected: string) => currencies.map((code) => `<option value="${code}" ${selected === code ? "selected" : ""}>${code}</option>`).join("");
  return `<section class="toolbox-utility"><label>Amount<input inputmode="decimal" data-toolbox-field="currency-amount" value="${escapeHtml(state.currencyAmount)}"></label><div class="toolbox-two-col"><label>From<select data-toolbox-field="currency-from">${options(state.currencyFrom)}</select></label><label>To<select data-toolbox-field="currency-to">${options(state.currencyTo)}</select></label></div><div class="settings-row"><button data-action="currency-swap">Swap</button><button class="primary" data-action="currency-refresh">Refresh rates</button></div><output class="toolbox-result">${escapeHtml(state.currencyResult || "No rate loaded")}</output><p class="toolbox-status">${escapeHtml(state.currencyStatus)}</p></section>`;
}

function renderTimer(state: ToolboxRenderState): string {
  return `<section class="toolbox-utility"><div class="settings-row"><button class="${state.timerMode === "timer" ? "selected" : ""}" data-action="timer-mode" data-mode="timer">Timer</button><button class="${state.timerMode === "stopwatch" ? "selected" : ""}" data-action="timer-mode" data-mode="stopwatch">Stopwatch</button></div>${state.timerMode === "timer" ? `<label>Minutes<input inputmode="numeric" data-toolbox-field="timer-minutes" value="${escapeHtml(String(Math.floor(Number(state.timerDurationSeconds) / 60) || 0))}"></label><label>Seconds<input inputmode="numeric" data-toolbox-field="timer-seconds" value="${escapeHtml(String(Number(state.timerDurationSeconds) % 60 || 0))}"></label>` : ""}<output class="timer-display">${escapeHtml(state.timerMode === "timer" ? state.timerRemaining : state.stopwatchElapsed)}</output><div class="settings-row"><button class="primary" data-action="timer-start">Start</button><button data-action="timer-pause">Pause</button><button data-action="timer-reset">Reset</button></div></section>`;
}

function renderDate(state: ToolboxRenderState): string {
  return `<section class="toolbox-utility"><div class="toolbox-two-col"><label>Start<input type="date" data-toolbox-field="date-start" value="${escapeHtml(state.dateStart)}"></label><label>End<input type="date" data-toolbox-field="date-end" value="${escapeHtml(state.dateEnd)}"></label></div><button class="primary" data-action="date-difference">Difference</button><div class="toolbox-field-row"><input inputmode="numeric" data-toolbox-field="date-days" value="${escapeHtml(state.dateDays)}" placeholder="Days"><button data-action="date-add">Add days</button><button data-action="date-subtract">Subtract</button></div><output class="toolbox-result">${escapeHtml(state.dateResult || "Choose dates")}</output></section>`;
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" }[char] ?? char));
}
