# Authored Content Safe-Push Workflow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (\`- [ ]\`) syntax for tracking.

**Goal:** Add deterministic authored-content synchronization, CI-equivalent verification, a safe tracked pre-push guard, and the preferred \`npm run safe-push\` workflow without weakening strict behavioral tests.

**Architecture:** An explicit TypeScript manifest extracts only approved presentation fields from current authored fixtures. A Node wrapper compiles and serializes that manifest into one owned generated TypeScript expectation file. Root Node orchestration scripts enforce clean/unsafe Git-state rules, generated-only commits, verification, and a normal non-force push; ordinary pre-push uses the same core in check/guard modes.

**Tech Stack:** Node.js 20+, TypeScript, Node \`node:test\`, Vitest (existing shared package), Git CLI, npm workspaces, GitHub Actions.

## Global Constraints

- The MVP must run locally without any paid API or paid service.
- Prefer zero new dependencies; do not modify the package lock.
- Only explicitly classified authored presentation fields may synchronize.
- Behavioral and structural invariants must remain strict and independently asserted.
- Never use \`git add .\` or \`git commit -a\` in automation.
- Never automatically amend, rebase, reset, force-push, or recursively push.
- Preserve unrelated dirty files and never stage them.
- Do not modify authored Chapter content, assets, layouts, or unrelated product behavior.
- Use Node-based scripts so the workflow works on Windows and Linux.
- GitHub Actions must independently verify the pushed repository in check-only mode.
- Tests and simulations must not contact or mutate the real remote.

---

### Task 1: Add the pure authored-content extraction and serialization contract

**Files:**
- Create: \`apps/html-prototype/src/authoring/authoredContent.ts\`
- Test: \`apps/html-prototype/tests/authored-content-sync.test.ts\`

**Interfaces:**
- Produces \`AuthoredContentExpectation\`, \`AuthoredContentManifest\`, \`extractDialoguePresentation\`, \`serializeAuthoredContent\`, \`ownedGeneratedPaths\`, and \`ownedSourcePaths\`.
- Extracted dialogue records contain only \`text\` and optional portrait presentation data; they never contain speaker, IDs, action types, checkpoints, geometry, or trigger data.

- [ ] **Step 1: Write failing tests for extraction boundaries and deterministic serialization**

Add tests using small in-memory action/sequence fixtures:

\`\`\`ts
test("extracts dialogue text and portrait but not behavioral fields", () => {
  const result = extractDialoguePresentation([
    { type: "dialogue", id: "event-1", speaker: "MS", text: "edited", portrait: "assets/a.png" },
    { type: "checkpoint", id: "strict-checkpoint" }
  ]);

  assert.deepEqual(result, [{ text: "edited", portrait: "assets/a.png" }]);
  assert.equal(JSON.stringify(result).includes("strict-checkpoint"), false);
  assert.equal(JSON.stringify(result).includes("MS"), false);
});
\`\`\`

- [ ] **Step 2: Run the focused test and verify the expected RED failure**

\`\`\`powershell
npm test -w apps/html-prototype -- --test-name-pattern="extracts dialogue"
\`\`\`

Expected: failure because the new module does not yet exist.

- [ ] **Step 3: Implement the minimal pure contract**

Implement typed extraction that accepts unknown authored action records, copies only approved \`text\` and \`portrait\`, drops undefined optional fields, and serializes with recursively sorted object keys and stable chapter key ordering. Keep generated-file and source-input path lists as explicit constants, not authored-data-derived paths.

- [ ] **Step 4: Run the focused test and verify GREEN**

Run the same command. Expected: the focused tests pass with no new dependency or warning.

- [ ] **Step 5: Run HTML typecheck**

\`\`\`powershell
npm run typecheck -w apps/html-prototype
\`\`\`

Expected: exit code 0.

### Task 2: Build the explicit fixture manifest and owned generated expectation

**Files:**
- Create: \`apps/html-prototype/src/authoring/authoredContentManifest.ts\`
- Create: \`apps/html-prototype/src/fixtures/generated/authoredContentExpectations.ts\`
- Create: \`scripts/authored-content.mjs\`
- Modify: \`apps/html-prototype/package.json\`
- Test: \`apps/html-prototype/tests/authored-content-sync.test.ts\`

**Interfaces:**
- \`authoredContentManifest.ts\` exports \`authoredContentManifest\` assembled directly from explicitly listed fixture exports.
- \`scripts/authored-content.mjs\` accepts \`--check\`, writes only the owned generated expectation file in update mode, and exits non-zero if check mode differs.
- The generated file begins with \`// AUTO-GENERATED — update via npm run authored:update\`.

- [ ] **Step 1: Add failing manifest and synchronizer contract tests**

Cover unchanged output, wording change, portrait change, strict-field exclusion, deterministic output, idempotence, and the static ownership allowlist. Assert that \`ownedGeneratedPaths\` contains exactly \`apps/html-prototype/src/fixtures/generated/authoredContentExpectations.ts\`.

- [ ] **Step 2: Run focused tests to verify RED**

\`\`\`powershell
npm test -w apps/html-prototype -- --test-name-pattern="generated|wording|portrait|ownership"
\`\`\`

Expected: failure because the manifest, generated module, and Node command are missing.

- [ ] **Step 3: Implement the explicit manifest and Node update/check wrapper**

List all current dialogue-bearing authored exports explicitly: March 30, April 5, April 6, May 23, June 24, June 25, and July 21 sequences/actions. Include only explicitly selected Chapter display copy that is presentation content. Preserve speaker arrays, action types/order, IDs, checkpoints, routes, reflection effects, geometry, and asset metadata outside the generated expectation.

The wrapper must compile the HTML prototype manifest, import \`dist/src/authoring/authoredContentManifest.js\`, render deterministic TypeScript with the generated header, compare without writing in \`--check\` mode, and write only the static owned path otherwise. Use direct process argument arrays; never execute authored data as shell code.

- [ ] **Step 4: Run update twice and verify idempotence**

\`\`\`powershell
npm run authored:update
$first = (Get-FileHash "apps/html-prototype/src/fixtures/generated/authoredContentExpectations.ts").Hash
npm run authored:update
$second = (Get-FileHash "apps/html-prototype/src/fixtures/generated/authoredContentExpectations.ts").Hash
if ($first -ne $second) { throw "generated output is not idempotent" }
npm run authored:update -- --check
\`\`\`

Expected: the second update produces no content change and check mode exits 0.

- [ ] **Step 5: Run focused tests and typecheck**

\`\`\`powershell
npm test -w apps/html-prototype -- --test-name-pattern="authored-content"
npm run typecheck -w apps/html-prototype
\`\`\`

Expected: all focused tests and typecheck pass.

### Task 3: Reclassify existing authored tests without weakening invariants

**Files:**
- Modify: \`apps/html-prototype/tests/april05-runtime.test.ts\`
- Modify: \`apps/html-prototype/tests/april06-runtime.test.ts\`
- Modify: \`apps/html-prototype/tests/may23-chapter.test.ts\`
- Modify: \`apps/html-prototype/tests/june24-chapter.test.ts\`
- Modify: \`apps/html-prototype/tests/july21-chapter.test.ts\`
- Modify: \`apps/html-prototype/tests/march30-memory.test.ts\`
- Modify: \`apps/html-prototype/tests/april05-chapter.test.ts\`
- Modify: \`apps/html-prototype/tests/april06-chapter.test.ts\`
- Modify: \`apps/html-prototype/tests/authored-chapter-registry.test.ts\`
- Test: \`apps/html-prototype/tests/authored-content-sync.test.ts\`

**Interfaces:**
- Existing tests import generated expectations for approved presentation comparisons.
- Strict tests continue to assert speaker sequences, action counts/types/order, IDs, route registration, trigger behavior, asset existence, checkpoint IDs, geometry, and state transitions independently.

- [ ] **Step 1: Add a failing regression test for stale literal avoidance**

Create a helper that compares current extracted presentation fields with generated expectations and separately compares structural projections. Add a fixture-level test proving that changing presentation data does not alter the structural projection.

- [ ] **Step 2: Run the focused regression test to verify RED**

\`\`\`powershell
npm test -w apps/html-prototype -- --test-name-pattern="stale|structural"
\`\`\`

Expected: failure until existing literal expectations are replaced with generated presentation expectations and structural projections are explicit.

- [ ] **Step 3: Replace only stale authored literals**

Refactor exact dialogue/portrait arrays and text-based lookup literals to use generated presentation records or stable structural positions. Keep strict speaker arrays and sequence assertions as literal or derived structural contracts. Do not replace asset existence checks with generated expectations; a missing current portrait asset must still fail.

- [ ] **Step 4: Run the affected test files**

\`\`\`powershell
npm test -w apps/html-prototype -- --test-name-pattern="April 5|April 6|May23|June 24|721|March 30"
\`\`\`

Expected: all affected tests pass and still report strict structural checks.

- [ ] **Step 5: Verify no broad weakening occurred**

\`\`\`powershell
rg -n "speaker|eventId|chapterId|trigger|checkpoint|once|existsSync|Object\.keys|\.length" apps/html-prototype/tests
\`\`\`

Expected: strict structural assertions remain present; only approved presentation literals move to generated expectations.

### Task 4: Add \`verify\`, CI check-only verification, and hook installation

**Files:**
- Modify: \`package.json\`
- Modify: \`.github/workflows/ci.yml\`
- Create: \`scripts/install-hooks.mjs\`
- Create: \`.githooks/pre-push\`
- Create: \`scripts/pre-push.mjs\`
- Modify: \`apps/html-prototype/package.json\`
- Test: \`apps/html-prototype/tests/authored-content-sync.test.ts\`

**Interfaces:**
- Root scripts: \`authored:update\`, \`authored:check\`, \`verify\`, \`hooks:install\`, \`safe-push\`.
- \`scripts/pre-push.mjs\` consumes Git's normal hook arguments/stdin and never invokes push itself.

- [ ] **Step 1: Add failing command/guard tests**

Test that check-mode failure is non-zero, verify failure is propagated, no-change pre-push does not commit, stale generated content creates only the owned commit candidate, unrelated dirty files are never selected, and a sync commit causes ordinary pre-push to abort with the safe-push instruction.

- [ ] **Step 2: Run tests to verify RED**

\`\`\`powershell
npm test -w apps/html-prototype -- --test-name-pattern="verify|pre-push|owned commit|unrelated dirty"
\`\`\`

Expected: failure because the root commands and tracked hook scripts do not yet exist.

- [ ] **Step 3: Implement commands and tracked hook**

Use these root relationships:

\`\`\`json
{
  "authored:update": "node scripts/authored-content.mjs",
  "authored:check": "node scripts/authored-content.mjs --check",
  "verify": "npm run authored:check && npm run typecheck && npm test && npm run build",
  "hooks:install": "node scripts/install-hooks.mjs",
  "safe-push": "node scripts/safe-push.mjs"
}
\`\`\`

Append \`git diff --check\` as a verification step without hiding its exit code. The tracked launcher runs \`node scripts/pre-push.mjs\`; the installer runs \`git config core.hooksPath .githooks\`.

Ordinary pre-push rejects dirty authored source inputs and pre-dirty generated output, allows unrelated dirty assets/layouts to remain untouched, synchronizes only with static ownership, stages exact owned paths, verifies staged names, commits with \`chore: sync authored content expectations\`, runs verify, and aborts after a new commit with:

\`\`\`
Authored expectations were synchronized locally. Run: npm run safe-push
\`\`\`

With \`WALK_BACK_HOME_SAFE_PUSH=1\`, the hook runs check-only verification and allows the already-orchestrated normal push without a duplicate commit.

- [ ] **Step 4: Update CI to use independent check-only verification**

Replace the current separate typecheck/test/build commands with \`npm run verify\` after installation, or retain named CI steps that collectively invoke exactly the same root command. CI must never run update mode or commit.

- [ ] **Step 5: Run hook command tests and install the local hook**

\`\`\`powershell
npm test -w apps/html-prototype -- --test-name-pattern="verify|pre-push"
npm run hooks:install
git config --get core.hooksPath
\`\`\`

Expected: focused tests pass and the last command prints \`.githooks\`.

### Task 5: Implement and test \`safe-push\`

**Files:**
- Create: \`scripts/safe-push.mjs\`
- Test: \`apps/html-prototype/tests/authored-content-sync.test.ts\`

**Interfaces:**
- \`safe-push\` returns non-zero on unsafe state, synchronization failure, verification failure, or push failure.
- It uses an injectable command runner in tests; tests simulate Git results and never run a real remote push.

- [ ] **Step 1: Add failing safe-push sequencing tests**

Cover clean verify-then-push, stale generated diff then generated-only commit then verify then push, verification failure with no push, detached HEAD, unresolved conflicts, uncommitted authored source, unrelated dirty file, no force flag, no recursive invocation, and no duplicate commit when the marker reaches pre-push.

- [ ] **Step 2: Run focused tests to verify RED**

\`\`\`powershell
npm test -w apps/html-prototype -- --test-name-pattern="safe-push"
\`\`\`

Expected: failure because \`scripts/safe-push.mjs\` is missing.

- [ ] **Step 3: Implement safe-push orchestration**

Validate symbolic branch, unmerged status, merge/rebase state, and clean worktree before synchronization. Run update/check, show \`git diff -- <owned path>\` when changed, stage only the static owned path, commit exactly once, run \`npm run verify\`, then invoke normal \`git push\` with \`WALK_BACK_HOME_SAFE_PUSH=1\`. Never pass \`--force\`, \`--no-verify\`, or a recursive script command. After success, compare \`HEAD\` with \`@{u}\` when an upstream exists and report the result.

- [ ] **Step 4: Run safe-push tests and dry-run simulations**

\`\`\`powershell
npm test -w apps/html-prototype -- --test-name-pattern="safe-push|pre-push|authored-content"
\`\`\`

Use temporary local Git state or injected runners for clean, stale, behavioral-failure, and unrelated-dirty scenarios. Restore only files created by simulation.

### Task 6: Document workflow and complete verification

**Files:**
- Modify: \`README.md\`
- Modify: \`apps/html-prototype/README.md\`
- Modify: \`apps/html-prototype/PRODUCTION.md\`

- [ ] **Step 1: Add concise developer workflow documentation**

Document:

\`\`\`text
npm run hooks:install
npm run safe-push
\`\`\`

Explain manual \`npm run authored:update\`, \`npm run verify\`, ordinary \`git push\` fallback behavior, generated-only automatic commit behavior, and that \`safe-push\` is the only command that automatically pushes.

- [ ] **Step 2: Run all required final checks**

\`\`\`powershell
npm run authored:update -- --check
npm test -w apps/html-prototype
npm test -w packages/shared
npm run typecheck
npm run build
npm run verify
git diff --check
\`\`\`

Expected: every command exits 0; HTML and shared test counts are reported; no generated diff remains.

- [ ] **Step 3: Inspect final diff and status**

\`\`\`powershell
git diff --stat
git diff --name-only
git status --short --branch
\`\`\`

Confirm no authored source, asset, layout, private data, or unrelated file changed.

- [ ] **Step 4: Create exactly one final local implementation commit**

\`\`\`powershell
git add -- docs/superpowers/specs/2026-08-27-authored-content-safe-push-design.md docs/superpowers/plans/2026-08-27-authored-content-safe-push.md README.md apps/html-prototype/README.md apps/html-prototype/PRODUCTION.md apps/html-prototype/package.json apps/html-prototype/src/authoring apps/html-prototype/src/fixtures/generated apps/html-prototype/tests .github/workflows/ci.yml package.json scripts .githooks
git diff --cached --check
git commit -m "chore: add authored content pre-push verification"
\`\`\`

Before staging, exclude any pre-existing user changes and confirm the staged path list is limited to this implementation. Do not push.

## Plan self-review

- Spec coverage: synchronization, strict invariants, ownership, dirty worktree, Windows compatibility, CI independence, safe-push UX, ordinary push semantics, tests, dry runs, and no-push policy are covered above.
- Placeholder scan: no TBD/TODO or deferred implementation steps are present.
- Type consistency: the manifest produces \`AuthoredContentManifest\`; the synchronizer consumes it; root commands call Node wrappers; safe-push sets the marker consumed by pre-push.
- Scope: all tasks concern the single developer workflow and its tests; no product behavior or authored source changes are included.
