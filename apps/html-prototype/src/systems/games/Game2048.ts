export type Game2048Direction = "left" | "right" | "up" | "down";
export type Game2048Status = "playing" | "won" | "game-over";

export type Game2048State = {
  version: 1;
  board: number[];
  score: number;
  bestScore: number;
  status: Game2048Status;
};

const BOARD_SIZE = 4;
const BOARD_CELLS = BOARD_SIZE * BOARD_SIZE;

export function createInitial2048State(random = Math.random): Game2048State {
  let board = Array<number>(BOARD_CELLS).fill(0);
  board = addRandomTile(board, random);
  board = addRandomTile(board, random);
  return { version: 1, board, score: 0, bestScore: 0, status: "playing" };
}

export function move2048(state: Game2048State, direction: Game2048Direction, random = Math.random): Game2048State {
  if (state.status !== "playing") return state;
  const next = Array<number>(BOARD_CELLS).fill(0);
  let scoreGain = 0;
  for (let line = 0; line < BOARD_SIZE; line += 1) {
    const indexes = indexesForLine(line, direction);
    const values = indexes.map((index) => state.board[index]);
    const result = slideLine(values);
    scoreGain += result.score;
    result.values.forEach((value, offset) => { next[indexes[offset]] = value; });
  }
  if (next.every((value, index) => value === state.board[index])) return state;
  const board = addRandomTile(next, random);
  const score = state.score + scoreGain;
  const status: Game2048Status = board.some((value) => value >= 2048) ? "won" : is2048GameOver(board) ? "game-over" : "playing";
  return { ...state, board, score, bestScore: Math.max(state.bestScore, score), status };
}

export function is2048GameOver(board: number[]): boolean {
  if (board.some((value) => value === 0)) return false;
  for (let row = 0; row < BOARD_SIZE; row += 1) {
    for (let column = 0; column < BOARD_SIZE; column += 1) {
      const index = row * BOARD_SIZE + column;
      if (column < BOARD_SIZE - 1 && board[index] === board[index + 1]) return false;
      if (row < BOARD_SIZE - 1 && board[index] === board[index + BOARD_SIZE]) return false;
    }
  }
  return true;
}

export function normalize2048State(value: unknown): Game2048State {
  if (!isRecord(value) || !Array.isArray(value.board) || value.board.length !== BOARD_CELLS || !value.board.every((tile) => Number.isInteger(tile) && tile >= 0)) return createInitial2048State();
  const board = value.board as number[];
  const score = typeof value.score === "number" && Number.isFinite(value.score) && value.score >= 0 ? value.score : 0;
  const bestScore = typeof value.bestScore === "number" && Number.isFinite(value.bestScore) && value.bestScore >= score ? value.bestScore : score;
  const status = value.status === "won" || value.status === "game-over" || value.status === "playing" ? value.status : is2048GameOver(board) ? "game-over" : "playing";
  return { version: 1, board: [...board], score, bestScore, status };
}

function indexesForLine(line: number, direction: Game2048Direction): number[] {
  if (direction === "left") return Array.from({ length: BOARD_SIZE }, (_, column) => line * BOARD_SIZE + column);
  if (direction === "right") return Array.from({ length: BOARD_SIZE }, (_, column) => line * BOARD_SIZE + BOARD_SIZE - 1 - column);
  if (direction === "up") return Array.from({ length: BOARD_SIZE }, (_, row) => row * BOARD_SIZE + line);
  return Array.from({ length: BOARD_SIZE }, (_, row) => (BOARD_SIZE - 1 - row) * BOARD_SIZE + line);
}

function slideLine(values: number[]): { values: number[]; score: number } {
  const compact = values.filter((value) => value > 0);
  const result: number[] = [];
  let score = 0;
  for (let index = 0; index < compact.length; index += 1) {
    if (compact[index] === compact[index + 1]) {
      const merged = compact[index] * 2;
      result.push(merged);
      score += merged;
      index += 1;
    } else result.push(compact[index]);
  }
  while (result.length < BOARD_SIZE) result.push(0);
  return { values: result, score };
}

function addRandomTile(board: number[], random: () => number): number[] {
  const empty = board.flatMap((value, index) => value === 0 ? [index] : []);
  if (!empty.length) return board;
  const selected = empty[Math.min(empty.length - 1, Math.max(0, Math.floor(random() * empty.length)))];
  const next = [...board];
  next[selected] = random() < 0.9 ? 2 : 4;
  return next;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object";
}
