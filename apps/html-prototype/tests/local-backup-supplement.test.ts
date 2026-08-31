import assert from "node:assert/strict";
import test from "node:test";
import { collectLocalBackupSupplementEntries } from "../src/systems/LocalBackupSupplementBridge.js";
import { CAPSULE_STORAGE_KEY } from "../src/systems/CapsuleMachine.js";
import { REFLECTION_WALL_BACKGROUND_KEY } from "../src/systems/ReflectionWallVisualPolishBridge.js";

function encode(blob: Blob): Promise<string> {
  return blob.arrayBuffer().then((buffer) => `data:${blob.type};base64,${Buffer.from(buffer).toString("base64")}`);
}

test("manual backup supplements include capsule state, referenced media, and Reflection Wall background", async () => {
  const storage = new Map<string, string>();
  storage.set(CAPSULE_STORAGE_KEY, JSON.stringify({
    version: 1,
    savedAt: "2026-08-31T14:00:00.000Z",
    thoughts: [{
      id: "capsule-1",
      text: "remember this",
      createdAt: "2026-08-31T14:00:00.000Z",
      status: "kept",
      drawCount: 2,
      attachments: [{ id: "media-1", kind: "image", name: "photo.jpg", mimeType: "image/jpeg", size: 5 }]
    }]
  }));
  storage.set(REFLECTION_WALL_BACKGROUND_KEY, "data:image/jpeg;base64,d2FsbA==");

  const entries = await collectLocalBackupSupplementEntries(
    { getItem: (key) => storage.get(key) ?? null },
    { get: async (key) => key === "media-1" ? new Blob(["photo"], { type: "image/jpeg" }) : null },
    encode
  );

  assert.deepEqual(entries.map((entry) => entry.kind), ["capsule-state", "capsule-media", "reflection-wall-background"]);
  assert.equal(entries[1]?.key, "media-1");
  assert.ok(entries.every((entry) => entry.dataUrl.startsWith("data:")));
});

test("manual backup always records empty capsule/background state so restore can intentionally clear them", async () => {
  const entries = await collectLocalBackupSupplementEntries(
    { getItem: () => null },
    { get: async () => null },
    encode
  );

  assert.deepEqual(entries.map((entry) => entry.kind), ["capsule-state", "reflection-wall-background"]);
});
