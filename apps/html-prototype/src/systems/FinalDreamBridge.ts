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

type FinalDreamDoor = { chapterId?: string; id?: string };

type AppLike = {
  currentDoor?: FinalDreamDoor | null;
  activeDoor?: FinalDreamDoor | null;
  root: HTMLElement;
  overlay: HTMLElement;
  stage?: HTMLElement;
  audio?: FinalDreamAudio;
  autosave?: () => void;
  enterCurrentMemory?: () => Promise<void>;
  finishReturnToForest?: () => void;
};

type AppPrototype = {
  enterCurrentMemory?: () => Promise<void>;
  previewDoor?: (door: FinalDreamDoor) => void;
};

let activePresentation: FinalDreamPresentation | null = null;

function isFinalDreamDoor(door: { chapterId?: string } | null | undefined): boolean {
  return door?.chapterId === FINAL_DREAM_CHAPTER_ID;
}

export function installFinalDreamBridge(prototype: AppPrototype): void {
  const originalEnter = prototype.enterCurrentMemory;
  const originalPreviewDoor = prototype.previewDoor;
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

        // Reuse the app's established forest-return lifecycle instead of maintaining
        // a second partial reset here. This restores scene/UI/player/audio/autosave
        // exactly the same way as the existing Return to Forest actions.
        if (this.finishReturnToForest) {
          this.finishReturnToForest();
          return;
        }

        // Defensive fallback for an unexpected host that does not expose the app
        // lifecycle method. The normal WalkBackHomeApp path always uses the branch above.
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

  // Final Dream is a presentation-only chapter. Intercept only its generic forest
  // preview so Tomorrow enters directly; every other chapter keeps the native
  // preview + interaction path untouched.
  if (originalPreviewDoor) {
    prototype.previewDoor = function(this: AppLike, door: FinalDreamDoor): void {
      if (!isFinalDreamDoor(door)) {
        originalPreviewDoor.call(this, door);
        return;
      }
      this.currentDoor = door;
      void this.enterCurrentMemory?.();
    };
  }
}
