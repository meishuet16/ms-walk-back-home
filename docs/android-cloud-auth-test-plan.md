# Android cloud auth device test

Use a debug APK built after `npm run android:sync:cloud`.

1. Launch while online and open Backup / Sync. Confirm **Sign in with Google** is visible.
2. Tap it. Confirm the Google/Supabase OAuth page opens in the device browser rather than inside the game WebView.
3. Complete Google sign-in. Confirm Android routes `com.meishuet16.walkbackhome://auth/callback` back to Walk Back Home.
4. If the account panel has not refreshed yet, restart the app once; startup hydration must recognize the persisted Supabase session and show the Google account.
5. Push cloud sync, change a small synced item on the hosted build, then pull on Android and confirm the change arrives.
6. Disable network and relaunch. Auth/cloud controls may be unavailable, but bundled authored content must still load normally.
