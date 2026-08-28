export type AuthoredPortrait = string | Record<string, unknown>;

export type AuthoredDialoguePresentation = {
  text: string;
  portrait?: AuthoredPortrait;
};

export type AuthoredReflectionPresentation = {
  prompt: string;
  choices: ReadonlyArray<{ label: string; response?: string }>;
};

export type AuthoredContentChapter = {
  display: Record<string, string>;
  dialogue: ReadonlyArray<AuthoredDialoguePresentation>;
  collections?: Readonly<Record<string, ReadonlyArray<AuthoredDialoguePresentation>>>;
  beatPortraits?: Readonly<Record<string, ReadonlyArray<AuthoredPortrait>>>;
  closure?: ReadonlyArray<string>;
  reflections?: ReadonlyArray<AuthoredReflectionPresentation>;
  diary?: { title: string; body: string };
};

export type AuthoredContentManifest = {
  version: 1;
  chapters: Readonly<Record<string, AuthoredContentChapter>>;
};

export type AuthoredContentExpectation = AuthoredContentManifest;

export const ownedGeneratedPaths = [
  "apps/html-prototype/src/fixtures/generated/authoredContentExpectations.ts"
] as const;

export const ownedSourcePaths = [
  "apps/html-prototype/src/authoring/authoredContent.ts",
  "apps/html-prototype/src/authoring/authoredContentManifest.ts",
  "apps/html-prototype/src/fixtures/authoredDiaryEntries.ts",
  "apps/html-prototype/src/fixtures/april05Chapter.ts",
  "apps/html-prototype/src/fixtures/april06Chapter.ts",
  "apps/html-prototype/src/fixtures/april25Chapter.ts",
  "apps/html-prototype/src/fixtures/july21Chapter.ts",
  "apps/html-prototype/src/fixtures/june24Chapter.ts",
  "apps/html-prototype/src/fixtures/june25Chapter.ts",
  "apps/html-prototype/src/fixtures/november22Chapter.ts",
  "apps/html-prototype/src/fixtures/oct29Chapter.ts",
  "apps/html-prototype/src/fixtures/march30Chapter.ts",
  "apps/html-prototype/src/fixtures/march30Memory.ts",
  "apps/html-prototype/src/fixtures/may23Chapter.ts",
  "apps/html-prototype/public/scene-layouts/523/portrait.json",
  "apps/html-prototype/public/scene-layouts/624/portrait.json"
] as const;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function copyPortrait(value: unknown): AuthoredPortrait | undefined {
  if (typeof value === "string") return value;
  if (!isRecord(value) || typeof value.src !== "string") return undefined;
  return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, copyValue(item)]));
}

function copyValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(copyValue);
  if (isRecord(value)) return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, copyValue(item)]));
  return value;
}

export function extractDialoguePresentation(actions: readonly unknown[]): AuthoredDialoguePresentation[] {
  return actions.flatMap((action) => {
    if (!isRecord(action)) return [];
    const source = action.type === "dialogue" ? action : action.dialogue;
    if (!isRecord(source) || typeof source.text !== "string") return [];
    const presentation: AuthoredDialoguePresentation = { text: source.text };
    const portrait = copyPortrait(source.portrait);
    if (portrait !== undefined) presentation.portrait = portrait;
    return [presentation];
  });
}

export function extractReflectionPresentation(points: readonly unknown[]): AuthoredReflectionPresentation[] {
  return points.flatMap((point) => {
    if (!isRecord(point) || typeof point.prompt !== "string" || !Array.isArray(point.choices)) return [];
    return [{
      prompt: point.prompt,
      choices: point.choices.flatMap((choice) => {
        if (!isRecord(choice) || typeof choice.label !== "string") return [];
        const presentation: { label: string; response?: string } = { label: choice.label };
        if (typeof choice.response === "string") presentation.response = choice.response;
        return [presentation];
      })
    }];
  });
}

function sortValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortValue);
  if (!isRecord(value)) return value;
  return Object.fromEntries(Object.keys(value).sort().map((key) => [key, sortValue(value[key])]));
}

export function serializeAuthoredContent(manifest: AuthoredContentManifest): string {
  return JSON.stringify(sortValue(manifest), null, 2) + "\n";
}
