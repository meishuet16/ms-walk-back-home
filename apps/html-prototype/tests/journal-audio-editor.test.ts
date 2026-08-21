import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const appSource = readFileSync("src/app.ts", "utf8");
const stylesSource = readFileSync("src/styles.css", "utf8");

test("journal editor exposes explicit recording controls and keeps recording state local", () => {
  assert.match(appSource, /data-action="journal-record-audio"/);
  assert.match(appSource, /data-action="journal-audio-stop"/);
  assert.match(appSource, /action === "journal-audio-pause"/);
  assert.match(appSource, /action === "journal-audio-resume"/);
  assert.match(appSource, /JournalAudioRecorder/);
  assert.match(appSource, /commitPendingJournalAudio/);
});

test("journal audio playback resolves local blobs lazily and revokes temporary URLs", () => {
  assert.match(appSource, /objectUrlFor/);
  assert.match(appSource, /revokeAllObjectUrls/);
  assert.match(appSource, /journal-audio-unavailable/);
  assert.doesNotMatch(appSource, /<audio[^>]+autoplay/);
});

test("saving journal audio commits the pending blob before persisting metadata", () => {
  const saveMethod = appSource.match(/private async saveDiaryEntry\(id = ""\): Promise<void> \{[\s\S]*?\n  \}/)?.[0] ?? "";
  assert.match(saveMethod, /commitPendingJournalAudio/);
  assert.match(saveMethod, /upsertDiaryPageDraft/);
});

test("journal audio removal requires a centered confirmation", () => {
  assert.match(appSource, /journal-audio-delete-confirmation/);
  assert.match(appSource, /journal-audio-delete-confirm/);
  assert.match(appSource, /journal-audio-delete-cancel/);
  assert.match(appSource, /pendingJournalMediaDeleteId/);
  assert.match(appSource, /event\.target as HTMLElement\)\.closest\("audio"\)/);
});

test("journal editor places Record voice between photo and video controls", () => {
  const toolbar = appSource.match(/<div class="mobile-editor-toolbar">[\s\S]*?<\/div>/)?.[0] ?? "";
  assert.ok(toolbar.indexOf('aria-label="Add photo"') < toolbar.indexOf('aria-label="Record audio"'));
  assert.ok(toolbar.indexOf('aria-label="Record audio"') < toolbar.indexOf('aria-label="Add video"'));
  assert.match(stylesSource, /mobile-editor-toolbar[\s\S]*grid-template-columns:\s*repeat\(3/);
});
