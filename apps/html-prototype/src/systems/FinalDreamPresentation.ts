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
  private lastSurfaceAdvanceAt = 0;
  private readonly reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
  private readonly keydown = (event: KeyboardEvent) => {
    if (event.key !== "Enter" && event.key !== " " && event.key !== "ArrowRight") return;
    if (this.destroyed || this.phase === "ending" || this.phase === "credits") return;
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    this.tryAdvance();
  };
  private readonly pointerUp = (event: PointerEvent) => {
    if (!event.isPrimary) return;
    this.handleCapturedSurfaceAdvance(event.target, event);
  };
  private readonly touchEnd = (event: TouchEvent) => {
    this.handleCapturedSurfaceAdvance(event.target, event);
  };
  private readonly click = (event: MouseEvent) => {
    this.handleCapturedSurfaceAdvance(event.target, event);
  };

  constructor(private readonly host: FinalDreamHost) {}

  start(): void {
    this.destroyed = false;
    this.host.root.classList.add("final-dream-active");
    this.host.overlay.classList.add("final-dream-overlay");
    document.addEventListener("keydown", this.keydown, true);
    // Capture at document level so mobile taps still reach the presentation even if
    // the stage, browser touch plumbing, or another app listener owns the target.
    document.addEventListener("pointerup", this.pointerUp, { capture: true, passive: false });
    document.addEventListener("touchend", this.touchEnd, { capture: true, passive: false });
    document.addEventListener("click", this.click, true);
    this.renderDream();
  }

  advance(): void {
    if (this.destroyed) return;
    if (this.phase === "dream") {
      if (this.typing) return;
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
    if (this.phase === "ending" || this.phase === "credits") return;
    if (this.phase === "title") this.beginCredits();
  }

  destroy(): void {
    if (this.destroyed) return;
    this.destroyed = true;
    window.clearTimeout(this.transitionTimer);
    window.clearTimeout(this.endingTimer);
    window.clearTimeout(this.typeTimer);
    document.removeEventListener("keydown", this.keydown, true);
    document.removeEventListener("pointerup", this.pointerUp, true);
    document.removeEventListener("touchend", this.touchEnd, true);
    document.removeEventListener("click", this.click, true);
    this.host.root.classList.remove("final-dream-active");
    this.host.overlay.classList.remove("final-dream-overlay");
    this.host.overlay.innerHTML = "";
  }

  private tryAdvance(): void {
    if (this.destroyed || this.phase === "ending" || this.phase === "credits") return;
    if (this.phase === "dream" && this.typing) return;
    this.advance();
  }

  private handleCapturedSurfaceAdvance(target: EventTarget | null, event: Event): void {
    const element = target instanceof Element ? target : null;
    if (element?.closest("[data-final-dream-return]")) return;
    if (this.destroyed || this.phase === "ending" || this.phase === "credits") return;
    if (this.phase === "dream" && this.typing) return;

    const now = Date.now();
    // A physical mobile tap can emit pointerup, touchend and click. Treat the
    // whole burst as one VN advance while still allowing a later deliberate tap.
    if (now - this.lastSurfaceAdvanceAt < 450) return;
    this.lastSurfaceAdvanceAt = now;

    if (event.cancelable) event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    this.advance();
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
    </section>`;
  }

  private startTyping(): void {
    const target = this.host.overlay.querySelector<HTMLElement>(".final-dream-type");
    if (!target) return;
    if (this.reducedMotion) {
      target.textContent = this.currentText;
      this.typing = false;
      this.host.overlay.querySelector<HTMLElement>(".final-dream-caret")?.remove();
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
        return;
      }
      const char = this.currentText[this.currentTypedCount - 1] ?? "";
      const delay = /[。！？!?…]/.test(char) ? 260 : /[，、；：,;:]/.test(char) ? 165 : 92;
      this.typeTimer = window.setTimeout(step, delay);
    };
    step();
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
      const delay = /[。！？!?…]/.test(char) ? 330 : /[，、；：,;:]/.test(char) ? 205 : 112;
      this.endingTimer = window.setTimeout(step, delay);
    };
    step();
  }

  private scheduleNextEndingLine(): void {
    const isLast = this.endingIndex >= finalDreamEndingLines.length - 1;
    if (isLast) {
      const hold = this.reducedMotion ? 250 : 5200;
      this.transitionTimer = window.setTimeout(() => this.beginTitle(), hold);
      return;
    }
    const pause = this.reducedMotion ? 80 : 960;
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
    </section>`;
  }

  private beginCredits(): void {
    if (this.destroyed) return;
    this.phase = "credits";
    this.host.overlay.innerHTML = `<section class="final-dream-black final-dream-credits">
      <div>${finalDreamCredits.map((line) => `<p>${escapeHtml(line)}</p>`).join("")}</div>
      <button type="button" class="final-dream-return" data-final-dream-return>Return to forest</button>
    </section>`;
    const returnButton = this.host.overlay.querySelector<HTMLButtonElement>("[data-final-dream-return]");
    returnButton?.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      this.finish();
    }, { once: true });
    returnButton?.addEventListener("keydown", (event) => {
      if (event.key !== "Enter" && event.key !== " ") return;
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      this.finish();
    });
  }

  private finish(): void {
    this.destroy();
    this.host.onComplete();
  }
}
