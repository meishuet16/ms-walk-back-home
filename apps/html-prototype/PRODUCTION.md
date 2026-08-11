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

## Mobile Implementation Status

Updated 2026-08-11.

- Forest exposes an in-scene month switcher under the Memory Forest sign; the Walk Back Home modal and forest scene share the same month key.
- Forest month filtering is applied to authored chapter doors and private Memory Fragment lights before the scene nodes are built.
- Mobile HUD copy uses virtual joystick / contextual Interact wording instead of keyboard-only E prompts.
- Touch controls include a virtual joystick and a contextual interaction button label.
- Portrait Journal uses a single-column, scrollable editor layout with static paper fields.
- Portrait Reflection Wall preserves tap targets, note drag gestures, and empty-wall pan behavior through explicit touch-action rules.
- Landscape Muji Room and Forest use compact top navigation, HUD, joystick, and interaction controls for short mobile viewports.
- Floating lyrics separates draggable lyrics from the Records / previous / play / next control bar so transport buttons remain clickable.
- Verification run: `npm test -- ui-policy` from `apps/html-prototype`, which builds and runs 111 tests.
- Browser visual check: Codex in-app browser viewport `390x844` confirmed the mobile HUD renders `Virtual joystick · Interact`; this in-app backend does not support scripted click/drag automation, so interaction coverage is enforced by tests and source-level event target checks.

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
- optional Supabase client wiring for Google OAuth and private JSON row sync
- build-time public config generation into `dist/config.js`

Cloud sync still requires external configuration:

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- Google OAuth provider enabled in Supabase
- production auth callback URLs
- hosting authorization/domain

Do not place service role/admin secrets in the frontend.

Required values to finish real production login/sync:

- Supabase project URL, from Project Settings -> API.
- Supabase anon/public key, from Project Settings -> API.
- Supabase SQL applied from `apps/html-prototype/supabase/migrations/20260811_private_local_first_schema.sql`.
- Google OAuth Client ID and Client Secret from Google Cloud Console.
- Supabase Google provider enabled with that Client ID/Secret.
- Supabase Site URL set to the final Vercel production URL.
- Supabase Redirect URLs including the final production URL and any preview/local URLs used for testing.
- Vercel project connected to this repository with root directory `apps/html-prototype`.
- Vercel environment variables: `WALK_BACK_HOME_AUTH_PROVIDER=supabase`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_PRIVATE_MEDIA_BUCKET=walk-private-media`.
- Vercel production domain, either the default `.vercel.app` URL or a custom domain.

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
