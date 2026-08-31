type CapsuleMenuHost = {
  renderTopNav?: () => void;
  handleClick?: (event: Event) => void;
  activateRoomInteraction?: (interaction: { id: string }) => void;
};

function addCapsuleToCurrentTopNav(): void {
  // The hamburger menu is rendered into the app's top-nav host, but that host
  // does not carry a `.top-nav` class. Target the canonical Reflection Wall
  // action itself so Capsule is inserted into the exact same menu surface.
  const reflection = document.querySelector<HTMLButtonElement>('button[data-action="reflection-wall"]');
  if (!reflection || document.querySelector('button[data-action="room-capsule"]')) return;

  const button = document.createElement("button");
  button.type = "button";
  button.dataset.action = "room-capsule";
  button.textContent = "Capsule";
  reflection.insertAdjacentElement("afterend", button);
}

export function installCapsuleMenuBridge(prototype: object): void {
  const host = prototype as CapsuleMenuHost & { __capsuleMenuBridgeInstalled?: boolean };
  if (host.__capsuleMenuBridgeInstalled) return;
  host.__capsuleMenuBridgeInstalled = true;

  const originalRenderTopNav = host.renderTopNav;
  if (originalRenderTopNav) {
    host.renderTopNav = function (): void {
      originalRenderTopNav.call(this);
      addCapsuleToCurrentTopNav();
    };
  }

  const originalHandleClick = host.handleClick;
  if (originalHandleClick) {
    host.handleClick = function (event: Event): void {
      const capsuleEntry = (event.target as HTMLElement | null)?.closest<HTMLElement>('[data-action="room-capsule"]');
      if (capsuleEntry) {
        this.activateRoomInteraction?.({ id: "capsule" });
        return;
      }
      originalHandleClick.call(this, event);
    };
  }
}
