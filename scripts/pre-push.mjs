import {
  assertExactOwnedPaths,
  assertNoUnsafeGitState,
  changedPathsSince,
  exitStatus,
  git,
  ownedGeneratedPaths,
  ownedSourcePaths,
  printResultFailure,
  repoRoot,
  runNpmScript,
  statusPaths,
  syncCommitMessage
} from "./git-workflow-utils.mjs";

function fail(message) {
  console.error(`Push blocked: ${message}`);
  process.exitCode = 1;
}

function runInheritedNpm(script) {
  const result = runNpmScript(script, [], { stdio: "inherit" });
  if (result.status !== 0) {
    printResultFailure(`npm run ${script}`, result);
    return false;
  }
  return true;
}

function commitGeneratedExpectation() {
  const generatedPath = ownedGeneratedPaths[0];
  const diff = git(["diff", "--", generatedPath]);
  if (diff.status !== 0) throw new Error(diff.stderr || "Unable to inspect generated expectation diff.");
  console.log(`Generated authored expectation diff (${generatedPath}):`);
  process.stdout.write(diff.stdout || "(no textual diff)\n");

  const add = git(["add", "--", generatedPath], { stdio: "inherit" });
  if (add.status !== 0) throw new Error("Unable to stage the owned generated expectation.");
  const staged = git(["diff", "--cached", "--name-only", "--", generatedPath]);
  if (staged.status !== 0) throw new Error(staged.stderr || "Unable to inspect staged generated expectation.");
  assertExactOwnedPaths(staged.stdout.split(/\r?\n/).filter(Boolean).map((path) => path.replaceAll("\\", "/")), [generatedPath]);

  const commit = git(["commit", "--only", "-m", syncCommitMessage, "--", generatedPath], { stdio: "inherit" });
  if (commit.status !== 0) throw new Error("Unable to create the local authored expectation sync commit.");
}

function main() {
  if (process.env.WALK_BACK_HOME_SAFE_PUSH === "1") {
    if (!runInheritedNpm("verify")) process.exit(1);
    return;
  }

  assertNoUnsafeGitState();
  const before = statusPaths();
  const beforeGenerated = before.filter((path) => ownedGeneratedPaths.includes(path));
  if (beforeGenerated.length > 0) throw new Error("the generated expectation is already dirty; review or restore it before pushing");
  const dirtySources = before.filter((path) => ownedSourcePaths.includes(path));
  if (dirtySources.length > 0) throw new Error(`authored source is uncommitted (${dirtySources.join(", ")}); commit it before pushing`);

  if (!runInheritedNpm("authored:update")) process.exit(1);
  const after = statusPaths();
  const changedBySync = changedPathsSince(before, after);
  assertExactOwnedPaths(changedBySync, changedBySync.length === 0 ? [] : ownedGeneratedPaths);

  if (changedBySync.length > 0) commitGeneratedExpectation();
  if (!runInheritedNpm("verify")) process.exit(1);
  if (changedBySync.length > 0) {
    fail("authored expectations were synchronized and committed locally. Run `npm run safe-push` to retry the push.");
    return;
  }
}

try {
  main();
} catch (error) {
  fail(error instanceof Error ? error.message : String(error));
}
