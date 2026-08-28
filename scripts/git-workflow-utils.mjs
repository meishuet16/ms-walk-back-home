import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const repoRoot = resolve(fileURLToPath(new URL("..", import.meta.url)));
export const syncCommitMessage = "chore: sync authored content expectations";
export const ownedGeneratedPaths = ["apps/html-prototype/src/fixtures/generated/authoredContentExpectations.ts"];
export const ownedSourcePaths = [
  "apps/html-prototype/src/authoring/authoredContent.ts",
  "apps/html-prototype/src/authoring/authoredContentManifest.ts",
  "apps/html-prototype/src/fixtures/authoredDiaryEntries.ts",
  "apps/html-prototype/src/fixtures/april05Chapter.ts",
  "apps/html-prototype/src/fixtures/april06Chapter.ts",
  "apps/html-prototype/src/fixtures/july21Chapter.ts",
  "apps/html-prototype/src/fixtures/june24Chapter.ts",
  "apps/html-prototype/src/fixtures/june25Chapter.ts",
  "apps/html-prototype/src/fixtures/november22Chapter.ts",
  "apps/html-prototype/src/fixtures/march30Chapter.ts",
  "apps/html-prototype/src/fixtures/march30Memory.ts",
  "apps/html-prototype/src/fixtures/may23Chapter.ts",
  "apps/html-prototype/public/scene-layouts/523/portrait.json",
  "apps/html-prototype/public/scene-layouts/624/portrait.json"
];

export function run(command, args, options = {}) {
  return spawnSync(command, args, {
    cwd: repoRoot,
    encoding: "utf8",
    stdio: options.stdio ?? "pipe",
    input: options.input,
    env: options.env ? { ...process.env, ...options.env } : process.env
  });
}

export function git(args, options = {}) {
  return run("git", args, options);
}

export function runNpmScript(script, args = [], options = {}) {
  if (process.platform === "win32") {
    const commandLine = ["npm", "run", script, ...args].join(" ");
    return run(process.env.ComSpec ?? "cmd.exe", ["/d", "/s", "/c", commandLine], options);
  }
  return run("npm", ["run", script, ...args], options);
}

export function exitStatus(result) {
  return result.status === null ? 1 : result.status;
}

export function parsePorcelainPaths(output) {
  return output.split(/\r?\n/).filter(Boolean).map((line) => {
    const rawPath = line.startsWith("?? ") ? line.slice(3) : line.slice(3);
    const renameSeparator = rawPath.lastIndexOf(" -> ");
    return (renameSeparator >= 0 ? rawPath.slice(renameSeparator + 4) : rawPath).replaceAll("\\", "/");
  });
}

export function statusPaths() {
  const result = git(["status", "--porcelain=v1", "--untracked-files=all"]);
  if (result.status !== 0) throw new Error(result.stderr || "Unable to inspect Git status.");
  return parsePorcelainPaths(result.stdout);
}

export function printResultFailure(label, result) {
  if (result.stdout) process.stdout.write(result.stdout);
  if (result.stderr) process.stderr.write(result.stderr);
  console.error(`${label} failed with exit code ${exitStatus(result)}.`);
}

export function changedPathsSince(before, after) {
  const previous = new Set(before);
  return after.filter((path) => !previous.has(path));
}

export function assertExactOwnedPaths(paths, ownedPaths) {
  const unique = [...new Set(paths)].sort();
  const owned = [...new Set(ownedPaths)].sort();
  if (unique.some((path, index) => path !== owned[index]) || unique.length !== owned.length) {
    throw new Error(`Unexpected paths changed by authored synchronization: ${unique.join(", ") || "(none)"}`);
  }
}

export function assertNoUnsafeGitState() {
  const branch = git(["symbolic-ref", "--quiet", "--short", "HEAD"]);
  if (branch.status !== 0) throw new Error("Push guard requires an attached branch; detached HEAD is unsafe.");
  const unmerged = git(["diff", "--name-only", "--diff-filter=U"]);
  if (unmerged.status !== 0) throw new Error("Unable to inspect merge-conflict state.");
  if (unmerged.stdout.trim()) throw new Error("Push guard blocked: resolve unmerged paths first.");
  const gitDir = git(["rev-parse", "--git-dir"]);
  if (gitDir.status !== 0) throw new Error("Unable to locate the Git directory.");
  const gitDirPath = resolve(repoRoot, gitDir.stdout.trim());
  for (const marker of ["MERGE_HEAD", "CHERRY_PICK_HEAD", "REVERT_HEAD", "BISECT_LOG", "rebase-merge", "rebase-apply"]) {
    if (existsSync(resolve(gitDirPath, marker))) throw new Error(`Push guard blocked: Git operation ${marker} is in progress.`);
  }
}
