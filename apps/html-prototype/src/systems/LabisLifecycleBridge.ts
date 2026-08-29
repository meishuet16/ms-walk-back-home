const LABIS_CHAPTER_ID = "labis-motor-day";
const LEGACY_LABIS_TRIGGER_ID = "july19-motor-day";
const FILTER_ECHO_ID = "july19-filter-evening";

export function normalizeLabisTriggerChapterId(chapterId: string): string {
  return chapterId === LEGACY_LABIS_TRIGGER_ID ? LABIS_CHAPTER_ID : chapterId;
}

export function shouldRouteLabisFilterToReflection(activeChoice: string | null): boolean {
  return activeChoice === "filter";
}

type LabisLifecycleApp = {
  scene: string;
  labisActiveChoice: "motor" | "photo" | "filter" | null;
  labisActiveEcho: { id: string } | null;
  labisExitAfterReflection: boolean;
  labisOverlayMode: string | null;
  finishLabisMemoryEvent: () => void;
  chooseLabisChoice: (choiceId: string) => void;
  closeLabisReflection: () => void;
  returnToForest: () => void;
  finishReturnToForest: () => void;
  consumeChapterTrigger: (chapterId: string) => boolean;
  markCurrentChapterMainCompleted: (chapterId: string) => void;
  markCurrentChapterEchoDiscovered: (chapterId: string, echoId: string) => void;
};

/**
 * Labis still uses its legacy scene lifecycle. This bridge keeps each Forest entry
 * replayable while allowing the approved filter/manual Echo to end in Reflection
 * without treating Close as an instruction to leave the chapter.
 */
export function installLabisLifecycleBridge(prototype: object): void {
  const appPrototype = prototype as LabisLifecycleApp;
  const reflectionCompleted = new WeakSet<object>();

  const consumeChapterTrigger = appPrototype.consumeChapterTrigger;
  appPrototype.consumeChapterTrigger = function (chapterId: string): boolean {
    return consumeChapterTrigger.call(this, normalizeLabisTriggerChapterId(chapterId));
  };

  const finishLabisMemoryEvent = appPrototype.finishLabisMemoryEvent;
  appPrototype.finishLabisMemoryEvent = function (): void {
    finishLabisMemoryEvent.call(this);
    this.markCurrentChapterMainCompleted(LABIS_CHAPTER_ID);
  };

  const chooseLabisChoice = appPrototype.chooseLabisChoice;
  appPrototype.chooseLabisChoice = function (choiceId: string): void {
    const routeToReflection = shouldRouteLabisFilterToReflection(this.labisActiveChoice);
    const completedEchoId = routeToReflection && this.labisActiveEcho?.id === FILTER_ECHO_ID
      ? this.labisActiveEcho.id
      : "";

    // The legacy method uses this flag only to choose `show-reflection` vs
    // `finish-echo`. Keep it true for that synchronous decision, then clear it
    // immediately so closing Reflection stays inside Labis.
    if (routeToReflection) this.labisExitAfterReflection = true;
    chooseLabisChoice.call(this, choiceId);
    if (routeToReflection) {
      this.labisExitAfterReflection = false;
      if (completedEchoId) this.markCurrentChapterEchoDiscovered(LABIS_CHAPTER_ID, completedEchoId);
      this.labisActiveEcho = null;
    }
  };

  const closeLabisReflection = appPrototype.closeLabisReflection;
  appPrototype.closeLabisReflection = function (): void {
    const wasReflection = this.scene === "labis" && this.labisOverlayMode === "reflection";
    this.labisExitAfterReflection = false;
    closeLabisReflection.call(this);
    if (wasReflection) reflectionCompleted.add(this as object);
  };

  const returnToForest = appPrototype.returnToForest;
  appPrototype.returnToForest = function (): void {
    if (this.scene === "labis" && reflectionCompleted.has(this as object)) {
      reflectionCompleted.delete(this as object);
      this.finishReturnToForest();
      return;
    }
    returnToForest.call(this);
  };
}
