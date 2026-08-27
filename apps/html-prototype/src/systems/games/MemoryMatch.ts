export type MemoryMatchStatus = "playing" | "complete";
export type MemoryCard = { id: number; pairId: string; symbol: string; revealed: boolean; matched: boolean };
export type MemoryMatchState = { version: 1; cards: MemoryCard[]; flippedIndices: number[]; moves: number; bestMoves: number | null; status: MemoryMatchStatus };

const symbols = ["☾", "★", "✿", "✉", "☂", "❧", "☕", "♡"];

export function createMemoryMatchState(random = Math.random): MemoryMatchState {
  const cards = symbols.flatMap((symbol, pairIndex) => [0, 1].map(() => ({ id: 0, pairId: `pair-${pairIndex}`, symbol, revealed: false, matched: false })));
  for (let index = cards.length - 1; index > 0; index -= 1) {
    const swap = Math.min(index, Math.max(0, Math.floor(random() * (index + 1))));
    [cards[index], cards[swap]] = [cards[swap], cards[index]];
  }
  return { version: 1, cards: cards.map((card, id) => ({ ...card, id })), flippedIndices: [], moves: 0, bestMoves: null, status: "playing" };
}

export function flipMemoryCard(state: MemoryMatchState, index: number): MemoryMatchState {
  if (state.status === "complete" || !state.cards[index] || state.cards[index].matched || state.cards[index].revealed) return state;
  let next = hideMismatchedMemoryCards(state);
  next = { ...next, cards: next.cards.map((card, cardIndex) => cardIndex === index ? { ...card, revealed: true } : card), flippedIndices: [...next.flippedIndices, index] };
  if (next.flippedIndices.length < 2) return next;
  const [firstIndex, secondIndex] = next.flippedIndices;
  const first = next.cards[firstIndex];
  const second = next.cards[secondIndex];
  const moves = next.moves + 1;
  if (first.pairId !== second.pairId) return { ...next, moves };
  const cards = next.cards.map((card, cardIndex) => cardIndex === firstIndex || cardIndex === secondIndex ? { ...card, matched: true } : card);
  const complete = cards.every((card) => card.matched);
  return { ...next, cards, flippedIndices: [], moves, bestMoves: complete ? Math.min(next.bestMoves ?? Number.POSITIVE_INFINITY, moves) : next.bestMoves, status: complete ? "complete" : "playing" };
}

export function hideMismatchedMemoryCards(state: MemoryMatchState): MemoryMatchState {
  if (state.flippedIndices.length !== 2) return state;
  const [firstIndex, secondIndex] = state.flippedIndices;
  if (state.cards[firstIndex]?.pairId === state.cards[secondIndex]?.pairId) return { ...state, flippedIndices: [] };
  return { ...state, cards: state.cards.map((card, index) => state.flippedIndices.includes(index) ? { ...card, revealed: false } : card), flippedIndices: [] };
}

export function normalizeMemoryMatchState(value: unknown): MemoryMatchState {
  if (!isRecord(value) || !Array.isArray(value.cards) || value.cards.length !== symbols.length * 2 || !value.cards.every((card) => isRecord(card) && Number.isInteger(card.id) && typeof card.pairId === "string" && typeof card.symbol === "string" && typeof card.revealed === "boolean" && typeof card.matched === "boolean")) return createMemoryMatchState();
  const cards = (value.cards as MemoryCard[]).map((card) => ({ ...card }));
  if (new Set(cards.map((card) => card.pairId)).size !== symbols.length || cards.some((card) => cards.filter((candidate) => candidate.pairId === card.pairId).length !== 2)) return createMemoryMatchState();
  const flippedIndices = Array.isArray(value.flippedIndices) ? value.flippedIndices.filter((index): index is number => Number.isInteger(index) && index >= 0 && index < cards.length && cards[index].revealed && !cards[index].matched).slice(0, 2) : [];
  const moves = typeof value.moves === "number" && value.moves >= 0 ? value.moves : 0;
  const status = value.status === "complete" || value.status === "playing" ? value.status : "playing";
  return { version: 1, cards, flippedIndices, moves, bestMoves: typeof value.bestMoves === "number" && value.bestMoves >= 0 ? value.bestMoves : null, status };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object";
}
