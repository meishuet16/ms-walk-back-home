type CapsuleFullscreenApp = {
  activateRoomInteraction?: (interaction: { id: string }) => void;
};

const initialized = new WeakSet<object>();

function fullscreenHost(): HTMLElement | null {
  return document.fullscreenElement instanceof HTMLElement ? document.fullscreenElement : null;
}

function findCapsule(): HTMLElement | null {
  const host = fullscreenHost();
  return host?.querySelector<HTMLElement>(".capsule-experience")
    ?? document.querySelector<HTMLElement>(".capsule-experience");
}

function keepCapsuleInVisibleTree(): void {
  const capsule = findCapsule();
  if (!capsule) return;
  const host = fullscreenHost();
  if (host) {
    if (!host.contains(capsule)) host.appendChild(capsule);
    return;
  }
  if (capsule.parentElement !== document.body) document.body.appendChild(capsule);
}

function openCapsuleAndMount(app: CapsuleFullscreenApp): void {
  app.activateRoomInteraction?.({ id: "capsule" });
  keepCapsuleInVisibleTree();
  queueMicrotask(keepCapsuleInVisibleTree);
  requestAnimationFrame(keepCapsuleInVisibleTree);
}

export function initializeCapsuleFullscreenBridge(appObject: object): void {
  if (initialized.has(appObject)) return;
  initialized.add(appObject);
  const app = appObject as CapsuleFullscreenApp;

  const observer = new MutationObserver(() => keepCapsuleInVisibleTree());
  observer.observe(document.body, { childList: true, subtree: true });
  document.addEventListener("fullscreenchange", keepCapsuleInVisibleTree);

  // In fullscreen the browser only paints descendants of fullscreenElement.
  // CapsuleMachineBridge intentionally owns Capsule state/UI and appends its
  // dialog under body, so this bridge only remounts that existing dialog.
  document.addEventListener("click", (event) => {
    const target = (event.target as HTMLElement | null)?.closest<HTMLElement>("[data-quick-destination='capsule']");
    if (!target || !fullscreenHost()) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    openCapsuleAndMount(app);
  }, true);

  keepCapsuleInVisibleTree();
}
