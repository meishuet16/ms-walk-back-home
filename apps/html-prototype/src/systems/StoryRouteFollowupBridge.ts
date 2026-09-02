import { initializeStoryRouteStartup } from "./StoryRouteBridge.js";
import { markStoryChapterCompleted, normalizeStoryRouteProgress } from "./StoryRoute.js";

type DoorLike = { chapterId?: string } | null | undefined;
type AppLike = {
  scene: string;
  canvas: HTMLCanvasElement;
  overlay: HTMLElement;
  currentDoor?: DoorLike;
  activeDoor?: DoorLike;
  newMemory?: () => unknown;
  activateRoomInteraction?: (interaction: { id: string }) => void;
  toggleFullscreen?: () => Promise<void> | void;
  [key: string]: unknown;
};

type AppPrototype = Record<string, ((...args: unknown[]) => unknown) | undefined>;
type QuickDestination = "records" | "threshold" | "forest" | "room" | "capsule" | "reflection" | "timeline" | "fullscreen";

const FINAL_DREAM_ID = "final-dream-tomorrow";
const STORY_PROGRESS_KEY = "walk-back-home:story-route-progress:v1";

function openThreshold(app: AppLike): void {
  initializeStoryRouteStartup(app);
  app.newMemory?.();
}

function markFinalDreamComplete(): void {
  try {
    const progress = normalizeStoryRouteProgress(JSON.parse(localStorage.getItem(STORY_PROGRESS_KEY) ?? "null"));
    localStorage.setItem(STORY_PROGRESS_KEY, JSON.stringify(markStoryChapterCompleted(progress, FINAL_DREAM_ID)));
  } catch {
    // Final Dream can still return to the title even if local storage is unavailable.
  }
}

function shellFor(app: AppLike): HTMLElement | null {
  return app.canvas.closest<HTMLElement>(".game-shell");
}

function topMenuFor(app: AppLike): HTMLElement | null {
  return shellFor(app)?.querySelector<HTMLElement>(".top-menu") ?? null;
}

function injectWaysHome(app: AppLike): void {
  const menu = shellFor(app)?.querySelector<HTMLElement>(".menu-panel");
  if (!menu || menu.querySelector("[data-story-return='threshold']")) return;
  const button = document.createElement("button");
  button.type = "button";
  button.dataset.storyReturn = "threshold";
  button.textContent = "Ways Home";
  const room = menu.querySelector("[data-action='open-room']");
  room?.insertAdjacentElement("afterend", button) ?? menu.appendChild(button);
}

function bindWaysHome(app: AppLike): void {
  const shell = shellFor(app);
  if (!shell || shell.dataset.storyWaysHomeBound === "true") return;
  shell.dataset.storyWaysHomeBound = "true";
  shell.addEventListener("click", (event) => {
    const target = (event.target as HTMLElement | null)?.closest<HTMLElement>("[data-story-return='threshold']");
    if (!target) return;
    event.preventDefault();
    event.stopPropagation();
    closeAllNavigation(shell);
    openThreshold(app);
  });
}

function vinylIcon(): string {
  return `<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.5" cy="12" r="7.2"/><circle cx="10.5" cy="12" r="2.1"/><circle cx="10.5" cy="12" r=".55" class="fill"/><path d="M17.3 5.3h2.5v5.2l-3.1 3.1"/><circle cx="16.2" cy="14.1" r="1"/></svg>`;
}

function thresholdIcon(): string {
  return `<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="5" r="1.5" class="fill"/><circle cx="5" cy="18" r="1.5" class="fill"/><circle cx="19" cy="18" r="1.5" class="fill"/><path d="M12 6.8v4.1M12 10.9 5.8 16.4M12 10.9l6.2 5.5"/></svg>`;
}

function forestIcon(): string {
  return `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3 7.2 10h3L6.4 16h4.2v4h2.8v-4h4.2l-3.8-6h3z"/></svg>`;
}

function roomIcon(): string {
  return `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 11.2 12 4l8 7.2V20h-6v-5h-4v5H4z"/></svg>`;
}

function capsuleIcon(): string {
  return `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7.1 16.9a5 5 0 0 1 0-7.1l2.7-2.7a5 5 0 0 1 7.1 7.1l-2.7 2.7a5 5 0 0 1-7.1 0Z"/><path d="m9.1 8.1 6.8 6.8"/></svg>`;
}

function reflectionIcon(): string {
  return `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 4.5h11.5v14H6z"/><path d="m15.7 3.5 2.8 2.8M8.3 9.2h6.8M8.3 12h5.1M8.3 14.8h4"/></svg>`;
}

function timelineIcon(): string {
  return `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 4v16"/><circle cx="8" cy="6" r="1.7" class="fill"/><circle cx="8" cy="12" r="1.7" class="fill"/><circle cx="8" cy="18" r="1.7" class="fill"/><path d="M11.5 6h6M11.5 12h4.5M11.5 18h6"/></svg>`;
}

function fullscreenIcon(): string {
  return `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8.5 4.5h-4v4M15.5 4.5h4v4M4.5 15.5v4h4M19.5 15.5v4h-4"/></svg>`;
}

const quickItems: Array<{ id: QuickDestination; label: string; icon: () => string }> = [
  { id: "records", label: "Records", icon: vinylIcon },
  { id: "threshold", label: "Ways Home", icon: thresholdIcon },
  { id: "forest", label: "The Forest", icon: forestIcon },
  { id: "room", label: "Muji Room", icon: roomIcon },
  { id: "capsule", label: "Capsule", icon: capsuleIcon },
  { id: "reflection", label: "Reflection Wall", icon: reflectionIcon },
  { id: "timeline", label: "Timeline", icon: timelineIcon },
  { id: "fullscreen", label: "Fullscreen", icon: fullscreenIcon }
];

function quickDockMarkup(): string {
  return `<div class="quick-access" data-quick-access>
    <button class="quick-access-trigger" type="button" data-quick-trigger aria-label="Open quick travel" aria-expanded="false">
      <span aria-hidden="true">◇</span>
    </button>
    <div class="quick-access-rail" data-quick-rail hidden>
      ${quickItems.map((item, index) => `<button class="quick-access-item${index === 1 || index === 4 || index === 7 ? " quick-access-group-start" : ""}" type="button" data-quick-destination="${item.id}" aria-label="${item.label}" title="${item.label}">${item.icon()}<span class="sr-only">${item.label}</span></button>`).join("")}
    </div>
  </div>`;
}

function setQuickAccessOpen(shell: HTMLElement, open: boolean): void {
  const dock = shell.querySelector<HTMLElement>("[data-quick-access]");
  const trigger = dock?.querySelector<HTMLButtonElement>("[data-quick-trigger]");
  const rail = dock?.querySelector<HTMLElement>("[data-quick-rail]");
  if (!dock || !trigger || !rail) return;
  dock.classList.toggle("is-open", open);
  trigger.setAttribute("aria-expanded", String(open));
  trigger.setAttribute("aria-label", open ? "Close quick travel" : "Open quick travel");
  rail.hidden = !open;
}

function closeHamburger(shell: HTMLElement): void {
  const details = shell.querySelector<HTMLDetailsElement>(".top-actions-menu");
  if (details?.open) details.open = false;
}

function closeAllNavigation(shell: HTMLElement): void {
  setQuickAccessOpen(shell, false);
  closeHamburger(shell);
}

function menuButtonByLabel(shell: HTMLElement, label: string): HTMLButtonElement | null {
  const buttons = [...shell.querySelectorAll<HTMLButtonElement>(".menu-panel button")];
  return buttons.find((button) => button.textContent?.trim().toLowerCase() === label.toLowerCase()) ?? null;
}

function existingNavigationButton(shell: HTMLElement, destination: "records" | "forest" | "room" | "reflection" | "timeline"): HTMLButtonElement | null {
  const selectors: Record<"records" | "forest" | "room" | "reflection" | "timeline", string[]> = {
    records: ["[data-action='room-records']"],
    forest: ["[data-action='forest']"],
    room: ["[data-action='open-room']"],
    reflection: ["[data-action='reflection-wall']", "[data-action='open-reflection-wall']", "[data-action='open-reflections']"],
    timeline: ["[data-action='open-timeline']"]
  };
  for (const selector of selectors[destination]) {
    const button = shell.querySelector<HTMLButtonElement>(`.menu-panel ${selector}`);
    if (button) return button;
  }
  const labels: Record<"records" | "forest" | "room" | "reflection" | "timeline", string[]> = {
    records: ["Records"],
    forest: ["Forest", "The Forest"],
    room: ["Muji Room"],
    reflection: ["Reflection Wall", "Reflections"],
    timeline: ["Timeline"]
  };
  for (const label of labels[destination]) {
    const button = menuButtonByLabel(shell, label);
    if (button) return button;
  }
  return null;
}

function activateQuickDestination(app: AppLike, destination: QuickDestination): void {
  const shell = shellFor(app);
  if (!shell) return;
  closeAllNavigation(shell);
  if (destination === "threshold") {
    openThreshold(app);
    return;
  }
  if (destination === "capsule") {
    app.activateRoomInteraction?.({ id: "capsule" });
    return;
  }
  if (destination === "fullscreen") {
    void app.toggleFullscreen?.();
    return;
  }
  existingNavigationButton(shell, destination)?.click();
}

function bindQuickAccess(app: AppLike): void {
  const shell = shellFor(app);
  if (!shell || shell.dataset.quickAccessBound === "true") return;
  shell.dataset.quickAccessBound = "true";

  shell.addEventListener("click", (event) => {
    const target = event.target as HTMLElement | null;
    const trigger = target?.closest<HTMLElement>("[data-quick-trigger]");
    if (trigger) {
      event.preventDefault();
      event.stopPropagation();
      const dock = trigger.closest<HTMLElement>("[data-quick-access]");
      const opening = !dock?.classList.contains("is-open");
      closeHamburger(shell);
      setQuickAccessOpen(shell, opening);
      return;
    }
    const item = target?.closest<HTMLElement>("[data-quick-destination]");
    if (!item) return;
    event.preventDefault();
    event.stopPropagation();
    activateQuickDestination(app, item.dataset.quickDestination as QuickDestination);
  });

  shell.addEventListener("toggle", (event) => {
    const details = event.target as HTMLDetailsElement | null;
    if (!details?.matches?.(".top-actions-menu") || !details.open) return;
    setQuickAccessOpen(shell, false);
  }, true);

  document.addEventListener("pointerdown", (event) => {
    const target = event.target as Node | null;
    if (!target || !document.contains(target)) return;
    const dock = shell.querySelector<HTMLElement>("[data-quick-access]");
    const details = shell.querySelector<HTMLDetailsElement>(".top-actions-menu");
    if (dock?.classList.contains("is-open") && !dock.contains(target)) setQuickAccessOpen(shell, false);
    if (details?.open && !details.contains(target)) details.open = false;
    if (details?.open && target instanceof Element && target.closest("[data-quick-trigger]")) details.open = false;
  }, true);
}

function injectQuickAccess(app: AppLike): void {
  const topMenu = topMenuFor(app);
  if (!topMenu || topMenu.querySelector("[data-quick-access]")) return;
  topMenu.insertAdjacentHTML("beforeend", quickDockMarkup());
  bindQuickAccess(app);
}

function syncStoryRouteMuji(app: AppLike): void {
  const route = app.overlay.querySelector<HTMLElement>(".story-route-shell");
  if (!route) return;
  const world = route.querySelector<HTMLElement>(".story-route-world");
  const muji = route.querySelector<HTMLElement>(".story-route-muji");
  const current = route.querySelector<HTMLElement>(".story-node.is-current")
    ?? route.querySelector<HTMLElement>(".story-node.is-final");
  const path = route.querySelector<SVGPathElement>(".story-route-line path");
  const nodes = [...route.querySelectorAll<HTMLElement>(".story-node")];
  if (!world || !muji || !current) return;

  const x = current.style.getPropertyValue("--story-x").trim();
  const y = current.style.getPropertyValue("--story-y").trim();
  if (x && y) {
    muji.style.left = x;
    muji.style.top = y;
    muji.classList.add("is-following-current");
  }

  const routePoints = nodes.map((node) => {
    const px = parseFloat(node.style.getPropertyValue("--story-x"));
    const py = parseFloat(node.style.getPropertyValue("--story-y"));
    return Number.isFinite(px) && Number.isFinite(py) ? [px, py] as const : null;
  }).filter((point): point is readonly [number, number] => point !== null);

  if (path && routePoints.length) {
    path.setAttribute("d", routePoints.map(([px, py], index) => `${index === 0 ? "M" : "L"} ${px} ${py}`).join(" "));
    const lastY = routePoints[routePoints.length - 1][1];
    const height = Math.max(1540, lastY + 150);
    world.style.height = `${height}px`;
    world.style.minHeight = `${height}px`;
    const svg = route.querySelector<SVGSVGElement>(".story-route-line");
    if (svg) {
      svg.setAttribute("viewBox", `0 0 100 ${height}`);
      svg.style.height = `${height}px`;
    }
  }
}

export function initializeStoryRouteFollowups(appObject: object): void {
  const app = appObject as AppLike;
  bindWaysHome(app);
  injectWaysHome(app);
  injectQuickAccess(app);
  bindQuickAccess(app);
  const observer = new MutationObserver(() => {
    injectWaysHome(app);
    injectQuickAccess(app);
    syncStoryRouteMuji(app);
  });
  observer.observe(app.overlay, { childList: true, subtree: true });
  const shell = shellFor(app);
  if (shell) observer.observe(shell, { childList: true, subtree: true });
  syncStoryRouteMuji(app);
}

export function installStoryRouteFollowupBridge(proto: AppPrototype): void {
  const originalRenderTopNav = proto.renderTopNav;
  if (originalRenderTopNav) {
    proto.renderTopNav = function(this: AppLike, ...args: unknown[]): unknown {
      const result = originalRenderTopNav.apply(this, args);
      injectWaysHome(this);
      bindWaysHome(this);
      injectQuickAccess(this);
      bindQuickAccess(this);
      return result;
    };
  }

  const originalFinishReturn = proto.finishReturnToForest;
  if (originalFinishReturn) {
    proto.finishReturnToForest = function(this: AppLike, ...args: unknown[]): unknown {
      const chapterId = this.currentDoor?.chapterId ?? this.activeDoor?.chapterId;
      const result = originalFinishReturn.apply(this, args);
      if (chapterId === FINAL_DREAM_ID) {
        markFinalDreamComplete();
        window.setTimeout(() => initializeStoryRouteStartup(this), 0);
      }
      return result;
    };
  }
}
