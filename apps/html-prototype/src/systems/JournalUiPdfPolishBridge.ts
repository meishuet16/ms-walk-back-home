import type { DiaryEntry, DiaryMedia } from "../types.js";
import { diaryMediaItems } from "./ScrapbookComposer.js";
import type { JournalMonth, MonthlyJournalPdfPage } from "./JournalModel.js";

const PAGE_WIDTH = 1240;
const PAGE_HEIGHT = 1754;
const PAGE_LEFT = 126;
const PAGE_RIGHT = 1114;
const PAGE_TOP = 116;
const PAGE_BOTTOM = 1570;
const BODY_WIDTH = PAGE_RIGHT - PAGE_LEFT;
const PHOTO_COLUMNS = 3;
const PHOTO_GAP = 24;
const PHOTO_SIZE = Math.floor((BODY_WIDTH - PHOTO_GAP * (PHOTO_COLUMNS - 1)) / PHOTO_COLUMNS);

type JournalPrototype = {
  showTimeline?: (options?: unknown) => void;
  showMoreTimelineEntries?: () => void;
  openMonthlyBook?: (monthKey?: string) => void;
  renderMonthlyPdfFlowPages?: (month: JournalMonth) => Promise<MonthlyJournalPdfPage[]>;
};

type JournalHost = {
  overlay: HTMLElement;
  loadCanvasImage: (src: string) => Promise<HTMLImageElement | null>;
  drawPdfImage: (ctx: CanvasRenderingContext2D, image: HTMLImageElement, x: number, y: number, width: number, height: number) => void;
};

function enhanceMonthlyReader(host: JournalHost): void {
  const reader = host.overlay.querySelector<HTMLElement>(".monthly-reader");
  if (!reader || reader.dataset.journalCoverPolish === "true") return;
  reader.dataset.journalCoverPolish = "true";

  const changeButton = reader.querySelector<HTMLButtonElement>("[data-action='change-month-cover']");
  const cropControl = reader.querySelector<HTMLElement>(".month-cover-crop-control");
  const input = reader.querySelector<HTMLInputElement>("#month-cover-input");
  const preview = reader.querySelector<HTMLElement>(".pdf-cover-preview");
  if (!changeButton || !cropControl || !input || !preview) return;

  changeButton.textContent = "Edit cover";
  changeButton.setAttribute("aria-expanded", "false");

  const editor = document.createElement("section");
  editor.className = "journal-cover-editor";
  editor.setAttribute("aria-label", "Monthly journal cover editor");
  editor.innerHTML = `<div class="journal-cover-editor-head"><strong>Cover</strong><small>Keep the book, adjust the picture.</small></div><div class="journal-cover-editor-actions"><button type="button" data-journal-cover-choose>Choose image</button><button type="button" data-journal-cover-done>Done</button></div>`;
  editor.insertBefore(cropControl, editor.querySelector(".journal-cover-editor-actions"));
  editor.appendChild(input);
  preview.insertAdjacentElement("beforebegin", editor);

  reader.addEventListener("click", (event) => {
    const target = event.target instanceof Element ? event.target.closest<HTMLElement>("button") : null;
    if (!target) return;
    if (target.dataset.action === "change-month-cover") {
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      const editing = !reader.classList.contains("cover-editing");
      reader.classList.toggle("cover-editing", editing);
      changeButton.setAttribute("aria-expanded", String(editing));
      if (editing) editor.scrollIntoView({ block: "nearest", behavior: "smooth" });
      return;
    }
    if (target.hasAttribute("data-journal-cover-choose")) {
      event.preventDefault();
      event.stopPropagation();
      input.click();
      return;
    }
    if (target.hasAttribute("data-journal-cover-done")) {
      event.preventDefault();
      event.stopPropagation();
      reader.classList.remove("cover-editing");
      changeButton.setAttribute("aria-expanded", "false");
    }
  }, true);
}

function enhanceTimeline(host: JournalHost): void {
  const button = host.overlay.querySelector<HTMLButtonElement>(".timeline-show-more");
  if (button) button.textContent = "Show More ↓";
}

function splitWrappedLines(ctx: CanvasRenderingContext2D, value: string, maxWidth: number): Array<string | null> {
  const output: Array<string | null> = [];
  const paragraphs = (value || "Empty draft").replace(/\r/g, "").split("\n");
  for (const paragraph of paragraphs) {
    if (!paragraph.trim()) {
      output.push(null);
      continue;
    }
    let line = "";
    for (const char of paragraph) {
      const candidate = line + char;
      if (line && ctx.measureText(candidate).width > maxWidth) {
        output.push(line);
        line = char;
      } else {
        line = candidate;
      }
    }
    if (line) output.push(line);
  }
  return output.length ? output : ["Empty draft"];
}

function drawPageSurface(ctx: CanvasRenderingContext2D): void {
  ctx.fillStyle = "#eee1c5";
  ctx.fillRect(0, 0, PAGE_WIDTH, PAGE_HEIGHT);
  ctx.fillStyle = "#fff8e6";
  ctx.fillRect(72, 58, PAGE_WIDTH - 144, PAGE_HEIGHT - 116);
  ctx.strokeStyle = "rgba(126, 91, 53, .18)";
  ctx.lineWidth = 2;
  ctx.strokeRect(72, 58, PAGE_WIDTH - 144, PAGE_HEIGHT - 116);
  ctx.strokeStyle = "rgba(123, 91, 55, .09)";
  ctx.lineWidth = 1;
  for (let y = 214; y < PAGE_BOTTOM; y += 44) {
    ctx.beginPath();
    ctx.moveTo(PAGE_LEFT, y);
    ctx.lineTo(PAGE_RIGHT, y);
    ctx.stroke();
  }
}

function drawPageFooter(ctx: CanvasRenderingContext2D, pageNumber: number): void {
  ctx.fillStyle = "rgba(78, 57, 39, .48)";
  ctx.font = "400 18px Georgia, serif";
  ctx.textAlign = "left";
  ctx.fillText("Walk Back Home", PAGE_LEFT, 1640);
  ctx.textAlign = "right";
  ctx.fillText(String(pageNumber).padStart(2, "0"), PAGE_RIGHT, 1640);
  ctx.textAlign = "left";
}

function entryImages(entry: DiaryEntry): Extract<DiaryMedia, { type: "image" }>[] {
  return diaryMediaItems(entry).filter((item): item is Extract<DiaryMedia, { type: "image" }> => item.type === "image");
}

function entryMeta(entry: DiaryEntry): string {
  const parts = [entry.location, entry.weather, entry.mood].map((value) => value?.trim()).filter(Boolean);
  return parts.join(" · ");
}

async function renderBookFlow(this: JournalHost, month: JournalMonth): Promise<MonthlyJournalPdfPage[]> {
  const canvas = document.createElement("canvas");
  canvas.width = PAGE_WIDTH;
  canvas.height = PAGE_HEIGHT;
  const pages: MonthlyJournalPdfPage[] = [];
  let pageNumber = 1;
  let ctx = canvas.getContext("2d")!;
  let cursorY = PAGE_TOP;
  let dirty = false;

  const beginPage = (): void => {
    canvas.width = PAGE_WIDTH;
    canvas.height = PAGE_HEIGHT;
    ctx = canvas.getContext("2d")!;
    drawPageSurface(ctx);
    cursorY = PAGE_TOP;
    dirty = false;
  };

  const pushPage = (): void => {
    if (!dirty) return;
    drawPageFooter(ctx, pageNumber);
    pages.push({ dataUrl: canvas.toDataURL("image/jpeg", 0.92), width: PAGE_WIDTH, height: PAGE_HEIGHT });
    pageNumber += 1;
    beginPage();
  };

  beginPage();

  for (const entry of [...month.entries].reverse()) {
    const headerEstimate = 178;
    if (dirty && cursorY + headerEstimate > PAGE_BOTTOM) pushPage();

    ctx.fillStyle = "rgba(75, 54, 37, .64)";
    ctx.font = "500 20px Georgia, 'Times New Roman', serif";
    ctx.fillText(entry.date, PAGE_LEFT, cursorY);
    cursorY += 38;

    ctx.fillStyle = "#4b3524";
    ctx.font = "700 42px Georgia, 'Times New Roman', serif";
    const titleLines = splitWrappedLines(ctx, entry.title || "Untitled Memory", BODY_WIDTH);
    for (const titleLine of titleLines) {
      if (titleLine === null) continue;
      ctx.fillText(titleLine, PAGE_LEFT, cursorY);
      cursorY += 52;
    }

    const meta = entryMeta(entry);
    if (meta) {
      ctx.fillStyle = "rgba(75, 54, 37, .58)";
      ctx.font = "400 20px 'Microsoft JhengHei', 'PingFang TC', 'Noto Sans CJK TC', sans-serif";
      ctx.fillText(meta, PAGE_LEFT, cursorY);
      cursorY += 36;
    }

    ctx.strokeStyle = "rgba(102, 73, 44, .22)";
    ctx.beginPath();
    ctx.moveTo(PAGE_LEFT, cursorY + 2);
    ctx.lineTo(PAGE_RIGHT, cursorY + 2);
    ctx.stroke();
    cursorY += 36;
    dirty = true;

    ctx.fillStyle = "#4d3a2a";
    ctx.font = "400 28px 'Microsoft JhengHei', 'PingFang TC', 'Noto Sans CJK TC', sans-serif";
    const bodyLines = splitWrappedLines(ctx, entry.body || "Empty draft", BODY_WIDTH);
    for (const line of bodyLines) {
      const lineHeight = line === null ? 22 : 44;
      if (cursorY + lineHeight > PAGE_BOTTOM) {
        pushPage();
        ctx.fillStyle = "#4d3a2a";
        ctx.font = "400 28px 'Microsoft JhengHei', 'PingFang TC', 'Noto Sans CJK TC', sans-serif";
      }
      if (line !== null) ctx.fillText(line, PAGE_LEFT, cursorY);
      cursorY += lineHeight;
      dirty = true;
    }

    cursorY += 28;
    const photos = entryImages(entry);
    let photoIndex = 0;
    while (photoIndex < photos.length) {
      if (cursorY + PHOTO_SIZE > PAGE_BOTTOM) pushPage();
      const row = photos.slice(photoIndex, photoIndex + PHOTO_COLUMNS);
      for (const [column, photo] of row.entries()) {
        const image = await this.loadCanvasImage(photo.src);
        if (!image) continue;
        const x = PAGE_LEFT + column * (PHOTO_SIZE + PHOTO_GAP);
        ctx.fillStyle = "#fffdf3";
        ctx.fillRect(x - 7, cursorY - 7, PHOTO_SIZE + 14, PHOTO_SIZE + 14);
        ctx.strokeStyle = "rgba(84, 60, 40, .18)";
        ctx.strokeRect(x - 7, cursorY - 7, PHOTO_SIZE + 14, PHOTO_SIZE + 14);
        this.drawPdfImage(ctx, image, x, cursorY, PHOTO_SIZE, PHOTO_SIZE);
      }
      dirty = true;
      cursorY += PHOTO_SIZE + PHOTO_GAP;
      photoIndex += PHOTO_COLUMNS;
    }

    cursorY += 42;
    if (cursorY < PAGE_BOTTOM - 40) {
      ctx.strokeStyle = "rgba(104, 75, 46, .12)";
      ctx.beginPath();
      ctx.moveTo(PAGE_LEFT, cursorY - 12);
      ctx.lineTo(PAGE_RIGHT, cursorY - 12);
      ctx.stroke();
    }
  }

  pushPage();
  return pages;
}

export function installJournalUiPdfPolishBridge(proto: JournalPrototype): void {
  const originalShowTimeline = proto.showTimeline;
  if (originalShowTimeline) {
    proto.showTimeline = function(this: JournalHost, ...args: [unknown?]): void {
      originalShowTimeline.apply(this as unknown as object, args);
      requestAnimationFrame(() => enhanceTimeline(this));
    };
  }

  const originalShowMore = proto.showMoreTimelineEntries;
  if (originalShowMore) {
    proto.showMoreTimelineEntries = function(this: JournalHost): void {
      const before = this.overlay.querySelectorAll(".timeline-list article").length;
      originalShowMore.call(this as unknown as object);
      requestAnimationFrame(() => {
        const entries = [...this.overlay.querySelectorAll<HTMLElement>(".timeline-list article")];
        const added = Math.max(0, entries.length - before);
        const reveal = entries.slice(Math.max(0, entries.length - added));
        reveal.forEach((entry, index) => {
          entry.style.animationDelay = `${Math.min(index * 45, 180)}ms`;
          entry.classList.add("journal-reveal");
        });
        const button = this.overlay.querySelector<HTMLElement>(".timeline-show-more");
        const feedback = document.createElement("div");
        feedback.className = "timeline-load-feedback";
        feedback.textContent = added > 0 ? `${added} more memories unfolded` : "You're at the end of this month";
        (button?.parentElement ?? this.overlay).appendChild(feedback);
        window.setTimeout(() => feedback.remove(), 1900);
        enhanceTimeline(this);
      });
    };
  }

  const originalOpenMonthlyBook = proto.openMonthlyBook;
  if (originalOpenMonthlyBook) {
    proto.openMonthlyBook = function(this: JournalHost, monthKey?: string): void {
      originalOpenMonthlyBook.call(this as unknown as object, monthKey);
      requestAnimationFrame(() => enhanceMonthlyReader(this));
    };
  }

  proto.renderMonthlyPdfFlowPages = renderBookFlow;
}
