type EntryApp = {
  scene: string;
  canvas: HTMLCanvasElement;
  overlay: HTMLElement;
  hud: HTMLElement;
  newMemory?: () => void;
  [key: string]: unknown;
};

const entryScenes = new Set(["title", "threshold", "story-route"]);
const initializedApps = new WeakSet<object>();

function shellFor(app: EntryApp): HTMLElement | null {
  return app.canvas.closest<HTMLElement>(".game-shell");
}

function stageFor(app: EntryApp): HTMLElement | null {
  return app.canvas.closest<HTMLElement>(".stage-wrap");
}

function titleMarkup(): string {
  return `
    <section class="story-title-screen" aria-label="Walk Back Home title screen">
      <div class="story-title-shade" aria-hidden="true"></div>
      <div class="story-title-copy">
        <small>A walk through memories that still glow</small>
        <h1>Walk Back Home</h1>
        <p>Where every memory leads me home.</p>
      </div>
      <button class="story-title-start" type="button">
        <strong>Begin the walk</strong><span aria-hidden="true">→</span>
      </button>
      <p class="story-title-hint">Tap anywhere to begin</p>
    </section>`;
}

function ensureTitleScreen(app: EntryApp): void {
  if (app.scene !== "title") return;
  if (app.overlay.querySelector(".story-title-screen")) return;
  app.overlay.classList.remove("dialogue-open", "lightweight-presentation");
  app.overlay.innerHTML = titleMarkup();
}

function syncEntryPresentation(app: EntryApp): void {
  const isEntryScene = entryScenes.has(app.scene);
  shellFor(app)?.classList.toggle("story-entry-shell", isEntryScene);
  stageFor(app)?.classList.toggle("story-entry-stage", isEntryScene);
  app.hud.classList.toggle("story-entry-hud-hidden", isEntryScene);
  if (app.scene === "title") ensureTitleScreen(app);
}

function beginFromTitle(app: EntryApp): void {
  if (app.scene !== "title") return;
  app.newMemory?.();
  queueMicrotask(() => syncEntryPresentation(app));
}

export function initializeStoryEntryUi(appObject: object): void {
  if (initializedApps.has(appObject)) return;
  initializedApps.add(appObject);
  const app = appObject as EntryApp;

  syncEntryPresentation(app);

  // Mobile needs a real pointer target. The whole title surface is intentionally
  // tappable; the visible button is only an affordance, not the sole hit target.
  app.overlay.addEventListener("pointerup", (event) => {
    if (app.scene !== "title") {
      queueMicrotask(() => syncEntryPresentation(app));
      return;
    }
    const target = event.target as HTMLElement | null;
    if (!target?.closest(".story-title-screen")) return;
    event.preventDefault();
    beginFromTitle(app);
  });

  // Keep keyboard accessibility without relying on the canvas input layer.
  app.overlay.addEventListener("click", (event) => {
    if (app.scene === "title" && (event.target as HTMLElement | null)?.closest(".story-title-start")) {
      event.preventDefault();
      beginFromTitle(app);
      return;
    }
    queueMicrotask(() => syncEntryPresentation(app));
  });

  // Threshold / Story Route replace overlay content as navigation happens.
  // Observe those replacements so the full-height entry shell is removed again
  // immediately when the player returns to the normal Forest or Muji Room.
  const observer = new MutationObserver(() => queueMicrotask(() => syncEntryPresentation(app)));
  observer.observe(app.overlay, { childList: true, subtree: true });
}
