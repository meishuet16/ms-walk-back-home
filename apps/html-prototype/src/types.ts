export type SceneId = "title" | "forest" | "bakery" | "labis" | "muji-room" | "ending";
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
  speaker: string;
  portrait: string | "none";
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
  memoryText?: string[];
  dialogue: DialogueNode[];
};

export type DiaryEntry = {
  id: string;
  date: string;
  title: string;
  body: string;
  location?: string;
  weather?: string;
  memoryKind: MemoryKind;
  mood?: DiaryMood;
  chapterId?: string;
  photos?: DiaryPhoto[];
  scrapbookLayout?: ScrapbookLayout;
};

export type MemoryKind = "diary" | "fragment" | "chapter";
export type DiaryMood = "calm" | "sad" | "blank" | "happy" | "excited";

export type DiaryPhoto = {
  id: string;
  storageKey?: string;
  src: string;
  caption?: string;
};

export type CropData = {
  shape: "rectangle" | "circle";
};

export type ScrapbookElement =
  | {
      id: string;
      type: "photo";
      photoId: string;
      x: number;
      y: number;
      scale: number;
      rotation: number;
      zIndex: number;
    }
  | {
      id: string;
      type: "cutout";
      sourcePhotoId: string;
      crop?: CropData;
      maskData?: unknown;
      x: number;
      y: number;
      scale: number;
      rotation: number;
      zIndex: number;
    };

export type ScrapbookLayout = {
  elements: ScrapbookElement[];
};

export type ReflectionTone = "accepting" | "holding" | "not-ready" | "rewriting";

export type ChapterProgressState = "unseen" | "visited" | "walkedThrough";

export type RoomJourneyState = {
  visits: number;
  reflections: string[];
  lampOn?: boolean;
  musicOn?: boolean;
  residueIds?: string[];
  windowFocus?: boolean;
  selectedVinylId?: string;
  vinylPlaying?: boolean;
  vinylCovers?: Record<string, string>;
  reflectionNote?: string;
};

export type DiaryLibraryState = {
  version: 1;
  savedAt: string;
  entries: DiaryEntry[];
  legacyArtifacts: string[];
};

export type JourneyState = {
  version: 1;
  savedAt: string;
  scene: SceneId;
  player: { x: number; y: number };
  visitedMemories: string[];
  walkedThroughMemories: string[];
  choices: string[];
  tendencies: Tendencies;
  readMemories: string[];
  completedMemoryEvents?: string[];
  room: RoomJourneyState;
  finalJourney: string[];
};

export type ChapterProgress = {
  chapterId: string;
  state: ChapterProgressState;
  visited: boolean;
  memoryRead: boolean;
  dialogueCompleted: boolean;
  walkedThrough: boolean;
  choices: string[];
  tendencies: Tendencies;
  reflectionTone?: ReflectionTone;
  closingQuoteId?: string;
};

export type ChapterReflectionQuote = {
  id: string;
  tone: ReflectionTone;
  title?: string;
  lines: string[];
  afterline?: string;
};

export type ChapterReflection = {
  tone: ReflectionTone;
  quoteId: string;
  title?: string;
  lines: string[];
  afterline?: string;
  historicalEventId: string;
  closureLines: string[];
};

export type ChapterDefinition = HtmlChapterScene & {
  runtimeScene: "bakery" | "labis";
  canonicalClosure: {
    historicalEventId: string;
    lines: string[];
  };
  reflectionQuotes: ChapterReflectionQuote[];
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
  settings: { rain: boolean; muted: boolean; volume: number; compact: boolean; reducedMotion: boolean; musicEnabled?: boolean; musicScene?: "forest" | "bakery" };
  readMemories?: string[];
  diaryEntries?: DiaryEntry[];
  room?: { visits: number; gifts: number; outfit: string; diary: string[]; water?: number; warmth?: number; stickers?: number; letters?: number };
  endingProgress: string[];
};
