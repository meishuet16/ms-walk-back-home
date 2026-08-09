import { globalMusic, sceneMusic, sceneMusicDataUri, type MusicScene } from "./SceneMusic.js";

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
      this.track.src = sceneMusicDataUri("bakery");
      void this.ensurePlaying();
    }, { once: true });
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
    if (this.track.src.endsWith(src)) return;
    const wasPaused = this.track.paused;
    this.track.pause();
    this.track.src = src;
    this.track.loop = true;
    this.track.volume = this.volume;
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

  ping(_kind: "forest" | "bakery" | "ending" = "forest"): void {
    void this.ensurePlaying();
  }
}
