import { bakeryChapter } from "./fixtures/chapterPlan.js";
import { april06Assets, april06Chapter, april06EchoActions, april06MainMemoryActions, april06ReflectionChoices, resolveApril06Actions } from "./fixtures/april06Chapter.js";
import { march30Assets, march30EchoActions, march30EchoReflectionChoices, march30MainMemoryActions, march30ReflectionChoices, resolveMarch30Closing, resolveMarch30CutsceneActions } from "./fixtures/march30Memory.js";
import { canStartLabisMotorMemory, labisDiaryMemorySpot, labisInteractionForPoint, labisMotorMemoryActions } from "./fixtures/labisMotorMemory.js";
import { labisAssetManifest, labisAssetPath, labisProductionAssetPaths } from "./fixtures/labisAssetRegistry.js";
import { labisChoicePoints, labisEchoes, resolveLabisMemoryReflection, type LabisChoicePoint, type LabisEcho } from "./fixtures/labisMemoryEchoes.js";
import type { ChapterProgress, Choice, DiaryEntry, DiaryLibraryState, DiaryMedia, DiaryMediaCrop, JournalBookCoverCrop, JourneyState, MemoryKind, MusicSort, PersonalMusicLibraryState, PersonalPlayerState, ReflectionNote, ReflectionWallFilter, ReflectionWallSort, ReflectionWallState, ReflectionWallView, RoomJourneyState, SceneId, SyncedLyricLine, Tendencies, UserMusicTrack } from "./types.js";
import { AudioManager } from "./systems/AudioManager.js";
import { AccountManager } from "./systems/AccountManager.js";
import { loadAppConfig } from "./systems/AppConfig.js";
import { chapterRegistry, forestEntries, routeForestEntry, type AuthoredForestEntry } from "./systems/ChapterRegistry.js";
import { beginChapterVisit, consumeAutomaticChapterTrigger, createChapterTriggerSession, finishChapterWalkthrough, initialChapterProgress, markChapterMemoryRead, type ChapterTriggerSession } from "./systems/ChapterProgressManager.js";
import { applyChapterExperienceChoice, currentRunProgress, startChapterMemoryExperience, type ChapterExperienceMode, type ChapterMemoryExperienceRun } from "./systems/ChapterMemoryExperience.js";
import { inAnyRect, type Point } from "./systems/CollisionSystem.js";
import { CutsceneSystem } from "./systems/CutsceneSystem.js";
import { createNewDiaryPage, deleteDiaryEntriesByIds, deleteDiaryEntryById, findChapterDiaryEntry, forestNodesForMonth, formatDiaryWeekday, getDiaryTimeline, openDiaryPageForDate, seedAuthoredChapterDiaryEntries, sharedChapterDiaryBookAssetPath, upsertDiaryEntry, upsertDiaryPageDraft } from "./systems/DiaryLibrary.js";
import { makeDiaryEntry, parseDiaryImport, updateDiaryMemoryKind, type DiaryForestMemory, type DiaryTimelineSort } from "./systems/DiaryImport.js";
import { DialogueSystem } from "./systems/DialogueSystem.js";
import { resolveChapterReflection, type Ending } from "./systems/EndingResolver.js";
import { InputManager } from "./systems/InputManager.js";
import { journalMediaCropRenderModel, journalMediaCropRenderStyle as renderJournalMediaCropStyle, normalizeJournalMediaCrop } from "./systems/JournalCrop.js";
import { createJournalReturnSnapshot, journalReturnTarget, moveBooksMonth as moveBooksMonthState, moveTimelineMonth as moveTimelineMonthState, selectBooksYear as selectBooksYearState, selectTimelineYear as selectTimelineYearState, type JournalNavigationState, type JournalReturnSnapshot } from "./systems/JournalNavigation.js";
import { adjacentMonthKey, defaultMonthlyCover, hasMoreTimelineEntries, journalBatchSize, makeMonthlyJournalImagePdf, makeTimelineMonthView, monthlyBookSummaries, monthlyPdfFilename, monthLabel, selectedOrLatestMonth, selectAllTimelineEntryIds, sortMonthEntries, upsertMonthlyCover, visibleTimelineEntries, type JournalMonth, type MonthlyJournalPdfPage, type TimelineDateScope, type TimelineMemoryKindFilter } from "./systems/JournalModel.js";
import { createBackupBundle, parseBackupBundle, restoreBackupBlobEntries, walkBackupFilename, type BackupBlobEntry } from "./systems/BackupManager.js";
import { JournalMediaBlobStore } from "./systems/JournalMediaBlobStore.js";
import { collectReferencedJournalMediaKeys, commitPendingJournalAudio, journalMediaTempKey, makeJournalAudioMedia, type PendingJournalAudio } from "./systems/JournalMedia.js";
import { JournalAudioRecorder } from "./systems/JournalAudioRecorder.js";
import { MusicBlobStore } from "./systems/MusicBlobStore.js";
import { ParticleSystem } from "./systems/ParticleSystem.js";
import { BundledLyricsLoader, trackIdentity } from "./systems/BundledLyrics.js";
import { LrclibLyricsProvider } from "./systems/LrclibLyrics.js";
import { activeLyricIndexAt, adjacentTrackIdForControl, applyBatchMusicMetadata, clampLyricsOverlay, createDefaultPersonalPlayerState, filterAndSortMusic, isBuiltInTrackId, lyricWindowForTime, nextTrackIdForPlayback, normalizePlaybackMode, parseLrc, personalMusicShouldPlayInScene, removeSelectedMusicTracks, removeUserMusicTrack, selectAllMusicTrackIds, type BatchMusicMetadata } from "./systems/PersonalMusic.js";
import { changeReflectionPaper, clampReflectionNotePosition, createChapterReflectionNote, createReflectionNote, createReflectionWallState, deleteReflectionNote, migrateLegacyReflectionWall, moveReflectionNote, reflectionPaperStyles, toggleReflectionNoteFlag, updateReflectionNote, visibleReflectionNotes } from "./systems/ReflectionWall.js";
import { drawSceneActor, drawSceneSpriteAsset } from "./systems/SceneActorRenderer.js";
import { getSceneLayout, loadSceneLayoutOverrides, resolveForestDynamicPlacements, resolveSceneEchoAnchor, sceneLayoutManifest, selectSceneOrientation, type SceneInteraction, type SceneLayout, type SceneLayoutId, type SceneOrientation } from "./systems/SceneLayouts.js";
import {
  addJournalMedia,
  addPhotoAttachment,
  addPhotoElement,
  attachPhotoAndPlaceOnPage,
  createCutoutElement,
  deleteScrapbookElement,
  diaryMediaItems,
  layerScrapbookElement,
  moveScrapbookElement,
  removeJournalMedia,
  removePhotoAttachment,
  resizeScrapbookElement,
  rotateScrapbookElement
} from "./systems/ScrapbookComposer.js";
import {
  createDefaultRoomState,
  currentVinylTrack,
  moveRoomPlayer,
  nearestRoomInteraction,
  roomInteractions,
  roomSpawn,
  selectVinylRecord,
  toggleRoomLamp,
  vinylPlayerActions,
  vinylRecords,
  vinylRecordsFromAudioFiles,
  withCustomVinylCover,
  type RoomInteraction,
  type VinylRecord
} from "./systems/MujiRoom.js";
import { SaveManager } from "./systems/SaveManager.js";
import type { MusicScene } from "./systems/SceneMusic.js";
import { SupabaseSync } from "./systems/SupabaseSync.js";
import { emptyTendencies } from "./systems/TendencySystem.js";
import {
  renderDialoguePortrait,
  renderDialoguePortraits,
  renderReflection,
  renderReflectionChoice,
  renderRpgDialogue,
  renderVnDialogue,
  type DialoguePortrait,
  type DialoguePortraitRenderModel
} from "./systems/PresentationRenderer.js";

type ForestNode = (AuthoredForestEntry | DiaryForestMemory) & { radius?: number; placementSlotId?: string };
type LabisDialogueLine = { speaker: string; text: string };
type LabisDialogueAfter = "motor-choice" | "photo-choice" | "filter-choice" | "finish-echo" | "show-reflection" | "finish-chicken-cake" | null;
type LabisOverlayMode = "dialogue" | "choice" | "vignette" | "reflection" | null;
type March30OverlayMode = "dialogue" | "reflection" | "response" | "closing" | null;
type AuthoredOverlayMode = "dialogue" | "choice" | "response" | null;
type March30PortraitPropId = "gift" | "waterGun" | "ordinaryKeychain" | "phoneCharm";

const propPortraitSheetDimensions: Record<March30PortraitPropId, { w: number; h: number }> = {
  gift: { w: 1536, h: 1024 },
  waterGun: { w: 1280, h: 1229 },
  ordinaryKeychain: { w: 1278, h: 1230 },
  phoneCharm: { w: 1024, h: 1536 }
};

const MARCH30_MATERIAL_SCALE = 1.2;
const MARCH30_LARGE_MATERIAL_SCALE = 2;

const assets = {
  forest: "assets/forest.png",
  bakery: "assets/bakery.png",
  labis: "assets/labis-july19.png",
  muji: "assets/muji-sheet.png",
  friend: "assets/330/111.png",
  room: "assets/muji-room.png",
  roomFallback: "assets/room-panel.jpg",
  map: "assets/map-panel.jpg",
  timeline: "assets/timeline-panel.jpg"
};

function img(src: string): HTMLImageElement {
  const image = new Image();
  image.src = src;
  return image;
}

export class WalkBackHomeApp {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private stage: HTMLElement;
  private topNav: HTMLElement;
  private hud: HTMLElement;
  private toast: HTMLElement;
  private musicPlayer: HTMLElement;
  private overlay: HTMLElement;
  private input: InputManager;
  private audio = new AudioManager();
  private account = new AccountManager();
  private save = new SaveManager();
  private cloudSync = new SupabaseSync(loadAppConfig());
  private particles = new ParticleSystem();
  private images = {
    forest: img(assets.forest),
    bakery: img(assets.bakery),
    labis: img(assets.labis),
    muji: img(assets.muji),
    friend: img(assets.friend),
    room: img(assets.roomFallback)
  };
  private scene: SceneId = "title";
  private player: Point = { x: 880, y: 690 };
  private facing = 0;
  private frame = 0;
  private last = performance.now();
  private activeDoor: ForestNode | null = null;
  private currentDoor: ForestNode | null = null;
  private activeObject = "";
  private activeRoomInteraction: SceneInteraction | null = null;
  private lastHudHtml = "";
  private diaryEntries: DiaryEntry[] = [];
  private legacyArtifacts: string[] = [];
  private tendencies: Tendencies = emptyTendencies();
  private walkedThroughMemories = new Set<string>();
  private visitedMemories = new Set<string>();
  private choices: string[] = [];
  private readMemories = new Set<string>();
  private selectedChapter = "Yumido Bread";
  private activeScrapbookEntryId = "";
  private selectedScrapbookElementId = "";
  private journalMoreMenuOpen = false;
  private selectedJournalMediaId = "";
  private pendingJournalMediaDeleteId = "";
  private journalCropMediaId = "";
  private journalCropDrag: { mode: string; startX: number; startY: number; startCrop: DiaryMediaCrop } | null = null;
  private selectedReflectionNoteId = "";
  private selectedTimelineEntryIds = new Set<string>();
  private timelineDeleteConfirmOpen = false;
  private timelineSort: DiaryTimelineSort = "date-desc";
  private timelineSearch = "";
  private timelineKindFilter: TimelineMemoryKindFilter = "all";
  private timelineDateFilter = "";
  private timelineDateScope: TimelineDateScope = "all";
  private timelineFilterAppliedMessage = "";
  private journalMode: "timeline" | "books" | "reader" = "timeline";
  private journalReturnSnapshot: JournalReturnSnapshot | null = null;
  private chapterDiaryReturnId = "";
  private selectedTimelineMonthKey = "";
  private selectedBooksYear = "";
  private selectedBooksMonthKey = "";
  private monthlyCovers: DiaryLibraryState["monthlyCovers"] = {};
  private selectedForestMonthKey = "";
  private timelineVisibleCount = journalBatchSize;
  private scrapbookDrag: { elementId: string; entryId: string; offsetX: number; offsetY: number } | null = null;
  private diaryAutosaveTimer = 0;
  private journalEditorEntryId = "";
  private journalEditorSnapshot: DiaryLibraryState | null = null;
  private journalEditorIsNew = false;
  private journalEditorDirty = false;
  private journalAudioRecorder: JournalAudioRecorder | null = null;
  private journalAudioTimer = 0;
  private pendingJournalAudio = new Map<string, PendingJournalAudio[]>();
  private journalMediaObjectUrls = new Map<string, string>();
  private journalMediaResolution = new Map<string, "loading" | "missing">();
  private availableVinylRecords: VinylRecord[] = vinylRecords;
  private musicLibrary: PersonalMusicLibraryState = { version: 1, savedAt: new Date().toISOString(), tracks: [] };
  private personalPlayer: PersonalPlayerState = createDefaultPersonalPlayerState();
  private musicBlobStore = new MusicBlobStore();
  private journalMediaBlobStore = new JournalMediaBlobStore();
  private recordsPanelOpen = false;
  private recordsSongSheetOpen = false;
  private recordsMoreMenuOpen = false;
  private recordsScrollTop = 0;
  private recordsSheetScrollTop = 0;
  private recordsRenderToken = 0;
  private selectedRecordIds = new Set<string>();
  private pendingBatchDelete = false;
  private activeRecordMenuTrackId = "";
  private pendingDeleteTrackId = "";
  private backupSyncOperation: "push" | "pull" | null = null;
  private backupSyncFeedback: { tone: "info" | "success" | "error"; message: string } | null = null;
  private lyricsDrag: { offsetX: number; offsetY: number } | null = null;
  private lyricsResize: { startX: number; startY: number; startWidth: number; startHeight: number } | null = null;
  private pendingPersonalSeek: number | null = null;
  private bundledLyricsLoader = new BundledLyricsLoader();
  private bundledLyricsRuntime = new Map<string, { identity: string; lines: SyncedLyricLine[] }>();
  private bundledLyricsRequestToken = 0;
  private lrclibLyricsProvider = new LrclibLyricsProvider();
  private lrclibLyricsRuntime = new Map<string, { identity: string; source: "lrclib"; lines: SyncedLyricLine[] }>();
  private lrclibLyricsRequestToken = 0;
  private forceTouchControls = false;
  private settings = { rain: true, muted: false, volume: 0.45, compact: false, reducedMotion: false, musicEnabled: true, musicScene: "bakery" as MusicScene };
  private room: RoomJourneyState = createDefaultRoomState();
  private reflectionWall: ReflectionWallState = createReflectionWallState();
  private reflectionWallView: ReflectionWallView = "wall";
  private reflectionWallFilter: ReflectionWallFilter = "all";
  private reflectionWallSort: ReflectionWallSort = "manual";
  private reflectionWallSearch = "";
  private reflectionWallDrag: { noteId: string; offsetX: number; offsetY: number } | null = null;
  private chapterProgress = new Map<string, ChapterProgress>();
  private chapterMemoryRun: ChapterMemoryExperienceRun | null = null;
  private dialogue = new DialogueSystem(bakeryChapter.dialogue);
  private labisCutscene: CutsceneSystem | null = null;
  private labisDialogueOpen = false;
  private labisReplayMode = false;
  private labisLessonChoiceIndex = -1;
  private labisLessonLeadLines: string[] = [];
  private labisOverlayMode: LabisOverlayMode = null;
  private labisDialogueQueue: LabisDialogueLine[] = [];
  private labisDialogueIndex = 0;
  private labisDialogueAfter: LabisDialogueAfter = null;
  private labisActiveChoice: LabisChoicePoint["id"] | null = null;
  private labisActiveEcho: LabisEcho | null = null;
  private labisVignetteStartedAt = 0;
  private labisReflectionLines: string[] = [];
  private labisExitAfterReflection = false;
  private labisImages = new Map<string, HTMLImageElement>();
  private march30Images = new Map<string, HTMLImageElement>();
  private march30Cutscene: CutsceneSystem | null = null;
  private march30Mode: "main" | "echo" | null = null;
  private march30ReplayMode = false;
  private march30OverlayMode: March30OverlayMode = null;
  private march30ReflectionIndex = 0;
  private march30ReflectionResponse = "";
  private authoredCutscene: CutsceneSystem | null = null;
  private authoredMode: "main" | "echo" | null = null;
  private authoredReplayMode = false;
  private authoredOverlayMode: AuthoredOverlayMode = null;
  private authoredCheckpointId = "";
  private authoredReflectionResponse = "";
  private authoredImages = new Map<string, HTMLImageElement>();
  private sceneImages = new Map<string, HTMLImageElement>();
  private sceneOrientation: SceneOrientation = "landscape";
  private sceneLayoutLoadPromise: Promise<void> = Promise.resolve();
  private completedMemoryEvents = new Set<string>();
  private chapterTriggerSessions = new Map<string, ChapterTriggerSession>();
  private ending: Ending | null = null;

  constructor(private root: HTMLElement) {
    root.innerHTML = `
      <div class="game-shell">
        <header class="top-menu">
          <div class="top-menu-title"><strong>Walk Back Home</strong><span>A gentle walk through memories that still glow.</span></div>
          <nav class="top-actions"></nav>
        </header>
        <main class="stage-wrap">
          <canvas width="960" height="540" aria-label="Walk Back Home playable scene"></canvas>
          <div class="rotate-hint" aria-hidden="true"></div>
          <div class="hud"></div>
          <div class="toast" role="status" aria-live="polite"></div>
          <div class="music-player" aria-label="Scene music player"></div>
          <div class="overlay"></div>
        </main>
      </div>`;
    this.stage = root.querySelector(".stage-wrap")!;
    this.topNav = root.querySelector(".top-actions")!;
    this.canvas = root.querySelector("canvas")!;
    this.ctx = this.canvas.getContext("2d")!;
    this.hud = root.querySelector(".hud")!;
    this.toast = root.querySelector(".toast")!;
    this.musicPlayer = root.querySelector(".music-player")!;
    this.overlay = root.querySelector(".overlay")!;
    this.input = new InputManager(root);
    this.input.mountTouchControls(() => this.interact(), root.querySelector<HTMLElement>(".game-shell")!);
    this.renderTopNav();
    this.canvas.addEventListener("click", (event) => this.handleCanvasClick(event));
    this.musicPlayer.addEventListener("click", (event) => {
      event.stopPropagation();
      this.handleClick(event);
    });
    root.addEventListener("click", (event) => this.handleClick(event));
    root.addEventListener("change", (event) => void this.handleChange(event));
    root.addEventListener("input", (event) => this.handleInput(event));
    root.addEventListener("pointerdown", (event) => this.handlePointerDown(event));
    root.addEventListener("pointermove", (event) => this.handlePointerMove(event));
    root.addEventListener("pointerup", () => {
      this.journalCropDrag = null;
      this.scrapbookDrag = null;
      this.overlay.querySelector<HTMLElement>(".wall-note[data-dragging=\"true\"]")?.removeAttribute("data-dragging");
      this.reflectionWallDrag = null;
      if (this.lyricsDrag || this.lyricsResize) this.autosave();
      this.lyricsDrag = null;
      this.lyricsResize = null;
    });
    root.addEventListener("pointerdown", (event) => {
      const actionTarget = (event.target as HTMLElement).closest<HTMLElement>("[data-action]");
      const action = actionTarget?.dataset.action ?? "";
      if (action && !this.resumeAfterRecordsClose(action)) return;
      void this.audio.ensurePlaying();
    }, { passive: true });
    root.addEventListener("keydown", () => void this.audio.ensurePlaying());
    this.applyAccountSession(this.account.current());
    this.bootstrapDiaryLibrary();
    void this.hydrateCloudAccount();
    void this.loadVinylManifest();
    this.images.room.addEventListener("error", () => {
      this.images.room.src = assets.roomFallback;
    }, { once: true });
    this.images.room.src = assets.room;
    this.preloadLabisAssets();
    this.preloadMarch30Assets();
    this.preloadApril06Assets();
    this.preloadSceneLayoutAssets();
    this.sceneLayoutLoadPromise = this.loadSavedSceneLayouts();
    this.audio.setVolume(this.settings.volume);
    this.audio.onTimeUpdate(() => this.handlePersonalTimeUpdate());
    this.audio.onDurationChange(() => this.refreshRecordsPlaybackUI());
    this.audio.onEnded(() => void this.handlePersonalTrackEnded());
    void this.audio.enable();
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) this.last = performance.now();
      else void this.audio.ensurePlaying();
    });
    window.addEventListener("pagehide", () => {
      this.journalAudioRecorder?.cancel();
      this.clearJournalAudioTimer();
      this.journalMediaBlobStore.revokeAllObjectUrls();
      this.journalMediaObjectUrls.clear();
    });
    requestAnimationFrame((time) => this.loop(time));
  }

  private handleClick(event: Event): void {
    if ((event.target as HTMLElement).closest("audio")) return;
    const target = (event.target as HTMLElement).closest<HTMLElement>("[data-action]");
    if (!target) return;
    const action = target.dataset.action;
    if (!action) return;
    if (this.resumeAfterRecordsClose(action)) void this.audio.ensurePlaying();
    if (action === "close" && this.isJournalEditorActive()) {
      this.handleJournalEditorBack();
      return;
    }
    if (action === "home") this.showHome();
    if (action === "new") this.newMemory();
    if (action === "continue") this.loadAutosave();
    if (action === "settings") this.showSettings();
    if (action === "credits") this.showCredits();
    if (action === "forest") {
      this.returnToForest();
    }
    if (action === "menu") this.showSettings();
    if (action === "open-timeline") {
      this.handleJournalEditorBack();
      return;
    }
    if (action === "journal-timeline") this.showTimeline();
    if (action === "journal-books") this.showMonthlyBooks();
    if (action === "journal-month-prev") this.moveJournalMonth(-1);
    if (action === "journal-month-next") this.moveJournalMonth(1);
    if (action === "journal-filter-year") this.filterTimelineYear(target.dataset.year ?? "");
    if (action === "journal-books-year") this.selectBooksYear(target.dataset.year ?? "");
    if (action === "journal-show-more") this.showMoreTimelineEntries();
    if (action === "open-month-book") this.openMonthlyBook(target.dataset.month ?? "");
    if (action === "export-month-pdf") void this.exportMonthlyPdf(target.dataset.month ?? "");
    if (action === "open-map") this.showMap();
    if (action === "forest-month-prev") this.moveForestMonth(-1);
    if (action === "forest-month-next") this.moveForestMonth(1);
    if (action === "open-room") this.enterMujiRoom();
    if (action === "new-diary-entry") this.openNewDiaryPage();
    if (action === "open-diary-editor") this.showTimeline();
    if (action === "edit-chapter-diary") {
      this.chapterDiaryReturnId = target.dataset.chapter ?? "";
      this.showDiaryEditor(target.dataset.id ?? "");
      return;
    }
    if (action === "open-diary-page") {
      this.captureJournalReturnSnapshot();
      this.showDiaryReader(target.dataset.id ?? "");
      return;
    }
    if (action === "journal-reader-back") {
      this.restoreJournalOrigin();
      return;
    }
    if (action === "save-diary-entry") {
      void this.saveDiaryEntry(target.dataset.id);
      return;
    }
    if (action === "journal-record-audio") {
      void this.startJournalAudioRecording();
      return;
    }
    if (action === "journal-audio-stop") {
      void this.stopJournalAudioRecording();
      return;
    }
    if (action === "journal-audio-cancel") {
      this.cancelJournalAudioRecording();
      return;
    }
    if (action === "journal-audio-pause") {
      this.journalAudioRecorder?.pause();
      this.refreshJournalAudioRecordingUi();
      return;
    }
    if (action === "journal-audio-resume") {
      this.journalAudioRecorder?.resume();
      this.refreshJournalAudioRecordingUi();
      return;
    }
    if (action === "edit-diary-entry") {
      this.journalMoreMenuOpen = false;
      this.captureJournalReturnSnapshot();
      this.showDiaryEditor(target.dataset.id);
    }
    if (action === "journal-edit-current") {
      this.journalMoreMenuOpen = false;
      this.captureJournalReturnSnapshot();
      this.showDiaryEditor(target.dataset.id);
    }
    if (action === "journal-more-menu") {
      this.journalMoreMenuOpen = !this.journalMoreMenuOpen;
      const entryId = target.dataset.id ?? "";
      if (this.overlay.querySelector(".journal-reading-page")) this.showDiaryReader(entryId);
      else this.showDiaryEditor(entryId);
    }
    if (action === "journal-add-inline-media") {
      this.overlay.querySelector<HTMLInputElement>("#diary-mobile-media-input")?.click();
      return;
    }
    if (action === "journal-media-select") {
      this.selectJournalMedia(target.dataset.media ?? "");
      return;
    }
    if (action === "journal-audio-edit") {
      this.selectJournalMedia(target.dataset.media ?? "");
      return;
    }
    if (action === "journal-audio-delete-confirm") {
      void this.confirmJournalMediaDelete();
      return;
    }
    if (action === "journal-audio-delete-cancel") {
      this.cancelJournalMediaDelete();
      return;
    }
    if (action === "journal-media-remove") {
      this.removeSelectedJournalMedia(target.dataset.media ?? "");
      return;
    }
    if (action === "journal-media-crop") {
      this.cropSelectedJournalMedia(target.dataset.media ?? "");
      return;
    }
    if (action === "journal-crop-apply") {
      this.applyJournalCrop(target.dataset.media ?? "");
      return;
    }
    if (action === "journal-crop-cancel") {
      this.closeJournalCropModal();
      return;
    }
    if (action === "journal-crop-reset") {
      this.resetJournalCrop(target.dataset.media ?? "");
      return;
    }
    if (action === "journal-crop-ratio-original") {
      this.setJournalCropOriginalRatio();
      return;
    }
    if (action === "journal-crop-ratio-free") {
      this.showToast("Free crop mode enabled");
      return;
    }
    if (action === "journal-discard-confirm") {
      void this.discardJournalEditor();
      return;
    }
    if (action === "journal-discard-cancel") {
      this.cancelJournalEditorDiscard();
      return;
    }
    if (action === "change-month-cover") {
      this.overlay.querySelector<HTMLInputElement>("#month-cover-input")?.click();
      return;
    }
    if (action === "delete-diary-entry") this.deleteDiaryEntry(target.dataset.id ?? "");
    if (action === "timeline-request-delete-entry") this.requestDeleteTimelineEntry(target.dataset.id ?? "");
    if (action === "timeline-apply-filters") this.applyTimelineFilters();
    if (action === "timeline-clear-filters") this.clearTimelineFilters();
    if (action === "timeline-pick-date") this.pickTimelineDate(target.dataset.date ?? "");
    if (action === "timeline-select-all") this.selectAllTimelineEntries();
    if (action === "timeline-clear-selected") this.clearTimelineSelection();
    if (action === "timeline-request-delete-selected") this.requestDeleteSelectedTimelineEntries();
    if (action === "timeline-cancel-delete-selected") {
      this.timelineDeleteConfirmOpen = false;
      this.showTimeline();
    }
    if (action === "timeline-confirm-delete-selected") this.deleteSelectedTimelineEntries();
    if (action === "show-import-diary") this.showImportDiary();
    if (action === "import-diary-lines") this.importDiaryLines();
    if (action === "add-photo-to-scrapbook") this.addPhotoToScrapbook(target.dataset.photo ?? "");
    if (action === "cutout-photo") this.cutoutPhotoOnPage(target.dataset.photo ?? "");
    if (action === "remove-photo-attachment") this.removePhotoFromPage(target.dataset.photo ?? "");
    if (action === "select-scrapbook-element") this.selectScrapbookElement(target.dataset.element ?? "");
    if (action === "scrapbook-move") this.nudgeSelectedScrapbookElement(Number(target.dataset.dx ?? 0), Number(target.dataset.dy ?? 0));
    if (action === "scrapbook-resize") this.scaleSelectedScrapbookElement(Number(target.dataset.delta ?? 0));
    if (action === "scrapbook-rotate") this.rotateSelectedScrapbookElement(Number(target.dataset.delta ?? 0));
    if (action === "scrapbook-layer") this.layerSelectedScrapbookElement(target.dataset.direction as "front" | "back");
    if (action === "scrapbook-delete") this.deleteSelectedScrapbookElement();
    if (action === "set-memory-kind") this.setDiaryMemoryKind(target.dataset.id ?? "", target.dataset.kind as MemoryKind);
    if (action === "room-window") this.roomWindow();
    if (action === "room-lamp") this.roomLamp();
    if (action === "room-letter") this.openReflectionWall();
    if (action === "save-room-reflection") this.saveRoomReflection();
    if (action === "reflection-wall") this.openReflectionWall();
    if (action === "reflection-note-new") this.showReflectionComposer();
    if (action === "reflection-note-save") this.saveReflectionComposer(target.dataset.note ?? "");
    if (action === "reflection-note-select") this.selectReflectionWallNote(target.dataset.note ?? "");
    if (action === "reflection-note-open") this.showReflectionDetail(target.dataset.note ?? "");
    if (action === "reflection-note-edit") this.showReflectionComposer(target.dataset.note ?? "");
    if (action === "reflection-note-delete") this.deleteReflectionWallNote(target.dataset.note ?? "");
    if (action === "reflection-note-drag") this.showToast("Hold the move handle and drag the note.");
    if (action === "reflection-note-pin") this.toggleReflectionFlag(target.dataset.note ?? "", "pinned");
    if (action === "reflection-note-favorite") this.toggleReflectionFlag(target.dataset.note ?? "", "favorite");
    if (action === "reflection-note-paper") this.changeReflectionNotePaper(target.dataset.note ?? "", target.dataset.style ?? "");
    if (action === "reflection-keep-chapter") this.keepChapterReflection(target.dataset.chapter ?? "", target.dataset.text ?? "");
    if (action === "reflection-wall-view") this.setReflectionWallView(target.dataset.view as ReflectionWallView);
    if (action === "reflection-wall-sort") this.setReflectionWallSort(target.dataset.sort as ReflectionWallSort);
    if (action === "reflection-wall-filter") this.setReflectionWallFilter(target.dataset.filter as ReflectionWallFilter);
    if (action === "room-diary") this.roomDiary();
    if (action === "room-records") this.showRecords();
    if (action === "close-records") this.closeRecords();
    if (action === "room-residue") this.inspectRoomResidue();
    if (action === "select-vinyl") void this.selectVinyl(target.dataset.record ?? "");
    if (action === "vinyl-pause") void this.pauseVinyl();
    if (action === "music-prev") void this.playAdjacentPersonalTrack(-1);
    if (action === "music-next") void this.playAdjacentPersonalTrack(1);
    if (action === "music-shuffle") this.toggleMusicShuffle();
    if (action === "music-repeat-one") this.toggleMusicRepeatOne();
    if (action === "music-visual") this.setMusicVisualMode(target.dataset.mode === "cover" ? "cover" : "vinyl");
    if (action === "toggle-record-artwork") this.toggleMusicVisualMode();
    if (action === "toggle-records-more-menu") {
      this.preserveRecordsScroll();
      this.recordsMoreMenuOpen = !this.recordsMoreMenuOpen;
      this.activeRecordMenuTrackId = "";
      void this.showRecords();
    }
    if (action === "toggle-records-song-sheet") {
      this.preserveRecordsScroll();
      this.recordsSongSheetOpen = !this.recordsSongSheetOpen;
      this.recordsMoreMenuOpen = false;
      this.activeRecordMenuTrackId = "";
      void this.showRecords();
    }
    if (action === "toggle-record-song-menu") {
      this.preserveRecordsScroll();
      const trackId = target.dataset.track ?? "";
      this.activeRecordMenuTrackId = this.activeRecordMenuTrackId === trackId ? "" : trackId;
      this.recordsMoreMenuOpen = false;
      void this.showRecords();
    }
    if (action === "request-delete-user-track") this.requestDeleteUserTrack(target.dataset.track ?? "");
    if (action === "toggle-record-selection") this.toggleRecordSelection(target.dataset.track ?? "");
    if (action === "records-select-all") this.selectAllRecords();
    if (action === "records-clear-selection") this.clearRecordSelection();
    if (action === "records-request-batch-delete") this.requestBatchDelete();
    if (action === "records-cancel-batch-delete") this.cancelBatchDelete();
    if (action === "records-confirm-batch-delete") void this.confirmBatchDelete();
    if (action === "records-apply-batch-edit") this.applyBatchRecordEdit();
    if (action === "cancel-delete-user-track") {
      this.pendingDeleteTrackId = "";
      this.selectedRecordIds.clear();
      this.pendingBatchDelete = false;
      void this.showRecords();
    }
    if (action === "confirm-delete-user-track") void this.confirmDeleteUserTrack();
    if (action === "toggle-floating-lyrics") this.toggleFloatingLyrics();
    if (action === "floating-lyrics-reset") this.rehomeFloatingLyrics();
    if (action === "delete-user-track") this.requestDeleteUserTrack(target.dataset.track ?? "");
    if (action === "remove-player-background") void this.removePlayerBackground();
    if (action === "backup-sync") this.showBackupSync();
    if (action === "download-backup") void this.downloadBackup();
    if (action === "reset-journey") this.resetJourney();
    if (action === "account-sign-out") void this.signOutAccount();
    if (action === "account-claim-local") this.claimLocalDataForAccount();
    if (action === "account-google-sign-in") void this.signInWithGoogle();
    if (action === "cloud-sync-push") void this.pushCloudSync();
    if (action === "cloud-sync-pull") void this.pullCloudSync();
    if (action === "compact") this.toggleCompact();
    if (action === "fullscreen") this.toggleFullscreen();
    if (action === "rain") this.toggleRain();
    if (action === "music") this.toggleSceneMusic();
    if (action === "toggle-touch-controls") this.toggleTouchControls();
    if (action === "edit-touch-controls") this.beginTouchControlEdit();
    if (action === "save-touch-controls") {
      this.input.saveTouchControlEdit();
      this.showSettings();
    }
    if (action === "cancel-touch-control-edit") {
      this.input.cancelTouchControlEdit();
      this.showSettings();
    }
    if (action === "reset-touch-controls") {
      this.input.resetTouchControlEdit();
      this.showTouchControlEditor();
    }
    if (action === "close") {
      this.overlay.classList.remove("dialogue-open");
      this.overlay.innerHTML = "";
      this.recordsPanelOpen = false;
      this.recordsSongSheetOpen = false;
      this.recordsMoreMenuOpen = false;
      this.activeRecordMenuTrackId = "";
      this.pendingDeleteTrackId = "";
      this.labisLessonChoiceIndex = -1;
      this.labisLessonLeadLines = [];
      this.updatePersonalMusicOverlay();
      this.syncGameplayChromeVisibility();
      this.showToast("Closed");
    }
    if (action === "enter-door") {
      const doorId = target.dataset.door;
      if (doorId) this.currentDoor = this.allDoors().find((door) => door.id === doorId) ?? this.currentDoor;
      void this.enterCurrentMemory();
    }
    if (action === "labis-replay") this.startLabisMemory(true);
    if (action === "labis-dialogue-next") this.advanceLabisDialogue();
    if (action === "labis-choice") this.chooseLabisChoice(target.dataset.choice ?? "");
    if (action === "labis-vignette-close") this.closeLabisKeyframeVignette();
    if (action === "labis-reflection-close") this.closeLabisReflection();
    if (action === "march30-dialogue-next") this.advanceMarch30Dialogue();
    if (action === "authored-dialogue-next") this.advanceAuthoredDialogue();
    if (action === "authored-reflection-choice") this.chooseAuthoredChoice(target.dataset.choice ?? "");
    if (action === "authored-reflection-next") this.advanceAuthoredReflection();
    if (action === "march30-reflection-choice") this.chooseMarch30Reflection(target.dataset.choice ?? "");
    if (action === "march30-reflection-next") this.advanceMarch30Reflection();
    if (action === "march30-closing-close") {
      this.march30OverlayMode = null;
      this.overlay.innerHTML = "";
      this.autosave();
    }
    if (action === "finish-memory") this.finishBakery();
    if (action === "choice") this.choose(target.dataset.choice ?? "");
  }

  private resumeAfterRecordsClose(action: string): boolean {
    return !["close-records", "close", "vinyl-pause", "toggle-records-more-menu", "toggle-records-song-sheet"].includes(action);
  }

  private handleCanvasClick(event: MouseEvent): void {
    if (this.overlay.innerHTML.trim()) return;
    const rect = this.canvas.getBoundingClientRect();
    const point = this.canvasPointToScenePoint(event.clientX - rect.left, event.clientY - rect.top);
    if (this.scene === "muji-room") {
      const interaction = this.roomInteractionAtPoint(point);
      if (interaction) {
        this.activateRoomInteraction(interaction);
        return;
      }
    }
  }

  private canvasPointToScenePoint(x: number, y: number): Point {
    const sx = (x / this.canvas.getBoundingClientRect().width) * this.canvas.width;
    const sy = (y / this.canvas.getBoundingClientRect().height) * this.canvas.height;
    if (this.scene === "muji-room" || this.scene === "title") return { x: sx, y: sy };
    const layout = this.currentSceneLayout();
    const viewport = this.sceneViewport(layout);
    const camera = this.sceneCamera(layout, viewport.w, viewport.h);
    const cameraX = camera.x;
    const cameraY = camera.y;
    return { x: cameraX + sx, y: cameraY + sy };
  }

  private roomInteractionAtPoint(point: Point): SceneInteraction | RoomInteraction | null {
    const interactions = this.currentSceneLayout("muji-room").orientation === "landscape" ? roomInteractions : this.currentSceneLayout("muji-room").interactions;
    return interactions
      .map((interaction) => ({ interaction, distance: Math.hypot(point.x - interaction.x, point.y - interaction.y) }))
      .filter(({ interaction, distance }) => distance <= Math.max(76, interaction.radius))
      .sort((a, b) => a.distance - b.distance)[0]?.interaction ?? null;
  }

  private activateRoomInteraction(interaction: SceneInteraction | RoomInteraction): void {
    if (interaction.id === "door") return this.returnToForest();
    if (interaction.id === "journal") return this.roomDiary();
    if (interaction.id === "lamp") return this.roomLamp();
    if (interaction.id === "window") return this.roomWindow();
    if (interaction.id === "records") {
      void this.showRecords();
      return;
    }
    if (interaction.id === "residue") return this.inspectRoomResidue();
    if (interaction.id === "reflection") return this.openReflectionWall();
  }

  private preloadLabisAssets(): void {
    for (const src of labisProductionAssetPaths) {
      const image = img(src);
      image.addEventListener("error", () => {
        this.labisImages.delete(src);
      }, { once: true });
      this.labisImages.set(src, image);
    }
  }

  private preloadMarch30Assets(): void {
    for (const asset of Object.values(march30Assets)) {
      const image = img(asset.path);
      image.addEventListener("error", () => this.march30Images.delete(asset.path), { once: true });
      this.march30Images.set(asset.path, image);
    }
  }

  private preloadApril06Assets(): void {
    for (const asset of Object.values(april06Assets)) {
      const image = img(asset.path);
      image.addEventListener("error", () => this.authoredImages.delete(asset.path), { once: true });
      this.authoredImages.set(asset.path, image);
    }
  }

  private preloadSceneLayoutAssets(): void {
    for (const sceneId of Object.keys(sceneLayoutManifest)) {
      this.sceneImage(getSceneLayout(sceneId, "landscape"));
      this.sceneImage(getSceneLayout(sceneId, "portrait"));
    }
  }

  private async loadSavedSceneLayouts(): Promise<void> {
    await loadSceneLayoutOverrides();
    this.preloadSceneLayoutAssets();
    this.player = this.safeLayoutPoint(this.player, this.hasSceneLayout(this.scene) ? this.currentSceneLayout() : this.currentSceneLayout("forest"));
  }

  private currentSceneLayout(sceneId: SceneId | SceneLayoutId = this.scene): SceneLayout {
    const id = this.hasSceneLayout(sceneId) ? sceneId : "forest";
    return getSceneLayout(id, this.sceneOrientation);
  }

  private hasSceneLayout(sceneId: string): boolean {
    return Boolean(sceneLayoutManifest[sceneId]);
  }

  private isAuthoredRuntimeScene(): boolean {
    return !["title", "forest", "bakery", "labis", "muji-room", "ending"].includes(this.scene) && this.hasSceneLayout(this.scene);
  }

  private sceneInteractionById(layout: SceneLayout, id: string): SceneInteraction | null {
    return layout.interactions.find((interaction) => interaction.id === id) ?? null;
  }

  private roomInteractionById(layout: SceneLayout, id: RoomInteraction["id"]): SceneInteraction | RoomInteraction | null {
    const interactions = layout.orientation === "landscape" ? roomInteractions : layout.interactions;
    return interactions.find((interaction) => interaction.id === id) ?? null;
  }

  private labisDiaryMemoryInteraction(layout: SceneLayout): SceneInteraction | null {
    if (layout.orientation !== "landscape") return this.sceneInteractionById(layout, "diary-memory");
    return this.sceneInteractionById(layout, "diary-memory") ?? {
      id: "diary-memory",
      label: "diary memory",
      x: labisDiaryMemorySpot.x,
      y: labisDiaryMemorySpot.y,
      radius: labisDiaryMemorySpot.radius
    };
  }

  private sceneImage(layout: SceneLayout): HTMLImageElement {
    const existing = this.sceneImages.get(layout.asset);
    if (existing) return existing;
    const image = img(layout.asset);
    this.sceneImages.set(layout.asset, image);
    return image;
  }

  private sceneViewport(layout: SceneLayout): { w: number; h: number } {
    if (layout.orientation === "portrait") return { w: layout.size.w, h: layout.size.h };
    return { w: Math.min(960, layout.size.w), h: Math.min(540, layout.size.h) };
  }

  private sceneCamera(layout: SceneLayout, viewportW: number, viewportH: number): Point {
    if (layout.orientation === "portrait") return { x: 0, y: 0 };
    const yBias = layout.sceneId === "forest" ? 390 : 360;
    return {
      x: Math.max(0, Math.min(layout.size.w - viewportW, this.player.x - viewportW / 2)),
      y: Math.max(0, Math.min(layout.size.h - viewportH, this.player.y - yBias))
    };
  }

  private syncSceneOrientation(): void {
    const next = selectSceneOrientation({ width: window.innerWidth, height: window.innerHeight });
    if (next === this.sceneOrientation) return;
    const previousLayout = this.hasSceneLayout(this.scene) ? this.currentSceneLayout() : null;
    this.sceneOrientation = next;
    if (this.scene === "title" && next === "portrait") {
      this.scene = "forest";
      this.player = { ...this.currentSceneLayout("forest").spawn };
    }
    if (this.hasSceneLayout(this.scene) && previousLayout) {
      const nextLayout = this.currentSceneLayout();
      this.player = this.safeMappedPoint(this.player, previousLayout, nextLayout);
    }
    this.lastHudHtml = "";
  }

  private safeMappedPoint(point: Point, from: SceneLayout, to: SceneLayout): Point {
    const mapped = {
      x: (point.x / from.size.w) * to.size.w,
      y: (point.y / from.size.h) * to.size.h
    };
    return this.safeLayoutPoint(mapped, to);
  }

  private safeLayoutPoint(point: Point, layout: SceneLayout): Point {
    const clamped = {
      x: Math.max(0, Math.min(layout.size.w, point.x)),
      y: Math.max(0, Math.min(layout.size.h, point.y))
    };
    return inAnyRect(clamped, layout.obstacles) ? { ...layout.spawn } : clamped;
  }

  private loop(time: number): void {
    const dt = Math.min(0.033, (time - this.last) / 1000);
    this.last = time;
    this.syncSceneOrientation();
    const input = this.input.read();
    if (input.interact) this.interact();
    if (this.scene === "forest") this.updateForest(input.x, input.y, dt);
    if (this.scene === "bakery") this.updateBakery(input.x, input.y, dt);
    if (this.scene === "labis") this.updateLabis(input.x, input.y, dt);
    if (this.scene === "muji-room") this.updateMujiRoom(input.x, input.y, dt);
    if (this.scene === "330-corridor") this.updateMarch30Scene(input.x, input.y, dt);
    else if (this.isAuthoredRuntimeScene()) this.updateAuthoredScene(input.x, input.y, dt);
    this.draw(time);
    this.syncPersonalPlaybackState();
    if (this.recordsPanelOpen) this.refreshRecordsPlaybackUI();
    this.updatePersonalMusicOverlay();
    requestAnimationFrame((next) => this.loop(next));
  }

  private newMemory(): void {
    this.scene = "forest";
    this.player = { ...this.currentSceneLayout("forest").spawn };
    this.currentDoor = null;
    this.ending = null;
    this.tendencies = emptyTendencies();
    this.walkedThroughMemories.clear();
    this.visitedMemories.clear();
    this.choices = [];
    this.readMemories.clear();
    this.completedMemoryEvents.clear();
    this.resetAuthoredRuntime();
    this.chapterMemoryRun = null;
    this.chapterTriggerSessions.clear();
    this.chapterProgress.clear();
    this.room = createDefaultRoomState();
    this.personalPlayer = { ...createDefaultPersonalPlayerState(), selectedTrackId: this.personalPlayer.selectedTrackId };
    this.overlay.classList.remove("dialogue-open");
    this.overlay.innerHTML = "";
    this.focusStage();
    this.applyAudioForCurrentScene();
    this.autosave();
  }

  private loadAutosave(): void {
    const diary = this.save.loadDiaryLibrary();
    const journey = this.save.loadJourney();
    if (diary || journey) {
      if (diary) this.applyDiaryLibrary(diary);
      if (journey) this.applyJourney(journey);
      this.showToast("Continued");
      this.focusStage();
      return;
    }
    const migrated = this.save.migrateLegacyAutosave();
    if (migrated.diary.entries.length || migrated.journey.visitedMemories.length || migrated.journey.walkedThroughMemories.length) {
      this.applyDiaryLibrary(migrated.diary);
      this.applyJourney(migrated.journey);
      this.showToast("Continued");
      this.focusStage();
    } else {
      this.newMemory();
      this.showToast("Begin Journey");
    }
  }

  private bootstrapDiaryLibrary(): void {
    this.musicLibrary = this.save.loadMusicLibrary() ?? this.musicLibrary;
    this.personalPlayer = { ...this.personalPlayer, ...(this.save.loadPersonalPlayer() ?? {}) };
    this.reflectionWall = this.save.loadReflectionWall() ?? this.reflectionWall;
    const saved = this.save.loadDiaryLibrary();
    if (saved) {
      this.applyDiaryLibrary(seedAuthoredChapterDiaryEntries(saved));
      this.save.saveDiaryLibrary(this.makeDiaryLibrary());
      return;
    }
    const legacy = this.save.loadAutosave();
    if (!legacy?.diaryEntries?.length) {
      this.applyDiaryLibrary(seedAuthoredChapterDiaryEntries({ version: 1, savedAt: new Date().toISOString(), entries: [], legacyArtifacts: [] }));
      this.save.saveDiaryLibrary(this.makeDiaryLibrary());
      return;
    }
    const migrated = this.save.migrateLegacyAutosave();
    this.applyDiaryLibrary(seedAuthoredChapterDiaryEntries(migrated.diary));
    this.save.saveDiaryLibrary(this.makeDiaryLibrary());
  }

  private applyAccountSession(session = this.account.current(), reloadState = false): void {
    this.save = new SaveManager(session.ownerId);
    if (reloadState) this.loadAccountLocalState();
  }

  private loadAccountLocalState(): void {
    this.musicLibrary = this.save.loadMusicLibrary() ?? { version: 1, savedAt: new Date().toISOString(), tracks: [] };
    this.personalPlayer = { ...createDefaultPersonalPlayerState(), ...(this.save.loadPersonalPlayer() ?? {}) };
    this.normalizePersonalPlayerToggles();
    this.reflectionWall = this.save.loadReflectionWall() ?? createReflectionWallState();
    const diary = this.save.loadDiaryLibrary();
    if (diary) this.applyDiaryLibrary(seedAuthoredChapterDiaryEntries(diary));
    const journey = this.save.loadJourney();
    if (journey) this.applyJourney(journey);
    this.lastHudHtml = "";
  }

  private async hydrateCloudAccount(): Promise<void> {
    if (!this.cloudSync.isConfigured()) return;
    try {
      const session = await this.cloudSync.currentSession();
      if (!session) return;
      const accountSession = this.account.signInWithConfiguredProvider({ provider: "google", userId: session.userId, email: session.email });
      this.applyAccountSession(accountSession, true);
      this.showToast("Google account connected");
    } catch (error) {
      this.showToast(`Cloud auth unavailable · ${this.errorMessage(error)}`);
    }
  }

  private updateForest(x: number, y: number, dt: number): void {
    const layout = this.currentSceneLayout("forest");
    this.moveInLayout(x, y, dt, layout);
    this.activeDoor = this.allDoors().find((door) => Math.hypot(this.player.x - door.x, this.player.y - door.y) < (door.radius ?? 86)) ?? null;
  }

  private updateBakery(x: number, y: number, dt: number): void {
    const layout = this.currentSceneLayout("bakery");
    this.moveInLayout(x, y, dt, layout);
    const interaction = layout.interactions.find((item) => Math.hypot(this.player.x - item.x, this.player.y - item.y) < item.radius);
    this.activeObject = interaction?.label ?? "";
  }

  private updateAuthoredScene(x: number, y: number, dt: number): void {
    const layout = this.currentSceneLayout();
    if (this.scene === "406" && this.authoredCutscene) {
      if (this.authoredOverlayMode) {
        this.activeObject = "";
        return;
      }
      this.authoredCutscene.update(dt);
      if (this.authoredCutscene.currentDialogue) this.showAuthoredDialogue();
      else if (this.authoredCutscene.currentCheckpoint) this.showAuthoredChoice();
      if (this.authoredCutscene.completed) this.finishAuthoredCutscene();
      this.activeObject = "";
      return;
    }
    if (this.scene === "406" && this.authoredOverlayMode) {
      this.activeObject = "";
      return;
    }
    const trigger = layout.triggers.find((item) => {
      const rect = item.rect;
      return this.player.x >= rect.x && this.player.x <= rect.x + rect.w && this.player.y >= rect.y && this.player.y <= rect.y + rect.h;
    });
    if (this.scene === "406" && trigger?.id === "main-memory" && trigger.chapterId === april06Chapter.id && this.consumeChapterTrigger(april06Chapter.id)) {
      this.startAuthoredCutscene("main", false);
      return;
    }
    this.moveInLayout(x, y, dt, layout);
    const interaction = layout.interactions.find((item) => Math.hypot(this.player.x - item.x, this.player.y - item.y) < item.radius);
    const mainComplete = this.scene === "406" && this.completedMemoryEvents.has(april06Chapter.canonicalClosure.historicalEventId);
    const echo = mainComplete ? resolveSceneEchoAnchor(layout, "watergun-crossing") : null;
    const echoActive = echo ? Math.hypot(this.player.x - echo.x, this.player.y - echo.y) < echo.radius : false;
    const availableInteraction = interaction && (mainComplete || interaction.id === "exit" || interaction.id === "diary" || interaction.id === "diary memory") ? interaction : null;
    this.activeObject = echoActive ? "watergun-crossing" : availableInteraction?.id ?? "";
  }

  private startAuthoredCutscene(mode: "main" | "echo", replay: boolean): void {
    if (this.scene !== "406") return;
    const actions = mode === "main" ? april06MainMemoryActions : april06EchoActions;
    this.authoredCutscene = new CutsceneSystem(resolveApril06Actions(this.currentSceneLayout(), actions));
    this.authoredMode = mode;
    this.authoredReplayMode = replay;
    if (mode === "main") {
      this.startChapterMemoryRun(april06Chapter.id, april06Chapter.canonicalClosure.historicalEventId, replay ? "manual-replay" : "automatic");
    }
    this.authoredOverlayMode = null;
    this.authoredCheckpointId = "";
    this.authoredReflectionResponse = "";
    this.overlay.classList.remove("dialogue-open", "lightweight-presentation");
    this.overlay.innerHTML = "";
    this.showToast(mode === "main" ? (replay ? "Replaying the delivery" : "The lobby remembers a quick delivery") : "A morning echo crosses the path");
  }

  private showAuthoredDialogue(): void {
    const dialogue = this.authoredCutscene?.currentDialogue;
    if (!dialogue || this.authoredOverlayMode === "dialogue") return;
    this.authoredOverlayMode = "dialogue";
    this.overlay.classList.add("dialogue-open", "lightweight-presentation");
    this.overlay.innerHTML = renderRpgDialogue({ speaker: dialogue.speaker, text: dialogue.text, action: "authored-dialogue-next" });
    this.focusStage();
  }

  private advanceAuthoredDialogue(): void {
    if (this.authoredOverlayMode !== "dialogue") return;
    this.authoredCutscene?.advanceDialogue();
    this.authoredOverlayMode = null;
    this.overlay.classList.remove("dialogue-open", "lightweight-presentation");
    this.overlay.innerHTML = "";
  }

  private showAuthoredChoice(): void {
    const checkpoint = this.authoredCutscene?.currentCheckpoint;
    if (!checkpoint || this.authoredOverlayMode === "choice") return;

    const point = april06ReflectionChoices.find((item) => item.id === checkpoint);
    if (!point) {
      this.authoredCutscene?.resolveCheckpoint();
      return;
    }
    this.authoredCheckpointId = checkpoint;
    this.authoredOverlayMode = "choice";
    this.overlay.classList.add("dialogue-open", "lightweight-presentation");
    this.overlay.innerHTML = renderReflectionChoice({
      kicker: "04.06 · KTHO Lobby",
      title: "你想怎样记住这一段？",
      prompt: point.prompt,
      choices: point.choices.map((choice) => ({ id: choice.id, label: choice.label })),
      action: "authored-reflection-choice"
    });
    this.focusStage();
  }

  private chooseAuthoredChoice(choiceId: string): void {
    const point = april06ReflectionChoices.find((item) => item.id === this.authoredCheckpointId);
    const choice = point?.choices.find((item) => item.id === choiceId);
    if (!choice || !this.authoredCutscene?.currentCheckpoint) return;
    this.recordChapterExperienceChoice(
      april06Chapter.id,
      april06Chapter.canonicalClosure.historicalEventId,
      this.authoredReplayMode ? "manual-replay" : "automatic",
      choice
    );
    this.authoredReflectionResponse = choice.response;
    this.authoredOverlayMode = "response";
    this.overlay.classList.add("dialogue-open", "lightweight-presentation");
    this.overlay.innerHTML = renderReflection({
      lines: [choice.response],
      actions: '<button data-action="authored-reflection-next">Continue walking</button>'
    });
    this.autosave();
  }

  private advanceAuthoredReflection(): void {
    if (this.authoredOverlayMode !== "response") return;
    this.authoredCutscene?.resolveCheckpoint();
    this.authoredOverlayMode = null;
    this.authoredCheckpointId = "";
    this.authoredReflectionResponse = "";
    this.overlay.classList.remove("dialogue-open", "lightweight-presentation");
    this.overlay.innerHTML = "";
  }

  private finishAuthoredCutscene(): void {
    if (!this.authoredCutscene || !this.authoredMode) return;
    const mode = this.authoredMode;
    this.authoredCutscene = null;
    this.authoredMode = null;
    this.authoredReplayMode = false;
    this.authoredOverlayMode = null;
    this.authoredCheckpointId = "";
    this.authoredReflectionResponse = "";
    this.overlay.classList.remove("dialogue-open", "lightweight-presentation");
    this.overlay.innerHTML = "";
    if (mode === "main") {
      this.showChapterEndingQuote("04.06 · KTHO Lobby", april06Chapter.title, april06Chapter.canonicalClosure.lines);
      this.autosave();
      return;
    }
    this.showToast("The morning echo fades without adding another event.");
    this.autosave();
  }

  private inspectAuthoredResidue(id: string): void {
    if (id === "mcd-drop-memory") return this.startAuthoredCutscene("main", true);
    if (id === "roadside-empty-car") {
      this.overlay.innerHTML = '<div class="modal"><h2>Roadside</h2><p>车已经不在了。这里只留下一个很短的空镜头。</p><button data-action="close">Close</button></div>';
    } else {
      return this.showToast("Walk through the lobby");
    }
    this.focusStage();
  }

  private resetAuthoredRuntime(): void {
    this.authoredCutscene = null;
    this.authoredMode = null;
    this.authoredReplayMode = false;
    this.authoredOverlayMode = null;
    this.authoredCheckpointId = "";
    this.authoredReflectionResponse = "";
  }
  private updateMarch30Scene(x: number, y: number, dt: number): void {
    const layout = this.currentSceneLayout();
    if (this.march30Cutscene) {
      this.march30Cutscene.update(dt);
      if (this.march30Cutscene.currentDialogue) this.showMarch30Dialogue();
      if (this.march30Cutscene.completed) this.finishMarch30Cutscene();
      this.activeObject = "";
      return;
    }
    if (this.march30OverlayMode) {
      this.activeObject = "";
      return;
    }
    const mainTrigger = layout.triggers.find((trigger) => {
      if (trigger.id !== "main-memory") return false;
      return this.player.x >= trigger.rect.x && this.player.x <= trigger.rect.x + trigger.rect.w && this.player.y >= trigger.rect.y && this.player.y <= trigger.rect.y + trigger.rect.h;
    });
    if (mainTrigger && this.consumeChapterTrigger("march30-too-fated")) {
      this.startMarch30Memory(false);
      return;
    }
    this.moveInLayout(x, y, dt, layout);
    const interaction = layout.interactions.find((item) => Math.hypot(this.player.x - item.x, this.player.y - item.y) < item.radius);
    this.activeObject = interaction?.id ?? "";
  }

  private startMarch30Memory(replay: boolean): void {
    const layout = this.currentSceneLayout();
    this.march30Cutscene = new CutsceneSystem(resolveMarch30CutsceneActions(layout, march30MainMemoryActions));
    this.march30Mode = "main";
    this.march30ReplayMode = replay;
    this.startChapterMemoryRun("march30-too-fated", "march30-bench-memory", replay ? "manual-replay" : "automatic");
    this.march30OverlayMode = null;
    this.overlay.classList.remove("dialogue-open");
    this.overlay.innerHTML = "";
    this.showToast(replay ? "Replaying the quiet morning" : "The morning begins to return");
  }

  private startMarch30Echo(replay: boolean): void {
    const layout = this.currentSceneLayout();
    this.march30Cutscene = new CutsceneSystem(resolveMarch30CutsceneActions(layout, march30EchoActions));
    this.march30Mode = "echo";
    this.march30ReplayMode = replay;
    this.startChapterMemoryRun("march30-too-fated", "march30-elevator-echo", "manual-replay");
    this.march30OverlayMode = null;
    this.overlay.classList.remove("dialogue-open");
    this.overlay.innerHTML = "";
    this.showToast("The next elevator opens");
  }

  private showMarch30Dialogue(): void {
    const dialogue = this.march30Cutscene?.currentDialogue;
    if (!dialogue || this.march30OverlayMode === "dialogue") return;
    this.march30OverlayMode = "dialogue";
    this.overlay.classList.add("dialogue-open");
    this.overlay.classList.remove("lightweight-presentation");
    this.overlay.innerHTML = renderVnDialogue({
      speaker: dialogue.speaker,
      text: dialogue.text,
      portrait: this.march30PortraitModel(dialogue),
      actions: '<button data-action="march30-dialogue-next">Continue</button>'
    });
    this.focusStage();
  }

  private march30PortraitModel(dialogue: { speaker: string; portrait?: DialoguePortrait }): DialoguePortraitRenderModel {
    if (dialogue.portrait && typeof dialogue.portrait === "object") {
      return { kind: "image", config: dialogue.portrait, alt: dialogue.speaker };
    }
    if (dialogue.portrait === "gift") {
      return { kind: "group", className: "march30-prop-portrait gift", ariaLabel: "Xiaoba fish charm gift", children: [this.march30PropPortraitCrop("gift")] } as DialoguePortraitRenderModel;
    }
    if (dialogue.portrait === "waterGun") {
      return { kind: "group", className: "march30-prop-portrait water-gun", ariaLabel: "Xiaoba water gun", children: [this.march30PropPortraitCrop("waterGun")] } as DialoguePortraitRenderModel;
    }
    if (dialogue.portrait === "keychains") {
      return { kind: "group", className: "march30-prop-portrait keychains", ariaLabel: "Two Xiaoba candied-haw keychains", children: [this.march30PropPortraitCrop("ordinaryKeychain"), this.march30PropPortraitCrop("phoneCharm")] } as DialoguePortraitRenderModel;
    }
    const character = dialogue.speaker === "MS" ? "ms" : "et";
    return { kind: "sprite", className: `march30-portrait ${character}`, ariaLabel: character === "ms" ? "MS" : "ET" };
  }

  private march30PortraitMarkup(dialogue: { speaker: string; portrait?: DialoguePortrait }): string {
    const model = this.march30PortraitModel(dialogue);
    if (model.kind === "group") return renderDialoguePortraits(model.children, model.className, model.ariaLabel);
    return renderDialoguePortrait(model);
  }

  private march30PropPortraitCrop(assetId: March30PortraitPropId): Extract<DialoguePortraitRenderModel, { kind: "crop" }> {
    const asset = march30Assets[assetId];
    const source = asset.source;
    const sheet = propPortraitSheetDimensions[assetId];
    const displayHeight = 150;
    const displayScale = displayHeight / source.h;
    const displayWidth = source.w * displayScale;
    const sheetWidth = sheet.w * displayScale;
    const sheetHeight = sheet.h * displayScale;
    const left = -source.x * displayScale;
    const top = -source.y * displayScale;
    return { kind: "crop", className: "march30-prop-crop", width: displayWidth, height: displayHeight, backgroundImage: asset.path, backgroundSize: `${sheetWidth}px ${sheetHeight}px`, backgroundPosition: `${left}px ${top}px` };
  }

  private finishMarch30Cutscene(): void {
    if (!this.march30Cutscene || !this.march30Mode) return;
    const mode = this.march30Mode;
    this.march30Cutscene = null;
    this.march30Mode = null;
    this.march30ReplayMode = false;
    this.march30OverlayMode = null;
    this.overlay.classList.remove("dialogue-open");
    this.overlay.innerHTML = "";
    if (mode === "main") this.showMarch30ReflectionChoice(1);
    else this.showMarch30ReflectionChoice(2);
    this.autosave();
  }

  private showMarch30ReflectionChoice(index: number): void {
    this.march30ReflectionIndex = index;
    this.march30OverlayMode = "reflection";
    const choices = index === 1 ? march30ReflectionChoices : march30EchoReflectionChoices;
    this.overlay.classList.add("dialogue-open", "lightweight-presentation");
    this.overlay.innerHTML = renderReflectionChoice({
      kicker: "A quiet afterimage",
      title: "你想怎样记住这一段？",
      prompt: "",
      choices: choices.map((choice) => ({ id: choice.id, label: choice.label })),
      action: "march30-reflection-choice"
    });
    this.focusStage();
  }

  private chooseMarch30Reflection(choiceId: string): void {
    const choices = this.march30ReflectionIndex === 1 ? march30ReflectionChoices : march30EchoReflectionChoices;
    const choice = choices.find((item) => item.id === choiceId);
    if (!choice) return;
    const eventId = this.march30ReflectionIndex === 1 ? "march30-bench-memory" : "march30-elevator-echo";
    this.recordChapterExperienceChoice("march30-too-fated", eventId, this.march30ReplayMode ? "manual-replay" : "automatic", choice);
    this.march30ReflectionResponse = choice.response ?? "";
    this.march30OverlayMode = "response";
    this.overlay.classList.add("dialogue-open", "lightweight-presentation");
    this.overlay.innerHTML = renderReflection({
      lines: [this.march30ReflectionResponse],
      actions: '<button data-action="march30-reflection-next">Continue walking</button>'
    });
    this.autosave();
  }

  private advanceMarch30Reflection(): void {
    const chapterId = "march30-too-fated";
    const eventId = this.march30ReflectionIndex === 1 ? "march30-bench-memory" : "march30-elevator-echo";
    const progress = this.currentRunProgressFor(chapterId);
    const quote = resolveMarch30Closing(progress.tendencies);
    const reflection = resolveChapterReflection(chapterRegistry[chapterId], progress);
    this.completeChapterMemoryRun(chapterId, eventId, reflection);
    this.march30OverlayMode = "closing";
    this.overlay.classList.add("dialogue-open", "lightweight-presentation");
    this.overlay.innerHTML = renderReflection({
      kicker: "March 30 · 330 corridor",
      lines: [quote],
      actions: `<button data-action="reflection-keep-chapter" data-chapter="march30-too-fated" data-text="${this.escapeHtml(quote)}">Keep this</button><button data-action="march30-closing-close">Continue walking</button>`
    });
    this.autosave();
  }

  private updateLabis(x: number, y: number, dt: number): void {
    const layout = this.currentSceneLayout("labis");
    if (this.labisCutscene) {
      this.labisCutscene.update(dt);
      if (this.labisCutscene.currentDialogue) {
        this.showLabisCutsceneDialogue();
      }
      if (this.labisCutscene.completed) {
        this.finishLabisMemoryEvent();
      }
      this.activeObject = "";
      return;
    }
    if (this.labisOverlayMode || this.labisLessonChoiceIndex >= 0) {
      this.activeObject = "";
      return;
    }
    this.moveInLayout(x, y, dt, layout);
    if (layout.orientation === "portrait" && !layout.triggers.length && !layout.interactions.length) {
      this.activeObject = "";
      return;
    }
    const activeTrigger = layout.triggers.find((trigger) => this.player.x >= trigger.rect.x && this.player.x <= trigger.rect.x + trigger.rect.w && this.player.y >= trigger.rect.y && this.player.y <= trigger.rect.y + trigger.rect.h);
    const canStartMemory = layout.orientation === "landscape"
      ? canStartLabisMotorMemory(this.player, this.readMemories, this.completedMemoryEvents)
      : Boolean(activeTrigger);
    if (canStartMemory && this.consumeChapterTrigger("july19-motor-day")) {
      this.startLabisMemory(false);
      return;
    }
    const authoredInteraction = layout.orientation === "portrait"
      ? layout.interactions.find((interaction) => Math.hypot(this.player.x - interaction.x, this.player.y - interaction.y) <= interaction.radius)?.label ?? ""
      : "";
    const labisInteraction = layout.orientation === "landscape" ? labisInteractionForPoint(this.player, this.readMemories, this.completedMemoryEvents) : authoredInteraction;
    const echo = this.availableLabisEchoAtPlayer();
    const nearExit = layout.orientation === "landscape" && (this.player.y > 735 || this.player.x < 135);
    const nearShop = layout.orientation === "landscape" && Math.hypot(this.player.x - 1040, this.player.y - 345) < 96;
    this.activeObject = labisInteraction || echo?.prompt.replace(/^E ·\s*/, "") || (nearShop ? "family shop" : nearExit ? "exit" : "");
  }

  private startLabisMemory(replay: boolean): void {
    this.labisCutscene = new CutsceneSystem(this.labisMotorActionsForCurrentLayout());
    this.labisDialogueOpen = false;
    this.labisReplayMode = replay;
    this.startChapterMemoryRun("labis-motor-day", "july19-motor-learning", replay ? "manual-replay" : "automatic");
    this.labisLessonChoiceIndex = -1;
    this.labisOverlayMode = null;
    this.labisActiveChoice = null;
    this.overlay.classList.remove("dialogue-open");
    this.overlay.innerHTML = "";
    this.showToast(replay ? "Replaying memory" : "The past appears");
  }

  private labisMotorActionsForCurrentLayout(): typeof labisMotorMemoryActions {
    const anchors = this.currentSceneLayout("labis").anchors;
    const point = (key: string, fallback: Point): Point => anchors[key] ?? fallback;
    return labisMotorMemoryActions.map((action) => {
      if (action.type === "spawn" && action.actor === "motor") {
        const anchor = point("motor-spawn", { x: action.x, y: action.y });
        return { ...action, x: anchor.x, y: anchor.y };
      }
      if (action.type === "spawn" && action.actor === "ms") {
        const anchor = point("ms-spawn", { x: action.x, y: action.y });
        return { ...action, x: anchor.x, y: anchor.y };
      }
      if (action.type === "move" && action.actor === "motor" && action.x === 710) {
        const anchor = point("motor-mid", { x: action.x, y: action.y });
        return { ...action, x: anchor.x, y: anchor.y };
      }
      if (action.type === "move" && action.actor === "ms") {
        const anchor = point("ms-mid", { x: action.x, y: action.y });
        return { ...action, x: anchor.x, y: anchor.y };
      }
      if (action.type === "move" && action.actor === "motor" && action.x === 890) {
        const anchor = point("motor-end", { x: action.x, y: action.y });
        return { ...action, x: anchor.x, y: anchor.y };
      }
      return action;
    });
  }

  private showLabisCutsceneDialogue(): void {
    const dialogue = this.labisCutscene?.currentDialogue;
    if (!dialogue || this.labisDialogueOpen) return;
    this.labisDialogueOpen = true;
    this.overlay.classList.add("dialogue-open");
    this.overlay.classList.remove("lightweight-presentation");
    this.overlay.innerHTML = renderVnDialogue({
      speaker: dialogue.speaker,
      text: dialogue.text,
      portrait: this.dialoguePortraitModel(dialogue.portrait),
      actions: '<button data-action="choice" data-choice="labis-next">Continue</button>'
    });
    this.focusStage();
  }

  private finishLabisMemoryEvent(): void {
    const replay = this.labisReplayMode;
    this.labisCutscene = null;
    this.labisDialogueOpen = false;
    this.labisReplayMode = false;
    this.overlay.classList.remove("dialogue-open");
    this.overlay.innerHTML = "";
    this.showToast(replay ? "Memory replayed" : "✦ 第一次学会驾 motor · 07.19 · Labis");
    this.showLabisChoice("motor");
    this.autosave();
  }

  private resetMarch30Runtime(): void {
    this.march30Cutscene = null;
    this.march30Mode = null;
    this.march30ReplayMode = false;
    this.march30OverlayMode = null;
    this.march30ReflectionIndex = 0;
    this.march30ReflectionResponse = "";
  }

  private updateMujiRoom(x: number, y: number, dt: number): void {
    const layout = this.currentSceneLayout("muji-room");
    if (layout.orientation === "landscape") {
      const moving = Math.hypot(x, y) > 0.05;
      if (moving) {
        this.facing = Math.abs(x) > Math.abs(y) ? (x < 0 ? 2 : 3) : y < 0 ? 1 : 0;
        this.frame = Math.floor(performance.now() / 140) % 4;
        this.player = moveRoomPlayer(this.player, x, y, dt);
      } else {
        this.frame = 0;
      }
      this.activeRoomInteraction = nearestRoomInteraction(this.player);
      this.activeObject = this.activeRoomInteraction?.label ?? "";
      return;
    }
    const moving = Math.hypot(x, y) > 0.05;
    if (moving) {
      this.facing = Math.abs(x) > Math.abs(y) ? (x < 0 ? 2 : 3) : y < 0 ? 1 : 0;
      this.frame = Math.floor(performance.now() / 140) % 4;
      this.moveInLayout(x, y, dt, layout);
    } else {
      this.frame = 0;
    }
    this.activeRoomInteraction = layout.interactions.find((interaction) => Math.hypot(this.player.x - interaction.x, this.player.y - interaction.y) <= interaction.radius) ?? null;
    this.activeObject = this.activeRoomInteraction?.label ?? "";
  }

  private moveInLayout(x: number, y: number, dt: number, layout: SceneLayout): void {
    const moving = Math.hypot(x, y) > 0.05;
    if (moving) {
      this.facing = Math.abs(x) > Math.abs(y) ? (x < 0 ? 2 : 3) : y < 0 ? 1 : 0;
      this.frame = Math.floor(performance.now() / 140) % 4;
      const next = { x: this.player.x + x * 155 * dt, y: this.player.y + y * 155 * dt };
      const outside = next.x < 0 || next.y < 0 || next.x > layout.size.w || next.y > layout.size.h;
      if (!outside && !inAnyRect(next, layout.obstacles)) this.player = next;
    } else {
      this.frame = 0;
    }
  }

  private interact(): void {
    if (this.scene === "title") return this.newMemory();
    if (this.scene === "forest" && this.activeDoor) return this.previewDoor(this.activeDoor);
    if (this.scene === "bakery") {
      if (this.activeObject === "exit") return this.returnToForest();
      if (this.activeObject === "diary memory") return this.showDiaryMemory();
      if (this.activeObject === "Friend A") {
        if (!this.readMemories.has(this.currentMemoryKey())) return this.showToast("Read the diary memory by the counter first");
        if (this.dialogue.complete()) this.resetBakeryDialogue();
        return this.showDialogue();
      }
      if (this.activeObject === "pastry") return this.inspectPastry();
      return this.showToast(this.readMemories.has(this.currentMemoryKey()) ? "Walk closer to Friend A" : "Find the glowing diary memory first");
    }
    if (this.scene === "labis") {
      if (this.labisOverlayMode === "dialogue") return this.advanceLabisDialogue();
      if (this.labisOverlayMode === "choice" || this.labisOverlayMode === "vignette" || this.labisOverlayMode === "reflection") return;
      if (this.labisCutscene?.currentDialogue) {
        this.labisCutscene.advanceDialogue();
        this.labisDialogueOpen = false;
        this.overlay.classList.remove("dialogue-open");
        this.overlay.innerHTML = "";
        return;
      }
      if (this.labisCutscene) return;
      if (this.activeObject === "exit") return this.returnToForest();
      if (this.activeObject === "diary memory") return this.showDiaryMemory();
      if (this.activeObject === "motor memory") return this.showLabisMemoryPoint();
      const echo = this.availableLabisEchoAtPlayer();
      if (echo) return this.startLabisEcho(echo);
      if (this.activeObject === "family shop") return this.inspectLabisShop();
      return this.showToast("Walk through the open road");
    }
    if (this.scene === "muji-room") {
      if (!this.activeRoomInteraction) return this.showToast("Walk closer");
      return this.activateRoomInteraction(this.activeRoomInteraction);
    }
    if (this.scene === "330-corridor") return this.interactMarch30();
    if (this.isAuthoredRuntimeScene()) {
      if (this.scene === "406" && this.overlay.innerHTML.trim() && !this.authoredOverlayMode) return;
      if (this.scene === "406" && this.authoredOverlayMode === "dialogue") return this.advanceAuthoredDialogue();
      if (this.scene === "406" && this.authoredOverlayMode === "response") return this.advanceAuthoredReflection();
      if (this.scene === "406" && (this.authoredOverlayMode === "choice" || this.authoredCutscene?.currentCheckpoint)) return;
      if (this.scene === "406" && this.authoredCutscene) return;
      if (this.activeObject === "exit") return this.returnToForest();
      if (this.scene === "406" && (this.activeObject === "diary" || this.activeObject === "diary memory")) return this.showChapterDiary(this.currentMemoryKey());
      if (this.scene === "406" && this.activeObject === "watergun-crossing") return this.startAuthoredCutscene("echo", false);
      if (this.scene === "406" && this.activeObject === "mcd-drop-memory") return this.startAuthoredCutscene("main", true);
      if (this.scene === "406" && this.activeObject === "roadside-empty-car") return this.inspectAuthoredResidue(this.activeObject);
      if (this.activeObject) return this.showToast("Walk closer to " + this.activeObject);
      return this.showToast("Walk through the authored scene");
    }
    if (this.scene === "ending") this.returnToForest();
  }

  private interactMarch30(): void {
    if (this.march30OverlayMode === "dialogue") return this.advanceMarch30Dialogue();
    if (this.march30OverlayMode === "response") return this.advanceMarch30Reflection();
    if (this.march30OverlayMode === "closing") {
      this.march30OverlayMode = null;
      this.overlay.innerHTML = "";
      return;
    }
    if (this.march30OverlayMode === "reflection") return;
    if (this.march30Cutscene?.currentDialogue) return this.advanceMarch30Dialogue();
    if (this.march30Cutscene) return;
    if (this.activeObject === "exit") return this.returnToForest();
    if (this.activeObject === "diary") return this.showDiaryMemory();
    if (this.activeObject === "bench-memory") return this.startMarch30Memory(true);
    if (this.activeObject === "elevator" && this.completedMemoryEvents.has("march30-bench-memory")) return this.startMarch30Echo(false);
    return this.showToast("Walk through the quiet corridor");
  }

  private advanceMarch30Dialogue(): void {
    this.march30Cutscene?.advanceDialogue();
    this.march30OverlayMode = null;
    this.overlay.classList.remove("dialogue-open");
    this.overlay.innerHTML = "";
  }

  private currentMemoryKey(): string {
    if (this.currentDoor && this.isChapterNode(this.currentDoor)) return this.currentDoor.chapterId;
    return Object.values(chapterRegistry).find((chapter) => chapter.runtimeScene === this.scene)?.id ?? bakeryChapter.id;
  }

  private allDoors(): ForestNode[] {
    const selectedMonth = this.currentForestMonth();
    return resolveForestDynamicPlacements(forestNodesForMonth(forestEntries, this.makeDiaryLibrary(), selectedMonth.key), this.currentSceneLayout("forest"), selectedMonth.key);
  }

  private isChapterNode(node: ForestNode): node is AuthoredForestEntry | Extract<DiaryForestMemory, { kind: "chapter" }> {
    return !("kind" in node) || node.kind === "chapter";
  }

  private chapterIdFor(node: ForestNode): string {
    return this.isChapterNode(node) ? node.chapterId : node.id;
  }

  private progressFor(chapterId: string): ChapterProgress {
    let progress = this.chapterProgress.get(chapterId) ?? initialChapterProgress(chapterId);
    const chapterDoorVisited = this.allDoors().some((door) => this.isChapterNode(door) && door.chapterId === chapterId && this.visitedMemories.has(door.id));
    if (this.walkedThroughMemories.has(chapterId)) {
      progress = { ...progress, state: "walkedThrough", visited: true, dialogueCompleted: true, walkedThrough: true };
    } else if (chapterDoorVisited) {
      progress = beginChapterVisit(progress);
    }
    const eventId = chapterRegistry[chapterId]?.canonicalClosure.historicalEventId ?? "";
    if (this.readMemories.has(chapterId) || this.completedMemoryEvents.has(eventId)) progress = markChapterMemoryRead(progress);
    this.chapterProgress.set(chapterId, progress);
    return progress;
  }

  private startChapterMemoryRun(chapterId: string, eventId: string, mode: ChapterExperienceMode): void {
    this.chapterMemoryRun = startChapterMemoryExperience({
      chapterId,
      eventId,
      mode,
      baselineTendencies: this.tendencies,
      firstCompletionPending: !this.completedMemoryEvents.has(eventId)
    });
  }

  private currentRunProgressFor(chapterId: string): ChapterProgress {
    const progress = this.progressFor(chapterId);
    return this.chapterMemoryRun?.chapterId === chapterId
      ? currentRunProgress(progress, this.chapterMemoryRun)
      : progress;
  }

  private recordChapterExperienceChoice(chapterId: string, eventId: string, mode: ChapterExperienceMode, choice: Choice): void {
    if (!this.chapterMemoryRun || this.chapterMemoryRun.chapterId !== chapterId || this.chapterMemoryRun.eventId !== eventId) {
      this.startChapterMemoryRun(chapterId, eventId, mode);
    }
    this.chapterMemoryRun = applyChapterExperienceChoice(this.chapterMemoryRun!, choice);
  }

  private completeChapterMemoryRun(chapterId: string, eventId: string, reflection: Pick<ReturnType<typeof resolveChapterReflection>, "quoteId" | "tone">): void {
    const run = this.chapterMemoryRun?.chapterId === chapterId && this.chapterMemoryRun.eventId === eventId ? this.chapterMemoryRun : null;
    const firstCompletion = !this.completedMemoryEvents.has(eventId);
    const persistedProgress = this.progressFor(chapterId);
    const currentProgress = run ? currentRunProgress(persistedProgress, run) : persistedProgress;
    if (firstCompletion) {
      if (run) {
        this.tendencies = { ...run.tendencies };
        this.choices.push(...run.choiceIds);
      }
      this.completedMemoryEvents.add(eventId);
      this.readMemories.add(eventId);
    }
    const finishedProgress = firstCompletion ? markChapterMemoryRead(currentProgress) : persistedProgress;
    this.chapterProgress.set(chapterId, finishChapterWalkthrough(finishedProgress, reflection.quoteId, reflection.tone));
    this.walkedThroughMemories.add(chapterId);
    this.room.residueIds = [...new Set([...(this.room.residueIds ?? []), chapterId])];
  }

  private commitChapterMemoryRunTendencies(chapterId: string, eventId: string): void {
    const run = this.chapterMemoryRun?.chapterId === chapterId && this.chapterMemoryRun.eventId === eventId ? this.chapterMemoryRun : null;
    if (!run || this.completedMemoryEvents.has(eventId)) {
      this.completedMemoryEvents.add(eventId);
      this.readMemories.add(eventId);
      return;
    }
    this.tendencies = { ...run.tendencies };
    this.choices.push(...run.choiceIds);
    this.completedMemoryEvents.add(eventId);
    this.readMemories.add(eventId);
  }
  private finishCurrentChapterWalkthrough(): void {
    const door = this.currentDoor;
    if (!door || !this.isChapterNode(door)) return;
    const chapterId = this.chapterIdFor(door);
    const chapter = chapterRegistry[chapterId];
    if (!chapter) return;
    const progress = this.progressFor(chapterId);
    const reflection = resolveChapterReflection(chapter, progress);
    this.chapterProgress.set(chapterId, finishChapterWalkthrough(progress, reflection.quoteId, reflection.tone));
    this.walkedThroughMemories.add(chapterId);
    this.room.residueIds = [...new Set([...(this.room.residueIds ?? []), chapterId])];
  }

  private escapeHtml(value: string): string {
    return value.replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" }[char]!));
  }

  private previewDoor(door: ForestNode): void {
    this.visitedMemories.add(door.id);
    this.currentDoor = door;
    if ("kind" in door && door.kind === "fragment") {
      this.overlay.innerHTML = `<div class="modal diary-memory"><div class="diary-memory-scroll"><h2>${this.escapeHtml(door.date)} · ${this.escapeHtml(door.title)}</h2><p>${this.escapeHtml(door.excerpt)}</p><p>This memory is a small light, not a full chapter.</p></div><div class="memory-actions"><button data-action="close">Stay in forest</button><button data-action="open-diary-page" data-id="${this.escapeHtml(door.userEntryId)}">Open Page</button></div></div>`;
      this.autosave();
      this.focusStage();
      return;
    }
    const route = "kind" in door ? { kind: door.implemented ? "implemented-chapter" : "stub" as const } : routeForestEntry(door);
    if (route.kind === "stub") {
      this.overlay.innerHTML = `<div class="modal"><h2>${this.escapeHtml(door.date)} · ${this.escapeHtml(door.title)}</h2><p>This memory is not yet authored.</p><p>The forest keeps the door, but it will not borrow Yumido Bread's scene.</p><button data-action="open-timeline">Open Timeline</button><button data-action="close">Stay in forest</button></div>`;
      this.autosave();
      this.focusStage();
      return;
    }
    this.overlay.innerHTML = `<div class="modal"><h2>${this.escapeHtml(door.date)} · ${this.escapeHtml(door.title)}</h2><p>A memory hums inside the branches.</p><p>Muji does not go back to fix it. Muji goes back to walk beside it.</p><button data-action="enter-door" data-door="${this.escapeHtml(door.id)}">Enter memory</button><button data-action="forest">Return to Forest</button><button data-action="close">Stay in forest</button></div>`;
    this.focusStage();
  }

  private async enterCurrentMemory(): Promise<void> {
    this.currentDoor ??= this.activeDoor ?? forestEntries[1];
    if (!this.isChapterNode(this.currentDoor)) return this.previewDoor(this.currentDoor);
    const route = "kind" in this.currentDoor ? { kind: this.currentDoor.implemented ? "implemented-chapter" : "stub" as const } : routeForestEntry(this.currentDoor);
    if (route.kind === "stub") {
      this.previewDoor(this.currentDoor);
      return;
    }
    const chapterId = this.chapterIdFor(this.currentDoor);
    this.chapterTriggerSessions.set(chapterId, createChapterTriggerSession(chapterId));
    this.chapterProgress.set(chapterId, beginChapterVisit(this.progressFor(chapterId)));
    this.visitedMemories.add(this.currentDoor.id);
    const chapter = chapterRegistry[chapterId];
    if (!this.hasSceneLayout(chapter.runtimeScene)) await this.sceneLayoutLoadPromise;
    if (!this.hasSceneLayout(chapter.runtimeScene)) {
      this.showToast(`Scene layout unavailable: ${chapter.runtimeScene}`);
      return;
    }
    this.interruptPersonalMusicForMemory();
    this.scene = chapter.runtimeScene;
    this.player = { ...this.currentSceneLayout(chapter.runtimeScene).spawn };
    this.dialogue = new DialogueSystem(chapter.dialogue);
    this.startChapterMemoryRun(chapterId, chapter.canonicalClosure.historicalEventId, "automatic");
    this.labisCutscene = null;
    this.labisDialogueOpen = false;
    this.resetMarch30Runtime();
    this.resetAuthoredRuntime();
    this.overlay.classList.remove("dialogue-open");
    this.overlay.innerHTML = "";
    this.focusStage();
    this.showToast("Entered memory");
    this.playSceneMusic(chapter.runtimeScene === "labis" ? "forest" : "bakery");
    this.autosave();
  }

  private consumeChapterTrigger(chapterId: string): boolean {
    const session = this.chapterTriggerSessions.get(chapterId) ?? createChapterTriggerSession(chapterId);
    const result = consumeAutomaticChapterTrigger(session);
    this.chapterTriggerSessions.set(chapterId, result.session);
    return result.allowed;
  }

  private resetBakeryDialogue(): void {
    this.dialogue = new DialogueSystem(bakeryChapter.dialogue);
    this.startChapterMemoryRun("bakery-day", chapterRegistry["bakery-day"].canonicalClosure.historicalEventId, "manual-replay");
    this.showToast("Friend A is ready to talk again");
  }

  private showDiaryMemory(): void {
    this.showChapterDiary(this.currentMemoryKey());
  }

  private showChapterDiary(chapterId: string): void {
    const chapter = chapterRegistry[chapterId];
    const entry = findChapterDiaryEntry(this.diaryEntries, chapterId, chapter?.diaryEntryId);
    if (!entry) {
      this.showToast("This chapter has no canonical diary page yet");
      return;
    }
    this.readMemories.add(chapterId);
    this.chapterProgress.set(chapterId, markChapterMemoryRead(this.progressFor(chapterId)));
    this.showChapterDiaryFrame(entry);
    this.showToast("Diary memory read");
    this.autosave();
  }

  private showChapterDiaryFrame(entry: DiaryEntry): void {
    const paragraphs = (entry.body || "Empty draft")
      .split(/\n{2,}|\r?\n/)
      .filter(Boolean)
      .map((line) => `<p>${this.escapeHtml(line)}</p>`)
      .join("");
    const meta = [entry.location, entry.weather, entry.mood ? `心情：${entry.mood}` : ""]
      .filter(Boolean)
      .map((item) => this.escapeHtml(String(item)))
      .join(" · ");
    this.overlay.classList.remove("dialogue-open", "lightweight-presentation");
    this.overlay.innerHTML = `
      <div class="modal diary-memory chapter-diary-memory" role="dialog" aria-modal="true" aria-label="Chapter diary">
        <div class="diary-memory-scroll">
          <h2>${this.escapeHtml(entry.date)} · ${this.escapeHtml(entry.title)}</h2>
          ${meta ? `<p class="journal-reading-meta">${meta}</p>` : ""}
          ${paragraphs}
        </div>
        <div class="memory-actions">
          <button data-action="close">Close</button>
          <button data-action="edit-chapter-diary" data-id="${this.escapeHtml(entry.id)}" data-chapter="${this.escapeHtml(entry.chapterId ?? "")}">Edit in Journal</button>
        </div>
      </div>`;
    this.focusStage();
  }
  private inspectPastry(): void {
    this.overlay.innerHTML = `<div class="modal"><h2>Pastry</h2><p>The pastry is smaller than the story made it. It does not start a conversation by itself.</p><button data-action="close">Close</button><button data-action="forest">Exit to forest</button></div>`;
    this.focusStage();
    this.autosave();
  }

  private showDialogue(): void {
    const node = this.dialogue.current();
    if (!node) return;
    const choices = node.choices?.map((choice) => `<button data-action="choice" data-choice="${choice.id}"><span>${choice.label}</span><small>${this.choiceEffectLabel(choice)}</small></button>`).join("") ?? `<button data-action="choice" data-choice="next">Continue</button>`;
    this.overlay.classList.add("dialogue-open");
    this.overlay.classList.remove("lightweight-presentation");
    this.overlay.innerHTML = renderVnDialogue({
      speaker: node.speaker,
      text: node.text,
      portrait: this.dialoguePortraitModel(node.portrait),
      response: this.dialogue.lastResponse ?? undefined,
      actions: choices
    });
    this.focusStage();
  }

  private dialoguePortraitModel(portrait: DialoguePortrait | "none" | undefined): DialoguePortraitRenderModel {
    if (!portrait || portrait === "none") return { kind: "empty" };
    if (typeof portrait === "object") return { kind: "image", config: portrait };
    // The shared renderer keeps Bakery's existing class="friend-portrait" hook and sizing behavior.
    if (portrait === "friend") return { kind: "image", config: { src: assets.friend }, className: "friend-portrait" };
    if (portrait === "muji") return { kind: "image", config: { src: assets.muji } };
    return { kind: "empty" };
  }

  private focusStage(): void {
    requestAnimationFrame(() => this.stage.scrollIntoView({ block: "start", behavior: "auto" }));
  }

  private choiceEffectLabel(choice: Choice): string {
    return Object.keys(choice.effects).length ? "reflection" : "";
  }

  private choose(choiceId: string): void {
    if (choiceId === "labis-next" && this.labisCutscene?.currentDialogue) {
      this.labisCutscene.advanceDialogue();
      this.labisDialogueOpen = false;
      this.overlay.classList.remove("dialogue-open");
      this.overlay.innerHTML = "";
      return;
    }
    if (choiceId === "again") {
      this.resetBakeryDialogue();
      this.showDialogue();
      return;
    }
    const node = this.dialogue.current();
    if (!node) return;
    if (choiceId === "next" || !node.choices) {
      this.dialogue.next();
    } else {
      const choice = node.choices.find((item) => item.id === choiceId);
      if (choice) {
        const chapterId = this.currentMemoryKey();
        const chapter = chapterRegistry[chapterId];
        if (chapter) {
          this.dialogue.choose(choice, this.currentRunProgressFor(chapterId).tendencies);
          this.recordChapterExperienceChoice(chapterId, chapter.canonicalClosure.historicalEventId, "manual-replay", choice);
        }
        this.showToast(`Choice: ${choice.label}`);
      }
    }
    if (this.dialogue.complete()) {
      this.showEndingQuote();
    } else {
      this.showDialogue();
    }
    this.autosave();
  }

  private showLabisMemoryPoint(): void {
    this.overlay.innerHTML = `<div class="modal"><h2>第一次学会驾 motor</h2><p>这里就是她第一次学会驾 motor 的地方。</p><button data-action="labis-replay">Replay Memory</button><button data-action="close">Close</button></div>`;
    this.focusStage();
  }

  private showLabisReflectionDialogue(): void {
    this.showLabisChoice("motor");
  }

  private showLabisChoice(id: LabisChoicePoint["id"]): void {
    const point = labisChoicePoints.find((item) => item.id === id);
    if (!point) return;
    this.labisOverlayMode = "choice";
    this.labisActiveChoice = id;
    this.overlay.classList.add("dialogue-open", "lightweight-presentation");
    this.overlay.innerHTML = renderReflectionChoice({
      prompt: point.prompt,
      choices: point.choices.map((choice) => ({ id: choice.id, label: choice.label })),
      action: "labis-choice"
    });
    this.focusStage();
  }

  private chooseLabisChoice(choiceId: string): void {
    if (!this.labisActiveChoice) return;
    const point = labisChoicePoints.find((item) => item.id === this.labisActiveChoice);
    const choice = point?.choices.find((item) => item.id === choiceId);
    if (!choice) return;
    this.recordLabisChoice(choice);
    const after: LabisDialogueAfter = this.labisActiveChoice === "filter" && this.labisExitAfterReflection ? "show-reflection" : "finish-echo";
    this.labisActiveChoice = null;
    this.showLabisDialogueQueue(this.responseLines(choice.response).map((line) => this.lineToDialogue(line)), after);
    this.autosave();
  }

  private showLabisDialogueQueue(lines: LabisDialogueLine[], after: LabisDialogueAfter): void {
    this.labisDialogueQueue = lines;
    this.labisDialogueIndex = 0;
    this.labisDialogueAfter = after;
    this.labisOverlayMode = "dialogue";
    this.renderLabisDialogue();
  }

  private lineToDialogue(line: string): LabisDialogueLine {
    const match = /^([^：:]+)[：:]\s*(.+)$/.exec(line);
    if (match) return { speaker: match[1], text: match[2] };
    return { speaker: "Muji", text: line };
  }

  private renderLabisDialogue(): void {
    const line = this.labisDialogueQueue[this.labisDialogueIndex];
    if (!line) return this.finishLabisDialogueQueue();
    this.overlay.classList.add("dialogue-open", "lightweight-presentation");
    this.overlay.innerHTML = renderRpgDialogue({ speaker: line.speaker, text: line.text, action: "labis-dialogue-next" });
    this.focusStage();
  }

  private advanceLabisDialogue(): void {
    if (this.labisOverlayMode !== "dialogue") return;
    this.labisDialogueIndex += 1;
    this.renderLabisDialogue();
  }

  private finishLabisDialogueQueue(): void {
    const after = this.labisDialogueAfter;
    this.labisDialogueQueue = [];
    this.labisDialogueIndex = 0;
    this.labisDialogueAfter = null;
    this.labisOverlayMode = null;
    this.overlay.classList.remove("dialogue-open");
    this.overlay.innerHTML = "";
    if (after === "motor-choice") this.showLabisChoice("motor");
    if (after === "photo-choice") this.showLabisChoice("photo");
    if (after === "filter-choice") this.showLabisChoice("filter");
    if (after === "finish-echo") this.finishLabisEcho();
    if (after === "show-reflection") this.showLabisMemoryReflection();
    if (after === "finish-chicken-cake") this.finishLabisEcho(true);
  }

  private availableLabisEchoAtPlayer(): LabisEcho | null {
    const nearby = this.resolveLabisEchoesForCurrentLayout().filter((echo) => this.canUseLabisEcho(echo) && Math.hypot(this.player.x - echo.x, this.player.y - echo.y) < echo.radius);
    return nearby.sort((a, b) => this.labisEchoPriority(b) - this.labisEchoPriority(a))[0] ?? null;
  }

  private resolveLabisEchoesForCurrentLayout(): LabisEcho[] {
    const layout = this.currentSceneLayout("labis");
    if (layout.orientation === "portrait") {
      return labisEchoes
        .filter((echo) => Boolean(layout.echoAnchors[echo.id]))
        .map((echo) => this.resolveLabisEchoForCurrentLayout(echo));
    }
    return labisEchoes.map((echo) => this.resolveLabisEchoForCurrentLayout(echo));
  }

  private resolveLabisEchoForCurrentLayout(echo: LabisEcho): LabisEcho {
    const anchor = this.currentSceneLayout("labis").echoAnchors[echo.id];
    return anchor ? { ...echo, x: anchor.x, y: anchor.y, radius: anchor.radius } : echo;
  }

  private canUseLabisEcho(echo: LabisEcho): boolean {
    if (echo.id === "july19-chicken-cake" && this.completedLabisOptionalCount() < 3) return false;
    return (echo.requires ?? []).every((id) => this.completedMemoryEvents.has(id));
  }

  private labisEchoPriority(echo: LabisEcho): number {
    if (echo.id === "july19-photo-threat" && !this.completedMemoryEvents.has(echo.id)) return 6;
    if (echo.id === "july19-filter-evening" && !this.completedMemoryEvents.has(echo.id)) return 5;
    if (echo.id === "july19-fried-noodles" && this.completedMemoryEvents.has("july19-chicken-porridge")) return 4;
    if (echo.id === "july19-chicken-porridge" && !this.completedMemoryEvents.has("july19-chicken-porridge")) return 3;
    if (echo.id === "july19-filter-evening") return 3;
    if (!this.completedMemoryEvents.has(echo.id)) return 2;
    return 1;
  }

  private completedLabisOptionalCount(): number {
    return labisEchoes.filter((echo) => echo.id !== "july19-chicken-cake" && this.completedMemoryEvents.has(echo.id)).length;
  }

  private startLabisEcho(echo: LabisEcho): void {
    this.labisActiveEcho = echo;
    this.labisVignetteStartedAt = performance.now();
    this.startChapterMemoryRun("labis-motor-day", echo.id, "manual-replay");
    if (echo.id === "july19-photo-threat") {
      return this.showLabisDialogueQueue([
        { speaker: "ET", text: "诶？" },
        { speaker: "ET", text: "拍起来。" },
        { speaker: "ET", text: "以后可以威胁 MS。" },
        { speaker: "MS", text: "蛤？" }
      ], "photo-choice");
    }
    if (echo.id === "july19-chicken-porridge") {
      return this.showLabisDialogueQueue([
        { speaker: "Memory", text: "回家放了行李，我们就去阿爸阿妈店。" },
        { speaker: "Memory", text: "吃阿爸煮的鸡粥。" }
      ], "finish-echo");
    }
    if (echo.id === "july19-fried-noodles") {
      return this.showLabisDialogueQueue([
        { speaker: "Memory", text: "下午阿爸又炒面叫她去吃。" },
        { speaker: "ET", text: "不是刚刚吃饱吗？" }
      ], "finish-echo");
    }
    if (echo.id === "july19-haircut") {
      return this.showLabisDialogueQueue([
        { speaker: "Memory", text: "她也剪了头发和刘海。" },
        { speaker: "Memory", text: "看起来很喜欢。" }
      ], "finish-echo");
    }
    if (echo.id === "july19-kancil") {
      return this.showLabisDialogueQueue([
        { speaker: "Memory", text: "她开。" },
        { speaker: "Memory", text: "我看路，也帮她记录。" }
      ], "finish-echo");
    }
    if (echo.id === "july19-badminton") {
      return this.showLabisDialogueQueue([
        { speaker: "Memory", text: "啪" },
        { speaker: "Memory", text: "傍晚我们去打了一下羽球。" }
      ], "finish-echo");
    }
    if (echo.id === "july19-filter-evening") {
      return this.showLabisDialogueQueue([
        { speaker: "Memory", text: "她还坐在那里陪阿妈研究过滤器。" },
        { speaker: "Muji", text: "她好像在哪里都可以自己找到事情做。" }
      ], "filter-choice");
    }
    if (echo.id === "july19-chicken-cake") {
      this.labisOverlayMode = "vignette";
      const src = labisAssetManifest.chickenCake;
      const hasImage = this.isLabisImageReady(src);
      this.overlay.classList.remove("dialogue-open");
      this.overlay.innerHTML = `<div class="labis-keyframe"><div class="labis-keyframe-aura"></div>${hasImage ? `<img src="${src}" alt="">` : `<div class="labis-keyframe-fallback"><span>Zzz</span><strong>鸡蛋糕……</strong></div>`}<div class="zzz-drift">Zzz</div><div class="sleep-bubble">鸡蛋糕……</div><div class="question-mark">?</div><p>Muji：到底梦到什么。</p><button data-action="labis-vignette-close">Close</button></div>`;
      this.autosave();
    }
  }

  private closeLabisKeyframeVignette(): void {
    const keyframe = this.overlay.querySelector<HTMLElement>(".labis-keyframe");
    if (!keyframe) return this.finishLabisEcho(true);
    keyframe.classList.add("is-closing");
    window.setTimeout(() => this.finishLabisEcho(true), 360);
  }

  private finishLabisEcho(_keepDiscovery = false): void {
    const echo = this.labisActiveEcho;
    if (echo) this.commitChapterMemoryRunTendencies("labis-motor-day", echo.id);
    else if (this.chapterMemoryRun?.chapterId === "labis-motor-day" && this.chapterMemoryRun.eventId === "july19-motor-learning") this.commitChapterMemoryRunTendencies("labis-motor-day", "july19-motor-learning");
    this.labisOverlayMode = null;
    this.labisActiveEcho = null;
    this.overlay.classList.remove("dialogue-open");
    this.overlay.innerHTML = "";
    if (echo?.id && echo.id !== "july19-chicken-cake") this.showToast(`Memory echo · ${echo.label}`);
    this.autosave();
  }


  private showLabisMemoryReflection(): void {
    const progress = this.currentRunProgressFor("labis-motor-day");
    const reflection = resolveLabisMemoryReflection(progress.tendencies);
    this.completeChapterMemoryRun("labis-motor-day", "july19-motor-learning", { quoteId: reflection.id, tone: "accepting" });
    this.labisReflectionLines = reflection.lines;
    this.labisOverlayMode = "reflection";
    this.overlay.classList.add("dialogue-open", "lightweight-presentation");
    this.overlay.innerHTML = renderReflection({
      lines: reflection.lines,
      actions: `<button data-action="reflection-keep-chapter" data-chapter="labis-motor-day" data-text="${this.escapeHtml(reflection.lines.join("\n"))}">Keep this</button><button data-action="labis-reflection-close">Close</button>`
    });
    this.audio.ping("ending");
    this.autosave();
  }

  private closeLabisReflection(): void {
    if (this.labisOverlayMode !== "reflection") return;
    this.labisOverlayMode = null;
    this.labisReflectionLines = [];
    this.overlay.innerHTML = "";
    if (this.labisExitAfterReflection) {
      this.labisExitAfterReflection = false;
      this.finishReturnToForest();
      return;
    }
    this.showToast("Returned to Labis");
    this.autosave();
  }

  private recordLabisChoice(choice: Choice): void {
    const eventId = this.labisActiveEcho?.id ?? "july19-motor-learning";
    const mode = this.labisActiveEcho ? "manual-replay" : this.labisReplayMode ? "manual-replay" : "automatic";
    this.recordChapterExperienceChoice("labis-motor-day", eventId, mode, choice);
  }

  private responseLines(response: string): string[] {
    return response.split(/<br\s*\/?>/i).map((line) => line.trim()).filter(Boolean);
  }

  private inspectLabisShop(): void {
    this.overlay.innerHTML = `<div class="modal"><h2>Labis</h2><p>家里的店就在马路对面。</p><p>这个下午本来没有什么特别。</p><button data-action="close">Close</button></div>`;
    this.focusStage();
  }

  private showEndingQuote(): void {
    const chapterId = this.currentMemoryKey();
    const chapter = chapterRegistry[chapterId];
    if (!chapter) return;
    const progress = this.currentRunProgressFor(chapterId);
    const reflection = resolveChapterReflection(chapter, progress);
    this.completeChapterMemoryRun(chapterId, chapter.canonicalClosure.historicalEventId, reflection);
    this.renderEndingQuote("after the conversation", "The rain slows", reflection);
    this.audio.ping("ending");
    this.autosave();
  }

  private showChapterEndingQuote(kicker: string, title: string, leadLines: string[] = []): void {
    const chapterId = this.currentMemoryKey();
    const chapter = chapterRegistry[chapterId];
    if (!chapter) return;
    const progress = this.currentRunProgressFor(chapterId);
    const reflection = resolveChapterReflection(chapter, progress);
    this.completeChapterMemoryRun(chapterId, chapter.canonicalClosure.historicalEventId, reflection);
    this.renderEndingQuote(kicker, title, reflection, leadLines);
    this.audio.ping("ending");
  }

  private renderEndingQuote(kicker: string, title: string, reflection: ReturnType<typeof resolveChapterReflection>, leadLines: string[] = []): void {
    const lead = leadLines.length ? `<p class="memory-line">${leadLines.map((line) => this.escapeHtml(line)).join("<br>")}</p>` : "";
    const quoteTitle = reflection.title ?? title;
    const afterline = reflection.afterline ?? "Some places do not ask us to make them dramatic. They simply keep the afternoon until we are ready to see it.";
    this.overlay.classList.add("dialogue-open", "lightweight-presentation");
    this.overlay.innerHTML = renderReflection({
      kicker,
      title: quoteTitle,
      leadLines,
      closureLines: reflection.closureLines,
      quoteLines: reflection.lines,
      lines: reflection.lines,
      afterline,
      actions: `<button data-action="reflection-keep-chapter" data-chapter="${this.escapeHtml(this.currentMemoryKey())}" data-text="${this.escapeHtml(reflection.lines.join("\n"))}">Keep this</button><button data-action="close">Close</button><button data-action="forest">Return to Forest</button>`
    });
  }

  private finishBakery(): void {
    const door = this.completeBakeryProgress();
    this.scene = "forest";
    this.player = { x: door.x, y: Math.min(760, door.y + 120) };
    this.overlay.innerHTML = `<div class="modal"><h2>Walked through</h2><p>The timeline keeps the day as it was.</p><button data-action="close">Return</button><button data-action="forest">Return to Forest</button></div>`;
    this.autosave();
  }

  private completeBakeryProgress(): ForestNode {
    const door = this.currentDoor ?? forestEntries[1];
    const chapterId = this.chapterIdFor(door);
    const progress = this.progressFor(chapterId);
    const reflection = resolveChapterReflection(chapterRegistry[chapterId], progress);
    this.chapterProgress.set(chapterId, finishChapterWalkthrough(progress, reflection.quoteId, reflection.tone));
    this.walkedThroughMemories.add(chapterId);
    this.selectedChapter = door.title;
    return door;
  }

  private returnToForest(): void {
    if (this.scene === "labis" && this.completedMemoryEvents.has("july19-motor-learning")) {
      return this.continueLabisReflectionBeforeExit();
    }
    this.finishReturnToForest();
  }

  private finishReturnToForest(): void {
    const leavingDoor = this.scene === "bakery" || this.scene === "labis" || this.isAuthoredRuntimeScene() ? this.currentDoor : null;
    if (leavingDoor && this.isChapterNode(leavingDoor)) this.chapterTriggerSessions.delete(this.chapterIdFor(leavingDoor));
    const leavingRoom = this.scene === "muji-room";
    const keepPersonalMusic = personalMusicShouldPlayInScene(this.scene) && this.personalPlayer.playing && Boolean(this.personalPlayer.selectedTrackId);
    this.syncPersonalPlaybackState();
    this.labisCutscene = null;
    this.labisDialogueOpen = false;
    this.labisReplayMode = false;
    this.labisLessonChoiceIndex = -1;
    this.labisLessonLeadLines = [];
    this.resetMarch30Runtime();
    this.resetAuthoredRuntime();
    this.chapterMemoryRun = null;
    this.scene = "forest";
    this.overlay.classList.remove("dialogue-open");
    this.overlay.innerHTML = "";
    const forestLayout = this.currentSceneLayout("forest");
    this.player = leavingDoor && forestLayout.orientation === "landscape"
      ? { x: leavingDoor.x, y: Math.min(760, leavingDoor.y + 120) }
      : { ...forestLayout.spawn };
    this.room.windowFocus = false;
    this.showToast(leavingDoor ? "You can come back when you are ready." : leavingRoom ? "Returned to forest" : "Returned to forest");
    this.focusStage();
    if (keepPersonalMusic) this.updatePersonalMusicOverlay();
    else this.applyAudioForCurrentScene();
    this.autosave();
  }

  private draw(time: number): void {
    const compact = this.settings.compact;
    const activeLayout = this.hasSceneLayout(this.scene) ? this.currentSceneLayout() : null;
    if (activeLayout?.orientation === "portrait") {
      this.canvas.width = activeLayout.size.w;
      this.canvas.height = activeLayout.size.h;
    } else {
      this.canvas.width = compact ? 480 : 960;
      this.canvas.height = compact ? 270 : 540;
    }
    this.root.dataset.orientation = activeLayout?.orientation ?? "landscape";
    this.ctx.imageSmoothingEnabled = false;
    if (this.scene === "title") this.drawTitle(time);
    if (this.scene === "forest") this.drawScene(this.currentSceneLayout("forest"), time, "forest");
    if (this.scene === "bakery") this.drawScene(this.currentSceneLayout("bakery"), time, "bakery");
    if (this.scene === "labis") this.drawLabisScene(time);
    if (this.scene === "muji-room") this.drawMujiRoomScene(time);
    if (this.isAuthoredRuntimeScene()) this.drawAuthoredScene(time);
    if (this.scene === "ending") this.drawEnding();
    this.drawHud();
  }

  private drawTitle(time: number): void {
    this.ctx.drawImage(this.images.forest, 0, 0, 1536, 864, 0, 0, this.canvas.width, this.canvas.height);
    this.ctx.fillStyle = "rgba(2,8,18,.48)";
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.fillStyle = "#f4dca9";
    this.ctx.font = `${this.canvas.width > 600 ? 54 : 30}px Georgia`;
    this.ctx.fillText("Walk Back Home", 46, 105);
    this.ctx.font = "18px Georgia";
    this.ctx.fillText("不是回到过去修复一切，而是陪过去的自己走一段路。", 50, 145);
    this.drawMuji({ x: this.canvas.width * 0.52, y: this.canvas.height * 0.82 }, time, this.canvas.width / 960);
  }

  private drawAuthoredScene(time: number): void {
    if (this.scene === "330-corridor") return this.drawMarch30Scene(time);
    if (this.scene === "406") return this.drawApril06Scene(time);
    this.drawScene(this.currentSceneLayout(), time, "authored");
  }

  private drawApril06Scene(time: number): void {
    const layout = this.currentSceneLayout();
    const image = this.sceneImage(layout);
    const viewport = this.sceneViewport(layout);
    const scale = this.canvas.width / viewport.w;
    const camera = this.sceneCamera(layout, viewport.w, viewport.h);
    this.ctx.drawImage(image, camera.x, camera.y, viewport.w, viewport.h, 0, 0, this.canvas.width, this.canvas.height);
    if (!image.complete || image.naturalWidth === 0) this.ctx.fillStyle = "rgba(20,16,28,.18)";
    if (this.authoredCutscene) {
      this.ctx.fillStyle = "rgba(226, 181, 109, .10)";
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }
    const diary = layout.interactions.find((interaction) => interaction.id === "diary" || interaction.id === "diary memory");
    if (diary) this.drawSharedDiaryBookProp(diary, camera.x, camera.y, scale, time);
    const actors = this.authoredCutscene ? [...this.authoredCutscene.actors.values()] : [];
    const mujiScreen = { x: (this.player.x - camera.x) * scale, y: (this.player.y - camera.y) * scale };
    const drawables = [
      ...actors.map((actor) => ({ y: actor.y, draw: () => drawSceneActor(this.ctx, actor, camera.x, camera.y, scale, april06Assets, this.authoredImages) })),
      { y: this.player.y, draw: () => { this.ctx.save(); this.ctx.globalAlpha = this.authoredCutscene ? 0.34 : 1; this.drawMuji(mujiScreen, time, scale); this.ctx.restore(); } }
    ].sort((a, b) => a.y - b.y);
    drawables.forEach((item) => item.draw());
    if (this.authoredCutscene) {
      for (const prop of this.authoredCutscene.props.values()) if (prop.visible) this.drawAuthoredProp(prop, camera.x, camera.y, scale);
      for (const effect of this.authoredCutscene.effects.values()) this.drawAuthoredEffect(effect, camera.x, camera.y, scale);
    } else if (!this.authoredOverlayMode) {
      this.drawAuthoredInteractionTells(layout, camera.x, camera.y, scale, time);
    }
    const vignette = this.ctx.createRadialGradient(this.canvas.width / 2, this.canvas.height / 2, 160, this.canvas.width / 2, this.canvas.height / 2, this.canvas.height * 0.82);
    vignette.addColorStop(0, "rgba(0,0,0,0)");
    vignette.addColorStop(1, "rgba(0,0,0,.28)");
    this.ctx.fillStyle = vignette;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }

  private drawAuthoredProp(prop: { id: string; assetId: string; owner?: string; position?: Point; visible: boolean }, cameraX: number, cameraY: number, scale: number): void {
    const asset = april06Assets[prop.assetId as keyof typeof april06Assets];
    const image = asset ? this.authoredImages.get(asset.path) : undefined;
    if (!asset || !image || !image.complete || image.naturalWidth === 0) return;
    const owner = prop.owner ? this.authoredCutscene?.actors.get(prop.owner) : undefined;
    const position = owner ? { x: owner.x + (owner.id === "et" ? -18 : 18), y: owner.y - 62 } : prop.position;
    if (!position) return;
    drawSceneSpriteAsset(this.ctx, image, asset, position, cameraX, cameraY, scale, owner?.facing ?? "right", 1, prop.id === "mcd" ? 72 : 120);
  }

  private drawAuthoredEffect(effect: { id: string; kind: "water-vfx" | "dissolve"; position?: Point; progress: number }, cameraX: number, cameraY: number, scale: number): void {
    if (effect.id !== "alza-headlights" || !effect.position) return;
    const asset = april06Assets.headlights;
    const image = this.authoredImages.get(asset.path);
    if (!image || !image.complete || image.naturalWidth === 0) return;
    drawSceneSpriteAsset(this.ctx, image, asset, effect.position, cameraX, cameraY, scale, "left", Math.max(0, 0.54 * (1 - effect.progress)), 160);
  }

  private drawAuthoredInteractionTells(layout: SceneLayout, cameraX: number, cameraY: number, scale: number, time: number): void {
    const anchors = layout.echoAnchors ? [resolveSceneEchoAnchor(layout, "watergun-crossing")].filter((anchor): anchor is NonNullable<typeof anchor> => Boolean(anchor)) : [];
    const points = [...layout.interactions.map((item) => ({ id: item.id, x: item.x, y: item.y, radius: item.radius })), ...anchors.map((anchor) => ({ id: "watergun-crossing", x: anchor.x, y: anchor.y, radius: anchor.radius }))];
    for (const point of points) {
      const x = (point.x - cameraX) * scale;
      const y = (point.y - cameraY) * scale;
      const active = this.activeObject === point.id;
      const pulse = Math.sin(time / 360) * 0.5 + 0.5;
      const radius = (active ? 22 + pulse * 4 : 14 + pulse * 2) * scale;
      const glowRadius = (active ? 44 : 28) * scale;
      const glow = this.ctx.createRadialGradient(x, y, 1, x, y, glowRadius);
      glow.addColorStop(0, active ? "rgba(255, 229, 166, .52)" : "rgba(255, 226, 154, .30)");
      glow.addColorStop(1, "rgba(213, 166, 87, 0)");
      this.ctx.fillStyle = glow;
      this.ctx.beginPath();
      this.ctx.arc(x, y, glowRadius, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.save();
      this.ctx.globalAlpha = active ? 0.86 : 0.58;
      this.ctx.strokeStyle = active ? "rgba(255, 231, 172, .92)" : "rgba(255, 231, 172, .70)";
      this.ctx.lineWidth = active ? 1.4 * scale : 1 * scale;
      this.ctx.beginPath();
      this.ctx.arc(x, y, radius, 0, Math.PI * 2);
      this.ctx.stroke();
      this.ctx.restore();
    }
  }
  private drawMarch30Scene(time: number): void {
    const layout = this.currentSceneLayout();
    const image = this.sceneImage(layout);
    const viewport = this.sceneViewport(layout);
    const scale = this.canvas.width / viewport.w;
    const camera = this.sceneCamera(layout, viewport.w, viewport.h);
    this.ctx.drawImage(image, camera.x, camera.y, viewport.w, viewport.h, 0, 0, this.canvas.width, this.canvas.height);
    if (!image.complete || image.naturalWidth === 0) this.ctx.fillStyle = "rgba(20,16,28,.18)";
    if (this.march30Cutscene) {
      this.ctx.fillStyle = "rgba(226, 181, 109, .10)";
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }
    const actors = this.march30Cutscene ? [...this.march30Cutscene.actors.values()] : [];
    const mujiScreen = { x: (this.player.x - camera.x) * scale, y: (this.player.y - camera.y) * scale };
    const drawables = [
      ...actors.map((actor) => ({ y: actor.y, draw: () => this.drawMarch30Actor(actor, camera.x, camera.y, scale) })),
      { y: this.player.y, draw: () => { this.ctx.save(); this.ctx.globalAlpha = this.march30Cutscene ? 0.34 : 1; this.drawMuji(mujiScreen, time, scale); this.ctx.restore(); } }
    ].sort((a, b) => a.y - b.y);
    drawables.forEach((item) => item.draw());
    if (this.march30Cutscene) {
      for (const prop of this.march30Cutscene.props.values()) if (prop.visible) this.drawMarch30Prop(prop, camera.x, camera.y, scale);
      for (const effect of this.march30Cutscene.effects.values()) this.drawMarch30Effect(effect, camera.x, camera.y, scale);
    } else if (!this.march30OverlayMode) {
      this.drawMarch30InteractionTells(layout, camera.x, camera.y, scale, time);
    }
    const vignette = this.ctx.createRadialGradient(this.canvas.width / 2, this.canvas.height / 2, 160, this.canvas.width / 2, this.canvas.height / 2, this.canvas.height * 0.82);
    vignette.addColorStop(0, "rgba(0,0,0,0)");
    vignette.addColorStop(1, "rgba(0,0,0,.28)");
    this.ctx.fillStyle = vignette;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }

  private drawMarch30InteractionTells(layout: SceneLayout, cameraX: number, cameraY: number, scale: number, time: number): void {
    const diaryAssetPath = "assets/labis/book-with-ms-photos.png";
    const diaryImage = this.labisImages.get(diaryAssetPath);
    for (const interaction of layout.interactions) {
      const x = (interaction.x - cameraX) * scale;
      const y = (interaction.y - cameraY) * scale;
      const active = this.activeObject === interaction.id;
      const pulse = Math.sin(time / 360) * 0.5 + 0.5;
      const baseRadius = (active ? 22 + pulse * 4 : 14 + pulse * 2) * scale;
      const glowRadius = (active ? 44 : 28) * scale;
      const glow = this.ctx.createRadialGradient(x, y, 1, x, y, glowRadius);
      glow.addColorStop(0, active ? "rgba(255, 229, 166, .52)" : "rgba(255, 226, 154, .30)");
      glow.addColorStop(0.55, active ? "rgba(213, 166, 87, .18)" : "rgba(213, 166, 87, .10)");
      glow.addColorStop(1, "rgba(213, 166, 87, 0)");
      this.ctx.fillStyle = glow;
      this.ctx.beginPath();
      this.ctx.arc(x, y, glowRadius, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.save();
      this.ctx.globalAlpha = active ? 0.86 : 0.58;
      this.ctx.strokeStyle = active ? "rgba(255, 231, 172, .92)" : "rgba(255, 231, 172, .70)";
      this.ctx.lineWidth = active ? 1.4 * scale : 1 * scale;
      this.ctx.beginPath();
      this.ctx.arc(x, y, baseRadius, 0, Math.PI * 2);
      this.ctx.stroke();
      this.ctx.restore();
      if (interaction.id === "diary" && diaryImage?.complete && diaryImage.naturalWidth > 0) {
        this.ctx.save();
        this.ctx.imageSmoothingEnabled = false;
        this.ctx.globalAlpha = 0.84 + pulse * 0.12;
        const diaryWidth = 128 * MARCH30_MATERIAL_SCALE * scale;
        const diaryHeight = 104 * MARCH30_MATERIAL_SCALE * scale;
        this.ctx.drawImage(diaryImage, x - diaryWidth / 2, y - diaryHeight, diaryWidth, diaryHeight);
        this.ctx.restore();
      }
    }
  }

  private drawMarch30Actor(actor: Parameters<typeof drawSceneActor>[1], cameraX: number, cameraY: number, scale: number): void {
    const sprite = actor.sprite;
    const asset = sprite ? march30Assets[sprite.assetId as keyof typeof march30Assets] : undefined;
    const spriteAsset = asset && "frames" in asset ? asset : undefined;
    const frame = sprite && spriteAsset ? spriteAsset.frames[sprite.frame] : undefined;
    const image = spriteAsset ? this.march30Images.get(spriteAsset.path) : undefined;
    if (!sprite || !spriteAsset || !frame || !image?.complete || image.naturalWidth === 0) {
      drawSceneActor(this.ctx, actor, cameraX, cameraY, scale);
      return;
    }
    const materialScale = this.march30ScaleForAsset(sprite.assetId);
    const destinationHeight = 154 * materialScale * scale;
    const destinationWidth = destinationHeight * frame.source.w / frame.source.h;
    const feetX = (actor.x - cameraX) * scale;
    const feetY = (actor.y - cameraY) * scale;
    const visible = spriteAsset.visibleBounds?.[sprite.frame] ?? { x: 0, y: 0, w: frame.source.w, h: frame.source.h };
    const visibleLeft = visible.x / frame.source.w * destinationWidth;
    const visibleTop = visible.y / frame.source.h * destinationHeight;
    const visibleWidth = visible.w / frame.source.w * destinationWidth;
    const visibleHeight = visible.h / frame.source.h * destinationHeight;
    const left = feetX - frame.feet.x / frame.source.w * destinationWidth;
    const top = feetY - frame.feet.y / frame.source.h * destinationHeight;
    this.ctx.save();
    this.ctx.globalAlpha = actor.opacity ?? 1;
    this.ctx.imageSmoothingEnabled = false;
    if (spriteAsset.mirrorForLeft && actor.facing === "left") {
      this.ctx.translate(left + destinationWidth, top);
      this.ctx.scale(-1, 1);
      this.ctx.drawImage(image, frame.source.x + visible.x, frame.source.y + visible.y, visible.w, visible.h, visibleLeft, visibleTop, visibleWidth, visibleHeight);
    } else {
      this.ctx.drawImage(image, frame.source.x + visible.x, frame.source.y + visible.y, visible.w, visible.h, left + visibleLeft, top + visibleTop, visibleWidth, visibleHeight);
    }
    if ((actor.opacity ?? 1) < 1) {
      const dissolve = march30Assets.dissolve;
      const dissolveFrame = dissolve.frames[Math.min(7, Math.floor((1 - (actor.opacity ?? 1)) * 8))];
      const dissolveImage = this.march30Images.get(dissolve.path);
      if (dissolveImage?.complete && dissolveImage.naturalWidth > 0) {
        this.ctx.globalAlpha = 0.32;
        this.ctx.drawImage(dissolveImage, dissolveFrame.source.x, dissolveFrame.source.y, dissolveFrame.source.w, dissolveFrame.source.h, left, top, destinationWidth, destinationHeight);
      }
    }
    this.ctx.restore();
  }

  private drawMarch30Prop(prop: { id: string; assetId: string; owner?: string; visible: boolean }, cameraX: number, cameraY: number, scale: number): void {
    const owner = prop.owner ? this.march30Cutscene?.actors.get(prop.owner) : undefined;
    const asset = Object.values(march30Assets).find((candidate) => candidate.path === prop.assetId);
    const image = asset && "source" in asset ? this.march30Images.get(asset.path) : undefined;
    if (!owner || !asset || !("source" in asset) || !image?.complete || image.naturalWidth === 0) return;
    const side = owner.id === "et" ? -1 : 1;
    const position = { x: owner.x + side * 19, y: owner.y - 78 };
    const height = (prop.id === "gift" ? 42 : prop.id === "waterGun" ? 44 : 50) * this.march30ScaleForProp(prop.id) * scale;
    const width = height * asset.source.w / asset.source.h;
    this.ctx.save();
    this.ctx.imageSmoothingEnabled = false;
    this.ctx.drawImage(image, asset.source.x, asset.source.y, asset.source.w, asset.source.h, (position.x - cameraX) * scale - width / 2, (position.y - cameraY) * scale - height / 2, width, height);
    this.ctx.restore();
  }

  private drawMarch30Effect(effect: { kind: "water-vfx" | "dissolve"; actor?: string; target?: string; frame?: number; progress: number }, cameraX: number, cameraY: number, scale: number): void {
    if (effect.kind !== "water-vfx") return;
    const sourceAsset = march30Assets.waterVfx;
    const frameIndex = effect.frame ?? 0;
    const frame = sourceAsset.frames[frameIndex];
    const bounds = sourceAsset.visibleBounds?.[frameIndex];
    const actor = effect.actor ? this.march30Cutscene?.actors.get(effect.actor) : undefined;
    const target = effect.target ? this.march30Cutscene?.actors.get(effect.target) : undefined;
    const actorSprite = actor?.sprite ? march30Assets[actor.sprite.assetId as keyof typeof march30Assets] : undefined;
    const actorFrame = actor?.sprite && actorSprite && "frames" in actorSprite ? actorSprite.frames[actor.sprite.frame] : undefined;
    const image = this.march30Images.get(sourceAsset.path);
    if (!frame || !bounds || !actor || !target || !actorFrame || !actorSprite || !("frames" in actorSprite) || !image?.complete || image.naturalWidth === 0) return;
    const actorMaterialScale = actor.sprite ? this.march30ScaleForAsset(actor.sprite.assetId) : MARCH30_MATERIAL_SCALE;
    const actorHeight = 154 * actorMaterialScale * scale;
    const actorWidth = actorHeight * actorFrame.source.w / actorFrame.source.h;
    const actorLeft = (actor.x - cameraX) * scale - actorFrame.feet.x / actorFrame.source.w * actorWidth;
    const actorTop = (actor.y - cameraY) * scale - actorFrame.feet.y / actorFrame.source.h * actorHeight;
    const nozzle = actorSprite.nozzleOriginByFrame?.[actor.sprite?.frame ?? 0] ?? { x: 0.78, y: 0.42 };
    const nozzleX = actor.facing === "left" && actorSprite.mirrorForLeft ? 1 - nozzle.x : nozzle.x;
    const start = { x: actorLeft + nozzleX * actorWidth, y: actorTop + nozzle.y * actorHeight };
    const targetFrame = target.sprite ? march30Assets[target.sprite.assetId as keyof typeof march30Assets] : undefined;
    const targetRect = target.sprite && targetFrame && "frames" in targetFrame ? targetFrame.frames[target.sprite.frame] : undefined;
    const targetMaterialScale = target.sprite ? this.march30ScaleForAsset(target.sprite.assetId) : MARCH30_MATERIAL_SCALE;
    const targetHeight = 154 * targetMaterialScale * scale;
    const targetWidth = targetRect ? targetHeight * targetRect.source.w / targetRect.source.h : 46 * scale;
    const targetX = (target.x - cameraX) * scale + (target.facing === "right" ? -0.12 : 0.12) * targetWidth;
    const targetY = (target.y - cameraY) * scale - targetHeight * 0.62;
    const end = { x: targetX, y: targetY };
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const distance = Math.hypot(dx, dy) * Math.max(0.35, effect.progress);
    this.ctx.save();
    this.ctx.globalAlpha = 0.8;
    this.ctx.translate(start.x, start.y);
    this.ctx.rotate(Math.atan2(dy, dx));
    this.ctx.imageSmoothingEnabled = false;
    this.ctx.drawImage(image, frame.source.x + bounds.x, frame.source.y + bounds.y, bounds.w, bounds.h, 0, -4 * MARCH30_MATERIAL_SCALE * scale, Math.max(12 * MARCH30_MATERIAL_SCALE * scale, distance), 8 * MARCH30_MATERIAL_SCALE * scale);
    this.ctx.restore();
  }

  private march30ScaleForAsset(assetId: string): number {
    if (assetId === "waterSpraying" || assetId === "keychains") return MARCH30_MATERIAL_SCALE;
    return MARCH30_MATERIAL_SCALE;
  }

  private march30ScaleForProp(propId: string): number {
    return propId === "gift" || propId === "waterGun" || propId === "ordinaryKeychain" || propId === "phoneCharm" ? MARCH30_LARGE_MATERIAL_SCALE : MARCH30_MATERIAL_SCALE;
  }

  private drawScene(layout: SceneLayout, time: number, kind: "forest" | "bakery" | "authored"): void {
    const image = this.sceneImage(layout);
    const viewport = this.sceneViewport(layout);
    const scale = this.canvas.width / viewport.w;
    const camera = this.sceneCamera(layout, viewport.w, viewport.h);
    const cameraX = camera.x;
    const cameraY = camera.y;
    this.ctx.drawImage(image, cameraX, cameraY, viewport.w, viewport.h, 0, 0, this.canvas.width, this.canvas.height);
    this.particles.draw(this.ctx, time, this.settings.rain && kind === "forest", cameraX, cameraY, scale);
    if (kind === "forest") {
      this.drawDoors(layout, cameraX, cameraY, scale);
    }
    if (kind === "bakery") {
      const memorySpot = this.sceneInteractionById(layout, "diary-memory");
      const friend = this.sceneInteractionById(layout, "friend-a");
      const pastry = this.sceneInteractionById(layout, "pastry");
      if (memorySpot) this.drawSharedDiaryBookProp(memorySpot, cameraX, cameraY, scale, time);
      if (pastry) this.drawBakeryPastry(pastry, cameraX, cameraY, scale, time);
      if (friend) this.drawFriendA(friend, cameraX, cameraY, scale);
    }
    this.drawMuji({ x: (this.player.x - cameraX) * scale, y: (this.player.y - cameraY) * scale }, time, scale);
    const vignette = this.ctx.createRadialGradient(this.canvas.width / 2, this.canvas.height / 2, 120, this.canvas.width / 2, this.canvas.height / 2, this.canvas.height * 0.72);
    vignette.addColorStop(0, "rgba(0,0,0,0)");
    vignette.addColorStop(1, "rgba(0,0,0,.52)");
    this.ctx.fillStyle = vignette;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }

  private drawLabisScene(time: number): void {
    const layout = this.currentSceneLayout("labis");
    const image = this.sceneImage(layout);
    const viewport = this.sceneViewport(layout);
    const scale = this.canvas.width / viewport.w;
    const camera = this.sceneCamera(layout, viewport.w, viewport.h);
    const cameraX = camera.x;
    const cameraY = camera.y;
    this.ctx.drawImage(image, cameraX, cameraY, viewport.w, viewport.h, 0, 0, this.canvas.width, this.canvas.height);
    if (!image.complete || image.naturalWidth === 0) this.drawLabisFallback(scale);

    if (this.labisCutscene || this.labisActiveEcho) {
      this.ctx.fillStyle = "rgba(226, 181, 109, .10)";
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }
    const diaryMemory = this.labisDiaryMemoryInteraction(layout);
    if (diaryMemory && !this.labisCutscene && !this.labisOverlayMode) this.drawLabisDiaryBookProp(diaryMemory, cameraX, cameraY, scale, time);
    if (!this.labisCutscene && !this.labisOverlayMode) this.drawLabisMemoryTells(cameraX, cameraY, scale, time);
    if (this.labisActiveEcho) this.drawLabisEchoVisual(this.labisActiveEcho, cameraX, cameraY, scale, time);

    const actorList = this.labisCutscene ? [...this.labisCutscene.actors.values()] : [];
    const mujiScreen = { x: (this.player.x - cameraX) * scale, y: (this.player.y - cameraY) * scale };
    const drawables = [
      ...actorList.map((actor) => ({ y: actor.y, draw: () => this.drawLabisSceneActor(actor, cameraX, cameraY, scale) })),
      { y: this.player.y, draw: () => this.drawMuji(mujiScreen, time, scale) }
    ].sort((a, b) => a.y - b.y);
    drawables.forEach((item) => item.draw());

    const vignette = this.ctx.createRadialGradient(this.canvas.width / 2, this.canvas.height / 2, 160, this.canvas.width / 2, this.canvas.height / 2, this.canvas.height * 0.82);
    vignette.addColorStop(0, "rgba(0,0,0,0)");
    vignette.addColorStop(1, "rgba(0,0,0,.24)");
    this.ctx.fillStyle = vignette;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }

  private drawLabisFallback(scale: number): void {
    this.ctx.fillStyle = "#d0b07b";
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.fillStyle = "#7d6f5e";
    this.ctx.fillRect(0, 310 * scale, this.canvas.width, 230 * scale);
    this.ctx.fillStyle = "#8f6447";
    this.ctx.fillRect(90 * scale, 70 * scale, 760 * scale, 210 * scale);
    this.ctx.fillStyle = "#4c6b48";
    this.ctx.fillRect(790 * scale, 65 * scale, 90 * scale, 170 * scale);
  }

  private isLabisImageReady(src?: string): boolean {
    if (!src) return false;
    const image = this.labisImages.get(src);
    return Boolean(image?.complete && image.naturalWidth > 0);
  }

  private drawLabisImage(src: string | undefined, x: number, y: number, width: number, height: number): boolean {
    if (!src) return false;
    const image = this.labisImages.get(src);
    if (!image?.complete || image.naturalWidth === 0) return false;
    this.ctx.drawImage(image, x - width / 2, y - height, width, height);
    return true;
  }

  private drawLabisSceneActor(actor: Parameters<typeof drawSceneActor>[1], cameraX: number, cameraY: number, scale: number): void {
    const x = (actor.x - cameraX) * scale;
    const y = (actor.y - cameraY) * scale;
    const pose = actor.expression ?? "idle";
    const src = actor.id === "ms" ? labisAssetPath("ms", pose) : actor.id === "motor" ? labisAssetPath("et", pose) : undefined;
    if (actor.id === "motor" && this.drawLabisImage(src, x, y + 42 * scale, 218 * scale, 172 * scale)) return;
    if (actor.id === "ms" && this.drawLabisImage(src, x, y + 42 * scale, 142 * scale, 172 * scale)) return;
    drawSceneActor(this.ctx, actor, cameraX, cameraY, scale);
  }

  private drawLabisDiaryBookProp(diaryMemory: SceneInteraction, cameraX: number, cameraY: number, scale: number, time: number): void {
    this.drawSharedDiaryBookProp(diaryMemory, cameraX, cameraY, scale, time);
  }

  private drawSharedDiaryBookProp(diaryMemory: SceneInteraction, cameraX: number, cameraY: number, scale: number, time: number): void {
    const x = (diaryMemory.x - cameraX) * scale;
    const y = (diaryMemory.y - cameraY) * scale;
    const pulse = Math.sin(time / 460) * 0.5 + 0.5;
    const image = this.labisImages.get(sharedChapterDiaryBookAssetPath);
    this.ctx.save();
    this.ctx.globalAlpha = 0.56 + pulse * 0.24;
    const glow = this.ctx.createRadialGradient(x, y - 22 * scale, 3 * scale, x, y - 22 * scale, 72 * scale);
    glow.addColorStop(0, "rgba(255, 232, 166, .66)");
    glow.addColorStop(1, "rgba(255, 232, 166, 0)");
    this.ctx.fillStyle = glow;
    this.ctx.beginPath();
    this.ctx.arc(x, y - 22 * scale, 72 * scale, 0, Math.PI * 2);
    this.ctx.fill();
    if (image?.complete && image.naturalWidth > 0) {
      this.ctx.imageSmoothingEnabled = false;
      this.ctx.drawImage(image, x - 64 * scale, y - 86 * scale, 128 * scale, 104 * scale);
    } else {
      this.drawMemoryTableFallback(x, y, scale * 1.05);
    }
    this.ctx.restore();
  }

  private drawLabisMemoryTells(cameraX: number, cameraY: number, scale: number, time: number): void {
    for (const echo of this.resolveLabisEchoesForCurrentLayout()) {
      if (!this.canUseLabisEcho(echo)) continue;
      const x = (echo.x - cameraX) * scale;
      const y = (echo.y - cameraY) * scale;
      if (x < -80 || y < -80 || x > this.canvas.width + 80 || y > this.canvas.height + 80) continue;
      const pulse = Math.sin(time / 420 + echo.x) * 0.5 + 0.5;
      this.ctx.save();
      this.ctx.globalAlpha = 0.58 + pulse * 0.32;
      const clue = this.ctx.createRadialGradient(x, y - 26 * scale, 2 * scale, x, y - 26 * scale, 86 * scale);
      clue.addColorStop(0, "rgba(255, 241, 184, .84)");
      clue.addColorStop(0.45, "rgba(255, 221, 126, .32)");
      clue.addColorStop(1, "rgba(255, 231, 166, 0)");
      this.ctx.fillStyle = clue;
      this.ctx.beginPath();
      this.ctx.arc(x, y - 26 * scale, 86 * scale, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.strokeStyle = "rgba(255, 239, 188, .4)";
      this.ctx.lineWidth = 1.2 * scale;
      this.ctx.beginPath();
      this.ctx.arc(x, y - 26 * scale, (30 + pulse * 10) * scale, 0, Math.PI * 2);
      this.ctx.stroke();
      if (echo.tell === "steam") {
        this.ctx.strokeStyle = "rgba(255, 246, 205, .62)";
        this.ctx.lineWidth = 1.8 * scale;
        for (let i = 0; i < 3; i += 1) {
          this.ctx.beginPath();
          this.ctx.moveTo(x + i * 6 * scale, y - 4 * scale);
          this.ctx.bezierCurveTo(x - 8 * scale + i * 5 * scale, y - 18 * scale, x + 12 * scale, y - 30 * scale, x + i * 3 * scale, y - 44 * scale);
          this.ctx.stroke();
        }
      } else if (echo.tell === "reflection" || echo.tell === "windshield" || echo.tell === "paper") {
        this.ctx.fillStyle = "rgba(255, 235, 180, .46)";
        this.ctx.fillRect(x - 38 * scale, y - 20 * scale, 76 * scale, 3 * scale);
      } else if (echo.tell === "sound") {
        this.ctx.fillStyle = "rgba(255, 238, 190, .64)";
        this.ctx.font = `${20 * scale}px Georgia`;
        this.ctx.fillText("啪", x, y - 28 * scale);
        this.ctx.strokeStyle = "rgba(255, 238, 190, .34)";
        this.ctx.beginPath();
        this.ctx.moveTo(x - 48 * scale, y - 20 * scale);
        this.ctx.quadraticCurveTo(x, y - 72 * scale, x + 62 * scale, y - 30 * scale);
        this.ctx.stroke();
      } else if (echo.tell === "hidden-star") {
        this.ctx.fillStyle = "rgba(255, 235, 174, .52)";
        this.ctx.font = `${22 * scale}px Georgia`;
        this.ctx.fillText("✦", x, y - 14 * scale);
      }
      this.ctx.restore();
    }
  }

  private drawLabisEchoVisual(echo: LabisEcho, cameraX: number, cameraY: number, scale: number, time: number): void {
    echo = this.resolveLabisEchoForCurrentLayout(echo);
    const x = (echo.x - cameraX) * scale;
    const y = (echo.y - cameraY) * scale;
    const age = Math.max(0, (time - this.labisVignetteStartedAt) / 1000);
    this.ctx.save();
    this.ctx.globalAlpha = Math.min(1, 0.25 + age * 1.6);
    this.ctx.fillStyle = "rgba(28, 21, 16, .18)";
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    if (echo.id === "july19-photo-threat") {
      this.drawLabisImage(labisAssetPath("ms", "holding_book"), x - 126 * scale, y + 54 * scale, 204 * scale, 186 * scale) || this.drawMemoryTableFallback(x - 126 * scale, y + 16 * scale, scale * 1.85);
      this.drawLabisImage(labisAssetPath("ms", "confused"), x + 12 * scale, y + 58 * scale, 164 * scale, 202 * scale) || this.drawEchoHuman(x + 12 * scale, y + 28 * scale, scale * 2.05, "#f1eadc", false);
      this.drawLabisImage(labisAssetPath("et", age > 2.2 ? "photo_smug" : "phone"), x + 154 * scale, y + 58 * scale, 172 * scale, 202 * scale) || this.drawEchoHuman(x + 154 * scale, y + 28 * scale, scale * 2.05, "#202020", true);
    } else if (echo.id === "july19-chicken-porridge" || echo.id === "july19-fried-noodles") {
      this.drawMemoryTableFallback(x, y, scale * 1.35);
      const prop = echo.id === "july19-chicken-porridge" ? labisAssetPath("prop", "chicken_porridge") : labisAssetPath("prop", "fried_noodles");
      this.drawLabisImage(prop, x, y + 2 * scale, 158 * scale, 100 * scale) || this.drawFoodFallback(x, y - 28 * scale, scale * 1.75, echo.id === "july19-chicken-porridge");
    } else if (echo.id === "july19-haircut") {
      this.drawLabisImage(labisAssetPath("et", "haircut_happy"), x, y + 56 * scale, 188 * scale, 224 * scale) || this.drawEchoHuman(x, y + 30 * scale, scale * 2.25, "#202020", true);
    } else if (echo.id === "july19-kancil") {
      this.ctx.strokeStyle = "rgba(255, 248, 210, .58)";
      this.ctx.strokeRect(x - 66 * scale, y - 52 * scale, 132 * scale, 74 * scale);
      this.ctx.fillStyle = "rgba(255, 248, 210, .16)";
      this.ctx.fillRect(x - 58 * scale, y - 44 * scale, 116 * scale, 56 * scale);
    } else if (echo.id === "july19-badminton") {
      this.drawLabisImage(labisAssetPath("prop", "badminton"), x, y + 20 * scale, 172 * scale, 128 * scale);
      this.ctx.fillStyle = "rgba(255,255,230,.72)";
      this.ctx.beginPath();
      this.ctx.arc(x + Math.sin(time / 180) * 60 * scale, y - 52 * scale + Math.cos(time / 210) * 16 * scale, 4 * scale, 0, Math.PI * 2);
      this.ctx.fill();
    } else if (echo.id === "july19-filter-evening") {
      this.drawLabisImage(labisAssetPath("prop", "filter_manual_table"), x, y + 58 * scale, 368 * scale, 222 * scale) || this.drawMemoryTableFallback(x, y + 20 * scale, scale * 2.05);
      this.drawLabisImage(labisAssetPath("et", "sitting_reading"), x - 142 * scale, y + 62 * scale, 176 * scale, 214 * scale) || this.drawEchoHuman(x - 142 * scale, y + 34 * scale, scale * 2.18, "#202020", false);
      this.drawLabisImage(labisAssetPath("mom", "sitting"), x + 142 * scale, y + 62 * scale, 176 * scale, 214 * scale) || this.drawEchoHuman(x + 142 * scale, y + 34 * scale, scale * 2.18, "#6d553d", false);
    }
    this.ctx.restore();
  }

  private drawMemoryTableFallback(x: number, y: number, scale: number): void {
    this.ctx.fillStyle = "rgba(93, 61, 34, .78)";
    this.ctx.fillRect(x - 46 * scale, y - 38 * scale, 92 * scale, 30 * scale);
    this.ctx.fillStyle = "rgba(52, 34, 24, .55)";
    this.ctx.fillRect(x - 38 * scale, y - 8 * scale, 8 * scale, 34 * scale);
    this.ctx.fillRect(x + 30 * scale, y - 8 * scale, 8 * scale, 34 * scale);
  }

  private drawFoodFallback(x: number, y: number, scale: number, pale: boolean): void {
    this.ctx.fillStyle = "#efe4cd";
    this.ctx.beginPath();
    this.ctx.ellipse(x, y, 26 * scale, 12 * scale, 0, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.fillStyle = pale ? "#fff3d6" : "#b95f32";
    this.ctx.beginPath();
    this.ctx.ellipse(x, y - 2 * scale, 18 * scale, 7 * scale, 0, 0, Math.PI * 2);
    this.ctx.fill();
  }

  private drawEchoHuman(x: number, y: number, scale: number, shirt: string, longHair: boolean): void {
    this.ctx.fillStyle = shirt;
    this.ctx.fillRect(x - 9 * scale, y - 52 * scale, 18 * scale, 26 * scale);
    this.ctx.fillStyle = "#ead6bb";
    this.ctx.fillRect(x - 7 * scale, y - 68 * scale, 14 * scale, 14 * scale);
    this.ctx.fillStyle = "#211b18";
    this.ctx.fillRect(x - 9 * scale, y - 72 * scale, 18 * scale, longHair ? 28 * scale : 10 * scale);
  }

  private drawMemorySpot(spot: Point, cameraX: number, cameraY: number, scale: number, time: number): void {
    const x = (spot.x - cameraX) * scale;
    const y = (spot.y - cameraY) * scale;
    const radius = (34 + Math.sin(time / 260) * 5) * scale;
    const glow = this.ctx.createRadialGradient(x, y, 4, x, y, radius);
    glow.addColorStop(0, "rgba(255,229,156,.82)");
    glow.addColorStop(1, "rgba(255,192,88,0)");
    this.ctx.fillStyle = glow;
    this.ctx.beginPath();
    this.ctx.arc(x, y, radius, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.fillStyle = "#fff0c2";
    this.ctx.font = `${13 * scale}px Georgia`;
    this.ctx.fillText("Diary", x - 16 * scale, y - 34 * scale);
  }

  private drawBakeryPastry(pastry: SceneInteraction, cameraX: number, cameraY: number, scale: number, time: number): void {
    const x = (pastry.x - cameraX) * scale;
    const y = (pastry.y - cameraY) * scale;
    const pulse = Math.sin(time / 310) * 0.5 + 0.5;
    const glow = this.ctx.createRadialGradient(x, y - 8 * scale, 3 * scale, x, y - 8 * scale, (34 + pulse * 8) * scale);
    glow.addColorStop(0, "rgba(255, 224, 145, .5)");
    glow.addColorStop(1, "rgba(255, 196, 92, 0)");
    this.ctx.fillStyle = glow;
    this.ctx.beginPath();
    this.ctx.arc(x, y - 8 * scale, (34 + pulse * 8) * scale, 0, Math.PI * 2);
    this.ctx.fill();
    this.drawFoodFallback(x, y - 3 * scale, scale * 0.92, false);
  }

  private drawFriendA(friend: SceneInteraction, cameraX: number, cameraY: number, scale: number): void {
    const x = (friend.x - cameraX) * scale;
    const y = (friend.y - cameraY) * scale;
    this.ctx.drawImage(this.images.friend, x - 63 * scale, y - 204 * scale, 126 * scale, 204 * scale);
  }

  private roundRect(x: number, y: number, width: number, height: number, radius: number): void {
    this.ctx.beginPath();
    this.ctx.moveTo(x + radius, y);
    this.ctx.lineTo(x + width - radius, y);
    this.ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    this.ctx.lineTo(x + width, y + height - radius);
    this.ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    this.ctx.lineTo(x + radius, y + height);
    this.ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    this.ctx.lineTo(x, y + radius);
    this.ctx.quadraticCurveTo(x, y, x + radius, y);
    this.ctx.closePath();
  }

  private drawDoors(_layout: SceneLayout, cameraX: number, cameraY: number, scale: number): void {
    for (const door of this.allDoors()) {
      const x = (door.x - cameraX) * scale;
      const y = (door.y - cameraY) * scale;
      if (x < -90 || y < -90 || x > this.canvas.width + 90 || y > this.canvas.height + 90) continue;
      const active = this.activeDoor?.id === door.id;
      const state = this.isChapterNode(door) ? this.progressFor(this.chapterIdFor(door)).state : "fragment";
      const baseRadius = state === "fragment" ? 24 : state === "walkedThrough" ? 34 : state === "visited" ? 44 : 50;
      const radius = (active ? baseRadius + 18 : baseRadius) * scale;
      const glow = this.ctx.createRadialGradient(x, y, 4, x, y, radius);
      glow.addColorStop(0, state === "walkedThrough" ? "rgba(255,210,145,.32)" : active ? "rgba(255,213,113,.82)" : "rgba(255,184,72,.46)");
      glow.addColorStop(1, "rgba(255,149,44,0)");
      this.ctx.fillStyle = glow;
      this.ctx.beginPath();
      this.ctx.arc(x, y, radius, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.fillStyle = "#fff0be";
      this.ctx.font = `${14 * scale}px Georgia`;
      this.ctx.fillText(door.date, x - 20 * scale, y - 46 * scale);
    }
  }

  private drawMuji(position: Point, time: number, scale: number): void {
    const bob = Math.sin(time / 160) * 2;
    this.ctx.drawImage(this.images.muji, this.frame * 96, this.facing * 112, 96, 112, position.x - 24 * scale, position.y - 58 * scale + bob, 48 * scale, 56 * scale);
  }

  private drawMujiRoomScene(time: number): void {
    const layout = this.currentSceneLayout("muji-room");
    const lamp = this.roomInteractionById(layout, "lamp");
    const windowInteraction = this.roomInteractionById(layout, "window");
    const residue = this.roomInteractionById(layout, "residue");
    if (layout.orientation === "landscape") {
      const scale = this.canvas.width / 960;
      this.ctx.drawImage(this.images.room, 0, 0, this.canvas.width, this.canvas.height);
      if (!this.images.room.complete || this.images.room.naturalWidth === 0) this.drawRoomFallback(scale);
      if (residue) this.drawRoomResidue(residue, scale);
      if (this.room.lampOn && lamp) this.drawLampGlow(lamp, scale);
      this.drawMuji({ x: this.player.x * scale, y: this.player.y * scale }, time, scale);
      if (this.room.windowFocus && windowInteraction) {
        this.ctx.fillStyle = "rgba(8, 14, 24, .22)";
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        this.drawWindowFocus(windowInteraction, time, scale);
      }
      for (const interaction of roomInteractions) {
        if (interaction.id === "residue" && !this.room.residueIds?.length) continue;
        this.drawRoomInteractionHint(interaction, this.activeRoomInteraction?.id === interaction.id, time, scale);
      }
      return;
    }
    const image = this.sceneImage(layout);
    const viewport = this.sceneViewport(layout);
    const scale = this.canvas.width / viewport.w;
    this.ctx.drawImage(image, 0, 0, viewport.w, viewport.h, 0, 0, this.canvas.width, this.canvas.height);
    if (!image.complete || image.naturalWidth === 0) this.drawRoomFallback(scale);
    if (residue) this.drawRoomResidue(residue, scale);
    if (this.room.lampOn && lamp) this.drawLampGlow(lamp, scale);
    this.drawMuji({ x: this.player.x * scale, y: this.player.y * scale }, time, scale);
    if (this.room.windowFocus && windowInteraction) {
      this.ctx.fillStyle = "rgba(8, 14, 24, .22)";
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
      this.drawWindowFocus(windowInteraction, time, scale);
    }
    for (const interaction of layout.interactions) {
      if (interaction.id === "residue" && !this.room.residueIds?.length) continue;
      this.drawRoomInteractionHint(interaction, this.activeRoomInteraction?.id === interaction.id, time, scale);
    }
  }

  private drawRoomInteractionHint(interaction: SceneInteraction, active: boolean, time: number, scale: number): void {
    const x = interaction.x * scale;
    const y = interaction.y * scale;
    const pulse = Math.sin(time / 360) * 0.5 + 0.5;
    const baseRadius = active ? (22 + pulse * 4) * scale : 4 * scale;
    const glowRadius = active ? 44 * scale : 12 * scale;
    const glow = this.ctx.createRadialGradient(x, y, 1, x, y, glowRadius);
    glow.addColorStop(0, active ? "rgba(255, 229, 166, .52)" : "rgba(255, 226, 154, .18)");
    glow.addColorStop(0.55, active ? "rgba(213, 166, 87, .18)" : "rgba(213, 166, 87, .05)");
    glow.addColorStop(1, "rgba(213, 166, 87, 0)");
    this.ctx.fillStyle = glow;
    this.ctx.beginPath();
    this.ctx.arc(x, y, glowRadius, 0, Math.PI * 2);
    this.ctx.fill();

    this.ctx.save();
    this.ctx.globalAlpha = active ? 0.86 : 0.18;
    this.ctx.strokeStyle = active ? "rgba(255, 231, 172, .92)" : "rgba(255, 231, 172, .42)";
    this.ctx.lineWidth = active ? 1.4 * scale : 1 * scale;
    this.ctx.beginPath();
    this.ctx.arc(x, y, baseRadius, 0, Math.PI * 2);
    this.ctx.stroke();
    if (active) {
      this.ctx.strokeStyle = "rgba(255, 249, 216, .46)";
      this.ctx.beginPath();
      this.ctx.arc(x, y, (baseRadius + 7 * scale), -0.6, 0.9);
      this.ctx.stroke();
      this.ctx.beginPath();
      this.ctx.arc(x, y, (baseRadius + 7 * scale), Math.PI + 0.55, Math.PI + 1.95);
      this.ctx.stroke();
    }
    this.ctx.restore();
  }

  private drawRoomFallback(scale: number): void {
    this.ctx.fillStyle = "#2b241c";
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.fillStyle = "#6d4b2f";
    this.ctx.fillRect(0, 382 * scale, this.canvas.width, 158 * scale);
    this.ctx.fillStyle = "#d8c49e";
    this.ctx.fillRect(130 * scale, 84 * scale, 188 * scale, 92 * scale);
    this.ctx.fillStyle = "#8d6d4b";
    this.ctx.fillRect(612 * scale, 104 * scale, 222 * scale, 108 * scale);
    this.ctx.fillStyle = "#745035";
    this.ctx.fillRect(374 * scale, 354 * scale, 176 * scale, 88 * scale);
    this.ctx.fillRect(706 * scale, 314 * scale, 132 * scale, 112 * scale);
  }

  private drawWindowFocus(interaction: SceneInteraction | RoomInteraction, time: number, scale: number): void {
    const x = (interaction.x - 200) * scale;
    const y = (interaction.y - 108) * scale;
    const w = 292 * scale;
    const h = 176 * scale;
    const glow = this.ctx.createRadialGradient(x + w / 2, y + h / 2, 20 * scale, x + w / 2, y + h / 2, 210 * scale);
    glow.addColorStop(0, "rgba(171, 214, 190, .16)");
    glow.addColorStop(1, "rgba(171, 214, 190, 0)");
    this.ctx.fillStyle = glow;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.strokeStyle = "rgba(246, 221, 156, .72)";
    this.ctx.lineWidth = 2 * scale;
    this.ctx.strokeRect(x, y, w, h);
    this.ctx.fillStyle = "rgba(218, 239, 216, .55)";
    for (let i = 0; i < 12; i += 1) {
      const px = x + ((i * 37 + time / 90) % Math.max(1, w));
      const py = y + ((i * 19 + Math.sin(time / 420 + i) * 8) % Math.max(1, h));
      this.ctx.fillRect(px, py, 2 * scale, 6 * scale);
    }
  }

  private drawLampGlow(interaction: SceneInteraction | RoomInteraction, scale: number): void {
    const x = (interaction.x + 2) * scale;
    const y = (interaction.y - 44) * scale;
    const glow = this.ctx.createRadialGradient(x, y, 8 * scale, x, y, 170 * scale);
    glow.addColorStop(0, "rgba(255, 221, 141, .46)");
    glow.addColorStop(1, "rgba(255, 193, 98, 0)");
    this.ctx.fillStyle = glow;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }

  private drawRoomResidue(interaction: SceneInteraction | RoomInteraction, scale: number): void {
    if (!this.room.residueIds?.length) return;
    this.ctx.fillStyle = "#d5b06d";
    this.ctx.fillRect((interaction.x - 20) * scale, (interaction.y - 16) * scale, 38 * scale, 18 * scale);
    this.ctx.fillStyle = "#7f5937";
    this.ctx.fillRect((interaction.x - 12) * scale, (interaction.y - 10) * scale, 48 * scale, 10 * scale);
  }

  private drawEnding(): void {
    this.ctx.fillStyle = "#07101d";
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.fillStyle = "#f2d59a";
    this.ctx.font = "36px Georgia";
    this.ctx.fillText("Walk Back Home", 80, 130);
    this.ctx.font = "18px Georgia";
    this.ctx.fillText("Many ways of carrying the memories. One way home.", 80, 180);
  }

  private drawHud(): void {
    this.root.dataset.scene = this.scene;
    this.root.dataset.forceTouch = this.forceTouchControls ? "true" : "false";
    this.root.classList.toggle("overlay-open", Boolean(this.overlay.innerHTML.trim()));
    this.syncGameplayChromeVisibility();
    const labisPrompt = this.scene === "labis" && this.labisCutscene ? "Memory is playing" : this.scene === "labis" && this.activeObject === "exit" ? "Press E · 回到 Memory Forest" : this.scene === "labis" && this.activeObject ? `Press E · ${this.activeObject}` : "";
    const march30Prompt = this.scene === "330-corridor" && this.march30Cutscene ? "Memory is rebuilding" : this.scene === "330-corridor" && this.activeObject ? `Press E · ${this.activeObject}` : "";
    const authoredLabel = this.scene === "406" && this.activeObject === "watergun-crossing" ? "morning echo" : this.scene === "406" && this.activeObject === "mcd-drop-memory" ? "MCD memory" : this.scene === "406" && this.activeObject === "roadside-empty-car" ? "empty car" : this.activeObject;
    const authoredPrompt = this.scene === "406" && this.authoredCutscene ? "Memory is playing" : this.scene === "406" && authoredLabel ? "Press E · " + authoredLabel : "";
    const rawText = this.scene === "forest" && this.activeDoor ? `Press E · ${this.activeDoor.date} ${this.activeDoor.title}` : this.scene === "bakery" && this.activeObject ? `Press E · ${this.activeObject}` : labisPrompt || march30Prompt || authoredPrompt || (this.scene === "muji-room" && this.activeRoomInteraction ? `Press E · ${this.activeRoomInteraction.label}` : "WASD / arrows · E / Enter");
    const text = this.mobileHudPrompt(rawText);
    this.input.setTouchInteractionLabel(this.touchActionText(rawText));
    const forestMonth = this.scene === "forest" ? `<div class="forest-month-hud" aria-label="Forest month"><button data-action="forest-month-prev" aria-label="Previous forest month">‹</button><strong>${this.escapeHtml(this.currentForestMonth().label)}</strong><button data-action="forest-month-next" aria-label="Next forest month">›</button></div>` : "";
    const html = `<div class="prompt">${text}</div>${forestMonth}`;
    if (html !== this.lastHudHtml) {
      this.hud.innerHTML = html;
      this.lastHudHtml = html;
    }
  }

  private renderTopNav(): void {
    const html = `
      <button class="shell-music-toggle" data-action="music" aria-label="Toggle music" aria-pressed="${this.settings.musicEnabled}">🎵</button>
      <details class="top-actions-menu">
        <summary class="menu-toggle" aria-label="Open menu">☰</summary>
        <div class="menu-panel">
          <button data-action="home">Today</button>
          <button data-action="open-timeline">Timeline</button>
          <button data-action="forest">Forest</button>
          <button data-action="open-room">Muji Room</button>
          <button data-action="room-records">Records</button>
          <button data-action="reflection-wall">Reflection Wall</button>
          <button data-action="toggle-touch-controls">Joystick: ${this.forceTouchControls ? "On" : "Auto"}</button>
          <button data-action="settings">Settings</button>
        </div>
      </details>`;
    if (this.topNav.innerHTML !== html) this.topNav.innerHTML = html;
    this.syncGameplayChromeVisibility();
  }

  private isGameplayScene(): boolean {
    return this.scene === "forest" || this.scene === "bakery" || this.scene === "labis" || this.scene === "muji-room" || this.isAuthoredRuntimeScene();
  }

  private syncGameplayChromeVisibility(): void {
    const overlayOpen = Boolean(this.overlay?.innerHTML.trim());
    const editing = this.input?.isTouchControlEditing() ?? false;
    const gameplay = this.isGameplayScene();
    const hamburgerVisible = gameplay && !overlayOpen && !editing;
    this.root.dataset.gameplayHamburger = hamburgerVisible ? "visible" : "hidden";
    this.root.dataset.gameplayScene = gameplay ? "true" : "false";
    this.topNav?.classList.toggle("gameplay-hamburger-hidden", !hamburgerVisible);
    this.root.classList.toggle("touch-controls-editing", editing);
    this.input?.clampTouchControlsToViewport();
  }

  private touchActionText(prompt: string): string {
    const match = /Press E ·\s*(.+)$/.exec(prompt);
    return match?.[1] ?? "Interact";
  }

  private toggleTouchControls(): void {
    this.forceTouchControls = !this.forceTouchControls;
    this.renderTopNav();
    this.drawHud();
    this.showToast(this.forceTouchControls ? "Joystick shown" : "Joystick auto");
  }

  private mobileHudPrompt(prompt: string): string {
    if (!window.matchMedia("(max-width: 860px)").matches) return prompt;
    const match = /Press E ·\s*(.+)$/.exec(prompt);
    if (match) return `Tap A · ${match[1]}`;
    if (prompt.includes("WASD") || prompt.includes("E / Enter")) return "Virtual joystick · A";
    return prompt;
  }

  private settingsContent(): string {
    return `
      <div class="module-grid">
        <button data-action="home">Today / Home<span>Write today or continue gently</span></button>
        <button data-action="open-timeline">Timeline<span>${this.diaryEntries.length} diary entries</span></button>
        <button data-action="open-map">Walk Back Home<span>${this.allDoors().length} forest memories</span></button>
        <button data-action="backup-sync">Backup / Sync<span>Portable backup and cloud account</span></button>
      </div>
      <div class="settings-row"><button data-action="rain">Rain: ${this.settings.rain ? "On" : "Off"}</button><button data-action="fullscreen">Fullscreen</button><button data-action="edit-touch-controls">Edit Touch Controls</button><button data-action="forest">Return to Forest</button><button data-action="close">Close</button></div>`;
  }

  private beginTouchControlEdit(): void {
    if (!this.isGameplayScene()) {
      this.showToast("Touch controls can only be edited from gameplay");
      return;
    }
    this.input.beginTouchControlEdit();
    this.showTouchControlEditor();
  }

  private showTouchControlEditor(): void {
    this.overlay.innerHTML = "<div class=\"modal game-panel touch-control-editor\"><h2>Edit Touch Controls</h2><p>Drag the joystick and A button to place them safely in the viewport.</p><div class=\"settings-row\"><button data-action=\"save-touch-controls\">Save Touch Controls</button><button data-action=\"cancel-touch-control-edit\">Cancel Touch Control Editing</button><button data-action=\"reset-touch-controls\">Reset to Default</button></div></div>";
    this.focusStage();
  }

  private showHome(): void {
    const today = new Date().toISOString().slice(0, 10);
    const recent = getDiaryTimeline(this.makeDiaryLibrary()).slice(0, 3).map((entry) => `<li>${this.escapeHtml(entry.date)} · ${this.escapeHtml(entry.title)}</li>`).join("");
    this.overlay.innerHTML = `<div class="modal game-panel"><h2>Today / Home</h2><p>${today}</p><div class="settings-row"><button data-action="new-diary-entry">Create New Journal</button><button data-action="open-map">Walk Back Home</button></div><h3>Recent diary</h3><ul>${recent || "<li>No diary entries yet.</li>"}</ul><button data-action="close">Close</button></div>`;
    this.focusStage();
  }

  private openTodayDiaryPage(): void {
    const today = new Date().toISOString().slice(0, 10);
    const opened = openDiaryPageForDate(this.makeDiaryLibrary(), today);
    this.applyDiaryLibrary(opened.library);
    this.showDiaryEditor(opened.entry.id);
    this.showToast(opened.created ? "Today opened" : "Today reopened");
    this.autosave();
  }

  private continueLabisReflectionBeforeExit(): void {
    this.labisExitAfterReflection = true;
    const filterEcho = labisEchoes.find((echo) => echo.id === "july19-filter-evening");
    const filterChoiceMade = this.choices.some((choice) => choice.startsWith("labis-filter-"));
    if (filterChoiceMade) {
      this.showLabisMemoryReflection();
      return;
    }
    if (filterEcho && !this.completedMemoryEvents.has("july19-filter-evening")) {
      this.showToast("还有一个说明书的回声。");
      this.startLabisEcho(filterEcho);
      return;
    }
    this.showLabisChoice("filter");
  }

  private beginJournalEditor(entryId: string, isNew = false, snapshot = this.makeDiaryLibrary()): void {
    this.journalEditorEntryId = entryId;
    this.journalEditorSnapshot = snapshot;
    this.journalEditorIsNew = isNew;
    this.journalEditorDirty = isNew;
  }

  private endJournalEditor(): void {
    window.clearTimeout(this.diaryAutosaveTimer);
    this.journalAudioRecorder?.cancel();
    this.clearJournalAudioTimer();
    this.journalEditorEntryId = "";
    this.journalEditorSnapshot = null;
    this.journalEditorIsNew = false;
    this.journalEditorDirty = false;
  }

  private pendingAudioEntry(entry: DiaryEntry): DiaryEntry {
    const pending = this.pendingJournalAudio.get(entry.id) ?? [];
    if (!pending.length) return entry;
    return {
      ...entry,
      media: [
        ...(entry.media ?? []),
        ...pending.map((item) => makeJournalAudioMedia({
          id: item.mediaId,
          storageKey: item.tempKey,
          mimeType: item.mimeType,
          duration: item.duration,
          displayName: item.displayName,
          createdAt: item.createdAt
        }))
      ]
    };
  }

  private async startJournalAudioRecording(): Promise<void> {
    if (!this.isJournalEditorActive()) return;
    if (this.journalAudioRecorder?.isActive()) return;
    try {
      this.journalAudioRecorder = new JournalAudioRecorder();
      await this.journalAudioRecorder.start();
      this.journalEditorDirty = true;
      this.clearJournalAudioTimer();
      this.journalAudioTimer = window.setInterval(() => this.refreshJournalAudioRecordingUi(), 250);
      this.refreshJournalAudioRecordingUi();
    } catch (error) {
      this.journalAudioRecorder = null;
      this.clearJournalAudioTimer();
      this.showToast(error instanceof Error ? error.message : "Audio recording is unavailable on this device.");
      this.refreshJournalAudioRecordingUi();
    }
  }

  private async stopJournalAudioRecording(): Promise<void> {
    const recorder = this.journalAudioRecorder;
    const entryId = this.journalEditorEntryId;
    if (!recorder?.isActive() || !entryId) return;
    try {
      const result = await recorder.stop();
      const mediaId = `audio-${Date.now()}`;
      const tempKey = journalMediaTempKey(entryId, mediaId);
      await this.journalMediaBlobStore.putBlob(tempKey, result.blob);
      const pending: PendingJournalAudio = {
        mediaId,
        tempKey,
        blob: result.blob,
        duration: result.duration,
        mimeType: result.mimeType,
        displayName: `Voice note ${new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`,
        createdAt: new Date().toISOString()
      };
      this.pendingJournalAudio.set(entryId, [...(this.pendingJournalAudio.get(entryId) ?? []), pending]);
      this.journalMediaResolution.delete(tempKey);
      const objectUrl = await this.journalMediaBlobStore.objectUrlFor(tempKey);
      if (objectUrl) this.journalMediaObjectUrls.set(tempKey, objectUrl);
      this.journalAudioRecorder = null;
      this.clearJournalAudioTimer();
      this.showDiaryEditorPreservingScroll(entryId);
      this.showToast("Voice note ready — save the journal to keep it");
    } catch (error) {
      this.journalAudioRecorder = null;
      this.clearJournalAudioTimer();
      this.showToast(error instanceof Error ? error.message : "Could not finish the voice note.");
      this.refreshJournalAudioRecordingUi();
    }
  }

  private clearJournalAudioTimer(): void {
    if (this.journalAudioTimer) window.clearInterval(this.journalAudioTimer);
    this.journalAudioTimer = 0;
  }

  private refreshJournalAudioRecordingUi(): void {
    const statuses = this.overlay.querySelectorAll<HTMLElement>(".journal-audio-recording-state");
    const controls = this.overlay.querySelectorAll<HTMLElement>(".journal-audio-recording-controls");
    if (!controls.length) return;
    const recorder = this.journalAudioRecorder;
    const active = Boolean(recorder?.isActive());
    const paused = active && recorder?.state() === "paused";
    statuses.forEach((status) => {
      status.textContent = active ? `${paused ? "Paused" : "Recording"} ${Math.floor((recorder?.elapsedMs() ?? 0) / 1000)}s` : "Add a voice note";
    });
    controls.forEach((control) => {
      control.classList.toggle("recording", active);
      control.innerHTML = active
        ? `<button type="button" data-action="journal-audio-stop" aria-label="Stop recording">■<span>Stop</span></button><button type="button" data-action="${paused ? "journal-audio-resume" : "journal-audio-pause"}" aria-label="${paused ? "Resume" : "Pause"} recording">${paused ? "▶" : "Ⅱ"}<span>${paused ? "Resume" : "Pause"}</span></button><button type="button" data-action="journal-audio-cancel" aria-label="Discard recording">×<span>Discard</span></button>`
        : `<button data-action="journal-record-audio" aria-label="Record audio">🎙<span>Record voice</span></button>`;
    });
  }

  private cancelJournalAudioRecording(): void {
    const recorder = this.journalAudioRecorder;
    if (!recorder?.isActive()) return;
    recorder.cancel();
    this.journalAudioRecorder = null;
    this.clearJournalAudioTimer();
    this.refreshJournalAudioRecordingUi();
    this.showToast("Voice note discarded");
  }

  private async resolveJournalAudioMedia(entryId: string, media: Extract<DiaryMedia, { type: "audio" }>): Promise<void> {
    const key = media.storageKey;
    if (!key || this.journalMediaObjectUrls.has(key) || this.journalMediaResolution.get(key) === "loading" || this.journalMediaResolution.get(key) === "missing") return;
    this.journalMediaResolution.set(key, "loading");
    const objectUrl = await this.journalMediaBlobStore.objectUrlFor(key);
    if (objectUrl) {
      this.journalMediaObjectUrls.set(key, objectUrl);
      this.journalMediaResolution.delete(key);
    } else {
      this.journalMediaResolution.set(key, "missing");
    }
    const editor = this.overlay.querySelector<HTMLElement>(`.diary-page-editor[data-entry="${this.escapeHtml(entryId)}"]`);
    if (editor) {
      const item = editor.querySelector<HTMLElement>(`[data-media="${this.escapeHtml(media.id)}"] .journal-audio-node`);
      if (item) item.innerHTML = this.renderJournalAudioNode(media);
      return;
    }
    if (this.overlay.querySelector(`.journal-reading-page`) && this.diaryEntries.some((entry) => entry.id === entryId)) this.showDiaryReader(entryId);
  }

  private renderJournalAudioNode(media: Extract<DiaryMedia, { type: "audio" }>): string {
    const url = this.journalMediaObjectUrls.get(media.storageKey);
    if (url) return `<audio class="journal-audio-player" controls preload="metadata" src="${this.escapeHtml(url)}" aria-label="${this.escapeHtml(media.displayName ?? "Journal voice note")}"></audio>`;
    if (this.journalMediaResolution.get(media.storageKey) === "missing") return `<span class="journal-audio-unavailable">🎙 Voice note unavailable on this device</span>`;
    return `<span class="journal-audio-loading">🎙 Loading voice note…</span>`;
  }

  private async clearPendingJournalAudio(entryId: string): Promise<void> {
    const pending = this.pendingJournalAudio.get(entryId) ?? [];
    for (const item of pending) {
      await this.journalMediaBlobStore.deleteBlob(item.tempKey);
      this.journalMediaObjectUrls.delete(item.tempKey);
      this.journalMediaResolution.delete(item.tempKey);
    }
    this.pendingJournalAudio.delete(entryId);
  }

  private isJournalEditorActive(): boolean {
    return Boolean(this.journalEditorEntryId && this.overlay.querySelector(".diary-page-editor"));
  }

  private flushJournalEditorDraft(): void {
    if (!this.isJournalEditorActive()) return;
    this.clearDiaryAutosaveTimer();
    const draft = this.readDiaryDraftFromOverlay(this.journalEditorEntryId);
    if (!draft) return;
    const existing = this.diaryEntries.find((entry) => entry.id === draft.id);
    const comparable = (entry: DiaryEntry) => JSON.stringify({
      ...entry,
      location: entry.location || undefined,
      weather: entry.weather || undefined
    });
    if (!this.journalEditorIsNew && existing && comparable(existing) === comparable(draft)) return;
    this.applyDiaryLibrary(upsertDiaryPageDraft(this.makeDiaryLibrary(), draft));
    this.journalEditorDirty = true;
  }

  private handleJournalEditorBack(): void {
    if (!this.isJournalEditorActive()) {
      this.restoreJournalOrigin();
      return;
    }
    this.flushJournalEditorDraft();
    if (!this.journalEditorDirty && !this.journalEditorIsNew) {
      this.endJournalEditor();
      this.restoreJournalOrigin();
      return;
    }
    const entryId = this.journalEditorEntryId;
    this.overlay.insertAdjacentHTML("beforeend", `<div class="modal game-panel journal-discard-confirmation" role="dialog" aria-modal="true" aria-label="Discard journal changes"><h2>Discard changes?</h2><p>Your journal changes will not be kept.</p><div class="settings-row"><button data-action="journal-discard-cancel">Keep Editing</button><button class="danger" data-action="journal-discard-confirm" data-id="${this.escapeHtml(entryId)}">Discard Changes</button></div></div>`);
    this.focusStage();
  }

  private cancelJournalEditorDiscard(): void {
    if (!this.journalEditorEntryId) return this.showTimeline();
    this.showDiaryEditor(this.journalEditorEntryId);
  }

  private async discardJournalEditor(): Promise<void> {
    const snapshot = this.journalEditorSnapshot;
    if (!snapshot) return this.restoreJournalOrigin();
    const entryId = this.journalEditorEntryId;
    this.journalAudioRecorder?.cancel();
    await this.clearPendingJournalAudio(entryId);
    this.endJournalEditor();
    this.applyDiaryLibrary(snapshot);
    this.restoreJournalOrigin();
    this.autosave();
    this.showToast("Changes discarded");
  }

  private clearDiaryAutosaveTimer(): void {
    window.clearTimeout(this.diaryAutosaveTimer);
    this.diaryAutosaveTimer = 0;
  }

  private updateDiaryEditorImmediately(entry: DiaryEntry): void {
    this.clearDiaryAutosaveTimer();
    this.updateDiaryEntry(entry);
    this.showDiaryEditorPreservingScroll(entry.id);
  }

  private openNewDiaryPage(): void {
    this.captureJournalReturnSnapshot();
    const today = new Date().toISOString().slice(0, 10);
    const originalLibrary = this.makeDiaryLibrary();
    const opened = createNewDiaryPage(originalLibrary, today);
    this.applyDiaryLibrary(opened.library);
    this.beginJournalEditor(opened.entry.id, true, originalLibrary);
    this.selectedTimelineMonthKey = today.slice(0, 7);
    this.timelineVisibleCount = journalBatchSize;
    this.showDiaryEditor(opened.entry.id);
    this.showToast("New journal created");
    this.autosave();
  }

  private showTimeline(options: { restoreScrollTop?: number } = {}): void {
    this.journalMode = "timeline";
    const month = this.currentTimelineMonthView();
    const visibleEntries = visibleTimelineEntries(month, this.timelineVisibleCount);
    const rows = visibleEntries.map((entry) => {
      const checked = this.selectedTimelineEntryIds.has(entry.id) ? "checked" : "";
      return `
      <article class="timeline-entry ${checked ? "selected" : ""}">
        <label class="timeline-check"><input type="checkbox" data-timeline-select="${this.escapeHtml(entry.id)}" ${checked} aria-label="Select diary"></label>
        <div class="timeline-card">
          <button class="diary-page-preview" data-action="open-diary-page" data-id="${this.escapeHtml(entry.id)}">${this.renderDiaryPreview(entry)}</button>
          <div class="timeline-card-actions">
            <label class="timeline-kind"><span>${entry.scrapbookLayout?.elements.length ? "scrapbook" : "memory"}</span><select data-timeline-kind="${this.escapeHtml(entry.id)}"><option value="diary" ${entry.memoryKind === "diary" ? "selected" : ""}>Diary only</option><option value="fragment" ${entry.memoryKind === "fragment" ? "selected" : ""}>Memory Fragment</option><option value="chapter" ${entry.memoryKind === "chapter" ? "selected" : ""}>Memory Chapter</option></select></label>
            <button data-action="edit-diary-entry" data-id="${this.escapeHtml(entry.id)}">Edit</button>
            <button data-action="timeline-request-delete-entry" data-id="${this.escapeHtml(entry.id)}">Delete</button>
          </div>
        </div>
      </article>`;
    }).join("");
    const showMore = hasMoreTimelineEntries(month, this.timelineVisibleCount) ? `<button class="show-more timeline-show-more" data-action="journal-show-more">Show More</button>` : "";
    const noResult = this.timelineSearch.trim() || this.timelineKindFilter !== "all" || this.timelineDateFilter;
    const empty = `<div class="journal-empty"><p>${noResult ? "No diary matched these filters." : "Nothing was written here."}</p><button data-action="new-diary-entry">Create New Journal</button></div>`;
    const confirm = this.timelineDeleteConfirmOpen ? this.renderTimelineDeleteConfirmation() : "";
    const selectedDate = this.timelineDateFilter || `${this.timelineCursorMonth().key}-01`;
    this.overlay.innerHTML = `<div class="modal game-panel timeline-panel journal-panel">${this.journalHeader("Timeline", month, this.renderTimelineFilters(month))}<div class="timeline-scroll-content">${this.renderTimelineDatePicker(selectedDate)}<div class="timeline-list">${this.renderTimelineDateGroups(visibleEntries, rows) || empty}</div></div>${showMore}${confirm}</div>`;
    if (options.restoreScrollTop !== undefined) {
      requestAnimationFrame(() => {
        const panel = this.overlay.querySelector<HTMLElement>(".timeline-scroll-content");
        if (panel) panel.scrollTop = options.restoreScrollTop ?? 0;
      });
    }
    this.focusStage();
  }

  private currentBooksMonth(key = this.selectedBooksMonthKey): JournalMonth {
    const month = selectedOrLatestMonth(this.diaryEntries, key);
    this.selectedBooksMonthKey = month.key;
    this.selectedBooksYear = String(month.year);
    return month;
  }

  private currentTimelineMonthView(): JournalMonth {
    const base = this.currentTimelineBaseMonth();
    return makeTimelineMonthView(base, this.timelineSort, this.timelineSearch, this.timelineKindFilter, this.timelineDateScope === "date" ? this.timelineDateFilter : "");
  }

  private currentTimelineBaseMonth(): JournalMonth {
    const selected = this.timelineCursorMonth();
    const [yearText] = selected.key.split("-");
    if (this.timelineDateScope === "all") {
      return { ...selected, key: "all", label: "All Journals", entries: sortMonthEntries(this.diaryEntries) };
    }
    if (this.timelineDateScope === "year") {
      return {
        ...selected,
        key: yearText,
        label: `${yearText}`,
        entries: sortMonthEntries(this.diaryEntries.filter((entry) => entry.date.startsWith(`${yearText}-`)))
      };
    }
    return selected;
  }

  private timelineCursorMonth(): JournalMonth {
    const fallback = this.selectedTimelineMonthKey || selectedOrLatestMonth(this.diaryEntries).key;
    const cursorKey = /^\d{4}-\d{2}$/.test(fallback) ? fallback : new Date().toISOString().slice(0, 7);
    const [yearText, monthText] = cursorKey.split("-");
    const year = Number(yearText);
    const month = Number(monthText);
    return {
      key: cursorKey,
      year,
      month,
      label: monthLabel(year, month),
      entries: sortMonthEntries(this.diaryEntries.filter((entry) => entry.date.startsWith(cursorKey)))
    };
  }

  private renderTimelineFilters(month: JournalMonth): string {
    const selectedDate = this.timelineDateFilter || `${this.timelineCursorMonth().key}-01`;
    const feedback = this.timelineFilterFeedback(month);
    const dateClass = this.timelineDateInputHasEntries(selectedDate) ? "" : " no-results";
    return `<details class="timeline-filter-menu"><summary>Filter / Sort</summary><div class="timeline-toolbar">
      <label>Sort<select id="timeline-sort"><option value="date-desc" ${this.timelineSort === "date-desc" ? "selected" : ""}>Newest first</option><option value="date-asc" ${this.timelineSort === "date-asc" ? "selected" : ""}>Oldest first</option><option value="title-asc" ${this.timelineSort === "title-asc" ? "selected" : ""}>Title A-Z</option></select></label>
      <label>Filter<select id="timeline-kind-filter"><option value="all" ${this.timelineKindFilter === "all" ? "selected" : ""}>All memories</option><option value="diary" ${this.timelineKindFilter === "diary" ? "selected" : ""}>Diary only</option><option value="fragment" ${this.timelineKindFilter === "fragment" ? "selected" : ""}>Memory Fragment</option><option value="chapter" ${this.timelineKindFilter === "chapter" ? "selected" : ""}>Memory Chapter</option></select></label>
      <label>Range<select id="timeline-date-scope"><option value="all" ${this.timelineDateScope === "all" ? "selected" : ""}>All diary</option><option value="year" ${this.timelineDateScope === "year" ? "selected" : ""}>By year</option><option value="month" ${this.timelineDateScope === "month" ? "selected" : ""}>By month</option><option value="date" ${this.timelineDateScope === "date" ? "selected" : ""}>Exact date</option></select></label>
      <label>Date<input id="timeline-date-input" type="date" class="timeline-date-input${dateClass}" value="${this.escapeHtml(selectedDate)}" aria-label="Timeline date"></label>
      <label class="timeline-search">Search<input id="timeline-search" type="search" placeholder="keyword, title, place..." value="${this.escapeHtml(this.timelineSearch)}"></label>
      <button data-action="timeline-apply-filters">Done</button>
      <button data-action="timeline-clear-filters">Clear Filters</button>
      <span class="timeline-feedback">${this.escapeHtml(feedback)}</span>
      ${this.timelineFilterAppliedMessage ? `<span class="timeline-applied">${this.escapeHtml(this.timelineFilterAppliedMessage)}</span>` : ""}
      <span>${this.selectedTimelineEntryIds.size} selected</span>
      <button data-action="timeline-select-all">Select All</button>
      <button data-action="timeline-clear-selected">Clear Selection</button>
      <button data-action="timeline-request-delete-selected">Delete Selected</button>
    </div></details>`;
  }

  private renderTimelineDeleteConfirmation(): string {
    const count = this.selectedTimelineEntryIds.size;
    return `<div class="timeline-delete-confirmation delete-confirmation" role="dialog" aria-modal="true" aria-label="Confirm diary deletion">
      <div><strong>Delete selected journals?</strong><p>This removes ${count} journal ${count === 1 ? "entry" : "entries"} from the app timeline.</p></div>
      <div class="delete-confirmation-actions"><button data-action="timeline-cancel-delete-selected">Cancel</button><button class="danger" data-action="timeline-confirm-delete-selected">Delete</button></div>
    </div>`;
  }

  private renderTimelineDateGroups(entries: DiaryEntry[], rowHtml: string): string {
    if (!entries.length) return "";
    const rows = rowHtml.match(/<article[\s\S]*?<\/article>/g) ?? [];
    const groups = new Map<string, string[]>();
    entries.forEach((entry, index) => {
      groups.set(entry.date, [...(groups.get(entry.date) ?? []), rows[index] ?? ""]);
    });
    return [...groups.entries()].map(([date, groupRows]) => `<section class="timeline-date-group"><h3 class="timeline-date-heading">${this.escapeHtml(this.formatDiaryDateHeading(date))}</h3>${groupRows.join("")}</section>`).join("");
  }

  private formatDiaryDateHeading(date: string): string {
    const parsed = new Date(`${date}T00:00:00`);
    if (Number.isNaN(parsed.getTime())) return date;
    const day = String(parsed.getDate()).padStart(2, "0");
    const weekday = parsed.toLocaleDateString("en-US", { weekday: "long" });
    const month = parsed.toLocaleDateString("en-US", { month: "long", year: "numeric" });
    return `${day} ${weekday} · ${month}`;
  }

  private renderTimelineDatePicker(selectedDate: string): string {
    if (this.timelineDateScope === "all") return "";
    const monthKey = /^\d{4}-\d{2}-\d{2}$/.test(selectedDate) ? selectedDate.slice(0, 7) : this.timelineCursorMonth().key;
    const [yearText, monthText] = monthKey.split("-");
    const year = Number(yearText);
    const month = Number(monthText);
    const days = new Date(year, month, 0).getDate();
    const buttons = Array.from({ length: days }, (_, index) => {
      const day = index + 1;
      const date = `${monthKey}-${String(day).padStart(2, "0")}`;
      const hasEntries = this.timelineDateHasEntries(date);
      const selected = selectedDate === date;
      return `<button class="${selected ? "selected" : ""} ${hasEntries ? "" : "no-result"}" data-action="timeline-pick-date" data-date="${date}" ${hasEntries ? "" : "disabled"}>${day}</button>`;
    }).join("");
    return `<div class="timeline-date-picker" aria-label="Dates with diary results"><span>${this.escapeHtml(monthLabel(year, month))}</span><div>${buttons}</div></div>`;
  }

  private timelineDateHasEntries(date: string): boolean {
    return this.diaryEntries.some((entry) => entry.date === date);
  }

  private timelineDateInputHasEntries(date: string): boolean {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return false;
    if (this.timelineDateScope === "all") return true;
    if (this.timelineDateScope === "year") return this.diaryEntries.some((entry) => entry.date.startsWith(`${date.slice(0, 4)}-`));
    if (this.timelineDateScope === "month") return this.diaryEntries.some((entry) => entry.date.startsWith(date.slice(0, 7)));
    return this.timelineDateHasEntries(date);
  }

  private timelineFilterFeedback(month: JournalMonth): string {
    const dateLabel = this.timelineDateScope === "all"
      ? "All diary"
      : this.timelineDateScope === "year"
        ? `Year ${this.timelineCursorMonth().key.slice(0, 4)}`
        : this.timelineDateScope === "month"
          ? `Month ${this.timelineCursorMonth().key}`
          : this.timelineDateFilter;
    const filters = [
      this.timelineKindFilter === "all" ? "All memories" : this.timelineKindFilter === "diary" ? "Diary only" : this.timelineKindFilter === "fragment" ? "Memory Fragment" : "Memory Chapter",
      dateLabel || month.key,
      this.timelineSearch.trim() ? `Search: ${this.timelineSearch.trim()}` : ""
    ].filter(Boolean);
    const count = month.entries.length;
    return `${count} result${count === 1 ? "" : "s"} · ${filters.join(" · ")}`;
  }

  private journalHeader(active: "Timeline" | "Books" | "Reader", month: JournalMonth, navExtra = ""): string {
    const navLabel = active === "Books" ? month.label.slice(-4) : month.label;
    return `<div class="journal-archive-header"><div><h2>Journal</h2><p>${this.escapeHtml(active)} · ${this.escapeHtml(navLabel)}</p></div><button class="journal-close-button" data-action="close" aria-label="Close Journal">×</button><div class="journal-tabs"><button class="${active === "Timeline" ? "selected" : ""}" data-action="journal-timeline">Timeline</button><button class="${active === "Books" || active === "Reader" ? "selected" : ""}" data-action="journal-books">Books</button><button data-action="new-diary-entry">Create New Journal</button></div></div><div class="month-nav ${navExtra ? "timeline-month-nav" : ""}"><button data-action="journal-month-prev">‹</button><strong>${this.escapeHtml(navLabel)}</strong>${navExtra}<button data-action="journal-month-next">›</button></div>`;
  }

  private renderDiaryPreview(entry: DiaryEntry): string {
    const allMedia = diaryMediaItems(entry);
    const media = allMedia.slice(0, 4);
    const mediaGrid = media.length ? `<div class="timeline-media-grid count-${Math.min(media.length, 4)}">${media.map((item, index) => item.type === "video"
      ? `<span class="journal-video-block preview-video">${index === 3 && allMedia.length > 4 ? `+${allMedia.length - 3}` : "▶"}<small>${this.escapeHtml(item.caption ?? "video")}</small></span>`
      : item.type === "audio"
        ? `<span class="journal-audio-preview preview-audio">🎙<small>Voice note</small></span>`
        : `<img class="preview-photo-square" src="${this.escapeHtml(item.src)}" alt="">`).join("")}</div>` : "";
    return `<div class="preview-text"><span class="preview-date">${this.escapeHtml(entry.date)}</span><strong>${this.escapeHtml(entry.title)}</strong><span class="preview-body">${this.escapeHtml(entry.body.slice(0, 160)) || "Empty draft"}</span></div>${mediaGrid}<small>${entry.memoryKind}</small>`;
  }

  private showMoreTimelineEntries(): void {
    const panel = this.overlay.querySelector<HTMLElement>(".timeline-scroll-content");
    const restoreScrollTop = panel?.scrollTop ?? 0;
    this.timelineVisibleCount += journalBatchSize;
    this.showTimeline({ restoreScrollTop });
  }

  private captureJournalReturnSnapshot(): void {
    if (this.journalReturnSnapshot) return;
    const panel = this.overlay.querySelector<HTMLElement>(".journal-panel");
    if (!panel) return;
    const booksSurface = this.journalMode === "books" || this.journalMode === "reader";
    const scrollSurface = booksSurface ? panel : this.overlay.querySelector<HTMLElement>(".timeline-scroll-content") ?? panel;
    const monthKey = booksSurface
      ? this.selectedBooksMonthKey || selectedOrLatestMonth(this.diaryEntries).key
      : this.timelineCursorMonth().key;
    const year = booksSurface ? this.selectedBooksYear || monthKey.slice(0, 4) : monthKey.slice(0, 4);
    this.journalReturnSnapshot = createJournalReturnSnapshot(booksSurface ? "books" : "timeline", monthKey, year, scrollSurface.scrollTop);
  }

  private restoreJournalOrigin(): void {
    if (this.chapterDiaryReturnId) {
      const chapterId = this.chapterDiaryReturnId;
      this.chapterDiaryReturnId = "";
      this.journalReturnSnapshot = null;
      this.showChapterDiary(chapterId);
      return;
    }
    const snapshot = this.journalReturnSnapshot ? journalReturnTarget(this.journalReturnSnapshot) : null;
    this.journalReturnSnapshot = null;
    if (!snapshot) {
      this.showTimeline();
      return;
    }
    if (snapshot.mode === "books") {
      this.selectedBooksYear = snapshot.year;
      this.selectedBooksMonthKey = snapshot.monthKey;
      this.openMonthlyBook(snapshot.monthKey);
      requestAnimationFrame(() => {
        const panel = this.overlay.querySelector<HTMLElement>(".journal-panel");
        if (panel) panel.scrollTop = snapshot.scrollTop;
      });
      return;
    }
    this.selectedTimelineMonthKey = snapshot.monthKey;
    this.showTimeline({ restoreScrollTop: snapshot.scrollTop });
  }

  private moveJournalMonth(direction: -1 | 1): void {
    this.timelineVisibleCount = journalBatchSize;
    if (this.journalMode === "timeline") {
      const next = moveTimelineMonthState(this.journalNavigationState(), direction, this.timelineDateScope);
      this.selectedTimelineMonthKey = next.timelineMonthKey;
      this.timelineDateFilter = next.timelineDateFilter;
      this.timelineFilterAppliedMessage = next.timelineFilterAppliedMessage;
      this.showTimeline();
      return;
    }
    const availableMonthKeys = monthlyBookSummaries(this.diaryEntries, this.monthlyCovers).map((book) => book.key);
    const next = moveBooksMonthState(this.journalNavigationState(), direction, availableMonthKeys);
    this.selectedBooksYear = next.booksYear;
    this.selectedBooksMonthKey = next.booksMonthKey;
    if (this.journalMode === "books") this.showMonthlyBooks();
    else this.openMonthlyBook(this.selectedBooksMonthKey);
  }

  private journalNavigationState(): JournalNavigationState {
    const booksMonthKey = this.selectedBooksMonthKey || selectedOrLatestMonth(this.diaryEntries).key;
    return {
      mode: this.journalMode,
      timelineMonthKey: this.timelineCursorMonth().key,
      booksYear: this.selectedBooksYear || booksMonthKey.slice(0, 4),
      booksMonthKey,
      timelineDateScope: this.timelineDateScope,
      timelineDateFilter: this.timelineDateFilter,
      timelineFilterAppliedMessage: this.timelineFilterAppliedMessage
    };
  }

  private showMonthlyBooks(): void {
    this.journalMode = "books";
    const summaries = monthlyBookSummaries(this.diaryEntries, this.monthlyCovers);
    const month = this.currentBooksMonth();
    const selectedYear = this.selectedBooksYear || month.key.slice(0, 4);
    const yearOptions = [...new Set(summaries.map((book) => book.year))];
    const yearFilter = `<div class="journal-year-filter" aria-label="Filter books by year">${yearOptions.map((year) => `<button class="${String(year) === selectedYear ? "selected" : ""}" data-action="journal-books-year" data-year="${year}">${year}</button>`).join("")}</div>`;
    const books = summaries
      .filter((book) => String(book.year) === selectedYear)
      .map((book) => `<button class="monthly-book theme-${book.theme}" data-action="open-month-book" data-month="${book.key}"><span class="book-cover-thumb" style="--book-cover:${book.cover?.src.startsWith("data:") ? `url('${this.escapeHtml(book.cover.src)}')` : this.escapeHtml(book.cover?.src ?? defaultMonthlyCover(book.key).src)}">${this.escapeHtml(book.label.split(" ")[0].toUpperCase())}</span><strong>${book.year}</strong><small>${book.entryCount} entries · ${book.photoCount} photos · ${book.videoCount} videos · ${book.audioCount} voice notes</small></button>`).join("");
    this.overlay.innerHTML = `<div class="modal game-panel journal-panel monthly-books">${this.journalHeader("Books", month)}${yearFilter}<section class="book-shelf-section"><h3>Time Albums</h3><div class="book-grid">${books || `<div class="journal-empty"><p>Your story starts here.</p><button data-action="new-diary-entry">Write the first page</button></div>`}</div></section></div>`;
    this.focusStage();
  }

  private selectBooksYear(year: string): void {
    if (!/^\d{4}$/.test(year)) return;
    const monthKeys = monthlyBookSummaries(this.diaryEntries, this.monthlyCovers).map((book) => book.key);
    const next = selectBooksYearState(this.journalNavigationState(), year, monthKeys);
    this.selectedBooksYear = next.booksYear;
    this.selectedBooksMonthKey = next.booksMonthKey;
    this.journalMode = "books";
    this.showMonthlyBooks();
  }

  private filterTimelineYear(year: string): void {
    if (!/^\d{4}$/.test(year)) return;
    const next = selectTimelineYearState(this.journalNavigationState(), year);
    this.selectedTimelineMonthKey = next.timelineMonthKey;
    this.timelineDateScope = next.timelineDateScope;
    this.timelineDateFilter = next.timelineDateFilter;
    this.timelineFilterAppliedMessage = next.timelineFilterAppliedMessage;
    this.showTimeline();
  }

  private openMonthlyBook(monthKey: string): void {
    this.journalMode = "reader";
    this.selectedBooksMonthKey = monthKey;
    this.selectedBooksYear = monthKey.slice(0, 4);
    const month = this.currentBooksMonth(monthKey);
    const pages = month.entries.map((entry) => `<article class="book-page"><button class="diary-page-preview" data-action="open-diary-page" data-id="${this.escapeHtml(entry.id)}">${this.renderDiaryPreview(entry)}</button><button data-action="open-diary-page" data-id="${this.escapeHtml(entry.id)}">Open Page</button></article>`).join("");
    const stats = `${month.entries.length} entries · ${month.entries.reduce((sum, entry) => sum + diaryMediaItems(entry).filter((media) => media.type === "image").length, 0)} photos · ${month.entries.reduce((sum, entry) => sum + (entry.media ?? []).filter((media) => media.type === "video").length, 0)} videos · ${month.entries.reduce((sum, entry) => sum + (entry.media ?? []).filter((media) => media.type === "audio").length, 0)} voice notes`;
    const cover = this.monthlyCovers?.[month.key] ?? defaultMonthlyCover(month.key);
    const coverPosition = cover.crop === "top" ? "center top" : cover.crop === "bottom" ? "center bottom" : "center center";
    const coverSize = cover.crop === "contain" ? "contain" : "cover";
    const coverStyle = cover.src.startsWith("data:") ? `background-image:url('${this.escapeHtml(cover.src)}');background-size:${coverSize};background-position:${coverPosition};` : `background:${this.escapeHtml(cover.src)}`;
    this.overlay.innerHTML = `<div class="modal game-panel journal-panel monthly-reader">${this.journalHeader("Reader", month)}<div class="reader-actions"><span>${stats}</span><button data-action="export-month-pdf" data-month="${month.key}">Export PDF</button><button data-action="change-month-cover">Change Cover</button><label class="month-cover-crop-control">Cover crop<select id="month-cover-crop"><option value="center" ${cover.crop === "center" || !cover.crop ? "selected" : ""}>Center crop</option><option value="top" ${cover.crop === "top" ? "selected" : ""}>Top crop</option><option value="bottom" ${cover.crop === "bottom" ? "selected" : ""}>Bottom crop</option><option value="contain" ${cover.crop === "contain" ? "selected" : ""}>Full image</option></select></label><input id="month-cover-input" type="file" accept="image/*" aria-label="Change monthly PDF cover"></div><div class="pdf-cover-preview" style="${coverStyle}"><strong>${this.escapeHtml(month.label)}</strong><small>Monthly Journal</small></div><div class="book-spread">${pages || `<div class="journal-empty"><p>${this.escapeHtml(month.label)} is still waiting for its first page.</p><button data-action="new-diary-entry">Write the first page</button></div>`}</div></div>`;
    this.focusStage();
  }

  private makePdfCanvas(): HTMLCanvasElement {
    const canvas = document.createElement("canvas");
    canvas.width = 1240;
    canvas.height = 1754;
    return canvas;
  }

  private wrapCanvasText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, lineHeight: number, maxLines = 18): number {
    const lines = this.canvasTextLines(ctx, text, maxWidth, maxLines);
    lines.forEach((line, index) => ctx.fillText(line, x, y + index * lineHeight));
    return y + lines.length * lineHeight;
  }

  private canvasTextLines(ctx: CanvasRenderingContext2D, text: string, maxWidth: number, maxLines = Number.POSITIVE_INFINITY): string[] {
    const lines: string[] = [];
    for (const paragraph of text.split(/\r?\n/)) {
      if (!paragraph.trim()) continue;
      const words = paragraph.match(/[A-Za-z0-9_./:+-]+|\s+|./gu)?.filter((token) => token.trim()) ?? [""];
      let line = "";
      for (const word of words.length ? words : [""]) {
        const joinsWithoutSpace = /^[\u4e00-\u9fff，。？！、；：“”‘’（）]/u.test(word);
        const next = line ? `${line}${joinsWithoutSpace ? "" : " "}${word}` : word;
        if (ctx.measureText(next).width > maxWidth && line) {
          lines.push(line);
          line = word;
          if (lines.length >= maxLines) return lines;
        } else {
          line = next;
        }
      }
      lines.push(line);
      if (lines.length >= maxLines) return lines;
    }
    return lines;
  }

  private drawCanvasTextLines(ctx: CanvasRenderingContext2D, lines: string[], x: number, y: number, lineHeight: number): number {
    lines.forEach((line, index) => ctx.fillText(line, x, y + index * lineHeight));
    return y + lines.length * lineHeight;
  }

  private async loadCanvasImage(src: string): Promise<HTMLImageElement | null> {
    if (!src) return null;
    const image = new Image();
    image.decoding = "async";
    image.src = src;
    try {
      await image.decode();
      return image;
    } catch {
      return null;
    }
  }

  private drawPdfImage(ctx: CanvasRenderingContext2D, image: HTMLImageElement, x: number, y: number, width: number, height: number): void {
    const imageRatio = image.naturalWidth / Math.max(1, image.naturalHeight);
    const boxRatio = width / height;
    const sourceWidth = imageRatio > boxRatio ? image.naturalHeight * boxRatio : image.naturalWidth;
    const sourceHeight = imageRatio > boxRatio ? image.naturalHeight : image.naturalWidth / boxRatio;
    const sourceX = (image.naturalWidth - sourceWidth) / 2;
    const sourceY = (image.naturalHeight - sourceHeight) / 2;
    ctx.drawImage(image, sourceX, sourceY, sourceWidth, sourceHeight, x, y, width, height);
  }

  private async drawPdfPhotoSpread(ctx: CanvasRenderingContext2D, entry: DiaryEntry, x: number, y: number, width: number, height: number): Promise<void> {
    const photos = entry.photos ?? [];
    if (!photos.length) return;
    const elements = [...(entry.scrapbookLayout?.elements ?? [])].sort((a, b) => a.zIndex - b.zIndex);
    ctx.save();
    ctx.beginPath();
    ctx.rect(x - 28, y - 28, width + 56, height + 56);
    ctx.clip();
    if (elements.length) {
      for (const element of elements) {
        const photoId = element.type === "photo" ? element.photoId : element.sourcePhotoId;
        const photo = photos.find((item) => item.id === photoId);
        const image = photo ? await this.loadCanvasImage(photo.src) : null;
        if (!image) continue;
        const imageWidth = 190 * Math.max(0.55, Math.min(1.6, element.scale));
        const imageHeight = 145 * Math.max(0.55, Math.min(1.6, element.scale));
        const imageX = x + (element.x / 100) * width;
        const imageY = y + (element.y / 100) * height;
        ctx.save();
        ctx.translate(imageX, imageY);
        ctx.rotate((element.rotation * Math.PI) / 180);
        ctx.fillStyle = "#fffdf0";
        if (element.type === "cutout" && element.crop?.shape === "circle") {
          ctx.beginPath();
          ctx.arc(0, 0, Math.min(imageWidth, imageHeight) / 2, 0, Math.PI * 2);
          ctx.clip();
          this.drawPdfImage(ctx, image, -imageWidth / 2, -imageHeight / 2, imageWidth, imageHeight);
        } else {
          ctx.fillRect(-imageWidth / 2 - 10, -imageHeight / 2 - 10, imageWidth + 20, imageHeight + 20);
          this.drawPdfImage(ctx, image, -imageWidth / 2, -imageHeight / 2, imageWidth, imageHeight);
        }
        ctx.restore();
      }
    } else {
      for (let index = 0; index < Math.min(photos.length, 4); index += 1) {
        const image = await this.loadCanvasImage(photos[index].src);
        if (!image) continue;
        const column = index % 2;
        const row = Math.floor(index / 2);
        const imageX = x + column * (width / 2) + 16;
        const imageY = y + row * 210 + 12;
        ctx.save();
        ctx.translate(imageX + 78, imageY + 66);
        ctx.rotate((index % 2 ? 0.05 : -0.04) + index * 0.015);
        ctx.fillStyle = "#fffdf0";
        ctx.fillRect(-88, -76, 176, 152);
        this.drawPdfImage(ctx, image, -78, -66, 156, 112);
        ctx.restore();
      }
    }
    ctx.restore();
  }

  private async renderJournalCoverPage(month: JournalMonth): Promise<MonthlyJournalPdfPage> {
    const cover = this.monthlyCovers?.[month.key] ?? defaultMonthlyCover(month.key);
    const canvas = this.makePdfCanvas();
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "#efe1c3";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    const coverImage = cover.src.startsWith("data:") ? await this.loadCanvasImage(cover.src) : null;
    if (coverImage) {
      this.drawPdfImage(ctx, coverImage, 0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "rgba(21, 16, 11, 0.42)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    } else {
      ctx.fillStyle = "#31433a";
      ctx.fillRect(0, 0, canvas.width, 240);
    }
    ctx.fillStyle = "#f6edcf";
    ctx.font = "700 64px serif";
    ctx.fillText("Walk Back Home", 100, 140);
    ctx.font = "400 34px sans-serif";
    ctx.fillText("Monthly Journal", 104, 194);
    ctx.fillStyle = coverImage ? "#fff1c9" : "#87643a";
    ctx.font = "700 72px serif";
    ctx.fillText(month.label, 110, 470);
    ctx.font = "400 30px sans-serif";
    ctx.fillText(`${month.entries.length} entries`, 114, 540);
    ctx.fillText(`${new Set(month.entries.map((entry) => entry.date)).size} written days`, 114, 588);
    ctx.strokeStyle = "rgba(102, 72, 42, 0.32)";
    ctx.lineWidth = 4;
    ctx.strokeRect(86, 340, canvas.width - 172, canvas.height - 520);
    ctx.fillStyle = "rgba(255, 255, 255, 0.26)";
    for (let y = 690; y < 1460; y += 64) {
      ctx.fillRect(150, y, canvas.width - 300, 2);
    }
    const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
    const page = { dataUrl, width: canvas.width, height: canvas.height };
    canvas.width = 1;
    canvas.height = 1;
    return page;
  }

  private async renderDiaryEntryPdfPages(entry: DiaryEntry): Promise<MonthlyJournalPdfPage[]> {
    const canvas = this.makePdfCanvas();
    const ctx = canvas.getContext("2d")!;
    ctx.font = "400 30px sans-serif";
    const compactBody = (entry.body || "Empty draft").replace(/\n{2,}/g, "\n").trim();
    const bodyLines = this.canvasTextLines(ctx, compactBody, 900);
    const pages: MonthlyJournalPdfPage[] = [];
    let consumedLines = 0;
    let pageIndex = 0;
    const photos = this.entryPdfImages(entry);
    while (consumedLines < bodyLines.length || pageIndex === 0) {
      canvas.width = 1240;
      canvas.height = 1754;
      const pageCtx = canvas.getContext("2d")!;
      const firstPage = pageIndex === 0;
      const maxLines = firstPage ? 22 : 29;
      const currentLines = bodyLines.slice(consumedLines, consumedLines + maxLines);
      consumedLines += currentLines.length;
      const isLastTextPage = consumedLines >= bodyLines.length;
      let photosDrawn = 0;
      if (isLastTextPage && photos.length) {
        const bodyY = firstPage ? 390 : 150;
        const nextY = bodyY + currentLines.length * 46 + 38;
        const availableRows = Math.max(0, Math.min(2, Math.floor((1470 - nextY) / 340)));
        photosDrawn = availableRows > 0 ? Math.min(photos.length, availableRows * 2) : 0;
        this.drawDiaryEntryPdfPage(pageCtx, entry, currentLines, firstPage, photosDrawn ? "" : "photos continue");
        if (photosDrawn) await this.drawDiaryPhotosOnPdfPage(pageCtx, photos.slice(0, photosDrawn), 150, nextY, 2, 300, 42);
      } else {
        this.drawDiaryEntryPdfPage(pageCtx, entry, currentLines, firstPage);
      }
      const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
      pages.push({ dataUrl, width: canvas.width, height: canvas.height });
      pageIndex += 1;
    }
    canvas.width = 1;
    canvas.height = 1;
    return pages;
  }

  private entryPdfImages(entry: DiaryEntry): Extract<DiaryMedia, { type: "image" }>[] {
    return diaryMediaItems(entry).filter((media): media is Extract<DiaryMedia, { type: "image" }> => media.type === "image");
  }

  private async renderMonthlyPdfFlowPages(month: JournalMonth): Promise<MonthlyJournalPdfPage[]> {
    const canvas = this.makePdfCanvas();
    const pages: MonthlyJournalPdfPage[] = [];
    let ctx = this.beginMonthlyPdfFlowPage(canvas);
    let cursorY = 130;
    for (const entry of [...month.entries].reverse()) {
      const result = await this.appendDiaryEntryToPdfFlow(canvas, ctx, pages, entry, cursorY);
      ctx = result.ctx;
      cursorY = result.cursorY;
    }
    pages.push({ dataUrl: canvas.toDataURL("image/jpeg", 0.9), width: canvas.width, height: canvas.height });
    canvas.width = 1;
    canvas.height = 1;
    return pages;
  }

  private beginMonthlyPdfFlowPage(canvas: HTMLCanvasElement): CanvasRenderingContext2D {
    canvas.width = 1240;
    canvas.height = 1754;
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "#f4e7c8";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#fff8dc";
    ctx.fillRect(88, 78, canvas.width - 176, canvas.height - 156);
    ctx.strokeStyle = "rgba(116, 82, 48, 0.4)";
    ctx.lineWidth = 4;
    ctx.strokeRect(88, 78, canvas.width - 176, canvas.height - 156);
    ctx.fillStyle = "rgba(128, 95, 57, 0.18)";
    for (let y = 126; y < 1600; y += 50) ctx.fillRect(150, y, canvas.width - 300, 2);
    return ctx;
  }

  private pushMonthlyPdfFlowPage(canvas: HTMLCanvasElement, pages: MonthlyJournalPdfPage[]): CanvasRenderingContext2D {
    pages.push({ dataUrl: canvas.toDataURL("image/jpeg", 0.9), width: canvas.width, height: canvas.height });
    return this.beginMonthlyPdfFlowPage(canvas);
  }

  private async appendDiaryEntryToPdfFlow(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D, pages: MonthlyJournalPdfPage[], entry: DiaryEntry, cursorY: number): Promise<{ ctx: CanvasRenderingContext2D; cursorY: number }> {
    ctx.font = "400 28px sans-serif";
    const compactBody = (entry.body || "Empty draft").replace(/\n{2,}/g, "\n").trim();
    const bodyLines = this.canvasTextLines(ctx, compactBody, 880);
    const headerHeight = 130;
    if (cursorY + headerHeight > 1500) {
      ctx = this.pushMonthlyPdfFlowPage(canvas, pages);
      cursorY = 130;
    }
    ctx.fillStyle = "#755330";
    ctx.font = "600 24px sans-serif";
    ctx.fillText(entry.date, 150, cursorY);
    ctx.font = "700 34px serif";
    cursorY = this.wrapCanvasText(ctx, entry.title || "Untitled Memory", 150, cursorY + 44, 880, 42, 2) + 12;
    const meta = [entry.location, entry.weather, entry.mood ? `Mood: ${entry.mood}` : "", entry.memoryKind].filter(Boolean).join(" · ");
    if (meta) {
      ctx.fillStyle = "rgba(88, 60, 35, 0.72)";
      ctx.font = "400 20px sans-serif";
      cursorY = this.wrapCanvasText(ctx, meta, 150, cursorY, 880, 28, 2) + 12;
    }
    ctx.fillStyle = "#4f3a28";
    ctx.font = "400 28px sans-serif";
    for (const line of bodyLines) {
      if (cursorY > 1510) {
        ctx = this.pushMonthlyPdfFlowPage(canvas, pages);
        cursorY = 130;
        ctx.fillStyle = "#4f3a28";
        ctx.font = "400 28px sans-serif";
      }
      ctx.fillText(line, 150, cursorY);
      cursorY += 42;
    }
    cursorY += 24;
    const photos = this.entryPdfImages(entry);
    for (let index = 0; index < photos.length; index += 2) {
      if (cursorY + 300 > 1510) {
        ctx = this.pushMonthlyPdfFlowPage(canvas, pages);
        cursorY = 130;
      }
      const row = photos.slice(index, index + 2);
      await this.drawDiaryPhotosOnPdfPage(ctx, row, 150, cursorY, 2, 260, 36);
      cursorY += 320;
    }
    return { ctx, cursorY: cursorY + 34 };
  }

  private drawDiaryEntryPdfPage(ctx: CanvasRenderingContext2D, entry: DiaryEntry, bodyLines: string[], firstPage: boolean, footerNote = ""): void {
    const canvas = ctx.canvas;
    ctx.fillStyle = "#f4e7c8";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#fff8dc";
    ctx.fillRect(88, 78, canvas.width - 176, canvas.height - 156);
    ctx.save();
    ctx.beginPath();
    ctx.rect(88, 78, canvas.width - 176, canvas.height - 156);
    ctx.clip();
    ctx.strokeStyle = "rgba(116, 82, 48, 0.4)";
    ctx.lineWidth = 4;
    ctx.strokeRect(88, 78, canvas.width - 176, canvas.height - 156);
    ctx.fillStyle = "rgba(128, 95, 57, 0.22)";
    const bodyY = firstPage ? 390 : 150;
    for (let y = bodyY - 30; y < 1480; y += 50) ctx.fillRect(150, y, canvas.width - 300, 2);
    if (firstPage) {
      ctx.fillStyle = "#755330";
      ctx.font = "600 30px sans-serif";
      ctx.fillText(entry.date, 150, 155);
      ctx.font = "700 48px serif";
      const titleBottom = this.wrapCanvasText(ctx, entry.title || "Untitled Memory", 150, 225, 900, 58, 3);
      ctx.font = "400 26px sans-serif";
      const meta = [entry.location, entry.weather, entry.memoryKind].filter(Boolean).join(" · ");
      if (meta) this.wrapCanvasText(ctx, meta, 150, titleBottom + 20, 900, 34, 2);
    }

    const photos = this.entryPdfImages(entry);
    const elements = [...(entry.scrapbookLayout?.elements ?? [])].sort((a, b) => a.zIndex - b.zIndex);
    ctx.fillStyle = "#4f3a28";
    ctx.font = "400 30px sans-serif";
    this.drawCanvasTextLines(ctx, bodyLines, 150, bodyY, 46);
    ctx.fillStyle = "rgba(88, 60, 35, 0.55)";
    ctx.font = "400 22px sans-serif";
    ctx.fillText(`${photos.length} photos · ${elements.length} placed elements${firstPage ? "" : " · continued"}${footerNote ? ` · ${footerNote}` : ""}`, 150, 1535);
    ctx.restore();
  }

  private async drawDiaryPhotosOnPdfPage(ctx: CanvasRenderingContext2D, photos: Extract<DiaryMedia, { type: "image" }>[], x: number, y: number, columns: number, size: number, gap: number): Promise<void> {
    if (!photos?.length) return;
    for (const [index, photo] of photos.entries()) {
      const image = await this.loadCanvasImage(photo.src);
      if (!image) continue;
      const column = index % columns;
      const row = Math.floor(index / columns);
      const photoX = x + column * (size + gap);
      const photoY = y + row * (size + gap);
      ctx.fillStyle = "#fffdf0";
      ctx.fillRect(photoX - 8, photoY - 8, size + 16, size + 16);
      this.drawPdfImage(ctx, image, photoX, photoY, size, size);
    }
  }

  private async renderMonthlyPdfPages(month: JournalMonth): Promise<MonthlyJournalPdfPage[]> {
    return [await this.renderJournalCoverPage(month), ...await this.renderMonthlyPdfFlowPages(month)];
  }

  private async exportMonthlyPdf(monthKey: string): Promise<void> {
    const month = this.currentBooksMonth(monthKey);
    this.showToast("Exporting monthly PDF...");
    const pages = await this.renderMonthlyPdfPages(month);
    const blob = makeMonthlyJournalImagePdf(month, pages);
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = monthlyPdfFilename(month.key);
    anchor.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    this.showToast(`Exported ${anchor.download}`);
  }

  private showMap(): void {
    const month = this.currentForestMonth();
    const doors = this.allDoors().map((door) => {
      return `<button data-action="enter-door" data-door="${this.escapeHtml(door.id)}">${this.escapeHtml(door.date)} ${this.escapeHtml(door.title)}<span>Replayable memory</span></button>`;
    }).join("");
    this.overlay.innerHTML = `<div class="modal game-panel walk-map-panel"><h2>Walk Back Home</h2><p>Public authored doors stay here. Private Memory Fragment lights are showing ${this.escapeHtml(month.label)}.</p><div class="month-nav"><button data-action="forest-month-prev">‹</button><strong>${this.escapeHtml(month.label)}</strong><button data-action="forest-month-next">›</button></div><div class="settings-row">${doors || "<p>No forest-visible diary entries yet.</p>"}</div><button data-action="open-timeline">Timeline</button><button data-action="settings">Back</button><button data-action="forest">Return to Forest</button><button data-action="close">Close</button></div>`;
    this.focusStage();
  }

  private currentForestMonth(): JournalMonth {
    const selected = this.selectedForestMonthKey || this.selectedTimelineMonthKey;
    const month = selectedOrLatestMonth(this.diaryEntries, selected);
    this.selectedForestMonthKey = month.key;
    return month;
  }

  private moveForestMonth(direction: -1 | 1): void {
    this.selectedForestMonthKey = adjacentMonthKey(this.currentForestMonth().key, direction);
    this.activeDoor = null;
    this.lastHudHtml = "";
    if (this.overlay.querySelector(".walk-map-panel")) this.showMap();
    else this.showToast(this.currentForestMonth().label);
  }

  private showDiaryReader(entryId = ""): void {
    const entry = this.diaryEntries.find((item) => item.id === entryId) ?? this.diaryEntries[0];
    if (!entry) return this.showTimeline();
    const date = new Date(`${entry.date}T00:00:00`);
    const day = Number.isNaN(date.getTime()) ? entry.date.slice(-2) : String(date.getDate()).padStart(2, "0");
    const month = Number.isNaN(date.getTime()) ? entry.date : date.toLocaleDateString("en-US", { month: "long", year: "numeric" }).toUpperCase();
    const weekday = formatDiaryWeekday(entry.date);
    const paragraphs = (entry.body || "Empty draft").split(/\n{2,}|\r?\n/).filter(Boolean).map((line) => `<p>${this.escapeHtml(line)}</p>`).join("");
    const media = diaryMediaItems(entry);
    const mediaHtml = media.length ? `<div class="journal-reading-media count-${Math.min(media.length, 4)}">${media.map((item) => item.type === "video"
      ? `<video class="journal-video-block" controls preload="metadata" src="${this.escapeHtml(item.src)}" aria-label="${this.escapeHtml(item.caption ?? "Journal video")}"></video>`
      : item.type === "audio"
        ? `<div class="journal-audio-reading" data-media="${this.escapeHtml(item.id)}">${this.renderJournalAudioNode(item)}</div>`
        : `<figure>${this.renderJournalImageCrop(item, "journal-reading-photo-frame")}</figure>`).join("")}</div>` : "";
    const moodMeta = entry.mood ? `心情：${entry.mood}` : "";
    this.overlay.innerHTML = `
      <div class="modal game-panel journal-reading-page mood-${entry.mood ?? "calm"}">
        <header class="journal-reading-header"><button data-action="journal-reader-back" aria-label="Back to journal">‹</button><button data-action="journal-more-menu" data-id="${this.escapeHtml(entry.id)}" aria-label="Journal more menu">⋮</button></header>
        <div class="journal-reader-more ${this.journalMoreMenuOpen ? "open" : ""}"><button data-action="journal-edit-current" data-id="${this.escapeHtml(entry.id)}">Edit Journal</button><button data-action="timeline-request-delete-entry" data-id="${this.escapeHtml(entry.id)}">Delete Journal</button><button data-action="journal-books">Books</button></div>
        <article class="journal-reading-sheet">
          <aside class="journal-reading-date"><strong>${this.escapeHtml(day)}</strong><span>${this.escapeHtml(month)}</span><small>${this.escapeHtml(weekday)}</small></aside>
          <h2>${this.escapeHtml(entry.title)}</h2>
          <div class="journal-reading-meta">${[entry.location, entry.weather, moodMeta].filter(Boolean).map((item) => this.escapeHtml(String(item))).join(" · ")}</div>
          <div class="journal-reading-body">${paragraphs}</div>
          ${mediaHtml}
          <footer>${this.escapeHtml(entry.date)}</footer>
        </article>
      </div>`;
    this.focusStage();
    for (const item of media) if (item.type === "audio") void this.resolveJournalAudioMedia(entry.id, item);
  }

  private showDiaryEditor(editId = ""): void {
    if (!editId) return this.showTimeline();
    if (this.journalEditorEntryId !== editId || !this.journalEditorSnapshot) this.beginJournalEditor(editId);
    const moreOpen = this.journalMoreMenuOpen;
    const editingBase = this.diaryEntries.find((entry) => entry.id === editId) ?? this.diaryEntries[0];
    const editing = editingBase ? this.pendingAudioEntry(editingBase) : editingBase;
    const today = new Date().toISOString().slice(0, 10);
    const dateValue = editing?.date ?? today;
    const weekday = formatDiaryWeekday(dateValue);
    const selectedMood = editing?.mood ?? "calm";
    this.activeScrapbookEntryId = editing?.id ?? "";
    const elementIds = new Set((editing?.scrapbookLayout?.elements ?? []).map((element) => element.id));
    if (!this.selectedScrapbookElementId || !elementIds.has(this.selectedScrapbookElementId)) this.selectedScrapbookElementId = "";
    const inlineMedia = this.renderJournalInlineMedia(editing);
    const elements = [...(editing?.scrapbookLayout?.elements ?? [])]
      .sort((a, b) => a.zIndex - b.zIndex)
      .map((element) => {
        const photoId = element.type === "photo" ? element.photoId : element.sourcePhotoId;
        const photo = editing?.photos?.find((item) => item.id === photoId);
        const selected = element.id === this.selectedScrapbookElementId;
        const cutoutClass = element.type === "cutout" ? ` ${element.crop?.shape === "circle" ? "circle-cutout" : "rect-cutout"}` : "";
        return `<div class="scrapbook-element${cutoutClass} ${selected ? "selected" : ""}" data-action="select-scrapbook-element" data-element="${this.escapeHtml(element.id)}" tabindex="0" style="left:${element.x}%;top:${element.y}%;transform:translate(-50%, -50%) rotate(${element.rotation}deg) scale(${element.scale});z-index:${element.zIndex + 30};">${photo ? `<img src="${this.escapeHtml(photo.src)}" alt="">` : `<span>Missing photo</span>`}${selected ? `<div class="element-controls" style="transform:rotate(${-element.rotation}deg) scale(${1 / element.scale});"><button data-action="scrapbook-delete" aria-label="Delete visual">×</button><button data-action="scrapbook-rotate" data-delta="-8" aria-label="Rotate left">↶</button><button data-action="scrapbook-rotate" data-delta="8" aria-label="Rotate right">↷</button><button data-action="scrapbook-resize" data-delta="0.1" aria-label="Bigger">+</button><button data-action="scrapbook-resize" data-delta="-0.1" aria-label="Smaller">−</button></div>` : ""}</div>`;
      }).join("");
    this.overlay.innerHTML = `
      <div class="modal game-panel diary-editor diary-page-editor journal-modal" data-entry="${this.escapeHtml(editing?.id ?? "")}">
        <div class="journal-toolbar">
          <button class="journal-icon-button" data-action="open-timeline" aria-label="Back to timeline">×</button>
          <div class="journal-brand">
            <span class="journal-mascot mood-${selectedMood}" aria-hidden="true"></span>
            <div><h2>Walk Back Home</h2></div>
          </div>
          <div class="journal-actions">
            <button class="journal-done" data-action="save-diary-entry" data-id="${this.escapeHtml(editing?.id ?? "")}">✓ 完成</button>
          </div>
        </div>
        <div class="journal-more-panel ${moreOpen ? "open" : ""}">
          <button data-action="show-import-diary">Import Existing Diary</button>
          <button class="danger" data-action="timeline-request-delete-entry" data-id="${this.escapeHtml(editing?.id ?? "")}">Delete Journal</button>
        </div>
        <section class="diary-paper scrapbook-page journal-sheet" aria-label="Diary page">
          <div class="paper-rings" aria-hidden="true"></div>
            <div class="journal-page-inner">
            <div class="journal-mobile-top-meta">
              <label class="journal-kind"><span>分类：</span><select id="diary-memory-kind"><option value="diary" ${editing?.memoryKind === "diary" ? "selected" : ""}>Diary only</option><option value="fragment" ${editing?.memoryKind === "fragment" ? "selected" : ""}>Memory Fragment</option><option value="chapter" ${editing?.memoryKind === "chapter" ? "selected" : ""}>Memory Chapter</option></select></label>
              <button class="journal-icon-button" data-action="journal-more-menu" data-id="${this.escapeHtml(editing?.id ?? "")}" aria-label="Journal more menu">⋯</button>
            </div>
            <div class="journal-meta-card">
              <label class="journal-title-row"><span>▮ 标题：</span><input id="diary-title" value="${this.escapeHtml(editing?.title ?? "Untitled Note")}"></label>
              <label class="journal-date-row"><span>▣ 日期：</span><input id="diary-date" type="date" value="${this.escapeHtml(dateValue)}"></label>
              <label><span>● 地点：</span><input id="diary-location" value="${this.escapeHtml(editing?.location ?? "")}" placeholder="地点"></label>
              <label><span>☁ 天气：</span><input id="diary-weather" value="${this.escapeHtml(editing?.weather ?? "")}" placeholder="天气"></label>
              <label><span>心情：</span><input id="diary-mood-text" value="${this.escapeHtml(selectedMood)}" placeholder="自定义心情"></label>
              <div class="journal-weekday">${this.escapeHtml(weekday)}</div>
            </div>
            <label class="journal-body-field"><textarea id="diary-body" rows="12">${this.escapeHtml(editing?.body ?? "")}</textarea></label>
            ${inlineMedia ? `<section class="journal-media-dock"><span class="journal-photo-insert-marker">Media inserts at your writing line</span>${inlineMedia}</section>` : ""}
            <input id="diary-mood" type="hidden" value="${this.escapeHtml(selectedMood)}">
          </div>
          ${elements}
        </section>
        ${this.renderJournalCropModal(editing)}
        ${this.renderJournalAudioDeleteConfirmation(editing)}
        <div class="integrated-tools journal-photo-dock"></div>
        <div class="journal-audio-recording-panel"><div class="journal-audio-recording-controls"></div><span class="journal-audio-recording-state">Add a voice note</span></div>
        <div class="mobile-editor-toolbar"><button data-action="journal-add-inline-media" data-id="${this.escapeHtml(editing?.id ?? "")}" aria-label="Add photo">▧<span>图片</span></button><div class="journal-audio-toolbar-slot"><div class="journal-audio-recording-controls"><button data-action="journal-record-audio" aria-label="Record audio">🎙<span>Record voice</span></button></div><span class="journal-audio-recording-state">Add a voice note</span></div><button data-action="journal-add-inline-media" data-id="${this.escapeHtml(editing?.id ?? "")}" aria-label="Add video">▭<span>视频</span></button></div>
        <input id="diary-mobile-media-input" class="sr-only" type="file" accept="image/*,video/mp4,video/webm,video/quicktime,.mp4,.webm,.mov" multiple>
      </div>`;
    this.refreshJournalAudioRecordingUi();
    for (const item of diaryMediaItems(editing)) if (item.type === "audio") void this.resolveJournalAudioMedia(editing.id, item);
    this.focusStage();
  }

  private async saveDiaryEntry(id = ""): Promise<void> {
    window.clearTimeout(this.diaryAutosaveTimer);
    if (this.journalAudioRecorder?.isActive()) {
      this.showToast("Stop the voice note before saving");
      return;
    }
    const entry = this.readDiaryDraftFromOverlay(id);
    if (!entry) return;
    const pending = this.pendingJournalAudio.get(entry.id) ?? [];
    let committedAudio: DiaryMedia[] = [];
    try {
      committedAudio = await commitPendingJournalAudio(this.journalMediaBlobStore, entry.id, pending);
    } catch (error) {
      this.showToast(error instanceof Error ? error.message : "Could not save the voice note.");
      return;
    }
    const savedEntry = committedAudio.length ? { ...entry, media: [...(entry.media ?? []), ...committedAudio] } : entry;
    const index = this.diaryEntries.findIndex((item) => item.id === entry.id);
    this.applyDiaryLibrary(upsertDiaryPageDraft(this.makeDiaryLibrary(), savedEntry));
    this.pendingJournalAudio.delete(entry.id);
    for (const item of pending) {
      this.journalMediaObjectUrls.delete(item.tempKey);
      this.journalMediaResolution.delete(item.tempKey);
    }
    this.selectedChapter = savedEntry.title;
    this.journalMoreMenuOpen = false;
    this.endJournalEditor();
    const chapterId = this.chapterDiaryReturnId;
    this.chapterDiaryReturnId = "";
    if (chapterId) this.showChapterDiary(chapterId);
    else this.showDiaryReader(savedEntry.id);
    this.showToast(index >= 0 ? "Diary updated" : "Diary entry added");
    this.autosave();
  }

  private readDiaryDraftFromOverlay(id = ""): DiaryEntry | null {
    const dateInput = this.overlay.querySelector<HTMLInputElement>("#diary-date");
    const titleInput = this.overlay.querySelector<HTMLInputElement>("#diary-title");
    const locationInput = this.overlay.querySelector<HTMLInputElement>("#diary-location");
    const weatherInput = this.overlay.querySelector<HTMLInputElement>("#diary-weather");
    const bodyInput = this.overlay.querySelector<HTMLTextAreaElement>("#diary-body");
    const kindInput = this.overlay.querySelector<HTMLSelectElement>("#diary-memory-kind");
    const moodInput = this.overlay.querySelector<HTMLInputElement>("#diary-mood-text") ?? this.overlay.querySelector<HTMLInputElement>("#diary-mood");
    const date = dateInput?.value.trim() ?? "";
    const title = titleInput?.value.trim() || "Untitled Memory";
    const body = bodyInput?.value.trim() ?? "";
    if (!date) {
      this.showToast("Date and diary text are required");
      return null;
    }
    const existing = this.diaryEntries.find((item) => item.id === id);
    const memoryKind = (kindInput?.value as MemoryKind | undefined) ?? "diary";
    const moodValue = moodInput?.value.trim() ?? "";
    const mood = moodValue || existing?.mood || "calm";
    const draft = makeDiaryEntry(date, title, body, id || existing?.id, memoryKind);
    return {
      ...draft,
      chapterId: memoryKind === "chapter" ? existing?.chapterId ?? draft.chapterId : undefined,
      location: locationInput?.value.trim(),
      weather: weatherInput?.value.trim(),
      mood,
      photos: existing?.photos ?? [],
      media: existing?.media ?? [],
      scrapbookLayout: existing?.scrapbookLayout ?? { elements: [] }
    };
  }

  private renderJournalInlineMedia(entry?: DiaryEntry): string {
    if (!entry) return "";
    const media = diaryMediaItems(entry);
    if (!media.length) return "";
    return `<div class="journal-inline-media">${media.map((item) => {
      const selected = this.selectedJournalMediaId === item.id;
      const mediaNode = item.type === "video"
        ? `<span class="journal-video-select-frame"><video class="journal-inline-photo journal-inline-video" preload="metadata" muted playsinline src="${this.escapeHtml(item.src)}" aria-label="${this.escapeHtml(item.caption ?? "Journal video")}"></video><span class="journal-video-select-shield" data-action="journal-media-select" data-media="${this.escapeHtml(item.id)}" aria-hidden="true">Tap for tools</span></span>`
        : item.type === "audio"
          ? this.renderJournalAudioNode(item)
          : this.renderJournalImageCrop(item, "journal-inline-photo-frame");
      const tools = item.type === "image"
        ? `<button data-action="journal-media-crop" data-media="${this.escapeHtml(item.id)}" data-crop-mode="custom">Edit Crop</button><button data-action="journal-media-remove" data-media="${this.escapeHtml(item.id)}">Remove</button>`
        : item.type === "audio"
          ? `<span class="journal-media-type">Voice note</span><button data-action="journal-media-remove" data-media="${this.escapeHtml(item.id)}">Remove</button>`
          : `<span class="journal-media-type">Video</span><button data-action="journal-media-remove" data-media="${this.escapeHtml(item.id)}">Remove</button>`;
      const selector = item.type === "audio"
        ? `<div class="journal-audio-media-card" data-action="journal-audio-edit" data-media="${this.escapeHtml(item.id)}" role="button" tabindex="0" aria-label="Edit voice note"><span class="journal-audio-node">${mediaNode}</span><button type="button" class="journal-audio-edit-button" data-action="journal-audio-edit" data-media="${this.escapeHtml(item.id)}" aria-label="Edit voice note">Edit</button></div>`
        : `<button class="journal-media-select" data-action="journal-media-select" data-media="${this.escapeHtml(item.id)}" aria-label="Select media">${mediaNode}</button>`;
      return `<figure class="journal-inline-media-item ${selected ? "selected" : ""}" data-media="${this.escapeHtml(item.id)}">
        ${selector}
        ${selected ? `<figcaption class="journal-media-tools">${tools}</figcaption>` : ""}
      </figure>`;
    }).join("")}</div>`;
  }

  private renderJournalAudioDeleteConfirmation(entry?: DiaryEntry): string {
    if (!entry || !this.pendingJournalMediaDeleteId) return "";
    const media = diaryMediaItems(entry).find((item) => item.id === this.pendingJournalMediaDeleteId && item.type === "audio");
    if (!media) return "";
    return `<div class="modal game-panel journal-audio-delete-confirmation delete-confirmation" role="dialog" aria-modal="true" aria-label="Confirm voice note deletion">
      <div><strong>Delete this voice note?</strong><p>This removes the recording from this journal.</p></div>
      <div class="delete-confirmation-actions"><button data-action="journal-audio-delete-cancel">Cancel</button><button class="danger" data-action="journal-audio-delete-confirm">Delete</button></div>
    </div>`;
  }

  private journalMediaCropStyle(crop: unknown): string {
    const next = normalizeJournalMediaCrop(crop);
    return `--crop-x:${next.x.toFixed(2)}%;--crop-y:${next.y.toFixed(2)}%;--crop-width:${next.width.toFixed(2)}%;--crop-height:${next.height.toFixed(2)}%;`;
  }

  private renderJournalImageCrop(media: Extract<DiaryMedia, { type: "image" }>, frameClass: "journal-inline-photo-frame" | "journal-reading-photo-frame"): string {
    const model = journalMediaCropRenderModel(media.crop, media.width, media.height);
    const hasStoredDimensions = Number.isFinite(media.width) && Number.isFinite(media.height) && (media.width ?? 0) > 0 && (media.height ?? 0) > 0;
    const loadHandler = hasStoredDimensions ? "" : ` onload="this.parentElement.style.setProperty('--crop-source-aspect', this.naturalWidth / Math.max(1, this.naturalHeight));this.parentElement.style.setProperty('--crop-aspect', (this.naturalWidth / Math.max(1, this.naturalHeight)) * (Number(this.parentElement.style.getPropertyValue('--crop-img-width')) / Math.max(1, Number(this.parentElement.style.getPropertyValue('--crop-img-height')))))"`;
    return `<span class="${frameClass}" style="${renderJournalMediaCropStyle(model)}"><img class="journal-inline-photo" src="${this.escapeHtml(media.src)}" alt=""${loadHandler}></span>`;
  }

  private journalCropImageAspectStyle(media: DiaryMedia): string {
    if (media.width && media.height) return `--crop-image-aspect:${Math.max(0.1, media.width / media.height).toFixed(4)};`;
    return "--crop-image-aspect:1;";
  }

  private renderJournalCropModal(entry?: DiaryEntry): string {
    if (!entry || !this.journalCropMediaId) return "";
    const media = diaryMediaItems(entry).find((item): item is Extract<DiaryMedia, { type: "image" }> => item.id === this.journalCropMediaId && item.type === "image");
    if (!media) return "";
    const crop = normalizeJournalMediaCrop(media.crop);
    return `<div class="journal-crop-modal" role="dialog" aria-label="Crop journal image">
      <div class="journal-crop-stage">
        <div class="journal-crop-image-frame" style="${this.journalCropImageAspectStyle(media)}">
          <img class="journal-crop-preview" src="${this.escapeHtml(media.src)}" alt="" onload="this.parentElement.style.setProperty('--crop-image-aspect', this.naturalWidth / Math.max(1, this.naturalHeight))">
          <div class="journal-crop-box" data-action="journal-crop-drag" data-crop-mode="move" style="${this.journalMediaCropStyle(crop)}" aria-label="Crop box">
            <span class="journal-crop-grid" aria-hidden="true"></span>
            ${["nw", "n", "ne", "e", "se", "s", "sw", "w"].map((handle) => `<span class="journal-crop-handle ${handle}" data-action="journal-crop-drag" data-crop-mode="${handle}" aria-hidden="true"></span>`).join("")}
          </div>
        </div>
      </div>
      <div class="journal-crop-actions">
        <button data-action="journal-crop-cancel">Cancel</button>
        <button data-action="journal-crop-reset" data-media="${this.escapeHtml(media.id)}">Reset</button>
        <button data-action="journal-crop-ratio-original" data-media="${this.escapeHtml(media.id)}">Original ratio</button>
        <button data-action="journal-crop-ratio-free" data-media="${this.escapeHtml(media.id)}">Free</button>
        <button data-action="journal-crop-apply" data-media="${this.escapeHtml(media.id)}">Crop</button>
      </div>
    </div>`;
  }

  private handleInput(event: Event): void {
    const target = event.target as HTMLElement;
    if (target instanceof HTMLInputElement && target.id === "reflection-search") {
      this.reflectionWallSearch = target.value;
      this.refreshReflectionWallOnly();
      return;
    }
    if (target instanceof HTMLInputElement && target.id === "timeline-date-input") {
      target.classList.toggle("no-results", !this.timelineDateInputHasEntries(target.value));
      return;
    }
    if (target instanceof HTMLInputElement && target.closest(".journal-crop-modal")) {
      this.refreshJournalCropPreviewFromInputs();
      return;
    }
    if (target instanceof HTMLInputElement && target.dataset.musicSearch !== undefined) {
      this.personalPlayer.librarySearch = target.value;
      void this.showRecords();
      this.save.savePersonalPlayer(this.personalPlayer);
      return;
    }
    if (target instanceof HTMLInputElement && target.dataset.musicSeek !== undefined) {
      this.seekPersonalMusic(Number(target.value));
      return;
    }
    if (target instanceof HTMLInputElement && (target.dataset.musicTitle !== undefined || target.dataset.musicArtist !== undefined)) {
      this.updateCurrentUserTrackMetadata();
      return;
    }
    if (!target.closest(".diary-page-editor")) return;
    if (target instanceof HTMLInputElement && target.type === "file") return;
    if (target instanceof HTMLInputElement && target.id === "diary-date") this.updateVisibleDiaryWeekday(target.value);
    this.journalEditorDirty = true;
    const editor = target.closest<HTMLElement>(".diary-page-editor");
    const entryId = editor?.dataset.entry ?? "";
    window.clearTimeout(this.diaryAutosaveTimer);
    const state = this.overlay.querySelector<HTMLElement>("#diary-save-state");
    if (state) state.textContent = "Saving...";
    this.diaryAutosaveTimer = window.setTimeout(() => {
      const draft = this.readDiaryDraftFromOverlay(entryId);
      if (!draft) return;
      this.applyDiaryLibrary(upsertDiaryPageDraft(this.makeDiaryLibrary(), draft));
      this.autosave();
      const savedState = this.overlay.querySelector<HTMLElement>("#diary-save-state");
      if (savedState) savedState.textContent = "Saved";
    }, 360);
  }

  private updateVisibleDiaryWeekday(date: string): void {
    const weekday = this.overlay.querySelector<HTMLElement>(".journal-weekday");
    if (weekday) weekday.textContent = formatDiaryWeekday(date);
  }

  private markDiarySaved(message: string): void {
    const state = this.overlay.querySelector<HTMLElement>("#diary-save-state");
    const button = this.overlay.querySelector<HTMLButtonElement>(".journal-done");
    if (state) state.textContent = message;
    if (button) {
      button.textContent = "✓ 已保存";
      button.classList.add("saved");
    }
  }

  private showImportDiary(): void {
    this.overlay.innerHTML = `
      <div class="modal game-panel diary-editor">
        <h2>Import Existing Diary</h2>
        <p class="quiet-line">Use fictional or personal runtime text only. Imported entries default to Diary only.</p>
        <label>TXT / Markdown file<input id="diary-import-file" type="file" accept=".txt,.md,.markdown,text/plain,text/markdown"></label>
        <label>Diary lines<textarea id="diary-import" rows="8" placeholder="# **2026年8月2日 大晴天**&#10;今天的日记正文...&#10;&#10;or: 2026-08-06 | Rain Letter | Diary text"></textarea></label>
        <button data-action="import-diary-lines">Import Lines</button>
        <button data-action="open-timeline">Back to Timeline</button>
        <button data-action="close">Close</button>
      </div>`;
    this.focusStage();
  }

  private importDiaryLines(): void {
    const importInput = this.overlay.querySelector<HTMLTextAreaElement>("#diary-import");
    const imported = parseDiaryImport(importInput?.value ?? "");
    if (!imported.length) {
      this.showToast("Use a dated Markdown heading or YYYY-MM-DD | Title | Diary text");
      return;
    }
    for (const entry of imported) {
      const existing = this.diaryEntries.findIndex((item) => item.id === entry.id);
      this.applyDiaryLibrary(upsertDiaryEntry(this.makeDiaryLibrary(), entry));
    }
    this.showToast(`Imported ${imported.length} diary date${imported.length === 1 ? "" : "s"}`);
    this.showTimeline();
    this.autosave();
  }

  private deleteDiaryEntry(id: string): void {
    const entry = this.diaryEntries.find((item) => item.id === id);
    this.applyDiaryLibrary(deleteDiaryEntryById(this.makeDiaryLibrary(), id));
    if (entry) {
      this.visitedMemories.delete(entry.id);
      this.walkedThroughMemories.delete(entry.id);
      this.readMemories.delete(entry.id);
      this.selectedTimelineEntryIds.delete(entry.id);
      if (this.currentDoor?.id === entry.id) this.currentDoor = null;
      this.showToast("Diary date deleted");
    }
    this.showTimeline();
    this.autosave();
  }

  private setDiaryMemoryKind(id: string, memoryKind: MemoryKind): void {
    const index = this.diaryEntries.findIndex((entry) => entry.id === id);
    if (index < 0) return;
    this.diaryEntries[index] = updateDiaryMemoryKind(this.diaryEntries[index], memoryKind);
    if (this.journalEditorEntryId === id) this.journalEditorDirty = true;
    this.showDiaryEditor(id);
    this.autosave();
  }

  private setTimelineMemoryKind(id: string, memoryKind: MemoryKind): void {
    const index = this.diaryEntries.findIndex((entry) => entry.id === id);
    if (index < 0) return;
    this.diaryEntries[index] = updateDiaryMemoryKind(this.diaryEntries[index], memoryKind);
    this.showTimeline();
    this.showToast("Memory classification updated");
    this.autosave();
  }

  private applyTimelineFilters(): void {
    const sort = this.overlay.querySelector<HTMLSelectElement>("#timeline-sort")?.value as DiaryTimelineSort | undefined;
    const kind = this.overlay.querySelector<HTMLSelectElement>("#timeline-kind-filter")?.value as TimelineMemoryKindFilter | undefined;
    const dateInput = this.overlay.querySelector<HTMLInputElement>("#timeline-date-input");
    const scopeInput = this.overlay.querySelector<HTMLSelectElement>("#timeline-date-scope");
    const searchInput = this.overlay.querySelector<HTMLInputElement>("#timeline-search");
    const selectedDate = dateInput?.value || `${this.timelineCursorMonth().key}-01`;
    const scope = this.normalizeTimelineDateScope(scopeInput?.value);
    if (scope !== "all" && !/^\d{4}-\d{2}-\d{2}$/.test(selectedDate)) {
      this.showToast("Choose a calendar date first");
      return;
    }
    this.timelineSort = sort === "date-asc" || sort === "title-asc" ? sort : "date-desc";
    this.timelineKindFilter = kind === "diary" || kind === "fragment" || kind === "chapter" ? kind : "all";
    this.timelineDateScope = scope;
    if (scope !== "all") this.selectedTimelineMonthKey = selectedDate.slice(0, 7);
    this.timelineDateFilter = scope === "date" ? selectedDate : "";
    this.timelineSearch = searchInput?.value.trim() ?? "";
    this.timelineVisibleCount = journalBatchSize;
    this.selectedTimelineEntryIds.clear();
    const nextMonth = this.currentTimelineMonthView();
    this.timelineFilterAppliedMessage = nextMonth.entries.length ? `Applied · ${nextMonth.entries.length} result${nextMonth.entries.length === 1 ? "" : "s"}` : "Applied · no result";
    this.showTimeline();
    this.showToast(nextMonth.entries.length ? `Showing ${nextMonth.entries.length} result${nextMonth.entries.length === 1 ? "" : "s"}` : "No result for those filters");
  }

  private pickTimelineDate(date: string): void {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !this.timelineDateHasEntries(date)) return;
    this.timelineDateScope = "date";
    this.timelineDateFilter = date;
    this.selectedTimelineMonthKey = date.slice(0, 7);
    this.timelineVisibleCount = journalBatchSize;
    this.selectedTimelineEntryIds.clear();
    const nextMonth = this.currentTimelineMonthView();
    this.timelineFilterAppliedMessage = `Applied · ${nextMonth.entries.length} result${nextMonth.entries.length === 1 ? "" : "s"}`;
    this.showTimeline();
    this.showToast(`Showing ${date}`);
  }

  private clearTimelineFilters(): void {
    this.timelineSort = "date-desc";
    this.timelineKindFilter = "all";
    this.timelineDateFilter = "";
    this.timelineDateScope = "all";
    this.timelineSearch = "";
    this.timelineFilterAppliedMessage = "Filters cleared";
    this.timelineVisibleCount = journalBatchSize;
    this.selectedTimelineEntryIds.clear();
    this.showTimeline();
    this.showToast("Timeline filters cleared");
  }

  private normalizeTimelineDateScope(value: unknown): TimelineDateScope {
    return value === "year" || value === "month" || value === "date" ? value : "all";
  }

  private selectAllTimelineEntries(): void {
    this.selectedTimelineEntryIds = new Set(selectAllTimelineEntryIds(this.currentTimelineMonthView()));
    this.showTimeline();
  }

  private clearTimelineSelection(): void {
    this.selectedTimelineEntryIds.clear();
    this.timelineDeleteConfirmOpen = false;
    this.showTimeline();
  }

  private requestDeleteSelectedTimelineEntries(): void {
    if (!this.selectedTimelineEntryIds.size) {
      this.showToast("No diary selected");
      return;
    }
    this.timelineDeleteConfirmOpen = true;
    this.showTimeline();
  }

  private requestDeleteTimelineEntry(id: string): void {
    if (!id) return;
    this.selectedTimelineEntryIds = new Set([id]);
    this.timelineDeleteConfirmOpen = true;
    this.showTimeline();
  }

  private deleteSelectedTimelineEntries(): void {
    if (!this.selectedTimelineEntryIds.size) {
      this.showToast("No diary selected");
      return;
    }
    const selected = new Set(this.selectedTimelineEntryIds);
    this.applyDiaryLibrary(deleteDiaryEntriesByIds(this.makeDiaryLibrary(), selected));
    for (const id of selected) {
      this.visitedMemories.delete(id);
      this.walkedThroughMemories.delete(id);
      this.readMemories.delete(id);
      if (this.currentDoor?.id === id) this.currentDoor = null;
    }
    this.selectedTimelineEntryIds.clear();
    this.timelineDeleteConfirmOpen = false;
    this.showTimeline();
    this.showToast(`Deleted ${selected.size} diary entries`);
    this.autosave();
  }

  private selectJournalMedia(mediaId: string): void {
    this.selectedJournalMediaId = this.selectedJournalMediaId === mediaId ? "" : mediaId;
    const editor = this.overlay.querySelector<HTMLElement>(".diary-page-editor");
    this.showDiaryEditorPreservingScroll(editor?.dataset.entry ?? "", mediaId);
  }

  private removeSelectedJournalMedia(mediaId: string): void {
    const editor = this.overlay.querySelector<HTMLElement>(".diary-page-editor");
    const entryId = editor?.dataset.entry ?? "";
    const entry = this.diaryEntries.find((item) => item.id === entryId);
    if (!entry || !mediaId) return;
    const editing = this.pendingAudioEntry(entry);
    const selected = diaryMediaItems(editing).find((media) => media.id === mediaId);
    if (selected?.type === "audio") {
      this.pendingJournalMediaDeleteId = mediaId;
      this.selectedJournalMediaId = mediaId;
      this.showDiaryEditorPreservingScroll(entry.id);
      return;
    }
    const draft = this.readDiaryDraftFromOverlay(entry.id) ?? entry;
    const photoMatch = draft.photos?.some((photo) => photo.id === mediaId);
    const removed = diaryMediaItems(draft).find((media) => media.id === mediaId);
    const next = photoMatch ? removePhotoAttachment(draft, mediaId) : removeJournalMedia(draft, mediaId);
    this.selectedJournalMediaId = "";
    this.updateDiaryEditorImmediately(next);
    if (removed?.type === "audio" && !collectReferencedJournalMediaKeys(this.makeDiaryLibrary()).includes(removed.storageKey)) void this.journalMediaBlobStore.deleteBlob(removed.storageKey);
    this.showToast("Media removed");
  }

  private async confirmJournalMediaDelete(): Promise<void> {
    const editor = this.overlay.querySelector<HTMLElement>(".diary-page-editor");
    const entryId = editor?.dataset.entry ?? "";
    const mediaId = this.pendingJournalMediaDeleteId;
    const entry = this.diaryEntries.find((item) => item.id === entryId);
    if (!entry || !mediaId) return;
    const pending = this.pendingJournalAudio.get(entry.id) ?? [];
    const pendingItem = pending.find((item) => item.mediaId === mediaId);
    this.pendingJournalMediaDeleteId = "";
    this.selectedJournalMediaId = "";
    if (pendingItem) {
      this.pendingJournalAudio.set(entry.id, pending.filter((item) => item.mediaId !== mediaId));
      await this.journalMediaBlobStore.deleteBlob(pendingItem.tempKey);
      this.journalMediaObjectUrls.delete(pendingItem.tempKey);
      this.journalMediaResolution.delete(pendingItem.tempKey);
      this.journalEditorDirty = true;
      this.showDiaryEditorPreservingScroll(entry.id);
      this.showToast("Media removed");
      return;
    }
    const draft = this.readDiaryDraftFromOverlay(entry.id) ?? entry;
    const removed = diaryMediaItems(draft).find((media) => media.id === mediaId && media.type === "audio");
    if (!removed || removed.type !== "audio") return;
    const next = removeJournalMedia(draft, mediaId);
    this.updateDiaryEditorImmediately(next);
    if (!collectReferencedJournalMediaKeys(this.makeDiaryLibrary()).includes(removed.storageKey)) await this.journalMediaBlobStore.deleteBlob(removed.storageKey);
    this.showToast("Media removed");
  }

  private cancelJournalMediaDelete(): void {
    const editor = this.overlay.querySelector<HTMLElement>(".diary-page-editor");
    const entryId = editor?.dataset.entry ?? "";
    this.pendingJournalMediaDeleteId = "";
    this.showDiaryEditorPreservingScroll(entryId);
  }

  private cropSelectedJournalMedia(mediaId: string): void {
    const editor = this.overlay.querySelector<HTMLElement>(".diary-page-editor");
    const entryId = editor?.dataset.entry ?? "";
    const entry = this.diaryEntries.find((item) => item.id === entryId);
    if (!entry || !mediaId) return;
    const draft = this.readDiaryDraftFromOverlay(entry.id) ?? entry;
    const current = diaryMediaItems(draft).find((media) => media.id === mediaId);
    if (current?.type !== "image") {
      this.selectedJournalMediaId = mediaId;
      this.showDiaryEditorPreservingScroll(entry.id);
      this.showToast("Videos can be selected and removed here");
      return;
    }
    this.selectedJournalMediaId = mediaId;
    this.journalCropMediaId = mediaId;
    this.updateDiaryEditorImmediately(draft);
  }

  private applyJournalCrop(mediaId: string): void {
    const editor = this.overlay.querySelector<HTMLElement>(".diary-page-editor");
    const entryId = editor?.dataset.entry ?? "";
    const entry = this.diaryEntries.find((item) => item.id === entryId);
    if (!entry || !mediaId) return;
    const draft = this.readDiaryDraftFromOverlay(entry.id) ?? entry;
    const crop = this.readJournalCropInputs();
    const next = this.updateJournalMediaCrop(draft, mediaId, crop);
    this.selectedJournalMediaId = mediaId;
    this.journalCropMediaId = "";
    this.updateDiaryEditorImmediately(next);
    this.showToast("Image crop updated");
  }

  private closeJournalCropModal(): void {
    const editor = this.overlay.querySelector<HTMLElement>(".diary-page-editor");
    const entryId = editor?.dataset.entry ?? "";
    this.journalCropMediaId = "";
    this.showDiaryEditorPreservingScroll(entryId);
  }

  private resetJournalCrop(mediaId: string): void {
    if (!mediaId) return;
    const editor = this.overlay.querySelector<HTMLElement>(".diary-page-editor");
    const entryId = editor?.dataset.entry ?? "";
    const entry = this.diaryEntries.find((item) => item.id === entryId);
    if (!entry) return;
    const draft = this.readDiaryDraftFromOverlay(entry.id) ?? entry;
    const next = this.updateJournalMediaCrop(draft, mediaId, { x: 0, y: 0, width: 100, height: 100 });
    this.journalCropMediaId = mediaId;
    this.selectedJournalMediaId = mediaId;
    this.updateDiaryEditorImmediately(next);
  }

  private refreshJournalCropPreviewFromInputs(): void {
    const box = this.overlay.querySelector<HTMLElement>(".journal-crop-box");
    if (!box) return;
    box.setAttribute("style", this.journalMediaCropStyle(this.readJournalCropInputs()));
  }

  private readJournalCropInputs(): DiaryMediaCrop {
    const box = this.overlay.querySelector<HTMLElement>(".journal-crop-box");
    return box ? this.cropFromBoxStyle(box) : { x: 0, y: 0, width: 100, height: 100 };
  }

  private cropFromBoxStyle(box: HTMLElement): DiaryMediaCrop {
    const value = (name: string, fallback: number) => Number.parseFloat(box.style.getPropertyValue(name)) || fallback;
    return normalizeJournalMediaCrop({
      x: value("--crop-x", 0),
      y: value("--crop-y", 0),
      width: value("--crop-width", 100),
      height: value("--crop-height", 100)
    });
  }

  private resizeJournalCrop(start: DiaryMediaCrop, mode: string, dx: number, dy: number): DiaryMediaCrop {
    let { x, y, width, height } = start;
    if (mode === "move") {
      x += dx;
      y += dy;
      return normalizeJournalMediaCrop({ x, y, width, height });
    }
    if (mode.includes("w")) {
      x += dx;
      width -= dx;
    }
    if (mode.includes("e")) width += dx;
    if (mode.includes("n")) {
      y += dy;
      height -= dy;
    }
    if (mode.includes("s")) height += dy;
    width = Math.max(8, width);
    height = Math.max(8, height);
    x = Math.max(0, Math.min(100 - width, x));
    y = Math.max(0, Math.min(100 - height, y));
    return normalizeJournalMediaCrop({ x, y, width, height });
  }

  private setJournalCropOriginalRatio(): void {
    const stage = this.overlay.querySelector<HTMLElement>(".journal-crop-stage");
    const box = this.overlay.querySelector<HTMLElement>(".journal-crop-box");
    const image = this.overlay.querySelector<HTMLImageElement>(".journal-crop-preview");
    if (!stage || !box || !image) return;
    const ratio = Math.max(0.05, (image.naturalWidth || 1) / Math.max(1, image.naturalHeight || 1));
    let width = 86;
    let height = width / ratio;
    if (height > 86) {
      height = 86;
      width = height * ratio;
    }
    const crop = normalizeJournalMediaCrop({
      x: (100 - width) / 2,
      y: (100 - height) / 2,
      width,
      height
    });
    box.setAttribute("style", this.journalMediaCropStyle(crop));
  }

  private showDiaryEditorPreservingScroll(entryId: string, mediaId = ""): void {
    const panel = this.overlay.querySelector<HTMLElement>(".journal-modal");
    const restoreScrollTop = panel?.scrollTop ?? window.scrollY;
    const restoreWindowScrollTop = window.scrollY;
    const journalMediaAnchor = mediaId ? panel?.querySelector<HTMLElement>(`[data-media="${this.escapeHtml(mediaId)}"]`) : null;
    const journalMediaAnchorTop = journalMediaAnchor?.getBoundingClientRect().top ?? null;
    const panelTop = panel?.getBoundingClientRect().top ?? 0;
    const journalMediaAnchorOffset = journalMediaAnchorTop === null ? null : journalMediaAnchorTop - panelTop;
    this.showDiaryEditor(entryId);
    window.requestAnimationFrame(() => {
      const nextPanel = this.overlay.querySelector<HTMLElement>(".journal-modal");
      if (nextPanel) {
        const nextAnchor = mediaId ? nextPanel.querySelector<HTMLElement>(`[data-media="${this.escapeHtml(mediaId)}"]`) : null;
        if (nextAnchor && journalMediaAnchorOffset !== null) {
          const nextOffset = nextAnchor.getBoundingClientRect().top - nextPanel.getBoundingClientRect().top;
          nextPanel.scrollTop = Math.max(0, restoreScrollTop + nextOffset - journalMediaAnchorOffset);
        } else {
          nextPanel.scrollTop = restoreScrollTop;
        }
      }
      window.scrollTo({ top: restoreWindowScrollTop, behavior: "auto" });
    });
  }

  private updateJournalMediaCrop(entry: DiaryEntry, mediaId: string, crop: DiaryMediaCrop): DiaryEntry {
    return {
      ...entry,
      photos: entry.photos?.map((photo) => photo.id === mediaId ? { ...photo, crop } : photo),
      media: entry.media?.map((media) => media.id === mediaId && media.type !== "audio" ? { ...media, crop } : media)
    };
  }

  private showScrapbookComposer(id: string): void {
    const entry = this.diaryEntries.find((item) => item.id === id);
    if (!entry) return this.showDiaryEditor();
    this.activeScrapbookEntryId = entry.id;
    const photos = entry.photos?.map((photo) => `
      <div class="photo-chip">
        <img src="${this.escapeHtml(photo.src)}" alt="">
        <span>${this.escapeHtml(photo.caption ?? photo.id)}</span>
        <button data-action="add-photo-to-scrapbook" data-photo="${this.escapeHtml(photo.id)}">Add to Page</button>
      </div>`).join("") || `<p class="quiet-line">No photos attached yet.</p>`;
    const elements = [...(entry.scrapbookLayout?.elements ?? [])]
      .sort((a, b) => a.zIndex - b.zIndex)
      .map((element) => {
        const photoId = element.type === "photo" ? element.photoId : element.sourcePhotoId;
        const photo = entry.photos?.find((item) => item.id === photoId);
        const selected = element.id === this.selectedScrapbookElementId;
        return `<button class="scrapbook-element ${selected ? "selected" : ""}" data-action="select-scrapbook-element" data-element="${this.escapeHtml(element.id)}" style="left:${element.x}%;top:${element.y}%;transform:translate(-50%, -50%) rotate(${element.rotation}deg) scale(${element.scale});z-index:${element.zIndex};">${photo ? `<img src="${this.escapeHtml(photo.src)}" alt="">` : `<span>Missing photo</span>`}</button>`;
      }).join("");
    this.overlay.innerHTML = `
      <div class="modal game-panel scrapbook-composer" data-entry="${this.escapeHtml(entry.id)}">
        <div class="composer-head">
          <div><h2>Scrapbook Mode</h2><p>${this.escapeHtml(entry.date)} · ${this.escapeHtml(entry.title)}</p></div>
          <label class="attach-photo">Attach Photo<input id="scrapbook-photo-input" type="file" accept="image/*"></label>
        </div>
        <div class="composer-shell">
          <aside class="photo-tray">${photos}</aside>
          <section class="scrapbook-page" aria-label="Diary scrapbook page">${elements || `<p class="empty-page">Attach a photo, then add it to the page.</p>`}</section>
          <aside class="composer-tools">
            <strong>Selected</strong>
            <div class="tool-grid">
              <button data-action="scrapbook-move" data-dx="0" data-dy="-4">Up</button>
              <button data-action="scrapbook-move" data-dx="-4" data-dy="0">Left</button>
              <button data-action="scrapbook-move" data-dx="4" data-dy="0">Right</button>
              <button data-action="scrapbook-move" data-dx="0" data-dy="4">Down</button>
              <button data-action="scrapbook-resize" data-delta="0.1">Bigger</button>
              <button data-action="scrapbook-resize" data-delta="-0.1">Smaller</button>
              <button data-action="scrapbook-rotate" data-delta="-8">Rotate Left</button>
              <button data-action="scrapbook-rotate" data-delta="8">Rotate Right</button>
              <button data-action="scrapbook-layer" data-direction="front">Front</button>
              <button data-action="scrapbook-layer" data-direction="back">Back</button>
              <button data-action="scrapbook-delete">Delete</button>
            </div>
          </aside>
        </div>
        <button data-action="edit-diary-entry" data-id="${this.escapeHtml(entry.id)}">Back to Entry</button><button data-action="open-timeline">Timeline</button><button data-action="close">Close</button>
      </div>`;
    this.focusStage();
  }

  private updateDiaryEntry(entry: DiaryEntry): void {
    this.applyDiaryLibrary(upsertDiaryEntry(this.makeDiaryLibrary(), entry));
    if (this.journalEditorEntryId === entry.id) this.journalEditorDirty = true;
    this.autosave();
  }

  private activeScrapbookEntry(): DiaryEntry | null {
    return this.diaryEntries.find((entry) => entry.id === this.activeScrapbookEntryId) ?? null;
  }

  private async handleChange(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    if (input.id === "timeline-date-scope" || input.id === "timeline-date-input") {
      this.timelineFilterAppliedMessage = "";
      const dateInput = this.overlay.querySelector<HTMLInputElement>("#timeline-date-input");
      if (dateInput) dateInput.classList.toggle("no-results", !this.timelineDateInputHasEntries(dateInput.value));
      return;
    }
    const timelineKindId = input.dataset.timelineKind;
    if (timelineKindId) {
      this.setTimelineMemoryKind(timelineKindId, input.value as MemoryKind);
      return;
    }
    const timelineSelectId = input.dataset.timelineSelect;
    if (timelineSelectId) {
      if (input.checked) this.selectedTimelineEntryIds.add(timelineSelectId);
      else this.selectedTimelineEntryIds.delete(timelineSelectId);
      this.showTimeline();
      return;
    }
    const recordSelectId = input.dataset.recordSelect;
    if (recordSelectId) {
      if (input.checked) this.selectedRecordIds.add(recordSelectId);
      else this.selectedRecordIds.delete(recordSelectId);
      this.preserveRecordsScroll();
      void this.showRecords();
      return;
    }
    if (input.id === "diary-date" || input.id === "diary-memory-kind") {
      this.handleInput(event);
      return;
    }
    if (input.id === "floating-lyrics-width") {
      const width = Math.max(96, Math.min(520, Number(input.value) || (this.personalPlayer.lyricsOverlay.width ?? 280)));
      this.personalPlayer.lyricsOverlay = { ...this.personalPlayer.lyricsOverlay, width };
      this.save.savePersonalPlayer(this.personalPlayer);
      this.updatePersonalMusicOverlay();
      return;
    }
    if (input.id === "vinyl-cover-input") {
      await this.handlePersonalCoverInput(input);
      return;
    }
    if (input.id === "music-audio-input") {
      await this.handlePersonalAudioInput(input);
      return;
    }
    if (input.id === "music-lyrics-input") {
      await this.handlePersonalLyricsInput(input);
      return;
    }
    if (input.id === "music-background-input") {
      await this.handlePlayerBackgroundInput(input);
      return;
    }
    if (input.id === "restore-backup-input") {
      await this.handleRestoreBackupInput(input);
      return;
    }
    if (input.id === "diary-mobile-media-input") {
      await this.handleDiaryInlineMediaInput(input);
      return;
    }
    if (input.id === "month-cover-input") {
      await this.handleMonthCoverInput(input);
      return;
    }
    if (input.id === "month-cover-crop") {
      this.setMonthlyCoverCrop(input.value as JournalBookCoverCrop);
      return;
    }
    if (input.id === "music-sort") {
      this.personalPlayer.librarySort = input.value as MusicSort;
      void this.showRecords();
      this.autosave();
      return;
    }
    if (input.id === "diary-import-file") {
      await this.handleDiaryImportFile(input);
      return;
    }
    if (input.id !== "scrapbook-photo-input" && input.id !== "diary-photo-input" && input.id !== "diary-mobile-photo-input") return;
    if (!input.files?.[0]) return;
    const entry = this.activeScrapbookEntry();
    if (!entry) return;
    window.clearTimeout(this.diaryAutosaveTimer);
    const draft = input.closest(".diary-page-editor") ? (this.readDiaryDraftFromOverlay(entry.id) ?? entry) : entry;
    const state = this.overlay.querySelector<HTMLElement>("#diary-save-state");
    if (state) state.textContent = "Adding photo...";
    const file = input.files[0];
    const src = await this.readDiaryImageAsDataUrl(file);
    const photoId = `photo-${Date.now()}`;
    const storageKey = `diary-images/${entry.id}/${photoId}`;
    const photo = { id: photoId, storageKey, src, caption: file.name };
    const withPhoto = addPhotoAttachment(draft, photo);
    const nextEntry = input.id === "diary-mobile-photo-input" || input.id === "diary-photo-input"
      ? attachPhotoAndPlaceOnPage(draft, photo, `element-${Date.now()}`)
      : withPhoto;
    this.updateDiaryEntry(nextEntry);
    if (input.id === "diary-photo-input" || input.id === "diary-mobile-photo-input") this.showDiaryEditor(entry.id);
    else this.showScrapbookComposer(entry.id);
    this.showToast("Photo attached");
  }

  private async handleDiaryInlineMediaInput(input: HTMLInputElement): Promise<void> {
    const files = Array.from(input.files ?? []);
    const entry = this.activeScrapbookEntry();
    if (!files.length || !entry) return;
    const validFiles = files.filter((file) => file.type.startsWith("image/") || file.type.startsWith("video/") || /\.(mp4|webm|mov)$/i.test(file.name));
    if (!validFiles.length) {
      this.showToast("Choose a photo or browser-supported video.");
      return;
    }
    let withMedia = input.closest(".diary-page-editor") ? (this.readDiaryDraftFromOverlay(entry.id) ?? entry) : entry;
    let mediaId = "";
    for (const [index, file] of validFiles.entries()) {
      const isVideo = file.type.startsWith("video/") || /\.(mp4|webm|mov)$/i.test(file.name);
      const isImage = file.type.startsWith("image/");
      const imageData = isImage ? await this.readDiaryImageData(file) : null;
      const src = imageData?.src ?? (await this.readFileAsDataUrl(file));
      mediaId = `${isVideo ? "video" : "photo"}-${Date.now()}-${index}`;
      withMedia = addJournalMedia(withMedia, {
        id: mediaId,
        type: isVideo ? "video" : "image",
        storageKey: `diary-media/${entry.id}/${mediaId}`,
        src,
        caption: "",
        mimeType: isVideo ? file.type || "video/mp4" : file.type || "image/jpeg",
        width: imageData?.width,
        height: imageData?.height
      });
    }
    this.selectedJournalMediaId = mediaId;
    this.clearDiaryAutosaveTimer();
    this.updateDiaryEntry(withMedia);
    this.showDiaryEditor(withMedia.id);
    this.showToast(validFiles.length === 1 ? "Media inserted" : `${validFiles.length} media inserted`);
  }

  private async handleMonthCoverInput(input: HTMLInputElement): Promise<void> {
    this.clearDiaryAutosaveTimer();
    const file = input.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;
    const src = await this.readFileAsDataUrl(file);
    const monthKey = this.currentBooksMonth().key;
    const current = this.monthlyCovers?.[monthKey] ?? defaultMonthlyCover(monthKey);
    this.applyDiaryLibrary(upsertMonthlyCover(this.makeDiaryLibrary(), monthKey, {
      src,
      caption: undefined,
      crop: current.crop ?? "center",
      updatedAt: new Date().toISOString()
    }));
    this.save.saveDiaryLibrary(this.makeDiaryLibrary());
    this.openMonthlyBook(monthKey);
    input.value = "";
    this.showToast("Monthly cover changed");
  }

  private setMonthlyCoverCrop(crop: JournalBookCoverCrop): void {
    this.clearDiaryAutosaveTimer();
    const monthKey = this.currentBooksMonth().key;
    const current = this.monthlyCovers?.[monthKey] ?? defaultMonthlyCover(monthKey);
    const nextCrop: JournalBookCoverCrop = crop === "top" || crop === "bottom" || crop === "contain" ? crop : "center";
    this.applyDiaryLibrary(upsertMonthlyCover(this.makeDiaryLibrary(), monthKey, {
      ...current,
      crop: nextCrop,
      updatedAt: current.updatedAt === "default" ? new Date().toISOString() : current.updatedAt
    }));
    this.save.saveDiaryLibrary(this.makeDiaryLibrary());
    this.openMonthlyBook(monthKey);
    this.showToast("Cover crop updated");
  }

  private async handleDiaryImportFile(input: HTMLInputElement): Promise<void> {
    const file = input.files?.[0];
    const importInput = this.overlay.querySelector<HTMLTextAreaElement>("#diary-import");
    if (!file || !importInput) return;
    importInput.value = await this.readFileAsText(file);
    this.showToast(`${file.name} loaded`);
  }

  private readFileAsDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.addEventListener("load", () => resolve(String(reader.result ?? "")));
      reader.addEventListener("error", () => reject(reader.error));
      reader.readAsDataURL(file);
    });
  }

  private async readDiaryImageAsDataUrl(file: File): Promise<string> {
    return (await this.readDiaryImageData(file)).src;
  }

  private async readDiaryImageData(file: File): Promise<{ src: string; width?: number; height?: number }> {
    const original = await this.readFileAsDataUrl(file);
    if (!file.type.startsWith("image/")) return { src: original };
    try {
      const image = await new Promise<HTMLImageElement>((resolve, reject) => {
        const img = new Image();
        img.addEventListener("load", () => resolve(img));
        img.addEventListener("error", () => reject(new Error("Image preview failed")));
        img.src = original;
      });
      const maxSide = 900;
      const ratio = Math.min(1, maxSide / Math.max(image.naturalWidth, image.naturalHeight));
      if (ratio >= 1) return { src: original, width: image.naturalWidth, height: image.naturalHeight };
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(image.naturalWidth * ratio));
      canvas.height = Math.max(1, Math.round(image.naturalHeight * ratio));
      const ctx = canvas.getContext("2d");
      if (!ctx) return { src: original, width: image.naturalWidth, height: image.naturalHeight };
      ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
      return { src: canvas.toDataURL("image/jpeg", 0.84), width: canvas.width, height: canvas.height };
    } catch {
      return { src: original };
    }
  }

  private readFileAsText(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.addEventListener("load", () => resolve(String(reader.result ?? "")));
      reader.addEventListener("error", () => reject(reader.error));
      reader.readAsText(file);
    });
  }

  private async handlePersonalAudioInput(input: HTMLInputElement): Promise<void> {
    const file = input.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("audio/") && !/\.(mp3|wav|ogg|m4a|aac)$/i.test(file.name)) {
      this.showToast("This browser may not support that audio format.");
      return;
    }
    const id = `user-${Date.now()}`;
    const audioBlobKey = `music/audio/${id}`;
    await this.musicBlobStore.putBlob(audioBlobKey, file);
    const base = file.name.replace(/\.[^.]+$/, "");
    const [title = base, ...artistParts] = base.split("-").map((part) => part.trim()).filter(Boolean);
    const track: UserMusicTrack = {
      id,
      title: title || "Untitled Song",
      artist: artistParts.join(" / ") || "My Music",
      audioBlobKey,
      addedAt: Date.now()
    };
    this.musicLibrary = { ...this.musicLibrary, tracks: [track, ...this.musicLibrary.tracks] };
    this.personalPlayer.selectedTrackId = id;
    this.personalPlayer.playing = true;
    this.personalPlayer.playbackPosition = 0;
    this.save.saveMusicLibrary(this.musicLibrary);
    await this.playPersonalMusic(id, 0);
    await this.showRecords();
    this.showToast("Song added");
    this.autosave();
  }

  private async handlePersonalCoverInput(input: HTMLInputElement): Promise<void> {
    const file = input.files?.[0];
    const trackId = this.personalPlayer.selectedTrackId ?? this.currentPersonalTrack()?.id;
    if (!file || !trackId || !file.type.startsWith("image/")) return;
    const current = this.allPersonalTracks().find((track) => track.id === trackId);
    const key = `music/cover/${trackId}-${Date.now()}`;
    await this.musicBlobStore.putBlob(key, file);
    if (current?.source === "built-in") {
      this.room = withCustomVinylCover(this.room, trackId, key);
    } else {
      this.musicLibrary = {
        ...this.musicLibrary,
        tracks: this.musicLibrary.tracks.map((track) => track.id === trackId ? { ...track, coverBlobKey: key } : track)
      };
      this.save.saveMusicLibrary(this.musicLibrary);
    }
    this.autosave();
    await this.showRecords();
    this.showToast("Cover changed");
  }

  private async handlePersonalLyricsInput(input: HTMLInputElement): Promise<void> {
    const file = input.files?.[0];
    const trackId = this.personalPlayer.selectedTrackId;
    if (!file || !trackId) {
      this.showToast("Choose a song first.");
      return;
    }
    const text = await this.readFileAsText(file);
    const parsedLyrics = parseLrc(text);
    const plainLines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
    const syncedLyrics = parsedLyrics.length
      ? parsedLyrics
      : plainLines.map((line, index) => ({ time: index * 4, text: line }));
    if (!syncedLyrics.length) {
      this.showToast("No lyric lines were found.");
      return;
    }
    const current = this.allPersonalTracks().find((track) => track.id === trackId);
    if (current?.source === "built-in") {
      this.personalPlayer.customTrackLyrics = {
        ...(this.personalPlayer.customTrackLyrics ?? {}),
        [trackId]: { syncedLyrics, plainLyrics: text }
      };
    } else {
      this.musicLibrary = {
        ...this.musicLibrary,
        tracks: this.musicLibrary.tracks.map((track) => track.id === trackId ? { ...track, syncedLyrics, plainLyrics: text } : track)
      };
      this.save.saveMusicLibrary(this.musicLibrary);
    }
    this.invalidateBundledLyricsForTrack(trackId);
    await this.showRecords();
    this.showToast("Lyrics added");
    this.autosave();
  }

  private async handlePlayerBackgroundInput(input: HTMLInputElement): Promise<void> {
    const file = input.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;
    const key = `music/background/${Date.now()}`;
    await this.musicBlobStore.putBlob(key, file);
    this.personalPlayer.playerBackgroundBlobKey = key;
    await this.showRecords();
    this.showToast("Player background changed");
    this.autosave();
  }

  private async removePlayerBackground(): Promise<void> {
    const key = this.personalPlayer.playerBackgroundBlobKey;
    if (key) await this.musicBlobStore.deleteBlob(key);
    this.personalPlayer.playerBackgroundBlobKey = undefined;
    await this.showRecords();
    this.autosave();
  }

  private updateCurrentUserTrackMetadata(): void {
    const trackId = this.personalPlayer.selectedTrackId;
    if (!trackId) return;
    const title = Array.from(this.overlay.querySelectorAll<HTMLInputElement>('[data-music-field="title"]')).find((input) => input.matches(":focus") || input.offsetParent !== null)?.value.trim() || "Untitled Song";
    const artist = Array.from(this.overlay.querySelectorAll<HTMLInputElement>('[data-music-field="artist"]')).find((input) => input.matches(":focus") || input.offsetParent !== null)?.value.trim() || "My Music";
    if (this.currentPersonalTrack()?.source === "user") {
      this.musicLibrary = {
        ...this.musicLibrary,
        tracks: this.musicLibrary.tracks.map((track) => track.id === trackId ? { ...track, title, artist } : track)
      };
      this.save.saveMusicLibrary(this.musicLibrary);
    } else {
      this.personalPlayer.customTrackMeta = {
        ...(this.personalPlayer.customTrackMeta ?? {}),
        [trackId]: { title, artist }
      };
    }
    this.invalidateBundledLyricsForTrack(trackId);
    void this.loadBundledLyricsForSelectedTrack();
    this.autosave();
  }

  private requestDeleteUserTrack(trackId: string): void {
    const track = this.musicLibrary.tracks.find((item) => item.id === trackId);
    if (!track) return;
    this.pendingDeleteTrackId = track.id;
    this.activeRecordMenuTrackId = "";
    this.recordsMoreMenuOpen = false;
    void this.showRecords();
  }

  private async confirmDeleteUserTrack(): Promise<void> {
    const trackId = this.pendingDeleteTrackId;
    const fallbackIds = this.availableVinylRecords.map((record) => record.id);
    const result = removeUserMusicTrack(this.musicLibrary, trackId, fallbackIds);
    if (!result.removed) return;
    for (const key of result.blobKeysToDelete) await this.musicBlobStore.deleteBlob(key);
    this.musicLibrary = result.library;
    this.save.saveMusicLibrary(this.musicLibrary);
    if (this.personalPlayer.selectedTrackId === trackId) {
      this.audio.pause();
      this.personalPlayer.playbackPosition = 0;
      this.personalPlayer.playing = false;
      this.personalPlayer.selectedTrackId = result.nextTrackId;
      this.room.vinylPlaying = false;
      if (result.nextTrackId) this.room.selectedVinylId = result.nextTrackId;
    }
    this.pendingDeleteTrackId = "";
    this.activeRecordMenuTrackId = "";
    await this.showRecords();
    this.showToast("Record removed from this app");
    this.autosave();
  }

  private addPhotoToScrapbook(photoId: string): void {
    const entry = this.activeScrapbookEntry();
    if (!entry || !photoId) return;
    const elementId = `element-${Date.now()}`;
    this.selectedScrapbookElementId = elementId;
    this.updateDiaryEntry(addPhotoElement(entry, photoId, elementId));
    this.showDiaryEditor(entry.id);
  }

  private cutoutPhotoOnPage(photoId: string): void {
    const entry = this.activeScrapbookEntry();
    if (!entry || !photoId) return;
    const elementId = `cutout-${Date.now()}`;
    this.selectedScrapbookElementId = elementId;
    this.updateDiaryEntry(createCutoutElement(entry, photoId, elementId, "circle"));
    this.showDiaryEditor(entry.id);
  }

  private removePhotoFromPage(photoId: string): void {
    const entry = this.activeScrapbookEntry();
    if (!entry || !photoId) return;
    this.selectedScrapbookElementId = "";
    this.updateDiaryEntry(removePhotoAttachment(entry, photoId));
    this.showDiaryEditor(entry.id);
    this.showToast("Attachment cleared");
  }

  private selectScrapbookElement(elementId: string): void {
    this.selectedScrapbookElementId = elementId;
    if (this.activeScrapbookEntryId) this.showDiaryEditor(this.activeScrapbookEntryId);
  }

  private updateSelectedScrapbookElement(updater: (entry: DiaryEntry, elementId: string) => DiaryEntry): void {
    const entry = this.activeScrapbookEntry();
    if (!entry || !this.selectedScrapbookElementId) return;
    this.updateDiaryEntry(updater(entry, this.selectedScrapbookElementId));
    this.showDiaryEditor(entry.id);
  }

  private nudgeSelectedScrapbookElement(dx: number, dy: number): void {
    this.updateSelectedScrapbookElement((entry, elementId) => {
      const element = entry.scrapbookLayout?.elements.find((item) => item.id === elementId);
      return element ? moveScrapbookElement(entry, elementId, element.x + dx, element.y + dy) : entry;
    });
  }

  private scaleSelectedScrapbookElement(delta: number): void {
    this.updateSelectedScrapbookElement((entry, elementId) => {
      const element = entry.scrapbookLayout?.elements.find((item) => item.id === elementId);
      return element ? resizeScrapbookElement(entry, elementId, element.scale + delta) : entry;
    });
  }

  private rotateSelectedScrapbookElement(delta: number): void {
    this.updateSelectedScrapbookElement((entry, elementId) => {
      const element = entry.scrapbookLayout?.elements.find((item) => item.id === elementId);
      return element ? rotateScrapbookElement(entry, elementId, element.rotation + delta) : entry;
    });
  }

  private layerSelectedScrapbookElement(direction: "front" | "back"): void {
    this.updateSelectedScrapbookElement((entry, elementId) => layerScrapbookElement(entry, elementId, direction));
  }

  private deleteSelectedScrapbookElement(): void {
    this.updateSelectedScrapbookElement((entry, elementId) => deleteScrapbookElement(entry, elementId));
    this.selectedScrapbookElementId = "";
  }

  private handlePointerDown(event: PointerEvent): void {
    const cropTarget = (event.target as HTMLElement).closest<HTMLElement>("[data-action=\"journal-crop-drag\"]");
    const cropBox = cropTarget?.closest<HTMLElement>(".journal-crop-box");
    if (cropTarget && cropBox) {
      this.journalCropDrag = {
        mode: cropTarget.dataset.cropMode ?? "move",
        startX: event.clientX,
        startY: event.clientY,
        startCrop: this.cropFromBoxStyle(cropBox)
      };
      event.preventDefault();
      return;
    }
    const resizeHandle = (event.target as HTMLElement).closest<HTMLElement>(".floating-resize-handle");
    const resizingLyrics = resizeHandle?.closest<HTMLElement>(".floating-lyrics");
    if (resizeHandle && resizingLyrics) {
      const rect = resizingLyrics.getBoundingClientRect();
      this.lyricsResize = {
        startX: event.clientX,
        startY: event.clientY,
        startWidth: rect.width,
        startHeight: rect.height
      };
      event.preventDefault();
      return;
    }
    const pointerTarget = event.target as HTMLElement;
    const note = pointerTarget.closest<HTMLElement>(".wall-note");
    const wall = (event.target as HTMLElement).closest<HTMLElement>(".reflection-wall-surface");
    const noteDragHandle = pointerTarget.closest(".reflection-note-drag-handle");
    if (note && wall && noteDragHandle) {
      const wallRect = wall.getBoundingClientRect();
      const noteData = this.reflectionWall.notes.find((item) => item.id === note.dataset.note);
      if (noteData) {
        this.reflectionWallDrag = {
          noteId: noteData.id,
          offsetX: ((event.clientX - wallRect.left) / wallRect.width) * 100 - noteData.x,
          offsetY: ((event.clientY - wallRect.top) / wallRect.height) * 100 - noteData.y
        };
        note.dataset.dragging = "true";
        event.preventDefault();
      }
      return;
    }
    const lyrics = (event.target as HTMLElement).closest<HTMLElement>(".floating-lyrics");
    if (lyrics && (event.target as HTMLElement).closest(".floating-drag-handle") && !(event.target as HTMLElement).closest(".floating-controls-bar,button,input,select,textarea")) {
      const rect = lyrics.getBoundingClientRect();
      this.lyricsDrag = { offsetX: event.clientX - rect.left, offsetY: event.clientY - rect.top };
      event.preventDefault();
      return;
    }
    if ((event.target as HTMLElement).closest(".element-controls")) return;
    const target = (event.target as HTMLElement).closest<HTMLElement>(".scrapbook-element");
    const page = (event.target as HTMLElement).closest<HTMLElement>(".scrapbook-page");
    if (!target || !page || !this.activeScrapbookEntryId) return;
    const elementId = target.dataset.element ?? "";
    const rect = page.getBoundingClientRect();
    const element = this.activeScrapbookEntry()?.scrapbookLayout?.elements.find((item) => item.id === elementId);
    if (!element) return;
    this.selectedScrapbookElementId = elementId;
    this.scrapbookDrag = {
      elementId,
      entryId: this.activeScrapbookEntryId,
      offsetX: ((event.clientX - rect.left) / rect.width) * 100 - element.x,
      offsetY: ((event.clientY - rect.top) / rect.height) * 100 - element.y
    };
  }

  private handlePointerMove(event: PointerEvent): void {
    if (this.journalCropDrag) {
      const stage = this.overlay.querySelector<HTMLElement>(".journal-crop-image-frame");
      const box = this.overlay.querySelector<HTMLElement>(".journal-crop-box");
      if (!stage || !box) return;
      const rect = stage.getBoundingClientRect();
      const dx = ((event.clientX - this.journalCropDrag.startX) / Math.max(1, rect.width)) * 100;
      const dy = ((event.clientY - this.journalCropDrag.startY) / Math.max(1, rect.height)) * 100;
      const next = this.resizeJournalCrop(this.journalCropDrag.startCrop, this.journalCropDrag.mode, dx, dy);
      box.setAttribute("style", this.journalMediaCropStyle(next));
      event.preventDefault();
      return;
    }
    if (this.lyricsResize) {
      const stageRect = this.stage.getBoundingClientRect();
      const scaleX = this.canvas.width / stageRect.width;
      const scaleY = this.canvas.height / stageRect.height;
      const startWidth = this.lyricsResize.startWidth * scaleX;
      const startHeight = this.lyricsResize.startHeight * scaleY;
      const deltaX = (event.clientX - this.lyricsResize.startX) * scaleX;
      const deltaY = (event.clientY - this.lyricsResize.startY) * scaleY;
      const delta = (deltaX + deltaY) / 2;
      const width = Math.max(96, Math.min(520, startWidth + delta));
      const ratio = width / Math.max(1, startWidth);
      const height = Math.max(44, Math.min(260, startHeight * ratio));
      this.personalPlayer.lyricsOverlay = clampLyricsOverlay({
        ...this.personalPlayer.lyricsOverlay,
        width,
        height
      }, this.canvas.width, this.canvas.height);
      this.save.savePersonalPlayer(this.personalPlayer);
      this.updatePersonalMusicOverlay();
      event.preventDefault();
      return;
    }
    if (this.reflectionWallDrag) {
      const wall = this.overlay.querySelector<HTMLElement>(".reflection-wall-surface");
      if (!wall) return;
      const rect = wall.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width) * 100 - this.reflectionWallDrag.offsetX;
      const y = ((event.clientY - rect.top) / rect.height) * 100 - this.reflectionWallDrag.offsetY;
      const position = clampReflectionNotePosition({ x, y }, this.reflectionWallNoteDimensions());
      this.reflectionWall = moveReflectionNote(this.reflectionWall, this.reflectionWallDrag.noteId, position);
      this.save.saveReflectionWall(this.reflectionWall);
      const note = this.overlay.querySelector<HTMLElement>(`.wall-note[data-note="${CSS.escape(this.reflectionWallDrag.noteId)}"]`);
      const next = this.reflectionWall.notes.find((item) => item.id === this.reflectionWallDrag?.noteId);
      if (note && next) {
        const nextPosition = clampReflectionNotePosition(next, this.reflectionWallNoteDimensions());
        note.style.left = `${nextPosition.x}%`;
        note.style.top = `${nextPosition.y}%`;
        note.dataset.dragging = "true";
      }
      event.preventDefault();
      return;
    }
    if (this.lyricsDrag) {
      const stageRect = this.stage.getBoundingClientRect();
      const scaleX = this.canvas.width / stageRect.width;
      const scaleY = this.canvas.height / stageRect.height;
      this.personalPlayer.lyricsOverlay = clampLyricsOverlay({
        ...this.personalPlayer.lyricsOverlay,
        x: (event.clientX - stageRect.left - this.lyricsDrag.offsetX) * scaleX,
        y: (event.clientY - stageRect.top - this.lyricsDrag.offsetY) * scaleY
      }, this.canvas.width, this.canvas.height);
      this.updatePersonalMusicOverlay();
      event.preventDefault();
      return;
    }
    if (!this.scrapbookDrag) return;
    const page = this.overlay.querySelector<HTMLElement>(".scrapbook-page");
    const entry = this.activeScrapbookEntry();
    if (!page || !entry) return;
    const rect = page.getBoundingClientRect();
    const x = Math.max(0, Math.min(100, ((event.clientX - rect.left) / rect.width) * 100 - this.scrapbookDrag.offsetX));
    const y = Math.max(0, Math.min(100, ((event.clientY - rect.top) / rect.height) * 100 - this.scrapbookDrag.offsetY));
    this.updateDiaryEntry(moveScrapbookElement(entry, this.scrapbookDrag.elementId, x, y));
    const elementButton = this.overlay.querySelector<HTMLElement>(`.scrapbook-element[data-element="${CSS.escape(this.scrapbookDrag.elementId)}"]`);
    if (elementButton) {
      const element = this.activeScrapbookEntry()?.scrapbookLayout?.elements.find((item) => item.id === this.scrapbookDrag?.elementId);
      if (element) elementButton.style.left = `${element.x}%`;
      if (element) elementButton.style.top = `${element.y}%`;
    }
  }

  private showMujiRoom(): void {
    this.enterMujiRoom();
  }

  private enterMujiRoom(): void {
    const alreadyInRoom = this.scene === "muji-room";
    const keepPersonalMusic = personalMusicShouldPlayInScene(this.scene) && this.personalPlayer.playing && Boolean(this.personalPlayer.selectedTrackId);
    this.syncPersonalPlaybackState();
    this.scene = "muji-room";
    const layout = this.currentSceneLayout("muji-room");
    this.player = layout.orientation === "landscape"
      ? (alreadyInRoom ? this.player : { ...roomSpawn })
      : (alreadyInRoom ? this.safeLayoutPoint(this.player, layout) : { ...layout.spawn });
    this.activeDoor = null;
    this.activeObject = "";
    this.activeRoomInteraction = null;
    this.overlay.classList.remove("dialogue-open");
    this.overlay.innerHTML = "";
    this.focusStage();
    this.showToast("Returned to the room");
    if (keepPersonalMusic) this.updatePersonalMusicOverlay();
    else this.applyAudioForCurrentScene();
    this.autosave();
  }

  private roomWindow(): void {
    this.room.visits += 1;
    this.room.windowFocus = !this.room.windowFocus;
    this.room.reflections.push("Outside the window, the forest stays where it is.");
    this.showToast(this.room.windowFocus ? "Rain closer" : "Window released");
    this.overlay.innerHTML = "";
    this.autosave();
  }

  private roomLamp(): void {
    this.room = toggleRoomLamp(this.room);
    this.room.reflections.push(this.room.lampOn ? "The lamp turns on softly." : "The lamp rests.");
    this.showToast(this.room.lampOn ? "Lamp on" : "Lamp off");
    this.overlay.innerHTML = "";
    this.autosave();
  }

  private roomLetter(): void {
    this.openReflectionWall();
  }

  private saveRoomReflection(): void {
    this.saveReflectionComposer();
  }

  private openReflectionWall(): void {
    this.recordsPanelOpen = false;
    this.reflectionWall = migrateLegacyReflectionWall(this.reflectionWall, this.room);
    this.save.saveReflectionWall(this.reflectionWall);
    const notes = visibleReflectionNotes(this.reflectionWall, {
      view: this.reflectionWallView,
      sort: this.reflectionWallSort,
      filter: this.reflectionWallFilter,
      search: this.reflectionWallSearch
    });
    const matchingIds = new Set(notes.map((note) => note.id));
    const toolbar = this.renderReflectionToolbar(notes.length);
    const body = this.reflectionWallView === "wall"
      ? this.renderReflectionWallSurface(matchingIds)
      : this.reflectionWallView === "stack"
        ? this.renderReflectionStack(notes)
        : this.renderReflectionList(notes);
    this.overlay.innerHTML = `<div class="modal reflection-wall-modal">${toolbar}${body}</div>`;
    this.focusStage();
  }

  private renderReflectionToolbar(count: number): string {
    const filters: Array<[ReflectionWallFilter, string]> = [["all", "All Time"], ["today", "Today"], ["week", "This Week"], ["month", "This Month"], ["manual", "My Notes"], ["chapter", "Chapter Notes"], ["pinned", "Pinned"], ["favorites", "Favorites"]];
    const views: Array<[ReflectionWallView, string]> = [["wall", "Wall"], ["stack", "Stack"], ["list", "List"]];
    const sorts: Array<[ReflectionWallSort, string]> = [["manual", "Manual Wall Order"], ["newest", "Newest First"], ["oldest", "Oldest First"]];
    return `<div class="reflection-wall-toolbar">
      <div><h2>Reflection Wall</h2><p>${count} note${count === 1 ? "" : "s"}</p></div>
      <label>Search<input id="reflection-search" type="search" value="${this.escapeHtml(this.reflectionWallSearch)}"></label>
      <details class="reflection-wall-filter-menu"><summary>Filter</summary>
        <div class="reflection-chip-row">${filters.map(([filter, label]) => `<button class="${this.reflectionWallFilter === filter ? "selected" : ""}" data-action="reflection-wall-filter" data-filter="${filter}">${label}</button>`).join("")}</div>
        <div class="reflection-chip-row">${views.map(([view, label]) => `<button class="${this.reflectionWallView === view ? "selected" : ""}" data-action="reflection-wall-view" data-view="${view}">${label}</button>`).join("")}</div>
        <div class="reflection-chip-row">${sorts.map(([sort, label]) => `<button class="${this.reflectionWallSort === sort ? "selected" : ""}" data-action="reflection-wall-sort" data-sort="${sort}">${label}</button>`).join("")}</div>
      </details>
      <button data-action="reflection-note-new">Leave a note</button>
      <button class="reflection-wall-close-button" data-action="close" aria-label="Close Reflection Wall">×</button>
    </div>`;
  }

  private renderReflectionWallSurface(matchingIds: Set<string>): string {
    const notes = this.reflectionWall.notes.map((note) => this.renderWallNote(note, matchingIds.has(note.id))).join("");
    return `<section class="reflection-wall-surface" aria-label="Reflection Wall">${notes || `<div class="reflection-wall-empty"><p>The wall is quiet.</p><button data-action="reflection-note-new">Leave a note</button></div>`}</section>`;
  }

  private refreshReflectionWallOnly(): void {
    const notes = visibleReflectionNotes(this.reflectionWall, {
      view: this.reflectionWallView,
      sort: this.reflectionWallSort,
      filter: this.reflectionWallFilter,
      search: this.reflectionWallSearch
    });
    const count = this.overlay.querySelector<HTMLElement>(".reflection-wall-toolbar p");
    if (count) count.textContent = `${notes.length} note${notes.length === 1 ? "" : "s"}`;
    const matchingIds = new Set(notes.map((note) => note.id));
    const nextBody = this.reflectionWallView === "wall"
      ? this.renderReflectionWallSurface(matchingIds)
      : this.reflectionWallView === "stack"
        ? this.renderReflectionStack(notes)
        : this.renderReflectionList(notes);
    const currentBody = this.overlay.querySelector<HTMLElement>(".reflection-wall-surface, .reflection-stack, .reflection-list");
    if (!currentBody) return this.openReflectionWall();
    const wrapper = document.createElement("div");
    wrapper.innerHTML = nextBody;
    const replacement = wrapper.firstElementChild;
    if (replacement) currentBody.replaceWith(replacement);
  }

  private selectReflectionWallNote(noteId: string): void {
    this.selectedReflectionNoteId = this.selectedReflectionNoteId === noteId ? "" : noteId;
    this.refreshReflectionWallOnly();
  }

  private renderWallNote(note: ReflectionNote, visible: boolean): string {
    const faded = this.reflectionWallSearch.trim() || this.reflectionWallFilter !== "all" ? (visible ? "" : " faded") : "";
    const selected = this.selectedReflectionNoteId === note.id;
    const position = clampReflectionNotePosition(note, this.reflectionWallNoteDimensions());
    return `<article class="wall-note paper-${this.escapeHtml(note.styleId)}${faded} ${selected ? "selected" : ""}" data-note="${this.escapeHtml(note.id)}" style="left:${position.x}%;top:${position.y}%;transform:translate(-50%,-50%) rotate(${note.rotation}deg);">
      <button class="wall-note-body" data-action="reflection-note-select" data-note="${this.escapeHtml(note.id)}">
        <span>${this.escapeHtml(note.text)}</span>
        <small>${this.escapeHtml(this.formatReflectionTimestamp(note.createdAt))}${note.updatedAt ? `<br>edited ${this.escapeHtml(this.formatReflectionTimestamp(note.updatedAt))}` : ""}</small>
      </button>
      <div class="reflection-note-tools" aria-label="Note tools">
        <button class="reflection-note-drag-handle" data-action="reflection-note-drag" data-note="${this.escapeHtml(note.id)}" aria-label="Drag note">↕</button>
        <button data-action="reflection-note-edit" data-note="${this.escapeHtml(note.id)}" aria-label="Edit note">🖊</button>
        <button data-action="reflection-note-delete" data-note="${this.escapeHtml(note.id)}" aria-label="Remove note">×</button>
      </div>
    </article>`;
  }

  private reflectionWallNoteDimensions(): { widthPercent: number; heightPercent: number; edgePercent: number } {
    return window.matchMedia("(max-width: 700px)").matches
      ? { widthPercent: 52, heightPercent: 34, edgePercent: 6 }
      : { widthPercent: 28, heightPercent: 24, edgePercent: 4 };
  }

  private renderReflectionStack(notes: ReflectionNote[]): string {
    const groups = new Map<string, ReflectionNote[]>();
    for (const note of notes) {
      const key = note.createdAt.slice(0, 7);
      groups.set(key, [...(groups.get(key) ?? []), note]);
    }
    const sections = [...groups.entries()].map(([key, group]) => `<section class="reflection-stack-month"><h3>${this.escapeHtml(key)}</h3><div>${group.map((note) => this.renderStackCard(note)).join("")}</div></section>`).join("");
    return `<div class="reflection-stack">${sections || `<p>The wall is quiet.</p>`}</div>`;
  }

  private renderStackCard(note: ReflectionNote): string {
    return `<button class="reflection-stack-card paper-${this.escapeHtml(note.styleId)}" data-action="reflection-note-open" data-note="${this.escapeHtml(note.id)}"><span>${this.escapeHtml(note.text)}</span><small>${this.escapeHtml(this.formatReflectionTimestamp(note.createdAt))}</small></button>`;
  }

  private renderReflectionList(notes: ReflectionNote[]): string {
    const rows = notes.map((note) => `<button class="reflection-list-row" data-action="reflection-note-open" data-note="${this.escapeHtml(note.id)}"><strong>${this.escapeHtml(this.formatReflectionTimestamp(note.createdAt))}</strong><span>${this.escapeHtml(note.text)}</span></button>`).join("");
    return `<div class="reflection-list">${rows || `<p>The wall is quiet.</p>`}</div>`;
  }

  private showReflectionComposer(noteId = ""): void {
    const note = this.reflectionWall.notes.find((item) => item.id === noteId);
    const styleOptions = reflectionPaperStyles.map((style) => `<option value="${style.id}" ${note?.styleId === style.id ? "selected" : ""}>${style.label}</option>`).join("");
    this.overlay.innerHTML = `<div class="modal reflection-compose">
      <h2>${note ? "Edit note" : "Leave a note"}</h2>
      <label>Thought<textarea id="reflection-note-text" rows="7" maxlength="500">${this.escapeHtml(note?.text ?? "")}</textarea></label>
      <label>Paper<select id="reflection-note-style"><option value="paper-mix">Paper Mix / Random</option>${styleOptions}</select></label>
      <button data-action="reflection-note-save" data-note="${this.escapeHtml(noteId)}">Keep note</button>
      <button data-action="reflection-wall">Back to Wall</button>
    </div>`;
    this.focusStage();
  }

  private saveReflectionComposer(noteId = ""): void {
    const text = this.overlay.querySelector<HTMLTextAreaElement>("#reflection-note-text")?.value.trim() ?? this.overlay.querySelector<HTMLTextAreaElement>("#room-reflection-note")?.value.trim() ?? "";
    const styleId = this.overlay.querySelector<HTMLSelectElement>("#reflection-note-style")?.value ?? this.reflectionWall.defaultStyleId;
    if (!text) {
      this.showToast("The note can stay blank until words arrive.");
      return;
    }
    if (noteId) {
      this.reflectionWall = updateReflectionNote(this.reflectionWall, noteId, text);
      this.reflectionWall = changeReflectionPaper(this.reflectionWall, noteId, styleId);
    } else {
      this.reflectionWall = createReflectionNote(this.reflectionWall, text, { styleId });
    }
    this.save.saveReflectionWall(this.reflectionWall);
    this.openReflectionWall();
    this.showToast("Note kept on the wall");
  }

  private showReflectionDetail(noteId: string): void {
    const note = this.reflectionWall.notes.find((item) => item.id === noteId);
    if (!note) return;
    const papers = reflectionPaperStyles.map((style) => `<button data-action="reflection-note-paper" data-note="${this.escapeHtml(note.id)}" data-style="${style.id}">${style.label}</button>`).join("");
    this.overlay.innerHTML = `<div class="modal reflection-detail paper-${this.escapeHtml(note.styleId)}">
      <h2>${this.escapeHtml(note.source === "chapter" ? "Chapter note" : "Reflection note")}</h2>
      <p>${this.escapeHtml(note.text).replace(/\n/g, "<br>")}</p>
      <small>${this.escapeHtml(this.formatReflectionTimestamp(note.createdAt))}${note.updatedAt ? `<br>edited ${this.escapeHtml(this.formatReflectionTimestamp(note.updatedAt))}` : ""}</small>
      <div class="settings-row">
        <button data-action="reflection-note-edit" data-note="${this.escapeHtml(note.id)}">Edit</button>
        <button data-action="reflection-note-pin" data-note="${this.escapeHtml(note.id)}">${note.pinned ? "Unpin" : "Pin"}</button>
        <button data-action="reflection-note-favorite" data-note="${this.escapeHtml(note.id)}">${note.favorite ? "Unfavorite" : "Favorite"}</button>
        <button data-action="reflection-note-delete" data-note="${this.escapeHtml(note.id)}">Delete</button>
      </div>
      <div class="reflection-paper-grid">${papers}</div>
      <button data-action="reflection-wall">Back to Wall</button>
    </div>`;
    this.focusStage();
  }

  private deleteReflectionWallNote(noteId: string): void {
    if (!noteId || !confirm("Remove this reflection note?")) return;
    this.reflectionWall = deleteReflectionNote(this.reflectionWall, noteId);
    this.save.saveReflectionWall(this.reflectionWall);
    this.openReflectionWall();
  }

  private toggleReflectionFlag(noteId: string, flag: "pinned" | "favorite"): void {
    this.reflectionWall = toggleReflectionNoteFlag(this.reflectionWall, noteId, flag);
    this.save.saveReflectionWall(this.reflectionWall);
    this.showReflectionDetail(noteId);
  }

  private changeReflectionNotePaper(noteId: string, styleId: string): void {
    this.reflectionWall = changeReflectionPaper(this.reflectionWall, noteId, styleId);
    this.save.saveReflectionWall(this.reflectionWall);
    this.showReflectionDetail(noteId);
  }

  private keepChapterReflection(chapterId: string, text: string): void {
    const noteText = text.trim();
    if (!chapterId || !noteText) return;
    this.reflectionWall = createChapterReflectionNote(this.reflectionWall, noteText, chapterId);
    this.save.saveReflectionWall(this.reflectionWall);
    this.showToast("Kept on the Reflection Wall");
  }

  private setReflectionWallView(view: ReflectionWallView): void {
    if (view === "wall" || view === "stack" || view === "list") this.reflectionWallView = view;
    this.openReflectionWall();
  }

  private setReflectionWallSort(sort: ReflectionWallSort): void {
    if (sort === "manual" || sort === "newest" || sort === "oldest") this.reflectionWallSort = sort;
    this.openReflectionWall();
  }

  private setReflectionWallFilter(filter: ReflectionWallFilter): void {
    if (filter === "all" || filter === "today" || filter === "week" || filter === "month" || filter === "manual" || filter === "chapter" || filter === "pinned" || filter === "favorites") this.reflectionWallFilter = filter;
    this.openReflectionWall();
  }

  private formatReflectionTimestamp(value: string): string {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    const parts = new Intl.DateTimeFormat(undefined, {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false
    }).formatToParts(date).reduce<Record<string, string>>((all, part) => ({ ...all, [part.type]: part.value }), {});
    return `${parts.year}.${parts.month}.${parts.day} · ${parts.hour}:${parts.minute}`;
  }

  private roomDiary(): void {
    this.openNewDiaryPage();
  }

  private inspectRoomResidue(): void {
    const line = this.room.residueIds?.length ? "那块面包还是那么小。" : "The desk is still mostly empty.";
    this.overlay.innerHTML = `<div class="modal"><h2>Residue</h2><p>${this.escapeHtml(line)}</p><button data-action="close">Close</button></div>`;
    this.focusStage();
  }

  private preserveRecordsScroll(): void {
    const panel = this.overlay.querySelector<HTMLElement>(".records-panel");
    const sheet = this.overlay.querySelector<HTMLElement>(".records-song-sheet");
    this.recordsScrollTop = panel?.scrollTop ?? this.recordsScrollTop;
    this.recordsSheetScrollTop = sheet?.scrollTop ?? this.recordsSheetScrollTop;
  }

  private restoreRecordsScroll(renderToken = this.recordsRenderToken): void {
    const scrollTop = this.recordsScrollTop;
    requestAnimationFrame(() => {
      if (renderToken !== this.recordsRenderToken) return;
      const panel = this.overlay.querySelector<HTMLElement>(".records-panel");
      if (panel) panel.scrollTop = scrollTop;
      const sheet = this.overlay.querySelector<HTMLElement>(".records-song-sheet");
      if (sheet) sheet.scrollTop = this.recordsSheetScrollTop;
    });
  }

  private closeRecords(): void {
    this.recordsRenderToken += 1;
    this.overlay.innerHTML = "";
    this.recordsPanelOpen = false;
    this.recordsSongSheetOpen = false;
    this.recordsMoreMenuOpen = false;
    this.activeRecordMenuTrackId = "";
    this.pendingDeleteTrackId = "";
    this.selectedRecordIds.clear();
    this.pendingBatchDelete = false;
    this.recordsScrollTop = 0;
    this.recordsSheetScrollTop = 0;
    this.updatePersonalMusicOverlay();
  }

  private async showRecords(): Promise<void> {
    this.recordsPanelOpen = true;
    this.preserveRecordsScroll();
    const renderToken = ++this.recordsRenderToken;
    const current = this.currentPersonalTrack();
    const cover = current ? await this.coverUrlForTrack(current.id) : "";
    const background = this.personalPlayer.playerBackgroundBlobKey ? await this.safeObjectUrl(this.personalPlayer.playerBackgroundBlobKey) : "";
    const duration = this.audio.getDuration();
    const currentTime = this.audio.getCurrentTime() || this.personalPlayer.playbackPosition;
    const lyrics = current?.syncedLyrics ?? [];
    const activeLyric = activeLyricIndexAt(lyrics, currentTime);
    const lyricRows = lyrics.length
      ? lyrics.map((line, index) => `<p data-lyric-index="${index}" class="${index === activeLyric ? "active" : Math.abs(index - activeLyric) <= 2 ? "near" : ""}">${this.escapeHtml(line.text)}</p>`).join("")
      : `<p class="empty-lyrics">Add .lrc lyrics to let words drift with the room.</p>`;
    const mobileLyricRows = lyrics.length
      ? lyricWindowForTime(lyrics, currentTime).map((item) => `<p data-lyric-index="${item.sourceIndex}" class="${item.state}">${this.escapeHtml(item.line?.text ?? "")}</p>`).join("")
      : `<p class="empty-lyrics">Add lyrics from the More menu.</p>`;
    const libraryRows = this.renderRecordsLibraryRows(current?.id);
    const batchToolbar = this.renderRecordsBatchToolbar();
    const desktopBatchToolbar = this.renderRecordsBatchToolbar();
    const visualStyle = cover ? `--cover:url('${this.escapeHtml(cover)}')` : "";
    const bgStyle = background ? `style="--player-bg:url('${this.escapeHtml(background)}')"` : "";
    const coverInitials = cover ? "" : `<span>${this.escapeHtml(this.trackInitials(current?.title ?? "Music"))}</span>`;
    const isCoverMode = this.personalPlayer.visualMode === "cover";
    const artworkHtml = isCoverMode
      ? `<div class="cover-visual ${cover ? "has-cover" : ""}" style="${visualStyle}">${coverInitials}</div>`
      : `<div class="record-disc personal ${cover ? "has-cover" : ""} ${this.personalPlayer.playing && !this.settings.reducedMotion ? "playing" : ""}" style="${visualStyle}"><span></span></div><div class="tone-arm personal"></div>`;
    const maxTime = Math.max(1, duration || current?.duration || 1);
    const lyricWidth = Math.round(this.personalPlayer.lyricsOverlay.width ?? 280);
    const searchSortControls = `
      <input data-music-search id="music-search" type="search" placeholder="Search songs..." value="${this.escapeHtml(this.personalPlayer.librarySearch)}" aria-label="Search songs">
      <label>Sort<select id="music-sort" aria-label="Sort music"><option value="recently-added" ${this.personalPlayer.librarySort === "recently-added" ? "selected" : ""}>Recently Added</option><option value="recently-played" ${this.personalPlayer.librarySort === "recently-played" ? "selected" : ""}>Recently Played</option><option value="title" ${this.personalPlayer.librarySort === "title" ? "selected" : ""}>Title A-Z</option><option value="artist" ${this.personalPlayer.librarySort === "artist" ? "selected" : ""}>Artist A-Z</option></select></label>`;
    const deleteTrack = this.pendingDeleteTrackId ? this.musicLibrary.tracks.find((track) => track.id === this.pendingDeleteTrackId) : undefined;
    this.overlay.innerHTML = `
      <div class="modal game-panel records-panel personal-records ${background ? "has-bg" : ""}" ${bgStyle}>
        <div class="records-scroll-content">
        <header class="records-header"><div><h2>My Records</h2><p>Personal songs for the room and forest.</p></div><div class="records-header-actions"><button class="records-mobile-more-button" data-action="toggle-records-more-menu" aria-label="More Records actions">⋮</button><button class="records-mobile-close-button" data-action="close-records" aria-label="Close Records">×</button><button data-action="close" aria-label="Close Records">Close</button></div></header>
        <section class="records-mobile-player" aria-label="Mobile Records player">
          <div class="records-mobile-title">
            <small>${current?.source === "user" ? "My Music" : "Walk Back Home"}</small>
            <h3>${this.escapeHtml(current?.title ?? "Choose a record")}</h3>
            <p>${this.escapeHtml(current?.artist ?? "No artist set")}</p>
          </div>
          <button class="records-mobile-artwork ${this.personalPlayer.visualMode}" data-action="toggle-record-artwork" aria-label="Toggle vinyl or cover artwork">
            ${artworkHtml}
          </button>
          <div class="records-mobile-lyrics" aria-live="off">${mobileLyricRows}</div>
          <div class="time-row records-mobile-progress"><span data-music-current>${this.formatTime(currentTime)}</span><input data-music-seek id="music-seek" type="range" min="0" max="${maxTime}" step="0.1" value="${Math.min(currentTime, maxTime)}" aria-label="Seek"><span data-music-duration>${this.formatTime(duration || current?.duration || 0)}</span></div>
          <div class="records-mobile-controls">
            <button class="icon-button ${this.personalPlayer.shuffleEnabled ? "selected" : ""}" data-action="music-shuffle" aria-label="Shuffle" title="Shuffle">⤨</button>
            <button class="icon-button" data-action="music-prev" aria-label="Previous" title="Previous">⏮</button>
            <button class="icon-button primary" data-action="vinyl-pause" aria-label="${this.personalPlayer.playing ? "Pause" : "Play"}" title="${this.personalPlayer.playing ? "Pause" : "Play"}">${this.personalPlayer.playing ? "⏸" : "▶"}</button>
            <button class="icon-button" data-action="music-next" aria-label="Next" title="Next">⏭</button>
            <button class="icon-button ${this.personalPlayer.repeatOne ? "selected" : ""}" data-action="music-repeat-one" aria-label="Repeat one" title="Repeat one">↻</button>
            <button class="icon-button" data-action="toggle-records-song-sheet" aria-label="Open Records song list" title="Song list">☰</button>
          </div>
        </section>
        <div class="records-mobile-more ${this.recordsMoreMenuOpen ? "open" : ""}" role="menu" aria-label="Records customization actions">
          <label class="file-control">Change Cover<input id="vinyl-cover-input" type="file" accept="image/*" aria-label="Change cover"></label>
          <label class="file-control">Change Background<input id="music-background-input" type="file" accept="image/*" aria-label="Change player background"></label>
          ${background ? `<button data-action="remove-player-background">Remove Background</button>` : ""}
          <label class="file-control">Import / Change Lyrics<input id="music-lyrics-input" type="file" accept=".lrc,text/plain" aria-label="Add lyrics"></label>
          <button data-action="toggle-floating-lyrics">${this.personalPlayer.lyricsVisible ? "Hide Floating Lyrics" : "Show Floating Lyrics"}</button>
          <label class="metadata-edit">Floating Lyrics Size<input data-floating-lyrics-width id="floating-lyrics-width" type="range" min="96" max="520" step="10" value="${lyricWidth}" aria-label="Floating lyrics width"></label>
          <label class="metadata-edit">Song Title<input data-music-title data-music-field="title" id="music-title" value="${this.escapeHtml(current?.title ?? "")}" aria-label="Edit song title"></label>
          <label class="metadata-edit">Artist<input data-music-artist data-music-field="artist" id="music-artist" value="${this.escapeHtml(current?.artist ?? "")}" aria-label="Edit artist"></label>
        </div>
        <div class="records-grid">
          <section class="record-visual ${this.personalPlayer.visualMode}">
            ${artworkHtml}
            <div class="visual-tabs"><button class="${this.personalPlayer.visualMode === "vinyl" ? "selected" : ""}" data-action="music-visual" data-mode="vinyl">Vinyl</button><button class="${this.personalPlayer.visualMode === "cover" ? "selected" : ""}" data-action="music-visual" data-mode="cover">Cover</button></div>
            <label class="file-control">Change Cover<input id="vinyl-cover-input" type="file" accept="image/*" aria-label="Change cover"></label>
            <label class="file-control">Change Background<input id="music-background-input" type="file" accept="image/*" aria-label="Change player background"></label>
            ${background ? `<button data-action="remove-player-background">Remove Background</button>` : ""}
          </section>
          <section class="records-now">
            <small>${current?.source === "user" ? "My Music" : "Walk Back Home"}</small>
            <h3>${this.escapeHtml(current?.title ?? "Choose a record")}</h3>
            <p>${this.escapeHtml(current?.artist ?? "No artist set")}</p>
            <div class="lyrics-pane" aria-live="off">${lyricRows}</div>
          </section>
          <aside class="records-library">
            ${searchSortControls}
            ${desktopBatchToolbar}
            <div class="record-list personal-list">${libraryRows || `<p>Add your own song.</p>`}</div>
            <label class="file-control add-record">+ Add My Record<input id="music-audio-input" type="file" accept="audio/mpeg,audio/mp3,audio/wav,audio/ogg,audio/mp4,audio/aac,.mp3,.wav,.ogg,.m4a,.aac" aria-label="Add my record"></label>
            ${current?.source === "user" ? `<button data-action="delete-user-track" data-track="${this.escapeHtml(current.id)}">Delete Imported Song</button>` : ""}
          </aside>
        </div>
        <footer class="records-transport">
          <label class="metadata-edit">Title<input data-music-title data-music-field="title" id="music-title" value="${this.escapeHtml(current?.title ?? "")}" aria-label="Edit song title"></label>
          <label class="metadata-edit">Artist<input data-music-artist data-music-field="artist" id="music-artist" value="${this.escapeHtml(current?.artist ?? "")}" aria-label="Edit artist"></label>
          <label class="file-control">Add Lyrics<input id="music-lyrics-input" type="file" accept=".lrc,text/plain" aria-label="Add lyrics"></label>
          <button data-action="toggle-floating-lyrics">${this.personalPlayer.lyricsVisible ? "Hide Lyrics" : "Show Lyrics"}</button>
          <div class="time-row"><span data-music-current>${this.formatTime(currentTime)}</span><input data-music-seek id="music-seek" type="range" min="0" max="${maxTime}" step="0.1" value="${Math.min(currentTime, maxTime)}" aria-label="Seek"><span data-music-duration>${this.formatTime(duration || current?.duration || 0)}</span></div>
          <div class="transport-controls"><div class="vinyl-controls"><button class="icon-button" data-action="music-prev" aria-label="Previous" title="Previous">⏮</button><button class="icon-button primary" data-action="vinyl-pause" aria-label="${this.personalPlayer.playing ? "Pause" : "Play"}" title="${this.personalPlayer.playing ? "Pause" : "Play"}">${this.personalPlayer.playing ? "⏸" : "▶"}</button><button class="icon-button" data-action="music-next" aria-label="Next" title="Next">⏭</button></div><div class="playback-modes" aria-label="Playback toggles"><button class="icon-button ${this.personalPlayer.repeatOne ? "selected" : ""}" data-action="music-repeat-one" aria-label="Repeat one" title="Repeat one">↻1</button><button class="icon-button ${this.personalPlayer.shuffleEnabled ? "selected" : ""}" data-action="music-shuffle" aria-label="Shuffle" title="Shuffle">⤨</button></div></div>
        </footer>
        <section class="records-song-sheet ${this.recordsSongSheetOpen ? "open" : ""}" aria-label="Records song list">
          <div class="sheet-handle"></div>
          <div class="records-song-sheet-head"><h3>My Records</h3><button data-action="toggle-records-song-sheet" aria-label="Close Records song list">Close</button></div>
          ${batchToolbar}
          ${this.pendingBatchDelete ? this.renderBatchDeleteConfirmation("mobile") : ""}
          <div class="records-song-tools">${searchSortControls}</div>
          <label class="file-control add-record">+ Add My Record<input id="music-audio-input" type="file" accept="audio/mpeg,audio/mp3,audio/wav,audio/ogg,audio/mp4,audio/aac,.mp3,.wav,.ogg,.m4a,.aac" aria-label="Add my record"></label>
          <div class="record-list personal-list">${libraryRows || `<p>Add your own song.</p>`}</div>
        </section>
        </div>
        ${this.pendingBatchDelete ? this.renderBatchDeleteConfirmation("desktop") : ""}
        ${deleteTrack ? `<div class="records-delete-confirmation" role="dialog" aria-modal="true" aria-label="Delete from My Records">
          <div>
            <strong>Delete from My Records?</strong>
            <p>Remove “${this.escapeHtml(deleteTrack.title)}” from Walk Back Home?</p>
            <p>This removes the copy and information stored by this app. Your original audio file on your device will not be changed.</p>
          </div>
          <div class="delete-confirmation-actions"><button data-action="cancel-delete-user-track">Cancel</button><button class="danger" data-action="confirm-delete-user-track">Delete</button></div>
        </div>` : ""}
      </div>`;
    this.focusStage();
    this.restoreRecordsScroll(renderToken);
  }

  private toggleRecordSelection(trackId: string): void {
    if (!trackId) return;
    if (this.selectedRecordIds.has(trackId)) this.selectedRecordIds.delete(trackId);
    else this.selectedRecordIds.add(trackId);
    this.preserveRecordsScroll();
    void this.showRecords();
  }

  private selectAllRecords(): void {
    this.selectedRecordIds = new Set(selectAllMusicTrackIds(this.visibleMusicTracks().map((track) => track.id)));
    this.preserveRecordsScroll();
    void this.showRecords();
  }

  private clearRecordSelection(): void {
    this.selectedRecordIds.clear();
    this.pendingBatchDelete = false;
    this.preserveRecordsScroll();
    void this.showRecords();
  }

  private requestBatchDelete(): void {
    if (!this.selectedRecordIds.size) {
      this.showToast("Select at least one record first");
      return;
    }
    this.pendingBatchDelete = true;
    this.preserveRecordsScroll();
    void this.showRecords();
  }

  private cancelBatchDelete(): void {
    this.pendingBatchDelete = false;
    this.preserveRecordsScroll();
    void this.showRecords();
  }

  private applyBatchRecordEdit(): void {
    const artist = this.overlay.querySelector<HTMLInputElement>("[data-record-batch-field='artist']")?.value.trim() ?? "";
    const album = this.overlay.querySelector<HTMLInputElement>("[data-record-batch-field='album']")?.value.trim() ?? "";
    const metadata: BatchMusicMetadata = { artist, album };
    if (!artist && !album) {
      this.showToast("Enter an Artist or Album first");
      return;
    }
    const result = applyBatchMusicMetadata(this.musicLibrary, [...this.selectedRecordIds], metadata, this.personalPlayer.customTrackMeta ?? {});
    this.musicLibrary = result.library;
    this.personalPlayer = { ...this.personalPlayer, customTrackMeta: result.builtInMeta };
    this.save.saveMusicLibrary(this.musicLibrary);
    this.save.savePersonalPlayer(this.personalPlayer);
    if (this.personalPlayer.selectedTrackId && this.selectedRecordIds.has(this.personalPlayer.selectedTrackId)) {
      this.invalidateBundledLyricsForTrack(this.personalPlayer.selectedTrackId);
      void this.loadBundledLyricsForSelectedTrack();
    }
    this.preserveRecordsScroll();
    void this.showRecords();
    this.showToast("Records updated");
  }

  private async confirmBatchDelete(): Promise<void> {
    const selectedIds = [...this.selectedRecordIds];
    const currentId = this.personalPlayer.selectedTrackId;
    const result = removeSelectedMusicTracks(this.musicLibrary, selectedIds, this.availableVinylRecords.map((record) => record.id));
    for (const key of result.blobKeysToDelete) await this.musicBlobStore.deleteBlob(key);
    this.musicLibrary = result.library;
    const currentWasRemoved = Boolean(currentId && result.removed.some((track) => track.id === currentId));
    this.pendingBatchDelete = false;
    this.selectedRecordIds.clear();
    if (currentWasRemoved) {
      const nextId = result.nextTrackId ?? this.availableVinylRecords[0]?.id;
      if (nextId) await this.selectVinyl(nextId, false);
    }
    this.save.saveMusicLibrary(this.musicLibrary);
    this.preserveRecordsScroll();
    if (result.skippedBuiltInCount > 0) this.showToast(`Skipped ${result.skippedBuiltInCount} built-in records`);
    if (this.recordsPanelOpen) await this.showRecords();
  }

  private renderRecordsLibraryRows(currentId?: string): string {
    return this.visibleMusicTracks().map((track) => {
      const selected = track.id === currentId;
      const source = track.source === "user" ? "My Music" : "Walk Back Home";
      const menuOpen = this.activeRecordMenuTrackId === track.id;
      return `
        <div class="record-list-row ${selected ? "selected" : ""}">
          <label class="record-selection" aria-label="Select ${this.escapeHtml(track.title)}"><input type="checkbox" data-record-select="${this.escapeHtml(track.id)}" ${this.selectedRecordIds.has(track.id) ? "checked" : ""}></label>
          <button class="record-select" data-action="select-vinyl" data-record="${this.escapeHtml(track.id)}">
            <span>${selected && this.personalPlayer.playing ? "◉ " : ""}${this.escapeHtml(track.title)}</span>
            <small>${this.escapeHtml(track.artist || source)}</small>
          </button>
          <button class="record-row-menu-button" data-action="toggle-record-song-menu" data-track="${this.escapeHtml(track.id)}" aria-label="More actions for ${this.escapeHtml(track.title)}">⋮</button>
          <div class="records-song-menu ${menuOpen ? "open" : ""}" role="menu">
            <button data-action="select-vinyl" data-record="${this.escapeHtml(track.id)}">Play this record</button>
            ${track.source === "user" ? `<button class="danger" data-action="request-delete-user-track" data-track="${this.escapeHtml(track.id)}">Delete from My Records</button>` : `<span>Walk Back Home record</span>`}
          </div>
        </div>`;
    }).join("");
  }

  private renderRecordsBatchToolbar(): string {
    if (!this.selectedRecordIds.size) return "";
    const visibleIds = this.visibleMusicTracks().map((track) => track.id);
    const allVisibleSelected = visibleIds.length > 0 && visibleIds.every((id) => this.selectedRecordIds.has(id));
    return `<section class="records-batch-toolbar" aria-label="Batch Records actions">
      <div><strong>${this.selectedRecordIds.size} selected</strong><span>${allVisibleSelected ? "All filtered records selected" : "Choose records to edit"}</span></div>
      <div class="records-batch-actions"><button data-action="${allVisibleSelected ? "records-clear-selection" : "records-select-all"}">${allVisibleSelected ? "Clear All" : "Select All"}</button><button data-action="records-request-batch-delete" data-batch-action="records-batch-delete" class="danger">Delete Selected</button></div>
      <label>Artist<input data-record-batch-field="artist" data-batch-field="records-batch-artist" placeholder="Leave blank to keep" aria-label="Batch Artist"></label>
      <label>Album<input data-record-batch-field="album" data-batch-field="records-batch-album" placeholder="Leave blank to keep" aria-label="Batch Album"></label>
      <button data-action="records-apply-batch-edit">Apply Artist / Album</button>
    </section>`;
  }

  private renderBatchDeleteConfirmation(surface: "mobile" | "desktop"): string {
    return `<div class="records-delete-confirmation records-batch-${surface}-confirmation" role="dialog" aria-modal="true" aria-label="Delete selected Records">
      <div>
        <strong>Delete selected Records?</strong>
        <p>${this.selectedRecordIds.size} record${this.selectedRecordIds.size === 1 ? "" : "s"} selected. User records will be removed; built-in records will be kept.</p>
      </div>
      <div class="delete-confirmation-actions"><button data-action="records-cancel-batch-delete">Cancel</button><button class="danger" data-action="records-confirm-batch-delete">Delete users</button></div>
    </div>`;
  }

  private async selectVinyl(recordId: string, announce = true): Promise<void> {
    const sameTrack = this.personalPlayer.selectedTrackId === recordId;
    const startPosition = sameTrack ? this.currentPersonalPlaybackTime() : 0;
    this.personalPlayer.selectedTrackId = recordId;
    this.personalPlayer.playing = true;
    this.personalPlayer.playbackPosition = startPosition;
    void this.loadBundledLyricsForSelectedTrack();
    this.preserveRecordsScroll();
    this.recordsMoreMenuOpen = false;
    this.activeRecordMenuTrackId = "";
    this.pendingPersonalSeek = null;
    if (isBuiltInTrackId(recordId)) this.room = this.selectAvailableVinylRecord(recordId);
    else this.room = { ...this.room, selectedVinylId: recordId, vinylPlaying: true, musicOn: true };
    await this.playPersonalMusic(recordId, startPosition);
    if (this.recordsPanelOpen) await this.showRecords();
    else this.updatePersonalMusicOverlay();
    if (announce) this.showToast("Record changed");
    this.autosave();
  }

  private async loadBundledLyricsForSelectedTrack(): Promise<void> {
    const track = this.currentPersonalTrack();
    const trackId = this.personalPlayer.selectedTrackId;
    if (!track || !trackId || track.id !== trackId) return;
    const identity = trackIdentity(track.artist, track.title);
    const bundledRequestToken = ++this.bundledLyricsRequestToken;
    const requestToken = ++this.lrclibLyricsRequestToken;
    this.bundledLyricsRuntime.delete(trackId);
    this.lrclibLyricsRuntime.delete(trackId);
    if (this.localLyricsForTrack(track) !== undefined) return;

    const bundledResult = await this.bundledLyricsLoader.load({ artist: track.artist, title: track.title });
    const current = this.currentPersonalTrack();
    if (bundledResult) {
      if (bundledRequestToken !== this.bundledLyricsRequestToken || this.personalPlayer.selectedTrackId !== trackId || current?.id !== trackId || identity !== (current ? trackIdentity(current.artist, current.title) : "")) return;
      this.bundledLyricsRuntime.set(trackId, { identity, lines: bundledResult.lines });
      if (this.recordsPanelOpen) this.refreshRecordsLyricsUI(this.currentPersonalPlaybackTime());
      else this.updatePersonalMusicOverlay();
      return;
    }
    if (bundledRequestToken !== this.bundledLyricsRequestToken || this.personalPlayer.selectedTrackId !== trackId || current?.id !== trackId || identity !== (current ? trackIdentity(current.artist, current.title) : "")) return;

    const lrclibResult = await this.lrclibLyricsProvider.resolve({
      artist: track.artist,
      title: track.title,
      album: track.album,
      duration: track.duration
    });
    const currentAfterLrclib = this.currentPersonalTrack();
    if (!lrclibResult || requestToken !== this.lrclibLyricsRequestToken || this.personalPlayer.selectedTrackId !== trackId || currentAfterLrclib?.id !== trackId || identity !== (currentAfterLrclib ? trackIdentity(currentAfterLrclib.artist, currentAfterLrclib.title) : "")) return;

    this.lrclibLyricsRuntime.set(trackId, { identity, source: "lrclib", lines: lrclibResult.syncedLyrics });
    if (this.recordsPanelOpen) this.refreshRecordsLyricsUI(this.currentPersonalPlaybackTime());
    else this.updatePersonalMusicOverlay();
  }

  private async pauseVinyl(): Promise<void> {
    this.preserveRecordsScroll();
    if (!this.personalPlayer.selectedTrackId) this.personalPlayer.selectedTrackId = this.availableVinylRecords[0]?.id;
    this.personalPlayer.playing = !this.personalPlayer.playing;
    this.room.vinylPlaying = this.personalPlayer.playing;
    if (this.personalPlayer.playing) await this.playPersonalMusic(this.personalPlayer.selectedTrackId, this.personalPlayer.playbackPosition);
    else {
      this.personalPlayer.playbackPosition = this.audio.getCurrentTime();
      this.audio.pause();
    }
    if (this.recordsPanelOpen) await this.showRecords();
    else this.updatePersonalMusicOverlay();
    this.autosave();
  }

  private selectAvailableVinylRecord(recordId: string): typeof this.room {
    const record = this.availableVinylRecords.find((item) => item.id === recordId) ?? this.availableVinylRecords[0];
    return selectVinylRecord({ ...this.room, selectedVinylId: record.id }, record.id, this.availableVinylRecords);
  }

  private localLyricsForTrack(track: { id: string; source: "built-in" | "user"; syncedLyrics?: SyncedLyricLine[] }): SyncedLyricLine[] | undefined {
    return track.source === "built-in"
      ? this.personalPlayer.customTrackLyrics?.[track.id]?.syncedLyrics
      : this.musicLibrary.tracks.find((item) => item.id === track.id)?.syncedLyrics;
  }

  private effectiveLyricsForTrack(track: { id: string; title: string; artist?: string; source: "built-in" | "user"; syncedLyrics?: SyncedLyricLine[] }): SyncedLyricLine[] | undefined {
    const local = this.localLyricsForTrack(track);
    if (local !== undefined) return local;
    const bundled = this.bundledLyricsRuntime.get(track.id);
    if (bundled?.identity === trackIdentity(track.artist, track.title)) return bundled.lines;
    const lrclib = this.lrclibLyricsRuntime.get(track.id);
    return lrclib?.identity === trackIdentity(track.artist, track.title) ? lrclib.lines : undefined;
  }

  private withEffectiveLyrics<T extends { id: string; title: string; artist?: string; source: "built-in" | "user"; syncedLyrics?: SyncedLyricLine[] }>(track: T): T {
    const lyrics = this.effectiveLyricsForTrack(track);
    return lyrics === undefined ? track : { ...track, syncedLyrics: lyrics };
  }

  private invalidateBundledLyricsForTrack(trackId: string): void {
    this.bundledLyricsRuntime.delete(trackId);
    this.lrclibLyricsRuntime.delete(trackId);
    this.bundledLyricsRequestToken += 1;
    this.lrclibLyricsRequestToken += 1;
    if (trackId === this.personalPlayer.selectedTrackId && this.recordsPanelOpen) this.refreshRecordsLyricsUI(this.currentPersonalPlaybackTime());
  }

  private allPersonalTracks(): Array<{ id: string; title: string; artist?: string; album?: string; duration?: number; source: "built-in" | "user"; src?: string; audioBlobKey?: string; coverBlobKey?: string; syncedLyrics?: UserMusicTrack["syncedLyrics"]; addedAt: number; lastPlayedAt?: number }> {
    const builtIns = this.availableVinylRecords.map((record, index) => {
      const custom = this.personalPlayer.customTrackMeta?.[record.id];
      return {
        id: record.id,
        title: custom?.title || record.title,
        artist: custom?.artist || record.subtitle,
        album: custom?.album,
        source: "built-in" as const,
        src: record.sideA?.src,
        duration: record.sideA?.duration,
        coverBlobKey: undefined,
        syncedLyrics: this.personalPlayer.customTrackLyrics?.[record.id]?.syncedLyrics,
        addedAt: 1000 - index,
        lastPlayedAt: record.id === this.personalPlayer.selectedTrackId ? Date.now() : undefined
      };
    });
    const imported = this.musicLibrary.tracks.map((track) => ({ ...track, source: "user" as const }));
    return [...builtIns, ...imported].map((track) => this.withEffectiveLyrics(track));
  }

  private visibleMusicTracks(): ReturnType<typeof this.allPersonalTracks> {
    const imported = filterAndSortMusic(this.musicLibrary.tracks, this.personalPlayer.librarySearch, this.personalPlayer.librarySort).map((track) => ({ ...track, source: "user" as const }));
    const needle = this.personalPlayer.librarySearch.trim().toLocaleLowerCase();
    const builtIns = this.availableVinylRecords
      .map((record, index) => {
        const custom = this.personalPlayer.customTrackMeta?.[record.id];
        return {
          id: record.id,
          title: custom?.title || record.title,
          artist: custom?.artist || record.subtitle,
          album: custom?.album,
          source: "built-in" as const,
          src: record.sideA?.src,
          duration: record.sideA?.duration,
          coverBlobKey: undefined,
          syncedLyrics: this.personalPlayer.customTrackLyrics?.[record.id]?.syncedLyrics,
          addedAt: 1000 - index
        };
      })
      .filter((record) => !needle || [record.title, record.artist].filter(Boolean).join(" ").toLocaleLowerCase().includes(needle));
    return [...builtIns, ...imported];
  }

  private currentPersonalTrack(): ReturnType<typeof this.allPersonalTracks>[number] | null {
    const tracks = this.allPersonalTracks();
    const id = this.personalPlayer.selectedTrackId ?? this.room.selectedVinylId ?? tracks[0]?.id;
    const track = tracks.find((item) => item.id === id) ?? tracks[0] ?? null;
    if (track && !this.personalPlayer.selectedTrackId) this.personalPlayer.selectedTrackId = track.id;
    return track;
  }

  private async playPersonalMusic(trackId = this.personalPlayer.selectedTrackId, position = this.personalPlayer.playbackPosition): Promise<void> {
    const track = this.allPersonalTracks().find((item) => item.id === trackId) ?? this.currentPersonalTrack();
    if (!track) return;
    try {
      const src = await this.sourceForPersonalTrack(track);
      if (!src) return;
      this.audio.setTrack(src);
      this.audio.setLoop(this.personalPlayer.repeatOne);
      this.audio.seek(position);
      if (this.settings.musicEnabled && !this.settings.muted) await this.audio.ensurePlaying();
      this.personalPlayer.selectedTrackId = track.id;
      this.personalPlayer.playing = true;
      this.room.selectedVinylId = track.id;
      this.room.vinylPlaying = true;
      if (track.source === "user") this.markUserTrackPlayed(track.id);
    } catch {
      this.personalPlayer.playing = false;
      this.room.vinylPlaying = false;
      this.showToast("This audio file could not be played in this browser.");
    }
  }

  private async sourceForPersonalTrack(track: ReturnType<typeof this.allPersonalTracks>[number]): Promise<string> {
    return track.source === "user" && track.audioBlobKey ? await this.musicBlobStore.objectUrlFor(track.audioBlobKey) : track.src ?? "";
  }

  private async playAdjacentPersonalTrack(direction: -1 | 1): Promise<void> {
    this.preserveRecordsScroll();
    const tracks = this.visibleMusicTracks();
    if (!tracks.length) return;
    const current = this.currentPersonalTrack();
    const nextId = adjacentTrackIdForControl(tracks.map((track) => track.id), current?.id, direction, { shuffleEnabled: this.personalPlayer.shuffleEnabled });
    if (nextId) await this.selectVinyl(nextId);
  }

  private toggleMusicShuffle(): void {
    this.personalPlayer.shuffleEnabled = !this.personalPlayer.shuffleEnabled;
    this.preserveRecordsScroll();
    if (this.recordsPanelOpen) void this.showRecords();
    this.updatePersonalMusicOverlay();
    this.autosave();
  }

  private toggleMusicRepeatOne(): void {
    this.personalPlayer.repeatOne = !this.personalPlayer.repeatOne;
    this.audio.setLoop(this.personalPlayer.repeatOne);
    this.preserveRecordsScroll();
    if (this.recordsPanelOpen) void this.showRecords();
    this.updatePersonalMusicOverlay();
    this.autosave();
  }

  private setMusicVisualMode(mode: "vinyl" | "cover"): void {
    this.preserveRecordsScroll();
    this.personalPlayer.visualMode = mode;
    void this.showRecords();
    this.autosave();
  }

  private toggleMusicVisualMode(): void {
    this.preserveRecordsScroll();
    this.personalPlayer.visualMode = this.personalPlayer.visualMode === "vinyl" ? "cover" : "vinyl";
    void this.showRecords();
    this.autosave();
  }

  private toggleFloatingLyrics(): void {
    this.preserveRecordsScroll();
    this.personalPlayer.lyricsVisible = !this.personalPlayer.lyricsVisible;
    if (this.personalPlayer.lyricsVisible) {
      this.personalPlayer.lyricsOverlay = this.mobileLyricsOverlayDefault();
      this.rehomeFloatingLyrics(false);
    }
    void this.showRecords();
    this.updatePersonalMusicOverlay();
    this.autosave();
  }

  private rehomeFloatingLyrics(showToast = true): void {
    this.personalPlayer.lyricsOverlay = this.mobileLyricsOverlayDefault();
    this.save.savePersonalPlayer(this.personalPlayer);
    this.updatePersonalMusicOverlay();
    if (showToast) this.showToast("Floating lyrics moved back into view");
  }

  private mobileLyricsOverlayDefault(): PersonalPlayerState["lyricsOverlay"] {
    if (!window.matchMedia("(max-width: 700px)").matches) {
      return clampLyricsOverlay(this.personalPlayer.lyricsOverlay, this.canvas.width, this.canvas.height);
    }
    const width = Math.min(240, Math.max(96, this.canvas.width - 24));
    const height = Math.min(96, Math.max(44, this.canvas.height - 48));
    return clampLyricsOverlay({
      x: 12,
      y: 12,
      width,
      height
    }, this.canvas.width, this.canvas.height);
  }

  private markUserTrackPlayed(id: string): void {
    this.musicLibrary = {
      ...this.musicLibrary,
      tracks: this.musicLibrary.tracks.map((track) => track.id === id ? { ...track, lastPlayedAt: Date.now() } : track)
    };
    this.save.saveMusicLibrary(this.musicLibrary);
  }

  private async coverUrlForTrack(trackId: string): Promise<string> {
    const userTrack = this.musicLibrary.tracks.find((track) => track.id === trackId);
    if (userTrack?.coverBlobKey) return await this.safeObjectUrl(userTrack.coverBlobKey);
    const roomCover = this.room.vinylCovers?.[trackId] ?? "";
    return roomCover.startsWith("music/") ? await this.safeObjectUrl(roomCover) : roomCover;
  }

  private async safeObjectUrl(key: string): Promise<string> {
    try {
      return await this.musicBlobStore.objectUrlFor(key);
    } catch {
      return "";
    }
  }

  private trackInitials(title: string): string {
    return title.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => [...part][0]).join("").toUpperCase() || "WBH";
  }

  private formatTime(seconds: number): string {
    const safe = Math.max(0, Math.floor(Number.isFinite(seconds) ? seconds : 0));
    return `${Math.floor(safe / 60)}:${String(safe % 60).padStart(2, "0")}`;
  }

  private seekPersonalMusic(seconds: number): void {
    const duration = this.audio.getDuration() || this.currentPersonalTrack()?.duration || Number.POSITIVE_INFINITY;
    const targetTime = Math.max(0, Math.min(duration, Number.isFinite(seconds) ? seconds : 0));
    this.pendingPersonalSeek = targetTime;
    this.personalPlayer.playbackPosition = targetTime;
    void this.seekLoadedPersonalMusic(targetTime);
    if (this.personalPlayer.playing && this.audio.isPaused() && this.settings.musicEnabled && !this.settings.muted) void this.audio.ensurePlaying();
    this.refreshRecordsPlaybackUI();
    this.updatePersonalMusicOverlay();
    this.save.savePersonalPlayer(this.personalPlayer);
  }

  private async seekLoadedPersonalMusic(targetTime: number): Promise<void> {
    const track = this.currentPersonalTrack();
    if (!track) return;
    const src = await this.sourceForPersonalTrack(track);
    if (src && !this.audio.isCurrentTrack(src)) this.audio.setTrack(src);
    this.audio.seek(targetTime);
    if (this.personalPlayer.playing && this.settings.musicEnabled && !this.settings.muted) await this.audio.ensurePlaying();
  }

  private currentPersonalPlaybackTime(): number {
    if (this.pendingPersonalSeek !== null) return this.pendingPersonalSeek;
    return this.audio.getCurrentTime() || this.personalPlayer.playbackPosition;
  }

  private syncPersonalPlaybackState(): void {
    if (!this.personalPlayer.playing || !personalMusicShouldPlayInScene(this.scene)) return;
    const currentTime = this.audio.getCurrentTime();
    if (Math.abs(currentTime - this.personalPlayer.playbackPosition) < 0.5) return;
    this.personalPlayer.playbackPosition = currentTime;
  }

  private handlePersonalTimeUpdate(): void {
    if (!this.personalPlayer.playing || !personalMusicShouldPlayInScene(this.scene)) return;
    this.personalPlayer.playbackPosition = this.audio.getCurrentTime();
    if (this.pendingPersonalSeek !== null && Math.abs(this.personalPlayer.playbackPosition - this.pendingPersonalSeek) < 0.4) this.pendingPersonalSeek = null;
    this.refreshRecordsPlaybackUI();
    this.updatePersonalMusicOverlay();
  }

  private async handlePersonalTrackEnded(): Promise<void> {
    if (!this.personalPlayer.playing || !personalMusicShouldPlayInScene(this.scene)) return;
    const tracks = this.visibleMusicTracks();
    const nextId = nextTrackIdForPlayback(tracks.map((track) => track.id), this.personalPlayer.selectedTrackId, {
      repeatOne: this.personalPlayer.repeatOne,
      shuffleEnabled: this.personalPlayer.shuffleEnabled
    });
    if (!nextId) {
      this.personalPlayer.playing = false;
      this.room.vinylPlaying = false;
      this.refreshRecordsPlaybackUI();
      this.updatePersonalMusicOverlay();
      this.autosave();
      return;
    }
    await this.selectVinyl(nextId, false);
  }

  private refreshRecordsPlaybackUI(): void {
    if (!this.recordsPanelOpen) return;
    const currentTime = this.currentPersonalPlaybackTime();
    const duration = this.audio.getDuration() || this.currentPersonalTrack()?.duration || 0;
    this.overlay.querySelectorAll<HTMLElement>("[data-music-current]").forEach((label) => { label.textContent = this.formatTime(currentTime); });
    this.overlay.querySelectorAll<HTMLElement>("[data-music-duration]").forEach((label) => { label.textContent = this.formatTime(duration); });
    this.overlay.querySelectorAll<HTMLInputElement>("[data-music-seek]").forEach((seek) => {
      if (document.activeElement === seek) return;
      seek.max = String(Math.max(1, duration || 1));
      seek.value = String(Math.min(currentTime, Math.max(1, duration || 1)));
    });
    this.refreshRecordsLyricsUI(currentTime);
  }

  private refreshRecordsLyricsUI(currentTime: number): void {
    const lyrics = this.currentPersonalTrack()?.syncedLyrics ?? [];
    const active = activeLyricIndexAt(lyrics, currentTime);
    const rows = Array.from(this.overlay.querySelectorAll<HTMLElement>(".lyrics-pane p"));
    if (!lyrics.length) {
      const pane = this.overlay.querySelector<HTMLElement>(".lyrics-pane");
      if (pane) pane.innerHTML = `<p class="empty-lyrics">Add .lrc lyrics to let words drift with the room.</p>`;
      const mobile = this.overlay.querySelector<HTMLElement>(".records-mobile-lyrics");
      if (mobile) mobile.innerHTML = `<p class="empty-lyrics">Add lyrics from the More menu.</p>`;
      return;
    }
    const activeRow = active >= 0 ? rows[active] : null;
    const shouldScroll = activeRow ? !activeRow.classList.contains("active") : false;
    rows.forEach((row, index) => {
      row.dataset.lyricIndex = String(index);
      row.classList.toggle("active", index === active);
      row.classList.toggle("near", index !== active && Math.abs(index - active) <= 2);
    });
    if (activeRow && shouldScroll) {
      activeRow.scrollIntoView({ block: "center", behavior: this.settings.reducedMotion ? "auto" : "smooth" });
    }
    const mobile = this.overlay.querySelector<HTMLElement>(".records-mobile-lyrics");
    if (!mobile) return;
    const mobileWindow = lyricWindowForTime(lyrics, currentTime);
    const mobileRows = Array.from(this.overlay.querySelectorAll<HTMLElement>(".records-mobile-lyrics p"));
    const currentWindowKey = mobileRows.map((row) => row.dataset.lyricIndex ?? "").join(",");
    const nextWindowKey = mobileWindow.map((item) => String(item.sourceIndex)).join(",");
    if (currentWindowKey !== nextWindowKey) {
      mobile.innerHTML = mobileWindow.map((item) => `<p data-lyric-index="${item.sourceIndex}" class="${item.state}">${this.escapeHtml(item.line?.text ?? "")}</p>`).join("");
    } else {
      mobileRows.forEach((row, index) => {
        row.classList.toggle("previous", mobileWindow[index]?.state === "previous");
        row.classList.toggle("active", mobileWindow[index]?.state === "active");
        row.classList.toggle("next", mobileWindow[index]?.state === "next");
      });
    }
  }

  private updatePersonalMusicOverlay(): void {
    if (this.recordsPanelOpen || !this.personalPlayer.selectedTrackId || !personalMusicShouldPlayInScene(this.scene)) {
      this.musicPlayer.innerHTML = "";
      return;
    }
    const track = this.currentPersonalTrack();
    if (!track) {
      this.musicPlayer.innerHTML = "";
      return;
    }
    const lyrics = track.syncedLyrics ?? [];
    const activeIndex = activeLyricIndexAt(lyrics, this.currentPersonalPlaybackTime());
    const overlay = clampLyricsOverlay(this.personalPlayer.lyricsOverlay, this.canvas.width, this.canvas.height);
    this.personalPlayer.lyricsOverlay = overlay;
    const overlayHeight = Math.round(overlay.height ?? 116);
    const activeLyric = activeIndex >= 0 ? activeIndex : 0;
    const lyricStart = lyrics.length ? Math.max(0, Math.min(activeLyric - 1, Math.max(0, lyrics.length - 3))) : 0;
    const lyricLines = this.personalPlayer.lyricsVisible ? lyrics.slice(lyricStart, lyricStart + 3) : [];
    const lyricHtml = lyricLines.length
      ? lyricLines.map((line, index) => {
        const lyricIndex = lyricStart + index;
        return `<span class="${lyricIndex === activeIndex ? "active" : ""}">${this.escapeHtml(line.text)}</span>`;
      }).join("")
      : `<span class="muted">${this.escapeHtml(track.title)}</span><span class="active">${this.escapeHtml(track.artist ?? "Now playing")}</span>`;
    const floatingLyrics = this.personalPlayer.lyricsVisible
      ? `<div class="floating-lyrics" style="left:${overlay.x}px;top:${overlay.y}px;width:${overlay.width}px;min-height:${overlayHeight}px" aria-live="off"><div class="floating-lyrics-tools"><button class="floating-records-link floating-controls-bar" data-action="room-records">♪ Records</button><button class="floating-lyrics-reset floating-controls-bar" data-action="floating-lyrics-reset" aria-label="Move floating lyrics back into view" title="Move back into view">Reset</button></div><div class="floating-lyric-shortcut floating-drag-handle" data-action="room-records" role="button" tabindex="0" aria-label="Open records">${lyricHtml}</div><div class="floating-player-controls floating-controls-bar"><button class="icon-button" data-action="music-prev" aria-label="Previous" title="Previous">⏮</button><button class="icon-button primary" data-action="vinyl-pause" aria-label="${this.personalPlayer.playing ? "Pause" : "Play"}" title="${this.personalPlayer.playing ? "Pause" : "Play"}">${this.personalPlayer.playing ? "⏸" : "▶"}</button><button class="icon-button" data-action="music-next" aria-label="Next" title="Next">⏭</button></div><span class="floating-resize-handle" aria-label="Resize floating lyrics" title="Resize floating lyrics">↘</span></div>`
      : "";
    this.musicPlayer.innerHTML = `<button class="mini-now-playing" data-action="room-records">♪ ${this.escapeHtml(track.title)}</button>${floatingLyrics}`;
  }

  private makeDiaryLibrary(): DiaryLibraryState {
    return {
      version: 1,
      savedAt: new Date().toISOString(),
      entries: this.diaryEntries,
      legacyArtifacts: this.legacyArtifacts,
      monthlyCovers: this.monthlyCovers
    };
  }

  private makeJourney(): JourneyState {
    return {
      version: 1,
      savedAt: new Date().toISOString(),
      scene: this.scene,
      player: this.player,
      visitedMemories: [...this.visitedMemories],
      walkedThroughMemories: [...this.walkedThroughMemories],
      choices: this.choices,
      tendencies: this.tendencies,
      readMemories: [...this.readMemories],
      completedMemoryEvents: [...this.completedMemoryEvents],
      room: this.room,
      personalPlayer: this.personalPlayer,
      finalJourney: []
    };
  }

  private applyDiaryLibrary(state: DiaryLibraryState): void {
    this.diaryEntries = seedAuthoredChapterDiaryEntries(state).entries;
    this.legacyArtifacts = state.legacyArtifacts;
    this.monthlyCovers = state.monthlyCovers ?? {};
  }

  private normalizePersonalPlayerToggles(): void {
    const legacyMode = normalizePlaybackMode(this.personalPlayer.playbackMode);
    this.personalPlayer.repeatOne = this.personalPlayer.repeatOne || legacyMode === "repeat-one";
    this.personalPlayer.shuffleEnabled = this.personalPlayer.shuffleEnabled || legacyMode === "shuffle";
    this.personalPlayer.playbackMode = undefined;
  }

  private applyJourney(state: JourneyState): void {
    this.scene = state.scene;
    this.player = state.player;
    this.currentDoor = this.allDoors().find((door) => this.isChapterNode(door) && door.chapterId === state.walkedThroughMemories.at(-1)) ?? null;
    this.visitedMemories = new Set(state.visitedMemories);
    this.walkedThroughMemories = new Set(state.walkedThroughMemories);
    this.choices = state.choices;
    this.tendencies = state.tendencies;
    this.readMemories = new Set(state.readMemories);
    this.completedMemoryEvents = new Set(state.completedMemoryEvents ?? []);
    this.chapterMemoryRun = null;
    this.room = { ...this.room, ...state.room };
    this.personalPlayer = { ...this.personalPlayer, ...(state.personalPlayer ?? this.save.loadPersonalPlayer() ?? {}) };
    this.normalizePersonalPlayerToggles();
    if (this.isAuthoredRuntimeScene()) {
      this.resetAuthoredRuntime();
      this.currentDoor = this.allDoors().find((door) => this.isChapterNode(door) && chapterRegistry[door.chapterId]?.runtimeScene === this.scene) ?? this.currentDoor;
    }
    if (this.scene === "labis") {
      this.labisCutscene = null;
      this.labisDialogueOpen = false;
      this.labisReplayMode = false;
      this.labisLessonChoiceIndex = -1;
      this.labisLessonLeadLines = [];
    }
    this.audio.setVolume(this.settings.volume);
    this.audio.setMuted(this.settings.muted);
    this.applyAudioForCurrentScene();
  }

  private autosave(): void {
    this.save.saveDiaryLibrary(this.makeDiaryLibrary());
    this.save.saveJourney(this.makeJourney());
    this.save.saveReflectionWall(this.reflectionWall);
    this.save.saveMusicLibrary(this.musicLibrary);
    this.save.savePersonalPlayer(this.personalPlayer);
  }

  private resetJourney(): void {
    this.scene = "forest";
    this.player = { x: 880, y: 690 };
    this.currentDoor = null;
    this.tendencies = emptyTendencies();
    this.walkedThroughMemories.clear();
    this.visitedMemories.clear();
    this.choices = [];
    this.readMemories.clear();
    this.completedMemoryEvents.clear();
    this.resetAuthoredRuntime();
    this.chapterMemoryRun = null;
    this.chapterTriggerSessions.clear();
    this.chapterProgress.clear();
    this.reflectionWall = migrateLegacyReflectionWall(this.reflectionWall, this.room);
    this.save.saveReflectionWall(this.reflectionWall);
    this.room = createDefaultRoomState();
    this.personalPlayer = createDefaultPersonalPlayerState();
    this.save.resetJourney();
    this.save.savePersonalPlayer(this.personalPlayer);
    this.save.saveDiaryLibrary(this.makeDiaryLibrary());
    this.showToast("Your diary will stay. The walk begins again.");
    this.overlay.innerHTML = "";
  }

  private showBackupSync(): void {
    this.recordsPanelOpen = false;
    const session = this.account.current();
    const accountLabel = session.mode === "guest" ? "Guest / local mode" : `${session.email ?? session.ownerId} · Google`;
    const claimButton = session.mode === "authenticated" && !session.claimedGuestDataAt ? `<button data-action="account-claim-local">Keep local memories with this account</button>` : "";
    const signOut = session.mode === "authenticated" ? `<button data-action="account-sign-out">Sign out</button>` : "";
    const signIn = session.mode === "guest" && this.cloudSync.isConfigured() ? `<button data-action="account-google-sign-in">Sign in with Google</button>` : "";
    const cloudActionDisabled = this.backupSyncOperation ? "disabled" : "";
    const pushLabel = this.backupSyncOperation === "push" ? "Syncing this device…" : "Sync this device to cloud";
    const pullLabel = this.backupSyncOperation === "pull" ? "Pulling cloud memories…" : "Pull cloud memories";
    const cloudActions = session.mode === "authenticated" && this.cloudSync.isConfigured()
      ? `<button data-action="cloud-sync-push" ${cloudActionDisabled}>${pushLabel}</button><button data-action="cloud-sync-pull" ${cloudActionDisabled}>${pullLabel}</button>`
      : "";
    const syncFeedback = this.backupSyncFeedback
      ? `<p class="sync-feedback sync-feedback-${this.backupSyncFeedback.tone}" role="status">${this.escapeHtml(this.backupSyncFeedback.message)}</p>`
      : "";
    this.overlay.innerHTML = `
      <div class="modal game-panel backup-panel">
        <h2>Backup / Sync</h2>
        <p class="quiet-line">Portable backup includes diary pages, timeline classifications, journey state, personal records, custom covers, backgrounds, and imported music blobs. Cloud sync excludes imported Records audio and covers; they stay on this device.</p>
        <div class="module-grid">
          <button data-action="download-backup">Download Backup<span>Save a full local JSON file for Google Drive or another device</span></button>
          <label class="backup-restore-button">Restore Backup<input id="restore-backup-input" type="file" accept="application/json,.json"></label>
        </div>
        <div class="sync-status">
          <h3>Account</h3>
          <p>${this.escapeHtml(accountLabel)}</p>
          <div class="settings-row">${signIn}${claimButton}${signOut}</div>
          <h3>Cloud / Cross-device Sync</h3>
          <p>${this.escapeHtml(this.cloudSync.statusLabel())}</p>
          ${syncFeedback}
          <div class="settings-row">${cloudActions}</div>
        </div>
        <div class="settings-row"><button data-action="settings">Back</button><button data-action="close">Close</button></div>
      </div>`;
    this.focusStage();
  }

  private async signInWithGoogle(): Promise<void> {
    try {
      await this.cloudSync.signInWithGoogle();
    } catch (error) {
      this.showToast(`Google sign-in failed · ${this.errorMessage(error)}`);
    }
  }

  private async signOutAccount(): Promise<void> {
    try {
      await this.cloudSync.signOut();
    } catch {
      // Local sign-out still succeeds if the cloud provider is unavailable.
    }
    this.applyAccountSession(this.account.signOut(), true);
    this.showToast("Signed out to local guest mode");
    this.showBackupSync();
  }

  private claimLocalDataForAccount(): void {
    const session = this.account.claimGuestData();
    this.applyAccountSession(session, true);
    this.showToast("Local memories kept with this account");
    this.showBackupSync();
  }

  private async pushCloudSync(): Promise<void> {
    if (this.backupSyncOperation) return;
    const session = this.account.current();
    if (session.mode !== "authenticated") {
      this.showToast("Sign in with Google first");
      return;
    }
    this.backupSyncOperation = "push";
    this.backupSyncFeedback = { tone: "info", message: "Syncing this device to cloud…" };
    this.showBackupSync();
    try {
      await this.cloudSync.push(this.cloudUserId(session.ownerId), this.makeCloudBundle());
      this.backupSyncFeedback = {
        tone: "success",
        message: "Sync complete · diary, journey, and reflection wall synced. Imported Records audio and covers stayed on this device."
      };
      this.showToast("Cloud sync complete");
    } catch (error) {
      this.backupSyncFeedback = { tone: "error", message: `Cloud sync failed · ${this.errorMessage(error)}` };
      this.showToast(`Cloud sync failed · ${this.errorMessage(error)}`);
    } finally {
      this.backupSyncOperation = null;
      this.showBackupSync();
    }
  }

  private async pullCloudSync(): Promise<void> {
    if (this.backupSyncOperation) return;
    this.backupSyncOperation = "pull";
    this.backupSyncFeedback = { tone: "info", message: "Pulling cloud memories…" };
    this.showBackupSync();
    try {
      const bundle = await this.cloudSync.pull();
      const appliedSections: string[] = [];
      if (bundle.diaryLibrary) {
        this.applyDiaryLibrary(bundle.diaryLibrary);
        this.save.saveDiaryLibrary(this.makeDiaryLibrary());
        appliedSections.push("Diary");
      }
      if (bundle.reflectionWall) {
        this.reflectionWall = bundle.reflectionWall;
        this.save.saveReflectionWall(this.reflectionWall);
        appliedSections.push("reflection wall");
      }
      if (bundle.journey) {
        this.applyJourney(bundle.journey);
        this.save.saveJourney(this.makeJourney());
        appliedSections.push("journey");
      }
      this.backupSyncFeedback = {
        tone: "success",
        message: appliedSections.length
          ? `Pull complete · ${appliedSections.join(", ")} updated. Imported Records audio and covers stayed on this device.`
          : "Pull complete · no cloud diary, journey, or reflection wall data was found. Local Records audio and covers stayed on this device."
      };
      this.showToast("Cloud memories pulled");
    } catch (error) {
      this.backupSyncFeedback = { tone: "error", message: `Cloud pull failed · ${this.errorMessage(error)}` };
      this.showToast(`Cloud pull failed · ${this.errorMessage(error)}`);
    } finally {
      this.backupSyncOperation = null;
      this.showBackupSync();
    }
  }

  private makeCloudBundle() {
    return {
      diaryLibrary: this.makeDiaryLibrary(),
      journey: this.makeJourney(),
      reflectionWall: this.reflectionWall
    };
  }

  private cloudUserId(ownerId: string): string {
    return ownerId.replace(/^account:google:/, "");
  }

  private errorMessage(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
  }

  private async downloadBackup(): Promise<void> {
    const blobs = await this.backupBlobEntries();
    const bundle = createBackupBundle({
      diaryLibrary: this.makeDiaryLibrary(),
      journey: this.makeJourney(),
      reflectionWall: this.reflectionWall,
      musicLibrary: this.musicLibrary,
      personalPlayer: this.personalPlayer,
      blobs
    });
    const blob = new Blob([JSON.stringify(bundle, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = walkBackupFilename();
    anchor.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    this.showToast(`Backup downloaded · ${blobs.length} media item${blobs.length === 1 ? "" : "s"}`);
  }

  private async backupBlobEntries(): Promise<BackupBlobEntry[]> {
    const musicEntries = await this.musicBlobStore.entries();
    const music = await Promise.all(musicEntries.map(async ({ key, blob }) => ({
      key,
      kind: "music" as const,
      type: blob.type || "application/octet-stream",
      dataUrl: await this.blobToDataUrl(blob)
    })));
    const journal = await Promise.all(collectReferencedJournalMediaKeys(this.makeDiaryLibrary()).map(async (key) => {
      const blob = await this.journalMediaBlobStore.getBlob(key);
      if (!blob) return null;
      return {
        key,
        kind: "journal-media" as const,
        type: blob.type || "application/octet-stream",
        dataUrl: await this.blobToDataUrl(blob)
      };
    }));
    return [...music, ...journal.filter((entry) => entry !== null)];
  }

  private blobToDataUrl(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.addEventListener("load", () => resolve(String(reader.result ?? "")));
      reader.addEventListener("error", () => reject(reader.error));
      reader.readAsDataURL(blob);
    });
  }

  private async handleRestoreBackupInput(input: HTMLInputElement): Promise<void> {
    const file = input.files?.[0];
    if (!file) return;
    const bundle = parseBackupBundle(await this.readFileAsText(file));
    if (!bundle) {
      this.showToast("That backup file was not recognized.");
      return;
    }
    this.journalMediaBlobStore.revokeAllObjectUrls();
    this.journalMediaObjectUrls.clear();
    this.journalMediaResolution.clear();
    await restoreBackupBlobEntries(bundle.blobs, {
      journalStore: this.journalMediaBlobStore,
      musicStore: this.musicBlobStore
    });
    if (bundle.diaryLibrary) {
      this.applyDiaryLibrary(bundle.diaryLibrary);
      this.save.saveDiaryLibrary(this.makeDiaryLibrary());
    }
    if (bundle.musicLibrary) {
      this.musicLibrary = bundle.musicLibrary;
      this.save.saveMusicLibrary(this.musicLibrary);
    }
    if (bundle.reflectionWall) {
      this.reflectionWall = bundle.reflectionWall;
      this.save.saveReflectionWall(this.reflectionWall);
    }
    if (bundle.personalPlayer) {
      this.personalPlayer = { ...createDefaultPersonalPlayerState(), ...bundle.personalPlayer };
      this.normalizePersonalPlayerToggles();
      this.save.savePersonalPlayer(this.personalPlayer);
    }
    if (bundle.journey) {
      this.applyJourney(bundle.journey);
      if (bundle.personalPlayer) {
        this.personalPlayer = { ...this.personalPlayer, ...bundle.personalPlayer };
        this.normalizePersonalPlayerToggles();
      }
      this.save.saveJourney(this.makeJourney());
      this.save.savePersonalPlayer(this.personalPlayer);
    }
    this.showBackupSync();
    this.showToast(`Backup restored · ${bundle.blobs.length} media item${bundle.blobs.length === 1 ? "" : "s"}`);
    this.autosave();
  }

  private showSettings(): void {
    if (this.input.isTouchControlEditing()) this.input.cancelTouchControlEdit();
    this.overlay.innerHTML = `<div class="modal game-panel"><h2>Menu / Settings</h2>${this.settingsContent()}</div>`;
    this.focusStage();
  }

  private showCredits(): void {
    this.overlay.innerHTML = `<div class="modal"><h2>Credits</h2><p>Fictional local-first prototype. Visual targets supplied by the project owner. No paid API required.</p><button data-action="forest">Exit to forest</button><button data-action="close">Close</button></div>`;
    this.focusStage();
  }

  private async toggleAudio(): Promise<void> {
    if (this.settings.muted) await this.audio.enable();
    this.settings.muted = !this.settings.muted;
    this.audio.setMuted(this.settings.muted);
    this.audio.ping("forest");
    this.showToast(this.settings.muted ? "Sound muted" : "Sound on");
    this.autosave();
  }

  private toggleRain(): void {
    this.settings.rain = !this.settings.rain;
    this.audio.ping("forest");
    this.showToast(`Rain ${this.settings.rain ? "on" : "off"}`);
    this.autosave();
  }

  private async toggleSceneMusic(): Promise<void> {
    this.settings.musicEnabled = !this.settings.musicEnabled;
    if (this.settings.musicEnabled) {
      this.audio.setVolume(this.settings.volume);
      await this.audio.enable();
      this.settings.muted = false;
      this.applyAudioForCurrentScene();
      this.showToast("Music on");
    } else {
      this.settings.muted = true;
      this.audio.setMuted(true);
      this.showToast("Music off");
    }
    this.lastHudHtml = "";
    this.renderTopNav();
    this.autosave();
  }

  private playSceneMusic(scene: MusicScene): void {
    this.settings.musicScene = scene;
    this.audio.setScene(scene);
    if (this.settings.musicEnabled && !this.settings.muted) void this.audio.ensurePlaying();
    this.musicPlayer.innerHTML = "";
    this.lastHudHtml = "";
  }

  private interruptPersonalMusicForMemory(): void {
    if (!personalMusicShouldPlayInScene(this.scene) || !this.personalPlayer.selectedTrackId) return;
    this.personalPlayer.playbackPosition = this.audio.getCurrentTime();
    this.room.vinylPlaying = false;
    this.audio.pause();
    this.musicPlayer.innerHTML = "";
  }

  private applyAudioForCurrentScene(): void {
    if (personalMusicShouldPlayInScene(this.scene) && this.personalPlayer.selectedTrackId && this.personalPlayer.playing) {
      void this.playPersonalMusic(this.personalPlayer.selectedTrackId, this.personalPlayer.playbackPosition);
      return;
    }
    this.playSceneMusic(this.scene === "bakery" ? "bakery" : "forest");
  }

  private async loadVinylManifest(): Promise<void> {
    try {
      const response = await fetch("assets/audio-manifest.json");
      if (!response.ok) return;
      const manifest = await response.json() as { files?: string[] };
      const generated = vinylRecordsFromAudioFiles(manifest.files ?? []);
      if (generated.length) {
        this.availableVinylRecords = generated;
        if (this.room.selectedVinylId && !this.musicLibrary.tracks.some((track) => track.id === this.room.selectedVinylId) && !this.availableVinylRecords.some((record) => record.id === this.room.selectedVinylId)) {
          this.room.selectedVinylId = this.availableVinylRecords[0].id;
        }
      }
    } catch {
      this.availableVinylRecords = vinylRecords;
    }
  }

  private playVinylMusic(): void {
    this.personalPlayer.selectedTrackId = this.room.selectedVinylId ?? this.personalPlayer.selectedTrackId;
    this.personalPlayer.playing = true;
    void this.playPersonalMusic(this.personalPlayer.selectedTrackId, this.personalPlayer.playbackPosition);
  }

  private async toggleFullscreen(): Promise<void> {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen?.();
        this.showToast("Fullscreen off");
        return;
      }
      const shell = this.root.querySelector<HTMLElement>(".game-shell") ?? document.documentElement;
      await shell.requestFullscreen?.();
      this.showToast("Fullscreen on");
    } catch {
      this.showToast("Fullscreen unavailable here");
    }
  }

  private showToast(message: string): void {
    this.toast.textContent = message;
    this.toast.classList.add("show");
    window.setTimeout(() => this.toast.classList.remove("show"), 1800);
  }

  private toggleCompact(): void {
    this.settings.compact = !this.settings.compact;
    this.root.classList.toggle("compact", this.settings.compact);
    this.showToast(this.settings.compact ? "Compact view" : "Large view");
    this.autosave();
  }
}
