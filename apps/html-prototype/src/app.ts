import { chapterPlanToHtmlScene } from "./adapters/chapterPlanAdapter.js";
import { bakeryChapter, forestDoors } from "./fixtures/chapterPlan.js";
import type { Choice, SaveState, SceneId, Tendencies } from "./types.js";
import { AudioManager } from "./systems/AudioManager.js";
import { inAnyRect, type Point, type Rect } from "./systems/CollisionSystem.js";
import { DialogueSystem } from "./systems/DialogueSystem.js";
import { resolveEnding, type Ending } from "./systems/EndingResolver.js";
import { InputManager } from "./systems/InputManager.js";
import { ParticleSystem } from "./systems/ParticleSystem.js";
import { SaveManager } from "./systems/SaveManager.js";
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

function img(src: string): HTMLImageElement {
  const image = new Image();
  image.src = src;
  return image;
}

export class WalkBackHomeApp {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private hud: HTMLElement;
  private panel: HTMLElement;
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
  private player: Point = { x: 760, y: 820 };
  private facing = 0;
  private frame = 0;
  private last = performance.now();
  private activeDoor: Door | null = null;
  private activeObject = "";
  private tendencies: Tendencies = emptyTendencies();
  private completedChapters = new Set<string>();
  private openedDoors = new Set<string>();
  private choices: string[] = [];
  private scrapbook = new Set(["A warm door in the forest"]);
  private favorites = new Set<string>();
  private timelineCompleted = new Set<string>();
  private selectedChapter = "Yumido Bread";
  private settings = { rain: true, muted: true, volume: 0.18, compact: false, reducedMotion: false };
  private dialogue = new DialogueSystem(bakeryChapter.dialogue);
  private ending: Ending | null = null;

  constructor(private root: HTMLElement) {
    root.innerHTML = `
      <div class="game-shell">
        <header class="top-menu">
          <div><strong>Walk Back Home</strong><span>HTML memory prototype</span></div>
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
          <div class="overlay"></div>
        </main>
        <section class="memory-panels"></section>
      </div>`;
    this.canvas = root.querySelector("canvas")!;
    this.ctx = this.canvas.getContext("2d")!;
    this.hud = root.querySelector(".hud")!;
    this.panel = root.querySelector(".memory-panels")!;
    this.overlay = root.querySelector(".overlay")!;
    this.input = new InputManager(root);
    this.input.mountTouchControls(() => this.interact());
    root.addEventListener("click", (event) => this.handleClick(event));
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) this.last = performance.now();
    });
    this.renderPanels();
    requestAnimationFrame((time) => this.loop(time));
  }

  private handleClick(event: Event): void {
    const target = event.target as HTMLElement;
    const action = target.dataset.action;
    if (!action) return;
    if (action === "new") this.newMemory();
    if (action === "continue") this.loadAutosave();
    if (action === "load") this.showSaveLoad();
    if (action === "settings") this.showSettings();
    if (action === "credits") this.showCredits();
    if (action === "forest") this.scene = "forest";
    if (action === "dashboard") this.renderPanels("scrapbook");
    if (action === "compact") this.toggleCompact();
    if (action === "fullscreen") document.documentElement.requestFullscreen?.();
    if (action === "rain") this.settings.rain = !this.settings.rain;
    if (action === "mute") this.toggleAudio();
    if (action === "save") this.saveSlot(Number(target.dataset.slot));
    if (action === "load-slot") this.loadSlot(Number(target.dataset.slot));
    if (action === "delete-slot") this.deleteSlot(Number(target.dataset.slot));
    if (action === "ending") this.resolveAndShowEnding();
    if (action === "close") this.overlay.innerHTML = "";
    if (action === "enter-door") this.enterBakery();
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
    this.player = { x: 760, y: 820 };
    this.overlay.innerHTML = "";
    this.autosave();
  }

  private loadAutosave(): void {
    const saved = this.save.loadAutosave();
    if (saved) this.applySave(saved);
    else this.newMemory();
  }

  private updateForest(x: number, y: number, dt: number): void {
    this.move(x, y, dt, [{ x: 0, y: 0, w: 1536, h: 100 }, { x: 0, y: 0, w: 180, h: 1024 }, { x: 1320, y: 0, w: 220, h: 1024 }], [
      { x: 560, y: 280, w: 300, h: 560 },
      { x: 250, y: 250, w: 250, h: 170 },
      { x: 960, y: 130, w: 300, h: 280 },
      { x: 940, y: 700, w: 280, h: 210 }
    ]);
    this.activeDoor = forestDoors.find((door) => Math.hypot(this.player.x - door.x, this.player.y - door.y) < 86) ?? null;
  }

  private updateBakery(x: number, y: number, dt: number): void {
    this.move(x, y, dt, [{ x: 0, y: 0, w: 1536, h: 210 }, { x: 0, y: 0, w: 40, h: 510 }, { x: 1490, y: 0, w: 50, h: 510 }], [
      { x: 0, y: 0, w: 980, h: 300 },
      { x: 760, y: 168, w: 245, h: 130 },
      { x: 1000, y: 330, w: 460, h: 170 },
      { x: 70, y: 345, w: 335, h: 150 },
      { x: 640, y: 385, w: 355, h: 120 }
    ]);
    const nearFriend = Math.hypot(this.player.x - 705, this.player.y - 330) < 75;
    const nearPastry = Math.hypot(this.player.x - 840, this.player.y - 250) < 70;
    const nearExit = this.player.x < 105 && this.player.y < 330;
    this.activeObject = nearFriend ? "Friend A" : nearPastry ? "pastry" : nearExit ? "exit" : "";
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
      if (this.activeObject === "exit" && this.dialogue.complete()) return this.finishBakery();
      if (this.activeObject === "Friend A" || this.activeObject === "pastry") return this.showDialogue();
    }
    if (this.scene === "ending") this.scene = "forest";
  }

  private previewDoor(door: Door): void {
    this.openedDoors.add(door.id);
    this.overlay.innerHTML = `<div class="modal"><h2>${door.date} · ${door.title}</h2><p>A warm door hums inside the branches.</p><p>Muji does not go back to fix it. Muji goes back to walk beside it.</p><button data-action="enter-door">Enter memory</button><button data-action="close">Stay in forest</button></div>`;
  }

  private enterBakery(): void {
    this.scene = "bakery";
    this.player = { x: 180, y: 420 };
    this.dialogue = new DialogueSystem(chapterPlanToHtmlScene().dialogue);
    this.overlay.innerHTML = "";
    this.audio.ping("bakery");
    this.autosave();
  }

  private showDialogue(): void {
    const node = this.dialogue.current();
    if (!node) return;
    const choices = node.choices?.map((choice) => `<button data-action="choice" data-choice="${choice.id}">${choice.label}</button>`).join("") ?? `<button data-action="choice" data-choice="next">Continue</button>`;
    const portrait = node.portrait === "friend" ? assets.friend : node.portrait === "muji" ? assets.muji : "";
    this.overlay.innerHTML = `<div class="vn"><div class="vn-portrait">${portrait ? `<img src="${portrait}" alt="">` : ""}</div><div><h3>${node.speaker}</h3><p>${node.text}</p>${this.dialogue.lastResponse ? `<p class="memory-line">${this.dialogue.lastResponse}</p>` : ""}<div class="choices">${choices}</div></div></div>`;
  }

  private choose(choiceId: string): void {
    const node = this.dialogue.current();
    if (!node) return;
    if (choiceId === "next" || !node.choices) {
      this.dialogue.next();
    } else {
      const choice = node.choices.find((item) => item.id === choiceId);
      if (choice) {
        this.tendencies = this.dialogue.choose(choice, this.tendencies);
        this.choices.push(choice.id);
      }
    }
    if (this.dialogue.complete()) {
      this.overlay.innerHTML = `<div class="modal"><h2>The bakery door opens.</h2><p>Friend A does not ask Muji to repair anything.</p><p>She only waits until Muji is ready to leave.</p><button data-action="close">Walk to the exit</button></div>`;
    } else {
      this.showDialogue();
    }
    this.autosave();
  }

  private finishBakery(): void {
    this.completedChapters.add("bakery-day");
    this.timelineCompleted.add("Yumido Bread");
    this.scrapbook.add("The small pastry that stayed small");
    this.selectedChapter = "Yumido Bread";
    this.scene = "forest";
    this.player = { x: 1120, y: 300 };
    this.overlay.innerHTML = `<div class="modal"><h2>Memory complete</h2><p>The scrapbook has a new page. The timeline keeps the day as it was.</p><button data-action="close">Return</button><button data-action="ending">Resolve ending</button></div>`;
    this.renderPanels();
    this.autosave();
  }

  private resolveAndShowEnding(): void {
    this.ending = resolveEnding(this.tendencies, this.scrapbook.size >= 4 ? 3 : 0);
    this.scene = "ending";
    this.overlay.innerHTML = "";
    this.audio.ping("ending");
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
      this.ctx.drawImage(this.images.friend, (705 - cameraX) * scale - 20, (330 - cameraY) * scale - 64, 42 * scale, 64 * scale);
    }
    this.drawMuji({ x: (this.player.x - cameraX) * scale, y: (this.player.y - cameraY) * scale }, time, scale);
    const vignette = this.ctx.createRadialGradient(this.canvas.width / 2, this.canvas.height / 2, 120, this.canvas.width / 2, this.canvas.height / 2, this.canvas.height * 0.72);
    vignette.addColorStop(0, "rgba(0,0,0,0)");
    vignette.addColorStop(1, "rgba(0,0,0,.52)");
    this.ctx.fillStyle = vignette;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
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
    this.hud.innerHTML = `<div class="prompt">${text}</div><div class="hud-actions"><button data-action="compact">${this.settings.compact ? "960×540" : "480×270"}</button><button data-action="fullscreen">Fullscreen</button><button data-action="rain">Rain</button><button data-action="mute">${this.settings.muted ? "点击开启声音" : "Mute"}</button></div>`;
  }

  private renderPanels(active = "scrapbook"): void {
    const completed = this.timelineCompleted.has("Yumido Bread") ? "complete" : "open";
    this.panel.innerHTML = `
      <article class="panel scrapbook ${active === "scrapbook" ? "selected-panel" : ""}"><h2>AI Scrapbook</h2><div class="tabs"><button>People</button><button>Places</button><button>Objects</button><button>Moments</button><button>Quotes</button></div>${[...this.scrapbook].map((item) => `<button class="polaroid"><img src="${assets.scrapbook}" alt=""><strong>${item}</strong><span>confidence: fixture</span></button>`).join("")}</article>
      <article class="panel"><h2>Diary Timeline</h2>${["07.31 Went to Segamat", `07.28 Yumido Bread · ${completed}`, "07.27 Night Walk", "07.26 Palapes Meeting"].map((item) => `<button class="timeline-item">${item}<span>☆</span></button>`).join("")}</article>
      <article class="panel"><h2>Memory Map</h2><img src="${assets.map}" alt=""><button>Forest</button><button>Bakery</button><button>Home</button><button>School</button><button>City</button><button>Beach</button><button>??? locked</button></article>
      <article class="panel"><h2>Relationships</h2>${["Friend A · quiet bakery friend", "ET · bestie", "Angela · best friend"].map((item) => `<div class="row">${item}<span>♥♥♥♡</span></div>`).join("")}</article>
      <article class="panel"><h2>Mini Games</h2>${["Card Memories", "Cat Journey", "Mood Match", "Photo Puzzle"].map((item) => `<button>${item}</button>`).join("")}</article>
      <article class="panel"><h2>Muji's Room</h2><img src="${assets.room}" alt=""><button>Talk</button><button>Gift</button><button>Dress</button><button>Diary</button></article>
      <article class="panel"><h2>Save / Load</h2>${[1, 2, 3].map((slot) => `<div class="save-row"><span>Slot ${slot}</span><button data-action="save" data-slot="${slot}">Save</button><button data-action="load-slot" data-slot="${slot}">Load</button><button data-action="delete-slot" data-slot="${slot}">Delete</button></div>`).join("")}<button data-action="ending">Resolve Ending</button></article>`;
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
      scrapbook: [...this.scrapbook],
      favorites: [...this.favorites],
      timelineCompleted: [...this.timelineCompleted],
      selectedChapter: this.selectedChapter,
      settings: this.settings,
      endingProgress: this.ending ? [this.ending.id] : []
    };
  }

  private applySave(state: SaveState): void {
    this.scene = state.scene;
    this.player = state.player;
    this.openedDoors = new Set(state.openedDoors);
    this.completedChapters = new Set(state.completedChapters);
    this.choices = state.choices;
    this.tendencies = state.tendencies;
    this.scrapbook = new Set(state.scrapbook);
    this.favorites = new Set(state.favorites);
    this.timelineCompleted = new Set(state.timelineCompleted);
    this.selectedChapter = state.selectedChapter;
    this.settings = state.settings;
    this.renderPanels();
  }

  private autosave(): void {
    this.save.autosave(this.makeSave());
  }

  private saveSlot(slot: number): void {
    this.save.save(slot, this.makeSave(slot));
    this.showSaveLoad();
  }

  private loadSlot(slot: number): void {
    const state = this.save.load(slot);
    if (state) this.applySave(state);
    this.overlay.innerHTML = "";
  }

  private deleteSlot(slot: number): void {
    this.save.delete(slot);
    this.showSaveLoad();
  }

  private showSaveLoad(): void {
    const rows = this.save.list().map((state, index) => `<div class="save-row"><strong>Slot ${index + 1}</strong><span>${state ? `${state.selectedChapter} · ${new Date(state.savedAt).toLocaleString()}` : "empty"}</span><button data-action="save" data-slot="${index + 1}">Save</button><button data-action="load-slot" data-slot="${index + 1}">Load</button><button data-action="delete-slot" data-slot="${index + 1}">Delete</button></div>`).join("");
    this.overlay.innerHTML = `<div class="modal"><h2>Save / Load</h2>${rows}<button data-action="close">Close</button></div>`;
  }

  private showSettings(): void {
    this.overlay.innerHTML = `<div class="modal"><h2>Settings</h2><p>Volume ${Math.round(this.settings.volume * 100)}%</p><button data-action="mute">${this.settings.muted ? "点击开启声音" : "Mute"}</button><button data-action="rain">Toggle rain</button><button data-action="compact">Compact mode</button><button data-action="close">Close</button></div>`;
  }

  private showCredits(): void {
    this.overlay.innerHTML = `<div class="modal"><h2>Credits</h2><p>Fictional local-first prototype. Visual targets supplied by the project owner. No paid API required.</p><button data-action="close">Close</button></div>`;
  }

  private async toggleAudio(): Promise<void> {
    if (this.settings.muted) await this.audio.enable();
    this.settings.muted = !this.settings.muted;
    this.audio.setMuted(this.settings.muted);
    this.autosave();
  }

  private toggleCompact(): void {
    this.settings.compact = !this.settings.compact;
    this.root.classList.toggle("compact", this.settings.compact);
    this.autosave();
  }
}
