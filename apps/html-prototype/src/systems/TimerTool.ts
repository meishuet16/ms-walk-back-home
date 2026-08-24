export type TimerMode = "timer" | "stopwatch";
export type TimerState = { mode: TimerMode; durationMs: number; startedAt: number | null; accumulatedMs: number; paused: boolean; finishedAt: number | null };

export function createTimerState(mode: TimerMode = "timer", durationMs = 0): TimerState {
  return { mode, durationMs: Math.max(0, durationMs), startedAt: null, accumulatedMs: 0, paused: true, finishedAt: null };
}

export function startTimer(state: TimerState, now: number): TimerState {
  if (!state.paused) return state;
  const resetFinished = state.mode === "timer" && state.finishedAt !== null;
  return { ...state, startedAt: now, accumulatedMs: resetFinished ? 0 : state.accumulatedMs, paused: false, finishedAt: null };
}

export function pauseTimer(state: TimerState, now: number): TimerState {
  if (state.paused || state.startedAt === null) return state;
  return { ...state, accumulatedMs: state.accumulatedMs + Math.max(0, now - state.startedAt), startedAt: null, paused: true };
}

export function resetTimer(state: TimerState): TimerState {
  return { ...state, startedAt: null, accumulatedMs: 0, paused: true, finishedAt: null };
}

export function elapsedMs(state: TimerState, now: number): number {
  return state.accumulatedMs + (state.startedAt === null ? 0 : Math.max(0, now - state.startedAt));
}

export function stopwatchElapsed(state: TimerState, now: number): number {
  return elapsedMs(state, now);
}

export function timerRemaining(state: TimerState, now: number): number {
  return Math.max(0, state.durationMs - elapsedMs(state, now));
}

export function completeTimerIfNeeded(state: TimerState, now: number): { state: TimerState; completed: boolean } {
  if (state.mode !== "timer" || state.paused || state.finishedAt !== null || state.durationMs <= 0 || timerRemaining(state, now) > 0) return { state, completed: false };
  return {
    state: { ...state, startedAt: null, accumulatedMs: state.durationMs, paused: true, finishedAt: now },
    completed: true
  };
}
