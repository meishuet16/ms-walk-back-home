(() => {
  if (typeof MediaRecorder === "undefined") return;

  const nativePlay = HTMLMediaElement.prototype.play;
  const nativeRecorderStart = MediaRecorder.prototype.start;
  const knownAudio = new Set();
  const activeRecorders = new Set();
  let resumeAfterRecording = new Set();

  const finishRecording = (recorder) => {
    if (!activeRecorders.delete(recorder) || activeRecorders.size > 0) return;
    const toResume = [...resumeAfterRecording];
    resumeAfterRecording.clear();
    for (const audio of toResume) {
      void nativePlay.call(audio).catch(() => undefined);
    }
  };

  HTMLMediaElement.prototype.play = function (...args) {
    if (this instanceof HTMLAudioElement) {
      knownAudio.add(this);
      if (activeRecorders.size > 0) return Promise.resolve();
    }
    return nativePlay.apply(this, args);
  };

  MediaRecorder.prototype.start = function (...args) {
    const result = nativeRecorderStart.apply(this, args);
    if (activeRecorders.has(this)) return result;

    activeRecorders.add(this);
    if (activeRecorders.size === 1) {
      resumeAfterRecording = new Set([...knownAudio].filter((audio) => !audio.paused && !audio.ended));
      for (const audio of resumeAfterRecording) audio.pause();
    }

    this.addEventListener("stop", () => finishRecording(this), { once: true });
    this.addEventListener("error", () => finishRecording(this), { once: true });
    return result;
  };
})();
