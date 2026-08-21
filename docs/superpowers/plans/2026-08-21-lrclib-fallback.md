# LRCLIB Synced-Lyrics Fallback Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task with verification checkpoints.

**Goal:** Add lazy, synced-only LRCLIB fallback resolution to Records after local and repository-bundled lyrics, without creating another player, persistent lyric store, or proxy.

**Architecture:** Create `LrclibLyrics.ts` as the only LRCLIB-specific module. It will build precise `/api/get` requests, conservatively validate `/api/search` candidates, parse usable synced LRC through the existing `parseLrc`, and cache successful results/in-flight requests in memory. `app.ts` will add only source-priority orchestration and identity/race guards; all rendering continues through `currentPersonalTrack()` and existing desktop/mobile/floating `timeupdate` updates.

**Tech Stack:** TypeScript, native `fetch`, Node test runner, existing `parseLrc`, existing Records projection/rendering, static HTML prototype.

## Global Constraints

- Source priority is exactly local user override → repository bundled LRC → LRCLIB → no lyrics.
- LRCLIB runs only for the selected unresolved track; never at startup, Records open, row rendering, or on `timeupdate`.
- LRCLIB is synced-only for this task; plain-only results are safe no-lyrics results and must not receive fabricated timestamps.
- Use effective current Artist, Title, Album, and duration metadata; do not mutate displayed metadata, fixtures, imported persistent tracks, localStorage, or IndexedDB.
- Use exact normalized title/artist matching; no substring, fuzzy, semantic, token, or best-score matching.
- Respect `Retry-After` after HTTP 429 and never retry repeatedly during playback updates.
- Direct browser requests use `https://lrclib.net`; no backend, proxy, scraper, paid API, or cloud service.
- Preserve the existing bundled resolver and all authored `public/lrc` files and manifest content.
- Do not log raw lyric bodies or user/private content.

---

### Task 1: Add failing isolated provider tests

**Files:**
- Create: `apps/html-prototype/tests/lrclib-lyrics.test.ts`
- Reference: `apps/html-prototype/src/systems/PersonalMusic.ts`
- Reference: `apps/html-prototype/src/systems/BundledLyrics.ts`

**Interfaces:**
- The tests will define the desired `LrclibLyricsProvider` constructor and `resolve` result shape before implementation.
- The provider will accept injected `fetch`, `parseLrc`, `now`, and optional `sleep` dependencies so tests never call the network or wait in real time.

- [ ] **Step 1: Write tests for precise request construction and synced parsing**

```ts
test("precise lookup sends effective metadata and duration", async () => {
  const requests: string[] = [];
  const provider = new LrclibLyricsProvider({
    fetch: async (input) => {
      requests.push(String(input));
      return jsonResponse({ trackName: "Song", artistName: "Artist", duration: 201, syncedLyrics: "[00:01]hello" });
    },
    parseLrc
  });
  const result = await provider.resolve({ title: "Song", artist: "Artist", album: "Album", duration: 201 });
  assert.deepEqual(result?.syncedLyrics, [{ time: 1, text: "hello" }]);
  assert.match(requests[0], /\/api\/get\?/);
  assert.match(requests[0], /track_name=Song/);
  assert.match(requests[0], /artist_name=Artist/);
  assert.match(requests[0], /album_name=Album/);
  assert.match(requests[0], /duration=201/);
});
```

- [ ] **Step 2: Add tests for plain-only, malformed, network, and 404 results**

```ts
test("plain-only result is treated as no synced lyrics", async () => {
  const provider = providerFor({ plainLyrics: "no timestamps" });
  assert.equal(await provider.resolve({ title: "Song", artist: "Artist" }), null);
});

test("malformed and failed responses return null", async () => {
  for (const fetch of [
    async () => new Response("not json", { status: 200 }),
    async () => new Response("missing", { status: 404 }),
    async () => { throw new Error("offline"); }
  ]) {
    const provider = new LrclibLyricsProvider({ fetch, parseLrc });
    assert.equal(await provider.resolve({ title: "Song", artist: "Artist" }), null);
  }
});
```

- [ ] **Step 3: Add tests for exact search validation and duration tolerance**

```ts
test("search fallback rejects title or artist variants and accepts duration within two seconds", async () => {
  const provider = new LrclibLyricsProvider({
    fetch: async (input) => String(input).includes("/api/get?")
      ? new Response("missing", { status: 404 })
      : jsonResponse([
          { trackName: "Song (Live)", artistName: "Artist", duration: 201, syncedLyrics: "[00:01]wrong" },
          { trackName: "Song", artistName: "Other Artist", duration: 201, syncedLyrics: "[00:01]wrong" },
          { trackName: "Song", artistName: "Artist", duration: 203, syncedLyrics: "[00:02]right" }
        ]),
    parseLrc
  });
  const result = await provider.resolve({ title: "Song", artist: "Artist", duration: 201 });
  assert.deepEqual(result?.syncedLyrics, [{ time: 2, text: "right" }]);
});
```

- [ ] **Step 4: Add tests for cache, in-flight reuse, and 429 cooldown**

```ts
test("successful results are cached and concurrent requests share one fetch", async () => {
  let calls = 0;
  let release!: () => void;
  const gate = new Promise<void>((resolve) => { release = resolve; });
  const provider = new LrclibLyricsProvider({
    fetch: async () => { calls += 1; await gate; return jsonResponse({ trackName: "Song", artistName: "Artist", syncedLyrics: "[00:01]ok" }); },
    parseLrc
  });
  const first = provider.resolve({ title: "Song", artist: "Artist" });
  const second = provider.resolve({ title: "Song", artist: "Artist" });
  release();
  await Promise.all([first, second]);
  await provider.resolve({ title: "Song", artist: "Artist" });
  assert.equal(calls, 1);
});

test("429 honors retry-after without immediate refetch", async () => {
  let calls = 0;
  const provider = new LrclibLyricsProvider({
    fetch: async () => { calls += 1; return new Response("busy", { status: 429, headers: { "Retry-After": "60" } }); },
    now: () => 1000,
    parseLrc
  });
  assert.equal(await provider.resolve({ title: "Song", artist: "Artist" }), null);
  assert.equal(await provider.resolve({ title: "Song", artist: "Artist 2" }), null);
  assert.equal(calls, 1);
});
```

- [ ] **Step 5: Run the new test file and verify the expected RED state**

Run: `npm run build; node --test dist/tests/lrclib-lyrics.test.js`

Expected: FAIL because `src/systems/LrclibLyrics.ts` does not exist yet.

### Task 2: Implement the isolated LRCLIB provider

**Files:**
- Create: `apps/html-prototype/src/systems/LrclibLyrics.ts`
- Test: `apps/html-prototype/tests/lrclib-lyrics.test.ts`

**Interfaces:**
- Export `LrclibTrackInput = { title: string; artist?: string; album?: string; duration?: number }`.
- Export `LrclibLyricsResult = { syncedLyrics: SyncedLyricLine[]; plainLyrics?: string; trackName: string; artistName: string; albumName?: string; duration?: number; provider: "lrclib" }`.
- Export `LrclibLyricsProvider.resolve(track): Promise<LrclibLyricsResult | null>`.

- [ ] **Step 1: Implement normalization and query construction**

Use `normalizeLookupText` from `BundledLyrics.ts` for exact comparison only. Include `duration` only when finite and between 1 and 3600 seconds. Set `Lrclib-Client` to a concise app identifier because browser JavaScript cannot set `User-Agent`.

- [ ] **Step 2: Implement `/api/get` response validation**

Require a JSON object, non-empty string `trackName`/`artistName` or fall back to requested metadata, and parse `syncedLyrics` with `parseLrc`. Return null if parsing yields no rows. Preserve `plainLyrics` in the result only when it is a string; never convert it into timed rows.

- [ ] **Step 3: Implement conservative `/api/search` fallback**

Call search only after `/api/get` returns 404/no usable synced result. Select the first candidate in response order that has exact normalized title and artist equality and, when requested duration exists and candidate duration is finite, absolute difference no greater than 2 seconds. If candidate duration is missing while requested duration is available, reject it. Parse only non-empty synced lyrics.

- [ ] **Step 4: Implement in-memory cache, in-flight deduplication, and retry-after cooldown**

Key successful results by normalized effective metadata including duration. Share promises by the same key. On 429 parse `Retry-After` as seconds or HTTP date and block all provider requests until the cooldown expires; return null without retrying. Do not persist any provider result.

- [ ] **Step 5: Run provider tests and verify GREEN**

Run: `npm run build; node --test dist/tests/lrclib-lyrics.test.js`

Expected: all provider tests pass.

### Task 3: Add failing source-priority and race integration tests

**Files:**
- Modify: `apps/html-prototype/tests/bundled-lyrics.test.ts`
- Create or modify: `apps/html-prototype/tests/lrclib-lyrics.test.ts`
- Reference: `apps/html-prototype/src/app.ts`

- [ ] **Step 1: Add source-priority assertions**

Assert app source contains a local override early return, bundled result application before external lookup, and LRCLIB invocation only after bundled failure. Assert no LRCLIB call is made for local or bundled tracks using provider spies at the orchestration seam.

- [ ] **Step 2: Add lazy-selection and effective-metadata assertions**

Assert selection triggers the source resolver without `play`, app passes effective `artist`, `title`, `album`, and duration, and `showRecords`/row rendering/timeupdate do not invoke the provider.

- [ ] **Step 3: Add stale-response and cache assertions**

Use deferred provider promises to model A then B. Assert A’s late result is cached but the current projection remains B and source state remains B/none. Assert changing effective metadata invalidates A immediately and permits a new lookup identity.

- [ ] **Step 4: Run integration tests and verify RED before app changes**

Run: `npm run build; node --test dist/tests/lrclib-lyrics.test.js dist/tests/bundled-lyrics.test.js`

Expected: newly added integration assertions fail because `app.ts` has no LRCLIB source yet.

### Task 4: Integrate LRCLIB into Records source orchestration

**Files:**
- Modify: `apps/html-prototype/src/app.ts`
- Test: `apps/html-prototype/tests/lrclib-lyrics.test.ts`
- Test: `apps/html-prototype/tests/bundled-lyrics.test.ts`

**Interfaces:**
- Add `private lrclibLyricsProvider = new LrclibLyricsProvider()`.
- Add runtime state keyed by track id containing `{ identity, source: "bundled" | "lrclib" | "none", lines?: SyncedLyricLine[] }`.
- Reuse the existing request-token guard and `effectiveLyricsForTrack` projection; do not add provider-specific DOM or playback code.

- [ ] **Step 1: Add effective lookup metadata helper**

Return current projected Artist, Title, Album, and duration from `currentPersonalTrack()`. Keep values exactly as displayed; only provider normalization changes comparisons/query encoding.

- [ ] **Step 2: Extend selected-track loading to local → bundled → LRCLIB → none**

When selected, increment the request token, clear runtime lyrics for that track, return immediately for local lyrics, call existing `BundledLyricsLoader`, and only if it returns null call `LrclibLyricsProvider.resolve`. Apply bundled or LRCLIB lines only after checking request token, selected id, current id, and current effective identity. A successful external result must never be saved into `musicLibrary` or `customTrackLyrics`.

- [ ] **Step 3: Preserve safe no-lyrics state and source metadata**

Store `source: "none"` for current unresolved requests if useful for tests, but keep the existing empty lyric UI. A provider failure must clear old runtime lines for the current identity without throwing or showing a repeated toast.

- [ ] **Step 4: Invalidate external runtime state on local lyric and metadata changes**

Reuse `invalidateBundledLyricsForTrack` or rename it to a source-neutral invalidator. Local lyric edits must immediately win. Metadata changes must clear old runtime lines and start a lookup for the new identity. Removing/resetting local lyrics must make fallback eligible through the existing flow if supported.

- [ ] **Step 5: Refresh only lyric UI after successful async resolution**

Call `refreshRecordsLyricsUI(currentTime)` when Records is open and `updatePersonalMusicOverlay()` otherwise. Do not call `showRecords()` from a provider completion or from `timeupdate`.

- [ ] **Step 6: Run integration and existing tests and verify GREEN**

Run: `npm run build; node --test dist/tests/lrclib-lyrics.test.js dist/tests/bundled-lyrics.test.js dist/tests/personal-music.test.js dist/tests/ui-policy.test.js`

Expected: all focused tests pass and existing bundled behavior remains green.

### Task 5: Full verification and local commit

**Files:**
- Modify: only implementation/tests/docs listed above.

- [ ] **Step 1: Run the complete html-prototype test suite**

Run: `npm test`

Expected: zero failures.

- [ ] **Step 2: Run typecheck, build, and whitespace validation**

Run: `npm run typecheck; npm run build; git diff --check`

Expected: all commands exit 0. Confirm no `public/lrc` file or manifest content changed.

- [ ] **Step 3: Run static asset smoke checks**

Serve the built prototype and request `/lrc/manifest.json` and an authored `.lrc`; confirm 200 responses and independent assets. No LRCLIB request should occur during startup or Records opening.

- [ ] **Step 4: Review the final diff and commit only scoped changes**

Run `git status --short` and stage only the provider, app integration, tests, and design/plan docs. Commit with:

```bash
git add -- apps/html-prototype/src/systems/LrclibLyrics.ts apps/html-prototype/src/app.ts apps/html-prototype/tests/lrclib-lyrics.test.ts apps/html-prototype/tests/bundled-lyrics.test.ts docs/superpowers/specs/2026-08-21-lrclib-fallback-design.md docs/superpowers/plans/2026-08-21-lrclib-fallback.md
git commit -m "feat: add LRCLIB synced lyrics fallback"
```

- [ ] **Step 5: Report browser verification honestly**

If browser automation is unavailable, report that interactive A/B switching and visual mobile verification were not performed; do not infer them from source tests.
