import { createClient, type SupabaseClient, type User } from "@supabase/supabase-js";
import type { AppConfig } from "./AppConfig.js";
import type { DiaryLibraryState, JourneyState, PersonalMusicLibraryState, PersonalPlayerState, ReflectionWallState, RoomJourneyState } from "../types.js";

export type CloudSyncBundle = {
  diaryLibrary: DiaryLibraryState;
  journey: JourneyState;
  reflectionWall: ReflectionWallState;
  musicLibrary: PersonalMusicLibraryState;
  personalPlayer: PersonalPlayerState;
};

export type CloudUserSession = {
  userId: string;
  email?: string;
};

type DiaryRow = { id: string; entry: unknown; updated_at?: string };
type JourneyRow = { state: unknown; updated_at?: string };
type ReflectionRow = { id: string; note: unknown; updated_at?: string };
type RoomRow = { state: unknown; updated_at?: string };
type MusicRow = { id: string; metadata: unknown; updated_at?: string };

export class SupabaseSync {
  private client: SupabaseClient | null = null;

  constructor(private config: AppConfig) {}

  isConfigured(): boolean {
    return this.config.authProvider === "supabase" && Boolean(this.config.supabaseUrl && this.config.supabaseAnonKey);
  }

  statusLabel(): string {
    if (!this.isConfigured()) return "Supabase is not configured. Portable backup remains local-first.";
    return "Supabase is configured. Google sign-in and private sync are available.";
  }

  async currentSession(): Promise<CloudUserSession | null> {
    const client = this.getClient();
    if (!client) return null;
    const { data, error } = await client.auth.getSession();
    if (error) throw error;
    const user = data.session?.user;
    return user ? this.toSession(user) : null;
  }

  async signInWithGoogle(): Promise<void> {
    const client = this.requireClient();
    const { error } = await client.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin }
    });
    if (error) throw error;
  }

  async signOut(): Promise<void> {
    const client = this.getClient();
    if (!client) return;
    const { error } = await client.auth.signOut();
    if (error) throw error;
  }

  async push(userId: string, bundle: CloudSyncBundle): Promise<void> {
    const client = this.requireClient();
    const now = new Date().toISOString();
    await this.throwOnError(client.from("diary_entries").upsert(
      bundle.diaryLibrary.entries.map((entry) => ({ user_id: userId, id: entry.id, entry, updated_at: now, deleted_at: null })),
      { onConflict: "user_id,id" }
    ));
    await this.throwOnError(client.from("journey_states").upsert({ user_id: userId, state: bundle.journey, updated_at: now }));
    await this.throwOnError(client.from("reflection_notes").upsert(
      bundle.reflectionWall.notes.map((note) => ({ user_id: userId, id: note.id, note, updated_at: now, deleted_at: null })),
      { onConflict: "user_id,id" }
    ));
    await this.throwOnError(client.from("muji_room_states").upsert({ user_id: userId, state: bundle.journey.room, updated_at: now }));
    await this.throwOnError(client.from("music_tracks").upsert(
      bundle.musicLibrary.tracks.map((track) => ({ user_id: userId, id: track.id, metadata: track, updated_at: now, deleted_at: null })),
      { onConflict: "user_id,id" }
    ));
  }

  async pull(): Promise<Partial<CloudSyncBundle>> {
    const client = this.requireClient();
    const [diaryRows, journeyRow, reflectionRows, roomRow, musicRows] = await Promise.all([
      this.select<DiaryRow[]>(client.from("diary_entries").select("id,entry,updated_at").is("deleted_at", null)),
      this.select<JourneyRow | null>(client.from("journey_states").select("state,updated_at").maybeSingle()),
      this.select<ReflectionRow[]>(client.from("reflection_notes").select("id,note,updated_at").is("deleted_at", null)),
      this.select<RoomRow | null>(client.from("muji_room_states").select("state,updated_at").maybeSingle()),
      this.select<MusicRow[]>(client.from("music_tracks").select("id,metadata,updated_at").is("deleted_at", null))
    ]);
    const savedAt = new Date().toISOString();
    const journey = journeyRow?.state as JourneyState | undefined;
    if (journey && roomRow?.state) journey.room = roomRow.state as RoomJourneyState;
    return {
      diaryLibrary: (diaryRows ?? []).length ? { version: 1, savedAt, entries: (diaryRows ?? []).map((row) => row.entry) as DiaryLibraryState["entries"], legacyArtifacts: [] } : undefined,
      journey,
      reflectionWall: (reflectionRows ?? []).length ? { version: 1, savedAt, defaultStyleId: "paper-mix", migratedLegacyKeys: [], notes: (reflectionRows ?? []).map((row) => row.note) as ReflectionWallState["notes"] } : undefined,
      musicLibrary: (musicRows ?? []).length ? { version: 1, savedAt, tracks: (musicRows ?? []).map((row) => row.metadata) as PersonalMusicLibraryState["tracks"] } : undefined,
      personalPlayer: journey?.personalPlayer
    };
  }

  private getClient(): SupabaseClient | null {
    if (!this.isConfigured()) return null;
    this.client ??= createClient(this.config.supabaseUrl, this.config.supabaseAnonKey, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
    });
    return this.client;
  }

  private requireClient(): SupabaseClient {
    const client = this.getClient();
    if (!client) throw new Error("Supabase is not configured.");
    return client;
  }

  private toSession(user: User): CloudUserSession {
    return { userId: user.id, email: user.email };
  }

  private async throwOnError<T>(query: PromiseLike<{ error: unknown; data: T | null }>): Promise<T | null> {
    const { error, data } = await query;
    if (error) throw error instanceof Error ? error : new Error(String(error));
    return data;
  }

  private async select<T>(query: PromiseLike<{ error: unknown; data: T | null }>): Promise<T | null> {
    return this.throwOnError(query);
  }
}
