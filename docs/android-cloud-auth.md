# Android cloud auth

Walk Back Home remains local/offline-capable by default. An Android build can opt into the same Supabase account and sync path used by the hosted app.

## Local build configuration

1. Copy `.env.example` to `.env.android.local`.
2. Fill `SUPABASE_URL` and `SUPABASE_ANON_KEY` with the project's public Supabase client values. A publishable key (`sb_publishable_...`) or legacy anon client JWT is appropriate. Never use a service-role/admin/`sb_secret_...` key.
3. Run `npm run android:sync:cloud` instead of `npm run android:sync`.
4. Run `npm run android:assets`, then build the APK from `android/` as usual.

`.env.android.local` is covered by the repository's `.env*` ignore rule and must stay uncommitted.

## Supabase dashboard redirect

Add this exact URI to Authentication → URL Configuration → Redirect URLs:

```text
com.meishuet16.walkbackhome://auth/callback
```

The hosted browser build continues to redirect to its normal web origin. Android requests the custom URI, opens Google OAuth in the device browser, receives the deep link in the Capacitor activity, and imports the returned Supabase session into the WebView.

Cloud authentication and sync require internet access. Authored game assets remain bundled locally and do not depend on Vercel at runtime.
