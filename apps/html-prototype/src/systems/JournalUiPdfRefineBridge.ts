import type { DiaryEntry, DiaryMedia, JournalBookCover } from "../types.js";
import { diaryMediaItems } from "./ScrapbookComposer.js";
import type { JournalMonth, MonthlyJournalPdfPage } from "./JournalModel.js";

const PAGE_WIDTH = 1240;
const PAGE_HEIGHT = 1754;
const PAGE_LEFT = 126;
const PAGE_RIGHT = 1114;
const PAGE_TOP = 116;
const PAGE_BOTTOM = 1570;
const BODY_WIDTH = PAGE_RIGHT - PAGE_LEFT;
const RULE_START = 286;
const RULE_STEP = 54;
const RULE_TEXT_OFFSET = 9;
const PHOTO_COLUMNS = 3;
const PHOTO_GAP = 24;
const PHOTO_SIZE = Math.floor((BODY_WIDTH - PHOTO_GAP * (PHOTO_COLUMNS - 1)) / PHOTO_COLUMNS);

type JournalPrototype = {
  renderMonthlyPdfFlowPages?: (month: JournalMonth) => Promise<MonthlyJournalPdfPage[]>;
  openMonthlyBook?: (monthKey?: string) => void;
  showMonthlyBooks?: () => void;
  handleMonthCoverInput?: (input: HTMLInputElement) => Promise<void>;
};

type JournalHost = {
  overlay: HTMLElement;
  monthlyCovers?: Record<string, JournalBookCover>;
  loadCanvasImage: (src: string) => Promise<HTMLImageElement | null>;
  drawPdfImage: (ctx: CanvasRenderingContext2D, image: HTMLImageElement, x: number, y: number, width: number, height: number) => void;
  openMonthlyBook?: (monthKey?: string) => void;
};

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
  ctx.fillStyle = "#fff9e9";
  ctx.fillRect(72, 58, PAGE_WIDTH - 144, PAGE_HEIGHT - 116);
  ctx.strokeStyle = "rgba(126, 91, 53, .17)";
  ctx.lineWidth = 2;
  ctx.strokeRect(72, 58, PAGE_WIDTH - 144, PAGE_HEIGHT - 116);
  ctx.strokeStyle = "rgba(120, 91, 58, .082)";
  ctx.lineWidth = 1;
  for (let y = RULE_START; y < PAGE_BOTTOM + RULE_STEP; y += RULE_STEP) {
    ctx.beginPath();
    ctx.moveTo(PAGE_LEFT, y);
    ctx.lineTo(PAGE_RIGHT, y);
    ctx.stroke();
  }
}

function drawPageFooter(ctx: CanvasRenderingContext2D, pageNumber: number): void {
  ctx.fillStyle = "rgba(76, 56, 39, .42)";
  ctx.font = "400 17px Georgia, 'Times New Roman', serif";
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
  return [entry.location, entry.weather, entry.mood].map((value) => value?.trim()).filter(Boolean).join(" · ");
}

function nextTextBaseline(cursorY: number): number {
  const firstBaseline = RULE_START - RULE_TEXT_OFFSET;
  if (cursorY <= firstBaseline) return firstBaseline;
  const steps = Math.ceil((cursorY - firstBaseline) / RULE_STEP);
  return firstBaseline + steps * RULE_STEP;
}

function installJournalAudioPlaybackGuard(): void {
  if (document.documentElement.dataset.journalAudioPlaybackGuard === "true") return;
  document.documentElement.dataset.journalAudioPlaybackGuard = "true";
  document.addEventListener("play", (event) => {
    const audio = event.target;
    if (!(audio instanceof HTMLAudioElement) || !audio.classList.contains("journal-audio-player")) return;
    audio.muted = false;
    if (audio.volume <= 0.01) audio.volume = 1;
    audio.playbackRate = 1;
  }, true);
}

function coverPosition(cover: JournalBookCover): string {
  if (cover.crop === "top") return "center top";
  if (cover.crop === "bottom") return "center bottom";
  return "center center";
}

function applyCoverToElement(element: HTMLElement, cover: JournalBookCover): void {
  const src = cover.src.trim();
  if (!src || src.startsWith("linear-gradient")) return;
  element.style.backgroundImage = `url("${src.replace(/"/g, "%22")}")`;
  element.style.backgroundSize = cover.crop === "contain" ? "contain" : "cover";
  element.style.backgroundPosition = coverPosition(cover);
  element.style.backgroundRepeat = "no-repeat";
  element.classList.add("has-custom-cover");
}

function refreshBooksCoverThumbs(host: JournalHost): void {
  const covers = host.monthlyCovers ?? {};
  host.overlay.querySelectorAll<HTMLElement>(".monthly-book").forEach((book) => {
    const monthKey = book.dataset.month ?? "";
    const cover = covers[monthKey];
    const thumb = book.querySelector<HTMLElement>(".book-cover-thumb");
    if (!cover || !thumb) return;
    applyCoverToElement(thumb, cover);
  });
}

function refreshReaderCover(host: JournalHost, monthKey: string): void {
  if (!monthKey) return;
  const cover = host.monthlyCovers?.[monthKey];
  const preview = host.overlay.querySelector<HTMLElement>(".monthly-reader .pdf-cover-preview");
  if (!cover || !preview) return;
  applyCoverToElement(preview, cover);
}

function installImmediateCoverPreview(host: JournalHost, monthKey: string): void {
  const input = host.overlay.querySelector<HTMLInputElement>("#month-cover-input");
  if (!input || input.dataset.immediateCoverPreview === "true") return;
  input.dataset.immediateCoverPreview = "true";
  input.addEventListener("change", () => {
    const file = input.files?.[0];
    const preview = host.overlay.querySelector<HTMLElement>(".monthly-reader .pdf-cover-preview");
    if (!file || !file.type.startsWith("image/") || !preview) return;
    const reader = new FileReader();
    reader.addEventListener("load", () => {
      if (typeof reader.result !== "string") return;
      preview.style.backgroundImage = `url("${reader.result.replace(/"/g, "%22")}")`;
      preview.style.backgroundSize = "cover";
      preview.style.backgroundPosition = "center center";
      preview.classList.add("has-custom-cover");
    });
    reader.readAsDataURL(file);
    window.setTimeout(() => refreshReaderCover(host, monthKey), 0);
  });
}

async function renderRefinedBookFlow(this: JournalHost, month: JournalMonth): Promise<MonthlyJournalPdfPage[]> {
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
    pages.push({ dataUrl: canvas.toDataURL("image/jpeg", 0.93), width: PAGE_WIDTH, height: PAGE_HEIGHT });
    pageNumber += 1;
    beginPage();
  };

  beginPage();

  for (const entry of [...month.entries].reverse()) {
    const headerEstimate = 232;
    if (dirty && cursorY + headerEstimate > PAGE_BOTTOM - RULE_STEP) pushPage();

    ctx.fillStyle = "rgba(74, 54, 38, .56)";
    ctx.font = "500 17px Georgia, 'Times New Roman', serif";
    ctx.fillText(entry.date, PAGE_LEFT, cursorY + 5);
    cursorY += 56;

    ctx.fillStyle = "#493421";
    ctx.font = "600 41px 'Segoe Print', 'Bradley Hand', 'Chalkboard SE', 'Kaiti TC', 'STKaiti', 'KaiTi', cursive";
    const titleLines = splitWrappedLines(ctx, entry.title || "Untitled Memory", BODY_WIDTH);
    for (const titleLine of titleLines) {
      if (titleLine === null) continue;
      ctx.fillText(titleLine, PAGE_LEFT, cursorY);
      cursorY += 54;
    }
    cursorY += 18;

    const meta = entryMeta(entry);
    if (meta) {
      ctx.fillStyle = "rgba(74, 54, 38, .51)";
      ctx.font = "400 18px 'Kaiti TC', 'STKaiti', 'KaiTi', 'DFKai-SB', 'PMingLiU', serif";
      ctx.fillText(meta, PAGE_LEFT, cursorY);
      cursorY += 34;
    }

    ctx.strokeStyle = "rgba(98, 70, 43, .16)";
    ctx.beginPath();
    ctx.moveTo(PAGE_LEFT, cursorY + 2);
    ctx.lineTo(PAGE_RIGHT, cursorY + 2);
    ctx.stroke();
    cursorY += 34;
    dirty = true;

    ctx.fillStyle = "#49382b";
    ctx.font = "400 27px 'Kaiti TC', 'STKaiti', 'KaiTi', 'DFKai-SB', 'Songti TC', 'STSong', serif";
    const bodyLines = splitWrappedLines(ctx, entry.body || "Empty draft", BODY_WIDTH);
    let baseline = nextTextBaseline(cursorY);

    for (const line of bodyLines) {
      if (baseline > PAGE_BOTTOM - 16) {
        pushPage();
        ctx.fillStyle = "#49382b";
        ctx.font = "400 27px 'Kaiti TC', 'STKaiti', 'KaiTi', 'DFKai-SB', 'Songti TC', 'STSong', serif";
        baseline = nextTextBaseline(PAGE_TOP + 34);
      }
      if (line !== null) ctx.fillText(line, PAGE_LEFT, baseline);
      baseline += RULE_STEP;
      dirty = true;
    }

    cursorY = baseline + 16;
    const photos = entryImages(entry);
    let photoIndex = 0;
    while (photoIndex < photos.length) {
      if (cursorY + PHOTO_SIZE > PAGE_BOTTOM) {
        pushPage();
        cursorY = nextTextBaseline(PAGE_TOP + 38) + 12;
      }
      const row = photos.slice(photoIndex, photoIndex + PHOTO_COLUMNS);
      for (const [column, photo] of row.entries()) {
        const image = await this.loadCanvasImage(photo.src);
        if (!image) continue;
        const x = PAGE_LEFT + column * (PHOTO_SIZE + PHOTO_GAP);
        ctx.fillStyle = "#fffdf3";
        ctx.fillRect(x - 7, cursorY - 7, PHOTO_SIZE + 14, PHOTO_SIZE + 14);
        ctx.strokeStyle = "rgba(84, 60, 40, .16)";
        ctx.strokeRect(x - 7, cursorY - 7, PHOTO_SIZE + 14, PHOTO_SIZE + 14);
        this.drawPdfImage(ctx, image, x, cursorY, PHOTO_SIZE, PHOTO_SIZE);
      }
      dirty = true;
      cursorY += PHOTO_SIZE + PHOTO_GAP;
      photoIndex += PHOTO_COLUMNS;
    }

    cursorY += 34;
    if (cursorY < PAGE_BOTTOM - 42) {
      ctx.strokeStyle = "rgba(104, 75, 46, .1)";
      ctx.beginPath();
      ctx.moveTo(PAGE_LEFT, cursorY - 10);
      ctx.lineTo(PAGE_RIGHT, cursorY - 10);
      ctx.stroke();
    }
  }

  pushPage();
  return pages;
}

export function installJournalUiPdfRefineBridge(proto: JournalPrototype): void {
  installJournalAudioPlaybackGuard();
  proto.renderMonthlyPdfFlowPages = renderRefinedBookFlow;

  const originalShowBooks = proto.showMonthlyBooks;
  if (originalShowBooks) {
    proto.showMonthlyBooks = function(this: JournalHost): void {
      originalShowBooks.call(this as unknown as object);
      requestAnimationFrame(() => refreshBooksCoverThumbs(this));
    };
  }

  const originalOpenMonthlyBook = proto.openMonthlyBook;
  if (originalOpenMonthlyBook) {
    proto.openMonthlyBook = function(this: JournalHost, monthKey?: string): void {
      originalOpenMonthlyBook.call(this as unknown as object, monthKey);
      const resolvedMonth = monthKey ?? this.overlay.querySelector<HTMLElement>("[data-action='export-month-pdf']")?.dataset.month ?? "";
      requestAnimationFrame(() => {
        refreshReaderCover(this, resolvedMonth);
        installImmediateCoverPreview(this, resolvedMonth);
      });
    };
  }

  const originalCoverInput = proto.handleMonthCoverInput;
  if (originalCoverInput) {
    proto.handleMonthCoverInput = async function(this: JournalHost, input: HTMLInputElement): Promise<void> {
      const monthKey = this.overlay.querySelector<HTMLElement>("[data-action='export-month-pdf']")?.dataset.month ?? "";
      await originalCoverInput.call(this as unknown as object, input);
      if (monthKey && this.openMonthlyBook) this.openMonthlyBook(monthKey);
    };
  }
}
