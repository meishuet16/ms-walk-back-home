export type InputState = {
  x: number;
  y: number;
  interact: boolean;
};

export class InputManager {
  private keys = new Set<string>();
  private touch = { x: 0, y: 0 };
  private interactionQueued = false;

  constructor(private root: HTMLElement) {
    window.addEventListener("keydown", (event) => {
      this.keys.add(event.key.toLowerCase());
      if (event.key === "Enter" || event.key.toLowerCase() === "e") this.interactionQueued = true;
    });
    window.addEventListener("keyup", (event) => this.keys.delete(event.key.toLowerCase()));
  }

  mountTouchControls(onInteract: () => void): HTMLElement {
    const wrap = document.createElement("div");
    wrap.className = "touch-controls";
    wrap.innerHTML = `<div class="touch-stick" aria-label="Touch movement"></div><button class="touch-action">E</button>`;
    const stick = wrap.querySelector<HTMLElement>(".touch-stick")!;
    stick.addEventListener("pointermove", (event) => {
      const rect = stick.getBoundingClientRect();
      this.touch = {
        x: ((event.clientX - rect.left) / rect.width - 0.5) * 2,
        y: ((event.clientY - rect.top) / rect.height - 0.5) * 2
      };
    });
    stick.addEventListener("pointerleave", () => (this.touch = { x: 0, y: 0 }));
    wrap.querySelector("button")!.addEventListener("click", onInteract);
    this.root.append(wrap);
    return wrap;
  }

  read(): InputState {
    let x = 0;
    let y = 0;
    if (this.keys.has("arrowleft") || this.keys.has("a")) x -= 1;
    if (this.keys.has("arrowright") || this.keys.has("d")) x += 1;
    if (this.keys.has("arrowup") || this.keys.has("w")) y -= 1;
    if (this.keys.has("arrowdown") || this.keys.has("s")) y += 1;
    x += this.touch.x;
    y += this.touch.y;
    const length = Math.hypot(x, y);
    if (length > 1) {
      x /= length;
      y /= length;
    }
    const interact = this.interactionQueued;
    this.interactionQueued = false;
    return { x, y, interact };
  }
}
