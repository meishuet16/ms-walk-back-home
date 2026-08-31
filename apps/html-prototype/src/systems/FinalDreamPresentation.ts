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
  private endingLineTypedCount = 0;
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
        this.renderEndingShell();
        this.typeEndingLine();
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
    this.host.overlay.querySelector<HTMLElement>(".final-dream-frame")?.classList.add("final-dream-page-enter");
    if (frame.text) this.startTyping();
    else this.showNext();
  }

  private frameMarkup(frame: FinalDreamFrame): string {
    const portrait = frame.portrait
      ? `<img class="final-dream-portrait" src="${escapeHtml(frame.portrait)}" alt="" aria-hidden="true">`
      : "";
    const speaker = frame.speaker ? `<span class="final-dream-speaker">${escapeHtml(frame.speaker)}</span>` : "";
    const dialogue = frame.text
      ? `<div class="final-dream-dialogue">${speaker}<p><span class="final-dream-type" aria-live="polite"></span><span class="final-dream-caret" aria-hidden="true"></span></p></div>`
      : "";
    return `<section class="final-dream-frame treatment-${escapeHtml(frame.treatment ?? "scene")}" data-final-dream-frame="${escapeHtml(frame.id)}">
      <div class="final-dream-image-wrap"><img class="final-dream-image" src="${escapeHtml(frame.image)}" alt=""></div>
      ${portrait}
      <div class="final-dream-wash" aria-hidden="true"></div>
      ${dialogue}
      <button class="final-dream-next-button" type="button" data-final-dream-next hidden aria-label="Next">NEXT ▸</button>
    </section>`;
  }

  private startTyping(): void {
    const target = this.host.overlay.querySelector<HTMLElement>(".final-dream-type");
    if (!target) return;
    if (this.reducedMotion) {
      target.textContent = this.currentText;
      this.typing = false;
      this.showNext();
      return;
    }
    this.typing = true;
    const step = () => {
      if (this.destroyed || !this.typing) return;
      this.currentTypedCount = Math.min(this.currentText.length, this.currentTypedCount + 1);
      target.textContent = this.currentText.slice(0, this.currentTypedCount);
      if (this.currentTypedCount >= this.currentText.length) {
        this.typing = false;
        this.host.overlay.querySelector<HTMLElement>(".final-dream-caret")?.remove();
        this.showNext();
        return;
      }
      const char = this.currentText[this.currentTypedCount - 1] ?? "";
      const delay = /[。！？!?…]/.test(char) ? 230 : /[，、；：,;:]/.test(char) ? 145 : 78;
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
    this.host.overlay.querySelector<HTMLElement>(".final-dream-caret")?.remove();
    this.showNext();
  }

  private showNext(): void {
    const button = this.host.overlay.querySelector<HTMLButtonElement>("[data-final-dream-next]");
    if (!button) return;
    button.hidden = false;
    button.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      this.advance();
    }, { once: true });
  }

  private renderEndingShell(): void {
    this.host.overlay.innerHTML = `<section class="final-dream-frame final-dream-ending" data-final-dream-frame="morning-road">
      <div class="final-dream-image-wrap"><img class="final-dream-image" src="${escapeHtml(finalDreamMorningImage)}" alt=""></div>
      <div class="final-dream-morning-haze" aria-hidden="true"></div>
      <div class="final-dream-ending-drift" aria-hidden="true"></div>
      <div class="final-dream-ending-copy" aria-live="polite"></div>
    </section>`;
  }

  private typeEndingLine(): void {
    if (this.destroyed || this.phase !== "ending") return;
    const container = this.host.overlay.querySelector<HTMLElement>(".final-dream-ending-copy");
    if (!container) return;
    const line = finalDreamEndingLines[this.endingIndex];
    if (!line) return;

    const paragraph = document.createElement("p");
    paragraph.className = `ending-line ending-line-${this.endingIndex + 1}`;
    const text = document.createElement("span");
    text.className = "ending-line-text";
    const caret = document.createElement("span");
    caret.className = "ending-line-caret";
    caret.setAttribute("aria-hidden", "true");
    paragraph.append(text, caret);
    container.append(paragraph);
    this.endingLineTypedCount = 0;

    if (this.reducedMotion) {
      text.textContent = line;
      caret.remove();
      this.scheduleNextEndingLine();
      return;
    }

    const step = () => {
      if (this.destroyed || this.phase !== "ending") return;
      this.endingLineTypedCount = Math.min(line.length, this.endingLineTypedCount + 1);
      text.textContent = line.slice(0, this.endingLineTypedCount);
      if (this.endingLineTypedCount >= line.length) {
        caret.remove();
        this.scheduleNextEndingLine();
        return;
      }
      const char = line[this.endingLineTypedCount - 1] ?? "";
      const delay = /[。！？!?…]/.test(char) ? 300 : /[，、；：,;:]/.test(char) ? 180 : 96;
      this.endingTimer = window.setTimeout(step, delay);
    };
    step();
  }

  private scheduleNextEndingLine(): void {
    const isLast = this.endingIndex >= finalDreamEndingLines.length - 1;
    if (isLast) {
      const hold = this.reducedMotion ? 250 : 4300;
      this.transitionTimer = window.setTimeout(() => this.beginTitle(), hold);
      return;
    }
    const pause = this.reducedMotion ? 80 : 720;
    this.endingTimer = window.setTimeout(() => {
      if (this.destroyed || this.phase !== "ending") return;
      this.endingIndex += 1;
      this.typeEndingLine();
    }, pause);
  }

  private beginTitle(): void {
    if (this.destroyed) return;
    this.phase = "title";
    this.host.overlay.innerHTML = `<section class="final-dream-black final-dream-title-card" aria-label="Walk Back Home">
      <div class="final-dream-title-haze" aria-hidden="true"></div>
      <h1>WALK BACK HOME</h1>
      <button class="final-dream-next-button final-dream-title-next" type="button" data-final-dream-next>CONTINUE ▸</button>
    </section>`;
    this.showNext();
  }

  private beginCredits(): void {
    this.phase = "credits";
    this.host.overlay.innerHTML = `<section class="final-dream-black final-dream-credits">
      <div>${finalDreamCredits.map((line) => `<p>${escapeHtml(line)}</p>`).join("")}</div>
      <button type="button" class="final-dream-return" data-final-dream-next>Return to forest</button>
    </section>`;
    this.showNext();
  }

  private finish(): void {
    this.destroy();
    this.host.onComplete();
  }
}
