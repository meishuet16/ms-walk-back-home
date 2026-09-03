# Android cloud auth acceptance

The change is ready to merge only after repository CI passes and a physical Android device validates the OAuth round trip with the real Supabase project. Repository checks can validate the callback contract and build wiring, but they cannot prove the external Google/Supabase redirect allow-list or real credentials are configured correctly.
