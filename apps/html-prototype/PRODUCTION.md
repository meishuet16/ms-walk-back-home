# Walk Back Home HTML Application Production Notes

`apps/html-prototype` is the canonical application and the only active runtime. It is a static TypeScript application built for local-first use with fictional fixtures; cloud services are optional and explicitly configured.

## Local development and build

From the repository root:

```powershell
npm install
npm run dev -w apps/html-prototype
npm run typecheck -w apps/html-prototype
npm test -w apps/html-prototype
npm run build -w apps/html-prototype
```

The app dev server runs at `http://localhost:4173`. The build compiles `src/`, copies `public/`, bundles the browser entry, generates public runtime configuration, and writes `dist/`. `dist/` is generated and must not be committed.

## Data boundaries

- Private Journal: diary entries, photos, media metadata, monthly metadata, and Memory Fragment classification.
- Private Journey: scene state, player position, chapter progress, choices, tendencies, completed memory events, and room journey state.
- Private Muji Room: room state, selected records, personal music metadata, custom covers, player background, and Reflection Wall.
- Public Game Content: authored chapter definitions, scene layouts, and assets stored in this repository. Public chapters are never copied into user backups or private cloud rows.

Local persistence and deterministic fixture adapters are the default. Real diary imports, uploads, generated graphs, embeddings, and private media remain runtime data and must not enter source control.

## Supabase

The browser runtime contains optional Supabase auth/sync wiring for private JSON rows. It activates only when `WALK_BACK_HOME_AUTH_PROVIDER=supabase`, `SUPABASE_URL`, and `SUPABASE_ANON_KEY` are supplied. Personal audio binaries remain local; Supabase stores metadata and private JSON rows only.

Apply the current HTML app schema from:

`apps/html-prototype/supabase/migrations/20260811_private_local_first_schema.sql`

The repository-level `supabase/config.toml` and foundation migration are retained separately for the local Supabase CLI/project layer. Do not place service-role or admin secrets in the frontend.

## Public chapter workflow

Developer edits authored chapter fixtures and scene data under `src/fixtures/`, `src/systems/ChapterRegistry.ts`, and `public/scene-layouts/`, validates the runtime with the supported test/build commands, then deploys the static build. Players do not publish public chapters from private accounts.

## Vercel deployment

Configure the Vercel project root as `apps/html-prototype`. The checked-in `vercel.json` uses:

- Build command: `npm run build`
- Output directory: `dist`
- Framework: static/none

The deployment is otherwise independent of Supabase. Auth/sync requires separately configured production credentials, redirect URLs, and environment variables.

## Scope

The current application includes the authored chapter runtime, Memory Forest, Muji Room, Reflection Wall, journal/records tools, Scene Debug authoring tools, backup/restore, and deterministic local fallbacks. AI-generated scenes, social rooms, public journals, and user-created public chapters remain out of scope.
