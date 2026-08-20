# Local Records and Cloud Sync Design

## Goal

Keep personal Records local to each device while removing legacy music metadata from Supabase. Only audio files already shipped in `public/assets/audio` remain cross-device because they are GitHub/static assets.

## Approved behavior

- `musicLibrary` is removed from the Supabase cloud sync bundle.
- Cloud push never upserts or reads `music_tracks`.
- Cloud push idempotently deletes the signed-in user's legacy `music_tracks` rows on each push, using the existing row-level security policy.
- Cloud push strips the local `personalPlayer` object from the journey state, and cloud pull never overwrites the local Records player.
- User-imported audio and cover blobs remain in local IndexedDB and continue to work on the device where they were added.
- Download/restore backup behavior remains unchanged; it is the explicit local transfer path for user-imported blobs.
- Built-in audio under `public/assets/audio` remains unchanged and is discovered from the generated audio manifest.
- LRC-only cross-device sync is deferred; lyrics remain part of the local track metadata for this change.

## Scope boundary

No Supabase Storage upload, no new lyrics table, no deletion of public GitHub audio assets, and no broad cloud schema refactor. The existing `music_tracks` table definition remains only so already-deployed databases can be cleaned safely by the authenticated user's next cloud push.

## Verification

Tests must prove that cloud push performs the legacy `music_tracks` delete but no music upsert, strips `personalPlayer`, cloud pull does not query music tracks, and local built-in/user music behavior remains intact.
