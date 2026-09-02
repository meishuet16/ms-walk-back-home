import { deleteReflectionNote, type ReflectionWallState } from "./ReflectionWall.js";

type ReflectionRemoveApp = {
  overlay: HTMLElement;
  reflectionWall: ReflectionWallState;
  save: { saveReflectionWall: (state: ReflectionWallState) => void };
  openReflectionWall: () => void;
  escapeHtml?: (value: string) => string;
  [key: string]: unknown;
};

const initialized = new WeakSet<object>();

function surfaceRemoveAction(app: ReflectionRemoveApp): void {
  const detail = app.overlay.querySelector<HTMLElement>(".reflection-kept-detail");
  const footer = detail?.querySelector<HTMLElement>(".reflection-detail-footer");
  if (!detail || !footer || footer.querySelector("[data-reflection-visible-remove]")) return;
  const noteId = detail.querySelector<HTMLElement>("[data-action='reflection-note-edit'][data-note]")?.dataset.note;
  if (!noteId) return;
  const button = document.createElement("button");
  button.type = "button";
  button.className = "reflection-visible-remove danger";
  button.dataset.reflectionRemoveRequest = noteId;
  button.dataset.reflectionVisibleRemove = "true";
  button.textContent = "Remove note";
  footer.prepend(button);
}

function removeConfirmMarkup(noteId: string): string {
  const safeId = noteId.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  return `<div class="reflection-remove-confirm" data-reflection-remove-confirm role="alertdialog" aria-modal="true" aria-labelledby="reflection-remove-title" aria-describedby="reflection-remove-copy">
    <div class="reflection-remove-card">
      <span class="reflection-remove-eyebrow">REFLECTION WALL</span>
      <div class="reflection-remove-mark" aria-hidden="true">×</div>
      <h3 id="reflection-remove-title">Let this note go?</h3>
      <p id="reflection-remove-copy">It will be removed from your Reflection Wall. This cannot be undone.</p>
      <div class="reflection-remove-actions">
        <button type="button" data-reflection-remove-cancel>Keep it</button>
        <button type="button" class="reflection-remove-danger" data-reflection-remove-confirm-id="${safeId}">Remove note</button>
      </div>
    </div>
  </div>`;
}

function showRemoveConfirm(app: ReflectionRemoveApp, noteId: string): void {
  app.overlay.querySelector("[data-reflection-remove-confirm]")?.remove();
  app.overlay.insertAdjacentHTML("beforeend", removeConfirmMarkup(noteId));
  requestAnimationFrame(() => app.overlay.querySelector<HTMLButtonElement>("[data-reflection-remove-cancel]")?.focus());
}

function bindRemoveFlow(app: ReflectionRemoveApp): void {
  app.overlay.addEventListener("click", (event) => {
    const target = event.target as HTMLElement | null;
    const request = target?.closest<HTMLElement>("[data-reflection-remove-request]");
    if (request) {
      event.preventDefault();
      event.stopPropagation();
      showRemoveConfirm(app, request.dataset.reflectionRemoveRequest ?? "");
      return;
    }
    if (target?.closest("[data-reflection-remove-cancel]")) {
      event.preventDefault();
      event.stopPropagation();
      app.overlay.querySelector("[data-reflection-remove-confirm]")?.remove();
      return;
    }
    const confirmButton = target?.closest<HTMLElement>("[data-reflection-remove-confirm-id]");
    if (!confirmButton) return;
    event.preventDefault();
    event.stopPropagation();
    const noteId = confirmButton.dataset.reflectionRemoveConfirmId ?? "";
    if (!noteId) return;
    app.reflectionWall = deleteReflectionNote(app.reflectionWall, noteId);
    app.save.saveReflectionWall(app.reflectionWall);
    app.openReflectionWall();
  }, true);
}

export function initializeReflectionNoteRemove(appObject: object): void {
  if (initialized.has(appObject)) return;
  initialized.add(appObject);
  const app = appObject as ReflectionRemoveApp;
  bindRemoveFlow(app);
  surfaceRemoveAction(app);
  const observer = new MutationObserver(() => surfaceRemoveAction(app));
  observer.observe(app.overlay, { childList: true, subtree: true });
}
