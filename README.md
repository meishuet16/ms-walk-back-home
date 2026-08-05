# Walk Back Home

Walk Back Home is a local-first MVP for turning fictional diary entries into a playable memory reconstruction loop.

## Local development

```bash
npm install
npm run dev
```

The MVP runs in fixture mode by default. It does not require paid APIs, hosted AI, or paid services.

Open the main routes:

- `http://localhost:3000/forest` - primary playable Memory Forest prototype.
- `http://localhost:3000/import` - paste or import fictional TXT/Markdown diary entries.
- `http://localhost:3000/composer/fixture-entry-001` - scrapbook composer for a fixture entry.
- `http://localhost:3000/library` - fixture diary library.

## Workspaces

- `apps/web` - Next.js web app
- `apps/game` - Godot 4 project skeleton
- `packages/shared` - schemas, fixture adapters, privacy helpers
- `packages/ui` - reusable UI tokens and components
- `supabase` - local migrations and policies

## Godot

Install Godot 4 and open the project folder:

```bash
godot4 --path apps/game
```

Export the forest for web with the checked-in preset:

```bash
godot4 --headless --path apps/game --export-release Web ../web/public/game/index.html
```

The current forest is a mechanics prototype. The procedural shapes are temporary and should later be replaced by original TileMap layers, animated sprites, Muji sprite sheets, portal animations, and environmental VFX.

## Full Fictional Flow

1. Run `npm run dev -w apps/web`.
2. Open `/import`.
3. Use the bundled fictional diary text or import a fictional `.txt`/`.md` file.
4. Confirm the import.
5. The fixture parser validates a Memory Graph and writes a generated portal manifest to runtime storage.
6. Open `/forest`; the embedded forest reads the generated manifest and shows the visible portal.

Invalid portal or graph data is rejected at the shared schema layer and again by the web forest boundary. The fallback seed path is used when runtime portal data is invalid.

## Bakery Day Vertical Slice

Week 4 adds the canonical Godot-only playable chapter for “Bakery Day.” Run `res://scenes/forest/memory_forest.tscn`, enter the Bakery Day portal, talk to Friend A, inspect the pastry, walk to the exit, and return to Memory Forest. Completion is persisted locally in Godot `user://chapter_completion.json` and the portal is visually marked completed when returning.

The HTML Canvas forest fallback remains temporary and does not implement chapter gameplay.

## Data safety

Only fictional fixtures belong in source control. Runtime imports, uploads, generated graphs, exports, databases, embeddings, and `.private-spec/` are ignored.
