# AGENTS.md

This repository stores product engines, schemas, fixtures, and local development code.
This repository is private. Runtime life data must remain in runtime storage and must not be committed.

## Privacy and data

- Never commit `.private-spec/`.
- Real personal-memory content that has been intentionally authored into a Walk Back Home chapter and explicitly approved by the repository owner may be version-controlled in this private repository.
- Never commit raw uploads, secrets, credentials, imports, generated Memory Graphs, embeddings, scene caches, runtime storage, logs containing personal content, or unrelated personal data.
- Use fictional examples and fixtures for all other content.
- Treat real names and unrelated real memory content as runtime values.
- Do not log raw diary content in production paths.

## Cost and AI constraints

- The MVP must run locally without any paid API or paid service.
- Use fixture adapters by default.
- Do not introduce paid dependencies without explicit approval.
- Every AI feature must have a deterministic free fallback.
- Never call AI services automatically while a user is editing.
- Keep AI integrations behind explicit feature flags and user actions.

## Engineering behavior

- Keep the app runnable after every milestone.
- Prefer simple, replaceable modules with typed boundaries.
- Keep product logic out of UI components when practical.
- Add tests for parsing, import splitting, privacy filtering, and shared schemas as those features land.
- Push code only, and confirm with the user before pushing.
