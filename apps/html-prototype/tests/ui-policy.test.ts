import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const appSource = readFileSync("src/app.ts", "utf8");
const inputSource = readFileSync("src/systems/InputManager.ts", "utf8");
const stylesSource = readFileSync("src/styles.css", "utf8");

test("normal UI does not expose removed prototype modules", () => {
  for (const forbidden of ["Relationships", "<h2>Tendency", "Save / Load", "Slot 1", "Slot 2", "Slot 3"]) {
    assert.equal(appSource.includes(forbidden), false, forbidden);
  }
});

test("normal UI does not expose emotional score text", () => {
  for (const forbidden of ["Acceptance +", "Avoidance +", "Closeness +", "Honesty +", "Water 0", "Warmth 0"]) {
    assert.equal(appSource.includes(forbidden), false, forbidden);
  }
});

test("forest HUD exposes month switch controls outside the Walk Back Home modal", () => {
  assert.match(appSource, /forest-month-hud/);
  assert.match(appSource, /data-action="forest-month-prev"/);
  assert.match(appSource, /data-action="forest-month-next"/);
  assert.doesNotMatch(appSource, /drawForestMonthSign\(cameraX/);
});

test("primary navigation is consolidated at the top and HUD has no button row", () => {
  assert.match(appSource, /renderTopNav/);
  assert.match(appSource, /data-action="open-room">Muji Room/);
  assert.match(appSource, /data-action="reflection-wall">Reflection Wall/);
  assert.match(appSource, /data-action="music">Music:/);
  assert.doesNotMatch(appSource, /<button data-action="new">Begin Journey<\/button>/);
  assert.doesNotMatch(appSource, /hud-actions/);
  assert.doesNotMatch(stylesSource, /\.hud-actions/);
});

test("secondary actions live inside settings instead of the forest HUD", () => {
  assert.match(appSource, /data-action="new">Begin Journey<span>/);
  assert.match(appSource, /data-action="continue">Continue<span>/);
  assert.match(appSource, /data-action="credits">Credits<span>/);
  assert.match(appSource, /data-action="rain">Rain:/);
  assert.match(appSource, /data-action="fullscreen">Fullscreen/);
  assert.match(appSource, /data-action="compact">\$\{this\.settings\.compact/);
  assert.doesNotMatch(appSource, /data-action="mute"/);
});

test("re-entering Muji Room from the top nav preserves the current room position", () => {
  assert.match(appSource, /const alreadyInRoom = this\.scene === "muji-room"/);
  assert.match(appSource, /this\.player = alreadyInRoom \? this\.player : \{ \.\.\.roomSpawn \}/);
});

test("Muji Room objects can be activated by tapping their scene positions", () => {
  assert.match(appSource, /this\.canvas\.addEventListener\("click", \(event\) => this\.handleCanvasClick\(event\)\)/);
  assert.match(appSource, /private handleCanvasClick\(event: MouseEvent\): void/);
  assert.match(appSource, /private activateRoomInteraction\(interaction: RoomInteraction\): void/);
});

test("mobile controls use contextual interaction copy instead of keyboard-only E", () => {
  assert.equal(inputSource.includes(">E<"), false);
  assert.match(inputSource, /touch-action-label/);
  assert.match(appSource, /setTouchInteractionLabel/);
  assert.match(appSource, /mobileHudPrompt/);
  assert.match(appSource, /Virtual joystick · A/);
  assert.match(inputSource, />A</);
});

test("floating records transport is clickable and not part of the lyric drag target", () => {
  assert.match(appSource, /floating-controls-bar/);
  assert.match(appSource, /this\.musicPlayer\.addEventListener\("click"/);
  assert.match(stylesSource, /\.floating-controls-bar/);
  assert.match(stylesSource, /touch-action:\s*manipulation/);
});

test("records keeps desktop composition while adding a dedicated mobile player", () => {
  assert.match(appSource, /records-mobile-player/);
  assert.match(appSource, /records-mobile-artwork/);
  assert.match(appSource, /data-action="toggle-record-artwork"/);
  assert.match(appSource, /data-action="toggle-records-song-sheet"/);
  assert.match(stylesSource, /\.records-grid[\s\S]*grid-template-columns:\s*minmax\(220px,\s*280px\)\s*minmax\(260px,\s*1fr\)\s*minmax\(240px,\s*310px\)/);
  assert.match(stylesSource, /@media\s*\(max-width:\s*700px\)[\s\S]*\.records-mobile-player[\s\S]*display:\s*grid/);
  assert.match(stylesSource, /@media\s*\(max-width:\s*700px\)[\s\S]*\.records-grid[\s\S]*display:\s*none/);
});

test("records mobile menus expose customization drawer and per-song deletion", () => {
  assert.match(appSource, /records-mobile-more/);
  assert.match(appSource, /records-song-sheet/);
  assert.match(appSource, /records-song-menu/);
  assert.match(appSource, /data-action="request-delete-user-track"/);
  assert.match(appSource, /data-action="confirm-delete-user-track"/);
  assert.match(appSource, /Your original audio file on your device will not be changed/);
  assert.match(stylesSource, /\.delete-confirmation/);
  assert.match(stylesSource, /\.records-mobile-controls[\s\S]*min-height:\s*44px/);
});

test("records mobile menus stay in viewport and preserve scroll while selecting", () => {
  assert.match(appSource, /data-action="close-records"/);
  assert.match(appSource, /records-mobile-close-button/);
  assert.match(appSource, /preserveRecordsScroll/);
  assert.match(appSource, /restoreRecordsScroll/);
  assert.doesNotMatch(appSource, /private async selectVinyl[\s\S]*recordsSongSheetOpen = false/);
  assert.match(appSource, /data-action="toggle-floating-lyrics"/);
  assert.match(appSource, /data-floating-lyrics-width/);
  assert.match(appSource, /floating-resize-handle/);
  assert.match(appSource, /floating-lyrics-reset/);
  assert.match(appSource, /rehomeFloatingLyrics/);
  assert.match(appSource, /if \(this\.personalPlayer\.lyricsVisible\) \{[\s\S]*this\.rehomeFloatingLyrics\(false\)/);
  assert.match(appSource, /private mobileLyricsOverlayDefault\(\): PersonalPlayerState\["lyricsOverlay"\] \{[\s\S]*x:\s*12,[\s\S]*y:\s*12,/);
  assert.match(appSource, /lyricsResize/);
  assert.match(appSource, /lyricsResize.startWidth/);
  assert.match(appSource, /lyricsResize.startHeight/);
  assert.match(appSource, /resumeAfterRecordsClose/);
  assert.match(stylesSource, /@media\s*\(max-width:\s*700px\)[\s\S]*\.records-mobile-more\.open[\s\S]*position:\s*fixed/);
  assert.match(stylesSource, /@media\s*\(max-width:\s*700px\)[\s\S]*\.records-song-sheet\.open[\s\S]*position:\s*fixed/);
  assert.match(stylesSource, /\.records-header-actions\s*>\s*button:not\(\.records-mobile-more-button\):not\(\.records-mobile-close-button\)/);
  assert.match(stylesSource, /@media\s*\(max-width:\s*700px\)[\s\S]*\.records-header-actions\s*>\s*\.records-mobile-close-button[\s\S]*display:\s*inline-grid/);
  assert.match(stylesSource, /\.records-mobile-controls\s+\.icon-button\.selected[\s\S]*box-shadow/);
  assert.match(stylesSource, /\.floating-player-controls[\s\S]*grid-template-columns:\s*repeat\(3,\s*32px\)/);
}
);

test("mobile portrait and landscape layouts have explicit touch behavior", () => {
  assert.match(inputSource, /Virtual joystick/);
  assert.match(stylesSource, /#app\[data-scene="forest"\] \.touch-controls/);
  assert.match(appSource, /data-action="toggle-touch-controls"/);
  assert.match(appSource, /this\.root\.dataset\.forceTouch/);
  assert.doesNotMatch(appSource, /Rotate screen to landscape/);
  assert.match(stylesSource, /\.rotate-hint[\s\S]*display:\s*none\s*!important/);
  assert.match(stylesSource, /\.reflection-wall-surface[\s\S]*touch-action:\s*pan-x pan-y/);
  assert.match(stylesSource, /\.wall-note[\s\S]*touch-action:\s*none/);
  assert.match(stylesSource, /@media\s*\(orientation:\s*landscape\)\s*and\s*\(max-height:\s*520px\)/);
  assert.match(stylesSource, /\.paper-fields[\s\S]*position:\s*static/);
});

test("mobile touch controls are large and hidden behind non-game portrait sheets", () => {
  assert.match(stylesSource, /#app\.overlay-open \.touch-controls[\s\S]*display:\s*none/);
  assert.match(stylesSource, /#app\[data-scene="forest"\] \.touch-controls[\s\S]*display:\s*flex/);
  assert.match(stylesSource, /#app\[data-scene="bakery"\] \.touch-controls[\s\S]*display:\s*flex/);
  assert.match(stylesSource, /#app\[data-force-touch="true"\] \.touch-controls[\s\S]*display:\s*flex/);
  assert.match(stylesSource, /#app\[data-scene="labis"\] \.touch-controls[\s\S]*display:\s*flex/);
  assert.match(stylesSource, /#app\[data-scene="muji-room"\] \.touch-controls[\s\S]*display:\s*flex/);
  assert.match(stylesSource, /\.touch-stick[\s\S]*width:\s*116px[\s\S]*height:\s*116px/);
}
);

test("journal mobile uses reading mode and quiet editor controls", () => {
  const editorMorePanel = appSource.match(/<div class="journal-more-panel \$\{moreOpen \? "open" : ""\}">[\s\S]*?<\/div>/)?.[0] ?? "";

  assert.match(appSource, /showDiaryReader/);
  assert.match(appSource, /journal-reading-page/);
  assert.match(appSource, /data-action="journal-more-menu"/);
  assert.match(appSource, /data-action="journal-edit-current"/);
  assert.doesNotMatch(appSource, /data-action="journal-mood-entry"/);
  assert.doesNotMatch(appSource, /data-action="journal-add-media-menu"/);
  assert.doesNotMatch(appSource, /journal-add-media-sheet/);
  assert.match(appSource, /id="diary-mood-text"/);
  assert.match(appSource, /data-action="journal-media-select"/);
  assert.match(appSource, /data-action="journal-media-remove"/);
  assert.match(appSource, /data-action="journal-media-crop"/);
  assert.match(appSource, /journal-crop-modal/);
  assert.match(appSource, /data-action="journal-crop-apply"/);
  assert.match(appSource, /journal-crop-image-frame/);
  assert.match(appSource, /journal-crop-box/);
  assert.match(appSource, /data-action="journal-crop-ratio-original"/);
  assert.match(appSource, /data-action="journal-crop-ratio-free"/);
  assert.match(appSource, /\["nw", "n", "ne", "e", "se", "s", "sw", "w"\]/);
  assert.match(stylesSource, /\.journal-crop-handle\.nw/);
  assert.match(stylesSource, /\.journal-crop-actions[\s\S]*z-index:\s*2/);
  assert.match(stylesSource, /\.journal-crop-image-frame[\s\S]*aspect-ratio:\s*var\(--crop-image-aspect/);
  assert.doesNotMatch(appSource, /id="journal-crop-zoom"/);
  assert.doesNotMatch(appSource, /id="journal-crop-x"/);
  assert.doesNotMatch(appSource, /id="journal-crop-y"/);
  assert.match(appSource, /selectedJournalMediaId = mediaId/);
  assert.match(appSource, /Array\.from\(input\.files \?\? \[\]\)/);
  assert.match(appSource, /multiple/);
  assert.match(appSource, /journal-media-tools/);
  assert.match(appSource, /journal-video-select-shield/);
  assert.match(appSource, /journal-video-select-shield" data-action="journal-media-select"/);
  assert.match(stylesSource, /\.journal-video-select-shield\s*\{[^}]*pointer-events:\s*auto/);
  assert.match(appSource, /data-crop-mode/);
  assert.match(appSource, /journalMediaCropStyle/);
  assert.match(appSource, /--crop-img-width/);
  assert.match(appSource, /--crop-source-aspect/);
  assert.match(appSource, /setProperty\('--crop-source-aspect'/);
  assert.match(appSource, /journal-reading-photo-frame/);
  assert.match(appSource, /journal-media-dock/);
  assert.match(appSource, /journal-media-type">Video/);
  assert.doesNotMatch(appSource, /id="diary-video-input"/);
  assert.match(appSource, /journal-inline-photo/);
  assert.match(appSource, /journal-photo-insert-marker/);
  assert.match(appSource, /心情：/);
  assert.doesNotMatch(appSource, /<figcaption>\$\{this\.escapeHtml\(item\.caption/);
  assert.match(appSource, /journal-mobile-top-meta/);
  assert.match(appSource, /data-action="open-timeline" aria-label="Back to timeline"/);
  assert.doesNotMatch(appSource, /data-action="change-journal-cover"/);
  assert.doesNotMatch(appSource, /data-action="journal-tags"/);
  assert.doesNotMatch(editorMorePanel, /data-action="journal-timeline"/);
  assert.doesNotMatch(appSource, /data-action="journal-settings"/);
  assert.doesNotMatch(appSource, /data-action="journal-text-tools"/);
  assert.doesNotMatch(appSource, /data-action="journal-list-tools"/);
  assert.doesNotMatch(appSource, /data-action="journal-undo"/);
  assert.doesNotMatch(appSource, /data-action="journal-redo"/);
  assert.doesNotMatch(appSource, /journal-mobile-muji-button/);
  assert.doesNotMatch(appSource, /journal-more-moods/);
  assert.match(appSource, /data-action="journal-books">Books/);
  assert.match(appSource, /data-action="close">Close/);
  assert.match(stylesSource, /@media\s*\(max-width:\s*700px\)[\s\S]*\.journal-mood-picker[\s\S]*display:\s*none/);
  assert.match(stylesSource, /\.mobile-editor-toolbar/);
  assert.match(stylesSource, /@media\s*\(max-width:\s*700px\)[\s\S]*\.journal-actions[\s\S]*display:\s*block/);
  assert.match(stylesSource, /@media\s*\(max-width:\s*700px\)[\s\S]*\.journal-media-dock[\s\S]*max-height:\s*190px/);
  assert.match(stylesSource, /@media\s*\(max-width:\s*700px\)[\s\S]*\.journal-media-dock[\s\S]*overflow-y:\s*auto/);
  assert.match(stylesSource, /@media\s*\(max-width:\s*700px\)[\s\S]*\.journal-meta-card[\s\S]*grid-template-columns:\s*1fr 1fr/);
  assert.match(stylesSource, /@media\s*\(max-width:\s*700px\)[\s\S]*\.journal-body-field[\s\S]*min-height:\s*360px/);
  assert.match(stylesSource, /@media\s*\(max-width:\s*700px\)[\s\S]*\.journal-inline-photo-frame[\s\S]*max-height:\s*132px/);
  assert.match(stylesSource, /@media\s*\(max-width:\s*700px\)[\s\S]*\.journal-more-panel\.open[\s\S]*position:\s*fixed/);
  assert.match(appSource, /this\.journalMoreMenuOpen = false;[\s\S]*this\.showDiaryEditor\(target\.dataset\.id\)/);
});

test("journal mobile timeline books and pdf expose editorial structures", () => {
  assert.doesNotMatch(appSource, /mobile-week-strip/);
  assert.match(appSource, /timeline-date-group/);
  assert.match(appSource, /timeline-media-grid/);
  assert.match(appSource, /book-shelf-section/);
  assert.match(appSource, /journal-year-filter/);
  assert.doesNotMatch(appSource, /Year Books/);
  assert.match(appSource, /data-action="timeline-request-delete-selected"/);
  assert.match(appSource, /data-action="timeline-confirm-delete-selected"/);
  assert.doesNotMatch(appSource, /data-action="delete-diary-entry" data-id="\$\{this\.escapeHtml\(entry\.id\)\}">Delete/);
  assert.match(appSource, /timeline-filter-menu/);
  assert.match(appSource, /renderTimelineDatePicker/);
  assert.match(appSource, /\$\{this\.journalHeader\("Timeline", month, this\.renderTimelineFilters\(month\)\)\}\$\{this\.renderTimelineDatePicker\(/);
  assert.doesNotMatch(appSource, /<\/details>\$\{this\.renderTimelineDatePicker\(selectedDate\)\}/);
  assert.match(appSource, /timeline-date-picker/);
  assert.match(stylesSource, /@media\s*\(max-width:\s*700px\)[\s\S]*\.month-nav[\s\S]*grid-template-columns:\s*auto\s*minmax\(0,\s*1fr\)\s*auto\s*auto/);
  assert.match(stylesSource, /@media\s*\(max-width:\s*700px\)[\s\S]*\.timeline-toolbar[\s\S]*display:\s*none/);
  assert.match(stylesSource, /@media\s*\(max-width:\s*700px\)[\s\S]*\.timeline-filter-menu\[open\]\s+\.timeline-toolbar[\s\S]*position:\s*fixed/);
  assert.match(stylesSource, /@media\s*\(max-width:\s*700px\)[\s\S]*\.timeline-filter-menu\[open\]\s+\.timeline-toolbar[\s\S]*right:\s*12px/);
  assert.match(stylesSource, /@media\s*\(max-width:\s*700px\)[\s\S]*\.timeline-filter-menu\[open\]\s+\.timeline-toolbar[\s\S]*display:\s*grid|@media\s*\(max-width:\s*700px\)[\s\S]*\.timeline-filter-menu\[open\]\s+\.timeline-toolbar[\s\S]*display:\s*grid/);
  assert.match(stylesSource, /\.timeline-filter-menu\[open\] \.timeline-toolbar[\s\S]*display:\s*grid/);
  assert.match(stylesSource, /@media\s*\(max-width:\s*700px\)[\s\S]*\.timeline-date-picker[\s\S]*max-width:\s*100%/);
  assert.match(stylesSource, /@media\s*\(max-width:\s*700px\)[\s\S]*\.timeline-date-picker[\s\S]*overflow-x:\s*auto/);
  assert.match(stylesSource, /@media\s*\(max-width:\s*700px\)[\s\S]*\.timeline-month-nav[\s\S]*min-width:\s*0/);
  assert.match(stylesSource, /@media\s*\(max-width:\s*700px\)[\s\S]*\.timeline-media-grid[\s\S]*max-height:\s*124px/);
  assert.match(stylesSource, /@media\s*\(max-width:\s*700px\)[\s\S]*\.timeline-card-actions[\s\S]*grid-column:\s*1 \/ -1/);
  assert.match(stylesSource, /@media\s*\(max-width:\s*700px\)[\s\S]*\.timeline-delete-confirmation[\s\S]*width:\s*min\(332px,\s*calc\(100vw - 32px\)\)/);
  assert.match(appSource, /data-action="change-month-cover"/);
  assert.match(appSource, /month-cover-crop-control/);
  assert.match(appSource, /setMonthlyCoverCrop/);
  assert.match(appSource, /id="month-cover-input"/);
  assert.match(appSource, /pdf-cover-preview/);
  assert.match(stylesSource, /@media\s*\(max-width:\s*700px\)[\s\S]*\.journal-archive-header[\s\S]*grid-template-columns:\s*minmax\(0,\s*1fr\)\s*auto/);
  assert.match(stylesSource, /@media\s*\(max-width:\s*700px\)[\s\S]*\.timeline-card[\s\S]*grid-template-columns:\s*minmax\(0,\s*1fr\)\s*auto/);
  assert.match(stylesSource, /@media\s*\(max-width:\s*700px\)[\s\S]*\.diary-page-preview[\s\S]*grid-column:\s*1 \/ -1/);
  assert.match(stylesSource, /@media\s*\(max-width:\s*700px\)[\s\S]*\.timeline-entry[\s\S]*border-radius:\s*0/);
  assert.match(stylesSource, /\.journal-video-block/);
});

test("mobile journal reflection and pdf surfaces fill the portrait viewport", () => {
  assert.match(appSource, /reflection-wall-filter-menu/);
  assert.match(appSource, /reflection-wall-close-button/);
  assert.match(appSource, /reflection-note-tools/);
  assert.match(appSource, /selectedReflectionNoteId/);
  assert.match(appSource, /data-action="reflection-note-select"/);
  assert.match(appSource, /data-action="reflection-note-drag"/);
  assert.match(appSource, /data-action="reflection-note-delete"/);
  assert.match(appSource, /refreshReflectionWallOnly/);
  assert.doesNotMatch(appSource, /target instanceof HTMLInputElement && target\.id === "reflection-search"[\s\S]{0,120}this\.openReflectionWall\(\)/);
  assert.match(stylesSource, /@media\s*\(max-width:\s*700px\)[\s\S]*\.journal-panel[\s\S]*min-height:\s*100dvh/);
  assert.match(stylesSource, /@media\s*\(max-width:\s*700px\)[\s\S]*\.monthly-reader[\s\S]*min-height:\s*100dvh/);
  assert.match(stylesSource, /@media\s*\(max-width:\s*700px\)[\s\S]*\.reflection-wall-modal[\s\S]*min-height:\s*100dvh/);
  assert.match(stylesSource, /@media\s*\(max-width:\s*700px\)[\s\S]*\.reflection-chip-row[\s\S]*display:\s*none/);
  assert.match(stylesSource, /@media\s*\(max-width:\s*700px\)[\s\S]*\.reflection-wall-filter-menu\[open\]\s+\.reflection-chip-row[\s\S]*display:\s*flex/);
  assert.match(stylesSource, /@media\s*\(max-width:\s*700px\)[\s\S]*\.wall-note[\s\S]*max-width:\s*calc\(100vw - 48px\)/);
  assert.match(stylesSource, /@media\s*\(max-width:\s*700px\)[\s\S]*\.wall-note[\s\S]*transform:\s*none\s*!important/);
  assert.match(stylesSource, /@media\s*\(max-width:\s*700px\)[\s\S]*\.wall-note\[data-dragging="true"\][\s\S]*outline/);
  assert.match(stylesSource, /@media\s*\(max-width:\s*700px\)[\s\S]*\.game-panel[\s\S]*color:\s*#3c2b1c/);
  assert.match(stylesSource, /@media\s*\(max-width:\s*700px\)[\s\S]*\.overlay[\s\S]*padding:\s*0/);
}
);
