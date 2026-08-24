# Walk Back Home

Walk Back Home is a local-first memory reconstruction game built around fictional diary fixtures.
`apps/html-prototype` is the canonical active application and contains the current playable chapters,
authored diary/library content, runtime systems, tests, and deployment build.

## Local development

```bash
npm install
npm run dev
```

The app runs in fixture mode by default and does not require paid APIs, hosted AI, or paid services.
Open `http://localhost:4173`.

Useful workspace commands:

```bash
npm run typecheck
npm test
npm run build
```

The canonical app also has direct commands:

```bash
npm run dev -w apps/html-prototype
npm run typecheck -w apps/html-prototype
npm test -w apps/html-prototype
npm run build -w apps/html-prototype
```

## Workspaces

- `apps/html-prototype` - canonical Walk Back Home HTML application
- `packages/shared` - retained schemas, fixture adapters, and privacy helpers
- `supabase` - local migrations and policies

The HTML app includes the authored chapter registry and diary/library content, Muji Room systems,
Scene Debug and authoring tools, Reflection Wall, and the current chapter presentation/runtime systems.
Its Vercel project should use `apps/html-prototype` as the root directory; the build output is `dist`.

## Data safety

Only fictional fixtures belong in source control. Runtime imports, uploads, generated graphs, exports,
databases, embeddings, and `.private-spec/` are ignored.
