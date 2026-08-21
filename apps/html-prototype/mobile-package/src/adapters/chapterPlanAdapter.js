import { bakeryChapter } from "../fixtures/chapterPlan.js";
export function chapterPlanToHtmlScene(input = {}) {
    return {
        ...bakeryChapter,
        id: input.id ?? bakeryChapter.id,
        date: input.date ?? bakeryChapter.date,
        title: input.title ?? bakeryChapter.title,
        mood: typeof input.mood === "string" ? input.mood : input.mood?.primary ?? bakeryChapter.mood,
        weather: typeof input.weather === "string" ? input.weather : input.weather?.condition ?? bakeryChapter.weather
    };
}
