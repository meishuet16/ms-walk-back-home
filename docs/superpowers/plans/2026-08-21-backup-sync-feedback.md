# Backup / Sync Feedback Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the Backup / Sync explanation readable and provide persistent, accessible progress, success, empty-result, and failure feedback for cloud push and pull.

**Architecture:** Keep SupabaseSync and the local Records/cloud boundary unchanged. Store the active operation and latest result in `WalkHomeApp`; render them from `showBackupSync()` so the modal stays the source of truth. Use existing source-policy tests plus the full HTML prototype test suite for regression coverage.

**Tech Stack:** TypeScript, static HTML prototype, CSS, Node.js built-in test runner.

## Global Constraints

- The MVP runs locally without any paid API or paid service.
- Imported Records audio and covers never upload to cloud and stay on this device.
- Portable backup contents and Supabase schema remain unchanged.
- Do not log raw diary content or personal data.

---

### Task 1: Add failing UI-policy assertions

**Files:**
- Modify: `apps/html-prototype/tests/ui-policy.test.ts` near the existing UI behavior tests
- Read: `apps/html-prototype/src/app.ts`, `apps/html-prototype/src/styles.css`

**Interfaces:**
- Consumes: source strings already loaded by `ui-policy.test.ts`.
- Produces: regression requirements for the contrast rule, persistent status region, busy labels, disabled actions, and local Records wording.

- [ ] **Step 1: Write the failing test**

Add one test alongside the existing source-policy tests:

```ts
test("Backup / Sync exposes readable copy and persistent cloud operation feedback", () => {
  assert.match(stylesSource, /\.backup-panel \.quiet-line[\s\S]*color:\s*#3c2b1c/);
  assert.match(appSource, /backupSyncOperation/);
  assert.match(appSource, /role="status"/);
  assert.match(appSource, /Syncing this device/);
  assert.match(appSource, /Pulling cloud memories/);
  assert.match(appSource, /disabled=\$\{this\.backupSyncOperation \? "disabled" : ""\}/);
  assert.match(appSource, /Imported Records audio and covers stayed on this device/);
});
```

- [ ] **Step 2: Run the focused test to verify it fails**

Run: `npm test -- --test-name-pattern="Backup / Sync exposes readable copy"`

Expected: FAIL because the new app state, status markup, progress labels, and contrast rule do not yet exist.

### Task 2: Implement the Backup / Sync view state and feedback

**Files:**
- Modify: `apps/html-prototype/src/app.ts` near the existing app state and `showBackupSync()`, `pushCloudSync()`, and `pullCloudSync()` methods
- Modify: `apps/html-prototype/src/styles.css` near `.backup-panel .quiet-line` and `.sync-status`
- Test: `apps/html-prototype/tests/ui-policy.test.ts`

**Interfaces:**
- Consumes: existing `SupabaseSync.push()`, `SupabaseSync.pull()`, `makeCloudBundle()`, `errorMessage()`, and `showBackupSync()`.
- Produces: `backupSyncOperation: "push" | "pull" | null`, escaped `role="status"` feedback, disabled cloud action buttons, and operation-specific result copy.

- [ ] **Step 1: Add the minimal operation state**

Add these fields to `WalkHomeApp`:

```ts
private backupSyncOperation: "push" | "pull" | null = null;
private backupSyncFeedback: { tone: "info" | "success" | "error"; message: string } | null = null;
```

- [ ] **Step 2: Render busy actions and persistent status**

In `showBackupSync()`, derive `busy = this.backupSyncOperation !== null`, render the push/pull labels as `Syncing this device…` and `Pulling cloud memories…` while active, add `disabled="disabled"` to both actions while busy, and render:

```ts
const syncFeedback = this.backupSyncFeedback
  ? `<p class="sync-feedback sync-feedback-${this.backupSyncFeedback.tone}" role="status">${this.escapeHtml(this.backupSyncFeedback.message)}</p>`
  : "";
```

Place `${syncFeedback}` inside `.sync-status` below the cloud description and above the action row. The normal labels remain `Sync this device to cloud` and `Pull cloud memories` when idle.

- [ ] **Step 3: Set push progress, success, and failure states**

At the start of `pushCloudSync()`, return if `this.backupSyncOperation` is already set. Set operation to `"push"`, set info feedback to `Syncing this device to cloud…`, and rerender. On success set:

```ts
{ tone: "success", message: "Sync complete · diary, journey, and reflection wall synced. Imported Records audio and covers stayed on this device." }
```

On failure set an error message using `Cloud sync failed · ${this.errorMessage(error)}`. In `finally`, clear the operation and rerender; keep the existing toast as a secondary notification.

- [ ] **Step 4: Set pull progress, applied-scope, empty-result, and failure states**

At the start of `pullCloudSync()`, use the same busy guard and set info feedback to `Pulling cloud memories…`. Track the existing optional fields applied to local state in `appliedSections`. Use `Diary`, `journey`, and `reflection wall` labels for returned sections. On success use either:

```ts
`Pull complete · ${appliedSections.join(", ")} updated. Imported Records audio and covers stayed on this device.`
```

or, when no optional section is present:

```ts
"Pull complete · no cloud diary, journey, or reflection wall data was found. Local Records audio and covers stayed on this device."
```

On failure set `Cloud pull failed · ${this.errorMessage(error)}`. In `finally`, clear the operation and rerender. Do not change the existing assignments for local Records state.

- [ ] **Step 5: Add readable feedback styling**

Change `.backup-panel .quiet-line` to `color: #3c2b1c;`. Add `.sync-feedback` with a light contrasting background, dark text, readable padding, and a visible border; use the existing panel palette and do not rely on the old pale text color. Add distinct success and error border colors while keeping all feedback readable.

- [ ] **Step 6: Run the focused test to verify it passes**

Run: `npm test -- --test-name-pattern="Backup / Sync exposes readable copy"`

Expected: PASS.

### Task 3: Verify the complete change and commit the implementation

**Files:**
- Verify: `apps/html-prototype/src/app.ts`
- Verify: `apps/html-prototype/src/styles.css`
- Verify: `apps/html-prototype/tests/ui-policy.test.ts`

**Interfaces:**
- Consumes: the completed Backup / Sync operation state and regression assertion.
- Produces: a buildable, fully tested local-first HTML prototype with no cloud-boundary changes.

- [ ] **Step 1: Run the full HTML prototype test suite**

Run: `npm test`

Expected: TypeScript build succeeds and every test passes with zero failures.

- [ ] **Step 2: Inspect the final diff and status**

Run: `git diff --check; git diff --stat; git status --short`

Expected: no whitespace errors; only the intended app, style, and test files are modified, plus the already-existing unrelated untracked plan remains untouched.

- [ ] **Step 3: Commit the implementation**

```bash
git add apps/html-prototype/src/app.ts apps/html-prototype/src/styles.css apps/html-prototype/tests/ui-policy.test.ts
git commit -m "fix(html): clarify backup sync feedback"
```

Do not push; confirm with the user before any push.
