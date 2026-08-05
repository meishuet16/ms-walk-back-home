import { MemoryGraphSchema, type MemoryGraph } from "../schemas/memory-graph";
import type { DiaryParser, DiaryParserOptions, DiaryParserResult } from "./types";

type MoodPrimary = NonNullable<MemoryGraph["mood"]>["primary"];
type WeatherCondition = NonNullable<MemoryGraph["weather"]>["condition"];

export function createFixtureDiaryParser(): DiaryParser {
  return {
    async parse(entry, options) {
      const graph: MemoryGraph = buildFixtureGraph(entry, options);
      const parsed = MemoryGraphSchema.safeParse(graph);

      if (!parsed.success) {
        return {
          state: "failed",
          graph: null,
          errors: parsed.error.issues.map((issue) => `${issue.path.join(".") || "graph"}: ${issue.message}`)
        };
      }

      return {
        state: "playable",
        graph: parsed.data,
        errors: []
      };
    }
  };
}

function buildFixtureGraph(
  entry: Parameters<DiaryParser["parse"]>[0],
  options?: DiaryParserOptions
): MemoryGraph {
  const lower = `${entry.title} ${entry.body}`.toLowerCase();
  const module = options?.forceInvalidModule
    ? "invalid_module"
    : lower.includes("bakery")
      ? "bakery_shop"
      : lower.includes("road")
        ? "outdoor_road"
        : "home_room";

  return {
    version: "1.0",
    entryId: entry.id,
    date: entry.entryDate,
    title: entry.title,
    summary: "Fixture parser generated a deterministic fictional chapter plan.",
    mood: {
      primary: moodFromEntry(entry.mood),
      intensity: 0.6,
      evidence: [{ source: "fixture", note: "Deterministic fixture mood", confidence: 0.7 }]
    },
    weather: {
      condition: weatherFromEntry(entry.weather),
      timeOfDay: "unknown",
      evidence: [{ source: "fixture", note: "Deterministic fixture weather", confidence: 0.6 }]
    },
    characters: [],
    locations: [
      {
        id: "loc_primary",
        module: module as MemoryGraph["locations"][number]["module"],
        order: 1,
        label: "fixture location",
        evidence: [{ source: "fixture", note: "Selected from fictional diary keywords", confidence: 0.75 }]
      }
    ],
    events: [
      {
        id: "evt_01",
        locationId: "loc_primary",
        order: 1,
        type: "inspect",
        objectRef: "obj_memory_anchor",
        evidence: [{ source: "fixture", note: "Deterministic fixture objective", confidence: 0.75 }]
      }
    ],
    objects: [
      {
        id: "obj_memory_anchor",
        type: "memory_anchor",
        label: "fictional keepsake",
        evidence: [{ source: "fixture", note: "Generic non-identifying object", confidence: 0.6 }]
      }
    ],
    dialogueCandidates: [
      {
        speakerId: "muji",
        text: "Memory preserved.",
        source: "muji_observation",
        evidence: [{ source: "fixture", note: "Deterministic Muji fallback line", confidence: 0.8 }]
      }
    ],
    quotes: [],
    chapterPlan: {
      estimatedMinutes: 4,
      guided: true,
      objectiveIds: ["evt_01"],
      evidence: [{ source: "fixture", note: "Fixture chapter plan", confidence: 0.8 }]
    }
  };
}

function moodFromEntry(mood: string | undefined): MoodPrimary {
  switch (mood) {
    case "calm":
    case "joyful":
    case "nostalgic":
    case "quiet":
    case "sad":
    case "tender":
    case "anxious":
    case "hopeful":
      return mood;
    default:
      return "quiet";
  }
}

function weatherFromEntry(weather: string | undefined): WeatherCondition {
  if (!weather) {
    return "unknown";
  }
  const lower = weather.toLowerCase();
  if (weather.includes("晴") || lower.includes("sun")) {
    return "sunny";
  }
  if (weather.includes("雨") || lower.includes("rain")) {
    return "rain";
  }
  if (lower.includes("mist")) {
    return "mist";
  }
  if (lower.includes("cloud")) {
    return "cloudy";
  }
  return "unknown";
}
