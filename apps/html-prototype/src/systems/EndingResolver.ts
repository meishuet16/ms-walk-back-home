import type { Tendencies } from "../types.js";

export type Ending = {
  id: string;
  title: string;
  body: string;
  lines: string[];
};

export function resolveEnding(t: Tendencies, hiddenObjectsFound = 0): Ending {
  if (hiddenObjectsFound >= 3 && t.companionship >= 3 && t.intervention === 0) {
    return {
      id: "bottle-day",
      title: "《水壶里的那一天》",
      body: "Muji remembers being left behind, and being found again.",
      lines: ["那一天没有消失。", "只是一直装在水壶里。"]
    };
  }
  if (t.intervention + t.concealment >= t.acceptance + t.honesty + 2) {
    return {
      id: "prettier-memory",
      title: "《更漂亮的回忆》",
      body: "The doors become brighter, but the voices behind them disappear.",
      lines: ["这里没有人受伤。", "也没有人真正来过。"]
    };
  }
  if (t.avoidance + t.distance >= t.closeness + t.acceptance + 2) {
    return {
      id: "unopened-door",
      title: "《没有打开的门》",
      body: "The forest grows darker, but the path remains.",
      lines: ["回家的路一直都在。", "只是今天，还没有准备好。"]
    };
  }
  if (t.closeness + t.companionship >= 4 && t.intervention <= 1) {
    return {
      id: "stay-with-you",
      title: "《留下来陪你》",
      body: "Muji becomes a small light for past selves who cannot yet open their doors.",
      lines: ["有些人需要回家。", "有些人愿意留下来，替他们点灯。"]
    };
  }
  return {
    id: "walk-home-together",
    title: "《一起走回去》",
    body: "Muji changes nothing. The past self walks home with Muji.",
    lines: ["我没有来救你。", "我只是来陪你走回家。"]
  };
}
