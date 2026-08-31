import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import test from "node:test";

const packageRoot = process.cwd();

async function read(path: string): Promise<string> {
  return readFile(resolve(packageRoot, path), "utf8");
}

test("Reflection Wall uses one JavaScript feature installer from main", async () => {
  const source = await read("src/main.ts");
  assert.match(source, /installReflectionWallUi/);
  assert.doesNotMatch(source, /installReflectionWallExperienceBridge/);
  assert.doesNotMatch(source, /installReflectionWallContinuumBridge/);
  assert.doesNotMatch(source, /installReflectionWallVisualPolishBridge/);
});

test("Reflection Wall uses one public stylesheet entrypoint", async () => {
  const html = await read("src/index.html");
  const reflectionLinks = [...html.matchAll(/href="\.\/(reflection-wall[^"]+\.css)"/g)].map((match) => match[1]);
  assert.deepEqual(reflectionLinks, ["reflection-wall.css"]);

  const entry = await read("src/reflection-wall.css");
  for (const moduleName of [
    "reflection-wall-experience.css",
    "reflection-wall-mobile-polish.css",
    "reflection-wall-reference-polish.css",
    "reflection-wall-stability-fixes.css",
    "reflection-wall-continuum.css",
    "reflection-wall-final-polish.css"
  ]) {
    assert.match(entry, new RegExp(moduleName.replaceAll(".", "\\.")));
  }
});

test("Reflection build copies the public entrypoint and its CSS modules", async () => {
  const build = await read("scripts/build.mjs");
  assert.match(build, /"reflection-wall\.css"/);
  assert.match(build, /"reflection-wall-continuum\.css"/);
  assert.match(build, /"reflection-wall-final-polish\.css"/);
});
