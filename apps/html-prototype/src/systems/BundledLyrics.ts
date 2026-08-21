import type { SyncedLyricLine } from "../types.js";
import { parseLrc } from "./PersonalMusic.js";

export type BundledLyricsTrack = {
  artist?: string;
  title: string;
};

export type BundledLyricsMatchType = "exact" | "chinese-normalized" | "alias" | "unique-title";

export type BundledLyricsResolution = {
  canonicalKey: string;
  lrcPath: string;
  matchType: BundledLyricsMatchType;
};

export type BundledLyricsManifest = {
  tracks: Record<string, string>;
  aliases?: Record<string, string>;
};

type BundledLyricsEntry = {
  canonicalKey: string;
  lrcPath: string;
  artist: string;
  title: string;
};

export type BundledLyricsIndex = {
  canonical: Map<string, BundledLyricsEntry>;
  tracks: Map<string, BundledLyricsEntry>;
  chineseTracks: Map<string, string | null>;
  aliases: Map<string, string | null>;
  chineseAliases: Map<string, string | null>;
  titleIndex: Map<string, string[]>;
};

const conservativeTraditionalMap: Record<string, string> = {
  劉: "刘",
  後: "后",
  張: "张",
  學: "学",
  來: "来",
  聽: "听",
  演: "演",
  唱: "唱",
  會: "会",
  她: "她",
  們: "们",
  終: "终",
  於: "于",
  錯: "错",
  過: "过",
  愛: "爱",
  擁: "拥",
  抱: "抱",
  陳: "陈",
  羅: "罗",
  轉: "转",
  燈: "灯",
  偉: "伟",
  機: "机",
  樓: "楼",
  這: "这",
  說: "说",
  將: "将",
  與: "与",
  還: "还",
  為: "为",
  樂: "乐",
  書: "书",
  開: "开",
  關: "关",
  頭: "头",
  夢: "梦",
  風: "风",
  氣: "气",
  間: "间",
  時: "时",
  長: "长",
  見: "见",
  對: "对",
  從: "从",
  讓: "让",
  給: "给",
  發: "发",
  遠: "远",
  點: "点",
  線: "线",
  無: "无",
  詞: "词",
  顏: "颜",
  麼: "么",
  嗎: "吗",
  體: "体",
  親: "亲",
  告: "告",
  訴: "诉",
  國: "国",
  原: "原",
  音: "音"
};

function replaceConservativePunctuation(value: string): string {
  return value
    .replace(/[“”]/gu, '"')
    .replace(/[‘’]/gu, "'")
    .replace(/[‐‑‒–—―]/gu, "-");
}

function mapTraditionalCharacters(value: string): string {
  return [...value].map((character) => conservativeTraditionalMap[character] ?? character).join("");
}

export function normalizeLookupText(value: string): string {
  return replaceConservativePunctuation(value.normalize("NFKC"))
    .trim()
    .replace(/\s+/gu, " ")
    .toLowerCase();
}

export function normalizeChineseLookupText(value: string): string {
  return mapTraditionalCharacters(normalizeLookupText(value));
}

export function trackIdentity(artist: string | undefined, title: string): string {
  return `${normalizeLookupText(artist ?? "")}|${normalizeLookupText(title)}`;
}

function chineseTrackIdentity(artist: string | undefined, title: string): string {
  return `${normalizeChineseLookupText(artist ?? "")}|${normalizeChineseLookupText(title)}`;
}

function splitCanonicalKey(value: string): { artist: string; title: string } | null {
  const separator = value.indexOf("|");
  if (separator <= 0 || separator === value.length - 1 || value.indexOf("|", separator + 1) !== -1) return null;
  const artist = value.slice(0, separator).trim();
  const title = value.slice(separator + 1).trim();
  return artist && title ? { artist, title } : null;
}

function safeLrcPath(value: unknown): value is string {
  if (typeof value !== "string" || !value || value.trim() !== value || !/\.lrc$/iu.test(value)) return false;
  if (value.includes("\\") || value.startsWith("/") || value.startsWith("//") || /^[a-z][a-z\d+.-]*:/iu.test(value)) return false;
  let decoded: string;
  try {
    decoded = decodeURIComponent(value);
  } catch {
    return false;
  }
  if (decoded.includes("\\") || decoded.startsWith("/") || /^[a-z][a-z\d+.-]*:/iu.test(decoded)) return false;
  return decoded.split("/").every((segment) => segment !== ".." && segment !== "." && segment !== "");
}

function addAmbiguousValue(map: Map<string, string | null>, key: string, value: string): void {
  const previous = map.get(key);
  if (previous === undefined) map.set(key, value);
  else if (previous !== value) map.set(key, null);
}

function addAlias(map: Map<string, string | null>, key: string, target: string): void {
  const previous = map.get(key);
  if (previous === undefined) map.set(key, target);
  else if (previous !== target) map.set(key, null);
}

export function buildBundledLyricsIndex(manifest: unknown): BundledLyricsIndex | null {
  if (!manifest || typeof manifest !== "object" || Array.isArray(manifest)) return null;
  const rawTracks = (manifest as { tracks?: unknown }).tracks;
  const rawAliases = (manifest as { aliases?: unknown }).aliases;
  if (!rawTracks || typeof rawTracks !== "object" || Array.isArray(rawTracks)) return null;
  if (rawAliases !== undefined && (!rawAliases || typeof rawAliases !== "object" || Array.isArray(rawAliases))) return null;

  const canonical = new Map<string, BundledLyricsEntry>();
  const tracks = new Map<string, BundledLyricsEntry>();
  const chineseTracks = new Map<string, string | null>();
  const titleIndex = new Map<string, string[]>();

  for (const [canonicalKey, rawPath] of Object.entries(rawTracks)) {
    const identity = splitCanonicalKey(canonicalKey);
    if (!identity || !safeLrcPath(rawPath)) return null;
    const entry: BundledLyricsEntry = { canonicalKey, lrcPath: rawPath, artist: identity.artist, title: identity.title };
    const exactKey = trackIdentity(identity.artist, identity.title);
    if (tracks.has(exactKey)) return null;
    tracks.set(exactKey, entry);
    canonical.set(canonicalKey, entry);
    addAmbiguousValue(chineseTracks, chineseTrackIdentity(identity.artist, identity.title), canonicalKey);

    const titleKey = normalizeChineseLookupText(identity.title);
    titleIndex.set(titleKey, [...(titleIndex.get(titleKey) ?? []), canonicalKey]);
  }

  const aliases = new Map<string, string | null>();
  const chineseAliases = new Map<string, string | null>();
  for (const [aliasKey, target] of Object.entries((rawAliases ?? {}) as Record<string, unknown>)) {
    if (typeof target !== "string" || !canonical.has(target)) continue;
    const aliasIdentity = splitCanonicalKey(aliasKey);
    if (!aliasIdentity) continue;
    addAlias(aliases, trackIdentity(aliasIdentity.artist, aliasIdentity.title), target);
    addAlias(chineseAliases, chineseTrackIdentity(aliasIdentity.artist, aliasIdentity.title), target);
  }

  return { canonical, tracks, chineseTracks, aliases, chineseAliases, titleIndex };
}

function resolutionFor(entry: BundledLyricsEntry, matchType: BundledLyricsMatchType): BundledLyricsResolution {
  return { canonicalKey: entry.canonicalKey, lrcPath: entry.lrcPath, matchType };
}

function isBundledLyricsIndex(value: BundledLyricsIndex | BundledLyricsManifest): value is BundledLyricsIndex {
  return "canonical" in value && value.canonical instanceof Map;
}

export function resolveBundledLrc(track: BundledLyricsTrack, input: BundledLyricsIndex | BundledLyricsManifest): BundledLyricsResolution | null {
  const index = isBundledLyricsIndex(input) ? input : buildBundledLyricsIndex(input);
  if (!index) return null;
  const exact = index.tracks.get(trackIdentity(track.artist, track.title));
  if (exact) return resolutionFor(exact, "exact");

  const chineseKey = chineseTrackIdentity(track.artist, track.title);
  const chineseCanonicalKey = index.chineseTracks.get(chineseKey);
  if (chineseCanonicalKey) {
    const entry = index.canonical.get(chineseCanonicalKey);
    if (entry) return resolutionFor(entry, "chinese-normalized");
  }

  const aliasTarget = index.aliases.get(trackIdentity(track.artist, track.title)) ?? index.chineseAliases.get(chineseKey);
  if (aliasTarget) {
    const entry = index.canonical.get(aliasTarget);
    if (entry) return resolutionFor(entry, "alias");
  }

  const candidates = index.titleIndex.get(normalizeChineseLookupText(track.title)) ?? [];
  if (candidates.length !== 1) return null;
  const entry = index.canonical.get(candidates[0]);
  const currentArtist = normalizeLookupText(track.artist ?? "");
  const candidateArtist = normalizeLookupText(entry?.artist ?? "");
  if (entry && currentArtist && candidateArtist && (currentArtist.includes(candidateArtist) || candidateArtist.includes(currentArtist))) return null;
  return entry ? resolutionFor(entry, "unique-title") : null;
}

function lrcAssetUrl(path: string): string {
  return `/lrc/${path.split("/").map((segment) => encodeURIComponent(segment)).join("/")}`;
}

export class BundledLyricsLoader {
  private readonly manifestUrl: string;
  private readonly fetcher: typeof fetch;
  private readonly parse: (source: string) => SyncedLyricLine[];
  private manifestPromise: Promise<BundledLyricsIndex | null> | null = null;
  private readonly lyricCache = new Map<string, SyncedLyricLine[]>();
  private readonly inFlight = new Map<string, Promise<SyncedLyricLine[] | null>>();

  constructor(options: { manifestUrl?: string; fetch?: typeof fetch; parseLrc?: (source: string) => SyncedLyricLine[] } = {}) {
    this.manifestUrl = options.manifestUrl ?? "/lrc/manifest.json";
    this.fetcher = options.fetch ?? globalThis.fetch.bind(globalThis);
    this.parse = options.parseLrc ?? parseLrc;
  }

  private loadManifest(): Promise<BundledLyricsIndex | null> {
    if (!this.manifestPromise) {
      this.manifestPromise = (async () => {
        try {
          const response = await this.fetcher(this.manifestUrl);
          if (!response.ok) return null;
          return buildBundledLyricsIndex(await response.json());
        } catch {
          return null;
        }
      })();
    }
    return this.manifestPromise;
  }

  private fetchLyrics(path: string): Promise<SyncedLyricLine[] | null> {
    const cached = this.lyricCache.get(path);
    if (cached) return Promise.resolve(cached);
    const pending = this.inFlight.get(path);
    if (pending) return pending;
    const request = (async () => {
      try {
        const response = await this.fetcher(lrcAssetUrl(path));
        if (!response.ok) return null;
        const parsed = this.parse(await response.text());
        if (!parsed.length) return null;
        this.lyricCache.set(path, parsed);
        return parsed;
      } catch {
        return null;
      } finally {
        this.inFlight.delete(path);
      }
    })();
    this.inFlight.set(path, request);
    return request;
  }

  async load(track: BundledLyricsTrack): Promise<{ resolution: BundledLyricsResolution; lines: SyncedLyricLine[] } | null> {
    const index = await this.loadManifest();
    if (!index) return null;
    const resolution = resolveBundledLrc(track, index);
    if (!resolution) return null;
    const lines = await this.fetchLyrics(resolution.lrcPath);
    return lines ? { resolution, lines } : null;
  }
}
