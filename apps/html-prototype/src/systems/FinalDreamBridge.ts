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
export const finalDreamMusic = "assets/audio/張韶涵有形的翅膀伴奏Ringtone.mp3";

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

  // Final Dream owns the audio until its song ends. Returning the visuals to
  // Forest must not let Forest or Records swap in another track mid-ending.
  const originalSetScene = audio.setScene.bind(audio);
  const originalSetTrack = audio.setTrack?.bind(audio);
  audio.setScene = (scene) => {
    if (scene !== "forest") originalSetScene(scene);
  };
  if (originalSetTrack) {
    audio.setTrack = (src, autoPlay) => {
      if ((audio.isCurrentTrack?.(finalDreamMusic) ?? false) && !(audio.isCurrentTrack?.(src) ?? false)) return false;
      return originalSetTrack(src, autoPlay);
    };
  }
  try {
    finishReturnToForest.call(app);
  } finally {
    audio.setScene = originalSetScene;
    if (originalSetTrack) audio.setTrack = originalSetTrack;
  }

  audio.setLoop?.(false);
  let unsubscribe: () => void = () => {};
  unsubscribe = audio.onEnded?.(() => {
    unsubscribe();
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
