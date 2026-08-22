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
  assert.match(appSource, /class="menu-toggle"/);
  assert.match(appSource, /class="menu-panel"/);
  assert.match(appSource, /data-action="open-room">Muji Room/);
  assert.match(appSource, /data-action="reflection-wall">Reflection Wall/);
  assert.match(appSource, /class="shell-music-toggle" data-action="music"/);
  assert.doesNotMatch(appSource, /<button data-action="new">Begin Journey<\/button>/);
  assert.doesNotMatch(appSource, /hud-actions/);
  assert.doesNotMatch(stylesSource, /\.hud-actions/);
});

test("mobile portrait entry and fullscreen use the playable scene shell", () => {
  assert.match(appSource, /if \(action === "open-map"\) this\.showMap\(\)/);
  assert.match(appSource, /this\.scene = "forest"/);
  assert.match(stylesSource, /\.game-shell:fullscreen[\s\S]*padding:\s*0/);
  assert.match(stylesSource, /\.game-shell:fullscreen \.top-menu-title[\s\S]*display:\s*none/);
  assert.match(stylesSource, /\.game-shell:fullscreen \.stage-wrap[\s\S]*width:\s*100vw/);
  assert.match(stylesSource, /#app\[data-orientation="portrait"\] \.stage-wrap[\s\S]*height:\s*calc\(100dvh - 12px\)/);
});

test("secondary actions live inside settings instead of the forest HUD", () => {
  assert.doesNotMatch(appSource, /data-action="new">Begin Journey<span>/);
  assert.match(appSource, /data-action="rain">Rain:/);
  assert.match(appSource, /data-action="fullscreen">Fullscreen/);
  assert.doesNotMatch(appSource, /data-action="compact">/);
  assert.doesNotMatch(appSource, /data-action="credits">/);
  assert.doesNotMatch(appSource, /data-action="reset-journey">/);
  assert.doesNotMatch(appSource, /data-action="mute"/);
});

test("re-entering Muji Room from the top nav preserves the current room position", () => {
  assert.match(appSource, /const alreadyInRoom = this\.scene === "muji-room"/);
  assert.match(appSource, /layout\.orientation === "landscape"[\s\S]*alreadyInRoom \? this\.player : \{ \.\.\.roomSpawn \}/);
});

test("Muji Room objects can be activated by tapping their scene positions", () => {
  assert.match(appSource, /this\.canvas\.addEventListener\("click", \(event\) => this\.handleCanvasClick\(event\)\)/);
  assert.match(appSource, /private handleCanvasClick\(event: MouseEvent\): void/);
  assert.match(appSource, /private activateRoomInteraction\(interaction: SceneInteraction \| RoomInteraction\): void/);
  assert.match(appSource, /this\.currentSceneLayout\("muji-room"\)\.orientation === "landscape" \? roomInteractions : this\.currentSceneLayout\("muji-room"\)\.interactions/);
});

test("Muji Room landscape keeps the original dedicated runtime path", () => {
  assert.match(appSource, /if \(layout\.orientation === "landscape"\)[\s\S]*moveRoomPlayer\(this\.player, x, y, dt\)/);
  assert.match(appSource, /if \(layout\.orientation === "landscape"\)[\s\S]*nearestRoomInteraction\(this\.player\)/);
  assert.match(appSource, /if \(layout\.orientation === "landscape"\)[\s\S]*this\.ctx\.drawImage\(this\.images\.room, 0, 0, this\.canvas\.width, this\.canvas\.height\)/);
  assert.match(appSource, /for \(const interaction of roomInteractions\)/);
});

test("Muji Room portrait reuses existing room effect rendering for lamp and window", () => {
  assert.match(appSource, /this\.roomInteractionById\(layout, "lamp"\)/);
  assert.match(appSource, /this\.roomInteractionById\(layout, "window"\)/);
  assert.match(appSource, /if \(this\.room\.lampOn && lamp\) this\.drawLampGlow\(lamp, scale\)/);
  assert.match(appSource, /if \(this\.room\.windowFocus && windowInteraction\)[\s\S]*this\.drawWindowFocus\(windowInteraction, time, scale\)/);
  assert.match(appSource, /activateRoomInteraction\(this\.activeRoomInteraction\)/);
  for (const id of ["door", "journal", "lamp", "window", "records", "residue", "reflection"]) {
    assert.match(appSource, new RegExp(`interaction\\.id === "${id}"`));
  }
});

test("Bakery and Labis portrait visuals resolve from authored interactions", () => {
  assert.match(appSource, /private sceneInteractionById\(layout: SceneLayout, id: string\): SceneInteraction \| null/);
  assert.match(appSource, /this\.sceneInteractionById\(layout, "diary-memory"\)/);
  assert.match(appSource, /this\.sceneInteractionById\(layout, "friend-a"\)/);
  assert.match(appSource, /this\.sceneInteractionById\(layout, "pastry"\)/);
  assert.match(appSource, /this\.drawBakeryPastry\(pastry, cameraX, cameraY, scale, time\)/);
  assert.match(appSource, /this\.drawLabisDiaryBookProp\(diaryMemory, cameraX, cameraY, scale, time\)/);
});

test("Friend A scene and dialogue portraits are scaled proportionally", () => {
  assert.match(appSource, /this\.drawFriendA\(friend, cameraX, cameraY, scale\)/);
  assert.match(appSource, /class="friend-portrait"/);
  assert.match(stylesSource, /\.vn-portrait img\.friend-portrait[\s\S]*max-width:\s*246px/);
  assert.match(stylesSource, /\.vn-portrait img\.friend-portrait[\s\S]*max-height:\s*336px/);
  assert.match(stylesSource, /\.vn[\s\S]*grid-template-columns:\s*minmax\(88px,\s*260px\)\s+1fr/);
});

test("mobile controls use contextual interaction copy instead of keyboard-only E", () => {
  assert.equal(inputSource.includes(">E<"), false);
  assert.match(inputSource, /touch-action-label/);
  assert.match(inputSource, /data-touch-control="stick"/);
  assert.match(inputSource, /data-touch-control="action"/);
  assert.match(inputSource, /touchControlStorageKey = "walk-back-home-touch-controls"/);
  assert.match(appSource, /setTouchInteractionLabel/);
  assert.match(appSource, /mobileHudPrompt/);
  assert.match(appSource, /Virtual joystick · A/);
  assert.match(inputSource, />A</);
});

test("forest month is positioned at the mobile portrait top right", () => {
  assert.match(stylesSource, /@media\s*\(max-width:\s*860px\)[\s\S]*\.forest-month-hud[\s\S]*top:\s*10px/);
  assert.match(stylesSource, /@media\s*\(max-width:\s*860px\)[\s\S]*\.forest-month-hud[\s\S]*right:\s*10px/);
  assert.match(stylesSource, /@media\s*\(max-width:\s*860px\)[\s\S]*\.forest-month-hud[\s\S]*bottom:\s*auto/);
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

test("portrait shells clamp their box model and internal grids to the viewport", () => {
  assert.match(stylesSource, /\.modal, \.vn\s*\{[\s\S]*box-sizing:\s*border-box/);
  assert.match(stylesSource, /\.modal, \.vn\s*\{[\s\S]*min-width:\s*0/);
  assert.match(stylesSource, /@media\s*\(max-width:\s*700px\)[\s\S]*\.timeline-panel\s*\{[\s\S]*min-width:\s*0/);
  assert.match(stylesSource, /@media\s*\(max-width:\s*700px\)[\s\S]*\.timeline-scroll-content[\s\S]*min-width:\s*0/);
  assert.match(stylesSource, /@media\s*\(max-width:\s*700px\)[\s\S]*\.reflection-wall-toolbar\s*\{[\s\S]*display:\s*flex/);
  assert.match(stylesSource, /@media\s*\(max-width:\s*700px\)[\s\S]*\.reflection-wall-modal\s*\{[\s\S]*box-sizing:\s*border-box/);
});

test("Today / Home no longer renders the retired Continue action", () => {
  const showHome = appSource.match(/private showHome\(\): void \{[\s\S]*?\n  \}/)?.[0] ?? "";
  assert.doesNotMatch(showHome, /data-action="continue"/);
});

test("mobile journal deletion confirmation is centered in the viewport", () => {
  assert.match(stylesSource, /@media\s*\(max-width:\s*700px\)[\s\S]*\.timeline-delete-confirmation[\s\S]*top:\s*50%/);
  assert.match(stylesSource, /@media\s*\(max-width:\s*700px\)[\s\S]*\.timeline-delete-confirmation[\s\S]*bottom:\s*auto/);
  assert.match(stylesSource, /@media\s*\(max-width:\s*700px\)[\s\S]*\.timeline-delete-confirmation[\s\S]*translate\(-50%,\s*-50%\)/);
});

test("journal discard confirmation stays over the active editor", () => {
  assert.match(appSource, /journal-discard-confirmation/);
  assert.match(appSource, /overlay\.insertAdjacentHTML\("beforeend"[\s\S]*journal-discard-confirmation/);
  assert.match(stylesSource, /\.journal-discard-confirmation[\s\S]*position:\s*absolute/);
});

test("Records is a top menu route rather than a Settings module", () => {
  const topNavSource = appSource.match(/private renderTopNav\(\): void \{[\s\S]*?\n  \}/)?.[0] ?? "";
  const settingsSource = appSource.match(/private settingsContent\(\): string \{[\s\S]*?\n  \}/)?.[0] ?? "";
  assert.match(topNavSource, /data-action="open-room"[\s\S]*data-action="room-records"/);
  assert.doesNotMatch(settingsSource, /data-action="room-records"/);
});

test("mobile Records batch confirmation is centered within the open song sheet", () => {
  assert.match(stylesSource, /@media\s*\(max-width:\s*700px\)[\s\S]*\.records-song-sheet \.records-batch-mobile-confirmation[\s\S]*position:\s*fixed/);
  assert.match(stylesSource, /@media\s*\(max-width:\s*700px\)[\s\S]*\.records-song-sheet \.records-batch-mobile-confirmation[\s\S]*top:\s*50%/);
  assert.match(stylesSource, /@media\s*\(max-width:\s*700px\)[\s\S]*\.records-song-sheet \.records-batch-mobile-confirmation[\s\S]*translate\(-50%,\s*-50%\)/);
  assert.match(stylesSource, /@media\s*\(max-width:\s*700px\)[\s\S]*\.records-song-sheet \.records-batch-toolbar[\s\S]*position:\s*sticky/);
});

test("Records playback refreshes desktop and mobile lyrics without rebuilding the modal", () => {
  assert.match(appSource, /data-lyric-index/);
  assert.match(appSource, /querySelectorAll<HTMLElement>\("\.records-mobile-lyrics p"\)/);
  assert.match(appSource, /lyricWindowForTime\(lyrics, currentTime\)/);
  assert.match(appSource, /refreshRecordsLyricsUI\(currentTime\)/);
});

test("Records delete confirmation is outside the scrolling content and viewport anchored", () => {
  assert.match(appSource, /records-scroll-content/);
  assert.match(appSource, /records-delete-confirmation/);
  assert.match(stylesSource, /\.records-delete-confirmation[\s\S]*position:\s*fixed/);
  assert.match(stylesSource, /\.records-panel[\s\S]*overflow-y:\s*auto/);
});

test("Records exposes multi-select batch editing and mixed deletion", () => {
  const typesSource = readFileSync("src/types.ts", "utf8");
  assert.match(appSource, /selectedRecordIds/);
  assert.match(appSource, /records-select-all/);
  assert.match(appSource, /records-batch-delete/);
  assert.match(appSource, /records-batch-artist/);
  assert.match(appSource, /records-batch-album/);
  assert.match(appSource, /Skipped .* built-in records/);
  assert.match(typesSource, /customTrackMeta\?[\s\S]*album\?: string/);
  assert.match(stylesSource, /\.records-batch-toolbar/);
});

test("Chapter automatic cutscenes use an entry session instead of completed event history", () => {
  assert.match(appSource, /chapterTriggerSessions/);
  assert.match(appSource, /consumeAutomaticChapterTrigger/);
  assert.match(appSource, /createChapterTriggerSession/);
  assert.match(appSource, /chapterTriggerSessions\.delete/);
  assert.doesNotMatch(appSource, /trigger\.once && this\.completedMemoryEvents\.has\(trigger\.eventId\)/);
});

test("Journal reader returns to its originating surface and keeps the scroll position", () => {
  assert.match(appSource, /journalReturnSnapshot/);
  assert.match(appSource, /createJournalReturnSnapshot/);
  assert.match(appSource, /data-action="journal-reader-back"/);
  assert.match(appSource, /restoreJournalOrigin/);
  assert.match(appSource, /openMonthlyBook\(snapshot\.monthKey\)/);
  assert.match(appSource, /showTimeline\(\{ restoreScrollTop: snapshot\.scrollTop \}\)/);
  assert.match(stylesSource, /\.timeline-show-more[\s\S]*position:\s*sticky/);
  assert.match(appSource, /handleMonthCoverInput[\s\S]*this\.openMonthlyBook\(monthKey\)/);
});

test("Reflection Wall keeps portrait notes inside the usable surface", () => {
  assert.match(appSource, /clampReflectionNotePosition/);
  assert.match(appSource, /reflectionWallNoteDimensions/);
  assert.match(appSource, /transform:translate\(-50%,\s*-50%\)/);
  assert.doesNotMatch(stylesSource, /\.wall-note\s*\{[^}]*transform:\s*none\s*!important/);
});

test("Music is one shell-level top-right toggle and legacy menu actions are removed", () => {
  const settingsSource = appSource.match(/private settingsContent\(\): string \{[\s\S]*?\n  \}/)?.[0] ?? "";
  assert.equal((appSource.match(/data-action="music"/g) ?? []).length, 1);
  assert.match(appSource, /shell-music-toggle/);
  assert.doesNotMatch(settingsSource, /data-action="music"|data-action="compact"|data-action="credits"|data-action="continue"|data-action="reset-journey"|data-action="new"|Begin Journey/);
});

test("Reflection Wall stack and list have their own portrait scroll surface", () => {
  assert.match(stylesSource, /\.reflection-stack,\s*\.reflection-list[\s\S]*min-height:\s*0/);
  assert.match(stylesSource, /@media\s*\(max-width:\s*700px\)[\s\S]*\.reflection-wall-modal[\s\S]*overflow:\s*hidden/);
  assert.match(stylesSource, /@media\s*\(max-width:\s*700px\)[\s\S]*\.reflection-stack,\s*\.reflection-list[\s\S]*overflow-y:\s*auto/);
});

test("Mobile shell music uses the same fixed safe-area control row as the menu", () => {
  assert.match(stylesSource, /@media\s*\(max-width:\s*860px\)[\s\S]*\.shell-music-toggle[\s\S]*position:\s*fixed/);
  assert.match(stylesSource, /\.shell-music-toggle[\s\S]*right:\s*max\(/);
});

test("Timeline keeps its load-more action visible while entries scroll", () => {
  assert.match(appSource, /timeline-scroll-content/);
  assert.match(stylesSource, /\.timeline-panel[\s\S]*display:\s*grid/);
  assert.match(stylesSource, /\.timeline-scroll-content[\s\S]*overflow-y:\s*auto/);
  assert.match(appSource, /querySelector<HTMLElement>\("\.timeline-scroll-content"\)/);
});

test("Journal editor back restores the originating timeline scroll position", () => {
  assert.match(appSource, /edit-diary-entry[\s\S]*captureJournalReturnSnapshot\(\)[\s\S]*showDiaryEditor/);
  assert.match(appSource, /journal-edit-current[\s\S]*captureJournalReturnSnapshot\(\)[\s\S]*showDiaryEditor/);
  assert.match(appSource, /handleJournalEditorBack[\s\S]*restoreJournalOrigin/);
  assert.match(appSource, /discardJournalEditor[\s\S]*restoreJournalOrigin/);
});

test("Records batch actions stay inside the song sheet and preserve sheet scroll when switching tracks", () => {
  const sheetStart = appSource.indexOf('<section class="records-song-sheet');
  const batchToolbar = appSource.indexOf('${batchToolbar}', sheetStart);
  assert.ok(sheetStart >= 0 && batchToolbar > sheetStart);
  assert.match(appSource, /recordsSheetScrollTop/);
  assert.match(appSource, /querySelector<HTMLElement>\("\.records-song-sheet"\)/);
  assert.match(stylesSource, /\.records-delete-confirmation[\s\S]*top:\s*50%/);
});

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
  assert.match(stylesSource, /\.touch-controls[\s\S]*inset:\s*0/);
  assert.match(stylesSource, /\.touch-stick[\s\S]*position:\s*fixed/);
  assert.match(stylesSource, /\.touch-stick[\s\S]*background:\s*rgba\(8,21,34,\.12\)/);
  assert.match(stylesSource, /\.touch-action[\s\S]*position:\s*fixed/);
}
);

test("portrait chapter scenes inherit touch controls without a scene whitelist", () => {
  assert.match(stylesSource, /#app\[data-gameplay-scene="true"\] \.touch-controls[\s\S]*display:\s*flex/);
  assert.match(appSource, /this\.root\.dataset\.gameplayScene = gameplay \? "true" : "false"/);
  assert.match(appSource, /this\.isAuthoredRuntimeScene\(\)/);
});

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
  assert.match(stylesSource, /@media\s*\(max-width:\s*700px\)[\s\S]*\.journal-inline-photo-frame[\s\S]*aspect-ratio:\s*var\(--crop-aspect/);
  assert.doesNotMatch(stylesSource, /\.journal-inline-photo-frame[\s\S]*max-height:\s*132px/);
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
  assert.match(appSource, /\$\{this\.journalHeader\("Timeline", month, this\.renderTimelineFilters\(month\)\)\}\$\{this\.renderTimelineDatePicker\(|timeline-scroll-content/);
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
  assert.doesNotMatch(stylesSource, /\.wall-note\s*\{[^}]*transform:\s*none\s*!important/);
  assert.match(stylesSource, /@media\s*\(max-width:\s*700px\)[\s\S]*\.wall-note\[data-dragging="true"\][\s\S]*outline/);
  assert.match(stylesSource, /@media\s*\(max-width:\s*700px\)[\s\S]*\.game-panel[\s\S]*color:\s*#3c2b1c/);
  assert.match(stylesSource, /@media\s*\(max-width:\s*700px\)[\s\S]*\.overlay[\s\S]*padding:\s*0/);
}
);

test("Backup / Sync exposes readable copy and persistent cloud operation feedback", () => {
  assert.match(stylesSource, /\.backup-panel \.quiet-line[\s\S]*color:\s*#3c2b1c/);
  assert.match(appSource, /backupSyncOperation/);
  assert.match(appSource, /role="status"/);
  assert.match(appSource, /Syncing this device/);
  assert.match(appSource, /Pulling cloud memories/);
  assert.match(appSource, /const cloudActionDisabled = this\.backupSyncOperation \? "disabled" : ""/);
  assert.match(appSource, /Imported Records audio and covers stayed on this device/);
});
test("Reflection Wall portrait wall grows its scroll canvas with memo count", () => {
  assert.match(appSource, /reflectionWallCanvasHeight\(this\.reflectionWall\.notes\.length\)/);
  assert.match(appSource, /--reflection-wall-canvas-height/);
  assert.match(stylesSource, /@media\s*\(max-width:\s*700px\)[\s\S]*\.reflection-wall-surface[\s\S]*min-height:\s*var\(--reflection-wall-canvas-height/);
  assert.match(stylesSource, /@media\s*\(max-width:\s*700px\)[\s\S]*\.reflection-wall-surface[\s\S]*overflow-y:\s*auto/);
});
