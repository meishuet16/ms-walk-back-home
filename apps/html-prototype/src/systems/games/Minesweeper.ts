export type MinesweeperDifficulty = "small" | "medium";
export type MinesweeperStatus = "ready" | "playing" | "won" | "lost";
export type MinesweeperCell = { mine: boolean; adjacent: number; revealed: boolean; flagged: boolean };
export type MinesweeperGameState = {
  version: 1;
  difficulty: MinesweeperDifficulty;
  width: number;
  height: number;
  mineCount: number;
  board: MinesweeperCell[];
  status: MinesweeperStatus;
  elapsedSeconds: number;
  startedAt: number | null;
};

const configs: Record<MinesweeperDifficulty, { width: number; height: number; mines: number }> = {
  small: { width: 8, height: 8, mines: 10 },
  medium: { width: 12, height: 12, mines: 24 }
};

export function createMinesweeperState(difficulty: MinesweeperDifficulty = "small", random = Math.random): MinesweeperGameState {
  const config = configs[difficulty];
  const cells = config.width * config.height;
  const candidates = Array.from({ length: cells }, (_, index) => index);
  for (let index = candidates.length - 1; index > 0; index -= 1) {
    const swap = Math.min(index, Math.max(0, Math.floor(random() * (index + 1))));
    [candidates[index], candidates[swap]] = [candidates[swap], candidates[index]];
  }
  const mines = new Set(candidates.slice(0, config.mines));
  const board = Array.from({ length: cells }, (_, index) => ({ mine: mines.has(index), adjacent: 0, revealed: false, flagged: false }));
  board.forEach((cell, index) => { cell.adjacent = neighbors(index, config.width, config.height).filter((neighbor) => board[neighbor].mine).length; });
  return { version: 1, difficulty, width: config.width, height: config.height, mineCount: config.mines, board, status: "ready", elapsedSeconds: 0, startedAt: null };
}

export function revealMinesweeperCell(state: MinesweeperGameState, index: number, now = Date.now()): MinesweeperGameState {
  if (state.status === "won" || state.status === "lost" || !state.board[index] || state.board[index].flagged || state.board[index].revealed) return state;
  const next = cloneState(state);
  if (next.status === "ready") { next.status = "playing"; next.startedAt = now; }
  if (next.board[index].mine) {
    next.status = "lost";
    next.board = next.board.map((cell) => cell.mine ? { ...cell, revealed: true } : cell);
    next.elapsedSeconds = minesweeperElapsedSeconds(next, now);
    next.startedAt = null;
    return next;
  }
  const queue = [index];
  const seen = new Set<number>();
  while (queue.length) {
    const current = queue.shift()!;
    if (seen.has(current)) continue;
    seen.add(current);
    const cell = next.board[current];
    if (cell.flagged || cell.mine) continue;
    cell.revealed = true;
    if (cell.adjacent === 0) for (const neighbor of neighbors(current, next.width, next.height)) if (!next.board[neighbor].revealed) queue.push(neighbor);
  }
  if (next.board.every((cell) => cell.mine || cell.revealed)) next.status = "won";
  next.elapsedSeconds = minesweeperElapsedSeconds(next, now);
  next.startedAt = next.status === "playing" ? now : null;
  return next;
}

export function toggleMinesweeperFlag(state: MinesweeperGameState, index: number): MinesweeperGameState {
  if (state.status === "won" || state.status === "lost" || !state.board[index] || state.board[index].revealed) return state;
  const next = cloneState(state);
  next.board[index].flagged = !next.board[index].flagged;
  return next;
}

export function minesweeperElapsedSeconds(state: MinesweeperGameState, now = Date.now()): number {
  return state.startedAt === null ? state.elapsedSeconds : state.elapsedSeconds + Math.max(0, Math.floor((now - state.startedAt) / 1000));
}

export function normalizeMinesweeperState(value: unknown, difficulty: MinesweeperDifficulty = "small"): MinesweeperGameState {
  const fallback = createMinesweeperState(difficulty);
  if (!isRecord(value) || value.difficulty !== difficulty || value.width !== fallback.width || value.height !== fallback.height || value.mineCount !== fallback.mineCount || !Array.isArray(value.board) || value.board.length !== fallback.board.length) return fallback;
  const board = value.board as unknown[];
  if (!board.every((cell) => {
    if (!isRecord(cell)) return false;
    return typeof cell.mine === "boolean" && typeof cell.adjacent === "number" && Number.isInteger(cell.adjacent) && cell.adjacent >= 0 && cell.adjacent <= 8 && typeof cell.revealed === "boolean" && typeof cell.flagged === "boolean";
  })) return fallback;
  if (board.filter((cell) => (cell as MinesweeperCell).mine).length !== fallback.mineCount) return fallback;
  return {
    version: 1,
    difficulty,
    width: fallback.width,
    height: fallback.height,
    mineCount: fallback.mineCount,
    board: board.map((cell) => ({ ...(cell as MinesweeperCell) })),
    status: value.status === "ready" || value.status === "playing" || value.status === "won" || value.status === "lost" ? value.status : "ready",
    elapsedSeconds: typeof value.elapsedSeconds === "number" && value.elapsedSeconds >= 0 ? value.elapsedSeconds : 0,
    startedAt: typeof value.startedAt === "number" ? value.startedAt : null
  };
}

function neighbors(index: number, width: number, height: number): number[] {
  const row = Math.floor(index / width);
  const column = index % width;
  const result: number[] = [];
  for (let dy = -1; dy <= 1; dy += 1) for (let dx = -1; dx <= 1; dx += 1) {
    if (!dx && !dy) continue;
    const nextRow = row + dy;
    const nextColumn = column + dx;
    if (nextRow >= 0 && nextRow < height && nextColumn >= 0 && nextColumn < width) result.push(nextRow * width + nextColumn);
  }
  return result;
}

function cloneState(state: MinesweeperGameState): MinesweeperGameState {
  return { ...state, board: state.board.map((cell) => ({ ...cell })) };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object";
}
