import assert from "node:assert/strict";
import test from "node:test";
import { JournalMediaBlobStore, type JournalMediaBlobBackend } from "../src/systems/JournalMediaBlobStore.js";

class MemoryBackend implements JournalMediaBlobBackend {
  private values = new Map<string, Blob>();

  async put(key: string, blob: Blob): Promise<void> {
    this.values.set(key, blob);
  }

  async get(key: string): Promise<Blob | null> {
    return this.values.get(key) ?? null;
  }

  async delete(key: string): Promise<void> {
    this.values.delete(key);
  }

  async entries(): Promise<Array<{ key: string; blob: Blob }>> {
    return [...this.values.entries()].map(([key, blob]) => ({ key, blob }));
  }
}

function testStore() {
  const revoked: string[] = [];
  let nextUrl = 0;
  const store = new JournalMediaBlobStore(new MemoryBackend(), {
    createObjectURL: () => `blob:test-${nextUrl++}`,
    revokeObjectURL: (url) => revoked.push(url)
  });
  return { store, revoked };
}

test("journal media blobs round-trip by durable key", async () => {
  const { store } = testStore();
  const blob = new Blob(["voice-fixture"], { type: "audio/mp4" });

  await store.putBlob("journal-media/entry-1/audio-1", blob);
  const restored = await store.getBlob("journal-media/entry-1/audio-1");

  assert.equal(await restored?.text(), "voice-fixture");
  assert.equal(restored?.type, "audio/mp4");
});

test("missing journal media returns null without creating an object URL", async () => {
  const { store } = testStore();

  assert.equal(await store.getBlob("journal-media/missing"), null);
  assert.equal(await store.objectUrlFor("journal-media/missing"), null);
});

test("object URLs are cached and revoked explicitly", async () => {
  const { store, revoked } = testStore();
  await store.putBlob("journal-media/entry-1/audio-1", new Blob(["x"], { type: "audio/ogg" }));

  const first = await store.objectUrlFor("journal-media/entry-1/audio-1");
  const second = await store.objectUrlFor("journal-media/entry-1/audio-1");

  assert.equal(first, second);
  store.revokeObjectUrl("journal-media/entry-1/audio-1");
  assert.deepEqual(revoked, [first]);
});

test("deleting a journal media blob revokes its cached object URL", async () => {
  const { store, revoked } = testStore();
  await store.putBlob("journal-media/entry-1/audio-1", new Blob(["x"], { type: "audio/ogg" }));
  const url = await store.objectUrlFor("journal-media/entry-1/audio-1");

  await store.deleteBlob("journal-media/entry-1/audio-1");

  assert.deepEqual(revoked, [url]);
  assert.equal(await store.getBlob("journal-media/entry-1/audio-1"), null);
});

test("entries returns all persisted journal media blobs", async () => {
  const { store } = testStore();
  await store.putBlob("journal-media/entry-1/audio-1", new Blob(["one"], { type: "audio/webm" }));
  await store.putBlob("journal-media/entry-2/audio-2", new Blob(["two"], { type: "audio/mp4" }));

  const entries = await store.entries();

  assert.deepEqual(entries.map((entry) => entry.key), ["journal-media/entry-1/audio-1", "journal-media/entry-2/audio-2"]);
});
