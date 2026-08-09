import type { DiaryMood } from "../types.js";

export type DiaryMoodOption = {
  value: DiaryMood;
  label: string;
  expression: "soft-frown" | "flat" | "dots" | "smile" | "sparkle-smile";
};

export const diaryMoodOptions: DiaryMoodOption[] = [
  { value: "sad", label: "难过", expression: "soft-frown" },
  { value: "calm", label: "平静", expression: "flat" },
  { value: "blank", label: "发呆", expression: "dots" },
  { value: "happy", label: "开心", expression: "smile" },
  { value: "excited", label: "超开心", expression: "sparkle-smile" }
];

export function isDiaryMood(value: string): value is DiaryMood {
  return diaryMoodOptions.some((mood) => mood.value === value);
}

export function normalizeDiaryMood(value: unknown): DiaryMood {
  return typeof value === "string" && isDiaryMood(value) ? value : "calm";
}
