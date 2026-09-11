(() => {
  const nativePlay = HTMLMediaElement.prototype.play;
  const nativeRecorderStart = typeof MediaRecorder === "undefined" ? null : MediaRecorder.prototype.start;
  const knownAudio = new Set();
  const activeRecorders = new Set();
  const activeVoicePlayers = new Set();
  let resumeAfterRecording = new Set();
  let resumeAfterVoicePlayback = new Set();

  const isVoicePlayback = (audio) =>
    audio instanceof HTMLAudioElement &&
    (audio.matches(".journal-audio-player") || audio.closest(".capsule-experience") !== null);

  const resumeAudio = (audioSet) => {
    for (const audio of audioSet) {
      if (!audio.isConnected || audio.ended || isVoicePlayback(audio)) continue;
      void nativePlay.call(audio).catch(() => undefined);
    }
  };

  const finishVoicePlayback = (audio) => {
    if (!activeVoicePlayers.delete(audio) || activeVoicePlayers.size > 0) return;
    if (activeRecorders.size > 0) return;

    const toResume = [...resumeAfterVoicePlayback];
    resumeAfterVoicePlayback.clear();
    resumeAudio(toResume);
  };

  const finishRecording = (recorder) => {
    if (!activeRecorders.delete(recorder) || activeRecorders.size > 0) return;
    const toResume = [...resumeAfterRecording];
    resumeAfterRecording.clear();
    if (activeVoicePlayers.size === 0) resumeAudio(toResume);
  };

  HTMLMediaElement.prototype.play = function (...args) {
    if (this instanceof HTMLAudioElement) {
      knownAudio.add(this);
      if (activeRecorders.size > 0) return Promise.resolve();
    }
    return nativePlay.apply(this, args);
  };

  document.addEventListener("play", (event) => {
    const audio = event.target;
    if (!(audio instanceof HTMLAudioElement) || !isVoicePlayback(audio)) return;

    knownAudio.add(audio);
    if (activeVoicePlayers.has(audio)) return;

    activeVoicePlayers.add(audio);
    if (activeVoicePlayers.size === 1) {
      resumeAfterVoicePlayback = new Set(
        [...knownAudio].filter((candidate) =>
          candidate !== audio &&
          !isVoicePlayback(candidate) &&
          !candidate.paused &&
          !candidate.ended
        )
      );
      for (const backgroundAudio of resumeAfterVoicePlayback) backgroundAudio.pause();
    }
  }, true);

  document.addEventListener("pause", (event) => {
    const audio = event.target;
    if (audio instanceof HTMLAudioElement && isVoicePlayback(audio)) finishVoicePlayback(audio);
  }, true);

  document.addEventListener("ended", (event) => {
    const audio = event.target;
    if (audio instanceof HTMLAudioElement && isVoicePlayback(audio)) finishVoicePlayback(audio);
  }, true);

  if (!nativeRecorderStart) return;

  MediaRecorder.prototype.start = function (...args) {
    const result = nativeRecorderStart.apply(this, args);
    if (activeRecorders.has(this)) return result;

    activeRecorders.add(this);
    if (activeRecorders.size === 1) {
      const playingAudio = [...knownAudio].filter((audio) => !audio.paused && !audio.ended);
      resumeAfterRecording = new Set([
        ...resumeAfterVoicePlayback,
        ...playingAudio.filter((audio) => !isVoicePlayback(audio))
      ]);
      resumeAfterVoicePlayback.clear();
      for (const audio of playingAudio) audio.pause();
    }

    this.addEventListener("stop", () => finishRecording(this), { once: true });
    this.addEventListener("error", () => finishRecording(this), { once: true });
    return result;
  };
})();
