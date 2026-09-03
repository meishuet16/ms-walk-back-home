import { App } from "@capacitor/app";
import { Capacitor, registerPlugin } from "@capacitor/core";
import type { AppConfig } from "./AppConfig.js";
import type { DiaryEntry, DiaryLibraryState, DiaryMedia, JourneyState, ReflectionWallState, RoomJourneyState } from "../types.js";
import { mergeCanonicalAndPersonalDiaries } from "./DiaryLibrary.js";
import { filterPersistableDiaryEntries } from "./DiaryOwnership.js";
import { stripLegacyJourneyProgress } from "./SaveManager.js";

export type CloudSyncBundle = {
  diaryLibrary: DiaryLibraryState;
  journey: JourneyState;
  reflectionWall: ReflectionWallState;
};

export type CloudUserSession = {
  userId: string;
  email?: string;
};

type DiaryRow = { id: string; entry: unknown; updated_at?: string };
type JourneyRow = { state: unknown; updated_at?: string };
type ReflectionRow = { id: string; note: unknown; updated_at?: string };
type RoomRow = { state: unknown; updated_at?: string };
type SupabaseUser = { id: string; email?: string };
type SupabaseQuery<T> = PromiseLike<{ error: unknown; data: T | null }>;
type SupabaseClient = {
  auth: {
    getSession(): Promise<{ error: unknown; data: { session?: { user: SupabaseUser } | null } }>;
    signInWithOAuth(input: { provider: "google"; options: { redirectTo: string; skipBrowserRedirect?: boolean } }): Promise<{ error: unknown; data?: { url?: string | null } | null }>;
    setSession(input: { access_token: string; refresh_token: string }): Promise<{ error: unknown }>;
    signOut(): Promise<{ error: unknown }>;
  };
  from(table: string): {
    select(columns: string): { is(column: string, value: unknown): SupabaseQuery<unknown[]>; maybeSingle(): SupabaseQuery<unknown> };
    upsert(value: unknown, options?: { onConflict?: string }): SupabaseQuery<unknown>;
    delete(): { eq(column: string, value: unknown): SupabaseQuery<unknown> };
  };
};

type ExternalBrowserPlugin = { open(input: { url: string }): Promise<void> };
const ExternalBrowser = registerPlugin<ExternalBrowserPlugin>("ExternalBrowser");
export const ANDROID_AUTH_REDIRECT = "com.meishuet16.walkbackhome://auth/callback";

function isNativeAndroid(): boolean {
  return Capacitor.isNativePlatform() && Capacitor.getPlatform() === "android";
}

export function sessionTokensFromAuthUrl(url: string): { access_token: string; refresh_token: string } | null {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return null;
  }
  if (parsed.protocol !== "com.meishuet16.walkbackhome:" || parsed.host !== "auth" || parsed.pathname !== "/callback") return null;
  const params = new URLSearchParams(parsed.hash.startsWith("#") ? parsed.hash.slice(1) : parsed.hash);
  const accessToken = params.get("access_token");
  const refreshToken = params.get("refresh_token");
  return accessToken && refreshToken ? { access_token: accessToken, refresh_token: refreshToken } : null;
}

function sanitizeDiaryEntryForCloud(entry: DiaryEntry): DiaryEntry {
  if (!entry.media?.some((media) => media.type === "audio")) return entry;
  return {
    ...entry,
    media: entry.media.map((media) => {
      if (media.type !== "audio") return media;
      const { src: _localAudioSource, ...audioMetadata } = media as DiaryMedia & { src?: string };
      return audioMetadata as DiaryMedia;
    })
  };
}

declare global {
  interface Window {
    supabase?: {
      createClient(url: string, anonKey: string, options: unknown): SupabaseClient;
    };
  }
}

export class SupabaseSync {
  private client: SupabaseClient | null = null;
  private loadClientPromise: Promise<SupabaseClient | null> | null = null;

  constructor(private config: AppConfig) {
    if (isNativeAndroid()) {
      void App.addListener("appUrlOpen", ({ url }) => {
        void this.acceptNativeAuthCallback(url).catch((error) => console.error("Supabase OAuth callback failed", error));
      });
    }
  }

  isConfigured(): boolean {
    return this.config.authProvider === "supabase" && Boolean(this.config.supabaseUrl && this.config.supabaseAnonKey);
  }

  statusLabel(): string {
    if (!this.isConfigured()) return "Cloud sync is not connected in this local build. Portable backup remains available.";
    return "Supabase is configured. Diary and journey sync are available; imported Records stay on this device.";
  }

  async currentSession(): Promise<CloudUserSession | null> {
    const client = await this.getClient();
    if (!client) return null;
    const { data, error } = await client.auth.getSession();
    if (error) throw error;
    const user = data.session?.user;
    return user ? this.toSession(user) : null;
  }

  async signInWithGoogle(): Promise<void> {
    const client = await this.requireClient();
    const nativeAndroid = isNativeAndroid();
    const { data, error } = await client.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: nativeAndroid ? ANDROID_AUTH_REDIRECT : window.location.origin,
        ...(nativeAndroid ? { skipBrowserRedirect: true } : {})
      }
    });
    if (error) throw error;
    if (nativeAndroid) {
      if (!data?.url) throw new Error("Supabase did not return an OAuth URL.");
      await ExternalBrowser.open({ url: data.url });
    }
  }

  async acceptNativeAuthCallback(url: string): Promise<boolean> {
    const tokens = sessionTokensFromAuthUrl(url);
    if (!tokens) return false;
    const client = await this.requireClient();
    const { error } = await client.auth.setSession(tokens);
    if (error) throw error;
    window.dispatchEvent(new CustomEvent("walk-back-home:cloud-authenticated"));
    return true;
  }

  async signOut(): Promise<void> {
    const client = await this.getClient();
    if (!client) return;
    const { error } = await client.auth.signOut();
    if (error) throw error;
  }

  async push(userId: string, bundle: CloudSyncBundle): Promise<void> {
    const client = await this.requireClient();
    const now = new Date().toISOString();
    await this.throwOnError(client.from("diary_entries").upsert(
      filterPersistableDiaryEntries(bundle.diaryLibrary.entries).map((entry) => ({ user_id: userId, id: entry.id, entry: sanitizeDiaryEntryForCloud(entry), updated_at: now, deleted_at: null })),
      { onConflict: "user_id,id" }
    ));
    const { personalPlayer: _localPersonalPlayer, ...cloudJourney } = stripLegacyJourneyProgress(bundle.journey);
    await this.throwOnError(client.from("journey_states").upsert({ user_id: userId, state: cloudJourney, updated_at: now }));
    await this.throwOnError(client.from("reflection_notes").upsert(
      bundle.reflectionWall.notes.map((note) => ({ user_id: userId, id: note.id, note, updated_at: now, deleted_at: null })),
      { onConflict: "user_id,id" }
    ));
    await this.throwOnError(client.from("muji_room_states").upsert({ user_id: userId, state: bundle.journey.room, updated_at: now }));
    await this.throwOnError(client.from("music_tracks").delete().eq("user_id", userId));
  }

  async pull(): Promise<Partial<CloudSyncBundle>> {
    const client = await this.requireClient();
    const [diaryRows, journeyRow, reflectionRows, roomRow] = await Promise.all([
      this.select(client.from("diary_entries").select("id,entry,updated_at").is("deleted_at", null) as SupabaseQuery<DiaryRow[]>),
      this.select(client.from("journey_states").select("state,updated_at").maybeSingle() as SupabaseQuery<JourneyRow | null>),
      this.select(client.from("reflection_notes").select("id,note,updated_at").is("deleted_at", null) as SupabaseQuery<ReflectionRow[]>),
      this.select(client.from("muji_room_states").select("state,updated_at").maybeSingle() as SupabaseQuery<RoomRow | null>)
    ]);
    const savedAt = new Date().toISOString();
    const rawJourney = journeyRow?.state as JourneyState | undefined;
    const journey = rawJourney
      ? (({ personalPlayer: _localPersonalPlayer, ...cloudJourney }) => stripLegacyJourneyProgress(cloudJourney as JourneyState))(rawJourney)
      : undefined;
    if (journey && roomRow?.state) journey.room = stripLegacyJourneyProgress({ ...journey, room: roomRow.state as RoomJourneyState }).room;
    return {
      diaryLibrary: (diaryRows ?? []).length ? { version: 1, savedAt, entries: mergeCanonicalAndPersonalDiaries((diaryRows ?? []).map((row) => row.entry) as DiaryLibraryState["entries"]), legacyArtifacts: [] } : undefined,
      journey,
      reflectionWall: (reflectionRows ?? []).length ? { version: 1, savedAt, defaultStyleId: "paper-mix", migratedLegacyKeys: [], notes: (reflectionRows ?? []).map((row) => row.note) as ReflectionWallState["notes"] } : undefined
    };
  }

  private async getClient(): Promise<SupabaseClient | null> {
    if (!this.isConfigured()) return null;
    this.loadClientPromise ??= this.loadSupabaseClient();
    return this.loadClientPromise;
  }

  private async requireClient(): Promise<SupabaseClient> {
    const client = await this.getClient();
    if (!client) throw new Error("Supabase is not configured.");
    return client;
  }

  private async loadSupabaseClient(): Promise<SupabaseClient | null> {
    if (this.client) return this.client;
    if (!window.supabase) await this.loadSupabaseScript();
    if (!window.supabase) throw new Error("Supabase client failed to load.");
    this.client = window.supabase.createClient(this.config.supabaseUrl, this.config.supabaseAnonKey, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: !isNativeAndroid() }
    });
    return this.client;
  }

  private loadSupabaseScript(): Promise<void> {
    return new Promise((resolve, reject) => {
      const existing = document.querySelector<HTMLScriptElement>('script[data-walk-supabase-client="true"]');
      if (existing) {
        if (window.supabase) {
          resolve();
          return;
        }
        existing.addEventListener("load", () => resolve(), { once: true });
        existing.addEventListener("error", () => reject(new Error("Supabase client failed to load.")), { once: true });
        return;
      }
      const script = document.createElement("script");
      script.src = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2";
      script.async = true;
      script.dataset.walkSupabaseClient = "true";
      script.addEventListener("load", () => resolve(), { once: true });
      script.addEventListener("error", () => reject(new Error("Supabase client failed to load.")), { once: true });
      document.head.append(script);
    });
  }

  private toSession(user: SupabaseUser): CloudUserSession {
    return { userId: user.id, email: user.email };
  }

  private async throwOnError<T>(query: SupabaseQuery<T>): Promise<T | null> {
    const { error, data } = await query;
    if (error) throw error instanceof Error ? error : new Error(String(error));
    return data;
  }

  private async select<T>(query: SupabaseQuery<T>): Promise<T | null> {
    return this.throwOnError(query);
  }
}
