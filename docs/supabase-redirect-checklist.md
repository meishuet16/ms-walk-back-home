# Supabase redirect validation checklist

Before merging Android cloud auth:

- Supabase Authentication → URL Configuration contains `com.meishuet16.walkbackhome://auth/callback`.
- `.env.android.local` contains only the public project URL/client key and remains untracked.
- `npm run android:sync:cloud` succeeds.
- `npm run android:assets` succeeds.
- A clean Android debug build succeeds.
- On a physical Android device: Google sign-in opens outside the WebView, returns to Walk Back Home, and the account is recognized after the app resumes/restarts.
- Cloud push/pull succeeds for diary, journey, and reflection wall.
- Imported Records audio/covers remain device-local.
