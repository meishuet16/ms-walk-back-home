import assert from "node:assert/strict";
import test from "node:test";
import { AudioManager, resolveAudioSource, sameAudioSource } from "../src/systems/AudioManager.js";

class ControlledAudio {
  static instances: ControlledAudio[] = [];
  private listeners = new Map<string, Array<() => void>>();
  private _src = "";
  loop = false;
  preload = "";
  volume = 0;
  muted = false;
  paused = true;
  currentTime = 0;
  duration = 180;
  readyState = 0;
  seekable = { length: 0 };
  loadCount = 0;

  constructor(src: string) {
    this.src = src;
    ControlledAudio.instances.push(this);
  }

  set src(value: string) {
    this._src = new URL(value, "http://localhost:4173/").href;
  }

  get src(): string {
    return this._src;
  }

  addEventListener(type: string, callback: () => void): void {
    this.listeners.set(type, [...(this.listeners.get(type) ?? []), callback]);
  }

  removeEventListener(type: string, callback: () => void): void {
    this.listeners.set(type, (this.listeners.get(type) ?? []).filter((item) => item !== callback));
  }

  emit(type: string): void {
    for (const callback of this.listeners.get(type) ?? []) callback();
  }

  load(): void {
    this.loadCount += 1;
  }

  pause(): void {
    this.paused = true;
  }

  async play(): Promise<void> {
    this.paused = false;
  }
}

test("audio manager resolves encoded local mp3 sources against the current page", () => {
  const base = "http://localhost:4173/room/index.html";
  const source = "assets/audio/Dear%20D%20(%E4%BA%B2%E7%88%B1%E7%9A%84%E5%91%8A%E8%AF%89%E4%BD%A0)-%E9%A1%B9%E7%9D%BF%E5%A8%B4.mp3";

  assert.equal(
    resolveAudioSource(source, base),
    "http://localhost:4173/room/assets/audio/Dear%20D%20(%E4%BA%B2%E7%88%B1%E7%9A%84%E5%91%8A%E8%AF%89%E4%BD%A0)-%E9%A1%B9%E7%9D%BF%E5%A8%B4.mp3"
  );
});

test("audio manager compares sources after URL normalization", () => {
  const base = "http://localhost:4173/";
  const source = "assets/audio/%E5%B0%8F%E5%AD%A9-%E7%BD%97%E6%A3%AE%E6%B6%9B.mp3";
  const absolute = "http://localhost:4173/assets/audio/%E5%B0%8F%E5%AD%A9-%E7%BD%97%E6%A3%AE%E6%B6%9B.mp3";

  assert.equal(sameAudioSource(absolute, source, base), true);
  assert.equal(sameAudioSource(absolute, "assets/audio/forest.mp3", base), false);
});

test("audio manager exposes playback time duration seek and lifecycle events", () => {
  const OriginalAudio = globalThis.Audio;
  const events = new Map<string, Array<() => void>>();
  class FakeAudio {
    static instances: FakeAudio[] = [];
    src = "";
    loop = false;
    preload = "";
    volume = 0;
    muted = false;
    paused = true;
    currentTime = 0;
    duration = 180;

    constructor(src: string) {
      this.src = src;
      FakeAudio.instances.push(this);
    }

    addEventListener(type: string, callback: () => void): void {
      events.set(type, [...(events.get(type) ?? []), callback]);
    }

    removeEventListener(type: string, callback: () => void): void {
      events.set(type, (events.get(type) ?? []).filter((item) => item !== callback));
    }

    async play(): Promise<void> {
      this.paused = false;
      for (const callback of events.get("play") ?? []) callback();
    }

    pause(): void {
      this.paused = true;
      for (const callback of events.get("pause") ?? []) callback();
    }

    load(): void {}
  }
  Object.defineProperty(globalThis, "Audio", { configurable: true, value: FakeAudio });
  try {
    const manager = new AudioManager();
    let updated = 0;
    const unsubscribe = manager.onTimeUpdate(() => updated += 1);
    manager.seek(24);
    manager.setLoop(false);
    for (const callback of events.get("timeupdate") ?? []) callback();

    assert.equal(manager.getCurrentTime(), 24);
    assert.equal(manager.getDuration(), 180);
    assert.equal(manager.isPaused(), true);
    assert.equal(FakeAudio.instances[0].loop, false);
    manager.setLoop(true);
    assert.equal(FakeAudio.instances[0].loop, true);
    assert.equal(updated, 1);

    unsubscribe();
    for (const callback of events.get("timeupdate") ?? []) callback();
    assert.equal(updated, 1);
  } finally {
    Object.defineProperty(globalThis, "Audio", { configurable: true, value: OriginalAudio });
  }
});

test("current encoded static source seeks without reloading the media element", () => {
  const OriginalAudio = globalThis.Audio;
  Object.defineProperty(globalThis, "Audio", { configurable: true, value: ControlledAudio });
  ControlledAudio.instances = [];
  try {
    const manager = new AudioManager();
    const source = "assets/audio/%E5%B0%8F%E5%8D%8A-%E9%99%B3%E7%B2%92.mp3";
    manager.setTrack(source);
    const audio = ControlledAudio.instances[0];
    audio.readyState = 4;
    audio.seekable = { length: 1 };
    audio.currentTime = 20;
    const loads = audio.loadCount;

    assert.equal(manager.isCurrentTrack(source), true);
    assert.equal(manager.setTrack(source), false);
    manager.seek(90);

    assert.equal(audio.loadCount, loads);
    assert.equal(audio.src, resolveAudioSource(source));
    assert.equal(manager.getCurrentTime(), 90);
  } finally {
    Object.defineProperty(globalThis, "Audio", { configurable: true, value: OriginalAudio });
  }
});

test("AudioManager waits for source readiness and reports seek settlement", async () => {
  const OriginalAudio = globalThis.Audio;
  Object.defineProperty(globalThis, "Audio", { configurable: true, value: ControlledAudio });
  ControlledAudio.instances = [];
  try {
    const manager = new AudioManager();
    const audio = ControlledAudio.instances[0];
    const readiness = (manager as unknown as { waitForSeekReady: () => Promise<boolean> }).waitForSeekReady();
    audio.readyState = 1;
    audio.seekable = { length: 1 };
    audio.emit("loadedmetadata");
    assert.equal(await readiness, true);

    const settled = (manager as unknown as { seekAndWait: (seconds: number) => Promise<boolean> }).seekAndWait(90);
    audio.currentTime = 90;
    audio.emit("seeked");
    assert.equal(await settled, true);

    const failed = (manager as unknown as { seekAndWait: (seconds: number) => Promise<boolean> }).seekAndWait(120);
    audio.currentTime = 3;
    audio.emit("seeked");
    assert.equal(await failed, false);
  } finally {
    Object.defineProperty(globalThis, "Audio", { configurable: true, value: OriginalAudio });
  }
});
