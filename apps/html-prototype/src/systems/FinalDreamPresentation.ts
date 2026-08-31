import { finalDreamCredits, finalDreamEndingLines, finalDreamFrames, finalDreamMusic, type FinalDreamFrame } from "../fixtures/finalDreamChapter.js";

type FinalDreamHost = {
  root: HTMLElement;
  overlay: HTMLElement;
  stage?: HTMLElement;
  onComplete: () => void;
};

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" }[char]!));
}

function paragraphs(text: string): string {
  return text.split("\n").map((line) => `<span>${escapeHtml(line)}</span>`).join("");
}

export class FinalDreamPresentation {
  private index = 0;
  private phase: "dream" | "ending" | "title" | "credits" = "dream";
  private endingIndex = 0;
  private audio: HTMLAudioElement | null = null;
  private destroyed = false;
  private transitionTimer = 0;
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
    this.startMusic();
    this.renderDream();
  }

  advance(): void {
    if (this.destroyed) return;
    if (this.phase === "dream") {
      if (this.index < finalDreamFrames.length - 1) {
        this.index += 1;
        this.renderDream();
      } else {
        this.phase = "ending";
        this.endingIndex = 0;
        this.renderEnding();
      }
      return;
    }
    if (this.phase === "ending") {
      if (this.endingIndex < finalDreamEndingLines.length - 1) {
        this.endingIndex += 1;
        this.renderEnding();
      } else this.beginTitle();
      return;
    }
    if (this.phase === "title") return this.beginCredits();
    this.finish();
  }

  destroy(): void {
    if (this.destroyed) return;
    this.destroyed = true;
    window.clearTimeout(this.transitionTimer);
    document.removeEventListener("keydown", this.keydown);
    this.audio?.pause();
    this.audio = null;
    this.host.root.classList.remove("final-dream-active");
    this.host.overlay.classList.remove("final-dream-overlay");
    this.host.overlay.innerHTML = "";
  }

  private startMusic(): void {
    const audio = new Audio(finalDreamMusic);
    audio.loop = false;
    audio.volume = 0.34;
    audio.preload = "auto";
    this.audio = audio;
    void audio.play().catch(() => {
      const resume = () => {
        void audio.play().catch(() => undefined);
        this.host.overlay.removeEventListener("pointerdown", resume);
      };
      this.host.overlay.addEventListener("pointerdown", resume, { once: true });
    });
  }

  private renderDream(): void {
    const frame = finalDreamFrames[this.index];
    if (!frame) return;
    this.host.overlay.innerHTML = this.frameMarkup(frame);
    this.bindAdvance();
  }

  private frameMarkup(frame: FinalDreamFrame): string {
    const portrait = frame.portrait
      ? `<img class="final-dream-portrait" src="${escapeHtml(frame.portrait)}" alt="" aria-hidden="true">`
      : "";
    const speaker = frame.speaker ? `<span class="final-dream-speaker">${escapeHtml(frame.speaker)}</span>` : "";
    const dialogue = frame.text
      ? `<div class="final-dream-dialogue">${speaker}<p>${paragraphs(frame.text)}</p><span class="final-dream-next-mark" aria-hidden="true">›</span></div>`
      : "";
    return `<section class="final-dream-frame treatment-${escapeHtml(frame.treatment ?? "scene")}" data-final-dream-frame="${escapeHtml(frame.id)}">
      <div class="final-dream-image-wrap"><img class="final-dream-image" src="${escapeHtml(frame.image)}" alt=""></div>
      ${portrait}
      <div class="final-dream-wash" aria-hidden="true"></div>
      ${dialogue}
      <button class="final-dream-hit-target" type="button" data-final-dream-next aria-label="Continue the dream"></button>
    </section>`;
  }

  private renderEnding(): void {
    this.fadeMusic();
    const visible = finalDreamEndingLines.slice(0, this.endingIndex + 1);
    this.host.overlay.innerHTML = `<section class="final-dream-frame final-dream-ending" data-final-dream-frame="morning-road">
      <div class="final-dream-image-wrap"><img class="final-dream-image" src="assets/final-dream/fd-11-morning-empty-road.webp" alt=""></div>
      <div class="final-dream-morning-haze" aria-hidden="true"></div>
      <div class="final-dream-ending-copy" aria-live="polite">${visible.map((line, index) => `<p class="ending-line ending-line-${index + 1}">${escapeHtml(line)}</p>`).join("")}</div>
      <button class="final-dream-hit-target" type="button" data-final-dream-next aria-label="Continue"></button>
    </section>`;
    this.bindAdvance();
  }

  private beginTitle(): void {
    this.phase = "title";
    this.audio?.pause();
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
      <button type="button" class="final-dream-return" data-final-dream-next>Return to the forest</button>
    </section>`;
    this.bindAdvance();
  }

  private bindAdvance(): void {
    this.host.overlay.querySelector<HTMLElement>("[data-final-dream-next]")?.addEventListener("click", () => this.advance(), { once: true });
  }

  private fadeMusic(): void {
    const audio = this.audio;
    if (!audio || audio.paused) return;
    const start = audio.volume;
    const started = performance.now();
    const duration = 4800;
    const step = (now: number) => {
      if (this.destroyed || !this.audio) return;
      const progress = Math.min(1, (now - started) / duration);
      audio.volume = Math.max(0, start * (1 - progress));
      if (progress < 1) requestAnimationFrame(step);
      else audio.pause();
    };
    requestAnimationFrame(step);
  }

  private finish(): void {
    this.destroy();
    this.host.onComplete();
  }
}
