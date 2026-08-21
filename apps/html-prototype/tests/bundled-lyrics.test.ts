import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";
import {
  BundledLyricsLoader,
  buildBundledLyricsIndex,
  normalizeChineseLookupText,
  normalizeLookupText,
  resolveBundledLrc,
  trackIdentity,
  type BundledLyricsManifest
} from "../src/systems/BundledLyrics.js";

function indexFor(manifest: BundledLyricsManifest) {
  const index = buildBundledLyricsIndex(manifest);
  assert.ok(index);
  return index;
}

test("exact and normalized lookup resolves without changing metadata", () => {
  const index = indexFor({ tracks: { "胡夏|那些年": "naxienian.lrc" } });
  assert.deepEqual(resolveBundledLrc({ artist: " 胡夏 ", title: "那些年" }, index), {
    canonicalKey: "胡夏|那些年",
    lrcPath: "naxienian.lrc",
    matchType: "exact"
  });
  assert.equal(normalizeLookupText("  Ｔaylor   Swift  "), "taylor swift");
  assert.equal(normalizeLookupText("Cafe\u0301"), normalizeLookupText("Café"));
  assert.equal(trackIdentity("  Taylor  Swift ", " Love   Story "), "taylor swift|love story");
});

test("Chinese matching is lookup-only and supports conservative script pairs", () => {
  assert.equal(normalizeChineseLookupText("劉若英"), normalizeChineseLookupText("刘若英"));
  assert.equal(normalizeChineseLookupText("後來"), normalizeChineseLookupText("后来"));
  assert.equal(normalizeChineseLookupText("生僻字"), "生僻字");
  const current = { artist: "劉若英", title: "後來" };
  const result = resolveBundledLrc(current, indexFor({ tracks: { "刘若英|后来": "houlai.lrc" } }));
  assert.equal(result?.matchType, "chinese-normalized");
  assert.deepEqual(current, { artist: "劉若英", title: "後來" });
});

test("aliases resolve and invalid alias targets fail safely", () => {
  const index = indexFor({
    tracks: { "胡夏|那些年": "naxienian.lrc" },
    aliases: { "群星|那些年": "胡夏|那些年" }
  });
  assert.deepEqual(resolveBundledLrc({ artist: "群星", title: "那些年" }, index), {
    canonicalKey: "胡夏|那些年",
    lrcPath: "naxienian.lrc",
    matchType: "alias"
  });
  const invalid = indexFor({
    tracks: { "胡夏|那些年": "naxienian.lrc" },
    aliases: { "群星|另一首": "missing|track" }
  });
  assert.equal(resolveBundledLrc({ artist: "群星", title: "另一首" }, invalid), null);
});

test("unique canonical title-only fallback is safe and aliases do not add candidates", () => {
  assert.deepEqual(resolveBundledLrc({ artist: "群星", title: "那些年" }, indexFor({
    tracks: { "胡夏|那些年": "naxienian.lrc" }
  })), {
    canonicalKey: "胡夏|那些年",
    lrcPath: "naxienian.lrc",
    matchType: "unique-title"
  });
  const ambiguous = indexFor({
    tracks: { "胡夏|那些年": "a.lrc", "某歌手|那些年": "b.lrc" },
    aliases: { "别名|其他": "胡夏|那些年" }
  });
  assert.equal(resolveBundledLrc({ artist: "群星", title: "那些年" }, ambiguous), null);
});

test("substring matching, version guessing, and artist guessing are rejected", () => {
  const index = indexFor({ tracks: { "胡夏|那些年": "a.lrc", "Taylor Swift|Love Story": "b.lrc" } });
  assert.equal(resolveBundledLrc({ artist: "胡夏", title: "那些年 (Live)" }, index), null);
  assert.equal(resolveBundledLrc({ artist: "Taylor Swift Tribute Band", title: "Love Story" }, index), null);
  assert.equal(resolveBundledLrc({ artist: "胡夏", title: "那些年 Remix" }, index), null);
});

test("malformed manifests, duplicate normalized keys, and unsafe paths fail safely", () => {
  assert.equal(buildBundledLyricsIndex({}), null);
  assert.equal(buildBundledLyricsIndex({ tracks: { "A|Song": "../song.lrc" } }), null);
  assert.equal(buildBundledLyricsIndex({ tracks: { "A|Song": "https://example.test/song.lrc" } }), null);
  assert.equal(buildBundledLyricsIndex({ tracks: { "A|Song": "a.lrc", " a | song ": "b.lrc" } }), null);
});

test("authored manifest references independent public LRC assets", async () => {
  const root = join(process.cwd(), "public", "lrc");
  const manifest = JSON.parse(await readFile(join(root, "manifest.json"), "utf8")) as BundledLyricsManifest;
  assert.ok(manifest.tracks);
  for (const file of Object.values(manifest.tracks)) assert.equal(existsSync(join(root, file)), true, file);
});

test("build copies the authored manifest and LRC independently of generated JavaScript", async () => {
  const sourceManifest = await readFile(join(process.cwd(), "public", "lrc", "manifest.json"), "utf8");
  const builtManifest = await readFile(join(process.cwd(), "dist", "lrc", "manifest.json"), "utf8");
  assert.equal(builtManifest, sourceManifest);
  const manifest = JSON.parse(sourceManifest) as BundledLyricsManifest;
  const firstPath = Object.values(manifest.tracks)[0];
  const sourceLrc = await readFile(join(process.cwd(), "public", "lrc", firstPath), "utf8");
  const builtLrc = await readFile(join(process.cwd(), "dist", "lrc", firstPath), "utf8");
  assert.equal(builtLrc, sourceLrc);
  assert.equal(existsSync(join(process.cwd(), "dist", "lrc", firstPath)), true);
  const generatedFiles = await readdir(join(process.cwd(), "dist"), { recursive: true });
  const generatedJs = await Promise.all(generatedFiles.filter((file) => file.endsWith(".js")).map((file) => readFile(join(process.cwd(), "dist", file), "utf8")));
  const lyricBody = sourceLrc.split(/\r?\n/).find((line) => line.includes("]")) ?? "";
  assert.equal(generatedJs.some((source) => source.includes(lyricBody)), false);
});

test("loader caches the manifest and selected parsed LRCs without bulk fetching", async () => {
  const requests: string[] = [];
  const loader = new BundledLyricsLoader({
    fetch: async (input) => {
      const url = String(input);
      requests.push(url);
      if (url === "/lrc/manifest.json") {
        return new Response(JSON.stringify({ tracks: { "Artist A|Song A": "a.lrc", "Artist B|Song B": "b.lrc" } }));
      }
      return new Response("[00:01]line");
    }
  });

  assert.deepEqual((await loader.load({ artist: "Artist A", title: "Song A" }))?.lines, [{ time: 1, text: "line" }]);
  assert.deepEqual(requests, ["/lrc/manifest.json", "/lrc/a.lrc"]);
  assert.deepEqual((await loader.load({ artist: "Artist A", title: "Song A" }))?.lines, [{ time: 1, text: "line" }]);
  assert.deepEqual(requests, ["/lrc/manifest.json", "/lrc/a.lrc"]);
  assert.deepEqual((await loader.load({ artist: "Artist B", title: "Song B" }))?.lines, [{ time: 1, text: "line" }]);
  assert.deepEqual(requests, ["/lrc/manifest.json", "/lrc/a.lrc", "/lrc/b.lrc"]);
});

test("loader shares in-flight asset requests and returns safe no-lyrics results", async () => {
  const requests: string[] = [];
  let release: ((response: Response) => void) | undefined;
  const assetResponse = new Promise<Response>((resolve) => { release = resolve; });
  const loader = new BundledLyricsLoader({
    fetch: async (input) => {
      const url = String(input);
      requests.push(url);
      if (url === "/lrc/manifest.json") return new Response(JSON.stringify({ tracks: { "Artist|Song": "song.lrc" } }));
      return assetResponse;
    }
  });
  const first = loader.load({ artist: "Artist", title: "Song" });
  const second = loader.load({ artist: "Artist", title: "Song" });
  await Promise.resolve();
  release?.(new Response("[00:02]cached"));
  assert.deepEqual((await first)?.lines, [{ time: 2, text: "cached" }]);
  assert.deepEqual((await second)?.lines, [{ time: 2, text: "cached" }]);
  assert.deepEqual(requests, ["/lrc/manifest.json", "/lrc/song.lrc"]);

  const missing = new BundledLyricsLoader({ fetch: async () => new Response("missing", { status: 404 }) });
  assert.equal(await missing.load({ artist: "Unknown", title: "Song" }), null);
  const malformed = new BundledLyricsLoader({
    fetch: async (input) => String(input).endsWith("manifest.json")
      ? new Response(JSON.stringify({ tracks: { "Artist|Song": "song.lrc" } }))
      : new Response("not lyrics"),
    parseLrc: () => []
  });
  assert.equal(await malformed.load({ artist: "Artist", title: "Song" }), null);
});

test("Records integrates bundled lyrics through selection and incremental lyric refresh", async () => {
  const source = await readFile(join(process.cwd(), "src", "app.ts"), "utf8");
  assert.match(source, /BundledLyricsLoader/);
  assert.match(source, /bundledLyricsRuntime[\s\S]*identity/);
  assert.match(source, /private (?:async )?loadBundledLyricsForSelectedTrack/);
  assert.match(source, /void this\.loadBundledLyricsForSelectedTrack\(\)/);
  assert.match(source, /localLyricsForTrack\(track\)/);
  assert.match(source, /bundledLyricsRequestToken/);
  assert.match(source, /current\?\.id !== trackId/);
  assert.match(source, /identity !== .*trackIdentity/);
  assert.match(source, /refreshRecordsLyricsUI/);
  assert.match(source, /if \(this\.recordsPanelOpen\) this\.refreshRecordsLyricsUI[\s\S]*else this\.updatePersonalMusicOverlay/);
  assert.match(source, /if \(!lyrics\.length\)[\s\S]*empty-lyrics/);
  const batchEdit = source.slice(source.indexOf("private applyBatchRecordEdit"), source.indexOf("private async confirmBatchDelete"));
  assert.match(batchEdit, /invalidateBundledLyricsForTrack/);
  const showRecords = source.slice(source.indexOf("private async showRecords"), source.indexOf("private toggleRecordSelection"));
  assert.doesNotMatch(showRecords, /loadBundledLyricsForSelectedTrack/);
});
