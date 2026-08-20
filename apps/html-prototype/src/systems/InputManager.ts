export type InputState = {
  x: number;
  y: number;
  interact: boolean;
};

export type TouchControlKey = "stick" | "action";
export type TouchControlPosition = { left: number; top: number };
export type TouchControlPositions = Partial<Record<TouchControlKey, TouchControlPosition>>;

const touchControlStorageKey = "walk-back-home-touch-controls";
const safeViewportMargin = 4;

export class InputManager {
  private keys = new Set<string>();
  private touch = { x: 0, y: 0 };
  private interactionQueued = false;
  private touchActionButton: HTMLButtonElement | null = null;
  private touchControls: HTMLElement | null = null;
  private editDrag: { element: HTMLElement; pointerId: number; offsetX: number; offsetY: number } | null = null;
  private stickPointerId: number | null = null;
  private editing = false;
  private editSnapshot: TouchControlPositions | null = null;

  constructor(private root: HTMLElement) {
    window.addEventListener("keydown", (event) => {
      this.keys.add(event.key.toLowerCase());
      if (event.key === "Enter" || event.key.toLowerCase() === "e") this.interactionQueued = true;
    });
    window.addEventListener("keyup", (event) => this.keys.delete(event.key.toLowerCase()));
    window.addEventListener("resize", () => this.clampTouchControlsToViewport());
    document.addEventListener("fullscreenchange", () => this.clampTouchControlsToViewport());
  }

  mountTouchControls(onInteract: () => void, mountParent: HTMLElement = this.root): HTMLElement {
    if (this.touchControls) return this.touchControls;
    const wrap = document.createElement("div");
    wrap.className = "touch-controls";
    wrap.innerHTML = `<div class="touch-stick" data-touch-control="stick" aria-label="Virtual joystick"></div><button class="touch-action" data-touch-control="action" aria-label="Interact"><span class="touch-action-label">A</span></button>`;
    this.touchControls = wrap;
    const stick = wrap.querySelector<HTMLElement>(".touch-stick")!;
    this.touchActionButton = wrap.querySelector<HTMLButtonElement>(".touch-action");
    const actionButton = this.touchActionButton!;
    this.restoreTouchControlPositions(wrap);

    stick.addEventListener("pointerdown", (event) => {
      if (this.editing) {
        this.beginEditDrag(stick, event);
        return;
      }
      stick.setPointerCapture?.(event.pointerId);
      this.stickPointerId = event.pointerId;
      this.updateTouchStick(stick, event);
    });
    stick.addEventListener("pointermove", (event) => {
      if (this.editing) {
        this.moveEditControl(event);
        return;
      }
      this.updateTouchStick(stick, event);
    });
    stick.addEventListener("pointerup", (event) => this.finishTouchPointer(event));
    stick.addEventListener("pointercancel", (event) => this.finishTouchPointer(event));
    stick.addEventListener("pointerleave", (event) => this.finishTouchPointer(event));

    actionButton.addEventListener("pointerdown", (event) => {
      if (this.editing) {
        this.beginEditDrag(actionButton, event);
        return;
      }
      actionButton.setPointerCapture?.(event.pointerId);
    });
    actionButton.addEventListener("pointermove", (event) => {
      if (this.editing) this.moveEditControl(event);
    });
    actionButton.addEventListener("pointerup", (event) => this.finishTouchPointer(event));
    actionButton.addEventListener("pointercancel", (event) => this.finishTouchPointer(event));
    actionButton.addEventListener("click", (event) => {
      if (this.editing || actionButton.dataset.suppressClick === "true") {
        delete actionButton.dataset.suppressClick;
        event.preventDefault();
        return;
      }
      onInteract();
    });

    mountParent.append(wrap);
    this.clampTouchControlsToViewport();
    return wrap;
  }

  setTouchInteractionLabel(label: string): void {
    if (this.touchActionButton) this.touchActionButton.setAttribute("aria-label", label);
  }

  beginTouchControlEdit(): void {
    if (!this.touchControls || this.editing) return;
    this.editing = true;
    this.touch = { x: 0, y: 0 };
    this.root.classList.add("touch-controls-editing");
    this.touchControls.dataset.editing = "true";
    this.root.dataset.touchControlsEditing = "true";
    this.editSnapshot = this.captureTouchControlPositions();
    this.clampTouchControlsToViewport();
  }

  saveTouchControlEdit(): void {
    if (!this.editing) return;
    this.clampTouchControlsToViewport();
    this.saveTouchControlPositions();
    this.finishTouchControlEdit();
  }

  cancelTouchControlEdit(): void {
    if (!this.editing) return;
    if (this.editSnapshot) this.applyTouchControlPositions(this.editSnapshot);
    this.clampTouchControlsToViewport();
    this.finishTouchControlEdit();
  }

  resetTouchControlEdit(): void {
    if (!this.editing || !this.touchControls) return;
    for (const control of Array.from(this.touchControls.querySelectorAll<HTMLElement>("[data-touch-control]"))) {
      control.style.left = "";
      control.style.top = "";
      control.style.right = "";
      control.style.bottom = "";
    }
    this.clampTouchControlsToViewport();
  }

  isTouchControlEditing(): boolean {
    return this.editing;
  }

  clampTouchControlsToViewport(): void {
    if (!this.touchControls) return;
    for (const control of Array.from(this.touchControls.querySelectorAll<HTMLElement>("[data-touch-control]"))) {
      const rect = control.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) continue;
      const left = Math.max(safeViewportMargin, Math.min(window.innerWidth - rect.width - safeViewportMargin, rect.left));
      const top = Math.max(safeViewportMargin, Math.min(window.innerHeight - rect.height - safeViewportMargin, rect.top));
      if (Math.abs(left - rect.left) > 0.5 || Math.abs(top - rect.top) > 0.5) this.applyTouchControlPosition(control, { left, top });
    }
  }

  private beginEditDrag(element: HTMLElement, event: PointerEvent): void {
    element.setPointerCapture?.(event.pointerId);
    const rect = element.getBoundingClientRect();
    this.editDrag = {
      element,
      pointerId: event.pointerId,
      offsetX: event.clientX - rect.left,
      offsetY: event.clientY - rect.top
    };
    element.dataset.dragging = "true";
    this.touch = { x: 0, y: 0 };
    event.preventDefault();
  }

  private moveEditControl(event: PointerEvent): void {
    if (!this.editDrag || this.editDrag.pointerId !== event.pointerId) return;
    const element = this.editDrag.element;
    const rect = element.getBoundingClientRect();
    const left = Math.max(safeViewportMargin, Math.min(window.innerWidth - rect.width - safeViewportMargin, event.clientX - this.editDrag.offsetX));
    const top = Math.max(safeViewportMargin, Math.min(window.innerHeight - rect.height - safeViewportMargin, event.clientY - this.editDrag.offsetY));
    this.applyTouchControlPosition(element, { left, top });
    element.dataset.suppressClick = "true";
    event.preventDefault();
  }

  private finishTouchPointer(event: PointerEvent): void {
    if (this.editing) {
      if (this.editDrag?.pointerId === event.pointerId) {
        delete this.editDrag.element.dataset.dragging;
        this.editDrag.element.dataset.suppressClick = "true";
        this.editDrag = null;
      }
      this.touch = { x: 0, y: 0 };
      return;
    }
    if (this.stickPointerId === event.pointerId) this.stickPointerId = null;
    this.touch = { x: 0, y: 0 };
  }

  private finishTouchControlEdit(): void {
    if (this.editDrag) delete this.editDrag.element.dataset.dragging;
    this.editDrag = null;
    this.editing = false;
    this.editSnapshot = null;
    this.root.classList.remove("touch-controls-editing");
    if (this.touchControls) {
      delete this.touchControls.dataset.editing;
      for (const control of Array.from(this.touchControls.querySelectorAll<HTMLElement>("[data-touch-control]"))) {
        delete control.dataset.dragging;
        delete control.dataset.suppressClick;
      }
    }
    delete this.root.dataset.touchControlsEditing;
    this.touch = { x: 0, y: 0 };
  }

  private updateTouchStick(stick: HTMLElement, event: PointerEvent): void {
    if (this.stickPointerId !== null && event.pointerId !== this.stickPointerId) return;
    const rect = stick.getBoundingClientRect();
    this.touch = {
      x: ((event.clientX - rect.left) / Math.max(1, rect.width) - 0.5) * 2,
      y: ((event.clientY - rect.top) / Math.max(1, rect.height) - 0.5) * 2
    };
  }

  private captureTouchControlPositions(): TouchControlPositions {
    const positions: TouchControlPositions = {};
    for (const control of Array.from(this.touchControls?.querySelectorAll<HTMLElement>("[data-touch-control]") ?? [])) {
      const key = control.dataset.touchControl as TouchControlKey;
      const rect = control.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) continue;
      positions[key] = { left: rect.left, top: rect.top };
    }
    return positions;
  }

  private applyTouchControlPositions(positions: TouchControlPositions): void {
    for (const control of Array.from(this.touchControls?.querySelectorAll<HTMLElement>("[data-touch-control]") ?? [])) {
      const key = control.dataset.touchControl as TouchControlKey;
      const position = positions[key];
      if (position) this.applyTouchControlPosition(control, position);
    }
  }

  private applyTouchControlPosition(control: HTMLElement, position: TouchControlPosition): void {
    control.style.left = `${position.left}px`;
    control.style.top = `${position.top}px`;
    control.style.right = "auto";
    control.style.bottom = "auto";
  }

  private restoreTouchControlPositions(wrap: HTMLElement): void {
    const saved = this.readTouchControlPositions();
    for (const control of Array.from(wrap.querySelectorAll<HTMLElement>("[data-touch-control]"))) {
      const key = control.dataset.touchControl as TouchControlKey;
      const point = saved[key];
      if (point) this.applyTouchControlPosition(control, point);
    }
  }

  private saveTouchControlPositions(): void {
    const positions = this.captureTouchControlPositions();
    localStorage.setItem(touchControlStorageKey, JSON.stringify(positions));
  }

  private readTouchControlPositions(): TouchControlPositions {
    try {
      const parsed = JSON.parse(localStorage.getItem(touchControlStorageKey) ?? "{}") as Record<string, unknown>;
      const positions: TouchControlPositions = {};
      for (const key of ["stick", "action"] as const) {
        const value = parsed[key] as Record<string, unknown> | undefined;
        const left = Number(value?.left);
        const top = Number(value?.top);
        if (Number.isFinite(left) && Number.isFinite(top)) {
          positions[key] = { left, top };
        }
      }
      return positions;
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
