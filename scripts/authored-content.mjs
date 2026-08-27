import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";
import { spawnSync } from "node:child_process";

const repoRoot = resolve(fileURLToPath(new URL("..", import.meta.url)));
const generatedPath = resolve(repoRoot, "apps/html-prototype/src/fixtures/generated/authoredContentExpectations.ts");
const checkOnly = process.argv.includes("--check");
const npmCommand = process.platform === "win32" ? (process.env.ComSpec ?? "cmd.exe") : "npm";
const npmArgs = process.platform === "win32"
  ? ["/d", "/s", "/c", "npm run typecheck -w apps/html-prototype"]
  : ["run", "typecheck", "-w", "apps/html-prototype"];

const build = spawnSync(npmCommand, npmArgs, {
  cwd: repoRoot,
  encoding: "utf8",
  stdio: "inherit"
});
if (build.status !== 0) process.exit(build.status ?? 1);

const manifestModule = await import(new URL("../apps/html-prototype/dist/src/authoring/authoredContentManifest.js", import.meta.url));
const coreModule = await import(new URL("../apps/html-prototype/dist/src/authoring/authoredContent.js", import.meta.url));
const serialized = coreModule.serializeAuthoredContent(manifestModule.authoredContentManifest);
const generated = "// AUTO-GENERATED — update via npm run authored:update\n" +
  "export const authoredContentExpectations = " + serialized.trimEnd() + " as const;\n";

let existing = "";
try {
  existing = readFileSync(generatedPath, "utf8");
} catch (error) {
  if (!error || typeof error !== "object" || error.code !== "ENOENT") throw error;
}

if (checkOnly) {
  if (existing !== generated) {
    process.stderr.write("Authored content expectations are stale. Run: npm run authored:update\n");
    process.exit(1);
  }
  process.stdout.write("Authored content expectations are synchronized.\n");
} else if (existing !== generated) {
  writeFileSync(generatedPath, generated, "utf8");
  process.stdout.write("Updated apps/html-prototype/src/fixtures/generated/authoredContentExpectations.ts\n");
} else {
  process.stdout.write("Authored content expectations are already synchronized.\n");
}
