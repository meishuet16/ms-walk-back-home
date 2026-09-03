import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const manifest = await readFile("android/app/src/main/AndroidManifest.xml", "utf8");
const syncSource = await readFile("apps/html-prototype/src/systems/SupabaseSync.ts", "utf8");
const cloudScript = await readFile("scripts/android-cloud-sync.mjs", "utf8");

assert.match(manifest, /android:scheme="com\.meishuet16\.walkbackhome"/);
assert.match(manifest, /android:host="auth"/);
assert.match(manifest, /android:path="\/callback"/);
assert.match(syncSource, /com\.meishuet16\.walkbackhome:\/\/auth\/callback/);
assert.match(syncSource, /skipBrowserRedirect/);
assert.match(syncSource, /setSession/);
assert.match(cloudScript, /service_role/);
assert.match(cloudScript, /sb_secret_/);

console.log("Android cloud auth configuration is internally consistent.");
