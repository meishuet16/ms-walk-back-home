import assert from "node:assert/strict";
import test from "node:test";
import { loadAppConfig } from "../src/systems/AppConfig.js";
import { createDefaultRoomState } from "../src/systems/MujiRoom.js";
import { createDefaultPersonalPlayerState } from "../src/systems/PersonalMusic.js";
import { SupabaseSync } from "../src/systems/SupabaseSync.js";
import { makeDiaryEntry } from "../src/systems/DiaryImport.js";
import { makeJournalAudioMedia } from "../src/systems/JournalMedia.js";
import { authoredChapterDiaryEntries } from "../src/fixtures/authoredDiaryEntries.js";
import type { DiaryEntry } from "../src/types.js";

type CloudCall = {
  operation: "upsert" | "select" | "delete";
  table: string;
  column?: string;
  value?: unknown;
};

function resolvedQuery<T>(data: T | null = null): Promise<{ error: null; data: T | null }> {
  return Promise.resolve({ error: null, data });
}

function installRecordingSupabase(calls: CloudCall[], journeyState: unknown = null, diaryRows: unknown[] = []): void {
  const client = {
    auth: {
      getSession: async () => ({ error: null, data: { session: null } }),
      signInWithOAuth: async () => ({ error: null }),
      signOut: async () => ({ error: null })
    },
    from(table: string) {
      return {
        select(_columns: string) {
          return {
            is(column: string, value: unknown) {
              calls.push({ operation: "select", table, column, value });
              return resolvedQuery<unknown[]>(table === "diary_entries" ? diaryRows : []);
            },
            maybeSingle() {
              calls.push({ operation: "select", table });
              return resolvedQuery<unknown>(table === "journey_states" && journeyState ? { state: journeyState } : null);
            }
          };
        },
        upsert(value: unknown) {
          calls.push({ operation: "upsert", table, value });
          return resolvedQuery(null);
        },
        delete() {
          return {
            eq(column: string, value: unknown) {
              calls.push({ operation: "delete", table, column, value });
              return resolvedQuery(null);
            }
          };
        }
      };
    }
  };
  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: { supabase: { createClient: () => client } }
  });
}

function removeRecordingSupabase(): void {
  Reflect.deleteProperty(globalThis, "window");
}

function emptyCloudBundle() {
  const personalPlayer = createDefaultPersonalPlayerState();
  return {
    diaryLibrary: { version: 1 as const, savedAt: "now", entries: [] as DiaryEntry[], legacyArtifacts: [] },
    journey: {
      version: 1 as const,
      savedAt: "now",
      scene: "forest",
      player: { x: 0, y: 0 },
      visitedMemories: [],
      walkedThroughMemories: [],
      choices: [],
      tendencies: { acceptance: 0, avoidance: 0, closeness: 0, distance: 0, honesty: 0, concealment: 0, companionship: 0, intervention: 0 },
      readMemories: [],
      completedMemoryEvents: [],
      room: createDefaultRoomState(),
      personalPlayer,
      finalJourney: []
    },
    reflectionWall: { version: 1 as const, savedAt: "now", defaultStyleId: "paper-mix", migratedLegacyKeys: [], notes: [] }
  };
}

test("app config defaults to local mode without Supabase credentials", () => {
  const config = loadAppConfig();
  const sync = new SupabaseSync(config);

  assert.equal(config.authProvider, "local");
  assert.equal(sync.isConfigured(), false);
  assert.match(sync.statusLabel(), /not connected/i);
  assert.match(sync.statusLabel(), /Portable backup remains available/i);
});

test("Supabase sync enables only when URL and anon key are present", () => {
  const sync = new SupabaseSync({
    authProvider: "supabase",
    supabaseUrl: "https://example.supabase.co",
    supabaseAnonKey: "anon",
    privateMediaBucket: "walk-private-media"
  });

  assert.equal(sync.isConfigured(), true);
  assert.match(sync.statusLabel(), /Diary and journey sync/i);
  assert.match(sync.statusLabel(), /Records stay on this device/i);
});

test("cloud push purges legacy music metadata without uploading local Records", async () => {
  const calls: CloudCall[] = [];
  installRecordingSupabase(calls);
  try {
    const sync = new SupabaseSync({
      authProvider: "supabase",
      supabaseUrl: "https://example.supabase.co",
      supabaseAnonKey: "anon",
      privateMediaBucket: "walk-private-media"
    });
    await sync.push("user-1", emptyCloudBundle());
    assert.deepEqual(calls.filter((call) => call.table === "music_tracks"), [
      { operation: "delete", table: "music_tracks", column: "user_id", value: "user-1" }
    ]);
    const journeyCall = calls.find((call) => call.operation === "upsert" && call.table === "journey_states");
    const cloudJourney = (journeyCall?.value as { state?: unknown } | undefined)?.state;
    assert.equal(Object.prototype.hasOwnProperty.call(cloudJourney ?? {}, "personalPlayer"), false);
  } finally {
    removeRecordingSupabase();
  }
});

test("cloud pull never reads local Records metadata", async () => {
  const calls: CloudCall[] = [];
  installRecordingSupabase(calls);
  try {
    const sync = new SupabaseSync({
      authProvider: "supabase",
      supabaseUrl: "https://example.supabase.co",
      supabaseAnonKey: "anon",
      privateMediaBucket: "walk-private-media"
    });
    await sync.pull();
    assert.equal(calls.some((call) => call.table === "music_tracks"), false);
  } finally {
    removeRecordingSupabase();
  }
});

test("cloud pull strips legacy personal player state before applying a journey", async () => {
  const calls: CloudCall[] = [];
  const legacyPlayer = createDefaultPersonalPlayerState();
  installRecordingSupabase(calls, {
    scene: "forest",
    player: { x: 0, y: 0 },
    visitedMemories: [],
    walkedThroughMemories: [],
    choices: [],
    tendencies: { acceptance: 0, avoidance: 0, closeness: 0, distance: 0, honesty: 0, concealment: 0, companionship: 0, intervention: 0 },
    readMemories: [],
    room: createDefaultRoomState(),
    personalPlayer: legacyPlayer,
    finalJourney: []
  });
  try {
    const sync = new SupabaseSync({
      authProvider: "supabase",
      supabaseUrl: "https://example.supabase.co",
      supabaseAnonKey: "anon",
      privateMediaBucket: "walk-private-media"
    });
    const bundle = await sync.pull();
    assert.equal(Object.prototype.hasOwnProperty.call(bundle.journey ?? {}, "personalPlayer"), false);
  } finally {
    removeRecordingSupabase();
  }
});

test("cloud push strips audio binary while preserving audio metadata and legacy visual sources", async () => {
  const calls: CloudCall[] = [];
  installRecordingSupabase(calls);
  try {
    const sync = new SupabaseSync({
      authProvider: "supabase",
      supabaseUrl: "https://example.supabase.co",
      supabaseAnonKey: "anon",
      privateMediaBucket: "walk-private-media"
    });
    const audio = { ...makeJournalAudioMedia({ id: "audio-1", storageKey: "journal-media/e/audio-1", mimeType: "audio/webm", duration: 2 }), src: "data:audio/webm;base64,RAW" } as unknown as ReturnType<typeof makeJournalAudioMedia>;
    const entry = { ...makeDiaryEntry("2026-08-21", "Voice", "Fixture."), media: [audio, { id: "video-1", type: "video" as const, src: "data:video/mp4;base64,legacy", mimeType: "video/mp4" }] };
    const bundle = emptyCloudBundle();
    bundle.diaryLibrary.entries = [entry];

    await sync.push("user-1", bundle);

    const diaryCall = calls.find((call) => call.operation === "upsert" && call.table === "diary_entries");
    const cloudEntry = ((diaryCall?.value as Array<{ entry: typeof entry }> | undefined)?.[0]?.entry);
    assert.equal("src" in ((cloudEntry?.media ?? [])[0] ?? {}), false);
    assert.equal((cloudEntry?.media ?? [])[0]?.storageKey, "journal-media/e/audio-1");
    assert.equal((cloudEntry?.media ?? [])[1]?.src, "data:video/mp4;base64,legacy");
  } finally {
    removeRecordingSupabase();
  }
});

test("cloud push persists personal diaries but never uploads canonical authored diaries", async () => {
  const calls: CloudCall[] = [];
  installRecordingSupabase(calls);
  try {
    const sync = new SupabaseSync({
      authProvider: "supabase",
      supabaseUrl: "https://example.supabase.co",
      supabaseAnonKey: "anon",
      privateMediaBucket: "walk-private-media"
    });
    const bundle = emptyCloudBundle();
    bundle.diaryLibrary.entries = [authoredChapterDiaryEntries[0], makeDiaryEntry("2026-08-22", "Personal", "Player note.")];

    await sync.push("user-1", bundle);

    const diaryCall = calls.find((call) => call.operation === "upsert" && call.table === "diary_entries");
    const uploaded = (diaryCall?.value as Array<{ id: string }> | undefined) ?? [];
    assert.deepEqual(uploaded.map((row) => row.id), ["diary-2026-08-22-personal"]);
  } finally {
    removeRecordingSupabase();
  }
});

test("cloud pull rehydrates current authored fixture content over stale cloud copies", async () => {
  const calls: CloudCall[] = [];
  const fixture = authoredChapterDiaryEntries[0];
  installRecordingSupabase(calls, null, [{ id: fixture.id, entry: { ...fixture, source: "personal", body: "OLD CLOUD COPY" } }]);
  try {
    const sync = new SupabaseSync({
      authProvider: "supabase",
      supabaseUrl: "https://example.supabase.co",
      supabaseAnonKey: "anon",
      privateMediaBucket: "walk-private-media"
    });
    const bundle = await sync.pull();

    assert.equal(bundle.diaryLibrary?.entries.find((entry) => entry.id === fixture.id)?.body, fixture.body);
    assert.equal(bundle.diaryLibrary?.entries.filter((entry) => entry.id === fixture.id).length, 1);
  } finally {
    removeRecordingSupabase();
  }
});

test("cloud pull preserves audio metadata when its local blob is unavailable", async () => {
  const calls: CloudCall[] = [];
  const entry = { ...makeDiaryEntry("2026-08-21", "Voice", "Fixture."), media: [makeJournalAudioMedia({ id: "audio-1", storageKey: "journal-media/e/audio-1", mimeType: "audio/mp4", duration: 4 })] };
  installRecordingSupabase(calls, null, [{ id: entry.id, entry }]);
  try {
    const sync = new SupabaseSync({
      authProvider: "supabase",
      supabaseUrl: "https://example.supabase.co",
      supabaseAnonKey: "anon",
      privateMediaBucket: "walk-private-media"
    });

    const bundle = await sync.pull();

    assert.equal(bundle.diaryLibrary?.entries[0]?.media?.[0]?.type, "audio");
    assert.equal(bundle.diaryLibrary?.entries[0]?.media?.[0]?.storageKey, "journal-media/e/audio-1");
  } finally {
    removeRecordingSupabase();
  }
});
