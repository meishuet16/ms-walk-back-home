# Mobile Records, Journal, Chapter, and Reflection Fix Design

## Goal

Repair the mobile portrait experience in `apps/html-prototype` while preserving the current local-first data model and authored fixtures. The pass covers live Records playback UI, Records multi-selection, stable modal and navigation scroll positions, repeatable Chapter cutscenes, immediate Books cover updates, bounded Reflection Wall notes, and the requested menu simplification.

## Confirmed interaction rules

- Records lyrics must update from audio playback time without requiring a click or other UI action.
- Records delete confirmation must be anchored to the Records viewport, not placed after the scrolled content.
- Play, delete-menu actions, and changing songs must preserve the current Records scroll position.
- Records supports selecting and deselecting songs, Select All, batch delete, and batch Artist/Album editing. Single-track editing continues to support Title, Artist, Cover, and Lyrics.
- Built-in tracks keep their fixture data immutable; edits are stored as local overrides.
- Every fresh entry into a Chapter that has an automatic cutscene starts that cutscene again, even when the Chapter was previously visited or completed. A session-local automatic-trigger eligibility flag is consumed on the first trigger and remains blocked for the entire active Chapter session, including after the cutscene finishes. Only leaving the Chapter and freshly re-entering resets that eligibility. `completedMemoryEvents` remains completion/unlock state, not an automatic-trigger suppression flag.
- Journal viewer Back returns to the exact originating Books or Timeline surface and restores its scroll position. It must not default to Timeline or to the top.
- The Timeline Show more action remains visible in portrait layouts.
- Changing a Books cover updates the visible preview immediately.
- Reflection Wall notes remain fully operable inside the visible wall bounds on mobile portrait, including notes near the right and bottom edges.
- Music is a top-right `🎵` toggle: one click enables it and the next click disables it.
- The menu removes Music, Credits, resolution, Begin Again, and Continue entries. Existing internal actions remain available only where needed by an active flow.

## Root causes

1. Records has a time-update path, but `refreshRecordsLyricsUI` updates only the desktop `.lyrics-pane`; the mobile `.records-mobile-lyrics` view is generated only during a full Records render.
2. The delete dialog is rendered inside the scrollable `.records-panel`, so its position depends on content flow and can be below the current viewport.
3. Records actions rebuild the full modal after asynchronous cover/background work. Scroll restoration is not centralized, and focus restoration can win over the saved scroll position.
4. Records currently has only row-level actions and single-track metadata fields, so there is no selection model for batch operations.
5. Chapter automatic trigger checks use completion state in some scene paths. That state is durable and therefore incorrectly suppresses later fresh entries.
6. Journal navigation stores the current mode/month but not an origin snapshot containing the originating surface and scroll offset. Reader Back consequently calls the Timeline route directly.
7. Monthly cover updates re-render through the reader route but do not guarantee that the active preview is replaced with the newly stored object URL before the user sees the old cover.
8. Reflection Wall positions are percentages, but the wall and note dimensions are not bounded together on mobile, allowing the note box to extend beyond the visible right or bottom edge.
9. The menu still renders legacy actions and Music in the settings surface instead of exposing a single persistent top-right toggle.

## Design

### Records state and rendering

Add a small Records selection state owned by `WalkHomeApp`:

- `selectedRecordIds: Set<string>` for the current Records session.
- `recordsReturnScrollTop`/existing scroll state retained as the single source of truth for the Records panel scroll offset.
- A helper returns the currently visible track IDs after search and sort, so Select All applies to the complete filtered list, not only the visible DOM slice.

Render each row with a checkbox or equivalent selection control that does not activate playback. Render a Records batch toolbar when at least one track is selected. The toolbar exposes Select All/Clear, batch Artist, batch Album, and batch Delete. Batch metadata edits apply to imported tracks directly and to built-in tracks through local override metadata. Mixed batch deletion removes selected user tracks, preserves selected built-in tracks, and shows a deterministic toast reporting how many built-ins were skipped. Single-track fields retain their current behavior.

Keep the delete confirmation in a sibling layer of the scrollable Records content, using a viewport-centered or bottom-sheet layout with `position: fixed` relative to the Records modal/overlay. On confirmation or cancellation, restore the saved Records scroll offset after the modal DOM is settled.

### Live playback UI

Use one pure lyric-row update helper for both desktop and mobile lyric containers. On every audio `timeupdate`, update:

- current time and duration labels;
- seek range value unless the range is focused;
- active/near classes in `.lyrics-pane p` and `.records-mobile-lyrics p`;
- active mobile lyric window contents when the active source index moves;
- floating lyric overlay content when it is visible.

The live path must not replace the entire Records modal. Full renders are reserved for structural changes such as selecting a track, changing cover, or opening a menu. Structural renders capture the panel's scrollTop before starting and restore it after all awaited object URL work and the next animation frame.

### Chapter cutscene lifecycle

Separate automatic trigger eligibility from durable completion state. A fresh Chapter session resets the in-memory cutscene instance and allows the scene's automatic trigger to start. Once the cutscene instance exists, the trigger path is blocked until the session exits or the cutscene finishes. `completedMemoryEvents` continues to control completed reflections, echoes, and unlocks where the existing product logic needs it, but it is not consulted to suppress the next fresh automatic entry. Explicit Replay remains available and marks the session as replay-only where the current UI already distinguishes replay copy.

### Journal navigation and scroll restoration

Introduce a journal return snapshot with:

```ts
type JournalReturnSnapshot = {
  mode: "timeline" | "books";
  monthKey: string;
  year: string;
  scrollTop: number;
};
```

Before opening a diary viewer, capture the active Journal surface, selected month/year, and scrollTop. Reader Back renders the snapshot's surface and restores its scrollTop after rendering. Timeline and Books transitions preserve their own scroll position when actions cause a structural redraw. A viewer opened from a Timeline entry returns to Timeline; a viewer reached through Books returns to the current Books month.

Keep Show more in the normal flow immediately after the visible Timeline entries, with portrait CSS ensuring it is not pushed below an unconstrained container or hidden behind a fixed toolbar.

### Immediate Books cover update

After a cover file is read and persisted, update `monthlyCovers`, save the library, and re-render the active Books/reader view with the new cover model in the same event turn. If an object URL is needed, revoke the prior URL only after the new preview has been assigned. Cover crop changes use the same immediate re-render path.

### Reflection Wall bounds

Keep the stored percentage model, but compute mobile-safe note positions against the wall's inner dimensions and the note's rendered dimensions. Clamp both drag results and render-time positions so a note's full interactive box remains inside the wall with a small edge margin. Give the wall a scroll-safe bounded surface and prevent horizontal overflow. Existing notes are normalized into the safe range when the wall opens; dragging continues to save the normalized percentage.

### Menu and Music toggle

Render a top-right button in the existing app-level responsive control area with `aria-label="Toggle music"`, a `🎵` icon, and an enabled/disabled state. It calls the existing scene music toggle and updates its state immediately. Reuse the existing responsive positioning and safe-area behavior; do not render a second toggle inside modals, fullscreen surfaces, or a second shell control during fullscreen gameplay. Remove the legacy Music, Credits, compact-resolution, Begin Again, and Continue controls from the menu surface. Keep internal load/reset methods untouched unless they are unreachable legacy UI and remove only dead event branches after tests confirm no active flow uses them.

## Error handling and privacy

- Batch operations with no selected user tracks show a deterministic local toast and do not mutate built-in fixture records.
- Invalid or missing audio/cover/lyrics files leave the previous state intact and show the existing local error toast.
- No raw diary, audio, lyric, or personal note content is logged.
- No paid API or service is introduced; all behavior remains local and fixture-backed.

## Testing

Add or extend focused Node tests before implementation for:

- mobile and desktop lyric containers receiving the same active index on time updates;
- Records scroll restoration through play, delete-menu, track-change, and confirmation flows;
- fixed delete-dialog markup/CSS being outside the scrolling content;
- Select All selecting every filtered track, batch metadata changes, mixed deletion that preserves built-ins, and the skipped-built-in toast;
- repeated automatic Chapter entry after a completed event, plus no repeated start within one active session even after the cutscene finishes;
- Journal reader return snapshots for Books and Timeline with scroll restoration;
- immediate monthly cover state/markup update after file input handling;
- Reflection Wall edge clamping for right/bottom mobile positions;
- presence of exactly one app-level top-right 🎵 toggle across normal and fullscreen shell states, and absence of removed menu actions.

Run the existing typecheck, full html-prototype test suite, build, and a mobile portrait browser smoke test at 390x844. Do not change authored fixture files or commit private runtime data.

## Scope boundaries

- Do not change authored chapter content, canonical runtime behavior outside this scope, or shared import schemas.
- Do not alter authored music, chapter, scene-layout, diary, or image fixtures.
- Do not add cloud synchronization or paid media services.
- Do not push to a remote repository without a separate user confirmation.
