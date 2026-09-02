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

export function initializeCapsuleFullscreenBridge(appObject: object): void {
  if (initialized.has(appObject)) return;
  initialized.add(appObject);

  const observer = new MutationObserver(() => keepCapsuleInVisibleTree());
  observer.observe(document.body, { childList: true, subtree: true });
  document.addEventListener("fullscreenchange", keepCapsuleInVisibleTree);
  keepCapsuleInVisibleTree();
}
