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
  media?: DiaryMedia[];
  scrapbookLayout?: ScrapbookLayout;
};

export type MemoryKind = "diary" | "fragment" | "chapter";
export type DiaryMood = string;

export type DiaryPhoto = {
  id: string;
  storageKey?: string;
  src: string;
  caption?: string;
  crop?: DiaryMediaCrop;
};

export type DiaryMediaCrop = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type DiaryMedia = {
  id: string;
  type: "image" | "video";
  storageKey?: string;
  src: string;
  caption?: string;
  mimeType?: string;
  posterSrc?: string;
  crop?: DiaryMediaCrop;
};

export type JournalBookCoverCrop = "center" | "top" | "bottom" | "contain";

export type JournalBookCover = {
  storageKey?: string;
  src: string;
  caption?: string;
  crop?: JournalBookCoverCrop;
  updatedAt: string;
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

export type ReflectionNoteSource = "manual" | "chapter";
export type ReflectionWallView = "wall" | "stack" | "list";
export type ReflectionWallFilter = "all" | "today" | "week" | "month" | "manual" | "chapter" | "pinned" | "favorites";
export type ReflectionWallSort = "manual" | "newest" | "oldest";

export type ReflectionNote = {
  id: string;
  text: string;
  createdAt: string;
  updatedAt?: string;
  styleId: string;
  x: number;
  y: number;
  rotation: number;
  pinned?: boolean;
  favorite?: boolean;
  source: ReflectionNoteSource;
  chapterId?: string;
};

export type ReflectionWallState = {
  version: 1;
  savedAt: string;
  defaultStyleId: string;
  migratedLegacyKeys: string[];
  notes: ReflectionNote[];
};

export type MusicSourceKind = "built-in" | "user";
export type PersonalMusicContext = "muji-room" | "forest";
export type MusicSort = "recently-added" | "recently-played" | "title" | "artist";
export type MusicVisualMode = "vinyl" | "cover";
export type MusicPlaybackMode = "next" | "repeat-one" | "shuffle";

export type SyncedLyricLine = {
  time: number;
  text: string;
};

export type UserMusicTrack = {
  id: string;
  title: string;
  artist?: string;
  album?: string;
  audioBlobKey: string;
  coverBlobKey?: string;
  syncedLyrics?: SyncedLyricLine[];
  plainLyrics?: string;
  addedAt: number;
  lastPlayedAt?: number;
};

export type PersonalMusicLibraryState = {
  version: 1;
  savedAt: string;
  tracks: UserMusicTrack[];
};

export type LyricsOverlayState = {
  x: number;
  y: number;
  width?: number;
  height?: number;
};

export type PersonalPlayerState = {
  version: 1;
  selectedTrackId?: string;
  playing: boolean;
  playbackPosition: number;
  visualMode: MusicVisualMode;
  lyricsVisible: boolean;
  lyricsOverlay: LyricsOverlayState;
  librarySort: MusicSort;
  librarySearch: string;
  playbackMode?: MusicPlaybackMode;
  shuffleEnabled: boolean;
  repeatOne: boolean;
  customTrackMeta?: Record<string, { title?: string; artist?: string }>;
  customTrackLyrics?: Record<string, { syncedLyrics: SyncedLyricLine[]; plainLyrics?: string }>;
  playerBackgroundBlobKey?: string;
};

export type DiaryLibraryState = {
  version: 1;
  savedAt: string;
  entries: DiaryEntry[];
  legacyArtifacts: string[];
  monthlyCovers?: Record<string, JournalBookCover>;
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
  personalPlayer?: PersonalPlayerState;
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
