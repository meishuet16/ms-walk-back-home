import type { MiniGameId, MiniGamesState } from "./games/MiniGamesState.js";

export function renderMiniGamesHome(): string {
  const games: Array<{ id: MiniGameId; icon: string; name: string; description: string }> = [
    { id: "2048", icon: "▦", name: "2048 / Number Merge", description: "Slide matching numbers together." },
    { id: "minesweeper", icon: "✹", name: "Minesweeper", description: "Clear the field and mark the mines." },
    { id: "memory-match", icon: "♡", name: "Memory Match", description: "Find each gentle pair." },
    { id: "lights-out", icon: "✦", name: "Lights Out", description: "Turn every light off." }
  ];
  return `<section class="mini-games-home"><p class="mini-games-intro">A few small things for a quiet pause.</p><div class="mini-games-grid">${games.map((game) => `<button class="mini-game-card" data-action="mini-game-select" data-game="${game.id}"><span class="mini-game-card-icon" aria-hidden="true">${game.icon}</span><strong>${game.name}</strong><small>${game.description}</small></button>`).join("")}</div></section>`;
}

export function renderMiniGame(id: MiniGameId, state: MiniGamesState, flagMode: boolean, elapsedSeconds: number): string {
  if (id === "2048") return render2048(state);
  if (id === "minesweeper") return renderMinesweeper(state, flagMode, elapsedSeconds);
  if (id === "memory-match") return renderMemoryMatch(state);
  return renderLightsOut(state);
}

function render2048(state: MiniGamesState): string {
  const game = state.game2048;
  return `<section class="mini-game-screen game-2048"><div class="mini-game-stats"><span>Score <strong>${game.score}</strong></span><span>Best <strong>${game.bestScore}</strong></span></div><div class="game-2048-board" data-game-board="2048" aria-label="2048 board">${game.board.map((value, index) => `<button class="game-2048-cell tile-${value}" data-action="mini-2048-cell" data-index="${index}" aria-label="${value || "empty"}">${value || ""}</button>`).join("")}</div><p class="mini-game-status">${game.status === "won" ? "You made 2048." : game.status === "game-over" ? "No more moves." : "Swipe or use the arrow keys."}</p><div class="mini-game-actions"><button data-action="mini-2048-restart">Restart</button><button data-action="mini-game-select" data-game="minesweeper">Try another game</button></div></section>`;
}

function renderMinesweeper(state: MiniGamesState, flagMode: boolean, elapsedSeconds: number): string {
  const snapshot = state.minesweeper;
  const game = snapshot.game;
  const cells = game.board.map((cell, index) => {
    const content = cell.flagged ? "⚑" : cell.revealed ? (cell.mine ? "✹" : cell.adjacent || "") : "";
    return `<button class="minesweeper-cell ${cell.revealed ? "revealed" : "hidden"} ${cell.flagged ? "flagged" : ""}" data-action="mini-minesweeper-cell" data-index="${index}" aria-label="Cell ${index + 1}">${content}</button>`;
  }).join("");
  const status = game.status === "won" ? "Field clear." : game.status === "lost" ? "A mine was found." : flagMode ? "Tap cells to place flags." : "Tap cells to reveal them.";
  return `<section class="mini-game-screen minesweeper-screen"><div class="mini-game-stats"><span>${snapshot.difficulty === "small" ? "Small" : "Medium"}</span><span>Time <strong>${elapsedSeconds}s</strong></span><span>Flags <strong>${game.board.filter((cell) => cell.flagged).length}</strong></span></div><div class="minesweeper-difficulty"><button class="${snapshot.difficulty === "small" ? "selected" : ""}" data-action="mini-minesweeper-difficulty" data-difficulty="small">Small</button><button class="${snapshot.difficulty === "medium" ? "selected" : ""}" data-action="mini-minesweeper-difficulty" data-difficulty="medium">Medium</button><button class="${flagMode ? "selected" : ""}" data-action="mini-minesweeper-flag-mode">${flagMode ? "Flag mode on" : "Flag mode"}</button></div><div class="minesweeper-board" data-game-board="minesweeper" style="--minesweeper-columns:${game.width}" aria-label="Minesweeper board">${cells}</div><p class="mini-game-status">${status}</p><div class="mini-game-actions"><button data-action="mini-minesweeper-restart">Restart</button></div></section>`;
}

function renderMemoryMatch(state: MiniGamesState): string {
  const game = state.memoryMatch;
  return `<section class="mini-game-screen memory-match-screen"><div class="mini-game-stats"><span>Moves <strong>${game.moves}</strong></span><span>Best <strong>${game.bestMoves ?? "—"}</strong></span></div><div class="memory-match-board" data-game-board="memory-match">${game.cards.map((card, index) => `<button class="memory-card ${card.revealed || card.matched ? "revealed" : "hidden"} ${card.matched ? "matched" : ""}" data-action="mini-memory-card" data-index="${index}" aria-label="Memory card ${index + 1}">${card.revealed || card.matched ? card.symbol : "?"}</button>`).join("")}</div><p class="mini-game-status">${game.status === "complete" ? "Every pair found." : game.flippedIndices.length === 2 ? "Not a pair yet." : "Find the matching symbols."}</p><div class="mini-game-actions"><button data-action="mini-memory-restart">Restart</button></div></section>`;
}

function renderLightsOut(state: MiniGamesState): string {
  const game = state.lightsOut;
  return `<section class="mini-game-screen lights-out-screen"><div class="mini-game-stats"><span>Moves <strong>${game.moves}</strong></span><span>Best <strong>${game.bestMoves ?? "—"}</strong></span></div><div class="lights-out-board" data-game-board="lights-out" style="--lights-out-size:${game.size}" aria-label="Lights Out board">${game.board.map((light, index) => `<button class="lights-out-cell ${light ? "on" : "off"}" data-action="mini-lights-out-cell" data-index="${index}" aria-label="Light ${index + 1} ${light ? "on" : "off"}">${light ? "●" : ""}</button>`).join("")}</div><p class="mini-game-status">${game.status === "solved" ? "All lights are out." : "Tap a light and its neighbours."}</p><div class="mini-game-actions"><button data-action="mini-lights-out-restart">New puzzle</button></div></section>`;
}
