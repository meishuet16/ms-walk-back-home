import { globalMusic, sceneMusic, sceneMusicDataUri, type MusicScene } from "./SceneMusic.js";

function defaultAudioBase(): string {
  return globalThis.document?.baseURI ?? globalThis.location?.href ?? "http://localhost/";
}

export function resolveAudioSource(src: string, baseHref = defaultAudioBase()): string {
  return new URL(src, baseHref).href;
}

export function sameAudioSource(currentSrc: string, nextSrc: string, baseHref = defaultAudioBase()): boolean {
  return resolveAudioSource(currentSrc, baseHref) === resolveAudioSource(nextSrc, baseHref);
}

export class AudioManager {
  private track: HTMLAudioElement | null = null;
  muted = false;
  volume = 0.45;

  constructor() {
    this.track = new Audio(globalMusic.src);
    this.track.loop = true;
    this.track.preload = "auto";
    this.track.volume = this.volume;
    this.track.muted = false;
    this.track.addEventListener("error", () => {
      if (!this.track) return;
      if (this.track.src.startsWith("data:audio/")) return;
      this.track.src = sceneMusicDataUri("bakery");
      void this.ensurePlaying();
    });
  }

  async enable(): Promise<void> {
    this.muted = false;
    if (this.track) this.track.muted = false;
    await this.ensurePlaying();
  }

  async ensurePlaying(): Promise<void> {
    if (!this.track || this.muted) return;
    await this.track.play().catch(() => undefined);
  }

  setMuted(muted: boolean): void {
    this.muted = muted;
    if (this.track) this.track.muted = muted;
    if (!muted) void this.ensurePlaying();
  }

  setVolume(volume: number): void {
    this.volume = Math.max(0, Math.min(1, volume));
    if (this.track) this.track.volume = this.volume;
  }

  setTrack(src: string): void {
    if (!this.track) return;
    const nextSrc = resolveAudioSource(src);
    if (sameAudioSource(this.track.src, nextSrc)) {
      if (!this.track.paused && !this.muted) void this.ensurePlaying();
      return;
    }
    const wasPaused = this.track.paused;
    this.track.pause();
    this.track.src = nextSrc;
    this.track.loop = true;
    this.track.preload = "auto";
    this.track.volume = this.volume;
    this.track.muted = this.muted;
    this.track.currentTime = 0;
    this.track.load();
    if (!wasPaused && !this.muted) void this.ensurePlaying();
  }

  setScene(scene: MusicScene): void {
    this.setTrack(sceneMusic[scene].src);
    void this.ensurePlaying();
  }

  pause(): void {
    this.track?.pause();
  }

  stop(): void {
    if (!this.track) return;
    this.track.pause();
    this.track.currentTime = 0;
  }

  seek(seconds: number): void {
    if (!this.track) return;
    const duration = Number.isFinite(this.track.duration) ? this.track.duration : Number.POSITIVE_INFINITY;
    this.track.currentTime = Math.max(0, Math.min(duration, seconds));
  }

  getCurrentTime(): number {
    return this.track?.currentTime ?? 0;
  }

  getDuration(): number {
    const duration = this.track?.duration ?? 0;
    return Number.isFinite(duration) ? duration : 0;
  }

  isPaused(): boolean {
    return this.track?.paused ?? true;
  }

  onTimeUpdate(callback: () => void): () => void {
    return this.on("timeupdate", callback);
  }

  onDurationChange(callback: () => void): () => void {
    return this.on("durationchange", callback);
  }

  onEnded(callback: () => void): () => void {
    return this.on("ended", callback);
  }

  onPlay(callback: () => void): () => void {
    return this.on("play", callback);
  }

  onPause(callback: () => void): () => void {
    return this.on("pause", callback);
  }

  ping(_kind: "forest" | "bakery" | "ending" = "forest"): void {
    void this.ensurePlaying();
  }

  private on(type: string, callback: () => void): () => void {
    this.track?.addEventListener(type, callback);
    return () => this.track?.removeEventListener(type, callback);
  }
}
