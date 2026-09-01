import assert from "node:assert/strict";
import test from "node:test";
import { authoredChapterMusic, installChapterMusicBridge } from "../src/systems/ChapterMusicBridge.js";

type EndedListener = () => void;

class FakeAudio {
  src = "";
  loop = false;
  position = 42;
  sceneCalls: string[] = [];
  loopCalls: boolean[] = [];
  trackCalls: string[] = [];
  endedListeners = new Set<EndedListener>();

  setTrack(src: string): boolean {
    if (this.src === src) return false;
    this.src = src;
    this.trackCalls.push(src);
    this.position = 0;
    return true;
  }
  isCurrentTrack(src: string): boolean { return this.src === src; }
  setLoop(loop: boolean): void { this.loop = loop; this.loopCalls.push(loop); }
  setScene(scene: "forest" | "bakery"): void { this.sceneCalls.push(scene); this.src = `${scene}.mp3`; }
  async ensurePlaying(): Promise<void> {}
  onEnded(callback: EndedListener): () => void { this.endedListeners.add(callback); return () => this.endedListeners.delete(callback); }
  getCurrentTime(): number { return this.position; }
  seek(seconds: number): void { this.position = seconds; }
  end(): void { for (const listener of [...this.endedListeners]) listener(); }
}

function makeHarness(chapterId = "may23-i-arrived") {
  const prototype: {
    enterCurrentMemory?: () => Promise<void>;
    finishReturnToForest?: () => void;
    applyAudioForCurrentScene?: () => void;
  } = {
    async enterCurrentMemory(this: { scene?: string }): Promise<void> { this.scene = "may23-memory"; },
    applyAudioForCurrentScene(this: { audio?: FakeAudio }): void { this.audio?.setScene("forest"); },
    finishReturnToForest(this: { scene?: string; applyAudioForCurrentScene?: () => void }): void {
      this.scene = "forest";
      this.applyAudioForCurrentScene?.();
    }
  };
  installChapterMusicBridge(prototype);
  const audio = new FakeAudio();
  const app = Object.assign(Object.create(prototype), {
    currentDoor: { chapterId },
    scene: "forest",
    audio
  }) as {
    currentDoor: { chapterId: string };
    scene: string;
    audio: FakeAudio;
    enterCurrentMemory: () => Promise<void>;
    finishReturnToForest: () => void;
  };
  return { app, audio };
}

test("chapter BGM loops while the player remains inside the chapter", async () => {
  const { app, audio } = makeHarness();
  const music = authoredChapterMusic["may23-i-arrived"];
  await app.enterCurrentMemory();
  assert.equal(audio.src, music.src);
  assert.equal(audio.loop, true);
  assert.equal(audio.loopCalls.at(-1), true);
});

test("returning to Forest disables chapter repeat but keeps the current pass until it ends", async () => {
  const { app, audio } = makeHarness();
  const music = authoredChapterMusic["may23-i-arrived"];
  await app.enterCurrentMemory();
  audio.position = 42;

  app.finishReturnToForest();

  assert.equal(app.scene, "forest");
  assert.equal(audio.src, music.src);
  assert.equal(audio.position, 42);
  assert.equal(audio.loop, false);
  assert.deepEqual(audio.sceneCalls, []);

  audio.end();

  assert.deepEqual(audio.sceneCalls, ["forest"]);
  assert.equal(audio.src, "forest.mp3");
  assert.equal(audio.loop, true);
});

test("all authored chapter BGM configs opt into forest carry", () => {
  for (const [chapterId, music] of Object.entries(authoredChapterMusic)) {
    assert.equal(music.continueInForestUntilEnd, true, `${chapterId} must carry into Forest`);
    assert.equal(music.loop, true, `${chapterId} must loop while inside the chapter`);
  }
});
