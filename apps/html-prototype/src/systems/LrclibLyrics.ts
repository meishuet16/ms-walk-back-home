import type { SyncedLyricLine } from "../types.js";
import { normalizeChineseLookupText, normalizeLookupText } from "./BundledLyrics.js";
import { parseLrc } from "./PersonalMusic.js";

export type LrclibTrackInput = {
  title: string;
  artist?: string;
  album?: string;
  duration?: number;
};

export type LrclibLyricsResult = {
  syncedLyrics: SyncedLyricLine[];
  plainLyrics?: string;
  trackName: string;
  artistName: string;
  albumName?: string;
  duration?: number;
  provider: "lrclib";
};

type LrclibRecord = {
  trackName?: unknown;
  artistName?: unknown;
  albumName?: unknown;
  duration?: unknown;
  syncedLyrics?: unknown;
  plainLyrics?: unknown;
};

type LrclibFetchResult = {
  status: number;
  body?: unknown;
  malformed?: boolean;
};

type LrclibProviderOptions = {
  baseUrl?: string;
  fetch?: typeof fetch;
  parseLrc?: (source: string) => SyncedLyricLine[];
  now?: () => number;
};

const defaultBaseUrl = "https://lrclib.net";
const retryAfterFallbackMs = 30_000;

function queryFor(track: LrclibTrackInput, includeAlbum = true): string {
  const params = new URLSearchParams({
    track_name: track.title,
    artist_name: track.artist ?? ""
  });
  if (includeAlbum && track.album?.trim()) params.set("album_name", track.album);
  if (Number.isFinite(track.duration) && (track.duration ?? 0) >= 1 && (track.duration ?? 0) <= 3600) {
    params.set("duration", String(track.duration));
  }
  return params.toString();
}

function normalizedDuration(value: number | undefined): string {
  return Number.isFinite(value) ? String(value) : "";
}

function lookupIdentity(track: LrclibTrackInput): string {
  return [normalizeLookupText(track.artist ?? ""), normalizeLookupText(track.title), normalizeLookupText(track.album ?? ""), normalizedDuration(track.duration)].join("|");
}

function numericDuration(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) && value > 0 ? value : undefined;
}

function stringValue(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value : undefined;
}

function normalizeSearchText(value: string): string {
  return normalizeChineseLookupText(value)
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim()
    .replace(/\s+/gu, " ");
}

function normalizeSearchTitle(value: string): string {
  let title = normalizeChineseLookupText(value).trim();
  for (let index = 0; index < 4; index += 1) {
    const withoutParenthesizedSuffix = title.replace(/\s*(?:\([^()]*\)|\[[^\[\]]*\])\s*$/u, "").trim();
    const withoutVersionSuffix = withoutParenthesizedSuffix
      .replace(/\s*(?:[-:–—]\s*)?(?:live|acoustic|remastered?|radio edit|single version|album version|official audio|ost|soundtrack)(?:\s+\d{4})?\s*$/iu, "")
      .trim();
    if (withoutVersionSuffix === title) break;
    title = withoutVersionSuffix;
  }
  title = title.replace(/\s+(?:feat\.?|ft\.?|featuring|with)\b.*$/iu, "");
  return normalizeSearchText(title);
}

function searchTitleTokens(value: string): Set<string> {
  return new Set(normalizeSearchTitle(value).split(" ").filter(Boolean));
}

function titleScore(trackTitle: string, candidateTitle: string): number {
  const requested = normalizeSearchTitle(trackTitle);
  const candidate = normalizeSearchTitle(candidateTitle);
  if (!requested || !candidate) return 0;
  if (requested === candidate) return 100;
  const requestedTokens = searchTitleTokens(requested);
  const candidateTokens = searchTitleTokens(candidate);
  const overlap = [...requestedTokens].filter((token) => candidateTokens.has(token)).length;
  const smallerTokenCount = Math.min(requestedTokens.size, candidateTokens.size);
  return overlap >= 2 && smallerTokenCount > 0 && overlap / smallerTokenCount >= 0.66 ? 60 : 0;
}

const artistNoiseTokens = new Set(["and", "artist", "audio", "band", "feat", "featuring", "ft", "music", "official", "ost", "the", "with"]);

function artistParts(value: string): string[] {
  return normalizeChineseLookupText(value)
    .split(/[,/&+;、|]|\s+(?:and|feat\.?|featuring|ft\.?|with)\s*/iu)
    .map((part) => normalizeSearchText(part))
    .filter(Boolean);
}

function artistTokens(value: string): Set<string> {
  return new Set(artistParts(value)
    .flatMap((part) => part.split(" "))
    .filter((token) => token.length > 1 && !artistNoiseTokens.has(token)));
}

function artistScore(requestedArtist: string | undefined, candidateArtist: string | undefined): number {
  if (!requestedArtist || !candidateArtist) return 0;
  const requestedParts = new Set(artistParts(requestedArtist));
  const candidateParts = new Set(artistParts(candidateArtist));
  if ([...requestedParts].some((part) => candidateParts.has(part))) return 40;
  const requestedTokens = artistTokens(requestedArtist);
  const candidateTokens = artistTokens(candidateArtist);
  return [...requestedTokens].some((token) => candidateTokens.has(token)) ? 25 : 0;
}

function durationScore(requestedDuration: number | undefined, candidateDuration: number | undefined): number {
  if (requestedDuration === undefined || candidateDuration === undefined) return 0;
  const difference = Math.abs(requestedDuration - candidateDuration);
  if (difference <= 2) return 20;
  if (difference <= 10) return 14;
  if (difference <= 30) return 8;
  if (difference <= 60) return 3;
  return 0;
}

function hasCompatibleMetadata(record: LrclibRecord, track: LrclibTrackInput, requireAll: boolean): boolean {
  const trackName = stringValue(record.trackName);
  const artistName = stringValue(record.artistName);
  if (requireAll && (!trackName || !artistName)) return false;
  if (trackName && normalizeLookupText(trackName) !== normalizeLookupText(track.title)) return false;
  if (artistName && normalizeLookupText(artistName) !== normalizeLookupText(track.artist ?? "")) return false;
  const requestedDuration = numericDuration(track.duration);
  if (requestedDuration !== undefined) {
    const candidateDuration = numericDuration(record.duration);
    if (candidateDuration === undefined) {
      if (requireAll) return false;
    } else if (Math.abs(candidateDuration - requestedDuration) > 2) return false;
  }
  return true;
}

type SearchCandidate = {
  result: LrclibLyricsResult;
  title: number;
  artist: number;
  duration: number;
  durationDifference: number;
  total: number;
};

function scoreSearchCandidate(record: LrclibRecord, track: LrclibTrackInput, result: LrclibLyricsResult): SearchCandidate | null {
  const candidateTitle = stringValue(record.trackName);
  if (!candidateTitle) return null;
  const title = titleScore(track.title, candidateTitle);
  if (!title) return null;
  const artist = artistScore(track.artist, stringValue(record.artistName));
  const requestedDuration = numericDuration(track.duration);
  const candidateDuration = numericDuration(record.duration);
  const duration = durationScore(requestedDuration, candidateDuration);
  const durationDifference = requestedDuration !== undefined && candidateDuration !== undefined
    ? Math.abs(requestedDuration - candidateDuration)
    : Number.POSITIVE_INFINITY;
  return { result, title, artist, duration, durationDifference, total: title * 10 + artist * 4 + duration };
}

function retryAfterMs(value: string | null, now: number): number {
  if (!value) return retryAfterFallbackMs;
  const seconds = Number(value);
  if (Number.isFinite(seconds) && seconds >= 0) return Math.max(1_000, seconds * 1_000);
  const date = Date.parse(value);
  return Number.isFinite(date) ? Math.max(1_000, date - now) : retryAfterFallbackMs;
}

export class LrclibLyricsProvider {
  private readonly baseUrl: string;
  private readonly fetcher: typeof fetch;
  private readonly parse: (source: string) => SyncedLyricLine[];
  private readonly now: () => number;
  private readonly resultCache = new Map<string, LrclibLyricsResult>();
  private readonly inFlight = new Map<string, Promise<LrclibLyricsResult | null>>();
  private cooldownUntil = 0;

  constructor(options: LrclibProviderOptions = {}) {
    this.baseUrl = (options.baseUrl ?? defaultBaseUrl).replace(/\/$/u, "");
    this.fetcher = options.fetch ?? globalThis.fetch.bind(globalThis);
    this.parse = options.parseLrc ?? parseLrc;
    this.now = options.now ?? (() => Date.now());
  }

  async resolve(track: LrclibTrackInput): Promise<LrclibLyricsResult | null> {
    const key = lookupIdentity(track);
    const cached = this.resultCache.get(key);
    if (cached) return cached;
    const pending = this.inFlight.get(key);
    if (pending) return pending;
    if (this.now() < this.cooldownUntil) return null;

    const request = this.resolveUncached(track, key);
    this.inFlight.set(key, request);
    try {
      return await request;
    } finally {
      this.inFlight.delete(key);
    }
  }

  private async resolveUncached(track: LrclibTrackInput, key: string): Promise<LrclibLyricsResult | null> {
    const precise = await this.request(`/api/get?${queryFor(track)}`);
    if (precise.status === 429) return null;
    if (precise.body && !precise.malformed) {
      const result = this.resultFromRecord(precise.body, track, "precise");
      if (result) {
        this.resultCache.set(key, result);
        return result;
      }
    }
    if (precise.malformed || (precise.status !== 404 && precise.status >= 400)) return null;
    if (this.now() < this.cooldownUntil) return null;

    const search = await this.request(`/api/search?${queryFor(track, false)}`);
    if (search.status === 429 || search.malformed || !Array.isArray(search.body)) return null;
    const scored: SearchCandidate[] = [];
    for (const candidate of search.body) {
      if (!candidate || typeof candidate !== "object") continue;
      const result = this.resultFromRecord(candidate, track, "search");
      if (!result) continue;
      const score = scoreSearchCandidate(candidate as LrclibRecord, track, result);
      if (score) scored.push(score);
    }
    const exactTitleCount = scored.filter((candidate) => candidate.title === 100).length;
    const eligible = scored.filter((candidate) => candidate.artist > 0 || (candidate.title === 100 && exactTitleCount === 1));
    eligible.sort((left, right) => right.total - left.total || left.durationDifference - right.durationDifference);
    const best = eligible[0];
    if (!best || eligible.slice(1).some((candidate) => candidate.total === best.total && candidate.durationDifference === best.durationDifference)) return null;
    this.resultCache.set(key, best.result);
    return best.result;
  }

  private async request(path: string): Promise<LrclibFetchResult> {
    if (this.now() < this.cooldownUntil) return { status: 429 };
    try {
      const response = await this.fetcher(`${this.baseUrl}${path}`, {
        headers: { "Lrclib-Client": "Walk Back Home HTML Prototype" }
      });
      if (response.status === 429) {
        this.cooldownUntil = this.now() + retryAfterMs(response.headers.get("Retry-After"), this.now());
        return { status: 429 };
      }
      if (!response.ok) return { status: response.status };
      try {
        return { status: response.status, body: await response.json() };
      } catch {
        return { status: response.status, malformed: true };
      }
    } catch {
      return { status: 0 };
    }
  }

  private resultFromRecord(raw: unknown, track: LrclibTrackInput, mode: "precise" | "search"): LrclibLyricsResult | null {
    if (!raw || typeof raw !== "object") return null;
    const record = raw as LrclibRecord;
    if (mode === "precise" && !hasCompatibleMetadata(record, track, false)) return null;
    const syncedSource = stringValue(record.syncedLyrics);
    if (!syncedSource) return null;
    let syncedLyrics: SyncedLyricLine[];
    try {
      syncedLyrics = this.parse(syncedSource);
    } catch {
      return null;
    }
    if (!syncedLyrics.length) return null;
    const trackName = stringValue(record.trackName) ?? track.title;
    const artistName = stringValue(record.artistName) ?? track.artist ?? "";
    const albumName = stringValue(record.albumName) ?? track.album;
    const duration = numericDuration(record.duration) ?? numericDuration(track.duration);
    const plainLyrics = typeof record.plainLyrics === "string" ? record.plainLyrics : undefined;
    return { syncedLyrics, plainLyrics, trackName, artistName, albumName, duration, provider: "lrclib" };
  }
}
