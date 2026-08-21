# Backup / Sync Feedback Design

## Goal

Make the Backup / Sync modal readable and make cloud Sync and Pull actions visibly explain what is happening and what changed.

## Approved behavior

- The portable-backup explanation uses a dark, high-contrast color on the light modal background.
- When cloud push starts, its button changes to a progress label and is disabled until the request settles.
- When cloud pull starts, its button changes to a progress label and is disabled until the request settles.
- The Cloud / Cross-device Sync section contains a persistent status message with `role="status"` while an operation is running and after it completes.
- Successful push feedback names the cloud-synced state and confirms that imported Records audio and covers stayed local.
- Successful pull feedback names the state that was applied and confirms that imported Records audio and covers stayed local. Empty cloud results are reported clearly rather than implying that data was changed.
- Failed operations show the readable error message in the same status area and restore the action buttons.
- Existing toast notifications may remain as a secondary notification, but the modal status is the source of truth for the operation result.

## Scope and architecture

Keep the existing `SupabaseSync` API and local/cloud data boundary unchanged. Add a small view state to `WalkHomeApp` for the active Backup / Sync operation and its result. `showBackupSync()` renders the state, labels, disabled attributes, and status message. `pushCloudSync()` and `pullCloudSync()` set the running state before awaiting, set success or failure feedback after awaiting, and rerender the modal in both paths.

Pull feedback is derived from the existing optional bundle fields: report which of diary, journey, and reflection wall were returned and applied; if none are present, report that no cloud memory data was found. Both success messages explicitly state that local imported Records audio and covers were not changed.

## Error handling

- A second push or pull cannot start while either operation is running.
- A rejected request is caught through the existing `errorMessage()` helper.
- Busy state is cleared on both success and failure.
- Feedback is escaped before being inserted into the modal.

## Testing

Add regression assertions in the existing HTML prototype tests for:

- the high-contrast Backup / Sync explanation rule;
- `role="status"`, busy labels, and disabled cloud action rendering;
- success feedback that distinguishes push and pull and mentions local Records media;
- empty-pull and failure feedback paths;
- the existing local Records exclusion behavior remains intact.

## Out of scope

No Supabase schema changes, no new cloud tables, no upload of imported Records audio or covers, no change to portable backup contents, and no redesign of the broader settings UI.
