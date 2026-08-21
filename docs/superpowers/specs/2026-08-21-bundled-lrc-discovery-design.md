# Repository-Bundled LRC Discovery Design

## Goal

Allow the existing HTML prototype Records player to discover repository-authored LRC files under `apps/html-prototype/public/lrc/` from effective Artist + Title metadata, loading only the selected track's lyrics while preserving current user override, playback, rendering, and scroll behavior.

## Current architecture

`apps/html-prototype/src/app.ts` owns the Records surface and calls `selectVinyl()` when a library row is selected. `allPersonalTracks()` projects built-in records from `availableVinylRecords` plus `personalPlayer.customTrackMeta`, and imported tracks from `musicLibrary`. Local lyrics are stored in the existing `customTrackLyrics` map for built-ins or `musicLibrary.tracks[].syncedLyrics/plainLyrics` for imported tracks. `parseLrc()`, `activeLyricIndexAt()`, and `lyricWindowForTime()` already provide parsing and playback synchronization. `showRecords()` performs the structural Records render, while `refreshRecordsLyricsUI()` updates desktop, mobile, and floating lyric state from live playback without a full modal render.

The build copies `public` to `dist/public` and separately copies `public/assets` and `public/scene-layouts` to root-level static namespaces. The LRC feature will add an explicit root-level `dist/lrc` copy so static deployments serve `/lrc/...`; the dev server will serve `.lrc` with a text MIME type.

## Design

### 1. Isolated manifest/resolver/loader module

Create `src/systems/BundledLyrics.ts` with three bounded responsibilities:

- Normalize lookup identities without changing displayed metadata. The base normalization trims, collapses whitespace, applies consistent Unicode normalization, lowercases Latin text, and applies conservative punctuation folding. A small isolated Traditional-to-Simplified character map supplies a second comparison form for Chinese script. Both forms are internal lookup values only.
- Validate and index a static manifest shaped as `{ tracks: Record<string, string>; aliases?: Record<string, string> }`. Canonical keys are Artist + `|` + Title. Referenced paths must be relative, remain inside the `/lrc/` namespace, and resolve to `/lrc/<path>`; unsafe paths, malformed shapes, duplicate normalized canonical keys, and missing alias targets fail deterministically without throwing from the Records flow. The index stores exact and Chinese-normalized canonical maps plus a normalized title collision index.
- Resolve and lazily load one selected track. Resolver order is exact normalized identity, Chinese-normalized identity, explicit alias, then unique normalized title. No substring, fuzzy, semantic, or best-score matching is used. The loader caches the parsed usable `SyncedLyricLine[]` result in memory by canonical key/path, caches the manifest once per session, and returns safe no-lyrics results for missing, invalid, or unusable assets.

The loader accepts injected `fetch` and `parseLrc` dependencies so tests can count requests without a browser or network. It never writes to `PersonalPlayerState`, fixtures, `localStorage`, IndexedDB, or imported-track records.

### 2. Records integration

Add an app-owned in-memory cache keyed by resolved canonical key/path, plus a runtime applied-lyrics map whose entries include the effective normalized Artist + Title identity that produced them. A metadata edit invalidates any applied bundled result for that track immediately; the old lines cannot remain visible, and the next selection can resolve the new identity. A monotonically increasing lyric request token guards late responses. In `selectVinyl()`:

1. Set the selected track through the existing state flow.
2. Check the current effective track for an existing local/user lyric override.
3. If no override exists and the track is eligible for bundled discovery, start one loader request using the effective Artist + Title.
4. Let the existing playback flow continue; selecting a track remains sufficient to trigger loading and does not depend on `timeupdate`.
5. When the request resolves, retain a successful result in the session cache. Apply it to the app's runtime bundled map only if both request token and selected track id still match. Then refresh only the existing lyric UI when Records is open.

The track projection will use local lyrics first, then a runtime bundled result whose stored identity exactly matches the current effective Artist + Title identity, then the existing empty state. Bundled lyrics are not copied into persisted override fields. Removing a local override, where the existing model permits it, simply leaves the track eligible for a future selection request.

`showRecords()` remains a render operation and does not fetch LRC files. `refreshRecordsLyricsUI()` remains the only live playback lyric updater; it will read the effective lyric projection, so desktop active/near rows, mobile windows, and floating lyrics keep using the existing synchronization path.

### 3. Authored static assets

Add `public/lrc/manifest.json` as a checked-in authored file. It explicitly maps canonical identities and aliases to the existing LRC filenames; build scripts do not generate or rewrite it. Existing untracked `.lrc` files remain unchanged. The build copies the LRC directory to `dist/lrc` in addition to the existing public copy, and the dev server recognizes `.lrc` as text. Tests verify the authored manifest exists, referenced files remain independently reachable, and no generated JS contains LRC bodies.

## Error and privacy behavior

No match, invalid manifest, invalid alias, unsafe path, fetch failure, HTTP error, malformed LRC, or zero usable lyric rows produces a toast or thrown Records error. The current no-lyrics UI remains. Development diagnostics, if used, contain only safe asset/key identifiers and never lyric bodies or user content. Stale async results may populate the loader's session cache but can never change current track state, lyric source, or UI.

## Testing strategy

- Pure resolver tests cover normalization, Chinese script equivalence, aliases, invalid targets, unique-title fallback, ambiguity, version suffixes, and rejection of substring/fuzzy matching.
- Loader tests use injected fetch/parser functions to prove manifest caching, selected-track-only fetching, parsed session reuse, safe failures, and late-result caching.
- Integration/source tests cover local override priority, runtime built-in immutability, existing Records lyric synchronization hooks, and no full render on `timeupdate`.
- Build/static tests run the actual HTML prototype build and inspect `/lrc/manifest.json` plus at least one `.lrc` in the built output.

## Constraints

- The Traditional-to-Simplified mapping is lookup-only and never rewrites displayed Artist/Title or fixture/local metadata. It is intentionally conservative rather than complete OpenCC-level conversion; unsupported cases remain unchanged and may use explicit aliases.
- A stale request may cache successful parsed lyrics, but application/UI updates require the request and selected-track identity to still be current.
- The safe title-only collision index is built from canonical `tracks` entries only; alias keys never add title candidates or create false ambiguity.
- `manifest.json` is authored static content; no filename-derived mapping generation or manifest rewriting is added.
- No second Records implementation, lyric player, backend, database, cloud service, paid API, scraper, or persistent bundled-lyric store is introduced.
