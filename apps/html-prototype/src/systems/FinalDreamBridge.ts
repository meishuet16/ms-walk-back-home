import { finalDreamMusic } from "../fixtures/finalDreamChapter.js";
import { FinalDreamPresentation } from "./FinalDreamPresentation.js";

type FinalDreamAudio = {
  setTrack?: (src: string, autoPlay?: boolean) => boolean;
  setLoop?: (loop: boolean) => void;
  ensurePlaying?: () => Promise<void>;
  stop?: () => void;
  setScene?: (scene: "forest" | "bakery") => void;
};

const FINAL_DREAM_CHAPTER_ID = "final-dream-tomorrow";

type AppLike = {
  currentDoor?: { chapterId?: string; id?: string } | null;
  activeDoor?: { chapterId?: string; id?: string } | null;
  root: HTMLElement;
  overlay: HTMLElement;
  stage?: HTMLElement;
  audio?: FinalDreamAudio;
  autosave?: () => void;
};

type AppPrototype = {
  enterCurrentMemory?: () => Promise<void>;
};

let activePresentation: FinalDreamPresentation | null = null;

function isFinalDreamDoor(door: { chapterId?: string } | null | undefined): boolean {
  return door?.chapterId === FINAL_DREAM_CHAPTER_ID;
}

export function installFinalDreamBridge(prototype: AppPrototype): void {
  const originalEnter = prototype.enterCurrentMemory;
  if (!originalEnter) return;

  prototype.enterCurrentMemory = async function(this: AppLike): Promise<void> {
    const door = this.currentDoor ?? this.activeDoor;
    if (!isFinalDreamDoor(door)) return originalEnter.call(this);
    if (activePresentation) return;

    this.currentDoor = door;
    this.overlay.innerHTML = "";
    this.overlay.classList.remove("dialogue-open", "lightweight-presentation");

    this.audio?.stop?.();
    this.audio?.setTrack?.(finalDreamMusic, false);
    this.audio?.setLoop?.(false);
    void this.audio?.ensurePlaying?.();

    const presentation = new FinalDreamPresentation({
      root: this.root,
      overlay: this.overlay,
      stage: this.stage,
      onComplete: () => {
        activePresentation = null;
        try {
          localStorage.setItem("walk.final-dream.seen", "1");
        } catch {
          // localStorage can be unavailable in privacy modes; replay still works.
        }
        this.audio?.stop?.();
        this.audio?.setScene?.("forest");
        this.audio?.setLoop?.(true);
        void this.audio?.ensurePlaying?.();
        this.autosave?.();
      }
    });
    activePresentation = presentation;
    presentation.start();
  };
}
