import { markStoryChapterCompleted, normalizeStoryRouteProgress } from "./StoryRoute.js";

const STORY_PROGRESS_KEY = "walk-back-home:story-route-progress:v1";
const LABIS_CHAPTER_ID = "labis-motor-day";

type ChapterRunLike = {
  chapterId?: string;
  mainCompleted?: boolean;
};

type AppLike = {
  overlay: HTMLElement;
  chapterMemoryRun?: ChapterRunLike | null;
  finishReturnToForest?: (...args: unknown[]) => unknown;
};

type AppPrototype = {
  finishReturnToForest?: (...args: unknown[]) => unknown;
};

type LabisRouteSession = {
  launchedFromStoryRoute: boolean;
};

const sessions = new WeakMap<object, LabisRouteSession>();

function sessionFor(app: object): LabisRouteSession {
  let session = sessions.get(app);
  if (!session) {
    session = { launchedFromStoryRoute: false };
    sessions.set(app, session);
  }
  return session;
}

function loadProgress() {
  try {
    return normalizeStoryRouteProgress(JSON.parse(localStorage.getItem(STORY_PROGRESS_KEY) ?? "null"));
  } catch {
    return normalizeStoryRouteProgress(null);
  }
}

function saveLabisCompletion(): void {
  try {
    const progress = markStoryChapterCompleted(loadProgress(), LABIS_CHAPTER_ID);
    localStorage.setItem(STORY_PROGRESS_KEY, JSON.stringify(progress));
  } catch {
    // Story Route remains playable even when storage is unavailable.
  }
}

function captureStoryLaunch(app: AppLike, event: Event): void {
  const target = event.target instanceof Element
    ? event.target.closest<HTMLElement>("[data-story-action='chapter-start']")
    : null;
  if (!target) return;
  sessionFor(app).launchedFromStoryRoute = target.dataset.chapter === LABIS_CHAPTER_ID;
}

export function initializeStoryRouteLabisCompletion(appObject: object): void {
  const app = appObject as AppLike;
  if (app.overlay.dataset.storyRouteLabisCompletionBound === "true") return;
  app.overlay.dataset.storyRouteLabisCompletionBound = "true";
  sessionFor(app);
  app.overlay.addEventListener("pointerup", (event) => captureStoryLaunch(app, event));
  app.overlay.addEventListener("click", (event) => captureStoryLaunch(app, event));
}

export function installStoryRouteLabisCompletionBridge(proto: AppPrototype): void {
  const originalFinishReturnToForest = proto.finishReturnToForest;
  if (!originalFinishReturnToForest) return;

  proto.finishReturnToForest = function(this: AppLike, ...args: unknown[]): unknown {
    const session = sessionFor(this as object);
    if (session.launchedFromStoryRoute) {
      const run = this.chapterMemoryRun;
      if (run?.chapterId === LABIS_CHAPTER_ID && run.mainCompleted === true) {
        saveLabisCompletion();
      }
      session.launchedFromStoryRoute = false;
    }
    return originalFinishReturnToForest.apply(this, args);
  };
}
