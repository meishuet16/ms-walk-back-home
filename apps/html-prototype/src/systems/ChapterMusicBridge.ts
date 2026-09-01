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
  getCurrentTime?: () => number;
  seek?: (seconds: number) => void;
};
type ChapterMusicApp = { currentDoor?: ChapterDoor | null; activeDoor?: ChapterDoor | null; scene?: string; audio?: ChapterAudio };
type ChapterMusicPrototype = { enterCurrentMemory?: () => Promise<void>; finishReturnToForest?: () => void; applyAudioForCurrentScene?: () => void };

const FINAL_DREAM_CHAPTER_ID = "final-dream-tomorrow";

export const authoredChapterMusic: Record<string, ChapterMusicConfig> = {
  "july21-why-cant-you-stay": { src: "assets/audio/利得彙再见太难Music.mp3", loop: true, continueInForestUntilEnd: true },
  "june25-so-i-came": { src: "assets/audio/梁靜茹可惜不是你伴奏.mp3", loop: true, continueInForestUntilEnd: true },
  "june24-only-came-for-you": { src: "assets/audio/郑润泽瞬伴奏Music.mp3", loop: true, continueInForestUntilEnd: true },
  "may23-i-arrived": { src: "assets/audio/小半-陳粒.mp3", loop: true, continueInForestUntilEnd: true },
  "april25-just-good-friends": { src: "assets/audio/带我走live吴青峰.mp3", loop: true, continueInForestUntilEnd: true },
  "march30-too-fated": { src: "assets/audio/胡夏 Xia Hu - Those Bygone Years 那些年-NA.mp3", loop: true, continueInForestUntilEnd: true },
  "oct29-a-little-closer": { src: "assets/audio/Dear D (亲爱的告诉你)-项睿娴.mp3", loop: true, continueInForestUntilEnd: true },
  "1122-before-sunrise": { src: "assets/audio/[lyric video] time machine - mj apanay (ft. aren park)(MP3_160K).mp3", loop: true, continueInForestUntilEnd: true },
  "april05-come-down": { src: "assets/audio/Bell 宇田  雨是甜的歌詞 眼淚苦苦的雨是甜的.mp3", loop: true, continueInForestUntilEnd: true },
  "april06-not-gone-yet": { src: "assets/audio/Bell 宇田  雨是甜的歌詞 眼淚苦苦的雨是甜的.mp3", loop: true, continueInForestUntilEnd: true }
};

function chapterMusicFor(door: ChapterDoor | null | undefined): ChapterMusicConfig | null {
  const chapterId = door?.chapterId;
  if (!chapterId || chapterId === FINAL_DREAM_CHAPTER_ID) return null;
  return chapterRegistry[chapterId]?.music ?? authoredChapterMusic[chapterId] ?? null;
}

export function installChapterMusicBridge(prototype: ChapterMusicPrototype): void {
  const originalEnter = prototype.enterCurrentMemory;
  const originalReturn = prototype.finishReturnToForest;
  const originalApplyAudio = prototype.applyAudioForCurrentScene;
  if (!originalEnter || !originalReturn) return;

  let activeChapterMusic: ChapterMusicConfig | null = null;
  let carryUnsubscribe: (() => void) | null = null;
  let carryingIntoForest = false;

  const stopCarry = (): void => {
    carryUnsubscribe?.();
    carryUnsubscribe = null;
    carryingIntoForest = false;
  };

  const beginForestCarry = (app: ChapterMusicApp, music: ChapterMusicConfig): void => {
    const audio = app.audio;
    if (!audio || carryingIntoForest || !audio.isCurrentTrack(music.src)) return;
    carryingIntoForest = true;
    // Chapter owns a looping track while the player is inside the memory.
    // The moment Forest is entered, stop looping but let the current pass finish.
    audio.setLoop(false);
    carryUnsubscribe?.();
    let unsubscribe: () => void = () => {};
    unsubscribe = audio.onEnded(() => {
      unsubscribe();
      carryUnsubscribe = null;
      carryingIntoForest = false;
      activeChapterMusic = null;
      if (app.scene !== "forest" || !audio.isCurrentTrack(music.src)) return;
      audio.setScene("forest");
      audio.setLoop(true);
      void audio.ensurePlaying();
    });
    carryUnsubscribe = unsubscribe;
  };

  prototype.enterCurrentMemory = async function(this: ChapterMusicApp): Promise<void> {
    const music = chapterMusicFor(this.currentDoor ?? this.activeDoor);
    stopCarry();
    await originalEnter.call(this);
    activeChapterMusic = music;
    if (!music || !this.audio) return;
    this.audio.setTrack(music.src, false);
    // Unified chapter contract: every authored Chapter BGM loops for as long as
    // the player remains inside the chapter, regardless of per-track metadata.
    this.audio.setLoop(true);
    void this.audio.ensurePlaying();
  };

  // Forest audio can be restored by more than one authored-chapter exit path.
  // Guard the shared restoration point so a carrying chapter owns the one audio
  // element until its current pass naturally ends.
  if (originalApplyAudio) prototype.applyAudioForCurrentScene = function(this: ChapterMusicApp): void {
    const music = activeChapterMusic;
    if (this.scene === "forest" && music?.continueInForestUntilEnd && this.audio?.isCurrentTrack(music.src)) {
      beginForestCarry(this, music);
      return;
    }
    originalApplyAudio.call(this);
  };

  prototype.finishReturnToForest = function(this: ChapterMusicApp): void {
    const music = activeChapterMusic ?? chapterMusicFor(this.currentDoor ?? this.activeDoor);
    const audio = this.audio;
    const shouldCarry = Boolean(music?.continueInForestUntilEnd && audio?.isCurrentTrack(music.src));

    if (!shouldCarry || !music || !audio) {
      activeChapterMusic = null;
      stopCarry();
      originalReturn.call(this);
      return;
    }

    activeChapterMusic = music;
    const chapterPosition = Math.max(0, audio.getCurrentTime?.() ?? 0);
    // Exit is the exact boundary where chapter single-repeat ends. From here on,
    // the currently playing pass may finish once in Forest, but cannot restart.
    audio.setLoop(false);
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

    // Postcondition: returning to Forest must not replace a chapter track that
    // opted into carry. If anything replaced it, restore the same source and
    // resume from the position captured before exit, with looping still OFF.
    if (!audio.isCurrentTrack(music.src)) {
      audio.setTrack(music.src, false);
      audio.setLoop(false);
      audio.seek?.(chapterPosition);
      void audio.ensurePlaying();
    }
    beginForestCarry(this, music);
  };
}
