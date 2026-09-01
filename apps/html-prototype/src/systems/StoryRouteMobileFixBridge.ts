type AppLike = {
  scene: string;
  player: { x: number; y: number };
  canvas: HTMLCanvasElement;
  hud: HTMLElement;
  activeDoor: unknown;
  currentDoor: unknown;
  currentSceneLayout?: (scene?: string) => unknown;
  sceneViewport?: (layout: unknown) => { w: number; h: number };
  sceneCamera?: (layout: unknown, width: number, height: number) => { x: number; y: number };
  [key: string]: unknown;
};

type AppPrototype = Record<string, ((...args: unknown[]) => unknown) | undefined>;

function promptHost(app: AppLike): HTMLElement {
  return app.canvas.parentElement ?? app.hud;
}

function positionPromptAtMuji(app: AppLike, bubble: HTMLElement): void {
  try {
    const layout = app.currentSceneLayout?.("forest");
    if (!layout || !app.sceneViewport || !app.sceneCamera) throw new Error("no scene projection");
    const viewport = app.sceneViewport(layout);
    const camera = app.sceneCamera(layout, viewport.w, viewport.h);
    const canvasRect = app.canvas.getBoundingClientRect();
    const canvasScaleX = canvasRect.width / viewport.w;
    const canvasScaleY = canvasRect.height / viewport.h;
    const x = (app.player.x - camera.x) * canvasScaleX;
    const y = (app.player.y - camera.y) * canvasScaleY;
    const left = Math.max(58, Math.min(canvasRect.width - 58, x));
    const top = Math.max(70, Math.min(canvasRect.height - 96, y - 24));
    bubble.style.left = `${left}px`;
    bubble.style.top = `${top}px`;
  } catch {
    bubble.style.left = "50%";
    bubble.style.top = "58%";
  }
}

function ensureForestPrompt(app: AppLike): void {
  if (app.scene !== "forest") return;
  const host = promptHost(app);
  let bubble = host.querySelector<HTMLElement>(".forest-world-prompt");
  if (!bubble) {
    bubble = document.createElement("div");
    bubble.className = "forest-world-prompt";
    host.appendChild(bubble);
  }

  // StoryRouteBridge supplies the richer chapter/memory copy whenever an
  // interaction is active. This fallback keeps the original movement/control
  // hint near Muji instead of leaving an empty bottom-left slot.
  if (!app.activeDoor) {
    const touch = matchMedia("(pointer: coarse)").matches;
    bubble.innerHTML = touch
      ? "<strong>Virtual joystick · A</strong>"
      : "<strong>Move · WASD / Arrows · E</strong>";
  }
  positionPromptAtMuji(app, bubble);
}

export function installStoryRouteMobileFixBridge(proto: AppPrototype): void {
  const originalSyncSceneOrientation = proto.syncSceneOrientation;
  if (originalSyncSceneOrientation) {
    proto.syncSceneOrientation = function(this: AppLike, ...args: unknown[]): unknown {
      const sceneBeforeSync = this.scene;
      const result = originalSyncSceneOrientation.apply(this, args);
      // The legacy portrait shortcut intentionally skipped the title by forcing
      // title -> forest. Story Route now needs the title on mobile too, so keep
      // orientation/layout syncing but cancel only that legacy scene mutation.
      if (sceneBeforeSync === "title" && this.scene === "forest") {
        this.scene = "title";
        this.currentDoor = null;
        this.activeDoor = null;
      }
      return result;
    };
  }

  const originalDrawHud = proto.drawHud;
  if (originalDrawHud) {
    proto.drawHud = function(this: AppLike, ...args: unknown[]): unknown {
      const result = originalDrawHud.apply(this, args);
      ensureForestPrompt(this);
      return result;
    };
  }
}
