import type { ReflectionWallState } from "../types.js";

type ReflectionBoundsHost = {
  overlay: HTMLElement;
  reflectionWall: ReflectionWallState;
  openReflectionWall: () => void;
  refreshReflectionWallOnly: () => void;
};

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function normalizePaperBounds(app: ReflectionBoundsHost): void {
  app.overlay.querySelectorAll<HTMLElement>("[data-note-shell]").forEach((shell) => {
    const noteId = shell.dataset.noteShell ?? "";
    const note = app.reflectionWall.notes.find((item) => item.id === noteId);
    const section = shell.closest<HTMLElement>("[data-reflection-section]");
    if (!note || !section) return;
    const rect = section.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;
    const xInset = clamp((shell.offsetWidth / rect.width) * 50 + 2, 12, 34);
    const yInset = clamp((shell.offsetHeight / rect.height) * 50 + 2, 12, 34);
    const safeX = clamp(note.x, xInset, 100 - xInset);
    const safeY = clamp(note.y, yInset, 100 - yInset);
    shell.style.left = `${safeX}%`;
    shell.style.top = `${safeY}%`;
  });
}

export function installReflectionWallPaperBoundsBridge(prototype: object): void {
  const appPrototype = prototype as ReflectionBoundsHost;
  const openReflectionWall = appPrototype.openReflectionWall;
  appPrototype.openReflectionWall = function (): void {
    openReflectionWall.call(this);
    requestAnimationFrame(() => normalizePaperBounds(this));
  };

  const refreshReflectionWallOnly = appPrototype.refreshReflectionWallOnly;
  appPrototype.refreshReflectionWallOnly = function (): void {
    refreshReflectionWallOnly.call(this);
    requestAnimationFrame(() => normalizePaperBounds(this));
  };
}
