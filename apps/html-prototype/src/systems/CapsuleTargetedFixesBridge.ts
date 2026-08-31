type CapsuleHost = {
  handleClick?: (event: Event) => void;
  activateRoomInteraction?: (interaction: { id: string }) => void;
};

function ensureCapsuleMenuEntry(): void {
  document.querySelectorAll<HTMLElement>(".room-menu-actions").forEach((actions) => {
    if (actions.querySelector('[data-action="room-capsule"]')) return;
    const button = document.createElement("button");
    button.type = "button";
    button.dataset.action = "room-capsule";
    button.textContent = "Capsule";
    const reflection = actions.querySelector('[data-action="room-reflection"]');
    if (reflection) reflection.insertAdjacentElement("afterend", button);
    else actions.append(button);
  });
}

export function installCapsuleTargetedFixesBridge(prototype: object): void {
  const marker = prototype as CapsuleHost & { __capsuleTargetedFixesInstalled?: boolean };
  if (marker.__capsuleTargetedFixesInstalled) return;
  marker.__capsuleTargetedFixesInstalled = true;

  const originalHandleClick = marker.handleClick;
  if (originalHandleClick) {
    marker.handleClick = function (event: Event): void {
      const target = (event.target as HTMLElement | null)?.closest<HTMLElement>('[data-action="room-capsule"]');
      if (target) {
        this.activateRoomInteraction?.({ id: "capsule" });
        return;
      }
      originalHandleClick.call(this, event);
      queueMicrotask(ensureCapsuleMenuEntry);
    };
  }

  const observer = new MutationObserver(ensureCapsuleMenuEntry);
  observer.observe(document.documentElement, { childList: true, subtree: true });
  ensureCapsuleMenuEntry();

  const mediaDevices = navigator.mediaDevices;
  if (!mediaDevices?.getUserMedia) return;
  const originalGetUserMedia = mediaDevices.getUserMedia.bind(mediaDevices);
  mediaDevices.getUserMedia = ((constraints?: MediaStreamConstraints) => {
    if (document.querySelector(".capsule-experience") && constraints?.audio) {
      // Match the project's proven Journal recorder path: let the phone/browser
      // choose its native microphone processing instead of forcing sample-rate,
      // AGC and noise-processing constraints that can sound chopped on Android.
      return originalGetUserMedia({ ...constraints, audio: true });
    }
    return originalGetUserMedia(constraints);
  }) as typeof mediaDevices.getUserMedia;
}
