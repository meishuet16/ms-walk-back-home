import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "../..");

test("main installs the local backup supplement bridge", () => {
  const main = readFileSync(resolve(root, "src/main.ts"), "utf8");
  assert.match(main, /installLocalBackupSupplementBridge\(WalkBackHomeApp\.prototype\)/);
  assert.match(main, /LocalBackupSupplementBridge\.js/);
});
