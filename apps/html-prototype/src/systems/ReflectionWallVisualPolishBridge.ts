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
    return canvas.toDataURL("image/jpeg", 0.82);
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

function applyBackground(app: ReflectionVisualHost): void {
  const canvas = app.overlay.querySelector<HTMLElement>("[data-reflection-canvas]");
  if (!canvas) return;
  const background = readBackground();
  canvas.classList.toggle("has-custom-background", Boolean(background));
  if (background) canvas.style.setProperty("--rw-custom-background", `url(${JSON.stringify(background)})`);
  else canvas.style.removeProperty("--rw-custom-background");
}

function installWallLookControls(app: ReflectionVisualHost): void {
  const canvas = app.overlay.querySelector<HTMLElement>("[data-reflection-canvas]");
  if (!canvas || canvas.querySelector("[data-reflection-wall-look]")) return;
  const hasBackground = Boolean(readBackground());
  const controls = document.createElement("div");
  controls.className = "reflection-wall-look-controls";
  controls.setAttribute("data-reflection-wall-look", "");
  controls.innerHTML = `<input class="reflection-wall-photo-input" type="file" accept="image/*" aria-label="Choose Reflection Wall background image"><button type="button" class="reflection-wall-photo-button" aria-label="Choose wall background"><span aria-hidden="true">▧</span><span>Wall photo</span></button>${hasBackground ? `<button type="button" class="reflection-wall-photo-reset">Use room wall</button>` : ""}`;
  canvas.append(controls);

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
      applyBackground(app);
      app.showToast("Wall background changed.");
      app.openReflectionWall();
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
  if (canvas && scrollTop > 0) canvas.scrollTop = Math.min(scrollTop, Math.max(0, canvas.scrollHeight - canvas.clientHeight));
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
