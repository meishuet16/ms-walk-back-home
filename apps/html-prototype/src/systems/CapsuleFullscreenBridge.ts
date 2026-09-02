type CapsuleFullscreenApp = {
  activateRoomInteraction?: (interaction: { id: string }) => void;
};

const initialized = new WeakSet<object>();

function fullscreenHost(): HTMLElement | null {
  return document.fullscreenElement instanceof HTMLElement ? document.fullscreenElement : null;
}

function keepCapsuleInVisibleTree(): void {
  const capsule = document.querySelector<HTMLElement>(".capsule-experience");
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
  // Fullscreen only renders descendants of document.fullscreenElement. The
  // Capsule machine creates its modal under body, so move it synchronously
  // into the fullscreen host before the browser paints the next frame.
  keepCapsuleInVisibleTree();
  requestAnimationFrame(keepCapsuleInVisibleTree);
}

export function initializeCapsuleFullscreenBridge(appObject: object): void {
  if (initialized.has(appObject)) return;
  initialized.add(appObject);
  const app = appObject as CapsuleFullscreenApp;

  const observer = new MutationObserver(() => keepCapsuleInVisibleTree());
  observer.observe(document.body, { childList: true, subtree: true });
  document.addEventListener("fullscreenchange", keepCapsuleInVisibleTree);

  document.addEventListener("click", (event) => {
    const target = (event.target as HTMLElement | null)?.closest<HTMLElement>("[data-quick-destination='capsule']");
    if (!target || !fullscreenHost()) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    openCapsuleAndMount(app);
  }, true);

  keepCapsuleInVisibleTree();
}
