import type { ChapterReflection, ReflectionChoice, Tendencies } from "../types.js";
import { applyChoice, emptyTendencies } from "./TendencySystem.js";

export type ChapterExperienceMode = "automatic" | "manual-replay";

export type AuthoredChapterRun = {
  chapterId: string;
  mainCompleted: boolean;
  discoveredEchoIds: Set<string>;
  reflectionChoiceIds: string[];
  tendencies: Tendencies;
  resolvedReflection?: ChapterReflection;
  diaryRead: boolean;
  mode: ChapterExperienceMode;
};

export type ChapterReflectionInput = {
  choices: string[];
  tendencies: Tendencies;
};

export function startChapterMemoryExperience(options: { chapterId: string; mode: ChapterExperienceMode }): AuthoredChapterRun {
  return {
    chapterId: options.chapterId,
    mainCompleted: false,
    discoveredEchoIds: new Set(),
    reflectionChoiceIds: [],
    tendencies: emptyTendencies(),
    diaryRead: false,
    mode: options.mode
  };
}

export function applyChapterExperienceChoice(run: AuthoredChapterRun, choice: ReflectionChoice): AuthoredChapterRun {
  return {
    ...run,
    reflectionChoiceIds: [...run.reflectionChoiceIds, choice.id],
    tendencies: applyChoice(run.tendencies, choice)
  };
}

export function markChapterMainCompleted(run: AuthoredChapterRun): AuthoredChapterRun {
  return { ...run, mainCompleted: true };
}

export function markChapterEchoDiscovered(run: AuthoredChapterRun, echoId: string): AuthoredChapterRun {
  return { ...run, discoveredEchoIds: new Set([...run.discoveredEchoIds, echoId]) };
}

export function markChapterDiaryRead(run: AuthoredChapterRun): AuthoredChapterRun {
  return { ...run, diaryRead: true };
}

export function resolveChapterRunReflection(run: AuthoredChapterRun, reflection: ChapterReflection): AuthoredChapterRun {
  return { ...run, resolvedReflection: reflection };
}

export function currentRunReflectionInput(run: AuthoredChapterRun): ChapterReflectionInput {
  return {
    choices: [...run.reflectionChoiceIds],
    tendencies: { ...run.tendencies }
  };
}
