import { cp, mkdir, copyFile, readdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
await mkdir(resolve(root, "dist/public"), { recursive: true });
await cp(resolve(root, "public"), resolve(root, "dist/public"), { recursive: true });
await cp(resolve(root, "public/assets"), resolve(root, "dist/assets"), { recursive: true });
const audioFiles = (await readdir(resolve(root, "public/assets/audio"))).filter((file) => file.toLowerCase().endsWith(".mp3"));
await writeFile(resolve(root, "dist/assets/audio-manifest.json"), JSON.stringify({ files: audioFiles }, null, 2));
await writeFile(resolve(root, "dist/public/assets/audio-manifest.json"), JSON.stringify({ files: audioFiles }, null, 2));
await copyFile(resolve(root, "src/index.html"), resolve(root, "dist/index.html"));
await copyFile(resolve(root, "src/styles.css"), resolve(root, "dist/styles.css"));
console.log("Built isolated HTML prototype to apps/html-prototype/dist");
