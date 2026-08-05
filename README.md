# Walk Back Home

Walk Back Home is a local-first MVP for turning fictional diary entries into a playable memory reconstruction loop.

## Local development

```bash
npm install
npm run dev
```

The MVP runs in fixture mode by default. It does not require paid APIs, hosted AI, or paid services.

## Workspaces

- `apps/web` - Next.js web app
- `apps/game` - Godot 4 project skeleton
- `packages/shared` - schemas, fixture adapters, privacy helpers
- `packages/ui` - reusable UI tokens and components
- `supabase` - local migrations and policies

## Data safety

Only fictional fixtures belong in source control. Runtime imports, uploads, generated graphs, exports, databases, embeddings, and `.private-spec/` are ignored.
