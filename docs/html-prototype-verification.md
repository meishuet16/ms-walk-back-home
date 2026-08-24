# Canonical HTML Application Verification

Date: 2026-08-06

Scope: `apps/html-prototype` and retained `packages/shared`

## Commands

- `npm install`: passed for the retained workspaces.
- `npm run typecheck`: passed for the canonical HTML app and retained shared package.
- `npm test`: passed.
  - `@walk/html-prototype`: canonical HTML test suite passed.
  - `@walk/shared`: 13 test files / 28 tests passed.
- `npm run build`: passed.
  - `@walk/html-prototype` built to `apps/html-prototype/dist`.

## Preservation Checks

- Canonical HTML source, authored chapters, layouts, assets, and runtime systems remain tracked.
- Scene 624 / June 24, March 30, May 23, and Labis / July 19 content remain registered and asset-backed.
- Muji Room, Scene Debug, Reflection Wall, and other active HTML systems remain present.
- No tracked changes were made to `packages/shared` schemas, privacy logic, or existing tests.
- `.private-spec`, imports, uploads, generated graphs, embeddings, and database paths remain untracked by this milestone.

## Manual Notes

The isolated dev server starts with:

```powershell
npm run dev -w apps/html-prototype
```

It serves the prototype at:

```text
http://localhost:4173
```

In this shell environment, foreground server commands are terminated by command timeout, so persistent browser screenshot capture was not completed here. The build output and static assets are present in `apps/html-prototype/dist`.

