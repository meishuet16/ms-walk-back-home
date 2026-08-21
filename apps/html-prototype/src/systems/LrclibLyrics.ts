import type { SyncedLyricLine } from "../types.js";
import { normalizeLookupText } from "./BundledLyrics.js";
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

function hasExactMetadata(record: LrclibRecord, track: LrclibTrackInput): boolean {
  return hasCompatibleMetadata(record, track, true);
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
      const result = this.resultFromRecord(precise.body, track, false);
      if (result) {
        this.resultCache.set(key, result);
        return result;
      }
    }
    if (precise.malformed || (precise.status !== 404 && precise.status >= 400)) return null;
    if (this.now() < this.cooldownUntil) return null;

    const search = await this.request(`/api/search?${queryFor(track, false)}`);
    if (search.status === 429 || search.malformed || !Array.isArray(search.body)) return null;
    for (const candidate of search.body) {
      if (!candidate || typeof candidate !== "object" || !hasExactMetadata(candidate as LrclibRecord, track)) continue;
      const result = this.resultFromRecord(candidate, track, true);
      if (result) {
        this.resultCache.set(key, result);
        return result;
      }
    }
    return null;
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

  private resultFromRecord(raw: unknown, track: LrclibTrackInput, requireExactMetadata: boolean): LrclibLyricsResult | null {
    if (!raw || typeof raw !== "object") return null;
    const record = raw as LrclibRecord;
    if (requireExactMetadata ? !hasExactMetadata(record, track) : !hasCompatibleMetadata(record, track, false)) return null;
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
