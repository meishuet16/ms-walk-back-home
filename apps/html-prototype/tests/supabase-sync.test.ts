import assert from "node:assert/strict";
import test from "node:test";
import { loadAppConfig } from "../src/systems/AppConfig.js";
import { createDefaultRoomState } from "../src/systems/MujiRoom.js";
import { createDefaultPersonalPlayerState } from "../src/systems/PersonalMusic.js";
import { SupabaseSync } from "../src/systems/SupabaseSync.js";

type CloudCall = {
  operation: "upsert" | "select" | "delete";
  table: string;
  column?: string;
  value?: unknown;
};

function resolvedQuery<T>(data: T | null = null): Promise<{ error: null; data: T | null }> {
  return Promise.resolve({ error: null, data });
}

function installRecordingSupabase(calls: CloudCall[], journeyState: unknown = null): void {
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
              return resolvedQuery<unknown[]>([]);
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
    diaryLibrary: { version: 1 as const, savedAt: "now", entries: [], legacyArtifacts: [] },
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
