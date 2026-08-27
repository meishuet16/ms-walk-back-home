# Authored Content Safe-Push Workflow Design

## Goal

Keep frequently edited authored Chapter presentation content synchronized without weakening behavioral regression protection, while providing a single safe everyday command: `npm run safe-push`.

## Context

The repository currently verifies the HTML prototype with Node's built-in `node:test`, verifies `packages/shared` with Vitest, and runs typecheck, tests, and build from GitHub Actions. Authored Chapter tests contain exact dialogue and portrait expectations mixed with strict runtime and structural assertions. There is no existing snapshot, hook, or synchronization mechanism.

## Architecture

An explicit authored-content manifest will enumerate the approved source exports and extract only syncable presentation fields. A Node-based synchronizer will import the compiled manifest, serialize a deterministic generated TypeScript expectation file, and support both update and check-only modes. The generated file will be the only path owned by synchronization.

The synchronizable fields are dialogue `text`, dialogue portrait presentation paths/configuration, and explicitly selected authored display copy. Speaker identity, order, counts, IDs, trigger/event semantics, checkpoints, routes, layout geometry, asset existence, state transitions, renderer behavior, persistence, and locale-sensitive behavior remain ordinary strict assertions. No test failure will cause arbitrary expectations to be rewritten.

## Commands

- `npm run authored:update` compiles the HTML prototype manifest and updates only the owned generated expectation file.
- `npm run verify` checks that generated expectations are synchronized, runs the current CI-equivalent typecheck, full workspace test, production build, and `git diff --check`.
- `npm run safe-push` validates safe Git state, synchronizes authored expectations, prints any generated diff, creates at most one generated-only local commit, runs `npm run verify`, and then performs a normal non-force `git push`.
- `npm run hooks:install` configures the repository-local tracked hook path.

## Safe-push and pre-push behavior

`safe-push` refuses detached HEAD, unresolved merge/rebase/conflict states, and uncommitted manually authored or unrelated files. It never stages with `git add .` or commits with `git commit -a`. If the generated file was clean before synchronization and changes, only its exact owned path may be staged and committed with `chore: sync authored content expectations`.

The final `git push` from `safe-push` goes through the normal pre-push hook. An environment marker identifies this orchestrated push so the hook performs a check-only verification and does not create a duplicate synchronization commit. The hook never invokes `git push` recursively, never force-pushes, and never bypasses hooks.

For ordinary `git push`, the hook may synchronize a stale generated expectation and create the same generated-only local commit. Because a pre-push commit is not assumed to be part of the already-negotiated push, the hook then aborts with `Authored expectations were synchronized locally. Run: npm run safe-push`. A later `safe-push` or ordinary push can proceed after verification.

## Dirty-worktree safety

Before synchronization, the automation records status. Any pre-existing dirty path outside the owned generated path is preserved and is never staged. A pre-existing dirty owned path is considered ambiguous and aborts rather than being merged into the automatic commit. After synchronization, the staged path list is checked against a static ownership allowlist before commit.

## Testing

Focused tests will cover deterministic extraction/serialization, wording and portrait changes, strict invariant separation, idempotence, ownership, sync failure, dirty paths, generated-only commits, verification failure, no-change behavior, safe-push sequencing, no recursive/force push, and the pre-push interaction. Simulations use temporary local Git state and injected command runners; no test contacts or mutates the real remote.

## Files expected to change

- Root `package.json` scripts and tracked hook-install/pre-push orchestration scripts.
- `apps/html-prototype/package.json` command wiring.
- Explicit authored manifest and synchronization core under `apps/html-prototype/src/authoring/`.
- Owned generated expectation under `apps/html-prototype/src/fixtures/generated/`.
- Focused HTML prototype synchronization and safe-push tests.
- Existing authored tests updated only to consume generated presentation expectations while retaining strict structural assertions.
- Brief developer workflow documentation.

## Constraints

- No new dependency.
- No authored Chapter, asset, layout, or product behavior changes.
- No automatic push from synchronization.
- No arbitrary path staging, generated shell execution, amend, rebase, reset, force push, or recursive push.
- Windows-compatible Node scripts; GitHub Actions independently uses check-only verification.
