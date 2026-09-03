import { existsSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const requiredCapacitorAssetPaths = [
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

const ignoredDirectoryNames = new Set([".gradle", ".git", "build", "node_modules", "out"]);

export function findSyncedWebAssetRoot(androidRoot = "android") {
  const root = resolve(androidRoot);
  const pending = [root];
  while (pending.length) {
    const directory = pending.pop();
    if (!directory) continue;
    if (existsSync(resolve(directory, "index.html")) && existsSync(resolve(directory, "browser", "main.js"))) return directory;
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      if (entry.isDirectory() && !ignoredDirectoryNames.has(entry.name)) pending.push(resolve(directory, entry.name));
    }
  }
  throw new Error(`Could not find a synced Capacitor web root under ${root}`);
}

export function missingCapacitorAssets(webRoot) {
  return requiredCapacitorAssetPaths.filter((relativePath) => !existsSync(resolve(webRoot, relativePath)));
}

function main() {
  const androidRoot = process.argv[2] ?? "android";
  const webRoot = findSyncedWebAssetRoot(androidRoot);
  const missing = missingCapacitorAssets(webRoot);
  if (missing.length) {
    console.error(`Missing ${missing.length} required Capacitor asset(s) under ${webRoot}:`);
    for (const relativePath of missing) console.error(`- ${relativePath}`);
    process.exitCode = 1;
    return;
  }
  console.log(`Verified ${requiredCapacitorAssetPaths.length} local Capacitor assets under ${webRoot}`);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
