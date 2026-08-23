import type { Choice, ChapterProgress, Tendencies } from "../types.js";
import { applyChoice } from "./TendencySystem.js";

export type ChapterExperienceMode = "automatic" | "manual-replay";

export type ChapterMemoryExperienceRun = {
  chapterId: string;
  eventId: string;
  mode: ChapterExperienceMode;
  choiceIds: string[];
  baselineTendencies: Tendencies;
  tendencies: Tendencies;
  persistentContribution: Tendencies;
  firstCompletionPending: boolean;
};

export function startChapterMemoryExperience(options: {
  chapterId: string;
  eventId: string;
  mode: ChapterExperienceMode;
  baselineTendencies: Tendencies;
  firstCompletionPending: boolean;
}): ChapterMemoryExperienceRun {
  return {
    chapterId: options.chapterId,
    eventId: options.eventId,
    mode: options.mode,
    choiceIds: [],
    baselineTendencies: { ...options.baselineTendencies },
    tendencies: { ...options.baselineTendencies },
    persistentContribution: emptyTendencies(),
    firstCompletionPending: options.firstCompletionPending
  };
}

export function applyChapterExperienceChoice(run: ChapterMemoryExperienceRun, choice: Choice): ChapterMemoryExperienceRun {
  const tendencies = applyChoice(run.tendencies, choice);
  const persistentContribution = run.firstCompletionPending
    ? difference(tendencies, run.baselineTendencies)
    : emptyTendencies();
  return {
    ...run,
    choiceIds: [...run.choiceIds, choice.id],
    tendencies,
    persistentContribution
  };
}

export function currentRunProgress(progress: ChapterProgress, run: ChapterMemoryExperienceRun): ChapterProgress {
  return {
    ...progress,
    choices: [...run.choiceIds],
    tendencies: { ...run.tendencies }
  };
}

export function emptyTendencies(): Tendencies {
  return {
    acceptance: 0,
    avoidance: 0,
    closeness: 0,
    distance: 0,
    honesty: 0,
    concealment: 0,
    companionship: 0,
    intervention: 0
  };
}

function difference(next: Tendencies, baseline: Tendencies): Tendencies {
  return {
    acceptance: next.acceptance - baseline.acceptance,
    avoidance: next.avoidance - baseline.avoidance,
    closeness: next.closeness - baseline.closeness,
    distance: next.distance - baseline.distance,
    honesty: next.honesty - baseline.honesty,
    concealment: next.concealment - baseline.concealment,
    companionship: next.companionship - baseline.companionship,
    intervention: next.intervention - baseline.intervention
  };
}
