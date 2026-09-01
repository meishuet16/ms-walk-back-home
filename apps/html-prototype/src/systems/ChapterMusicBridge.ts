import { chapterRegistry } from "./ChapterRegistry.js";
import type { ChapterMusicConfig } from "../types.js";

type ChapterDoor = { chapterId?: string };

type ChapterAudio = {
  setTrack: (src: string, autoPlay?: boolean) => boolean;
  isCurrentTrack: (src: string) => boolean;
  setLoop: (loop: boolean) => void;
  setScene: (scene: "forest" | "bakery") => void;
  ensurePlaying: () => Promise<void>;
  onEnded: (callback: () => void) => () => void;
};

type ChapterMusicApp = {
  currentDoor?: ChapterDoor | null;
  activeDoor?: ChapterDoor | null;
  scene?: string;
  audio?: ChapterAudio;
};

type ChapterMusicPrototype = {
  enterCurrentMemory?: () => Promise<void>;
  finishReturnToForest?: () => void;
};

const FINAL_DREAM_CHAPTER_ID = "final-dream-tomorrow";

function chapterMusicFor(door: ChapterDoor | null | undefined): ChapterMusicConfig | null {
  const chapterId = door?.chapterId;
  if (!chapterId || chapterId === FINAL_DREAM_CHAPTER_ID) return null;
  return chapterRegistry[chapterId]?.music ?? null;
}

/**
 * Adds optional music to authored chapters without changing their scene/cutscene code.
 * Final Dream deliberately remains on its dedicated audio lifecycle.
 */
export function installChapterMusicBridge(prototype: ChapterMusicPrototype): void {
  const originalEnter = prototype.enterCurrentMemory;
  const originalReturn = prototype.finishReturnToForest;
  if (!originalEnter || !originalReturn) return;

  prototype.enterCurrentMemory = async function(this: ChapterMusicApp): Promise<void> {
    const door = this.currentDoor ?? this.activeDoor;
    const music = chapterMusicFor(door);
    await originalEnter.call(this);
    if (!music || !this.audio) return;

    this.audio.setTrack(music.src, false);
    this.audio.setLoop(music.loop ?? false);
    void this.audio.ensurePlaying();
  };

  prototype.finishReturnToForest = function(this: ChapterMusicApp): void {
    const door = this.currentDoor ?? this.activeDoor;
    const music = chapterMusicFor(door);
    const audio = this.audio;
    const shouldCarry = Boolean(
      music?.continueInForestUntilEnd &&
      audio?.isCurrentTrack(music.src)
    );

    if (!shouldCarry || !music || !audio) {
      originalReturn.call(this);
      return;
    }

    // The normal forest-return lifecycle calls setScene("forest"). Suppress only that
    // one audio switch so all existing scene/UI/player/autosave cleanup still runs.
    const originalSetScene = audio.setScene.bind(audio);
    audio.setScene = (scene) => {
      if (scene !== "forest") originalSetScene(scene);
    };
    try {
      originalReturn.call(this);
    } finally {
      audio.setScene = originalSetScene;
    }

    audio.setLoop(false);
    let unsubscribe = () => undefined;
    unsubscribe = audio.onEnded(() => {
      unsubscribe();
      // Do not steal playback if the player entered another memory or changed music
      // before this chapter theme naturally ended.
      if (this.scene !== "forest" || !audio.isCurrentTrack(music.src)) return;
      originalSetScene("forest");
      audio.setLoop(true);
      void audio.ensurePlaying();
    });
  };
}
