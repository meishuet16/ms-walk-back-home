import assert from "node:assert/strict";
import test from "node:test";
import { ANDROID_AUTH_REDIRECT, sessionTokensFromAuthUrl } from "../src/systems/SupabaseSync.js";

test("Android auth redirect stays bound to the Walk Back Home package scheme", () => {
  assert.equal(ANDROID_AUTH_REDIRECT, "com.meishuet16.walkbackhome://auth/callback");
});

test("native Supabase callback extracts access and refresh tokens", () => {
  assert.deepEqual(
    sessionTokensFromAuthUrl("com.meishuet16.walkbackhome://auth/callback#access_token=access-123&refresh_token=refresh-456&expires_in=3600"),
    { access_token: "access-123", refresh_token: "refresh-456" }
  );
});

test("native auth callback rejects unrelated deep links and incomplete sessions", () => {
  assert.equal(sessionTokensFromAuthUrl("https://example.com/#access_token=a&refresh_token=b"), null);
  assert.equal(sessionTokensFromAuthUrl("com.meishuet16.walkbackhome://auth/callback#access_token=a"), null);
  assert.equal(sessionTokensFromAuthUrl("com.meishuet16.walkbackhome://other/callback#access_token=a&refresh_token=b"), null);
});
