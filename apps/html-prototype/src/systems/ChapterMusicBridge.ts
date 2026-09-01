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
type ChapterMusicApp = { currentDoor?: ChapterDoor | null; activeDoor?: ChapterDoor | null; scene?: string; audio?: ChapterAudio };
type ChapterMusicPrototype = { enterCurrentMemory?: () => Promise<void>; finishReturnToForest?: () => void };

const FINAL_DREAM_CHAPTER_ID = "final-dream-tomorrow";

export const authoredChapterMusic: Record<string, ChapterMusicConfig> = {
  "july21-why-cant-you-stay": { src: "assets/audio/利得彙再见太难Music.mp3", loop: false, continueInForestUntilEnd: true },
  "june25-so-i-came": { src: "assets/audio/梁靜茹可惜不是你伴奏.mp3", loop: false, continueInForestUntilEnd: true },
  "june24-only-came-for-you": { src: "assets/audio/郑润泽瞬伴奏Music.mp3", loop: false, continueInForestUntilEnd: true },
  "may23-i-arrived": { src: "assets/audio/小半-陳粒.mp3", loop: false, continueInForestUntilEnd: true },
  "april25-just-good-friends": { src: "assets/audio/带我走live吴青峰.mp3", loop: false, continueInForestUntilEnd: true },
  "march30-too-fated": { src: "assets/audio/胡夏 Xia Hu - Those Bygone Years 那些年-NA.mp3", loop: false, continueInForestUntilEnd: true },
  "oct29-a-little-closer": { src: "assets/audio/Dear D (亲爱的告诉你)-项睿娴.mp3", loop: false, continueInForestUntilEnd: true },
  "1122-before-sunrise": { src: "assets/audio/[lyric video] time machine - mj apanay (ft. aren park)(MP3_160K).mp3", loop: false, continueInForestUntilEnd: true },
  "april05-come-down": { src: "assets/audio/Bell 宇田  雨是甜的歌詞 眼淚苦苦的雨是甜的.mp3", loop: false, continueInForestUntilEnd: true },
  "april06-not-gone-yet": { src: "assets/audio/Bell 宇田  雨是甜的歌詞 眼淚苦苦的雨是甜的.mp3", loop: false, continueInForestUntilEnd: true }
};

function chapterMusicFor(door: ChapterDoor | null | undefined): ChapterMusicConfig | null {
  const chapterId = door?.chapterId;
  if (!chapterId || chapterId === FINAL_DREAM_CHAPTER_ID) return null;
  return chapterRegistry[chapterId]?.music ?? authoredChapterMusic[chapterId] ?? null;
}

export function installChapterMusicBridge(prototype: ChapterMusicPrototype): void {
  const originalEnter = prototype.enterCurrentMemory;
  const originalReturn = prototype.finishReturnToForest;
  if (!originalEnter || !originalReturn) return;

  let activeChapterMusic: ChapterMusicConfig | null = null;
  let carryUnsubscribe: (() => void) | null = null;

  prototype.enterCurrentMemory = async function(this: ChapterMusicApp): Promise<void> {
    const music = chapterMusicFor(this.currentDoor ?? this.activeDoor);
    await originalEnter.call(this);
    activeChapterMusic = music;
    if (!music || !this.audio) return;
    carryUnsubscribe?.();
    carryUnsubscribe = null;
    this.audio.setTrack(music.src, false);
    this.audio.setLoop(music.loop ?? false);
    void this.audio.ensurePlaying();
  };

  prototype.finishReturnToForest = function(this: ChapterMusicApp): void {
    const music = activeChapterMusic ?? chapterMusicFor(this.currentDoor ?? this.activeDoor);
    const audio = this.audio;
    const shouldCarry = Boolean(music?.continueInForestUntilEnd && audio?.isCurrentTrack(music.src));
    activeChapterMusic = null;

    if (!shouldCarry || !music || !audio) {
      originalReturn.call(this);
      return;
    }

    // Match the proven Final Dream return strategy: while the existing Forest
    // lifecycle runs, suppress only attempts to replace the chapter track with
    // Forest audio. Restore AudioManager methods immediately afterwards.
    const originalSetScene = audio.setScene.bind(audio);
    const originalSetTrack = audio.setTrack.bind(audio);
    audio.setScene = (scene) => { if (scene !== "forest") originalSetScene(scene); };
    audio.setTrack = (src, autoPlay) => {
      if (audio.isCurrentTrack(music.src) && !audio.isCurrentTrack(src)) return false;
      return originalSetTrack(src, autoPlay);
    };
    try {
      originalReturn.call(this);
    } finally {
      audio.setScene = originalSetScene;
      audio.setTrack = originalSetTrack;
    }

    audio.setLoop(false);
    carryUnsubscribe?.();
    let unsubscribe: () => void = () => {};
    unsubscribe = audio.onEnded(() => {
      unsubscribe();
      carryUnsubscribe = null;
      if (this.scene !== "forest" || !audio.isCurrentTrack(music.src)) return;
      originalSetScene("forest");
      audio.setLoop(true);
      void audio.ensurePlaying();
    });
    carryUnsubscribe = unsubscribe;
  };
}
