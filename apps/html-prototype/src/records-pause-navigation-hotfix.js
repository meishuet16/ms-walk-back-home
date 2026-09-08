(() => {
  let personalPlaybackPausedByUser = false;
  let managedAudio = null;
  const nativePlay = HTMLMediaElement.prototype.play;

  const isSceneMusic = (media) => {
    const src = media.currentSrc || media.src || "";
    return /\/assets\/audio\/(?:forest|bakery)\.mp3(?:$|[?#])/.test(src) || src.startsWith("data:audio/");
  };

  const actionFor = (target) => target instanceof Element ? target.closest("[data-action]")?.getAttribute("data-action") ?? "" : "";

  document.addEventListener("click", (event) => {
    const target = event.target;
    const action = actionFor(target);

    if (action === "vinyl-pause") {
      const button = target instanceof Element ? target.closest('[data-action="vinyl-pause"]') : null;
      const isPauseAction = button?.getAttribute("aria-label") === "Pause" || button?.getAttribute("title") === "Pause" || button?.textContent?.includes("⏸");
      personalPlaybackPausedByUser = !!isPauseAction;
      return;
    }

    if (["select-vinyl", "music-prev", "music-next"].includes(action)) {
      personalPlaybackPausedByUser = false;
    }
  }, true);

  HTMLMediaElement.prototype.play = function (...args) {
    if (this instanceof HTMLAudioElement && managedAudio === null) managedAudio = this;
    if (this === managedAudio) {
      if (isSceneMusic(this)) personalPlaybackPausedByUser = false;
      else if (personalPlaybackPausedByUser) return Promise.resolve();
    }
    return nativePlay.apply(this, args);
  };
})();
