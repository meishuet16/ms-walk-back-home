# Android auth panel refresh

The native callback imports and persists the Supabase session. The current account UI is hydrated on application startup, so after the first Android OAuth callback the account is guaranteed to be recognized on the next app startup. A follow-up may make the already-open Backup / Sync panel refresh immediately after callback; that UI polish is not required for session persistence or cloud sync correctness.
