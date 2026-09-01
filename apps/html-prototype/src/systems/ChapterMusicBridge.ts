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

// Authored soundtrack catalogue. Keeping these assignments here lets older chapter
// fixtures remain untouched while still using the same generic chapter-music lifecycle.
// Every assigned song is one-shot and may finish naturally after returning to Forest.
export const authoredChapterMusic: Record<string, ChapterMusicConfig> = {
  "july21-why-cant-you-stay": { src: "assets/audio/再见太难-黄龄.mp3", loop: false, continueInForestUntilEnd: true },
  "june25-so-i-came": { src: "assets/audio/可惜不是你-梁静茹.mp3", loop: false, continueInForestUntilEnd: true },
  "june24-only-came-for-you": { src: "assets/audio/瞬-郑润泽.mp3", loop: false, continueInForestUntilEnd: true },
  "may23-i-arrived": { src: "assets/audio/带我走-杨丞琳.mp3", loop: false, continueInForestUntilEnd: true },
  "april25-just-good-friends": { src: "assets/audio/我好想你-苏打绿.mp3", loop: false, continueInForestUntilEnd: true },
  "march30-too-fated": { src: "assets/audio/那些年-胡夏.mp3", loop: false, continueInForestUntilEnd: true },
  "oct29-a-little-closer": { src: "assets/audio/Dear D (亲爱的告诉你)-项睿娴.mp3", loop: false, continueInForestUntilEnd: true },
  "1122-before-sunrise": { src: "assets/audio/Time Machine- mj apanay.mp3", loop: false, continueInForestUntilEnd: true },
  "april05-come-down": { src: "assets/audio/雨是甜的-尤长靖.mp3", loop: false, continueInForestUntilEnd: true },
  "april06-not-gone-yet": { src: "assets/audio/雨是甜的-尤长靖.mp3", loop: false, continueInForestUntilEnd: true }
};

function chapterMusicFor(door: ChapterDoor | null | undefined): ChapterMusicConfig | null {
  const chapterId = door?.chapterId;
  if (!chapterId || chapterId === FINAL_DREAM_CHAPTER_ID) return null;
  return chapterRegistry[chapterId]?.music ?? authoredChapterMusic[chapterId] ?? null;
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
    let unsubscribe: () => void = () => {};
    unsubscribe = audio.onEnded(() => {
      unsubscribe();
      if (this.scene !== "forest" || !audio.isCurrentTrack(music.src)) return;
      originalSetScene("forest");
      audio.setLoop(true);
      void audio.ensurePlaying();
    });
  };
}
