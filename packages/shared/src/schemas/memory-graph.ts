import { z } from "zod";

export const ConfidenceSchema = z.number().min(0).max(1);

export const SourceEvidenceSchema = z.object({
  source: z.enum(["diary", "photo", "composer", "fixture", "inferred"]),
  note: z.string().min(1),
  confidence: ConfidenceSchema
}).strict();

export const MoodSchema = z.object({
  primary: z.enum(["calm", "joyful", "nostalgic", "quiet", "sad", "tender", "anxious", "hopeful"]),
  intensity: ConfidenceSchema,
  evidence: z.array(SourceEvidenceSchema).optional()
}).strict();

export const WeatherSchema = z.object({
  condition: z.enum(["clear", "cloudy", "sunny", "rain", "mist", "snow", "unknown"]),
  timeOfDay: z.enum(["morning", "afternoon", "evening", "night", "unknown"]),
  evidence: z.array(SourceEvidenceSchema).optional()
}).strict();

export const CharacterNodeSchema = z.object({
  id: z.string().min(1),
  displayName: z.string().min(1),
  role: z.string().min(1),
  evidence: z.array(SourceEvidenceSchema).optional()
}).strict();

export const LocationNodeSchema = z.object({
  id: z.string().min(1),
  module: z.enum([
    "home_room",
    "outdoor_road",
    "bakery_shop",
    "convenience_store",
    "park_or_temple",
    "transition_screen"
  ]),
  order: z.number().int().nonnegative(),
  label: z.string().min(1).optional(),
  evidence: z.array(SourceEvidenceSchema).optional()
}).strict();

export const ObjectNodeSchema = z.object({
  id: z.string().min(1),
  type: z.string().min(1),
  label: z.string().min(1),
  evidence: z.array(SourceEvidenceSchema).optional()
}).strict();

export const EventNodeSchema = z.object({
  id: z.string().min(1),
  locationId: z.string().min(1),
  order: z.number().int().nonnegative(),
  type: z.enum(["arrive", "inspect", "talk", "purchase", "observe", "leave", "transition"]),
  objectRef: z.string().min(1).optional(),
  characterRef: z.string().min(1).optional(),
  evidence: z.array(SourceEvidenceSchema).optional()
}).strict();

export const DialogueCandidateSchema = z.object({
  speakerId: z.string().min(1),
  text: z.string().min(1),
  source: z.enum(["exact_quote", "reconstructed", "generic_contextual", "muji_observation", "silent_beat"]),
  evidence: z.array(SourceEvidenceSchema).optional()
}).strict();

export const QuoteNodeSchema = z.object({
  id: z.string().min(1),
  text: z.string().min(1),
  speakerId: z.string().min(1).optional(),
  evidence: z.array(SourceEvidenceSchema)
}).strict();

export const ChapterPlanSchema = z.object({
  estimatedMinutes: z.number().int().min(1).max(8),
  guided: z.boolean(),
  objectiveIds: z.array(z.string().min(1)).optional(),
  evidence: z.array(SourceEvidenceSchema).optional()
}).strict();

export const MemoryGraphSchema = z.object({
  version: z.string(),
  entryId: z.string(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  title: z.string(),
  summary: z.string().optional(),
  mood: MoodSchema.optional(),
  weather: WeatherSchema.optional(),
  characters: z.array(CharacterNodeSchema).optional(),
  locations: z.array(LocationNodeSchema),
  events: z.array(EventNodeSchema),
  objects: z.array(ObjectNodeSchema).optional(),
  dialogueCandidates: z.array(DialogueCandidateSchema).optional(),
  quotes: z.array(QuoteNodeSchema).optional(),
  chapterPlan: ChapterPlanSchema
}).strict();

export type Confidence = z.infer<typeof ConfidenceSchema>;
export type SourceEvidence = z.infer<typeof SourceEvidenceSchema>;
export type Mood = z.infer<typeof MoodSchema>;
export type Weather = z.infer<typeof WeatherSchema>;
export type CharacterNode = z.infer<typeof CharacterNodeSchema>;
export type LocationNode = z.infer<typeof LocationNodeSchema>;
export type EventNode = z.infer<typeof EventNodeSchema>;
export type ObjectNode = z.infer<typeof ObjectNodeSchema>;
export type DialogueCandidate = z.infer<typeof DialogueCandidateSchema>;
export type QuoteNode = z.infer<typeof QuoteNodeSchema>;
export type ChapterPlan = z.infer<typeof ChapterPlanSchema>;
export type MemoryGraph = z.infer<typeof MemoryGraphSchema>;
