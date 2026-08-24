# Canonical HTML Application Verification

This is the current operational verification guide for `apps/html-prototype` and the active `packages/shared` workspace. Retired web, Godot, and UI package paths are not part of this verification.

## Required commands

Run from the repository root with Node `22.13.0` from `.nvmrc`:

```powershell
npm install
npm run typecheck
npm test
npm run build
git diff --check
```

The root workspace scripts cover:

- `@walk/html-prototype`: TypeScript compilation, browser build, and Node test suite.
- `@walk/shared`: TypeScript compilation and Vitest suite for schemas, import/privacy helpers, and fixture adapters.

The canonical build writes static output to `apps/html-prototype/dist`; that directory is generated and ignored. Vercel uses `apps/html-prototype` as its project root, runs `npm run build`, and serves `dist`.

## Local smoke run

```powershell
npm run dev -w apps/html-prototype
```

Open `http://localhost:4173`. The default fixture/local mode does not require Supabase or paid services. Optional Supabase behavior is covered by the app’s deterministic sync tests and is enabled only with explicit environment configuration.

## Preservation checks

Verification must leave authored chapter fixtures, chapter registration, scene layouts, canonical assets, Muji Room behavior, Toolbox behavior, and gameplay runtime unchanged unless a task explicitly targets them. Private/runtime data and generated build output must remain untracked.
