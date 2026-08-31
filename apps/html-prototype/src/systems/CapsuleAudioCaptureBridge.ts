let installed = false;

export function installCapsuleAudioCaptureBridge(): void {
  if (installed) return;
  installed = true;

  document.addEventListener("click", (event) => {
    const target = (event.target as HTMLElement | null)?.closest<HTMLElement>('[data-capsule-action="record"]');
    if (!target?.closest(".capsule-experience")) return;

    const mediaDevices = navigator.mediaDevices;
    if (!mediaDevices?.getUserMedia) return;
    const original = mediaDevices.getUserMedia.bind(mediaDevices);
    let restored = false;
    const restore = (): void => {
      if (restored) return;
      restored = true;
      mediaDevices.getUserMedia = original as typeof mediaDevices.getUserMedia;
    };

    mediaDevices.getUserMedia = ((constraints?: MediaStreamConstraints) => {
      restore();
      // Use the same native microphone request shape as the existing Journal
      // recorder instead of forcing Android DSP/sample-rate constraints.
      return original(constraints?.audio ? { ...constraints, audio: true } : constraints);
    }) as typeof mediaDevices.getUserMedia;

    // The Capsule handler runs later in this same click dispatch. Restore even
    // if it exits before requesting the microphone.
    setTimeout(restore, 0);
  }, true);
}
