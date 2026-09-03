# Required Supabase dashboard setting

Android OAuth cannot complete until the Supabase project's Authentication URL Configuration allow-list contains:

```text
com.meishuet16.walkbackhome://auth/callback
```

This is an external project setting and is intentionally not stored as a repository secret or hard-coded server credential.
