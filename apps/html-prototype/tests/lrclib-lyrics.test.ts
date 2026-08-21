import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import test from "node:test";
import { parseLrc } from "../src/systems/PersonalMusic.js";
import { LrclibLyricsProvider, type LrclibTrackInput } from "../src/systems/LrclibLyrics.js";

function jsonResponse(value: unknown, status = 200, headers?: HeadersInit): Response {
  return new Response(JSON.stringify(value), { status, headers: { "content-type": "application/json", ...headers } });
}

function providerFor(value: unknown, options: { status?: number; fetch?: typeof fetch } = {}): LrclibLyricsProvider {
  return new LrclibLyricsProvider({
    fetch: options.fetch ?? (async () => jsonResponse(value, options.status)),
    parseLrc
  });
}

function searchProvider(candidates: unknown): LrclibLyricsProvider {
  return new LrclibLyricsProvider({
    fetch: async (input) => String(input).includes("/api/get?")
      ? new Response("missing", { status: 404 })
      : jsonResponse(candidates),
    parseLrc
  });
}

test("precise lookup sends effective metadata and duration and parses synced lyrics", async () => {
  const requests: string[] = [];
  const provider = new LrclibLyricsProvider({
    fetch: async (input) => {
      requests.push(String(input));
      return jsonResponse({ trackName: "Song", artistName: "Artist", albumName: "Album", duration: 201, syncedLyrics: "[00:01]hello" });
    },
    parseLrc
  });

  const result = await provider.resolve({ title: "Song", artist: "Artist", album: "Album", duration: 201 });

  assert.deepEqual(result?.syncedLyrics, [{ time: 1, text: "hello" }]);
  assert.equal(result?.provider, "lrclib");
  const query = new URL(requests[0]).searchParams;
  assert.match(requests[0], /lrclib\.net\/api\/get\?/);
  assert.equal(query.get("track_name"), "Song");
  assert.equal(query.get("artist_name"), "Artist");
  assert.equal(query.get("album_name"), "Album");
  assert.equal(query.get("duration"), "201");
});

test("plain-only LRCLIB results are treated as no synced lyrics", async () => {
  const provider = providerFor({ trackName: "Song", artistName: "Artist", plainLyrics: "no timestamps" });
  assert.equal(await provider.resolve({ title: "Song", artist: "Artist" }), null);
});

test("malformed, missing, and network-failed responses return null safely", async () => {
  const providers = [
    new LrclibLyricsProvider({ fetch: async () => new Response("not json", { status: 200 }), parseLrc }),
    providerFor({ code: 404 }, { status: 404 }),
    new LrclibLyricsProvider({ fetch: async () => { throw new Error("offline"); }, parseLrc })
  ];
  for (const provider of providers) assert.equal(await provider.resolve({ title: "Song", artist: "Artist" }), null);
});

test("search fallback allows common title version decorations", async () => {
  const provider = searchProvider([
    { trackName: "那些年 (Live)", artistName: "胡夏", duration: 240, syncedLyrics: "[00:01]live" },
    { trackName: "左转灯 (1000 Times+1)", artistName: "LBI", duration: 300, syncedLyrics: "[00:02]left" }
  ]);

  const bygone = await provider.resolve({ title: "那些年", artist: "胡夏", duration: 201 });
  assert.deepEqual(bygone?.syncedLyrics, [{ time: 1, text: "live" }]);

  const alternate = await searchProvider([
    { trackName: "左转灯 (1000 Times+1)", artistName: "LBI", duration: 300, syncedLyrics: "[00:02]left" }
  ]).resolve({ title: "左转灯", artist: "LBI", duration: 201 });
  assert.deepEqual(alternate?.syncedLyrics, [{ time: 2, text: "left" }]);
});

test("search fallback accepts Traditional/Simplified titles and partial artist overlap", async () => {
  const traditional = await searchProvider([
    { trackName: "后来", artistName: "刘若英", duration: 245, syncedLyrics: "[00:01]later" }
  ]).resolve({ title: "後來", artist: "劉若英", duration: 201 });
  assert.deepEqual(traditional?.syncedLyrics, [{ time: 1, text: "later" }]);

  const partialArtist = await searchProvider([
    { trackName: "Song (Acoustic)", artistName: "派伟俊 & mac ova seas", duration: 260, syncedLyrics: "[00:02]partial" }
  ]).resolve({ title: "Song", artist: "派伟俊", duration: 201 });
  assert.deepEqual(partialArtist?.syncedLyrics, [{ time: 2, text: "partial" }]);
});

test("search duration is a confidence score rather than a hard two-second rejection", async () => {
  const result = await searchProvider([
    { trackName: "Song", artistName: "Artist", duration: 245, syncedLyrics: "[00:03]longer" }
  ]).resolve({ title: "Song", artist: "Artist", duration: 201 });
  assert.deepEqual(result?.syncedLyrics, [{ time: 3, text: "longer" }]);
});

test("search fallback rejects unrelated titles and same-artist different songs", async () => {
  const unrelated = await searchProvider([
    { trackName: "Another Song", artistName: "Artist", duration: 201, syncedLyrics: "[00:01]wrong" }
  ]).resolve({ title: "Song", artist: "Artist", duration: 201 });
  assert.equal(unrelated, null);

  const sameArtistDifferentSong = await searchProvider([
    { trackName: "Different Song", artistName: "Artist", duration: 201, syncedLyrics: "[00:01]wrong" }
  ]).resolve({ title: "Song", artist: "Artist", duration: 201 });
  assert.equal(sameArtistDifferentSong, null);
});

test("search fallback rejects plain-only candidates", async () => {
  const result = await searchProvider([
    { trackName: "Song (Live)", artistName: "Artist", duration: 201, plainLyrics: "no timestamps" }
  ]).resolve({ title: "Song", artist: "Artist", duration: 201 });
  assert.equal(result, null);
});

test("search fallback chooses the strongest title, artist, and duration candidate", async () => {
  const result = await searchProvider([
    { trackName: "Song (Live)", artistName: "Artist & Other", duration: 250, syncedLyrics: "[00:01]weaker" },
    { trackName: "Song (Acoustic)", artistName: "Other Artist", duration: 202, syncedLyrics: "[00:02]wrong artist" },
    { trackName: "Song", artistName: "Artist", duration: 203, syncedLyrics: "[00:03]strongest" }
  ]).resolve({ title: "Song", artist: "Artist", duration: 201 });
  assert.deepEqual(result?.syncedLyrics, [{ time: 3, text: "strongest" }]);
});

test("precise lookup also rejects contradictory returned metadata", async () => {
  const requests: string[] = [];
  const provider = new LrclibLyricsProvider({
    fetch: async (input) => {
      const url = String(input);
      requests.push(url);
      return url.includes("/api/get?")
        ? jsonResponse({ trackName: "Song (Live)", artistName: "Artist", duration: 201, syncedLyrics: "[00:01]wrong" })
        : jsonResponse([{ trackName: "Song", artistName: "Artist", duration: 201, syncedLyrics: "[00:02]right" }]);
    },
    parseLrc
  });
  const result = await provider.resolve({ title: "Song", artist: "Artist", duration: 201 });
  assert.deepEqual(result?.syncedLyrics, [{ time: 2, text: "right" }]);
  assert.equal(requests.length, 2);
});

test("precise lookup keeps strict duration validation while search remains relaxed", async () => {
  const provider = new LrclibLyricsProvider({
    fetch: async (input) => String(input).includes("/api/get?")
      ? jsonResponse({ trackName: "Song", artistName: "Artist", duration: 240, syncedLyrics: "[00:01]wrong" })
      : jsonResponse([]),
    parseLrc
  });
  assert.equal(await provider.resolve({ title: "Song", artist: "Artist", duration: 201 }), null);
});

test("successful results are cached and concurrent requests share one fetch", async () => {
  let calls = 0;
  let release!: () => void;
  const gate = new Promise<void>((resolve) => { release = resolve; });
  const provider = new LrclibLyricsProvider({
    fetch: async () => {
      calls += 1;
      await gate;
      return jsonResponse({ trackName: "Song", artistName: "Artist", syncedLyrics: "[00:01]ok" });
    },
    parseLrc
  });

  const first = provider.resolve({ title: "Song", artist: "Artist" });
  const second = provider.resolve({ title: "Song", artist: "Artist" });
  release();
  await Promise.all([first, second]);
  await provider.resolve({ title: "Song", artist: "Artist" });

  assert.equal(calls, 1);
});

test("429 honors retry-after and prevents immediate refetch across identities", async () => {
  let calls = 0;
  const provider = new LrclibLyricsProvider({
    fetch: async () => {
      calls += 1;
      return new Response("busy", { status: 429, headers: { "Retry-After": "60" } });
    },
    now: () => 1_000,
    parseLrc
  });

  assert.equal(await provider.resolve({ title: "Song", artist: "Artist" }), null);
  assert.equal(await provider.resolve({ title: "Song", artist: "Artist 2" }), null);
  assert.equal(calls, 1);
});

test("provider lookup identity distinguishes effective metadata and duration", async () => {
  const requests: string[] = [];
  const provider = new LrclibLyricsProvider({
    fetch: async (input) => {
      requests.push(String(input));
      return jsonResponse({ trackName: "Song", artistName: "Artist", syncedLyrics: "[00:01]ok" });
    },
    parseLrc
  });
  const track: LrclibTrackInput = { title: "Song", artist: "Artist", album: "Album", duration: 201 };
  await provider.resolve(track);
  await provider.resolve({ ...track, title: "Song (Live)" });
  assert.equal(requests.length, 3);
  assert.equal(new URL(requests[1]).searchParams.get("track_name"), "Song (Live)");
});

test("Records keeps local and bundled lyrics ahead of LRCLIB and loads the fallback lazily", async () => {
  const source = await readFile(join(process.cwd(), "src", "app.ts"), "utf8");
  assert.match(source, /LrclibLyricsProvider/);
  assert.match(source, /lrclibLyricsProvider/);
  assert.match(source, /localLyricsForTrack\(track\)/);
  assert.match(source, /bundledLyricsLoader\.load/);
  assert.match(source, /lrclibLyricsProvider\.resolve/);
  assert.match(source, /track\.artist[\s\S]*track\.title[\s\S]*track\.album[\s\S]*track\.duration/);
  assert.match(source, /if \(bundledResult\)[\s\S]*return;[\s\S]*lrclibLyricsProvider\.resolve/);
  assert.match(source, /private lrclibLyricsRuntime/);
  assert.match(source, /source: "lrclib"/);
  const timeUpdate = source.slice(source.indexOf("private handlePersonalTimeUpdate"), source.indexOf("private async handlePersonalTrackEnded"));
  assert.doesNotMatch(timeUpdate, /lrclibLyricsProvider/);
  const showRecords = source.slice(source.indexOf("private async showRecords"), source.indexOf("private toggleRecordSelection"));
  assert.doesNotMatch(showRecords, /lrclibLyricsProvider/);
});

test("Records guards LRCLIB results by request, track, and effective identity", async () => {
  const source = await readFile(join(process.cwd(), "src", "app.ts"), "utf8");
  assert.match(source, /lrclibLyricsRequestToken/);
  assert.match(source, /requestToken !== this\.lrclibLyricsRequestToken/);
  assert.match(source, /this\.personalPlayer\.selectedTrackId !== trackId/);
  assert.match(source, /current\?\.id !== trackId/);
  assert.match(source, /identity !== .*trackIdentity/);
  assert.match(source, /lrclibLyricsRuntime\.set\(trackId/);
  assert.match(source, /refreshRecordsLyricsUI\(this\.currentPersonalPlaybackTime\(\)\)/);
});
