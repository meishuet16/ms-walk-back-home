type ReflectionRemoveApp = {
  overlay: HTMLElement;
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
  button.dataset.action = "reflection-note-delete";
  button.dataset.note = noteId;
  button.dataset.reflectionVisibleRemove = "true";
  button.textContent = "Remove note";
  footer.prepend(button);
}

export function initializeReflectionNoteRemove(appObject: object): void {
  if (initialized.has(appObject)) return;
  initialized.add(appObject);
  const app = appObject as ReflectionRemoveApp;
  surfaceRemoveAction(app);
  const observer = new MutationObserver(() => surfaceRemoveAction(app));
  observer.observe(app.overlay, { childList: true, subtree: true });
}
