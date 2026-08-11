# Walk Back Home HTML Prototype Production Notes

Baseline inspected on 2026-08-11: `c3ee5def096d8b0409b2640a1b96065e2f41e397` on `main`, matching `origin/main`.

## Local Development

- Work only in `apps/html-prototype`.
- Install: no runtime dependencies are required for the current local prototype.
- Build: `npm run build`
- Test: `npm test`
- Dev server: `npm run dev`

## Data Boundaries

- Private Journal: diary entries, photos, scrapbook layouts, monthly metadata, and Memory Fragment classification.
- Private Journey: scene, player position, chapter progress, choices, tendencies, completed memory events, and room journey state.
- Private Muji Room: room state, selected records, personal music metadata, custom covers, player background, and Reflection Wall.
- Public Game Content: authored ChapterDefinitions and assets in the repository. Public chapters are never copied into user backups or private cloud rows.

## Reflection Wall

Reflection Wall data is stored separately from Journey in `walk-back-home:html-prototype:v1:reflection-wall`.

- `createdAt` is immutable.
- `updatedAt` is set on edits, pin/favorite changes, and paper changes.
- Coordinates are normalized wall-local percentages, not viewport pixels.
- Wall search/filter fades non-matches and does not mutate coordinates.
- Stack/List sorting does not mutate manual wall layout.
- Reset Journey migrates any legacy room reflection text first, then preserves the wall.
- Chapter reflection “Keep this” creates a `source: "chapter"` note linked to the chapter id.

## Backup / Restore

`walk-back-home-backup-YYYY-MM-DD.json` is a local-first JSON envelope containing:

- diary library
- journey state
- reflection wall
- personal music metadata
- personal player state
- IndexedDB music/media blobs as data URLs

The parser rejects unrelated or unsupported backup envelopes. Public ChapterDefinitions are intentionally excluded.

## Auth And Sync

The repository-side implementation includes:

- deterministic guest mode
- account session abstraction
- owner-scoped local save namespaces
- one-time guest data claim helper
- Supabase-ready SQL schema and RLS policies

Cloud sync still requires external configuration:

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- Google OAuth provider enabled in Supabase
- production auth callback URLs
- hosting authorization/domain

Do not place service role/admin secrets in the frontend.

## Supabase Setup

Run:

`supabase/migrations/20260811_private_local_first_schema.sql`

It creates private tables for diary entries, journey state, chapter progress, reflection notes, room state, and music metadata. RLS policies enforce `user_id = auth.uid()`. Storage bucket `walk-private-media` is private and object paths must begin with the authenticated user id.

## Public Chapter Author Workflow

Developer edits repository content:

Chapter fixture / scene / dialogue / assets -> `ChapterRegistry` -> tests -> commit -> deploy.

Players never publish public chapters from private accounts.

## Deployment

Use a static host. Build command:

`npm run build`

Output directory:

`dist`

Production deployment is blocked until external hosting and auth credentials are supplied.

## Not Implemented

Examine was not implemented. AI-generated scenes, AI reflection analysis, social rooms, public journals, public fragments, and user-created playable chapters remain intentionally out of scope.
