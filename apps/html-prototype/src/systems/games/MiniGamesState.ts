import { createInitial2048State, normalize2048State, type Game2048State } from "./Game2048.js";
import { createMinesweeperState, normalizeMinesweeperState, type MinesweeperDifficulty, type MinesweeperGameState } from "./Minesweeper.js";
import { createMemoryMatchState, normalizeMemoryMatchState, type MemoryMatchState } from "./MemoryMatch.js";
import { createLightsOutState, normalizeLightsOutState, type LightsOutState } from "./LightsOut.js";

export type MiniGameId = "2048" | "minesweeper" | "memory-match" | "lights-out";
export type MiniGamesState = {
  version: 1;
  game2048: Game2048State;
  minesweeper: { version: 1; difficulty: MinesweeperDifficulty; game: MinesweeperGameState; bestTimes: { small: number | null; medium: number | null } };
  memoryMatch: MemoryMatchState;
  lightsOut: LightsOutState;
};

export function createDefaultMiniGamesState(random = Math.random): MiniGamesState {
  return {
    version: 1,
    game2048: createInitial2048State(random),
    minesweeper: { version: 1, difficulty: "small", game: createMinesweeperState("small", random), bestTimes: { small: null, medium: null } },
    memoryMatch: createMemoryMatchState(random),
    lightsOut: createLightsOutState(random)
  };
}

export function normalizeMiniGamesState(value: unknown): MiniGamesState {
  const fallback = createDefaultMiniGamesState();
  if (!isRecord(value)) return fallback;
  const difficulty: MinesweeperDifficulty = value.minesweeper && isRecord(value.minesweeper) && value.minesweeper.difficulty === "medium" ? "medium" : "small";
  const minesweeperValue = isRecord(value.minesweeper) ? value.minesweeper : {};
  const gameValue = minesweeperValue.game;
  const bestTimesValue = isRecord(minesweeperValue.bestTimes) ? minesweeperValue.bestTimes : {};
  return {
    version: 1,
    game2048: normalize2048State(value.game2048),
    minesweeper: {
      version: 1,
      difficulty,
      game: normalizeMinesweeperState(gameValue, difficulty),
      bestTimes: { small: validBestTime(bestTimesValue.small), medium: validBestTime(bestTimesValue.medium) }
    },
    memoryMatch: normalizeMemoryMatchState(value.memoryMatch),
    lightsOut: normalizeLightsOutState(value.lightsOut)
  };
}

function validBestTime(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 ? value : null;
}

function isRecord(value: unknown): value is Record<string, any> {
  return Boolean(value) && typeof value === "object";
}
