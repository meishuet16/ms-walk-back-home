export type WorkflowOutcome = "allow-push" | "retry-required" | "push" | "block";

export type PrePushPlan = {
  outcome: WorkflowOutcome;
  commit: boolean;
  runVerify: boolean;
};

export type PrePushPlanInput = {
  dirtyPaths: readonly string[];
  generatedDirtyBeforeSync: readonly string[];
  changedBySync: readonly string[];
  ownedGeneratedPaths: readonly string[];
  ownedSourcePaths: readonly string[];
  verifyPassed: boolean;
};

export type SafePushPlan = {
  outcome: WorkflowOutcome;
  commit: boolean;
  runVerify: boolean;
  push: boolean;
};

export type SafePushPlanInput = {
  dirtyPaths: readonly string[];
  generatedDirtyBeforeSync: readonly string[];
  changedBySync: readonly string[];
  ownedGeneratedPaths: readonly string[];
  verifyPassed: boolean;
};

export function pathsOutsideOwnership(paths: readonly string[], ownedPaths: readonly string[]): string[] {
  const owned = new Set(ownedPaths);
  return paths.filter((path) => !owned.has(path));
}

function hasUnexpectedChanges(changedBySync: readonly string[], ownedGeneratedPaths: readonly string[]): boolean {
  return pathsOutsideOwnership(changedBySync, ownedGeneratedPaths).length > 0;
}

export function planPrePush(input: PrePushPlanInput): PrePushPlan {
  if (input.generatedDirtyBeforeSync.length > 0) return { outcome: "block", commit: false, runVerify: false };
  if (input.dirtyPaths.some((path) => input.ownedSourcePaths.includes(path))) return { outcome: "block", commit: false, runVerify: false };
  if (hasUnexpectedChanges(input.changedBySync, input.ownedGeneratedPaths)) return { outcome: "block", commit: false, runVerify: false };
  if (!input.verifyPassed) return { outcome: "block", commit: input.changedBySync.length > 0, runVerify: true };
  if (input.changedBySync.length > 0) return { outcome: "retry-required", commit: true, runVerify: true };
  return { outcome: "allow-push", commit: false, runVerify: true };
}

export function planSafePush(input: SafePushPlanInput): SafePushPlan {
  if (input.dirtyPaths.length > 0 || input.generatedDirtyBeforeSync.length > 0) {
    return { outcome: "block", commit: false, runVerify: false, push: false };
  }
  if (hasUnexpectedChanges(input.changedBySync, input.ownedGeneratedPaths)) {
    return { outcome: "block", commit: false, runVerify: false, push: false };
  }
  if (!input.verifyPassed) {
    return { outcome: "block", commit: input.changedBySync.length > 0, runVerify: true, push: false };
  }
  return {
    outcome: "push",
    commit: input.changedBySync.length > 0,
    runVerify: true,
    push: true
  };
}
