import type { MemoryGraph } from "../schemas/memory-graph";

export const fictionalMemoryGraph: MemoryGraph = {
  version: "1.0",
  entryId: "fixture-001",
  date: "2030-01-01",
  title: "A fictional bakery day",
  summary: "Friend A and the narrator visited a small bakery.",
  mood: {
    primary: "nostalgic",
    intensity: 0.6,
    evidence: [{ source: "fixture", note: "Fictional sample mood", confidence: 0.8 }]
  },
  weather: {
    condition: "sunny",
    timeOfDay: "afternoon",
    evidence: [{ source: "fixture", note: "Fictional sample weather", confidence: 0.8 }]
  },
  characters: [
    {
      id: "npc_friend_01",
      displayName: "Friend A",
      role: "friend",
      evidence: [{ source: "fixture", note: "Fictional sample character", confidence: 0.9 }]
    }
  ],
  locations: [
    {
      id: "loc_bakery",
      module: "bakery_shop",
      order: 1,
      label: "small bakery",
      evidence: [{ source: "fixture", note: "Fictional sample location", confidence: 0.9 }]
    }
  ],
  events: [
    {
      id: "evt_01",
      locationId: "loc_bakery",
      order: 1,
      type: "inspect",
      objectRef: "obj_pastry",
      evidence: [{ source: "fixture", note: "Fictional sample event", confidence: 0.9 }]
    }
  ],
  objects: [
    {
      id: "obj_pastry",
      type: "food",
      label: "pastry",
      evidence: [{ source: "fixture", note: "Fictional sample object", confidence: 0.9 }]
    }
  ],
  dialogueCandidates: [
    {
      speakerId: "npc_friend_01",
      text: "This place smells good.",
      source: "reconstructed",
      evidence: [{ source: "fixture", note: "Fictional sample dialogue", confidence: 0.7 }]
    }
  ],
  quotes: [],
  chapterPlan: {
    estimatedMinutes: 4,
    guided: true,
    objectiveIds: ["evt_01"],
    evidence: [{ source: "fixture", note: "Fictional sample chapter plan", confidence: 0.8 }]
  }
};
