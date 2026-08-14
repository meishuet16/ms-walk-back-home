export type InputState = {
  x: number;
  y: number;
  interact: boolean;
};

export class InputManager {
  private keys = new Set<string>();
  private touch = { x: 0, y: 0 };
  private interactionQueued = false;
  private touchActionButton: HTMLButtonElement | null = null;
  private dragControl: { element: HTMLElement; pointerId: number; offsetX: number; offsetY: number } | null = null;
  private stickPointerId: number | null = null;
  private dragTimer = 0;

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
    wrap.innerHTML = `<div class="touch-stick" data-touch-control="stick" aria-label="Virtual joystick"></div><button class="touch-action" data-touch-control="action" aria-label="Interact"><span class="touch-action-label">A</span></button>`;
    const stick = wrap.querySelector<HTMLElement>(".touch-stick")!;
    this.touchActionButton = wrap.querySelector<HTMLButtonElement>(".touch-action");
    const actionButton = this.touchActionButton!;
    this.restoreTouchControlPositions(wrap);
    stick.addEventListener("pointerdown", (event) => {
      stick.setPointerCapture?.(event.pointerId);
      this.stickPointerId = event.pointerId;
      this.prepareTouchControlDrag(stick, event);
      this.updateTouchStick(stick, event);
    });
    stick.addEventListener("pointermove", (event) => {
      if (this.dragControl?.pointerId === event.pointerId) {
        this.moveTouchControl(event);
        return;
      }
      this.updateTouchStick(stick, event);
    });
    stick.addEventListener("pointerup", (event) => this.finishTouchStick(event));
    stick.addEventListener("pointercancel", (event) => this.finishTouchStick(event));
    stick.addEventListener("pointerleave", (event) => this.finishTouchStick(event));
    actionButton.addEventListener("pointerdown", (event) => {
      actionButton.setPointerCapture?.(event.pointerId);
      this.prepareTouchControlDrag(actionButton, event);
    });
    actionButton.addEventListener("pointermove", (event) => {
      if (this.dragControl?.pointerId === event.pointerId) this.moveTouchControl(event);
    });
    actionButton.addEventListener("pointerup", (event) => this.finishTouchControlDrag(event));
    actionButton.addEventListener("pointercancel", (event) => this.finishTouchControlDrag(event));
    actionButton.addEventListener("click", (event) => {
      if ((event.currentTarget as HTMLElement).dataset.dragged === "true") {
        delete (event.currentTarget as HTMLElement).dataset.dragged;
        return;
      }
      onInteract();
    });
    this.root.append(wrap);
    return wrap;
  }

  setTouchInteractionLabel(label: string): void {
    if (this.touchActionButton) this.touchActionButton.setAttribute("aria-label", label);
  }

  private updateTouchStick(stick: HTMLElement, event: PointerEvent): void {
    if (this.stickPointerId !== null && event.pointerId !== this.stickPointerId) return;
    const rect = stick.getBoundingClientRect();
    this.touch = {
      x: ((event.clientX - rect.left) / rect.width - 0.5) * 2,
      y: ((event.clientY - rect.top) / rect.height - 0.5) * 2
    };
  }

  private prepareTouchControlDrag(element: HTMLElement, event: PointerEvent): void {
    window.clearTimeout(this.dragTimer);
    const rect = element.getBoundingClientRect();
    this.dragTimer = window.setTimeout(() => {
      this.dragControl = {
        element,
        pointerId: event.pointerId,
        offsetX: event.clientX - rect.left,
        offsetY: event.clientY - rect.top
      };
      element.dataset.dragging = "true";
      this.touch = { x: 0, y: 0 };
    }, 240);
  }

  private moveTouchControl(event: PointerEvent): void {
    if (!this.dragControl || this.dragControl.pointerId !== event.pointerId) return;
    const element = this.dragControl.element;
    const rect = element.getBoundingClientRect();
    const left = Math.max(4, Math.min(window.innerWidth - rect.width - 4, event.clientX - this.dragControl.offsetX));
    const top = Math.max(4, Math.min(window.innerHeight - rect.height - 4, event.clientY - this.dragControl.offsetY));
    element.style.left = `${left}px`;
    element.style.top = `${top}px`;
    element.style.right = "auto";
    element.style.bottom = "auto";
    element.dataset.dragged = "true";
    event.preventDefault();
  }

  private finishTouchStick(event: PointerEvent): void {
    window.clearTimeout(this.dragTimer);
    if (this.dragControl?.pointerId === event.pointerId) this.finishTouchControlDrag(event);
    if (this.stickPointerId === event.pointerId) this.stickPointerId = null;
    this.touch = { x: 0, y: 0 };
  }

  private finishTouchControlDrag(event: PointerEvent): void {
    window.clearTimeout(this.dragTimer);
    if (this.dragControl?.pointerId !== event.pointerId) return;
    this.saveTouchControlPositions();
    delete this.dragControl.element.dataset.dragging;
    this.dragControl = null;
  }

  private restoreTouchControlPositions(wrap: HTMLElement): void {
    const saved = this.readTouchControlPositions();
    for (const control of Array.from(wrap.querySelectorAll<HTMLElement>("[data-touch-control]"))) {
      const key = control.dataset.touchControl as "stick" | "action";
      const point = saved[key];
      if (!point) continue;
      control.style.left = `${point.left}px`;
      control.style.top = `${point.top}px`;
      control.style.right = "auto";
      control.style.bottom = "auto";
    }
  }

  private saveTouchControlPositions(): void {
    const positions: Record<string, { left: number; top: number }> = {};
    for (const control of Array.from(this.root.querySelectorAll<HTMLElement>("[data-touch-control]"))) {
      const rect = control.getBoundingClientRect();
      positions[control.dataset.touchControl ?? "control"] = { left: rect.left, top: rect.top };
    }
    localStorage.setItem("walk-back-home-touch-controls", JSON.stringify(positions));
  }

  private readTouchControlPositions(): Record<string, { left: number; top: number }> {
    try {
      return JSON.parse(localStorage.getItem("walk-back-home-touch-controls") ?? "{}") as Record<string, { left: number; top: number }>;
    } catch {
      return {};
    }
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
