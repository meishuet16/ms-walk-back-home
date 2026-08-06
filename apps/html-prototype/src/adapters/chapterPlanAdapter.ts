import type { HtmlChapterScene } from "../types.js";
import { bakeryChapter } from "../fixtures/chapterPlan.js";

export type ChapterPlanLike = {
  id?: string;
  date?: string;
  title?: string;
  scenes?: unknown[];
  mood?: { primary?: string } | string;
  weather?: { condition?: string } | string;
};

export function chapterPlanToHtmlScene(input: ChapterPlanLike = {}): HtmlChapterScene {
  return {
    ...bakeryChapter,
    id: input.id ?? bakeryChapter.id,
    date: input.date ?? bakeryChapter.date,
    title: input.title ?? bakeryChapter.title,
    mood: typeof input.mood === "string" ? input.mood : input.mood?.primary ?? bakeryChapter.mood,
    weather: typeof input.weather === "string" ? input.weather : input.weather?.condition ?? bakeryChapter.weather
  };
}
