import { git, printResultFailure } from "./git-workflow-utils.mjs";

const result = git(["config", "core.hooksPath", ".githooks"], { stdio: "inherit" });
if (result.status !== 0) {
  printResultFailure("git config core.hooksPath", result);
  process.exit(result.status ?? 1);
}
console.log("Installed repository hooks from .githooks.");
