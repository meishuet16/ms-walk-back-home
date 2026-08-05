import type { DiaryEntry } from "../schemas/diary-entry";

export const fictionalDiaryEntries: DiaryEntry[] = [
  {
    id: "fixture-entry-001",
    entryDate: "2030-01-01",
    title: "A fictional bakery day",
    body: "Friend A and the narrator visited a small bakery after a blue-hour walk.",
    mood: "nostalgic",
    weather: "sunny",
    privacyTag: "fictional",
    createdAt: "2030-01-01T10:00:00.000Z",
    updatedAt: "2030-01-01T10:00:00.000Z"
  },
  {
    id: "fixture-entry-002",
    entryDate: "2030-01-02",
    title: "Lanterns on the quiet road",
    body: "A fictional evening route passed warm lamps, rain ripples, and one closed shop.",
    mood: "calm",
    weather: "mist",
    privacyTag: "fictional",
    createdAt: "2030-01-02T11:00:00.000Z",
    updatedAt: "2030-01-02T11:00:00.000Z"
  }
];
