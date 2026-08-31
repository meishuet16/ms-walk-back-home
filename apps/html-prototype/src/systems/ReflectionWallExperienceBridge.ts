import type { ReflectionNote, ReflectionWallFilter, ReflectionWallSort, ReflectionWallState, ReflectionWallView, RoomJourneyState } from "../types.js";
import {
  migrateLegacyReflectionWall,
  moveReflectionNote,
  reflectionPaperStyles,
  rotateReflectionNote,
  visibleReflectionNotes
} from "./ReflectionWall.js";

type ReflectionWallApp = {
  overlay: HTMLElement;
  reflectionWall: ReflectionWallState;
  reflectionWallView: ReflectionWallView;
  reflectionWallFilter: ReflectionWallFilter;
  reflectionWallSort: ReflectionWallSort;
  reflectionWallSearch: string;
  room: RoomJourneyState;
  recordsPanelOpen: boolean;
  save: { saveReflectionWall: (state: ReflectionWallState) => void };
  escapeHtml: (value: string) => string;
  formatReflectionTimestamp: (value: string) => string;
  focusStage: () => void;
  showToast: (message: string) => void;
  syncGameplayChromeVisibility: () => void;
  openReflectionWall: () => void;
  refreshReflectionWallOnly: () => void;
  showReflectionComposer: (noteId?: string) => void;
  showReflectionDetail: (noteId: string) => void;
};

type ExperienceState = {
  arrange: boolean;
  selectedNoteId: string;
  visibleSections: number;
};

type ReflectionInsets = { x: number; y: number };

const experience = new WeakMap<object, ExperienceState>();
const DRAG_THRESHOLD = 6;
const DEFAULT_SAFE_INSETS: ReflectionInsets = { x: 12, y: 12 };
const NOTES_PER_WALL_SECTION = 6;

function stateFor(app: object): ExperienceState {
  const current = experience.get(app);
  if (current) return current;
  const next = { arrange: false, selectedNoteId: "", visibleSections: 1 };
  experience.set(app, next);
  return next;
}

export function reflectionDragIntent(distance: number, threshold = DRAG_THRESHOLD): boolean {
  return Number.isFinite(distance) && distance >= threshold;
}

export function reflectionSafePosition(position: { x: number; y: number }, insets: ReflectionInsets = DEFAULT_SAFE_INSETS): { x: number; y: number } {
  const xInset = Math.max(4, Math.min(45, Number.isFinite(insets.x) ? insets.x : DEFAULT_SAFE_INSETS.x));
  const yInset = Math.max(4, Math.min(45, Number.isFinite(insets.y) ? insets.y : DEFAULT_SAFE_INSETS.y));
  const x = Number.isFinite(position.x) ? position.x : 50;
  const y = Number.isFinite(position.y) ? position.y : 50;
  return {
    x: Math.max(xInset, Math.min(100 - xInset, x)),
    y: Math.max(yInset, Math.min(100 - yInset, y))
  };
}

export function reflectionWallPositionStyle(
  note: Pick<ReflectionNote, "x" | "y" | "rotation">,
  zIndex = 1,
  insets: ReflectionInsets = DEFAULT_SAFE_INSETS
): string {
  const safe = reflectionSafePosition(note, insets);
  return `left:${safe.x}%;top:${safe.y}%;transform:translate(-50%, -50%) rotate(${note.rotation}deg);z-index:${zIndex};`;
}

function renderFlags(note: ReflectionNote): string {
  const parts = [
    note.pinned ? `<span class="reflection-kept-mark pin" aria-label="Pinned">●</span>` : "",
    note.favorite ? `<span class="reflection-kept-mark favorite" aria-label="Favourite">★</span>` : ""
  ].filter(Boolean).join("");
  return parts ? `<span class="reflection-kept-marks">${parts}</span>` : "";
}

function sourceStamp(app: ReflectionWallApp, note: ReflectionNote): string {
  if (note.source === "chapter") {
    return `<span class="reflection-source-stamp">MEMORY${note.chapterId ? ` · ${app.escapeHtml(note.chapterId)}` : ""}</span>`;
  }
  return `<span class="reflection-source-stamp manual">KEPT BY MUJI</span>`;
}

function noteZIndex(app: ReflectionWallApp, note: ReflectionNote, selected: boolean): number {
  const order = Math.max(0, app.reflectionWall.notes.findIndex((item) => item.id === note.id));
  return (note.pinned ? 120 : 10) + order + (selected ? 300 : 0);
}

function renderWallNote(app: ReflectionWallApp, note: ReflectionNote, arrange: boolean, selected: boolean): string {
  const style = reflectionWallPositionStyle(note, noteZIndex(app, note, selected));
  const date = app.formatReflectionTimestamp(note.createdAt).split(" · ")[0];
  const attrs = arrange
    ? `type="button" data-reflection-move data-note="${app.escapeHtml(note.id)}" aria-label="Move note: ${app.escapeHtml(note.text.slice(0, 80))}"`
    : `type="button" data-action="reflection-note-open" data-note="${app.escapeHtml(note.id)}"`;
  return `<article class="reflection-wall-paper paper-${app.escapeHtml(note.styleId)}${selected ? " selected" : ""}${note.pinned ? " pinned" : ""}" data-note-shell="${app.escapeHtml(note.id)}" style="${style}">
    <button class="reflection-wall-note" ${attrs}>
      <span class="reflection-paper-fixture" aria-hidden="true"></span>
      ${renderFlags(note)}
      <span class="reflection-note-copy">${app.escapeHtml(note.text).replace(/\n/g, "<br>")}</span>
      <span class="reflection-note-date">— ${app.escapeHtml(date)}</span>
      ${sourceStamp(app, note)}
    </button>
  </article>`;
}

function stableWallOrder(app: ReflectionWallApp): ReflectionNote[] {
  return [...app.reflectionWall.notes].sort((a, b) => a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id));
}

function sectionForNote(app: ReflectionWallApp, note: ReflectionNote): number {
  const index = stableWallOrder(app).findIndex((item) => item.id === note.id);
  return Math.max(0, Math.floor(Math.max(0, index) / NOTES_PER_WALL_SECTION));
}

function wallSectionCount(app: ReflectionWallApp): number {
  return Math.max(1, Math.ceil(app.reflectionWall.notes.length / NOTES_PER_WALL_SECTION));
}

function renderWallSection(app: ReflectionWallApp, notes: ReflectionNote[], section: number, arrange: boolean, selectedNoteId: string): string {
  const sectionNotes = notes.filter((note) => sectionForNote(app, note) === section);
  return `<div class="reflection-wall-section" data-reflection-section="${section}" aria-label="Reflection wall section ${section + 1}">
    <div class="reflection-wall-grain" aria-hidden="true"></div>
    ${sectionNotes.map((note) => renderWallNote(app, note, arrange, selectedNoteId === note.id)).join("")}
  </div>`;
}

function renderWall(app: ReflectionWallApp, notes: ReflectionNote[]): string {
  const ui = stateFor(app as object);
  const totalSections = wallSectionCount(app);
  ui.visibleSections = Math.max(1, Math.min(ui.visibleSections, totalSections));
  if (!app.reflectionWall.notes.length) {
    return `<section class="reflection-wall-canvas empty" aria-label="Reflection Wall"><div class="reflection-wall-section"><div class="reflection-wall-grain" aria-hidden="true"></div><div class="reflection-wall-empty"><span aria-hidden="true">✦</span><h3>The wall is quiet.</h3><p>Leave a thought here when one feels worth seeing again.</p><button data-action="reflection-note-new">Leave a note</button></div></div></section>`;
  }
  const sections = Array.from({ length: ui.visibleSections }, (_, section) => renderWallSection(app, notes, section, ui.arrange, ui.selectedNoteId)).join("");
  const more = ui.visibleSections < totalSections
    ? `<div class="reflection-wall-more"><button type="button" data-reflection-show-more><span aria-hidden="true">↓</span><strong>Show more wall</strong><small>${totalSections - ui.visibleSections} more section${totalSections - ui.visibleSections === 1 ? "" : "s"} below</small></button></div>`
    : "";
  return `<section class="reflection-wall-canvas${ui.arrange ? " arranging" : ""}" aria-label="Reflection Wall" data-reflection-canvas><div class="reflection-wall-stack">${sections}${more}</div>${ui.arrange ? `<div class="reflection-arrange-dock" role="toolbar" aria-label="Arrange wall controls"><span>${ui.selectedNoteId ? "Move or turn this paper" : "Tap a paper, then drag"}</span><button type="button" data-reflection-rotate="-1" ${ui.selectedNoteId ? "" : "disabled"} aria-label="Rotate selected note left">↶</button><button type="button" data-reflection-rotate="1" ${ui.selectedNoteId ? "" : "disabled"} aria-label="Rotate selected note right">↷</button><button type="button" data-reflection-arrange-toggle>Done</button></div>` : ""}</section>`;
}

function renderList(app: ReflectionWallApp, notes: ReflectionNote[]): string {
  const rows = notes.map((note) => `<button class="reflection-list-row reflection-kept-list-row" data-action="reflection-note-open" data-note="${app.escapeHtml(note.id)}"><span class="reflection-list-paper paper-${app.escapeHtml(note.styleId)}" aria-hidden="true"></span><span class="reflection-list-copy"><strong>${app.escapeHtml(note.text)}</strong><small>${app.escapeHtml(app.formatReflectionTimestamp(note.createdAt))} · ${note.source === "chapter" ? "Memory" : "My note"}</small></span>${renderFlags(note)}<span aria-hidden="true">›</span></button>`).join("");
  return `<section class="reflection-list reflection-kept-list" aria-label="Reflection notes list">${rows || `<p>The wall is quiet.</p>`}</section>`;
}

function renderFind(app: ReflectionWallApp): string {
  const filters: Array<[ReflectionWallFilter, string]> = [["all", "All"], ["today", "Today"], ["week", "This week"], ["month", "This month"], ["manual", "My notes"], ["chapter", "Memories"], ["pinned", "Pinned"], ["favorites", "Favourites"]];
  const views: Array<[ReflectionWallView, string]> = [["wall", "Wall"], ["list", "List"]];
  const sorts: Array<[ReflectionWallSort, string]> = [["manual", "Wall order"], ["newest", "Newest"], ["oldest", "Oldest"]];
  return `<details class="reflection-wall-filter-menu reflection-find-drawer"><summary class="reflection-header-control" aria-label="Find notes"><span class="rw-action-icon" aria-hidden="true">⌕</span><span class="rw-action-label">Find</span></summary><div class="reflection-find-panel"><div class="reflection-find-sheet-head"><span>FIND ON THE WALL</span><strong>Look through what Muji kept</strong></div><label class="reflection-search-field"><span>Words</span><input id="reflection-search" type="search" placeholder="Search a thought…" value="${app.escapeHtml(app.reflectionWallSearch)}"></label><div class="reflection-find-group"><span>Show</span><div class="reflection-chip-row">${filters.map(([filter, label]) => `<button class="${app.reflectionWallFilter === filter ? "selected" : ""}" data-action="reflection-wall-filter" data-filter="${filter}">${label}</button>`).join("")}</div></div><div class="reflection-find-group"><span>View</span><div class="reflection-chip-row">${views.map(([view, label]) => `<button class="${app.reflectionWallView === view ? " selected" : ""}" data-action="reflection-wall-view" data-view="${view}">${label}</button>`).join("")}</div></div><div class="reflection-find-group"><span>Order</span><div class="reflection-chip-row">${sorts.map(([sort, label]) => `<button class="${app.reflectionWallSort === sort ? "selected" : ""}" data-action="reflection-wall-sort" data-sort="${sort}">${label}</button>`).join("")}</div></div><small class="reflection-find-hint">Tap Find again to tuck this drawer away.</small></div></details>`;
}

function renderHeader(app: ReflectionWallApp, count: number): string {
  const ui = stateFor(app as object);
  return `<header class="reflection-wall-header"><div class="reflection-wall-heading-row"><div class="reflection-wall-title"><span>MUJI ROOM</span><h2>Reflection Wall</h2><p><b>${count}</b> little thing${count === 1 ? "" : "s"} kept here</p></div><button class="reflection-header-control reflection-wall-close-button" data-action="close" aria-label="Close Reflection Wall"><span class="rw-action-icon" aria-hidden="true">×</span></button></div><nav class="reflection-wall-actions" aria-label="Reflection Wall tools"><button class="reflection-header-control reflection-primary-action" data-action="reflection-note-new" aria-label="Leave a note"><span class="rw-action-icon" aria-hidden="true">✎</span><span class="rw-action-label">Note</span></button>${renderFind(app)}${app.reflectionWallView === "wall" ? `<button type="button" class="reflection-header-control${ui.arrange ? " selected" : ""}" data-reflection-arrange-toggle aria-label="${ui.arrange ? "Finish arranging" : "Arrange wall"}"><span class="rw-action-icon" aria-hidden="true">✥</span><span class="rw-action-label">${ui.arrange ? "Done" : "Arrange"}</span></button>` : ""}</nav></header>`;
}

function attachPaperPicker(app: ReflectionWallApp): void {
  const select = app.overlay.querySelector<HTMLSelectElement>("#reflection-note-style");
  const preview = app.overlay.querySelector<HTMLElement>("[data-reflection-paper-preview]");
  const buttons = app.overlay.querySelectorAll<HTMLButtonElement>("[data-reflection-style]");
  if (!select || !preview) return;
  const centreChoice = (button: HTMLButtonElement) => button.scrollIntoView({ block: "nearest", inline: "center" });
  buttons.forEach((button) => button.addEventListener("click", () => {
    const style = button.dataset.reflectionStyle ?? "paper-mix";
    select.value = style;
    buttons.forEach((item) => item.classList.toggle("selected", item === button));
    preview.className = `reflection-compose-paper ${style === "paper-mix" ? "paper-cream-torn" : `paper-${style}`}`;
    centreChoice(button);
  }));
  const selected = app.overlay.querySelector<HTMLButtonElement>(".reflection-paper-choice.selected");
  if (selected) requestAnimationFrame(() => centreChoice(selected));
}

function safeInsetsForShell(shell: HTMLElement, section: HTMLElement): ReflectionInsets {
  const rect = section.getBoundingClientRect();
  if (!rect.width || !rect.height) return DEFAULT_SAFE_INSETS;
  return {
    x: Math.max(DEFAULT_SAFE_INSETS.x, Math.min(34, (shell.offsetWidth / rect.width) * 50 + 2)),
    y: Math.max(DEFAULT_SAFE_INSETS.y, Math.min(34, (shell.offsetHeight / rect.height) * 50 + 2))
  };
}

function attachWallPagination(app: ReflectionWallApp): void {
  const ui = stateFor(app as object);
  app.overlay.querySelectorAll<HTMLButtonElement>("[data-reflection-show-more]").forEach((button) => button.addEventListener("click", () => {
    ui.visibleSections += 1;
    app.openReflectionWall();
    requestAnimationFrame(() => app.overlay.querySelector<HTMLElement>(`[data-reflection-section="${ui.visibleSections - 1}"]`)?.scrollIntoView({ block: "start" }));
  }));
}

function attachArrange(app: ReflectionWallApp): void {
  const ui = stateFor(app as object);
  app.overlay.querySelectorAll<HTMLButtonElement>("[data-reflection-arrange-toggle]").forEach((button) => button.addEventListener("click", () => {
    ui.arrange = !ui.arrange;
    if (!ui.arrange) ui.selectedNoteId = "";
    app.openReflectionWall();
  }));
  app.overlay.querySelectorAll<HTMLButtonElement>("[data-reflection-rotate]").forEach((button) => button.addEventListener("click", () => {
    if (!ui.selectedNoteId) return;
    const delta = Number(button.dataset.reflectionRotate);
    app.reflectionWall = rotateReflectionNote(app.reflectionWall, ui.selectedNoteId, delta);
    app.save.saveReflectionWall(app.reflectionWall);
    app.openReflectionWall();
  }));
  if (!ui.arrange) return;

  app.overlay.querySelectorAll<HTMLButtonElement>("[data-reflection-move]").forEach((button) => {
    const shell = button.closest<HTMLElement>("[data-note-shell]");
    const section = button.closest<HTMLElement>("[data-reflection-section]");
    if (!shell || !section) return;
    button.addEventListener("keydown", (event) => {
      const noteId = button.dataset.note ?? "";
      if (!noteId || !["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(event.key)) return;
      event.preventDefault();
      const note = app.reflectionWall.notes.find((item) => item.id === noteId);
      if (!note) return;
      const step = event.shiftKey ? 5 : 2;
      const next = { x: note.x, y: note.y };
      if (event.key === "ArrowLeft") next.x -= step;
      if (event.key === "ArrowRight") next.x += step;
      if (event.key === "ArrowUp") next.y -= step;
      if (event.key === "ArrowDown") next.y += step;
      const safe = reflectionSafePosition(next, safeInsetsForShell(shell, section));
      ui.selectedNoteId = noteId;
      app.reflectionWall = moveReflectionNote(app.reflectionWall, noteId, safe);
      app.save.saveReflectionWall(app.reflectionWall);
      app.openReflectionWall();
      requestAnimationFrame(() => app.overlay.querySelector<HTMLButtonElement>(`[data-reflection-move][data-note="${CSS.escape(noteId)}"]`)?.focus());
    });
    button.addEventListener("pointerdown", (event) => {
      if (event.button !== 0) return;
      const noteId = button.dataset.note ?? "";
      if (!noteId) return;
      const startX = event.clientX;
      const startY = event.clientY;
      let moved = false;
      let live = reflectionSafePosition({ x: 50, y: 50 });
      button.setPointerCapture(event.pointerId);
      shell.classList.add("lifting");
      const onMove = (moveEvent: PointerEvent) => {
        const distance = Math.hypot(moveEvent.clientX - startX, moveEvent.clientY - startY);
        if (!moved && !reflectionDragIntent(distance)) return;
        moved = true;
        const rect = section.getBoundingClientRect();
        const raw = { x: ((moveEvent.clientX - rect.left) / Math.max(1, rect.width)) * 100, y: ((moveEvent.clientY - rect.top) / Math.max(1, rect.height)) * 100 };
        const insets = safeInsetsForShell(shell, section);
        live = reflectionSafePosition(raw, insets);
        const note = app.reflectionWall.notes.find((item) => item.id === noteId);
        if (note) shell.setAttribute("style", reflectionWallPositionStyle({ ...note, ...live }, 500, insets));
      };
      const onUp = (upEvent: PointerEvent) => {
        button.removeEventListener("pointermove", onMove);
        button.removeEventListener("pointerup", onUp);
        button.removeEventListener("pointercancel", onUp);
        shell.classList.remove("lifting");
        try { button.releasePointerCapture(upEvent.pointerId); } catch { /* capture may already be released */ }
        ui.selectedNoteId = noteId;
        if (moved) {
          app.reflectionWall = moveReflectionNote(app.reflectionWall, noteId, live);
          app.save.saveReflectionWall(app.reflectionWall);
        }
        app.openReflectionWall();
      };
      button.addEventListener("pointermove", onMove);
      button.addEventListener("pointerup", onUp);
      button.addEventListener("pointercancel", onUp);
    });
  });
}

function attachExperience(app: ReflectionWallApp): void {
  attachArrange(app);
  attachWallPagination(app);
  attachPaperPicker(app);
}

function showReflectionChrome(app: ReflectionWallApp): void {
  app.overlay.classList.add("reflection-wall-overlay");
  app.syncGameplayChromeVisibility();
}

export function installReflectionWallExperienceBridge(prototype: object): void {
  const appPrototype = prototype as ReflectionWallApp;
  appPrototype.openReflectionWall = function (): void {
    const findOpen = this.overlay.querySelector<HTMLDetailsElement>(".reflection-find-drawer")?.open ?? false;
    this.recordsPanelOpen = false;
    this.reflectionWall = migrateLegacyReflectionWall(this.reflectionWall, this.room);
    this.save.saveReflectionWall(this.reflectionWall);
    const notes = visibleReflectionNotes(this.reflectionWall, { view: this.reflectionWallView, sort: this.reflectionWallSort, filter: this.reflectionWallFilter, search: this.reflectionWallSearch });
    const body = this.reflectionWallView === "wall" ? renderWall(this, notes) : renderList(this, notes);
    this.overlay.innerHTML = `<div class="modal reflection-wall-modal reflection-kept-wall" role="dialog" aria-modal="true" aria-label="Reflection Wall">${renderHeader(this, notes.length)}${body}</div>`;
    showReflectionChrome(this);
    if (findOpen) {
      const drawer = this.overlay.querySelector<HTMLDetailsElement>(".reflection-find-drawer");
      if (drawer) drawer.open = true;
    }
    attachExperience(this);
    this.focusStage();
  };

  appPrototype.refreshReflectionWallOnly = function (): void {
    const notes = visibleReflectionNotes(this.reflectionWall, { view: this.reflectionWallView, sort: this.reflectionWallSort, filter: this.reflectionWallFilter, search: this.reflectionWallSearch });
    const count = this.overlay.querySelector<HTMLElement>(".reflection-wall-title p");
    if (count) count.innerHTML = `<b>${notes.length}</b> little thing${notes.length === 1 ? "" : "s"} kept here`;
    const currentBody = this.overlay.querySelector<HTMLElement>(".reflection-wall-canvas, .reflection-kept-list");
    if (!currentBody) return;
    const wrapper = document.createElement("div");
    wrapper.innerHTML = this.reflectionWallView === "wall" ? renderWall(this, notes) : renderList(this, notes);
    const replacement = wrapper.firstElementChild;
    if (replacement) currentBody.replaceWith(replacement);
    attachExperience(this);
  };

  appPrototype.showReflectionComposer = function (noteId = ""): void {
    const note = this.reflectionWall.notes.find((item) => item.id === noteId);
    const selectedStyle = note?.styleId ?? "paper-mix";
    const paperButtons = [`<button type="button" class="reflection-paper-choice surprise${selectedStyle === "paper-mix" ? " selected" : ""}" data-reflection-style="paper-mix"><span>?</span><small>Surprise</small></button>`, ...reflectionPaperStyles.map((style) => `<button type="button" class="reflection-paper-choice paper-${style.id}${selectedStyle === style.id ? " selected" : ""}" data-reflection-style="${style.id}"><span aria-hidden="true"></span><small>${this.escapeHtml(style.label)}</small></button>`)].join("");
    const previewClass = selectedStyle === "paper-mix" ? "cream-torn" : selectedStyle;
    const selectOptions = [`<option value="paper-mix">Paper Mix</option>`, ...reflectionPaperStyles.map((style) => `<option value="${style.id}" ${selectedStyle === style.id ? "selected" : ""}>${style.label}</option>`)].join("");
    this.overlay.innerHTML = `<div class="modal reflection-compose reflection-kept-compose" role="dialog" aria-modal="true" aria-label="${note ? "Edit reflection note" : "Leave a note"}"><header class="reflection-compose-header"><div><span>MUJI ROOM · REFLECTION WALL</span><h2>${note ? "Edit this note" : "Leave a note"}</h2><p>${note ? "Change the words or the paper." : "Keep a small thought where you can see it again."}</p></div><button class="reflection-round-close" data-action="reflection-wall" aria-label="Back to Reflection Wall">×</button></header><div class="reflection-compose-body"><section class="reflection-compose-paper paper-${this.escapeHtml(previewClass)}" data-reflection-paper-preview><span class="reflection-paper-fixture" aria-hidden="true"></span><textarea id="reflection-note-text" rows="7" placeholder="A thought worth keeping…" aria-label="Reflection note">${this.escapeHtml(note?.text ?? "")}</textarea><small>${note ? this.escapeHtml(this.formatReflectionTimestamp(note.createdAt).split(" · ")[0]) : "today"}</small></section><aside class="reflection-paper-tray"><div class="reflection-paper-tray-title"><span>Choose paper</span><p>Swipe the paper tray sideways.</p></div><div class="reflection-paper-choice-grid">${paperButtons}</div></aside></div><select id="reflection-note-style" class="reflection-style-select-hidden" aria-hidden="true" tabindex="-1">${selectOptions}</select><footer class="reflection-compose-footer"><button data-action="reflection-wall">Cancel</button><button class="reflection-primary-action" data-action="reflection-note-save" data-note="${this.escapeHtml(noteId)}">${note ? "Save changes" : "Pin to Wall"}</button></footer></div>`;
    showReflectionChrome(this);
    attachPaperPicker(this);
    this.focusStage();
    requestAnimationFrame(() => this.overlay.querySelector<HTMLTextAreaElement>("#reflection-note-text")?.focus());
  };

  appPrototype.showReflectionDetail = function (noteId: string): void {
    const note = this.reflectionWall.notes.find((item) => item.id === noteId);
    if (!note) return;
    const papers = reflectionPaperStyles.map((style) => `<button class="reflection-detail-paper paper-${style.id}${note.styleId === style.id ? " selected" : ""}" data-action="reflection-note-paper" data-note="${this.escapeHtml(note.id)}" data-style="${style.id}" aria-label="Change paper to ${this.escapeHtml(style.label)}"><span aria-hidden="true"></span></button>`).join("");
    this.overlay.innerHTML = `<div class="modal reflection-detail reflection-kept-detail" role="dialog" aria-modal="true" aria-label="Reflection note detail"><header class="reflection-detail-header"><div><span>${note.source === "chapter" ? "FROM A MEMORY" : "KEPT BY MUJI"}</span><h2>${note.source === "chapter" ? "Memory note" : "A note from the wall"}</h2></div><button class="reflection-round-close" data-action="reflection-wall" aria-label="Back to Reflection Wall">×</button></header><div class="reflection-detail-scroll"><section class="reflection-detail-paper-stage"><article class="reflection-detail-note paper-${this.escapeHtml(note.styleId)}"><span class="reflection-paper-fixture" aria-hidden="true"></span><p>${this.escapeHtml(note.text).replace(/\n/g, "<br>")}</p><small>— ${this.escapeHtml(this.formatReflectionTimestamp(note.createdAt).split(" · ")[0])}</small>${sourceStamp(this, note)}</article></section><div class="reflection-detail-meta"><span>${note.source === "chapter" ? `Memory${note.chapterId ? ` · ${this.escapeHtml(note.chapterId)}` : ""}` : "Manual note"}</span>${note.updatedAt ? `<span>Edited ${this.escapeHtml(this.formatReflectionTimestamp(note.updatedAt))}</span>` : ""}</div><section class="reflection-detail-controls"><div class="reflection-detail-actions"><button data-action="reflection-note-edit" data-note="${this.escapeHtml(note.id)}">Edit</button><button class="${note.pinned ? "selected" : ""}" data-action="reflection-note-pin" data-note="${this.escapeHtml(note.id)}">${note.pinned ? "● Pinned" : "○ Pin"}</button><button class="${note.favorite ? "selected" : ""}" data-action="reflection-note-favorite" data-note="${this.escapeHtml(note.id)}">${note.favorite ? "★ Favourite" : "☆ Favourite"}</button><button class="danger" data-action="reflection-note-delete" data-note="${this.escapeHtml(note.id)}">Delete</button></div><div class="reflection-detail-papers"><span>Change paper</span><div>${papers}</div></div></section></div><footer class="reflection-detail-footer"><button data-action="reflection-wall">Back to Wall</button></footer></div>`;
    showReflectionChrome(this);
    this.focusStage();
  };
}
