export type SceneId = "title" | "forest" | "bakery" | "ending";
export type TendencyKey =
  | "acceptance"
  | "avoidance"
  | "closeness"
  | "distance"
  | "honesty"
  | "concealment"
  | "companionship"
  | "intervention";

export type Tendencies = Record<TendencyKey, number>;

export type Choice = {
  id: string;
  label: string;
  effects: Partial<Tendencies>;
  response: string;
};

export type DialogueNode = {
  id: string;
  speaker: "Muji" | "Friend A" | "Memory";
  portrait: "muji" | "friend" | "none";
  text: string;
  choices?: Choice[];
};

export type HtmlChapterScene = {
  id: string;
  date: string;
  title: string;
  mood: string;
  weather: string;
  location: string;
  characters: string[];
  objects: string[];
  evidence: string[];
  dialogue: DialogueNode[];
};

export type SaveState = {
  version: 1;
  slot?: number;
  savedAt: string;
  scene: SceneId;
  player: { x: number; y: number };
  openedDoors: string[];
  completedChapters: string[];
  choices: string[];
  tendencies: Tendencies;
  scrapbook: string[];
  favorites: string[];
  timelineCompleted: string[];
  selectedChapter: string;
  settings: { rain: boolean; muted: boolean; volume: number; compact: boolean; reducedMotion: boolean };
  endingProgress: string[];
};
