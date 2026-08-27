import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { createInitial2048State, is2048GameOver, move2048, normalize2048State } from "../src/systems/games/Game2048.js";
import { createMinesweeperState, minesweeperElapsedSeconds, revealMinesweeperCell, toggleMinesweeperFlag } from "../src/systems/games/Minesweeper.js";
import { createMemoryMatchState, flipMemoryCard, hideMismatchedMemoryCards } from "../src/systems/games/MemoryMatch.js";
import { createLightsOutState, isLightsOutSolved, solveLightsOut, toggleLightsOut } from "../src/systems/games/LightsOut.js";
import { createDefaultMiniGamesState, normalizeMiniGamesState } from "../src/systems/games/MiniGamesState.js";
import { SaveManager } from "../src/systems/SaveManager.js";
import { createBackupBundle, parseBackupBundle } from "../src/systems/BackupManager.js";

test("2048 moves in all directions, merges once, scores, and adds a tile only after a valid move", () => {
  const state = { ...createInitial2048State(() => 0), board: [2, 2, 2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], score: 0, bestScore: 0, status: "playing" as const };
  const moved = move2048(state, "left", () => 0);

  assert.deepEqual(moved.board.slice(0, 4), [4, 4, 2, 0]);
  assert.equal(moved.score, 8);
  assert.notDeepEqual(move2048(moved, "left", () => 0).board, moved.board);
  assert.deepEqual(move2048({ ...state, board: [2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] }, "left", () => 0).board, [2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
});

test("2048 handles vertical directions and detects game over", () => {
  const board = [2, 0, 0, 0, 2, 0, 0, 0, 4, 0, 0, 0, 4, 0, 0, 0];
  const moved = move2048({ ...createInitial2048State(() => 0), board, score: 0, bestScore: 0, status: "playing" }, "up", () => 0);

  assert.deepEqual(moved.board.slice(0, 4), [4, 2, 0, 0]);
  assert.equal(moved.board[4], 8);
  assert.equal(is2048GameOver([2, 4, 2, 4, 4, 2, 4, 2, 2, 4, 2, 4, 4, 2, 4, 2]), true);
});

test("2048 normalization recovers malformed boards without losing a safe default", () => {
  const normalized = normalize2048State({ board: [2], score: -4, bestScore: 7, status: "playing" });

  assert.equal(normalized.board.length, 16);
  assert.equal(normalized.score, 0);
  assert.equal(normalized.bestScore, 0);
});

test("Minesweeper computes counts, reveals floods, flags, and tracks elapsed time", () => {
  const initial = createMinesweeperState("small", () => 0);
  const flagged = toggleMinesweeperFlag(initial, 0);
  const unflagged = toggleMinesweeperFlag(flagged, 0);
  const revealed = revealMinesweeperCell(unflagged, 0, 1_000);

  assert.equal(initial.board.length, 64);
  assert.equal(initial.board.reduce((count, cell) => count + (cell.mine ? 1 : 0), 0), 10);
  assert.equal(flagged.board[0].flagged, true);
  assert.equal(unflagged.board[0].flagged, false);
  assert.equal(revealed.board[0].revealed, true);
  assert.ok(revealed.board.filter((cell) => cell.revealed).length >= 1);
  assert.equal(minesweeperElapsedSeconds({ ...revealed, startedAt: 1_000 }, 4_500), 3);
});

test("Minesweeper elapsed time advances from the last checkpoint and freezes on loss", () => {
  const initial = createMinesweeperState("small", () => 0);
  const firstIndex = initial.board.findIndex((cell) => !cell.mine);
  const first = revealMinesweeperCell(initial, firstIndex, 1_000);
  const secondIndex = first.board.findIndex((cell) => !cell.mine && !cell.revealed);
  const second = revealMinesweeperCell(first, secondIndex, 4_000);

  assert.equal(minesweeperElapsedSeconds(second, 5_000), 4);
  assert.ok(second.elapsedSeconds >= first.elapsedSeconds);

  const mineIndex = second.board.findIndex((cell) => cell.mine && !cell.revealed);
  const lost = revealMinesweeperCell(second, mineIndex, 7_000);
  assert.equal(lost.status, "lost");
  assert.equal(lost.startedAt, null);
  assert.equal(minesweeperElapsedSeconds(lost, 20_000), lost.elapsedSeconds);
});

test("Minesweeper timer display refreshes one label from the existing app loop", () => {
  const source = readFileSync("src/app.ts", "utf8");
  assert.match(source, /private refreshMiniGamesMinesweeperTimer\(/);
  const loop = source.slice(source.indexOf("private loop"), source.indexOf("private newMemory"));
  assert.match(loop, /refreshMiniGamesMinesweeperTimer\(\)/);
  assert.match(source, /data-minesweeper-elapsed/);
  assert.doesNotMatch(source, /setInterval\([\s\S]*minesweeper/);
});

test("Memory Match flips pairs, turns mismatches back, counts moves, and completes", () => {
  let state = createMemoryMatchState(() => 0);
  state = flipMemoryCard(state, 0);
  state = flipMemoryCard(state, 1);
  assert.equal(state.moves, 1);
  assert.equal(state.flippedIndices.length, 2);
  state = hideMismatchedMemoryCards(state);
  assert.equal(state.flippedIndices.length, 0);
  assert.equal(state.cards.every((card) => !card.revealed || card.matched), true);

  const pair = state.cards.findIndex((card) => !card.matched);
  const mate = state.cards.findIndex((card, index) => index !== pair && card.pairId === state.cards[pair].pairId);
  state = flipMemoryCard(flipMemoryCard(state, pair), mate);
  assert.equal(state.moves, 2);
  assert.equal(state.cards[pair].matched, true);
});

test("Lights Out toggles a cross, detects solved boards, and generates solvable puzzles", () => {
  const solved = { ...createLightsOutState(() => 0), board: Array(25).fill(false), moves: 0, status: "playing" as const };
  const toggled = toggleLightsOut(solved, 0);

  assert.equal(toggled.board[0], true);
  assert.equal(toggled.board[1], true);
  assert.equal(toggled.board[5], true);
  assert.equal(isLightsOutSolved(toggled.board.map(() => false)), true);
  const generated = createLightsOutState(() => 0);
  assert.ok(solveLightsOut(generated.board, generated.size));
});

test("Mini Games normalization repairs one malformed game without discarding valid games", () => {
  const valid = createDefaultMiniGamesState(() => 0);
  const normalized = normalizeMiniGamesState({ ...valid, game2048: { board: [1], score: -2 }, lightsOut: valid.lightsOut });

  assert.equal(normalized.game2048.board.length, 16);
  assert.deepEqual(normalized.lightsOut, valid.lightsOut);
});

test("Mini Games integration is modular, local-first, and additive to Toolbox", () => {
  const source = readFileSync("src/app.ts", "utf8");
  const model = readFileSync("src/systems/ToolboxModel.ts", "utf8");
  const view = readFileSync("src/systems/ToolboxView.ts", "utf8");
  assert.match(model, /mini-games/);
  assert.match(view, /renderMiniGames/);
  assert.match(source, /saveMiniGamesState/);
  assert.match(source, /loadMiniGamesState/);
  assert.match(source, /miniGamesState/);
  assert.doesNotMatch(readFileSync("src/systems/SupabaseSync.ts", "utf8"), /miniGames/);
});

test("Mini Games persist in a dedicated local namespace and recover malformed data", () => {
  const values = new Map<string, string>();
  Object.defineProperty(globalThis, "localStorage", { configurable: true, value: {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
    removeItem: (key: string) => values.delete(key)
  } });
  const manager = new SaveManager("fictional-user");
  const state = createDefaultMiniGamesState(() => 0);
  manager.saveMiniGamesState(state);
  assert.deepEqual(manager.loadMiniGamesState(), state);
  values.set("walk-back-home:html-prototype:v1:mini-games:owner:fictional-user", "{bad json");
  assert.equal(manager.loadMiniGamesState().game2048.board.length, 16);
});

test("Mini Games are included in backups and old backups receive a safe default", () => {
  const state = createDefaultMiniGamesState(() => 0);
  const bundle = createBackupBundle({ diaryLibrary: null, journey: null, reflectionWall: null, musicLibrary: null, personalPlayer: null, miniGamesState: state, blobs: [] });
  assert.deepEqual(parseBackupBundle(JSON.stringify(bundle))?.miniGamesState, state);
  const old = parseBackupBundle(JSON.stringify({ app: "walk-back-home-html-prototype", version: 1, blobs: [] }));
  assert.equal(old?.miniGamesState.game2048.board.length, 16);
});
