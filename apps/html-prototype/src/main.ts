import { WalkBackHomeApp } from "./app.js";
import { SceneDebugEditor } from "./systems/SceneDebugEditor.js";

// Shared authored chapters that explicitly gate Reflection behind an Echo must not
// show the generic post-Main ending card. Their final ending is rendered by the
// Reflection sequence after the configured Echo is completed.
type AuthoredRuntimeAwareApp = {
  authoredRuntimeForScene: () => { reflectionAfterEchoId?: string } | null;
  chapterMemoryRun: { resolvedReflection?: unknown } | null;
  showChapterEndingQuote: (...args: unknown[]) => void;
};

const appPrototype = WalkBackHomeApp.prototype as unknown as AuthoredRuntimeAwareApp;
const showChapterEndingQuote = appPrototype.showChapterEndingQuote;
appPrototype.showChapterEndingQuote = function (...args: unknown[]): void {
  const runtime = this.authoredRuntimeForScene?.();
  if (runtime?.reflectionAfterEchoId && !this.chapterMemoryRun?.resolvedReflection) return;
  showChapterEndingQuote.apply(this, args);
};

// Labis is still on its legacy lifecycle. Keep this bridge intentionally narrow:
// completing Main marks the current run, and the approved final filter interaction
// proceeds immediately to the existing Memory Reflection instead of waiting for Exit.
type LabisLifecycleApp = {
  labisActiveChoice: "motor" | "photo" | "filter" | null;
  labisExitAfterReflection: boolean;
  finishLabisMemoryEvent: () => void;
  chooseLabisChoice: (choiceId: string) => void;
  markCurrentChapterMainCompleted: (chapterId: string) => void;
};

const labisPrototype = WalkBackHomeApp.prototype as unknown as LabisLifecycleApp;
const finishLabisMemoryEvent = labisPrototype.finishLabisMemoryEvent;
labisPrototype.finishLabisMemoryEvent = function (): void {
  finishLabisMemoryEvent.call(this);
  this.markCurrentChapterMainCompleted("labis-motor-day");
};

const chooseLabisChoice = labisPrototype.chooseLabisChoice;
labisPrototype.chooseLabisChoice = function (choiceId: string): void {
  if (this.labisActiveChoice === "filter") this.labisExitAfterReflection = true;
  chooseLabisChoice.call(this, choiceId);
};

const root = document.querySelector<HTMLElement>("#app")!;
if (new URLSearchParams(window.location.search).get("debug") === "scene") {
  void new SceneDebugEditor(root).mount();
} else {
  new WalkBackHomeApp(root);
}
