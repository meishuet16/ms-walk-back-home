# Walk Back Home HTML Prototype

This is an isolated HTML-first interactive prototype. It does not replace the existing Godot implementation under `apps/game`, the Godot Web export, the Next.js Godot embed, the diary import pipeline, Memory Graph schemas, privacy logic, or fixture mode.

## Run

```powershell
npm install
npm run dev -w apps/html-prototype
```

Open `http://localhost:4173`.

## Build And Test

```powershell
npm run typecheck
npm test
npm run build
```

The app builds to `apps/html-prototype/dist`.

## Prototype Scope

The playable loop is:

Title Screen -> Memory Forest -> Bakery Memory Chapter -> Friend A dialogue -> pastry inspection -> choices -> Bakery exit -> Memory Forest -> Scrapbook/Timeline updates -> save/load -> ending resolver.

Muji is always the controllable smoky gray-blue water bottle. Friend A is a human NPC inside the Bakery memory chapter.

## Assets

Prototype assets live in `public/assets`.

- `forest.png`: Memory Forest background target
- `bakery.png`: Bakery chapter background target
- `muji-sheet.png`: Muji runtime sprite sheet for the HTML prototype
- `friend-a.png`: Friend A prototype NPC sprite
- `room-panel.jpg`, `map-panel.jpg`, `scrapbook-panel.jpg`, `timeline-panel.jpg`: UI panel crops for the HTML prototype

These are temporary prototype assets, not modular Godot production atlases.

## Audio

The current prototype uses browser-generated soft tones through Web Audio so it has no paid or copyrighted audio dependency. Future replacement paths:

- `public/assets/audio/forest-ambience.mp3`
- `public/assets/audio/bakery-room-tone.mp3`
- `public/assets/audio/ending-walk-home.mp3`

The UI includes mute, volume state, and browser-autoplay handling through the `点击开启声音` control.

## ChapterPlan Adapter

`src/adapters/chapterPlanAdapter.ts` converts a fictional ChapterPlan-like object into HTML scene data. This keeps the future path compatible with diary-generated Memory Graph and ChapterPlan data without loading real diary content in this prototype.

## Privacy

This app uses fictional fixtures only. It does not load real diary imports, private names, private photos, generated graphs, embeddings, or databases.

