import { adjacentMonthKey, timelineCursorKeyForStep, type TimelineDateScope } from "./JournalModel.js";

export type JournalNavigationMode = "timeline" | "books" | "reader";

export type JournalReturnSnapshot = {
  mode: "timeline" | "books";
  monthKey: string;
  year: string;
  scrollTop: number;
};

export function createJournalReturnSnapshot(mode: "timeline" | "books", monthKey: string, year: string, scrollTop: number): JournalReturnSnapshot {
  return { mode, monthKey, year, scrollTop: Math.max(0, scrollTop) };
}

export function journalReturnTarget(snapshot: JournalReturnSnapshot): JournalReturnSnapshot {
  return { ...snapshot };
}

export type JournalNavigationState = {
  mode: JournalNavigationMode;
  timelineMonthKey: string;
  booksYear: string;
  booksMonthKey: string;
  timelineDateScope: TimelineDateScope;
  timelineDateFilter: string;
  timelineFilterAppliedMessage: string;
};

export function createJournalNavigationState(timelineMonthKey: string, booksMonthKey: string): JournalNavigationState {
  return {
    mode: "timeline",
    timelineMonthKey,
    booksYear: booksMonthKey.slice(0, 4),
    booksMonthKey,
    timelineDateScope: "all",
    timelineDateFilter: "",
    timelineFilterAppliedMessage: ""
  };
}

function availableMonthsForYear(year: string, availableMonthKeys: string[]): string[] {
  return availableMonthKeys.filter((key) => key.startsWith(`${year}-`)).sort((a, b) => b.localeCompare(a));
}

export function selectBooksYear(state: JournalNavigationState, year: string, availableMonthKeys: string[]): JournalNavigationState {
  const months = availableMonthsForYear(year, availableMonthKeys);
  return {
    ...state,
    mode: "books",
    booksYear: year,
    booksMonthKey: months[0] ?? `${year}-01`
  };
}

export function moveBooksMonth(state: JournalNavigationState, direction: -1 | 1, availableMonthKeys: string[]): JournalNavigationState {
  const months = [...availableMonthKeys].sort((a, b) => b.localeCompare(a));
  const currentIndex = months.indexOf(state.booksMonthKey);
  const nextIndex = currentIndex < 0 ? 0 : Math.max(0, Math.min(months.length - 1, currentIndex - direction));
  const nextMonthKey = months[nextIndex] ?? adjacentMonthKey(state.booksMonthKey, direction);
  return {
    ...state,
    mode: "books",
    booksYear: nextMonthKey.slice(0, 4),
    booksMonthKey: nextMonthKey
  };
}

export function moveTimelineMonth(state: JournalNavigationState, direction: -1 | 1, scope: TimelineDateScope): JournalNavigationState {
  return {
    ...state,
    mode: "timeline",
    timelineMonthKey: timelineCursorKeyForStep(state.timelineMonthKey, scope, direction),
    timelineDateFilter: "",
    timelineFilterAppliedMessage: ""
  };
}

export function selectTimelineYear(state: JournalNavigationState, year: string): JournalNavigationState {
  const month = state.timelineMonthKey.slice(5, 7) || "01";
  return {
    ...state,
    mode: "timeline",
    timelineMonthKey: `${year}-${month}`,
    timelineDateScope: "year",
    timelineDateFilter: "",
    timelineFilterAppliedMessage: `Year ${year}`
  };
}

export function selectJournalTab(state: JournalNavigationState, mode: JournalNavigationMode): JournalNavigationState {
  return { ...state, mode };
}
