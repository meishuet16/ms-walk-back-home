import { initializeStoryRouteStartup } from "./StoryRouteBridge.js";

type DoorLike = { chapterId?: string } | null | undefined;
type AppLike = {
  scene: string;
  canvas: HTMLCanvasElement;
  overlay: HTMLElement;
  currentDoor?: DoorLike;
  activeDoor?: DoorLike;
  newMemory?: () => unknown;
  [key: string]: unknown;
};

type AppPrototype = Record<string, ((...args: unknown[]) => unknown) | undefined>;

const FINAL_DREAM_ID = "final-dream-tomorrow";

function openThreshold(app: AppLike): void {
  initializeStoryRouteStartup(app);
  app.newMemory?.();
}

function injectWaysHome(app: AppLike): void {
  const shell = app.canvas.closest<HTMLElement>(".game-shell");
  const menu = shell?.querySelector<HTMLElement>(".menu-panel");
  if (!menu || menu.querySelector("[data-story-return='threshold']")) return;
  const button = document.createElement("button");
  button.type = "button";
  button.dataset.storyReturn = "threshold";
  button.textContent = "Ways Home";
  const room = menu.querySelector("[data-action='open-room']");
  room?.insertAdjacentElement("afterend", button) ?? menu.appendChild(button);
}

function bindWaysHome(app: AppLike): void {
  const shell = app.canvas.closest<HTMLElement>(".game-shell");
  if (!shell || shell.dataset.storyWaysHomeBound === "true") return;
  shell.dataset.storyWaysHomeBound = "true";
  shell.addEventListener("click", (event) => {
    const target = (event.target as HTMLElement | null)?.closest<HTMLElement>("[data-story-return='threshold']");
    if (!target) return;
    event.preventDefault();
    event.stopPropagation();
    openThreshold(app);
  });
}

function syncStoryRouteMuji(app: AppLike): void {
  const route = app.overlay.querySelector<HTMLElement>(".story-route-shell");
  if (!route) return;
  const world = route.querySelector<HTMLElement>(".story-route-world");
  const muji = route.querySelector<HTMLElement>(".story-route-muji");
  const current = route.querySelector<HTMLElement>(".story-node.is-current");
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
  const observer = new MutationObserver(() => {
    injectWaysHome(app);
    syncStoryRouteMuji(app);
  });
  observer.observe(app.overlay, { childList: true, subtree: true });
  const shell = app.canvas.closest<HTMLElement>(".game-shell");
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
      return result;
    };
  }

  const originalFinishReturn = proto.finishReturnToForest;
  if (originalFinishReturn) {
    proto.finishReturnToForest = function(this: AppLike, ...args: unknown[]): unknown {
      const chapterId = this.currentDoor?.chapterId ?? this.activeDoor?.chapterId;
      const result = originalFinishReturn.apply(this, args);
      if (chapterId === FINAL_DREAM_ID) {
        window.setTimeout(() => initializeStoryRouteStartup(this), 0);
      }
      return result;
    };
  }
}
