export type CapsuleStatus = "machine" | "kept";

export type CapsuleThought = {
  id: string;
  text: string;
  createdAt: string;
  status: CapsuleStatus;
  drawCount: number;
  lastDrawnAt?: string;
};

export type CapsuleMachineState = {
  version: 1;
  savedAt: string;
  thoughts: CapsuleThought[];
};

export const CAPSULE_STORAGE_KEY = "walk-back-home:capsule-machine:v1";
export const CAPSULE_TEXT_LIMIT = 200;

function cleanText(text: string): string {
  return text.replace(/\r\n/g, "\n").trim().slice(0, CAPSULE_TEXT_LIMIT);
}

export function createCapsuleMachineState(now = new Date()): CapsuleMachineState {
  return { version: 1, savedAt: now.toISOString(), thoughts: [] };
}

export function normalizeCapsuleMachineState(value: unknown, now = new Date()): CapsuleMachineState {
  if (!value || typeof value !== "object") return createCapsuleMachineState(now);
  const candidate = value as Partial<CapsuleMachineState>;
  const thoughts = Array.isArray(candidate.thoughts)
    ? candidate.thoughts.flatMap((entry) => {
        if (!entry || typeof entry !== "object") return [];
        const raw = entry as Partial<CapsuleThought>;
        const text = cleanText(typeof raw.text === "string" ? raw.text : "");
        if (!text || typeof raw.id !== "string" || typeof raw.createdAt !== "string") return [];
        return [{
          id: raw.id,
          text,
          createdAt: raw.createdAt,
          status: raw.status === "kept" ? "kept" as const : "machine" as const,
          drawCount: Number.isFinite(raw.drawCount) ? Math.max(0, Math.floor(raw.drawCount ?? 0)) : 0,
          lastDrawnAt: typeof raw.lastDrawnAt === "string" ? raw.lastDrawnAt : undefined
        }];
      })
    : [];
  return { version: 1, savedAt: typeof candidate.savedAt === "string" ? candidate.savedAt : now.toISOString(), thoughts };
}

export function addCapsuleThought(
  state: CapsuleMachineState,
  text: string,
  now = new Date(),
  id = typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `capsule-${now.getTime()}`
): CapsuleMachineState {
  const cleaned = cleanText(text);
  if (!cleaned) return state;
  const next: CapsuleThought = {
    id,
    text: cleaned,
    createdAt: now.toISOString(),
    status: "machine",
    drawCount: 0
  };
  return { ...state, savedAt: now.toISOString(), thoughts: [next, ...state.thoughts] };
}

export function drawCapsuleThought(
  state: CapsuleMachineState,
  random: () => number = Math.random,
  now = new Date()
): { state: CapsuleMachineState; thought: CapsuleThought } | null {
  const pool = state.thoughts.filter((thought) => thought.status === "machine");
  if (!pool.length) return null;
  const index = Math.min(pool.length - 1, Math.max(0, Math.floor(random() * pool.length)));
  const selected = pool[index];
  const updated: CapsuleThought = {
    ...selected,
    drawCount: selected.drawCount + 1,
    lastDrawnAt: now.toISOString()
  };
  return {
    thought: updated,
    state: {
      ...state,
      savedAt: now.toISOString(),
      thoughts: state.thoughts.map((thought) => thought.id === updated.id ? updated : thought)
    }
  };
}

export function setCapsuleStatus(state: CapsuleMachineState, id: string, status: CapsuleStatus, now = new Date()): CapsuleMachineState {
  if (!state.thoughts.some((thought) => thought.id === id)) return state;
  return {
    ...state,
    savedAt: now.toISOString(),
    thoughts: state.thoughts.map((thought) => thought.id === id ? { ...thought, status } : thought)
  };
}

export function machineCapsules(state: CapsuleMachineState): CapsuleThought[] {
  return state.thoughts.filter((thought) => thought.status === "machine");
}

export function keptCapsules(state: CapsuleMachineState): CapsuleThought[] {
  return state.thoughts
    .filter((thought) => thought.status === "kept")
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function loadCapsuleMachineState(storage: Pick<Storage, "getItem">, now = new Date()): CapsuleMachineState {
  const raw = storage.getItem(CAPSULE_STORAGE_KEY);
  if (!raw) return createCapsuleMachineState(now);
  try {
    return normalizeCapsuleMachineState(JSON.parse(raw), now);
  } catch {
    return createCapsuleMachineState(now);
  }
}

export function saveCapsuleMachineState(storage: Pick<Storage, "setItem">, state: CapsuleMachineState): void {
  storage.setItem(CAPSULE_STORAGE_KEY, JSON.stringify(state));
}
