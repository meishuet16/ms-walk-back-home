import { bakeryChapter } from "./fixtures/chapterPlan.js";
import type { ChapterProgress, Choice, DiaryEntry, DiaryLibraryState, DiaryMood, JourneyState, MemoryKind, RoomJourneyState, SceneId, Tendencies } from "./types.js";
import { AudioManager } from "./systems/AudioManager.js";
import { chapterRegistry, forestEntries, routeForestEntry, type AuthoredForestEntry } from "./systems/ChapterRegistry.js";
import { beginChapterVisit, finishChapterWalkthrough, initialChapterProgress, markChapterDialogueComplete, markChapterMemoryRead, recordChapterChoice } from "./systems/ChapterProgressManager.js";
import { inAnyRect, type Point, type Rect } from "./systems/CollisionSystem.js";
import { deleteDiaryEntryById, getDiaryForestMemories, getDiaryTimeline, openDiaryPageForDate, upsertDiaryEntry, upsertDiaryPageDraft } from "./systems/DiaryLibrary.js";
import { makeDiaryEntry, parseDiaryImport, updateDiaryMemoryKind, type DiaryForestMemory } from "./systems/DiaryImport.js";
import { DialogueSystem } from "./systems/DialogueSystem.js";
import { resolveChapterReflection, type Ending } from "./systems/EndingResolver.js";
import { InputManager } from "./systems/InputManager.js";
import { ParticleSystem } from "./systems/ParticleSystem.js";
import {
  addPhotoAttachment,
  addPhotoElement,
  createCutoutElement,
  deleteScrapbookElement,
  layerScrapbookElement,
  moveScrapbookElement,
  resizeScrapbookElement,
  rotateScrapbookElement
} from "./systems/ScrapbookComposer.js";
import {
  createDefaultRoomState,
  currentVinylTrack,
  moveRoomPlayer,
  nearestRoomInteraction,
  roomInteractions,
  roomObstacles,
  roomSpawn,
  selectVinylRecord,
  toggleRoomLamp,
  vinylPlayerActions,
  vinylRecords,
  vinylRecordsFromAudioFiles,
  withCustomVinylCover,
  type VinylRecord,
  type RoomInteraction
} from "./systems/MujiRoom.js";
import { SaveManager } from "./systems/SaveManager.js";
import type { MusicScene } from "./systems/SceneMusic.js";
import { emptyTendencies } from "./systems/TendencySystem.js";

type ForestNode = AuthoredForestEntry | DiaryForestMemory;

const assets = {
  forest: "assets/forest.png",
  bakery: "assets/bakery.png",
  muji: "assets/muji-sheet.png",
  friend: "assets/friend-a.png",
  room: "assets/muji-room.png",
  roomFallback: "assets/room-panel.jpg",
  map: "assets/map-panel.jpg",
  timeline: "assets/timeline-panel.jpg"
};

const bakeryMemorySpot = { x: 735, y: 325 };

const diaryMoodOptions: Array<{ value: DiaryMood; label: string }> = [
  { value: "sad", label: "难过" },
  { value: "calm", label: "平静" },
  { value: "blank", label: "发呆" },
  { value: "happy", label: "开心" },
  { value: "excited", label: "超开心" }
];

function isDiaryMood(value: string): value is DiaryMood {
  return diaryMoodOptions.some((mood) => mood.value === value);
}

function img(src: string): HTMLImageElement {
  const image = new Image();
  image.src = src;
  return image;
}

export class WalkBackHomeApp {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private stage: HTMLElement;
  private hud: HTMLElement;
  private toast: HTMLElement;
  private musicPlayer: HTMLElement;
  private overlay: HTMLElement;
  private input: InputManager;
  private audio = new AudioManager();
  private save = new SaveManager();
  private particles = new ParticleSystem();
  private images = {
    forest: img(assets.forest),
    bakery: img(assets.bakery),
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
  private activeRoomInteraction: RoomInteraction | null = null;
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
  private scrapbookDrag: { elementId: string; entryId: string; offsetX: number; offsetY: number } | null = null;
  private diaryAutosaveTimer = 0;
  private availableVinylRecords: VinylRecord[] = vinylRecords;
  private settings = { rain: true, muted: false, volume: 0.45, compact: false, reducedMotion: false, musicEnabled: true, musicScene: "bakery" as MusicScene };
  private room: RoomJourneyState = createDefaultRoomState();
  private chapterProgress = new Map<string, ChapterProgress>();
  private dialogue = new DialogueSystem(bakeryChapter.dialogue);
  private ending: Ending | null = null;

  constructor(private root: HTMLElement) {
    root.innerHTML = `
      <div class="game-shell">
        <header class="top-menu">
          <div><strong>Walk Back Home</strong><span>A gentle walk through memories that still glow.</span></div>
          <nav>
            <button data-action="home">Today</button>
            <button data-action="open-diary-editor">Journal</button>
            <button data-action="new">Begin Journey</button>
            <button data-action="continue">Continue</button>
            <button data-action="settings">Settings</button>
            <button data-action="credits">Credits</button>
          </nav>
        </header>
        <main class="stage-wrap">
          <canvas width="960" height="540" aria-label="Walk Back Home playable scene"></canvas>
          <div class="hud"></div>
          <div class="toast" role="status" aria-live="polite"></div>
          <div class="music-player" aria-label="Scene music player"></div>
          <div class="overlay"></div>
        </main>
      </div>`;
    this.stage = root.querySelector(".stage-wrap")!;
    this.canvas = root.querySelector("canvas")!;
    this.ctx = this.canvas.getContext("2d")!;
    this.hud = root.querySelector(".hud")!;
    this.toast = root.querySelector(".toast")!;
    this.musicPlayer = root.querySelector(".music-player")!;
    this.overlay = root.querySelector(".overlay")!;
    this.input = new InputManager(root);
    this.input.mountTouchControls(() => this.interact());
    root.addEventListener("click", (event) => this.handleClick(event));
    root.addEventListener("change", (event) => void this.handleChange(event));
    root.addEventListener("input", (event) => this.handleInput(event));
    root.addEventListener("pointerdown", (event) => this.handlePointerDown(event));
    root.addEventListener("pointermove", (event) => this.handlePointerMove(event));
    root.addEventListener("pointerup", () => this.scrapbookDrag = null);
    root.addEventListener("pointerdown", () => void this.audio.ensurePlaying(), { passive: true });
    root.addEventListener("keydown", () => void this.audio.ensurePlaying());
    this.bootstrapDiaryLibrary();
    void this.loadVinylManifest();
    this.images.room.addEventListener("error", () => {
      this.images.room.src = assets.roomFallback;
    }, { once: true });
    this.images.room.src = assets.room;
    this.audio.setVolume(this.settings.volume);
    void this.audio.enable();
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) this.last = performance.now();
      else void this.audio.ensurePlaying();
    });
    requestAnimationFrame((time) => this.loop(time));
  }

  private handleClick(event: Event): void {
    const target = (event.target as HTMLElement).closest<HTMLElement>("[data-action]");
    if (!target) return;
    const action = target.dataset.action;
    if (!action) return;
    void this.audio.ensurePlaying();
    if (action === "home") this.showHome();
    if (action === "new") this.newMemory();
    if (action === "continue") this.loadAutosave();
    if (action === "settings") this.showSettings();
    if (action === "credits") this.showCredits();
    if (action === "forest") {
      this.returnToForest();
    }
    if (action === "menu") this.showSettings();
    if (action === "open-timeline") this.showTimeline();
    if (action === "open-map") this.showMap();
    if (action === "open-room") this.enterMujiRoom();
    if (action === "write-today") this.openTodayDiaryPage();
    if (action === "open-diary-editor") this.showDiaryEditor();
    if (action === "save-diary-entry") this.saveDiaryEntry(target.dataset.id);
    if (action === "edit-diary-entry") this.showDiaryEditor(target.dataset.id);
    if (action === "delete-diary-entry") this.deleteDiaryEntry(target.dataset.id ?? "");
    if (action === "show-import-diary") this.showImportDiary();
    if (action === "import-diary-lines") this.importDiaryLines();
    if (action === "add-photo-to-scrapbook") this.addPhotoToScrapbook(target.dataset.photo ?? "");
    if (action === "cutout-photo") this.cutoutPhotoOnPage(target.dataset.photo ?? "");
    if (action === "select-scrapbook-element") this.selectScrapbookElement(target.dataset.element ?? "");
    if (action === "scrapbook-move") this.nudgeSelectedScrapbookElement(Number(target.dataset.dx ?? 0), Number(target.dataset.dy ?? 0));
    if (action === "scrapbook-resize") this.scaleSelectedScrapbookElement(Number(target.dataset.delta ?? 0));
    if (action === "scrapbook-rotate") this.rotateSelectedScrapbookElement(Number(target.dataset.delta ?? 0));
    if (action === "scrapbook-layer") this.layerSelectedScrapbookElement(target.dataset.direction as "front" | "back");
    if (action === "scrapbook-delete") this.deleteSelectedScrapbookElement();
    if (action === "set-diary-mood") this.setDiaryMood(target.dataset.mood ?? "");
    if (action === "set-memory-kind") this.setDiaryMemoryKind(target.dataset.id ?? "", target.dataset.kind as MemoryKind);
    if (action === "room-window") this.roomWindow();
    if (action === "room-lamp") this.roomLamp();
    if (action === "room-letter") this.roomLetter();
    if (action === "save-room-reflection") this.saveRoomReflection();
    if (action === "room-diary") this.roomDiary();
    if (action === "room-records") this.showRecords();
    if (action === "room-residue") this.inspectRoomResidue();
    if (action === "select-vinyl") this.selectVinyl(target.dataset.record ?? "");
    if (action === "vinyl-pause") this.pauseVinyl();
    if (action === "reset-journey") this.resetJourney();
    if (action === "compact") this.toggleCompact();
    if (action === "fullscreen") this.toggleFullscreen();
    if (action === "rain") this.toggleRain();
    if (action === "mute") this.toggleAudio();
    if (action === "music") this.toggleSceneMusic();
    if (action === "close") {
      this.overlay.classList.remove("dialogue-open");
      this.overlay.innerHTML = "";
      this.showToast("Closed");
    }
    if (action === "enter-door") {
      const doorId = target.dataset.door;
      if (doorId) this.currentDoor = this.allDoors().find((door) => door.id === doorId) ?? this.currentDoor;
      this.enterCurrentMemory();
    }
    if (action === "finish-memory") this.finishBakery();
    if (action === "choice") this.choose(target.dataset.choice ?? "");
  }

  private loop(time: number): void {
    const dt = Math.min(0.033, (time - this.last) / 1000);
    this.last = time;
    const input = this.input.read();
    if (input.interact) this.interact();
    if (this.scene === "forest") this.updateForest(input.x, input.y, dt);
    if (this.scene === "bakery") this.updateBakery(input.x, input.y, dt);
    if (this.scene === "muji-room") this.updateMujiRoom(input.x, input.y, dt);
    this.draw(time);
    requestAnimationFrame((next) => this.loop(next));
  }

  private newMemory(): void {
    this.scene = "forest";
    this.player = { x: 880, y: 690 };
    this.currentDoor = null;
    this.ending = null;
    this.tendencies = emptyTendencies();
    this.walkedThroughMemories.clear();
    this.visitedMemories.clear();
    this.choices = [];
    this.readMemories.clear();
    this.chapterProgress.clear();
    this.room = createDefaultRoomState();
    this.overlay.classList.remove("dialogue-open");
    this.overlay.innerHTML = "";
    this.focusStage();
    this.audio.ping("forest");
    this.playSceneMusic("forest");
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
    const saved = this.save.loadDiaryLibrary();
    if (saved) {
      this.applyDiaryLibrary(saved);
      return;
    }
    const legacy = this.save.loadAutosave();
    if (!legacy?.diaryEntries?.length) return;
    const migrated = this.save.migrateLegacyAutosave();
    this.applyDiaryLibrary(migrated.diary);
  }

  private updateForest(x: number, y: number, dt: number): void {
    this.move(x, y, dt, [{ x: 0, y: 0, w: 1536, h: 88 }, { x: 0, y: 0, w: 120, h: 864 }, { x: 1428, y: 0, w: 108, h: 864 }, { x: 0, y: 780, w: 1536, h: 125 }], []);
    this.activeDoor = this.allDoors().find((door) => Math.hypot(this.player.x - door.x, this.player.y - door.y) < 86) ?? null;
  }

  private updateBakery(x: number, y: number, dt: number): void {
    this.move(x, y, dt, [{ x: 0, y: 0, w: 1536, h: 210 }, { x: 0, y: 0, w: 40, h: 560 }, { x: 1490, y: 0, w: 50, h: 560 }, { x: 0, y: 505, w: 1536, h: 80 }], [
      { x: 0, y: 0, w: 980, h: 300 },
      { x: 760, y: 168, w: 245, h: 130 },
      { x: 1000, y: 330, w: 460, h: 170 },
      { x: 70, y: 345, w: 335, h: 150 },
      { x: 640, y: 385, w: 355, h: 120 }
    ]);
    const memoryKey = this.currentMemoryKey();
    const nearMemory = Math.hypot(this.player.x - bakeryMemorySpot.x, this.player.y - bakeryMemorySpot.y) < 88;
    const nearFriend = Math.hypot(this.player.x - 600, this.player.y - 430) < 90;
    const nearPastry = Math.hypot(this.player.x - 840, this.player.y - 250) < 70;
    const nearExit = this.player.x < 105 && this.player.y < 330;
    this.activeObject = nearMemory ? "diary memory" : nearFriend ? "Friend A" : nearPastry ? "pastry" : nearExit ? "exit" : "";
  }

  private updateMujiRoom(x: number, y: number, dt: number): void {
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
  }

  private move(x: number, y: number, dt: number, boundsBlockers: Rect[], objectBlockers: Rect[]): void {
    const moving = Math.hypot(x, y) > 0.05;
    if (moving) {
      this.facing = Math.abs(x) > Math.abs(y) ? (x < 0 ? 2 : 3) : y < 0 ? 1 : 0;
      this.frame = Math.floor(performance.now() / 140) % 4;
      const next = { x: this.player.x + x * 155 * dt, y: this.player.y + y * 155 * dt };
      if (!inAnyRect(next, [...boundsBlockers, ...objectBlockers])) this.player = next;
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
    if (this.scene === "muji-room") {
      if (!this.activeRoomInteraction) return this.showToast("Walk closer");
      if (this.activeRoomInteraction.id === "door") return this.returnToForest();
      if (this.activeRoomInteraction.id === "journal") return this.roomDiary();
      if (this.activeRoomInteraction.id === "lamp") return this.roomLamp();
      if (this.activeRoomInteraction.id === "window") return this.roomWindow();
      if (this.activeRoomInteraction.id === "records") return this.showRecords();
      if (this.activeRoomInteraction.id === "residue") return this.inspectRoomResidue();
      if (this.activeRoomInteraction.id === "reflection") return this.roomLetter();
    }
    if (this.scene === "ending") this.returnToForest();
  }

  private currentMemoryKey(): string {
    return this.currentDoor && this.isChapterNode(this.currentDoor) ? this.currentDoor.chapterId : bakeryChapter.id;
  }

  private allDoors(): ForestNode[] {
    return [...forestEntries, ...getDiaryForestMemories(this.makeDiaryLibrary())];
  }

  private isChapterNode(node: ForestNode): node is AuthoredForestEntry | Extract<DiaryForestMemory, { kind: "chapter" }> {
    return !("kind" in node) || node.kind === "chapter";
  }

  private chapterIdFor(node: ForestNode): string {
    return this.isChapterNode(node) ? node.chapterId : node.id;
  }

  private progressFor(chapterId: string): ChapterProgress {
    const progress = this.chapterProgress.get(chapterId) ?? initialChapterProgress(chapterId);
    this.chapterProgress.set(chapterId, progress);
    return progress;
  }

  private escapeHtml(value: string): string {
    return value.replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" }[char]!));
  }

  private previewDoor(door: ForestNode): void {
    this.visitedMemories.add(door.id);
    this.currentDoor = door;
    if ("kind" in door && door.kind === "fragment") {
      this.overlay.innerHTML = `<div class="modal"><h2>${this.escapeHtml(door.date)} · ${this.escapeHtml(door.title)}</h2><p>${this.escapeHtml(door.excerpt)}</p><p>This memory is a small light, not a full chapter.</p><button data-action="close">Stay in forest</button><button data-action="open-timeline">Open Journal</button></div>`;
      this.autosave();
      this.focusStage();
      return;
    }
    const route = "kind" in door ? { kind: door.implemented ? "implemented-chapter" : "stub" as const } : routeForestEntry(door);
    const state = this.progressFor(this.chapterIdFor(door)).state;
    if (route.kind === "stub") {
      this.overlay.innerHTML = `<div class="modal"><h2>${this.escapeHtml(door.date)} · ${this.escapeHtml(door.title)}</h2><p>This memory is not yet authored.</p><p>The forest keeps the door, but it will not borrow Yumido Bread's scene.</p><button data-action="open-timeline">Open Journal</button><button data-action="close">Stay in forest</button></div>`;
      this.autosave();
      this.focusStage();
      return;
    }
    const action = state === "walkedThrough" ? "Remember" : state === "visited" ? "Return to memory" : "Enter memory";
    this.overlay.innerHTML = `<div class="modal"><h2>${this.escapeHtml(door.date)} · ${this.escapeHtml(door.title)}</h2><p>A memory hums inside the branches.</p><p>Muji does not go back to fix it. Muji goes back to walk beside it.</p><button data-action="enter-door" data-door="${this.escapeHtml(door.id)}">${action}</button><button data-action="forest">Return to Forest</button><button data-action="close">Stay in forest</button></div>`;
    this.focusStage();
  }

  private enterCurrentMemory(): void {
    this.currentDoor ??= this.activeDoor ?? forestEntries[1];
    if (!this.isChapterNode(this.currentDoor)) return this.previewDoor(this.currentDoor);
    const route = "kind" in this.currentDoor ? { kind: this.currentDoor.implemented ? "implemented-chapter" : "stub" as const } : routeForestEntry(this.currentDoor);
    if (route.kind === "stub") {
      this.previewDoor(this.currentDoor);
      return;
    }
    const chapterId = this.chapterIdFor(this.currentDoor);
    this.chapterProgress.set(chapterId, beginChapterVisit(this.progressFor(chapterId)));
    this.visitedMemories.add(this.currentDoor.id);
    this.scene = "bakery";
    this.player = { x: 450, y: 420 };
    this.dialogue = new DialogueSystem(chapterRegistry[chapterId].dialogue);
    this.overlay.classList.remove("dialogue-open");
    this.overlay.innerHTML = "";
    this.focusStage();
    this.showToast("Entered memory");
    this.audio.ping("bakery");
    this.playSceneMusic("bakery");
    this.autosave();
  }

  private resetBakeryDialogue(): void {
    this.dialogue = new DialogueSystem(bakeryChapter.dialogue);
    this.showToast("Friend A is ready to talk again");
  }

  private showDiaryMemory(): void {
    const door = this.currentDoor ?? forestEntries[1];
    const chapterId = this.chapterIdFor(door);
    this.readMemories.add(chapterId);
    this.chapterProgress.set(chapterId, markChapterMemoryRead(this.progressFor(chapterId)));
    const memoryText = "memoryText" in door ? door.memoryText : (bakeryChapter.memoryText ?? []);
    const lines = memoryText.map((line, index) => index === 0 ? `<h2>${this.escapeHtml(door.date)} · ${this.escapeHtml(door.title)}</h2>` : `<p>${this.escapeHtml(line)}</p>`).join("");
    this.overlay.innerHTML = `<div class="modal diary-memory">${lines}<button data-action="close">Close</button><button data-action="forest">Exit to forest</button></div>`;
    this.showToast("Diary memory read");
    this.focusStage();
    this.autosave();
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
    const portrait = node.portrait === "friend" ? assets.friend : node.portrait === "muji" ? assets.muji : "";
    this.overlay.classList.add("dialogue-open");
    this.overlay.innerHTML = `<div class="vn"><div class="vn-portrait">${portrait ? `<img src="${portrait}" alt="">` : ""}</div><div><h3>${node.speaker}</h3><p>${node.text}</p>${this.dialogue.lastResponse ? `<p class="memory-line">${this.dialogue.lastResponse}</p>` : ""}<div class="choices">${choices}</div></div></div>`;
    this.focusStage();
  }

  private focusStage(): void {
    requestAnimationFrame(() => this.stage.scrollIntoView({ block: "start", behavior: "auto" }));
  }

  private choiceEffectLabel(choice: Choice): string {
    return Object.keys(choice.effects).length ? "reflection" : "";
  }

  private choose(choiceId: string): void {
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
        this.tendencies = this.dialogue.choose(choice, this.tendencies);
        const chapterId = this.currentMemoryKey();
        this.chapterProgress.set(chapterId, recordChapterChoice(this.progressFor(chapterId), choice.id, this.tendencies));
        this.choices.push(choice.id);
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

  private showEndingQuote(): void {
    const progress = markChapterDialogueComplete(this.progressFor(this.currentMemoryKey()));
    const reflection = resolveChapterReflection(chapterRegistry[this.currentMemoryKey()], progress);
    this.chapterProgress.set(this.currentMemoryKey(), finishChapterWalkthrough(progress, reflection.quoteId, reflection.tone));
    this.walkedThroughMemories.add(this.currentMemoryKey());
    this.room.residueIds = [...new Set([...(this.room.residueIds ?? []), this.currentMemoryKey()])];
    this.overlay.classList.remove("dialogue-open");
    this.overlay.innerHTML = `<div class="modal ending-quote"><span class="ending-kicker">after the conversation</span><h2>The rain slows</h2><p>${reflection.closureLines.map((line) => this.escapeHtml(line)).join("<br>")}</p><blockquote>${reflection.lines.map((line) => this.escapeHtml(line)).join("<br>")}</blockquote><p class="ending-afterline">Some doors do not forgive us. They simply stop asking us to be the person we were when we left.</p><button data-action="close">Close</button><button data-action="forest">Return to Forest</button></div>`;
    this.audio.ping("ending");
    this.autosave();
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
    const leavingDoor = this.scene === "bakery" ? this.currentDoor : null;
    const leavingRoom = this.scene === "muji-room";
    this.scene = "forest";
    this.overlay.classList.remove("dialogue-open");
    this.overlay.innerHTML = "";
    this.player = leavingDoor ? { x: leavingDoor.x, y: Math.min(760, leavingDoor.y + 120) } : { x: 880, y: 690 };
    this.room.windowFocus = false;
    this.showToast(leavingDoor ? "You can come back when you are ready." : leavingRoom ? "Returned to forest" : "Returned to forest");
    this.focusStage();
    this.playSceneMusic("forest");
    this.autosave();
  }

  private draw(time: number): void {
    const compact = this.settings.compact;
    this.canvas.width = compact ? 480 : 960;
    this.canvas.height = compact ? 270 : 540;
    this.ctx.imageSmoothingEnabled = false;
    if (this.scene === "title") this.drawTitle(time);
    if (this.scene === "forest") this.drawScene(this.images.forest, time, "forest");
    if (this.scene === "bakery") this.drawScene(this.images.bakery, time, "bakery");
    if (this.scene === "muji-room") this.drawMujiRoomScene(time);
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

  private drawScene(image: HTMLImageElement, time: number, kind: "forest" | "bakery"): void {
    const scale = this.canvas.width / 960;
    const sourceW = kind === "forest" ? 1536 : 1536;
    const sourceH = kind === "forest" ? 864 : 510;
    const cameraX = Math.max(0, Math.min(sourceW - 960, this.player.x - 480));
    const cameraY = kind === "forest" ? Math.max(0, Math.min(sourceH - 540, this.player.y - 390)) : 0;
    this.ctx.drawImage(image, cameraX, cameraY, 960, 540, 0, 0, this.canvas.width, this.canvas.height);
    this.particles.draw(this.ctx, time, this.settings.rain && kind === "forest", cameraX, cameraY, scale);
    if (kind === "forest") this.drawDoors(cameraX, cameraY, scale);
    if (kind === "bakery") {
      this.drawMemorySpot(cameraX, cameraY, scale, time);
      this.ctx.drawImage(this.images.friend, (600 - cameraX) * scale - 21 * scale, (430 - cameraY) * scale - 68 * scale, 42 * scale, 68 * scale);
    }
    this.drawMuji({ x: (this.player.x - cameraX) * scale, y: (this.player.y - cameraY) * scale }, time, scale);
    const vignette = this.ctx.createRadialGradient(this.canvas.width / 2, this.canvas.height / 2, 120, this.canvas.width / 2, this.canvas.height / 2, this.canvas.height * 0.72);
    vignette.addColorStop(0, "rgba(0,0,0,0)");
    vignette.addColorStop(1, "rgba(0,0,0,.52)");
    this.ctx.fillStyle = vignette;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }

  private drawMemorySpot(cameraX: number, cameraY: number, scale: number, time: number): void {
    const x = (bakeryMemorySpot.x - cameraX) * scale;
    const y = (bakeryMemorySpot.y - cameraY) * scale;
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

  private drawDoors(cameraX: number, cameraY: number, scale: number): void {
    for (const door of this.allDoors()) {
      const x = (door.x - cameraX) * scale;
      const y = (door.y - cameraY) * scale;
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
    const scale = this.canvas.width / 960;
    this.ctx.drawImage(this.images.room, 0, 0, this.canvas.width, this.canvas.height);
    if (!this.images.room.complete || this.images.room.naturalWidth === 0) this.drawRoomFallback(scale);
    this.drawRoomResidue(scale);
    if (this.room.lampOn) this.drawLampGlow(scale);
    this.drawMuji({ x: this.player.x * scale, y: this.player.y * scale }, time, scale);
    if (this.room.windowFocus) {
      this.ctx.fillStyle = "rgba(8, 14, 24, .22)";
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
      this.drawWindowFocus(time, scale);
    }
    for (const interaction of roomInteractions) {
      if (interaction.id === "residue" && !this.room.residueIds?.length) continue;
      this.drawRoomInteractionHint(interaction, this.activeRoomInteraction?.id === interaction.id, time, scale);
    }
  }

  private drawRoomInteractionHint(interaction: RoomInteraction, active: boolean, time: number, scale: number): void {
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

  private drawWindowFocus(time: number, scale: number): void {
    const x = 286 * scale;
    const y = 56 * scale;
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

  private drawLampGlow(scale: number): void {
    const glow = this.ctx.createRadialGradient(220 * scale, 166 * scale, 8 * scale, 220 * scale, 166 * scale, 170 * scale);
    glow.addColorStop(0, "rgba(255, 221, 141, .46)");
    glow.addColorStop(1, "rgba(255, 193, 98, 0)");
    this.ctx.fillStyle = glow;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }

  private drawRoomResidue(scale: number): void {
    if (!this.room.residueIds?.length) return;
    this.ctx.fillStyle = "#d5b06d";
    this.ctx.fillRect(542 * scale, 300 * scale, 38 * scale, 18 * scale);
    this.ctx.fillStyle = "#7f5937";
    this.ctx.fillRect(550 * scale, 306 * scale, 48 * scale, 10 * scale);
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
    const text = this.scene === "forest" && this.activeDoor ? `Press E · ${this.activeDoor.date} ${this.activeDoor.title}` : this.scene === "bakery" && this.activeObject ? `Press E · ${this.activeObject}` : this.scene === "muji-room" && this.activeRoomInteraction ? `Press E · ${this.activeRoomInteraction.label}` : "WASD / arrows · E / Enter";
    const exit = this.scene === "forest" ? "" : `<button data-action="forest">Exit to forest</button>`;
    const html = `<div class="prompt">${text}</div><div class="hud-actions"><button data-action="menu">Menu</button>${exit}<button data-action="music">Music: ${this.settings.musicEnabled ? "On" : "Off"}</button><button data-action="compact">${this.settings.compact ? "960x540" : "480x270"}</button><button data-action="fullscreen">Fullscreen</button><button data-action="rain">Rain: ${this.settings.rain ? "On" : "Off"}</button><button data-action="mute">${this.settings.muted ? "Sound Off" : "Sound On"}</button></div>`;
    if (html !== this.lastHudHtml) {
      this.hud.innerHTML = html;
      this.lastHudHtml = html;
    }
  }

  private settingsContent(): string {
    return `
      <div class="module-grid">
        <button data-action="home">Today / Home<span>Write today or continue gently</span></button>
        <button data-action="open-diary-editor">Journal<span>${this.diaryEntries.length} diary entries</span></button>
        <button data-action="open-map">Walk Back Home<span>${this.allDoors().length} forest memories</span></button>
        <button data-action="open-room">Muji Room<span>Present-tense rest space</span></button>
      </div>
      <div class="settings-row"><button data-action="music">Music: ${this.settings.musicEnabled ? "On" : "Off"}</button><button data-action="rain">Rain: ${this.settings.rain ? "On" : "Off"}</button><button data-action="mute">${this.settings.muted ? "Sound Off" : "Sound On"}</button><button data-action="compact">${this.settings.compact ? "960x540" : "480x270"}</button><button data-action="reset-journey">Begin Again</button><button data-action="forest">Return to Forest</button><button data-action="close">Close</button></div>`;
  }

  private showHome(): void {
    const today = new Date().toISOString().slice(0, 10);
    const recent = getDiaryTimeline(this.makeDiaryLibrary()).slice(0, 3).map((entry) => `<li>${this.escapeHtml(entry.date)} · ${this.escapeHtml(entry.title)}</li>`).join("");
    this.overlay.innerHTML = `<div class="modal game-panel"><h2>Today / Home</h2><p>${today}</p><div class="settings-row"><button data-action="write-today">Write Today</button><button data-action="continue">Continue</button><button data-action="open-map">Walk Back Home</button></div><h3>Recent diary</h3><ul>${recent || "<li>No diary entries yet.</li>"}</ul><button data-action="close">Close</button></div>`;
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

  private showTimeline(): void {
    const rows = getDiaryTimeline(this.makeDiaryLibrary()).map((entry) => `<li>${this.escapeHtml(entry.date)} · ${this.escapeHtml(entry.title)} · ${entry.memoryKind}${entry.hasScrapbookLayout ? " · scrapbook page" : ""}</li>`).join("");
    this.overlay.innerHTML = `<div class="modal game-panel"><h2>Diary Timeline</h2><p>These are days that happened. The Forest only shows entries you classify as fragments or chapters.</p><ul>${rows || "<li>No diary entries yet.</li>"}</ul><button data-action="open-diary-editor">Journal</button><button data-action="settings">Back</button><button data-action="forest">Return to Forest</button><button data-action="close">Close</button></div>`;
    this.focusStage();
  }

  private showMap(): void {
    const doors = this.allDoors().map((door) => {
      const state = this.isChapterNode(door) ? this.progressFor(this.chapterIdFor(door)).state : "fragment";
      return `<button data-action="enter-door" data-door="${this.escapeHtml(door.id)}">${this.escapeHtml(door.date)} ${this.escapeHtml(door.title)}<span>${state === "walkedThrough" ? "Remember" : state}</span></button>`;
    }).join("");
    this.overlay.innerHTML = `<div class="modal game-panel"><h2>Walk Back Home</h2><p>The Forest contains only memory fragments and authored chapter doors.</p><div class="settings-row">${doors || "<p>No forest-visible diary entries yet.</p>"}</div><button data-action="open-diary-editor">Journal</button><button data-action="settings">Back</button><button data-action="forest">Return to Forest</button><button data-action="close">Close</button></div>`;
    this.focusStage();
  }

  private showDiaryEditor(editId = ""): void {
    const editing = this.diaryEntries.find((entry) => entry.id === editId) ?? this.diaryEntries[0];
    const today = new Date().toISOString().slice(0, 10);
    const dateValue = editing?.date ?? today;
    const parsedDate = new Date(`${dateValue}T00:00:00`);
    const weekday = Number.isNaN(parsedDate.getTime()) ? "" : ["周日", "周一", "周二", "周三", "周四", "周五", "周六"][parsedDate.getDay()];
    const selectedMood = editing?.mood ?? "calm";
    const moodButtons = diaryMoodOptions.map((mood) => `
      <button class="journal-mood-option ${selectedMood === mood.value ? "selected" : ""}" data-action="set-diary-mood" data-mood="${mood.value}" aria-label="${this.escapeHtml(mood.label)}">
        <span class="mood-muji mood-${mood.value}" aria-hidden="true"></span>
        <small>${this.escapeHtml(mood.label)}</small>
      </button>`).join("");
    this.activeScrapbookEntryId = editing?.id ?? "";
    const elementIds = new Set((editing?.scrapbookLayout?.elements ?? []).map((element) => element.id));
    if (!this.selectedScrapbookElementId || !elementIds.has(this.selectedScrapbookElementId)) this.selectedScrapbookElementId = "";
    const rows = this.diaryEntries.length
      ? this.diaryEntries.map((entry) => `<div class="diary-row"><strong>${this.escapeHtml(entry.date)}</strong><span>${this.escapeHtml(entry.title)}</span><span>${entry.memoryKind}</span><button data-action="edit-diary-entry" data-id="${this.escapeHtml(entry.id)}">Open / Edit</button><button data-action="delete-diary-entry" data-id="${this.escapeHtml(entry.id)}">Delete</button></div>`).join("")
      : `<p class="quiet-line">No custom diary dates yet.</p>`;
    const photos = editing?.photos?.map((photo) => `
      <div class="photo-chip">
        <img src="${this.escapeHtml(photo.src)}" alt="">
        <span>${this.escapeHtml(photo.caption ?? photo.id)}</span>
        <button data-action="add-photo-to-scrapbook" data-photo="${this.escapeHtml(photo.id)}">Place</button>
        <button data-action="cutout-photo" data-photo="${this.escapeHtml(photo.id)}">Circle cutout</button>
      </div>`).join("") || `<p class="quiet-line">No photos attached yet.</p>`;
    const elements = [...(editing?.scrapbookLayout?.elements ?? [])]
      .sort((a, b) => a.zIndex - b.zIndex)
      .map((element) => {
        const photoId = element.type === "photo" ? element.photoId : element.sourcePhotoId;
        const photo = editing?.photos?.find((item) => item.id === photoId);
        const selected = element.id === this.selectedScrapbookElementId;
        const cutoutClass = element.type === "cutout" ? ` ${element.crop?.shape === "circle" ? "circle-cutout" : "rect-cutout"}` : "";
        return `<div class="scrapbook-element${cutoutClass} ${selected ? "selected" : ""}" data-action="select-scrapbook-element" data-element="${this.escapeHtml(element.id)}" tabindex="0" style="left:${element.x}%;top:${element.y}%;transform:translate(-50%, -50%) rotate(${element.rotation}deg) scale(${element.scale});z-index:${element.zIndex};">${photo ? `<img src="${this.escapeHtml(photo.src)}" alt="">` : `<span>Missing photo</span>`}${selected ? `<div class="element-controls" style="transform:rotate(${-element.rotation}deg) scale(${1 / element.scale});"><button data-action="scrapbook-delete" aria-label="Delete visual">×</button><button data-action="scrapbook-rotate" data-delta="-8" aria-label="Rotate left">↶</button><button data-action="scrapbook-rotate" data-delta="8" aria-label="Rotate right">↷</button><button data-action="scrapbook-resize" data-delta="0.1" aria-label="Bigger">+</button><button data-action="scrapbook-resize" data-delta="-0.1" aria-label="Smaller">−</button></div>` : ""}</div>`;
      }).join("");
    this.overlay.innerHTML = `
      <div class="modal game-panel diary-editor diary-page-editor journal-modal" data-entry="${this.escapeHtml(editing?.id ?? "")}">
        <div class="journal-toolbar">
          <button class="journal-icon-button" data-action="settings" aria-label="Back">‹</button>
          <div class="journal-brand">
            <span class="journal-mascot mood-${selectedMood}" aria-hidden="true"></span>
            <div><h2>Walk Back Home</h2><p>Diary · Muji Edition</p></div>
          </div>
          <div class="journal-actions">
            <button class="journal-icon-button" aria-label="Undo">↶</button>
            <button class="journal-icon-button" aria-label="Redo">↷</button>
            <button class="journal-icon-button" data-action="open-timeline" aria-label="Timeline">⋯</button>
            <label class="journal-upload">＋<input id="diary-photo-input" type="file" accept="image/*"></label>
            <button class="journal-done" data-action="save-diary-entry" data-id="${this.escapeHtml(editing?.id ?? "")}">✓ 完成</button>
          </div>
        </div>
        <section class="diary-paper scrapbook-page journal-sheet" aria-label="Diary page">
          <div class="paper-rings" aria-hidden="true"></div>
          <div class="journal-page-inner">
            <div class="journal-sticker-title">今日记录</div>
            <div class="journal-meta-card">
              <label><span>▣ 日期：</span><input id="diary-date" type="date" value="${this.escapeHtml(dateValue)}"></label>
              <div class="journal-weekday">${this.escapeHtml(weekday)}</div>
              <label><span>▮ 标题：</span><input id="diary-title" value="${this.escapeHtml(editing?.title ?? "今天其实没发生什么特别的")}"></label>
              <div></div>
              <label><span>● 地点：</span><input value="宿舍 · Muji Room" readonly></label>
              <div></div>
              <label><span>☁ 天气：</span><input value="小雨转阴" readonly></label>
              <div></div>
            </div>
            <figure class="journal-hero-photo">
              <div class="journal-hero-scene">
                <img src="${assets.room}" alt="">
                <span class="journal-photo-muji mood-${selectedMood}" aria-hidden="true"></span>
                <figcaption>好好记录，<br>慢慢回家。</figcaption>
              </div>
            </figure>
            <label class="journal-body-field"><textarea id="diary-body" rows="12">${this.escapeHtml(editing?.body ?? "")}</textarea></label>
            <div class="journal-mood-picker"><input id="diary-mood" type="hidden" value="${selectedMood}">${moodButtons}</div>
          </div>
          ${elements}
        </section>
        <div class="integrated-tools journal-photo-dock">
          <aside class="photo-tray">${photos}</aside>
        </div>
        <div class="journal-lower-tools"><p class="autosave-state" id="diary-save-state">Saved</p><label class="journal-kind">Memory<select id="diary-memory-kind"><option value="diary" ${editing?.memoryKind === "diary" ? "selected" : ""}>Diary only</option><option value="fragment" ${editing?.memoryKind === "fragment" ? "selected" : ""}>Memory Fragment</option><option value="chapter" ${editing?.memoryKind === "chapter" ? "selected" : ""}>Memory Chapter</option></select></label><button data-action="show-import-diary">Import Existing Diary</button><button data-action="open-map">Walk Back Home</button><button data-action="forest">Return to Forest</button><button data-action="close">Close</button></div>
        <div class="diary-list">${rows}</div>
      </div>`;
    this.focusStage();
  }

  private saveDiaryEntry(id = ""): void {
    const entry = this.readDiaryDraftFromOverlay(id);
    if (!entry) return;
    const index = this.diaryEntries.findIndex((item) => item.id === entry.id);
    this.applyDiaryLibrary(upsertDiaryPageDraft(this.makeDiaryLibrary(), entry));
    this.selectedChapter = entry.title;
    this.showToast(index >= 0 ? "Diary updated" : "Diary entry added");
    this.showDiaryEditor(entry.id);
    this.autosave();
  }

  private readDiaryDraftFromOverlay(id = ""): DiaryEntry | null {
    const dateInput = this.overlay.querySelector<HTMLInputElement>("#diary-date");
    const titleInput = this.overlay.querySelector<HTMLInputElement>("#diary-title");
    const bodyInput = this.overlay.querySelector<HTMLTextAreaElement>("#diary-body");
    const kindInput = this.overlay.querySelector<HTMLSelectElement>("#diary-memory-kind");
    const moodInput = this.overlay.querySelector<HTMLInputElement>("#diary-mood");
    const date = dateInput?.value.trim() ?? "";
    const title = titleInput?.value.trim() || "Untitled Memory";
    const body = bodyInput?.value.trim() ?? "";
    if (!date) {
      this.showToast("Date and diary text are required");
      return null;
    }
    const existing = this.diaryEntries.find((item) => item.id === id);
    const memoryKind = (kindInput?.value as MemoryKind | undefined) ?? "diary";
    const moodValue = moodInput?.value ?? "";
    const mood = isDiaryMood(moodValue) ? moodValue : existing?.mood ?? "calm";
    return {
      ...makeDiaryEntry(date, title, body, id || existing?.id, memoryKind),
      mood,
      photos: existing?.photos ?? [],
      scrapbookLayout: existing?.scrapbookLayout ?? { elements: [] }
    };
  }

  private handleInput(event: Event): void {
    const target = event.target as HTMLElement;
    if (!target.closest(".diary-page-editor")) return;
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

  private showImportDiary(): void {
    this.overlay.innerHTML = `
      <div class="modal game-panel diary-editor">
        <h2>Import Existing Diary</h2>
        <p class="quiet-line">Use fictional or personal runtime text only. Imported entries default to Diary only.</p>
        <label>Diary lines<textarea id="diary-import" rows="8" placeholder="2026-08-06 | Rain Letter | I kept thinking about the yellow bakery light."></textarea></label>
        <button data-action="import-diary-lines">Import Lines</button>
        <button data-action="open-diary-editor">Back to Journal</button>
        <button data-action="close">Close</button>
      </div>`;
    this.focusStage();
  }

  private importDiaryLines(): void {
    const importInput = this.overlay.querySelector<HTMLTextAreaElement>("#diary-import");
    const imported = parseDiaryImport(importInput?.value ?? "");
    if (!imported.length) {
      this.showToast("Use: YYYY-MM-DD | Title | Diary text");
      return;
    }
    for (const entry of imported) {
      const existing = this.diaryEntries.findIndex((item) => item.id === entry.id);
      this.applyDiaryLibrary(upsertDiaryEntry(this.makeDiaryLibrary(), entry));
    }
    this.showToast(`Imported ${imported.length} diary date${imported.length === 1 ? "" : "s"}`);
    this.showDiaryEditor();
    this.autosave();
  }

  private deleteDiaryEntry(id: string): void {
    const entry = this.diaryEntries.find((item) => item.id === id);
    this.applyDiaryLibrary(deleteDiaryEntryById(this.makeDiaryLibrary(), id));
    if (entry) {
      this.visitedMemories.delete(entry.id);
      this.walkedThroughMemories.delete(entry.id);
      this.readMemories.delete(entry.id);
      if (this.currentDoor?.id === entry.id) this.currentDoor = null;
      this.showToast("Diary date deleted");
    }
    this.showDiaryEditor();
    this.autosave();
  }

  private setDiaryMemoryKind(id: string, memoryKind: MemoryKind): void {
    const index = this.diaryEntries.findIndex((entry) => entry.id === id);
    if (index < 0) return;
    this.diaryEntries[index] = updateDiaryMemoryKind(this.diaryEntries[index], memoryKind);
    this.showDiaryEditor(id);
    this.autosave();
  }

  private setDiaryMood(mood: string): void {
    if (!isDiaryMood(mood)) return;
    const editor = this.overlay.querySelector<HTMLElement>(".diary-page-editor");
    const entryId = editor?.dataset.entry ?? "";
    const draft = this.readDiaryDraftFromOverlay(entryId);
    if (!draft) return;
    this.applyDiaryLibrary(upsertDiaryPageDraft(this.makeDiaryLibrary(), { ...draft, mood }));
    this.showDiaryEditor(draft.id);
    this.autosave();
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
    this.autosave();
  }

  private activeScrapbookEntry(): DiaryEntry | null {
    return this.diaryEntries.find((entry) => entry.id === this.activeScrapbookEntryId) ?? null;
  }

  private async handleChange(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    if (input.id === "vinyl-cover-input") {
      await this.handleVinylCoverInput(input);
      return;
    }
    if (input.id !== "scrapbook-photo-input" && input.id !== "diary-photo-input") return;
    if (!input.files?.[0]) return;
    const entry = this.activeScrapbookEntry();
    if (!entry) return;
    const file = input.files[0];
    const src = await this.readFileAsDataUrl(file);
    const photoId = `photo-${Date.now()}`;
    const storageKey = `diary-images/${entry.id}/${photoId}`;
    const attached = addPhotoAttachment(entry, { id: photoId, storageKey, src, caption: file.name });
    const withPlacedPhoto = input.id === "diary-photo-input" ? addPhotoElement(attached, photoId, `element-${Date.now()}`) : attached;
    this.selectedScrapbookElementId = withPlacedPhoto.scrapbookLayout?.elements.at(-1)?.id ?? this.selectedScrapbookElementId;
    this.updateDiaryEntry(withPlacedPhoto);
    if (input.id === "diary-photo-input") this.showDiaryEditor(entry.id);
    else this.showScrapbookComposer(entry.id);
    this.showToast("Photo attached");
  }

  private readFileAsDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.addEventListener("load", () => resolve(String(reader.result ?? "")));
      reader.addEventListener("error", () => reject(reader.error));
      reader.readAsDataURL(file);
    });
  }

  private async handleVinylCoverInput(input: HTMLInputElement): Promise<void> {
    const file = input.files?.[0];
    const recordId = this.room.selectedVinylId ?? this.availableVinylRecords[0]?.id;
    if (!file || !recordId) return;
    const src = await this.readFileAsDataUrl(file);
    this.room = withCustomVinylCover(this.room, recordId, src);
    this.showRecords();
    this.showToast("Cover changed");
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
    this.scene = "muji-room";
    this.player = { ...roomSpawn };
    this.activeDoor = null;
    this.activeObject = "";
    this.activeRoomInteraction = null;
    this.overlay.classList.remove("dialogue-open");
    this.overlay.innerHTML = "";
    this.focusStage();
    this.showToast("Returned to the room");
    if (this.room.vinylPlaying) this.playVinylMusic();
    else this.playSceneMusic("forest");
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
    this.overlay.innerHTML = `<div class="modal"><h2>Reflection Note</h2><label class="reflection-note">Optional note<textarea id="room-reflection-note" rows="5">${this.escapeHtml(this.room.reflectionNote ?? "")}</textarea></label><button data-action="save-room-reflection">Keep note</button><button data-action="close">Close</button></div>`;
    this.focusStage();
  }

  private saveRoomReflection(): void {
    const note = this.overlay.querySelector<HTMLTextAreaElement>("#room-reflection-note")?.value.trim() ?? "";
    this.room.reflectionNote = note;
    if (note) this.room.reflections.push(`Reflection: ${note}`);
    this.overlay.innerHTML = "";
    this.showToast(note ? "Reflection kept" : "Reflection left empty");
    this.autosave();
  }

  private roomDiary(): void {
    this.showDiaryEditor();
  }

  private inspectRoomResidue(): void {
    const line = this.room.residueIds?.length ? "那块面包还是那么小。" : "The desk is still mostly empty.";
    this.overlay.innerHTML = `<div class="modal"><h2>Residue</h2><p>${this.escapeHtml(line)}</p><button data-action="close">Close</button></div>`;
    this.focusStage();
  }

  private showRecords(): void {
    const current = this.room.selectedVinylId ?? this.availableVinylRecords[0].id;
    const currentRecord = this.availableVinylRecords.find((record) => record.id === current) ?? this.availableVinylRecords[0];
    const cover = this.room.vinylCovers?.[currentRecord.id] ?? "";
    const records = this.availableVinylRecords.map((record, index) => `<button class="${record.id === current ? "selected" : ""}" data-action="select-vinyl" data-record="${this.escapeHtml(record.id)}"><span>${index + 1}. ${this.escapeHtml(record.title)}</span><small>${record.id === current ? "Now playing" : this.escapeHtml(record.subtitle ?? "record")}</small></button>`).join("");
    const actions = vinylPlayerActions();
    this.overlay.innerHTML = `
      <div class="modal game-panel records-panel">
        <div class="vinyl-console">
          <div class="turntable-card">
            <div class="turntable-lid"></div>
            <div class="record-disc ${this.room.vinylPlaying ? "playing" : ""}" style="${cover ? `--cover:url('${this.escapeHtml(cover)}')` : ""}"><span></span></div>
            <div class="tone-arm"></div>
            <label class="cover-upload">Custom Cover<input id="vinyl-cover-input" type="file" accept="image/*"></label>
          </div>
          <div class="now-playing">
            <small>Now Playing</small>
            <h2>${this.escapeHtml(currentRecord.title)}</h2>
            <p>${this.escapeHtml(currentRecord.sideA?.title ?? "Side A")}</p>
            <div class="vinyl-controls">
              ${actions.includes("toggle-play") ? `<button data-action="vinyl-pause">${this.room.vinylPlaying ? "Pause" : "Play"}</button>` : ""}
              ${actions.includes("close") ? `<button data-action="close">Close</button>` : ""}
            </div>
          </div>
          <div class="record-list">${records}</div>
        </div>
      </div>`;
    this.focusStage();
  }

  private selectVinyl(recordId: string): void {
    this.room = this.selectAvailableVinylRecord(recordId);
    this.playVinylMusic();
    this.showRecords();
    this.showToast("Record changed");
    this.autosave();
  }

  private pauseVinyl(): void {
    this.room.vinylPlaying = !this.room.vinylPlaying;
    if (this.room.vinylPlaying) this.playVinylMusic();
    else this.audio.pause();
    this.showRecords();
    this.autosave();
  }

  private selectAvailableVinylRecord(recordId: string): typeof this.room {
    const record = this.availableVinylRecords.find((item) => item.id === recordId) ?? this.availableVinylRecords[0];
    return selectVinylRecord({ ...this.room, selectedVinylId: record.id }, record.id, this.availableVinylRecords);
  }

  private makeDiaryLibrary(): DiaryLibraryState {
    return {
      version: 1,
      savedAt: new Date().toISOString(),
      entries: this.diaryEntries,
      legacyArtifacts: this.legacyArtifacts
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
      room: this.room,
      finalJourney: []
    };
  }

  private applyDiaryLibrary(state: DiaryLibraryState): void {
    this.diaryEntries = state.entries;
    this.legacyArtifacts = state.legacyArtifacts;
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
    this.room = { ...this.room, ...state.room };
    this.audio.setVolume(this.settings.volume);
    this.audio.setMuted(this.settings.muted);
    if (this.scene === "muji-room" && this.room.vinylPlaying) this.playVinylMusic();
    else this.playSceneMusic(this.scene === "forest" || this.scene === "muji-room" ? "forest" : "bakery");
  }

  private autosave(): void {
    this.save.saveDiaryLibrary(this.makeDiaryLibrary());
    this.save.saveJourney(this.makeJourney());
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
    this.chapterProgress.clear();
    this.room = createDefaultRoomState();
    this.save.resetJourney();
    this.save.saveDiaryLibrary(this.makeDiaryLibrary());
    this.showToast("Your diary will stay. The walk begins again.");
    this.overlay.innerHTML = "";
  }

  private showSettings(): void {
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
      if (this.scene === "muji-room" && this.room.vinylPlaying) this.playVinylMusic();
      else this.playSceneMusic(this.scene === "forest" ? "forest" : "bakery");
      this.showToast("Music on");
    } else {
      this.settings.muted = true;
      this.audio.setMuted(true);
      this.showToast("Music off");
    }
    this.lastHudHtml = "";
    this.autosave();
  }

  private playSceneMusic(scene: MusicScene): void {
    this.settings.musicScene = scene;
    this.audio.setScene(scene);
    if (this.settings.musicEnabled && !this.settings.muted) void this.audio.ensurePlaying();
    this.musicPlayer.innerHTML = "";
    this.lastHudHtml = "";
  }

  private async loadVinylManifest(): Promise<void> {
    try {
      const response = await fetch("assets/audio-manifest.json");
      if (!response.ok) return;
      const manifest = await response.json() as { files?: string[] };
      const generated = vinylRecordsFromAudioFiles(manifest.files ?? []);
      if (generated.length) {
        this.availableVinylRecords = generated;
        if (!this.availableVinylRecords.some((record) => record.id === this.room.selectedVinylId)) {
          this.room.selectedVinylId = this.availableVinylRecords[0].id;
        }
      }
    } catch {
      this.availableVinylRecords = vinylRecords;
    }
  }

  private playVinylMusic(): void {
    const track = currentVinylTrack(this.room, this.availableVinylRecords);
    this.audio.setTrack(track.src);
    if (this.settings.musicEnabled && !this.settings.muted) void this.audio.ensurePlaying();
    this.musicPlayer.innerHTML = "";
    this.lastHudHtml = "";
  }

  private async toggleFullscreen(): Promise<void> {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen?.();
        this.showToast("Fullscreen off");
        return;
      }
      await document.documentElement.requestFullscreen?.();
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
