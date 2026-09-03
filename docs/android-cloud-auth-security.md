# Android cloud auth security boundary

The Android APK may contain the Supabase project URL and public anon/publishable client key because those values identify the public client and are not privileged server credentials. Database access must continue to rely on Supabase Auth plus row-level security.

Never package a service-role key, `sb_secret_...` key, admin token, Google client secret, or other privileged server credential. `scripts/android-cloud-sync.mjs` refuses known Supabase secret/service-role key formats before running the Android sync.

The custom Android callback is restricted to `com.meishuet16.walkbackhome://auth/callback`. The app only imports a session when both access and refresh tokens are present on that callback URI.
