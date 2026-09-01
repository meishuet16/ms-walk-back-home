export const STORY_CHAPTER_IDS = [
  "oct29-a-little-closer",
  "1122-before-sunrise",
  "march30-too-fated",
  "april05-come-down",
  "april06-not-gone-yet",
  "april25-just-good-friends",
  "may23-i-arrived",
  "june24-only-came-for-you",
  "june25-so-i-came",
  "labis-motor-day",
  "july21-why-cant-you-stay",
  "bakery-day",
  "final-dream-tomorrow"
] as const;

export type StoryChapterId = (typeof STORY_CHAPTER_IDS)[number];

export type StoryRouteProgress = {
  version: 1;
  completedChapterIds: StoryChapterId[];
};

export type StoryChapterState = "completed" | "current" | "locked";

export function normalizeStoryRouteProgress(value: unknown): StoryRouteProgress {
  const source = value && typeof value === "object" ? value as { completedChapterIds?: unknown } : {};
  const completed = Array.isArray(source.completedChapterIds)
    ? source.completedChapterIds.filter((id): id is StoryChapterId => typeof id === "string" && STORY_CHAPTER_IDS.includes(id as StoryChapterId))
    : [];
  return { version: 1, completedChapterIds: [...new Set(completed)] };
}

export function storyChapterState(chapterId: StoryChapterId, progress: StoryRouteProgress): StoryChapterState {
  if (progress.completedChapterIds.includes(chapterId)) return "completed";
  const firstIncomplete = STORY_CHAPTER_IDS.find((id) => !progress.completedChapterIds.includes(id));
  return chapterId === firstIncomplete ? "current" : "locked";
}

export function markStoryChapterCompleted(progress: StoryRouteProgress, chapterId: string): StoryRouteProgress {
  if (!STORY_CHAPTER_IDS.includes(chapterId as StoryChapterId)) return progress;
  const typed = chapterId as StoryChapterId;
  if (progress.completedChapterIds.includes(typed)) return progress;
  return { version: 1, completedChapterIds: [...progress.completedChapterIds, typed] };
}

export function currentStoryChapterId(progress: StoryRouteProgress): StoryChapterId {
  return STORY_CHAPTER_IDS.find((id) => !progress.completedChapterIds.includes(id)) ?? STORY_CHAPTER_IDS[STORY_CHAPTER_IDS.length - 1];
}

export function storyCompletionCount(progress: StoryRouteProgress): number {
  return STORY_CHAPTER_IDS.filter((id) => progress.completedChapterIds.includes(id)).length;
}
