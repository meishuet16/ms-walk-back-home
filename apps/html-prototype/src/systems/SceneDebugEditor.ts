import { cloneSceneLayout, loadSceneLayoutOverrides, makeDefaultLayout, sceneLayoutManifest, setSceneLayout, type PlacementSlotKind, type SceneLayout, type SceneOrientation } from "./SceneLayouts.js";
import type { Point, Rect } from "./CollisionSystem.js";
import { inAnyRect } from "./CollisionSystem.js";
import { applyPointTextEdit, bulkAddPoints, createPointGroup, createDraftPoint, deleteGroup, deletePoints, filterPointEntries, moveGroup, movePoints, normalizeSceneId, parseAnchorManifest, pointEntries, portraitDraftFromLandscape, sceneIdentity, type EditorPointGroup, type EditorPointKey, type EditorPointKind, type PointFilter } from "./SceneDebugModel.js";
import { buildAutoAuthorPlan, applyAutoAuthorPlan, type AutoAuthorPlan, type CollisionReviewEntry } from "./SceneDebugAutoAuthor.js"
import { parseSceneAuthoringManifest, validateSceneAuthoringManifest, type ManifestValidationResult } from "./SceneDebugAuthoringManifest.js"
import { validateConstraints, type ConstraintResult } from "./SceneDebugConstraints.js"
import { clampZoom, centerPan, fitZoom } from "./SceneDebugViewport.js"
import { addPreviewItem, approveCanonicalCandidate, copyAllApprovedMappings, copyImplementationHandoff, copyPreviewMapping, createPreviewItem, createPreviewState, removePreviewItem, updatePreviewAsset, type PreviewKind, type PreviewState } from "./SceneDebugPreview.js";

type Tool = "select" | "spawn" | "collision" | "interaction" | "trigger" | "placement-slot" | "anchor" | "echo-anchor" | "preview";
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
  private dirty = false;
  private selectedPoints = new Set<EditorPointKey>();
  private pointSearch = "";
  private pointFilter: PointFilter = "all";
  private groups: EditorPointGroup[] = [];
  private previewState: PreviewState = createPreviewState(this.sceneId, this.orientation);
  private historyPast: SceneLayout[] = [];
  private historyFuture: SceneLayout[] = [];
  private pendingPreviewFile: File | null = null;
  private manifestText = "";
  private manifestValidation: ManifestValidationResult | null = null;
  private autoAuthorPlan: AutoAuthorPlan | null = null;
  private collisionReviews: CollisionReviewEntry[] = [];
  private constraintResults: ConstraintResult[] = [];
  private assetPaths = new Set<string>();
  private viewportZoom = 1;

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
          <div class="scene-debug-dirty" data-debug-dirty>${this.dirty ? "Unsaved changes" : "Saved"}</div>
          <section class="scene-debug-workflow">
            <h2>Scene Setup</h2>
            <p class="scene-debug-help">Runtime SceneLayout stays unchanged. Authoring metadata and previews remain editor-only until an explicit save or handoff.</p>
            <h2>Auto Author</h2>
            <label>Scene Authoring Manifest v1 JSON
              <textarea data-debug-field="authoring-manifest" rows="10" placeholder="{&quot;manifestVersion&quot;:1,...}">${this.escape(this.manifestText)}</textarea>
            </label>
            <div class="scene-debug-actions"><button data-debug-action="validate-manifest">Validate Manifest</button><button data-debug-action="build-auto-author">Build Auto Author Plan</button></div>
            ${this.manifestStatusHtml()}
            ${this.autoAuthorSummaryHtml()}
          </section>
          <div class="scene-debug-tools">
            ${(["select", "spawn", "collision", "interaction", "trigger", ...(this.sceneId === "forest" ? ["placement-slot" as const] : []), "anchor", "echo-anchor", "preview"] as const).map((tool) => `<button data-debug-tool="${tool}" class="${this.tool === tool ? "active" : ""}">${this.label(tool)}</button>`).join("")}
          </div>
          ${this.sceneId === "forest" && this.tool === "placement-slot" ? `<div class="scene-debug-inline">
            <label>Type<select data-debug-field="slot-kind">
              <option value="chapter">Chapter Slot</option>
              <option value="fragment">Fragment Slot</option>
            </select></label>
          </div>` : ""}
          ${this.tool === "echo-anchor" ? `<div class="scene-debug-inline">
            <label>Echo Key<input data-debug-field="echo-key" value="${this.defaultNewId()}"></label>
          </div>` : ""}
          <div class="scene-debug-inline">
            <label>ID<input data-debug-field="new-id" value="${this.defaultNewId()}"></label>
            <label>Label<input data-debug-field="new-label" value="${this.defaultNewLabel()}"></label>
            <label>Radius<input data-debug-field="new-radius" type="number" value="56"></label>
          </div>
          <section class="scene-debug-authoring">
            <h2>Fine Tune / Advanced Manual Tools</h2>
            <p class="scene-debug-help">Manual placement, collision, trigger, group, undo/redo, and point tools remain available as fallback.</p>
            <h2>Anchors & Echo Anchors</h2>
            <input data-debug-field="point-search" placeholder="Search by ID" value="${this.escape(this.pointSearch)}">
            <select data-debug-field="point-filter"><option value="all"${this.pointFilter === "all" ? " selected" : ""}>All</option><option value="anchors"${this.pointFilter === "anchors" ? " selected" : ""}>Anchors</option><option value="echo-anchors"${this.pointFilter === "echo-anchors" ? " selected" : ""}>Echo Anchors</option></select>
            <div class="scene-debug-actions"><button data-debug-action="select-all-points">Select All Visible</button><button data-debug-action="clear-point-selection">Clear Selection</button><button data-debug-action="delete-points">Delete Selected</button></div>
            <div class="scene-debug-point-list">${this.pointManagerHtml()}</div>
            <select data-debug-field="bulk-kind"><option value="anchor">Anchor</option><option value="echo-anchor">Echo Anchor</option></select><textarea data-debug-field="bulk-points" rows="4" placeholder="One point ID per line"></textarea>
            <div class="scene-debug-actions"><button data-debug-action="bulk-add">Bulk Add Points</button><button data-debug-action="import-manifest">Import Anchor Manifest</button></div>
            <textarea data-debug-field="bulk-edit" rows="5" placeholder="[ANCHORS]&#10;ms-wait-position&#10;&#10;[ECHO ANCHORS]&#10;cat-approach"></textarea>
            <button data-debug-action="apply-bulk-edit">Apply Point Text Edit</button>
            <div class="scene-debug-actions"><button data-debug-action="undo">Undo</button><button data-debug-action="redo">Redo</button></div>
            <div class="scene-debug-actions"><button data-debug-action="create-group">Create Group from Selection</button><button data-debug-action="move-group">Move Selected Group</button><button data-debug-action="delete-group">Delete Selected Group</button></div>
            <select data-debug-field="group"><option value="">Point group</option>${this.groups.map((group) => `<option value="${this.escape(group.id)}">${this.escape(group.name)}</option>`).join("")}</select>
            <button data-debug-action="portrait-draft">Create Portrait Draft from Landscape</button>
            <button data-debug-action="suggest-positions">Generate Suggested Positions</button>
          </section>
          <div class="scene-debug-inspector">${this.inspectorHtml()}</div>
          <button data-debug-action="delete-selected">Delete Selected</button>
          <button data-debug-action="save-layout" class="primary">Save Layout</button>
          <button data-debug-action="copy-json">Copy JSON</button>
          <button data-debug-action="download-json">Download Backup JSON</button>
          <section class="scene-debug-preview-controls">
            <h2>Preview & Handoff</h2>
            <p class="scene-debug-help">Imported previews are PREVIEW ONLY. Approval is still explicit and only creates a copyable handoff.</p>
            <label>Preview kind<select data-debug-field="preview-kind"><option value="single">Single</option><option value="pair">Pair</option><option value="multi">Multi</option><option value="prop">Prop</option><option value="vfx">VFX</option></select></label><label>Project asset path<input data-debug-field="preview-path" placeholder="assets/405/example/frame.png"></label>
            <label>Anchor binding<input data-debug-field="preview-anchor" placeholder="optional anchor ID"></label>
            <label>Local PNG/WEBP<input data-debug-field="preview-file" type="file" accept="image/png,image/webp,image/jpeg"></label>
            <div class="scene-debug-actions"><button data-debug-action="add-preview">Add Preview</button><button data-debug-action="clear-previews">Clear Previews</button></div>
            <div class="scene-debug-preview-list">${this.previewManagerHtml()}</div>
            <div class="scene-debug-actions"><button data-debug-action="copy-mapping">Copy Preview Mapping</button><button data-debug-action="copy-approved">Copy All Approved Mappings</button></div>
            <button data-debug-action="copy-handoff" class="primary">Copy Implementation Handoff</button>
            <label><input data-debug-field="show-anchor-points" type="checkbox" ${this.previewState.showAnchorPoints ? "checked" : ""}> Show Anchor Point</label>
            <label><input data-debug-field="show-bounds" type="checkbox" ${this.previewState.showImageBounds ? "checked" : ""}> Show Image Bounds</label>
            <label><input data-debug-field="show-feet" type="checkbox" ${this.previewState.showFeetBaseline ? "checked" : ""}> Show Feet Anchor / Baseline</label>
          </section>

          <pre class="scene-debug-status" data-debug-status></pre>
        </aside>
        <main class="scene-debug-stage">
          <div class="scene-debug-viewport-toolbar">
            <strong>Viewport</strong>
            <button data-debug-action="viewport-fit">Fit</button><button data-debug-action="viewport-100">100%</button>
            <button data-debug-action="viewport-minus">−</button><span data-debug-zoom>${Math.round(this.viewportZoom * 100)}%</span><button data-debug-action="viewport-plus">+</button>
            <button data-debug-action="viewport-center">Center</button>
          </div>
          <div class="scene-debug-viewport-scroll">
            <div class="scene-debug-artboard" style="transform:scale(${this.viewportZoom}); transform-origin:top left;">
            <img data-debug-image src="${this.escape(this.layout.asset)}" alt="">
            <canvas data-debug-canvas></canvas><div data-debug-preview-layer></div>
            </div>
          </div>
          </div>
        </main>
      </div>`;
    this.bindDom();
    this.syncCanvasSize();
    this.draw();
  }


  private manifestStatusHtml(): string {
    if (!this.manifestValidation) return "";
    const lines = this.manifestValidation.valid ? ["VALID", ...this.manifestValidation.warnings.map((item) => "Warning: " + item.message)] : this.manifestValidation.errors.map((item) => item.path + ": " + item.message);
    return "<pre class=\"scene-debug-manifest-status\">" + this.escape(lines.join("\n")) + "</pre>";
  }

  private autoAuthorSummaryHtml(): string {
    if (!this.autoAuthorPlan) return "";
    const summary = this.autoAuthorPlan.summary;
    return "<div class=\"scene-debug-auto-summary\"><strong>Plan ready · " + summary.orientation + "</strong><span>" + summary.counts.anchors + " anchors · " + summary.counts.obstacles + " collision drafts · " + summary.counts.previews + " previews</span><span>" + (summary.existingLayoutDetected ? "Existing orientation protected; apply requires explicit replacement." : "New layout candidate.") + "</span><div class=\"scene-debug-actions\"><button data-debug-action=\"apply-auto-author\" class=\"primary\">Apply Plan to Current Orientation</button><button data-debug-action=\"preserve-auto-author\">Keep Existing Layout</button></div></div>";
  }

  private async discoverManifestAssets(): Promise<void> {
    try {
      const response = await fetch("/__debug/assets");
      const payload = await response.json() as { assets?: string[] };
      this.assetPaths = new Set(payload.assets ?? []);
    } catch {
      this.assetPaths = new Set();
    }
  }

  private async validateManifest(): Promise<void> {
    const parsed = parseSceneAuthoringManifest(this.manifestText);
    if (parsed.errors.length) {
      this.manifestValidation = { manifest: null, errors: parsed.errors, warnings: [], valid: false };
      this.autoAuthorPlan = null;
      this.render();
      return this.status("Manifest JSON is invalid.");
    }
    await this.discoverManifestAssets();
    this.manifestValidation = validateSceneAuthoringManifest(parsed.value, this.assetPaths);
    this.autoAuthorPlan = null;
    this.render();
    this.status(this.manifestValidation.valid ? "Manifest v1 is valid. Build a transactional Auto Author plan to review changes." : "Manifest validation found errors.");
  }

  private async buildAutoAuthor(): Promise<void> {
    if (!this.manifestValidation?.valid || !this.manifestValidation.manifest) await this.validateManifest();
    if (!this.manifestValidation?.valid || !this.manifestValidation.manifest) return;
    try {
      this.autoAuthorPlan = buildAutoAuthorPlan(this.manifestValidation.manifest, this.orientation, this.layout, { existingLayoutDetected: true, assetPaths: this.assetPaths });
      this.render();
      this.status("Auto Author plan ready. Review the summary, then explicitly apply or keep the existing orientation.");
    } catch (error) {
      this.status(error instanceof Error ? error.message : "Could not build Auto Author plan.");
    }
  }

  private importAutoAuthorPreviews(): void {
    if (!this.autoAuthorPlan) return;
    for (const item of this.autoAuthorPlan.previews.filter((candidate) => candidate.status === "preview-only")) {
      try {
        this.previewState = addPreviewItem(this.previewState, createPreviewItem({ name: item.name, kind: item.kind, projectPath: item.asset, anchorId: item.anchorId }));
      } catch {
        // Validation already rejected unsafe paths.
      }
    }
  }

  private applyAutoAuthor(): void {
    if (!this.autoAuthorPlan) return this.status("Build an Auto Author plan first.");
    if (!window.confirm("Replace the current authored " + this.orientation + " editor layout with this reviewed candidate?")) return this.status("Auto Author apply cancelled; current layout is unchanged.");
    const applied = applyAutoAuthorPlan(this.autoAuthorPlan, "replace-existing", this.layout);
    this.recordHistory();
    this.layout = applied.layout;
    this.groups = this.autoAuthorPlan.groups;
    this.collisionReviews = this.autoAuthorPlan.collisionReviews;
    this.constraintResults = validateConstraints(this.layout, this.autoAuthorPlan.constraints as any);
    this.importAutoAuthorPreviews();
    this.markDirty();
    this.render();
    this.status("Auto Author applied in memory. Collision entries remain DRAFT / REVIEW REQUIRED; save is still explicit.");
  }

  private preserveAutoAuthor(): void {
    this.autoAuthorPlan = null;
    this.status("Existing orientation preserved. No SceneLayout coordinates changed.");
    this.render();
  }

  private setViewportZoom(value: number): void {
    this.viewportZoom = clampZoom(value);
    this.render();
  }

  private setViewportFit(): void {
    const stage = this.root.querySelector<HTMLElement>(".scene-debug-viewport-scroll");
    this.viewportZoom = fitZoom(this.layout.size, { w: stage?.clientWidth || 900, h: stage?.clientHeight || 700 });
    this.render();
  }

  private setViewportCenter(): void {
    const stage = this.root.querySelector<HTMLElement>(".scene-debug-viewport-scroll");
    const pan = centerPan(this.layout.size, { w: stage?.clientWidth || 900, h: stage?.clientHeight || 700 }, this.viewportZoom);
    if (stage) { stage.scrollLeft = Math.max(0, -pan.x); stage.scrollTop = Math.max(0, -pan.y); }
    this.status("Viewport centered; SceneLayout coordinates were not changed.");
  }
  private pointManagerHtml(): string {
    const entries = filterPointEntries(this.layout, this.pointSearch, this.pointFilter);
    if (!entries.length) return "<p>No matching anchors.</p>";
    return entries.map((item) => {
      const checked = this.selectedPoints.has(item.key) ? " checked" : "";
      const selected = this.selectedPoints.has(item.key) ? " selected" : "";
      return "<div class=\"scene-debug-point-row" + selected + "\">" +
        "<label><input type=\"checkbox\" data-point-select=\"" + this.escape(item.key) + "\"" + checked + "> " +
        this.escape(item.id) + "</label><span>" + item.kind + " · (" + Math.round(item.x) + ", " + Math.round(item.y) + ")" + "</span>" +
        "<button type=\"button\" data-point-delete=\"" + this.escape(item.key) + "\">Delete</button></div>";
    }).join("");
  }


  private previewManagerHtml(): string {
    if (!this.previewState.items.length) return "<p>No temporary preview items.</p>";
    return this.previewState.items.slice().sort((a, b) => a.z - b.z).map((item) => {
      const source = item.source.kind === "project" ? item.source.path ?? "" : "local: " + (item.source.fileName ?? "image");
      const approval = item.approval ? " · CANONICAL CANDIDATE" : "";
      const field = (name: string, type: string, value: string, extra = "") => "<label>" + name + "<input data-preview-edit=\"" + this.escape(item.id + ":" + name) + "\" type=\"" + type + "\" value=\"" + this.escape(value) + "\" " + extra + "></label>";
      return "<div class=\"scene-debug-preview-row\" data-preview-row=\"" + this.escape(item.id) + "\">" +
        "<strong>" + this.escape(item.name) + "</strong><span>" + this.escape(source) + approval + "</span>" +
        field("kind", "text", item.kind) +
        field("anchorId", "text", item.anchorId ?? "", "placeholder=\"free-position\"") +
        field("x", "number", String(item.x), "step=\"1\"") +
        field("y", "number", String(item.y), "step=\"1\"") +
        field("scale", "number", String(item.scale), "step=\"0.05\" min=\"0.05\"") +
        field("opacity", "number", String(item.opacity), "step=\"0.05\" min=\"0\" max=\"1\"") +
        field("z", "number", String(item.z), "step=\"1\"") +
        "<label>flip<input data-preview-edit=\"" + this.escape(item.id + ":flip") + "\" type=\"checkbox\"" + (item.flip ? " checked" : "") + "></label>" +
        "<button type=\"button\" data-preview-approve=\"" + this.escape(item.id) + "\">Approve</button>" +
        "<button type=\"button\" data-preview-remove=\"" + this.escape(item.id) + "\">Remove</button></div>";
    }).join("");
  }

  private markDirty(): void {
    this.dirty = true;
  }

  private recordHistory(): void {
    this.historyPast.push(cloneSceneLayout(this.layout));
    if (this.historyPast.length > 80) this.historyPast.shift();
    this.historyFuture = [];
    this.markDirty();
  }

  private undo(): void {
    const previous = this.historyPast.pop();
    if (!previous) return this.status("Nothing to undo.");
    this.historyFuture.push(cloneSceneLayout(this.layout));
    this.layout = previous;
    this.selected = null;
    this.selectedPoints.clear();
    this.markDirty();
    this.render();
    this.status("Undid last editor change.");
  }

  private redo(): void {
    const next = this.historyFuture.pop();
    if (!next) return this.status("Nothing to redo.");
    this.historyPast.push(cloneSceneLayout(this.layout));
    this.layout = next;
    this.selected = null;
    this.selectedPoints.clear();
    this.markDirty();
    this.render();
    this.status("Redid editor change.");
  }

  private async guardTransition(reason: string): Promise<boolean> {
    if (!this.dirty) return true;
    const answer = window.prompt("You have unsaved Scene Debug changes before " + reason + ". Type save, discard, or cancel.", "cancel")?.trim().toLowerCase();
    if (answer === "save") {
      await this.saveLayout();
      return !this.dirty;
    }
    if (answer === "discard") {
      this.dirty = false;
      return true;
    }
    return false;
  }


  private updatePreviewItemField(input: HTMLInputElement): void {
    const token = input.dataset.previewEdit ?? "";
    const separator = token.lastIndexOf(":");
    if (separator < 1) return;
    const id = token.slice(0, separator);
    const field = token.slice(separator + 1);
    this.previewState = {
      ...this.previewState,
      items: this.previewState.items.map((item) => {
        if (item.id !== id) return item;
        if (field === "anchorId") {
          const anchorId = input.value.trim() || undefined;
          return { ...item, anchorId, freePosition: !anchorId, showAnchor: Boolean(anchorId), approval: undefined };
        }
        if (field === "flip") return { ...item, flip: input.checked };
        const numeric = Number(input.value);
        if (!Number.isFinite(numeric)) return item;
        if (field === "x") return { ...item, x: numeric };
        if (field === "y") return { ...item, y: numeric };
        if (field === "scale") return { ...item, scale: Math.max(0.05, numeric) };
        if (field === "opacity") return { ...item, opacity: Math.max(0, Math.min(1, numeric)) };
        if (field === "z") return { ...item, z: numeric };
        return item;
      })
    };
    this.render();
  }

  private updatePreviewFlags(): void {
    this.previewState = {
      ...this.previewState,
      showAnchorPoints: this.root.querySelector<HTMLInputElement>('[data-debug-field="show-anchor-points"]')?.checked ?? this.previewState.showAnchorPoints,
      showImageBounds: this.root.querySelector<HTMLInputElement>('[data-debug-field="show-bounds"]')?.checked ?? this.previewState.showImageBounds,
      showFeetBaseline: this.root.querySelector<HTMLInputElement>('[data-debug-field="show-feet"]')?.checked ?? this.previewState.showFeetBaseline
    };
  }

  private selectedPointKeys(): EditorPointKey[] {
    return [...this.selectedPoints];
  }

  private bindDom(): void {
    this.root.querySelector<HTMLSelectElement>('[data-debug-field="scene"]')?.addEventListener("change", (event) => {
      void this.switchScene((event.target as HTMLSelectElement).value, this.orientation);
    });
    this.root.querySelector<HTMLSelectElement>('[data-debug-field="orientation"]')?.addEventListener("change", (event) => {
      void this.switchScene(this.sceneId, (event.target as HTMLSelectElement).value as SceneOrientation);
    });
    this.root.querySelector<HTMLInputElement>('[data-debug-field="asset"]')?.addEventListener("change", (event) => {
      this.layout.asset = (event.target as HTMLInputElement).value.trim();
      this.markDirty();
      this.render();
    });
    this.root.querySelector<HTMLTextAreaElement>('[data-debug-field="authoring-manifest"]')?.addEventListener("input", (event) => {
      this.manifestText = (event.target as HTMLTextAreaElement).value;
    });
    this.root.querySelector<HTMLButtonElement>('[data-debug-action="validate-manifest"]')?.addEventListener("click", () => void this.validateManifest());
    this.root.querySelector<HTMLButtonElement>('[data-debug-action="build-auto-author"]')?.addEventListener("click", () => void this.buildAutoAuthor());
    this.root.querySelector<HTMLButtonElement>('[data-debug-action="apply-auto-author"]')?.addEventListener("click", () => this.applyAutoAuthor());
    this.root.querySelector<HTMLButtonElement>('[data-debug-action="preserve-auto-author"]')?.addEventListener("click", () => this.preserveAutoAuthor());
    this.root.querySelector<HTMLButtonElement>('[data-debug-action="viewport-fit"]')?.addEventListener("click", () => this.setViewportFit());
    this.root.querySelector<HTMLButtonElement>('[data-debug-action="viewport-100"]')?.addEventListener("click", () => this.setViewportZoom(1));
    this.root.querySelector<HTMLButtonElement>('[data-debug-action="viewport-minus"]')?.addEventListener("click", () => this.setViewportZoom(this.viewportZoom - 0.1));
    this.root.querySelector<HTMLButtonElement>('[data-debug-action="viewport-plus"]')?.addEventListener("click", () => this.setViewportZoom(this.viewportZoom + 0.1));
    this.root.querySelector<HTMLButtonElement>('[data-debug-action="viewport-center"]')?.addEventListener("click", () => this.setViewportCenter());    for (const button of Array.from(this.root.querySelectorAll<HTMLButtonElement>("[data-debug-tool]"))) {
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
    this.root.querySelector<HTMLInputElement>('[data-debug-field="point-search"]')?.addEventListener("input", (event) => {
      this.pointSearch = (event.target as HTMLInputElement).value;
      this.render();
    });
    this.root.querySelector<HTMLSelectElement>('[data-debug-field="point-filter"]')?.addEventListener("change", (event) => {
      this.pointFilter = (event.target as HTMLSelectElement).value as PointFilter;
      this.render();
    });
    for (const input of Array.from(this.root.querySelectorAll<HTMLInputElement>("[data-point-select]"))) {
      input.addEventListener("change", () => {
        const key = input.dataset.pointSelect as EditorPointKey;
        if (input.checked) this.selectedPoints.add(key);
        else this.selectedPoints.delete(key);
        this.render();
      });
    }
    for (const button of Array.from(this.root.querySelectorAll<HTMLButtonElement>("[data-point-delete]"))) {
      button.addEventListener("click", () => this.deletePoint(button.dataset.pointDelete as EditorPointKey));
    }
    this.root.querySelector<HTMLButtonElement>('[data-debug-action="select-all-points"]')?.addEventListener("click", () => {
      for (const item of filterPointEntries(this.layout, this.pointSearch, this.pointFilter)) this.selectedPoints.add(item.key);
      this.render();
    });
    this.root.querySelector<HTMLButtonElement>('[data-debug-action="clear-point-selection"]')?.addEventListener("click", () => {
      this.selectedPoints.clear();
      this.render();
    });
    this.root.querySelector<HTMLButtonElement>('[data-debug-action="delete-points"]')?.addEventListener("click", () => this.deletePointSelection());
    this.root.querySelector<HTMLButtonElement>('[data-debug-action="bulk-add"]')?.addEventListener("click", () => this.bulkAdd());
    this.root.querySelector<HTMLButtonElement>('[data-debug-action="import-manifest"]')?.addEventListener("click", () => this.importManifest());
    this.root.querySelector<HTMLButtonElement>('[data-debug-action="apply-bulk-edit"]')?.addEventListener("click", () => this.applyBulkEdit());
    this.root.querySelector<HTMLButtonElement>('[data-debug-action="undo"]')?.addEventListener("click", () => this.undo());
    this.root.querySelector<HTMLButtonElement>('[data-debug-action="redo"]')?.addEventListener("click", () => this.redo());
    this.root.querySelector<HTMLButtonElement>('[data-debug-action="create-group"]')?.addEventListener("click", () => this.createGroupFromSelection());

    this.root.querySelector<HTMLButtonElement>('[data-debug-action="move-group"]')?.addEventListener("click", () => this.moveSelectedGroup());
    this.root.querySelector<HTMLButtonElement>('[data-debug-action="delete-group"]')?.addEventListener("click", () => this.deleteSelectedGroup());
    this.root.querySelector<HTMLButtonElement>('[data-debug-action="portrait-draft"]')?.addEventListener("click", () => this.createPortraitDraft());
    this.root.querySelector<HTMLButtonElement>('[data-debug-action="suggest-positions"]')?.addEventListener("click", () => this.suggestPositions());
    this.root.querySelector<HTMLInputElement>('[data-debug-field="preview-file"]')?.addEventListener("change", (event) => {
      this.pendingPreviewFile = (event.target as HTMLInputElement).files?.[0] ?? null;
    });
    this.root.querySelector<HTMLButtonElement>('[data-debug-action="add-preview"]')?.addEventListener("click", () => void this.addPreview());
    this.root.querySelector<HTMLButtonElement>('[data-debug-action="clear-previews"]')?.addEventListener("click", () => {
      this.previewState = createPreviewState(this.sceneId, this.orientation);
      this.pendingPreviewFile = null;
      this.render();
    });
    for (const button of Array.from(this.root.querySelectorAll<HTMLButtonElement>("[data-preview-remove]"))) {
      button.addEventListener("click", () => {
        this.previewState = removePreviewItem(this.previewState, button.dataset.previewRemove ?? "");
        this.render();
      });
    }
    for (const button of Array.from(this.root.querySelectorAll<HTMLButtonElement>("[data-preview-approve]"))) {
      button.addEventListener("click", () => this.approvePreview(button.dataset.previewApprove ?? ""));
    }
    this.root.querySelector<HTMLButtonElement>('[data-debug-action="copy-mapping"]')?.addEventListener("click", () => void this.copyPreviewMapping());
    this.root.querySelector<HTMLButtonElement>('[data-debug-action="copy-approved"]')?.addEventListener("click", () => void this.copyApprovedMappings());
    this.root.querySelector<HTMLButtonElement>('[data-debug-action="copy-handoff"]')?.addEventListener("click", () => void this.copyHandoff());

    for (const input of Array.from(this.root.querySelectorAll<HTMLInputElement>("[data-preview-edit]"))) {
      input.addEventListener("change", () => this.updatePreviewItemField(input));
    }
    for (const input of Array.from(this.root.querySelectorAll<HTMLInputElement>('[data-debug-field="show-anchor-points"], [data-debug-field="show-bounds"], [data-debug-field="show-feet"]'))) {
      input.addEventListener("change", () => {
        this.updatePreviewFlags();
        this.renderPreviewDom();
      });
    }


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
      const target = event.target as HTMLElement | null;
      const isTextEntry = target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement || Boolean(target?.isContentEditable);
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "z" && !isTextEntry) {
        event.preventDefault();
        if (event.shiftKey) this.redo(); else this.undo();
        return;
      }
      if (!isTextEntry && (event.key === "Delete" || event.key === "Backspace")) {
        event.preventDefault();
        if (this.selectedPoints.size) this.deletePointSelection(); else this.deleteSelected();
        return;
      }
      if (!isTextEntry && ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "w", "a", "s", "d"].includes(event.key)) this.previewKeys.add(event.key);
    });
    window.addEventListener("keyup", (event) => this.previewKeys.delete(event.key));
  }

  private async switchScene(sceneId: string, orientation: SceneOrientation): Promise<void> {
    if (sceneId === this.sceneId && orientation === this.orientation) return;
    if (!await this.guardTransition("switching layouts")) {
      this.render();
      return;
    }
    this.sceneId = normalizeSceneId(sceneId);
    this.orientation = orientation;
    this.loadCurrentLayout();
  }

  private loadCurrentLayout(): void {
    this.layout = cloneSceneLayout(sceneLayoutManifest[this.sceneId].layouts[this.orientation]);
    this.selected = null;
    this.selectedPoints.clear();
    this.historyPast = [];
    this.historyFuture = [];
    this.dirty = false;
    this.previewPlayer = { ...this.layout.spawn };
    this.previewState = createPreviewState(this.sceneId, this.orientation);
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
      this.recordHistory();
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
      if (this.layout.interactions.some((item) => item.id === id)) return this.status("Interaction ID already exists; choose a new ID.");
      this.recordHistory();
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
        return this.status("Placement slot ID already exists; choose a new ID.");
      }
      this.recordHistory();
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
    if (this.tool === "anchor") {
      const key = this.value("new-id") || "anchor";
      if (this.layout.anchors[key]) return this.status("Anchor ID already exists; choose a new ID.");
      this.recordHistory();
      this.layout.anchors[key] = point;
      this.selected = { kind: "anchor", key };
      this.render();
      return;
    }
    if (this.tool === "echo-anchor") {
      const key = this.value("echo-key") || this.value("new-id") || "echo-anchor";
      if (this.layout.echoAnchors[key]) return this.status("Echo anchor ID already exists; choose a new ID.");
      this.recordHistory();
      this.layout.echoAnchors[key] = { x: point.x, y: point.y, radius: Number(this.value("new-radius")) || 56 };
      this.selected = { kind: "echo-anchor", key };
      this.render();
      return;
    }
    if (this.tool === "select") {
      this.selected = this.pick(point);
      if (this.selected) {
        this.recordHistory();
        this.moveDrag = { selection: this.selected, offset: this.selectionOffset(this.selected, point) };
      }
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
          this.recordHistory();
          this.layout.obstacles.push(rect);
          this.selected = { kind: "collision", index: this.layout.obstacles.length - 1 };
        }
        if (this.tool === "trigger") {
          const id = this.value("new-id") || "trigger";
          if (this.layout.triggers.some((item) => item.id === id)) return this.status("Trigger ID already exists; choose a new ID.");
          this.recordHistory();
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
    this.renderPreviewDom();
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
    const anchorRows = Object.entries(this.layout.anchors).map(([key, point]) => {
      return `<fieldset><legend>${key}</legend><label>X<input data-anchor-field="${key}:x" type="number" value="${point.x}"></label><label>Y<input data-anchor-field="${key}:y" type="number" value="${point.y}"></label></fieldset>`;
    }).join("");
    if (!target) return `<h2>Inspector</h2><p>Select an object to edit exact values.</p><h3>Scene Anchors</h3>${anchorRows || "<p>No normal anchors yet.</p>"}`;
    const fields = Object.entries(target).map(([key, value]) => {
      if (!value || typeof value === "object") return "";
      return `<label>${this.escape(key)}<input data-inspector-field="${this.escape(key)}" value="${this.escape(String(value))}"></label>`;
    }).join("");
    const rect = "rect" in target ? Object.entries((target as { rect: Rect }).rect).map(([key, value]) => `<label>rect.${key}<input data-inspector-field="rect.${key}" type="number" value="${value}"></label>`).join("") : "";
    return `<h2>Inspector</h2>${fields}${rect}<h3>Scene Anchors</h3>${anchorRows || "<p>No normal anchors yet.</p>"}`;
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
    this.markDirty();
    this.draw();
  }

  private updateAnchorFromInspector(input: HTMLInputElement): void {
    const [key, axis] = (input.dataset.anchorField ?? "").split(":");
    if (!key || (axis !== "x" && axis !== "y")) return;
    this.layout.anchors[key] ??= { x: 0, y: 0 };
    this.layout.anchors[key][axis] = Number(input.value) || 0;
    this.markDirty();
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
    this.dirty = false;
    this.historyPast = [];
    this.historyFuture = [];
    this.status(`Saved ${this.layout.sceneId}/${this.layout.orientation}`);
  }

  private async addScene(): Promise<void> {
    if (!await this.guardTransition("adding a scene")) return;
    const label = window.prompt("Scene label?", "New Scene")?.trim();
    if (!label) return;
    const suggested = label.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
    const sceneId = normalizeSceneId(window.prompt("Scene ID?", suggested) ?? "");
    if (!sceneId) return;
    const response = await fetch("/__debug/add-scene", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ label, sceneId, orientation: this.orientation })
    });
    const body = await response.json() as { scene?: { id: string; label: string }; orientation?: SceneOrientation; layouts?: Record<SceneOrientation, SceneLayout>; error?: string; existing?: boolean; sceneId?: string };
    if (!response.ok) {
      this.status(body.error ?? "Add scene failed");
      if (body.existing && body.sceneId && body.orientation && window.confirm("Open the existing scene identity instead?")) {
        await this.switchScene(body.sceneId, body.orientation);
      }
      return;
    }
    if (!body.scene || !body.layouts || !body.orientation) return this.status("Add scene failed: incomplete server response.");
    const existing = sceneLayoutManifest[body.scene.id];
    sceneLayoutManifest[body.scene.id] = {
      label: body.scene.label,
      layouts: {
        landscape: existing?.layouts.landscape ?? body.layouts.landscape,
        portrait: existing?.layouts.portrait ?? body.layouts.portrait
      }
    };
    this.sceneId = body.scene.id;
    this.orientation = body.orientation;
    this.loadCurrentLayout();
    this.status("Added " + body.scene.label + " " + body.orientation + " identity.");
  }

  private deletePoint(key: EditorPointKey): void {
    if (!key) return;
    this.recordHistory();
    this.layout = deletePoints(this.layout, [key]);
    this.selectedPoints.delete(key);
    this.render();
    this.status("Deleted " + key);
  }

  private deletePointSelection(): void {
    const keys = this.selectedPointKeys();
    if (!keys.length) return this.status("Select one or more anchors first.");
    this.recordHistory();
    this.layout = deletePoints(this.layout, keys);
    this.selectedPoints.clear();
    this.render();
    this.status("Deleted " + keys.length + " point(s).");
  }

  private bulkAdd(): void {
    const text = this.root.querySelector<HTMLTextAreaElement>('[data-debug-field="bulk-points"]')?.value ?? "";
    const kind = (this.root.querySelector<HTMLSelectElement>('[data-debug-field="bulk-kind"]')?.value ?? "anchor") as EditorPointKind;
    if (!text.trim()) return this.status("Enter one point ID per line.");
    const result = bulkAddPoints(this.layout, text, kind);
    if (!result.added.length && !result.invalid.length) return this.status("No new points were added.");
    this.recordHistory();
    this.layout = result.layout;
    this.selectedPoints = new Set(result.added.map((id) => (kind + ":" + id) as EditorPointKey));
    this.render();
    this.status("Added " + result.added.length + "; skipped " + result.skipped.length + "; invalid " + result.invalid.length + ".");
  }

  private importManifest(): void {
    const text = this.root.querySelector<HTMLTextAreaElement>('[data-debug-field="bulk-edit"]')?.value ?? "";
    const manifest = parseAnchorManifest(text);
    if (!manifest.anchors.length && !manifest.echoAnchors.length) return this.status("Manifest contains no valid anchors.");
    let result = bulkAddPoints(this.layout, manifest.anchors.join("\n"), "anchor");
    result = bulkAddPoints(result.layout, manifest.echoAnchors.join("\n"), "echo-anchor");
    this.recordHistory();
    this.layout = result.layout;
    this.render();
    this.status("Manifest imported: " + manifest.anchors.length + " anchors, " + manifest.echoAnchors.length + " echo anchors, " + manifest.invalid.length + " invalid.");
  }

  private applyBulkEdit(): void {
    const text = this.root.querySelector<HTMLTextAreaElement>('[data-debug-field="bulk-edit"]')?.value ?? "";
    if (!text.trim()) return this.status("Enter an anchor manifest.");
    const result = applyPointTextEdit(this.layout, text);
    this.recordHistory();
    this.layout = result.layout;
    this.selectedPoints.clear();
    this.render();
    this.status("Point edit applied: +" + result.added.length + ", -" + result.removed.length + ", invalid " + result.invalid.length + ".");
  }

  private createGroupFromSelection(): void {
    const members = this.selectedPointKeys();
    if (!members.length) return this.status("Select points before creating a group.");
    const name = window.prompt("Group name?", "New Point Group")?.trim();
    if (!name) return;
    this.groups = createPointGroup(this.groups, name, members);
    this.render();
    this.status("Created group " + name + ".");
  }


  private moveSelectedGroup(): void {
    const groupId = this.root.querySelector<HTMLSelectElement>('[data-debug-field="group"]')?.value ?? "";
    const group = this.groups.find((item) => item.id === groupId);
    if (!group) return this.status("Choose a point group first.");
    const raw = window.prompt("Move group by dx,dy", "0,0") ?? "";
    const [dxText, dyText] = raw.split(",");
    const delta = { x: Number(dxText), y: Number(dyText) };
    if (!Number.isFinite(delta.x) || !Number.isFinite(delta.y)) return this.status("Enter numeric dx,dy.");
    this.recordHistory();
    this.layout = moveGroup(this.layout, group, delta);
    this.render();
    this.status("Moved group " + group.name + ".");
  }

  private deleteSelectedGroup(): void {
    const groupId = this.root.querySelector<HTMLSelectElement>('[data-debug-field="group"]')?.value ?? "";
    if (!groupId) return this.status("Choose a point group first.");
    const deleteMembers = window.confirm("Delete the group members too?");
    const result = deleteGroup(this.groups, groupId, deleteMembers);
    if (deleteMembers && result.memberKeys.length) {
      this.recordHistory();
      this.layout = deletePoints(this.layout, result.memberKeys);
      for (const key of result.memberKeys) this.selectedPoints.delete(key);
    }
    this.groups = result.groups;
    this.render();
    this.status("Deleted point group.");
  }

  private suggestPositions(): void {
    const keys = this.selectedPointKeys();
    if (!keys.length) return this.status("Select points before generating suggestions.");
    this.recordHistory();
    let next = this.layout;
    keys.forEach((key, index) => {
      const current = pointEntries(next).find((entry) => entry.key === key);
      if (!current) return;
      const target = createDraftPoint(index + 1, next.size);
      next = movePoints(next, [key], { x: target.x - current.x, y: target.y - current.y });
    });
    this.layout = next;
    this.render();
    this.status("Generated deterministic draft positions. DRAFT / UNVERIFIED.");
  }

  private createPortraitDraft(): void {
    if (this.orientation !== "landscape") return this.status("Open a landscape layout to create a portrait draft.");
    const target = sceneLayoutManifest[this.sceneId].layouts.portrait;
    const hasExisting = Object.keys(target.anchors).length > 0 || Object.keys(target.echoAnchors).length > 0 ||
      target.interactions.length > 0 || target.triggers.length > 0 || target.obstacles.length > 0;
    if (hasExisting) return this.status("Portrait layout already has authored content; it was protected. Open Existing instead.");
    const draft = portraitDraftFromLandscape(this.layout, target);
    this.orientation = "portrait";
    this.layout = draft.layout;
    this.dirty = true;
    this.historyPast = [];
    this.historyFuture = [];
    this.previewState = createPreviewState(this.sceneId, this.orientation);
    this.render();
    this.status("Created a portrait draft. DRAFT / UNVERIFIED; no authored JSON was changed.");
  }

  private async addPreview(): Promise<void> {
    const projectPath = this.root.querySelector<HTMLInputElement>('[data-debug-field="preview-path"]')?.value.trim() ?? "";
    const anchorId = this.root.querySelector<HTMLInputElement>('[data-debug-field="preview-anchor"]')?.value.trim() || undefined;
    const file = this.pendingPreviewFile;
    if (!projectPath && !file) return this.status("Choose a project asset path or local image.");
    try {
      const item = createPreviewItem({
        name: file?.name ?? projectPath.split("/").pop() ?? "Preview",
        projectPath: projectPath || undefined,
        localUrl: file ? URL.createObjectURL(file) : undefined,
        fileName: file?.name,
        anchorId
      });
      this.previewState = addPreviewItem(this.previewState, item);
      this.pendingPreviewFile = null;
      this.render();
      this.status("Added temporary preview. It is editor-only.");
    } catch (error) {
      this.status(error instanceof Error ? error.message : "Preview could not be added.");
    }
  }

  private approvePreview(id: string): void {
    try {
      this.previewState = approveCanonicalCandidate(this.previewState, id);
      this.render();
      this.status("Approved as a canonical candidate. Copy the handoff to carry it forward.");
    } catch (error) {
      this.status(error instanceof Error ? error.message : "Approval failed.");
    }
  }

  private async copyText(value: string, success: string): Promise<void> {
    await navigator.clipboard.writeText(value);
    this.status(success);
  }

  private async copyPreviewMapping(): Promise<void> {
    const id = this.previewState.selectedId ?? this.previewState.items[0]?.id;
    if (!id) return this.status("No preview item selected.");
    await this.copyText(copyPreviewMapping(this.previewState, id), "Copied preview mapping.");
  }

  private async copyApprovedMappings(): Promise<void> {
    await this.copyText(copyAllApprovedMappings(this.previewState), "Copied approved mappings.");
  }

  private async copyHandoff(): Promise<void> {
    await this.copyText(copyImplementationHandoff(this.previewState), "Copied implementation handoff.");
  }

  private previewAnchorPoint(item: PreviewState["items"][number]): Point {
    if (item.anchorId) {
      return this.layout.anchors[item.anchorId] ?? this.layout.echoAnchors[item.anchorId] ?? { x: item.x, y: item.y };
    }
    return { x: item.x, y: item.y };
  }

  private renderPreviewDom(): void {
    const layer = this.root.querySelector<HTMLElement>("[data-debug-preview-layer]");
    if (!layer) return;
    const scale = this.canvasScale();
    layer.innerHTML = "";
    for (const item of this.previewState.items.filter((candidate) => candidate.visible).sort((a, b) => a.z - b.z)) {
      const image = document.createElement("img");
      image.src = item.source.kind === "project" ? item.source.path ?? "" : item.source.localUrl ?? "";
      image.alt = item.name;
      const point = this.previewAnchorPoint(item);
      image.className = "scene-debug-preview-item";
      image.style.left = (point.x * scale.x + item.offsetX * scale.x) + "px";
      image.style.top = (point.y * scale.y + item.offsetY * scale.y) + "px";
      image.style.transform = "translate(-50%, -100%) scale(" + item.scale + ") scaleX(" + (item.flip ? -1 : 1) + ")";
      image.style.opacity = String(item.opacity);
      image.style.zIndex = String(item.z + 1);
      if (this.previewState.showImageBounds || item.showBounds) image.dataset.previewBounds = "true";
      layer.appendChild(image);
      if (this.previewState.showAnchorPoints && item.anchorId) {
        const marker = document.createElement("span");
        marker.className = "scene-debug-preview-anchor";
        marker.style.left = (point.x * scale.x) + "px";
        marker.style.top = (point.y * scale.y) + "px";
        layer.appendChild(marker);
      }
    }
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
    this.recordHistory();
    if (this.selected.kind === "collision") this.layout.obstacles.splice(this.selected.index, 1);
    if (this.selected.kind === "interaction") this.layout.interactions.splice(this.selected.index, 1);
    if (this.selected.kind === "trigger") this.layout.triggers.splice(this.selected.index, 1);
    if (this.selected.kind === "placement-slot") this.layout.placementSlots.splice(this.selected.index, 1);
    if (this.selected.kind === "echo-anchor") delete this.layout.echoAnchors[this.selected.key];
    if (this.selected.kind === "anchor") delete this.layout.anchors[this.selected.key];
    this.selected = null;
    this.markDirty();
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
    if (this.tool === "anchor") return "anchor";
    if (this.tool === "echo-anchor") return "echo-anchor";
    return "";
  }

  private defaultNewLabel(): string {
    if (this.tool === "interaction") return "Interaction";
    if (this.tool === "trigger") return "event-id";
    if (this.tool === "placement-slot") return this.slotKind() === "chapter" ? "Chapter Slot" : "Fragment Slot";
    if (this.tool === "echo-anchor") return "Echo Anchor";
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

  private echoLabel(id: string): string {
    return `Echo · ${id}`;
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
