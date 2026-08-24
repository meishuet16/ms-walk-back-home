import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";

test("dev server serves local module workers and wasm with executable MIME types", () => {
  const source = readFileSync(resolve(process.cwd(), "scripts/dev-server.mjs"), "utf8");
  assert.match(source, /"\.mjs": "text\/javascript; charset=utf-8"/);
  assert.match(source, /"\.wasm": "application\/wasm"/);
});

test("built FFmpeg client includes the module worker required by engine.load", () => {
  const buildSource = readFileSync(resolve(process.cwd(), "scripts/build.mjs"), "utf8");
  assert.match(buildSource, /node_modules[\\/]@ffmpeg[\\/]ffmpeg[\\/]dist[\\/]esm[\\/]\$\{file\}/);
  for (const file of ["worker.js", "const.js", "errors.js"]) {
    const bytes = readFileSync(resolve(process.cwd(), "dist/browser", file));
    assert.ok(bytes.byteLength > 100, `FFmpeg ${file} must be a real non-empty module`);
  }
});
