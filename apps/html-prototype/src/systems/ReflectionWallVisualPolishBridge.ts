type ReflectionVisualHost = {
  overlay: HTMLElement;
  openReflectionWall: () => void;
  refreshReflectionWallOnly: () => void;
  showToast: (message: string) => void;
};

export const REFLECTION_WALL_BACKGROUND_KEY = "walk-back-home:reflection-wall-background:v1";

function readBackground(): string {
  try {
    return window.localStorage.getItem(REFLECTION_WALL_BACKGROUND_KEY) ?? "";
  } catch {
    return "";
  }
}

function writeBackground(value: string): boolean {
  try {
    if (value) window.localStorage.setItem(REFLECTION_WALL_BACKGROUND_KEY, value);
    else window.localStorage.removeItem(REFLECTION_WALL_BACKGROUND_KEY);
    return true;
  } catch {
    return false;
  }
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Unable to read image"));
    image.src = src;
  });
}

async function compressBackground(file: File): Promise<string> {
  const objectUrl = URL.createObjectURL(file);
  try {
    const image = await loadImage(objectUrl);
    const maxSide = 1600;
    const scale = Math.min(1, maxSide / Math.max(image.naturalWidth || 1, image.naturalHeight || 1));
    const width = Math.max(1, Math.round(image.naturalWidth * scale));
    const height = Math.max(1, Math.round(image.naturalHeight * scale));
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Canvas is unavailable");
    context.drawImage(image, 0, 0, width, height);
    return canvas.toDataURL("image/jpeg", 0.8);
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

function clearBackground(target: HTMLElement): void {
  target.classList.remove("has-custom-background");
  target.style.removeProperty("background-image");
  target.style.removeProperty("background-size");
  target.style.removeProperty("background-position");
  target.style.removeProperty("background-repeat");
}

function applySurfaceBackground(target: HTMLElement, background: string): void {
  target.classList.add("has-custom-background");
  target.style.setProperty(
    "background-image",
    `linear-gradient(180deg, rgba(17,45,61,.10), rgba(10,29,41,.22)), url(${JSON.stringify(background)})`,
    "important"
  );
  target.style.setProperty("background-size", "cover", "important");
  target.style.setProperty("background-position", "center top", "important");
  target.style.setProperty("background-repeat", "no-repeat", "important");
}

function applyBackground(app: ReflectionVisualHost): void {
  const canvas = app.overlay.querySelector<HTMLElement>("[data-reflection-canvas]");
  const list = app.overlay.querySelector<HTMLElement>(".reflection-kept-list");
  const wall = app.overlay.querySelector<HTMLElement>(".reflection-kept-wall");
  const background = readBackground();

  /* Wall and List occupy the same second grid row under the same header. Applying the same
     cover/center-top image to that viewport keeps the crop invariant when the view changes.
     Do not give List an artificial content-height min-height: that changes cover geometry. */
  if (wall) {
    wall.classList.toggle("has-custom-background", Boolean(background));
    if (background) wall.style.setProperty("--rw-custom-background", `url(${JSON.stringify(background)})`);
    else wall.style.removeProperty("--rw-custom-background");
    wall.style.removeProperty("background-image");
    wall.style.removeProperty("background-size");
    wall.style.removeProperty("background-position");
    wall.style.removeProperty("background-repeat");
  }

  if (!background) {
    if (canvas) clearBackground(canvas);
    if (list) clearBackground(list);
    return;
  }

  if (canvas) applySurfaceBackground(canvas, background);
  if (list) applySurfaceBackground(list, background);
}

function installWallLookControls(app: ReflectionVisualHost): void {
  const panel = app.overlay.querySelector<HTMLElement>(".reflection-find-panel");
  if (!panel || panel.querySelector("[data-reflection-wall-look]")) return;
  const hasBackground = Boolean(readBackground());
  const controls = document.createElement("section");
  controls.className = "reflection-wall-look-controls";
  controls.setAttribute("data-reflection-wall-look", "");
  controls.innerHTML = `<div class="reflection-wall-look-copy"><span>Wall background</span><small>${hasBackground ? "Using your photo" : "Using the room wall"}</small></div><div class="reflection-wall-look-actions"><input class="reflection-wall-photo-input" type="file" accept="image/*" aria-label="Choose Reflection Wall background image"><button type="button" class="reflection-wall-photo-button">${hasBackground ? "Change photo" : "Choose photo"}</button>${hasBackground ? `<button type="button" class="reflection-wall-photo-reset" aria-label="Restore the room wall">Use room wall</button>` : ""}</div>`;
  const hint = panel.querySelector(".reflection-find-hint");
  if (hint) panel.insertBefore(controls, hint);
  else panel.append(controls);

  const input = controls.querySelector<HTMLInputElement>(".reflection-wall-photo-input");
  const choose = controls.querySelector<HTMLButtonElement>(".reflection-wall-photo-button");
  const reset = controls.querySelector<HTMLButtonElement>(".reflection-wall-photo-reset");
  choose?.addEventListener("click", () => input?.click());
  input?.addEventListener("change", async () => {
    const file = input.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      app.showToast("Choose an image for the wall.");
      return;
    }
    try {
      const dataUrl = await compressBackground(file);
      if (!writeBackground(dataUrl)) {
        app.showToast("This image is too large to keep here.");
        return;
      }
      app.openReflectionWall();
      app.showToast("Wall background changed.");
    } catch {
      app.showToast("Unable to use that image.");
    }
  });
  reset?.addEventListener("click", () => {
    writeBackground("");
    app.openReflectionWall();
    app.showToast("Room wall restored.");
  });
}

function decorateWall(app: ReflectionVisualHost, scrollTop: number): void {
  applyBackground(app);
  installWallLookControls(app);
  const canvas = app.overlay.querySelector<HTMLElement>("[data-reflection-canvas]");
  if (canvas) {
    const maxScroll = Math.max(0, canvas.scrollHeight - canvas.clientHeight);
    canvas.scrollTop = Math.min(scrollTop, maxScroll);
  }
}

export function installReflectionWallVisualPolishBridge(prototype: object): void {
  const appPrototype = prototype as ReflectionVisualHost;

  const openReflectionWall = appPrototype.openReflectionWall;
  appPrototype.openReflectionWall = function (): void {
    const scrollTop = this.overlay.querySelector<HTMLElement>("[data-reflection-canvas]")?.scrollTop ?? 0;
    openReflectionWall.call(this);
    requestAnimationFrame(() => decorateWall(this, scrollTop));
  };

  const refreshReflectionWallOnly = appPrototype.refreshReflectionWallOnly;
  appPrototype.refreshReflectionWallOnly = function (): void {
    const scrollTop = this.overlay.querySelector<HTMLElement>("[data-reflection-canvas]")?.scrollTop ?? 0;
    refreshReflectionWallOnly.call(this);
    requestAnimationFrame(() => decorateWall(this, scrollTop));
  };
}
