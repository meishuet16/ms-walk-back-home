import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..", "..", "..");
const verifier = join(repoRoot, "scripts", "verify-capacitor-assets.mjs");
const requiredPaths = [
  "index.html",
  "browser/main.js",
  "assets/forest.png",
  "assets/muji-room.png",
  "assets/1029/1029-landscape.png",
  "assets/1029/memory-portrait/main-arrival.png",
  "scene-layouts/1029/landscape.json",
  "assets/audio/forest.mp3",
  "lrc/manifest.json",
  "browser/ffmpeg/ffmpeg-core.js",
  "browser/ffmpeg/ffmpeg-core.wasm",
  "browser/worker.js",
  "browser/pdf.worker.mjs",
];

test("Capacitor asset verifier accepts a complete synced web root", () => {
  const androidRoot = mkdtempSync(join(tmpdir(), "walk-back-home-capacitor-"));
  const webRoot = join(androidRoot, "app", "src", "main", "assets", "public");
  try {
    for (const relativePath of requiredPaths) {
      const file = join(webRoot, relativePath);
      mkdirSync(dirname(file), { recursive: true });
      writeFileSync(file, "fixture");
    }
    execFileSync(process.execPath, [verifier, androidRoot], { stdio: "pipe" });
    assert.equal(existsSync(verifier), true);
  } finally {
    rmSync(androidRoot, { recursive: true, force: true });
  }
});
