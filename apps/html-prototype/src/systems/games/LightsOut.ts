export type LightsOutStatus = "playing" | "solved";
export type LightsOutState = { version: 1; size: number; board: boolean[]; moves: number; bestMoves: number | null; status: LightsOutStatus };

export function createLightsOutState(random = Math.random, size = 5): LightsOutState {
  const board = Array<boolean>(size * size).fill(false);
  const scrambleMoves = Math.max(8, size * 2);
  for (let step = 0; step < scrambleMoves; step += 1) {
    const raw = Math.floor(random() * board.length);
    const index = ((Number.isFinite(raw) ? raw : 0) + step * 7) % board.length;
    toggleCross(board, size, index);
  }
  return { version: 1, size, board, moves: 0, bestMoves: null, status: isLightsOutSolved(board) ? "solved" : "playing" };
}

export function toggleLightsOut(state: LightsOutState, index: number): LightsOutState {
  if (state.status === "solved" || index < 0 || index >= state.board.length) return state;
  const board = [...state.board];
  toggleCross(board, state.size, index);
  const moves = state.moves + 1;
  const solved = isLightsOutSolved(board);
  return { ...state, board, moves, status: solved ? "solved" : "playing", bestMoves: solved ? Math.min(state.bestMoves ?? Number.POSITIVE_INFINITY, moves) : state.bestMoves };
}

export function isLightsOutSolved(board: boolean[]): boolean {
  return board.every((light) => !light);
}

export function solveLightsOut(board: boolean[], size: number): number[] | null {
  const cells = size * size;
  if (board.length !== cells) return null;
  const matrix = Array.from({ length: cells }, (_, target) => {
    const row = Array<number>(cells + 1).fill(0);
    row[cells] = board[target] ? 1 : 0;
    for (const press of crossIndexes(target, size)) row[press] = 1;
    return row;
  });
  let pivotRow = 0;
  const pivots: number[] = [];
  for (let column = 0; column < cells && pivotRow < cells; column += 1) {
    const pivot = matrix.findIndex((row, index) => index >= pivotRow && row[column] === 1);
    if (pivot < 0) continue;
    [matrix[pivotRow], matrix[pivot]] = [matrix[pivot], matrix[pivotRow]];
    for (let row = 0; row < cells; row += 1) if (row !== pivotRow && matrix[row][column]) for (let value = column; value <= cells; value += 1) matrix[row][value] ^= matrix[pivotRow][value];
    pivots[pivotRow] = column;
    pivotRow += 1;
  }
  for (const row of matrix) if (row.slice(0, cells).every((value) => value === 0) && row[cells]) return null;
  const solution = Array<number>(cells).fill(0);
  for (let row = 0; row < pivotRow; row += 1) solution[pivots[row]] = matrix[row][cells];
  return solution.flatMap((value, index) => value ? [index] : []);
}

export function normalizeLightsOutState(value: unknown): LightsOutState {
  if (!isRecord(value) || value.size !== 5 || !Array.isArray(value.board) || value.board.length !== 25 || !value.board.every((light) => typeof light === "boolean")) return createLightsOutState();
  const board = [...value.board] as boolean[];
  const moves = typeof value.moves === "number" && value.moves >= 0 ? value.moves : 0;
  return { version: 1, size: 5, board, moves, bestMoves: typeof value.bestMoves === "number" && value.bestMoves >= 0 ? value.bestMoves : null, status: isLightsOutSolved(board) ? "solved" : "playing" };
}

function toggleCross(board: boolean[], size: number, index: number): void {
  for (const target of crossIndexes(index, size)) board[target] = !board[target];
}

function crossIndexes(index: number, size: number): number[] {
  const row = Math.floor(index / size);
  const column = index % size;
  return [index, row > 0 ? index - size : -1, row < size - 1 ? index + size : -1, column > 0 ? index - 1 : -1, column < size - 1 ? index + 1 : -1].filter((target) => target >= 0);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object";
}
