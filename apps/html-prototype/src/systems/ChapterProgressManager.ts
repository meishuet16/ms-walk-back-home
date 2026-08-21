import type { ChapterProgress, ReflectionTone, Tendencies } from "../types.js";
import { emptyTendencies } from "./TendencySystem.js";

export function initialChapterProgress(chapterId: string): ChapterProgress {
  return {
    chapterId,
    state: "unseen",
    visited: false,
    memoryRead: false,
    dialogueCompleted: false,
    walkedThrough: false,
    choices: [],
    tendencies: emptyTendencies()
  };
}

export type ChapterTriggerSession = {
  chapterId: string;
  automaticTriggerConsumed: boolean;
};

export function createChapterTriggerSession(chapterId: string): ChapterTriggerSession {
  return { chapterId, automaticTriggerConsumed: false };
}

export function consumeAutomaticChapterTrigger(session: ChapterTriggerSession): { allowed: boolean; session: ChapterTriggerSession } {
  if (session.automaticTriggerConsumed) return { allowed: false, session };
  return { allowed: true, session: { ...session, automaticTriggerConsumed: true } };
}

export function resetChapterTriggerSession(session: ChapterTriggerSession): ChapterTriggerSession {
  return { ...session, automaticTriggerConsumed: false };
}

export function beginChapterVisit(progress: ChapterProgress): ChapterProgress {
  if (progress.walkedThrough) return progress;
  return {
    ...progress,
    state: "visited",
    visited: true
  };
}

export function markChapterMemoryRead(progress: ChapterProgress): ChapterProgress {
  return {
    ...progress,
    memoryRead: true
  };
}

export function recordChapterChoice(progress: ChapterProgress, choiceId: string, tendencies: Tendencies): ChapterProgress {
  return {
    ...progress,
    choices: [...progress.choices, choiceId],
    tendencies
  };
}

export function markChapterDialogueComplete(progress: ChapterProgress): ChapterProgress {
  return {
    ...progress,
    dialogueCompleted: true
  };
}

export function finishChapterWalkthrough(progress: ChapterProgress, quoteId: string, tone: ReflectionTone): ChapterProgress {
  return {
    ...progress,
    state: "walkedThrough",
    visited: true,
    dialogueCompleted: true,
    walkedThrough: true,
    closingQuoteId: progress.closingQuoteId ?? quoteId,
    reflectionTone: progress.reflectionTone ?? tone
  };
}
