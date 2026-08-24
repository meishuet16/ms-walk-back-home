import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";

test("dev server serves local module workers and wasm with executable MIME types", () => {
  const source = readFileSync(resolve(process.cwd(), "scripts/dev-server.mjs"), "utf8");
  assert.match(source, /"\.mjs": "text\/javascript; charset=utf-8"/);
  assert.match(source, /"\.wasm": "application\/wasm"/);
});
