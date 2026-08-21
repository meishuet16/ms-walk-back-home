# Repository-Bundled LRC Discovery Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task with verification checkpoints.

**Goal:** Add authored static LRC manifest discovery and selected-track-only lazy loading to the existing HTML prototype Records system.

**Architecture:** Create one isolated `BundledLyrics.ts` system for lookup-only normalization, conservative manifest indexing/resolution, validation, and an in-memory manifest/parsed-lyrics session loader. Integrate it through the existing `selectVinyl`, effective metadata projection, Records rendering, and `timeupdate` lyric DOM update paths. Store only transient bundled results; local/user lyric overrides remain the first source and persistence model.

**Tech Stack:** TypeScript, Node built-in test runner, existing `parseLrc`, static `public` assets, custom Node build/dev scripts.

## Global Constraints

- Traditional-to-Simplified mapping is lookup-only and never rewrites displayed Artist/Title or fixture/local metadata.
- The Chinese mapping is conservative, not complete OpenCC-level conversion; unsupported cases remain unchanged and may require explicit aliases.
- A stale A request may populate the in-memory cache, but only the current request and current effective identity may update lyric state/UI.
- `public/lrc/manifest.json` is authored static content; build scripts must not generate or rewrite mappings.
- The safe title-only collision index is built from canonical `tracks` entries only; aliases never add title candidates.
- No second Records implementation, lyric player, backend, database, cloud service, paid API, scraper, or persistent bundled-lyric store.
- Preserve existing untracked authored `apps/html-prototype/public/lrc/*.lrc` files byte-for-byte.
- Do not log lyric bodies or private user content.

---

### Task 1: Define failing resolver and validation tests

**Files:** Create `apps/html-prototype/tests/bundled-lyrics.test.ts`; target `apps/html-prototype/src/systems/BundledLyrics.ts`.

**Interfaces:** `normalizeLookupText(value: string): string`; `normalizeChineseLookupText(value: string): string`; `trackIdentity(artist: string | undefined, title: string): string`; `buildBundledLyricsIndex(manifest: unknown): BundledLyricsIndex | null`; `resolveBundledLrc(track: BundledLyricsTrack, index: BundledLyricsIndex): BundledLyricsResolution | null`.

- [ ] **Step 1: Write the failing tests.** Cover exact Artist + Title, whitespace, Latin case, Unicode normalization, Traditional/Simplified pairs, lookup-only unchanged inputs, alias resolution, invalid alias targets, unique title fallback, canonical-only ambiguous title fallback, substring artist/title rejection, version suffix rejection, malformed manifest, unsafe path, and duplicate normalized canonical keys.

```ts
test("exact and normalized lookup resolves without changing metadata", () => {
  const index = buildBundledLyricsIndex({ tracks: { "胡夏|那些年": "naxienian.lrc" } });
  assert.ok(index);
  assert.deepEqual(resolveBundledLrc({ artist: " 胡夏 ", title: "那些年" }, index), { canonicalKey: "胡夏|那些年", lrcPath: "naxienian.lrc", matchType: "exact" });
  assert.equal(normalizeLookupText("  Ｔaylor   Swift  "), "taylor swift");
  assert.equal(normalizeLookupText("Cafe\u0301"), normalizeLookupText("Café"));
  const current = { artist: "劉若英", title: "後來" };
  assert.equal(resolveBundledLrc(current, buildIndex({ tracks: { "刘若英|后来": "houlai.lrc" } }))?.matchType, "chinese-normalized");
  assert.deepEqual(current, { artist: "劉若英", title: "後來" });
});
```

The test helper `buildIndex()` must assert that `buildBundledLyricsIndex()` is non-null. Add separate tests for aliases, collisions, unsafe paths, and no fuzzy matching.

- [ ] **Step 2: Run `npm run typecheck` from `apps/html-prototype` and confirm it fails because `BundledLyrics.ts` is missing.**
- [ ] **Step 3: Commit only the test with `git add -- apps/html-prototype/tests/bundled-lyrics.test.ts; git commit -m "test: define bundled lrc resolver contracts"`.**

### Task 2: Implement lookup-only manifest indexing and resolution

**Files:** Create `apps/html-prototype/src/systems/BundledLyrics.ts`; test `apps/html-prototype/tests/bundled-lyrics.test.ts`.

**Interfaces:**

```ts
export type BundledLyricsTrack = { artist?: string; title: string };
export type BundledLyricsMatchType = "exact" | "chinese-normalized" | "alias" | "unique-title";
export type BundledLyricsResolution = { canonicalKey: string; lrcPath: string; matchType: BundledLyricsMatchType };
export type BundledLyricsManifest = { tracks: Record<string, string>; aliases?: Record<string, string> };
export function normalizeLookupText(value: string): string;
export function normalizeChineseLookupText(value: string): string;
export function trackIdentity(artist: string | undefined, title: string): string;
export function buildBundledLyricsIndex(manifest: unknown): BundledLyricsIndex | null;
export function resolveBundledLrc(track: BundledLyricsTrack, index: BundledLyricsIndex): BundledLyricsResolution | null;
```

- [ ] **Step 1: Implement normalization and index creation.** Use NFKC, trim/collapse whitespace, lowercase, and only conservative quote/dash replacements. Keep a small isolated Traditional-to-Simplified map for the required examples and common fixture characters; unsupported characters stay unchanged. Never write normalized values back to records.
- [ ] **Step 2: Implement safe validation.** Require object `tracks`, string relative `.lrc` paths, optional object `aliases`; reject traversal segments, encoded traversal, backslashes, absolute prefixes, URL schemes, and duplicate base-normalized canonical keys. Alias targets must be exact keys in `tracks`; invalid aliases are ignored safely.
- [ ] **Step 3: Implement resolution order.** Check exact normalized Artist + Title, Chinese-normalized Artist + Title, alias (base and Chinese lookup forms), then unique title. Build the title index from canonical tracks only. Mark Chinese-normalized duplicate identities and title collisions ambiguous; never choose a candidate.
- [ ] **Step 4: Run `npm run build; node --test dist/tests/bundled-lyrics.test.js`; confirm green, then commit `BundledLyrics.ts` and the test.**

### Task 3: Add lazy loader, parsed cache, and safe failures

**Files:** Modify `apps/html-prototype/src/systems/BundledLyrics.ts` and `apps/html-prototype/tests/bundled-lyrics.test.ts`.

**Interfaces:**

```ts
export class BundledLyricsLoader {
  constructor(options?: { manifestUrl?: string; fetch?: typeof fetch; parseLrc?: (source: string) => SyncedLyricLine[] });
  load(track: BundledLyricsTrack): Promise<{ resolution: BundledLyricsResolution; lines: SyncedLyricLine[] } | null>;
}
```

- [ ] **Step 1: Add failing injected-fetch tests.** Assert manifest fetch occurs once; opening/manifest access fetches zero individual LRCs; A fetches only `a.lrc`; reselecting A uses the parsed cache; B fetches only `b.lrc`; concurrent same-path loads share one request; no match, invalid manifest, 404, malformed/empty parse return `null` without throwing; a successful stale result remains reusable in the loader cache.

```ts
const loader = new BundledLyricsLoader({
  fetch: async (input) => {
    requests.push(String(input));
    if (String(input) === "/lrc/manifest.json") return new Response(JSON.stringify({ tracks: { "A|Song A": "a.lrc" } }));
    return new Response("[00:01]line");
  }
});
assert.deepEqual((await loader.load({ artist: "A", title: "Song A" }))?.lines, [{ time: 1, text: "line" }]);
assert.deepEqual(requests, ["/lrc/manifest.json", "/lrc/a.lrc"]);
```

- [ ] **Step 2: Run `npm run typecheck` and confirm the loader test fails before implementation.**
- [ ] **Step 3: Implement `BundledLyricsLoader`.** Default to `/lrc/manifest.json`; cache its promise; validate/index once; resolve only the requested track; fetch only the encoded `/lrc/<path>`; call existing `parseLrc`; accept only non-empty rows; cache successful rows by path and in-flight promises by path; catch all failures and return `null` without logging raw lyrics.
- [ ] **Step 4: Run focused loader tests green and commit with `git commit -m "feat: add lazy bundled lrc session loader"`.**

### Task 4: Add authored manifest and root static serving

**Files:** Create `apps/html-prototype/public/lrc/manifest.json`; modify `apps/html-prototype/scripts/build.mjs`, `apps/html-prototype/scripts/dev-server.mjs`, and the bundled-lyrics tests.

- [ ] **Step 1: Add authored mappings without touching existing `.lrc` files.** Include canonical entries for `胡夏|那些年`, `项睿娴|Dear D (亲爱的告诉你)`, `Chen Li|小半`, `LBI|Jumping Machine (跳楼机)`, and `21 Savage & Jawan Harris|I WISH`; include explicit aliases for `胡夏 Xia Hu|Those Bygone Years 那些年 / NA` and `陳粒|小半`. Any additional entries must be explicit authored identities, never filename-derived by build.
- [ ] **Step 2: Add `await cp(resolve(root, "public/lrc"), resolve(root, "dist/lrc"), { recursive: true });` to `scripts/build.mjs`. Add `.lrc: "text/plain; charset=utf-8"` to the dev-server MIME table.
- [ ] **Step 3: Test manifest bytes remain unchanged, all referenced public files exist, `dist/lrc/manifest.json` and one independent `.lrc` exist after build, and generated JS has no lyric body.**
- [ ] **Step 4: Run `npm run build; node --test dist/tests/bundled-lyrics.test.js` and commit the static work with `git commit -m "feat: serve authored bundled lrc assets"`.**

### Task 5: Integrate identity-aware lazy lyrics into Records

**Files:** Modify `apps/html-prototype/src/app.ts`; modify `apps/html-prototype/tests/bundled-lyrics.test.ts` and, if appropriate for existing source-policy coverage, `apps/html-prototype/tests/ui-policy.test.ts`.

**Interfaces:**

```ts
private bundledLyricsRuntime: Map<string, { identity: string; lines: SyncedLyricLine[] }>;
private bundledLyricsRequestToken: number;
private localLyricsForTrack(track: ReturnType<typeof this.allPersonalTracks>[number]): SyncedLyricLine[] | undefined;
private effectiveLyricsForTrack(track: ReturnType<typeof this.allPersonalTracks>[number]): SyncedLyricLine[] | undefined;
private invalidateBundledLyricsForTrack(trackId: string): void;
private loadBundledLyricsForSelectedTrack(): Promise<void>;
```

- [ ] **Step 1: Add failing source/integration assertions.** Check loader import/field, identity-bearing runtime entries, local-before-bundled branch, token/track/identity guards, `selectVinyl` trigger, metadata invalidation, no loader call from `showRecords`, and existing `refreshRecordsLyricsUI` timeupdate path.
- [ ] **Step 2: Run the focused source tests and confirm RED.**
- [ ] **Step 3: Implement source priority.** Existing built-in `customTrackLyrics` and imported `syncedLyrics` are local overrides. Runtime bundled rows are exposed only when their stored `trackIdentity(current artist, current title)` equals the current effective identity. Metadata changes delete runtime rows, increment the token, clear current lyric DOM immediately, and may start a new lookup only if no local override exists. Never persist bundled rows.
- [ ] **Step 4: Implement race-safe selection loading.** After `selectVinyl` sets the selected id, preserve existing playback/room behavior and call `void loadBundledLyricsForSelectedTrack()`. Capture track id, effective identity, and token. Return for local override; otherwise await loader. Apply only if all captured values still match current state. A stale result can remain in loader cache but cannot update current runtime/UI.
- [ ] **Step 5: Keep rendering incremental.** `showRecords()` reads effective lyrics and never fetches. Current successful load calls only `refreshRecordsLyricsUI(this.currentPersonalPlaybackTime())` when Records is open; no structural rerender or scroll reset.
- [ ] **Step 6: Run `npm run build; node --test dist/tests/bundled-lyrics.test.js dist/tests/personal-music.test.js dist/tests/ui-policy.test.js`; commit with `git commit -m "feat: lazily load bundled lyrics in Records"`.**

### Task 6: Full verification and final local commit

- [ ] **Step 1:** Run `npm run build` and `node --test dist/tests/bundled-lyrics.test.js`.
- [ ] **Step 2:** Run `npm test`, `npm run typecheck`, and `npm run build` from `apps/html-prototype`.
- [ ] **Step 3:** Run `git diff --check`; verify `dist/lrc/manifest.json` and `dist/lrc/那些年_歌词.lrc` exist; verify authored public manifest/LRC files did not change during build.
- [ ] **Step 4:** Start `npm run dev`, request `/lrc/manifest.json` and `/lrc/那些年_歌词.lrc`, and confirm JSON/text responses and no individual LRC fetch at startup/Records open.
- [ ] **Step 5:** If browser tooling is available, select bundled lyrics without Play, verify desktop/mobile/floating synchronization, rapid A → B race safety, A cache reuse, manual override priority, imported lyrics, batch selection, playback, and scroll stability. Do not claim this check if unavailable.
- [ ] **Step 6:** Review `git status --short`, leave unrelated user files untouched, stage only implementation files, and create the final local commit: `git commit -m "feat: add repository bundled lyric discovery"`.
