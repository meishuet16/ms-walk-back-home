export class AudioManager {
  private ctx: AudioContext | null = null;
  muted = true;
  volume = 0.18;

  async enable(): Promise<void> {
    this.ctx ??= new AudioContext();
    this.muted = false;
    await this.ctx.resume();
  }

  setMuted(muted: boolean): void {
    this.muted = muted;
  }

  setVolume(volume: number): void {
    this.volume = Math.max(0, Math.min(1, volume));
  }

  ping(kind: "forest" | "bakery" | "ending" = "forest"): void {
    if (!this.ctx || this.muted) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = kind === "bakery" ? 392 : kind === "ending" ? 330 : 523;
    gain.gain.value = this.volume * 0.08;
    osc.connect(gain).connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.16);
  }
}
