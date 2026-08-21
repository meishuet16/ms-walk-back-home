import assert from "node:assert/strict";
import test from "node:test";
import { JournalAudioRecorder, selectSupportedAudioMimeType, type JournalAudioRecorderDependencies, type MediaRecorderLike, type MediaStreamLike } from "../src/systems/JournalAudioRecorder.js";

class FakeTrack {
  stopped = false;

  stop(): void {
    this.stopped = true;
  }
}

class FakeStream implements MediaStreamLike {
  constructor(public readonly tracks = [new FakeTrack(), new FakeTrack()]) {}

  getTracks(): FakeTrack[] {
    return this.tracks;
  }
}

class FakeRecorder implements MediaRecorderLike {
  state: "inactive" | "recording" | "paused" = "inactive";
  mimeType = "audio/mp4";
  private listeners = new Map<string, Array<(event: { data?: Blob; error?: Error }) => void>>();

  start(): void {
    this.state = "recording";
  }

  stop(): void {
    this.state = "inactive";
    this.emit("dataavailable", { data: new Blob(["chunk"], { type: this.mimeType }) });
    this.emit("stop", {});
  }

  pause(): void {
    this.state = "paused";
  }

  resume(): void {
    this.state = "recording";
  }

  addEventListener(type: string, listener: (event: { data?: Blob; error?: Error }) => void): void {
    this.listeners.set(type, [...(this.listeners.get(type) ?? []), listener]);
  }

  private emit(type: string, event: { data?: Blob; error?: Error }): void {
    for (const listener of this.listeners.get(type) ?? []) listener(event);
  }
}

function dependencies(stream: FakeStream, recorder: FakeRecorder, now: () => number): JournalAudioRecorderDependencies {
  return {
    getUserMedia: async () => stream,
    createRecorder: () => recorder,
    isTypeSupported: (mime) => mime === "audio/mp4",
    now
  };
}

test("supported MIME selection prefers the first supported recording format", () => {
  assert.equal(selectSupportedAudioMimeType((mime) => mime === "audio/mp4"), "audio/mp4");
  assert.equal(selectSupportedAudioMimeType(() => false), undefined);
});

test("permission denial leaves the recorder inactive", async () => {
  const deps: JournalAudioRecorderDependencies = {
    getUserMedia: async () => { throw new Error("Permission denied"); },
    createRecorder: () => { throw new Error("should not create recorder"); },
    isTypeSupported: () => true,
    now: () => 0
  };
  const recorder = new JournalAudioRecorder(deps);

  await assert.rejects(() => recorder.start(), /Permission denied/);
  assert.equal(recorder.isActive(), false);
});

test("stopping a recording returns one blob and stops every stream track", async () => {
  const stream = new FakeStream();
  const mediaRecorder = new FakeRecorder();
  const recorder = new JournalAudioRecorder(dependencies(stream, mediaRecorder, (() => {
    const values = [1000, 2750];
    return () => values.shift() ?? 2750;
  })()));

  await recorder.start();
  const result = await recorder.stop();

  assert.equal(result.mimeType, "audio/mp4");
  assert.equal(await result.blob.text(), "chunk");
  assert.equal(result.duration, 1.75);
  assert.equal(recorder.isActive(), false);
  assert.equal(stream.tracks.every((track) => track.stopped), true);
});

test("pause and resume delegate only while recording is active", async () => {
  const stream = new FakeStream();
  const mediaRecorder = new FakeRecorder();
  const recorder = new JournalAudioRecorder(dependencies(stream, mediaRecorder, () => 0));

  await recorder.start();
  recorder.pause();
  assert.equal(mediaRecorder.state, "paused");
  recorder.resume();
  assert.equal(mediaRecorder.state, "recording");
  await recorder.stop();
  recorder.pause();
  recorder.resume();
  assert.equal(mediaRecorder.state, "inactive");
});

test("a second recording cannot start while one is active", async () => {
  const stream = new FakeStream();
  const mediaRecorder = new FakeRecorder();
  const recorder = new JournalAudioRecorder(dependencies(stream, mediaRecorder, () => 0));

  await recorder.start();

  await assert.rejects(() => recorder.start(), /already active/);
  recorder.cancel();
});
