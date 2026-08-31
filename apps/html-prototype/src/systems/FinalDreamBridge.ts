import { finalDreamMusic } from "../fixtures/finalDreamChapter.js";
import { FinalDreamPresentation } from "./FinalDreamPresentation.js";

type FinalDreamAudio = {
  setTrack?: (src: string, autoPlay?: boolean) => boolean;
  setLoop?: (loop: boolean) => void;
  ensurePlaying?: () => Promise<void>;
  stop?: () => void;
};

const FINAL_DREAM_CHAPTER_ID = "final-dream-tomorrow";

type AppLike = {
  currentDoor?: { chapterId?: string } | null;
  activeDoor?: { chapterId?: string } | null;
  root: HTMLElement;
  overlay: HTMLElement;
  stage?: HTMLElement;
  audio?: FinalDreamAudio;
  showHome?: () => void;
  autosave?: () => void;
};

type AppPrototype = { enterCurrentMemory?: () => Promise<void> };

export function installFinalDreamBridge(prototype: AppPrototype): void {
  const originalEnter = prototype.enterCurrentMemory;
  if (!originalEnter) return;

  prototype.enterCurrentMemory = async function(this: AppLike): Promise<void> {
    const door = this.currentDoor ?? this.activeDoor;
    if (door?.chapterId !== FINAL_DREAM_CHAPTER_ID) return originalEnter.call(this);

    this.currentDoor = door;
    this.audio?.setTrack?.(finalDreamMusic, true);
    this.audio?.setLoop?.(false);
    void this.audio?.ensurePlaying?.();

    const presentation = new FinalDreamPresentation({
      root: this.root,
      overlay: this.overlay,
      stage: this.stage,
      onComplete: () => {
        try {
          localStorage.setItem("walk.final-dream.seen", "1");
        } catch {
          // localStorage can be unavailable in privacy modes; replay still works.
        }
        this.audio?.stop?.();
        this.autosave?.();
        if (this.showHome) this.showHome();
        else window.location.reload();
      }
    });
    presentation.start();
  };
}
