# LRCLIB Synced-Lyrics Fallback Design

## Goal

Extend the existing Records lyric resolution flow with a lazy LRCLIB fallback while preserving the current source priority and synchronized lyric rendering system.

## Architecture

`BundledLyrics.ts` remains responsible only for repository-authored manifest/LRC discovery. A new `LrclibLyrics.ts` module owns LRCLIB request construction, response validation, conservative matching, synced-LRC parsing, retry-after cooldowns, and session/in-flight caches. `app.ts` only coordinates the source order: local override, bundled LRC, LRCLIB, then no lyrics.

LRCLIB is called only for the selected track after local and bundled sources have failed. The selected track's effective metadata is used, including local Artist/Title/Album overrides and available duration. Request results are applied only when the request token, selected track id, and effective Artist + Title identity are still current. Stale results may populate the provider cache but cannot update current lyric state or UI.

## Provider API

Use the documented direct-browser endpoint `GET https://lrclib.net/api/get` with `track_name`, `artist_name`, optional `album_name`, and optional duration in seconds. A precise response must remain compatible with the requested title, artist, and duration. If it returns no usable synced lyrics, use `GET https://lrclib.net/api/search` with track and artist parameters. Search candidates use a bounded scorer: normalized core title after comparison-only version-decoration removal is primary, meaningful artist overlap is secondary, and duration proximity is tertiary. Search duration is confidence rather than a hard filter; candidates still require usable synced lyrics, meaningful title compatibility, and a safety floor against unrelated songs. No arbitrary substring, semantic, or unconstrained best-score guessing is allowed.

LRCLIB direct browser access is supported by the observed `Access-Control-Allow-Origin: *` response header, and `Retry-After` is exposed. A 429 records a cooldown until the indicated retry time; ordinary failures are safe no-lyrics results and are not retried on every playback update.

The provider returns validated metadata plus `syncedLyrics`, `plainLyrics`, and provider identity. Only non-empty parsed `syncedLyrics` enter the existing synchronized lyric path. Plain-only results remain provider data for future use but are treated as no synced lyrics in the current Records UI; timestamps are never fabricated.

## Caching and priority

The provider caches successful synced results by effective lookup identity and shares in-flight requests. Failed lookups are not cached as lyrics. Runtime external lyrics never mutate built-in fixtures, imported persistent tracks, local overrides, localStorage, or IndexedDB. A local override immediately wins over any runtime external result, and bundled lyrics prevent LRCLIB from being called.

## UI integration

External synced lines are projected through the same `currentPersonalTrack()` path used by desktop Records, mobile Records, floating lyrics, active/near classes, mobile lyric windows, and audio `timeupdate`. Loading completion performs only the existing incremental lyric refresh, preserving Records scroll and playback state.

## Verification

Add provider tests for request parameters, exact candidate validation, duration matching, plain-only rejection, malformed/network/429 handling, cache and in-flight reuse, and race-safe application. Add app-source/integration tests for local and bundled short-circuiting, lazy selection, effective metadata, stale-response protection, and unchanged bundled behavior. Run focused tests, the full html-prototype suite, typecheck, build, and `git diff --check`.
