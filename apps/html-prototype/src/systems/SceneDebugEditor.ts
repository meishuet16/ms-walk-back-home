import { cloneSceneLayout, loadSceneLayoutOverrides, makeDefaultLayout, sceneLayoutManifest, setSceneLayout, type PlacementSlotKind, type SceneLayout, type SceneOrientation } from "./SceneLayouts.js";
import { labisEchoes } from "../fixtures/labisMemoryEchoes.js";
import type { Point, Rect } from "./CollisionSystem.js";
import { inAnyRect } from "./CollisionSystem.js";

type Tool = "select" | "spawn" | "collision" | "interaction" | "trigger" | "placement-slot" | "echo-anchor" | "preview";
type Selection =
  | { kind: "spawn" }
  | { kind: "collision"; index: number }
  | { kind: "interaction"; index: number }
  | { kind: "trigger"; index: number }
  | { kind: "placement-slot"; index: number }
  | { kind: "echo-anchor"; key: string }
  | { kind: "anchor"; key: string };

type DraftDrag = { start: Point; current: Point } | null;
type MoveDrag = { selection: Selection; offset: Point } | null;

export class SceneDebugEditor {
  private sceneId = "forest";
  private orientation: SceneOrientation = "landscape";
  private tool: Tool = "select";
  private layout: SceneLayout = cloneSceneLayout(sceneLayoutManifest.forest.layouts.landscape);
  private selected: Selection | null = null;
  private draftDrag: DraftDrag = null;
  private moveDrag: MoveDrag = null;
  private previewPlayer: Point = { ...this.layout.spawn };
  private previewKeys = new Set<string>();
  private lastPreview = performance.now();

  constructor(private root: HTMLElement) {}

  async mount(): Promise<void> {
    await loadSceneLayoutOverrides();
    this.layout = cloneSceneLayout(sceneLayoutManifest[this.sceneId].layouts[this.orientation]);
    this.render();
    this.bindKeys();
    requestAnimationFrame((time) => this.previewLoop(time));
  }

  private render(): void {
    this.root.className = "scene-debug-root";
    this.root.innerHTML = `
      <div class="scene-debug">
        <aside class="scene-debug-panel">
          <h1>Scene Debug Editor</h1>
          <label>Scene
            <select data-debug-field="scene">${this.sceneOptions()}</select>
          </label>
          <button data-debug-action="add-scene">+ Add Scene</button>
          <label>Layout
            <select data-debug-field="orientation">
              <option value="landscape"${this.orientation === "landscape" ? " selected" : ""}>Landscape</option>
              <option value="portrait"${this.orientation === "portrait" ? " selected" : ""}>Portrait</option>
            </select>
          </label>
          <label>Asset
            <input data-debug-field="asset" value="${this.escape(this.layout.asset)}">
          </label>
          <div class="scene-debug-tools">
            ${(["select", "spawn", "collision", "interaction", "trigger", ...(this.sceneId === "forest" ? ["placement-slot" as const] : []), ...(this.sceneId === "labis" ? ["echo-anchor" as const] : []), "preview"] as const).map((tool) => `<button data-debug-tool="${tool}" class="${this.tool === tool ? "active" : ""}">${this.label(tool)}</button>`).join("")}
          </div>
          ${this.sceneId === "forest" && this.tool === "placement-slot" ? `<div class="scene-debug-inline">
            <label>Type<select data-debug-field="slot-kind">
              <option value="chapter">Chapter Slot</option>
              <option value="fragment">Fragment Slot</option>
            </select></label>
          </div>` : ""}
          ${this.sceneId === "labis" && this.tool === "echo-anchor" ? `<div class="scene-debug-inline">
            <label>Echo<select data-debug-field="echo-id">${labisEchoes.map((echo) => `<option value="${this.escape(echo.id)}">${this.escape(echo.label)} — ${this.escape(echo.id)}</option>`).join("")}</select></label>
          </div>` : ""}
          <div class="scene-debug-inline">
            <label>ID<input data-debug-field="new-id" value="${this.defaultNewId()}"></label>
            <label>Label<input data-debug-field="new-label" value="${this.defaultNewLabel()}"></label>
            <label>Radius<input data-debug-field="new-radius" type="number" value="56"></label>
          </div>
          <div class="scene-debug-inspector">${this.inspectorHtml()}</div>
          <button data-debug-action="delete-selected">Delete Selected</button>
          <button data-debug-action="save-layout" class="primary">Save Layout</button>
          <button data-debug-action="copy-json">Copy JSON</button>
          <button data-debug-action="download-json">Download Backup JSON</button>
          <pre class="scene-debug-status" data-debug-status></pre>
        </aside>
        <main class="scene-debug-stage">
          <div class="scene-debug-artboard">
            <img data-debug-image src="${this.escape(this.layout.asset)}" alt="">
            <canvas data-debug-canvas></canvas>
          </div>
        </main>
      </div>`;
    this.bindDom();
    this.syncCanvasSize();
    this.draw();
  }

  private bindDom(): void {
    this.root.querySelector<HTMLSelectElement>('[data-debug-field="scene"]')?.addEventListener("change", (event) => {
      this.sceneId = (event.target as HTMLSelectElement).value;
      this.loadCurrentLayout();
    });
    this.root.querySelector<HTMLSelectElement>('[data-debug-field="orientation"]')?.addEventListener("change", (event) => {
      this.orientation = (event.target as HTMLSelectElement).value as SceneOrientation;
      this.loadCurrentLayout();
    });
    this.root.querySelector<HTMLInputElement>('[data-debug-field="asset"]')?.addEventListener("change", (event) => {
      this.layout.asset = (event.target as HTMLInputElement).value.trim();
      this.render();
    });
    for (const button of Array.from(this.root.querySelectorAll<HTMLButtonElement>("[data-debug-tool]"))) {
      button.addEventListener("click", () => {
        this.tool = button.dataset.debugTool as Tool;
        this.selected = null;
        this.previewPlayer = { ...this.layout.spawn };
        this.render();
      });
    }
    for (const input of Array.from(this.root.querySelectorAll<HTMLInputElement>("[data-inspector-field]"))) {
      input.addEventListener("input", () => this.updateSelectedFromInspector());
    }
    for (const input of Array.from(this.root.querySelectorAll<HTMLInputElement>("[data-anchor-field]"))) {
      input.addEventListener("input", () => this.updateAnchorFromInspector(input));
    }
    this.root.querySelector<HTMLButtonElement>('[data-debug-action="delete-selected"]')?.addEventListener("click", () => this.deleteSelected());
    this.root.querySelector<HTMLButtonElement>('[data-debug-action="save-layout"]')?.addEventListener("click", () => void this.saveLayout());
    this.root.querySelector<HTMLButtonElement>('[data-debug-action="copy-json"]')?.addEventListener("click", () => void this.copyJson());
    this.root.querySelector<HTMLButtonElement>('[data-debug-action="download-json"]')?.addEventListener("click", () => this.downloadJson());
    this.root.querySelector<HTMLButtonElement>('[data-debug-action="add-scene"]')?.addEventListener("click", () => void this.addScene());
    const image = this.image();
    image.addEventListener("load", () => {
      if (!this.layout.size.w || !this.layout.size.h) this.layout.size = { w: image.naturalWidth, h: image.naturalHeight };
      this.syncCanvasSize();
      this.draw();
    });
    const canvas = this.canvas();
    canvas.addEventListener("pointerdown", (event) => this.pointerDown(event));
    canvas.addEventListener("pointermove", (event) => this.pointerMove(event));
    canvas.addEventListener("pointerup", () => this.pointerUp());
  }

  private bindKeys(): void {
    window.addEventListener("keydown", (event) => {
      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "w", "a", "s", "d"].includes(event.key)) this.previewKeys.add(event.key);
    });
    window.addEventListener("keyup", (event) => this.previewKeys.delete(event.key));
  }

  private loadCurrentLayout(): void {
    this.layout = cloneSceneLayout(sceneLayoutManifest[this.sceneId].layouts[this.orientation]);
    this.selected = null;
    this.previewPlayer = { ...this.layout.spawn };
    this.render();
  }

  private sceneOptions(): string {
    return Object.entries(sceneLayoutManifest)
      .map(([id, scene]) => `<option value="${this.escape(id)}"${id === this.sceneId ? " selected" : ""}>${this.escape(scene.label)}</option>`)
      .join("");
  }

  private pointerDown(event: PointerEvent): void {
    const point = this.eventPoint(event);
    if (this.tool === "spawn") {
      this.layout.spawn = point;
      this.selected = { kind: "spawn" };
      this.render();
      return;
    }
    if (this.tool === "collision" || this.tool === "trigger") {
      this.draftDrag = { start: point, current: point };
      return;
    }
    if (this.tool === "interaction") {
      const id = this.value("new-id") || "interaction";
      this.layout.interactions.push({ id, label: this.value("new-label") || id, x: point.x, y: point.y, radius: Number(this.value("new-radius")) || 56 });
      this.selected = { kind: "interaction", index: this.layout.interactions.length - 1 };
      this.render();
      return;
    }
    if (this.tool === "placement-slot" && this.sceneId === "forest") {
      const kind = this.slotKind();
      const id = this.value("new-id") || this.nextPlacementSlotId(kind);
      const existing = this.layout.placementSlots.findIndex((slot) => slot.id === id);
      const slot = { id, kind, x: point.x, y: point.y, radius: Number(this.value("new-radius")) || (kind === "fragment" ? 44 : 86) };
      if (existing >= 0) {
        this.layout.placementSlots[existing] = slot;
        this.selected = { kind: "placement-slot", index: existing };
      } else {
        this.layout.placementSlots.push(slot);
        this.selected = { kind: "placement-slot", index: this.layout.placementSlots.length - 1 };
      }
      this.render();
      return;
    }
    if (this.tool === "echo-anchor" && this.sceneId === "labis") {
      const echo = this.selectedLabisEcho();
      this.layout.echoAnchors[echo.id] = { x: point.x, y: point.y, radius: Number(this.value("new-radius")) || echo.radius };
      this.selected = { kind: "echo-anchor", key: echo.id };
      this.render();
      return;
    }
    if (this.tool === "select") {
      this.selected = this.pick(point);
      if (this.selected) this.moveDrag = { selection: this.selected, offset: this.selectionOffset(this.selected, point) };
      this.render();
    }
  }

  private pointerMove(event: PointerEvent): void {
    const point = this.eventPoint(event);
    if (this.draftDrag) {
      this.draftDrag.current = point;
      this.draw();
      return;
    }
    if (this.moveDrag) {
      this.moveSelection(this.moveDrag.selection, { x: point.x - this.moveDrag.offset.x, y: point.y - this.moveDrag.offset.y });
      this.draw();
    }
  }

  private pointerUp(): void {
    if (this.draftDrag) {
      const rect = this.rectFromPoints(this.draftDrag.start, this.draftDrag.current);
      if (rect.w > 3 && rect.h > 3) {
        if (this.tool === "collision") {
          this.layout.obstacles.push(rect);
          this.selected = { kind: "collision", index: this.layout.obstacles.length - 1 };
        }
        if (this.tool === "trigger") {
          const id = this.value("new-id") || "trigger";
          this.layout.triggers.push({ id, rect, chapterId: this.value("new-label"), eventId: id, once: true });
          this.selected = { kind: "trigger", index: this.layout.triggers.length - 1 };
        }
      }
    }
    this.draftDrag = null;
    this.moveDrag = null;
    this.render();
  }

  private draw(): void {
    const canvas = this.canvas();
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const scale = this.canvasScale();
    const line = (color: string) => {
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
    };
    this.layout.obstacles.forEach((rect, index) => {
      ctx.fillStyle = index === this.indexOf("collision") ? "rgba(255, 91, 91, .34)" : "rgba(255, 91, 91, .2)";
      ctx.fillRect(rect.x * scale.x, rect.y * scale.y, rect.w * scale.x, rect.h * scale.y);
      line("#ff7777");
      ctx.strokeRect(rect.x * scale.x, rect.y * scale.y, rect.w * scale.x, rect.h * scale.y);
    });
    this.layout.triggers.forEach((trigger, index) => {
      const rect = trigger.rect;
      ctx.fillStyle = index === this.indexOf("trigger") ? "rgba(109, 187, 255, .34)" : "rgba(109, 187, 255, .18)";
      ctx.fillRect(rect.x * scale.x, rect.y * scale.y, rect.w * scale.x, rect.h * scale.y);
      line("#79c7ff");
      ctx.strokeRect(rect.x * scale.x, rect.y * scale.y, rect.w * scale.x, rect.h * scale.y);
    });
    this.layout.placementSlots.forEach((slot, index) => {
      ctx.strokeStyle = index === this.indexOf("placement-slot") ? "#ffffff" : slot.kind === "chapter" ? "#b2ff8a" : "#c9a9ff";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(slot.x * scale.x, slot.y * scale.y, slot.radius * scale.x, 0, Math.PI * 2);
      ctx.stroke();
      this.drawPoint(ctx, slot, scale, slot.kind === "chapter" ? "#b2ff8a" : "#c9a9ff", `${slot.kind} · ${slot.id}`);
    });
    for (const [key, anchor] of Object.entries(this.layout.echoAnchors)) {
      const selected = this.selected?.kind === "echo-anchor" && this.selected.key === key;
      ctx.strokeStyle = selected ? "#ffffff" : "#ffb4d2";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(anchor.x * scale.x, anchor.y * scale.y, anchor.radius * scale.x, 0, Math.PI * 2);
      ctx.stroke();
      this.drawPoint(ctx, anchor, scale, "#ffb4d2", this.echoLabel(key));
    }
    for (const [key, anchor] of Object.entries(this.layout.anchors)) this.drawPoint(ctx, anchor, scale, "#d7ff91", key);
    this.layout.interactions.forEach((interaction, index) => {
      ctx.strokeStyle = index === this.indexOf("interaction") ? "#fff2a8" : "#f6cf6b";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(interaction.x * scale.x, interaction.y * scale.y, interaction.radius * scale.x, 0, Math.PI * 2);
      ctx.stroke();
      this.drawPoint(ctx, interaction, scale, "#f6cf6b", interaction.label);
    });
    this.drawPoint(ctx, this.layout.spawn, scale, "#71ffbd", "SPAWN");
    if (this.draftDrag) {
      const rect = this.rectFromPoints(this.draftDrag.start, this.draftDrag.current);
      ctx.strokeStyle = "#ffffff";
      ctx.setLineDash([6, 4]);
      ctx.strokeRect(rect.x * scale.x, rect.y * scale.y, rect.w * scale.x, rect.h * scale.y);
      ctx.setLineDash([]);
    }
    if (this.tool === "preview") this.drawPreview(ctx, scale);
  }

  private drawPreview(ctx: CanvasRenderingContext2D, scale: Point): void {
    this.drawPoint(ctx, this.previewPlayer, scale, "#ffffff", "PLAYER");
    const near = this.layout.interactions.find((item) => Math.hypot(this.previewPlayer.x - item.x, this.previewPlayer.y - item.y) <= item.radius);
    if (near) this.status(`Near interaction: ${near.label}`);
    const trigger = this.layout.triggers.find((item) => this.pointInRect(this.previewPlayer, item.rect));
    if (trigger) this.status(`Trigger active: ${trigger.id}`);
  }

  private previewLoop(time: number): void {
    const dt = Math.min(0.033, (time - this.lastPreview) / 1000);
    this.lastPreview = time;
    if (this.tool === "preview") {
      const x = (this.previewKeys.has("ArrowRight") || this.previewKeys.has("d") ? 1 : 0) - (this.previewKeys.has("ArrowLeft") || this.previewKeys.has("a") ? 1 : 0);
      const y = (this.previewKeys.has("ArrowDown") || this.previewKeys.has("s") ? 1 : 0) - (this.previewKeys.has("ArrowUp") || this.previewKeys.has("w") ? 1 : 0);
      if (x || y) {
        const magnitude = Math.hypot(x, y) || 1;
        const next = { x: this.previewPlayer.x + (x / magnitude) * 180 * dt, y: this.previewPlayer.y + (y / magnitude) * 180 * dt };
        const outside = next.x < 0 || next.y < 0 || next.x > this.layout.size.w || next.y > this.layout.size.h;
        if (!outside && !inAnyRect(next, this.layout.obstacles)) this.previewPlayer = next;
        this.draw();
      }
    }
    requestAnimationFrame((next) => this.previewLoop(next));
  }

  private inspectorHtml(): string {
    const target = this.selectedTarget();
    const anchorRows = ["motor-spawn", "ms-spawn", "motor-mid", "ms-mid", "motor-end"].map((key) => {
      const point = this.layout.anchors[key] ?? { x: 0, y: 0 };
      return `<fieldset><legend>${key}</legend><label>X<input data-anchor-field="${key}:x" type="number" value="${point.x}"></label><label>Y<input data-anchor-field="${key}:y" type="number" value="${point.y}"></label></fieldset>`;
    }).join("");
    if (!target) return `<h2>Inspector</h2><p>Select an object to edit exact values.</p><h3>Labis Anchors</h3>${this.sceneId === "labis" ? anchorRows : ""}`;
    const fields = Object.entries(target).map(([key, value]) => {
      if (!value || typeof value === "object") return "";
      return `<label>${this.escape(key)}<input data-inspector-field="${this.escape(key)}" value="${this.escape(String(value))}"></label>`;
    }).join("");
    const rect = "rect" in target ? Object.entries((target as { rect: Rect }).rect).map(([key, value]) => `<label>rect.${key}<input data-inspector-field="rect.${key}" type="number" value="${value}"></label>`).join("") : "";
    return `<h2>Inspector</h2>${fields}${rect}<h3>Labis Anchors</h3>${this.sceneId === "labis" ? anchorRows : ""}`;
  }

  private selectedTarget(): Record<string, unknown> | null {
    if (!this.selected) return null;
    if (this.selected.kind === "spawn") return this.layout.spawn;
    if (this.selected.kind === "collision") return this.layout.obstacles[this.selected.index] ?? null;
    if (this.selected.kind === "interaction") return this.layout.interactions[this.selected.index] ?? null;
    if (this.selected.kind === "trigger") return this.layout.triggers[this.selected.index] ?? null;
    if (this.selected.kind === "placement-slot") return this.layout.placementSlots[this.selected.index] ?? null;
    if (this.selected.kind === "echo-anchor") return this.layout.echoAnchors[this.selected.key] ?? null;
    if (this.selected.kind === "anchor") return this.layout.anchors[this.selected.key] ?? null;
    return null;
  }

  private updateSelectedFromInspector(): void {
    const target = this.selectedTarget();
    if (!target) return;
    for (const input of Array.from(this.root.querySelectorAll<HTMLInputElement>("[data-inspector-field]"))) {
      const key = input.dataset.inspectorField ?? "";
      const value = input.type === "number" || /^-?\d/.test(input.value) ? Number(input.value) : input.value;
      if (key.startsWith("rect.") && "rect" in target) {
        (target.rect as Record<string, unknown>)[key.slice(5)] = value;
      } else {
        target[key] = value;
      }
    }
    this.draw();
  }

  private updateAnchorFromInspector(input: HTMLInputElement): void {
    const [key, axis] = (input.dataset.anchorField ?? "").split(":");
    if (!key || (axis !== "x" && axis !== "y")) return;
    this.layout.anchors[key] ??= { x: 0, y: 0 };
    this.layout.anchors[key][axis] = Number(input.value) || 0;
    this.draw();
  }

  private async saveLayout(): Promise<void> {
    this.layout.asset = this.root.querySelector<HTMLInputElement>('[data-debug-field="asset"]')?.value.trim() || this.layout.asset;
    this.syncLayoutSizeFromImage();
    const response = await fetch("/__debug/save-scene-layout", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ layout: this.layout })
    });
    if (!response.ok) {
      const body = await response.json().catch(() => ({ error: "Save failed" })) as { error?: string };
      this.status(body.error ?? "Save failed");
      return;
    }
    setSceneLayout(this.layout);
    this.status(`Saved ${this.layout.sceneId}/${this.layout.orientation}`);
  }

  private async addScene(): Promise<void> {
    const label = window.prompt("Scene label?", "New Scene")?.trim();
    if (!label) return;
    const suggested = label.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
    const sceneId = window.prompt("Scene ID?", suggested)?.trim();
    if (!sceneId) return;
    const response = await fetch("/__debug/add-scene", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ label, sceneId })
    });
    const body = await response.json() as { scene?: { id: string; label: string }; layouts?: Record<SceneOrientation, SceneLayout>; error?: string };
    if (!response.ok || !body.scene || !body.layouts) return this.status(body.error ?? "Add scene failed");
    sceneLayoutManifest[body.scene.id] = { label: body.scene.label, layouts: body.layouts };
    this.sceneId = body.scene.id;
    this.orientation = "landscape";
    this.loadCurrentLayout();
    this.status(`Added ${body.scene.label}`);
  }

  private async copyJson(): Promise<void> {
    await navigator.clipboard.writeText(JSON.stringify(this.layout, null, 2));
    this.status("Copied JSON");
  }

  private downloadJson(): void {
    const blob = new Blob([`${JSON.stringify(this.layout, null, 2)}\n`], { type: "application/json" });
    const anchor = document.createElement("a");
    anchor.href = URL.createObjectURL(blob);
    anchor.download = `${this.layout.sceneId}-${this.layout.orientation}.json`;
    anchor.click();
    URL.revokeObjectURL(anchor.href);
  }

  private deleteSelected(): void {
    if (!this.selected) return;
    if (this.selected.kind === "collision") this.layout.obstacles.splice(this.selected.index, 1);
    if (this.selected.kind === "interaction") this.layout.interactions.splice(this.selected.index, 1);
    if (this.selected.kind === "trigger") this.layout.triggers.splice(this.selected.index, 1);
    if (this.selected.kind === "placement-slot") this.layout.placementSlots.splice(this.selected.index, 1);
    if (this.selected.kind === "echo-anchor") delete this.layout.echoAnchors[this.selected.key];
    if (this.selected.kind === "anchor") delete this.layout.anchors[this.selected.key];
    this.selected = null;
    this.render();
  }

  private pick(point: Point): Selection | null {
    if (Math.hypot(point.x - this.layout.spawn.x, point.y - this.layout.spawn.y) < 24) return { kind: "spawn" };
    const interaction = this.layout.interactions.findIndex((item) => Math.hypot(point.x - item.x, point.y - item.y) <= Math.max(18, item.radius));
    if (interaction >= 0) return { kind: "interaction", index: interaction };
    const slot = this.layout.placementSlots.findIndex((item) => Math.hypot(point.x - item.x, point.y - item.y) <= Math.max(18, item.radius));
    if (slot >= 0) return { kind: "placement-slot", index: slot };
    const echoAnchor = Object.entries(this.layout.echoAnchors).find(([, item]) => Math.hypot(point.x - item.x, point.y - item.y) <= Math.max(18, item.radius));
    if (echoAnchor) return { kind: "echo-anchor", key: echoAnchor[0] };
    const collision = this.layout.obstacles.findIndex((rect) => this.pointInRect(point, rect));
    if (collision >= 0) return { kind: "collision", index: collision };
    const trigger = this.layout.triggers.findIndex((item) => this.pointInRect(point, item.rect));
    if (trigger >= 0) return { kind: "trigger", index: trigger };
    const anchor = Object.entries(this.layout.anchors).find(([, item]) => Math.hypot(point.x - item.x, point.y - item.y) < 24);
    return anchor ? { kind: "anchor", key: anchor[0] } : null;
  }

  private moveSelection(selection: Selection, point: Point): void {
    if (selection.kind === "spawn") this.layout.spawn = point;
    if (selection.kind === "interaction") {
      const item = this.layout.interactions[selection.index];
      if (item) Object.assign(item, point);
    }
    if (selection.kind === "placement-slot") {
      const item = this.layout.placementSlots[selection.index];
      if (item) Object.assign(item, point);
    }
    if (selection.kind === "echo-anchor") {
      const item = this.layout.echoAnchors[selection.key];
      if (item) Object.assign(item, point);
    }
    if (selection.kind === "anchor") this.layout.anchors[selection.key] = point;
    if (selection.kind === "collision") {
      const rect = this.layout.obstacles[selection.index];
      if (rect) Object.assign(rect, { x: point.x, y: point.y });
    }
    if (selection.kind === "trigger") {
      const trigger = this.layout.triggers[selection.index];
      if (trigger) Object.assign(trigger.rect, { x: point.x, y: point.y });
    }
  }

  private selectionOffset(selection: Selection, point: Point): Point {
    const target = this.selectedTarget();
    const origin = "rect" in (target ?? {}) ? (target as { rect: Rect }).rect : target as Point | null;
    return origin ? { x: point.x - Number(origin.x), y: point.y - Number(origin.y) } : { x: 0, y: 0 };
  }

  private indexOf(kind: "collision" | "interaction" | "trigger" | "placement-slot"): number {
    return this.selected?.kind === kind ? this.selected.index : -1;
  }

  private eventPoint(event: PointerEvent): Point {
    const rect = this.canvas().getBoundingClientRect();
    return {
      x: ((event.clientX - rect.left) / rect.width) * this.layout.size.w,
      y: ((event.clientY - rect.top) / rect.height) * this.layout.size.h
    };
  }

  private syncCanvasSize(): void {
    const canvas = this.canvas();
    const image = this.image();
    const width = image.clientWidth || this.layout.size.w;
    const height = image.clientHeight || this.layout.size.h;
    canvas.width = Math.max(1, Math.round(width));
    canvas.height = Math.max(1, Math.round(height));
  }

  private syncLayoutSizeFromImage(): void {
    const image = this.image();
    if (image.naturalWidth && image.naturalHeight) this.layout.size = { w: image.naturalWidth, h: image.naturalHeight };
  }

  private canvasScale(): Point {
    return { x: this.canvas().width / this.layout.size.w, y: this.canvas().height / this.layout.size.h };
  }

  private rectFromPoints(a: Point, b: Point): Rect {
    return { x: Math.min(a.x, b.x), y: Math.min(a.y, b.y), w: Math.abs(a.x - b.x), h: Math.abs(a.y - b.y) };
  }

  private pointInRect(point: Point, rect: Rect): boolean {
    return point.x >= rect.x && point.x <= rect.x + rect.w && point.y >= rect.y && point.y <= rect.y + rect.h;
  }

  private drawPoint(ctx: CanvasRenderingContext2D, point: Point, scale: Point, color: string, label: string): void {
    const x = point.x * scale.x;
    const y = point.y * scale.y;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.font = "12px system-ui";
    ctx.fillText(label, x + 10, y - 8);
  }

  private value(field: string): string {
    return this.root.querySelector<HTMLInputElement>(`[data-debug-field="${field}"]`)?.value.trim() ?? "";
  }

  private defaultNewId(): string {
    if (this.tool === "trigger") return "trigger";
    if (this.tool === "interaction") return "interaction";
    if (this.tool === "placement-slot") return this.nextPlacementSlotId(this.slotKind());
    if (this.tool === "echo-anchor") return this.selectedLabisEcho().id;
    return "";
  }

  private defaultNewLabel(): string {
    if (this.tool === "interaction") return "Interaction";
    if (this.tool === "trigger") return "event-id";
    if (this.tool === "placement-slot") return this.slotKind() === "chapter" ? "Chapter Slot" : "Fragment Slot";
    if (this.tool === "echo-anchor") return this.selectedLabisEcho().label;
    return "";
  }

  private label(tool: Tool): string {
    if (tool === "placement-slot") return "Placement Slot";
    if (tool === "echo-anchor") return "Echo Anchor";
    return tool[0].toUpperCase() + tool.slice(1);
  }

  private slotKind(): PlacementSlotKind {
    return this.root.querySelector<HTMLSelectElement>('[data-debug-field="slot-kind"]')?.value === "fragment" ? "fragment" : "chapter";
  }

  private nextPlacementSlotId(kind: PlacementSlotKind): string {
    const prefix = `${kind}-slot-`;
    const used = new Set(this.layout.placementSlots.filter((slot) => slot.kind === kind).map((slot) => slot.id));
    for (let index = 1; index < 100; index += 1) {
      const id = `${prefix}${String(index).padStart(2, "0")}`;
      if (!used.has(id)) return id;
    }
    return `${prefix}${this.layout.placementSlots.length + 1}`;
  }

  private selectedLabisEcho(): typeof labisEchoes[number] {
    const id = this.root.querySelector<HTMLSelectElement>('[data-debug-field="echo-id"]')?.value;
    return labisEchoes.find((echo) => echo.id === id) ?? labisEchoes[0];
  }

  private echoLabel(id: string): string {
    const echo = labisEchoes.find((item) => item.id === id);
    return echo ? `${echo.label} · ${echo.id}` : id;
  }

  private status(message: string): void {
    const status = this.root.querySelector<HTMLElement>("[data-debug-status]");
    if (status) status.textContent = message;
  }

  private canvas(): HTMLCanvasElement {
    return this.root.querySelector<HTMLCanvasElement>("[data-debug-canvas]")!;
  }

  private image(): HTMLImageElement {
    return this.root.querySelector<HTMLImageElement>("[data-debug-image]")!;
  }

  private escape(value: string): string {
    return value.replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]!);
  }
}
