type CapsuleMenuHost = {
  renderTopNav?: () => void;
  handleClick?: (event: Event) => void;
  activateRoomInteraction?: (interaction: { id: string }) => void;
};

function addCapsuleToCurrentTopNav(): void {
  const reflection = document.querySelector<HTMLElement>('.top-nav [data-action="reflection-wall"]');
  if (!reflection || document.querySelector('.top-nav [data-action="room-capsule"]')) return;
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
