import type { ReflectionNote, ReflectionWallState } from "../types.js";

type ReflectionContinuumHost = {
  overlay: HTMLElement;
  reflectionWall: ReflectionWallState;
  save: { saveReflectionWall: (state: ReflectionWallState) => void };
  escapeHtml: (value: string) => string;
  formatReflectionTimestamp: (value: string) => string;
  openReflectionWall: () => void;
  refreshReflectionWallOnly: () => void;
};

const WALL_UNITS_KEY = "walk-back-home:reflection-wall-units:v1";
const WALL_MIGRATED_KEY = "walk-back-home:reflection-wall-continuum-migrated:v1";
const DEFAULT_UNITS = 2;
const MAX_UNITS = 12;
const LEGACY_NOTES_PER_SECTION = 6;
const DRAG_THRESHOLD = 6;

type Point = { x: number; y: number };

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function readUnits(): number {
  try {
    const value = Number(window.localStorage.getItem(WALL_UNITS_KEY));
    return Number.isFinite(value) ? clamp(Math.round(value), 1, MAX_UNITS) : DEFAULT_UNITS;
  } catch {
    return DEFAULT_UNITS;
  }
}

function writeUnits(value: number): void {
  try { window.localStorage.setItem(WALL_UNITS_KEY, String(clamp(Math.round(value), 1, MAX_UNITS))); } catch { /* local preference only */ }
}

function wallMinHeight(units: number): number {
  return 520 + Math.max(0, units - 1) * 420;
}

function renderStatus(note: ReflectionNote): string {
  const badges = [
    note.pinned ? `<span class="reflection-status-badge pinned"><span aria-hidden="true">●</span> Pinned</span>` : "",
    note.favorite ? `<span class="reflection-status-badge favourite"><span aria-hidden="true">★</span> Favourite</span>` : ""
  ].filter(Boolean).join("");
  return badges ? `<span class="reflection-note-statuses">${badges}</span>` : "";
}

function renderNote(app: ReflectionContinuumHost, note: ReflectionNote, arranging: boolean, selected: boolean): string {
  const date = app.formatReflectionTimestamp(note.createdAt).split(" · ")[0];
  const source = note.source === "chapter"
    ? `MEMORY${note.chapterId ? ` · ${app.escapeHtml(note.chapterId)}` : ""}`
    : "KEPT BY MUJI";
  const action = arranging
    ? `data-reflection-continuum-move data-note="${app.escapeHtml(note.id)}" aria-label="Move note: ${app.escapeHtml(note.text.slice(0, 80))}"`
    : `data-action="reflection-note-open" data-note="${app.escapeHtml(note.id)}"`;
  const z = (note.pinned ? 120 : 10) + Math.max(0, app.reflectionWall.notes.findIndex((item) => item.id === note.id)) + (selected ? 300 : 0);
  return `<article class="reflection-wall-paper reflection-continuum-paper paper-${app.escapeHtml(note.styleId)}${selected ? " selected" : ""}${note.pinned ? " pinned" : ""}" data-note-shell="${app.escapeHtml(note.id)}" style="left:${note.x}%;top:${note.y}%;transform:translate(-50%,-50%) rotate(${note.rotation}deg);z-index:${z}">
    <button type="button" class="reflection-wall-note" ${action}>
      <span class="reflection-paper-fixture" aria-hidden="true"></span>
      ${renderStatus(note)}
      <span class="reflection-note-copy reflection-note-preview">${app.escapeHtml(note.text).replace(/\n/g, "<br>")}</span>
      <span class="reflection-note-date">— ${app.escapeHtml(date)}</span>
      <span class="reflection-source-stamp${note.source === "manual" ? " manual" : ""}">${source}</span>
    </button>
  </article>`;
}

function migrateLegacySections(app: ReflectionContinuumHost): void {
  let migrated = false;
  try { migrated = window.localStorage.getItem(WALL_MIGRATED_KEY) === "1"; } catch { migrated = false; }
  if (migrated || app.reflectionWall.notes.length <= LEGACY_NOTES_PER_SECTION) return;

  const ordered = [...app.reflectionWall.notes].sort((a, b) => a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id));
  const sections = Math.max(1, Math.ceil(ordered.length / LEGACY_NOTES_PER_SECTION));
  const indexById = new Map(ordered.map((note, index) => [note.id, index]));
  app.reflectionWall = {
    ...app.reflectionWall,
    notes: app.reflectionWall.notes.map((note) => {
      const index = indexById.get(note.id) ?? 0;
      const section = Math.floor(index / LEGACY_NOTES_PER_SECTION);
      const y = clamp(((section + clamp(note.y, 8, 92) / 100) / sections) * 100, 4, 96);
      return { ...note, y };
    })
  };
  app.save.saveReflectionWall(app.reflectionWall);
  writeUnits(Math.max(readUnits(), sections));
  try { window.localStorage.setItem(WALL_MIGRATED_KEY, "1"); } catch { /* migration still valid for this session */ }
}

function continuumHtml(app: ReflectionContinuumHost, arranging: boolean, selectedNoteId: string): string {
  const units = readUnits();
  const notes = app.reflectionWall.notes.map((note) => renderNote(app, note, arranging, selectedNoteId === note.id)).join("");
  const empty = app.reflectionWall.notes.length === 0
    ? `<div class="reflection-wall-empty"><span aria-hidden="true">✦</span><h3>The wall is quiet.</h3><p>Leave a thought here when one feels worth seeing again.</p><button data-action="reflection-note-new">Leave a note</button></div>`
    : "";
  return `<section class="reflection-wall-canvas reflection-continuum-wall${arranging ? " arranging" : ""}" data-reflection-canvas aria-label="Reflection Wall" style="--reflection-continuum-height:${wallMinHeight(units)}px">
    <div class="reflection-continuum-surface" data-reflection-continuum-surface>
      <div class="reflection-wall-grain" aria-hidden="true"></div>
      ${notes}${empty}
      <div class="reflection-wall-extend"><button type="button" data-reflection-extend-wall aria-label="Add more space to the Reflection Wall"><span aria-hidden="true">＋</span><strong>Make more room</strong><small>Add space below for any note</small></button></div>
    </div>
  </section>`;
}

function noteInsets(shell: HTMLElement, surface: HTMLElement): Point {
  const rect = surface.getBoundingClientRect();
  return {
    x: clamp((shell.offsetWidth / Math.max(1, rect.width)) * 50 + 2, 8, 42),
    y: clamp((shell.offsetHeight / Math.max(1, rect.height)) * 50 + 1, 2, 28)
  };
}

function safePoint(shell: HTMLElement, surface: HTMLElement, point: Point): Point {
  const inset = noteInsets(shell, surface);
  return { x: clamp(point.x, inset.x, 100 - inset.x), y: clamp(point.y, inset.y, 100 - inset.y) };
}

function savePosition(app: ReflectionContinuumHost, id: string, point: Point): void {
  const now = new Date().toISOString();
  app.reflectionWall = {
    ...app.reflectionWall,
    notes: app.reflectionWall.notes.map((note) => note.id === id ? { ...note, x: point.x, y: point.y, updatedAt: now } : note)
  };
  app.save.saveReflectionWall(app.reflectionWall);
}

function attachFindClose(app: ReflectionContinuumHost): void {
  const details = app.overlay.querySelector<HTMLDetailsElement>(".reflection-find-drawer");
  const head = app.overlay.querySelector<HTMLElement>(".reflection-find-sheet-head");
  if (!details || !head || head.querySelector("[data-reflection-find-close]")) return;
  const close = document.createElement("button");
  close.type = "button";
  close.className = "reflection-find-close";
  close.dataset.reflectionFindClose = "";
  close.setAttribute("aria-label", "Close Find");
  close.textContent = "×";
  head.append(close);
  close.addEventListener("click", () => { details.open = false; });
}

function attachExtend(app: ReflectionContinuumHost): void {
  const button = app.overlay.querySelector<HTMLButtonElement>("[data-reflection-extend-wall]");
  const canvas = app.overlay.querySelector<HTMLElement>("[data-reflection-canvas]");
  const surface = app.overlay.querySelector<HTMLElement>("[data-reflection-continuum-surface]");
  if (!button || !canvas || !surface) return;
  button.addEventListener("click", () => {
    const oldHeight = surface.getBoundingClientRect().height;
    const oldUnits = readUnits();
    if (oldUnits >= MAX_UNITS) return;
    const oldScroll = canvas.scrollTop;
    const newUnits = oldUnits + 1;
    const newHeight = wallMinHeight(newUnits);
    const ratio = oldHeight / Math.max(1, newHeight);
    app.reflectionWall = {
      ...app.reflectionWall,
      notes: app.reflectionWall.notes.map((note) => ({ ...note, y: clamp(note.y * ratio, 1, 99) }))
    };
    app.save.saveReflectionWall(app.reflectionWall);
    writeUnits(newUnits);
    app.openReflectionWall();
    requestAnimationFrame(() => {
      const next = app.overlay.querySelector<HTMLElement>("[data-reflection-canvas]");
      if (next) next.scrollTop = oldScroll;
    });
  });
}

function attachDrag(app: ReflectionContinuumHost, selected: { id: string }): void {
  const surface = app.overlay.querySelector<HTMLElement>("[data-reflection-continuum-surface]");
  if (!surface) return;
  app.overlay.querySelectorAll<HTMLButtonElement>("[data-reflection-continuum-move]").forEach((button) => {
    const shell = button.closest<HTMLElement>("[data-note-shell]");
    if (!shell) return;
    button.addEventListener("pointerdown", (event) => {
      if (event.button !== 0) return;
      const id = button.dataset.note ?? "";
      if (!id) return;
      const startX = event.clientX;
      const startY = event.clientY;
      let moved = false;
      let live: Point | null = null;
      button.setPointerCapture(event.pointerId);
      shell.classList.add("lifting");
      const move = (moveEvent: PointerEvent) => {
        if (!moved && Math.hypot(moveEvent.clientX - startX, moveEvent.clientY - startY) < DRAG_THRESHOLD) return;
        moved = true;
        const rect = surface.getBoundingClientRect();
        live = safePoint(shell, surface, {
          x: ((moveEvent.clientX - rect.left) / Math.max(1, rect.width)) * 100,
          y: ((moveEvent.clientY - rect.top) / Math.max(1, rect.height)) * 100
        });
        const note = app.reflectionWall.notes.find((item) => item.id === id);
        if (!note || !live) return;
        shell.style.left = `${live.x}%`;
        shell.style.top = `${live.y}%`;
        shell.style.transform = `translate(-50%,-50%) rotate(${note.rotation}deg)`;
        shell.style.zIndex = "999";
      };
      const up = (upEvent: PointerEvent) => {
        button.removeEventListener("pointermove", move);
        button.removeEventListener("pointerup", up);
        button.removeEventListener("pointercancel", up);
        shell.classList.remove("lifting");
        try { button.releasePointerCapture(upEvent.pointerId); } catch { /* already released */ }
        selected.id = id;
        if (moved && live) savePosition(app, id, live);
      };
      button.addEventListener("pointermove", move);
      button.addEventListener("pointerup", up);
      button.addEventListener("pointercancel", up);
    });
  });
}

function decorateList(app: ReflectionContinuumHost): void {
  const list = app.overlay.querySelector<HTMLElement>(".reflection-kept-list");
  if (!list) return;
  list.classList.add("reflection-continuum-list");
  list.querySelectorAll<HTMLElement>(".reflection-kept-marks").forEach((marks) => {
    marks.querySelectorAll<HTMLElement>(".pin").forEach((mark) => mark.setAttribute("data-label", "Pinned"));
    marks.querySelectorAll<HTMLElement>(".favorite").forEach((mark) => mark.setAttribute("data-label", "Favourite"));
  });
}

function replaceWall(app: ReflectionContinuumHost, selected: { id: string }): void {
  migrateLegacySections(app);
  attachFindClose(app);
  const current = app.overlay.querySelector<HTMLElement>(".reflection-wall-canvas");
  if (!current) {
    decorateList(app);
    return;
  }
  const canvasScroll = current.scrollTop;
  const arranging = Boolean(app.overlay.querySelector("[data-reflection-arrange-toggle].selected"));
  const wrapper = document.createElement("div");
  wrapper.innerHTML = continuumHtml(app, arranging, selected.id);
  const replacement = wrapper.firstElementChild as HTMLElement | null;
  if (!replacement) return;
  current.replaceWith(replacement);
  attachExtend(app);
  attachDrag(app, selected);
  requestAnimationFrame(() => {
    const next = app.overlay.querySelector<HTMLElement>("[data-reflection-canvas]");
    if (next) next.scrollTop = Math.min(canvasScroll, Math.max(0, next.scrollHeight - next.clientHeight));
  });
}

export function installReflectionWallContinuumBridge(prototype: object): void {
  const appPrototype = prototype as ReflectionContinuumHost;
  const selected = { id: "" };

  const open = appPrototype.openReflectionWall;
  appPrototype.openReflectionWall = function (): void {
    const previousScroll = this.overlay.querySelector<HTMLElement>("[data-reflection-canvas]")?.scrollTop ?? 0;
    open.call(this);
    replaceWall(this, selected);
    requestAnimationFrame(() => {
      const canvas = this.overlay.querySelector<HTMLElement>("[data-reflection-canvas]");
      if (canvas) canvas.scrollTop = Math.min(previousScroll, Math.max(0, canvas.scrollHeight - canvas.clientHeight));
    });
  };

  const refresh = appPrototype.refreshReflectionWallOnly;
  appPrototype.refreshReflectionWallOnly = function (): void {
    const previousScroll = this.overlay.querySelector<HTMLElement>("[data-reflection-canvas]")?.scrollTop ?? 0;
    refresh.call(this);
    replaceWall(this, selected);
    requestAnimationFrame(() => {
      const canvas = this.overlay.querySelector<HTMLElement>("[data-reflection-canvas]");
      if (canvas) canvas.scrollTop = Math.min(previousScroll, Math.max(0, canvas.scrollHeight - canvas.clientHeight));
    });
  };
}
