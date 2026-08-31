import { finalDreamCredits, finalDreamEndingLines, finalDreamFrames, finalDreamMorningImage, type FinalDreamFrame } from "../fixtures/finalDreamChapter.js";

type FinalDreamHost = {
  root: HTMLElement;
  overlay: HTMLElement;
  stage?: HTMLElement;
  onComplete: () => void;
};

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" }[char]!));
}

export class FinalDreamPresentation {
  private index = 0;
  private phase: "dream" | "ending" | "title" | "credits" = "dream";
  private endingIndex = 0;
  private destroyed = false;
  private transitionTimer = 0;
  private endingTimer = 0;
  private typeTimer = 0;
  private typing = false;
  private currentText = "";
  private currentTypedCount = 0;
  private readonly reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
  private readonly keydown = (event: KeyboardEvent) => {
    if (event.key === "Enter" || event.key === " " || event.key === "ArrowRight") {
      event.preventDefault();
      this.advance();
    }
  };

  constructor(private readonly host: FinalDreamHost) {}

  start(): void {
    this.destroyed = false;
    this.host.root.classList.add("final-dream-active");
    this.host.overlay.classList.add("final-dream-overlay");
    document.addEventListener("keydown", this.keydown);
    this.renderDream();
  }

  advance(): void {
    if (this.destroyed) return;
    if (this.phase === "dream") {
      if (this.typing) {
        this.finishTyping();
        return;
      }
      if (this.index < finalDreamFrames.length - 1) {
        this.index += 1;
        this.renderDream();
      } else {
        this.phase = "ending";
        this.endingIndex = 0;
        this.renderEnding(true);
      }
      return;
    }
    if (this.phase === "ending") return;
    if (this.phase === "title") return this.beginCredits();
    this.finish();
  }

  destroy(): void {
    if (this.destroyed) return;
    this.destroyed = true;
    window.clearTimeout(this.transitionTimer);
    window.clearTimeout(this.endingTimer);
    window.clearTimeout(this.typeTimer);
    document.removeEventListener("keydown", this.keydown);
    this.host.root.classList.remove("final-dream-active");
    this.host.overlay.classList.remove("final-dream-overlay");
    this.host.overlay.innerHTML = "";
  }

  private renderDream(): void {
    const frame = finalDreamFrames[this.index];
    if (!frame) return;
    this.typing = false;
    this.currentText = frame.text ?? "";
    this.currentTypedCount = 0;
    this.host.overlay.innerHTML = this.frameMarkup(frame);
    this.bindAdvance();
    this.host.overlay.querySelector<HTMLElement>(".final-dream-frame")?.classList.add("final-dream-page-enter");
    if (frame.text) this.startTyping();
  }

  private frameMarkup(frame: FinalDreamFrame): string {
    const portrait = frame.portrait
      ? `<img class="final-dream-portrait" src="${escapeHtml(frame.portrait)}" alt="" aria-hidden="true">`
      : "";
    const speaker = frame.speaker ? `<span class="final-dream-speaker">${escapeHtml(frame.speaker)}</span>` : "";
    const dialogue = frame.text
      ? `<div class="final-dream-dialogue">${speaker}<p><span class="final-dream-type" aria-live="polite"></span><span class="final-dream-caret" aria-hidden="true"></span></p><span class="final-dream-next-mark" aria-hidden="true">›</span></div>`
      : "";
    return `<section class="final-dream-frame treatment-${escapeHtml(frame.treatment ?? "scene")}" data-final-dream-frame="${escapeHtml(frame.id)}">
      <div class="final-dream-image-wrap"><img class="final-dream-image" src="${escapeHtml(frame.image)}" alt=""></div>
      ${portrait}
      <div class="final-dream-wash" aria-hidden="true"></div>
      ${dialogue}
      <button class="final-dream-hit-target" type="button" data-final-dream-next aria-label="Continue the dream"></button>
    </section>`;
  }

  private startTyping(): void {
    const target = this.host.overlay.querySelector<HTMLElement>(".final-dream-type");
    if (!target) return;
    if (this.reducedMotion) {
      target.textContent = this.currentText;
      this.typing = false;
      return;
    }
    this.typing = true;
    const step = () => {
      if (this.destroyed || !this.typing) return;
      this.currentTypedCount = Math.min(this.currentText.length, this.currentTypedCount + 1);
      target.textContent = this.currentText.slice(0, this.currentTypedCount);
      if (this.currentTypedCount >= this.currentText.length) {
        this.typing = false;
        return;
      }
      const char = this.currentText[this.currentTypedCount - 1] ?? "";
      const delay = /[。！？!?…]/.test(char) ? 105 : /[，、；：,;:]/.test(char) ? 70 : 34;
      this.typeTimer = window.setTimeout(step, delay);
    };
    step();
  }

  private finishTyping(): void {
    window.clearTimeout(this.typeTimer);
    this.typing = false;
    this.currentTypedCount = this.currentText.length;
    const target = this.host.overlay.querySelector<HTMLElement>(".final-dream-type");
    if (target) target.textContent = this.currentText;
  }

  private renderEnding(scheduleNext = false): void {
    const visible = finalDreamEndingLines.slice(0, this.endingIndex + 1);
    this.host.overlay.innerHTML = `<section class="final-dream-frame final-dream-ending" data-final-dream-frame="morning-road">
      <div class="final-dream-image-wrap"><img class="final-dream-image" src="${escapeHtml(finalDreamMorningImage)}" alt=""></div>
      <div class="final-dream-morning-haze" aria-hidden="true"></div>
      <div class="final-dream-ending-copy" aria-live="polite">${visible.map((line, index) => `<p class="ending-line ending-line-${index + 1}${index === this.endingIndex ? " ending-line-new" : ""}">${escapeHtml(line)}</p>`).join("")}</div>
    </section>`;

    if (!scheduleNext) return;
    const lineDelay = this.reducedMotion ? 80 : 420;
    const finalHold = this.reducedMotion ? 180 : 3200;
    this.endingTimer = window.setTimeout(() => {
      if (this.destroyed || this.phase !== "ending") return;
      if (this.endingIndex < finalDreamEndingLines.length - 1) {
        this.endingIndex += 1;
        this.renderEnding(true);
      } else {
        this.transitionTimer = window.setTimeout(() => this.beginTitle(), finalHold);
      }
    }, lineDelay);
  }

  private beginTitle(): void {
    if (this.destroyed) return;
    this.phase = "title";
    this.host.overlay.innerHTML = `<section class="final-dream-black final-dream-title-card" aria-label="Walk Back Home">
      <h1>W A L K&nbsp;&nbsp; B A C K&nbsp;&nbsp; H O M E</h1>
      <button class="final-dream-hit-target" type="button" data-final-dream-next aria-label="Continue to credits"></button>
    </section>`;
    this.bindAdvance();
  }

  private beginCredits(): void {
    this.phase = "credits";
    this.host.overlay.innerHTML = `<section class="final-dream-black final-dream-credits">
      <div>${finalDreamCredits.map((line) => `<p>${escapeHtml(line)}</p>`).join("")}</div>
      <button type="button" class="final-dream-return" data-final-dream-next>Return to title</button>
    </section>`;
    this.bindAdvance();
  }

  private bindAdvance(): void {
    this.host.overlay.querySelector<HTMLElement>("[data-final-dream-next]")?.addEventListener("click", () => this.advance(), { once: true });
  }

  private finish(): void {
    this.destroy();
    this.host.onComplete();
  }
}
