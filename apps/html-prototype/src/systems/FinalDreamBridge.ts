import { finalDreamMusic } from "../fixtures/finalDreamChapter.js";
import { FinalDreamPresentation } from "./FinalDreamPresentation.js";

type FinalDreamAudio = {
  setTrack?: (src: string, autoPlay?: boolean) => boolean;
  isCurrentTrack?: (src: string) => boolean;
  setLoop?: (loop: boolean) => void;
  ensurePlaying?: () => Promise<void>;
  stop?: () => void;
  setScene?: (scene: "forest" | "bakery") => void;
  onEnded?: (callback: () => void) => () => void;
};

const FINAL_DREAM_CHAPTER_ID = "final-dream-tomorrow";

type FinalDreamDoor = { chapterId?: string; id?: string };

type AppLike = {
  currentDoor?: FinalDreamDoor | null;
  activeDoor?: FinalDreamDoor | null;
  scene?: string;
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

function finishFinalDreamIntoForest(app: AppLike): void {
  const audio = app.audio;
  const finishReturnToForest = app.finishReturnToForest;
  if (!audio || !finishReturnToForest || !audio.setScene) {
    audio?.stop?.();
    audio?.setScene?.("forest");
    audio?.setLoop?.(true);
    void audio?.ensurePlaying?.();
    app.autosave?.();
    return;
  }

  const isDreamTrack = audio.isCurrentTrack?.(finalDreamMusic) ?? false;
  if (!isDreamTrack) {
    finishReturnToForest.call(app);
    return;
  }

  // Preserve the established forest-return lifecycle, suppressing only its immediate
  // Forest BGM swap so the Final Dream song can finish naturally after the visuals return.
  const originalSetScene = audio.setScene.bind(audio);
  audio.setScene = (scene) => {
    if (scene !== "forest") originalSetScene(scene);
  };
  try {
    finishReturnToForest.call(app);
  } finally {
    audio.setScene = originalSetScene;
  }

  audio.setLoop?.(false);
  let unsubscribe: () => void = () => {};
  unsubscribe = audio.onEnded?.(() => {
    unsubscribe();
    // A later scene or music choice owns playback if anything changed before the song ended.
    if (app.scene !== "forest" || !(audio.isCurrentTrack?.(finalDreamMusic) ?? false)) return;
    originalSetScene("forest");
    audio.setLoop?.(true);
    void audio.ensurePlaying?.();
  }) ?? (() => {});
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

        finishFinalDreamIntoForest(this);
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
