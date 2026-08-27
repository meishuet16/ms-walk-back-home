# Canonical HTML Application Verification

This is the current operational verification guide for `apps/html-prototype` and the active `packages/shared` workspace. Retired web, Godot, and UI package paths are not part of this verification.

## Required commands

Run from the repository root with Node `22.13.0` from `.nvmrc`:

```powershell
npm install
npm run verify
```

The root workspace scripts cover:

- `@walk/html-prototype`: TypeScript compilation, browser build, and Node test suite.
- `@walk/shared`: TypeScript compilation and Vitest suite for schemas, import/privacy helpers, and fixture adapters.

The canonical build writes static output to `apps/html-prototype/dist`; that directory is generated and ignored. Vercel uses `apps/html-prototype` as its project root, runs `npm run build`, and serves `dist`.

## Authored Chapter editing workflow

Chapter dialogue, authored display copy, reflection copy, and explicitly presentation-only portrait paths are synchronized into the generated expectation file with:

```powershell
npm run authored:update
npm run verify
```

The generated file is owned exclusively by the synchronization script. IDs, speakers, event ordering, triggers, effects, asset existence, layouts, renderer behavior, and other runtime invariants remain ordinary strict tests.

Install the tracked pre-push hook once per clone:

```powershell
npm run hooks:install
```

The preferred push command requires a clean worktree, shows any generated expectation diff, creates at most one local sync commit, runs `npm run verify`, and then invokes ordinary `git push` without force or recursion:

```powershell
npm run safe-push
```

An ordinary `git push` is also guarded. If it has to create a sync commit, it intentionally aborts that push because Git does not renegotiate the newly-created commit; run `npm run safe-push` (or `git push`) again after reviewing the local commit.

## Local smoke run

```powershell
npm run dev -w apps/html-prototype
```

Open `http://localhost:4173`. The default fixture/local mode does not require Supabase or paid services. Optional Supabase behavior is covered by the app’s deterministic sync tests and is enabled only with explicit environment configuration.

## Preservation checks

Verification must leave authored chapter fixtures, chapter registration, scene layouts, canonical assets, Muji Room behavior, Toolbox behavior, and gameplay runtime unchanged unless a task explicitly targets them. Private/runtime data and generated build output must remain untracked.
