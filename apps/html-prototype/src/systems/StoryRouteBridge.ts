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
  ctx: CanvasRenderingContext2D;
  overlay: HTMLElement;
  hud: HTMLElement;
  currentDoor: unknown;
  activeDoor: unknown;
  images?: { forest?: HTMLImageElement };
  drawMuji?: (point: { x: number; y: number }, time: number, scale: number) => void;
  currentSceneLayout?: (scene?: string) => { spawn: { x: number; y: number }; size?: { w: number; h: number } };
  sceneViewport?: (layout: unknown) => { w: number; h: number };
  sceneCamera?: (layout: unknown, width: number, height: number) => { x: number; y: number };
  enterCurrentMemory?: () => Promise<void> | void;
  applyAudioForCurrentScene?: () => void;
  autosave?: () => void;
  focusStage?: () => void;
  lastHudHtml?: string;
  [key: string]: unknown;
};

type AppPrototype = Record<string, ((...args: unknown[]) => unknown) | undefined>;

type RouteSession = {
  returningToStory: boolean;
  activeChapterId: StoryChapterId | "";
};

const sessions = new WeakMap<object, RouteSession>();

function sessionFor(app: AppLike): RouteSession {
  const key = app as object;
  let session = sessions.get(key);
  if (!session) {
    session = { returningToStory: false, activeChapterId: "" };
    sessions.set(key, session);
  }
  return session;
}

function loadProgress(): StoryRouteProgress {
  try {
    return normalizeStoryRouteProgress(JSON.parse(localStorage.getItem(STORY_PROGRESS_KEY) ?? "null"));
  } catch {
    return normalizeStoryRouteProgress(null);
  }
}

function saveProgress(progress: StoryRouteProgress): void {
  try {
    localStorage.setItem(STORY_PROGRESS_KEY, JSON.stringify(progress));
  } catch {
    // Story progression is a convenience layer; chapter runtime remains authoritative.
  }
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>'"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[char] ?? char));
}

function bindOverlay(app: AppLike, originalNewMemory: (...args: unknown[]) => unknown): void {
  if (app.overlay.dataset.storyRouteBound === "true") return;
  app.overlay.dataset.storyRouteBound = "true";
  app.overlay.addEventListener("click", (event) => {
    const target = (event.target as HTMLElement | null)?.closest<HTMLElement>("[data-story-action]");
    if (!target) return;
    const action = target.dataset.storyAction;
    if (action === "threshold") return showThreshold(app, originalNewMemory);
    if (action === "story") return showStoryRoute(app, originalNewMemory);
    if (action === "forest") {
      originalNewMemory.call(app);
      return;
    }
    if (action === "room") {
      originalNewMemory.call(app);
      app.scene = "muji-room";
      const layout = app.currentSceneLayout?.("muji-room");
      if (layout?.spawn) app.player = { ...layout.spawn };
      app.currentDoor = null;
      app.activeDoor = null;
      app.overlay.innerHTML = "";
      app.applyAudioForCurrentScene?.();
      app.autosave?.();
      app.focusStage?.();
      return;
    }
    if (action === "chapter") {
      const chapterId = target.dataset.chapter as StoryChapterId | undefined;
      if (!chapterId || !STORY_CHAPTER_IDS.includes(chapterId)) return;
      const state = storyChapterState(chapterId, loadProgress());
      if (state === "locked") return showStoryChapterPreview(app, chapterId, true, originalNewMemory);
      return startStoryChapter(app, chapterId, originalNewMemory);
    }
    if (action === "chapter-preview") {
      const chapterId = target.dataset.chapter as StoryChapterId | undefined;
      if (!chapterId || !STORY_CHAPTER_IDS.includes(chapterId)) return;
      return showStoryChapterPreview(app, chapterId, false, originalNewMemory);
    }
    if (action === "chapter-start") {
      const chapterId = target.dataset.chapter as StoryChapterId | undefined;
      if (!chapterId || !STORY_CHAPTER_IDS.includes(chapterId)) return;
      return startStoryChapter(app, chapterId, originalNewMemory);
    }
  });
}

function showThreshold(app: AppLike, originalNewMemory: (...args: unknown[]) => unknown): void {
  bindOverlay(app, originalNewMemory);
  app.scene = "threshold";
  app.currentDoor = null;
  app.activeDoor = null;
  app.overlay.classList.remove("dialogue-open", "lightweight-presentation");
  app.overlay.innerHTML = `
    <section class="threshold-hub" aria-label="Choose where to go">
      <div class="threshold-haze"></div>
      <div class="threshold-heading"><small>Where do you want to begin?</small><h1>Three ways home.</h1></div>
      <div class="threshold-entrances">
        <button class="threshold-entry threshold-story" data-story-action="story">
          <span class="threshold-symbol">✦</span><strong>The Story</strong><em>Walk Back Home</em><p>沿着真实日期，把已经写下来的故事重新走一遍。</p>
        </button>
        <button class="threshold-entry threshold-forest" data-story-action="forest">
          <span class="threshold-symbol">❧</span><strong>The Forest</strong><em>Memories</em><p>回到现在的月份森林，翻看所有记忆与日记。</p>
        </button>
        <button class="threshold-entry threshold-room" data-story-action="room">
          <span class="threshold-symbol">⌂</span><strong>Muji Room</strong><em>My Place</em><p>回房间。写日记、听歌、整理自己的小世界。</p>
        </button>
      </div>
      <p class="threshold-footnote">走近一条路，就从那里开始。</p>
    </section>`;
  app.focusStage?.();
}

const routePoints = [
  [10, 78], [23, 67], [37, 57], [52, 48], [68, 39], [82, 28], [88, 16],
  [72, 12], [56, 21], [42, 31], [29, 42], [18, 54], [11, 22]
] as const;

function storyPathSvg(): string {
  const points = routePoints.map(([x, y]) => `${x},${y}`).join(" ");
  return `<svg class="story-route-line" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><polyline points="${points}" /></svg>`;
}

function showStoryRoute(app: AppLike, originalNewMemory: (...args: unknown[]) => unknown): void {
  bindOverlay(app, originalNewMemory);
  app.scene = "story-route";
  app.currentDoor = null;
  app.activeDoor = null;
  const progress = loadProgress();
  const currentId = currentStoryChapterId(progress);
  const completeCount = storyCompletionCount(progress);
  const nodes = STORY_CHAPTER_IDS.map((chapterId, index) => {
    const chapter = chapterRegistry[chapterId];
    if (!chapter) return "";
    const state = storyChapterState(chapterId, progress);
    const [x, y] = routePoints[index];
    const number = String(index + 1).padStart(2, "0");
    const isFinal = chapterId === "final-dream-tomorrow";
    return `<button class="story-node is-${state}${isFinal ? " is-final" : ""}" style="--story-x:${x}%;--story-y:${y}%" data-story-action="chapter" data-chapter="${chapterId}" aria-label="Chapter ${number} ${escapeHtml(chapter.title)} ${state}">
      <span class="story-node-orb">${state === "completed" ? "✓" : state === "locked" ? "·" : number}</span>
      <span class="story-node-copy"><small>${isFinal ? "Last Chapter" : `Chapter ${number}`}</small><strong>${escapeHtml(chapter.title)}</strong><em>${isFinal ? "Final Dream" : escapeHtml(chapter.date)}</em></span>
    </button>`;
  }).join("");
  const current = chapterRegistry[currentId];
  app.overlay.classList.remove("dialogue-open", "lightweight-presentation");
  app.overlay.innerHTML = `
    <section class="story-route-shell" aria-label="Story Route">
      <header class="story-route-header">
        <button class="story-back" data-story-action="threshold" aria-label="Back to threshold">‹</button>
        <div><small>The Story</small><h1>Walk Back Home</h1><p>按真实日期顺序，一章一章走回去。</p></div>
        <div class="story-progress"><strong>${completeCount} / ${STORY_CHAPTER_IDS.length}</strong><span>completed</span></div>
      </header>
      <div class="story-route-world">
        ${storyPathSvg()}
        ${nodes}
        <div class="story-route-muji" aria-hidden="true">Muji</div>
        <div class="story-current-card"><small>现在走到</small><strong>${escapeHtml(current?.title ?? "Final Dream")}</strong><span>${escapeHtml(current?.date ?? "")}</span></div>
      </div>
      <footer class="story-route-footer"><span>完成当前章节后，下一段路才会亮起来。</span><button data-story-action="chapter-preview" data-chapter="${currentId}">查看当前章节</button></footer>
    </section>`;
  app.focusStage?.();
}

function showStoryChapterPreview(app: AppLike, chapterId: StoryChapterId, locked: boolean, originalNewMemory: (...args: unknown[]) => unknown): void {
  const chapter = chapterRegistry[chapterId];
  if (!chapter) return;
  const index = STORY_CHAPTER_IDS.indexOf(chapterId);
  const number = String(index + 1).padStart(2, "0");
  const finalDream = chapterId === "final-dream-tomorrow";
  const description = locked
    ? "前面的路还没有想起来。先完成上一章。"
    : finalDream
      ? "这一章不需要操控。准备好以后，就让梦自己走完。"
      : "沿着真实日期继续走。完成这一章后，下一段路会亮起来。";
  const canStart = !locked;
  app.overlay.insertAdjacentHTML("beforeend", `
    <div class="story-chapter-sheet" role="dialog" aria-modal="true" aria-label="Chapter ${number}">
      <button class="story-sheet-close" data-story-action="story" aria-label="Close">×</button>
      <small>${finalDream ? "Last Chapter" : `Chapter ${number}`}</small>
      <h2>${escapeHtml(chapter.title)}</h2>
      <p class="story-sheet-date">${escapeHtml(chapter.date)}</p>
      <p>${description}</p>
      ${canStart ? `<button class="story-sheet-start" data-story-action="chapter-start" data-chapter="${chapterId}">${finalDream ? "进入 Final Dream" : "进入章节"}</button>` : ""}
    </div>`);
  bindOverlay(app, originalNewMemory);
}

function startStoryChapter(app: AppLike, chapterId: StoryChapterId, originalNewMemory: (...args: unknown[]) => unknown): void {
  const entry = forestEntries.find((door) => door.chapterId === chapterId);
  if (!entry) return;
  originalNewMemory.call(app);
  app.currentDoor = entry;
  app.activeDoor = entry;
  const routeSession = sessionFor(app);
  routeSession.returningToStory = true;
  routeSession.activeChapterId = chapterId;
  app.overlay.innerHTML = "";
  const result = app.enterCurrentMemory?.();
  if (result instanceof Promise) void result;
}

function finishStoryReturn(app: AppLike, originalNewMemory: (...args: unknown[]) => unknown): void {
  const routeSession = sessionFor(app);
  if (!routeSession.returningToStory) return;
  routeSession.returningToStory = false;
  routeSession.activeChapterId = "";
  window.setTimeout(() => showStoryRoute(app, originalNewMemory), 0);
}

function drawPolishedTitle(app: AppLike, time: number): void {
  const { ctx, canvas } = app;
  const forest = app.images?.forest;
  if (forest?.complete && forest.naturalWidth > 0) ctx.drawImage(forest, 0, 0, canvas.width, canvas.height);
  else {
    const fill = ctx.createLinearGradient(0, 0, 0, canvas.height);
    fill.addColorStop(0, "#061427");
    fill.addColorStop(1, "#0b1c22");
    ctx.fillStyle = fill;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
  const shade = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  shade.addColorStop(0, "rgba(2,8,18,.72)");
  shade.addColorStop(.55, "rgba(3,10,20,.32)");
  shade.addColorStop(1, "rgba(2,8,18,.58)");
  ctx.fillStyle = shade;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  const compact = canvas.width < 680;
  const left = compact ? 34 : 60;
  ctx.fillStyle = "#fff2d0";
  ctx.font = `${compact ? 36 : 58}px Georgia`;
  ctx.fillText("Walk Back Home", left, compact ? 112 : 132);
  ctx.fillStyle = "rgba(255,242,208,.78)";
  ctx.font = `${compact ? 14 : 18}px Georgia`;
  ctx.fillText("Where every memory leads me home.", left + 3, compact ? 145 : 170);
  ctx.fillStyle = "rgba(255,255,255,.66)";
  ctx.font = `${compact ? 13 : 15}px system-ui`;
  ctx.fillText("Tap / Enter to begin", left + 3, canvas.height - (compact ? 54 : 68));
  app.drawMuji?.({ x: canvas.width * .72, y: canvas.height * .82 }, time, canvas.width / 960);
}

function renderForestWorldPrompt(app: AppLike): void {
  if (app.scene !== "forest") return;
  const fixedPrompt = app.hud.querySelector<HTMLElement>(".prompt");
  if (fixedPrompt) fixedPrompt.style.display = "none";
  let bubble = app.hud.querySelector<HTMLElement>(".forest-world-prompt");
  const door = app.activeDoor as { date?: string; title?: string; chapterId?: string } | null;
  if (!door) {
    bubble?.remove();
    return;
  }
  if (!bubble) {
    bubble = document.createElement("div");
    bubble.className = "forest-world-prompt";
    app.hud.appendChild(bubble);
  }
  const touch = matchMedia("(pointer: coarse)").matches;
  const finalDream = door.chapterId === "final-dream-tomorrow";
  bubble.innerHTML = finalDream
    ? `<strong>Final Dream</strong><span>这一章不需要操控。准备好以后，就让梦自己走完。</span>`
    : `<strong>${touch ? "Tap A" : "Press E"} · ${escapeHtml(door.date ?? "")} ${escapeHtml(door.title ?? "Memory")}</strong>`;
  try {
    const layout = app.currentSceneLayout?.("forest");
    if (!layout || !app.sceneViewport || !app.sceneCamera) throw new Error("no scene projection");
    const viewport = app.sceneViewport(layout);
    const camera = app.sceneCamera(layout, viewport.w, viewport.h);
    const scale = app.canvas.width / viewport.w;
    const x = (app.player.x - camera.x) * scale;
    const y = (app.player.y - camera.y) * scale;
    bubble.style.left = `${Math.max(10, Math.min(90, x / app.canvas.width * 100))}%`;
    bubble.style.top = `${Math.max(12, Math.min(82, y / app.canvas.height * 100 - 10))}%`;
  } catch {
    bubble.style.left = "50%";
    bubble.style.top = "68%";
  }
}

export function installStoryRouteBridge(proto: AppPrototype): void {
  const originalNewMemory = proto.newMemory;
  if (!originalNewMemory) return;

  proto.newMemory = function(this: AppLike, ...args: unknown[]): unknown {
    if (this.scene === "title") {
      showThreshold(this, originalNewMemory);
      return;
    }
    return originalNewMemory.apply(this, args);
  };

  const originalDrawTitle = proto.drawTitle;
  if (originalDrawTitle) {
    proto.drawTitle = function(this: AppLike, time: unknown): unknown {
      drawPolishedTitle(this, typeof time === "number" ? time : performance.now());
      return;
    };
  }

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
      const chapterId = typeof args[0] === "string" ? args[0] : sessionFor(this).activeChapterId;
      if (sessionFor(this).returningToStory && chapterId) saveProgress(markStoryChapterCompleted(loadProgress(), chapterId));
      return result;
    };
  }

  const originalFinishReturn = proto.finishReturnToForest;
  if (originalFinishReturn) {
    proto.finishReturnToForest = function(this: AppLike, ...args: unknown[]): unknown {
      const result = originalFinishReturn.apply(this, args);
      finishStoryReturn(this, originalNewMemory);
      return result;
    };
  }

  const originalFinishBakery = proto.finishBakery;
  if (originalFinishBakery) {
    proto.finishBakery = function(this: AppLike, ...args: unknown[]): unknown {
      const result = originalFinishBakery.apply(this, args);
      finishStoryReturn(this, originalNewMemory);
      return result;
    };
  }
}
