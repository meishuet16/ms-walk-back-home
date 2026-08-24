import type { ToolboxToolId, ToolboxView } from "./ToolboxModel.js";
import { toolboxToolRegistry, toolboxToolsForPage, toolboxPages } from "./ToolboxModel.js";
import type { SpinPreset } from "./SpinWheel.js";
import { converterCategories, unitsForCategory } from "./UnitConverter.js";

export type ToolboxRenderState = {
  view: ToolboxView;
  presets: SpinPreset[];
  selectedPresetId: string;
  spinChoices: string[];
  spinChoiceDraft: string;
  spinPresetNameDraft: string;
  persistenceStatus: string;
  spinResult: string;
  spinEditorOpen: boolean;
  spinPresetMenuOpen: boolean;
  spinRevealDismissed: boolean;
  spinRotation: number;
  spinSpinning: boolean;
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
  currencyRateText: string;
  currencyStatus: string;
  timerMode: "timer" | "stopwatch";
  timerDurationSeconds: string;
  timerRemaining: string;
  stopwatchElapsed: string;
  timerRunning: boolean;
  timerFinished: boolean;
  dateMode: "difference" | "add-subtract" | "until-since";
  dateStart: string;
  dateEnd: string;
  dateDays: string;
  dateResult: string;
  pdfMode: string;
  pdfSplitMode: "extract" | "every-page" | "every-n" | "groups";
  pdfFileSummary: string;
  pdfRange: string;
  pdfPageOrder: number[];
  pdfPageLoading: boolean;
  pdfStatus: string;
  pdfBusy: boolean;
  mediaMode: string;
  mediaFileName: string;
  mediaFormat: string;
  mediaStart: string;
  mediaEnd: string;
  mediaStatus: string;
  mediaProgress: number;
  mediaLoading: boolean;
  mediaBusy: boolean;
  mediaDurationLabel: string;
  mediaPreviewUrl: string;
  mediaPreviewKind: "audio" | "video";
  mediaWaveformReady: boolean;
  mediaZoom: number;
};

export function toolboxToolInfo(tool: ToolboxToolId): { name: string; icon: string; description: string } {
  const definition = toolboxToolRegistry.find((item) => item.id === tool) ?? toolboxToolRegistry[0];
  return { name: definition.label, icon: definition.icon, description: definition.description };
}

export function renderToolbox(state: ToolboxRenderState): string {
  const heading = state.view.screen === "root" ? "MUJI TOOLBOX" : toolboxToolInfo(state.view.selected).name;
  return `<div class="modal game-panel toolbox-panel" role="dialog" aria-modal="true" aria-label="${escapeHtml(heading)}">
    <header class="toolbox-header"><div><span class="toolbox-kicker">MUJI TOOLBOX</span><h2>${escapeHtml(heading)}</h2></div><button class="toolbox-close" data-action="toolbox-close" aria-label="Close Toolbox">×</button></header>
    ${state.view.screen === "root" ? renderRoot(state) : renderTool(state)}
  </div>`;
}

function renderRoot(state: ToolboxRenderState): string {
  const selected = state.view.selected;
  const tools = toolboxToolsForPage(state.view.page);
  const pages = toolboxPages();
  const slots = Array.from({ length: 6 }, (_, index) => {
    const tool = tools[index];
    if (!tool) return `<div class="toolbox-slot empty" aria-hidden="true"></div>`;
    return `<button class="toolbox-slot${selected === tool.id ? " selected" : ""}" data-action="toolbox-select" data-tool="${tool.id}" aria-label="Select ${escapeHtml(tool.label)}" aria-pressed="${selected === tool.id}"><span class="toolbox-slot-icon" aria-hidden="true">${tool.icon}</span><strong>${escapeHtml(tool.label)}</strong></button>`;
  }).join("");
  const info = toolboxToolInfo(selected);
  const pageControls = pages.length > 1 ? `<nav class="toolbox-pagination" aria-label="Toolbox pages"><button data-action="toolbox-page-prev" aria-label="Previous Toolbox page">‹</button><span>${pages.map((_, index) => `<button class="${index === state.view.page ? "selected" : ""}" data-action="toolbox-page" data-page="${index}" aria-label="Toolbox page ${index + 1}">${index === state.view.page ? "●" : "○"}</button>`).join("")}</span><button data-action="toolbox-page-next" aria-label="Next Toolbox page">›</button></nav>` : "";
  return `<div class="toolbox-grid">${slots}</div>${pageControls}<footer class="toolbox-footer"><div><strong>${escapeHtml(info.name)}</strong><span>${escapeHtml(info.description)}</span></div><button class="toolbox-confirm" data-action="toolbox-confirm">Enter</button></footer>`;
}

function renderTool(state: ToolboxRenderState): string {
  const body = state.view.selected === "spin-wheel" ? renderSpinWheel(state)
    : state.view.selected === "calculator" ? renderCalculator(state)
      : state.view.selected === "converter" ? renderConverter(state)
        : state.view.selected === "currency" ? renderCurrency(state)
          : state.view.selected === "timer" ? renderTimer(state)
            : state.view.selected === "date" ? renderDate(state)
              : state.view.selected === "pdf" ? renderPdf(state)
                : renderMedia(state);
  return `<div class="toolbox-toolbar"><button data-action="toolbox-back">← Back</button><span>Enter to choose · Esc to back</span></div><div class="toolbox-tool-body">${body}</div>`;
}

function renderSpinWheel(state: ToolboxRenderState): string {
  const presetOptions = state.presets.map((preset) => `<option value="${escapeHtml(preset.id)}" ${preset.id === state.selectedPresetId ? "selected" : ""}>${escapeHtml(preset.name)}</option>`).join("");
  const choices = state.spinChoices.map((choice, index) => `<li><span>${escapeHtml(choice)}</span><button data-action="toolbox-spin-remove" data-index="${index}" aria-label="Remove ${escapeHtml(choice)}">×</button></li>`).join("");
  const reveal = state.spinResult && state.spinResult !== "Spinning…" && !state.spinRevealDismissed ? `<div class="spin-winner-card" role="status"><small>The wheel chose…</small><strong>${escapeHtml(state.spinResult)}</strong><span>${["Fate has spoken.", "Muji has decided.", "No take-backs.", "Looks like it’s this one."][Math.max(0, state.spinChoices.indexOf(state.spinResult)) % 4]}</span><div><button data-action="toolbox-spin">Spin again</button><button data-action="toolbox-spin-keep">Keep result</button></div></div>` : "";
  const presetMenu = state.spinPresetMenuOpen ? `<div class="spin-preset-menu"><label>New preset<input data-toolbox-field="spin-preset-name" placeholder="Preset name" maxlength="60"></label><div><button data-action="toolbox-preset-create">Create preset</button><button data-action="toolbox-preset-rename">Rename current</button><button data-action="toolbox-preset-delete">Delete current</button></div></div>` : "";
  return `<section class="toolbox-utility spin-wheel-tool"><div class="spin-preset-bar"><label>Preset<select data-toolbox-field="spin-preset">${presetOptions}</select></label><button type="button" data-action="toolbox-preset-menu" aria-label="Preset actions" aria-expanded="${state.spinPresetMenuOpen}">More</button></div>${presetMenu}<div class="spin-wheel-stage"><span class="spin-pointer" aria-hidden="true">▼</span><canvas class="spin-wheel-canvas" width="300" height="300" data-spin-wheel-canvas aria-label="Spin wheel"></canvas><strong class="spin-wheel-result" aria-live="polite">${escapeHtml(state.spinResult || (state.spinChoices.length ? "Ready" : "Add a choice to begin."))}</strong>${reveal}</div><button class="spin-choice-summary" data-action="toolbox-spin-edit" aria-expanded="${state.spinEditorOpen}"><span><strong>${state.spinChoices.length} choice${state.spinChoices.length === 1 ? "" : "s"}</strong><small>${escapeHtml(state.spinChoices.slice(0, 3).join(" · ") || "Add a choice to begin.")}</small></span><b>${state.spinEditorOpen ? "Done" : "Edit →"}</b></button><div class="spin-choice-editor${state.spinEditorOpen ? " open" : ""}"><ul class="spin-choice-list">${choices || "<li class=\"empty\">Add a choice to begin.</li>"}</ul><div class="spin-choice-add"><input id="toolbox-spin-choice" data-toolbox-field="spin-choice" placeholder="Add a choice…" maxlength="80"><button data-action="toolbox-spin-add">Add</button></div></div><button class="primary spin-primary-action" data-action="toolbox-spin" ${state.spinSpinning || !state.spinChoices.length ? "disabled" : ""}>${state.spinSpinning ? "Spinning…" : "Spin"}</button></section>`;
}

function renderCalculator(state: ToolboxRenderState): string {
  const keys = ["7", "8", "9", "÷", "4", "5", "6", "×", "1", "2", "3", "-", "0", ".", "%", "+"];
  return `<section class="toolbox-utility calculator-tool"><output class="calculator-display" aria-live="polite">${escapeHtml(state.calculatorDisplay)}</output><div class="calculator-keys">${keys.map((key) => `<button data-action="calculator-key" data-key="${escapeHtml(key)}">${escapeHtml(key)}</button>`).join("")}<button data-action="calculator-key" data-key="clear">C</button><button data-action="calculator-key" data-key="backspace">⌫</button><button class="primary wide" data-action="calculator-key" data-key="equals">=</button></div></section>`;
}

function renderConverter(state: ToolboxRenderState): string {
  const options = converterCategories.map((category) => `<option value="${category}" ${category === state.converterCategory ? "selected" : ""}>${category}</option>`).join("");
  const unitOptions = (selected: string) => unitsForCategory(state.converterCategory).map((unit) => `<option value="${escapeHtml(unit)}" ${unit === selected ? "selected" : ""}>${escapeHtml(unit)}</option>`).join("");
  return `<section class="toolbox-utility"><label>Category<select data-toolbox-field="converter-category">${options}</select></label><label>Amount<input inputmode="decimal" data-toolbox-field="converter-amount" value="${escapeHtml(state.converterAmount)}"></label><div class="toolbox-two-col"><label>From<select data-toolbox-field="converter-from">${unitOptions(state.converterFrom)}</select></label><label>To<select data-toolbox-field="converter-to">${unitOptions(state.converterTo)}</select></label></div><button data-action="converter-swap">⇄ Swap</button><output class="toolbox-result">${escapeHtml(state.converterResult || "Enter an amount")}</output></section>`;
}

function renderCurrency(state: ToolboxRenderState): string {
  const currencies = ["MYR", "SGD", "USD", "JPY", "CNY", "EUR", "GBP"];
  const options = (selected: string) => currencies.map((code) => `<option value="${code}" ${selected === code ? "selected" : ""}>${code}</option>`).join("");
  return `<section class="toolbox-utility currency-tool"><label>Amount<input inputmode="decimal" data-toolbox-field="currency-amount" value="${escapeHtml(state.currencyAmount)}"></label><div class="toolbox-two-col currency-pair"><select data-toolbox-field="currency-from" aria-label="From currency">${options(state.currencyFrom)}</select><button data-action="currency-swap">⇄</button><select data-toolbox-field="currency-to" aria-label="To currency">${options(state.currencyTo)}</select></div><output class="toolbox-result currency-result">${escapeHtml(state.currencyResult || "Enter an amount")}</output><p class="toolbox-status">${escapeHtml(state.currencyRateText)}</p><div class="toolbox-sub-actions"><button class="small" data-action="currency-refresh">Refresh</button></div><p class="toolbox-status" aria-live="polite">${escapeHtml(state.currencyStatus)}</p></section>`;
}

function renderTimer(state: ToolboxRenderState): string {
  return `<section class="toolbox-utility timer-tool"><div class="settings-row"><button class="${state.timerMode === "timer" ? "selected" : ""}" data-action="timer-mode" data-mode="timer">Timer</button><button class="${state.timerMode === "stopwatch" ? "selected" : ""}" data-action="timer-mode" data-mode="stopwatch">Stopwatch</button></div>${state.timerMode === "timer" ? `<div class="toolbox-field-row timer-duration-fields"><label>Minutes<input inputmode="numeric" data-toolbox-field="timer-minutes" value="${escapeHtml(String(Math.floor(Number(state.timerDurationSeconds) / 60) || 0))}" ${state.timerRunning ? "disabled" : ""}></label><label>Seconds<input inputmode="numeric" data-toolbox-field="timer-seconds" value="${escapeHtml(String(Number(state.timerDurationSeconds) % 60 || 0))}" ${state.timerRunning ? "disabled" : ""}></label></div>` : ""}<output class="timer-display">${escapeHtml(state.timerMode === "timer" ? state.timerRemaining : state.stopwatchElapsed)}</output><div class="settings-row"><button class="primary" data-action="timer-start">${state.timerRunning ? "Running…" : "Start"}</button><button data-action="timer-pause">Pause</button><button data-action="timer-reset">Reset</button></div><p class="toolbox-status">${state.timerFinished ? "Finished" : " "}</p></section>`;
}

function renderDate(state: ToolboxRenderState): string {
  const modeOptions = [["difference", "Difference"], ["add-subtract", "Add / Subtract"], ["until-since", "Until / Since"]] as const;
  return `<section class="toolbox-utility date-tool"><label>Mode<select data-toolbox-field="date-mode">${modeOptions.map(([value, label]) => `<option value="${value}" ${state.dateMode === value ? "selected" : ""}>${label}</option>`).join("")}</select></label>${state.dateMode === "until-since" ? `<label>Target date<input type="date" data-toolbox-field="date-end" value="${escapeHtml(state.dateEnd)}"></label>` : state.dateMode === "difference" ? `<div class="toolbox-two-col"><label>Start<input type="date" data-toolbox-field="date-start" value="${escapeHtml(state.dateStart)}"></label><label>End<input type="date" data-toolbox-field="date-end" value="${escapeHtml(state.dateEnd)}"></label></div>` : `<label>Base date<input type="date" data-toolbox-field="date-start" value="${escapeHtml(state.dateStart)}"></label><label>Days<input inputmode="numeric" data-toolbox-field="date-days" value="${escapeHtml(state.dateDays)}"></label><div class="settings-row"><button class="primary" data-action="date-add">Add</button><button data-action="date-subtract">Subtract</button></div>`}<output class="toolbox-result">${escapeHtml(state.dateResult || "Choose dates")}</output>${state.dateMode === "difference" ? `<button class="primary" data-action="date-difference">Difference</button>` : state.dateMode === "until-since" ? `<button class="primary" data-action="date-until-since">Compare with today</button>` : ""}</section>`;
}

function renderPdf(state: ToolboxRenderState): string {
  const splitControls = `<label>What should be produced?<select data-toolbox-field="pdf-split-mode"><option value="extract" ${state.pdfSplitMode === "extract" ? "selected" : ""}>One PDF from selected pages</option><option value="every-page" ${state.pdfSplitMode === "every-page" ? "selected" : ""}>One PDF per page</option><option value="every-n" ${state.pdfSplitMode === "every-n" ? "selected" : ""}>One PDF every N pages</option><option value="groups" ${state.pdfSplitMode === "groups" ? "selected" : ""}>One PDF per page group</option></select></label>${state.pdfSplitMode === "every-n" ? `<label>Pages per PDF<input inputmode="numeric" data-toolbox-field="pdf-split-value" value="${escapeHtml(state.pdfRange)}" placeholder="3"></label><small>For example, 3 creates 1–3, 4–6, and so on.</small>` : state.pdfSplitMode === "groups" ? `<label>Page groups<input data-toolbox-field="pdf-split-value" value="${escapeHtml(state.pdfRange)}" placeholder="1-3 | 4-8 | 9-10"></label><small>Each group becomes its own PDF, in the order entered.</small>` : state.pdfSplitMode === "extract" ? `<label>Pages to extract<input data-toolbox-field="pdf-split-value" value="${escapeHtml(state.pdfRange)}" placeholder="1-3, 7, 10-12"></label><small>One PDF containing only these pages, in the order entered.</small>` : `<small>Every page becomes a separate PDF.</small>`}`;
  const organizer = state.pdfPageLoading ? `<p class="pdf-organizer-status">Reading page order…</p>` : state.pdfPageOrder.length ? `<div class="pdf-organizer" aria-label="PDF page organizer">${state.pdfPageOrder.map((page, index) => `<article class="pdf-page-card"><strong>Page ${page}</strong><span>Final position ${index + 1}</span><div class="pdf-page-actions"><button type="button" data-action="pdf-page-up" data-index="${index}" aria-label="Move page ${page} up" ${index === 0 ? "disabled" : ""}>↑</button><button type="button" data-action="pdf-page-down" data-index="${index}" aria-label="Move page ${page} down" ${index === state.pdfPageOrder.length - 1 ? "disabled" : ""}>↓</button><button type="button" data-action="pdf-page-delete" data-index="${index}" aria-label="Delete page ${page}" ${state.pdfPageOrder.length <= 1 ? "disabled" : ""}>Delete</button></div></article>`).join("")}</div><small>Use the arrows to set the final order. Delete removes a page from the saved PDF.</small>` : `<p class="pdf-organizer-status">Choose one PDF to organize its pages visually.</p>`;
  return `<section class="toolbox-utility file-tool pdf-tool"><label>Operation<select data-toolbox-field="pdf-mode"><option value="merge" ${state.pdfMode === "merge" ? "selected" : ""}>Merge PDFs</option><option value="extract" ${state.pdfMode === "extract" ? "selected" : ""}>Split / Extract</option><option value="reorder" ${state.pdfMode === "reorder" ? "selected" : ""}>Reorder / Delete</option><option value="images-to-pdf" ${state.pdfMode === "images-to-pdf" ? "selected" : ""}>Images → PDF</option><option value="pdf-to-images" ${state.pdfMode === "pdf-to-images" ? "selected" : ""}>PDF → Images</option><option value="compress" ${state.pdfMode === "compress" ? "selected" : ""}>Compress / Optimize</option></select></label><input type="file" data-toolbox-field="pdf-files" accept=".pdf,application/pdf,image/jpeg,image/png,image/webp" multiple><p class="file-summary">${escapeHtml(state.pdfFileSummary || "Choose local files")}</p>${state.pdfMode === "extract" ? splitControls : state.pdfMode === "reorder" ? organizer : state.pdfMode !== "merge" && state.pdfMode !== "images-to-pdf" && state.pdfMode !== "compress" ? `<label>Pages<input data-toolbox-field="pdf-range" value="${escapeHtml(state.pdfRange)}"></label>` : ""}<button class="primary" data-action="pdf-process" ${state.pdfBusy ? "disabled" : ""}>${state.pdfMode === "reorder" ? "Save reordered PDF" : "Process locally"}</button><button data-action="pdf-cancel" ${state.pdfBusy ? "" : "disabled hidden"}>Cancel</button><p class="toolbox-status" aria-live="polite">${escapeHtml(state.pdfStatus)}</p><small>Processed on this device.</small></section>`;
}

export function renderMediaPreview(state: Pick<ToolboxRenderState, "mediaPreviewUrl" | "mediaPreviewKind">): string {
  return state.mediaPreviewUrl ? `<${state.mediaPreviewKind} class="media-preview" controls preload="metadata" src="${escapeHtml(state.mediaPreviewUrl)}"></${state.mediaPreviewKind}>` : "";
}

export function renderMediaEditor(state: Pick<ToolboxRenderState, "mediaDurationLabel" | "mediaWaveformReady" | "mediaZoom" | "mediaStart" | "mediaEnd">): string {
  return state.mediaDurationLabel ? `<div class="media-editor" data-waveform-ready="${state.mediaWaveformReady}">
    <div class="media-editor-heading"><div><strong>Precision cutter</strong><span>${escapeHtml(state.mediaDurationLabel)}</span></div><div class="media-zoom-controls"><button data-action="media-zoom-out" aria-label="Zoom out">−</button><output>${state.mediaZoom.toFixed(1)}x</output><button data-action="media-zoom-in" aria-label="Zoom in">+</button><button data-action="media-zoom-reset">Fit</button></div></div>
    <div class="media-waveform-wrap"><canvas class="media-waveform" data-media-waveform width="1200" height="220" tabindex="0" role="slider" aria-label="Audio trim timeline"></canvas></div>
    <div class="media-time-grid"><label>Start<input data-toolbox-field="media-start" value="${escapeHtml(state.mediaStart)}" inputmode="decimal" aria-label="Trim start, minutes seconds milliseconds"></label><span>to</span><label>End<input data-toolbox-field="media-end" value="${escapeHtml(state.mediaEnd)}" inputmode="decimal" aria-label="Trim end, minutes seconds milliseconds"></label></div>
    <div class="media-editor-actions"><button data-action="media-play-selection">Play selection</button><span>Drag the start/end markers. Click the waveform to seek.</span></div>
  </div>` : "";
}

function renderMedia(state: ToolboxRenderState): string {
  const preview = renderMediaPreview(state);
  const waveform = renderMediaEditor(state);
  return `<section class="toolbox-utility file-tool media-tool"><label>Operation<select data-toolbox-field="media-mode"><option value="extract-audio" ${state.mediaMode === "extract-audio" ? "selected" : ""}>Extract audio from video</option><option value="convert-audio" ${state.mediaMode === "convert-audio" ? "selected" : ""}>Convert audio</option><option value="trim-audio" ${state.mediaMode === "trim-audio" ? "selected" : ""}>Trim audio</option><option value="trim-video" ${state.mediaMode === "trim-video" ? "selected" : ""}>Trim video</option></select></label>
    <label class="media-file-picker"><span>Choose media</span><input type="file" data-toolbox-field="media-file" accept="audio/*,video/*"></label>
    <p class="file-summary">${escapeHtml(state.mediaFileName || "Choose a local media file")}</p><div class="media-preview-slot">${preview}</div><div class="media-editor-slot">${waveform}</div>
    <label>Format<select data-toolbox-field="media-format"><option value="mp3" ${state.mediaFormat === "mp3" ? "selected" : ""}>MP3</option><option value="wav" ${state.mediaFormat === "wav" ? "selected" : ""}>WAV</option><option value="ogg" ${state.mediaFormat === "ogg" ? "selected" : ""}>OGG</option></select></label>
    <button class="primary media-export" data-action="media-process" ${!state.mediaFileName || state.mediaLoading || state.mediaBusy || !state.mediaDurationLabel ? "disabled" : ""}>Export selected range</button><button data-action="media-cancel" ${state.mediaBusy ? "" : "disabled hidden"}>Cancel</button><progress max="1" value="${state.mediaProgress}"></progress><p class="toolbox-status" aria-live="polite">${escapeHtml(state.mediaStatus)}</p><small>Processed privately on this device.</small></section>`;
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" }[char] ?? char));
}
