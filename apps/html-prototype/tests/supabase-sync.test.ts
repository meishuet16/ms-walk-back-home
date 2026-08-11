import assert from "node:assert/strict";
import test from "node:test";
import { loadAppConfig } from "../src/systems/AppConfig.js";
import { SupabaseSync } from "../src/systems/SupabaseSync.js";

test("app config defaults to local mode without Supabase credentials", () => {
  const config = loadAppConfig();
  const sync = new SupabaseSync(config);

  assert.equal(config.authProvider, "local");
  assert.equal(sync.isConfigured(), false);
  assert.match(sync.statusLabel(), /not configured/i);
});

test("Supabase sync enables only when URL and anon key are present", () => {
  const sync = new SupabaseSync({
    authProvider: "supabase",
    supabaseUrl: "https://example.supabase.co",
    supabaseAnonKey: "anon",
    privateMediaBucket: "walk-private-media"
  });

  assert.equal(sync.isConfigured(), true);
  assert.match(sync.statusLabel(), /Google sign-in/i);
});
