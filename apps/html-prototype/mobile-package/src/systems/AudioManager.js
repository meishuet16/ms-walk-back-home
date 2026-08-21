import { globalMusic, sceneMusicDataUri } from "./SceneMusic.js";
export class AudioManager {
    track = null;
    muted = false;
    volume = 0.45;
    constructor() {
        this.track = new Audio(globalMusic.src);
        this.track.loop = true;
        this.track.preload = "auto";
        this.track.volume = this.volume;
        this.track.muted = false;
        this.track.addEventListener("error", () => {
            if (!this.track)
                return;
            this.track.src = sceneMusicDataUri("bakery");
            void this.ensurePlaying();
        }, { once: true });
    }
    async enable() {
        this.muted = false;
        if (this.track)
            this.track.muted = false;
        await this.ensurePlaying();
    }
    async ensurePlaying() {
        if (!this.track || this.muted)
            return;
        await this.track.play().catch(() => undefined);
    }
    setMuted(muted) {
        this.muted = muted;
        if (this.track)
            this.track.muted = muted;
        if (!muted)
            void this.ensurePlaying();
    }
    setVolume(volume) {
        this.volume = Math.max(0, Math.min(1, volume));
        if (this.track)
            this.track.volume = this.volume;
    }
    setScene(_scene) {
        void this.ensurePlaying();
    }
    ping(_kind = "forest") {
        void this.ensurePlaying();
    }
}
