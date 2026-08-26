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
