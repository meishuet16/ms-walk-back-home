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

function keepContextualForestPromptAnchored(app: AppLike): void {
  if (app.scene !== "forest" || !app.activeDoor) return;
  const bubble = promptHost(app).querySelector<HTMLElement>(".forest-world-prompt");
  if (bubble) positionPromptAtMuji(app, bubble);
}

export function installStoryRouteMobileFixBridge(proto: AppPrototype): void {
  const originalSyncSceneOrientation = proto.syncSceneOrientation;
  if (originalSyncSceneOrientation) {
    proto.syncSceneOrientation = function(this: AppLike, ...args: unknown[]): unknown {
      const sceneBeforeSync = this.scene;
      const result = originalSyncSceneOrientation.apply(this, args);
      // Keep the legacy orientation/layout sync, but cancel its old portrait-only
      // title -> forest shortcut so the new title/threshold flow can exist on mobile.
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
      keepContextualForestPromptAnchored(this);
      return result;
    };
  }
}
