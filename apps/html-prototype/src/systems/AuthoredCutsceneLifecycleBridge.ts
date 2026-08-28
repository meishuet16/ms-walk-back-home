export type AuthoredCutsceneCompletionMode = "main" | "echo";

export type AuthoredCutsceneCompletionPlan = {
  markMainCompleted: boolean;
  markEchoId: string;
  beginReflection: boolean;
  showLegacyMainEnding: boolean;
};

export function planAuthoredCutsceneCompletion(input: {
  mode: AuthoredCutsceneCompletionMode;
  echoId?: string;
  reflectionAfterEchoId?: string;
  reflectionChoiceCount: number;
}): AuthoredCutsceneCompletionPlan {
  const echoId = input.mode === "echo" ? (input.echoId ?? "") : "";
  const gatedMain = input.mode === "main" && Boolean(input.reflectionAfterEchoId);
  const gatedEcho = input.mode === "echo"
    && input.reflectionChoiceCount > 0
    && Boolean(echoId)
    && echoId === input.reflectionAfterEchoId;

  return {
    markMainCompleted: input.mode === "main",
    markEchoId: echoId,
    beginReflection: gatedEcho,
    showLegacyMainEnding: input.mode === "main" && !gatedMain
  };
}

type AuthoredRuntimeLike = {
  chapter: {
    id: string;
    date: string;
    location: string;
    title: string;
    canonicalClosure: { lines: string[] };
  };
  reflectionAfterEchoId?: string;
  reflectionChoices: Array<{ id: string }>;
};

type AuthoredCutsceneLifecycleApp = {
  authoredCutscene: unknown | null;
  authoredMode: AuthoredCutsceneCompletionMode | null;
  authoredReplayMode: boolean;
  authoredOverlayMode: string | null;
  authoredSequenceReflectionPending: boolean;
  authoredEchoId: string;
  authoredCheckpointId: string;
  authoredReflectionResponse: string;
  overlay: HTMLElement;
  authoredRuntimeForScene: () => AuthoredRuntimeLike | null;
  markCurrentChapterMainCompleted: (chapterId: string) => void;
  markCurrentChapterEchoDiscovered: (chapterId: string, echoId: string) => void;
  showChapterEndingQuote: (kicker: string, title: string, lines: string[]) => void;
  showAuthoredChoice: () => void;
  showToast: (message: string) => void;
  autosave: () => void;
  finishAuthoredCutscene: () => void;
};

export function installAuthoredCutsceneLifecycleBridge(prototype: object): void {
  const appPrototype = prototype as AuthoredCutsceneLifecycleApp;

  appPrototype.finishAuthoredCutscene = function (): void {
    const runtime = this.authoredRuntimeForScene();
    if (!this.authoredCutscene || !this.authoredMode || !runtime) return;

    const mode = this.authoredMode;
    const completedEchoId = this.authoredEchoId;
    const plan = planAuthoredCutsceneCompletion({
      mode,
      echoId: completedEchoId,
      reflectionAfterEchoId: runtime.reflectionAfterEchoId,
      reflectionChoiceCount: runtime.reflectionChoices.length
    });

    this.authoredCutscene = null;
    this.authoredMode = null;
    this.authoredReplayMode = false;
    this.authoredOverlayMode = null;
    this.authoredCheckpointId = "";
    this.authoredReflectionResponse = "";
    this.overlay.classList.remove("dialogue-open", "lightweight-presentation");
    this.overlay.innerHTML = "";

    if (plan.markMainCompleted) this.markCurrentChapterMainCompleted(runtime.chapter.id);
    if (plan.markEchoId) this.markCurrentChapterEchoDiscovered(runtime.chapter.id, plan.markEchoId);

    if (plan.beginReflection) {
      this.authoredEchoId = "";
      this.authoredMode = "main";
      this.authoredSequenceReflectionPending = true;
      this.authoredCheckpointId = runtime.reflectionChoices[0].id;
      this.showAuthoredChoice();
      this.autosave();
      return;
    }

    this.authoredEchoId = "";
    if (plan.showLegacyMainEnding) {
      this.showChapterEndingQuote(
        runtime.chapter.date + " · " + runtime.chapter.location,
        runtime.chapter.title,
        runtime.chapter.canonicalClosure.lines
      );
      this.autosave();
      return;
    }

    if (mode === "main") this.showToast("The main memory fades.");
    else this.showToast("The secondary echo fades without adding another event.");
    this.autosave();
  };
}
