# Walk Back Home

Walk Back Home is a local-first memory reconstruction game built from fictional diary fixtures. The current canonical application is the TypeScript HTML runtime in `apps/html-prototype`.

## Current architecture

- `apps/html-prototype` is the only active application. It contains the runtime, authored chapters, scene layouts, assets, authoring/debug tools, tests, and static deployment build.
- `packages/shared` is an active independent workspace for typed schemas, fixture adapters, import/privacy helpers, and its own tests. The HTML app does not import it directly, but root workspace verification includes it.
- Supabase is optional. The app defaults to local/fixture mode and only enables cloud sync when explicit Supabase configuration is supplied.

The retired `apps/web`, `apps/game`, and `packages/ui` architectures are not part of the current repository.

## Repository structure

```text
apps/html-prototype/          canonical application
  src/fixtures/                authored chapter and diary data
  src/systems/                 runtime, persistence, authoring, and UI systems
  public/assets/               canonical production assets
  public/scene-layouts/        authored scene geometry and layout manifests
  scripts/                     build and local static-server scripts
  supabase/migrations/         current HTML app private-data schema
packages/shared/               active shared schemas and fixture/test package
supabase/                      repository-level local Supabase CLI config/foundation migration
docs/                          operational, historical, plan, and spec documentation
.github/workflows/ci.yml       install, typecheck, test, and build workflow
```

Chapter registration is in `apps/html-prototype/src/systems/ChapterRegistry.ts`; chapter fixtures live under `apps/html-prototype/src/fixtures`. Do not change authored chapter content, scene layouts, or approved assets as part of repository cleanup.

## Local development

The supported Node version is pinned by `.nvmrc` to `22.13.0`.

```powershell
npm install
npm run dev
```

The dev command builds the canonical app and starts its local static server at `http://localhost:4173`. The app runs in fixture/local mode by default and does not require a paid API or service.

Supported verification commands:

```powershell
npm run typecheck
npm test
npm run build
```

The root commands run the applicable workspace commands. To target only the canonical app:

```powershell
npm run dev -w apps/html-prototype
npm run typecheck -w apps/html-prototype
npm test -w apps/html-prototype
npm run build -w apps/html-prototype
```

The app build compiles TypeScript, copies `public/` content, bundles the browser entry with esbuild, and writes the deployable static site to `apps/html-prototype/dist`.

## Assets, scenes, and Supabase

- Canonical authored assets: `apps/html-prototype/public/assets`
- Scene layouts and manifests: `apps/html-prototype/public/scene-layouts`
- Authored chapter data: `apps/html-prototype/src/fixtures`
- Current HTML app Supabase schema: `apps/html-prototype/supabase/migrations/20260811_private_local_first_schema.sql`
- Repository-level Supabase CLI/foundation files: `supabase/config.toml` and `supabase/migrations/202608050001_week1_foundation.sql`

The two Supabase locations are retained because they describe different migration layers, not duplicate files. For optional cloud sync, use `apps/html-prototype/.env.example`; the HTML runtime reads configuration generated from `WALK_BACK_HOME_AUTH_PROVIDER`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `SUPABASE_PRIVATE_MEDIA_BUCKET`. It never requires Supabase for local fixture development.

## Vercel deployment

Vercel should use `apps/html-prototype` as the project root. Its `vercel.json` specifies a static deployment with build command `npm run build` and output directory `dist`. The generated `dist` directory is deployment output and is not committed.

## Contributor and Codex guidance

Read `AGENTS.md` before making changes and `ART_LOCK.md` before touching visual assets. Use fictional fixtures only; never commit private specifications, real diaries, uploads, generated memory graphs, embeddings, scene caches, secrets, or personal logs. Keep paid/AI integrations explicit and preserve deterministic local fallbacks. Historical architecture notes remain under `docs/` for context, but they are not current implementation instructions.

Generated or local-only paths that must not be committed include `node_modules/`, `dist/`, `coverage/`, `.next/`, `.turbo/`, `.vercel/`, `.worktrees/`, `.godot/`, `.godot-user-data/`, `supabase/.temp/`, `.private-spec/`, `.codex-remote-attachments/`, runtime data directories, and `*.zip` archives.
