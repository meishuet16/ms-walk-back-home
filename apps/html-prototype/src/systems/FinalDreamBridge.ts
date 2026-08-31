import { FinalDreamPresentation } from "./FinalDreamPresentation.js";

const FINAL_DREAM_CHAPTER_ID = "final-dream-tomorrow";

type AppLike = {
  currentDoor?: { chapterId?: string } | null;
  activeDoor?: { chapterId?: string } | null;
  root: HTMLElement;
  overlay: HTMLElement;
  stage?: HTMLElement;
  scene: string;
  currentDoor?: { chapterId?: string } | null;
  returnToForest?: () => void;
  autosave?: () => void;
  showToast?: (message: string) => void;
};

type AppPrototype = {
  enterCurrentMemory?: () => Promise<void>;
};

export function installFinalDreamBridge(prototype: AppPrototype): void {
  const originalEnter = prototype.enterCurrentMemory;
  if (!originalEnter) return;

  prototype.enterCurrentMemory = async function(this: AppLike): Promise<void> {
    const door = this.currentDoor ?? this.activeDoor;
    if (door?.chapterId !== FINAL_DREAM_CHAPTER_ID) {
      return originalEnter.call(this);
    }

    this.currentDoor = door;
    this.scene = "final-dream";
    this.showToast?.("A dream returns without a date.");

    const presentation = new FinalDreamPresentation({
      root: this.root,
      overlay: this.overlay,
      stage: this.stage,
      onComplete: () => {
        this.autosave?.();
        if (this.returnToForest) this.returnToForest();
        else window.location.reload();
      }
    });
    presentation.start();
  };
}
