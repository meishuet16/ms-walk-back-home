import { bakeryChapter, forestDoors } from "./fixtures/chapterPlan.js";
import type { Choice, SaveState, SceneId, Tendencies } from "./types.js";
import { AudioManager } from "./systems/AudioManager.js";
import { inAnyRect, type Point, type Rect } from "./systems/CollisionSystem.js";
import { DialogueSystem } from "./systems/DialogueSystem.js";
import { resolveEnding, type Ending } from "./systems/EndingResolver.js";
import { InputManager } from "./systems/InputManager.js";
import { ParticleSystem } from "./systems/ParticleSystem.js";
import { SaveManager } from "./systems/SaveManager.js";
import type { MusicScene } from "./systems/SceneMusic.js";
import { emptyTendencies } from "./systems/TendencySystem.js";

type Door = (typeof forestDoors)[number];

const assets = {
  forest: "assets/forest.png",
  bakery: "assets/bakery.png",
  muji: "assets/muji-sheet.png",
  friend: "assets/friend-a.png",
  room: "assets/room-panel.jpg",
  map: "assets/map-panel.jpg",
  scrapbook: "assets/scrapbook-panel.jpg",
  timeline: "assets/timeline-panel.jpg"
};

const bakeryMemorySpot = { x: 735, y: 325 };

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
    friend: img(assets.friend)
  };
  private scene: SceneId = "title";
  private player: Point = { x: 880, y: 690 };
  private facing = 0;
  private frame = 0;
  private last = performance.now();
  private activeDoor: Door | null = null;
  private currentDoor: Door | null = null;
  private activeObject = "";
  private lastHudHtml = "";
  private tendencies: Tendencies = emptyTendencies();
  private completedChapters = new Set<string>();
  private openedDoors = new Set<string>();
  private choices: string[] = [];
  private readMemories = new Set<string>();
  private scrapbook = new Set(["A warm door in the forest"]);
  private favorites = new Set<string>();
  private timelineCompleted = new Set<string>();
  private selectedChapter = "Yumido Bread";
  private settings = { rain: true, muted: false, volume: 0.45, compact: false, reducedMotion: false, musicEnabled: true, musicScene: "bakery" as MusicScene };
  private room = { visits: 0, gifts: 0, outfit: "raincoat", diary: ["Muji put the water bottle on a tiny table and listened to the room breathe."], water: 2, warmth: 2, stickers: 0, letters: 0 };
  private dialogue = new DialogueSystem(bakeryChapter.dialogue);
  private ending: Ending | null = null;

  constructor(private root: HTMLElement) {
    root.innerHTML = `
      <div class="game-shell">
        <header class="top-menu">
          <div><strong>Walk Back Home</strong><span>A gentle walk through memories that still glow.</span></div>
          <nav>
            <button data-action="new">New Memory</button>
            <button data-action="continue">Continue</button>
            <button data-action="load">Load</button>
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
    root.addEventListener("pointerdown", () => void this.audio.ensurePlaying(), { passive: true });
    root.addEventListener("keydown", () => void this.audio.ensurePlaying());
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
    if (action === "new") this.newMemory();
    if (action === "continue") this.loadAutosave();
    if (action === "load") this.showSaveLoad();
    if (action === "settings") this.showSettings();
    if (action === "credits") this.showCredits();
    if (action === "forest") {
      this.returnToForest();
    }
    if (action === "menu") this.showSettings();
    if (action === "open-scrapbook") this.showScrapbook();
    if (action === "open-timeline") this.showTimeline();
    if (action === "open-map") this.showMap();
    if (action === "open-relationships") this.showRelationships();
    if (action === "open-tendency") this.showTendency();
    if (action === "open-room") this.showMujiRoom();
    if (action === "room-talk") this.roomTalk();
    if (action === "room-water") this.roomWater();
    if (action === "room-warm") this.roomWarm();
    if (action === "room-sticker") this.roomSticker();
    if (action === "room-letter") this.roomLetter();
    if (action === "room-gift") this.roomGift();
    if (action === "room-dress") this.roomDress();
    if (action === "room-diary") this.roomDiary();
    if (action === "compact") this.toggleCompact();
    if (action === "fullscreen") this.toggleFullscreen();
    if (action === "rain") this.toggleRain();
    if (action === "mute") this.toggleAudio();
    if (action === "music") this.toggleSceneMusic();
    if (action === "save") this.saveSlot(Number(target.dataset.slot));
    if (action === "load-slot") this.loadSlot(Number(target.dataset.slot));
    if (action === "delete-slot") this.deleteSlot(Number(target.dataset.slot));
    if (action === "ending") this.resolveAndShowEnding();
    if (action === "close") {
      this.overlay.classList.remove("dialogue-open");
      this.overlay.innerHTML = "";
      this.showToast("Closed");
    }
    if (action === "enter-door") {
      const doorId = target.dataset.door;
      if (doorId) this.currentDoor = forestDoors.find((door) => door.id === doorId) ?? this.currentDoor;
      this.enterBakery();
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
    this.draw(time);
    requestAnimationFrame((next) => this.loop(next));
  }

  private newMemory(): void {
    this.scene = "forest";
    this.player = { x: 880, y: 690 };
    this.currentDoor = null;
    this.ending = null;
    this.tendencies = emptyTendencies();
    this.completedChapters.clear();
    this.openedDoors.clear();
    this.choices = [];
    this.readMemories.clear();
    this.scrapbook = new Set(["A warm door in the forest"]);
    this.timelineCompleted.clear();
    this.overlay.classList.remove("dialogue-open");
    this.overlay.innerHTML = "";
    this.focusStage();
    this.audio.ping("forest");
    this.playSceneMusic("forest");
    this.autosave();
  }

  private loadAutosave(): void {
    const saved = this.save.loadAutosave();
    if (saved) {
      this.applySave(saved);
      this.showToast("Continued autosave");
      this.focusStage();
    } else {
      this.newMemory();
      this.showToast("No autosave, started new");
    }
  }

  private updateForest(x: number, y: number, dt: number): void {
    this.move(x, y, dt, [{ x: 0, y: 0, w: 1536, h: 88 }, { x: 0, y: 0, w: 120, h: 864 }, { x: 1428, y: 0, w: 108, h: 864 }, { x: 0, y: 780, w: 1536, h: 125 }], []);
    this.activeDoor = forestDoors.find((door) => Math.hypot(this.player.x - door.x, this.player.y - door.y) < 86) ?? null;
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
    if (this.scene === "ending") this.returnToForest();
  }

  private currentMemoryKey(): string {
    return this.currentDoor?.chapterId ?? bakeryChapter.id;
  }

  private previewDoor(door: Door): void {
    this.openedDoors.add(door.id);
    this.currentDoor = door;
    this.overlay.innerHTML = `<div class="modal"><h2>${door.date} · ${door.title}</h2><p>A warm Bakery memory hums inside the branches.</p><p>Muji does not go back to fix it. Muji goes back to walk beside it.</p><button data-action="enter-door">Enter Bakery memory</button><button data-action="forest">Exit to forest</button><button data-action="close">Stay in forest</button></div>`;
    this.focusStage();
  }

  private enterBakery(): void {
    this.currentDoor ??= this.activeDoor ?? forestDoors[1];
    this.scene = "bakery";
    this.player = { x: 450, y: 420 };
    this.dialogue = new DialogueSystem(bakeryChapter.dialogue);
    this.overlay.classList.remove("dialogue-open");
    this.overlay.innerHTML = "";
    this.focusStage();
    this.showToast("Entered Bakery memory");
    this.audio.ping("bakery");
    this.playSceneMusic("bakery");
    this.autosave();
  }

  private resetBakeryDialogue(): void {
    this.dialogue = new DialogueSystem(bakeryChapter.dialogue);
    this.showToast("Friend A is ready to talk again");
  }

  private showDiaryMemory(): void {
    const door = this.currentDoor ?? forestDoors[1];
    this.readMemories.add(door.chapterId);
    this.scrapbook.add(`${door.title}: the diary on the bakery counter`);
    const lines = (bakeryChapter.memoryText ?? []).map((line, index) => index === 0 ? `<h2>${door.date} · ${door.title}</h2>` : `<p>${line}</p>`).join("");
    this.overlay.innerHTML = `<div class="modal diary-memory">${lines}<button data-action="close">Close</button><button data-action="forest">Exit to forest</button></div>`;
    this.showToast("Diary memory read");
    this.focusStage();
    this.autosave();
  }

  private inspectPastry(): void {
    this.scrapbook.add("Bakery counter: a pastry that stayed small");
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
    return Object.entries(choice.effects)
      .filter(([, value]) => value)
      .map(([key, value]) => `${key} ${value! > 0 ? "+" : ""}${value}`)
      .join(" · ");
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
        this.choices.push(choice.id);
        this.showToast(`Choice: ${choice.label} · ${this.choiceEffectLabel(choice)}`);
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
    this.completeBakeryProgress();
    this.ending = resolveEnding(this.tendencies, this.scrapbook.size >= 4 ? 3 : 0);
    this.overlay.classList.remove("dialogue-open");
    this.overlay.innerHTML = `<div class="modal ending-quote"><span class="ending-kicker">after the conversation</span><h2>${this.ending.title}</h2><p>${this.ending.body}</p><blockquote>${this.ending.lines.join("<br>")}</blockquote><p class="ending-afterline">Some doors do not forgive us. They simply stop asking us to be the person we were when we left.</p><button data-action="close">Close</button><button data-action="forest">Exit to forest</button></div>`;
    this.audio.ping("ending");
  }

  private finishBakery(): void {
    const door = this.completeBakeryProgress();
    this.scene = "forest";
    this.player = { x: door.x, y: Math.min(760, door.y + 120) };
    this.overlay.innerHTML = `<div class="modal"><h2>Memory complete</h2><p>The scrapbook has a new page. The timeline keeps the day as it was.</p><button data-action="close">Return</button><button data-action="ending">Resolve ending</button><button data-action="forest">Exit to forest</button></div>`;
    this.autosave();
  }

  private completeBakeryProgress(): Door {
    const door = this.currentDoor ?? forestDoors[1];
    this.completedChapters.add(door.chapterId);
    this.timelineCompleted.add(door.title);
    this.scrapbook.add(`${door.title}: the small pastry stayed small`);
    this.selectedChapter = door.title;
    return door;
  }

  private resolveAndShowEnding(): void {
    this.ending = resolveEnding(this.tendencies, this.scrapbook.size >= 4 ? 3 : 0);
    this.scene = "ending";
    this.overlay.innerHTML = "";
    this.audio.ping("ending");
    this.autosave();
  }

  private returnToForest(): void {
    const leavingDoor = this.scene === "bakery" ? this.completeBakeryProgress() : null;
    this.scene = "forest";
    this.overlay.classList.remove("dialogue-open");
    this.overlay.innerHTML = "";
    this.player = leavingDoor ? { x: leavingDoor.x, y: Math.min(760, leavingDoor.y + 120) } : { x: 880, y: 690 };
    this.showToast("Exited to forest");
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
    for (const door of forestDoors) {
      const x = (door.x - cameraX) * scale;
      const y = (door.y - cameraY) * scale;
      const active = this.activeDoor?.id === door.id;
      const glow = this.ctx.createRadialGradient(x, y, 4, x, y, (active ? 68 : 44) * scale);
      glow.addColorStop(0, active ? "rgba(255,213,113,.82)" : "rgba(255,184,72,.46)");
      glow.addColorStop(1, "rgba(255,149,44,0)");
      this.ctx.fillStyle = glow;
      this.ctx.beginPath();
      this.ctx.arc(x, y, (active ? 68 : 44) * scale, 0, Math.PI * 2);
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

  private drawEnding(): void {
    const ending = this.ending ?? resolveEnding(this.tendencies);
    this.ctx.fillStyle = "#07101d";
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.fillStyle = "#f2d59a";
    this.ctx.font = "36px Georgia";
    this.ctx.fillText(ending.title, 80, 130);
    this.ctx.font = "18px Georgia";
    this.ctx.fillText(ending.body, 80, 180);
    this.ctx.fillText(ending.lines[0], 80, 250);
    this.ctx.fillText(ending.lines[1], 80, 290);
  }

  private drawHud(): void {
    const text = this.scene === "forest" && this.activeDoor ? `Press E · ${this.activeDoor.date} ${this.activeDoor.title}` : this.scene === "bakery" && this.activeObject ? `Press E · ${this.activeObject}` : "WASD / arrows · E / Enter";
    const exit = this.scene === "forest" ? "" : `<button data-action="forest">Exit to forest</button>`;
    const html = `<div class="prompt">${text}</div><div class="hud-actions"><button data-action="menu">Menu</button>${exit}<button data-action="music">Music: ${this.settings.musicEnabled ? "On" : "Off"}</button><button data-action="compact">${this.settings.compact ? "960x540" : "480x270"}</button><button data-action="fullscreen">Fullscreen</button><button data-action="rain">Rain: ${this.settings.rain ? "On" : "Off"}</button><button data-action="mute">${this.settings.muted ? "Sound Off" : "Sound On"}</button></div>`;
    if (html !== this.lastHudHtml) {
      this.hud.innerHTML = html;
      this.lastHudHtml = html;
    }
  }

  private settingsContent(): string {
    const timelineRows = forestDoors.map((door) => `${door.date} ${door.title} · ${this.timelineCompleted.has(door.title) ? "complete" : "open"}`);
    const tendencyRows = [
      ["Accept", this.tendencies.acceptance + this.tendencies.honesty],
      ["Avoid", this.tendencies.avoidance + this.tendencies.distance],
      ["Revise", this.tendencies.intervention + this.tendencies.concealment],
      ["Stay", this.tendencies.closeness + this.tendencies.companionship]
    ];
    return `
      <div class="module-grid">
        <button data-action="open-scrapbook">AI Scrapbook<span>${this.scrapbook.size} pages</span></button>
        <button data-action="open-timeline">Diary Timeline<span>${timelineRows.filter((item) => item.includes("complete")).length}/${forestDoors.length} complete</span></button>
        <button data-action="open-map">Memory Map<span>${this.scene}</span></button>
        <button data-action="open-relationships">Relationships<span>Friend A</span></button>
        <button data-action="open-tendency">Tendency<span>${tendencyRows.map(([label, score]) => `${label} ${score}`).join(" · ")}</span></button>
        <button data-action="open-room">Muji Room<span>Water ${this.room.water} · Warmth ${this.room.warmth}</span></button>
        <button data-action="load">Save / Load<span>3 slots</span></button>
      </div>
      <div class="settings-row"><button data-action="music">Music: ${this.settings.musicEnabled ? "On" : "Off"}</button><button data-action="rain">Rain: ${this.settings.rain ? "On" : "Off"}</button><button data-action="mute">${this.settings.muted ? "Sound Off" : "Sound On"}</button><button data-action="compact">${this.settings.compact ? "960x540" : "480x270"}</button><button data-action="forest">Exit to forest</button><button data-action="close">Close</button></div>`;
  }

  private showScrapbook(): void {
    const items = [...this.scrapbook].map((item) => `<li>${item}</li>`).join("");
    this.overlay.innerHTML = `<div class="modal game-panel"><h2>AI Scrapbook</h2><p>Fictional memory pages Muji has accepted into the book.</p><ul>${items}</ul><button data-action="settings">Back</button><button data-action="forest">Exit to forest</button><button data-action="close">Close</button></div>`;
    this.focusStage();
  }

  private showTimeline(): void {
    const rows = forestDoors.map((door) => `<li>${door.date} · ${door.title} · ${this.timelineCompleted.has(door.title) ? "complete" : "open"}</li>`).join("");
    this.overlay.innerHTML = `<div class="modal game-panel"><h2>Diary Timeline</h2><ul>${rows}</ul><button data-action="settings">Back</button><button data-action="forest">Exit to forest</button><button data-action="close">Close</button></div>`;
    this.focusStage();
  }

  private showMap(): void {
    const doors = forestDoors.map((door) => `<button data-action="enter-door" data-door="${door.id}">${door.date} ${door.title}</button>`).join("");
    this.overlay.innerHTML = `<div class="modal game-panel"><h2>Memory Map</h2><p>Four forest doors lead into Bakery-shaped memories.</p><div class="settings-row">${doors}</div><button data-action="settings">Back</button><button data-action="forest">Exit to forest</button><button data-action="close">Close</button></div>`;
    this.focusStage();
  }

  private showRelationships(): void {
    this.overlay.innerHTML = `<div class="modal game-panel"><h2>Relationships</h2><p>Friend A remembers quietly. Choices that stay, answer honestly, or rewrite the room change the long-term ending resolver.</p><button data-action="open-room">Visit Muji Room</button><button data-action="settings">Back</button><button data-action="forest">Exit to forest</button><button data-action="close">Close</button></div>`;
    this.focusStage();
  }

  private showTendency(): void {
    const rows = [
      ["Acceptance", this.tendencies.acceptance],
      ["Avoidance", this.tendencies.avoidance],
      ["Closeness", this.tendencies.closeness],
      ["Distance", this.tendencies.distance],
      ["Honesty", this.tendencies.honesty],
      ["Concealment", this.tendencies.concealment],
      ["Companionship", this.tendencies.companionship],
      ["Intervention", this.tendencies.intervention]
    ].map(([label, score]) => `<div class="row"><span>${label}</span><strong>${score}</strong><meter min="0" max="8" value="${score}"></meter></div>`).join("");
    this.overlay.innerHTML = `<div class="modal game-panel"><h2>Tendency</h2>${rows}<button data-action="ending">Resolve Ending</button><button data-action="settings">Back</button><button data-action="forest">Exit to forest</button></div>`;
    this.focusStage();
  }

  private showMujiRoom(): void {
    const diary = this.room.diary.slice(-4).map((line) => `<li>${line}</li>`).join("");
    const waterLevel = Math.min(100, (this.room.water ?? 0) * 20);
    const warmthLevel = Math.min(100, (this.room.warmth ?? 0) * 20);
    const water = this.room.water ?? 0;
    const warmth = this.room.warmth ?? 0;
    const letters = this.room.letters ?? 0;
    this.overlay.innerHTML = `<div class="modal room-module"><h2>Muji Water Bottle Room</h2><div class="bottle-room"><div class="bottle-glass"><div class="water" style="height:${waterLevel}%"></div><div class="lamp" style="opacity:${0.35 + warmthLevel / 150}"></div><div class="muji-bed">${this.room.outfit}</div><div class="stickers">${"*".repeat(this.room.stickers ?? 0)}</div></div><div class="room-meter"><span>Water ${water}</span><meter min="0" max="5" value="${water}"></meter><span>Warmth ${warmth}</span><meter min="0" max="5" value="${warmth}"></meter><span>Letters ${letters}</span></div></div><div class="settings-row"><button data-action="room-water">Fill Water</button><button data-action="room-warm">Warm Lamp</button><button data-action="room-sticker">Place Sticker</button><button data-action="room-letter">Write Letter</button><button data-action="room-dress">Change Outfit</button></div><ul>${diary}</ul><button data-action="settings">Back</button><button data-action="forest">Exit to forest</button><button data-action="close">Close</button></div>`;
    this.focusStage();
  }

  private roomTalk(): void {
    this.room.visits += 1;
    this.room.diary.push(`Muji visit ${this.room.visits}: the room feels a little safer.`);
    this.tendencies.companionship += 1;
    this.showToast("Muji listened");
    this.showMujiRoom();
    this.autosave();
  }

  private roomWater(): void {
    this.room.visits += 1;
    this.room.water = Math.min(5, (this.room.water ?? 0) + 1);
    this.room.diary.push("Muji filled the bottle until the room sounded like slow rain.");
    this.tendencies.acceptance += 1;
    this.showToast("Water filled");
    this.showMujiRoom();
    this.autosave();
  }

  private roomWarm(): void {
    this.room.visits += 1;
    this.room.warmth = Math.min(5, (this.room.warmth ?? 0) + 1);
    this.room.diary.push("The lamp warmed the glass. Nothing hurried.");
    this.tendencies.companionship += 1;
    this.showToast("Lamp warmed");
    this.showMujiRoom();
    this.autosave();
  }

  private roomSticker(): void {
    this.room.gifts += 1;
    this.room.stickers = Math.min(5, (this.room.stickers ?? 0) + 1);
    this.room.diary.push("A small sticker stayed on the bottle wall like a promise.");
    this.tendencies.closeness += 1;
    this.showToast("Sticker placed");
    this.showMujiRoom();
    this.autosave();
  }

  private roomLetter(): void {
    this.room.letters = (this.room.letters ?? 0) + 1;
    this.room.diary.push(`Letter ${this.room.letters}: today I will not make the past prettier before I sit with it.`);
    this.scrapbook.add(`Bottle room letter ${this.room.letters}`);
    this.tendencies.honesty += 1;
    this.showToast("Letter written");
    this.showMujiRoom();
    this.autosave();
  }

  private roomGift(): void {
    this.room.gifts += 1;
    this.room.diary.push(`Gift ${this.room.gifts}: a tiny keepsake was placed near the lamp.`);
    this.tendencies.closeness += 1;
    this.showToast("Gift placed");
    this.showMujiRoom();
    this.autosave();
  }

  private roomDress(): void {
    const outfits = ["raincoat", "bakery apron", "forest scarf"];
    this.room.outfit = outfits[(outfits.indexOf(this.room.outfit) + 1) % outfits.length];
    this.room.diary.push(`Muji changed into ${this.room.outfit}.`);
    this.showToast(`Outfit: ${this.room.outfit}`);
    this.showMujiRoom();
    this.autosave();
  }

  private roomDiary(): void {
    this.room.diary.push(`Diary: ${this.selectedChapter} is still here, but smaller than fear.`);
    this.scrapbook.add(`Room note: ${this.selectedChapter}`);
    this.showToast("Diary updated");
    this.showMujiRoom();
    this.autosave();
  }

  private makeSave(slot?: number): SaveState {
    return {
      version: 1,
      slot,
      savedAt: new Date().toISOString(),
      scene: this.scene,
      player: this.player,
      openedDoors: [...this.openedDoors],
      completedChapters: [...this.completedChapters],
      choices: this.choices,
      tendencies: this.tendencies,
      readMemories: [...this.readMemories],
      scrapbook: [...this.scrapbook],
      favorites: [...this.favorites],
      timelineCompleted: [...this.timelineCompleted],
      selectedChapter: this.selectedChapter,
      settings: this.settings,
      room: this.room,
      endingProgress: this.ending ? [this.ending.id] : []
    };
  }

  private applySave(state: SaveState): void {
    this.scene = state.scene;
    this.player = state.player;
    this.currentDoor = forestDoors.find((door) => door.chapterId === state.completedChapters.at(-1)) ?? null;
    this.openedDoors = new Set(state.openedDoors);
    this.completedChapters = new Set(state.completedChapters);
    this.choices = state.choices;
    this.tendencies = state.tendencies;
    this.readMemories = new Set(state.readMemories ?? []);
    this.scrapbook = new Set(state.scrapbook);
    this.favorites = new Set(state.favorites);
    this.timelineCompleted = new Set(state.timelineCompleted);
    this.selectedChapter = state.selectedChapter;
    this.settings = {
      ...this.settings,
      ...state.settings,
      musicEnabled: state.settings.musicEnabled ?? true,
      musicScene: "bakery"
    };
    this.room = { ...this.room, ...(state.room ?? {}) };
    this.audio.setVolume(this.settings.volume);
    this.audio.setMuted(this.settings.muted);
    this.playSceneMusic("bakery");
  }

  private autosave(): void {
    this.save.autosave(this.makeSave());
  }

  private saveSlot(slot: number): void {
    this.save.save(slot, this.makeSave(slot));
    this.showToast(`Saved Slot ${slot}`);
    this.showSaveLoad();
  }

  private loadSlot(slot: number): void {
    const state = this.save.load(slot);
    if (state) {
      this.applySave(state);
      this.showToast(`Loaded Slot ${slot}`);
    } else {
      this.showToast(`Slot ${slot} is empty`);
    }
    this.overlay.innerHTML = "";
  }

  private deleteSlot(slot: number): void {
    this.save.delete(slot);
    this.showToast(`Deleted Slot ${slot}`);
    this.showSaveLoad();
  }

  private showSaveLoad(): void {
    const rows = this.save.list().map((state, index) => `<div class="save-row"><strong>Slot ${index + 1}</strong><span>${state ? `${state.selectedChapter} · ${new Date(state.savedAt).toLocaleString()}` : "empty"}</span><button data-action="save" data-slot="${index + 1}">Save</button><button data-action="load-slot" data-slot="${index + 1}">Load</button><button data-action="delete-slot" data-slot="${index + 1}">Delete</button></div>`).join("");
    this.overlay.innerHTML = `<div class="modal game-panel"><h2>Save / Load</h2>${rows}<button data-action="settings">Back</button><button data-action="forest">Exit to forest</button><button data-action="close">Close</button></div>`;
    this.focusStage();
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
      this.playSceneMusic("bakery");
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
    this.settings.musicScene = "bakery";
    this.audio.setScene(scene);
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
