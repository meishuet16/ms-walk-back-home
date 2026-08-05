import type { MemoryGraph } from "../schemas/memory-graph";

export const fictionalMemoryGraph: MemoryGraph = {
  version: "1.0",
  entryId: "fixture-001",
  date: "2030-01-01",
  title: "A fictional bakery day",
  summary: "Friend A and the narrator visited a small bakery.",
  mood: {
    primary: "nostalgic",
    intensity: 0.6
  },
  weather: {
    condition: "sunny",
    timeOfDay: "afternoon"
  },
  characters: [
    {
      id: "npc_friend_01",
      displayName: "Friend A",
      role: "friend"
    }
  ],
  locations: [
    {
      id: "loc_bakery",
      module: "bakery_shop",
      order: 1
    }
  ],
  events: [
    {
      id: "evt_01",
      locationId: "loc_bakery",
      order: 1,
      type: "inspect",
      objectRef: "obj_pastry"
    }
  ],
  objects: [
    {
      id: "obj_pastry",
      type: "food",
      label: "pastry"
    }
  ],
  dialogueCandidates: [
    {
      speakerId: "npc_friend_01",
      text: "This place smells good.",
      source: "reconstructed"
    }
  ],
  quotes: [],
  chapterPlan: {
    estimatedMinutes: 4,
    guided: true
  }
};
