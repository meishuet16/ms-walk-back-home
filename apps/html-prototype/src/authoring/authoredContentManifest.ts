import { extractDialoguePresentation, extractReflectionPresentation, type AuthoredContentChapter, type AuthoredContentManifest, type AuthoredDialoguePresentation, type AuthoredPortrait } from "./authoredContent.js";
import { april05Chapter, april05EchoActions, april05MainMemoryActions, april05ReflectionChoices } from "../fixtures/april05Chapter.js";
import { april06Chapter, april06EchoActions, april06MainMemoryActions, april06ReflectionChoices } from "../fixtures/april06Chapter.js";
import { july21Chapter, july21MainPortraitSequence, july21PortraitSequences, july21ReflectionChoices, july21DiaryEntry } from "../fixtures/july21Chapter.js";
import { june24Chapter, june24EchoDialogues, june24ReflectionChoices, resolveJune24Actions } from "../fixtures/june24Chapter.js";
import { june25Chapter, june25PortraitSequences, june25ReflectionChoices, june25DiaryEntry } from "../fixtures/june25Chapter.js";
import { march30Chapter } from "../fixtures/march30Chapter.js";
import { march30EchoActions, march30MainMemoryActions, march30ReflectionChoices, march30EchoReflectionChoices } from "../fixtures/march30Memory.js";
import { may23Chapter, may23EchoDialogues, may23ReflectionChoices, resolveMay23Actions } from "../fixtures/may23Chapter.js";
import { authoredChapterDiaryEntries } from "../fixtures/authoredDiaryEntries.js";
import { readFileSync } from "node:fs";

type ChapterForDisplay = { title: string; mood: string; weather: string; location: string };

export function authoredPublicAssetUrl(relativePath: string): URL {
  return new URL(`../../../public/${relativePath}`, import.meta.url);
}

function display(chapter: ChapterForDisplay): Record<string, string> {
  return { title: chapter.title, mood: chapter.mood, weather: chapter.weather, location: chapter.location };
}

function diary(chapterId: string): { title: string; body: string } | undefined {
  const entry = authoredChapterDiaryEntries.find((candidate) => candidate.chapterId === chapterId);
  return entry ? { title: entry.title, body: entry.body } : undefined;
}

function chapterContent(
  chapter: ChapterForDisplay & { id: string; canonicalClosure: { lines: readonly string[] } },
  dialogue: AuthoredDialoguePresentation[],
  collections: Record<string, AuthoredDialoguePresentation[]> = {},
  reflections: readonly unknown[] = [],
  diaryEntry = diary(chapter.id)
): AuthoredContentChapter {
  const content: AuthoredContentChapter = {
    display: display(chapter),
    dialogue,
    collections,
    closure: chapter.canonicalClosure.lines,
    reflections: extractReflectionPresentation(reflections)
  };
  if (diaryEntry) content.diary = diaryEntry;
  return content;
}

function actionPresentation(actions: readonly unknown[]): AuthoredDialoguePresentation[] {
  return extractDialoguePresentation(actions);
}

function sequencePresentation(sequence: { beats: ReadonlyArray<{ portrait?: unknown; dialogue: ReadonlyArray<unknown> }> }): AuthoredDialoguePresentation[] {
  return sequence.beats.flatMap((beat) => actionPresentation(beat.dialogue.map((line) => ({ ...(line as Record<string, unknown>), type: "dialogue" }))).map((line) => {
    if (beat.portrait === undefined) return line;
    return { ...line, portrait: beat.portrait as string | Record<string, unknown> };
  }));
}

function sequenceCollections(sequences: Record<string, { beats: ReadonlyArray<{ portrait?: unknown; dialogue: ReadonlyArray<unknown> }> }>): Record<string, AuthoredDialoguePresentation[]> {
  return Object.fromEntries(Object.entries(sequences).map(([id, sequence]) => [id, sequencePresentation(sequence)]));
}

function sequenceBeatPortraits(sequences: Record<string, { beats: ReadonlyArray<{ portrait?: unknown }> }>): Record<string, AuthoredPortrait[]> {
  return Object.fromEntries(Object.entries(sequences).map(([id, sequence]) => [
    id,
    sequence.beats.flatMap((beat) => beat.portrait === undefined ? [] : [beat.portrait as AuthoredPortrait])
  ]));
}

function dialogueCollections(dialogues: Record<string, readonly unknown[]>): Record<string, AuthoredDialoguePresentation[]> {
  return Object.fromEntries(Object.entries(dialogues).map(([id, lines]) => [
    id,
    actionPresentation(lines.map((line) => ({ ...(line as Record<string, unknown>), type: "dialogue" })))
  ]));
}

function resolvedJune24Collections(): Record<string, AuthoredDialoguePresentation[]> {
  const layout = JSON.parse(readFileSync(authoredPublicAssetUrl("scene-layouts/624/portrait.json"), "utf8")) as Parameters<typeof resolveJune24Actions>[0];
  return {
    main: actionPresentation(resolveJune24Actions(layout, "main")),
    ...dialogueCollections(june24EchoDialogues)
  };
}

function resolvedMay23Collections(): Record<string, AuthoredDialoguePresentation[]> {
  const layout = JSON.parse(readFileSync(authoredPublicAssetUrl("scene-layouts/523/portrait.json"), "utf8")) as Parameters<typeof resolveMay23Actions>[0];
  return {
    main: actionPresentation(resolveMay23Actions(layout, "main")),
    ...dialogueCollections(may23EchoDialogues)
  };
}

export const authoredContentManifest: AuthoredContentManifest = {
  version: 1,
  chapters: {
    march30: {
      ...chapterContent(march30Chapter, actionPresentation(march30MainMemoryActions), { echo: actionPresentation(march30EchoActions) }, [
        { prompt: "main", choices: march30ReflectionChoices },
        { prompt: "echo", choices: march30EchoReflectionChoices }
      ])
    },
    april05: {
      ...chapterContent(april05Chapter, actionPresentation(april05MainMemoryActions), Object.fromEntries(Object.entries(april05EchoActions).map(([id, actions]) => [id, actionPresentation(actions)])), april05ReflectionChoices)
    },
    april06: {
      ...chapterContent(april06Chapter, actionPresentation(april06MainMemoryActions), { echo: actionPresentation(april06EchoActions) }, april06ReflectionChoices)
    },
    may23: {
      ...chapterContent(may23Chapter, resolvedMay23Collections().main ?? [], resolvedMay23Collections(), may23ReflectionChoices)
    },
    june24: {
      ...chapterContent(june24Chapter, resolvedJune24Collections().main ?? [], resolvedJune24Collections(), june24ReflectionChoices)
    },
    june25: {
      ...chapterContent(june25Chapter, sequencePresentation(june25PortraitSequences["june25-main"]!), sequenceCollections(june25PortraitSequences), june25ReflectionChoices, { title: june25DiaryEntry.title, body: june25DiaryEntry.body }),
      beatPortraits: sequenceBeatPortraits(june25PortraitSequences)
    },
    july21: {
      ...chapterContent(july21Chapter, sequencePresentation(july21MainPortraitSequence), sequenceCollections(july21PortraitSequences), july21ReflectionChoices, { title: july21DiaryEntry.title, body: july21DiaryEntry.body }),
      beatPortraits: {
        "july21-main": july21MainPortraitSequence.beats.flatMap((beat) => beat.portrait === undefined ? [] : [beat.portrait as AuthoredPortrait]),
        ...sequenceBeatPortraits(july21PortraitSequences)
      }
    }
  }
};
