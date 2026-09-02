import { finalDreamEpiloguePages } from "../fixtures/finalDreamEpilogue.js";
import { FinalDreamPresentation } from "./FinalDreamPresentation.js";

type EpiloguePresentation = {
  destroyed: boolean;
  phase: string;
  epilogueIndex: number;
  epilogueTyping: boolean;
  epilogueTypedCount: number;
  currentText: string;
  typeTimer: number;
  autoAdvanceTimer: number;
  reducedMotion: boolean;
  host: { overlay: HTMLElement };
  typeEpiloguePage: () => void;
  beginTitle: () => void;
  advance: () => void;
};

type EpiloguePrototype = {
  renderEpiloguePage?: (this: EpiloguePresentation) => void;
  scheduleEpilogueAdvance?: (this: EpiloguePresentation) => void;
};

let installed = false;

export function installFinalDreamEpiloguePolishBridge(): void {
  if (installed) return;
  installed = true;

  const proto = FinalDreamPresentation.prototype as unknown as EpiloguePrototype;

  proto.renderEpiloguePage = function(this: EpiloguePresentation): void {
    if (this.destroyed || this.phase !== "epilogue") return;
    window.clearTimeout(this.typeTimer);
    window.clearTimeout(this.autoAdvanceTimer);
    this.epilogueTyping = false;
    this.epilogueTypedCount = 0;

    const page = finalDreamEpiloguePages[this.epilogueIndex];
    if (!page) {
      this.beginTitle();
      return;
    }
    this.currentText = page.join("\n");

    let shell = this.host.overlay.querySelector<HTMLElement>(".final-dream-epilogue");
    if (!shell) {
      this.host.overlay.innerHTML = `<section class="final-dream-black final-dream-epilogue" data-final-dream-epilogue="1">
        <div class="final-dream-epilogue-grain" aria-hidden="true"></div>
        <div class="final-dream-epilogue-copy" aria-live="polite"><span class="final-dream-epilogue-type"></span><span class="final-dream-epilogue-caret" aria-hidden="true"></span></div>
        <div class="final-dream-epilogue-progress" aria-hidden="true"></div>
      </section>`;
      shell = this.host.overlay.querySelector<HTMLElement>(".final-dream-epilogue");
    }
    if (!shell) return;

    shell.dataset.finalDreamEpilogue = String(this.epilogueIndex + 1);
    shell.classList.remove("is-ready");
    const copy = shell.querySelector<HTMLElement>(".final-dream-epilogue-copy");
    const progress = shell.querySelector<HTMLElement>(".final-dream-epilogue-progress");
    if (copy) {
      copy.scrollTop = 0;
      copy.innerHTML = `<span class="final-dream-epilogue-type"></span><span class="final-dream-epilogue-caret" aria-hidden="true"></span>`;
    }
    if (progress) progress.textContent = `${this.epilogueIndex + 1} / ${finalDreamEpiloguePages.length}`;

    this.typeEpiloguePage();
  };

  proto.scheduleEpilogueAdvance = function(this: EpiloguePresentation): void {
    window.clearTimeout(this.autoAdvanceTimer);
    const isLast = this.epilogueIndex >= finalDreamEpiloguePages.length - 1;
    this.autoAdvanceTimer = window.setTimeout(() => {
      if (this.destroyed || this.phase !== "epilogue" || this.epilogueTyping) return;
      this.advance();
    }, this.reducedMotion ? 1200 : isLast ? 7600 : 6200);
  };
}
