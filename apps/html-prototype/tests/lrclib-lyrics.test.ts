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

test("search fallback rejects title and artist variants and accepts exact metadata within two seconds", async () => {
  const requests: string[] = [];
  const provider = new LrclibLyricsProvider({
    fetch: async (input) => {
      const url = String(input);
      requests.push(url);
      if (url.includes("/api/get?")) return new Response("missing", { status: 404 });
      return jsonResponse([
        { trackName: "Song (Live)", artistName: "Artist", duration: 201, syncedLyrics: "[00:01]wrong" },
        { trackName: "Song", artistName: "Other Artist", duration: 201, syncedLyrics: "[00:01]wrong" },
        { trackName: "Song", artistName: "Artist", duration: 203, syncedLyrics: "[00:02]right" }
      ]);
    },
    parseLrc
  });

  const result = await provider.resolve({ title: "Song", artist: "Artist", duration: 201 });

  assert.deepEqual(result?.syncedLyrics, [{ time: 2, text: "right" }]);
  assert.equal(requests.length, 2);
  assert.match(requests[1], /\/api\/search\?/);
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
