import { cp, mkdir, copyFile, readdir, writeFile } from "node:fs/promises";
import { build } from "esbuild";
import { dirname, resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
await mkdir(resolve(root, "dist/public"), { recursive: true });
await cp(resolve(root, "public"), resolve(root, "dist/public"), { recursive: true });
await cp(resolve(root, "public/lrc"), resolve(root, "dist/lrc"), { recursive: true });
await cp(resolve(root, "public/scene-layouts"), resolve(root, "dist/scene-layouts"), { recursive: true });
await cp(resolve(root, "public/assets"), resolve(root, "dist/assets"), { recursive: true });
const audioFiles = (await readdir(resolve(root, "public/assets/audio"))).filter((file) => file.toLowerCase().endsWith(".mp3"));
await writeFile(resolve(root, "dist/assets/audio-manifest.json"), JSON.stringify({ files: audioFiles }, null, 2));
await writeFile(resolve(root, "dist/public/assets/audio-manifest.json"), JSON.stringify({ files: audioFiles }, null, 2));
await copyFile(resolve(root, "src/index.html"), resolve(root, "dist/index.html"));
await copyFile(resolve(root, "src/styles.css"), resolve(root, "dist/styles.css"));
for (const file of [
  "spin-wheel-world.css",
  "spin-wheel-choice-sheet.css",
  "spin-wheel-preset-ui.css",
  "spin-wheel-components.css",
  "spin-wheel-world.js",
  "spin-wheel-preset-ui.js",
  "spin-wheel-result-ui.js",
  "world-utility-ui.css",
  "world-utility-ui.js",
  "world-utility-ui-refine.css",
  "world-utility-ui-refine.js",
  "world-tool-transition.css",
  "world-mini-games.css",
  "world-mini-games-extra.css",
  "world-mini-games-extra.js",
  "world-mini-games-refine.css",
  "world-mini-games-refine.js",
  "world-utility-tools-polish.css"
]) {
  await copyFile(resolve(root, `src/${file}`), resolve(root, `dist/${file}`));
}
await mkdir(resolve(root, "dist/browser/ffmpeg"), { recursive: true });
await copyFile(resolve(root, "../../node_modules/@ffmpeg/core/dist/esm/ffmpeg-core.js"), resolve(root, "dist/browser/ffmpeg/ffmpeg-core.js"));
await copyFile(resolve(root, "../../node_modules/@ffmpeg/core/dist/esm/ffmpeg-core.wasm"), resolve(root, "dist/browser/ffmpeg/ffmpeg-core.wasm"));
for (const file of ["worker.js", "const.js", "errors.js"]) {
  await copyFile(resolve(root, `../../node_modules/@ffmpeg/ffmpeg/dist/esm/${file}`), resolve(root, `dist/browser/${file}`));
}
await copyFile(resolve(root, "../../node_modules/pdfjs-dist/legacy/build/pdf.worker.mjs"), resolve(root, "dist/browser/pdf.worker.mjs"));
await build({ entryPoints: [resolve(root, "dist/src/main.js")], bundle: true, format: "esm", splitting: true, outdir: resolve(root, "dist/browser"), platform: "browser", target: "es2022" });
await writeFile(resolve(root, "dist/config.js"), `window.WALK_BACK_HOME_CONFIG = ${JSON.stringify({
  authProvider: process.env.WALK_BACK_HOME_AUTH_PROVIDER ?? "local",
  supabaseUrl: process.env.SUPABASE_URL ?? "",
  supabaseAnonKey: process.env.SUPABASE_ANON_KEY ?? "",
  privateMediaBucket: process.env.SUPABASE_PRIVATE_MEDIA_BUCKET ?? "walk-private-media"
}, null, 2)};\n`);
console.log("Built isolated HTML prototype to apps/html-prototype/dist");