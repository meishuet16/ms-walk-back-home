import { chapterRegistry, forestEntries } from "./ChapterRegistry.js";
import {
  STORY_CHAPTER_IDS,
  currentStoryChapterId,
  markStoryChapterCompleted,
  normalizeStoryRouteProgress,
  storyChapterState,
  storyCompletionCount,
  type StoryChapterId,
  type StoryRouteProgress
} from "./StoryRoute.js";

const STORY_PROGRESS_KEY = "walk-back-home:story-route-progress:v1";

type AppLike = {
  scene: string;
  player: { x: number; y: number };
  canvas: HTMLCanvasElement;
  overlay: HTMLElement;
  hud: HTMLElement;
  currentDoor: unknown;
  activeDoor: unknown;
  currentSceneLayout?: (scene?: string) => { spawn: { x: number; y: number } };
  sceneViewport?: (layout: unknown) => { w: number; h: number };
  sceneCamera?: (layout: unknown, width: number, height: number) => { x: number; y: number };
  enterCurrentMemory?: () => Promise<void> | void;
  applyAudioForCurrentScene?: () => void;
  autosave?: () => void;
  focusStage?: () => void;
  newMemory?: () => unknown;
  lastHudHtml?: string;
  [key: string]: unknown;
};

type AppPrototype = Record<string, ((...args: unknown[]) => unknown) | undefined>;
type RouteSession = { returningToStory: boolean; activeChapterId: StoryChapterId | "" };
const sessions = new WeakMap<object, RouteSession>();

function sessionFor(app: AppLike): RouteSession {
  let session = sessions.get(app as object);
  if (!session) {
    session = { returningToStory: false, activeChapterId: "" };
    sessions.set(app as object, session);
  }
  return session;
}

function loadProgress(): StoryRouteProgress {
  try { return normalizeStoryRouteProgress(JSON.parse(localStorage.getItem(STORY_PROGRESS_KEY) ?? "null")); }
  catch { return normalizeStoryRouteProgress(null); }
}
function saveProgress(progress: StoryRouteProgress): void {
  try { localStorage.setItem(STORY_PROGRESS_KEY, JSON.stringify(progress)); } catch {}
}
function escapeHtml(value: string): string {
  return value.replace(/[&<>'"]/g, (char) => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", "'":"&#39;", '"':"&quot;" }[char] ?? char));
}

function shell(app: AppLike): HTMLElement | null { return app.canvas.closest<HTMLElement>(".game-shell"); }
function stage(app: AppLike): HTMLElement | null { return app.canvas.closest<HTMLElement>(".stage-wrap"); }

function setEntryMode(app: AppLike, mode: "title" | "threshold" | "story" | null): void {
  const enabled = mode !== null;
  shell(app)?.classList.toggle("story-shell-active", enabled);
  stage(app)?.classList.toggle("story-stage-active", enabled);
  app.overlay.classList.toggle("story-route-overlay", enabled);
  app.hud.classList.toggle("story-hud-hidden", enabled);
  if (mode) shell(app)?.setAttribute("data-story-screen", mode);
  else shell(app)?.removeAttribute("data-story-screen");
}

function clearForestWorldPrompt(app: AppLike): void {
  (app.canvas.parentElement ?? app.hud).querySelector<HTMLElement>(".forest-world-prompt")?.remove();
  app.hud.querySelector<HTMLElement>(".forest-world-prompt")?.remove();
}

function showTitle(app: AppLike): void {
  app.scene = "title";
  app.currentDoor = null;
  app.activeDoor = null;
  clearForestWorldPrompt(app);
  setEntryMode(app, "title");
  app.overlay.classList.remove("dialogue-open", "lightweight-presentation");
  app.overlay.innerHTML = `
    <section class="story-title-screen" data-story-action="threshold" aria-label="Walk Back Home title screen">
      <div class="story-title-star" aria-hidden="true"></div>
      <div class="story-title-copy">
        <h1>Walk Back Home</h1>
        <p>Where every memory leads me home.</p>
      </div>
      <div class="story-title-muji" aria-hidden="true"></div>
      <div class="story-title-enter"><span>Tap to begin</span><small>进入记忆的入口</small></div>
      <small class="story-title-credit">A game by Muji</small>
    </section>`;
  app.focusStage?.();
}

function showThreshold(app: AppLike): void {
  app.scene = "threshold";
  app.currentDoor = null;
  app.activeDoor = null;
  setEntryMode(app, "threshold");
  app.overlay.classList.remove("dialogue-open", "lightweight-presentation");
  app.overlay.innerHTML = `
    <section class="threshold-hub" aria-label="Choose a way home">
      <header class="threshold-heading"><small>Choose a way home</small><h1>Where do you want to go?</h1></header>
      <div class="threshold-entrances">
        <button class="threshold-entry threshold-story" data-story-action="story" type="button">
          <span class="threshold-glow" aria-hidden="true"></span><span class="threshold-symbol">✦</span>
          <strong>The Story</strong><em>Walk Back Home</em><p>按真实日期，重新走过已经写下来的故事。</p>
        </button>
        <button class="threshold-entry threshold-forest" data-story-action="forest" type="button">
          <span class="threshold-glow" aria-hidden="true"></span><span class="threshold-symbol">❧</span>
          <strong>The Forest</strong><em>Memories</em><p>按月份翻阅所有记忆与日记。</p>
        </button>
        <button class="threshold-entry threshold-room" data-story-action="room" type="button">
          <span class="threshold-glow" aria-hidden="true"></span><span class="threshold-symbol">⌂</span>
          <strong>Muji Room</strong><em>My Place</em><p>回到房间，听歌、写日记、整理自己的小世界。</p>
        </button>
      </div>
      <div class="threshold-muji" aria-hidden="true"></div>
      <p class="threshold-footnote">Tap an entrance to continue.</p>
    </section>`;
  app.focusStage?.();
}

const routePoints = [
  [28, 118], [70, 245], [34, 372], [72, 499], [31, 626], [68, 753], [35, 880],
  [73, 1007], [31, 1134], [67, 1261], [34, 1388], [69, 1515], [50, 1642]
] as const;

function storyPathSvg(): string {
  const d = routePoints.map(([x, y], i) => `${i === 0 ? "M" : "L"} ${x} ${y}`).join(" ");
  return `<svg class="story-route-line" viewBox="0 0 100 1760" preserveAspectRatio="none" aria-hidden="true"><path d="${d}" /></svg>`;
}

function showStoryRoute(app: AppLike): void {
  app.scene = "story-route";
  app.currentDoor = null;
  app.activeDoor = null;
  setEntryMode(app, "story");
  const progress = loadProgress();
  const currentId = currentStoryChapterId(progress);
  const completeCount = storyCompletionCount(progress);
  const nodes = STORY_CHAPTER_IDS.map((chapterId, index) => {
    const chapter = chapterRegistry[chapterId];
    if (!chapter) return "";
    const state = storyChapterState(chapterId, progress);
    const [x, y] = routePoints[index];
    const number = String(index + 1).padStart(2, "0");
    const finalDream = chapterId === "final-dream-tomorrow";
    return `<button class="story-node is-${state}${finalDream ? " is-final" : ""}" style="--story-x:${x}%;--story-y:${y}px" data-story-action="chapter" data-chapter="${chapterId}" type="button">
      <span class="story-node-orb">${state === "completed" ? "✓" : state === "locked" ? "•" : number}</span>
      <span class="story-node-copy"><small>${finalDream ? "Last Chapter" : `Chapter ${number}`}</small><strong>${escapeHtml(chapter.title)}</strong><em>${escapeHtml(chapter.date)}</em></span>
    </button>`;
  }).join("");
  const current = chapterRegistry[currentId];
  app.overlay.classList.remove("dialogue-open", "lightweight-presentation");
  app.overlay.innerHTML = `
    <section class="story-route-shell" aria-label="Story Route">
      <header class="story-route-header">
        <button class="story-back" data-story-action="threshold" type="button" aria-label="Back">‹</button>
        <div><small>The Story</small><h1>Walk Back Home</h1><p>按真实日期，一章一章走回去。</p></div>
        <div class="story-progress"><strong>${completeCount} / ${STORY_CHAPTER_IDS.length}</strong><span>completed</span></div>
      </header>
      <div class="story-route-scroll">
        <div class="story-route-world">
          ${storyPathSvg()}
          <div class="story-route-sparkles" aria-hidden="true"></div>
          ${nodes}
          <div class="story-route-muji" aria-hidden="true"></div>
        </div>
      </div>
      <footer class="story-route-footer">
        <div><small>Current chapter</small><strong>${escapeHtml(current?.title ?? "Final Dream")}</strong><span>${escapeHtml(current?.date ?? "")}</span></div>
        <button data-story-action="chapter-preview" data-chapter="${currentId}" type="button">View chapter</button>
      </footer>
    </section>`;
  requestAnimationFrame(() => {
    const currentNode = app.overlay.querySelector<HTMLElement>(".story-node.is-current");
    currentNode?.scrollIntoView({ block: "center", behavior: "auto" });
  });
}

function showStoryChapterPreview(app: AppLike, chapterId: StoryChapterId, locked: boolean): void {
  const chapter = chapterRegistry[chapterId];
  if (!chapter) return;
  const number = String(STORY_CHAPTER_IDS.indexOf(chapterId) + 1).padStart(2, "0");
  const finalDream = chapterId === "final-dream-tomorrow";
  const description = locked
    ? "前面的路还没有解锁。先完成上一章。"
    : finalDream
      ? "这一章不需要操控。准备好以后，就让梦自己走完。"
      : "完成这一章后，会自动回到 Story Route，并解锁下一章。";
  app.overlay.insertAdjacentHTML("beforeend", `
    <div class="story-chapter-sheet" role="dialog" aria-modal="true">
      <button class="story-sheet-close" data-story-action="story" type="button" aria-label="Close">×</button>
      <small>${finalDream ? "Last Chapter" : `Chapter ${number}`}</small>
      <h2>${escapeHtml(chapter.title)}</h2><p class="story-sheet-date">${escapeHtml(chapter.date)}</p>
      <p>${description}</p>
      ${locked ? "" : `<button class="story-sheet-start" data-story-action="chapter-start" data-chapter="${chapterId}" type="button">${finalDream ? "Enter Final Dream" : "Enter Chapter"}</button>`}
    </div>`);
}

function leaveEntryMode(app: AppLike): void {
  setEntryMode(app, null);
  app.overlay.classList.remove("story-route-overlay");
  app.overlay.innerHTML = "";
}

function startStoryChapter(app: AppLike, chapterId: StoryChapterId): void {
  const entry = forestEntries.find((door) => door.chapterId === chapterId);
  if (!entry) return;
  leaveEntryMode(app);
  app.newMemory?.();
  app.currentDoor = entry;
  app.activeDoor = entry;
  const session = sessionFor(app);
  session.returningToStory = true;
  session.activeChapterId = chapterId;
  const result = app.enterCurrentMemory?.();
  if (result instanceof Promise) void result;
}

function openForest(app: AppLike): void {
  leaveEntryMode(app);
  app.newMemory?.();
}
function openRoom(app: AppLike): void {
  leaveEntryMode(app);
  app.newMemory?.();
  app.scene = "muji-room";
  const layout = app.currentSceneLayout?.("muji-room");
  if (layout?.spawn) app.player = { ...layout.spawn };
  app.currentDoor = null;
  app.activeDoor = null;
  app.applyAudioForCurrentScene?.();
  app.autosave?.();
  app.focusStage?.();
}

function handleStoryAction(app: AppLike, target: HTMLElement): void {
  const action = target.dataset.storyAction;
  if (action === "threshold") return showThreshold(app);
  if (action === "story") return showStoryRoute(app);
  if (action === "forest") return openForest(app);
  if (action === "room") return openRoom(app);
  const chapterId = target.dataset.chapter as StoryChapterId | undefined;
  if (!chapterId || !STORY_CHAPTER_IDS.includes(chapterId)) return;
  if (action === "chapter") {
    const state = storyChapterState(chapterId, loadProgress());
    return showStoryChapterPreview(app, chapterId, state === "locked");
  }
  if (action === "chapter-preview") return showStoryChapterPreview(app, chapterId, false);
  if (action === "chapter-start") return startStoryChapter(app, chapterId);
}

function bindOverlay(app: AppLike): void {
  if (app.overlay.dataset.storyRouteBound === "true") return;
  app.overlay.dataset.storyRouteBound = "true";
  app.overlay.addEventListener("pointerup", (event) => {
    if (event.pointerType === "mouse") return;
    const target = (event.target as HTMLElement | null)?.closest<HTMLElement>("[data-story-action]");
    if (!target) return;
    event.preventDefault();
    event.stopPropagation();
    handleStoryAction(app, target);
  });
  app.overlay.addEventListener("click", (event) => {
    const target = (event.target as HTMLElement | null)?.closest<HTMLElement>("[data-story-action]");
    if (!target) return;
    if (event.detail !== 0 && matchMedia("(pointer: coarse)").matches) return;
    event.preventDefault();
    event.stopPropagation();
    handleStoryAction(app, target);
  });
}

function renderForestWorldPrompt(app: AppLike): void {
  const fixedPrompt = app.hud.querySelector<HTMLElement>(".prompt");
  if (app.scene !== "forest") {
    if (fixedPrompt) { fixedPrompt.style.visibility = ""; fixedPrompt.style.pointerEvents = ""; }
    clearForestWorldPrompt(app);
    return;
  }
  if (fixedPrompt) { fixedPrompt.style.visibility = "hidden"; fixedPrompt.style.pointerEvents = "none"; }
  const door = app.activeDoor as { date?: string; title?: string; chapterId?: string } | null;
  if (!door) return clearForestWorldPrompt(app);
  const host = app.canvas.parentElement ?? app.hud;
  let bubble = host.querySelector<HTMLElement>(".forest-world-prompt");
  if (!bubble) { bubble = document.createElement("div"); bubble.className = "forest-world-prompt"; host.appendChild(bubble); }
  const finalDream = door.chapterId === "final-dream-tomorrow";
  bubble.innerHTML = finalDream
    ? `<strong>Final Dream</strong><span>这一章不需要操控。准备好以后，就让梦自己走完。</span>`
    : `<strong>${escapeHtml([door.date, door.title].filter(Boolean).join(" · "))}</strong><span>Tap A to enter</span>`;
}

export function initializeStoryRouteStartup(appObject: object): void {
  const app = appObject as AppLike;
  bindOverlay(app);
  showTitle(app);
}

export function installStoryRouteBridge(proto: AppPrototype): void {
  const originalNewMemory = proto.newMemory;
  if (!originalNewMemory) return;
  proto.newMemory = function(this: AppLike, ...args: unknown[]): unknown {
    if (this.scene === "title") { showThreshold(this); return; }
    return originalNewMemory.apply(this, args);
  };

  const originalDrawHud = proto.drawHud;
  if (originalDrawHud) {
    proto.drawHud = function(this: AppLike, ...args: unknown[]): unknown {
      const result = originalDrawHud.apply(this, args);
      renderForestWorldPrompt(this);
      return result;
    };
  }

  const originalComplete = proto.completeChapterMemoryRun;
  if (originalComplete) {
    proto.completeChapterMemoryRun = function(this: AppLike, ...args: unknown[]): unknown {
      const result = originalComplete.apply(this, args);
      const chapterId = (typeof args[0] === "string" ? args[0] : sessionFor(this).activeChapterId) as StoryChapterId | "";
      if (sessionFor(this).returningToStory && chapterId && STORY_CHAPTER_IDS.includes(chapterId)) {
        saveProgress(markStoryChapterCompleted(loadProgress(), chapterId));
      }
      return result;
    };
  }

  const returnToStory = (app: AppLike) => {
    const session = sessionFor(app);
    if (!session.returningToStory) return;
    session.returningToStory = false;
    session.activeChapterId = "";
    window.setTimeout(() => showStoryRoute(app), 0);
  };

  const originalFinishReturn = proto.finishReturnToForest;
  if (originalFinishReturn) {
    proto.finishReturnToForest = function(this: AppLike, ...args: unknown[]): unknown {
      const result = originalFinishReturn.apply(this, args); returnToStory(this); return result;
    };
  }
  const originalFinishBakery = proto.finishBakery;
  if (originalFinishBakery) {
    proto.finishBakery = function(this: AppLike, ...args: unknown[]): unknown {
      const result = originalFinishBakery.apply(this, args); returnToStory(this); return result;
    };
  }
}
