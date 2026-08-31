type KeptCardSnapshot = {
  id: string;
  title: string;
  date: string;
  meta: string;
};

let installed = false;
let selectionMode = false;
let selectedIds = new Set<string>();
let allowNativeRemoval = false;
let pendingRemovalIds: string[] = [];

function keptPage(): HTMLElement | null {
  return document.querySelector<HTMLElement>(".capsule-experience .capsule-page--kept");
}

function keptCards(page = keptPage()): HTMLElement[] {
  return page ? [...page.querySelectorAll<HTMLElement>(".capsule-kept-card--preview[data-capsule-id]")] : [];
}

function snapshotForCard(card: HTMLElement): KeptCardSnapshot {
  return {
    id: card.dataset.capsuleId ?? "",
    title: card.querySelector<HTMLElement>(".capsule-kept-preview-copy p")?.textContent?.trim() || "Media capsule",
    date: card.querySelector<HTMLElement>("time")?.textContent?.trim() || "",
    meta: card.querySelector<HTMLElement>(".capsule-kept-media-summary")?.textContent?.replace(/\s+/g, " ").trim() || ""
  };
}

function removeModal(): void {
  document.querySelector(".capsule-remove-dialog-backdrop")?.remove();
}

function modalMarkup(items: KeptCardSnapshot[]): string {
  const many = items.length > 1;
  const first = items[0];
  const heading = many ? `Remove ${items.length} capsules?` : "Remove this capsule?";
  const detail = many
    ? `<div class="capsule-remove-dialog__selection"><span class="capsule-remove-dialog__count">${items.length}</span><div><strong>Selected capsules</strong><small>They will all be permanently removed from your drawer.</small></div></div>`
    : `<div class="capsule-remove-dialog__selection"><span class="capsule-remove-dialog__heart">♡</span><div><strong>${escapeHtml(first?.title || "Kept capsule")}</strong>${first?.date ? `<small>${escapeHtml(first.date)}</small>` : ""}${first?.meta ? `<small class="capsule-remove-dialog__meta">${escapeHtml(first.meta)}</small>` : ""}</div></div>`;
  return `<div class="capsule-remove-dialog-backdrop" role="presentation">
    <section class="capsule-remove-dialog" role="alertdialog" aria-modal="true" aria-labelledby="capsule-remove-title" aria-describedby="capsule-remove-copy">
      <div class="capsule-remove-dialog__illustration" aria-hidden="true"><span>♡</span></div>
      <h3 id="capsule-remove-title">${heading}</h3>
      <p id="capsule-remove-copy">This will permanently delete ${many ? "them" : "it"} from your drawer.<br>This action cannot be undone.</p>
      ${detail}
      <div class="capsule-remove-dialog__actions">
        <button type="button" data-capsule-organizer-action="cancel-remove"><span aria-hidden="true">×</span>Cancel</button>
        <button class="is-danger" type="button" data-capsule-organizer-action="confirm-remove"><span aria-hidden="true">♧</span>${many ? "Yes, remove them" : "Yes, remove it"}</button>
      </div>
      <small class="capsule-remove-dialog__safe"><span aria-hidden="true">▣</span>Your other memories are safe.</small>
    </section>
  </div>`;
}

function escapeHtml(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}

function showRemoveModal(ids: string[]): void {
  const cards = keptCards();
  const snapshots = ids
    .map((id) => cards.find((card) => card.dataset.capsuleId === id))
    .filter((card): card is HTMLElement => Boolean(card))
    .map(snapshotForCard);
  if (!snapshots.length) return;
  pendingRemovalIds = snapshots.map((item) => item.id);
  removeModal();
  keptPage()?.insertAdjacentHTML("beforeend", modalMarkup(snapshots));
  keptPage()?.querySelector<HTMLButtonElement>('[data-capsule-organizer-action="cancel-remove"]')?.focus();
}

function setSelectionMode(next: boolean): void {
  selectionMode = next;
  if (!next) selectedIds.clear();
  enhanceKeptPage();
}

function selectAll(page: HTMLElement): void {
  const ids = keptCards(page).map((card) => card.dataset.capsuleId).filter((id): id is string => Boolean(id));
  const allSelected = ids.length > 0 && ids.every((id) => selectedIds.has(id));
  selectedIds = allSelected ? new Set<string>() : new Set(ids);
  enhanceKeptPage();
}

function selectedCountCopy(): string {
  const count = selectedIds.size;
  return `${count} selected`;
}

function toolbarMarkup(total: number): string {
  if (!selectionMode) {
    return `<div class="capsule-kept-organizer"><span>${total} kept</span><button type="button" data-capsule-organizer-action="select-mode">Select</button></div>`;
  }
  const allSelected = total > 0 && selectedIds.size === total;
  return `<div class="capsule-kept-organizer is-selecting"><span>${selectedCountCopy()}</span><div><button type="button" data-capsule-organizer-action="select-all">${allSelected ? "Clear all" : "Select all"}</button><button type="button" data-capsule-organizer-action="done-selecting">Done</button></div></div>`;
}

function bulkBarMarkup(): string {
  if (!selectionMode || selectedIds.size === 0) return "";
  return `<div class="capsule-kept-bulk-bar" role="toolbar" aria-label="Selected capsule actions">
    <span><strong>${selectedIds.size}</strong> selected</span>
    <button type="button" data-capsule-organizer-action="return-selected"><span aria-hidden="true">↻</span>Return</button>
    <button class="is-danger" type="button" data-capsule-organizer-action="remove-selected"><span aria-hidden="true">×</span>Remove</button>
  </div>`;
}

function enhanceKeptPage(): void {
  const page = keptPage();
  if (!page) return;
  const cards = keptCards(page);
  const validIds = new Set(cards.map((card) => card.dataset.capsuleId).filter((id): id is string => Boolean(id)));
  selectedIds = new Set([...selectedIds].filter((id) => validIds.has(id)));

  const intro = page.querySelector(".capsule-kept-intro");
  let organizer = page.querySelector<HTMLElement>(".capsule-kept-organizer");
  if (!organizer) {
    organizer = document.createElement("div");
    intro?.insertAdjacentElement("afterend", organizer);
  }
  organizer.outerHTML = toolbarMarkup(cards.length);

  cards.forEach((card) => {
    const id = card.dataset.capsuleId;
    if (!id) return;
    card.classList.toggle("is-selecting", selectionMode);
    card.classList.toggle("is-selected", selectedIds.has(id));
    card.setAttribute("aria-selected", selectedIds.has(id) ? "true" : "false");
    let selector = card.querySelector<HTMLButtonElement>(".capsule-kept-selector");
    if (!selector) {
      selector = document.createElement("button");
      selector.type = "button";
      selector.className = "capsule-kept-selector";
      selector.dataset.capsuleOrganizerAction = "toggle-item";
      selector.dataset.capsuleId = id;
      selector.innerHTML = '<span aria-hidden="true">✓</span>';
      card.prepend(selector);
    }
    selector.hidden = !selectionMode;
    selector.setAttribute("aria-label", selectedIds.has(id) ? "Deselect capsule" : "Select capsule");
    selector.setAttribute("aria-pressed", selectedIds.has(id) ? "true" : "false");
  });

  page.querySelector(".capsule-kept-bulk-bar")?.remove();
  if (selectionMode && selectedIds.size) page.insertAdjacentHTML("beforeend", bulkBarMarkup());
}

function clickExistingAction(id: string, action: "return" | "remove-kept"): void {
  const button = document.querySelector<HTMLButtonElement>(`.capsule-experience .capsule-kept-card--preview[data-capsule-id="${CSS.escape(id)}"] [data-capsule-action="${action}"]`);
  if (!button) return;
  if (action === "remove-kept") {
    const nativeConfirm = window.confirm;
    allowNativeRemoval = true;
    window.confirm = () => true;
    try {
      button.click();
    } finally {
      window.confirm = nativeConfirm;
      allowNativeRemoval = false;
    }
  } else {
    button.click();
  }
}

function handleOrganizerAction(target: HTMLElement, event: Event): boolean {
  const action = target.dataset.capsuleOrganizerAction;
  if (!action) return false;
  event.preventDefault();
  event.stopPropagation();

  const page = keptPage();
  if (!page) return true;
  if (action === "select-mode") setSelectionMode(true);
  if (action === "done-selecting") setSelectionMode(false);
  if (action === "select-all") selectAll(page);
  if (action === "toggle-item") {
    const id = target.dataset.capsuleId;
    if (id) {
      if (selectedIds.has(id)) selectedIds.delete(id);
      else selectedIds.add(id);
      enhanceKeptPage();
    }
  }
  if (action === "return-selected") {
    const ids = [...selectedIds];
    ids.forEach((id) => clickExistingAction(id, "return"));
    selectedIds.clear();
    enhanceKeptPage();
  }
  if (action === "remove-selected") showRemoveModal([...selectedIds]);
  if (action === "cancel-remove") {
    pendingRemovalIds = [];
    removeModal();
  }
  if (action === "confirm-remove") {
    const ids = [...pendingRemovalIds];
    pendingRemovalIds = [];
    removeModal();
    ids.forEach((id) => clickExistingAction(id, "remove-kept"));
    ids.forEach((id) => selectedIds.delete(id));
    if (!keptCards().length) selectionMode = false;
    enhanceKeptPage();
  }
  return true;
}

function handleCaptureClick(event: Event): void {
  const element = event.target as HTMLElement | null;
  if (!element) return;
  const organizerTarget = element.closest<HTMLElement>("[data-capsule-organizer-action]");
  if (organizerTarget && handleOrganizerAction(organizerTarget, event)) return;

  const removeButton = element.closest<HTMLElement>('.capsule-experience .capsule-kept-remove[data-capsule-action="remove-kept"]');
  if (removeButton && !allowNativeRemoval) {
    event.preventDefault();
    event.stopPropagation();
    const id = removeButton.dataset.capsuleId;
    if (id) showRemoveModal([id]);
    return;
  }

  const card = element.closest<HTMLElement>(".capsule-experience .capsule-kept-card--preview[data-capsule-id]");
  if (card && selectionMode && !element.closest(".capsule-kept-card-actions")) {
    event.preventDefault();
    event.stopPropagation();
    const id = card.dataset.capsuleId;
    if (id) {
      if (selectedIds.has(id)) selectedIds.delete(id);
      else selectedIds.add(id);
      enhanceKeptPage();
    }
  }
}

function handleKeydown(event: KeyboardEvent): void {
  if (!keptPage()) return;
  if (event.key === "Escape" && document.querySelector(".capsule-remove-dialog-backdrop")) {
    event.stopPropagation();
    pendingRemovalIds = [];
    removeModal();
    return;
  }
  if (event.key === "Escape" && selectionMode) {
    event.stopPropagation();
    setSelectionMode(false);
  }
}

export function installCapsuleKeptOrganizerBridge(): void {
  if (installed) return;
  installed = true;
  document.addEventListener("click", handleCaptureClick, true);
  window.addEventListener("keydown", handleKeydown, true);
  const observer = new MutationObserver(() => queueMicrotask(enhanceKeptPage));
  observer.observe(document.body, { childList: true, subtree: true });
  enhanceKeptPage();
}
